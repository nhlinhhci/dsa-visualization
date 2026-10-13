import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { handleApi } from './server/api.js'

// Gắn API chạy code (/api/*) vào dev server và preview server của Vite.
function codeRunnerApi() {
  const middleware = (req, res, next) => {
    handleApi(req, res).then((handled) => {
      if (!handled) next()
    }, next)
  }
  return {
    name: 'code-runner-api',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), codeRunnerApi()],
})
