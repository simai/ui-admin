#!/usr/bin/env node
// Usage: node this-file /absolute/path/to/output
//
// sf-admin-shell places only what is in it now (AS-5, ui-control
// control/research/2026-11-22-admin-settings-study): a page that swaps its body
// without a reload -- the body element replaced in place, or removed and a new
// one written into the shell -- has one form after each swap, twice, at 1440
// and 390; at 390 after the phone menu opens and closes (the next placing),
// too. No console error or warning.
import {lab, finish} from './admin-set-lab.mjs';

if (!process.argv[2]) throw new Error('Build output root is required');

const ANSWER = {
  answer: 'applied', revision: '1', echo: {site: 'main', profile: 'regular', sequence: null},
  site: {current: {key: 'main', label: 'Larena Panel', caption: 'panel.test'}, count: 1},
  current: 'settings',
  items: [
    {key: 'overview', kind: 'page', level: 'site', label: 'Обзор', icon: 'dashboard', href: '#/overview'},
    {key: 'settings', kind: 'page', level: 'site', label: 'Настройки', icon: 'settings', href: '#/settings'},
  ],
  favourites: [],
  profiles: {current: 'regular', list: [{key: 'regular', label: 'Общий', kind: 'shared', renamable: false, removable: false}]},
  rights: {edit_personal: false, edit_shared: false, create_shared: false},
  person: {name: 'Rim', theme: 'light', language: 'ru', compact: false, languages: [{code: 'ru', native: 'Русский', english: 'Russian'}]},
};
const BODY = `<sf-admin-shell id="s" product="Larena Panel" width="read">
  <sf-admin-menu slot="menu" id="m" aria-label="Меню" expected-columns="1"></sf-admin-menu>
  <sf-header-page slot="head" heading="Настройки сайта"></sf-header-page>
  <section id="body" data-body="0"><form data-form="0"><label>Название <input name="title" value="Сайт 0"></label></form></section>
</sf-admin-shell>
<script>customElements.whenDefined('sf-admin-menu').then(() => document.getElementById('m').setHostPort({
  port: 'simai.admin-navigation-port', version: '1.1.0', capabilities: [],
  async raise(intent) { return intent === 'navigation.load' ? structuredClone(${JSON.stringify(ANSWER)}) : {answer: 'applied'}; },
}));
// The two ways a page swaps its body without a reload.
window.swapBody = (n, how) => {
  const old = document.getElementById('body');
  const fresh = document.createElement('section');
  fresh.id = 'body';
  fresh.dataset.body = String(n);
  fresh.innerHTML = '<form data-form="' + n + '"><label>Название <input name="title" value="Сайт ' + n + '"></label></form>';
  if (how === 'replace') old.replaceWith(fresh);
  else { old.remove(); document.getElementById('s').append(fresh); }
};</script>`;

const facts = (page) => page.evaluate(() => {
  const shell = document.getElementById('s');
  const forms = [...shell.querySelectorAll('form')];
  return {
    forms: forms.map((form) => form.dataset.form),
    bodies: shell.querySelectorAll('section[data-body]').length,
    inContent: forms.every((form) => form.closest('[data-area="content"]')),
    shown: forms.filter((form) => form.getBoundingClientRect().height > 0).length,
  };
});

const failures = [];
const {open, ready, close} = await lab(process.argv[2]);
try {
  for (const width of [1440, 390]) for (const how of ['replace', 'append']) {
    const page = await open(BODY, {width, height: width === 390 ? 844 : 900});
    await ready(page, ['sf-admin-shell', 'sf-admin-menu']);
    await page.waitForFunction(() => document.querySelector('#m[data-column]'), null, {timeout: 15000});
    await page.waitForTimeout(300);
    for (const n of [1, 2]) {
      await page.evaluate(([one, way]) => window.swapBody(one, way), [n, how]);
      await page.waitForTimeout(250);
      let seen = await facts(page);
      if (JSON.stringify(seen.forms) !== JSON.stringify([String(n)]) || seen.bodies !== 1 || !seen.inContent || seen.shown !== 1) failures.push(`${width} ${how}: after swap ${n} not one form in the content: ${JSON.stringify(seen)}`);
      if (width === 390) {
        await page.locator('.sf-admin-shell__menu-button button').click();
        await page.waitForTimeout(400);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
        seen = await facts(page);
        if (JSON.stringify(seen.forms) !== JSON.stringify([String(n)]) || seen.bodies !== 1 || seen.shown !== 1) failures.push(`390 ${how}: after swap ${n} and the phone menu open and closed, not one form: ${JSON.stringify(seen)}`);
      }
    }
    const menuPlaced = await page.evaluate(() => Boolean(document.querySelector('#s [data-area="menu"] > #m')) && Boolean(document.querySelector('#s [data-area="head"] > sf-header-page')));
    if (!menuPlaced) failures.push(`${width} ${how}: the menu or the head left its place`);
    if (page.noise.length) failures.push(`${width} ${how}: ${page.noise.join(' | ')}`);
    await page.closeAll();
  }
} catch (error) {
  failures.push(error.stack || error.message);
} finally {
  await close();
}
finish(failures, 'admin-shell body swap (AS-5): one form after each of two swaps (replaced in place, and removed with a new body written), at 1440 and 390, at 390 after the phone menu opens and closes too; the menu and the head stay placed');
