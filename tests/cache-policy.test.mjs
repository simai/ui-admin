import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';

// server.js serves release-id directories and Vite's hashed bundles with a
// year-long immutable cache and revalidates everything else. This test builds
// a small dist/ with both kinds of path and reads the header the server sends.

const serverEntry = resolve(import.meta.dirname, '..', 'server.js');
const IMMUTABLE = 'public, max-age=31536000, immutable';
const REVALIDATE = 'no-cache';

const files = {
  'index.html': '<!doctype html><title>admin</title>',
  'favicon.svg': '<svg xmlns="http://www.w3.org/2000/svg"/>',
  'distr/ui-d6f01121baca/core/js/core.min.js': '',
  'distr/ui-d6f01121baca/simai-assets.provenance.json': '{}',
  'distr/ui/core/js/core.min.js': '',
  'distr/ui-latest/core/js/core.min.js': '',
  'distr-pro/pro-a046f296acd0/rule.js': '',
  'distr-pro/pro-latest/rule.js': '',
  'distr-pro/ui-a046f296acd0/rule.js': '',
  'assets/admin-CQ2Csr3A.js': '',
  'assets/admin.js': '',
  'contracts/materialization.json': '{}',
};

const expected = {
  '/': REVALIDATE,
  '/index.html': REVALIDATE,
  '/tasks/42': REVALIDATE,
  '/favicon.svg': REVALIDATE,
  '/distr/ui-d6f01121baca/core/js/core.min.js': IMMUTABLE,
  '/distr/ui-d6f01121baca/simai-assets.provenance.json': IMMUTABLE,
  '/distr/ui/core/js/core.min.js': REVALIDATE,
  '/distr/ui-latest/core/js/core.min.js': REVALIDATE,
  '/distr-pro/pro-a046f296acd0/rule.js': IMMUTABLE,
  '/distr-pro/pro-latest/rule.js': REVALIDATE,
  '/distr-pro/ui-a046f296acd0/rule.js': REVALIDATE,
  '/assets/admin-CQ2Csr3A.js': IMMUTABLE,
  '/assets/admin.js': REVALIDATE,
  '/contracts/materialization.json': REVALIDATE,
};

let root;
let server;
let origin;
let output = '';

async function freePort() {
  const probe = createServer();
  await new Promise((done, fail) => {
    probe.once('error', fail);
    probe.listen(0, '127.0.0.1', done);
  });
  const { port } = probe.address();
  await new Promise((done) => probe.close(done));
  return port;
}

test.before(async () => {
  root = await mkdtemp(join(tmpdir(), 'simai-admin-cache-'));
  const dist = join(root, 'dist');
  for (const [path, body] of Object.entries(files)) {
    await mkdir(dirname(join(dist, path)), { recursive: true });
    await writeFile(join(dist, path), body);
  }
  const port = await freePort();
  origin = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, [serverEntry], {
    cwd: root,
    env: { ...process.env, PORT: String(port), SIMAI_DIST_DIR: dist, SIMAI_STATE_DIR: join(root, 'state') },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (chunk) => { output += chunk; });
  server.stderr.on('data', (chunk) => { output += chunk; });
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(`${origin}/api/field-types`)).ok) return;
    } catch {
      // still starting
    }
    await new Promise((done) => setTimeout(done, 100));
  }
  throw new Error(`server did not start:\n${output}`);
});

test.after(async () => {
  server?.kill();
  if (root) await rm(root, { recursive: true, force: true });
});

test('release-id directories and hashed bundles are immutable, the rest revalidates', async () => {
  for (const [path, header] of Object.entries(expected)) {
    const response = await fetch(`${origin}${path}`, { headers: { accept: 'text/html,*/*' } });
    await response.arrayBuffer();
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('cache-control'), header, path);
  }
});

test('a path with no release id never gets the long cache, even when missing', async () => {
  for (const path of ['/distr/ui/missing.js', '/distr/ui-latest/missing.js', '/distr-pro/pro/missing.js', '/distr/ui-d6f01121baca/missing.js']) {
    const response = await fetch(`${origin}${path}`, { headers: { accept: '*/*' } });
    await response.arrayBuffer();
    assert.notEqual(response.headers.get('cache-control'), IMMUTABLE, path);
  }
});
