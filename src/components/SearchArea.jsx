function getCellColor(index, comparing, found) {
  if (index === found) return 'bg-green-500 text-slate-950'
  if (comparing.includes(index)) return 'bg-yellow-500 text-slate-950'
  return 'bg-slate-300 text-slate-900'
}

function getResultText(result) {
  if (result === null) return 'Hàm không trả về một index hợp lệ.'
  if (result === -1) return 'Trả về -1: không tìm thấy.'
  return `Trả về index ${result}.`
}

// Mảng hiển thị dạng ô lưới cho thuật toán tìm kiếm.
// `range` là đoạn [low, high] còn đang xét (Binary Search); ô ngoài đoạn bị làm mờ.
// `result` chỉ có ở bước cuối: index hàm trả về, -1 hoặc null.
function SearchArea({ array, target, comparing = [], found = null, range = null, result }) {
  const [low, high] = range ?? [0, array.length - 1]

  return (
    <div className="flex min-h-80 flex-col gap-6 rounded-xl border border-slate-700 bg-slate-900 p-4">
      <p className="text-sm text-slate-300">
        Giá trị cần tìm:{' '}
        <span className="rounded-md bg-slate-800 px-2 py-1 font-mono font-semibold text-emerald-300">
          {target}
        </span>
      </p>

      <div className="flex flex-1 flex-wrap content-center justify-center gap-2">
        {array.map((value, index) => (
          <div
            key={index}
            className={`flex flex-col items-center gap-1 transition-opacity duration-200 ${
              index < low || index > high ? 'opacity-30' : ''
            }`}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-md font-mono text-sm font-semibold transition-colors duration-200 ${getCellColor(index, comparing, found)}`}
            >
              {value}
            </div>
            <span className="font-mono text-xs text-slate-500">{index}</span>
            {range && (
              <span className="h-4 font-mono text-xs text-emerald-400">
                {[index === low && 'low', index === high && 'high'].filter(Boolean).join('/')}
              </span>
            )}
          </div>
        ))}
      </div>

      <p
        className={`h-5 text-center text-sm font-medium ${
          found !== null ? 'text-green-400' : 'text-slate-300'
        }`}
      >
        {result !== undefined && getResultText(result)}
      </p>
    </div>
  )
}

export default SearchArea
