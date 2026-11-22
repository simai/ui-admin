#!/usr/bin/env node
// The site's content lint: the rules of the set standard draft 1.1 §11 that
// a reading of the files can hold (owner decision C290 and the set-site
// scheme). Each check names its rule; a failure prints the file and line.
//
//   sections    the header navigation is exactly Руководство, Компоненты,
//               Свойства, Рецепты (the details before the ready tasks, docs
//               structure 2026-11-20), and content/ru holds no other section
//               (C290 (1), (2));
//   properties  config/properties.json lists the property types of the
//               Framework field renderers' registry of the pair the site is
//               built over (.framework/), in its order, and every type has a
//               page and an example (C290 (3), (4)); a type the pair does not
//               have yet names in `framework` the registry type it is drawn
//               as (phone and password, C302 (1)), and goes when it has it;
//   tops        a component page's introduction does not start with the tag
//               (D12), the overview puts words first (§11.9);
//   versions    no release literal (a pair id, a set release id, an npm or
//               a set version in a URL) outside the generated release blocks,
//               the generated reference and the change history (§11.10);
//               no pro copy named, no panel width set by hand in an
//               example (§11.19);
//   promises    no promise of a later release in the content (§11.12;
//               «docs: current state only», 2026-11-17);
//   history     no internal decision id (C295, C305 (4), VT-4) and no version
//               history («с версии 1.17.0», «(с 1.7.0)», «С 1.18.0») in the
//               content, the generated reference included, outside the change
//               history and the upgrade guide (owner rules D02, D16; VS-SITE-11),
//               and no decision id in those two or in an example's source;
//   grid        no grid of more than three items in a row (§11.13);
//   showcase    every showcase panel is a surface-1 card with an outline
//               (§11.11);
//   pictures    pictures come from the D22 set (assets/illustrations/ with
//               its manifest; examples hold byte-same copies) (C290 (6));
//   colours     no colour literal in the examples outside the colour field's
//               own data (SWATCHES), and a role container plate always with
//               its on-colour (C192);
//   concepts    each concept page holds a picture (§11.14);
//   locales     the registry's locale layout: ru and en declared, prefixed
//               URLs, no published English page before its text is accepted;
//               every built page declares its language (§11.15);
//   docara      Docara is pinned exactly and at most one release behind the
//               Framework docs (ui-doc) when UI_DOC_COMPOSER_LOCK names their
//               composer.lock (§11.17).
//
// Usage: node site/scripts/site-lint.mjs
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {dirname, join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const notes = [];
const fail = (rule, where, message) => failures.push(`${rule}: ${where}: ${message}`);
const read = (path) => readFileSync(join(site, path), 'utf8');
const json = (path) => JSON.parse(read(path));
const walk = (directory) => (existsSync(join(site, directory)) ? readdirSync(join(site, directory), {withFileTypes: true}) : [])
  .flatMap((entry) => (entry.isDirectory() ? walk(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`]));
const lineOf = (text, index) => text.slice(0, index).split('\n').length;
const contentFiles = walk('content/ru').filter((path) => path.endsWith('.md'));

// ---- sections --------------------------------------------------------------
const SECTIONS = [['guide', 'Руководство'], ['components', 'Компоненты'], ['properties', 'Свойства'], ['recipes', 'Рецепты']];
{
  const root = json('content/ru/section.json');
  const items = root.header_navigation?.items ?? root.navigation?.header?.items ?? [];
  const got = items.map((item) => [item.id ?? item.href?.split('/').filter(Boolean).pop(), item.label ?? item.title]);
  if (JSON.stringify(got) !== JSON.stringify(SECTIONS)) fail('sections', 'content/ru/section.json', `header navigation is ${JSON.stringify(got)}, want ${JSON.stringify(SECTIONS)}`);
  const folders = readdirSync(join(site, 'content/ru'), {withFileTypes: true}).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  const want = SECTIONS.map(([id]) => id).sort();
  if (JSON.stringify(folders) !== JSON.stringify(want)) fail('sections', 'content/ru', `sections on disk ${folders.join(', ')}, want ${want.join(', ')}`);
}

// ---- properties ------------------------------------------------------------
{
  const entries = json('config/properties.json').types;
  const config = entries.map((entry) => entry.type);
  const own = entries.filter((entry) => !entry.framework).map((entry) => entry.type);
  const renderers = join(site, '.framework/distr/smart/field-renderers/js/field-renderers.js');
  if (existsSync(renderers)) {
    const source = readFileSync(renderers, 'utf8');
    const start = source.indexOf('const PROPERTY_TYPES = Object.freeze([');
    const end = source.indexOf('\n]);', start);
    if (start < 0 || end < 0) fail('properties', relative(site, renderers), 'PROPERTY_TYPES not found');
    else {
      const registry = [...source.slice(start, end).matchAll(/^ {2}type: '([^']+)'/gmu)].map((match) => match[1]);
      if (JSON.stringify(registry) !== JSON.stringify(own)) fail('properties', 'config/properties.json', `types ${own.join(', ')} differ from the registry ${registry.join(', ')}`);
      for (const entry of entries.filter((one) => one.framework)) {
        if (registry.includes(entry.type)) fail('properties', 'config/properties.json', `${entry.type} is in the registry now: drop its «framework»`);
        if (!registry.includes(entry.framework)) fail('properties', 'config/properties.json', `${entry.type} is drawn as ${entry.framework}, which the registry does not have`);
      }
    }
  } else {
    notes.push('properties: .framework/ is not extracted (run scripts/build.sh); the registry was not compared');
  }
  for (const type of config) {
    const slug = type.replace(/\./gu, '-');
    if (!existsSync(join(site, `content/ru/properties/${slug}.md`))) fail('properties', type, `no page content/ru/properties/${slug}.md`);
    if (!existsSync(join(site, `examples/properties/${slug}/index.js`))) fail('properties', type, `no example examples/properties/${slug}/`);
  }
}

// ---- tops ------------------------------------------------------------------
{
  for (const path of contentFiles.filter((one) => /^content\/ru\/components\/[^/]+\/[^/]+\.md$/u.test(one))) {
    const text = read(path);
    const body = text.replace(/^---\n[\s\S]*?\n---\n/u, '');
    const paragraphs = body.split(/\n{2,}/u).map((part) => part.trim()).filter(Boolean);
    const title = paragraphs.findIndex((part) => part.startsWith('# '));
    const intro = paragraphs.slice(title + 1).find((part) => !part.startsWith(':badge['));
    if (title < 0) fail('tops', path, 'no title');
    else if (intro && /^`?<?sf-/u.test(intro)) fail('tops', path, 'the introduction starts with the tag (D12)');
  }
  const overview = read('content/ru/components/index.md');
  if (!overview.includes('| Компонент | Элемент | Что делает |')) fail('tops', 'content/ru/components/index.md', 'the overview table is not words first, tag in its own column');
}

// ---- versions --------------------------------------------------------------
const LITERALS = /\bui-[0-9a-f]{12}\b|\bview-[0-9a-f]{12}\b|@simai-studio\/ui@\d|\bview@\d+\.\d+\.\d+|\b5\.20\d{6}\.\d{4}\b/gu;
const generatedOut = (text) => text
  .replace(/<!-- release:([a-z-]+) -->[\s\S]*?<!-- \/release:\1 -->/gu, (block) => block.replace(/[^\n]/gu, ' '))
  .replace(/\n## Параметры\n[\s\S]*?\n## См\. также\n/u, (block) => block.replace(/[^\n]/gu, ' '));
for (const path of contentFiles) {
  if (path === 'content/ru/guide/changes.md') continue;
  const text = generatedOut(read(path));
  for (const match of text.matchAll(LITERALS)) fail('versions', `${path}:${lineOf(text, match.index)}`, `release literal «${match[0]}» outside the release blocks`);
}
// The docs name the set's release, never a pro copy; a panel in an example
// stands at a width of the drawer's ladder (§11.19).
for (const path of [...contentFiles, ...walk('examples').filter((one) => /\.(html|js)$/u.test(one))]) {
  const text = read(path);
  for (const match of text.matchAll(/\bpro-[0-9a-f]{12}\b|\bui-pro\b|@simai-studio\/pro\b/gu)) fail('versions', `${path}:${lineOf(text, match.index)}`, `«${match[0]}» names a pro copy, not the set's release`);
  if (path.startsWith('examples/')) {
    for (const match of text.matchAll(/panel-width="([^"]*)"|panelWidth\s*=\s*['"]([^'"]*)['"]/gu)) fail('versions', `${path}:${lineOf(text, match.index)}`, `panel width «${match[1] ?? match[2]}» set by hand: a panel stands at the drawer's ladder`);
  }
}

// ---- promises --------------------------------------------------------------
// «появится» alone also says what a press shows («внизу появятся действия»):
// it is a promise only next to a release, a version or «later».
const PROMISES = /появ(?:ится|ятся)[^.\n]{0,60}(?:выпуск|верси|позже|скоро)|готовится|в следующ(?:ей|их) верси|планируется|будет добавлен|будут добавлены|\bскоро\b/giu;
for (const path of [...contentFiles, ...walk('config').filter((one) => one.endsWith('.json') || one.endsWith('.html')), ...walk('examples').filter((one) => one.endsWith('.html'))]) {
  if (path === 'content/ru/guide/changes.md') continue;
  const text = read(path);
  for (const match of text.matchAll(PROMISES)) fail('promises', `${path}:${lineOf(text, match.index)}`, `«${match[0]}» promises a later release`);
}

// ---- history ---------------------------------------------------------------
// A page says what the set does now: which decision asked for it and since
// which version it does so belong to the change history.
const HISTORY = /\b(?:C|CD|CL|VT|VR\d?|VS|LH|PT|VZ|LV|VB|VC|VCL|RC|GB)-?\d{2,3}\b|[Сс] верси[ий] \d+\.\d+|\(с \d+\.\d+\.\d+|, с \d+\.\d+\.\d+\)|(?:^|[.;:]\s+)С \d+\.\d+\.\d+|по умолчанию с \d+\.\d+|решени[еяю] владельца|решени[ея] C\d/gmu;
for (const path of contentFiles) {
  if (path === 'content/ru/guide/changes.md' || path === 'content/ru/guide/upgrading.md') continue;
  const text = read(path).replace(/```[\s\S]*?```/gu, (block) => block.replace(/[^\n]/gu, ' '));
  for (const match of text.matchAll(HISTORY)) fail('history', `${path}:${lineOf(text, match.index)}`, `«${match[0].trim()}»: a decision id or version history outside the change history`);
}
// The change history and the upgrade guide keep their versions but name no
// decision either, and nor does an example's source, which a page shows in
// its code tabs (view site acceptance VSA-3).
const DECISION = /\b(?:C|CD|CL|VT|VR\d?|VS|LH|PT|VZ|LV|VB|VC|VCL|RC|GB)-?\d{2,3}\b|решени[еяю] владельца|решени[ея] C\d|owner decisions? C\d/gmu;
for (const path of ['content/ru/guide/changes.md', 'content/ru/guide/upgrading.md', ...walk('examples').filter((one) => /\.(?:html|js|css)$/u.test(one)), 'scripts/property-demo.js']) {
  if (!existsSync(join(site, path))) continue;
  const text = read(path);
  for (const match of text.matchAll(DECISION)) fail('history', `${path}:${lineOf(text, match.index)}`, `«${match[0].trim()}»: a decision id in the change history or an example's source`);
}

// ---- grid ------------------------------------------------------------------
for (const path of contentFiles) {
  const text = read(path);
  for (const match of text.matchAll(/^:{3,}grid\b[^\n]*\bcolumns=(\d+)/gmu)) {
    if (Number(match[1]) > 3) fail('grid', `${path}:${lineOf(text, match.index)}`, `${match[1]} items in a row (at most 3)`);
  }
}

// ---- showcase --------------------------------------------------------------
{
  const html = read('examples/home/showcase/index.html');
  const css = read('examples/home/showcase/index.css');
  const panels = [...html.matchAll(/<section\b[^>]*slot="panel-\d+"[^>]*>([\s\S]*?)<\/section>/gu)];
  if (!panels.length) fail('showcase', 'examples/home/showcase/index.html', 'no panels');
  for (const [, body] of panels) if (!body.includes('class="showcase-card')) fail('showcase', 'examples/home/showcase/index.html', 'a panel without its surface-1 card');
  const card = css.match(/\.showcase-card\s*\{([^}]*)\}/u)?.[1] ?? '';
  if (!/background(?:-color)?:\s*var\(--sf-surface-1\)/u.test(card) || !/border:[^;]*var\(--sf-outline-variant\)/u.test(card)) fail('showcase', 'examples/home/showcase/index.css', '.showcase-card is not surface-1 with an outline');
}

// ---- pictures --------------------------------------------------------------
{
  const manifest = json('assets/illustrations/manifest.json');
  const hashes = new Map(manifest.pictures.map((picture) => [picture.file, picture.sha256]));
  const sha = (path) => createHash('sha256').update(readFileSync(join(site, path))).digest('hex');
  for (const [file, hash] of hashes) {
    if (!existsSync(join(site, 'assets/illustrations', file))) fail('pictures', `assets/illustrations/${file}`, 'listed in the manifest, missing');
    else if (sha(`assets/illustrations/${file}`) !== hash) fail('pictures', `assets/illustrations/${file}`, 'differs from the D22 file the manifest names');
  }
  for (const path of walk('examples').filter((one) => /\.(svg|png|jpe?g|webp|gif|avif)$/iu.test(one))) {
    const name = path.split('/').pop();
    if (!/\/assets\/[^/]+$/u.test(path) || !hashes.has(name)) fail('pictures', path, 'a picture not from the D22 set');
    else if (sha(path) !== hashes.get(name)) fail('pictures', path, 'not a byte-same copy of the D22 file');
  }
  for (const path of [...contentFiles, ...walk('examples').filter((one) => /\.(html|js|css)$/u.test(one))]) {
    const text = read(path);
    for (const match of text.matchAll(/!\[[^\]]*\]\(([^)\s]+)|<img\b[^>]*\bsrc="([^"]+)"|url\((['"]?)([^)'"]+\.(?:svg|png|jpe?g|webp|gif|avif))\3\)/gu)) {
      const source = match[1] ?? match[2] ?? match[4];
      if (/^data:/u.test(source)) continue;
      const name = source.split('/').pop();
      if (/^https?:/u.test(source) || !hashes.has(name)) fail('pictures', `${path}:${lineOf(text, match.index)}`, `picture «${source}» is not from the D22 set`);
    }
  }
}

// ---- colours ---------------------------------------------------------------
{
  const catalogue = read('scripts/property-catalogue.js');
  const swatches = new Set((catalogue.match(/const SWATCHES = \[([^\]]*)\]/u)?.[1] ?? '').match(/#[0-9a-f]{3,8}\b/giu) ?? []);
  const COLOUR = /#[0-9a-f]{3,8}\b(?![-\w])|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/giu;
  for (const path of walk('examples').filter((one) => /\.(html|js|css)$/u.test(one))) {
    const text = read(path);
    for (const match of text.matchAll(COLOUR)) {
      if (swatches.has(match[0].toLowerCase())) continue;
      // A selector or an anchor (querySelector('#feed'), href="#add") is not a colour.
      if (/(?:querySelector(?:All)?\(|closest\(|href=)['"]$/u.test(text.slice(Math.max(0, match.index - 20), match.index))) continue;
      fail('colours', `${path}:${lineOf(text, match.index)}`, `colour literal «${match[0]}»`);
    }
    // C192: a role container plate goes with its on-colour.
    for (const match of text.matchAll(/class="([^"]*)"/gu)) {
      for (const plate of match[1].matchAll(/\bbg-([a-z]+)-container\b/gu)) {
        if (!match[1].includes(`color-on-${plate[1]}-container`)) fail('colours', `${path}:${lineOf(text, match.index)}`, `bg-${plate[1]}-container without color-on-${plate[1]}-container (C192)`);
      }
    }
    if (path.endsWith('.css')) {
      for (const rule of text.matchAll(/([^{}]+)\{([^}]*)\}/gu)) {
        for (const plate of rule[2].matchAll(/background[\w-]*:\s*var\(--sf-([a-z]+)-container\)/gu)) {
          if (!rule[2].includes(`var(--sf-on-${plate[1]}-container)`)) fail('colours', `${path}:${lineOf(text, rule.index)}`, `--sf-${plate[1]}-container plate without --sf-on-${plate[1]}-container (C192)`);
        }
      }
    }
  }
}

// ---- concepts --------------------------------------------------------------
for (const name of ['data', 'intents', 'layouts', 'settings', 'preferences']) {
  const path = `content/ru/guide/concepts/${name}.md`;
  const text = read(path);
  if (!/^:{3,}diagram\b/mu.test(text) && !/!\[[^\]]+\]\(/u.test(text)) fail('concepts', path, 'no picture');
}

// ---- locales ---------------------------------------------------------------
{
  const docara = json('docara.json');
  const locales = docara.locales ?? {};
  for (const code of ['ru', 'en']) {
    if (!locales[code]) fail('locales', 'docara.json', `locale ${code} is not declared`);
    else if (locales[code].public_prefix !== code) fail('locales', 'docara.json', `locale ${code} is not under /${code}/`);
  }
  if (docara.locale_routing?.strategy !== 'prefixed') fail('locales', 'docara.json', 'URLs are not prefixed by language');
  for (const path of walk('content/en').filter((one) => one.endsWith('.md'))) {
    if (!/^---\n[\s\S]*?^draft: true$[\s\S]*?\n---\n/mu.test(read(path))) fail('locales', path, 'an English page is published before its text is accepted (draft: true until then)');
  }
  if (existsSync(join(site, 'build_production'))) {
    const pages = walk('build_production').filter((one) => one.endsWith('.html') && !one.includes('/_docara/'));
    for (const path of pages) {
      const head = read(path).slice(0, 2000);
      if (/http-equiv="refresh"/iu.test(head)) continue;
      if (!/<html\b[^>]*\blang="[a-z]{2}(?:-[A-Za-z]+)?"/u.test(head)) fail('locales', path, 'the page does not declare its language');
    }
    if (pages.some((one) => one.startsWith('build_production/en/'))) fail('locales', 'build_production/en/', 'English pages are published');
  } else {
    notes.push('locales: build_production/ is not built; the pages\' lang was not read');
  }
}

// ---- docara ----------------------------------------------------------------
{
  const lock = json('composer.lock');
  const docara = [...lock.packages, ...(lock['packages-dev'] ?? [])].find((one) => one.name === 'simai/docara');
  const composer = json('composer.json');
  const wanted = composer.require?.['simai/docara'] ?? composer['require-dev']?.['simai/docara'] ?? '';
  if (!docara) fail('docara', 'composer.lock', 'simai/docara is not locked');
  else if (!/^v?\d+\.\d+\.\d+$/u.test(wanted)) fail('docara', 'composer.json', `simai/docara is «${wanted}», not one exact release`);
  const other = process.env.UI_DOC_COMPOSER_LOCK;
  if (docara && other && existsSync(other)) {
    const theirs = JSON.parse(readFileSync(other, 'utf8')).packages.find((one) => one.name === 'simai/docara');
    const parts = (version) => version.replace(/^v/u, '').split('.').map(Number);
    const [ours, docs] = [parts(docara.version), parts(theirs?.version ?? '0.0.0')];
    const behind = ours[0] < docs[0] || (ours[0] === docs[0] && docs[1] - ours[1] > 1);
    if (behind) fail('docara', 'composer.lock', `Docara ${docara.version} is more than one release behind ui-doc's ${theirs.version}`);
  } else {
    notes.push('docara: UI_DOC_COMPOSER_LOCK not given; the pin was not compared with ui-doc');
  }
}

for (const note of notes) console.log(`note ${note}`);
if (failures.length) {
  for (const failure of failures) console.error(failure);
  console.error(`site lint: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log('site lint: clean');
