import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { chromium } from 'playwright-core';

const projectRoot = resolve(import.meta.dirname, '..');
const serverEntry = resolve(projectRoot, 'server.js');
const viteEntry = resolve(projectRoot, 'node_modules/vite/bin/vite.js');
// Where to find a browser. The list used to be two Windows paths and nothing
// else, so on a Mac this test threw «Chrome or Microsoft Edge is required»
// before it measured anything -- the reference's only browser check had never
// run here at all (owner, 2026-10-09).
//
// playwright-core is already a dependency and brings its own chromium, which is
// the browser every probe in the Framework measures with. It is asked first, so
// the same bytes are measured in both repositories; an installed Chrome or Edge
// still answers when it is not there.
const browserCandidates = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
];
const mode = process.env.ADMIN_BROWSER_MODE === 'preview' ? 'preview' : 'dev';

let temporaryRoot;
let apiProcess;
let viteProcess;
let browser;
let apiOrigin;
let appOrigin;
let browserPath;
let output = '';

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

function appendOutput(prefix, chunk) {
  output += `${prefix}${chunk}`;
}

async function findAvailablePort() {
  const probe = createServer();

  await new Promise((resolveListen, rejectListen) => {
    probe.once('error', rejectListen);
    probe.listen(0, '127.0.0.1', resolveListen);
  });
  const address = probe.address();
  const port = typeof address === 'object' && address ? address.port : null;
  await new Promise((resolveClose, rejectClose) => {
    probe.close((error) => (error ? rejectClose(error) : resolveClose()));
  });

  if (!port) {
    throw new Error('Unable to allocate a local port.');
  }

  return port;
}

async function waitFor(url, description) {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {
      // The process is still starting.
    }

    await delay(100);
  }

  throw new Error(`${description} did not start. Output:\n${output}`);
}

async function stopProcess(process) {
  if (!process || process.exitCode !== null || process.killed) {
    return;
  }

  process.kill();
  await once(process, 'exit');
}

async function runProductionBuild() {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const buildProcess = spawn(npmCommand, ['run', 'build'], {
    cwd: projectRoot,
    env: process.env,
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  buildProcess.stdout.on('data', (chunk) => appendOutput('[production build] ', chunk));
  buildProcess.stderr.on('data', (chunk) => appendOutput('[production build] ', chunk));

  const [exitCode] = await once(buildProcess, 'exit');

  if (exitCode !== 0) {
    throw new Error(`Strict production build failed. Output:\n${output}`);
  }
}

async function readRuntimeRoot() {
  if (process.env.SIMAI_RUNTIME_ROOT) {
    const runtimeRoot = resolve(projectRoot, process.env.SIMAI_RUNTIME_ROOT);
    await access(resolve(runtimeRoot, 'core/js/core.js'));
    await access(resolve(runtimeRoot, 'smart/table/js/table.js'));

    return runtimeRoot;
  }

  // `.env` is a developer's local override and most machines do not have one:
  // reading it unconditionally threw ENOENT before the test measured anything.
  // The runtime this repository materialises for itself is the one to measure,
  // and `.env` only moves it elsewhere (owner, 2026-10-09).
  let value = '';
  try {
    const env = await readFile(resolve(projectRoot, '.env'), 'utf8');
    const line = env
      .split(/\r?\n/)
      .find((entry) => entry.trim().startsWith('SIMAI_RUNTIME_ROOT='));
    value = line?.split('=').slice(1).join('=').trim().replace(/^['"]|['"]$/g, '') ?? '';
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  if (!value) value = '.runtime';

  const runtimeRoot = resolve(projectRoot, value);
  await access(resolve(runtimeRoot, 'core/js/core.js'));
  await access(resolve(runtimeRoot, 'smart/table/js/table.js'));

  return runtimeRoot;
}

async function resolveBrowserPath() {
  try {
    const bundled = chromium.executablePath();
    if (bundled) {
      await access(bundled);
      return bundled;
    }
  } catch {
    // No bundled browser; fall through to whatever this machine has installed.
  }
  for (const candidate of browserCandidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next locally installed browser.
    }
  }

  throw new Error(
    'No browser for the smoke test: playwright-core has none installed '
    + '(`npx playwright install chromium`) and neither Chrome nor Edge is in the usual places.',
  );
}

test.before(async () => {
  browserPath = await resolveBrowserPath();
  const runtimeRoot = await readRuntimeRoot();
  const apiPort = await findAvailablePort();
  const vitePort = await findAvailablePort();

  temporaryRoot = await mkdtemp(join(tmpdir(), 'simai-admin-browser-smoke-'));
  apiOrigin = `http://127.0.0.1:${apiPort}`;
  appOrigin = `http://127.0.0.1:${vitePort}`;
  apiProcess = spawn(process.execPath, [serverEntry], {
    cwd: temporaryRoot,
    env: { ...process.env, PORT: String(apiPort) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  apiProcess.stdout.on('data', (chunk) => appendOutput('[api] ', chunk));
  apiProcess.stderr.on('data', (chunk) => appendOutput('[api] ', chunk));
  await waitFor(`${apiOrigin}/api/field-types`, 'Mock API');

  if (mode === 'preview') {
    await runProductionBuild();
  }

  const viteArguments = mode === 'preview'
    ? [viteEntry, 'preview', '--host', '127.0.0.1', '--port', String(vitePort), '--strictPort']
    : [viteEntry, '--host', '127.0.0.1', '--port', String(vitePort), '--strictPort'];

  viteProcess = spawn(process.execPath, viteArguments, {
    cwd: projectRoot,
    env: {
      ...process.env,
      SIMAI_RUNTIME_ROOT: runtimeRoot,
      VITE_API_PROXY_TARGET: apiOrigin,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  viteProcess.stdout.on('data', (chunk) => appendOutput('[vite] ', chunk));
  viteProcess.stderr.on('data', (chunk) => appendOutput('[vite] ', chunk));
  await waitFor(`${appOrigin}/`, 'Vite');

  browser = await chromium.launch({
    executablePath: browserPath,
    headless: true,
  });
});

test.after(async () => {
  await browser?.close();
  await stopProcess(viteProcess);
  await stopProcess(apiProcess);

  if (temporaryRoot) {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test(`Admin loads sf-table data through Vite ${mode} and mock API`, async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const pageErrors = [];
  const failedRequests = [];

  page.on('pageerror', (error) => pageErrors.push(error.stack || error.message));
  page.on('requestfailed', (request) => failedRequests.push(request.url()));

  // The page that drives the components over HTTP, which is this test's
  // subject. It used to be the index; the index is the polygon now, and the
  // polygon answers from a host in the page and would make this test pass
  // while proving nothing about the transport.
  await page.goto(new URL('/mock-api.html', appOrigin).href, { waitUntil: 'networkidle' });

  try {
    await page.waitForFunction(() => {
      const table = document.querySelector('sf-table');

      return Boolean(
        customElements.get('sf-table') &&
          table?.getTableData?.().rows?.length,
      );
    });
  } catch (error) {
    const tableState = await page.evaluate(() => {
      const table = document.querySelector('sf-table');

      return {
        defined: Boolean(customElements.get('sf-table')),
        rows: table?.getTableData?.().rows?.length || 0,
        columns: table?.getColumns?.().length || 0,
      };
    });

    throw new Error(
      `Table did not load. State: ${JSON.stringify(tableState)}. ` +
      `Page errors: ${JSON.stringify(pageErrors)}. ` +
      `Failed requests: ${JSON.stringify(failedRequests)}. Cause: ${error.message}`,
    );
  }

  const state = await page.evaluate(() => {
    const table = document.querySelector('sf-table');
    const data = table?.getTableData?.() || {};

    return {
      componentDefined: Boolean(customElements.get('sf-table')),
      rows: data.rows?.length || 0,
      columns: table?.getColumns?.().length || 0,
      apiRequests: performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .filter((url) => url.includes('/api/tasks')).length,
    };
  });

  await page.screenshot({ path: join(temporaryRoot, 'admin-browser-smoke.png') });
  await page.close();

  assert.equal(state.componentDefined, true);
  assert.ok(state.rows > 0);
  assert.ok(state.columns > 0);
  assert.ok(state.apiRequests > 0);
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(failedRequests, []);
});
