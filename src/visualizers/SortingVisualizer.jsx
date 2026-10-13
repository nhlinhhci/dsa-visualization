import VisualizerArea from '../components/VisualizerArea.jsx'
import AlgorithmVisualizer from './AlgorithmVisualizer.jsx'

const ARRAY_SIZE = 10
const MIN_VALUE = 5
const MAX_VALUE = 99

const sortedCopy = (array) => [...array].sort((a, b) => a - b)

const sortingMode = {
  createInput: () => ({
    array: Array.from(
      { length: ARRAY_SIZE },
      () => Math.floor(Math.random() * (MAX_VALUE - MIN_VALUE + 1)) + MIN_VALUE,
    ),
  }),

  renderArea: (step) => (
    <VisualizerArea
      array={step.array}
      comparing={step.comparing}
      swapping={step.swapping}
      sorted={step.sorted}
    />
  ),

  getVerdict: ({ array }, run) => {
    const expected = sortedCopy(array)
    return {
      isCorrect: run.finalArray.join(',') === expected.join(','),
      success: 'Kết quả đúng: mảng đã được sắp xếp.',
      failure: [
        'Kết quả sai: mảng chưa được sắp xếp đúng.',
        `Kết quả: [${run.finalArray.join(', ')}]`,
        `Mong đợi: [${expected.join(', ')}]`,
      ],
    }
  },

  // Chỉ tô xanh toàn bộ nếu code của sinh viên sắp xếp đúng.
  getFinalStep: (input, run, isCorrect) => ({
    array: run.finalArray,
    comparing: [],
    swapping: false,
    sorted: isCorrect ? run.finalArray.map((_, index) => index) : [],
    lineHighlighted: null,
  }),
}

function SortingVisualizer(props) {
  return <AlgorithmVisualizer {...props} mode={sortingMode} />
}

export default SortingVisualizer
