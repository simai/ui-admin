#!/usr/bin/env node
// Evidence of a site build (set standard draft 1.1 §8.11, §8.12, §11.16,
// §11.18).
//
// Usage: node site/scripts/evidence.mjs <site URL> <out directory> [--concurrency N] [--only <path>,...]
//
//   first paint (8.11): every page holding a live example (each
//     content/ru/**/*.md with «:::example») and the home page, at 1440 and
//     390, light and dark, three cold loads each (a new browser context per
//     load). Measured: the layout shift (CLS) of the page and of every
//     example frame (layout-shift entries without recent input, observed
//     from the first script of every frame), console errors, page errors and
//     failed requests, and sideways scroll of the page and of each example
//     frame's document;
//   Docara header (8.12) and the hero (E7), on every home load: the hero
//     text box's centre against the hero's centre (offset 0), whether the
//     effect layer lies under the text box, the header's tools present at
//     390, the hero's height (at least 405 px at 1440) and its surface;
//   published (11.16): the home footer names the set version of
//     package/package.json and the pair the site was materialized over
//     (simai-framework.lock.json runtime.pair_id);
//   screenshots (11.18): the home page once per showcase tab at 1440 and
//     390, light and dark (16), and nine pages at 1440 and 390, light (18).
//
// Writes <out>/evidence.json (every load) and <out>/summary.json, and exits 1
// when a rule fails. Needs Playwright (PLAYWRIGHT_MODULE for its path,
// PLAYWRIGHT_BROWSERS_PATH for the browser); the browser is headless Chrome.
import {mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const argv = process.argv.slice(2);
const option = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
const [base, outArgument] = argv.filter((value, index) => !value.startsWith('--') && !argv[index - 1]?.startsWith('--'));
if (!base || !outArgument) throw new Error('usage: evidence.mjs <site URL> <out directory> [--concurrency N] [--only <path>,...]');
const out = resolve(outArgument);
mkdirSync(out, {recursive: true});
const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const concurrency = Number(option('--concurrency') ?? 4);

const WIDTHS = [1440, 390];
const SCHEMES = ['light', 'dark'];
const LOADS = 3;
const HERO_MIN = 405;
const TABS = ['Таблица', 'Карточка', 'Таблица и карточка', 'В потоке'];
const SHOTS = [
  ['properties', 'ru/properties/'],
  ['properties-file', 'ru/properties/file/'],
  ['properties-date', 'ru/properties/date/'],
  ['quick-start', 'ru/guide/quick-start/'],
  ['concepts-data', 'ru/guide/concepts/data/'],
  ['guide-bulk-actions', 'ru/guide/list/bulk-actions/'],
  ['recipe-data-in-flow', 'ru/recipes/data-in-flow/'],
  ['reference-view-table', 'ru/components/view-table/'],
  ['reference-view-flow', 'ru/components/view-flow/'],
];

// The pages with a live example, by their content files.
const walk = (directory) => readdirSync(directory, {withFileTypes: true})
  .flatMap((entry) => (entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]));
const contentRoot = join(site, 'content/ru');
const examplePages = walk(contentRoot)
  .filter((path) => path.endsWith('.md') && readFileSync(path, 'utf8').includes(':::example'))
  .map((path) => `ru/${path.slice(contentRoot.length + 1).replace(/\.md$/u, '').replace(/(^|\/)index$/u, '')}/`.replace(/\/+$/u, '/').replace(/^ru\/\/$/u, 'ru/'))
  .sort();
const only = option('--only')?.split(',');
const pages = only ?? [...new Set(['ru/', ...examplePages])];

const version = JSON.parse(readFileSync(resolve(site, '../package/package.json'), 'utf8')).version;
const pair = JSON.parse(readFileSync(join(site, 'simai-framework.lock.json'), 'utf8')).runtime.pair_id;

// Every frame counts its own layout shifts from its first script on.
const OBSERVE = () => {
  window.__sfShift = 0;
  window.__sfShifts = [];
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue;
        window.__sfShift += entry.value;
        window.__sfShifts.push({value: Number(entry.value.toFixed(5)), at: Math.round(entry.startTime),
          sources: (entry.sources ?? []).slice(0, 3).map((source) => source.node?.nodeName?.toLowerCase() ?? '?')});
      }
    }).observe({type: 'layout-shift', buffered: true});
  } catch { /* no layout-shift API */ }
};

const browser = await chromium.launch({headless: true, channel: 'chrome', ignoreDefaultArgs: ['--hide-scrollbars']});

const open = async (width, scheme) => {
  const context = await browser.newContext({viewport: {width, height: 900}, colorScheme: scheme, deviceScaleFactor: 1, ignoreHTTPSErrors: true});
  await context.addInitScript(OBSERVE);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('requestfailed', (request) => {
    // A navigation the page itself aborts (an example frame reloaded) is not a failure.
    if (request.failure()?.errorText === 'net::ERR_ABORTED' && request.resourceType() === 'document') return;
    errors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText ?? ''}`);
  });
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`http ${response.status()}: ${response.url()}`); });
  return {context, page, errors};
};
// A page whose network never goes quiet (a long-polling example) is taken
// once it has loaded; the wait for quiet is then only a cap.
const settle = async (page, url) => {
  await page.goto(url, {waitUntil: 'load', timeout: 60000});
  await page.waitForLoadState('networkidle', {timeout: 15000}).catch(() => {});
};
// Frames load lazily: scroll through the page so every example starts, then
// let it settle.
const wake = async (page) => {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 700) { await page.evaluate((top) => window.scrollTo(0, top), y); await page.waitForTimeout(120); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(2500);
};
const measure = async (page) => {
  const frames = [];
  for (const frame of page.frames()) {
    const one = await frame.evaluate(() => ({
      shift: Number((window.__sfShift ?? 0).toFixed(5)),
      shifts: window.__sfShifts ?? [],
      sideways: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      observed: typeof window.__sfShift === 'number',
    })).catch((error) => ({error: String(error.message).slice(0, 120)}));
    frames.push({main: frame === page.mainFrame(), url: frame === page.mainFrame() ? frame.url() : frame.url().slice(0, 60), ...one});
  }
  return frames;
};
const header = (page) => page.evaluate((minimum) => {
  const hero = document.querySelector('[data-docara-block="hero"]');
  if (!hero) return {hero: false};
  const box = hero.querySelector('.text-center') ?? hero.querySelector('h1')?.parentElement;
  const heroRect = hero.getBoundingClientRect();
  const boxRect = box.getBoundingClientRect();
  const layers = [...hero.querySelectorAll('canvas, [data-sf-effect-layer], [class*="effect"]')].filter((one) => one !== box && !box.contains(one));
  const under = layers.some((layer) => {
    const rect = layer.getBoundingClientRect();
    const overlap = Math.max(0, Math.min(rect.right, boxRect.right) - Math.max(rect.left, boxRect.left)) * Math.max(0, Math.min(rect.bottom, boxRect.bottom) - Math.max(rect.top, boxRect.top));
    return overlap > 0 && getComputedStyle(layer).visibility !== 'hidden' && Number(getComputedStyle(layer).opacity) > 0;
  });
  const tools = [...document.querySelectorAll('header button, header a[role="button"], header [data-docara-header-tool]')]
    .filter((one) => one.getClientRects().length > 0)
    .map((one) => one.getAttribute('aria-label') ?? one.textContent.trim().slice(0, 30));
  const footer = document.body.innerText;
  return {
    hero: true,
    effect: hero.dataset.sfEffect ?? null,
    effectLayers: layers.length,
    effectUnderText: under,
    centreOffset: Math.round(((boxRect.left + boxRect.right) / 2 - (heroRect.left + heroRect.right) / 2) * 10) / 10,
    height: Math.round(heroRect.height),
    heightOk: window.innerWidth < 1440 || heroRect.height >= minimum,
    surface: [...hero.classList].find((name) => name.startsWith('bg-')) ?? getComputedStyle(hero).backgroundColor,
    tools,
    footerText: footer.slice(footer.lastIndexOf('Версия')).replace(/\s+/gu, ' ').slice(0, 400),
  };
}, HERO_MIN);

// ---- First paint matrix (8.11, 8.12, 11.16) -------------------------------
const jobs = [];
for (const path of pages) for (const width of WIDTHS) for (const scheme of SCHEMES) for (let load = 1; load <= LOADS; load += 1) jobs.push({path, width, scheme, load});
const results = [];
let next = 0;
const worker = async () => {
  while (next < jobs.length) {
    const job = jobs[next++];
    const {context, page, errors} = await open(job.width, job.scheme);
    const result = {...job};
    try {
      await settle(page, new URL(job.path, base).href);
      await wake(page);
      result.frames = await measure(page);
      if (job.path === 'ru/') result.header = await header(page);
    } catch (error) {
      result.failed = String(error.message).slice(0, 200);
    }
    result.errors = errors;
    const main = result.frames?.find((frame) => frame.main);
    result.cls = Number((result.frames ?? []).reduce((sum, frame) => sum + (frame.shift ?? 0), 0).toFixed(5));
    result.sideways = main?.sideways ?? null;
    result.frameSideways = (result.frames ?? []).filter((frame) => !frame.main && frame.sideways > 0).length;
    result.ok = !result.failed && !errors.length && result.cls === 0 && result.sideways === 0 && !result.frameSideways
      && (!result.header || (result.header.hero && Math.abs(result.header.centreOffset) <= 0.5 && !result.header.effectUnderText
        && result.header.heightOk && (job.width !== 390 || result.header.tools.length > 0)
        && result.header.footerText.includes(version) && result.header.footerText.includes(pair)));
    results.push(result);
    await context.close();
    if (results.length % 24 === 0) console.error(`… ${results.length}/${jobs.length}`);
  }
};
await Promise.all(Array.from({length: concurrency}, worker));
results.sort((a, b) => a.path.localeCompare(b.path) || a.width - b.width || a.scheme.localeCompare(b.scheme) || a.load - b.load);

// ---- Screenshots (11.18) --------------------------------------------------
const shots = [];
const shoot = async (page, width, file) => {
  const full = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({width, height: Math.min(full, 12000)});
  await page.waitForTimeout(1500);
  await page.screenshot({path: join(out, file), fullPage: true});
  await page.setViewportSize({width, height: 900});
  shots.push(file);
};
const shotErrors = [];
if (!only) try {
  for (const scheme of SCHEMES) {
    for (const width of WIDTHS) {
      const {context, page} = await open(width, scheme);
      await settle(page, new URL('ru/', base).href);
      await wake(page);
      for (const [index, label] of TABS.entries()) {
        const frame = page.frames().find((one) => one !== page.mainFrame());
        if (index > 0) { await frame?.getByRole('tab', {name: label, exact: true}).click(); await page.waitForTimeout(1500); }
        await shoot(page, width, `home-${index + 1}-${width}-${scheme}.png`);
      }
      await context.close();
    }
  }
  for (const width of WIDTHS) {
    for (const [name, path] of SHOTS) {
      const {context, page} = await open(width, 'light');
      await settle(page, new URL(path, base).href);
      await wake(page);
      await shoot(page, width, `${name}-${width}-light.png`);
      await context.close();
    }
  }
} catch (error) { shotErrors.push(String(error.message).slice(0, 200)); }
await browser.close();

const failing = results.filter((result) => !result.ok);
const home = results.filter((result) => result.header);
const summary = {
  base,
  version,
  pair,
  pages: pages.length,
  loads: results.length,
  passed: results.length - failing.length,
  cls_nonzero: results.filter((result) => result.cls !== 0).length,
  max_cls: Math.max(0, ...results.map((result) => result.cls ?? 0)),
  console_or_request_errors: results.filter((result) => result.errors.length).length,
  sideways: results.filter((result) => result.sideways !== 0 || result.frameSideways).length,
  header: {
    loads: home.length,
    centre_offset_max: Math.max(0, ...home.map((result) => Math.abs(result.header.centreOffset ?? 0))),
    effect_under_text: home.filter((result) => result.header.effectUnderText).length,
    hero_height_1440: [...new Set(home.filter((result) => result.width === 1440).map((result) => result.header.height))],
    tools_390: [...new Set(home.filter((result) => result.width === 390).map((result) => result.header.tools.length))],
    surface: [...new Set(home.map((result) => result.header.surface))],
    effect: [...new Set(home.map((result) => result.header.effect))],
    footer_names_version_and_pair: home.every((result) => result.header.footerText.includes(version) && result.header.footerText.includes(pair)),
  },
  screenshots: shots.length,
  screenshot_errors: shotErrors,
  failing: failing.map(({path, width, scheme, load, cls, sideways, frameSideways, errors, failed, header: hero}) => ({path, width, scheme, load, cls, sideways, frameSideways, errors: errors.slice(0, 5), failed, header: hero && {centreOffset: hero.centreOffset, effectUnderText: hero.effectUnderText, height: hero.height, tools: hero.tools.length}})),
};
writeFileSync(join(out, 'evidence.json'), `${JSON.stringify({base, results}, null, 1)}\n`);
writeFileSync(join(out, 'summary.json'), `${JSON.stringify(summary, null, 1)}\n`);
console.log(JSON.stringify({...summary, failing: summary.failing.length}, null, 1));
process.exit(failing.length || shotErrors.length ? 1 : 0);
