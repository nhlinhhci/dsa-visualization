import ArrayNodes from './ArrayNodes.jsx'

function getResultText(result) {
  if (result === null) return 'Hàm không trả về một index hợp lệ.'
  if (result === -1) return 'Trả về -1: không tìm thấy.'
  return `Trả về index ${result}.`
}

// Mảng cho thuật toán tìm kiếm: node vàng là đang xét, xanh lá là tìm thấy.
// `range` là đoạn [low, high] còn đang xét (Binary Search); node ngoài đoạn bị làm mờ.
// `result` chỉ có ở bước cuối: index hàm trả về, -1 hoặc null.
function SearchArea({ array, target, comparing = [], found = null, range = null, vars, result }) {
  return (
    <div className="flex min-h-48 flex-col gap-6 rounded-xl border border-slate-700 bg-slate-900 p-4">
      <p className="text-sm text-slate-300">
        Giá trị cần tìm:{' '}
        <span className="rounded-md bg-slate-800 px-2 py-1 font-mono font-semibold text-emerald-300">
          {target}
        </span>
      </p>

      <div className="flex flex-1 flex-col justify-center">
        <ArrayNodes array={array} comparing={comparing} found={found} range={range} vars={vars} />
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
