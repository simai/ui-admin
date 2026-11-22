#!/usr/bin/env node
// Usage: node this-file /absolute/path/to/output
//
// sf-admin-menu-navigate is cancelable (sf-admin-menu 1.16.1, AS-6): a page
// with unsaved changes refuses it and the menu keeps the current row and the
// focus and goes nowhere; allowed, the pressed row becomes current. By real
// keys and clicks, in sf-admin-shell, at 1440 and at 390 (in the phone menu,
// which stays open when refused and closes when allowed).
import {lab, finish} from './admin-set-lab.mjs';

if (!process.argv[2]) throw new Error('Build output root is required');

const ANSWER = {
  answer: 'applied', revision: '1', echo: {site: 'main', profile: 'regular', sequence: null},
  site: {current: {key: 'main', label: 'Larena Panel', caption: 'panel.test'}, count: 1},
  current: 'settings',
  items: [
    {key: 'overview', kind: 'page', level: 'site', label: 'Обзор', icon: 'dashboard', href: '#/overview'},
    {key: 'settings', kind: 'page', level: 'site', label: 'Настройки', icon: 'settings', href: '#/settings'},
    {key: 'sites', kind: 'page', level: 'site', label: 'Сайты', icon: 'web', href: '#/sites'},
  ],
  favourites: [],
  profiles: {current: 'regular', list: [{key: 'regular', label: 'Общий', kind: 'shared', renamable: false, removable: false}]},
  rights: {edit_personal: false, edit_shared: false, create_shared: false},
  person: {name: 'Rim', theme: 'light', language: 'ru', compact: false, languages: [{code: 'ru', native: 'Русский', english: 'Russian'}]},
};
const BODY = `<sf-admin-shell id="s" product="Larena Panel">
  <sf-admin-menu slot="menu" id="m" aria-label="Меню" expected-columns="1"></sf-admin-menu>
  <sf-header-page slot="head" heading="Настройки"></sf-header-page>
  <form id="f"><label>Название <input name="title" value="Сайт"></label></form>
</sf-admin-shell>
<script>
window.__navigate = [];
window.__dirty = true;
document.addEventListener('sf-admin-menu-navigate', (event) => {
  window.__navigate.push({key: event.detail.key, cancelable: event.cancelable});
  if (window.__dirty) event.preventDefault();
});
customElements.whenDefined('sf-admin-menu').then(() => document.getElementById('m').setHostPort({
  port: 'simai.admin-navigation-port', version: '1.1.0', capabilities: [],
  async raise(intent, payload) { return intent === 'navigation.load' ? structuredClone(${JSON.stringify(ANSWER)}) : {answer: 'applied', href: payload?.href ?? null}; },
}));</script>`;

const facts = (page) => page.evaluate(() => {
  const rows = [...document.querySelectorAll('#m .sf-admin-nav-row')].filter((row) => row.getClientRects().length);
  // A rail row is named by aria-label (its glyph alone shows); a row with its name drawn, by the label.
  const label = (row) => row?.getAttribute('aria-label') ?? row?.querySelector('.sf-admin-nav-row-label')?.textContent.trim() ?? null;
  const current = rows.find((row) => row.getAttribute('aria-current') === 'page');
  const focused = document.activeElement?.closest?.('.sf-admin-nav-row');
  return {
    current: label(current),
    focus: label(focused),
    sent: window.__navigate,
    menuOpen: document.getElementById('s').hasAttribute('menu-open'),
    hash: location.hash,
  };
});
const rowNamed = (page, name) => page.locator(`#m a.sf-admin-nav-row[aria-label="${name}"]:visible, #m a.sf-admin-nav-row:visible:has(.sf-admin-nav-row-label:text-is("${name}"))`).first();

const failures = [];
const {open, ready, close} = await lab(process.argv[2]);
try {
  for (const width of [1440, 390]) for (const by of ['click', 'Enter']) {
    const tag = `${width} ${by}`;
    const page = await open(BODY, {width, height: width === 390 ? 844 : 900});
    await ready(page, ['sf-admin-shell', 'sf-admin-menu']);
    await page.waitForFunction(() => document.querySelector('#m[data-column]'), null, {timeout: 15000});
    await page.waitForTimeout(400);
    if (width === 390) {
      await page.locator('.sf-admin-shell__menu-button button').click();
      await page.waitForTimeout(500);
    }
    const press = async () => {
      const row = rowNamed(page, 'Сайты');
      if (by === 'click') await row.click();
      else { await row.focus(); await page.keyboard.press('Enter'); }
      await page.waitForTimeout(500);
    };
    await press();
    const refused = await facts(page);
    if (refused.current !== 'Настройки') failures.push(`${tag}: refused, the current row moved: ${JSON.stringify(refused)}`);
    if (refused.focus !== 'Сайты') failures.push(`${tag}: refused, the focus left the pressed row: ${JSON.stringify(refused)}`);
    if (refused.sent.length !== 1 || refused.sent[0].key !== 'sites' || refused.sent[0].cancelable !== true) failures.push(`${tag}: navigate not sent once as cancelable: ${JSON.stringify(refused.sent)}`);
    if (refused.hash === '#/sites') failures.push(`${tag}: refused, the browser went to the row`);
    if (width === 390 && !refused.menuOpen) failures.push(`${tag}: refused, the phone menu closed`);
    await page.evaluate(() => { window.__dirty = false; });
    await press();
    const allowed = await facts(page);
    if (width === 390) {
      if (allowed.menuOpen) failures.push(`${tag}: allowed, the phone menu stayed open`);
      await page.locator('.sf-admin-shell__menu-button button').click();
      await page.waitForTimeout(500);
    }
    const after = width === 390 ? await facts(page) : allowed;
    if (after.current !== 'Сайты') failures.push(`${tag}: allowed, the pressed row is not current: ${JSON.stringify(after)}`);
    if (allowed.sent.length !== 2) failures.push(`${tag}: allowed, navigate not sent: ${JSON.stringify(allowed.sent)}`);
    if (page.noise.length) failures.push(`${tag}: ${page.noise.join(' | ')}`);
    await page.closeAll();
  }
} catch (error) {
  failures.push(error.stack || error.message);
} finally {
  await close();
}
finish(failures, 'admin-menu navigate cancelable (AS-6): refused by the page, the current row and the focus stay, the browser and the phone menu stay; allowed, the pressed row is current and the phone menu closes; by click and by Enter at 1440 and 390');
