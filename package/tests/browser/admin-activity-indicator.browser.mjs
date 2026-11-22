#!/usr/bin/env node
// Usage: node this-file /absolute/path/to/output
//
// sf-admin-activity 1.0.0 (owner decision C421, with C332 and C339) on the
// built bytes with the real Loader, by real clicks and keys, beside an
// sf-admin-notifications given items, with SF.notify itself drawing:
//   - two runs: «Идёт 2», no mark; nothing to show: no element;
//   - one fails while one runs: «Идёт 1» and the red mark, SF.notify error
//     (which stays), a notification at the top of the list;
//   - a click on the trigger opens the list (sf-progress-run rows; the failed
//     one with «Повторить», fallback until AS-4) and the mark goes; Escape
//     closes it and the focus returns to the trigger;
//   - the last running run ends: SF.notify success, «Не удалось 1» in words;
//   - a second indicator of the page (the phone top line's) tells nothing
//     twice: one toast per end;
//   - 1440 and 390: no sideways scroll, no console error or warning.
import {lab, finish} from './admin-set-lab.mjs';

if (!process.argv[2]) throw new Error('Build output root is required');

const RUNNING = [
  {id: 'r1', label: 'Копия srv1.larena.cloud', state: 'running', value: 42, total: 100, unit: '%'},
  {id: 'r2', label: 'Обновление PHP на stage', state: 'running'},
];
const FAILED = [RUNNING[0], {id: 'r2', label: 'Обновление PHP на stage', state: 'failed', text: 'Хранилище пакетов не ответило.', object: 'stage.larena.cloud'}];
const DONE = [{...RUNNING[0], state: 'done'}, FAILED[1]];
const BODY = `<main style="display: flex; flex-direction: column; gap: 24px; padding: 16px">
  <div style="display: flex; justify-content: flex-end; gap: 8px">
    <sf-admin-activity id="a" history-href="#/activity" runs='${JSON.stringify(RUNNING)}'></sf-admin-activity>
    <sf-admin-activity id="b" size="1" runs='${JSON.stringify(RUNNING)}'></sf-admin-activity>
    <sf-admin-activity id="z" runs='[]'></sf-admin-activity>
  </div>
  <sf-admin-notifications id="n" aria-label="Уведомления" items='[{"key": "n1", "group": "today", "group-label": "Сегодня", "level": "info", "object": "simai.ru", "title": "Копия готова", "when": "03:00", "unread": false}]'></sf-admin-notifications>
</main>
<script>window.__told = []; customElements.whenDefined('sf-admin-activity').then(() => { const sf = window.SF; const base = sf.notify; sf.notify = function (options) { window.__told.push({status: options.status, title: options.title}); return base.call(this, options); }; });</script>`;
const set = (page, runs) => page.evaluate((list) => { for (const id of ['a', 'b']) document.getElementById(id).runs = list; }, runs);

const failures = [];
const {open, ready, close} = await lab(process.argv[2]);
try {
  for (const width of [1440, 390]) {
    const page = await open(BODY, {width, height: 844});
    const say = (text) => failures.push(`${width}: ${text}`);
    await ready(page, ['sf-admin-activity', 'sf-admin-notifications']);
    await page.waitForFunction(() => document.querySelector('#a .sf-admin-activity__trigger') && document.querySelector('#n [data-key]'), null, {timeout: 15000});

    const start = await page.evaluate(() => ({
      running: document.querySelector('#a sf-badge[activity="running"]')?.getAttribute('text'),
      mark: Boolean(document.querySelector('#a .sf-admin-activity__mark')),
      none: !document.querySelector('#z .sf-admin-activity'),
      name: document.querySelector('#a .sf-admin-activity__trigger').getAttribute('aria-label'),
    }));
    if (start.running !== 'Идёт 2' || start.mark || !start.none || start.name !== 'Действия в фоне: идёт 2') say(`start: ${JSON.stringify(start)}`);

    await set(page, FAILED);
    await page.waitForTimeout(500);
    const failed = await page.evaluate(() => ({
      running: document.querySelector('#a sf-badge[activity="running"]')?.getAttribute('text'),
      mark: Boolean(document.querySelector('#a .sf-admin-activity__mark')),
      told: window.__told.filter((one) => one.status === 'error').length,
      top: document.querySelector('#n .sf-admin-notifications__item .sf-admin-notifications__title')?.textContent.trim(),
      toast: document.body.innerText.includes('Обновление PHP на stage: не удалось'),
    }));
    if (failed.running !== 'Идёт 1' || !failed.mark || failed.told !== 1 || failed.top !== 'Обновление PHP на stage: не удалось' || !failed.toast) say(`a failure: ${JSON.stringify(failed)}`);

    await page.locator('#a .sf-admin-activity__trigger').click();
    await page.waitForTimeout(500);
    const opened = await page.evaluate(() => ({
      expanded: document.querySelector('#a .sf-admin-activity__trigger').getAttribute('aria-expanded'),
      rows: document.querySelectorAll('#a sf-progress-run').length,
      retry: Boolean(document.querySelector('#a .sf-admin-activity__retry')),
      mark: Boolean(document.querySelector('#a .sf-admin-activity__mark')) || Boolean(document.querySelector('#b .sf-admin-activity__mark')),
    }));
    if (opened.expanded !== 'true' || opened.rows !== 2 || !opened.retry || opened.mark) say(`opening the list: ${JSON.stringify(opened)}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    const closed = await page.evaluate(() => ({
      expanded: document.querySelector('#a .sf-admin-activity__trigger').getAttribute('aria-expanded'),
      focus: document.activeElement === document.querySelector('#a .sf-admin-activity__trigger'),
    }));
    if (closed.expanded !== 'false' || !closed.focus) say(`Escape: ${JSON.stringify(closed)}`);

    await set(page, DONE);
    await page.waitForTimeout(500);
    const done = await page.evaluate(() => ({
      success: window.__told.filter((one) => one.status === 'success').length,
      errors: window.__told.filter((one) => one.status === 'error').length,
      failed: document.querySelector('#a sf-badge[activity="failed"]:not(.sf-admin-activity__mark)')?.getAttribute('text'),
      running: Boolean(document.querySelector('#a sf-badge[activity="running"]')),
    }));
    if (done.success !== 1 || done.errors !== 1 || done.failed !== 'Не удалось 1' || done.running) say(`the end: ${JSON.stringify(done)}`);

    if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) say('sideways scroll');
    if (page.noise.length) say(page.noise.join(' | '));
    await page.closeAll();
  }
} catch (error) {
  failures.push(error.stack || error.message);
} finally {
  await close();
}
finish(failures, 'admin-activity indicator: «Идёт N», the failure mark until the list opened by click, Escape returns the focus, one toast per end for two indicators, the failure in the notifications, «Не удалось N» in words, 1440 and 390');
