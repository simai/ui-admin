import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { defineConfig, type Connect, type Plugin } from 'vite'

const projectRoot = resolve()
const distrRoot = resolve('C:/Applications/SIMAI/sf5.webpack/distr')
const distrPrefix = '/distr'

const mimeTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
}

function mountDistr(): Plugin {
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const url = req.url?.split('?')[0]

    if (!url?.startsWith(`${distrPrefix}/`)) {
      next()
      return
    }

    const relativePath = decodeURIComponent(url.slice(distrPrefix.length + 1))
    const filePath = normalize(join(distrRoot, relativePath))

    if (!filePath.startsWith(`${distrRoot}${sep}`) || !existsSync(filePath)) {
      next()
      return
    }

    const stat = statSync(filePath)

    if (!stat.isFile()) {
      next()
      return
    }

    const contentType = mimeTypes[extname(filePath).toLowerCase()]

    res.setHeader('Cache-Control', 'no-store, max-age=0')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')

    if (contentType) {
      res.setHeader('Content-Type', contentType)
    }

    createReadStream(filePath).pipe(res)
  }

  return {
    name: 'mount-simai-distr',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

export default defineConfig({
  plugins: [mountDistr()],
  server: {
    proxy: {
      '/api': 'http://localhost:5001'
    },
    fs: {
      allow: [projectRoot, distrRoot],
    },
  },
})
