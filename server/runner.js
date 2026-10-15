import { spawn } from 'node:child_process'
import { chown, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { algorithmSpecs } from '../src/data/algorithmSpecs.js'
import { SLL_PROVIDED_FILES } from '../src/data/projects/singlyLinkedList.js'

const HARNESS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'harness')
const CACHE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '.cache')
const IS_WINDOWS = process.platform === 'win32'

const MAX_STEPS = 3000
const MAX_CODE_LENGTH = 20000
const MAX_ARRAY_LENGTH = 50
const MAX_OUTPUT_LENGTH = 8000
const COMPILE_TIMEOUT = 30000
const RUN_TIMEOUT = 10000
const MAX_CONCURRENT_RUNS = Number(process.env.MAX_CONCURRENT_RUNS) || 2
// Số request được xếp hàng chờ; quá số này thì báo server bận thay vì chờ vô hạn.
const MAX_WAITING_RUNS = 200

// Sandbox (chỉ Linux, server phải chạy bằng root): mỗi lượt chạy dùng một uid riêng không có quyền,
// không có mạng và bị giới hạn tài nguyên. Bật bằng DSA_SANDBOX=1 (Dockerfile đã bật sẵn).
const SANDBOX = process.env.DSA_SANDBOX === '1' && !IS_WINDOWS
const SANDBOX_UID_BASE = 20000
const SANDBOX_LIMITS = ['--nproc=256', '--fsize=33554432', '--cpu=30']
// Giới hạn bộ nhớ ảo; không áp cho JVM vì JVM luôn đặt trước vài GB địa chỉ ảo.
const SANDBOX_MEMORY = 1024 * 1024 * 1024
// Trong network namespace mới chỉ có loopback (JDI cần nó để nối Tracer với chương trình),
// sau đó bỏ quyền root trước khi chạy lệnh thật. $0 là uid, "$@" là lệnh.
const SANDBOX_SCRIPT =
  'ip link set lo up && exec setpriv --reuid="$0" --regid="$0" --clear-groups --no-new-privs -- "$@"'

export const LANGUAGES = ['python', 'cpp', 'java']

class RunError extends Error {
  constructor(type, message, line = null) {
    super(message)
    this.type = type
    this.line = line
  }
}

function killTree(child) {
  if (IS_WINDOWS) {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
  } else {
    child.kill('SIGKILL')
  }
}

// Chạy một lệnh, gom stdout/stderr (có giới hạn) và kill cả cây tiến trình khi quá thời gian.
// `sandbox` là { uid, memory? }: nếu có, lệnh chạy bằng uid đó, không mạng, có giới hạn tài nguyên.
function exec(command, args, { cwd, timeout, sandbox = null }) {
  return new Promise((resolve, reject) => {
    let env = { ...process.env, PYTHONIOENCODING: 'utf-8' }
    if (sandbox) {
      const limits = [...SANDBOX_LIMITS, ...(sandbox.memory ? [`--as=${sandbox.memory}`] : [])]
      args = [...limits, 'unshare', '--net', 'sh', '-c', SANDBOX_SCRIPT, String(sandbox.uid), command, ...args]
      command = 'prlimit'
      // Không truyền biến môi trường của server (có thể chứa secret) cho code sinh viên.
      env = { PATH: process.env.PATH, HOME: cwd, TMPDIR: cwd, LANG: 'C.UTF-8', PYTHONIOENCODING: 'utf-8' }
    }
    const child = spawn(command, args, { cwd, windowsHide: true, env })
    let stdout = ''
    let stderr = ''
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      killTree(child)
    }, timeout)
    child.stdout.on('data', (chunk) => {
      if (stdout.length < MAX_OUTPUT_LENGTH) stdout += chunk
    })
    child.stderr.on('data', (chunk) => {
      if (stderr.length < MAX_OUTPUT_LENGTH * 4) stderr += chunk
    })
    child.on('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code, stdout, stderr, timedOut })
    })
  })
}

// Tìm lệnh đầu tiên trong danh sách chạy được trên máy này; kết quả được nhớ lại.
const toolCache = new Map()
function findTool(name, candidates, versionArgs) {
  if (!toolCache.has(name)) {
    toolCache.set(
      name,
      (async () => {
        for (const command of candidates) {
          try {
            const result = await exec(command, versionArgs, { timeout: 10000 })
            if (result.code === 0) return { command, info: result.stdout + result.stderr }
          } catch {
            // Thử lệnh tiếp theo.
          }
        }
        return null
      })(),
    )
  }
  return toolCache.get(name)
}

const TOOLS = {
  python: () =>
    findTool('python', IS_WINDOWS ? ['python', 'py'] : ['python3', 'python'], ['--version']),
  cpp: () => findTool('cpp', ['g++', 'clang++'], ['--version']),
  // Không bắt buộc: có gdb thì C++ hiện được biến cục bộ ở từng step.
  gdb: () => findTool('gdb', ['gdb'], ['-nx', '-batch', '-ex', 'python import gdb']),
  javac: () => findTool('javac', ['javac'], ['-version']),
  java: () => findTool('java', ['java'], ['-XshowSettings:properties', '-version']),
}

// gdb tạo một worker thread cho mỗi CPU, mỗi thread giữ một malloc arena 64MB địa chỉ ảo: trên máy
// nhiều core (vd. 32) là vượt giới hạn --as của sandbox và gdb chết vì "virtual memory exhausted".
// -iex chạy trước khi gdb nạp file chương trình (lúc các thread được tạo).
const GDB_ARGS = ['-nx', '-q', '-batch', '-iex', 'maint set worker-threads 0']

const MISSING_TOOL = {
  python: 'Server chưa cài Python 3 (không tìm thấy lệnh `python`).',
  cpp: 'Server chưa cài trình biên dịch C++ (không tìm thấy lệnh `g++` hoặc `clang++`).',
  java: 'Server chưa cài JDK (không tìm thấy lệnh `javac` và `java`).',
}

export async function getAvailableLanguages() {
  const [python, cpp, javac, java] = await Promise.all([
    TOOLS.python(),
    TOOLS.cpp(),
    TOOLS.javac(),
    TOOLS.java(),
  ])
  return { python: !!python, cpp: !!cpp, java: !!javac && !!java }
}

async function readTrace(tracePath) {
  let text = ''
  try {
    text = await readFile(tracePath, 'utf8')
  } catch {
    // Chương trình dừng trước khi ghi được trace.
  }
  const records = []
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    try {
      records.push(JSON.parse(line))
    } catch {
      // Dòng bị cắt dở do tiến trình bị kill.
    }
  }
  return records
}

async function runPython({ dir, code, array, target, position, spec, tracePath, sandbox }) {
  const python = await TOOLS.python()
  if (!python) throw new RunError('setup', MISSING_TOOL.python)
  const codePath = path.join(dir, 'solution.py')
  await writeFile(codePath, code)
  return exec(
    python.command,
    [
      '-X',
      'utf8',
      path.join(HARNESS_DIR, 'python_tracer.py'),
      codePath,
      tracePath,
      String(MAX_STEPS),
      // Chấp nhận cả tên kiểu snake_case lẫn camelCase.
      JSON.stringify({
        array,
        target,
        kind: spec.kind,
        entry: [spec.entry.python, spec.entry.cpp],
        // Phương thức SLL: giá trị tham số theo thứ tự khai báo (vị trí / giá trị).
        args: methodArgs(spec, { target, position }),
      }),
    ],
    { cwd: dir, timeout: RUN_TIMEOUT, sandbox: sandbox && { ...sandbox, memory: SANDBOX_MEMORY } },
  )
}

// Lấy lỗi đầu tiên của trình biên dịch: `file:line[:col]: error: message`.
function parseCompileError(stderr, solutionFile, entryName) {
  const match = stderr.match(/^(.*?):(\d+):(?:\d+:)?\s*(?:fatal )?error:\s*(.*)$/m)
  if (!match) {
    // Lỗi khi link (vd. xóa mất định nghĩa SLL::insertAtHead): không có số dòng.
    if (/undefined reference/.test(stderr) && stderr.includes(entryName)) {
      return new RunError('signature', '')
    }
    return new RunError('compile', stderr.trim().slice(0, 1000) || 'Lỗi biên dịch')
  }
  const [, file, line, message] = match
  if (path.basename(file) === solutionFile) {
    return new RunError('compile', message.trim(), Number(line) - 1)
  }
  // Lỗi nằm ở phần code gọi hàm của sinh viên: thường do thiếu hàm hoặc sai chữ ký.
  if (stderr.includes(entryName)) return new RunError('signature', '')
  return new RunError('compile', message.trim())
}

// Giá trị tham số của phương thức SLL theo thứ tự khai báo: `pos` là vị trí, `val` là giá trị.
function methodArgs(spec, { target, position }) {
  return (spec.params ?? []).map((name) => (name === 'pos' ? position : target))
}

// Lời gọi phương thức SLL trong main do server sinh ra (biến `list`, `position`, `target` có sẵn).
function sllCall(spec, name) {
  const args = spec.params.map((param) => (param === 'pos' ? 'position' : 'target')).join(', ')
  return `list.${name}(${args});`
}

// Lời gọi hàm của sinh viên theo `kind`, viết bằng cú pháp chung của C++ và Java.
function entryCall(spec, name, arr, n, target) {
  if (spec.kind === 'sortRange') return `${name}(${arr}, 0, ${n} - 1)`
  if (spec.kind === 'search') return `${name}(${arr}, ${target})`
  return `${name}(${arr})`
}

// Biên dịch C++: `sources` là các file .cpp trong `dir`; lỗi ở `solutionFile` báo kèm số dòng.
async function compileCpp({ compiler, debuggerTool, dir, sources, exe, sandbox, solutionFile, entryName }) {
  const compiled = await exec(
    compiler.command,
    [
      '-std=c++17',
      '-O0',
      '-w',
      '-fmax-errors=5',
      ...(debuggerTool ? ['-g'] : []),
      // MinGW: link tĩnh để file .exe không phụ thuộc DLL của libstdc++ trên PATH.
      ...(IS_WINDOWS ? ['-static'] : []),
      '-I',
      HARNESS_DIR,
      '-o',
      exe,
      ...sources,
    ],
    { cwd: dir, timeout: COMPILE_TIMEOUT, sandbox },
  )
  if (compiled.timedOut) throw new RunError('timeout', 'Biên dịch quá lâu.')
  if (compiled.code !== 0) throw parseCompileError(compiled.stderr, solutionFile, entryName)
}

// Project Singly Linked List: SLL.cpp của sinh viên + Node.h, Node.cpp, SLL.h cố định + main của server.
// gdb tự đi từng dòng trong SLL.cpp (không có truy cập mảng cho runtime bắt).
async function runCppSll({ dir, code, array, target, position, spec, tracePath, sandbox, compiler, debuggerTool }) {
  await writeFile(path.join(dir, 'SLL.cpp'), code)
  for (const [name, content] of Object.entries(SLL_PROVIDED_FILES.cpp)) {
    await writeFile(path.join(dir, name), content)
  }
  const main = await readFile(path.join(HARNESS_DIR, 'cpp_sll_main.cpp'), 'utf8')
  await writeFile(path.join(dir, 'sll_main.cpp'), main.replace('/*DSA_CALL*/', sllCall(spec, spec.entry.cpp)))
  const exe = path.join(dir, IS_WINDOWS ? 'solution.exe' : 'solution')
  await compileCpp({
    compiler,
    debuggerTool,
    dir,
    sources: ['sll_main.cpp', 'SLL.cpp', 'Node.cpp'],
    exe,
    sandbox,
    solutionFile: 'SLL.cpp',
    entryName: spec.entry.cpp,
  })
  const programArgs = [
    tracePath,
    path.join(dir, 'output.txt'),
    String(target),
    String(position),
    ...array.map(String),
  ]
  if (!debuggerTool) {
    return exec(exe, programArgs, {
      cwd: dir,
      timeout: RUN_TIMEOUT,
      sandbox: sandbox && { ...sandbox, memory: SANDBOX_MEMORY },
    })
  }
  return exec(
    debuggerTool.command,
    [
      ...GDB_ARGS,
      '-ex',
      `python VARS_PATH=r'${tracePath}.vars'; MODE='lines'; ENTRY='SLL::${spec.entry.cpp}'; ` +
        `MAX_STEPS=${MAX_STEPS}; SOLUTION_FILE='SLL.cpp'`,
      '-x',
      path.join(HARNESS_DIR, 'cpp_vars.py'),
      '--args',
      exe,
      ...programArgs,
    ],
    { cwd: dir, timeout: RUN_TIMEOUT, sandbox: sandbox && { ...sandbox, memory: SANDBOX_MEMORY * 2 } },
  )
}

async function runCpp({ dir, code, array, target, position, spec, tracePath, sandbox }) {
  const compiler = await TOOLS.cpp()
  if (!compiler) throw new RunError('setup', MISSING_TOOL.cpp)
  const debuggerTool = await TOOLS.gdb()
  if (spec.kind === 'sllMethod') {
    return runCppSll({ dir, code, array, target, position, spec, tracePath, sandbox, compiler, debuggerTool })
  }
  const main = await readFile(path.join(HARNESS_DIR, 'cpp_main.cpp'), 'utf8')
  // #line giữ cho số dòng trong thông báo lỗi và trong trace khớp với code sinh viên.
  const call = entryCall(spec, spec.entry.cpp, 'arr', 'n', 'target')
  const callMacro = `#define DSA_CALL(arr, n, target) (${spec.kind === 'search' ? call : `${call}, 0`})`
  const source = `#include "cpp_runtime.h"\n#line 1 "solution.cpp"\n${code}\n#line 1 "cpp_main.cpp"\n${callMacro}\n${main}`
  await writeFile(path.join(dir, 'harness.cpp'), source)
  const exe = path.join(dir, IS_WINDOWS ? 'solution.exe' : 'solution')
  await compileCpp({
    compiler,
    debuggerTool,
    dir,
    sources: ['harness.cpp'],
    exe,
    sandbox,
    solutionFile: 'solution.cpp',
    entryName: spec.entry.cpp,
  })
  const outputPath = path.join(dir, 'output.txt')
  const programArgs = [tracePath, String(MAX_STEPS), outputPath, String(target), ...array.map(String)]
  if (!debuggerTool) {
    return exec(exe, programArgs, {
      cwd: dir,
      timeout: RUN_TIMEOUT,
      sandbox: sandbox && { ...sandbox, memory: SANDBOX_MEMORY },
    })
  }
  // Chạy dưới gdb để đọc biến cục bộ; cpp_vars.py ghi chúng vào <trace>.vars.
  return exec(
    debuggerTool.command,
    [
      ...GDB_ARGS,
      '-ex',
      `python VARS_PATH=r'${tracePath}.vars'`,
      '-x',
      path.join(HARNESS_DIR, 'cpp_vars.py'),
      '--args',
      exe,
      ...programArgs,
    ],
    { cwd: dir, timeout: RUN_TIMEOUT, sandbox: sandbox && { ...sandbox, memory: SANDBOX_MEMORY * 2 } },
  )
}

// JDK 8 để JDI trong tools.jar; từ JDK 9 là module jdk.jdi có sẵn.
async function getJdi() {
  const java = await TOOLS.java()
  const version = java.info.match(/java\.specification\.version = (\S+)/)?.[1] ?? ''
  const home = java.info.match(/java\.home = (.*)/)?.[1]?.trim() ?? ''
  if (version !== '1.8') return { version, classpath: [] }
  return { version, classpath: [path.join(home, '..', 'lib', 'tools.jar')] }
}

// Biên dịch Tracer một lần cho mỗi phiên bản JDK, biên dịch lại nếu mã nguồn mới hơn.
let tracerBuild = null
function buildTracer(javac, jdi) {
  tracerBuild ??= (async () => {
    const outDir = path.join(CACHE_DIR, `tracer-${jdi.version}`)
    const source = path.join(HARNESS_DIR, 'Tracer.java')
    const sourceTime = (await stat(source)).mtimeMs
    const classTime = await stat(path.join(outDir, 'Tracer.class')).then(
      (s) => s.mtimeMs,
      () => 0,
    )
    if (classTime < sourceTime) {
      await mkdir(outDir, { recursive: true })
      const args = ['-nowarn', '-encoding', 'UTF-8', '-d', outDir]
      if (jdi.classpath.length) args.push('-cp', jdi.classpath.join(path.delimiter))
      const result = await exec(javac.command, [...args, source], {
        timeout: COMPILE_TIMEOUT,
      })
      if (result.code !== 0) {
        throw new RunError('setup', `Không biên dịch được Tracer.java:\n${result.stderr.trim()}`)
      }
    }
    return outDir
  })().catch((error) => {
    tracerBuild = null
    throw error
  })
  return tracerBuild
}

async function runJava({ dir, code, array, target, position, spec, tracePath, sandbox }) {
  const [javac, java] = await Promise.all([TOOLS.javac(), TOOLS.java()])
  if (!javac || !java) throw new RunError('setup', MISSING_TOOL.java)
  const jdi = await getJdi()
  const tracerDir = await buildTracer(javac, jdi)

  // Project Singly Linked List: SLL.java là file của sinh viên, Node.java cố định, Main do server sinh.
  // Thuật toán trên mảng: code sinh viên được bọc trong class Solution (phần bọc nằm cùng dòng đầu
  // tiên để số dòng không bị lệch).
  const isSll = spec.kind === 'sllMethod'
  const solutionClass = isSll ? 'SLL' : 'Solution'
  const sources = isSll ? ['SLL.java', 'Node.java', 'Main.java'] : ['Solution.java', 'Main.java']
  if (isSll) {
    await writeFile(path.join(dir, 'SLL.java'), code)
    await writeFile(path.join(dir, 'Node.java'), SLL_PROVIDED_FILES.java['Node.java'])
    const main = await readFile(path.join(HARNESS_DIR, 'MainSll.java'), 'utf8')
    await writeFile(path.join(dir, 'Main.java'), main.replace('/*DSA_CALL*/', sllCall(spec, spec.entry.java)))
  } else {
    await writeFile(path.join(dir, 'Solution.java'), `import java.util.*; class Solution { ${code}\n}\n`)
    const call = entryCall(spec, `new Solution().${spec.entry.java}`, 'data', 'data.length', 'target')
    const main = await readFile(path.join(HARNESS_DIR, 'Main.java'), 'utf8')
    await writeFile(path.join(dir, 'Main.java'), main.replace('/*DSA_CALL*/', `${call};`))
  }
  const compiled = await exec(
    javac.command,
    ['-g', '-nowarn', '-encoding', 'UTF-8', '-d', dir, ...sources],
    { cwd: dir, timeout: COMPILE_TIMEOUT, sandbox },
  )
  if (compiled.timedOut) throw new RunError('timeout', 'Biên dịch quá lâu.')
  if (compiled.code !== 0) {
    throw parseCompileError(compiled.stderr, `${solutionClass}.java`, spec.entry.java)
  }

  const args = ['-Xmx128m', '-XX:+UseSerialGC', '-cp', [tracerDir, ...jdi.classpath].join(path.delimiter)]
  if (jdi.version !== '1.8') args.unshift('--add-modules', 'jdk.jdi')
  return exec(
    java.command,
    [
      ...args,
      'Tracer',
      dir,
      tracePath,
      String(MAX_STEPS),
      solutionClass,
      spec.entry.java,
      String(target),
      ...(isSll ? [String(position)] : []),
      ...array.map(String),
    ],
    { cwd: dir, timeout: RUN_TIMEOUT, sandbox },
  )
}

// Tính giá trị một biểu thức chỉ số đơn giản (`j`, `j + 1`, `n - i - 1`...) từ các biến cục bộ.
function evaluateIndex(expression, locals) {
  let unknown = false
  // `arr[i++]` đọc phần tử tại i (giá trị trước khi tăng).
  const substituted = expression.replace(/(\+\+|--)\s*$/, '').replace(/[A-Za-z_]\w*/g, (name) => {
    if (!Object.hasOwn(locals, name)) unknown = true
    return `(${locals[name]})`
  })
  if (unknown || !/^[\d\s+\-*/%()]+$/.test(substituted)) return null
  try {
    const value = Math.trunc(Function(`"use strict"; return (${substituted})`)())
    return Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

// JDI không cho biết phần tử nào được đọc, nên suy ra từ các biểu thức `arr[...]` trên dòng code.
function inferJavaReads(lineText, record, length) {
  const reads = []
  for (const alias of record.aliases) {
    const pattern = new RegExp(`\\b${alias}\\s*\\[([^\\[\\]]+)\\]`, 'g')
    for (const [, expression] of lineText.matchAll(pattern)) {
      const index = evaluateIndex(expression, record.locals)
      if (index !== null && index >= 0 && index < length && !reads.includes(index)) reads.push(index)
    }
  }
  return reads
}

function toSteps(records, language, code, initialArray) {
  const lines = code.split('\n')
  const steps = []
  let previous = initialArray
  for (const record of records) {
    if (record.t !== 'step') continue
    let { reads, writes } = record
    if (language === 'java') {
      reads = inferJavaReads(lines[record.line] ?? '', record, record.array.length)
      writes = record.array.flatMap((value, i) => (value !== previous[i] ? [i] : []))
    }
    steps.push({
      array: record.array,
      comparing: writes.length ? writes : reads,
      swapping: writes.length > 0,
      sorted: [],
      lineHighlighted: record.line,
      // Biến cục bộ sau khi dòng chạy xong và tên hàm đang chạy.
      ...(record.vars && { vars: record.vars, scope: record.scope }),
      // Danh sách liên kết: các node đi tới được từ biến cục bộ.
      ...(record.heap && { heap: record.heap }),
    })
    previous = record.array
  }
  return steps
}

// Id node do mỗi ngôn ngữ gửi về là địa chỉ / id nội bộ (số rất lớn, khác nhau mỗi lần chạy).
// Đổi thành n1, n2... theo thứ tự xuất hiện, để giống step của code đáp án.
function normalizeNodeIds(steps, resultNode) {
  const ids = new Map()
  const rename = (raw) => {
    if (raw === null || raw === undefined || String(raw) === '0') return null
    const key = String(raw)
    if (!ids.has(key)) ids.set(key, `n${ids.size + 1}`)
    return ids.get(key)
  }
  for (const step of steps) {
    if (step.heap) {
      step.heap = step.heap.map((node) => ({ ...node, id: rename(node.id), next: rename(node.next) }))
    }
    for (const [name, value] of Object.entries(step.vars ?? {})) {
      if (value && typeof value === 'object' && 'node' in value) {
        step.vars[name] = { ...value, node: rename(value.node) }
      }
    }
  }
  return rename(resultNode)
}

const TRACE_ERRORS = {
  limit: () =>
    `Chương trình chạy quá ${MAX_STEPS} bước. Kiểm tra lại điều kiện dừng của vòng lặp.`,
  signature: (language, spec) =>
    `Không tìm thấy hàm cần viết. Hãy khai báo: ${spec.signatures[language]}`,
}

const RUNNERS = { python: runPython, cpp: runCpp, java: runJava }

// `slot` là số thứ tự lượt chạy đồng thời (0..MAX_CONCURRENT_RUNS-1), quyết định uid của sandbox.
async function runInTempDir({ language, code, array, target, position, spec, slot }) {
  const dir = await mkdtemp(path.join(tmpdir(), 'dsa-run-'))
  const tracePath = path.join(dir, 'trace.ndjson')
  const sandbox = SANDBOX ? { uid: SANDBOX_UID_BASE + slot } : null
  try {
    // mkdtemp tạo thư mục quyền 700: chỉ uid của lượt chạy này đọc/ghi được.
    if (sandbox) await chown(dir, sandbox.uid, sandbox.uid)
    let result
    let error = null
    try {
      result = await RUNNERS[language]({ dir, code, array, target, position, spec, tracePath, sandbox })
    } catch (e) {
      if (!(e instanceof RunError)) throw e
      error = e
    }

    let records = await readTrace(tracePath)
    // C++: biến của từng step do gdb ghi riêng, theo đúng thứ tự step của runtime.
    const varRecords = language === 'cpp' ? await readTrace(`${tracePath}.vars`) : []
    const crash = varRecords.find((record) => record.t === 'signal')
    if (language === 'cpp' && spec.kind === 'sllMethod') {
      // Danh sách liên kết: step do gdb ghi (đi từng dòng); kết quả và lỗi vẫn lấy từ runtime.
      records = [
        ...varRecords.filter((record) => record.t === 'step' || record.t === 'error'),
        ...records.filter((record) => record.t !== 'step'),
      ]
    } else {
      const stepVars = varRecords.filter((record) => record.vars)
      records
        .filter((record) => record.t === 'step')
        .forEach((record, index) => Object.assign(record, stepVars[index]))
    }
    const steps = toSteps(records, language, code, array)
    const traceError = records.find((record) => record.t === 'error')
    const done = records.find((record) => record.t === 'done')

    if (!error && traceError) {
      const { kind, line, message } = traceError
      error = new RunError(
        kind,
        TRACE_ERRORS[kind]?.(language, spec) ?? message,
        Number.isInteger(line) && line >= 0 ? line : null,
      )
    } else if (!error && result.timedOut) {
      error = new RunError(
        'timeout',
        `Chương trình chạy quá ${RUN_TIMEOUT / 1000} giây. Có thể có vòng lặp vô hạn.`,
        steps.at(-1)?.lineHighlighted ?? null,
      )
    } else if (!error && !done && crash) {
      error = new RunError(
        'runtime',
        crash.signal === 'RECURSION'
          ? 'Đệ quy quá sâu: kiểm tra lại điều kiện dừng của hàm đệ quy.'
          : `Chương trình bị dừng bởi tín hiệu ${crash.signal} (thường do truy cập sai vùng nhớ hoặc đệ quy quá sâu).`,
        crash.line ?? steps.at(-1)?.lineHighlighted ?? null,
      )
    } else if (!error && !done) {
      error = new RunError(
        'runtime',
        `Chương trình dừng bất thường (mã thoát ${result.code}).\n${result.stderr.trim()}`.trim(),
        steps.at(-1)?.lineHighlighted ?? null,
      )
    } else if (error?.type === 'signature') {
      error = new RunError('signature', TRACE_ERRORS.signature(language, spec))
    }

    // C++ ghi output vào file riêng (stdout có thể lẫn thông báo của gdb).
    const fileOutput =
      language === 'cpp' ? await readFile(path.join(dir, 'output.txt'), 'utf8').catch(() => '') : null
    return {
      steps,
      finalArray: done?.final ?? null,
      // Giá trị hàm trả về (index với thuật toán tìm kiếm), null nếu không phải số nguyên.
      result: done?.result ?? null,
      // Danh sách liên kết: node đầu của danh sách hàm trả về (id đã chuẩn hóa), null nếu rỗng.
      resultNode: spec.kind === 'sllMethod' ? normalizeNodeIds(steps, done?.resultNode) : null,
      output: (fileOutput ?? result?.stdout ?? '').slice(0, MAX_OUTPUT_LENGTH),
      error: error && { type: error.type, line: error.line, message: error.message },
    }
  } finally {
    // Diệt mọi tiến trình còn sót của uid này (vd. chương trình tự fork) trước khi nhường slot.
    if (sandbox) {
      await exec('pkill', ['-KILL', '-u', String(sandbox.uid)], { timeout: 5000 }).catch(() => {})
    }
    rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

function validate({ algorithm, language, code, array, target, position }) {
  if (!Object.hasOwn(algorithmSpecs, algorithm)) return 'Thuật toán không được hỗ trợ.'
  if (!LANGUAGES.includes(language)) return 'Ngôn ngữ không được hỗ trợ.'
  if (typeof code !== 'string' || !code.trim()) return 'Chưa có code để chạy.'
  if (code.length > MAX_CODE_LENGTH) return `Code dài quá ${MAX_CODE_LENGTH} ký tự.`
  const validArray =
    Array.isArray(array) &&
    array.length <= MAX_ARRAY_LENGTH &&
    array.every((value) => Number.isInteger(value) && Math.abs(value) <= 1e6)
  if (!validArray) return 'Mảng đầu vào không hợp lệ.'
  const { kind, params = [] } = algorithmSpecs[algorithm]
  const needsPosition = params.includes('pos')
  if (needsPosition && !(Number.isInteger(position) && position >= 0 && position <= 1000)) {
    return 'Vị trí không hợp lệ.'
  }
  const needsTarget = kind === 'search' || params.includes('val')
  if (needsTarget && !(Number.isInteger(target) && Math.abs(target) <= 1e6)) {
    return 'Giá trị cần tìm không hợp lệ.'
  }
  return null
}

// Giới hạn số lượt chạy đồng thời để nhiều request không làm treo máy.
const freeSlots = Array.from({ length: MAX_CONCURRENT_RUNS }, (_, index) => index)
const waiting = []

function failure(type, message) {
  return { steps: [], finalArray: null, result: null, output: '', error: { type, line: null, message } }
}

export async function runCode(request) {
  const invalid = validate(request)
  if (invalid) {
    return failure('setup', invalid)
  }
  if (freeSlots.length === 0) {
    if (waiting.length >= MAX_WAITING_RUNS) {
      return failure('setup', 'Server đang quá tải, hãy thử lại sau ít giây.')
    }
    await new Promise((resolve) => waiting.push(resolve))
  }
  const slot = freeSlots.pop()
  try {
    return await runInTempDir({
      language: request.language,
      code: request.code.replace(/\r\n/g, '\n'),
      array: request.array,
      target: Number.isInteger(request.target) ? request.target : 0,
      position: Number.isInteger(request.position) ? request.position : 0,
      spec: algorithmSpecs[request.algorithm],
      slot,
    })
  } finally {
    freeSlots.push(slot)
    waiting.shift()?.()
  }
}

// Gọi khi server khởi động: dò sẵn trình biên dịch và biên dịch Tracer để lượt Run đầu tiên không bị chậm.
export async function warmUp() {
  const languages = await getAvailableLanguages()
  if (languages.java) await buildTracer(await TOOLS.javac(), await getJdi()).catch(() => {})
  return { languages, sandbox: SANDBOX, maxConcurrentRuns: MAX_CONCURRENT_RUNS }
}
