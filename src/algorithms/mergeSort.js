import { codeLines } from '../data/codeTemplates.js'
import { createStepRecorder, nameFor } from './stepRecorder.js'

export const mergeSortComplexity = {
  time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
  space: 'O(n)',
}

export function generateMergeSortSteps(initialArray, { language = 'python' } = {}) {
  const LINE = codeLines.mergeSort[language]
  const arr = [...initialArray]
  const { push, enter, finishSorted } = createStepRecorder(arr)
  const SORT = nameFor(language, 'merge_sort', 'mergeSort')

  // Bước lấy phần tử hiện temp đã có phần tử mới, rồi con trỏ mới tăng ở biến.
  const merge = (left, mid, right) => {
    const v = { left, mid, right, temp: undefined, i: undefined, j: undefined, k: undefined }
    enter('merge', v)
    push(LINE.MERGE_FUNCTION)
    const temp = []
    v.temp = temp
    push(LINE.INIT_TEMP)
    let i = left
    let j = mid + 1
    Object.assign(v, { i, j })
    push(LINE.INIT_POINTERS)

    while (true) {
      push(LINE.WHILE_BOTH)
      if (!(i <= mid && j <= right)) break
      push(LINE.COMPARE, [i, j])
      if (arr[i] <= arr[j]) {
        temp.push(arr[i])
        push(LINE.TAKE_LEFT, [i])
        v.i = ++i
      } else {
        temp.push(arr[j])
        push(LINE.TAKE_RIGHT, [j])
        v.j = ++j
      }
    }
    while (true) {
      push(LINE.WHILE_LEFT)
      if (i > mid) break
      temp.push(arr[i])
      push(LINE.COPY_LEFT, [i])
      v.i = ++i
    }
    while (true) {
      push(LINE.WHILE_RIGHT)
      if (j > right) break
      temp.push(arr[j])
      push(LINE.COPY_RIGHT, [j])
      v.j = ++j
    }

    for (let k = 0; k < temp.length; k++) {
      v.k = k
      push(LINE.WRITE_LOOP)
      arr[left + k] = temp[k]
      push(LINE.WRITE_BACK, [left + k], true)
    }
  }

  const sort = (left, right) => {
    const v = { left, right, mid: undefined }
    const resume = enter(SORT, v)
    push(LINE.SORT_FUNCTION)
    push(LINE.BASE_CHECK)
    if (left >= right) {
      push(LINE.RETURN)
      return
    }
    const mid = Math.floor((left + right) / 2)
    v.mid = mid
    push(LINE.MID)
    push(LINE.RECURSE_LEFT)
    sort(left, mid)
    resume()
    push(LINE.RECURSE_RIGHT)
    sort(mid + 1, right)
    resume()
    push(LINE.CALL_MERGE)
    merge(left, mid, right)
  }

  sort(0, arr.length - 1)
  return finishSorted()
}
