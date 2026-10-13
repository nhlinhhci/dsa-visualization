import { ChevronDown } from 'lucide-react'

// Thanh menu: mỗi nhóm thuật toán là một mục, đưa chuột vào (hoặc focus bằng bàn phím) thì xổ ra danh sách.
function AlgorithmMenu({ categories, algorithms, selectedId, onSelect }) {
  const selected = algorithms.find((algorithm) => algorithm.id === selectedId)

  return (
    <nav className="flex flex-wrap items-center gap-2" aria-label="Chọn thuật toán">
      {categories.map((category) => {
        const isActive = selected?.category === category.id
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
              <ul className="overflow-hidden rounded-lg border border-slate-600 bg-slate-800 py-1 shadow-2xl">
                {algorithms
                  .filter((algorithm) => algorithm.category === category.id)
                  .map((algorithm) => (
                    <li key={algorithm.id}>
                      <button
                        type="button"
                        aria-current={algorithm.id === selectedId ? 'true' : undefined}
                        onClick={(e) => {
                          onSelect(algorithm.id)
                          // Bỏ focus để danh sách đóng lại khi chuột rời đi.
                          e.currentTarget.blur()
                        }}
                        className={`block w-full px-4 py-2 text-left text-sm whitespace-nowrap transition-colors hover:bg-slate-700 ${
                          algorithm.id === selectedId
                            ? 'font-semibold text-emerald-300'
                            : 'text-slate-200'
                        }`}
                      >
                        {algorithm.name}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )
      })}
    </nav>
  )
}

export default AlgorithmMenu
