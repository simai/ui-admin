import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('navigation menu reference stays a direct SF-only local harness', async () => {
  const html = await readFile(new URL('navigation-menu-reference.html', root), 'utf8');
  const css = await readFile(new URL('src/navigation-menu-reference.css', root), 'utf8');
  const script = await readFile(new URL('src/navigation-menu-reference.ts', root), 'utf8');

  assert.match(html, /<sf-admin-menu\b/);
  assert.match(html, /persistence-mode="local"/);
  assert.match(html, /item-id="demo\.dashboard"/);
  assert.match(html, /data-navigation-reference="sf-direct"/);
  assert.match(html, /cacheVersion:\s*'navigation-menu-reference-v2'/);
  assert.doesNotMatch(html, /\/admin\/navigation\//);
  assert.doesNotMatch(html, /fetch\s*\(/);
  assert.match(css, /MaterialSymbols-Outlined\.woff2/);
  assert.match(css, /data-sf-icon-runtime="bundled-fallback"/);
  assert.match(script, /customElements\.whenDefined\('sf-admin-menu'\)/);
  assert.ok((html.match(/<sf-admin-menu-item\b/g) ?? []).length >= 28);
  assert.ok((html.match(/type="divider"/g) ?? []).length >= 4);
  assert.match(html, /item-id="demo\.development\.components"[^>]*badge="lab"/);
  assert.match(html, /item-id="demo\.development\.frameworks\.sf5"[^>]*badge="5\.2"/);
  assert.doesNotMatch(script, /fetch\s*\(/);
});
