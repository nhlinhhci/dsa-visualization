// Gửi code của sinh viên lên server để chạy thật và nhận về danh sách step.
// `target` (giá trị tìm / chèn / xóa) và `position` (vị trí trong danh sách liên kết) chỉ cần với
// thuật toán dùng tới chúng. Luôn trả về { steps, finalArray, result, resultNode, output, error }
// — lỗi mạng cũng được quy về `error`.
export async function runCode({ algorithm, language, code, array, target, position }) {
  try {
    const response = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ algorithm, language, code, array, target, position }),
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
