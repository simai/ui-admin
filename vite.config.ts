import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite'

const projectRoot = resolve()
const distrPrefix = '/distr'

const mimeTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
}

function createDistrMiddleware(distrRoot: string): Connect.NextHandleFunction {
  return (req, res, next) => {
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

}

function mountDistr(
  developmentDistrRoot: string,
  previewDistrRoot: string,
): Plugin {
  const developmentMiddleware = createDistrMiddleware(developmentDistrRoot)
  const previewMiddleware = createDistrMiddleware(previewDistrRoot)

  return {
    name: 'mount-simai-distr',
    configureServer(server) {
      server.middlewares.use(developmentMiddleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(previewMiddleware)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, '')
  const distrRoot = resolve(env.SIMAI_RUNTIME_ROOT || '.runtime')
  const previewDistrRoot = resolve(
    env.SIMAI_PREVIEW_RUNTIME_ROOT || 'dist/distr',
  )
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5001'

  return {
    plugins: [mountDistr(distrRoot, previewDistrRoot)],
    build: {
      rollupOptions: {
        input: {
          admin: resolve(projectRoot, 'index.html'),
          navigationMenuReference: resolve(
            projectRoot,
            'navigation-menu-reference.html',
          ),
          smartComponentCatalog: resolve(
            projectRoot,
            'smart-component-catalog.html',
          ),
        },
      },
    },
    server: {
      proxy: {
        '/api': apiProxyTarget,
      },
      fs: {
        allow: [projectRoot, distrRoot],
      },
    },
    preview: {
      proxy: {
        '/api': apiProxyTarget,
      },
    },
  }
})
