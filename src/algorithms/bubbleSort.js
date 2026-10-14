import { codeLines } from '../data/codeTemplates.js'
import { createStepRecorder, nameFor } from './stepRecorder.js'

export const bubbleSortComplexity = {
  basic: {
    time: {
      best: 'O(n²)',
      average: 'O(n²)',
      worst: 'O(n²)',
    },
    space: 'O(1)',
  },
  // Cờ `swapped` cho phép dừng sau đúng 1 lượt nếu mảng đã sắp xếp sẵn.
  optimized: {
    time: {
      best: 'O(n)',
      average: 'O(n²)',
      worst: 'O(n²)',
    },
    space: 'O(1)',
  },
}

// `language` chỉ ảnh hưởng tới `lineHighlighted` và tên hàm; số lượng và thứ tự step giống nhau ở mọi ngôn ngữ.
export function generateBubbleSortSteps(
  initialArray,
  { optimized = false, language = 'python' } = {},
) {
  const templateKey = optimized ? 'bubbleSortOptimized' : 'bubbleSort'
  const LINE = codeLines[templateKey][language]
  const arr = [...initialArray]
  const n = arr.length
  const { sorted, push, enter, finishSorted } = createStepRecorder(arr)
  const v = { n: undefined, i: undefined, swapped: undefined, j: undefined }
  enter(nameFor(language, 'bubble_sort', 'bubbleSort'), v)

  push(LINE.FUNCTION)
  v.n = n
  push(LINE.GET_LENGTH)

  for (let i = 0; i < n - 1; i++) {
    v.i = i
    v.j = undefined
    push(LINE.OUTER_LOOP)

    let swapped = false
    if (optimized) {
      v.swapped = swapped
      push(LINE.RESET_FLAG)
    }

    for (let j = 0; j < n - i - 1; j++) {
      v.j = j
      push(LINE.INNER_LOOP)
      push(LINE.COMPARE, [j, j + 1])

      if (arr[j] > arr[j + 1]) {
        ;[arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
        push(LINE.SWAP, [j, j + 1], true)

        swapped = true
        if (optimized) {
          v.swapped = swapped
          push(LINE.SET_FLAG)
        }
      }
    }

    // Sau mỗi lượt ngoài, phần tử lớn nhất còn lại đã về đúng vị trí cuối.
    sorted.push(n - i - 1)

    if (optimized) {
      push(LINE.CHECK_FLAG)
      if (!swapped) {
        push(LINE.BREAK)
        break
      }
    }
  }

  return finishSorted()
}
