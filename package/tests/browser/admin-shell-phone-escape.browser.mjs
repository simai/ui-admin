#!/usr/bin/env node
// Usage: node this-file /absolute/path/to/output
//
// sf-admin-shell 1.0.1 (LM-R1) on the built bytes with the real Loader: on a
// phone (390, light and dark) with the menu open, the bell's notifications
// panel stands over the menu, so Escape is the panel's first, by real keys:
//   - the first Escape closes the panel, the menu stays open and the focus
//     comes back to the bell (up to 1.0.0 it closed the menu under the panel,
//     the panel stayed and the focus went to the hidden menu button);
//   - the second Escape closes the menu and the focus goes to the menu button;
//   - no console error or warning.
import {lab, finish} from './admin-set-lab.mjs';

if (!process.argv[2]) throw new Error('Build output root is required');

const ANSWER = {
  answer: 'applied', revision: '1', echo: {site: 'main', profile: 'regular', sequence: null},
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
window.__port = {port: 'simai.admin-navigation-port', version: '1.1.0', capabilities: ['notifications'],
  async raise(intent) {
    if (intent === 'navigation.load') return structuredClone(${JSON.stringify(ANSWER)});
    if (intent === 'notifications.load') return {answer: 'applied', groups: structuredClone(${JSON.stringify(GROUPS)}), unread: 1, settings_href: null, next_cursor: null};
    return {answer: 'applied'};
  }};
customElements.whenDefined('sf-admin-menu').then(() => document.getElementById('m').connectPort({port: window.__port}));
</script>`;

const state = (page) => page.evaluate(() => {
  let node = document.activeElement;
  while (node?.shadowRoot?.activeElement) node = node.shadowRoot.activeElement;
  const button = document.querySelector('sf-admin-shell button[aria-controls]');
  return {
    panel: Boolean(document.querySelector('sf-drawer[data-sf-admin-nav-notices][open]')),
    menu: button?.getAttribute('aria-expanded') === 'true',
    onBell: Boolean(node?.closest?.('.sf-admin-nav-bell')),
    onMenuButton: node === button || Boolean(button && node?.closest?.('sf-button-icon')?.contains(button)),
  };
});

const failures = [];
const {open, ready, close} = await lab(process.argv[2]);

try {
  for (const theme of ['light', 'dark']) {
    const say = (text) => failures.push(`390 ${theme}: ${text}`);
    const page = await open(BODY, {width: 390, height: 844, theme});
    await ready(page, ['sf-admin-shell', 'sf-admin-menu']);
    await page.waitForFunction(() => document.querySelector('#m nav.sf-admin-nav:not(.sf-admin-nav--skeleton)'), null, {timeout: 15000});
    await page.waitForLoadState('networkidle');
    await page.locator('sf-admin-shell button[aria-controls]').click();
    const opened = await page.waitForFunction(() => document.querySelector('sf-admin-shell button[aria-controls]')?.getAttribute('aria-expanded') === 'true', null, {timeout: 5000}).then(() => true, () => false);
    if (!opened) say('the menu button did not open the menu');
    await page.locator('#m .sf-admin-nav-bell:visible').first().click();
    const panel = await page.waitForFunction(() => document.querySelector('[data-sf-admin-nav-notices][open]') && document.querySelector('[data-sf-drawer-portal] .sf-admin-nav-notices-body a[data-notice]'), null, {timeout: 8000}).then(() => true, () => false);
    if (!panel) say('the bell did not open its panel');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const first = await state(page);
    if (first.panel) say('the first Escape left the panel open');
    if (!first.menu) say('the first Escape closed the menu under the panel');
    if (!first.onBell) say('after the first Escape the focus is not on the bell');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const second = await state(page);
    if (second.menu) say('the second Escape left the menu open');
    if (!second.onMenuButton) say('after the second Escape the focus is not on the menu button');
    if (page.noise.length) say(page.noise.join(' | '));
    await page.closeAll();
  }
} finally {
  await close();
}

finish(failures, 'sf-admin-shell: on a phone the first Escape closes the bell panel over the menu and gives the focus to the bell; the second closes the menu');
