// sf-admin-shell places only what is in it now (AS-5, ui-control
// control/research/2026-11-22-admin-settings-study): a node it placed and the
// page then took out is forgotten, never put back on a later placing.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

import {heldNodes, holdsNode} from '../src/smart/admin-shell/js/nodes.js';

// A small tree of fake nodes: parentNode links, and inside() = a parent chain to the shell.
const shell = {nodeType: 1, parentNode: null, name: 'shell'};
const node = (name, parentNode = null) => ({nodeType: 1, parentNode, name});
const inside = (one) => { for (let at = one; at; at = at.parentNode) if (at === shell) return true; return false; };

test('a placed node the page removed or moved elsewhere is not held', () => {
  const box = node('content-box', shell);
  const first = node('form-1', box);
  const placed = new WeakSet([first]);
  assert.equal(holdsNode(first, inside, placed), true, 'placed and still inside');
  first.parentNode = null;
  assert.equal(holdsNode(first, inside, placed), false, 'removed by the page');
  first.parentNode = node('elsewhere');
  assert.equal(holdsNode(first, inside, placed), false, 'moved out by the page');
});

test('a node not placed yet stays while the base holds it out for the drawing', () => {
  const placed = new WeakSet();
  const menu = node('menu');
  assert.equal(holdsNode(menu, inside, placed), true, 'released for the drawing: out of the document, kept');
  menu.parentNode = shell;
  assert.equal(holdsNode(menu, inside, placed), true, 'still in the host');
  menu.parentNode = node('another-place');
  assert.equal(holdsNode(menu, inside, placed), false, 'the page put it somewhere else before the drawing');
  assert.equal(holdsNode(null, inside, placed), false);
  assert.equal(holdsNode({}, inside, placed), false);
});

test('two swaps of the body leave one form each time, in order', () => {
  const box = node('content-box', shell);
  const placed = new WeakSet();
  const toolbar = node('toolbar', box);
  let list = [toolbar, node('form-1', box)];
  for (const one of list) placed.add(one);
  for (const swap of [2, 3]) {
    const old = list.at(-1);
    old.parentNode = null;
    const fresh = node(`form-${swap}`, shell);
    list = heldNodes([...list, fresh], inside, placed);
    for (const one of list) placed.add(one);
    assert.deepEqual(list.map((one) => one.name), ['toolbar', `form-${swap}`], `swap ${swap - 1}`);
  }
  assert.deepEqual(heldNodes(undefined, inside, placed), []);
});

test('the shell reads every area through the rule and records what it placed', () => {
  const source = readFileSync(new URL('../src/smart/admin-shell/index.js', import.meta.url), 'utf8');
  assert.match(source, /import \{heldNodes\} from "\.\/js\/nodes\.js";/u);
  assert.match(source, /this\._content = heldNodes\(this\._content, inside, this\._placed\)/u, 'content');
  assert.match(source, /const kept = heldNodes\(list, inside, this\._placed\)/u, 'named areas');
  assert.match(source, /box\.append\(node\);\s*\}?\s*this\._placed\.add\(node\);/u, 'a placed node is recorded');
  assert.doesNotMatch(source, /cloneNode/u, 'the shell never copies the page\'s nodes');
});

test('the phone menu closes on navigate only when no listener refused it (AS-6)', () => {
  const source = readFileSync(new URL('../src/smart/admin-shell/index.js', import.meta.url), 'utf8');
  assert.match(source, /addEventListener\("sf-admin-menu-navigate", \(event\) => \{\s*queueMicrotask\(\(\) => \{\s*if \(!event\.defaultPrevented && this\.menuOpen\) this\.closeMenu/u);
});
