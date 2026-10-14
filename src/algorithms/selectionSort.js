import { codeLines } from '../data/codeTemplates.js'
import { createStepRecorder, nameFor } from './stepRecorder.js'

export const selectionSortComplexity = {
  time: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)' },
  space: 'O(1)',
}

export function generateSelectionSortSteps(initialArray, { language = 'python' } = {}) {
  const LINE = codeLines.selectionSort[language]
  const arr = [...initialArray]
  const n = arr.length
  const { sorted, push, enter, finishSorted } = createStepRecorder(arr)
  const MIN = nameFor(language, 'min_idx', 'minIdx')
  const v = { n: undefined, i: undefined, [MIN]: undefined, j: undefined }
  enter(nameFor(language, 'selection_sort', 'selectionSort'), v)

  push(LINE.FUNCTION)
  v.n = n
  push(LINE.GET_LENGTH)

  for (let i = 0; i < n - 1; i++) {
    v.i = i
    v.j = undefined
    push(LINE.OUTER_LOOP)
    let minIdx = i
    v[MIN] = minIdx
    push(LINE.SET_MIN, [i])

    for (let j = i + 1; j < n; j++) {
      v.j = j
      push(LINE.INNER_LOOP)
      push(LINE.COMPARE, [j, minIdx])
      if (arr[j] < arr[minIdx]) {
        minIdx = j
        v[MIN] = minIdx
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
