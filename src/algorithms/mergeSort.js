import { codeLines } from '../data/codeTemplates.js'
import { createStepRecorder } from './stepRecorder.js'

export const mergeSortComplexity = {
  time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
  space: 'O(n)',
}

export function generateMergeSortSteps(initialArray, { language = 'python' } = {}) {
  const LINE = codeLines.mergeSort[language]
  const arr = [...initialArray]
  const { push, finishSorted } = createStepRecorder(arr)

  const merge = (left, mid, right) => {
    push(LINE.MERGE_FUNCTION)
    const temp = []
    push(LINE.INIT_TEMP)
    let i = left
    let j = mid + 1
    push(LINE.INIT_POINTERS)

    while (true) {
      push(LINE.WHILE_BOTH)
      if (!(i <= mid && j <= right)) break
      push(LINE.COMPARE, [i, j])
      if (arr[i] <= arr[j]) {
        push(LINE.TAKE_LEFT, [i])
        temp.push(arr[i++])
      } else {
        push(LINE.TAKE_RIGHT, [j])
        temp.push(arr[j++])
      }
    }
    while (true) {
      push(LINE.WHILE_LEFT)
      if (i > mid) break
      push(LINE.COPY_LEFT, [i])
      temp.push(arr[i++])
    }
    while (true) {
      push(LINE.WHILE_RIGHT)
      if (j > right) break
      push(LINE.COPY_RIGHT, [j])
      temp.push(arr[j++])
    }

    for (let k = 0; k < temp.length; k++) {
      push(LINE.WRITE_LOOP)
      arr[left + k] = temp[k]
      push(LINE.WRITE_BACK, [left + k], true)
    }
  }

  const sort = (left, right) => {
    push(LINE.SORT_FUNCTION)
    push(LINE.BASE_CHECK)
    if (left >= right) {
      push(LINE.RETURN)
      return
    }
    const mid = Math.floor((left + right) / 2)
    push(LINE.MID)
    push(LINE.RECURSE_LEFT)
    sort(left, mid)
    push(LINE.RECURSE_RIGHT)
    sort(mid + 1, right)
    push(LINE.CALL_MERGE)
    merge(left, mid, right)
  }

  sort(0, arr.length - 1)
  return finishSorted()
}
