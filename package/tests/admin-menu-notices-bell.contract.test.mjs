// sf-admin-menu 1.15.1: the bell and the port's notifications.read.
//
// 1. notifications.read carries {keys, all} (simai.admin-navigation-port 1.1.0:
//    `all` required, no other field). Up to 1.15.0 a notice opened from the
//    menu's own list was read with {ids}, which a host that checks the payload
//    refuses and one that does not reads as nothing.
// 2. A page that holds the set's list (sf-admin-notifications, panel look, in
//    an sf-drawer) has that panel opened by the bell; the menu's own list is
//    drawn only without one.
//
// The controller is imported as the build bundles it: its relative imports
// carry no extension and its words are JSON, so a small resolve/load hook
// stands in for the bundler.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {register} from 'node:module';
import test from 'node:test';

register('data:text/javascript,' + encodeURIComponent(`
export async function resolve(specifier, context, next) {
  try { return await next(specifier, context); }
  catch (error) {
    if (/^\\.{1,2}\\//u.test(specifier) && !/\\.[a-z]+$/u.test(specifier)) return next(specifier + '.js', context);
    throw error;
  }
}
export async function load(url, context, next) {
  if (url.startsWith('file:') && url.endsWith('.json')) {
    const {readFileSync} = await import('node:fs');
    return {format: 'module', shortCircuit: true, source: 'export default ' + readFileSync(new URL(url), 'utf8')};
  }
  return next(url, context);
}`));

const controllerModule = () => import(new URL('../src/smart/admin-menu/js/navigation/controller.js', import.meta.url).href);
const port = JSON.parse(readFileSync(new URL('../src/core/contracts/ports/simai.admin-navigation-port/1.1.0/port.json', import.meta.url), 'utf8'));
const component = JSON.parse(readFileSync(new URL('../src/smart/admin-menu/component.json', import.meta.url), 'utf8'));

// The port's payload schema of notifications.read, checked by hand (it is a
// closed object of two fields).
function portRefuses(payload) {
  const schema = port.intents['notifications.read'].payload;
  const problems = [];
  for (const name of schema.required) if (!(name in payload)) problems.push(`missing ${name}`);
  for (const name of Object.keys(payload)) if (!(name in schema.properties)) problems.push(`unknown ${name}`);
  if ('all' in payload && typeof payload.all !== 'boolean') problems.push('all is not a boolean');
  if ('keys' in payload && !(Array.isArray(payload.keys) && payload.keys.every((key) => typeof key === 'string'))) problems.push('keys is not a list of strings');
  return problems;
}

// A controller with a fake element and port: what the host is sent and what
// the element tells.
async function fakeController(extra = {}) {
  const {NavigationController} = await controllerModule();
  const sent = [];
  const told = [];
  const controller = Object.create(NavigationController.prototype);
  Object.assign(controller, {
    element: {sfEmit: (verb, detail) => told.push({verb, detail})},
    port: {raise: async (intent, payload) => {
      sent.push({intent, payload});
      return {answer: 'applied', unread: 0, groups: []};
    }},
    navigation: {notifications: {unread: 2}},
    update() {},
    offers: () => true,
    text: (key) => key,
    ...extra,
  });
  return {controller, sent, told};
}

test('the port declares notifications.read as {keys, all}', () => {
  assert.equal(component.port.version, '1.1.0');
  assert.deepEqual(port.intents['notifications.read'].payload.required, ['all']);
  assert.deepEqual(Object.keys(port.intents['notifications.read'].payload.properties).sort(), ['all', 'keys']);
});

test('a notice opened from the menu list is read with {keys, all: false}', async () => {
  const {controller, sent, told} = await fakeController({_notices: {close() {}}});
  const link = {dataset: {notice: 'n2'}};
  await controller.onNoticesClick({target: {closest: (selector) => (selector.startsWith('a[') ? link : null)}, preventDefault() {}});
  const reads = sent.filter((one) => one.intent === 'notifications.read');
  assert.deepEqual(reads.map((one) => one.payload), [{keys: ['n2'], all: false}]);
  assert.deepEqual(portRefuses(reads[0].payload), []);
  const event = told.find((one) => one.verb === 'read');
  assert.deepEqual(event.detail.ids, ['n2'], 'the vocabulary event names the read ones ids');
  assert.deepEqual(event.detail.payload, {keys: ['n2'], all: false}, 'the event carries the port payload as sent');
});

test('«Прочитать все» is read with {all: true}', async () => {
  const {controller, sent, told} = await fakeController({loadNotices: async () => {}});
  await controller.onNoticesClick({target: {closest: (selector) => (selector === '[data-notices-read-all]' ? {} : null)}, preventDefault() {}});
  const reads = sent.filter((one) => one.intent === 'notifications.read');
  assert.deepEqual(reads.map((one) => one.payload), [{all: true}]);
  assert.deepEqual(portRefuses(reads[0].payload), []);
  assert.deepEqual(told.find((one) => one.verb === 'read').detail.ids, []);
});

test('the source sends no {ids} to notifications.read', () => {
  const source = readFileSync(new URL('../src/smart/admin-menu/js/navigation/controller.js', import.meta.url), 'utf8');
  for (const call of source.matchAll(/readNotices\((\{[^)]*\})/gu)) {
    assert.doesNotMatch(call[1], /\bids\b/u, `readNotices(${call[1]})`);
  }
});

// A document stand-in: lists with a look and the drawer that holds them.
const list = (look, drawer) => ({
  getAttribute: (name) => (name === 'look' ? look : null),
  closest: (selector) => (selector === 'sf-drawer' ? drawer : null),
  refreshed: 0,
  refresh() { this.refreshed += 1; },
});
const drawer = () => {
  const attributes = new Set();
  return {
    hasAttribute: (name) => attributes.has(name),
    open() { attributes.add('open'); this.opened = (this.opened ?? 0) + 1; },
    close() { attributes.delete('open'); },
  };
};

test('the set panel is an sf-admin-notifications in the panel look inside an sf-drawer', async () => {
  const {setNoticesPanel} = await controllerModule();
  const panel = drawer();
  const history = list('page', null);
  const inPanel = list('panel', panel);
  const noLook = list(null, panel);
  assert.equal(setNoticesPanel({querySelectorAll: () => []}), null);
  assert.equal(setNoticesPanel({querySelectorAll: () => [history]}), null, 'the history page is not a panel');
  assert.equal(setNoticesPanel({querySelectorAll: () => [list('panel', null)]}), null, 'a list outside a drawer is not a panel');
  assert.deepEqual(setNoticesPanel({querySelectorAll: () => [history, inPanel]}), {list: inPanel, drawer: panel});
  assert.deepEqual(setNoticesPanel({querySelectorAll: () => [noLook]}), {list: noLook, drawer: panel}, 'panel is the default look');
});

test('the bell opens the set panel and draws no list of its own when the page holds one', async () => {
  const panel = drawer();
  const inPanel = list('panel', panel);
  const saved = {document: globalThis.document, customElements: globalThis.customElements, MutationObserver: globalThis.MutationObserver};
  const observed = [];
  globalThis.document = {querySelectorAll: (selector) => (selector === 'sf-admin-notifications' ? [inPanel] : [])};
  globalThis.customElements = {get: (name) => (name === 'sf-drawer' ? class {} : undefined)};
  globalThis.MutationObserver = class { constructor(callback) { this.callback = callback; } observe(target) { observed.push(target); } };
  try {
    let ownDrawer = 0;
    let ownLoad = 0;
    const {controller} = await fakeController({
      noticesDrawer: async () => { ownDrawer += 1; return null; },
      loadNotices: async () => { ownLoad += 1; },
    });
    const bell = {setAttribute() {}, focus() {}};
    await controller.toggleNotifications(bell);
    assert.equal(panel.opened, 1, 'the set panel opened');
    assert.equal(inPanel.refreshed, 1, 'the list reads the port again as it opens');
    assert.equal(ownDrawer, 0, 'no own drawer');
    assert.equal(ownLoad, 0, 'no own notifications.load');
    assert.deepEqual(observed, [panel], 'the panel is watched for aria-expanded and the focus return');
    await controller.toggleNotifications(bell);
    assert.equal(panel.hasAttribute('open'), false, 'a second press closes it');
    await controller.toggleNotifications(bell);
    assert.deepEqual(observed, [panel], 'watched once');

    globalThis.document = {querySelectorAll: () => []};
    await controller.toggleNotifications(bell);
    assert.equal(ownDrawer, 1, 'without the set list the menu draws its own');
  } finally {
    Object.assign(globalThis, saved);
  }
});
