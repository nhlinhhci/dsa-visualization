import { useMemo } from 'react'
import { cpp } from '@codemirror/lang-cpp'
import { java } from '@codemirror/lang-java'
import { python } from '@codemirror/lang-python'
import { Prec } from '@codemirror/state'
import { Decoration, EditorView, lineNumbers } from '@codemirror/view'
import CodeMirror from '@uiw/react-codemirror'
import { ChevronDown, Code2 } from 'lucide-react'

const LANGUAGES = [
  { value: 'python', label: 'Python', extension: python },
  { value: 'cpp', label: 'C++', extension: cpp },
  { value: 'java', label: 'Java', extension: java },
]

const editorTheme = Prec.highest(
  EditorView.theme({
    '&': { backgroundColor: 'transparent', fontSize: '14px' },
    '.cm-gutters': { backgroundColor: 'transparent', border: 'none', color: '#475569' },
    '.cm-content': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' },
    '.cm-line': { lineHeight: '1.5rem' },
    '.cm-run-line': {
      backgroundColor: 'rgb(52 211 153 / 0.15)',
      boxShadow: 'inset 2px 0 0 #34d399',
    },
    '.cm-error-line': {
      backgroundColor: 'rgb(248 113 113 / 0.18)',
      boxShadow: 'inset 2px 0 0 #f87171',
    },
  }),
)

// Số dòng hiển thị bắt đầu từ 0 để khớp với `lineHighlighted` và thông báo lỗi.
const zeroBasedLineNumbers = lineNumbers({ formatNumber: (n) => String(n - 1) })

// Tô nền dòng đang chạy và dòng lỗi (đều là chỉ số 0-based).
function lineMarkers(currentLine, errorLine) {
  return EditorView.decorations.of((view) => {
    const { doc } = view.state
    const marks = [
      [errorLine, 'cm-error-line'],
      [currentLine, 'cm-run-line'],
    ]
      .filter(([line]) => Number.isInteger(line) && line >= 0 && line < doc.lines)
      .sort(([a], [b]) => a - b)
      .map(([line, className]) =>
        Decoration.line({ class: className }).range(doc.line(line + 1).from),
      )
    return Decoration.set(marks)
  })
}

function IDEPanel({
  code,
  currentLine,
  language,
  setLanguage,
  editable = false,
  onCodeChange,
  errorLine = null,
  placeholder,
  actions,
  children,
}) {
  const value = useMemo(() => code.join('\n'), [code])
  const extensions = useMemo(
    () => [
      LANGUAGES.find((item) => item.value === language).extension(),
      zeroBasedLineNumbers,
      editorTheme,
      lineMarkers(currentLine, errorLine),
    ],
    [language, currentLine, errorLine],
  )

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 bg-slate-800 px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <Code2 className="h-4 w-4 text-slate-400" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {actions}
          <div className="relative">
            <select
              aria-label="Chọn ngôn ngữ"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="cursor-pointer appearance-none rounded-md border border-slate-600 bg-slate-900 py-1 pr-8 pl-3 text-sm text-slate-200 outline-none focus:border-emerald-400"
            >
              {LANGUAGES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      <CodeMirror
        value={value}
        height="20rem"
        theme="dark"
        extensions={extensions}
        editable={editable}
        readOnly={!editable}
        placeholder={editable ? placeholder : undefined}
        onChange={onCodeChange}
        indentWithTab
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: false,
          highlightActiveLineGutter: false,
        }}
      />

      {children}
    </div>
  )
}

export default IDEPanel
