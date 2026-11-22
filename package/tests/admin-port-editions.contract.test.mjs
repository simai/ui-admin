// The set's navigation port editions (SIMAI Framework AN-2,
// simai.admin-navigation-port 1.2.0, additive over 1.1.0).
//
// - Every component of the set that implements the port declares the editions
//   it takes in component.json x-port.supports (the pair's port edition gate
//   reads it), 1.1.0 and 1.2.0 among them, and its code takes the same list.
// - sf-admin-notifications reads a notification's object, level and resolved
//   from a host of 1.2.0 or later, and draws a 1.1.0 host's notifications as
//   in 1.1.0.
// - sf-admin-activity asks activity.load / retry / cancel only of a host of
//   1.2.0 or later that lists the capability activity; a 1.1.0 host is asked
//   nothing.
//
// Runs in the overlay (ui-source at the pinned revision with the set over it):
// the kit cases of 1.2.0 are read when the pinned ui-source carries 1.2.0.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';

import * as notices from '../src/smart/admin-notifications/js/port.js';
import * as activity from '../src/smart/admin-activity/js/port.js';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const json = (path) => JSON.parse(read(path));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const PORT = 'simai.admin-navigation-port';
const ports = `src/core/contracts/ports/${PORT}`;

const implementers = {
  'admin-menu': () => {
    const listed = read('src/smart/admin-menu/js/navigation/controller.js').match(/export const SUPPORTED_NAVIGATION_VERSIONS = \[([^\]]*)\]/u);
    return listed[1].split(',').map((entry) => entry.trim().replace(/"/gu, '')).filter(Boolean);
  },
  'admin-notifications': () => notices.SUPPORTED_NAVIGATION_VERSIONS,
  'admin-activity': () => activity.SUPPORTED_NAVIGATION_VERSIONS,
};

test('every implementer of the navigation port declares 1.1.0 and 1.2.0 in x-port.supports, as its code takes them', () => {
  for (const [folder, taken] of Object.entries(implementers)) {
    const component = json(`src/smart/${folder}/component.json`);
    assert.equal(component.port?.id, PORT, `${folder}: port.id`);
    const supports = component['x-port']?.supports;
    assert.ok(Array.isArray(supports), `${folder}: x-port.supports is declared`);
    for (const edition of ['1.1.0', '1.2.0']) assert.ok(supports.includes(edition), `${folder}: supports ${edition}`);
    assert.ok(supports.includes(component.port.version), `${folder}: the declared edition ${component.port.version} is one it supports`);
    assert.deepEqual(taken(), supports, `${folder}: the code takes exactly the declared editions`);
    assert.equal(component.port.contract, `${ports}/${component.port.version}/port.json`, `${folder}: the contract lives at its edition`);
    assert.ok(existsSync(resolve(root, component.port.contract)), `${folder}: the pinned ui-source carries ${component.port.contract}`);
    assert.equal(component['x-port'].sha256, sha256(readFileSync(resolve(root, component.port.contract))), `${folder}: x-port.sha256 is the declared edition's bytes`);
  }
});

test('the generated manifest of the menu carries the same editions', () => {
  const component = json('src/smart/admin-menu/component.json');
  const manifest = json('src/smart/admin-menu/smart.manifest.json');
  assert.deepEqual(manifest.composition.declarative.host_port.supported_versions, component['x-port'].supports);
});

test('editions compare by number, within major 1', () => {
  for (const module of [notices, activity]) {
    assert.equal(module.editionAtLeast('1.2.0', '1.2.0'), true);
    assert.equal(module.editionAtLeast('1.10.0', '1.2.0'), true);
    assert.equal(module.editionAtLeast('1.1.9', '1.2.0'), false);
    assert.equal(module.editionAtLeast('', '1.2.0'), false);
    assert.equal(module.editionAtLeast(undefined, '1.2.0'), false);
  }
  assert.equal(notices.readsExtendedFields({version: '1.2.0'}), true);
  assert.equal(notices.readsExtendedFields({version: '1.3.0'}), true);
  assert.equal(notices.readsExtendedFields({version: '1.1.0'}), false);
  assert.equal(notices.readsExtendedFields({version: '1.0.0'}), false);
  assert.equal(notices.readsExtendedFields({version: '2.0.0'}), false, 'another major is not read as 1.2.0');
  assert.equal(notices.readsExtendedFields({}), false, 'a host that names no edition is read as before 1.2.0');
  assert.equal(notices.readsExtendedFields(null), false);
});

const told = {key: 'n1', title: 'demo.test не отвечает', when: '10:42', unread: true, object: 'demo.test', level: 'error', resolved: 'снова отвечает с 11:05'};

test('a 1.2.0 host: object, level and resolved (true or words) are read', () => {
  const entry = notices.entryOf(told, notices.readsExtendedFields({version: '1.2.0'}));
  assert.equal(entry.object, 'demo.test');
  assert.equal(entry.level, 'error');
  assert.equal(entry.resolved, true);
  assert.equal(entry.resolvedText, 'снова отвечает с 11:05');
  const settled = notices.entryOf({key: 'n2', title: 'x', resolved: true, level: 'success'}, true);
  assert.equal(settled.resolved, true);
  assert.equal(settled.resolvedText, '');
  const open = notices.entryOf({key: 'n3', title: 'x', resolved: null, level: null, object: null}, true);
  assert.deepEqual([open.resolved, open.level, open.object], [false, '', '']);
  assert.equal(notices.entryOf({key: 'n4', title: 'x', level: 'critical'}, true).level, '', 'a level outside the port enum has no mark');
});

test('a 1.1.0 host: its notification is drawn as in 1.1.0 (no object, level or resolved)', () => {
  const entry = notices.entryOf(told, notices.readsExtendedFields({version: '1.1.0'}));
  assert.deepEqual([entry.object, entry.level, entry.resolved, entry.resolvedText], ['', '', false, '']);
  for (const field of ['key', 'title', 'when', 'unread']) assert.equal(entry[field], told[field], `1.1.0 field ${field} kept`);
  assert.equal(notices.entryOf({title: 'no key'}, false), null);
});

test('the list reads the fields by the host\'s edition; the setting items keep all three', () => {
  const source = read('src/smart/admin-notifications/index.js');
  assert.match(source, /groupsOf\(answer\.groups, false, readsExtendedFields\(this\.port\)\)/u, 'notifications.load answers are read by the edition');
  assert.match(source, /groupsOf\(this\.items, true\)/u, 'the setting items are read with every field');
});

test('activity is asked only of a 1.2.0 host that lists the capability', () => {
  const all = ['activity', 'notifications'];
  assert.equal(activity.offersActivity({version: '1.2.0', capabilities: all}), true);
  assert.equal(activity.offersActivity({version: '1.4.0', capabilities: all}), true);
  assert.equal(activity.offersActivity({version: '1.2.0', capabilities: ['notifications']}), false);
  assert.equal(activity.offersActivity({version: '1.1.0', capabilities: all}), false, 'a 1.1.0 host has no activity even if it lists it');
  assert.equal(activity.offersActivity({version: '2.0.0', capabilities: all}), false);
  assert.equal(activity.offersActivity({capabilities: all}), false);
  assert.equal(activity.offersActivity(null), false);
  assert.deepEqual(activity.ACTIVITY_INTENTS, ['activity.load', 'activity.retry', 'activity.cancel']);
  const source = read('src/smart/admin-activity/index.js');
  assert.match(source, /offers\(\) \{\s*return offersActivity\(this\.port\);/u);
  assert.match(source, /if \(this\.offers\(\)\) this\.ask\("activity\.retry", run\)/u, 'Retry asks the host only over a port that offers activity');
  assert.match(source, /if \(this\.offers\(\)\) this\.ask\("activity\.cancel", run\)/u);
  assert.match(source, /raise\("activity\.load", \{\}\)/u);
});

test('a run of activity_page: retryable false offers no Retry, absent offers it; answers carry runs', () => {
  const failed = activity.runOf({id: 'r2', label: 'Обновление', state: 'failed', retryable: false});
  assert.equal(failed.retryable, false);
  assert.equal(activity.runOf({id: 'r3', label: 'x', state: 'failed'}).retryable, true);
  assert.equal(activity.runOf({id: 'r4', label: 'x', state: 'failed', retryable: null}).retryable, true);
  assert.equal(activity.runOf({id: 'r5', label: 'x', state: 'gone'}).state, 'running');
  assert.equal(activity.runOf({label: 'no id'}), null);
  assert.deepEqual(activity.runsOfAnswer({answer: 'applied', runs: []}), []);
  assert.equal(activity.runsOfAnswer({answer: 'applied'}), null);
  const template = read('src/smart/admin-activity/js/templates/default.js');
  assert.match(template, /\?retryable=\$\{run\.retryable\}/u, 'the failed row is retryable as the run says');
});

const kit = `${ports}/1.2.0/kit`;
test('the 1.2.0 kit cases read as the set reads them', {skip: !existsSync(resolve(root, kit)) && 'the pinned ui-source carries no navigation port 1.2.0'}, () => {
  const kase = (id) => json(`${kit}/cases/${id}.json`);
  const notified = kase('a-notification-says-its-object-level-and-resolved').given.notifications.groups[0].items
    .map((item) => notices.entryOf(item, notices.readsExtendedFields({version: '1.2.0'})));
  assert.deepEqual(notified.map((entry) => [entry.object, entry.level, entry.resolved, entry.resolvedText]),
    [['demo.test', 'error', true, 'снова отвечает с 11:05'], ['demo.test', 'success', false, '']]);
  const runs = kase('activity-arrives-as-runs').given.runs.map(activity.runOf);
  assert.deepEqual(runs.map((run) => [run.id, run.state, run.cancelable, run.retryable]), [['r1', 'running', true, true], ['r2', 'failed', false, true]]);
  const without = kase('activity-without-the-capability');
  assert.equal(activity.offersActivity({version: '1.2.0', capabilities: without.given.capabilities}), false, 'without the capability nothing asks for runs');
  for (const id of ['retrying-a-run-is-the-hosts', 'cancelling-a-run-is-the-hosts']) {
    const one = kase(id);
    assert.ok(activity.ACTIVITY_INTENTS.includes(one.when.intent));
    assert.deepEqual(Object.keys(one.when.payload), ['id'], `${id}: the payload is {id}, as the element sends it`);
  }
  const port = json(`${ports}/1.2.0/port.json`);
  assert.deepEqual(port.capabilities.activity.intents, activity.ACTIVITY_INTENTS);
  const schemas = JSON.stringify(Object.values(port.data).map((entry) => entry.schema));
  for (const field of ['"object"', '"level"', '"resolved"', '"retryable"']) assert.ok(schemas.includes(field), `the 1.2.0 data declare ${field}`);
});
