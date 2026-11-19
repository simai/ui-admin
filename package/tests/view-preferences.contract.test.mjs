import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {join} from 'node:path';
import test from 'node:test';

// Split from simai/ui-pro components/tests/view-preferences.contract.test.mjs
// (2ba35fa), narrowed to the set admin: the data views moved to simai/ui-view.

// A component that keeps how it looks keeps it through SF.Preferences
// (owner, 2026-10-14): one store, written for the person when the host keeps
// preferences, read before the first paint. One exception, on its way out: the
// one-time reads of what a browser kept before the standard (the admin menu's
// older `items` menu, the other one, left in 1.15.0, AM-7).
const LEGACY = [
  {file: 'smart/admin-menu/js/navigation/controller.js', line: /rootMemoryKey\(\)/u, why: 'a root kept before the standard, taken over once'},
];

test('no component touches localStorage outside SF.Preferences', async () => {
  // The package's own components: the tests run in the overlay, where the
  // Framework's source lies under the same folder (its own contract checks it).
  const root = new URL('../src/', import.meta.url).pathname;
  const own = ['smart/admin-menu'];
  const offenders = [];
  const walk = async (dir) => {
    for (const entry of await readdir(dir, {withFileTypes: true})) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) { await walk(path); continue; }
      if (!/\.m?js$/u.test(entry.name)) continue;
      const relative = path.slice(root.length);
      const legacy = LEGACY.find((item) => item.file === relative);
      const lines = (await readFile(path, 'utf8')).split('\n')
        .filter((line) => /localStorage/u.test(line) && !/^\s*\/\//u.test(line))
        .filter((line) => !legacy || (legacy.line && !legacy.line.test(line)));
      if (legacy && !legacy.line) continue;
      if (lines.length) offenders.push(`${relative}: ${lines.length}`);
    }
  };
  for (const folder of own) await walk(join(root, folder));
  assert.deepEqual(offenders, []);
});

test('the menu keeps its view through SF.Preferences', async () => {
  const read = (file) => readFile(new URL(`../src/smart/${file}`, import.meta.url), 'utf8');
  const menu = await read('admin-menu/js/navigation/controller.js');
  assert.match(menu, /globalThis\.SF\?\.Preferences \|\| BundledPreferences/u, 'menu reads the shared store');
  assert.match(menu, /MENU_PREFERENCE = "sf-admin-menu\/main"/u);
});
