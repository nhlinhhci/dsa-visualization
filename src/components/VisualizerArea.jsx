function getBarColor(index, comparing, swapping, sorted) {
  if (comparing.includes(index)) {
    return swapping ? 'bg-red-500' : 'bg-yellow-500'
  }
  if (sorted.includes(index)) return 'bg-green-500'
  return 'bg-blue-500'
}

function VisualizerArea({ array, comparing = [], swapping = false, sorted = [] }) {
  const maxValue = Math.max(...array, 1)

  return (
    <div className="flex h-80 items-end justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 p-4">
      {array.map((value, index) => (
        // pt-6 chừa chỗ cho nhãn số để cột cao nhất (100%) không bị tràn.
        <div key={index} className="flex h-full max-w-16 flex-1 items-end pt-6">
          <div
            className={`relative w-full rounded-t-md transition-all duration-200 ${getBarColor(index, comparing, swapping, sorted)}`}
            style={{ height: `${(value / maxValue) * 100}%` }}
          >
            <span className="absolute -top-6 left-0 w-full text-center text-sm font-semibold text-slate-200">
              {value}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default VisualizerArea
