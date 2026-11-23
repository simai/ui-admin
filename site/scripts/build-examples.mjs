#!/usr/bin/env node
// Writes assets/admin-demo.js into every live example that uses the demo host
// (its index.html loads «assets/admin-demo.js»). A Docara example is published
// with its own folder only, so each one holds the same file.
//
// The file is one classic script, so it loads in a sandboxed example frame
// without CORS: the repository's demo host (../src/ports/navigation-host.mjs,
// its export dropped), the demo data (config/demo-panel.json) and the kit
// (scripts/example-kit/kit.js) that makes window.AdminDemo of them.
//
// Usage: node site/scripts/build-examples.mjs [--check]
import {existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {dirname, join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const read = (path) => readFileSync(join(site, path), 'utf8');

const hostSource = readFileSync(join(site, '../src/ports/navigation-host.mjs'), 'utf8');
const exported = 'export function createNavigationHost(';
if (!hostSource.includes(exported)) throw new Error('build-examples: createNavigationHost is not exported by src/ports/navigation-host.mjs');
if (/^\s*(?:import|export)\b/mu.test(hostSource.replace(exported, 'function createNavigationHost('))) {
  throw new Error('build-examples: src/ports/navigation-host.mjs has another import or export; the classic script cannot carry it');
}
const data = JSON.parse(read('config/demo-panel.json'));
const kit = read('scripts/example-kit/kit.js');

const bundle = [
  '/* Written by site/scripts/build-examples.mjs from src/ports/navigation-host.mjs, site/config/demo-panel.json',
  '   and site/scripts/example-kit/kit.js. Demo only: a real page answers these requests from its own server. */',
  '(function () {',
  '\'use strict\';',
  hostSource.replace(exported, 'function createNavigationHost(').trim(),
  '',
  `const DATA = ${JSON.stringify(data)};`,
  '',
  kit.trim(),
  '})();',
  '',
].join('\n');

const walk = (directory) => readdirSync(directory, {withFileTypes: true})
  .flatMap((entry) => (entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]));
const users = walk(join(site, 'examples'))
  .filter((path) => path.endsWith('/index.html') && readFileSync(path, 'utf8').includes('src="assets/admin-demo.js"'))
  .map((path) => dirname(path));

let stale = 0;
for (const folder of users) {
  const target = join(folder, 'assets/admin-demo.js');
  const now = existsSync(target) ? readFileSync(target, 'utf8') : null;
  if (now === bundle) continue;
  stale += 1;
  if (check) {
    console.error(`stale: ${relative(site, target)}`);
    continue;
  }
  mkdirSync(dirname(target), {recursive: true});
  writeFileSync(target, bundle);
}
// A copy left in an example that no longer loads it.
for (const path of walk(join(site, 'examples')).filter((one) => one.endsWith('/assets/admin-demo.js'))) {
  if (!users.includes(dirname(dirname(path)))) {
    stale += 1;
    console.error(`unused: ${relative(site, path)}`);
  }
}
console.log(JSON.stringify({examples: users.length, changed: stale}));
if (check && stale) process.exit(1);
