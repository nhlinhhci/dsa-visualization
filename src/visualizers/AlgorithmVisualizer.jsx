import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  HardDrive,
  Loader2,
  Pause,
  Play,
  Shuffle,
} from 'lucide-react'
import { runCode } from '../api/runCode.js'
import CustomArrayInput from '../components/CustomArrayInput.jsx'
import IDEPanel from '../components/IDEPanel.jsx'
import RunConsole from '../components/RunConsole.jsx'
import VariablesPanel from '../components/VariablesPanel.jsx'
import { codeTemplates } from '../data/codeTemplates.js'

const MIN_DELAY = 50
const MAX_DELAY = 1000

const IDLE_RUN = {
  status: 'idle',
  steps: [],
  error: null,
  output: '',
  finalArray: null,
  result: null,
}

function idleStep(array) {
  return { array, comparing: [], swapping: false, sorted: [], lineHighlighted: null }
}

const buttonClass =
  'flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40'

// Khung chung cho mọi thuật toán: điều khiển phát lại, IDE, chạy code của sinh viên, bảng độ phức tạp.
// `mode` mô tả phần riêng của từng nhóm thuật toán (sắp xếp / tìm kiếm):
//   createInput(algorithm)            -> { array, target? }
//   renderArea(step, input)           -> phần trực quan hóa bên trái
//   InputControls?                    -> component { input, onChange } cho ô nhập thêm trên thanh điều khiển
//   getIdleStep?(input, language)     -> step hiển thị khi chưa chạy code (mặc định: mảng ban đầu)
//   getProject?({ language, userText, input, showResult })
//                                     -> IDE dạng project nhiều file (xem LinkedListVisualizer):
//                                        { files, workFile, protectedRange, runCode, extractSll,
//                                          focusLine, answerLineOffset }
//   inputLabels?                      -> { random, custom, maxLength, allowEmpty } cho hai nút tạo dữ liệu
// renderArea nhận thêm step liền trước (để tô những gì vừa thay đổi).
//   getVerdict(input, run)            -> { isCorrect, success, failure: [dòng...] }
//   getFinalStep(input, run, isCorrect, language) -> step kết thúc sau khi code sinh viên chạy xong
function AlgorithmVisualizer({
  algorithm,
  mode,
  language,
  setLanguage,
  userCode,
  onUserCodeChange,
}) {
  const [input, setInput] = useState(() => mode.createInput(algorithm))
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [delay, setDelay] = useState(300)
  const [showComplexity, setShowComplexity] = useState(false)
  const [optimized, setOptimized] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [run, setRun] = useState(IDLE_RUN)
  // Tab đang mở trong IDE dạng project; null = file sinh viên viết code.
  const [openedFile, setOpenedFile] = useState(null)
  // Tăng mỗi khi kết quả đang chờ không còn hợp lệ (đổi code, đổi mảng...) để bỏ qua response cũ.
  const runIdRef = useRef(0)

  const hasOptimized = Boolean(algorithm.optimizedComplexity)
  const { InputControls } = mode
  const signature = algorithm.signatures[language]

  const answerSteps = useMemo(
    () =>
      algorithm.generateSteps(input.array, {
        optimized,
        language,
        target: input.target,
        position: input.position,
      }),
    [algorithm, input, optimized, language],
  )
  const verdict = useMemo(
    () => (run.status === 'done' && !run.error ? mode.getVerdict(input, run) : null),
    [mode, input, run],
  )
  const userSteps = useMemo(() => {
    if (run.status !== 'done' || (run.steps.length === 0 && !run.finalArray)) {
      return [mode.getIdleStep?.(input, language) ?? idleStep(input.array)]
    }
    if (!verdict) return run.steps
    return [...run.steps, mode.getFinalStep(input, run, verdict.isCorrect, language)]
  }, [mode, input, run, verdict, language])

  const steps = showResult ? answerSteps : userSteps
  const templateKey = optimized ? `${algorithm.id}Optimized` : algorithm.id
  const complexity = optimized ? algorithm.optimizedComplexity : algorithm.complexity
  const project = useMemo(
    () => mode.getProject?.({ language, userText: userCode[language], input, showResult }),
    [mode, language, userCode, input, showResult],
  )
  const code = useMemo(
    () =>
      project
        ? null
        : showResult
          ? codeTemplates[templateKey][language]
          : userCode[language].split('\n'),
    [project, showResult, templateKey, language, userCode],
  )

  const lastStepIndex = steps.length - 1
  const shownStepIndex = Math.min(currentStepIndex, lastStepIndex)
  const step = steps[shownStepIndex]
  // Bước gần nhất (tính cả bước hiện tại) có thông tin biến: bước kết thúc không có biến nên giữ
  // giá trị cuối cùng; kèm bước có biến ngay trước nó để tô các biến vừa đổi.
  const varStepIndex = steps.findLastIndex((item, index) => index <= shownStepIndex && item.vars)
  const previousVarStepIndex = steps.findLastIndex(
    (item, index) => index < varStepIndex && item.vars,
  )
  // Code đáp án của project: số dòng trong step tính từ phương thức, cộng thêm vị trí của nó trong file.
  const currentLine =
    showResult && project && step.lineHighlighted !== null
      ? step.lineHighlighted + project.answerLineOffset
      : step.lineHighlighted
  const isAtEnd = currentStepIndex >= lastStepIndex
  // Tới bước cuối thì coi như đã dừng, không cần setState thêm trong effect.
  const isAutoPlaying = isPlaying && !isAtEnd
  const isRunning = run.status === 'running'

  useEffect(() => {
    if (!isAutoPlaying) return
    const intervalId = setInterval(() => {
      setCurrentStepIndex((index) => Math.min(index + 1, lastStepIndex))
    }, delay)
    // Chạy lại mỗi khi pause, đổi tốc độ hoặc đổi mảng nên không bao giờ có 2 interval cùng lúc.
    return () => clearInterval(intervalId)
  }, [isAutoPlaying, delay, lastStepIndex])

  // Dừng phát, về bước đầu và bỏ kết quả chạy cũ: dùng khi dữ liệu hoặc code thay đổi.
  const resetPlayback = () => {
    runIdRef.current++
    setIsPlaying(false)
    setCurrentStepIndex(0)
    setRun(IDLE_RUN)
  }

  const handleChangeInput = (nextInput) => {
    resetPlayback()
    setInput(nextInput)
  }

  // Bản tối ưu có số bước khác nên phải quay về bước đầu.
  const handleToggleOptimized = () => {
    resetPlayback()
    setOptimized((value) => !value)
  }

  const handleToggleShowResult = () => {
    resetPlayback()
    setShowResult((value) => !value)
  }

  const handleChangeLanguage = (nextLanguage) => {
    // Step của đáp án giống nhau ở mọi ngôn ngữ nên giữ nguyên vị trí; code tự viết thì không.
    if (!showResult) resetPlayback()
    setOpenedFile(null)
    setLanguage(nextLanguage)
  }

  const handleCodeChange = (value) => {
    if (showResult) return
    // Project: chỉ lưu phần sinh viên viết (vd. class SLL trong main.py), không lưu phần chỉ đọc.
    onUserCodeChange(language, project ? project.extractSll(value) : value)
    if (run.status !== 'idle') resetPlayback()
  }

  const handleRun = async () => {
    const runId = ++runIdRef.current
    setIsPlaying(false)
    setCurrentStepIndex(0)
    setRun({ ...IDLE_RUN, status: 'running' })
    // Mở lại file sinh viên viết để thấy dòng đang chạy.
    setOpenedFile(null)
    const result = await runCode({
      algorithm: algorithm.id,
      language,
      code: project ? project.runCode : userCode[language],
      array: input.array,
      target: input.target,
      position: input.position,
    })
    if (runId !== runIdRef.current) return
    setRun({ ...result, status: 'done' })
    setIsPlaying(true)
  }

  const handleTogglePlay = () => {
    if (isAutoPlaying) {
      setIsPlaying(false)
      return
    }
    if (isAtEnd) setCurrentStepIndex(0)
    setIsPlaying(true)
  }

  const handleNextStep = () => {
    setIsPlaying(false)
    setCurrentStepIndex((index) => Math.min(index + 1, lastStepIndex))
  }

  const handlePrevStep = () => {
    setIsPlaying(false)
    setCurrentStepIndex((index) => Math.max(index - 1, 0))
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <header className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 p-3">
        <h1 className="mr-auto text-lg font-bold">{algorithm.title}</h1>

        <button
          type="button"
          className={buttonClass}
          onClick={() => handleChangeInput(mode.createInput(algorithm))}
        >
          <Shuffle className="h-4 w-4" />
          {mode.inputLabels?.random ?? 'Tạo mảng ngẫu nhiên'}
        </button>
        <CustomArrayInput
          label={mode.inputLabels?.custom}
          maxLength={mode.inputLabels?.maxLength}
          allowEmpty={mode.inputLabels?.allowEmpty}
          requiresSorted={Boolean(algorithm.requiresSortedInput)}
          onSubmit={(array) => handleChangeInput({ ...input, array })}
          buttonClass={buttonClass}
        />
        {InputControls && <InputControls input={input} onChange={handleChangeInput} />}
        <button
          type="button"
          className={buttonClass}
          onClick={handlePrevStep}
          disabled={currentStepIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev Step
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={handleTogglePlay}
          disabled={lastStepIndex === 0}
        >
          {isAutoPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isAutoPlaying ? 'Pause' : 'Auto Play'}
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={handleNextStep}
          disabled={isAtEnd}
        >
          Next Step
          <ChevronRight className="h-4 w-4" />
        </button>

        {showResult && hasOptimized && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={optimized}
              onChange={handleToggleOptimized}
              className="h-4 w-4 accent-emerald-400"
            />
            {algorithm.optimizedLabel}
          </label>
        )}

        <label className="flex items-center gap-2 text-sm text-slate-300">
          Delay
          <input
            type="range"
            min={MIN_DELAY}
            max={MAX_DELAY}
            step={50}
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
            className="accent-emerald-400"
          />
          <span className="w-16 font-mono text-slate-100">{delay}ms</span>
        </label>

        <span className="font-mono text-sm text-slate-400">
          Bước {Math.min(currentStepIndex, lastStepIndex) + 1}/{steps.length}
        </span>
      </header>

      <main className="grid flex-1 grid-cols-1 content-start items-start gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          {mode.renderArea(step, input, steps[shownStepIndex - 1])}
          <VariablesPanel
            step={steps[varStepIndex]}
            previousStep={steps[previousVarStepIndex]}
            language={language}
            hasRun={showResult || run.status === 'done'}
          />
        </div>
        <IDEPanel
          code={code}
          files={project?.files}
          activeFile={openedFile ?? project?.workFile}
          onSelectFile={setOpenedFile}
          workFile={project?.workFile}
          protectedRange={showResult ? null : project?.protectedRange}
          focusLine={project?.focusLine}
          focusKey={`${algorithm.id}:${language}:${showResult}`}
          currentLine={currentLine}
          language={language}
          setLanguage={handleChangeLanguage}
          editable={!showResult && !isRunning}
          onCodeChange={handleCodeChange}
          errorLine={showResult ? null : (run.error?.line ?? null)}
          placeholder={`Viết hàm ${signature} ở đây...`}
          actions={
            <>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={showResult}
                  onChange={handleToggleShowResult}
                  className="h-4 w-4 accent-emerald-400"
                />
                Show result
              </label>
              {!showResult && (
                <button
                  type="button"
                  onClick={handleRun}
                  disabled={isRunning || !userCode[language].trim()}
                  className="flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-1 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Run
                </button>
              )}
            </>
          }
        >
          {!showResult && <RunConsole run={run} signature={signature} verdict={verdict} />}
        </IDEPanel>
      </main>

      <footer className="flex flex-col items-center gap-4">
        <button
          type="button"
          className={buttonClass}
          onClick={() => setShowComplexity((show) => !show)}
          aria-expanded={showComplexity}
        >
          <Clock className="h-4 w-4" />
          Xem độ phức tạp thuật toán
        </button>

        {showComplexity && (
          <div className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="border-b border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold">
              Độ phức tạp của {algorithm.title}
              {optimized && ' (tối ưu)'}
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <th
                    rowSpan={3}
                    className="w-1/3 px-4 py-2 text-left align-top font-medium text-slate-300"
                  >
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-emerald-400" />
                      Time
                    </span>
                  </th>
                  <td className="px-4 py-2 text-slate-400">Best</td>
                  <td className="px-4 py-2 font-mono text-green-400">
                    {complexity.time.best}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-slate-400">Average</td>
                  <td className="px-4 py-2 font-mono text-yellow-400">
                    {complexity.time.average}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-slate-400">Worst</td>
                  <td className="px-4 py-2 font-mono text-red-400">
                    {complexity.time.worst}
                  </td>
                </tr>
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-300">
                    <span className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-emerald-400" />
                      Space
                    </span>
                  </th>
                  <td className="px-4 py-2 text-slate-400">Auxiliary</td>
                  <td className="px-4 py-2 font-mono text-green-400">
                    {complexity.space}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </footer>
    </div>
  )
}

export default AlgorithmVisualizer
