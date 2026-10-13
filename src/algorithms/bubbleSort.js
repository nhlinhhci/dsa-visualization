import { codeLines } from '../data/codeTemplates.js'

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

// `language` chỉ ảnh hưởng tới `lineHighlighted`; số lượng và thứ tự step giống nhau ở mọi ngôn ngữ.
export function generateBubbleSortSteps(
  initialArray,
  { optimized = false, language = 'python' } = {},
) {
  const templateKey = optimized ? 'bubbleSortOptimized' : 'bubbleSort'
  const LINE = codeLines[templateKey][language]
  const arr = [...initialArray]
  const n = arr.length
  const steps = []
  const sorted = []

  const pushStep = (lineHighlighted, comparing = [], swapping = false) => {
    steps.push({
      array: [...arr],
      comparing,
      swapping,
      sorted: [...sorted],
      lineHighlighted,
    })
  }

  pushStep(LINE.FUNCTION)
  pushStep(LINE.GET_LENGTH)

  for (let i = 0; i < n - 1; i++) {
    pushStep(LINE.OUTER_LOOP)

    let swapped = false
    if (optimized) pushStep(LINE.RESET_FLAG)

    for (let j = 0; j < n - i - 1; j++) {
      pushStep(LINE.INNER_LOOP)
      pushStep(LINE.COMPARE, [j, j + 1])

      if (arr[j] > arr[j + 1]) {
        ;[arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
        pushStep(LINE.SWAP, [j, j + 1], true)

        swapped = true
        if (optimized) pushStep(LINE.SET_FLAG)
      }
    }

    // Sau mỗi lượt ngoài, phần tử lớn nhất còn lại đã về đúng vị trí cuối.
    sorted.push(n - i - 1)

    if (optimized) {
      pushStep(LINE.CHECK_FLAG)
      if (!swapped) {
        pushStep(LINE.BREAK)
        break
      }
    }
  }

  // Bước kết thúc: toàn bộ mảng đã sắp xếp, không còn dòng nào đang chạy.
  sorted.length = 0
  for (let k = 0; k < n; k++) sorted.push(k)
  pushStep(null)

  return steps
}
