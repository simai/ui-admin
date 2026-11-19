import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('navigation menu reference is the menu alone over the navigation port', async () => {
  const html = await readFile(new URL('navigation-menu-reference.html', root), 'utf8');
  const css = await readFile(new URL('src/navigation-menu-reference.css', root), 'utf8');
  const script = await readFile(new URL('src/navigation-menu-reference.ts', root), 'utf8');

  // One menu, no rows in the markup: the host answers them (sf-admin-menu
  // 1.15.0 has no other path, AM-7).
  assert.match(html, /<sf-admin-menu\b[^>]*id="navigation-reference-menu"[^>]*><\/sf-admin-menu>/);
  assert.doesNotMatch(html, /<sf-admin-menu-[a-z]/);
  assert.doesNotMatch(html, /persistence-mode|searchable|collapsible/);
  assert.match(html, /data-navigation-reference="sf-direct"/);
  assert.match(html, /class="admin-navigation h-full navigation-reference"/);
  assert.match(html, /cacheVersion:\s*'navigation-menu-reference-v3'/);
  assert.match(script, /import '\.\/navigation';/);
  assert.match(script, /customElements\.whenDefined\('sf-admin-menu'\)/);
  assert.doesNotMatch(script, /compact/);
  assert.match(css, /MaterialSymbols-Outlined\.woff2/);
  assert.match(css, /data-sf-icon-runtime="bundled-fallback"/);
  assert.doesNotMatch(css, /sf-admin-menu-/);
});
