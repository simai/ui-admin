#!/usr/bin/env node
// Usage: node scripts/build-polygon-data.mjs [--check]
//
// The polygon's data: one structure that uses every property type the Framework
// renders, and enough records to work in.
//
// The reference used to carry five records over six of the fifteen types, which
// is enough to see that a panel draws and not enough to try anything: no second
// page, no sort that changes the order, no filter that removes a row, no empty
// value beside a filled one, no type whose renderer nobody had looked at
// (owner, 2026-10-10: «важно чтобы они были совершенно разных типов (всех
// доступных видов) а также достаточное количество чтобы можно было разные
// сценарии проработать»).
//
// Written out rather than made up at page load, for two reasons. Larena is
// meant to be able to serve this from its own backend, and a dataset in a file
// is a contract it can read; and a polygon whose data changes every reload
// cannot be measured twice. The generator is seeded, and --check proves the
// committed file is the one it produces.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectRoot } from './runtime-base.mjs';

const target = resolve(projectRoot, 'data/polygon.json');
const check = process.argv.includes('--check');
const RECORD_COUNT = 120;

// Seeded so the same dataset comes out every time; a polygon that reshuffles
// itself cannot be measured twice.
const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
let seedState = 20261010;
const random = () => {
  seedState = (seedState * 1103515245 + 12345) & 0x7fffffff;
  return mulberry32(seedState)();
};
const pick = (list) => list[Math.floor(random() * list.length)];
const pickSome = (list, max) => {
  const count = Math.floor(random() * (max + 1));
  const pool = [...list];
  const out = [];
  for (let i = 0; i < count && pool.length; i += 1) {
    out.push(...pool.splice(Math.floor(random() * pool.length), 1));
  }
  return out;
};
const chance = (probability) => random() < probability;

const STATUSES = [
  { value: 'active', label: 'В работе', scheme: 'primary' },
  { value: 'review', label: 'На проверке', scheme: 'warning' },
  { value: 'done', label: 'Готово', scheme: 'success' },
  { value: 'frozen', label: 'Заморожено', scheme: 'neutral' },
  { value: 'failed', label: 'Остановлено', scheme: 'danger' },
];

const TAGS = [
  { value: 'billing', label: 'Биллинг' },
  { value: 'crm', label: 'CRM' },
  { value: 'files', label: 'Файлы' },
  { value: 'infra', label: 'Инфраструктура' },
  { value: 'notify', label: 'Уведомления' },
  { value: 'portal', label: 'Портал' },
  { value: 'search', label: 'Поиск' },
  { value: 'shop', label: 'Магазин' },
];

const SECTIONS = [
  { value: 'sec-billing', label: 'Платежи и биллинг' },
  { value: 'sec-comms', label: 'Коммуникации' },
  { value: 'sec-infra', label: 'Инфраструктура' },
  { value: 'sec-shop', label: 'Магазин' },
  { value: 'sec-content', label: 'Контент' },
  { value: 'sec-admin', label: 'Администрирование' },
];

const USERS = [
  { value: 'u-igor', label: 'Игорь Смирнов', avatarText: 'ИС' },
  { value: 'u-anna', label: 'Анна Петрова', avatarText: 'АП' },
  { value: 'u-dmitry', label: 'Дмитрий Орлов', avatarText: 'ДО' },
  { value: 'u-elena', label: 'Елена Кузнецова', avatarText: 'ЕК' },
  { value: 'u-sergey', label: 'Сергей Ильин', avatarText: 'СИ' },
  { value: 'u-maria', label: 'Мария Волкова', avatarText: 'МВ' },
];

const RELATIONS = [
  { value: 'rel-core', label: 'Ядро платформы' },
  { value: 'rel-auth', label: 'Авторизация' },
  { value: 'rel-storage', label: 'Хранилище' },
  { value: 'rel-queue', label: 'Очереди' },
  { value: 'rel-report', label: 'Отчётность' },
];

const SUBJECTS = [
  ['Платежи', 'payments', 'Приём платежей, возвраты и сверка с банком.'],
  ['Уведомления', 'notify', 'Письма, SMS и push по событиям системы.'],
  ['Биллинг', 'billing', 'Тарифы, подписки и выставление счетов.'],
  ['Резервные копии', 'filebackup', 'Снимки файлов и базы по расписанию.'],
  ['Корзина', 'cart', 'Корзина покупателя и оформление заказа.'],
  ['Каталог', 'catalog', 'Товары, разделы и свойства каталога.'],
  ['Поиск', 'search', 'Индексация и выдача по сайту.'],
  ['Формы', 'forms', 'Конструктор форм и обработка заявок.'],
  ['Склад', 'stock', 'Остатки, резервы и движения по складам.'],
  ['Доставка', 'delivery', 'Службы доставки, зоны и расчёт стоимости.'],
  ['Отчёты', 'reports', 'Сводки по продажам и обращениям.'],
  ['Права', 'acl', 'Роли, доступы и журнал действий.'],
  ['Импорт', 'import', 'Загрузка данных из внешних систем.'],
  ['Интеграции', 'integrations', 'Обмен с 1С, CRM и платёжными шлюзами.'],
  ['Медиа', 'media', 'Изображения, видео и их варианты.'],
];

const LONG_SUMMARY = 'Модуль закрывает весь путь обращения: приём, разбор, маршрутизацию '
  + 'ответственному, напоминания по срокам, закрытие с обязательным комментарием и выгрузку '
  + 'в отчётность. Настройки хранятся отдельно для каждой организации портала, а журнал '
  + 'действий пишется целиком и не чистится автоматически.';

const SCRIPT = `<script>
  window.addEventListener('DOMContentLoaded', () => {
    document.documentElement.dataset.ready = 'true';
  });
</script>`;

const STYLE = `.sf-admin-shell {
  --sf-admin-accent: var(--sf-primary);
}`;

const pad = (value) => String(value).padStart(2, '0');
const dateAt = (index, spread) => {
  const base = new Date(Date.UTC(2026, 0, 1));
  base.setUTCDate(base.getUTCDate() + ((index * 7 + Math.floor(random() * spread)) % 640));
  return `${base.getUTCFullYear()}-${pad(base.getUTCMonth() + 1)}-${pad(base.getUTCDate())}`;
};
const dateTimeAt = (index) => {
  const day = dateAt(index, 400);
  return `${day}T${pad(Math.floor(random() * 24))}:${pad(Math.floor(random() * 60))}:00+03:00`;
};

// Every property type the Framework renders, with the shape its renderer reads.
// A type that is in the set and not here is a type nobody can look at, which is
// what the coverage check refuses.
const FIELDS = [
  { key: 'code', label: 'Код решения', property_type: 'string', width: 'half', required: true },
  { key: 'title', label: 'Название', property_type: 'string', width: 'half', required: true },
  { key: 'section', label: 'Раздел', property_type: 'record', width: 'half' },
  { key: 'owner', label: 'Ответственный', property_type: 'user', width: 'half' },
  { key: 'status', label: 'Статус', property_type: 'choice', width: 'half', options: STATUSES },
  { key: 'licence', label: 'Лицензия', property_type: 'lookup', source: 'licences', width: 'half' },
  { key: 'tags', label: 'Метки', property_type: 'choices', width: 'half', options: TAGS },
  { key: 'summary', label: 'Описание', property_type: 'text', width: 'full' },

  { key: 'version', label: 'Версия', property_type: 'string', width: 'half' },
  { key: 'priority', label: 'Приоритет', property_type: 'integer', width: 'half' },
  { key: 'budget', label: 'Бюджет, ₽', property_type: 'number', width: 'half' },
  { key: 'released', label: 'Выпущено', property_type: 'date', width: 'half' },
  { key: 'checked_at', label: 'Проверено', property_type: 'datetime', width: 'half' },
  { key: 'public', label: 'Доступно всем', property_type: 'boolean', width: 'half' },
  { key: 'deprecated', label: 'Снято с поддержки', property_type: 'boolean', width: 'half' },

  { key: 'accent', label: 'Акцентный цвет', property_type: 'color', width: 'half', inheritedValue: '#2f6feb' },
  { key: 'cover', label: 'Обложка', property_type: 'file', width: 'half', variant: 'image-card' },
  { key: 'attachments', label: 'Вложения', property_type: 'file', width: 'full', multiple: true },

  { key: 'parent', label: 'Родительское решение', property_type: 'record', width: 'half' },
  { key: 'depends_on', label: 'Зависит от', property_type: 'relation', width: 'half' },
  { key: 'reviewer', label: 'Проверяющий', property_type: 'user', width: 'half' },

  { key: 'head_script', label: 'Скрипт в head', property_type: 'include', width: 'full', language: 'html' },
  { key: 'theme_css', label: 'Правила темы', property_type: 'include', width: 'full', language: 'css' },
  { key: 'notes', label: 'Заметки', property_type: 'text', width: 'full' },
];

const SECTIONS_LAYOUT = [
  {
    key: 'main', label: 'Общее',
    groups: [
      { key: 'main', label: 'Основное', columns: 2, fields: ['code', 'title', 'section', 'owner', 'status', 'licence', 'tags', 'summary'] },
      { key: 'numbers', label: 'Числа и сроки', columns: 2, fields: ['version', 'priority', 'budget', 'released', 'checked_at', 'public', 'deprecated'] },
    ],
  },
  {
    key: 'look', label: 'Оформление',
    groups: [
      { key: 'visual', label: 'Вид', columns: 2, fields: ['accent', 'cover', 'attachments'] },
    ],
  },
  {
    key: 'links', label: 'Связи',
    groups: [
      { key: 'links', label: 'Связи', columns: 2, fields: ['parent', 'depends_on', 'reviewer'] },
    ],
  },
  {
    key: 'code', label: 'Интеграция',
    groups: [
      { key: 'code', label: 'Код', columns: 1, fields: ['head_script', 'theme_css', 'notes'] },
    ],
  },
];

// The list's own columns, chosen so every cell renderer in the set is on screen
// at once rather than described in a document.
const LIST_COLUMNS = [
  { key: 'title', width: '18rem', sortable: true, pinned: true },
  { key: 'code', width: '12rem', sortable: true },
  { key: 'section', sortable: true },
  { key: 'status', sortable: true },
  { key: 'licence', sortable: true },
  { key: 'tags' },
  { key: 'owner', sortable: true },
  { key: 'priority', sortable: true, align: 'end' },
  { key: 'budget', sortable: true, align: 'end' },
  { key: 'released', sortable: true },
  { key: 'checked_at', sortable: true },
  { key: 'public' },
  { key: 'accent' },
  { key: 'cover' },
  { key: 'depends_on' },
  { key: 'head_script' },
  { key: 'summary', width: '20rem' },
];

const COVERS = [
  { value: 'f-cover-1', label: 'cover-billing.png', mime: 'image/png', size: 184320, href: '/logo.svg' },
  { value: 'f-cover-2', label: 'cover-infra.png', mime: 'image/png', size: 220160, href: '/logo.svg' },
  { value: 'f-cover-3', label: 'cover-shop.png', mime: 'image/png', size: 151552, href: '/logo.svg' },
];

const DOCUMENTS = [
  { value: 'f-spec', label: 'Техническое задание.pdf', mime: 'application/pdf', size: 482304 },
  { value: 'f-acts', label: 'Акт приёмки.pdf', mime: 'application/pdf', size: 128512 },
  { value: 'f-sheet', label: 'Расчёт тарифов.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 64512 },
  { value: 'f-notes', label: 'Протокол встречи.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 38912 },
  { value: 'f-arch', label: 'Схема обмена.svg', mime: 'image/svg+xml', size: 12288, href: '/icons.svg' },
];

// A reference list the host pages from (property-view-port 1.14.0, `lookup`
// with `source`). Assigned by index, not drawn from the generator's random
// sequence, so adding it moved no other value of the polygon.
const LICENCES = [
  { value: 'lic-apache', label: 'Apache-2.0' },
  { value: 'lic-polyform-sb', label: 'PolyForm Small Business' },
  { value: 'lic-polyform-nc', label: 'PolyForm Noncommercial' },
  { value: 'lic-commercial', label: 'SIMAI Commercial License' },
  { value: 'lic-larena', label: 'В составе Larena' },
  { value: 'lic-trial', label: 'Пробная, 30 дней' },
  { value: 'lic-internal', label: 'Внутренняя' },
  { value: 'lic-none', label: 'Без лицензии' },
];

const ACCENTS = ['#2f6feb', '#1f9d55', '#c2410c', '#7c3aed', '#be123c', '#0f766e'];

const buildRecord = (index) => {
  const [subject, slug, summary] = SUBJECTS[index % SUBJECTS.length];
  const number = 100 + index * 7;
  const status = pick(STATUSES);
  // A record whose optional values are empty is the one case a reference almost
  // never has and every real list is full of: an empty cell has to read as
  // empty rather than as broken.
  // The offsets are deliberately not zero. With `index % n === 0` every special
  // case landed on the first record at once -- empty values, the longest title,
  // a zero priority -- so the first row of the polygon read as broken rather
  // than as one case among many.
  const sparse = index % 11 === 5;
  const longTitle = index % 17 === 9;
  // Four records refuse every write on purpose: «нет доступа» is a state a
  // consumer has to show. Their title says so, so a visitor who meets the
  // refusal reads it as the demonstration it is rather than as a defect
  // (owner, 2026-10-19).
  const locked = index % 29 === 17;

  const values = {
    code: `simai.${slug}${index % 5 === 2 ? '' : `.v${(index % 4) + 1}`}`,
    title: longTitle
      ? `SIMAI: ${subject} №${number} — расширенная сборка для портала организаций с длинным названием`
      : `SIMAI: ${subject} №${number}`,
    section: pick(SECTIONS),
    owner: pick(USERS),
    status: status.value,
    licence: { ...LICENCES[index % LICENCES.length] },
    tags: pickSome(TAGS, 4).map((tag) => tag.value),
    summary: index % 13 === 6 ? LONG_SUMMARY : summary,

    version: `${(index % 6) + 1}.${index % 10}.${index % 4}`,
    // Zero and a negative are in here on purpose: a formatter that drops a zero
    // or loses a minus sign is a defect nobody sees in data that avoids both.
    priority: index % 19 === 7 ? 0 : (index % 23 === 13 ? -2 : (index % 9) + 1),
    budget: index % 7 === 3 ? 0 : Math.round((random() * 4_800_000 + 12_000) / 100) * 100,
    released: dateAt(index, 120),
    checked_at: dateTimeAt(index),
    public: index % 3 !== 2,
    deprecated: index % 10 === 4,

    accent: ACCENTS[index % ACCENTS.length],
    cover: index % 4 === 2 ? null : COVERS[index % COVERS.length],
    attachments: pickSome(DOCUMENTS, index % 31 === 16 ? 5 : 2),

    parent: index % 5 === 3 ? null : pick(SECTIONS),
    depends_on: pick(RELATIONS),
    reviewer: index % 6 === 4 ? null : pick(USERS),

    head_script: index % 8 === 1 ? SCRIPT : '',
    theme_css: index % 12 === 7 ? STYLE : '',
    notes: index % 9 === 5 ? 'Перенесено из SF4, сверить права перед включением.' : '',
  };

  if (sparse) {
    for (const key of ['owner', 'tags', 'summary', 'budget', 'checked_at', 'accent', 'cover', 'attachments', 'depends_on', 'reviewer', 'notes']) {
      values[key] = Array.isArray(values[key]) ? [] : null;
    }
  }

  // After the sparse case, which would otherwise empty the note.
  if (locked) {
    values.title = `${values.title} · Нет прав`;
    values.notes = 'Демо: у вас нет прав на эту запись — правка и удаление запрещены намеренно.';
  }

  return {
    record_id: `r-${String(index + 1).padStart(3, '0')}`,
    revision: (index % 9) + 1,
    label: values.title,
    editable: !locked,
    actions: index % 4 === 1 ? ['view'] : ['view', 'edit', 'delete'],
    values,
  };
};

const dataset = {
  schema: 'simai.admin.polygon.dataset.v1',
  generated_by: 'scripts/build-polygon-data.mjs',
  note: 'Seeded fixture data. Regenerate with `npm run data`; `npm run data:check` proves the committed file is the generator\'s own output.',
  structure: {
    structure_id: 'workbench.solutions',
    label: 'Решения',
    fields: FIELDS,
    sections: SECTIONS_LAYOUT,
    list: {
      columns: LIST_COLUMNS,
      per_page: 20,
      filter_fields: ['title', 'code', 'section', 'status', 'tags', 'owner', 'priority', 'budget', 'released', 'checked_at', 'public', 'deprecated'],
      sort_fields: LIST_COLUMNS.filter((column) => column.sortable).map((column) => column.key),
      default_sort: { field: 'released', direction: 'desc' },
    },
    interaction: { create: true, update: true, delete: true, restore: true },
  },
  references: { sections: SECTIONS, users: USERS, relations: RELATIONS, statuses: STATUSES, licences: LICENCES, tags: TAGS, files: [...COVERS, ...DOCUMENTS] },
  records: Array.from({ length: RECORD_COUNT }, (_, index) => buildRecord(index)),
};

const serialized = `${JSON.stringify(dataset, null, 2)}\n`;

if (check) {
  let current = '';
  try {
    current = readFileSync(target, 'utf8');
  } catch {
    process.stderr.write('data/polygon.json is missing — run `npm run data`\n');
    process.exit(1);
  }
  if (current !== serialized) {
    process.stderr.write('POLYGON_DATA_STALE — data/polygon.json is not what the generator produces; run `npm run data`\n');
    process.exit(1);
  }
  process.stdout.write(`the committed dataset is current: ${dataset.records.length} records, ${FIELDS.length} fields\n`);
  process.exit(0);
}

writeFileSync(target, serialized);
process.stdout.write(`wrote ${dataset.records.length} records over ${FIELDS.length} fields to data/polygon.json\n`);
