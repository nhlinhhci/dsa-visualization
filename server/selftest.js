// Tự kiểm tra server chạy code: chạy mọi code đáp án ở mọi ngôn ngữ có trên máy và,
// nếu sandbox đang bật, kiểm tra code sinh viên không ra được mạng và không có quyền root.
// Cách dùng: `npm run selftest` (thoát với mã 1 nếu có lỗi).
import { algorithms } from '../src/algorithms/index.js'
import { codeTemplates } from '../src/data/codeTemplates.js'
import { buildSllProject, getSllAnswer } from '../src/data/projects/singlyLinkedList.js'
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
    // Singly Linked List: file SLL đáp án của project (Python: cả main.py).
    const code =
      algorithm.category === 'dataStructure'
        ? buildSllProject({
            language,
            sllText: getSllAnswer(language).text,
            operationId: algorithm.id,
            input: { array, target: 0, position: 0 },
          }).runCode
        : codeTemplates[algorithm.id][language].join('\n')
    const targets = {
      search: [43, 5],
      // Danh sách liên kết: một giá trị có trong danh sách (để xóa) và một giá trị mới (để chèn).
      dataStructure: algorithm.targetLabel ? [27, 5] : [undefined],
    }[algorithm.category] ?? [undefined]
    // Vị trí: một vị trí ở giữa và một vị trí vượt quá độ dài danh sách.
    const positions = algorithm.positionLabel ? [2, 20] : [undefined]
    for (const [target, position] of targets.flatMap((t) => positions.map((p) => [t, p]))) {
      const started = Date.now()
      const run = await runCode({ algorithm: algorithm.id, language, code, array, target, position })
      const expected = {
        sort: () => JSON.stringify([...array].sort((a, b) => a - b)),
        search: () => array.indexOf(target),
        dataStructure: () => JSON.stringify(algorithm.expected(array, target, position)),
      }[algorithm.category]()
      // Traversal: các số in ra phải đúng thứ tự các node.
      const printed = JSON.stringify((run.output.match(/-?\d+/g) ?? []).map(Number))
      const actual =
        algorithm.category === 'search'
          ? run.result
          : algorithm.id === 'traverse'
            ? printed
            : JSON.stringify(run.finalArray)
      // Danh sách liên kết: step phải kèm các node (heap).
      const hasHeap = algorithm.category !== 'dataStructure' || run.steps.some((step) => step.heap?.length)
      report(
        // Mỗi step phải kèm biến cục bộ (C++ cần gdb trên máy).
        !run.error && actual === expected && run.steps.length > 0 && run.steps.some((step) => step.vars) && hasHeap,
        `${algorithm.id}/${language}${target === undefined ? '' : ` target=${target}`}${
          position === undefined ? '' : ` pos=${position}`
        }`,
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
      }).then((run) =>
        JSON.stringify(run.finalArray) === JSON.stringify([...array].sort((a, b) => a - b))
          ? null
          : `${language}+${offset} ${JSON.stringify(run.error ?? run.finalArray)}`,
      )
    }),
  ),
)
const parallelFailures = parallel.filter(Boolean)
report(
  parallelFailures.length === 0,
  'parallel runs',
  `${parallel.length - parallelFailures.length}/${parallel.length}${parallelFailures.map((failure) => `
     ${failure}`).join('')}`,
)

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
