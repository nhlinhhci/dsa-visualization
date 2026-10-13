import { getAvailableLanguages, runCode } from './runner.js'

const MAX_BODY_LENGTH = 100000

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > MAX_BODY_LENGTH) reject(new Error('Body too large'))
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(body))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data))
}

// Xử lý các route /api/*. Trả về false nếu request không thuộc API.
export async function handleApi(req, res) {
  const { pathname } = new URL(req.url, 'http://localhost')
  if (!pathname.startsWith('/api/')) return false

  try {
    if (pathname === '/api/health' && req.method === 'GET') {
      sendJson(res, 200, { languages: await getAvailableLanguages() })
    } else if (pathname === '/api/run' && req.method === 'POST') {
      sendJson(res, 200, await runCode(await readJson(req)))
    } else {
      sendJson(res, 404, { message: 'Not found' })
    }
  } catch (error) {
    sendJson(res, 500, { message: String(error?.message ?? error) })
  }
  return true
}
