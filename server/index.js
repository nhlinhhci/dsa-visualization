// Server production: phục vụ API chạy code và các file tĩnh trong `dist/` (sau `npm run build`).
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleApi } from './api.js'

const DIST_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const PORT = Number(process.env.PORT) || 3001
// Mặc định chỉ nghe trên máy này vì server chạy code tùy ý do người dùng gửi lên.
const HOST = process.env.HOST || '127.0.0.1'

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
}

async function serveStatic(req, res) {
  const { pathname } = new URL(req.url, 'http://localhost')
  let filePath = path.join(DIST_DIR, path.normalize(decodeURIComponent(pathname)))
  if (!filePath.startsWith(DIST_DIR)) filePath = DIST_DIR
  const isFile = await stat(filePath).then(
    (s) => s.isFile(),
    () => false,
  )
  if (!isFile) filePath = path.join(DIST_DIR, 'index.html')
  res.setHeader('Content-Type', CONTENT_TYPES[path.extname(filePath)] ?? 'application/octet-stream')
  createReadStream(filePath)
    .on('error', () => {
      res.statusCode = 404
      res.end('Not found. Run `npm run build` first.')
    })
    .pipe(res)
}

createServer(async (req, res) => {
  if (!(await handleApi(req, res))) await serveStatic(req, res)
}).listen(PORT, HOST, () => {
  console.log(`DSA Visualizer server: http://${HOST}:${PORT}`)
})
