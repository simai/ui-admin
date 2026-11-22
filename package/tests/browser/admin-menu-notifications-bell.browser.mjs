#!/usr/bin/env node
// Usage: node this-file /absolute/path/to/output
//
// sf-admin-menu 1.15.1 on the built bytes with the real Loader, by real
// clicks and keys: the bell and the set's notifications panel.
//   - a page that holds sf-admin-notifications (panel look) in an sf-drawer:
//     the menu's bell opens that drawer (no list of the menu's own is drawn),
//     the list is drawn from the port, aria-expanded is true; Escape closes
//     it, the focus is back on the bell, aria-expanded false; a click on an
//     unread notice reads it over the port as {keys: [n1], all: false};
//     1440 light and dark, and 390 dark from inside the phone menu;
//   - a page without that list: the bell opens the menu's own list, and a
//     notice opened there is read as {keys: [n1], all: false}, never {ids};
//   - no sideways scroll, no console error or warning.
import {lab, finish} from './admin-set-lab.mjs';

if (!process.argv[2]) throw new Error('Build output root is required');

const GROUPS = [{key: 'today', label: 'Сегодня', items: [
  {key: 'n1', title: 'Сертификат истекает через 7 дней', when: '10:42', unread: true, href: '#/srv.security', icon: null, body: null},
  {key: 'n2', title: 'Копия не сделана: хранилище не ответило', when: '03:10', unread: true, href: '#/srv.backups', icon: null, body: null},
  {key: 'n3', title: 'Служба почты перезапущена', when: '02:40', unread: false, href: '#/srv.services', icon: null, body: null},
]}];
const ANSWER = {
  answer: 'applied', revision: '1', echo: {site: 'main', profile: 'regular', sequence: null},
  site: {current: {key: 'main', label: 'Larena Panel', caption: 'panel.test'}, count: 1},
  current: 'dns',
  items: [
    {key: 'overview', kind: 'page', level: 'site', label: 'Обзор', icon: 'dashboard', href: '#/overview'},
    {key: 'dns', kind: 'page', level: 'site', label: 'DNS-зоны', icon: 'dns', href: '#/dns'},
  ],
  favourites: [],
  profiles: {current: 'regular', list: [{key: 'regular', label: 'Общий', kind: 'shared', renamable: false, removable: false}]},
  rights: {edit_personal: false, edit_shared: false, create_shared: false},
  person: {name: 'Rim', theme: 'light', language: 'ru', compact: false, languages: [{code: 'ru', native: 'Русский', english: 'Russian'}]},
  notifications: {unread: 2, href: '#/notifications'},
};
// One port for the menu and the list, as on an admin page: what was asked
// is in window.__asked.
const PORT = `<script>
window.__asked = [];
window.__port = {port: 'simai.admin-navigation-port', version: '1.1.0', capabilities: ['notifications'], unread: 2, read: new Set(),
  async raise(intent, payload) {
    window.__asked.push([intent, payload]);
    if (intent === 'navigation.load') return {...structuredClone(${JSON.stringify(ANSWER)}), notifications: {unread: this.unread, href: '#/notifications'}};
    if (intent === 'notifications.load') {
      const groups = structuredClone(${JSON.stringify(GROUPS)});
      for (const group of groups) for (const item of group.items) if (this.read.has(item.key)) item.unread = false;
      return {answer: 'applied', groups, unread: this.unread, settings_href: '#/settings/notifications', next_cursor: null};
    }
    if (intent === 'notifications.read') {
      const keys = Array.isArray(payload.keys) ? payload.keys : [];
      if (typeof payload.all !== 'boolean' || Object.keys(payload).some((key) => key !== 'keys' && key !== 'all')) return {answer: 'refused', reason: 'payload'};
      for (const key of payload.all ? ['n1', 'n2'] : keys) this.read.add(key);
      this.unread = 2 - ['n1', 'n2'].filter((key) => this.read.has(key)).length;
      return {answer: 'applied', unread: this.unread};
    }
    return {answer: 'applied'};
  }};
customElements.whenDefined('sf-admin-menu').then(() => document.getElementById('m').connectPort({port: window.__port}));
customElements.whenDefined('sf-admin-notifications').then(() => { for (const list of document.querySelectorAll('sf-admin-notifications')) list.connectPort({port: window.__port}); });
</script>`;
const shell = (extra = '') => `<sf-admin-shell id="s" product="Larena Panel">
  <sf-admin-menu slot="menu" id="m" aria-label="Меню" expected-columns="1"></sf-admin-menu>
  <sf-header-page slot="head" heading="DNS-зоны" star="false"></sf-header-page>
  <div id="content" style="block-size: 1200px">Содержимое</div>
</sf-admin-shell>
${extra}
${PORT}`;
const WITH_SET = shell(`<sf-drawer id="panel" placement="right" size="2" heading="Уведомления">
  <div slot="content"><sf-admin-notifications id="list" look="panel" aria-label="Уведомления" history-href="#/notifications"></sf-admin-notifications></div>
</sf-drawer>`);
const WITHOUT_SET = shell();

const failures = [];
const {open, ready, close} = await lab(process.argv[2]);
const bellOf = (page) => page.locator('#m .sf-admin-nav-bell:visible').first();
const facts = (page) => page.evaluate(() => {
  const bell = [...document.querySelectorAll('#m .sf-admin-nav-bell')].find((node) => node.getClientRects().length);
  const list = document.querySelector('#list .sf-admin-notifications');
  return {
    open: document.getElementById('panel')?.hasAttribute('open') ?? null,
    listShown: Boolean(list && list.getBoundingClientRect().width > 0 && document.querySelector('#list [data-status="ready"]')),
    own: document.querySelectorAll('[data-sf-admin-nav-notices]').length,
    ownOpen: Boolean(document.querySelector('[data-sf-admin-nav-notices][open]')),
    expanded: bell?.getAttribute('aria-expanded') ?? null,
    focusOnBell: Boolean(bell) && document.activeElement === bell,
    reads: window.__asked.filter(([intent]) => intent === 'notifications.read').map(([, payload]) => payload),
    sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  };
});

try {
  for (const [width, theme] of [[1440, 'light'], [1440, 'dark'], [390, 'dark']]) {
    const say = (text) => failures.push(`${width} ${theme}: ${text}`);
    const page = await open(WITH_SET, {width, height: width === 390 ? 844 : 900, theme});
    await ready(page, ['sf-admin-shell', 'sf-admin-menu', 'sf-admin-notifications']);
    await page.waitForFunction(() => document.querySelector('#m[data-column]') && document.querySelector('#list [data-status="ready"]'), null, {timeout: 15000});
    await page.waitForTimeout(300);
    if (width === 390) {
      await page.locator('.sf-admin-shell__menu-button button').click();
      await page.waitForTimeout(500);
    }
    await bellOf(page).click();
    await page.waitForFunction(() => document.getElementById('panel').hasAttribute('open'), null, {timeout: 5000}).catch(() => {});
    await page.waitForTimeout(500);
    const opened = await facts(page);
    if (!opened.open || !opened.listShown || opened.own || opened.expanded !== 'true') say(`the bell does not open the set panel alone: ${JSON.stringify(opened)}`);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const closed = await facts(page);
    if (closed.open || !closed.focusOnBell || closed.expanded !== 'false') say(`Escape: ${JSON.stringify(closed)}`);
    if (width === 390 && !(await page.evaluate(() => document.getElementById('s').hasAttribute('menu-open')))) say('Escape in the panel also closed the phone menu');

    // A read mark from the set panel goes over the port as {keys}.
    await bellOf(page).click();
    await page.waitForFunction(() => document.getElementById('panel').hasAttribute('open'), null, {timeout: 5000}).catch(() => {});
    await page.waitForTimeout(400);
    await page.evaluate(() => document.getElementById('list').addEventListener('sf-admin-notifications-open', (event) => event.preventDefault()));
    await page.locator('#list [data-key="n1"] .sf-admin-notifications__title').click();
    await page.waitForTimeout(500);
    const marked = await facts(page);
    if (JSON.stringify(marked.reads) !== JSON.stringify([{keys: ['n1'], all: false}])) say(`set panel read: ${JSON.stringify(marked.reads)}`);
    if (marked.sideways) say('sideways scroll');
    if (page.noise.length) say(page.noise.join(' | '));
    await page.closeAll();
  }

  // Without the set's list: the menu's own list, read with {keys}.
  {
    const say = (text) => failures.push(`1440 own list: ${text}`);
    const page = await open(WITHOUT_SET, {width: 1440});
    await ready(page, ['sf-admin-shell', 'sf-admin-menu']);
    await page.waitForFunction(() => document.querySelector('#m[data-column]'), null, {timeout: 15000});
    await page.waitForTimeout(300);
    await bellOf(page).click();
    // sf-drawer draws its content in its portal at the end of the body.
    await page.waitForFunction(() => document.querySelector('[data-sf-admin-nav-notices][open]') && document.querySelector('[data-sf-drawer-portal] .sf-admin-nav-notices-body a[data-notice]'), null, {timeout: 8000}).catch(() => {});
    const own = await facts(page);
    if (!own.ownOpen || own.expanded !== 'true') say(`the bell does not open the own list: ${JSON.stringify(own)}`);
    await page.locator('[data-sf-drawer-portal] .sf-admin-nav-notices-body a[data-notice="n1"]').click();
    await page.waitForTimeout(500);
    const read = await facts(page);
    if (JSON.stringify(read.reads) !== JSON.stringify([{keys: ['n1'], all: false}])) say(`own list read: ${JSON.stringify(read.reads)}`);
    if (read.ownOpen || !read.focusOnBell) say(`after the read the list closes and the focus is on the bell: ${JSON.stringify(read)}`);
    if (page.noise.length) say(page.noise.join(' | '));
    await page.closeAll();
  }
} catch (error) {
  failures.push(error.stack || error.message);
} finally {
  await close();
}
finish(failures, 'admin-menu bell: opens the set panel (1440 light/dark, 390 dark from the phone menu), Escape closes it with the focus back on the bell, reads go over the port as {keys, all}; without the set list the own list, read with {keys}');
