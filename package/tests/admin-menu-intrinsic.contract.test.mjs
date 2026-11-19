import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Admin menu main navigation contributes to natural block size', async () => {
  const styles = await read('src/component/admin-menu/scss/_css__admin_menu.scss');

  assert.doesNotMatch(styles, /\.sf-admin-menu \{[^}]*(?:^|\n)\s*block-size:/m);
  assert.doesNotMatch(styles, /\.sf-admin-menu-panel:not\(\.small\) \{[^}]*(?:^|\n)\s*block-size:/m);
  assert.doesNotMatch(styles, /\.sf-admin-menu-panel \{[^}]*(?:^|\n)\s*height:/m);
  assert.match(styles, /\.sf-admin-menu-main \{[\s\S]*?flex: 1 1 auto;[\s\S]*?min-block-size: 0;[\s\S]*?overflow: hidden;/);
  assert.doesNotMatch(styles, /\.sf-admin-menu-main \{[\s\S]*?flex: 1 1 0;/);
});

test('Admin menu keeps explicit overflow ownership on the main region', async () => {
  const styles = await read('src/component/admin-menu/scss/_css__admin_menu.scss');
  const source = await read('src/component/admin-menu/js/_admin_menu.js');

  assert.match(styles, /\.sf-admin-menu-main\.open \{\s*overflow-y: auto;/);
  assert.match(source, /const visibleCount = Math\.max\([\s\S]*?Math\.floor\(containerHeight \/ itemHeight\)/);
  assert.match(source, /this\.main\.classList\.toggle\(className, this\.overflowOpen\)/);
});

test('Admin menu reserves disclosure space only after natural content overflows', async () => {
  const source = await read('src/component/admin-menu/js/_admin_menu.js');

  assert.match(source, /contentFitsWithoutOverflow\(items\) \{[\s\S]*?this\.main\.scrollHeight <= this\.main\.clientHeight \+ 1;/);
  assert.match(source, /if \(this\.contentFitsWithoutOverflow\(items\)\) \{[\s\S]*?this\.main\.classList\.remove\("overflow-auto", "open"\);[\s\S]*?return;/);
  assert.match(source, /const containerHeight = this\.main\.clientHeight - itemHeight;/);
});
