import SearchArea from '../components/SearchArea.jsx'
import TargetInput from '../components/TargetInput.jsx'
import AlgorithmVisualizer from './AlgorithmVisualizer.jsx'

const ARRAY_SIZE = 10
const MIN_VALUE = 1
const MAX_VALUE = 99
// Xác suất giá trị cần tìm có trong mảng.
const TARGET_IN_ARRAY_CHANCE = 0.75

const randomValue = () =>
  Math.floor(Math.random() * (MAX_VALUE - MIN_VALUE + 1)) + MIN_VALUE

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
      vars={step.vars}
      result={step.result}
    />
  ),

  InputControls: ({ input, onChange }) => (
    <TargetInput
      label="Tìm"
      target={input.target}
      onChange={(target) => onChange({ ...input, target })}
    />
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
