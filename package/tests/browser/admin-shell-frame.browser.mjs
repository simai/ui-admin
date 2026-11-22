#!/usr/bin/env node
// Usage: node this-file /absolute/path/to/output
//
// sf-admin-shell 1.0.0 (owner decision C420) on the built bytes with the real
// Loader, driven by real keys and clicks, over the released sf-admin-menu:
//   1440: the skip link is the first stop of Tab and takes the focus to main;
//         the document scrolls and the bar and the menu stay where they were;
//         --sf-admin-shell-stick is the bar's height; the menu's room (rail
//         and column) is held from the shell's first frame until the menu
//         draws, held back 1.5 s: the content's x never moves;
//   390:  the slim top line sticks under the bar; the menu button opens the
//         menu over the page and moves the focus into it, Escape closes it and
//         the focus returns to the button;
//   both: no sideways scroll, no console error or warning.
import {lab, finish} from './admin-set-lab.mjs';

const ANSWER = {
  answer: 'applied', revision: '1', echo: {site: 'main', profile: 'regular', sequence: null},
  site: {current: {key: 'main', label: 'Larena Panel', caption: 'panel.test'}, count: 1},
  current: 'dns',
  items: [
    {key: 'overview', kind: 'page', level: 'site', label: 'Обзор', icon: 'dashboard', href: '#/overview'},
    {key: 'dns', kind: 'page', level: 'site', label: 'DNS-зоны', icon: 'dns', href: '#/dns'},
    {key: 'sites', kind: 'page', level: 'site', label: 'Сайты', icon: 'web', href: '#/sites'},
  ],
  favourites: [],
  profiles: {current: 'regular', list: [{key: 'regular', label: 'Общий', kind: 'shared', renamable: false, removable: false}]},
  rights: {edit_personal: false, edit_shared: false, create_shared: false},
  person: {name: 'Rim', theme: 'light', language: 'ru', compact: false, languages: [{code: 'ru', native: 'Русский', english: 'Russian'}]},
};
const ROOTED = {...ANSWER, current: 'dns.zones', items: [ANSWER.items[0], {key: 'dns', kind: 'root', level: 'site', label: 'DNS', icon: 'dns', children: [
  {key: 'dns.zones', kind: 'page', level: 'site', label: 'DNS-зоны', icon: 'dns', href: '#/dns/zones'},
  {key: 'dns.records', kind: 'page', level: 'site', label: 'Записи', icon: 'list', href: '#/dns/records'},
]}, ANSWER.items[2]]};
const pageOf = (answer, columns) => `<sf-admin-shell id="s" product="Larena Panel">
  <div slot="bar" id="bar" style="block-size: 40px; display: flex; align-items: center; padding-inline: 16px; background: var(--sf-surface-container)">Полоса сообщений</div>
  <sf-admin-menu slot="menu" id="m" aria-label="Меню"${columns ? ` expected-columns="${columns}"` : ''}></sf-admin-menu>
  <sf-header-page slot="head" heading="DNS-зоны" star="false"></sf-header-page>
  <a slot="top-end" id="bell" href="#/notifications">Уведомления</a>
  <div id="content" style="block-size: 3000px"><a id="first-link" href="#/a">Первая ссылка содержимого</a></div>
</sf-admin-shell>
<script>customElements.whenDefined('sf-admin-menu').then(() => document.getElementById('m').setHostPort({
  port: 'simai.admin-navigation-port', version: '1.1.0', capabilities: [],
  async raise(intent) { return intent === 'navigation.load' ? structuredClone(${JSON.stringify(answer)}) : {answer: 'applied'}; },
}));</script>`;
const BODY = pageOf(ANSWER, 1);

const failures = [];
const {open, ready, close} = await lab(process.argv[2]);
const sideways = (page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
try {
  // ── 1440: skip link, document scroll, stickiness ─────────────────────────
  {
    const page = await open(BODY, {width: 1440});
    await ready(page, ['sf-admin-shell', 'sf-admin-menu']);
    await page.waitForFunction(() => document.querySelector('#m[data-column]'), null, {timeout: 15000});
    await page.waitForTimeout(300);
    await page.keyboard.press('Tab');
    const skip = await page.evaluate(() => {
      const link = document.activeElement;
      const box = link.getBoundingClientRect();
      return {skip: link.classList.contains('sf-admin-shell__skip'), text: link.textContent.trim(), visible: box.top >= 0 && box.height > 0};
    });
    if (!skip.skip || skip.text !== 'Перейти к содержимому' || !skip.visible) failures.push(`1440: Tab does not reach a visible skip link first: ${JSON.stringify(skip)}`);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    const main = await page.evaluate(() => document.activeElement?.tagName === 'MAIN' && document.activeElement.getAttribute('aria-labelledby') === document.querySelector('#s h1')?.id);
    if (!main) failures.push('1440: Enter on the skip link does not take the focus to main named by the heading');
    const before = await page.evaluate(() => ({
      bar: document.getElementById('bar').getBoundingClientRect().top,
      nav: document.querySelector('.sf-admin-shell__nav').getBoundingClientRect().top,
      stick: getComputedStyle(document.querySelector('.sf-admin-shell')).getPropertyValue('--sf-admin-shell-stick').trim(),
      barHeight: document.getElementById('bar').getBoundingClientRect().height,
    }));
    await page.mouse.move(900, 500);
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => ({
      scrolled: window.scrollY,
      bar: document.getElementById('bar').getBoundingClientRect().top,
      nav: document.querySelector('.sf-admin-shell__nav').getBoundingClientRect().top,
      content: document.getElementById('content').getBoundingClientRect().top,
    }));
    if (after.scrolled < 500) failures.push(`1440: the document did not scroll: ${after.scrolled}`);
    if (Math.abs(after.bar) > 0.5) failures.push(`1440: the bar left the top: ${after.bar}`);
    if (Math.abs(after.nav - before.barHeight) > 0.5) failures.push(`1440: the menu does not stick under the bar: ${after.nav} vs ${before.barHeight}`);
    if (before.stick !== `${before.barHeight}px`) failures.push(`1440: --sf-admin-shell-stick is ${before.stick}, the bar ${before.barHeight}px`);
    if (await sideways(page)) failures.push('1440: sideways scroll');
    if (page.noise.length) failures.push(`1440: ${page.noise.join(' | ')}`);
    await page.closeAll();
  }

  // ── 1440: the menu's room before the menu (frame by frame) ───────────────
  // A dashboard row (expected-columns="1"): the rail; a row with an open root:
  // the rail and the column. Either way the content does not move.
  for (const [name, body] of [['rail', pageOf(ANSWER, 1)], ['rail and column', pageOf(ROOTED, 0)]]) {
    const page = await open(body, {
      width: 1440,
      slow: {pattern: /\/smart\/admin-menu\//u, ms: 1500},
      head: `<script>window.__frames = []; const tick = () => { const content = document.querySelector('.sf-admin-shell__content'); const host = document.querySelector('sf-admin-shell'); if (content && host && !host.hasAttribute('data-sf-style-pending')) { const box = content.getBoundingClientRect(); if (box.width > 0) window.__frames.push({x: Math.round(box.left * 10) / 10, menu: Boolean(document.querySelector('#m[data-column]')), t: Math.round(performance.now())}); } if (performance.now() < 8000) requestAnimationFrame(tick); }; requestAnimationFrame(tick);</script>`,
    });
    await page.waitForFunction(() => document.querySelector('#m[data-column]'), null, {timeout: 20000});
    await page.waitForTimeout(600);
    const frames = await page.evaluate(() => window.__frames);
    const before = frames.filter((frame) => !frame.menu);
    const xs = [...new Set(frames.map((frame) => frame.x))];
    if (!before.length) failures.push(`1440 slow menu (${name}): no frame of the shell before the menu drew; the probe saw nothing to hold`);
    if (xs.length !== 1) failures.push(`1440 slow menu (${name}): the content moved: x ${xs.join(', ')} over ${frames.length} frames (${before.length} before the menu)`);
    if (page.noise.length) failures.push(`1440 slow menu (${name}): ${page.noise.join(' | ')}`);
    await page.closeAll();
  }

  // ── 390: the top line and the phone menu ─────────────────────────────────
  {
    const page = await open(BODY, {width: 390, height: 844});
    await ready(page, ['sf-admin-shell', 'sf-admin-menu']);
    await page.waitForTimeout(600);
    await page.mouse.move(200, 500);
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(500);
    const top = await page.evaluate(() => ({
      line: document.querySelector('.sf-admin-shell__top').getBoundingClientRect().top,
      bar: document.getElementById('bar').getBoundingClientRect().height,
      product: document.querySelector('.sf-admin-shell__product')?.textContent.trim(),
      bell: Boolean(document.querySelector('.sf-admin-shell__top-end #bell')),
    }));
    if (Math.abs(top.line - top.bar) > 0.5) failures.push(`390: the top line does not stick under the bar: ${JSON.stringify(top)}`);
    if (top.product !== 'Larena Panel' || !top.bell) failures.push(`390: the top line lacks the product or the top-end: ${JSON.stringify(top)}`);
    const button = page.locator('.sf-admin-shell__menu-button button');
    await button.click();
    await page.waitForTimeout(400);
    const opened = await page.evaluate(() => ({
      attr: document.getElementById('s').hasAttribute('menu-open'),
      expanded: document.querySelector('.sf-admin-shell__menu-button button').getAttribute('aria-expanded'),
      nav: document.querySelector('.sf-admin-shell__nav').getBoundingClientRect().height > 0,
      main: document.querySelector('.sf-admin-shell__main').getBoundingClientRect().height,
      focusInMenu: document.querySelector('.sf-admin-shell__nav').contains(document.activeElement),
    }));
    if (!opened.attr || opened.expanded !== 'true' || !opened.nav || opened.main !== 0 || !opened.focusInMenu) failures.push(`390: the menu button does not open the menu: ${JSON.stringify(opened)}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    const closed = await page.evaluate(() => ({
      attr: document.getElementById('s').hasAttribute('menu-open'),
      expanded: document.querySelector('.sf-admin-shell__menu-button button').getAttribute('aria-expanded'),
      focusOnButton: document.activeElement === document.querySelector('.sf-admin-shell__menu-button button'),
      main: document.querySelector('.sf-admin-shell__main').getBoundingClientRect().height > 0,
    }));
    if (closed.attr || closed.expanded !== 'false' || !closed.focusOnButton || !closed.main) failures.push(`390: Escape does not close the menu and return the focus: ${JSON.stringify(closed)}`);
    if (await sideways(page)) failures.push('390: sideways scroll');
    if (page.noise.length) failures.push(`390: ${page.noise.join(' | ')}`);
    await page.closeAll();
  }
} catch (error) {
  failures.push(error.stack || error.message);
} finally {
  await close();
}
finish(failures, 'admin-shell frame: skip link, document scroll with the bar and the menu stuck, the menu room held frame by frame, the phone top line and menu with Escape and focus return');
