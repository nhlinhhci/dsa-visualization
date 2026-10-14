// Tên biến thường dùng làm chỉ số mảng: hiện ngay dưới node mà nó trỏ tới.
// Không có `k`: trong merge nó là vị trí trong mảng tạm, không phải chỉ số của mảng chính.
const POINTER_NAME = /^(i|j|l|r|p|lo|hi|low|high|mid|left|right|start|end|idx|index|pos)$|(idx|index)$/i

// Gom các biến chỉ số hợp lệ theo vị trí: { index: [tên biến...] }.
function getPointers(vars, length) {
  const pointers = {}
  for (const [name, value] of Object.entries(vars ?? {})) {
    if (!POINTER_NAME.test(name) || !Number.isInteger(value) || value < 0 || value >= length) continue
    ;(pointers[value] ??= []).push(name)
  }
  return pointers
}

// Đoạn đang xét suy ra từ biến (left/right của Merge Sort, low/high của Quick Sort / Binary Search).
function getRangeFromVars(vars) {
  for (const [start, end] of [
    ['left', 'right'],
    ['low', 'high'],
  ]) {
    if (Number.isInteger(vars?.[start]) && Number.isInteger(vars?.[end])) return [vars[start], vars[end]]
  }
  return null
}

function getNodeColor(index, { comparing, swapping, sorted, found }) {
  if (comparing.includes(index)) {
    return swapping ? 'bg-red-500 text-white' : 'bg-yellow-500 text-slate-950'
  }
  if (index === found || sorted.includes(index)) return 'bg-green-500 text-slate-950'
  return 'bg-slate-300 text-slate-900'
}

// Mảng hiển thị dạng các node (ô) nằm ngang: giá trị trong node, index bên dưới, rồi tới tên các
// biến chỉ số đang trỏ vào node đó. `range` là đoạn [low, high] còn đang xét (mặc định lấy từ biến);
// node ngoài đoạn bị làm mờ.
function ArrayNodes({
  array,
  comparing = [],
  swapping = false,
  sorted = [],
  found = null,
  range = null,
  vars = null,
}) {
  const [low, high] = range ?? getRangeFromVars(vars) ?? [0, array.length - 1]
  const pointers = getPointers(vars, array.length)

  return (
    // Node co lại theo bề rộng khung (tối đa 3rem) để cả mảng luôn nằm trên một hàng.
    <div className="flex justify-center gap-1.5">
      {array.map((value, index) => (
        <div
          key={index}
          className={`flex max-w-12 min-w-0 flex-1 flex-col items-center gap-1 transition-opacity duration-200 ${
            index < low || index > high ? 'opacity-30' : ''
          }`}
        >
          <div
            className={`flex aspect-square w-full items-center justify-center rounded-md font-mono text-sm font-semibold transition-colors duration-200 ${getNodeColor(index, { comparing, swapping, sorted, found })}`}
          >
            {value}
          </div>
          <span className="font-mono text-xs text-slate-500">{index}</span>
          <div className="flex min-h-5 flex-col items-center gap-0.5">
            {pointers[index]?.map((name) => (
              <span
                key={name}
                className="rounded bg-emerald-500/15 px-1 font-mono text-xs leading-4 text-emerald-300"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ArrayNodes
