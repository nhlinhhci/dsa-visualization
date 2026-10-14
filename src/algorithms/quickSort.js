import { codeLines } from '../data/codeTemplates.js'
import { createStepRecorder, nameFor } from './stepRecorder.js'

export const quickSortComplexity = {
  time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)' },
  space: 'O(log n)',
}

// Phân hoạch Lomuto: pivot là phần tử cuối đoạn.
export function generateQuickSortSteps(initialArray, { language = 'python' } = {}) {
  const LINE = codeLines.quickSort[language]
  const arr = [...initialArray]
  const { sorted, push, enter, finishSorted } = createStepRecorder(arr)
  const SORT = nameFor(language, 'quick_sort', 'quickSort')

  const partition = (low, high) => {
    const v = { low, high, pivot: undefined, i: undefined, j: undefined }
    enter('partition', v)
    push(LINE.PARTITION_FUNCTION)
    const pivot = arr[high]
    v.pivot = pivot
    push(LINE.PIVOT, [high])
    let i = low - 1
    v.i = i
    push(LINE.INIT_I)

    for (let j = low; j < high; j++) {
      v.j = j
      push(LINE.LOOP)
      push(LINE.COMPARE, [j, high])
      if (arr[j] < pivot) {
        i++
        v.i = i
        push(LINE.INCREMENT_I)
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
        push(LINE.SWAP, [i, j], true)
      }
    }

    ;[arr[i + 1], arr[high]] = [arr[high], arr[i + 1]]
    push(LINE.PIVOT_SWAP, [i + 1, high], true)
    // Pivot đã về đúng vị trí cuối cùng của nó.
    sorted.push(i + 1)
    push(LINE.RETURN)
    return i + 1
  }

  const sort = (low, high) => {
    const v = { low, high, p: undefined }
    const resume = enter(SORT, v)
    push(LINE.SORT_FUNCTION)
    push(LINE.CHECK)
    if (low < high) {
      push(LINE.CALL_PARTITION)
      const p = partition(low, high)
      resume()
      v.p = p
      push(LINE.RECURSE_LEFT)
      sort(low, p - 1)
      resume()
      push(LINE.RECURSE_RIGHT)
      sort(p + 1, high)
    } else if (low === high) {
      // Đoạn chỉ còn 1 phần tử thì phần tử đó đã đúng vị trí.
      sorted.push(low)
    }
  }

  sort(0, arr.length - 1)
  return finishSorted()
}
