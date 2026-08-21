#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(pathToFileURL(
  process.env.LARENA_PLAYWRIGHT_MODULE ?? resolve(root, '../larena/node_modules/playwright/index.mjs'),
).href);
const output = resolve(root, process.env.NAVIGATION_CONTROLS_OUTPUT ?? 'output/playwright/navigation-controls');
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, ignoreHTTPSErrors: true });
const page = await context.newPage();
const consoleErrors = [];
const httpErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('response', (response) => {
  if (response.status() >= 400) httpErrors.push({ status: response.status(), url: response.url() });
});

await page.goto('https://ui-admin.test/navigation-menu-reference.html', { waitUntil: 'networkidle' });
await page.waitForFunction(() => Boolean(customElements.get('sf-admin-menu')));
const menu = page.locator('sf-admin-menu');

const clickButton = async (pattern) => {
  const button = menu.locator('button').filter({ hasText: pattern }).first();
  if (!await button.isVisible()) {
    const texts = await menu.locator('button').allTextContents();
    throw new Error(`Missing button: ${pattern}; ${JSON.stringify(texts)}`);
  }
  await button.click();
  await page.waitForTimeout(250);
};
const openSettingsMenu = async () => {
  const gear = menu.locator('[data-admin-menu-settings]');
  if (!await gear.isVisible()) throw new Error('Settings action menu button is missing.');
  await gear.click();
  await page.waitForFunction(() => {
    const contextMenu = document.querySelector('#sf-admin-menu-portal sf-context-menu');
    return (contextMenu?.getProp?.('items') ?? []).some((item) => /Добавить разделитель|Add divider/i.test(item?.props?.text ?? ''));
  });
};
const contextAction = async (pattern) => {
  await page.waitForFunction(() => {
    const contextMenu = document.querySelector('#sf-admin-menu-portal sf-context-menu');
    const expected = contextMenu?.getProp?.('items')?.length ?? 0;
    const rendered = [...(contextMenu?.shadowRoot ?? contextMenu)?.querySelectorAll?.('sf-button') ?? []]
      .filter((button) => (button.shadowRoot ?? button).querySelector('button')).length;
    return expected > 0 && rendered === expected;
  });
  const actionResult = await page.evaluate((matcher) => {
    const regex = new RegExp(matcher.source, matcher.flags);
    const portal = document.getElementById('sf-admin-menu-portal');
    const contextMenu = portal?.querySelector('sf-context-menu');
    const roots = [];
    const collect = (root) => {
      if (!root) return;
      roots.push(...root.querySelectorAll('sf-button'));
      for (const child of root.querySelectorAll('*')) collect(child.shadowRoot);
    };
    collect(contextMenu?.shadowRoot ?? contextMenu);
    const menuItems = contextMenu?.getProp?.('items') ?? [];
    const actionIndex = menuItems.findIndex((item) => regex.test(item?.props?.text ?? ''));
    const action = actionIndex >= 0 ? roots[actionIndex] : null;
    const button = action ? (action.shadowRoot ?? action).querySelector('button') : null;
    button?.click();
    return {
      clicked: Boolean(button),
      available: roots.map((candidate) => ({
        prop: candidate.getProp?.('text'),
        attr: candidate.getAttribute('text'),
        text: candidate.textContent,
        html: candidate.outerHTML,
      })),
      menuItems: menuItems.map?.((item) => item?.props?.text),
      hasContextMenu: Boolean(contextMenu),
    };
  }, { source: pattern.source, flags: pattern.flags });
  if (!actionResult.clicked) throw new Error(`Missing context action: ${pattern}; ${JSON.stringify(actionResult)}`);
  await page.waitForTimeout(350);
};
const waitForContextMenuClosed = async () => {
  try {
    await page.waitForFunction(() => !document.querySelector('#sf-admin-menu-portal sf-context-menu'), null, { timeout: 3000 });
  } catch (error) {
    const portal = await page.locator('#sf-admin-menu-portal').evaluate((element) => element.innerHTML);
    throw new Error(`Context menu did not close: ${portal}`, { cause: error });
  }
};

await clickButton(/Избранное|Favorites/i);
await clickButton(/Настройки меню|Menu settings/i);
const dragHandles = await menu.locator('[data-move]').count();
if (dragHandles < 2) throw new Error('Expected at least two drag handles.');

const itemSettings = menu.locator('[data-settings]').first();
if (!await itemSettings.isVisible()) throw new Error('First item settings button is not visible.');
await itemSettings.click();
await page.waitForTimeout(500);
await contextAction(/Скрыть|Hide/i);
const draftItems = await menu.evaluate((element) => Object.keys(element.buildSettingsProfile().items ?? {}).length);
if (draftItems < 1) throw new Error('Hide action did not create a settings delta.');

await openSettingsMenu();
await contextAction(/Добавить разделитель|Add divider/i);
const dividerCount = await menu.locator('.sf-admin-menu-divider').count();
if (dividerCount < 2) throw new Error('Add divider action did not add a divider.');

await clickButton(/Сохранить|Save/i);
const storageAfterSave = await page.evaluate(() => localStorage.getItem('sf-admin-menu:navigation-reference-menu:settings:v1'));
if (!storageAfterSave) throw new Error('Local save did not persist settings.');

await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(() => Boolean(customElements.get('sf-admin-menu')));
await clickButton(/Настройки меню|Menu settings/i);
await openSettingsMenu();
await contextAction(/Сбросить настройки|Reset settings/i);
const storageAfterReset = await page.evaluate(() => localStorage.getItem('sf-admin-menu:navigation-reference-menu:settings:v1'));
if (storageAfterReset !== null && Object.keys(JSON.parse(storageAfterReset)).length !== 0) {
  throw new Error('Reset did not clear local settings.');
}
await page.mouse.click(1200, 900);
await waitForContextMenuClosed();

const beforeOrder = await menu.locator('[data-panel-id]').evaluateAll((items) => items.slice(0, 3).map((item) => item.dataset.panelId));
const handles = menu.locator('[data-move]');
await handles.nth(0).dragTo(handles.nth(1));
await page.waitForTimeout(350);
const afterOrder = await menu.locator('[data-panel-id]').evaluateAll((items) => items.slice(0, 3).map((item) => item.dataset.panelId));
await openSettingsMenu();
await contextAction(/Отменить|Cancel/i);
await waitForContextMenuClosed();

const compactToggle = menu.locator('[data-admin-menu-toggle]');
await compactToggle.click();
await page.waitForTimeout(250);
const compact = await menu.evaluate((element) => ({
  state: element.getProp('compact'),
  panelWidth: (element.shadowRoot ?? element).querySelector('.sf-admin-menu-panel:not(.sf-admin-menu-panel-sub)')?.getBoundingClientRect().width,
}));
if (compact.state !== true || Math.abs(compact.panelWidth - 90) > 1) throw new Error('Compact control failed.');
await menu.locator('#search_toggle_menu').click();

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(250);
const mobile = await menu.evaluate((element) => {
  const panel = (element.shadowRoot ?? element).querySelector('.sf-admin-menu-panel:not(.sf-admin-menu-panel-sub)');
  return { panelWidth: panel?.getBoundingClientRect().width, viewportWidth: document.documentElement.clientWidth };
});
if (Math.abs(mobile.panelWidth - mobile.viewportWidth) > 1) throw new Error('Mobile menu does not fill the viewport.');
await clickButton(/Настройки меню|Menu settings/i);
await openSettingsMenu();
await contextAction(/Отменить|Cancel/i);
await waitForContextMenuClosed();

const screenshot = resolve(output, 'controls-mobile-final.png');
await page.screenshot({ path: screenshot, fullPage: true });
await context.close();
await browser.close();

const report = {
  schema: 'larena.admin_navigation_controls_browser.v1',
  status: consoleErrors.length === 0 && httpErrors.length === 0 ? 'passed' : 'failed',
  drag: { beforeOrder, afterOrder, changed: JSON.stringify(beforeOrder) !== JSON.stringify(afterOrder) },
  dragHandles,
  draftItems,
  dividerCount,
  storageAfterSave,
  storageAfterReset,
  compact,
  mobile,
  consoleErrors,
  httpErrors,
  screenshot,
};
const reportPath = resolve(output, 'report.json');
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${reportPath}\n`);
if (report.status !== 'passed') throw new Error('Navigation controls browser errors detected.');
