import { Variable } from 'lucide-react'

// Hiển thị một giá trị biến theo cú pháp của ngôn ngữ đang dùng.
// Server gửi: số, true/false, null, chuỗi (đã có ngoặc), { list, length } cho mảng/list,
// hoặc { node, val } cho biến trỏ tới một node của danh sách liên kết.
function formatValue(value, language) {
  if (value === null) return language === 'python' ? 'None' : 'null'
  if (typeof value === 'object' && 'node' in value) return `Node(${formatValue(value.val, language)})`
  if (typeof value === 'boolean') {
    if (language === 'python') return value ? 'True' : 'False'
    return String(value)
  }
  if (typeof value === 'object' && Array.isArray(value.list)) {
    const items = value.list.map((item) => formatValue(item, language)).join(', ')
    const more = value.length > value.list.length ? `, … (${value.length} phần tử)` : ''
    return `[${items}${more}]`
  }
  return String(value)
}

// Bảng biến cục bộ của code sinh viên ở bước hiện tại; biến vừa đổi giá trị (so với bước trước
// trong cùng hàm) được tô vàng. `step` là bước gần nhất có thông tin biến.
function VariablesPanel({ step, previousStep, language, hasRun }) {
  const variables = step?.vars ? Object.entries(step.vars) : []
  const previousVars = previousStep?.scope === step?.scope ? previousStep?.vars : null

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
      <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold">
        <Variable className="h-4 w-4 text-emerald-400" />
        Biến
        {step?.scope && (
          <span className="ml-auto font-mono text-xs font-normal text-slate-400">
            trong hàm <span className="text-emerald-300">{step.scope}()</span>
          </span>
        )}
      </div>

      {variables.length === 0 ? (
        <p className="px-4 py-3 text-sm text-slate-500">
          {hasRun
            ? 'Không có biến nào ở bước này.'
            : 'Bấm Run để xem giá trị các biến trong code của bạn thay đổi theo từng bước.'}
        </p>
      ) : (
        <table className="w-full font-mono text-sm">
          <tbody className="divide-y divide-slate-800">
            {variables.map(([name, value]) => {
              const isChanged =
                !previousVars ||
                !Object.hasOwn(previousVars, name) ||
                JSON.stringify(previousVars[name]) !== JSON.stringify(value)
              return (
                <tr key={name} className={isChanged ? 'bg-yellow-500/15' : undefined}>
                  <td className="w-1/3 px-4 py-1.5 align-top text-slate-400">{name}</td>
                  <td
                    className={`px-4 py-1.5 break-all ${
                      isChanged ? 'text-yellow-200' : 'text-slate-100'
                    }`}
                  >
                    {formatValue(value, language)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default VariablesPanel
