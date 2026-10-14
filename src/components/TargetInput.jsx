import { useState } from 'react'

// Ô nhập một số nguyên (giá trị cần tìm, giá trị cần chèn...). Giữ bản nháp khi đang gõ để người dùng
// xóa trống hoặc gõ dấu "-" được; chỉ báo ra ngoài khi đã là số nguyên hợp lệ.
// `min`/`max`: khoảng giá trị hợp lệ (mặc định ±1e6).
function TargetInput({ label, target, onChange, min = -1e6, max = 1e6 }) {
  const [draft, setDraft] = useState(null)

  return (
    <label className="flex items-center gap-2 text-sm text-slate-300">
      {label}
      <input
        type="number"
        min={min > -1e6 ? min : undefined}
        value={draft ?? String(target)}
        onFocus={() => setDraft(String(target))}
        onBlur={() => setDraft(null)}
        onChange={(e) => {
          setDraft(e.target.value)
          const value = e.target.valueAsNumber
          if (Number.isInteger(value) && value >= min && value <= max) onChange(value)
        }}
        className="w-20 rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 font-mono text-slate-100 outline-none focus:border-emerald-400"
      />
    </label>
  )
}

export default TargetInput
