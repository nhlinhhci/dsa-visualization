const ERROR_TITLES = {
  compile: 'Lỗi cú pháp / biên dịch',
  runtime: 'Lỗi khi chạy',
  timeout: 'Quá thời gian',
  limit: 'Quá số bước cho phép',
  signature: 'Thiếu hàm cần viết',
  setup: 'Không chạy được',
}

// Khung thông báo dưới editor: trạng thái chạy, lỗi, kết quả đúng/sai và output của chương trình.
// `verdict` là { isCorrect, success, failure: [dòng...] }, chỉ có khi code chạy xong không lỗi.
function RunConsole({ run, signature, verdict }) {
  const { status, error, output } = run

  return (
    <div
      className="max-h-48 overflow-auto border-t border-slate-700 bg-slate-950 px-4 py-3 font-mono text-xs leading-5"
      aria-live="polite"
    >
      {status === 'idle' && (
        <p className="text-slate-500">
          Viết hàm <span className="text-slate-300">{signature}</span> rồi bấm Run.
        </p>
      )}
      {status === 'running' && <p className="text-slate-400">Đang chạy…</p>}
      {status === 'done' && error && (
        <div className="text-red-400">
          <p className="font-semibold">
            {ERROR_TITLES[error.type] ?? ERROR_TITLES.runtime}
            {error.line !== null && ` (dòng ${error.line})`}
          </p>
          <pre className="font-mono whitespace-pre-wrap">{error.message}</pre>
        </div>
      )}
      {verdict?.isCorrect && <p className="text-green-400">{verdict.success}</p>}
      {verdict && !verdict.isCorrect && (
        <div className="text-yellow-400">
          {verdict.failure.map((line, index) => (
            <p key={index} className={index === 0 ? 'font-semibold' : undefined}>
              {line}
            </p>
          ))}
        </div>
      )}
      {status === 'done' && output && (
        <div className="mt-2 border-t border-slate-800 pt-2">
          <p className="text-slate-500">Output</p>
          <pre className="font-mono whitespace-pre-wrap text-slate-300">{output}</pre>
        </div>
      )}
    </div>
  )
}

export default RunConsole
