// Gửi code của sinh viên lên server để chạy thật và nhận về danh sách step.
// `target` chỉ cần cho thuật toán tìm kiếm. Luôn trả về
// { steps, finalArray, result, output, error } — lỗi mạng cũng được quy về `error`.
export async function runCode({ algorithm, language, code, array, target }) {
  try {
    const response = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ algorithm, language, code, array, target }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  } catch (error) {
    return {
      steps: [],
      finalArray: null,
      result: null,
      output: '',
      error: {
        type: 'setup',
        line: null,
        message: `Không kết nối được server chạy code. Hãy chạy ứng dụng bằng \`npm run dev\` hoặc \`npm start\`.\n${error.message ?? ''}`.trim(),
      },
    }
  }
}
