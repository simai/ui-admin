import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const projectRoot = resolve(import.meta.dirname, '..');
const serverEntry = resolve(projectRoot, 'server.js');

let temporaryRoot;
let server;
let serverOutput = '';
let origin;

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
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
    throw new Error('Unable to allocate a local port for the mock API.');
  }

  return port;
}

async function request(path, init) {
  const response = await fetch(`${origin}${path}`, init);
  const body = await response.json();

  return { response, body };
}

async function waitForServer() {
  // A loaded machine took 77 s to start the mock API (2026-10-19); the wait
  // ends as soon as the server answers, so a long deadline costs nothing.
  const deadline = Date.now() + 180_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${origin}/api/field-types`);

      if (response.ok) {
        return;
      }
    } catch {
      // The process is still starting.
    }

    await delay(100);
  }

  throw new Error(`Mock API did not start. Output:\n${serverOutput}`);
}

test.before(async () => {
  temporaryRoot = await mkdtemp(join(tmpdir(), 'simai-admin-api-contract-'));
  const port = await findAvailablePort();
  origin = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, [serverEntry], {
    cwd: temporaryRoot,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (chunk) => {
    serverOutput += chunk;
  });
  server.stderr.on('data', (chunk) => {
    serverOutput += chunk;
  });

  await waitForServer();
});

test.after(async () => {
  if (server && !server.killed) {
    server.kill();
    await once(server, 'exit');
  }

  if (temporaryRoot) {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test('mock API satisfies the Admin table transport contract', async (t) => {
  const tableId = 'api_contract';

  await t.test('list, pagination, search and settings expose table state', async () => {
    const list = await request(`/api/tasks?page=2&limit=5&tableId=${tableId}`);

    assert.equal(list.response.status, 200);
    assert.equal(list.body.items.length, 5);
    assert.equal(list.body.pagination.page, 2);
    assert.equal(list.body.pagination.limit, 5);
    assert.ok(Array.isArray(list.body.columns));
    assert.ok(Array.isArray(list.body.fields));
    assert.ok(Array.isArray(list.body.fieldTypes));
    assert.ok(list.body.viewSettings);

    const firstItem = list.body.items[0];
    const filters = encodeURIComponent(
      JSON.stringify({ id: { operator: 'eq', value: firstItem.id } }),
    );
    const filtered = await request(
      `/api/tasks?tableId=${tableId}&filters=${filters}`,
    );
    assert.equal(filtered.response.status, 200);
    assert.deepEqual(
      filtered.body.items.map((item) => item.id),
      [firstItem.id],
    );

    const search = encodeURIComponent(String(firstItem.creator.name));
    const searched = await request(`/api/tasks?tableId=${tableId}&search=${search}`);
    assert.equal(searched.response.status, 200);
    assert.ok(searched.body.items.some((item) => item.id === firstItem.id));

    const settings = await request(`/api/settings/get?tableId=${tableId}`);
    assert.equal(settings.response.status, 200);
    assert.ok(Array.isArray(settings.body.templates));
    assert.ok(settings.body.viewSettings);

    const savedSettings = await request(`/api/view-settings/${tableId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: { columns: { id: { visible: false } } },
      }),
    });
    assert.equal(savedSettings.response.status, 200);
    assert.equal(savedSettings.body.success, true);
    assert.equal(savedSettings.body.item.table.columns.id.visible, false);
  });

  await t.test('templates and task detail use the documented payloads', async () => {
    const template = await request('/api/template/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'api-contract-template',
        label: 'API contract template',
        data: { values: { status: { value: 1 } } },
      }),
    });
    assert.equal(template.response.status, 200);
    assert.equal(template.body.success, true);
    assert.equal(template.body.item.key, 'api-contract-template');

    const list = await request(`/api/tasks?page=1&limit=1&tableId=${tableId}`);
    const taskId = list.body.items[0].id;
    const detail = await request(`/api/tasks/${taskId}?tableId=${tableId}`);

    assert.equal(detail.response.status, 200);
    assert.equal(detail.body.entity, 'task');
    assert.equal(detail.body.item.id, taskId);
    assert.ok(Array.isArray(detail.body.fields));
  });

  await t.test('task CRUD accepts JSON and multipart payloads', async () => {
    const created = await request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableSettingsKey: tableId,
        values: { title: 'API contract task', code: 'api.contract' },
        fields: [],
      }),
    });
    assert.equal(created.response.status, 200);
    assert.equal(created.body.success, true);

    const taskId = created.body.item.id;
    assert.ok(taskId);

    const updated = await request(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableSettingsKey: tableId,
        values: { code: 'api.contract.updated' },
        fields: [],
      }),
    });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.body.item.id, taskId);

    const multipart = new FormData();
    multipart.append(
      'payload',
      JSON.stringify({ tableSettingsKey: tableId, values: {}, fields: [] }),
    );
    multipart.append(
      'files.values.contract.file',
      new Blob(['contract fixture'], { type: 'text/plain' }),
      'contract.txt',
    );
    const multipartUpdate = await request(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      body: multipart,
    });
    assert.equal(multipartUpdate.response.status, 200);
    assert.equal(multipartUpdate.body.item.id, taskId);

    const deleted = await request(`/api/tasks/${taskId}?tableId=${tableId}`, {
      method: 'DELETE',
    });
    assert.equal(deleted.response.status, 200);
    assert.equal(deleted.body.deletedId, taskId);

    const missing = await request(`/api/tasks/${taskId}?tableId=${tableId}`);
    assert.equal(missing.response.status, 404);
    assert.equal(missing.body.success, false);
  });

  await t.test('custom-field CRUD returns schema and current view settings', async () => {
    const created = await request(`/api/tasks/fields?tableId=${tableId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableSettingsKey: tableId,
        fieldType: 'text',
        settings: { label: 'API contract field' },
      }),
    });
    assert.equal(created.response.status, 200);
    assert.equal(created.body.success, true);
    assert.ok(created.body.item.key);
    assert.ok(Array.isArray(created.body.fields));
    assert.ok(Array.isArray(created.body.columns));

    const fieldKey = created.body.item.key;
    const updated = await request(
      `/api/tasks/fields/${encodeURIComponent(fieldKey)}?tableId=${tableId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableSettingsKey: tableId,
          settings: { label: 'API contract field updated' },
        }),
      },
    );
    assert.equal(updated.response.status, 200);
    assert.equal(updated.body.success, true);

    const deleted = await request(
      `/api/tasks/fields/${encodeURIComponent(fieldKey)}?tableId=${tableId}`,
      { method: 'DELETE' },
    );
    assert.equal(deleted.response.status, 200);
    assert.equal(deleted.body.success, true);
    assert.ok(Array.isArray(deleted.body.fields));
  });
});
