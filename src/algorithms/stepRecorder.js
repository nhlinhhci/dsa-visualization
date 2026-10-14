// Ảnh chụp một biến cho step: mảng thành { list, length } giống dữ liệu server gửi về.
function snapshotValue(value) {
  if (Array.isArray(value)) return { list: [...value], length: value.length }
  return value
}

// Gom các step khi mô phỏng một thuật toán trên `arr` (mảng bị thay đổi tại chỗ).
// `sorted` là danh sách index đã về đúng vị trí; sửa trực tiếp mảng này giữa các lần push.
//
// Biến cục bộ: gọi `enter(scope, vars)` khi vào một hàm, với `vars` là object chứa biến của hàm đó;
// sửa trực tiếp `vars` khi biến đổi giá trị (giá trị `undefined` = biến chưa khai báo, không hiện).
// `enter` trả về hàm để quay lại frame này sau khi một lời gọi đệ quy return.
export function createStepRecorder(arr) {
  const steps = []
  const sorted = []
  let frame = null

  const push = (lineHighlighted, comparing = [], swapping = false, extra = {}) => {
    const step = {
      array: [...arr],
      comparing,
      swapping,
      sorted: [...sorted],
      lineHighlighted,
      ...extra,
    }
    if (frame && lineHighlighted !== null) {
      step.scope = frame.scope
      step.vars = Object.fromEntries(
        Object.entries(frame.vars)
          .filter(([, value]) => value !== undefined)
          .map(([name, value]) => [name, snapshotValue(value)]),
      )
    }
    steps.push(step)
  }

  const enter = (scope, vars) => {
    const entered = { scope, vars }
    frame = entered
    return () => {
      frame = entered
    }
  }

  // Bước kết thúc của thuật toán sắp xếp: toàn bộ mảng đã đúng vị trí, không còn dòng nào chạy.
  const finishSorted = () => {
    sorted.length = 0
    for (let k = 0; k < arr.length; k++) sorted.push(k)
    push(null)
    return steps
  }

  return { steps, sorted, push, enter, finishSorted }
}

// Tên hàm/biến theo quy ước của từng ngôn ngữ: snake_case cho Python, camelCase cho C++/Java.
export const nameFor = (language, snake, camel) => (language === 'python' ? snake : camel)
