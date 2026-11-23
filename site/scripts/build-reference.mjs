#!/usr/bin/env node
// Writes the reference part of every component page (attributes, events,
// methods, CSS variables, accessibility, source) from the set's own
// manifests, so the pages never drift from what the release ships.
//
// Sources: package/src/smart/<folder>/smart.manifest.json (inputs, methods,
// events, accessibility) and component.json (public CSS variables) at the
// commit the released receipt names (package/dist/package-receipt.json
// package_source.revision), read from git objects, not the working tree.
//
// Manifest text is English and the site is Russian: every manifest string a
// page shows is looked up in config/reference.ru.json. --check fails when a
// page differs from what it would write or a string has no translation;
// --missing prints the strings to translate.
//
// A page holds the generated part between its "## Параметры" heading and its
// "## См. также" heading; everything above is written by hand.
//
// --receipt FILE reads another build's receipt instead: a candidate build's
// (package/scripts/gates.sh writes <workspace>/build/package-receipt.json), so
// a site built over the candidate shows the candidate's reference and names
// it as one.
//
// Usage: node site/scripts/build-reference.mjs [--check | --missing] [--receipt FILE]

import {execFileSync} from 'node:child_process';
import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repository = resolve(site, '..');
const argv = process.argv.slice(2);
const args = new Set(argv);
const receiptAt = argv.includes('--receipt') ? resolve(argv[argv.indexOf('--receipt') + 1] ?? '') : null;
const checkOnly = args.has('--check');
const listMissing = args.has('--missing');

const PAGES = {
  'admin-shell': 'content/ru/components/admin-shell.md',
  'admin-menu': 'content/ru/components/admin-menu.md',
  'admin-notifications': 'content/ru/components/admin-notifications.md',
  'admin-activity': 'content/ru/components/admin-activity.md',
};
const START = '## Параметры';
const END = '## См. также';

const receipt = JSON.parse(readFileSync(receiptAt ?? join(repository, 'package/dist/package-receipt.json'), 'utf8'));
const revision = receipt.package_source.revision;
// The release whose source is this receipt's (contracts/releases/admin-*.lock.json):
// a receipt passed with --receipt may be a release's too, and is named as one.
const releasesAt = join(repository, 'contracts/releases');
const release = readdirSync(releasesAt).filter((name) => /^admin-[0-9a-f]{12}\.lock\.json$/u.test(name))
  .map((name) => JSON.parse(readFileSync(join(releasesAt, name), 'utf8')))
  .find((lock) => lock.source?.revision === revision && lock.source?.tree === receipt.package_source.tree) ?? null;
const from = release
  ? `в выпуске набора \`${release.id}\` (версия ${release.version}) и обновляется вместе с выпуском`
  : `в сборке-кандидате набора (\`simai/ui-admin@${revision.slice(0, 12)}\`) и обновляется вместе с ней`;
const show = (path) => execFileSync('git', ['-C', repository, 'show', `${revision}:${path}`], {encoding: 'utf8', maxBuffer: 64 << 20});
const dictionary = JSON.parse(readFileSync(join(site, 'config/reference.ru.json'), 'utf8')).strings;

const missing = new Set();
const ru = (text) => {
  if (!text) return '';
  if (dictionary[text] === undefined) {
    missing.add(text);
    return text;
  }
  return dictionary[text];
};
const code = (text) => `\`${String(text).replace(/\|/gu, '\\|')}\``;
const cell = (text) => String(text).replace(/\|/gu, '\\|').replace(/\s*\n\s*/gu, ' ');
const line = (text) => String(text).replace(/\\\|/gu, '|').replace(/\s*\n\s*/gu, ' ');
const literal = (value) => (value === '' ? 'пусто' : typeof value === 'string' ? code(value) : code(JSON.stringify(value)));
// Text the manifest generator writes when a source says nothing tells a reader
// no more than the name does.
const generic = (text) => !text || /^Public runtime method [\w$]+\.$/u.test(text) || /^Runtime event [\w:-]+\.$/u.test(text)
  || /^The action [\w-]+\.$/u.test(text);
const typeName = (schema) => {
  const types = [schema?.type].flat().filter(Boolean);
  return types.length ? types.map(code).join(' \\| ') : '—';
};
const resolveRef = (manifest, schema) => (schema?.$ref?.startsWith('#/')
  ? schema.$ref.slice(2).split('/').reduce((node, key) => node?.[key], manifest) ?? schema
  : schema);
const shape = (manifest, payload) => {
  const schema = resolveRef(manifest, payload);
  if (!schema?.properties || Object.keys(schema.properties).length === 0) return null;
  const required = new Set(schema.required ?? []);
  const keys = Object.entries(schema.properties).map(([key, value]) => {
    const inner = resolveRef(manifest, value);
    const type = [inner?.type].flat().filter(Boolean).join('|');
    return `${key}${required.has(key) ? '' : '?'}${type ? `: ${type}` : ''}`;
  });
  return code(`{ ${keys.join(', ')} }`);
};
const LIFECYCLE = {experimental: 'экспериментальный: API может меняться между выпусками', stable: 'стабильный'};
const NAME_RULE = {required: 'обязательно', optional: 'необязательно', internal: 'даёт сам компонент'};

// The host port and the versions the manifest declares it accepts: the range a
// page states is this row, never a number written by hand (VS-SITE-10).
const portRow = (manifest) => {
  const port = manifest.composition?.declarative?.host_port;
  const versions = Array.isArray(port?.supported_versions) ? port.supported_versions : [];
  if (!port?.port || versions.length < 2) return port?.port ? [`| Порт | ${code(port.port)}, версия ${code(port.version)} |`] : [];
  return [`| Порт | ${code(port.port)}, версии с ${code(versions[0])} по ${code(versions.at(-1))} |`];
};
const render = (folder) => {
  const manifest = JSON.parse(show(`package/src/smart/${folder}/smart.manifest.json`));
  const component = JSON.parse(show(`package/src/smart/${folder}/component.json`));
  const tag = manifest.custom_element;
  const lines = [START, ''];
  lines.push(
    `Справочник собран из манифеста компонента ${from}. Каждому атрибуту соответствует свойство элемента с тем же именем в camelCase: \`history-href\` — \`historyHref\`.`,
    '',
    '| | |',
    '|:---|:---|',
    `| Тег | ${code(`<${tag}>`)} |`,
    `| Назначение | ${cell(ru(manifest.summary))} |`,
    `| Контракт | ${code(manifest.id)}, версия ${code(manifest.version)} |`,
    `| Жизненный цикл | ${LIFECYCLE[manifest.lifecycle] ?? code(manifest.lifecycle)} |`,
    ...portRow(manifest),
    '',
    '### Атрибуты',
    '',
  );
  for (const [name, schema] of Object.entries(manifest.inputs?.properties ?? {})) {
    const facts = [typeName(schema)];
    if (schema.default !== undefined && schema.default !== null) facts.push(`по умолчанию ${literal(schema.default)}`);
    if (schema.enum) facts.push(`значения: ${schema.enum.map(literal).join(', ')}`);
    const purpose = ru(schema.description);
    lines.push(line(`- ${code(name)} — ${facts.join(', ')}.${purpose ? ` ${purpose}` : ''}`));
  }
  lines.push('');

  const events = Object.entries(manifest.events ?? {});
  const current = events.filter(([, event]) => !event.alias_of);
  const former = events.filter(([, event]) => event.alias_of);
  lines.push('## События', '', 'События приходят на сам элемент и всплывают.', '');
  for (const [name, event] of current) {
    const detail = shape(manifest, event.payload)
      ?? former.map(([, alias]) => (alias.alias_of === name ? shape(manifest, alias.payload) : null)).find(Boolean);
    const parts = [detail ? `\`detail\`: ${detail}.` : '`detail` не описан.'];
    if (!generic(event.summary)) parts.push(ru(event.summary));
    lines.push(line(`- ${code(name)} — ${parts.join(' ')}`));
  }
  lines.push('');
  if (former.length) {
    lines.push('Прежние имена событий приходят следом с тем же `detail` и отмечаются в `SF.deprecations`:', '');
    lines.push(line(former.map(([name, event]) => `${code(name)} → ${code(event.alias_of)}`).join(', ') + '.'), '');
  }

  lines.push('## Методы', '');
  for (const [name, method] of Object.entries(manifest.methods ?? {})) {
    const argumentList = (method.arguments ?? []).map((argument) => (typeof argument === 'string' ? argument
      : `${argument.name}${argument.required === false ? '?' : ''}: ${[argument.type ?? argument.schema?.type].flat().filter(Boolean).join('|') || 'any'}`));
    const unknown = JSON.stringify(method.returns?.type) === '["object","boolean","null"]';
    const parts = [];
    if (method.returns && !unknown) parts.push(`возвращает ${typeName(method.returns)}.`);
    if (!generic(method.summary)) parts.push(ru(method.summary));
    lines.push(line(`- ${code(`${name}(${argumentList.join(', ')})`)}${parts.length ? ` — ${parts.join(' ')}` : ''}`));
  }
  lines.push('');

  const variables = Object.entries(component['css-variables'] ?? {});
  lines.push('## CSS-переменные', '');
  if (variables.length === 0) {
    lines.push('Публичных CSS-переменных нет.', '');
  } else {
    lines.push('Задаются на элементе или на любом предке.', '', '| Переменная | Тип | Что задаёт |', '|:---|:---|:---|');
    for (const [name, variable] of variables) {
      lines.push(`| ${code(name)} | ${code(variable.type)} | ${cell(ru(`css:${name}`))} |`);
    }
    lines.push('');
  }

  const access = manifest.accessibility ?? {};
  lines.push('## Доступность', '');
  if (access.role) lines.push(`- Роль: ${code(access.role)}.`);
  if (access.accessible_name) lines.push(`- Доступное имя: ${NAME_RULE[access.accessible_name] ?? ru(access.accessible_name)}.`);
  if (Array.isArray(access.keyboard) && access.keyboard.length) {
    const key = (entry) => (/^[A-Z][A-Za-z]*(\+[A-Za-z]+)*$/u.test(entry) ? code(entry) : ru(entry));
    lines.push(`- Клавиши: ${access.keyboard.map(key).join(', ')}.`);
  }
  if (access.focus) lines.push(`- Фокус: ${ru(access.focus)}`);
  lines.push('', '## Источник', '', `- \`simai/ui-admin@${revision.slice(0, 12)}:package/src/smart/${folder}\``, '');
  return lines.join('\n');
};

let stale = 0;
// A component that has not been released yet has no manifest at the receipt's
// commit: its page keeps the hand-written part until the release that carries it.
const released = (folder) => {
  try {
    execFileSync('git', ['-C', repository, 'cat-file', '-e', `${revision}:package/src/smart/${folder}/smart.manifest.json`], {stdio: 'ignore'});
    return true;
  } catch {
    return false;
  }
};
const unreleased = Object.keys(PAGES).filter((folder) => !released(folder));

for (const [folder, page] of Object.entries(PAGES)) {
  if (unreleased.includes(folder)) continue;
  const path = join(site, page);
  const text = readFileSync(path, 'utf8');
  const start = text.indexOf(`\n${START}\n`);
  const end = text.indexOf(`\n${END}\n`);
  if (start < 0 || end < start) throw new Error(`${page}: needs "${START}" before "${END}"`);
  const next = `${text.slice(0, start + 1)}${render(folder)}\n${text.slice(end + 1)}`;
  if (next !== text) {
    stale += 1;
    if (!checkOnly && !listMissing) writeFileSync(path, next);
  }
}
if (listMissing) {
  console.log(JSON.stringify([...missing], null, 2));
} else {
  console.log(JSON.stringify({pages: Object.keys(PAGES).length - unreleased.length, unreleased, changed: stale, untranslated: missing.size}));
  if (checkOnly && (stale || missing.size)) process.exit(1);
}
