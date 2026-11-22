#!/usr/bin/env node
// Writes the release data of the pages: every block between
// <!-- release:<name> --> and <!-- /release:<name> --> in content/ru/**.md.
// A page never states a version, a release id or the SIMAI Framework pair in
// its own words; it holds a block and this script fills it, so a rebuild over
// another set build or pair moves every page with it.
//
// Sources:
//   - the set build the site is built over: its receipt (--receipt, default
//     package/dist/package-receipt.json) names the package commit; the
//     version is the newest heading of package/CHANGELOG.md at that commit
//     («## 1.1.0 (candidate, …)») unless a release lock names the commit;
//   - the released versions: contracts/releases/admin-*.lock.json (id,
//     version, source revision; the date is the commit that added the lock);
//   - package/set.json at that commit: the Core the set needs and the status
//     of each component; component.json: each component's version;
//   - simai-framework.lock.json: the pair the site is materialized over;
//     scripts/materialize-framework-runtime.php: its npm version.
//
// Blocks: cdn, cdn-pinned, compat, boot, npm, versions, footer (any page);
// badges (a component page: content/ru/components/<folder>.md).
//
// Usage: node site/scripts/build-pages.mjs [--check] [--receipt FILE]
import {execFileSync} from 'node:child_process';
import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {dirname, join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repository = resolve(site, '..');
const argv = process.argv.slice(2);
const check = argv.includes('--check');
const receiptAt = argv.includes('--receipt') ? resolve(argv[argv.indexOf('--receipt') + 1] ?? '') : join(repository, 'package/dist/package-receipt.json');

const git = (...args) => execFileSync('git', ['-C', repository, ...args], {encoding: 'utf8', maxBuffer: 64 << 20});
const receipt = JSON.parse(readFileSync(receiptAt, 'utf8'));
const revision = receipt.package_source.revision;
const atBuild = (path) => git('show', `${revision}:${path}`);

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const day = (iso) => {
  const [year, month, date] = iso.split('-').map(Number);
  return `${date} ${MONTHS[month - 1]} ${year} года`;
};

const releasesAt = join(repository, 'contracts/releases');
const releases = readdirSync(releasesAt).filter((name) => /^admin-[0-9a-f]{12}\.lock\.json$/u.test(name))
  .map((name) => {
    const lock = JSON.parse(readFileSync(join(releasesAt, name), 'utf8'));
    const added = git('log', '--diff-filter=A', '-1', '--format=%cs', '--', `contracts/releases/${name}`).trim();
    return {id: lock.id, version: lock.version, revision: lock.source?.revision, date: added, pair: lock.requires.framework, core: lock.requires.core_runtime.replace(/^>=\s*/u, '')};
  })
  .sort((a, b) => b.version.localeCompare(a.version, 'en', {numeric: true}));
const latest = releases[0];
const built = releases.find((one) => one.revision === revision) ?? null;
const heading = atBuild('package/CHANGELOG.md').match(/^## (\d+\.\d+\.\d+)\b/mu);
if (!built && !heading) throw new Error('build-pages: no version for the set build (no release lock, no CHANGELOG heading)');
const version = built?.version ?? heading[1];
const candidate = !built;

const set = JSON.parse(atBuild('package/set.json'));
const core = set.framework.core_runtime.replace(/^>=\s*/u, '');
const lock = JSON.parse(readFileSync(join(site, 'simai-framework.lock.json'), 'utf8'));
const pair = lock.runtime.pair_id;
const npmUi = readFileSync(join(site, 'scripts/materialize-framework-runtime.php'), 'utf8').match(/const NPM_VERSION = '([^']+)';/u)[1];
if (receipt.framework?.release !== pair) throw new Error(`build-pages: the set build is over ${receipt.framework?.release}, the site over ${pair}`);
const cdn = `https://cdn.jsdelivr.net/npm/@simai-studio/ui@${npmUi}/distr/core/js/core.min.js`;

const STATUS = {released: 'выпущен', preview: 'предварительный'};
const components = Object.fromEntries(set.components.map((one) => {
  const component = JSON.parse(atBuild(`package/src/smart/${one.folder}/component.json`));
  return [one.folder, {element: one.element, status: one.status, version: component.version}];
}));

const blocks = {
  cdn: () => ['```html', `<script src="${cdn}" data-sf-sets="admin"></script>`, '```'].join('\n'),
  'cdn-pinned': () => ['```html', `<script src="${cdn}" data-sf-sets="admin@${latest.version}"></script>`, '```'].join('\n'),
  compat: () => (candidate
    ? `Эта сборка сайта показывает кандидат версии ${version}: он собран над выпуском SIMAI Framework \`${pair}\` (npm \`@simai-studio/ui@${npmUi}\`) и работает с \`core.runtime\` ${core} или новее. В npm опубликована версия ${latest.version} (\`${latest.id}\`, ${day(latest.date)}): в ней меню администратора.`
    : `Эта сборка сайта показывает версию ${version} (\`${built.id}\`): она собрана над выпуском SIMAI Framework \`${pair}\` (npm \`@simai-studio/ui@${npmUi}\`) и работает с \`core.runtime\` ${core} или новее.`),
  boot: () => ['```html', '<script>', '  window.SF_BOOT_CONFIG = {', '    packages: {', `      admin: {base: '/assets/ui-admin/smart', version: '${version}'}`, '    }', '  };', '</script>', '<script src="/assets/ui/distr/core/js/core.min.js"></script>', '```'].join('\n'),
  npm: () => ['```bash', `npm install @simai-studio/admin@${latest.version} @simai-studio/ui@${npmUi}`, '```'].join('\n'),
  versions: () => [
    '| Набор | Выпуск | Собран над SIMAI Framework | Нужен Core |',
    '|:---|:---|:---|:---|',
    ...(candidate ? [`| ${version} | кандидат, эта сборка сайта | \`${pair}\` | \`core.runtime\` ${core} или новее |`] : []),
    ...releases.map((one) => `| ${one.version} | \`${one.id}\`, ${day(one.date)} | \`${one.pair}\` | \`core.runtime\` ${one.core} или новее |`),
  ].join('\n'),
  footer: () => [
    '::::grid {columns=3 gap=4}',
    ':::card {variant=plain}',
    '### Версия',
    candidate
      ? `SIMAI Admin ${version}, кандидат выпуска; последняя выпущенная — ${latest.version} от ${day(latest.date)}. [История изменений](/ru/guide/changes/)`
      : `SIMAI Admin ${version} от ${day(built.date)}. [История изменений](/ru/guide/changes/)`,
    ':::',
    ':::card {variant=plain}',
    '### Совместимость',
    `Собран и проверен над выпуском SIMAI Framework \`${pair}\`; работает с Core \`core.runtime\` ${core} или новее. [Подключение](/ru/guide/connection/)`,
    ':::',
    ':::card {variant=plain}',
    '### Лицензия',
    'Бесплатно для малого бизнеса и некоммерческого использования, остальным — коммерческая лицензия SIMAI. [Условия лицензии](/ru/guide/connection/#лицензия)',
    ':::',
    '::::',
    '',
    '[Руководство](/ru/guide/) · [Компоненты](/ru/components/) · [Полный пример](/demo/) · [npm](https://www.npmjs.com/package/@simai-studio/admin) · [SIMAI Framework](https://ui.simai.io/)',
  ].join('\n'),
};
const badges = (folder) => {
  const one = components[folder];
  if (!one) throw new Error(`build-pages: no component ${folder} in set.json`);
  return `:badge[${one.element}]{variant=main scheme=on-surface size=1} :badge[Версия ${one.version}]{variant=tonal scheme=neutral size=1} :badge[${STATUS[one.status] ?? one.status}]{variant=tonal scheme=${one.status === 'released' ? 'success' : 'warning'} size=1}`;
};

const walk = (directory) => readdirSync(directory, {withFileTypes: true})
  .flatMap((entry) => (entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]));
let changed = 0;
let filled = 0;
for (const path of walk(join(site, 'content/ru')).filter((one) => one.endsWith('.md'))) {
  const text = readFileSync(path, 'utf8');
  const next = text.replace(/<!-- release:([a-z-]+) -->\n[\s\S]*?<!-- \/release:\1 -->/gu, (_, name) => {
    filled += 1;
    let body;
    if (name === 'badges') body = badges(path.match(/components\/([^/]+)\.md$/u)?.[1]);
    else if (blocks[name]) body = blocks[name]();
    else throw new Error(`build-pages: ${relative(site, path)}: unknown block ${name}`);
    return `<!-- release:${name} -->\n${body}\n<!-- /release:${name} -->`;
  });
  if (next !== text) {
    changed += 1;
    if (check) console.error(`stale: ${relative(site, path)}`);
    else writeFileSync(path, next);
  }
}
console.log(JSON.stringify({version, candidate, pair, blocks: filled, changed}));
if (check && changed) process.exit(1);
