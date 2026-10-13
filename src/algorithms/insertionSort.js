import { codeLines } from '../data/codeTemplates.js'
import { createStepRecorder } from './stepRecorder.js'

export const insertionSortComplexity = {
  time: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
  space: 'O(1)',
}

export function generateInsertionSortSteps(initialArray, { language = 'python' } = {}) {
  const LINE = codeLines.insertionSort[language]
  const arr = [...initialArray]
  const { push, finishSorted } = createStepRecorder(arr)

  push(LINE.FUNCTION)

  for (let i = 1; i < arr.length; i++) {
    push(LINE.OUTER_LOOP)
    const key = arr[i]
    push(LINE.SET_KEY, [i])
    let j = i - 1
    push(LINE.SET_J)

    while (true) {
      push(LINE.WHILE, j >= 0 ? [j] : [])
      if (!(j >= 0 && arr[j] > key)) break
      arr[j + 1] = arr[j]
      push(LINE.SHIFT, [j + 1], true)
      j--
      push(LINE.DECREMENT)
    }

    arr[j + 1] = key
    push(LINE.INSERT, [j + 1], true)
  }

  return finishSorted()
}
