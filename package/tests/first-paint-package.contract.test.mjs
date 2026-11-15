import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {describe, exampleFiles, givesLateData, sizeProblem} from '../scripts/first-paint-lib.mjs';

// The first paint of the package components (standard simai.smart-component
// 1.3.8 §5.4, gate 24): each example has its committed static markup, written
// by scripts/run-first-paint.mjs snapshot from the built bytes and checked by
// its `check` and `gate` modes. This holds what needs no browser: the files
// are there, and a skeleton.html is the element's own loading render.

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const smart = join(root, 'src', 'smart');
// The set's folders (set.json components[].folder). Narrowed to the set admin
// from simai/ui-pro (2ba35fa): the view, chat, mail and editor checks left with
// their sets.
const PACKAGE = ['admin-menu'];
const inner = (html, tag) => html.replace(/<!--[\s\S]*?-->\n?/gu, '').trim()
  .replace(new RegExp(`^<${tag}[^>]*>`, 'u'), '').replace(new RegExp(`</${tag}>$`, 'u'), '')
  .replace(/>\s+</gu, '><').trim();

test('every example of every package component has its static markup and sheets', () => {
  for (const folder of PACKAGE) {
    const component = describe(smart, folder);
    assert.ok(existsSync(join(component.dir, 'static', 'sheets.json')), `${folder}: static/sheets.json`);
    for (const example of component.examples) {
      const files = exampleFiles(component, example);
      assert.ok(existsSync(files.html), `${folder}/${example.name}: ${files.html}`);
      // An explicitly empty list is data, the empty state: no skeleton for it.
      const late = givesLateData(component, example);
      assert.equal(existsSync(files.skeleton), late, `${folder}/${example.name}: a skeleton exactly when the example gives late data`);
      // The size gate of ui-source's snapshot tool, held here without a browser.
      for (const file of [files.html, files.skeleton].filter((one) => existsSync(one))) {
        assert.equal(sizeProblem(example, readFileSync(file).length), null, file);
      }
    }
  }
});

test('a port-fed component holds its box: it fills its region and its data scrolls inside', () => {
  const css = (path) => readFileSync(join(smart, path), 'utf8');
  assert.match(css('admin-menu/js/navigation/navigation.css'), /\.sf-admin-nav--skeleton \.sf-admin-nav-second \{\s*display: none;/u, 'the skeleton keeps one column on a phone');
  // Each such example puts the component in a region, as a page does.
  for (const [folder, names] of [['admin-menu', ['navigation-port']]]) {
    const component = describe(smart, folder);
    for (const name of names) assert.match(component.examples.find((one) => one.name === name).parent ?? '', /block-size: \d+rem/u, `${folder}/${name}`);
  }
});

test('sf-admin-menu over a navigation port prints its skeleton, never the empty items menu', () => {
  const admin = describe(smart, 'admin-menu');
  assert.deepEqual(admin.manifest.settings.source.values, ['items', 'port']);
  const example = admin.examples.find((one) => one.name === 'navigation-port');
  assert.equal(example.settings.source, 'port');
  const html = readFileSync(exampleFiles(admin, example).html, 'utf8');
  assert.match(html, /class="sf-admin-nav sf-admin-nav--skeleton" aria-busy="true"/u);
  assert.equal((html.match(/class="sf-admin-nav-item"/gu) ?? []).length, 12, 'six rows in each column');
});
