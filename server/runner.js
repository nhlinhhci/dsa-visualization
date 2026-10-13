import { spawn } from 'node:child_process'
import { chown, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { algorithmSpecs } from '../src/data/algorithmSpecs.js'

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
  javac: () => findTool('javac', ['javac'], ['-version']),
  java: () => findTool('java', ['java'], ['-XshowSettings:properties', '-version']),
}

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

async function runPython({ dir, code, array, target, spec, tracePath, sandbox }) {
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
      JSON.stringify({ array, target, kind: spec.kind, entry: [spec.entry.python, spec.entry.cpp] }),
    ],
    { cwd: dir, timeout: RUN_TIMEOUT, sandbox: sandbox && { ...sandbox, memory: SANDBOX_MEMORY } },
  )
}

// Lấy lỗi đầu tiên của trình biên dịch: `file:line[:col]: error: message`.
function parseCompileError(stderr, solutionFile, entryName) {
  const match = stderr.match(/^(.*?):(\d+):(?:\d+:)?\s*(?:fatal )?error:\s*(.*)$/m)
  if (!match) return new RunError('compile', stderr.trim().slice(0, 1000) || 'Lỗi biên dịch')
  const [, file, line, message] = match
  if (path.basename(file) === solutionFile) {
    return new RunError('compile', message.trim(), Number(line) - 1)
  }
  // Lỗi nằm ở phần code gọi hàm của sinh viên: thường do thiếu hàm hoặc sai chữ ký.
  if (stderr.includes(entryName)) return new RunError('signature', '')
  return new RunError('compile', message.trim())
}

// Lời gọi hàm của sinh viên theo `kind`, viết bằng cú pháp chung của C++ và Java.
function entryCall(spec, name, arr, n, target) {
  if (spec.kind === 'sortRange') return `${name}(${arr}, 0, ${n} - 1)`
  if (spec.kind === 'search') return `${name}(${arr}, ${target})`
  return `${name}(${arr})`
}

async function runCpp({ dir, code, array, target, spec, tracePath, sandbox }) {
  const compiler = await TOOLS.cpp()
  if (!compiler) throw new RunError('setup', MISSING_TOOL.cpp)
  const main = await readFile(path.join(HARNESS_DIR, 'cpp_main.cpp'), 'utf8')
  // #line giữ cho số dòng trong thông báo lỗi và trong trace khớp với code sinh viên.
  const call = entryCall(spec, spec.entry.cpp, 'arr', 'n', 'target')
  const callMacro = `#define DSA_CALL(arr, n, target) (${spec.kind === 'search' ? call : `${call}, 0`})`
  const source = `#include "cpp_runtime.h"\n#line 1 "solution.cpp"\n${code}\n#line 1 "cpp_main.cpp"\n${callMacro}\n${main}`
  await writeFile(path.join(dir, 'harness.cpp'), source)
  const exe = path.join(dir, IS_WINDOWS ? 'solution.exe' : 'solution')
  const compiled = await exec(
    compiler.command,
    [
      '-std=c++17',
      '-O0',
      '-w',
      '-fmax-errors=5',
      // MinGW: link tĩnh để file .exe không phụ thuộc DLL của libstdc++ trên PATH.
      ...(IS_WINDOWS ? ['-static'] : []),
      '-I',
      HARNESS_DIR,
      '-o',
      exe,
      'harness.cpp',
    ],
    { cwd: dir, timeout: COMPILE_TIMEOUT, sandbox },
  )
  if (compiled.timedOut) throw new RunError('timeout', 'Biên dịch quá lâu.')
  if (compiled.code !== 0) {
    throw parseCompileError(compiled.stderr, 'solution.cpp', spec.entry.cpp)
  }
  return exec(exe, [tracePath, String(MAX_STEPS), String(target), ...array.map(String)], {
    cwd: dir,
    timeout: RUN_TIMEOUT,
    sandbox: sandbox && { ...sandbox, memory: SANDBOX_MEMORY },
  })
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

async function runJava({ dir, code, array, target, spec, tracePath, sandbox }) {
  const [javac, java] = await Promise.all([TOOLS.javac(), TOOLS.java()])
  if (!javac || !java) throw new RunError('setup', MISSING_TOOL.java)
  const jdi = await getJdi()
  const tracerDir = await buildTracer(javac, jdi)

  // Phần bọc class nằm cùng dòng đầu tiên để số dòng không bị lệch.
  await writeFile(path.join(dir, 'Solution.java'), `import java.util.*; class Solution { ${code}\n}\n`)
  const call = entryCall(spec, `new Solution().${spec.entry.java}`, 'data', 'data.length', 'target')
  const main = await readFile(path.join(HARNESS_DIR, 'Main.java'), 'utf8')
  await writeFile(path.join(dir, 'Main.java'), main.replace('/*DSA_CALL*/', `${call};`))
  const compiled = await exec(
    javac.command,
    ['-g', '-nowarn', '-encoding', 'UTF-8', '-d', dir, 'Solution.java', 'Main.java'],
    { cwd: dir, timeout: COMPILE_TIMEOUT, sandbox },
  )
  if (compiled.timedOut) throw new RunError('timeout', 'Biên dịch quá lâu.')
  if (compiled.code !== 0) {
    throw parseCompileError(compiled.stderr, 'Solution.java', spec.entry.java)
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
      spec.entry.java,
      String(target),
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
    })
    previous = record.array
  }
  return steps
}

const TRACE_ERRORS = {
  limit: () =>
    `Chương trình chạy quá ${MAX_STEPS} bước. Kiểm tra lại điều kiện dừng của vòng lặp.`,
  signature: (language, spec) =>
    `Không tìm thấy hàm cần viết. Hãy khai báo: ${spec.signatures[language]}`,
}

const RUNNERS = { python: runPython, cpp: runCpp, java: runJava }

// `slot` là số thứ tự lượt chạy đồng thời (0..MAX_CONCURRENT_RUNS-1), quyết định uid của sandbox.
async function runInTempDir({ language, code, array, target, spec, slot }) {
  const dir = await mkdtemp(path.join(tmpdir(), 'dsa-run-'))
  const tracePath = path.join(dir, 'trace.ndjson')
  const sandbox = SANDBOX ? { uid: SANDBOX_UID_BASE + slot } : null
  try {
    // mkdtemp tạo thư mục quyền 700: chỉ uid của lượt chạy này đọc/ghi được.
    if (sandbox) await chown(dir, sandbox.uid, sandbox.uid)
    let result
    let error = null
    try {
      result = await RUNNERS[language]({ dir, code, array, target, spec, tracePath, sandbox })
    } catch (e) {
      if (!(e instanceof RunError)) throw e
      error = e
    }

    const records = await readTrace(tracePath)
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
    } else if (!error && !done) {
      error = new RunError(
        'runtime',
        `Chương trình dừng bất thường (mã thoát ${result.code}).\n${result.stderr.trim()}`.trim(),
        steps.at(-1)?.lineHighlighted ?? null,
      )
    } else if (error?.type === 'signature') {
      error = new RunError('signature', TRACE_ERRORS.signature(language, spec))
    }

    return {
      steps,
      finalArray: done?.final ?? null,
      // Giá trị hàm trả về (index với thuật toán tìm kiếm), null nếu không phải số nguyên.
      result: done?.result ?? null,
      output: (result?.stdout ?? '').slice(0, MAX_OUTPUT_LENGTH),
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

function validate({ algorithm, language, code, array, target }) {
  if (!Object.hasOwn(algorithmSpecs, algorithm)) return 'Thuật toán không được hỗ trợ.'
  if (!LANGUAGES.includes(language)) return 'Ngôn ngữ không được hỗ trợ.'
  if (typeof code !== 'string' || !code.trim()) return 'Chưa có code để chạy.'
  if (code.length > MAX_CODE_LENGTH) return `Code dài quá ${MAX_CODE_LENGTH} ký tự.`
  const validArray =
    Array.isArray(array) &&
    array.length <= MAX_ARRAY_LENGTH &&
    array.every((value) => Number.isInteger(value) && Math.abs(value) <= 1e6)
  if (!validArray) return 'Mảng đầu vào không hợp lệ.'
  const needsTarget = algorithmSpecs[algorithm].kind === 'search'
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
