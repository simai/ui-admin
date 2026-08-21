#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(pathToFileURL(
  process.env.LARENA_PLAYWRIGHT_MODULE ?? resolve(root, '../larena/node_modules/playwright/index.mjs'),
).href);
const output = resolve(root, process.env.NAVIGATION_SETTINGS_OUTPUT ?? 'output/playwright/navigation-settings');
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  ignoreHTTPSErrors: true,
  colorScheme: 'dark',
});
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
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(() => document.documentElement.dataset.navigationReferenceReady === 'true');
const menu = page.locator('sf-admin-menu');

const clickVisibleButton = async (pattern) => {
  const button = menu.locator('button').filter({ hasText: pattern }).first();
  if (!await button.isVisible()) throw new Error(`Missing visible button: ${pattern}`);
  await button.click();
  await page.waitForTimeout(250);
};

const contextItems = () => page.evaluate(() => {
  const element = document.querySelector('#sf-admin-menu-portal sf-context-menu');
  return (element?.getProp?.('items') ?? []).map((item) => item?.props?.text ?? '');
});

const clickContextAction = async (pattern) => {
  await page.waitForFunction(() => {
    const element = document.querySelector('#sf-admin-menu-portal sf-context-menu');
    const expected = element?.getProp?.('items')?.length ?? 0;
    const rendered = [...(element?.shadowRoot ?? element)?.querySelectorAll?.('sf-button') ?? []]
      .filter((button) => (button.shadowRoot ?? button).querySelector('button')).length;
    return expected > 0 && rendered === expected;
  });
  const result = await page.evaluate(({ source, flags }) => {
    const matcher = new RegExp(source, flags);
    const element = document.querySelector('#sf-admin-menu-portal sf-context-menu');
    const items = element?.getProp?.('items') ?? [];
    const index = items.findIndex((item) => matcher.test(item?.props?.text ?? ''));
    const buttons = [];
    const collect = (rootElement) => {
      if (!rootElement) return;
      buttons.push(...rootElement.querySelectorAll('sf-button'));
      for (const child of rootElement.querySelectorAll('*')) collect(child.shadowRoot);
    };
    collect(element?.shadowRoot ?? element);
    const target = buttons[index];
    const nativeButton = target ? (target.shadowRoot ?? target).querySelector('button') : null;
    nativeButton?.click();
    return { clicked: Boolean(nativeButton), labels: items.map((item) => item?.props?.text ?? '') };
  }, { source: pattern.source, flags: pattern.flags });
  if (!result.clicked) throw new Error(`Missing context action ${pattern}: ${JSON.stringify(result.labels)}`);
  await page.waitForTimeout(350);
};

await clickVisibleButton(/Настройки меню|Menu settings/i);
const ordinarySettings = menu.locator('li[data-panel-id="demo.orders"] [data-settings]');
await ordinarySettings.click();
await page.waitForFunction(() => {
  const element = document.querySelector('#sf-admin-menu-portal sf-context-menu');
  return (element?.getProp?.('items')?.length ?? 0) === 2;
});
const currentItemActions = await contextItems();
if (!currentItemActions.some((label) => /Сохранить|Save/i.test(label))
  || !currentItemActions.some((label) => /Скрыть|Hide/i.test(label))) {
  throw new Error(`Current item actions are incomplete: ${JSON.stringify(currentItemActions)}`);
}
if (currentItemActions.some((label) => /Изменить|Edit|Удалить|Delete/i.test(label))) {
  throw new Error(`Stale item actions are still rendered: ${JSON.stringify(currentItemActions)}`);
}
await page.keyboard.press('Escape');
await page.mouse.click(1100, 700);

const divider = menu.locator('li[data-panel-id="demo.divider.primary"]');
await divider.locator('[data-settings]').click();
await clickContextAction(/Скрыть|Hide/i);
const dividerHidden = await divider.evaluate((element) => element.classList.contains('hidden'));
if (!dividerHidden) throw new Error('Divider hide action did not hide the divider.');

await menu.locator('[data-admin-menu-settings]').click();
await clickContextAction(/Скрытые пункты|Hidden items/i);
const dividerShownTemporarily = await divider.evaluate((element) => !element.classList.contains('hidden'));
if (!dividerShownTemporarily) throw new Error('Hidden-items mode did not reveal the divider.');
await divider.locator('[data-settings]').click();
await clickContextAction(/Показать|Show/i);
const dividerRestored = await divider.evaluate((element) => !element.classList.contains('hidden'));
if (!dividerRestored) throw new Error('Divider show action did not restore the divider.');

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(300);
const mobileItemSettings = menu.locator('li[data-panel-id="demo.orders"] [data-settings]');
await mobileItemSettings.scrollIntoViewIfNeeded();
await mobileItemSettings.click();
await page.waitForTimeout(300);
const popup = await page.evaluate(() => {
  const element = document.querySelector('#sf-admin-menu-portal sf-context-menu');
  const surface = (element?.shadowRoot ?? element)?.querySelector('.sf-context-menu') ?? element;
  const rect = surface?.getBoundingClientRect();
  return rect ? {
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
    viewportWidth: innerWidth,
    viewportHeight: innerHeight,
    hostStyle: element?.getAttribute('style') ?? null,
    surfaceStyle: surface?.getAttribute('style') ?? null,
    clampAvailable: typeof document.querySelector('sf-admin-menu')?.clampContextMenuToViewport === 'function',
  } : null;
});
if (!popup || popup.left < 7 || popup.right > popup.viewportWidth - 7
  || popup.top < 7 || popup.bottom > popup.viewportHeight - 7) {
  throw new Error(`Mobile context menu escapes viewport: ${JSON.stringify(popup)}`);
}

const screenshot = resolve(output, 'divider-and-mobile-popup.png');
await page.screenshot({ path: screenshot, fullPage: true });
const loadedScripts = await page.locator('script[src]').evaluateAll((scripts) => scripts.map((script) => script.src));
const report = {
  schema: 'sf.admin_menu.settings_browser.v1',
  status: consoleErrors.length === 0 && httpErrors.length === 0 ? 'passed' : 'failed',
  currentItemActions,
  dividerHidden,
  dividerShownTemporarily,
  dividerRestored,
  popup,
  cacheVersionApplied: loadedScripts.some((src) => src.includes('sf_v=navigation-menu-reference-v2')),
  consoleErrors,
  httpErrors,
  screenshot,
};
const reportPath = resolve(output, 'report.json');
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
await context.close();
await browser.close();
process.stdout.write(`${reportPath}\n`);
if (report.status !== 'passed' || !report.cacheVersionApplied) {
  throw new Error(`Navigation settings browser check failed: ${JSON.stringify(report)}`);
}
