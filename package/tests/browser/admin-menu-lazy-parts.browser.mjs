#!/usr/bin/env node
// Usage: node this-file /absolute/path/to/output
//
// sf-admin-menu 1.17.0 on the built bytes with the real Loader: a closed menu
// fetches only what it draws, and each part it does not draw comes on its
// first use, by real clicks and keys.
//   - closed (1440 light, 1440 dark, 390 light): no sf-search, sf-button,
//     sf-input, sf-drawer, sf-menu-context, sf-segmented, sf-sortable,
//     sf-dropdown or sf-profile-picker is defined, none of their files and
//     not the free component/admin-menu is requested, no sf-search is drawn;
//   - first use: mod+k opens the search window, Escape closes it; the bell
//     opens the notifications panel; the person button opens its menu and
//     «Настроить меню» the setting mode with its levels drawn;
//   - no console error or warning, no sideways scroll.
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
  notifications: {unread: 1, href: '#/notifications'},
};
const GROUPS = [{key: 'today', label: 'Сегодня', items: [{key: 'n1', title: 'Сертификат истекает', when: '10:42', unread: true, href: '#/n1', icon: null, body: null}]}];
const BODY = `<sf-admin-shell id="s" product="Larena Panel">
  <sf-admin-menu slot="menu" id="m" aria-label="Меню" expected-columns="2"></sf-admin-menu>
  <sf-header-page slot="head" heading="DNS-зоны" star="false"></sf-header-page>
  <div id="content" style="block-size: 1200px">Содержимое</div>
</sf-admin-shell>
<script>
window.__port = {port: 'simai.admin-navigation-port', version: '1.1.0', capabilities: ['notifications', 'search', 'menu-profiles'],
  async raise(intent) {
    if (intent === 'navigation.load') return structuredClone(${JSON.stringify(ANSWER)});
    if (intent === 'notifications.load') return {answer: 'applied', groups: structuredClone(${JSON.stringify(GROUPS)}), unread: 1, settings_href: null, next_cursor: null};
    if (intent === 'search.query') return {answer: 'applied', groups: [{key: 'pages', label: 'Страницы', items: [{key: 'dns', label: 'DNS-зоны', href: '#/dns', icon: 'dns'}]}]};
    return {answer: 'applied'};
  }};
customElements.whenDefined('sf-admin-menu').then(() => document.getElementById('m').connectPort({port: window.__port}));
</script>`;

const LAZY = ['sf-search', 'sf-button', 'sf-input', 'sf-drawer', 'sf-menu-context', 'sf-segmented', 'sf-sortable', 'sf-dropdown', 'sf-profile-picker'];
const LAZY_FOLDERS = /\/(smart\/(search|button|input|drawer|menu-context|segmented|sortable|dropdown|profile-picker)|component\/admin-menu)\//u;

const failures = [];
const {open, ready, close} = await lab(process.argv[2]);
const watch = (page) => { page.files = []; page.on('request', (request) => page.files.push(new URL(request.url()).pathname)); };

try {
  for (const [width, theme] of [[1440, 'light'], [1440, 'dark'], [390, 'light']]) {
    const say = (text) => failures.push(`${width} ${theme}: ${text}`);
    const page = await open(BODY, {width, height: width === 390 ? 844 : 900, theme, beforeLoad: watch});
    await ready(page, ['sf-admin-shell', 'sf-admin-menu']);
    await page.waitForFunction(() => document.querySelector('#m[data-column]') && document.querySelector('#m nav.sf-admin-nav:not(.sf-admin-nav--skeleton)'), null, {timeout: 15000});
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    const closed = await page.evaluate((tags) => ({
      defined: tags.filter((tag) => customElements.get(tag)),
      search: document.querySelectorAll('#m sf-search').length,
      sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }), LAZY);
    const early = page.files.filter((path) => LAZY_FOLDERS.test(path));
    if (closed.defined.length) say(`closed menu defined ${closed.defined.join(', ')}`);
    if (early.length) say(`closed menu requested ${early.join(', ')}`);
    if (closed.search) say('the search window is drawn before it is opened');
    if (closed.sideways) say('sideways scroll');

    if (width === 1440) {
      await page.keyboard.press('ControlOrMeta+k');
      const opened = await page.waitForFunction(() => document.querySelector('#m sf-search.sf-admin-nav-search')?.isOpen === true, null, {timeout: 8000}).then(() => true, () => false);
      if (!opened) say('mod+k did not open the search window');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      if (await page.evaluate(() => document.querySelector('#m sf-search.sf-admin-nav-search')?.isOpen)) say('Escape left the window open');

      await page.locator('#m .sf-admin-nav-bell:visible').first().click();
      const panel = await page.waitForFunction(() => document.querySelector('[data-sf-admin-nav-notices][open]') && document.querySelector('[data-sf-drawer-portal] .sf-admin-nav-notices-body a[data-notice]'), null, {timeout: 8000}).then(() => true, () => false);
      if (!panel) say('the bell did not open its panel');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);

      await page.locator('#m .sf-admin-nav-person:visible').first().click();
      const menu = await page.waitForFunction(() => document.querySelector('sf-menu-context[data-sf-admin-nav-menu]')?.isOpen === true, null, {timeout: 8000}).then(() => true, () => false);
      if (!menu) say('the person button did not open its menu');
      await page.locator('text=Настроить меню').first().click();
      const setting = await page.waitForFunction(() => {
        const head = document.querySelector('#m .sf-admin-nav-edit-head');
        return head && [...document.querySelectorAll('#m nav.sf-admin-nav *')].filter((node) => node.localName.startsWith('sf-'))
          .every((node) => customElements.get(node.localName) && !node.hasAttribute('data-sf-style-pending'));
      }, null, {timeout: 8000}).then(() => true, () => false);
      if (!setting) say('«Настроить меню» did not draw the setting mode with its parts');
    }
    if (page.noise.length) say(page.noise.join(' | '));
    await page.closeAll();
  }
} finally {
  await close();
}

finish(failures, 'sf-admin-menu: a closed menu fetches only what it draws; search, bell panel, person menu and setting mode come on first use');
