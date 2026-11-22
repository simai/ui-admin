#!/usr/bin/env node
// The home page's live examples as clean demos, for what Docara 3.11.1 has
// no block setting for (docs/DOCARA-REQUESTS.md, 14). In <locale>/index.html,
// the page with a hero, of a copy of the built site, the examples' code tabs
// and toolbars are hidden and the live frames stay. The same examples with
// their code are on the guide page guide/showcase/. The hero's effect gets a
// mask that keeps it away from the text (request 16).
//
// It runs on the local review copy only (scripts/publish-local.sh), not as a
// Docara page transform: verify-static compares each page's Framework asset
// plan, which hashes the page body before the transforms run, with the final
// HTML, so a transform that changes the body fails the check (request 15).
// The verified build keeps Docara's own markup.
//
// No class is added or removed. Every edit asserts that its anchor was found,
// so a change in Docara's markup stops the copy instead of passing unchanged.
//
// Usage: node scripts/landing-transform.mjs <site folder>
import {existsSync, readdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

const site = process.argv.at(-1);
if (!site || !existsSync(site)) throw new Error('landing-transform: the built site folder is the last argument');

const need = (index, what, file) => {
  if (index < 0) throw new Error(`landing-transform: ${file}: ${what} not found`);
  return index;
};

const transform = (html, file) => {
  // Every live example of the home page without its code tabs (the list and
  // the set's components); the code is on guide/showcase/.
  let at = need(html.indexOf('<section data-docara-example='), 'the live example', file);
  let count = 0;
  while (at >= 0) {
    // Hidden, not removed: the shell's example script still finds its tabs.
    // The source panels are hidden already and stay.
    // Docara 3.18 adds the sf-tabs classes to the header; they are kept.
    const header = need(html.indexOf('<div class="docara-example-preview__header', at), 'the example header', file);
    const open = need(html.indexOf('">', header), 'the end of the example header tag', file) + 2;
    html = `${html.slice(0, open - 1)} style="display:none">${html.slice(open)}`;
    html = `${html.slice(0, at)}<section data-view-clean-example ${html.slice(at + '<section '.length)}`;
    count += 1;
    at = html.indexOf('<section data-docara-example=', at + 1);
  }
  return {html, count};
};

// The hero's moving tiles never sit under its text (DEV msg-6af8ca2d; the
// hero has no setting for it, request 16). The effect layer is the section's
// first child, made at run time with its canvas; a mask fades it to a tenth
// under the text block, from the text side, and gives it full strength only
// in the free part beyond the text. The banner itself is not dimmed.
// --view-hero-text-end is where the text block ends, measured from the
// heading's words, the subtitle and the buttons on load and on resize.
const HERO_MASK = `<style data-view-hero-mask>
[data-docara-block="hero"][data-sf-effect] > div:first-child:not([data-docara-container]) {
  -webkit-mask-image: linear-gradient(to right, rgb(0 0 0 / 0.1) 0, rgb(0 0 0 / 0.1) var(--view-hero-text-end, 100%), #000 calc(var(--view-hero-text-end, 100%) + 12rem));
  mask-image: linear-gradient(to right, rgb(0 0 0 / 0.1) 0, rgb(0 0 0 / 0.1) var(--view-hero-text-end, 100%), #000 calc(var(--view-hero-text-end, 100%) + 12rem));
}
</style>
<script data-view-hero-mask>
(() => {
  const place = () => {
    const hero = document.querySelector('[data-docara-block="hero"][data-sf-effect]');
    const text = hero?.querySelector('[data-docara-container] > div');
    if (!hero || !text) return;
    const left = hero.getBoundingClientRect().left;
    let end = 0;
    for (const part of text.children) {
      const range = document.createRange();
      range.selectNodeContents(part);
      for (const box of range.getClientRects()) end = Math.max(end, box.right);
      for (const child of part.children) end = Math.max(end, child.getBoundingClientRect().right);
    }
    hero.style.setProperty('--view-hero-text-end', \`\${Math.ceil(end - left + 16)}px\`);
  };
  addEventListener('DOMContentLoaded', place);
  addEventListener('load', place);
  addEventListener('resize', place);
  document.fonts?.ready.then(place);
})();
</script>
`;

let changed = 0;
for (const entry of readdirSync(site, {withFileTypes: true})) {
  if (!entry.isDirectory() || entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
  const file = join(site, entry.name, 'index.html');
  if (!existsSync(file)) continue;
  const html = readFileSync(file, 'utf8');
  if (!html.includes('<section data-docara-block="hero"') || !html.includes('<section data-docara-example=')) continue;
  const result = transform(html, file);
  if (html.includes('data-sf-effect=')) {
    const head = need(result.html.indexOf('</head>'), 'the end of the head', file);
    result.html = `${result.html.slice(0, head)}${HERO_MASK}${result.html.slice(head)}`;
  }
  writeFileSync(file, result.html);
  changed += result.count;
}
if (changed === 0) throw new Error('landing-transform: no home page with a hero and an example found');
console.log(`landing-transform: ${changed} home example(s)`);
