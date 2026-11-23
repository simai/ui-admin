#!/usr/bin/env node
// Usage: node scripts/serve.mjs [--root build_production] [--port 8790]
//
// Serves the built site on http://127.0.0.1:<port>/ for local review, with the
// two headers a Docara build needs in a browser: Access-Control-Allow-Origin,
// because the live examples run in sandboxed frames (origin "null") that fetch
// the SIMAI Framework runtime and the set's files from this server, and a
// charset on text, so Russian pages read right. It is a review server, not a
// deployment: it binds to 127.0.0.1 only. Example frames lose their sandbox in the served pages, as scripts/publish-local.sh does.
import {createReadStream, existsSync, readFileSync, statSync} from 'node:fs';
import {createServer} from 'node:http';
import {extname, join, normalize, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const SITE = resolve(fileURLToPath(new URL('..', import.meta.url)));
const option = (name, fallback) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback);
const root = resolve(SITE, option('--root', 'build_production'));
const port = Number(option('--port', '8790'));
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webmanifest': 'application/manifest+json',
};

if (!existsSync(root)) throw new Error(`no build at ${root}: run scripts/build.sh first`);
createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');
  let path = normalize(join(root, decodeURIComponent(url.pathname)));
  if (path !== root && !path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
  if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html');
  const headers = {'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache'};
  if (!existsSync(path)) {
    const missing = join(root, '404.html');
    response.writeHead(404, {...headers, 'Content-Type': 'text/html; charset=utf-8'});
    if (existsSync(missing)) createReadStream(missing).pipe(response); else response.end('Not found');
    return;
  }
  const type = TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream';
  if (extname(path).toLowerCase() === '.html') {
    // Chromium's Local Network Access blocks every request from an opaque-origin
    // frame to 127.0.0.1, so the sandboxed example frames could not load the
    // runtime here; served locally they run without the sandbox (see
    // scripts/publish-local.sh). The build on disk is not changed.
    const page = readFileSync(path, 'utf8').replaceAll(' sandbox="allow-scripts"', '');
    response.writeHead(200, {...headers, 'Content-Type': type});
    response.end(page);
    return;
  }
  response.writeHead(200, {...headers, 'Content-Type': type});
  createReadStream(path).pipe(response);
}).listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}/`));
