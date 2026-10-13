// Tự kiểm tra server chạy code: chạy mọi code đáp án ở mọi ngôn ngữ có trên máy và,
// nếu sandbox đang bật, kiểm tra code sinh viên không ra được mạng và không có quyền root.
// Cách dùng: `npm run selftest` (thoát với mã 1 nếu có lỗi).
import { algorithms } from '../src/algorithms/index.js'
import { codeTemplates } from '../src/data/codeTemplates.js'
import { LANGUAGES, runCode, warmUp } from './runner.js'

const UNSORTED = [38, 27, 43, 3, 9, 82, 10, 27]
const SORTED = [3, 9, 10, 27, 38, 43, 82, 90]

let failures = 0
function report(ok, name, detail = '') {
  if (!ok) failures++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` ${detail}` : ''}`)
}

const status = await warmUp()
console.log('Code runner:', JSON.stringify(status))

for (const language of LANGUAGES) {
  if (!status.languages[language]) {
    report(false, language, 'chưa cài trên máy này')
    continue
  }
  for (const algorithm of algorithms) {
    const array = algorithm.requiresSortedInput ? SORTED : UNSORTED
    const code = codeTemplates[algorithm.id][language].join('\n')
    for (const target of algorithm.category === 'search' ? [43, 5] : [undefined]) {
      const started = Date.now()
      const run = await runCode({ algorithm: algorithm.id, language, code, array, target })
      const expected =
        algorithm.category === 'sort'
          ? JSON.stringify([...array].sort((a, b) => a - b))
          : array.indexOf(target)
      const actual = algorithm.category === 'sort' ? JSON.stringify(run.finalArray) : run.result
      report(
        !run.error && actual === expected && run.steps.length > 0,
        `${algorithm.id}/${language}${target === undefined ? '' : ` target=${target}`}`,
        `${Date.now() - started}ms steps=${run.steps.length}${run.error ? ` ${JSON.stringify(run.error)}` : ''}`,
      )
    }
  }
}

// Nhiều lượt chạy cùng lúc phải ra kết quả độc lập và đúng.
const parallel = await Promise.all(
  LANGUAGES.filter((language) => status.languages[language]).flatMap((language) =>
    [0, 1, 2].map((offset) => {
      const array = UNSORTED.map((value) => value + offset)
      return runCode({
        algorithm: 'quickSort',
        language,
        code: codeTemplates.quickSort[language].join('\n'),
        array,
      }).then((run) => JSON.stringify(run.finalArray) === JSON.stringify([...array].sort((a, b) => a - b)))
    }),
  ),
)
report(parallel.every(Boolean), 'parallel runs', `${parallel.filter(Boolean).length}/${parallel.length}`)

if (status.sandbox && status.languages.python) {
  const probe = (body) =>
    runCode({
      algorithm: 'bubbleSort',
      language: 'python',
      code: `def bubble_sort(arr):\n${body}`,
      array: [2, 1],
    })

  const uid = await probe('    import os\n    print(os.getuid())')
  report(/^\d+$/.test(uid.output.trim()) && uid.output.trim() !== '0', 'sandbox: không chạy bằng root', `uid=${uid.output.trim()}`)

  const network = await probe(
    '    import socket\n    socket.create_connection(("1.1.1.1", 53), timeout=3)\n    print("connected")',
  )
  report(!network.output.includes('connected') && network.error?.type === 'runtime', 'sandbox: không có mạng', network.error?.message ?? '')

  const write = await probe('    open("/etc/dsa-selftest", "w").write("x")\n    print("written")')
  report(!write.output.includes('written') && write.error?.type === 'runtime', 'sandbox: không ghi được file hệ thống', write.error?.message ?? '')

  const fork = await probe('    import os\n    while True:\n        os.fork()')
  report(Boolean(fork.error), 'sandbox: chặn fork bomb', fork.error?.type ?? '')

  const after = await probe('    arr.sort()')
  report(!after.error && JSON.stringify(after.finalArray) === '[1,2]', 'sandbox: vẫn chạy được sau fork bomb')
} else {
  console.log('(Bỏ qua kiểm tra sandbox: sandbox đang tắt hoặc thiếu Python.)')
}

console.log(failures === 0 ? '\nTất cả đều đạt.' : `\n${failures} mục lỗi.`)
process.exit(failures === 0 ? 0 : 1)
