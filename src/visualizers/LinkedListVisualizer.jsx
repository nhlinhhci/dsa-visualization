import { useMemo } from 'react'
import { headName } from '../algorithms/linkedList.js'
import LinkedListArea from '../components/LinkedListArea.jsx'
import TargetInput from '../components/TargetInput.jsx'
import {
  buildSllProject,
  findMethodLine,
  getSllAnswer,
} from '../data/projects/singlyLinkedList.js'
import AlgorithmVisualizer from './AlgorithmVisualizer.jsx'

const LIST_SIZE = 5
const MAX_LIST_SIZE = 8
const MIN_VALUE = 1
const MAX_VALUE = 99
// Với thao tác xóa: xác suất giá trị cần xóa có trong danh sách.
const TARGET_IN_LIST_CHANCE = 0.75

const randomValue = () =>
  Math.floor(Math.random() * (MAX_VALUE - MIN_VALUE + 1)) + MIN_VALUE

const formatList = (values) => (values.length ? `${values.join(' → ')} → null` : 'null')

// Các số nguyên trong output (Traversal: sinh viên in giá trị theo định dạng tùy ý, vd. "3 -> 1 -> 4").
const printedValues = (output) => (output.match(/-?\d+/g) ?? []).map(Number)

// Danh sách ban đầu dạng step (node n1, n2... và biến head), để hiển thị khi chưa chạy code.
function initialListStep(values, language) {
  const heap = values.map((val, index) => ({
    id: `n${index + 1}`,
    val,
    next: index + 1 < values.length ? `n${index + 2}` : null,
  }))
  return {
    array: [],
    comparing: [],
    swapping: false,
    sorted: [],
    lineHighlighted: null,
    heap,
    vars: { [headName(language)]: heap.length ? { node: heap[0].id, val: heap[0].val } : null },
  }
}

// Danh sách kết quả: đi theo next từ node `resultNode` trong `heap`.
function walkList(heap, resultNode) {
  const nodes = new Map(heap.map((node) => [node.id, node]))
  const result = []
  for (let id = resultNode; id && nodes.has(id) && result.length < 100; id = nodes.get(id).next) {
    result.push(nodes.get(id))
  }
  return result
}

function createLinkedListMode(algorithm) {
  return {
    inputLabels: {
      random: 'Tạo danh sách ngẫu nhiên',
      custom: 'Danh sách tự chọn',
      maxLength: MAX_LIST_SIZE,
      allowEmpty: true,
    },

    createInput: () => {
      const values = new Set()
      while (values.size < LIST_SIZE) values.add(randomValue())
      const list = [...values]
      let target = randomValue()
      if (algorithm.id === 'deleteValue' && Math.random() < TARGET_IN_LIST_CHANCE) {
        target = list[Math.floor(Math.random() * list.length)]
      }
      // Vị trí hợp lệ: 0..n khi chèn (n = chèn cuối), 0..n-1 khi xóa.
      const positionCount = algorithm.id === 'insertAtPosition' ? list.length + 1 : list.length
      return {
        array: list,
        target: algorithm.targetLabel ? target : undefined,
        position: algorithm.positionLabel ? Math.floor(Math.random() * positionCount) : undefined,
      }
    },

    getIdleStep: ({ array }, language) => initialListStep(array, language),

    // IDE dạng project (main.py / SLL.cpp + header / SLL.java...), mở sẵn file SLL ở phương thức của
    // thao tác đang chọn. Code đáp án: file SLL ghép từ đáp án của mọi thao tác.
    getProject: ({ language, userText, input, showResult }) => {
      const answer = showResult ? getSllAnswer(language) : null
      const sllText = showResult ? answer.text : userText
      const project = buildSllProject({
        language,
        sllText,
        operationId: algorithm.id,
        input,
        editable: !showResult,
      })
      const methodLine = showResult
        ? answer.methodLines[algorithm.id]
        : findMethodLine(language, sllText, algorithm.id)
      return {
        ...project,
        focusLine: methodLine === null ? null : project.lineOffset + methodLine,
        answerLineOffset: showResult ? project.lineOffset + methodLine : 0,
      }
    },

    renderArea: (step, input, previousStep) => (
      <LinkedListArea
        step={step}
        previousStep={previousStep}
        inputs={[
          algorithm.positionLabel && { label: algorithm.positionLabel, value: input.position },
          algorithm.targetLabel && { label: algorithm.targetLabel, value: input.target },
        ].filter(Boolean)}
      />
    ),

    InputControls:
      algorithm.targetLabel || algorithm.positionLabel
        ? ({ input, onChange }) => (
            <>
              {algorithm.positionLabel && (
                <TargetInput
                  label={algorithm.positionLabel}
                  target={input.position}
                  min={0}
                  max={99}
                  onChange={(position) => onChange({ ...input, position })}
                />
              )}
              {algorithm.targetLabel && (
                <TargetInput
                  label={algorithm.targetLabel}
                  target={input.target}
                  min={-999}
                  max={999}
                  onChange={(target) => onChange({ ...input, target })}
                />
              )}
            </>
          )
        : undefined,

    getVerdict: ({ array, target, position }, run) => {
      const expected = algorithm.expected(array, target, position)
      if (algorithm.id === 'traverse') {
        const printed = printedValues(run.output)
        return {
          isCorrect: printed.join(',') === expected.join(','),
          success: `Kết quả đúng: đã in ${expected.length ? expected.join(' ') : '(không có node nào)'}`,
          failure: [
            'Kết quả sai: các giá trị in ra chưa đúng thứ tự các node.',
            `Đã in: ${printed.length ? printed.join(' ') : '(không in gì)'}`,
            `Mong đợi: ${expected.length ? expected.join(' ') : '(không in gì)'}`,
          ],
        }
      }
      return {
        isCorrect: run.finalArray.join(',') === expected.join(','),
        success: `Kết quả đúng: ${formatList(run.finalArray)}`,
        failure: [
          'Kết quả sai.',
          `Danh sách sau khi chạy: ${formatList(run.finalArray)}`,
          `Mong đợi: ${formatList(expected)}`,
        ],
      }
    },

    // Bước kết thúc: danh sách (từ head) sau khi phương thức chạy xong, lấy đúng các node đã thấy trong
    // lúc chạy để giữ vị trí. Nếu không tìm thấy các node đó (hiếm), dựng lại từ các giá trị.
    getFinalStep: (input, run, isCorrect, language) => {
      const lastHeap = run.steps.at(-1)?.heap ?? []
      const nodes = walkList(lastHeap, run.resultNode)
      const fromTrace = nodes.length === run.finalArray.length
      const heap = fromTrace ? nodes : initialListStep(run.finalArray, language).heap
      return {
        array: [],
        comparing: [],
        swapping: false,
        sorted: [],
        lineHighlighted: null,
        heap,
        resultNode: heap[0]?.id ?? null,
        resultLabel: headName(language),
        correct: isCorrect,
        // Traversal: các giá trị đã in ra.
        ...(algorithm.id === 'traverse' && { printed: printedValues(run.output) }),
      }
    },
  }
}

function LinkedListVisualizer(props) {
  const mode = useMemo(() => createLinkedListMode(props.algorithm), [props.algorithm])
  return <AlgorithmVisualizer {...props} mode={mode} />
}

export default LinkedListVisualizer
