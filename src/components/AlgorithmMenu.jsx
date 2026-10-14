import { ChevronDown, ChevronRight } from 'lucide-react'

// Nút chọn một thuật toán trong danh sách xổ xuống.
function AlgorithmItem({ algorithm, selectedId, onSelect }) {
  const isSelected = algorithm.id === selectedId
  return (
    <button
      type="button"
      aria-current={isSelected ? 'true' : undefined}
      onClick={(e) => {
        onSelect(algorithm.id)
        // Bỏ focus để danh sách đóng lại khi chuột rời đi.
        e.currentTarget.blur()
      }}
      className={`block w-full px-4 py-2 text-left text-sm whitespace-nowrap transition-colors hover:bg-slate-700 ${
        isSelected ? 'font-semibold text-emerald-300' : 'text-slate-200'
      }`}
    >
      {algorithm.name}
    </button>
  )
}

// Gom các thuật toán của một mục theo `group`: thuật toán không có group đứng riêng,
// thuật toán cùng group (vd. "Singly Linked List") gom vào một mục con.
function groupAlgorithms(algorithms) {
  const entries = []
  for (const algorithm of algorithms) {
    if (!algorithm.group) {
      entries.push({ algorithm })
      continue
    }
    const existing = entries.find((entry) => entry.group === algorithm.group)
    if (existing) existing.algorithms.push(algorithm)
    else entries.push({ group: algorithm.group, algorithms: [algorithm] })
  }
  return entries
}

// Thanh menu: mỗi nhóm thuật toán là một mục, đưa chuột vào (hoặc focus bằng bàn phím) thì xổ ra danh sách.
// Mục con (vd. "Singly Linked List") lại xổ sang phải danh sách các hàm của nó khi đưa chuột vào.
function AlgorithmMenu({ categories, algorithms, selectedId, onSelect }) {
  const selected = algorithms.find((algorithm) => algorithm.id === selectedId)

  return (
    <nav className="flex flex-wrap items-center gap-2" aria-label="Chọn thuật toán">
      {categories.map((category) => {
        const isActive = selected?.category === category.id
        const entries = groupAlgorithms(
          algorithms.filter((algorithm) => algorithm.category === category.id),
        )
        return (
          <div key={category.id} className="group relative">
            <button
              type="button"
              aria-haspopup="true"
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors group-hover:bg-slate-700 ${
                isActive
                  ? 'border-emerald-400/60 bg-slate-800 text-emerald-300'
                  : 'border-slate-600 bg-slate-800 text-slate-100'
              }`}
            >
              {category.label}
              <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
            </button>

            {/* pt-1 thay cho margin để không có khe hở làm mất hover giữa nút và danh sách. */}
            <div className="absolute top-full left-0 z-20 hidden min-w-full pt-1 group-focus-within:block group-hover:block">
              <ul className="rounded-lg border border-slate-600 bg-slate-800 py-1 shadow-2xl">
                {entries.map((entry) =>
                  entry.algorithm ? (
                    <li key={entry.algorithm.id}>
                      <AlgorithmItem
                        algorithm={entry.algorithm}
                        selectedId={selectedId}
                        onSelect={onSelect}
                      />
                    </li>
                  ) : (
                    <li key={entry.group} className="group/sub relative">
                      <button
                        type="button"
                        aria-haspopup="true"
                        className={`flex w-full items-center justify-between gap-4 px-4 py-2 text-left text-sm whitespace-nowrap transition-colors group-hover/sub:bg-slate-700 ${
                          selected?.group === entry.group
                            ? 'font-semibold text-emerald-300'
                            : 'text-slate-200'
                        }`}
                      >
                        {entry.group}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      {/* pl-1 làm cầu nối hover giữa mục con và danh sách hàm bên phải. */}
                      <div className="absolute top-0 left-full z-30 hidden pl-1 group-focus-within/sub:block group-hover/sub:block">
                        <ul className="rounded-lg border border-slate-600 bg-slate-800 py-1 shadow-2xl">
                          {entry.algorithms.map((algorithm) => (
                            <li key={algorithm.id}>
                              <AlgorithmItem
                                algorithm={algorithm}
                                selectedId={selectedId}
                                onSelect={onSelect}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        )
      })}
    </nav>
  )
}

export default AlgorithmMenu
