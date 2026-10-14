import { useEffect, useMemo, useRef, useState } from 'react'
import { cpp } from '@codemirror/lang-cpp'
import { java } from '@codemirror/lang-java'
import { python } from '@codemirror/lang-python'
import { EditorState, Prec } from '@codemirror/state'
import { Decoration, EditorView, lineNumbers } from '@codemirror/view'
import CodeMirror from '@uiw/react-codemirror'
import { ChevronDown, Code2, Lock, PenLine } from 'lucide-react'

const LANGUAGES = [
  { value: 'python', label: 'Python', extension: python },
  { value: 'cpp', label: 'C++', extension: cpp },
  { value: 'java', label: 'Java', extension: java },
]

// Ngôn ngữ tô màu theo đuôi file (file .h/.cpp đều dùng C++).
const languageOfFile = (name, fallback) => {
  if (name.endsWith('.py')) return 'python'
  if (name.endsWith('.java')) return 'java'
  if (/\.(cpp|h|hpp)$/.test(name)) return 'cpp'
  return fallback
}

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
    // Dòng khai báo phương thức cần viết.
    '.cm-focus-line': { boxShadow: 'inset 2px 0 0 #facc15' },
    // Phần chỉ đọc trong file sinh viên viết (vd. class Node và main() trong main.py).
    '.cm-locked-line': { opacity: '0.55' },
  }),
)

// Số dòng hiển thị bắt đầu từ 0 để khớp với `lineHighlighted` và thông báo lỗi.
const zeroBasedLineNumbers = lineNumbers({ formatNumber: (n) => String(n - 1) })

// Tô nền các dòng (chỉ số 0-based): dòng đang chạy, dòng lỗi, dòng phương thức cần viết, phần chỉ đọc.
function lineMarkers({ currentLine, errorLine, focusLine, protectedRange }) {
  return EditorView.decorations.of((view) => {
    const { doc } = view.state
    const marks = [
      [errorLine, 'cm-error-line'],
      [currentLine, 'cm-run-line'],
      [focusLine, 'cm-focus-line'],
    ].filter(([line]) => Number.isInteger(line) && line >= 0 && line < doc.lines)
    if (protectedRange) {
      const firstEditable = doc.lineAt(protectedRange.prefix).number - 1
      const lastEditable = doc.lineAt(Math.max(0, doc.length - protectedRange.suffix)).number - 1
      for (let line = 0; line < doc.lines; line++) {
        if (line < firstEditable || line > lastEditable) marks.push([line, 'cm-locked-line'])
      }
    }
    return Decoration.set(
      marks
        .sort(([a], [b]) => a - b)
        .map(([line, className]) => Decoration.line({ class: className }).range(doc.line(line + 1).from)),
    )
  })
}

// Chặn sửa `prefix` ký tự đầu và `suffix` ký tự cuối của file (gõ ngay ở chỗ giáp ranh vẫn được).
// Không dùng dạng danh sách khoảng của changeFilter vì nó không chặn chèn ở đúng đầu/cuối khoảng.
function protectRange({ prefix, suffix }) {
  return EditorState.changeFilter.of((transaction) => {
    const length = transaction.startState.doc.length
    let allowed = true
    transaction.changes.iterChangedRanges((fromA, toA) => {
      // Thay cả file: nội dung mới từ bên ngoài (vd. main() đổi theo dữ liệu nhập), không phải sinh viên gõ.
      if (fromA === 0 && toA === length) return
      if (fromA < prefix || toA > length - suffix) allowed = false
    })
    return allowed
  })
}

// IDE: một file (`code` là mảng dòng) hoặc một project nhiều file (`files`).
// Với project: `files` = [{ name, content, editable }], `activeFile` là tab đang mở, `workFile` là file
// sinh viên viết code — dòng đang chạy / dòng lỗi / `focusLine` chỉ hiện ở file này.
// `protectedRange` ({ prefix, suffix } số ký tự) đánh dấu phần chỉ đọc trong work file.
// `focusLine` (dòng phương thức cần viết) được cuộn tới mỗi khi `focusKey` hoặc tab đổi.
function IDEPanel({
  code,
  files,
  activeFile,
  onSelectFile,
  workFile,
  protectedRange = null,
  focusLine = null,
  focusKey,
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
  // View của CodeMirror, có sau khi editor được tạo (không có ngay lần render đầu).
  const [editorView, setEditorView] = useState(null)
  const file = files ? (files.find((item) => item.name === activeFile) ?? files[0]) : null
  const isWorkFile = !file || file.name === workFile
  const value = useMemo(() => (file ? file.content : code.join('\n')), [file, code])
  const canEdit = editable && (!file || Boolean(file.editable))
  const fileLanguage = file ? languageOfFile(file.name, language) : language

  const extensions = useMemo(
    () => [
      LANGUAGES.find((item) => item.value === fileLanguage).extension(),
      zeroBasedLineNumbers,
      editorTheme,
      lineMarkers(
        isWorkFile
          ? { currentLine, errorLine, focusLine, protectedRange }
          : { currentLine: null, errorLine: null, focusLine: null, protectedRange: null },
      ),
      ...(isWorkFile && protectedRange ? [protectRange(protectedRange)] : []),
    ],
    [fileLanguage, isWorkFile, currentLine, errorLine, focusLine, protectedRange],
  )

  // Dòng đang chạy / dòng lỗi luôn nằm trong khung nhìn (file dài hơn khung editor).
  const followLine = isWorkFile ? (currentLine ?? errorLine) : null
  useEffect(() => {
    if (!editorView || !Number.isInteger(followLine) || followLine >= editorView.state.doc.lines) return
    editorView.dispatch({
      effects: EditorView.scrollIntoView(editorView.state.doc.line(followLine + 1).from, {
        y: 'nearest',
        yMargin: 48,
      }),
    })
  }, [editorView, followLine])

  // Cuộn tới phương thức cần viết khi đổi thao tác / ngôn ngữ / tab; không cuộn lại khi chỉ
  // focusLine đổi (sinh viên đang gõ phía trên phương thức).
  const fileName = file?.name
  const scrolledKeyRef = useRef(null)
  useEffect(() => {
    const view = editorView
    const key = `${focusKey}|${fileName}`
    if (scrolledKeyRef.current === key || !view) return
    // File tham khảo: mở từ đầu file.
    if (!isWorkFile) {
      scrolledKeyRef.current = key
      view.dispatch({ effects: EditorView.scrollIntoView(0, { y: 'start' }) })
      return
    }
    if (!Number.isInteger(focusLine) || focusLine >= view.state.doc.lines) return
    scrolledKeyRef.current = key
    view.dispatch({
      effects: EditorView.scrollIntoView(view.state.doc.line(focusLine + 1).from, {
        y: 'start',
        yMargin: 24,
      }),
    })
  }, [editorView, focusKey, fileName, isWorkFile, focusLine])

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

      {files && (
        <div role="tablist" aria-label="File trong project" className="flex overflow-x-auto border-b border-slate-700 bg-slate-900">
          {files.map((item) => {
            const isActive = item.name === file.name
            const Icon = item.editable ? PenLine : Lock
            return (
              <button
                key={item.name}
                type="button"
                role="tab"
                aria-selected={isActive}
                title={item.editable ? 'File bạn viết code' : 'Chỉ đọc — để tham khảo'}
                onClick={() => onSelectFile(item.name)}
                className={`flex shrink-0 items-center gap-1.5 border-r border-slate-800 px-3 py-1.5 font-mono text-xs transition-colors ${
                  isActive
                    ? 'border-b-2 border-b-emerald-400 bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <Icon className={`h-3 w-3 ${item.editable ? 'text-emerald-400' : 'text-slate-500'}`} />
                {item.name}
              </button>
            )
          })}
        </div>
      )}

      <CodeMirror
        onCreateEditor={setEditorView}
        value={value}
        height="20rem"
        theme="dark"
        extensions={extensions}
        editable={canEdit}
        readOnly={!canEdit}
        placeholder={canEdit ? placeholder : undefined}
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
