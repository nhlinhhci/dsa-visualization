import { codeLines } from '../data/codeTemplates.js'
import { createStepRecorder, nameFor } from './stepRecorder.js'

export const binarySearchComplexity = {
  time: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)' },
  space: 'O(1)',
}

// Yêu cầu mảng đã sắp xếp tăng dần. Mỗi step có `range: [low, high]` là đoạn còn đang xét,
// `found` (index tìm thấy hoặc null) và, ở bước cuối, `result` (index hoặc -1).
export function generateBinarySearchSteps(initialArray, { language = 'python', target } = {}) {
  const LINE = codeLines.binarySearch[language]
  const arr = [...initialArray]
  const { steps, push, enter } = createStepRecorder(arr)
  const v = { target, low: undefined, high: undefined, mid: undefined }
  enter(nameFor(language, 'binary_search', 'binarySearch'), v)

  let low = 0
  let high = arr.length - 1
  const pushRange = (line, comparing = [], extra = {}) => {
    Object.assign(v, { low, high })
    push(line, comparing, false, { range: [low, high], ...extra })
  }

  push(LINE.FUNCTION, [], false, { range: [low, high] })
  pushRange(LINE.INIT)

  while (true) {
    pushRange(LINE.WHILE)
    if (low > high) break
    const mid = Math.floor((low + high) / 2)
    v.mid = mid
    pushRange(LINE.MID, [mid])
    pushRange(LINE.CHECK_EQUAL, [mid])
    if (arr[mid] === target) {
      pushRange(LINE.FOUND, [], { found: mid })
      pushRange(null, [], { found: mid, result: mid })
      return steps
    }
    pushRange(LINE.CHECK_LESS, [mid])
    if (arr[mid] < target) {
      low = mid + 1
      pushRange(LINE.GO_RIGHT)
    } else {
      high = mid - 1
      pushRange(LINE.GO_LEFT)
    }
  }

  pushRange(LINE.NOT_FOUND)
  pushRange(null, [], { result: -1 })
  return steps
}
