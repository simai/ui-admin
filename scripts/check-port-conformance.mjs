#!/usr/bin/env node
// Usage: node scripts/check-port-conformance.mjs
//
// Does this reference's host answer the way the port says a host answers?
//
// The Framework ships a conformance kit beside each port version
// (simai.composite.host-port.conformance.v1) and nothing was running it. A
// reference whose fixtures answered «applied» to everything would be a drawing
// of a host, and the first consumer to meet a refusal would have nothing here
// to copy — which is the difference between this repository being a source and
// being a showcase (owner, 2026-10-09).
//
// What the kit is, and is not. Its cases are not a scenario each: two
// record.load cases carry the same record and the same collection and expect
// `applied` and `unavailable`, so no single host can be driven through them in
// order. The kit is a CATALOGUE — these are the intents a host answers, these
// are the answers each intent may give, and this is what each answer must
// carry. So that is what this checks:
//
//   1. every intent the kit names, this host answers;
//   2. every (intent, answer) pair the kit declares, this host can produce;
//   3. when it produces one, the answer carries what the kit requires of it.
//
// The inputs that steer the host to each answer are this reference's own —
// a forbidden id, a stale revision, an empty title — because the kit does not
// carry them and inventing them in the kit would make it a test of one host
// rather than a statement about all of them.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPropertyViewHost, RECORD } from '../src/ports/property-view-host.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const runtime = resolve(projectRoot, process.env.SIMAI_RUNTIME_ROOT ?? '.runtime');
const portRoot = join(runtime, 'smart/property-view/port');

if (!existsSync(portRoot)) {
  process.stderr.write(`no port kit under ${portRoot} — run \`npm run prepare:runtime\` first\n`);
  process.exit(2);
}

const version = readdirSync(portRoot)
  .filter((name) => /^\d+\.\d+\.\d+$/.test(name))
  .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
  .pop();
const kitRoot = join(portRoot, version, 'kit');
const manifest = JSON.parse(readFileSync(join(kitRoot, 'manifest.json'), 'utf8'));

// What the kit requires, read out of it rather than restated here.
const required = new Map();
for (const id of manifest.cases) {
  const path = join(kitRoot, 'cases', `${id}.json`);
  if (!existsSync(path)) continue;
  const testCase = JSON.parse(readFileSync(path, 'utf8'));
  const key = `${testCase.when.intent}|${testCase.then.answer}`;
  const keys = new Set(required.get(key)?.keys ?? []);
  for (const name of testCase.then.answer_must_include ?? []) keys.add(name);
  required.set(key, { keys, capabilities: testCase.given?.capabilities ?? [], case: id });
}

// How this reference reaches each answer. One row per (intent, answer) the kit
// declares; anything the kit declares and this table does not reach is a gap
// in the reference, reported as one.
const ALL = ['field-options', 'field-upload', 'view-settings', 'shared-view-settings'];
const base = { record_id: 'r-1', collection: 'admin.solutions' };
const reaches = [
  ['record.load', 'applied', ALL, { ...base, reason: 'connected' }],
  ['record.load', 'refused', ALL, { ...base, record_id: 'record-forbidden', reason: 'requested' }],
  ['record.load', 'unavailable', ALL, { ...base, record_id: 'record-unavailable', reason: 'requested' }],
  ['group.save', 'applied', ALL, { ...base, section: 'main', group: 'main', values: { title: 'Новое' }, revision: 7 }],
  ['group.save', 'conflict', ALL, { ...base, section: 'main', group: 'main', values: { title: 'Новое' }, revision: 1 }],
  ['group.save', 'refused', ALL, { ...base, section: 'main', group: 'main', values: { title: '  ' }, revision: 7 }],
  ['field.options', 'applied', ALL, { ...base, field: 'section', cursor: null, search: '' }],
  ['field.options', 'refused', ALL, { ...base, field: 'forbidden-field', cursor: null, search: '' }],
  ['field.options', 'unavailable', [], { ...base, field: 'section', cursor: null, search: '' }],
  ['field.upload', 'applied', ALL, { ...base, field: 'document', file: { name: 'file.pdf', size: 1024 } }],
  ['field.upload', 'refused', ALL, { ...base, field: 'document', file: { name: 'huge.bin', size: 1024 * 1024 * 1024 } }],
  ['record.open', 'applied', ALL, { ...base }],
  ['view.save', 'applied', ALL, { record_id: null, collection: base.collection, target: { kind: 'personal' }, view: {} }],
  ['view.save', 'conflict', ALL, { record_id: null, collection: base.collection, target: { kind: 'shared', revision: 'v-old' }, view: {} }],
  ['view.save', 'refused', ['view-settings'], { record_id: null, collection: base.collection, target: { kind: 'shared' }, view: {} }],
  ['view.save', 'unavailable', [], { record_id: null, collection: base.collection, target: { kind: 'personal' }, view: {} }],
  ['view.reset', 'applied', ALL, { record_id: null, collection: base.collection, target: { kind: 'personal' } }],
];

const failures = [];
const reached = new Set();

for (const [intent, answer, capabilities, payload] of reaches) {
  const key = `${intent}|${answer}`;
  const host = createPropertyViewHost({ capabilities });
  let given;
  try {
    given = await host.raise(intent, payload);
  } catch (error) {
    failures.push({ intent, answer, said: `raised ${String(error?.message ?? error).slice(0, 120)}` });
    continue;
  }
  if (given?.answer !== answer) {
    failures.push({ intent, expected: answer, got: given?.answer ?? null, said: 'this reference cannot reach that answer' });
    continue;
  }
  reached.add(key);
  for (const name of required.get(key)?.keys ?? []) {
    if (!(name in given)) {
      failures.push({ intent, answer, said: `the answer carries no ${name}`, case: required.get(key)?.case });
    }
  }
}

for (const [key, entry] of required) {
  if (!reached.has(key)) {
    const [intent, answer] = key.split('|');
    failures.push({ intent, answer, said: 'the kit declares this answer and the reference reaches no case for it', case: entry.case });
  }
}

// Every property type the fixture record declares has to be one the Framework
// renders. The record said `enum` where the renderer set knows `choice`, so the
// status field drew «не заполнено» with a value sitting right there — and a
// consumer copying this reference would have copied the wrong word. The list is
// read out of the shipped renderer set rather than restated here (owner,
// 2026-10-09).
const rendererSource = join(runtime, 'smart/field-renderers/js/field-renderers.js');
if (existsSync(rendererSource)) {
  const source = readFileSync(rendererSource, 'utf8');
  const types = new Set();
  for (const match of source.matchAll(/\b(string|text|number|integer|boolean|date|datetime|choice|choices|record|relation|user|file|include|color)\s*:/g)) {
    types.add(match[1]);
  }
  const declared = new Set();
  const walk = (node) => {
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (!node || typeof node !== 'object') return;
    if (typeof node.propertyType === 'string') declared.add(node.propertyType);
    Object.values(node).forEach(walk);
  };
  walk(RECORD);
  for (const type of declared) {
    if (!types.has(type)) {
      failures.push({said: `the fixture record declares propertyType "${type}", which the Framework's renderer set does not know`});
    }
  }
}

const report = {
  schema: 'ui-admin.port_conformance.v1',
  port: manifest.port,
  version,
  declared: required.size,
  reached: reached.size,
  status: failures.length ? 'fail' : 'pass',
  failures,
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
process.exit(failures.length ? 1 : 0);
