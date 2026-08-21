#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDir, '..');
const playwrightModule = process.env.LARENA_PLAYWRIGHT_MODULE
  ?? resolve(repositoryRoot, '../larena/node_modules/playwright/index.mjs');
const { chromium } = await import(pathToFileURL(playwrightModule).href);

const outputDirectory = resolve(
  repositoryRoot,
  process.env.NAVIGATION_PARITY_OUTPUT ?? 'output/playwright/navigation-parity-lab',
);
const storageState = process.env.LARENA_ADMIN_BROWSER_STATE_PATH;
const integratedUrl = process.env.NAVIGATION_PARITY_INTEGRATED_URL
  ?? 'https://larena.test/admin/ui/navigation-lab/integrated?locale=ru';

if (!storageState) {
  throw new Error('LARENA_ADMIN_BROWSER_STATE_PATH is required.');
}

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

async function inspectPage({ name, url, viewport, authenticated = false }) {
  const context = await browser.newContext({
    viewport,
    ignoreHTTPSErrors: true,
    colorScheme: 'dark',
    ...(authenticated ? { storageState } : {}),
  });
  const page = await context.newPage();
  const consoleMessages = [];
  const failedRequests = [];
  const httpErrors = [];

  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) {
      consoleMessages.push({ type: message.type(), text: message.text() });
    }
  });
  page.on('requestfailed', (request) => {
    failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? null });
  });
  page.on('response', (assetResponse) => {
    if (assetResponse.status() >= 400) {
      httpErrors.push({ url: assetResponse.url(), status: assetResponse.status() });
    }
  });

  let response = await page.goto(url, { waitUntil: 'commit', timeout: 30_000 });
  if (authenticated && new URL(page.url()).pathname === '/admin/login') {
    const email = process.env.LARENA_ADMIN_EMAIL;
    const password = process.env.LARENA_ADMIN_PASSWORD;
    if (!email || !password) {
      throw new Error('Authenticated page requires current Larena test credentials.');
    }
    await context.clearCookies();
    await page.goto('https://larena.test/admin/login', { waitUntil: 'commit', timeout: 30_000 });
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'commit', timeout: 30_000 }),
      page.locator('button[type="submit"]').click(),
    ]);
    if (new URL(page.url()).pathname === '/admin/login') {
      throw new Error('Larena test login did not establish an authenticated session.');
    }
    await context.storageState({ path: storageState });
    response = await page.goto(url, { waitUntil: 'commit', timeout: 30_000 });
  }
  await page.waitForSelector('sf-admin-menu', { state: 'attached', timeout: 15_000 });
  try {
    await page.waitForFunction(() => {
      const menu = document.querySelector('sf-admin-menu');
      const root = menu?.shadowRoot ?? menu;
      const panel = root?.querySelector('.sf-admin-menu-panel:not(.sf-admin-menu-panel-sub)');
      return Boolean(customElements.get('sf-admin-menu'))
        && (panel?.getBoundingClientRect().height ?? 0) > 0;
    }, null, { timeout: 15_000 });
  } catch (error) {
    const diagnostic = await page.evaluate(() => ({
      url: location.href,
      defined: Boolean(customElements.get('sf-admin-menu')),
      html: document.querySelector('sf-admin-menu')?.outerHTML.slice(0, 500),
      scripts: [...document.scripts].map((element) => element.src).filter(Boolean),
      styles: [...document.querySelectorAll('link[rel="stylesheet"]')].map((element) => element.href),
    }));
    throw new Error(`Admin menu did not become ready: ${JSON.stringify(diagnostic)}`, { cause: error });
  }
  await Promise.race([
    page.evaluate(() => document.fonts.ready),
    page.waitForTimeout(2_000),
  ]);
  if (name === 'integrated' && viewport.width < 1000) {
    const navigationToggle = page.locator('#larena-admin-navigation-toggle');
    if (await navigationToggle.isVisible().catch(() => false)) {
      await navigationToggle.click();
      await page.waitForTimeout(300);
    }
  }
  await page.waitForTimeout(500);

  const measureMenu = () => page.evaluate(() => {
    const menu = document.querySelector('sf-admin-menu');
    const root = menu?.shadowRoot ?? menu;
    const rect = menu?.getBoundingClientRect();
    const elements = root ? [...root.querySelectorAll('*')] : [];
    const visible = (element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();

      return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0;
    };
    const iconElements = elements.filter((element) =>
      element.classList?.contains('material-symbols-outlined')
      || element.tagName?.toLowerCase().includes('icon'),
    );
    const controls = elements
      .filter((element) => ['BUTTON', 'A'].includes(element.tagName) && visible(element))
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        text: element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 100) ?? '',
        ariaLabel: element.getAttribute('aria-label'),
        title: element.getAttribute('title'),
      }));
    const panel = elements.find((element) =>
      element.classList?.contains('sf-admin-menu-panel')
      && !element.classList?.contains('sf-admin-menu-panel-sub'),
    );
    const openSubPanel = elements.find((element) =>
      element.classList?.contains('sf-admin-menu-panel-sub')
      && element.classList?.contains('translate-x-0'),
    );
    const main = root?.querySelector('.sf-admin-menu-main');
    const bottom = root?.querySelector('.sf-admin-menu-bottom');
    const sidebar = document.querySelector('.larena-sidebar--smart, .navigation-reference');
    const workspace = document.querySelector('.larena-workspace');
    const dividers = [...(root?.querySelectorAll('.sf-admin-menu-divider') ?? [])]
      .filter(visible);
    const badges = [...(openSubPanel?.querySelectorAll('.sf-badge') ?? [])]
      .filter(visible)
      .map((element) => {
        const box = element.getBoundingClientRect();
        const panelBox = openSubPanel.getBoundingClientRect();
        return {
          text: element.textContent?.trim() ?? '',
          left: box.left,
          right: box.right,
          panelLeft: panelBox.left,
          panelRight: panelBox.right,
          clipped: box.left < panelBox.left - 0.5 || box.right > panelBox.right + 0.5,
        };
      });
    const settingsLabel = elements.find((element) =>
      element.tagName === 'SPAN'
      && /^(Настройки меню|Menu settings)$/.test(element.textContent?.trim() ?? ''),
    );
    const settingsBox = settingsLabel?.getBoundingClientRect();
    const settingsStyle = settingsLabel ? getComputedStyle(settingsLabel) : null;
    const lineHeight = settingsStyle ? Number.parseFloat(settingsStyle.lineHeight) : 0;

    return {
      title: document.title,
      url: location.href,
      ready: document.documentElement.dataset.navigationReferenceReady ?? null,
      hasMenu: Boolean(menu),
      menuRect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
      menuText: (root?.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 1000),
      customElementDefined: Boolean(customElements.get('sf-admin-menu')),
      stylesheets: [...document.querySelectorAll('link[rel="stylesheet"]')].map((element) => element.href),
      scripts: [...document.scripts].map((element) => element.src).filter(Boolean),
      persistenceMode: menu?.getAttribute('persistence-mode'),
      itemIdCount: root?.querySelectorAll('[item-id]').length ?? 0,
      iconCount: iconElements.length,
      visibleIconCount: iconElements.filter(visible).length,
      controls,
      bodyOverflowX: document.body.scrollWidth > document.documentElement.clientWidth,
      sidebarWidth: sidebar?.getBoundingClientRect().width ?? null,
      sidebarRight: sidebar?.getBoundingClientRect().right ?? null,
      workspaceLeft: workspace?.getBoundingClientRect().left ?? null,
      panelWidth: panel?.getBoundingClientRect().width ?? null,
      compactState: menu?.getProp?.('compact') === true || menu?.hasAttribute('compact') === true,
      compactDataset: document.querySelector('[data-larena-admin-shell]')?.getAttribute('data-larena-navigation-compact')
        ?? document.querySelector('.navigation-reference')?.getAttribute('data-navigation-compact')
        ?? null,
      blankStripWidth: sidebar && panel
        ? Math.max(0, sidebar.getBoundingClientRect().right - panel.getBoundingClientRect().right)
        : null,
      openSubPanelWidth: openSubPanel?.getBoundingClientRect().width ?? null,
      nestedBadges: badges,
      nestedBadgeClipped: badges.some((badge) => badge.clipped),
      dividerCount: dividers.length,
      mainScroll: main ? {
        clientHeight: main.clientHeight,
        scrollHeight: main.scrollHeight,
        scrollTop: main.scrollTop,
        overflowY: getComputedStyle(main).overflowY,
        scrollable: main.scrollHeight > main.clientHeight,
        bottom: main.getBoundingClientRect().bottom,
        overlapsFooter: bottom
          ? main.getBoundingClientRect().bottom > bottom.getBoundingClientRect().top + 0.5
          : false,
      } : null,
      footer: bottom ? {
        width: bottom.getBoundingClientRect().width,
        top: bottom.getBoundingClientRect().top,
        bottom: bottom.getBoundingClientRect().bottom,
        panelBottom: panel?.getBoundingClientRect().bottom ?? null,
        settingsLines: settingsBox && lineHeight > 0
          ? Math.round(settingsBox.height / lineHeight)
          : null,
      } : null,
    };
  });
  const probe = await measureMenu();

  const suffix = `${name}-${viewport.width}x${viewport.height}`;
  const screenshot = resolve(outputDirectory, `${suffix}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });

  results.push({
    name,
    viewport,
    status: response?.status() ?? null,
    screenshot,
    consoleMessages,
    failedRequests,
    httpErrors,
    probe,
  });

  const searchInput = page.locator('sf-admin-menu sf-input input').first();
  if (await searchInput.isVisible().catch(() => false)) {
    await searchInput.fill('Компоненты');
    await page.waitForTimeout(450);
    results.push({
      name: `${name}-search`,
      viewport,
      status: response?.status() ?? null,
      screenshot: null,
      consoleMessages,
      failedRequests,
      httpErrors,
      probe: await page.locator('sf-admin-menu').evaluate((menu) => ({
        query: menu.state?.searchQuery ?? '',
        resultCount: menu.state?.searchResults?.length ?? 0,
      })),
    });
    await searchInput.fill('');
    await page.waitForTimeout(350);
  }

  const nestedButton = page.locator('sf-admin-menu button').filter({
    hasText: /Разработка|Developer|Development/i,
  }).first();
  if (await nestedButton.isVisible().catch(() => false)) {
    await nestedButton.click();
    await page.waitForTimeout(350);
    const nestedScreenshot = resolve(outputDirectory, `${suffix}-nested.png`);
    await page.screenshot({ path: nestedScreenshot, fullPage: true });
    results.push({
      name: `${name}-nested`,
      viewport,
      status: response?.status() ?? null,
      screenshot: nestedScreenshot,
      consoleMessages,
      failedRequests,
      httpErrors,
      probe: await measureMenu(),
    });

    await page.locator('sf-admin-menu').evaluate((menu) => {
      const root = menu.shadowRoot ?? menu;
      const openPanel = root.querySelector('.sf-admin-menu-panel-sub.translate-x-0');
      openPanel?.querySelector('[aria-label="Back"]')?.click();
    });
    await page.waitForTimeout(250);
  }

  const expandButton = page.locator('sf-admin-menu button').filter({
    hasText: /Развернуть|Expand/i,
  }).first();
  if (await expandButton.isVisible().catch(() => false)) {
    await expandButton.click();
    await page.waitForTimeout(350);
  }
  const scrollProbe = await measureMenu();
  if (scrollProbe.mainScroll?.scrollable) {
    await page.locator('sf-admin-menu .sf-admin-menu-main').evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await page.waitForTimeout(200);
  }
  const scrollScreenshot = resolve(outputDirectory, `${suffix}-scroll.png`);
  await page.screenshot({ path: scrollScreenshot, fullPage: true });
  results.push({
    name: `${name}-scroll`,
    viewport,
    status: response?.status() ?? null,
    screenshot: scrollScreenshot,
    consoleMessages,
    failedRequests,
    httpErrors,
    probe: await measureMenu(),
  });

  const settingsButton = page.locator('sf-admin-menu button').filter({
    hasText: /Настройки меню|Menu settings/i,
  }).first();
  if (await settingsButton.isVisible().catch(() => false)) {
    await settingsButton.click();
    await page.waitForTimeout(500);
    const settingsScreenshot = resolve(outputDirectory, `${suffix}-settings.png`);
    await page.screenshot({ path: settingsScreenshot, fullPage: true });
    results.push({
      name: `${name}-settings`,
      viewport,
      status: response?.status() ?? null,
      screenshot: settingsScreenshot,
      consoleMessages,
      failedRequests,
      httpErrors,
      probe: await page.evaluate(() => ({
        bodyText: document.body.innerText.trim().replace(/\s+/g, ' ').slice(0, 1600),
        hasSave: /Сохранить|Save/i.test(document.body.innerText),
        hasCancel: /Отменить|Cancel/i.test(document.body.innerText),
        hasDragHandles: document.body.innerText.includes('drag_indicator'),
      })),
    });
  }

  if (viewport.width >= 1000) {
    const compactChanged = await page.locator('sf-admin-menu').evaluate((menu) => {
      if (menu.state?.menuSettings) menu.cancelMenuSettings?.();
      return typeof menu.toggleCompact === 'function';
    }).catch(() => false);
    if (compactChanged) {
      await page.locator('sf-admin-menu [data-admin-menu-toggle]').click();
      await page.waitForTimeout(350);
      const collapsedScreenshot = resolve(outputDirectory, `${suffix}-collapsed.png`);
      await page.screenshot({ path: collapsedScreenshot, fullPage: true });
      results.push({
        name: `${name}-collapsed`,
        viewport,
        status: response?.status() ?? null,
        screenshot: collapsedScreenshot,
        consoleMessages,
        failedRequests,
        httpErrors,
        probe: await measureMenu(),
      });

      const compactSearchButton = page.locator('sf-admin-menu #search_toggle_menu');
      if (await compactSearchButton.isVisible().catch(() => false)) {
        await compactSearchButton.click();
        await page.waitForTimeout(350);
        const expandedAgainScreenshot = resolve(outputDirectory, `${suffix}-expanded-again.png`);
        await page.screenshot({ path: expandedAgainScreenshot, fullPage: true });
        results.push({
          name: `${name}-expanded-again`,
          viewport,
          status: response?.status() ?? null,
          screenshot: expandedAgainScreenshot,
          consoleMessages,
          failedRequests,
          httpErrors,
          probe: await measureMenu(),
        });
      }

      await page.setViewportSize({ width: 390, height: 844 });
      if (name === 'integrated') {
        const navigationToggle = page.locator('#larena-admin-navigation-toggle');
        if (await navigationToggle.isVisible().catch(() => false)) {
          await navigationToggle.click();
          await page.waitForTimeout(300);
        }
      }
      const resizedScreenshot = resolve(outputDirectory, `${suffix}-resized-mobile.png`);
      await page.screenshot({ path: resizedScreenshot, fullPage: true });
      results.push({
        name: `${name}-resized-mobile`,
        viewport: { width: 390, height: 844 },
        status: response?.status() ?? null,
        screenshot: resizedScreenshot,
        consoleMessages,
        failedRequests,
        httpErrors,
        probe: await measureMenu(),
      });
    }
  }

  await context.close();
}

const requestedTargets = new Set(
  String(process.env.NAVIGATION_PARITY_TARGETS ?? 'reference,integrated')
    .split(',')
    .map((target) => target.trim())
    .filter(Boolean),
);

for (const viewport of [{ width: 1440, height: 1100 }, { width: 390, height: 844 }]) {
  if (requestedTargets.has('reference')) {
    await inspectPage({
      name: 'reference',
      url: 'https://ui-admin.test/navigation-menu-reference.html',
      viewport,
    });
  }
  if (requestedTargets.has('integrated')) {
    await inspectPage({
      name: 'integrated',
      url: integratedUrl,
      viewport,
      authenticated: true,
    });
  }
}

await browser.close();

const report = {
  schema: 'larena.admin_navigation_parity_browser.v1',
  createdAt: new Date().toISOString(),
  results,
};
const reportPath = resolve(outputDirectory, 'report.json');
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
const violations = [];
for (const result of results) {
  if (result.status !== 200) violations.push(`${result.name}:status:${result.status}`);
  if (result.failedRequests.length > 0) violations.push(`${result.name}:failed_requests`);
  if (result.httpErrors.length > 0) violations.push(`${result.name}:http_errors`);
  if (result.consoleMessages.some((message) => message.type === 'error')) {
    violations.push(`${result.name}:console_error`);
  }
  if (result.name.endsWith('-settings')) {
    if (!result.probe.hasSave) violations.push(`${result.name}:save_missing`);
    if (!result.probe.hasDragHandles) violations.push(`${result.name}:drag_handles_missing`);
  } else if (result.name.endsWith('-search')) {
    if (!result.probe.query) violations.push(`${result.name}:query_missing`);
    if (result.probe.resultCount < 1) violations.push(`${result.name}:results_missing`);
  } else {
    if (!result.probe.hasMenu) violations.push(`${result.name}:menu_missing`);
    if (result.name === 'reference' && result.probe.persistenceMode !== 'local') {
      violations.push(`${result.name}:local_mode_missing`);
    }
    if (result.name === 'integrated' && result.probe.persistenceMode !== 'external') {
      violations.push(`${result.name}:external_mode_missing`);
    }
    if (result.viewport.width >= 1000 && result.probe.sidebarWidth !== null
      && !result.name.endsWith('-collapsed')
      && Math.abs(result.probe.sidebarWidth - 320) > 1) {
      violations.push(`${result.name}:sidebar_width:${result.probe.sidebarWidth}`);
    }
    if (result.name.endsWith('-collapsed')) {
      if (result.probe.compactState !== true || result.probe.compactDataset !== 'true') {
        violations.push(`${result.name}:compact_contract_missing`);
      }
      if (Math.abs((result.probe.sidebarWidth ?? 0) - 90) > 1
        || Math.abs((result.probe.panelWidth ?? 0) - 90) > 1) {
        violations.push(`${result.name}:compact_width:${result.probe.sidebarWidth}/${result.probe.panelWidth}`);
      }
      if ((result.probe.blankStripWidth ?? 0) > 1) {
        violations.push(`${result.name}:blank_strip:${result.probe.blankStripWidth}`);
      }
      if (result.name.startsWith('integrated')
        && Math.abs((result.probe.workspaceLeft ?? 0) - (result.probe.sidebarRight ?? 0)) > 1) {
        violations.push(`${result.name}:workspace_gap`);
      }
    }
    if (result.name.endsWith('-expanded-again')) {
      if (result.probe.compactState !== false || result.probe.compactDataset !== 'false') {
        violations.push(`${result.name}:expanded_contract_missing`);
      }
      if (Math.abs((result.probe.sidebarWidth ?? 0) - 320) > 1) {
        violations.push(`${result.name}:expanded_width:${result.probe.sidebarWidth}`);
      }
    }
    if (result.viewport.width <= 520 && !result.probe.compactState) {
      if ((result.probe.blankStripWidth ?? 0) > 1) {
        violations.push(`${result.name}:mobile_blank_strip:${result.probe.blankStripWidth}`);
      }
      if (result.probe.sidebarWidth !== null && result.probe.panelWidth !== null
        && Math.abs(result.probe.sidebarWidth - result.probe.panelWidth) > 1) {
        violations.push(`${result.name}:mobile_panel_width:${result.probe.sidebarWidth}/${result.probe.panelWidth}`);
      }
    }
    if (result.name.endsWith('-nested') && result.probe.nestedBadgeClipped) {
      violations.push(`${result.name}:nested_badge_clipped`);
    }
    if (result.name.startsWith('reference') && result.name.endsWith('-nested')
      && result.probe.nestedBadges.length < 2) {
      violations.push(`${result.name}:nested_badges_not_measured`);
    }
    if (result.name === 'reference-scroll') {
      if (!result.probe.mainScroll?.scrollable || result.probe.mainScroll.overflowY !== 'auto') {
        violations.push(`${result.name}:scroll_not_enabled`);
      }
      if ((result.probe.mainScroll?.scrollTop ?? 0) <= 0) {
        violations.push(`${result.name}:scroll_position_not_moved`);
      }
    }
    if (result.probe.mainScroll?.overlapsFooter) {
      violations.push(`${result.name}:main_overlaps_footer`);
    }
    if (result.probe.footer?.settingsLines != null && result.probe.footer.settingsLines > 1) {
      violations.push(`${result.name}:settings_label_wrapped`);
    }
  }
}
process.stdout.write(`${reportPath}\n`);
if (violations.length > 0) {
  throw new Error(`Navigation parity browser violations: ${violations.join(', ')}`);
}
