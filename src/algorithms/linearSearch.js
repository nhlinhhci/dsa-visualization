import { codeLines } from '../data/codeTemplates.js'
import { createStepRecorder, nameFor } from './stepRecorder.js'

export const linearSearchComplexity = {
  time: { best: 'O(1)', average: 'O(n)', worst: 'O(n)' },
  space: 'O(1)',
}

// Step tìm kiếm có thêm `found` (index tìm thấy hoặc null) và, ở bước cuối, `result` (index hoặc -1).
export function generateLinearSearchSteps(initialArray, { language = 'python', target } = {}) {
  const LINE = codeLines.linearSearch[language]
  const arr = [...initialArray]
  const { steps, push, enter } = createStepRecorder(arr)
  const v = { target, i: undefined }
  enter(nameFor(language, 'linear_search', 'linearSearch'), v)

  push(LINE.FUNCTION)

  for (let i = 0; i < arr.length; i++) {
    v.i = i
    push(LINE.LOOP)
    push(LINE.COMPARE, [i])
    if (arr[i] === target) {
      push(LINE.FOUND, [], false, { found: i })
      push(null, [], false, { found: i, result: i })
      return steps
    }
  }

  push(LINE.NOT_FOUND)
  push(null, [], false, { result: -1 })
  return steps
}
