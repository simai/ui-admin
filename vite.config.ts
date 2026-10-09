import { createReadStream, existsSync, statSync } from 'node:fs'
import { cp, readFile, readdir, writeFile } from 'node:fs/promises'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite'
// @ts-expect-error -- plain JavaScript so the publish scripts and the checks
// can read the same module without a build step between them.
import { PLACEHOLDER, runtimeBase, runtimeDirectory, stamp } from './scripts/runtime-base.mjs'

const projectRoot = resolve()
const distrPrefix = '/distr'
const runtimeUrlBase: string = runtimeBase()
const runtimePairDirectory: string = runtimeDirectory()

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

    // Every page asks for the pair-stamped path, including in dev, so the one
    // thing that differs between dev and the published site is who sets the
    // headers -- not which URL the page asks for.
    const requested = decodeURIComponent(url.slice(distrPrefix.length + 1))
    const relativePath = requested.startsWith(`${runtimePairDirectory}/`)
      ? requested.slice(runtimePairDirectory.length + 1)
      : requested
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

// The pages and stylesheets are written with the placeholder; the pair's own id
// is put in at build time, in dev as well, so nothing drifts between them.
function stampRuntimeBase(): Plugin {
  return {
    name: 'stamp-simai-runtime-base',
    enforce: 'pre',
    transformIndexHtml(html) {
      return stamp(html, runtimeUrlBase)
    },
    transform(code, id) {
      if (!id.endsWith('.css') || !code.includes(PLACEHOLDER)) {
        return null
      }

      return { code: stamp(code, runtimeUrlBase), map: null }
    },
    // The polygon's dataset lives in data/ rather than public/, because Larena
    // is meant to read that file as a contract and a contract does not belong
    // among a site's assets. It is served from there in dev and copied into the
    // build, which is generated output like everything else under dist.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]

        if (!url?.startsWith('/data/')) {
          next()
          return
        }

        const file = normalize(join(resolve('data'), decodeURIComponent(url.slice('/data/'.length))))

        if (!file.startsWith(`${resolve('data')}${sep}`) || !existsSync(file)) {
          next()
          return
        }

        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store, max-age=0')
        createReadStream(file).pipe(res)
      })
    },
    // Pages under public/ are copied byte for byte and never reach
    // transformIndexHtml, so one of them kept asking for the unstamped path
    // after everything else had been stamped. Whatever is left in the built
    // output is stamped here, which also covers anything added to public/ later.
    async closeBundle() {
      const outputDirectory = resolve('dist')

      if (!existsSync(outputDirectory)) {
        return
      }

      await cp(resolve('data'), join(outputDirectory, 'data'), { recursive: true })

      for (const entry of await readdir(outputDirectory, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith('.html')) {
          continue
        }

        const file = join(outputDirectory, entry.name)
        const html = await readFile(file, 'utf8')

        if (html.includes(PLACEHOLDER)) {
          await writeFile(file, stamp(html, runtimeUrlBase))
        }
      }
    },
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
    env.SIMAI_PREVIEW_RUNTIME_ROOT || `dist/distr/${runtimePairDirectory}`,
  )
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5001'

  return {
    plugins: [stampRuntimeBase(), mountDistr(distrRoot, previewDistrRoot)],
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
          polygon: resolve(projectRoot, 'polygon.html'),
          workbench: resolve(projectRoot, 'workbench.html'),
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
