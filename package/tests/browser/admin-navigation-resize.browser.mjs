#!/usr/bin/env node
// Usage: node this-file /absolute/path/to/output
// The admin menu's navigation shell (owner, 2026-10-14), measured on the built
// bytes with a host port that answers the menu:
// - since 1.15.0 (C320, C365) the first column is the rail (--sf-d4, 56) and
//   the section column --sf-f6 (256); neither has a handle, and a width the
//   host still keeps for the person (person.widths) changes neither;
// - the theme is a row of the profile menu with its choice a level deeper:
//   sf-settings' row in the drill look, the value under the name (C176, K-11).
import {resolve, join} from 'node:path';
import {chromium} from 'playwright';

if (!process.argv[2]) throw new Error('Build output root is required');
const out = resolve(process.argv[2]);
const styles = [
  'core/core/css/core.css', 'core/core/css/utility.full.css',
  'component/component/admin-menu/css/admin-menu.css',
  'component/component/badges/css/badges.css',
  'component/component/inputs/css/inputs.css',
  'component/component/context-menu/css/context-menu.css',
  // The icons sheet: on a page with no Loader it is what draws an icon as one
  // glyph (ui-source ea3a53ca, core.css holds icons at 0 only where the Loader
  // runs). Without it a menu row's icon and chevron drew their names as text
  // (view_sidebar 88px, chevron_right 91px) and cut «Профиль меню» in a 320px
  // menu that a real page draws whole.
  'component/component/icons/css/icons.css',
  'smart/smart/admin-menu/css/admin-menu.css',
  'smart/smart/profile-picker/css/profile-picker.css',
].map((p) => join(out, p));
const modules = [
  'core/core/js/core.js', 'core/core/js/smart-base.js',
  'smart/smart/icon/js/icon.js', 'smart/smart/button/js/button.js',
  'smart/smart/button-icon/js/button-icon.js', 'smart/smart/badge/js/badge.js',
  'smart/smart/input/js/input.js', 'smart/smart/menu-context/js/menu-context.js',
  'smart/smart/profile-picker/js/profile-picker.js', 'smart/smart/admin-menu/js/admin-menu.js',
].map((p) => join(out, p));

const failures = [];
const note = (detail) => failures.push(detail);
const browser = await chromium.launch();
const context = await browser.newContext({viewport: {width: 1400, height: 800}});
// An origin of its own, so the remembered width has a storage to live in.
await context.route('http://probe.test/**', (route) => route.fulfill({status: 200, contentType: 'text/html', body: '<!doctype html><html><body></body></html>'}));

const NAVIGATION = {
  answer: 'applied', revision: '1', current: 'cms',
  items: [
    {key: 'home', kind: 'page', level: 'site', label: 'Главная', icon: 'home', href: '/admin'},
    {key: 'data', kind: 'root', level: 'site', label: 'Данные', icon: 'database', children: [
      {key: 'cms', kind: 'page', level: 'site', label: 'Минимальная CMS', icon: 'table', href: '/admin/cms'},
    ]},
  ],
  notifications: {unread: 1},
  favourites: [{key: 'cms', label: 'Минимальная CMS', icon: 'table', href: '/admin/cms'}],
  person: {name: 'Administrator', theme: 'dark', links: [{label: 'Безопасность учётной записи', icon: 'shield', href: '/admin/security'}], language: 'ru', languages: [{code: 'ru', native: 'Русский', english: 'Russian'}]},
  profiles: {current: 'regular', list: [
    {key: 'regular', label: 'Обычный', kind: 'shared'},
    {key: 'editors', label: 'Редакторы', kind: 'shared', renamable: true, removable: true},
  ]},
  rights: {edit_shared: true, edit_personal: true, create_shared: true},
  site: {current: {key: 'main', label: 'Main site'}, count: 1},
};

const open = async (person = {}, frame = 800) => {
  const page = await context.newPage();
  page.on('pageerror', (error) => console.error('pageerror', error.message));
  await page.goto('http://probe.test/');
  await page.setContent(`<!doctype html><html class="theme-light" lang="ru"><body style="margin:0"><div style="block-size:${frame}px;display:flex"><sf-admin-menu id="m" aria-label="Меню"></sf-admin-menu><main style="flex:1">Страница</main></div></body></html>`);
  for (const path of styles) await page.addStyleTag({path}).catch(() => {});
  for (const path of modules) await page.addScriptTag({path, type: 'module'}).catch(() => {});
  await page.waitForFunction(() => customElements.get('sf-admin-menu'), null, {timeout: 8000});
  await page.evaluate((navigation) => {
    window.raised = [];
    document.getElementById('m').setHostPort({
      port: 'simai.admin-navigation-port', version: '1.0.0', capabilities: ['preferences', 'menu-profiles', 'favourites', 'notifications'],
      async raise(intent, payload) {
        window.raised.push({intent, payload: structuredClone(payload)});
        if (intent === 'navigation.load') return structuredClone(navigation);
        // The setting mode's profiles: a personal one made on the first edit,
        // a level switch answered with the menu of that profile.
        if (intent === 'view.create') {
          window.navigationNow = structuredClone(navigation);
          window.navigationNow.profiles.list.push({key: 'mine', label: 'Моё', kind: 'personal'});
          return {answer: 'applied', profiles: window.navigationNow.profiles};
        }
        if (intent === 'view.profile') {
          const next = structuredClone(window.navigationNow ?? navigation);
          next.profiles.current = payload.profile;
          return {answer: 'applied', navigation: next};
        }
        return {answer: 'applied'};
      },
    });
  }, {...NAVIGATION, person: {...NAVIGATION.person, ...person}});
  await page.waitForTimeout(900);
  return page;
};

try {
  const page = await open();
  const widths = () => page.evaluate(() => {
    const first = document.querySelector('.sf-admin-nav-first');
    const second = document.querySelector('.sf-admin-nav-second');
    return {
      first: first ? Math.round(first.getBoundingClientRect().width) : null,
      second: second?.getClientRects().length ? Math.round(second.getBoundingClientRect().width) : null,
      handles: document.querySelectorAll('sf-admin-menu sf-resizer').length,
    };
  });
  const before = await widths();
  if (before.handles) note({case: 'no width handle (C365)', got: before});
  if (before.first !== 56) note({case: 'the first column is the rail, 56', got: before});
  if (before.second !== 256) note({case: 'the section column is 256 (--sf-f6)', got: before});
  const told = await page.evaluate(() => window.raised.filter((one) => one.intent === 'preference.widths' || one.intent === 'preference.compact'));
  if (told.length) note({case: 'no width or compact preference is sent (AM-29)', got: told});

  // Favourites are a section of their own: a star at the foot of the rail,
  // its pages in the section column with their section under the name (C368).
  const favourites = await page.evaluate(async () => {
    const star = document.querySelector('.sf-admin-nav-bottom .sf-admin-nav-row[data-key="sf:favourites"]');
    star?.click();
    await new Promise((done) => setTimeout(done, 300));
    const second = document.querySelector('.sf-admin-nav-second');
    return {star: Boolean(star), second: second?.getAttribute('aria-label') ?? null,
      rows: [...(second?.querySelectorAll('.sf-admin-nav-row-label') ?? [])].map((node) => node.textContent.replace(/\s+/gu, ' ').trim())};
  });
  if (!favourites.star || favourites.second !== 'Избранное' || !favourites.rows.some((row) => row.includes('Минимальная CMS'))) {
    note({case: 'favourites are a section at the foot of the menu', got: favourites});
  }

  // The bell carries the unread number (C342, AM-43): a numeric badge on the
  // rail square, no taller than a counter.
  const counter = await page.evaluate(() => {
    const badge = document.querySelector('.sf-admin-nav-bottom .sf-badge--anchored');
    return badge ? {text: badge.textContent.trim(), height: Math.round(badge.getBoundingClientRect().height)} : null;
  });
  if (!counter || counter.text !== '1' || counter.height > 16) note({case: 'the bell carries the unread number', got: counter});

  // The theme is a row with a submenu.
  const theme = await page.evaluate(async () => {
    const person = document.querySelector('.sf-admin-nav-person');
    person?.click();
    await new Promise((done) => setTimeout(done, 400));
    const menu = document.querySelector('sf-menu-context[data-sf-admin-nav-menu]');
    const rows = [...(menu?.querySelectorAll('.sf-context-menu-item') ?? [])];
    const row = rows.find((item) => item.querySelector('.sf-context-menu-item-label')?.textContent.trim() === 'Тема');
    const labels = [...(menu?.querySelectorAll('.sf-context-menu-item-label, .sf-context-menu-item-value, .sf-context-menu-item-under') ?? [])];
    return {
      cut: labels.filter((label) => label.scrollWidth > label.clientWidth + 1).map((label) => label.textContent.trim()),
      row: Boolean(row), value: row?.querySelector('.sf-context-menu-item-under, .sf-context-menu-item-value')?.textContent.trim() ?? null,
      submenu: row?.getAttribute('aria-haspopup') ?? null, drill: menu?.getAttribute('submenu') ?? null,
    };
  });
  if (theme.cut.length || !theme.row || theme.value !== 'Тёмная' || theme.submenu !== 'menu' || theme.drill !== 'drill') {
    note({case: 'the theme is a row with a submenu, no line cut', got: theme});
  }
  await page.keyboard.press('Escape');
  // The setting mode's «Профиль настроек» level is the profile picker: the
  // role profiles as rows, rename and remove where the person may, a new one
  // inline (C326 = C298).
  const picker = await page.evaluate(async () => {
    const controller = document.getElementById('m')._navigation;
    await controller?.startEdit();
    await new Promise((done) => setTimeout(done, 400));
    await controller?.chooseLevel('role');
    await new Promise((done) => setTimeout(done, 500));
    const element = document.querySelector('.sf-admin-nav-edit-head sf-profile-picker');
    element?.querySelector('.sf-profile-picker-trigger')?.click();
    await new Promise((done) => setTimeout(done, 300));
    return element ? {
      rows: [...element.querySelectorAll('.sf-profile-picker-row[data-id]')].map((row) => row.dataset.id),
      add: Boolean(element.querySelector('.sf-profile-picker-add')),
      levels: document.querySelector('.sf-admin-nav-edit-head sf-segmented')?.getAttribute('items') ?? null,
    } : null;
  });
  if (!picker || !picker.rows.includes('editors') || !picker.add || !String(picker.levels).includes('Профиль настроек')) {
    note({case: "the setting mode's role level is the profile picker", got: picker});
  }
  await page.close();

  // A frame as tall as a long page: the menu is the window's height and stays
  // at the top while the page scrolls (owner, 2026-10-14: it scrolled away,
  // an empty column under it).
  const tall = await open({}, 2400);
  const held = await tall.evaluate(async () => {
    window.scrollTo(0, 900);
    await new Promise((done) => setTimeout(done, 100));
    const box = document.querySelector('.sf-admin-nav').getBoundingClientRect();
    return {top: Math.round(box.top), height: Math.round(box.height), window: innerHeight};
  });
  if (held.top !== 0 || held.height !== held.window) note({case: 'the menu stays in the window', got: held});
  await tall.close();
  // A width an older handle left with the host changes nothing.
  const third = await open({widths: {first: 320, second: 300}});
  const kept = await third.evaluate(() => ({first: Math.round(document.querySelector('.sf-admin-nav-first').getBoundingClientRect().width),
    second: Math.round(document.querySelector('.sf-admin-nav-second')?.getBoundingClientRect().width ?? 0)}));
  if (kept.first !== 56 || kept.second !== 256) note({case: "an old kept width is not taken", got: kept, expected: {first: 56, second: 256}});
  await third.close();
  console.log(JSON.stringify({before, theme, counter, picker, held, favourites, kept}));
} finally {
  await browser.close();
}
if (failures.length) { console.error(JSON.stringify(failures, null, 2)); process.exit(1); }
console.log('ADMIN_NAVIGATION_RESIZE_OK');
