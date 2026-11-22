#!/usr/bin/env node
// Stage the npm package @simai-studio/admin from a released set build.
//
//   node scripts/stage-npm.mjs [--out DIR] [--check]
//
// The package is what jsDelivr would serve at
// https://cdn.jsdelivr.net/npm/@simai-studio/admin@<version>/:
//
//   dist/                 package/dist as the release route laid it: set.json,
//                         smart/ (rule.js and the three folders) and the
//                         package receipt
//   package.json, README.md, CHANGELOG.md, LICENSE.md
//
// It refuses a build whose passport is not set.json (the set changed and was
// not rebuilt). --check stages into a temporary folder and runs
// `npm pack --dry-run` on it. It publishes nothing: `npm publish` runs from the
// staged folder (paid sets publish on the public registry, owner 2026-11-05).
import {execFileSync} from 'node:child_process';
import {copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = resolve(PACKAGE, '..');
const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const check = args.includes('--check');
const out = check ? mkdtempSync(join(tmpdir(), 'admin-npm-')) : resolve(option('--out', join(PACKAGE, 'stage')));
const fail = (message) => { console.error(`STAGE_FAILED — ${message}`); process.exit(1); };

function copy(from, to) {
  mkdirSync(dirname(to), {recursive: true});
  copyFileSync(from, to);
}
function copyTree(from, to) {
  for (const name of readdirSync(from).sort()) {
    const source = join(from, name);
    if (statSync(source).isDirectory()) copyTree(source, join(to, name));
    else copy(source, join(to, name));
  }
}

const dist = join(PACKAGE, 'dist');
if (!existsSync(join(dist, 'smart', 'rule.js'))) fail('package/dist holds no build: run the release route first');
if (!existsSync(join(dist, 'set.json'))) fail('package/dist/set.json is missing');
const built = JSON.parse(readFileSync(join(dist, 'set.json'), 'utf8'));
const {release, ...source} = built;
if (JSON.stringify(source) !== JSON.stringify(JSON.parse(readFileSync(join(PACKAGE, 'set.json'), 'utf8')))) {
  fail('package/dist/set.json is not package/set.json: the set changed after its build');
}
const manifest = JSON.parse(readFileSync(join(PACKAGE, 'package.json'), 'utf8'));
if (manifest.simai?.base !== 'dist/smart') fail('package.json simai.base is not dist/smart');

rmSync(out, {recursive: true, force: true});
mkdirSync(out, {recursive: true});
copyTree(dist, join(out, 'dist'));
copy(join(PACKAGE, 'README.md'), join(out, 'README.md'));
copy(join(PACKAGE, 'CHANGELOG.md'), join(out, 'CHANGELOG.md'));
copy(join(ROOT, 'LICENSE.md'), join(out, 'LICENSE.md'));
// The staged manifest keeps the scripts out: they run in this repository only.
const {scripts, ...published} = manifest;
writeFileSync(join(out, 'package.json'), `${JSON.stringify(published, null, 2)}\n`);

if (check) {
  const packed = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json'], {cwd: out, encoding: 'utf8'}))[0];
  const names = new Set(packed.files.map((file) => file.path));
  for (const wanted of ['dist/set.json', 'dist/smart/rule.js', 'package.json', 'CHANGELOG.md', 'LICENSE.md']) {
    if (!names.has(wanted)) fail(`npm pack leaves out ${wanted}`);
  }
  console.log(JSON.stringify({package: `${packed.name}@${packed.version}`, files: packed.entryCount, size: packed.size, release: release?.id ?? null}));
  rmSync(out, {recursive: true, force: true});
} else {
  console.log(JSON.stringify({staged: out, package: `${manifest.name}@${manifest.version}`, release: release?.id ?? null}));
}
