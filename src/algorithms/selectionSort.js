import { codeLines } from '../data/codeTemplates.js'
import { createStepRecorder } from './stepRecorder.js'

export const selectionSortComplexity = {
  time: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)' },
  space: 'O(1)',
}

export function generateSelectionSortSteps(initialArray, { language = 'python' } = {}) {
  const LINE = codeLines.selectionSort[language]
  const arr = [...initialArray]
  const n = arr.length
  const { sorted, push, finishSorted } = createStepRecorder(arr)

  push(LINE.FUNCTION)
  push(LINE.GET_LENGTH)

  for (let i = 0; i < n - 1; i++) {
    push(LINE.OUTER_LOOP)
    let minIdx = i
    push(LINE.SET_MIN, [i])

    for (let j = i + 1; j < n; j++) {
      push(LINE.INNER_LOOP)
      push(LINE.COMPARE, [j, minIdx])
      if (arr[j] < arr[minIdx]) {
        minIdx = j
        push(LINE.UPDATE_MIN, [minIdx])
      }
    }

    ;[arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]
    push(LINE.SWAP, [i, minIdx], true)
    // Sau mỗi lượt, phần tử nhỏ nhất còn lại đã về đúng vị trí i.
    sorted.push(i)
  }

  return finishSorted()
}
