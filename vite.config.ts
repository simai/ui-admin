import { createReadStream, existsSync, statSync } from 'node:fs'
import { cp, readFile, readdir, writeFile } from 'node:fs/promises'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite'
// @ts-expect-error -- plain JavaScript so the publish scripts and the checks
// can read the same module without a build step between them.
import { distributions, runtimeDirectory, stampAll, unstamped } from './scripts/runtime-base.mjs'

type Distribution = {
  name: string
  placeholder: string
  directory: string
  base: string
}

const projectRoot = resolve()
const served: Distribution[] = distributions()
const runtimePairDirectory: string = runtimeDirectory()

const mimeTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
}

function createDistrMiddleware(
  prefix: string,
  directory: string,
  distrRoot: string,
): Connect.NextHandleFunction {
  return (req, res, next) => {
    const url = req.url?.split('?')[0]

    if (!url?.startsWith(prefix)) {
      next()
      return
    }

    // Every page asks for the release-stamped path, including in dev, so the
    // one thing that differs between dev and the published site is who sets
    // the headers -- not which URL the page asks for.
    const requested = decodeURIComponent(url.slice(prefix.length))
    const relativePath = requested.startsWith(`${directory}/`)
      ? requested.slice(directory.length + 1)
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
      return stampAll(html, served)
    },
    transform(code, id) {
      if (!id.endsWith('.css') || unstamped(code, served).length === 0) {
        return null
      }

      return { code: stampAll(code, served), map: null }
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

        if (unstamped(html, served).length > 0) {
          await writeFile(file, stampAll(html, served))
        }
      }
    },
  }
}

// Every distribution is mounted, not just the Framework. A site that served
// one of them in dev would answer the Pro base with the index page and the
// Loader would fail on `rule.js` that parses as HTML -- a confusing way to find
// out that a mount was forgotten.
function mountDistr(
  developmentRoots: Map<string, string>,
  previewRoots: Map<string, string>,
): Plugin {
  const middlewares = (roots: Map<string, string>) =>
    served.map((one) =>
      createDistrMiddleware(one.placeholder, one.directory, roots.get(one.name) as string),
    )

  return {
    name: 'mount-simai-distr',
    configureServer(server) {
      for (const middleware of middlewares(developmentRoots)) {
        server.middlewares.use(middleware)
      }
    },
    configurePreviewServer(server) {
      for (const middleware of middlewares(previewRoots)) {
        server.middlewares.use(middleware)
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, '')
  const distrRoot = resolve(env.SIMAI_RUNTIME_ROOT || '.runtime')
  // The component package's runtime in dev: materialised there by
  // prepare:runtime, or pointed elsewhere to try a package build by hand.
  const packageRoot = resolve(env.SIMAI_PACKAGE_RUNTIME_ROOT || '.runtime-package')
  const previewDistrRoot = resolve(
    env.SIMAI_PREVIEW_RUNTIME_ROOT || `dist/distr/${runtimePairDirectory}`,
  )
  const developmentRoots = new Map<string, string>([
    ['framework', distrRoot],
    ...served
      .filter((one) => one.name !== 'framework')
      .map((one) => [one.name, packageRoot] as [string, string]),
  ])
  const previewRoots = new Map<string, string>([
    ['framework', previewDistrRoot],
    ...served
      .filter((one) => one.name !== 'framework')
      .map((one) => [one.name, resolve(`dist${one.placeholder}${one.directory}`)] as [string, string]),
  ])
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5001'

  return {
    plugins: [stampRuntimeBase(), mountDistr(developmentRoots, previewRoots)],
    build: {
      rollupOptions: {
        input: {
          // The index is the polygon: it is the page this repository exists
          // for, and the first one a reader opens. What used to be here -- the
          // list driven over HTTP by the mock API -- is kept at its own
          // address, because it is the only page that exercises the transport.
          admin: resolve(projectRoot, 'index.html'),
          mockApi: resolve(projectRoot, 'mock-api.html'),
          navigationMenuReference: resolve(
            projectRoot,
            'navigation-menu-reference.html',
          ),
          smartComponentCatalog: resolve(
            projectRoot,
            'smart-component-catalog.html',
          ),
          workbench: resolve(projectRoot, 'workbench.html'),
        },
      },
    },
    server: {
      proxy: {
        '/api': apiProxyTarget,
      },
      fs: {
        allow: [projectRoot, distrRoot, packageRoot],
      },
    },
    preview: {
      proxy: {
        '/api': apiProxyTarget,
      },
    },
  }
})
