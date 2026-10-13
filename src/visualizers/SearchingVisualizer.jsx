import { useState } from 'react'
import SearchArea from '../components/SearchArea.jsx'
import AlgorithmVisualizer from './AlgorithmVisualizer.jsx'

const ARRAY_SIZE = 10
const MIN_VALUE = 1
const MAX_VALUE = 99
// Xác suất giá trị cần tìm có trong mảng.
const TARGET_IN_ARRAY_CHANCE = 0.75

const randomValue = () =>
  Math.floor(Math.random() * (MAX_VALUE - MIN_VALUE + 1)) + MIN_VALUE

// Ô nhập giá trị cần tìm. Giữ bản nháp khi đang gõ để người dùng xóa trống hoặc gõ dấu "-" được.
function TargetInput({ target, onChange }) {
  const [draft, setDraft] = useState(null)

  return (
    <label className="flex items-center gap-2 text-sm text-slate-300">
      Tìm
      <input
        type="number"
        value={draft ?? String(target)}
        onFocus={() => setDraft(String(target))}
        onBlur={() => setDraft(null)}
        onChange={(e) => {
          setDraft(e.target.value)
          const value = e.target.valueAsNumber
          if (Number.isInteger(value) && Math.abs(value) <= 1e6) onChange(value)
        }}
        className="w-20 rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 font-mono text-slate-100 outline-none focus:border-emerald-400"
      />
    </label>
  )
}

const searchingMode = {
  // Các giá trị không trùng nhau để mỗi giá trị chỉ có đúng một index.
  createInput: (algorithm) => {
    const values = new Set()
    while (values.size < ARRAY_SIZE) values.add(randomValue())
    const array = [...values]
    if (algorithm.requiresSortedInput) array.sort((a, b) => a - b)

    let target = array[Math.floor(Math.random() * array.length)]
    if (Math.random() >= TARGET_IN_ARRAY_CHANCE) {
      do target = randomValue()
      while (values.has(target))
    }
    return { array, target }
  },

  renderArea: (step, input) => (
    <SearchArea
      array={step.array}
      target={input.target}
      comparing={step.comparing}
      found={step.found ?? null}
      range={step.range ?? null}
      result={step.result}
    />
  ),

  InputControls: ({ input, onChange }) => (
    <TargetInput target={input.target} onChange={(target) => onChange({ ...input, target })} />
  ),

  getVerdict: ({ array, target }, run) => {
    const expected = array.indexOf(target)
    const isCorrect =
      run.result === -1 ? expected === -1 : array[run.result] === target
    return {
      isCorrect,
      success:
        expected === -1
          ? 'Kết quả đúng: trả về -1 vì giá trị không có trong mảng.'
          : `Kết quả đúng: tìm thấy tại index ${run.result}.`,
      failure: [
        'Kết quả sai.',
        `Hàm trả về: ${run.result ?? 'không phải số nguyên'}`,
        `Mong đợi: ${expected}`,
      ],
    }
  },

  getFinalStep: (input, run, isCorrect) => ({
    array: run.finalArray,
    comparing: [],
    swapping: false,
    sorted: [],
    found: isCorrect && run.result >= 0 ? run.result : null,
    result: run.result,
    lineHighlighted: null,
  }),
}

function SearchingVisualizer(props) {
  return <AlgorithmVisualizer {...props} mode={searchingMode} />
}

export default SearchingVisualizer
