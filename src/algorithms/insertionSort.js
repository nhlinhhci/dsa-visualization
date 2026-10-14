import { codeLines } from '../data/codeTemplates.js'
import { createStepRecorder, nameFor } from './stepRecorder.js'

export const insertionSortComplexity = {
  time: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
  space: 'O(1)',
}

export function generateInsertionSortSteps(initialArray, { language = 'python' } = {}) {
  const LINE = codeLines.insertionSort[language]
  const arr = [...initialArray]
  const { push, enter, finishSorted } = createStepRecorder(arr)
  const v = { i: undefined, key: undefined, j: undefined }
  enter(nameFor(language, 'insertion_sort', 'insertionSort'), v)

  push(LINE.FUNCTION)

  for (let i = 1; i < arr.length; i++) {
    v.i = i
    push(LINE.OUTER_LOOP)
    const key = arr[i]
    v.key = key
    push(LINE.SET_KEY, [i])
    let j = i - 1
    v.j = j
    push(LINE.SET_J)

    while (true) {
      push(LINE.WHILE, j >= 0 ? [j] : [])
      if (!(j >= 0 && arr[j] > key)) break
      arr[j + 1] = arr[j]
      push(LINE.SHIFT, [j + 1], true)
      j--
      v.j = j
      push(LINE.DECREMENT)
    }

    arr[j + 1] = key
    push(LINE.INSERT, [j + 1], true)
  }

  return finishSorted()
}
