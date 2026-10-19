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

  // sf-table is in package larena (Larena's components) since ui-09bc6b371eca, so it is not in the
  // Framework runtime at all; what this check is for is that the smoke test
  // does not start against a runtime nobody materialised, and both halves of
  // what the page loads have to be there for that to mean anything.
  const packageRoot = resolve(projectRoot, process.env.SIMAI_PACKAGE_RUNTIME_ROOT ?? '.runtime-package');
  await access(resolve(packageRoot, 'rule.js'));
  await access(resolve(packageRoot, 'table/js/table.js'));

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

// The polygon itself, for two defects the docs team found on it and no unit
// could see (docs review, 2026-10-19).
// - The menu's ⌘K palette is fixed inside the sticky menu column, and a sticky
//   box is a stacking context: the list's sticky head was painted over the
//   palette and its rows could not be clicked. The probe asks the browser what
//   is under the middle of every palette row.
// - One delete reached the host twice -- the data view applies row actions
//   itself and the page raised `record.mutate` again -- and the second answer,
//   «refused (record-unknown)», was shown to the person. The probe counts the
//   intents the host receives for one delete.
test(`Polygon palette is above the list and one delete is one intent (Vite ${mode})`, async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.stack || error.message));

  await page.goto(new URL('/', appOrigin).href, { waitUntil: 'networkidle' });
  await page.waitForFunction(
    () => document.querySelector('#solutions sf-table')?.getTableData?.().rows?.length > 0,
    null,
    { timeout: 20_000 },
  );

  await page.locator('sf-admin-menu [aria-haspopup="dialog"]').first().click();
  await page.keyboard.type('по');
  await page.waitForFunction(() => {
    const find = (root) => root.querySelector('.sf-admin-nav-palette-item')
      || [...root.querySelectorAll('*')].map((node) => node.shadowRoot && find(node.shadowRoot)).find(Boolean);
    return Boolean(find(document));
  }, null, { timeout: 10_000 });

  const palette = await page.evaluate(() => {
    const findAll = (root, selector) => [
      ...root.querySelectorAll(selector),
      ...[...root.querySelectorAll('*')].flatMap((node) => (node.shadowRoot ? findAll(node.shadowRoot, selector) : [])),
    ];
    const deepHit = (x, y) => {
      let hit = document.elementFromPoint(x, y);
      while (hit?.shadowRoot) {
        const inner = hit.shadowRoot.elementFromPoint(x, y);
        if (!inner || inner === hit) break;
        hit = inner;
      }
      return hit;
    };
    return findAll(document, '.sf-admin-nav-palette-field, .sf-admin-nav-palette-item').map((row) => {
      const box = row.getBoundingClientRect();
      const hit = deepHit(box.x + box.width / 2, box.y + box.height / 2);
      return { row: row.className, onTop: row.contains(hit), hit: hit ? `${hit.tagName}.${hit.className}` : null };
    });
  });
  assert.ok(palette.length >= 2, `the palette shows its field and a result: ${JSON.stringify(palette)}`);
  assert.deepEqual(palette.filter((row) => !row.onTop), [], 'every palette row is the topmost element under itself');
  await page.keyboard.press('Escape');

  const deletion = await page.evaluate(async () => {
    const list = document.querySelector('#solutions');
    const table = list.querySelector('sf-table') ?? list.shadowRoot?.querySelector('sf-table');
    const port = list.hostPort;
    const raised = [];
    const raise = port.raise;
    port.raise = async function (intent, payload, ...rest) {
      const answer = await raise.call(this, intent, payload, ...rest);
      if (intent === 'record.mutate') raised.push({ ids: payload.record_ids, answer: answer.answer, reason: answer.reason ?? null });
      return answer;
    };
    const target = list.records.find((record) => record.actions?.includes('delete')
      && !JSON.stringify(record).includes('Нет прав'));
    table.requestActionIntent('delete', [target.id]);
    await new Promise((settle) => setTimeout(settle, 1500));
    port.raise = raise;
    return {
      id: target.id,
      raised,
      gone: !list.records.some((record) => record.id === target.id),
      state: document.querySelector('#state')?.textContent ?? '',
      text: document.body.innerText,
    };
  });
  await page.close();

  assert.deepEqual(deletion.raised, [{ ids: [deletion.id], answer: 'applied', reason: null }], 'one delete is one record.mutate');
  assert.equal(deletion.gone, true);
  assert.equal(deletion.state, '');
  assert.doesNotMatch(deletion.text, /refused|record-unknown/);
  assert.deepEqual(pageErrors, []);
});
