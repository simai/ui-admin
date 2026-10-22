#!/usr/bin/env node
// Usage: node scripts/build-navigation-data.mjs [--check]
//
// The menu's data: what a host would know about sites, rows, profiles, the
// person and their notifications, for the admin menu that replaces the top bar
// (larena-specs frontend-interface-program, sf-admin-menu assignment, v5).
//
// Kept apart from data/polygon.json, which Larena reads as the contract for one
// collection; this one is the contract for the navigation port, and the two
// change for different reasons.
//
// What it is built to exercise, each because the design depends on it:
// - three sites with different storages, so switching site visibly changes the
//   Data root -- and two hundred more, so the switcher is a search that pages,
//   not a list the component filters;
// - rows at the install level beside rows at the site level, so the two cannot
//   be mistaken for each other;
// - a Data root with more than six rows on one site and fewer on another, so
//   «Найти в разделе» appears where it should and nowhere else;
// - three profiles, two shared and one personal, with layouts that differ;
// - «требует внимания» marks and no totals anywhere;
// - a long list of languages, two of them right-to-left;
// - notifications, some unread.
//
// Deterministic and checked like the polygon's dataset: --check proves the
// committed file is this script's output.
//
// The file holds what a host stores, not what it answers: each site's storages
// and favourites, and the rows every site shares, once. The tree a site is
// drawn with is put together by the host (src/ports/navigation-host.mjs), as a
// real host would -- two hundred sites each carrying the whole tree would be a
// file of megabytes that says the same thing two hundred times.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectRoot } from './runtime-base.mjs';

const target = resolve(projectRoot, 'data/navigation.json');
const check = process.argv.includes('--check');

const page = (key, label, icon, href, extra = {}) => ({
  key, kind: 'page', label, icon, href, ...extra,
});
const heading = (key, label) => ({ key, kind: 'heading', label });
const divider = (key) => ({ key, kind: 'divider' });

// What every site has, in its own words. Storages differ per site; the rest of
// the Site and People roots does not.
const SITES = [
  {
    key: 'simai.ru', label: 'simai.ru', caption: 'Сайт компании', mark: 'S',
    storages: [
      heading('data.h.catalog', 'Каталог'),
      page('data.catalog', 'Каталог решений', 'inventory_2', '/admin/data/catalog'),
      page('data.catalog-sections', 'Разделы каталога', 'account_tree', '/admin/data/catalog-sections'),
      heading('data.h.site', 'Сайт'),
      page('data.news', 'Новости', 'newspaper', '/admin/data/news'),
      page('data.faq', 'Вопросы и ответы', 'quiz', '/admin/data/faq'),
      page('data.cases', 'Кейсы клиентов', 'work', '/admin/data/cases'),
      page('data.vacancies', 'Вакансии', 'badge', '/admin/data/vacancies'),
      heading('data.h.requests', 'Заявки'),
      page('data.requests', 'Заявки с сайта', 'inbox', '/admin/data/requests',
        { attention: { tone: 'warning', label: '4 новых' } }),
      page('data.callbacks', 'Обратные звонки', 'call', '/admin/data/callbacks'),
    ],
    favourites: ['data.catalog', 'data.requests'],
  },
  {
    key: 'shop.simai.ru', label: 'shop.simai.ru', caption: 'Интернет-магазин', mark: 'M',
    storages: [
      heading('data.h.shop', 'Магазин'),
      page('data.products', 'Товары', 'shopping_bag', '/admin/data/products'),
      page('data.orders', 'Заказы', 'receipt_long', '/admin/data/orders',
        { attention: { tone: 'info', label: '12 новых' } }),
      page('data.customers', 'Покупатели', 'groups', '/admin/data/customers'),
    ],
    favourites: ['data.orders'],
  },
  {
    key: 'docs.simai.ru', label: 'docs.simai.ru', caption: 'Документация', mark: 'D',
    storages: [
      page('data.articles', 'Статьи', 'article', '/admin/data/articles'),
      page('data.versions', 'Версии', 'history', '/admin/data/versions'),
    ],
    favourites: [],
  },
];

// An agency's clients: enough that a switcher holding them all would be wrong.
const CLIENT_COUNT = 237;
const CLIENTS = Array.from({ length: CLIENT_COUNT }, (_, index) => {
  const number = String(index + 1).padStart(3, '0');
  return {
    key: `client-${number}.ru`,
    label: `client-${number}.ru`,
    caption: index % 7 === 3 ? 'Лендинг' : index % 5 === 1 ? 'Магазин клиента' : 'Сайт клиента',
    mark: 'C',
    storages: [
      page('data.pages-content', 'Материалы', 'article', '/admin/data/content'),
      page('data.leads', 'Заявки', 'inbox', '/admin/data/leads',
        index % 9 === 4 ? { attention: { tone: 'warning', label: '1 новая' } } : {}),
    ],
    favourites: [],
  };
});

// The rows around a site's own storages, the same on every site.
const DATA_TAIL = [
  divider('data.d.files'),
  page('data.files', 'Файлы', 'folder', '/admin/files'),
  page('data.storages', 'Все хранилища', 'list', '/admin/storages'),
];
const DATA_ACTION = { key: 'storage.create', label: 'Создать хранилище', icon: 'add', href: '/admin/storages/new' };

const SITE_ROWS = [
  page('site.settings', 'Настройки сайта', 'tune', '/admin/site/settings'),
  page('site.pages', 'Страницы', 'web', '/admin/site/pages'),
  page('site.menus', 'Меню сайта', 'menu', '/admin/site/menus'),
  page('site.seo', 'SEO', 'travel_explore', '/admin/site/seo'),
  divider('site.d.open'),
  // The address is the site's own; the host fills it in.
  { key: 'site.open', kind: 'link', label: 'Открыть сайт', icon: 'open_in_new', href: null },
];

const PEOPLE_ROWS = [
  page('people.users', 'Пользователи', 'person', '/admin/people/users'),
  page('people.groups', 'Группы', 'account_tree', '/admin/people/groups'),
  page('people.roles', 'Роли', 'shield', '/admin/people/roles'),
];

// The install: the same on every site, and drawn apart from them.
const INSTALL_ROWS = [
  page('install.updates', 'Обновления', 'system_update', '/admin/install/updates',
    { attention: { tone: 'info', label: 'доступно 1.4' } }),
  page('install.backups', 'Резервные копии', 'backup', '/admin/install/backups'),
  page('install.journal', 'Журнал', 'receipt', '/admin/install/journal'),
  page('install.packages', 'Пакеты', 'deployed_code', '/admin/install/packages'),
  page('install.sites', 'Сайты', 'public', '/admin/install/sites'),
  heading('install.h.dev', 'Разработка'),
  // Every universal property in its three modes, the Framework's workbench
  // (owner, 2026-10-15): shown to everyone who opens the polygon.
  page('install.properties', 'Свойства', 'category', '/properties.html'),
  page('install.queues', 'Очереди', 'pending_actions', '/admin/install/queues'),
  page('install.cache', 'Кеш', 'cached', '/admin/install/cache'),
];

const ROOTS = [
  { key: 'home', kind: 'page', level: 'site', label: 'Главная', icon: 'home', href: '/admin' },
  { key: 'data', kind: 'root', level: 'site', label: 'Данные', icon: 'database', rows: 'storages+data_tail', action: DATA_ACTION },
  { key: 'site', kind: 'root', level: 'site', label: 'Сайт', icon: 'language', rows: 'site_rows' },
  { key: 'people', kind: 'root', level: 'site', label: 'Люди', icon: 'group', rows: 'people_rows' },
  { key: 'install', kind: 'root', level: 'install', label: 'Установка', icon: 'dns', rows: 'install_rows' },
];

// Two shared profiles an administrator keeps, and the person's own. The layouts
// differ, so choosing one visibly changes the menu.
const PROFILES = [
  { key: 'regular', label: 'Обычный', kind: 'shared' },
  { key: 'expert', label: 'Экспертный', kind: 'shared' },
  { key: 'personal', label: 'Персональный', kind: 'personal' },
];

const LAYOUTS = {
  // The everyday menu hides what only an expert reaches for.
  regular: {
    schema_version: 1,
    items: {
      'data.catalog-sections': { parent: 'data', order: 2, hidden: true, label: null, icon: null },
      'install.h.dev': { parent: 'install', order: 5, hidden: true, label: null, icon: null },
      'install.queues': { parent: 'install', order: 6, hidden: true, label: null, icon: null },
      'install.cache': { parent: 'install', order: 7, hidden: true, label: null, icon: null },
    },
    own: [],
  },
  expert: { schema_version: 1, items: {}, own: [] },
  // A person who works the requests first, and has a link of their own.
  personal: {
    schema_version: 1,
    items: {
      'data.h.requests': { parent: 'data', order: 0, hidden: false, label: null, icon: null },
      'data.requests': { parent: 'data', order: 1, hidden: false, label: 'Мои заявки', icon: null },
    },
    own: [
      { key: 'own.crm', kind: 'link', parent: 'data', order: 99, label: 'CRM отдела продаж', icon: 'open_in_new', href: 'https://crm.example.com/' },
    ],
  },
};

const LANGUAGES = [
  ['ru', 'Русский', 'Russian'], ['en', 'English', 'English'], ['de', 'Deutsch', 'German'],
  ['fr', 'Français', 'French'], ['es', 'Español', 'Spanish'], ['it', 'Italiano', 'Italian'],
  ['pt', 'Português', 'Portuguese'], ['pl', 'Polski', 'Polish'], ['uk', 'Українська', 'Ukrainian'],
  ['be', 'Беларуская', 'Belarusian'], ['kk', 'Қазақ тілі', 'Kazakh'], ['uz', 'Oʻzbekcha', 'Uzbek'],
  ['az', 'Azərbaycan dili', 'Azerbaijani'], ['hy', 'Հայերեն', 'Armenian'], ['ka', 'ქართული', 'Georgian'],
  ['tr', 'Türkçe', 'Turkish'], ['nl', 'Nederlands', 'Dutch'], ['sv', 'Svenska', 'Swedish'],
  ['fi', 'Suomi', 'Finnish'], ['cs', 'Čeština', 'Czech'], ['el', 'Ελληνικά', 'Greek'],
  ['ar', 'العربية', 'Arabic'], ['he', 'עברית', 'Hebrew'], ['hi', 'हिन्दी', 'Hindi'],
  ['zh', '中文', 'Chinese'], ['ja', '日本語', 'Japanese'], ['ko', '한국어', 'Korean'],
].map(([code, native, english]) => ({ code, native, english }));

const PERSON = {
  name: 'Super User',
  email: 'admin@example.com',
  role: 'Администратор',
  avatar: null,
  links: [
    { key: 'profile', label: 'Профиль', icon: 'badge', href: '/admin/profile' },
    { key: 'security', label: 'Безопасность входа', icon: 'shield_lock', href: '/admin/profile/security' },
    { key: 'sessions', label: 'Активные сеансы', icon: 'devices', href: '/admin/profile/sessions' },
    { key: 'shortcuts', label: 'Горячие клавиши', icon: 'keyboard', href: '/admin/help/shortcuts' },
    { key: 'help', label: 'Справка', icon: 'help', href: 'https://docs.simai.ru/' },
  ],
  theme: 'system',
  language: 'ru',
  compact: false,
  languages: LANGUAGES,
};

const NOTIFICATIONS = [
  { key: 'n1', group: 'today', title: 'Доступно обновление 1.4', body: 'Профили меню и сайт в адресе.', when: '10:42', unread: true, icon: 'system_update', href: '/admin/install/updates' },
  { key: 'n2', group: 'today', title: 'Вход с нового устройства', body: 'Chrome, macOS, Москва.', when: '09:15', unread: true, icon: 'shield', href: '/admin/profile/sessions' },
  { key: 'n3', group: 'today', title: 'Резервная копия готова', body: null, when: '03:00', unread: true, icon: 'backup', href: '/admin/install/backups' },
  { key: 'n4', group: 'earlier', title: '4 новые заявки с сайта', body: 'simai.ru', when: 'вчера', unread: false, icon: 'inbox', href: '/admin/data/requests' },
  { key: 'n5', group: 'earlier', title: 'Резервная копия готова', body: null, when: 'вчера', unread: false, icon: 'backup', href: '/admin/install/backups' },
  { key: 'n6', group: 'earlier', title: 'Пакет storage обновлён до 2.3', body: null, when: '8 окт', unread: false, icon: 'deployed_code', href: '/admin/install/packages' },
];

const navigation = {
  schema: 'ui-admin.navigation.v1',
  summary: 'The admin menu\'s data as a host knows it: sites, the tree per site, profiles with layouts, the person and notifications. Answers simai.admin-navigation-port through src/ports/navigation-host.mjs.',
  roots: ROOTS,
  rows: {
    data_tail: DATA_TAIL,
    site_rows: SITE_ROWS,
    people_rows: PEOPLE_ROWS,
    install_rows: INSTALL_ROWS,
  },
  sites: [...SITES, ...CLIENTS].map((site) => ({
    key: site.key, label: site.label, caption: site.caption, mark: site.mark,
    storages: site.storages,
    favourites: site.favourites,
  })),
  current_site: 'simai.ru',
  manage_sites_href: '/admin/install/sites',
  install_favourites: ['install.updates'],
  profiles: PROFILES,
  current_profile: 'regular',
  layouts: LAYOUTS,
  person: PERSON,
  notification_groups: [{ key: 'today', label: 'Сегодня' }, { key: 'earlier', label: 'Раньше' }],
  notifications: NOTIFICATIONS,
  notifications_settings_href: '/admin/profile/notifications',
  search: {
    recent: ['data.catalog', 'data.requests', 'site.settings', 'install.updates'],
    actions: [
      { key: 'record.create', label: 'Создать запись…', caption: 'в любом хранилище', icon: 'add' },
      { key: 'theme.toggle', label: 'Сменить тему', caption: 'Светлая / тёмная', icon: 'dark_mode' },
      { key: 'site.choose', label: 'Сменить сайт…', caption: null, icon: 'swap_horiz' },
    ],
  },
};

const serialized = `${JSON.stringify(navigation, null, 2)}\n`;

if (check) {
  let committed = '';
  try { committed = readFileSync(target, 'utf8'); } catch { committed = ''; }
  if (committed !== serialized) {
    process.stderr.write('NAVIGATION_DATA_STALE — data/navigation.json is not this script\'s output; run `npm run data`\n');
    process.exit(1);
  }
  process.stdout.write(`data/navigation.json is the generator's output: ${navigation.sites.length} sites\n`);
  process.exit(0);
}

writeFileSync(target, serialized);
process.stdout.write(`wrote data/navigation.json: ${navigation.sites.length} sites, ${PROFILES.length} profiles, ${LANGUAGES.length} languages\n`);
