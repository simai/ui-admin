import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Admin menu panels fill a narrow mobile host without a blank strip', async () => {
  const styles = await read('src/component/admin-menu/scss/_css__admin_menu.scss');

  assert.match(styles, /@media \(max-width: map\.get\(bp\.\$breakpoint-array, sm\)\)/);
  assert.match(styles, /\.sf-admin-menu-panel:not\(\.small\) \{\s*inline-size: 100%;/s);
  assert.match(styles, /\.sf-admin-menu-panel\.small \{\s*inline-size: var\(--sf-admin-menu-panel-compact--inline-size, var\(--sf-e1\)\);/s);
});
