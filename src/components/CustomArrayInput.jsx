import { useEffect, useRef, useState } from 'react'
import { ListPlus } from 'lucide-react'

const DEFAULT_MAX_LENGTH = 15
const MAX_ABS_VALUE = 999

// Đọc chuỗi "5, 3, 8" thành mảng số nguyên; trả về { array } hoặc { error }.
// Dấu phẩy thừa (vd. ở cuối) được bỏ qua.
function parseArray(text, { requiresSorted, maxLength, allowEmpty }) {
  const parts = text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length === 0) {
    return allowEmpty ? { array: [] } : { error: 'Hãy nhập ít nhất một giá trị.' }
  }
  if (parts.length > maxLength) return { error: `Tối đa ${maxLength} phần tử.` }

  const invalid = parts.find((part) => !/^-?\d+$/.test(part))
  if (invalid !== undefined) return { error: `"${invalid}" không phải số nguyên.` }

  const array = parts.map(Number)
  if (array.some((value) => Math.abs(value) > MAX_ABS_VALUE)) {
    return { error: `Mỗi giá trị phải nằm trong khoảng -${MAX_ABS_VALUE} đến ${MAX_ABS_VALUE}.` }
  }
  if (requiresSorted && array.some((value, index) => index > 0 && array[index - 1] > value)) {
    return { error: 'Binary Search cần mảng đã sắp xếp tăng dần.' }
  }
  return { array }
}

// Nút "Mảng tự chọn": mở ô nhập các giá trị cách nhau bằng dấu phẩy, bấm Áp dụng (hoặc Enter) để dùng.
// `allowEmpty`: chấp nhận ô trống (vd. danh sách liên kết rỗng).
function CustomArrayInput({
  requiresSorted = false,
  maxLength = DEFAULT_MAX_LENGTH,
  allowEmpty = false,
  label = 'Mảng tự chọn',
  onSubmit,
  buttonClass,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState(null)
  const containerRef = useRef(null)

  // Bấm ra ngoài nút và bảng nhập thì đóng bảng.
  useEffect(() => {
    if (!isOpen) return
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen])

  const open = () => {
    setText('')
    setError(null)
    setIsOpen(true)
  }

  const submit = (event) => {
    event.preventDefault()
    const parsed = parseArray(text, { requiresSorted, maxLength, allowEmpty })
    if (parsed.error) {
      setError(parsed.error)
      return
    }
    onSubmit(parsed.array)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={buttonClass}
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        aria-expanded={isOpen}
      >
        <ListPlus className="h-4 w-4" />
        {label}
      </button>

      {isOpen && (
        <form
          onSubmit={submit}
          onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
          className="absolute top-full left-0 z-30 mt-2 flex w-80 flex-col gap-2 rounded-lg border border-slate-600 bg-slate-800 p-3 shadow-2xl"
        >
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            Các giá trị, cách nhau bằng dấu phẩy
            <input
              autoFocus
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setError(null)
              }}
              placeholder="vd. 5, 3, 8, 1, 9"
              aria-invalid={Boolean(error)}
              className="rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 font-mono text-slate-100 outline-none focus:border-emerald-400"
            />
          </label>
          <p className={`text-xs ${error ? 'text-red-400' : 'text-slate-500'}`}>
            {error ??
              `Tối đa ${maxLength} số nguyên${requiresSorted ? ', sắp xếp tăng dần' : ''}${
                allowEmpty ? '; để trống nếu muốn danh sách rỗng' : ''
              }.`}
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md px-3 py-1 text-sm text-slate-300 hover:bg-slate-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-md bg-emerald-500 px-3 py-1 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Áp dụng
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default CustomArrayInput
