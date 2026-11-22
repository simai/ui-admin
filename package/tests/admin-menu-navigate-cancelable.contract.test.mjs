// sf-admin-menu-navigate is cancelable (AS-6, ui-control
// control/research/2026-11-22-admin-settings-study): it is sent before the
// menu marks anything; refused, the current row, the screen and the focus stay
// and the menu goes nowhere; not refused, the row becomes current.
//
// The controller's own methods (openRow, openObjectRow, mayLeave) are read from
// its source and run over a fake element: the module imports extensionless
// siblings that node does not resolve.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const source = read('src/smart/admin-menu/js/navigation/controller.js');
const method = (head) => {
  const found = source.match(new RegExp(`\\n    (${head}\\([^)]*\\) \\{[\\s\\S]*?\\n    \\})\\n`, 'u'));
  assert.ok(found, `controller method ${head}`);
  return found[1];
};
const Probe = new Function(`return class Probe {\n${method('async openRow')}\n${method('openObjectRow')}\n${method('mayLeave')}\n}`)();

const make = ({refuse}) => {
  const sent = [];
  const probe = new Probe();
  Object.assign(probe, {
    port: {},
    wide: false,
    screen: 'second',
    navigation: {current: 'dns', context: {current: 'a'}},
    opened: 0,
    updates: [],
    raise: async () => ({answer: 'applied', href: '#/sites'}),
    pageOpened() { this.opened += 1; },
    update(reason) { this.updates.push(reason); },
    element: {
      sfEmit(verb, detail, options) {
        sent.push({verb, detail, cancelable: options?.cancelable === true, marked: probe.navigation.current});
        return !refuse;
      },
    },
  });
  return {probe, sent};
};

test('refused: the current row, the screen and the updates stay; nothing moves', async () => {
  const {probe, sent} = make({refuse: true});
  let prevented = 0;
  await probe.openRow({key: 'sites', kind: 'page', href: '#/sites'}, {button: 0, preventDefault() { prevented += 1; }});
  assert.equal(sent.length, 1);
  assert.deepEqual([sent[0].verb, sent[0].cancelable, sent[0].detail.key, sent[0].detail.href], ['navigate', true, 'sites', '#/sites']);
  assert.equal(sent[0].marked, 'dns', 'asked before the row is marked');
  assert.equal(probe.navigation.current, 'dns', 'the current row stays');
  assert.equal(probe.screen, 'second', 'the phone screen stays');
  assert.deepEqual(probe.updates, [], 'nothing is redrawn, so the focus stays');
  assert.equal(probe.opened, 0);
  assert.equal(prevented, 1, 'the browser does not follow the row either');
});

test('allowed: the row becomes current after the event', async () => {
  const {probe, sent} = make({refuse: false});
  await probe.openRow({key: 'sites', kind: 'page', href: '#/sites'}, {button: 0, preventDefault() {}});
  assert.equal(sent[0].marked, 'dns', 'the event still comes first');
  assert.equal(probe.navigation.current, 'sites');
  assert.equal(probe.screen, 'first');
  assert.deepEqual(probe.updates, ['open']);
  assert.equal(probe.opened, 1);
});

test('an object-menu link refused is not followed and not marked', () => {
  const {probe} = make({refuse: true});
  let prevented = 0;
  probe.openObjectRow({key: 'b', href: '#/b'}, {button: 0, preventDefault() { prevented += 1; }});
  assert.equal(prevented, 1);
  assert.equal(probe.navigation.context.current, 'a');
  assert.deepEqual(probe.updates, []);
  const allowed = make({refuse: false});
  allowed.probe.openObjectRow({key: 'b', href: '#/b'}, {button: 0, preventDefault() {}});
  assert.equal(allowed.probe.navigation.context.current, 'b');
});

test('every navigate goes through mayLeave; the event is declared cancelable', () => {
  assert.equal((source.match(/sfEmit\("navigate"/gu) ?? []).length, 1, 'one place sends navigate');
  assert.match(source, /mayLeave\(detail\) \{\s*return this\.element\.sfEmit\("navigate", detail, \{cancelable: true\}\) !== false;/u);
  const palette = method('async onPaletteNavigate');
  assert.ok(palette.indexOf('mayLeave') < palette.indexOf('current: chosen.item.key'), 'a palette result is marked only after the event');
  const component = JSON.parse(read('src/smart/admin-menu/component.json'));
  assert.equal(component.events.navigate.cancelable, true);
  const manifest = JSON.parse(read('src/smart/admin-menu/smart.manifest.json'));
  assert.match(JSON.stringify(manifest), /sf-admin-menu-navigate/u);
});
