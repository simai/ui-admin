#!/usr/bin/env node
// Usage: node scripts/check-polygon.mjs
//
// Is the polygon still a polygon?
//
// Three questions, and each one has already been answered wrongly here at least
// once:
//
//   1. Does the dataset still use every property type the Framework renders?
//      The old reference used six of fifteen, so nine renderers were shipped
//      without anyone having looked at one. The list of types is read out of the
//      shipped renderer set, so a type added to the Framework makes this fail
//      until the polygon shows it.
//   2. Is every one of those types on screen in the list as well as in the
//      record panel? Two cell renderers drew nothing at all for as long as they
//      had existed, and only a column could show it.
//   3. Does the host answer both ports the way the kits say a host answers?
//      A fixture that answers «applied» to everything is a drawing of a host.
//
// The kits are catalogues rather than scenarios -- two cases for one intent can
// expect different answers from the same input -- so this checks the same three
// things check-port-conformance.mjs does: every intent answered, every declared
// (intent, answer) reachable, and each answer carrying what the kit requires.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createPolygonHost } from '../src/ports/polygon-host.mjs';
import { projectRoot } from './runtime-base.mjs';

const runtime = resolve(projectRoot, process.env.SIMAI_RUNTIME_ROOT ?? '.runtime');
const dataset = JSON.parse(readFileSync(resolve(projectRoot, 'data/polygon.json'), 'utf8'));
const failures = [];

// ─── 1 and 2: the types ───────────────────────────────────────────────────────

// Read out of the bytes that ship rather than restated here: a list written
// down in this repository would be a list of what somebody remembered.
const rendererSource = join(runtime, 'smart/field-renderers/js/field-renderers.js');
if (!existsSync(rendererSource)) {
  process.stderr.write(`no renderer set under ${rendererSource} — run \`npm run prepare:runtime\` first\n`);
  process.exit(2);
}
const source = readFileSync(rendererSource, 'utf8');
const viewMap = source.match(/VIEW_RENDERERS\s*=\s*\{([^}]*)\}/u);
if (!viewMap) {
  failures.push({ said: 'the shipped renderer set no longer declares VIEW_RENDERERS, so the type list cannot be read from it' });
}
const frameworkTypes = new Set(
  [...(viewMap?.[1] ?? '').matchAll(/([a-z][a-z0-9-]*)\s*:/gu)].map(([, name]) => name),
);

const fieldTypes = new Set((dataset.structure.fields ?? []).map((field) => field.property_type));
const columnTypes = new Set((dataset.structure.list.columns ?? [])
  .map((column) => (dataset.structure.fields ?? []).find((field) => field.key === column.key)?.property_type)
  .filter(Boolean));

for (const type of frameworkTypes) {
  if (!fieldTypes.has(type)) {
    failures.push({ type, said: 'the Framework renders this property type and the polygon has no field of it' });
  }
  if (!columnTypes.has(type)) {
    failures.push({ type, said: 'the polygon has a field of this type and no column of it, so its cell renderer is not on screen' });
  }
}
for (const type of fieldTypes) {
  if (!frameworkTypes.has(type)) {
    failures.push({ type, said: "the polygon declares this property type and the Framework's renderer set does not know it" });
  }
}

// A type with no value anywhere is a type nobody can look at either.
for (const field of dataset.structure.fields ?? []) {
  const filled = dataset.records.some((record) => {
    const value = record.values?.[field.key];
    return Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined && value !== '';
  });
  if (!filled) {
    failures.push({ field: field.key, said: 'no record carries a value for this field, so nothing renders for it' });
  }
}

// ─── 3: the two ports ─────────────────────────────────────────────────────────

const kitFor = (component) => {
  const portRoot = join(runtime, `smart/${component}/port`);
  if (!existsSync(portRoot)) return null;
  const version = readdirSync(portRoot)
    .filter((name) => /^\d+\.\d+\.\d+$/u.test(name))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
    .pop();
  const kitRoot = join(portRoot, version, 'kit');
  if (!existsSync(kitRoot)) return null;
  const manifest = JSON.parse(readFileSync(join(kitRoot, 'manifest.json'), 'utf8'));
  const required = new Map();
  for (const id of manifest.cases) {
    const path = join(kitRoot, 'cases', `${id}.json`);
    if (!existsSync(path)) continue;
    const testCase = JSON.parse(readFileSync(path, 'utf8'));
    const key = `${testCase.when.intent}|${testCase.then.answer}`;
    const keys = new Set(required.get(key)?.keys ?? []);
    for (const name of testCase.then.answer_must_include ?? []) keys.add(name);
    required.set(key, { keys, case: id });
  }
  return { version, manifest, required };
};

const ALL_LIST = ['row-actions', 'saved-views', 'shared-saved-views', 'shared-column-settings', 'bulk-under-filter', 'count-on-request'];
const ALL_PANEL = ['field-options', 'field-upload', 'view-settings', 'shared-view-settings', 'record-open'];
const collection = dataset.structure.structure_id;
const editable = dataset.records.find((record) => record.editable !== false);
const locked = dataset.records.find((record) => record.editable === false);

// How this polygon reaches each answer. The inputs are its own, because the kit
// does not carry them: a kit that named a forbidden id would be a test of one
// host rather than a statement about all of them.
const listReaches = [
  ['query.change', 'applied', ALL_LIST, 'default', { sequence: 1, query: { page: 1 } }],
  ['query.change', 'unavailable', ALL_LIST, 'unavailable', { sequence: 1, query: { page: 1 } }],
  ['query.change', 'refused', ALL_LIST, 'forbidden', { sequence: 1, query: { page: 1 } }],
  ['query.count', 'applied', ALL_LIST, 'default', { query: {} }],
  ['query.count', 'unavailable', [], 'default', { query: {} }],
  ['record.open', 'applied', ALL_LIST, 'default', { record_id: editable?.record_id }],
  ['record.open', 'refused', ALL_LIST, 'default', { record_id: 'no-such-record' }],
  ['record.mutate', 'applied', ALL_LIST, 'default', { action_id: 'edit', record_ids: [editable?.record_id], revisions: {} }],
  ['record.mutate', 'conflict', ALL_LIST, 'default', { action_id: 'edit', record_ids: [editable?.record_id], revisions: { [editable?.record_id]: 'stale' } }],
  ['record.mutate', 'refused', ALL_LIST, 'default', { action_id: 'edit', record_ids: [locked?.record_id], revisions: {} }],
  ['record.mutate', 'unavailable', [], 'default', { action_id: 'edit', record_ids: [editable?.record_id] }],
  ['bulk.apply_selected', 'applied', ALL_LIST, 'default', { action_id: 'publish', record_ids: [editable?.record_id] }],
  ['bulk.apply_selected', 'conflict', ALL_LIST, 'default', { action_id: 'publish', record_ids: [editable?.record_id], revisions: { [editable?.record_id]: 'stale' } }],
  ['bulk.apply_selected', 'refused', ALL_LIST, 'default', { action_id: 'publish', record_ids: ['no-such-record'] }],
  ['bulk.apply_under_filter', 'applied', ALL_LIST, 'default', { action_id: 'publish', filters: {} }],
  ['bulk.apply_under_filter', 'conflict', ALL_LIST, 'default', { action_id: 'publish', filters: {}, confirmed_total: 1 }],
  ['bulk.apply_under_filter', 'unavailable', [], 'default', { action_id: 'publish', filters: {} }],
  ['view.create_record', 'applied', ALL_LIST, 'default', { kind: collection }],
  ['view.create_record', 'refused', ALL_LIST, 'default', { kind: 'something.else' }],
  ['settings.save_personal', 'applied', ALL_LIST, 'default', { columnSettings: {}, base_revision: 'personal-1' }],
  ['settings.save_personal', 'conflict', ALL_LIST, 'default', { columnSettings: {}, base_revision: 'personal-9' }],
  ['settings.save_shared', 'applied', ALL_LIST, 'default', { columnSettings: {}, base_revision: 'shared-1', target: 'shared' }],
  ['settings.save_shared', 'unavailable', ['row-actions'], 'default', { columnSettings: {}, target: 'shared' }],
  // Pinning is a decision for everyone, so the personal layer may not make it.
  ['settings.save_personal', 'refused', ALL_LIST, 'default', { columnSettings: { title: { pinned: true } }, base_revision: 'personal-1' }],
  ['view.open', 'applied', ALL_LIST, 'default', { key: 'view-active', sequence: 2 }],
  ['view.open', 'refused', ALL_LIST, 'default', { key: 'no-such-view' }],
  ['view.open', 'unavailable', [], 'default', { key: 'view-active' }],
  ['view.save', 'applied', ALL_LIST, 'default', { key: 'view-active', base_revision: 'v1', label: 'В работе' }],
  ['view.save', 'conflict', ALL_LIST, 'default', { key: 'view-active', revision: 'v9' }],
  ['view.save', 'unavailable', [], 'default', { key: 'view-active' }],
  ['view.save_shared', 'applied', ALL_LIST, 'default', { key: 'view-active', revision: 'v1', target: 'shared' }],
  ['view.save_shared', 'unavailable', ['saved-views'], 'default', { key: 'view-active', target: 'shared' }],
  ['view.delete', 'applied', ALL_LIST, 'default', { key: 'view-mine' }],
  ['view.delete', 'refused', ALL_LIST, 'default', { key: 'no-such-view' }],
  ['view.delete', 'unavailable', [], 'default', { key: 'view-mine' }],
  ['list.open', 'applied', ALL_LIST, 'default', {}],
];

const panelReaches = [
  ['record.load', 'applied', ALL_PANEL, 'default', { record_id: editable?.record_id, collection }],
  ['record.load', 'refused', ALL_PANEL, 'default', { record_id: 'no-such-record', collection }],
  ['record.load', 'unavailable', ALL_PANEL, 'unavailable', { record_id: editable?.record_id, collection }],
  ['group.save', 'applied', ALL_PANEL, 'default', { record_id: editable?.record_id, collection, section: 'main', group: 'main', values: { title: 'Новое название' }, revision: editable?.revision }],
  ['group.save', 'conflict', ALL_PANEL, 'default', { record_id: editable?.record_id, collection, section: 'main', group: 'main', values: { title: 'Новое' }, revision: 'stale' }],
  ['group.save', 'refused', ALL_PANEL, 'default', { record_id: editable?.record_id, collection, section: 'main', group: 'main', values: { title: '   ' }, revision: editable?.revision }],
  ['field.options', 'applied', ALL_PANEL, 'default', { record_id: editable?.record_id, collection, field: 'section', search: '' }],
  ['field.options', 'refused', ALL_PANEL, 'default', { record_id: editable?.record_id, collection, field: 'no-such-field' }],
  ['field.options', 'unavailable', [], 'default', { record_id: editable?.record_id, collection, field: 'section' }],
  ['field.upload', 'applied', ALL_PANEL, 'default', { record_id: editable?.record_id, collection, field: 'cover', file: { name: 'a.pdf', size: 1024 } }],
  ['field.upload', 'refused', ALL_PANEL, 'default', { record_id: editable?.record_id, collection, field: 'cover', file: { name: 'big.bin', size: 1024 * 1024 * 1024 } }],
  ['record.open', 'applied', ALL_PANEL, 'default', { record_id: editable?.record_id, collection }],
  ['view.profile', 'applied', ALL_PANEL, 'default', { record_id: editable?.record_id, collection, profile: 'expert' }],
  ['view.profile', 'refused', ALL_PANEL, 'default', { record_id: editable?.record_id, collection, profile: 'no-such-profile' }],
  ['view.profile', 'unavailable', [], 'default', { record_id: editable?.record_id, collection, profile: 'expert' }],
  ['view.create', 'applied', ALL_PANEL, 'default', { record_id: editable?.record_id, collection, label: 'Для продаж', shared: true }],
  ['view.create', 'refused', ['view-settings'], 'default', { record_id: editable?.record_id, collection, label: 'Для всех', shared: true }],
  ['view.rename', 'applied', ALL_PANEL, 'default', { record_id: editable?.record_id, collection, profile: 'expert', label: 'Экспертный режим' }],
  ['view.delete', 'applied', ALL_PANEL, 'default', { record_id: editable?.record_id, collection, profile: 'mine' }],
  ['view.save', 'applied', ALL_PANEL, 'default', { record_id: null, collection, target: { kind: 'personal' }, view: {} }],
  ['view.save', 'conflict', ALL_PANEL, 'default', { record_id: null, collection, target: { kind: 'personal', revision: 'v-old' }, view: {} }],
  ['view.save', 'refused', ['view-settings'], 'default', { record_id: null, collection, target: { kind: 'shared' }, view: {} }],
  ['view.save', 'unavailable', [], 'default', { record_id: null, collection, target: { kind: 'personal' }, view: {} }],
  ['view.reset', 'applied', ALL_PANEL, 'default', { record_id: null, collection }],
  // The last shared view stays: a scope with none has nothing for a person who
  // has made none of their own. Reached by standing the panel up with one,
  // which no sequence of calls on the default list arrives at.
  ['view.delete', 'refused', ALL_PANEL, 'default', { record_id: editable?.record_id, collection, profile: 'only' },
    [{ id: 'only', label: 'Общий', shared: true }]],
];

const drive = async (label, kit, reaches, build) => {
  if (!kit) {
    failures.push({ port: label, said: 'no conformance kit for this port under the pinned runtime' });
    return { reached: 0, declared: 0 };
  }
  const reached = new Set();
  for (const [intent, answer, capabilities, scenario, payload, profiles] of reaches) {
    const key = `${intent}|${answer}`;
    let given;
    try {
      given = await build({ capabilities, scenario, profiles }).raise(intent, payload);
    } catch (error) {
      failures.push({ port: label, intent, answer, said: `raised ${String(error?.message ?? error).slice(0, 140)}` });
      continue;
    }
    if (given?.answer !== answer) {
      failures.push({ port: label, intent, expected: answer, got: given?.answer ?? null, said: 'the polygon cannot reach that answer' });
      continue;
    }
    reached.add(key);
    for (const name of kit.required.get(key)?.keys ?? []) {
      if (!(name in given)) {
        failures.push({ port: label, intent, answer, said: `the answer carries no ${name}`, case: kit.required.get(key)?.case });
      }
    }
  }
  for (const [key, entry] of kit.required) {
    if (!reached.has(key)) {
      const [intent, answer] = key.split('|');
      failures.push({ port: label, intent, answer, said: 'the kit declares this answer and the polygon reaches no case for it', case: entry.case });
    }
  }
  return { reached: reached.size, declared: kit.required.size };
};

const listKit = kitFor('data-view');
const panelKit = kitFor('property-view');

const list = await drive('simai.dataview-port', listKit, listReaches,
  ({ capabilities, scenario }) => createPolygonHost({ dataset, capabilities, scenario }));
const panel = await drive('simai.property-view-port', panelKit, panelReaches,
  ({ capabilities, scenario, profiles }) => createPolygonHost({ dataset, scenario })
    .propertyView({ capabilities, profiles }));

process.stdout.write(`${JSON.stringify({
  schema: 'ui-admin.polygon.v1',
  records: dataset.records.length,
  fields: dataset.structure.fields.length,
  types: { framework: frameworkTypes.size, inFields: fieldTypes.size, inColumns: columnTypes.size },
  ports: {
    'simai.dataview-port': { version: listKit?.version ?? null, ...list },
    'simai.property-view-port': { version: panelKit?.version ?? null, ...panel },
  },
  status: failures.length ? 'fail' : 'pass',
  failures,
}, null, 2)}\n`);

if (failures.length) process.exit(1);
