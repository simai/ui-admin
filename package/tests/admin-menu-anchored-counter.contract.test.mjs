import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

// sf-admin-menu's counters (simai/ui-source#12, second part): on the rail a
// row's counter sits on its icon as the Framework's anchored badge; in the
// section column it is sf-badge inside the row; the row's name holds its words
// and the count. tests/browser/admin-menu-anchored-counter.browser.mjs measures it.
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('no counter is left to the badge runtime, which a page may run more than once', async () => {
  // The loader injects the badges component's classic script once per plugin
  // that names it as a relation; each copy of SF.AnchoredBadge boots its own
  // observer, and on ui-admin (2026-10-21) four copies appended a count's
  // phrase to the same aria-label without end. The menu draws its counters and
  // names itself: no data-count, data-dot or data-label anywhere in it.
  for (const path of ['src/smart/admin-menu/js/navigation/template.js']) {
    const code = (await read(path)).split('\n').filter((line) => !line.trim().startsWith('//')).join('\n');
    assert.doesNotMatch(code, /data-(count|dot|label)\b/, path);
  }
});

test('the navigation rail anchors a row\'s counter on its icon', async () => {
  const template = await read('src/smart/admin-menu/js/navigation/template.js');
  const styles = await read('src/smart/admin-menu/js/navigation/navigation.css');
  // A rail row's icon is a 1/2 anchor, so its counter is a danger dot and the
  // number goes to the row's name (owner, 2026-10-21); the bell's anchor is the
  // 1 step, where the badge rule draws the count (C342, AM-43).
  assert.match(template, /sf-badge-anchor sf-badge-anchor--size-\$\{count \? "1" : "1\/2"\} sf-badge-anchor--square sf-admin-nav-rail-anchor/);
  assert.match(template, /sf-badge sf-badge--anchored sf-badge--error\$\{count && !counter\.dot \? "" : " sf-badge--dot"\}/);
  assert.match(template, /railIcon\("notifications", counter, \{count: true\}\)/);
  // The current section's glyph is filled (C354).
  assert.match(template, /\$\{compact \? railIcon\(row\.icon, railCounter\(row\), \{filled: current \|\| holds\}\)/);
  assert.match(template, /aria-label=\$\{compact \? nameWithCounter\(row\.label, railCounter\(row\)\) : nothing\}/);
  // A row's count is SIMAI Framework's badge on a text line of rung 1 (AM-59).
  assert.match(template, /<sf-badge size="1\/3" status="error" line="1"/);
  assert.doesNotMatch(template, /sf-admin-nav-dot/);
  assert.doesNotMatch(styles, /sf-admin-nav-dot/);
  // The ring is the rail's surface.
  assert.match(styles, /\.sf-admin-nav-first \{\s*--sf-badge--surface: var\(--sf-surface-1\);/);
});

test('the badges component that styles the counts is a relation of the package component', async () => {
  const rule = await read('src/smart/admin-menu/rule.js');
  const manifest = JSON.parse(await read('src/smart/admin-menu/smart.manifest.json'));
  assert.match(rule, /\{ name: (['"])badges\1 \}/u);
  assert.ok(manifest.composition.uses.includes('component.badges'));
  const sheet = await read('src/component/badges/scss/_css__badges_anchored.scss');
  assert.match(sheet, /\.sf-badge-anchor > \.sf-badge--anchored \{/);
});
