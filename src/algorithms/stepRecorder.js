// Gom các step khi mô phỏng một thuật toán trên `arr` (mảng bị thay đổi tại chỗ).
// `sorted` là danh sách index đã về đúng vị trí; sửa trực tiếp mảng này giữa các lần push.
export function createStepRecorder(arr) {
  const steps = []
  const sorted = []

  const push = (lineHighlighted, comparing = [], swapping = false, extra = {}) => {
    steps.push({
      array: [...arr],
      comparing,
      swapping,
      sorted: [...sorted],
      lineHighlighted,
      ...extra,
    })
  }

  // Bước kết thúc của thuật toán sắp xếp: toàn bộ mảng đã đúng vị trí, không còn dòng nào chạy.
  const finishSorted = () => {
    sorted.length = 0
    for (let k = 0; k < arr.length; k++) sorted.push(k)
    push(null)
    return steps
  }

  return { steps, sorted, push, finishSorted }
}
