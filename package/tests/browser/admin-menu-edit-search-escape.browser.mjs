#!/usr/bin/env node
// Usage: node this-file /absolute/path/to/output
//
// sf-admin-menu 1.17.2 on the built bytes with the real Loader: in the setting
// mode, an Escape pressed in the ⌘K window is the window's (AM-61: Escape
// leaves the setting mode once what is open inside it has had it).
// sf-search marks its open window with the host state data-open, not open, so
// the menu must read that state:
//   - with «Настроить меню» on and the ⌘K window open, the menu counts the
//     window as open (escapeTaken is true while sf-search says data-open);
//   - a real Escape closes the window and the setting mode stays on;
//   - a second Escape, with nothing open, leaves the setting mode;
//   - 1440 light and dark; no console error or warning.
import {lab, finish} from './admin-set-lab.mjs';

if (!process.argv[2]) throw new Error('Build output root is required');

const ANSWER = {
  answer: 'applied', revision: '1', echo: {site: 'main', profile: 'mine', sequence: null},
  site: {current: {key: 'main', label: 'Larena Panel', caption: 'panel.test'}, count: 1},
  current: 'dns',
  items: [
    {key: 'overview', kind: 'page', level: 'site', label: 'Обзор', icon: 'dashboard', href: '#/overview'},
    {key: 'srv', kind: 'root', level: 'site', label: 'Сервер', icon: 'dns', children: [
      {key: 'dns', kind: 'page', level: 'site', label: 'DNS-зоны', icon: 'dns', href: '#/dns'},
      {key: 'mail', kind: 'page', level: 'site', label: 'Почта', icon: 'mail', href: '#/mail'},
    ]},
  ],
  favourites: [],
  profiles: {current: 'mine', list: [{key: 'regular', label: 'Общий', kind: 'shared', renamable: false, removable: false}, {key: 'mine', label: 'Мой', kind: 'personal', renamable: true, removable: true}]},
  rights: {edit_personal: true, edit_shared: false, create_shared: false},
  person: {name: 'Rim', theme: 'light', language: 'ru', compact: false, languages: [{code: 'ru', native: 'Русский', english: 'Russian'}]},
};
const BODY = `<sf-admin-shell id="s" product="Larena Panel">
  <sf-admin-menu slot="menu" id="m" aria-label="Меню" expected-columns="2"></sf-admin-menu>
  <sf-header-page slot="head" heading="DNS-зоны" star="false"></sf-header-page>
  <div id="content" style="block-size: 1200px">Содержимое</div>
</sf-admin-shell>
<script>
window.__port = {port: 'simai.admin-navigation-port', version: '1.1.0', capabilities: ['search', 'menu-profiles'],
  async raise(intent) {
    if (intent === 'navigation.load') return structuredClone(${JSON.stringify(ANSWER)});
    if (intent === 'search.query') return {answer: 'applied', groups: [{key: 'pages', label: 'Страницы', items: [{key: 'dns', label: 'DNS-зоны', href: '#/dns', icon: 'dns'}]}]};
    return {answer: 'applied'};
  }};
customElements.whenDefined('sf-admin-menu').then(() => document.getElementById('m').connectPort({port: window.__port}));
</script>`;

const failures = [];
const {open, ready, close} = await lab(process.argv[2]);
const state = (page) => page.evaluate(() => {
  const search = document.querySelector('#m sf-search.sf-admin-nav-search');
  const nav = document.getElementById('m')._navigation;
  return {
    edit: Boolean(nav?.edit?.on) && Boolean(document.querySelector('#m .sf-admin-nav-edit-head')),
    open: search?.isOpen === true,
    dataOpen: search?.getAttribute('data-open') ?? null,
    taken: typeof nav?.escapeTaken === 'function' ? nav.escapeTaken(new KeyboardEvent('keydown', {key: 'Escape'})) : null,
  };
});

try {
  for (const theme of ['light', 'dark']) {
    const say = (text) => failures.push(`1440 ${theme}: ${text}`);
    const page = await open(BODY, {width: 1440, height: 900, theme});
    await ready(page, ['sf-admin-shell', 'sf-admin-menu']);
    await page.waitForFunction(() => document.querySelector('#m[data-column]') && document.querySelector('#m nav.sf-admin-nav:not(.sf-admin-nav--skeleton)'), null, {timeout: 15000});
    await page.waitForTimeout(400);

    // «Настроить меню» from the person menu, by real clicks.
    await page.locator('#m .sf-admin-nav-person:visible').first().click();
    const menu = await page.waitForFunction(() => document.querySelector('sf-menu-context[data-sf-admin-nav-menu]')?.isOpen === true, null, {timeout: 8000}).then(() => true, () => false);
    if (!menu) say('the person button did not open its menu');
    await page.locator('text=Настроить меню').first().click();
    const setting = await page.waitForFunction(() => document.getElementById('m')._navigation?.edit?.on && document.querySelector('#m .sf-admin-nav-edit-head'), null, {timeout: 8000}).then(() => true, () => false);
    if (!setting) say('«Настроить меню» did not turn the setting mode on');
    await page.waitForTimeout(300);

    // ⌘K opens the window over the setting mode.
    await page.keyboard.press('ControlOrMeta+k');
    const opened = await page.waitForFunction(() => document.querySelector('#m sf-search.sf-admin-nav-search')?.isOpen === true, null, {timeout: 8000}).then(() => true, () => false);
    if (!opened) say('mod+k did not open the search window in the setting mode');
    await page.waitForTimeout(300);
    const withWindow = await state(page);
    if (withWindow.dataOpen !== 'true') say(`sf-search does not say data-open while open: ${JSON.stringify(withWindow)}`);
    if (withWindow.taken !== true) say(`the menu does not see the open search window (escapeTaken ${withWindow.taken})`);
    if (!withWindow.edit) say('the setting mode went off when the window opened');

    // The first Escape is the window's.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const afterFirst = await state(page);
    if (afterFirst.open) say('the first Escape left the search window open');
    if (!afterFirst.edit) say('the first Escape, pressed in the search window, also left the setting mode');

    // The second Escape, with nothing open, leaves the setting mode.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const afterSecond = await state(page);
    if (afterSecond.edit) say('the second Escape did not leave the setting mode');

    console.log(JSON.stringify({theme, withWindow, afterFirst, afterSecond}));
    if (page.noise.length) say(page.noise.join(' | '));
    await page.closeAll();
  }
} finally {
  await close();
}

finish(failures, 'sf-admin-menu: in the setting mode an Escape in the ⌘K window closes the window only; the next one leaves the mode');
