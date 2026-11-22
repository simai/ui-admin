#!/usr/bin/env node
// Usage: node this-file /absolute/path/to/output
//
// sf-admin-notifications 1.0.0 (owner decision C421) on the built bytes with
// the real Loader, by real clicks, on the page of its conformance scenario
// (examples.json pages[0]: #i given items, #p over a port that fails first):
//   - the repeats of srv1.larena.cloud today fold under «Ещё 2 по
//     srv1.larena.cloud», at the title's x; a click unfolds them, the focus
//     stays on the button, a second click folds them again;
//   - «Прочитать все» reads them all: «Нового нет», the focus on the count,
//     no unread dot left;
//   - the port's first answer fails: sf-alert and «Повторить»; a click reads
//     again and the list is drawn;
//   - a click on an unread notification's link marks it read over the port
//     (notifications.read {keys: [n1], all: false});
//   - 1440 and 390: no sideways scroll, no console error or warning.
import {readFileSync} from 'node:fs';
import {lab, finish} from './admin-set-lab.mjs';

const examples = JSON.parse(readFileSync(new URL('../../src/smart/admin-notifications/examples.json', import.meta.url), 'utf8'));
const BODY = [].concat(examples.pages[0].page.body).join('\n');

const failures = [];
const {open, ready, close} = await lab(process.argv[2]);
try {
  for (const width of [1440, 390]) {
    const page = await open(BODY, {width, height: 900});
    await ready(page, ['sf-admin-notifications']);
    await page.waitForFunction(() => document.querySelector('#i [data-fold]') && document.querySelector('#p [data-status="failed"]'), null, {timeout: 15000});
    const say = (text) => failures.push(`${width}: ${text}`);

    // Folding.
    const folded = await page.evaluate(() => {
      const fold = document.querySelector('#i [data-fold]');
      const title = fold.closest('.sf-admin-notifications__item').querySelector('.sf-admin-notifications__title');
      return {text: fold.textContent.trim(), rows: document.querySelectorAll('#i .sf-admin-notifications__item').length,
        x: Math.round(fold.getBoundingClientRect().left - title.getBoundingClientRect().left)};
    });
    if (folded.text !== 'Ещё 2 по srv1.larena.cloud' || folded.rows !== 5 || folded.x !== 0) say(`folding: ${JSON.stringify(folded)}`);
    await page.locator('#i [data-fold]').click();
    await page.waitForTimeout(200);
    const unfolded = await page.evaluate(() => ({
      rows: document.querySelectorAll('#i .sf-admin-notifications__item').length,
      expanded: document.querySelector('#i [data-fold]').getAttribute('aria-expanded'),
      focus: document.activeElement === document.querySelector('#i [data-fold]'),
    }));
    if (unfolded.rows !== 7 || unfolded.expanded !== 'true' || !unfolded.focus) say(`unfolding: ${JSON.stringify(unfolded)}`);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    const refolded = await page.evaluate(() => document.querySelectorAll('#i .sf-admin-notifications__item').length);
    if (refolded !== 5) say(`Enter on «Свернуть» left ${refolded} rows`);

    // «Прочитать все».
    await page.locator('#i .sf-admin-notifications__read-all button').click();
    await page.waitForTimeout(300);
    const read = await page.evaluate(() => ({
      count: document.querySelector('#i .sf-admin-notifications__count').textContent.trim(),
      focus: document.activeElement === document.querySelector('#i .sf-admin-notifications__count'),
      dots: document.querySelectorAll('#i [data-unread]').length,
    }));
    if (read.count !== 'Нового нет' || !read.focus || read.dots) say(`read all: ${JSON.stringify(read)}`);

    // The port: failed, then «Повторить».
    const alert = await page.evaluate(() => Boolean(document.querySelector('#p sf-alert')));
    if (!alert) say('the failed port answer shows no sf-alert');
    await page.locator('#p .sf-admin-notifications__retry button').click();
    await page.waitForFunction(() => document.querySelector('#p [data-status="ready"]'), null, {timeout: 5000}).catch(() => say('«Повторить» did not draw the list'));
    const portCount = await page.evaluate(() => document.querySelector('#p .sf-admin-notifications__count')?.textContent.trim());
    if (portCount !== 'Новых: 3') say(`the port's count reads ${portCount}`);

    // A click on an unread one's link reads it.
    await page.evaluate(() => { window.__opened = []; document.querySelector('#p').addEventListener('sf-admin-notifications-open', (event) => { window.__opened.push(event.detail); event.preventDefault(); }); });
    await page.locator('#p [data-key="n1"] .sf-admin-notifications__title').click();
    await page.waitForTimeout(400);
    const opened = await page.evaluate(() => ({opened: window.__opened, asked: window.__asked.at(-1), unread: document.querySelector('#p').unread}));
    if (opened.opened.length !== 1 || opened.opened[0].key !== 'n1') say(`open: ${JSON.stringify(opened.opened)}`);
    if (JSON.stringify(opened.asked) !== JSON.stringify(['notifications.read', {keys: ['n1'], all: false}]) || opened.unread !== 2) say(`read over the port: ${JSON.stringify(opened)}`);

    if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) say('sideways scroll');
    if (page.noise.length) say(page.noise.join(' | '));
    await page.closeAll();
  }
} catch (error) {
  failures.push(error.stack || error.message);
} finally {
  await close();
}
finish(failures, 'admin-notifications list: fold and unfold by click and Enter, read all with the focus on the count, a failed port with «Повторить», a link read over the port, 1440 and 390');
