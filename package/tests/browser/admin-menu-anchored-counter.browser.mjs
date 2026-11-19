#!/usr/bin/env node
// Usage: node this-file /absolute/path/to/output
//
// sf-admin-menu's counters (simai/ui-source#12, second part), measured on the
// built bytes in the navigation shell (the items menu left in 1.15.0, AM-7):
//   - on the rail, at width 1000, in the light theme and the dark one: a row's
//     counter is a dot on its icon's top end corner within 1px, its ring the
//     colour of the rail; the bell carries the unread number;
//   - 0 hides, attention is a dot;
//   - the row's accessible name, read by the browser, holds the words and the
//     count: «Входящие, 8 непрочитанных»;
//   - on a phone (390) there is no rail and the counter stands at the row's end;
//   - the counter follows the data: a host's new count is drawn and named.
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
  'smart/smart/admin-menu/css/admin-menu.css',
  'smart/smart/resizer/css/resizer.css',
].map((p) => join(out, p));
// Since the pair ui-1ed6b6c9a040 (owner decision C282) SIMAI Framework parts carry
// English only; a Russian page includes core/lang/ru.js, a classic script, before core.js.
const modules = [
  'core/core/lang/ru.js', 'core/core/js/core.js', 'core/core/js/smart-base.js',
  // The badges component, twice: the SIMAI Framework loader injects a
  // component's classic script once per plugin that names it as a relation
  // (four times on ui-admin's mock-api page, 2026-10-21), and each copy of the
  // badge runtime boots its own observer. The menu must not depend on one copy.
  'component/component/badges/js/badges.js',
  'component/component/badges/js/badges.js',
  'smart/smart/icon/js/icon.js', 'smart/smart/button/js/button.js',
  'smart/smart/button-icon/js/button-icon.js', 'smart/smart/badge/js/badge.js',
  'smart/smart/input/js/input.js', 'smart/smart/menu-context/js/menu-context.js',
  'smart/smart/resizer/js/resizer.js', 'smart/smart/admin-menu/js/admin-menu.js',
].map((p) => join(out, p));

const failures = [];
const evidence = {};
const check = (name, pass, detail = {}) => { if (!pass) failures.push({name, ...detail}); };
const DIAGONAL = 1 - 1 / Math.SQRT2;
const browser = await chromium.launch();

const NAVIGATION = {
  answer: 'applied', revision: '1', current: 'home',
  items: [
    {key: 'home', kind: 'page', level: 'site', label: 'Главная', icon: 'home', href: '/admin'},
    {key: 'inbox', kind: 'page', level: 'site', label: 'Входящие', icon: 'inbox', href: '/admin/inbox', badge: 8},
    {key: 'tasks', kind: 'page', level: 'site', label: 'Задачи', icon: 'task', href: '/admin/tasks', badge: 120},
    {key: 'zero', kind: 'page', level: 'site', label: 'Платежи', icon: 'payments', href: '/admin/payments', badge: 0},
    {key: 'data', kind: 'root', level: 'site', label: 'Данные', icon: 'database', attention: {tone: 'warning', label: 'Требует внимания'}, children: [
      {key: 'cms', kind: 'page', level: 'site', label: 'Минимальная CMS', icon: 'table', href: '/admin/cms'},
    ]},
  ],
  notifications: {unread: 3, href: '/admin/notifications'},
  person: {name: 'Administrator', compact: true, language: 'ru', languages: [{code: 'ru', native: 'Русский', english: 'Russian'}]},
  rights: {},
  site: {current: {key: 'main', label: 'Main site'}, count: 1},
};

async function open({width, theme, body}) {
  const page = await browser.newPage({viewport: {width, height: 900}});
  page.on('pageerror', (error) => { if (!/publicPath/u.test(error.message)) failures.push({name: 'page error', said: error.message}); });
  await page.setContent(`<!doctype html><html class="theme-${theme}" lang="ru"><head><meta charset="utf-8"><base href="http://admin.test/"></head><body style="margin:0"><div style="display:flex;block-size:100vh">${body}</div></body></html>`);
  for (const path of styles) await page.addStyleTag({path}).catch(() => {});
  // The icon font is missing here: the glyphs take the size the font gives them.
  await page.addStyleTag({content: '.sf-icon{display:inline-block;inline-size:1.25rem;block-size:1.25rem;overflow:hidden}'});
  for (const path of modules) await page.addScriptTag(path.endsWith('/lang/ru.js') ? {path} : {path, type: 'module'}).catch(() => {});
  await page.waitForFunction(() => window.SF?.AnchoredBadge && customElements.get('sf-admin-menu'), null, {timeout: 8000});
  await page.waitForTimeout(600);
  return page;
}

// The accessible names of the page's links and buttons, as the browser has them.
async function names(page) {
  const session = await page.context().newCDPSession(page);
  const {nodes} = await session.send('Accessibility.getFullAXTree');
  await session.detach();
  // Words and a phrase in two boxes get a space between them from the browser
  // («Уведомления , 3 …»), which is not heard: the order and the words are held.
  return nodes.filter((node) => ['link', 'button'].includes(node.role?.value) && !node.ignored)
    .map((node) => String(node.name?.value ?? '').replace(/\s+,/gu, ',').trim());
}

// Where a counter is against its anchor: the offset of its centre from the
// anchor's point (`round` for a circle, the corner otherwise), its box, what it
// draws, and its ring against the surface under it.
async function measure(page, badgeSelector, anchorSelector, surfaceSelector) {
  return page.evaluate(({badgeSelector, anchorSelector, surfaceSelector, DIAGONAL}) => {
    const badge = document.querySelector(badgeSelector);
    const anchor = document.querySelector(anchorSelector);
    if (!badge || !anchor) return {missing: {badge: Boolean(badge), anchor: Boolean(anchor)}};
    const a = anchor.getBoundingClientRect();
    const b = badge.getBoundingClientRect();
    const radius = parseFloat(getComputedStyle(anchor).borderTopRightRadius) || 0;
    const inset = Math.min(radius, a.width / 2) * DIAGONAL;
    const rtl = getComputedStyle(anchor).direction === 'rtl';
    const point = {x: rtl ? a.left + inset : a.right - inset, y: a.top + inset};
    const centre = {x: b.left + b.width / 2, y: b.top + b.height / 2};
    const ring = getComputedStyle(badge).boxShadow;
    const surface = getComputedStyle(document.querySelector(surfaceSelector)).backgroundColor;
    return {
      dx: +(centre.x - point.x).toFixed(2), dy: +(centre.y - point.y).toFixed(2),
      width: +b.width.toFixed(2), height: +b.height.toFixed(2), anchor: [+a.width.toFixed(2), +a.height.toFixed(2)], radius,
      text: badge.textContent, hidden: badge.hidden || b.width === 0,
      // Since SIMAI Framework ui-7fb26d395af2 (C43 D3) the ring is two layers:
      // the row's fill (transparent on a row with none) over the surface
      // under it. What a person sees is the first layer that is not clear.
      ring: (ring.split(/,\s*(?=rgba?\()/u).find((layer) => !/^rgba\([^)]*,\s*0\)/u.test(layer)) ?? '').startsWith(surface), surface, shadow: ring,
    };
  }, {badgeSelector, anchorSelector, surfaceSelector, DIAGONAL});
}

const on = (m) => !m.missing && Math.hypot(m.dx, m.dy) <= 1;

// The page settles: no change in the document for a second once the menu has
// drawn. Two copies of the badge runtime fed each other a growing aria-label
// without end on ui-admin (2026-10-21), and the page never went quiet.
async function settles(page) {
  return page.evaluate(() => new Promise((done) => {
    let changes = 0;
    const seen = [];
    const observer = new MutationObserver((records) => {
      changes += records.length;
      for (const record of records) if (seen.length < 3) seen.push(`${record.type} ${record.attributeName ?? ''} ${record.target.nodeName}.${String(record.target.className ?? '').slice(0, 40)}`);
    });
    observer.observe(document, {subtree: true, childList: true, attributes: true, characterData: true});
    setTimeout(() => { observer.disconnect(); done({changes, seen}); }, 1000);
  }));
}

try {
  for (const width of [1000, 390]) {
    for (const theme of ['light', 'dark']) {
      const where = `${width}px ${theme}`;

      // The navigation shell: the rail on a desktop, full rows on a phone.
      {
        const page = await open({width, theme, body: '<sf-admin-menu id="m" aria-label="Меню"></sf-admin-menu><main style="flex:1">Страница</main>'});
        await page.evaluate((navigation) => {
          window.navigationAnswer = navigation;
          document.getElementById('m').setHostPort({
            port: 'simai.admin-navigation-port', version: '1.0.0', capabilities: ['preferences', 'notifications'],
            async raise(intent) {
              if (intent === 'navigation.load') return structuredClone(window.navigationAnswer);
              return {answer: 'applied'};
            },
          });
        }, NAVIGATION);
        await page.waitForTimeout(900);
        const quiet = await settles(page);
        check(`navigation ${where}: the page settles`, quiet.changes === 0, quiet);
        // A rail row is named by aria-label (its name and count) and its
        // tooltip, never title (AM-25).
        const row = (label) => `.sf-admin-nav-first .sf-admin-nav-row--first[aria-label^="${label}"]`;
        const rail = await page.evaluate(() => document.querySelector('.sf-admin-nav-first')?.getAttribute('data-compact') === 'true');
        evidence[`navigation ${where} rail`] = rail;
        if (width >= 768) {
          check(`navigation ${where}: the first column is the rail`, rail);
          const result = {
            inbox: await measure(page, `${row('Входящие')} .sf-badge`, `${row('Входящие')} .sf-badge-anchor`, '.sf-admin-nav-first'),
            tasks: await measure(page, `${row('Задачи')} .sf-badge`, `${row('Задачи')} .sf-badge-anchor`, '.sf-admin-nav-first'),
            zero: await measure(page, `${row('Платежи')} .sf-badge`, `${row('Платежи')} .sf-badge-anchor`, '.sf-admin-nav-first'),
            data: await measure(page, `${row('Данные')} .sf-badge`, `${row('Данные')} .sf-badge-anchor`, '.sf-admin-nav-first'),
            notifications: await measure(page, `${row('Уведомления')} .sf-badge`, `${row('Уведомления')} .sf-badge-anchor`, '.sf-admin-nav-first'),
            icon: await page.evaluate((selector) => {
              const anchor = document.querySelector(`${selector} .sf-badge-anchor`)?.getBoundingClientRect();
              const icon = document.querySelector(`${selector} .sf-badge-anchor .sf-icon`)?.getBoundingClientRect();
              if (!anchor || !icon) return {same: false, anchor: Boolean(anchor)};
              return {same: Math.abs(anchor.left - icon.left) <= 0.5 && Math.abs(anchor.right - icon.right) <= 0.5 && Math.abs(anchor.top - icon.top) <= 0.5 && Math.abs(anchor.bottom - icon.bottom) <= 0.5};
            }, row('Входящие')),
            names: await names(page),
          };
          evidence[`navigation rail ${where}`] = result;
          check(`navigation ${where}: the anchor is the icon's box`, result.icon.same, result.icon);
          // The rail icon is a 1/2 step: the rule draws a dot there (8px), the
          // number in the row's name (owner, 2026-10-21).
          for (const id of ['inbox', 'tasks']) {
            check(`navigation ${where}: ${id}'s counter is a dot on its icon's top end corner`, on(result[id]) && result[id].height === 8 && result[id].width === 8 && result[id].text === '', result[id]);
            check(`navigation ${where}: ${id}'s ring is the rail's colour`, result[id].ring, result[id]);
          }
          // The bell carries the unread number (C342, AM-43): its anchor is the
          // 1 step, where the badge rule draws the count.
          check(`navigation ${where}: the bell carries the unread number`, result.notifications.text === '3' && result.notifications.ring && !result.notifications.hidden, result.notifications);
          check(`navigation ${where}: 0 hides`, result.zero.hidden || result.zero.missing?.badge === false, result.zero);
          check(`navigation ${where}: attention is a dot on the icon`, on(result.data) && result.data.text === '' && result.data.width === result.data.height, result.data);
          for (const name of ['Входящие, 8 непрочитанных', 'Задачи, 120 непрочитанных', 'Платежи', 'Данные, Требует внимания', 'Уведомления, 3 непрочитанных']) {
            check(`navigation ${where}: a row is named «${name}»`, result.names.includes(name), {names: result.names});
          }
          // A host's new count, read again on refresh().
          await page.evaluate(() => {
            window.navigationAnswer.items[1].badge = 4;
            return document.getElementById('m').refresh();
          });
          await page.waitForTimeout(400);
          const live = {inbox: await measure(page, `${row('Входящие')} .sf-badge`, `${row('Входящие')} .sf-badge-anchor`, '.sf-admin-nav-first'), names: await names(page)};
          check(`navigation ${where}: a new count keeps the dot and is named`, live.inbox.text === '' && live.inbox.height === 8 && on(live.inbox) && live.names.includes('Входящие, 4 непрочитанных'), live);
        } else {
          check(`navigation ${where}: a phone has no rail`, !rail);
          const result = await page.evaluate(() => {
            const rows = [...document.querySelectorAll('.sf-admin-nav-first .sf-admin-nav-row--first')];
            const inbox = rows.find((one) => one.textContent.includes('Входящие'));
            const badge = inbox?.querySelector('.sf-badge');
            const a = inbox?.getBoundingClientRect();
            const b = badge?.getBoundingClientRect();
            return badge ? {end: +(a.right - b.right).toFixed(2), text: badge.textContent.trim(), position: getComputedStyle(badge).position} : null;
          });
          evidence[`navigation full ${where}`] = result;
          check(`navigation ${where}: the counter stands at the row's end`, result && result.end >= 0 && result.end <= 24 && result.text === '8' && result.position !== 'absolute', {result});
        }
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify(evidence));
if (failures.length) { console.error(JSON.stringify({failures}, null, 1)); process.exit(1); }
console.log('ADMIN_MENU_ANCHORED_COUNTER_OK');
