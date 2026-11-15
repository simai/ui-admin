// An action's method takes its `with` fields as one object (standard §4.4),
// as SIMAI Framework ui-cb287da78ab1 writes it in the reference (ui-source
// 9d2eeb8e, tests/action-signatures.contract.test.mjs there). The package
// half: every editable folder's manifest names one args object, and where the
// class writes the method itself with the fields in order, the element is
// given the object form too -- by elementFromManifest's positional (core.runtime
// 1.43.0) or, for sf-message-log, whose class is the feed's, by its own
// objectForm. Narrowed to the set admin from simai/ui-pro (2ba35fa).
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
// The tests run in the overlay, which holds this set's src/smart.
const packageRoot = root;
const camel = (name) => name.replace(/-([a-z])/gu, (_, c) => c.toUpperCase());
const json = (folder, file) => JSON.parse(readFileSync(resolve(packageRoot, 'src/smart', folder, file), 'utf8'));
const source = (folder) => readFileSync(resolve(packageRoot, 'src/smart', folder, 'index.js'), 'utf8');
// The editable folders in the 1.4 form, whose manifest the generator writes
// (tests/package-component-files.contract.test.mjs, PHASE_A less the frozen
// ones). The 1.3 folders (editor-content and the mail folders) keep their
// converted manifests until they move to the 1.4 form.
const folders = ['admin-menu'];

test('every action with parameters is one args object in an editable folder\'s manifest', () => {
  let objects = 0;
  for (const folder of folders) {
    const component = json(folder, 'component.json');
    const calls = component['x-registry']?.['action-calls'] ?? {};
    const methods = json(folder, 'smart.manifest.json').methods ?? {};
    for (const [name, spec] of Object.entries(component.actions ?? {})) {
      const fields = Object.keys(spec?.with ?? {});
      const method = methods[camel(name)];
      if (!method) continue;
      if (!fields.length) { assert.deepEqual(method.arguments, [], `${folder}.${name}`); continue; }
      assert.notEqual(calls[name], 'positional', `${folder}.${name}: the runtime gives the object form; no method is positional only`);
      objects++;
      assert.equal(method.arguments.length, 1, `${folder}.${name}`);
      assert.equal(method.arguments[0].name, 'args', `${folder}.${name}`);
      assert.equal(method.arguments[0].type, calls[name] ?? 'object', `${folder}.${name}`);
      assert.deepEqual(Object.keys(method.arguments[0].schema.properties), fields.map(camel), `${folder}.${name}`);
    }
  }
  // sf-admin-menu alone: five actions with parameters (25 and more across the
  // pro package's folders before the move).
  assert.ok(objects >= 5, `${objects} actions with parameters`);
});

const positionalOf = (folder) => {
  const match = source(folder).match(/positional:\s*\[([^\]]*)\]/u);
  return match ? [...match[1].matchAll(/"([a-z-]+)"/gu)].map((m) => m[1]) : [];
};

test('a class-written method with the fields in order is given the object form', () => {
  for (const [folder, expected] of [
    ['admin-menu', ['apply-external-settings-state', 'apply-settings-result', 'apply-settings-error', 'set-search-results']],
  ]) {
    const actions = json(folder, 'component.json').actions;
    assert.deepEqual(positionalOf(folder), expected, folder);
    for (const name of expected) {
      assert.ok(Object.keys(actions[name]?.with ?? {}).length, `${folder}.${name} has parameters`);
      assert.match(source(folder), new RegExp(`\\n    (async )?${camel(name)}\\(`, 'u'), `${folder}: the class writes ${camel(name)}`);
    }
  }
});
