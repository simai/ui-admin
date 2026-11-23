// A page of the set on the built bytes with the real Loader, as a consumer's
// page declares it: core.css, the Russian words, core.js, the set admin at
// /distr/smart (tests/browser/package-manifest-probes.browser.mjs boots the
// same way). Shared by the shell, notifications and activity probes; not a
// probe itself (its name does not end in .browser.mjs).
//
// lab(out) serves the output root (core/core, component/component,
// smart/smart, utility/utility) on 127.0.0.1 and gives open(body, options):
//   width, height   the viewport (1440 x 900 by default)
//   theme           light | dark
//   slow            {pattern: RegExp, ms}: hold the files that match
//   head            more markup for <head>
// The page it opens collects console errors and warnings and page errors in
// page.noise.
import {createServer} from 'node:http';
import {existsSync, readFileSync, statSync} from 'node:fs';
import {extname, join, resolve} from 'node:path';
import {chromium} from 'playwright';

const TYPES = {'.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.html': 'text/html'};

export async function lab(root) {
  if (!root) throw new Error('Build output root is required');
  const out = resolve(root);
  const parts = {core: join(out, 'core', 'core'), rule: join(out, 'core', 'rule'), component: join(out, 'component', 'component'), smart: join(out, 'smart', 'smart'), utility: join(out, 'utility', 'utility')};
  for (const [name, path] of Object.entries(parts)) if (!existsSync(path)) throw new Error(`${name} not found under ${out}`);
  const rule = readFileSync(join(parts.smart, 'rule.js'), 'utf8');
  const registered = /registerPackage\(\s*["']([a-z][a-z0-9-]*)["']/u.exec(rule)?.[1] ?? 'admin';
  const pages = new Map();
  let slow = null;
  const server = createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url, 'http://lab').pathname);
    if (pages.has(path)) {
      response.writeHead(200, {'content-type': 'text/html; charset=utf-8'});
      return response.end(pages.get(path));
    }
    const match = path.match(/^\/distr\/([^/]+)\/(.+)$/u);
    const file = match && parts[match[1]] ? join(parts[match[1]], match[2]) : '';
    if (!file || !existsSync(file) || statSync(file).isDirectory()) {
      response.writeHead(404);
      return response.end();
    }
    const charset = ['.js', '.mjs', '.css', '.json', '.svg', '.html'].includes(extname(file)) ? '; charset=utf-8' : '';
    const send = () => {
      response.writeHead(200, {'content-type': `${TYPES[extname(file)] ?? 'application/octet-stream'}${charset}`, 'cache-control': 'no-store'});
      response.end(readFileSync(file));
    };
    if (slow && slow.pattern.test(path)) setTimeout(send, slow.ms);
    else send();
  }).listen(0, '127.0.0.1');
  await new Promise((settle) => server.once('listening', settle));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({channel: process.env.LAB_CHANNEL || undefined, ignoreDefaultArgs: ['--hide-scrollbars']});
  let count = 0;

  const open = async (body, options = {}) => {
    const {width = 1440, height = 900, theme = 'light', head = ''} = options;
    slow = options.slow ?? null;
    const path = `/page-${++count}`;
    pages.set(path, `<!doctype html><html lang="ru" class="theme-${theme}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>window.sfPath='/distr/';window.sfSmartPath='/distr/';window.SF_BOOT_CONFIG={preloader:{enabled:false},packages:{${registered}:{base:'/distr/smart'}}};</script>
<link rel="stylesheet" href="/distr/core/css/core.css">
<script src="/distr/core/lang/ru.js"></script>
<script src="/distr/core/js/core.js"></script>${head}</head><body style="margin:0">
${body}
</body></html>`);
    const context = await browser.newContext({locale: 'ru-RU', viewport: {width, height}, colorScheme: theme});
    const page = await context.newPage();
    page.noise = [];
    page.on('console', (message) => {
      if (['error', 'warning'].includes(message.type())) page.noise.push(`${message.type()}: ${message.text()}`);
    });
    page.on('pageerror', (error) => page.noise.push(`pageerror: ${error?.message ?? error}`));
    if (options.beforeLoad) await options.beforeLoad(page);
    await page.goto(`${base}${path}`);
    page.closeAll = () => context.close();
    return page;
  };

  // Waits until every named tag is defined and drawn (its style gate is off).
  const ready = (page, tags, timeout = 20000) => page.waitForFunction((names) => names.every((tag) => {
    if (!customElements.get(tag)) return false;
    return [...document.querySelectorAll(tag)].every((host) => !host.hasAttribute('data-sf-style-pending'));
  }), tags, {timeout});

  const close = async () => {
    await browser.close();
    server.close();
  };
  return {open, ready, close, base};
}

// A probe's end: the failures, or the line that says what held.
export function finish(failures, said) {
  if (failures.length) {
    console.error(failures.join('\n'));
    process.exit(1);
  }
  console.log(said);
}
