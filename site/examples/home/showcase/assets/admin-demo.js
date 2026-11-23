/* Written by site/scripts/build-examples.mjs from src/ports/navigation-host.mjs, site/config/demo-panel.json
   and site/scripts/example-kit/kit.js. Demo only: a real page answers these requests from its own server. */
(function () {
'use strict';
// A host for simai.admin-navigation-port over data/navigation.json.
//
// What a Larena admin would answer, kept in memory: the site the admin works
// in, the profile the menu is drawn through, each profile's layout with its
// revision, favourites per site and for the install, the person's theme and
// language, and which notifications are read. The component keeps nothing; this
// is where the menu's state lives, and the conformance kit is driven through it
// by scripts/check-polygon.mjs.
//
// Scenarios stand a host up the way the kit needs to meet it:
//   default      -- an administrator who may change every profile;
//   editor       -- may keep a personal profile, may not touch shared ones;
//   unavailable  -- the host does not answer at all;
//   one-shared   -- only one shared profile exists, so it cannot be removed.
//
// Background activity (port 1.2.0, capability `activity`: activity.load,
// activity.retry, activity.cancel) is answered from data.activity.runs when a
// host is stood up with that capability, as scripts/check-polygon.mjs does.
// The default capabilities leave it out and the host still states 1.0.0 to the
// menu on the polygon's pages: those pages draw no activity indicator, so the
// menu is met by the same host it was accepted with.

const ALL_CAPABILITIES = [
  'favourites', 'menu-profiles', 'notifications', 'preferences', 'search', 'sign-out', 'site-switch',
];

const PAGE_SIZE = 20;

const copy = (value) => JSON.parse(JSON.stringify(value));

const refused = (reason) => ({ answer: 'refused', reason });
const unavailable = (reason = 'The host is not answering.') => ({ answer: 'unavailable', reason });

/**
 * @param {{
 *   data: any,
 *   capabilities?: string[],
 *   scenario?: 'default' | 'editor' | 'unavailable' | 'one-shared',
 *   current?: string | null,
 * }} options
 */
function createNavigationHost({ data, capabilities = ALL_CAPABILITIES, scenario = 'default', current = null }) {
  const offered = new Set(capabilities);
  const sites = new Map(data.sites.map((site) => [site.key, site]));
  const rights = scenario === 'editor'
    ? { edit_personal: true, edit_shared: false, create_shared: false }
    : { edit_personal: true, edit_shared: true, create_shared: true };

  let profiles = scenario === 'one-shared'
    ? copy(data.profiles.filter((profile) => profile.key === 'regular' || profile.kind === 'personal'))
    : copy(data.profiles);
  if (scenario === 'one-shared') {
    profiles = profiles.map((profile) => (profile.key === 'regular' ? { ...profile, key: 'only', label: 'Общий' } : profile));
  }
  const layouts = new Map(Object.entries(copy(data.layouts)));
  if (scenario === 'one-shared') layouts.set('only', layouts.get('regular'));
  const revisions = new Map(profiles.map((profile) => [profile.key, `${profile.key[0]}1`]));

  const state = {
    site: data.current_site,
    profile: scenario === 'one-shared' ? 'only' : data.current_profile,
    // Starred places as the host keeps them: objects, because the ☆ is in the
    // head of any page and a record or a searched list is no menu row.
    favourites: new Map(),
    installFavourites: null,
    theme: data.person.theme,
    language: data.person.language,
    compact: data.person.compact,
    read: new Set(data.notifications.filter((item) => !item.unread).map((item) => item.key)),
    runs: copy(data.activity?.runs ?? []),
    nextProfile: 1,
    // The row the page on screen belongs to; the host knows which page it is.
    current,
  };

  // ─── the tree a site is drawn with ──────────────────────────────────────────

  const rowsOf = (root, site) => {
    if (root.rows === 'storages+data_tail') return [...site.storages, ...data.rows.data_tail];
    const rows = data.rows[root.rows] ?? [];
    return rows.map((row) => (row.key === 'site.open' ? { ...row, href: `https://${site.key}/` } : row));
  };

  const decorate = (row, level) => ({
    key: row.key,
    kind: row.kind,
    level,
    label: row.label ?? null,
    icon: row.icon ?? null,
    href: row.href ?? null,
    attention: row.attention ?? null,
    badge: null,
    shortcut: null,
    own: false,
    hidden: false,
    package_label: row.label ?? null,
    action: row.action ?? null,
  });

  // The packages' tree, then the profile's layout over it: where a row sits, its
  // order, whether it is hidden, a name a person gave it, and their own rows.
  const treeFor = (siteKey, profileKey) => {
    const site = sites.get(siteKey);
    const layout = layouts.get(profileKey) ?? { items: {}, own: [] };
    // The roots take the layout too: their order, whether they are hidden, a
    // name a person gave them, and roots a person added.
    const roots = [
      ...data.roots.map((root, index) => ({ root, index })),
      ...layout.own.filter((entry) => entry.parent === null)
        .map((entry) => ({ root: { ...entry, level: 'site', own: true }, index: entry.order })),
    ].map(({ root, index }) => {
      const entry = layout.items[root.key];
      return { root, order: entry ? entry.order : index, entry };
    }).sort((left, right) => left.order - right.order);
    return roots.map(({ root, entry }, rootIndex) => {
      let node = decorate(root, root.level);
      if (root.own) node = { ...node, own: true, package_label: null };
      if (entry) node = { ...node, hidden: entry.hidden, label: entry.label ?? node.label, icon: entry.icon ?? node.icon };
      if (root.kind !== 'root') return node;
      const children = rowsOf(root, site).map((row, index) => ({ row: decorate(row, root.level), index }));
      for (const own of layout.own.filter((entry) => entry.parent === root.key)) {
        children.push({
          row: { ...decorate(own, root.level), own: true, package_label: null },
          index: own.order,
        });
      }
      const placed = children.map(({ row, index }) => {
        const entry = layout.items[row.key];
        if (!entry) return { row, order: index };
        return {
          row: {
            ...row,
            hidden: entry.hidden,
            label: entry.label ?? row.label,
            icon: entry.icon ?? row.icon,
          },
          order: entry.order,
        };
      });
      placed.sort((left, right) => left.order - right.order);
      return { ...node, children: placed.map(({ row }) => row), order: rootIndex };
    }).map(({ order, ...node }) => node);
  };

  // A starred row is shown with what the row says now; a starred page that is
  // no row keeps what it was starred with.
  const asFavourite = (row) => ({
    key: row.key, label: row.label, icon: row.icon ?? null, href: row.href, level: row.level,
  });
  const siteFavourites = (siteKey) => {
    if (!state.favourites.has(siteKey)) {
      const tree = treeFor(siteKey, state.profile);
      const rows = tree.flatMap((root) => [root, ...(root.children ?? [])]);
      const keys = sites.get(siteKey).favourites;
      state.favourites.set(siteKey, keys.map((key) => rows.find((row) => row.key === key)).filter(Boolean).map(asFavourite));
    }
    return state.favourites.get(siteKey);
  };
  const installFavourites = () => {
    if (!state.installFavourites) {
      const install = treeFor(data.current_site, state.profile).find((root) => root.level === 'install');
      state.installFavourites = data.install_favourites
        .map((key) => (install.children ?? []).find((row) => row.key === key)).filter(Boolean).map(asFavourite);
    }
    return state.installFavourites;
  };
  // The site's own first, then what is shared by every site (mockup v5).
  const allFavourites = () => [...siteFavourites(state.site), ...installFavourites()];

  const unread = () => data.notifications.filter((item) => item.unread && !state.read.has(item.key)).length;

  const navigation = (sequence = null) => {
    const site = sites.get(state.site);
    return {
      revision: revisions.get(state.profile),
      echo: { site: state.site, profile: state.profile, sequence },
      site: {
        current: { key: site.key, label: site.label, caption: site.caption, mark: site.mark },
        count: offered.has('site-switch') ? data.sites.length : 1,
        manage_href: offered.has('site-switch') ? data.manage_sites_href : null,
      },
      current: state.current,
      items: treeFor(state.site, state.profile),
      favourites: offered.has('favourites') ? allFavourites() : [],
      profiles: { current: state.profile, list: profileList() },
      rights: offered.has('menu-profiles') ? rights : { edit_personal: false, edit_shared: false, create_shared: false },
      person: { ...copy(data.person), theme: state.theme, language: state.language, compact: state.compact },
      notifications: offered.has('notifications') ? { unread: unread() } : null,
    };
  };

  const activityPage = () => copy([
    ...state.runs.filter((run) => run.state === 'running'),
    ...state.runs.filter((run) => run.state !== 'running'),
  ]);

  const sharedCount = () => profiles.filter((profile) => profile.kind === 'shared').length;
  const profileList = () => profiles.map((profile) => ({
    ...profile,
    renamable: profile.kind === 'personal' ? rights.edit_personal : rights.edit_shared,
    removable: profile.kind === 'personal'
      ? rights.edit_personal
      : rights.edit_shared && sharedCount() > 1,
  }));
  const mayEdit = (profile) => (profile.kind === 'shared' ? rights.edit_shared : rights.edit_personal);

  const findRow = (key) => {
    for (const root of treeFor(state.site, state.profile)) {
      if (root.key === key) return root;
      for (const child of root.children ?? []) if (child.key === key) return child;
    }
    return null;
  };

  // ─── the intents ────────────────────────────────────────────────────────────

  const handlers = {
    'navigation.load': ({ site, sequence = null }) => {
      if (site !== null && site !== undefined) {
        if (!sites.has(site)) return refused(`No site «${site}» is within this person's reach.`);
        state.site = site;
      }
      return { answer: 'applied', ...navigation(sequence) };
    },

    'item.open': ({ key }) => {
      const row = findRow(key);
      if (!row) return refused('That row is no longer in the menu.');
      state.current = key;
      return { answer: 'applied', href: row.href };
    },

    'site.switch': ({ site, sequence = null }) => {
      if (!sites.has(site)) return refused(`No site «${site}» is within this person's reach.`);
      state.site = site;
      return { answer: 'applied', ...navigation(sequence) };
    },

    'sites.search': ({ query, cursor = null }) => {
      const needle = query.trim().toLowerCase();
      const matched = data.sites.filter((site) => !needle
        || site.label.toLowerCase().includes(needle)
        || (site.caption ?? '').toLowerCase().includes(needle));
      const start = Number(cursor ?? 0);
      const items = matched.slice(start, start + PAGE_SIZE)
        .map(({ key, label, caption, mark }) => ({ key, label, caption, mark }));
      const next = start + PAGE_SIZE < matched.length ? start + PAGE_SIZE : null;
      return { answer: 'applied', echo: { query, cursor }, items, next_cursor: next, total: matched.length };
    },

    'search.query': ({ query, sequence = null }) => {
      const site = sites.get(state.site);
      const needle = query.trim().toLowerCase();
      const rows = treeFor(state.site, state.profile)
        .flatMap((root) => [root, ...(root.children ?? []).map((child) => ({ ...child, root }))])
        .filter((row) => row.kind === 'page' && !row.hidden);
      const result = (row) => ({
        key: row.key, kind: 'page', label: row.label,
        caption: row.root?.label ?? null, icon: row.icon, href: row.href,
      });
      const groups = [];
      if (!needle) {
        const recent = data.search.recent.map((key) => rows.find((row) => row.key === key)).filter(Boolean);
        groups.push({ key: 'recent', label: 'Недавние', items: recent.map(result) });
      } else {
        const go = rows.filter((row) => row.label.toLowerCase().includes(needle));
        if (go.length) {
          groups.push({
            key: 'go', label: 'Перейти', items: go.slice(0, 5).map(result),
            // The rest of the group, where there is a rest.
            more: go.length > 5 ? { label: 'Все результаты', href: `/admin/search?q=${encodeURIComponent(query)}` } : null,
          });
        }
      }
      const actions = data.search.actions.filter((action) => !needle || action.label.toLowerCase().includes(needle));
      if (actions.length) {
        groups.push({
          key: 'actions', label: 'Действия',
          items: actions.map((action) => ({ key: action.key, kind: 'action', label: action.label, caption: action.caption, icon: action.icon, href: null })),
        });
      }
      return { answer: 'applied', echo: { query, scope: `в ${site.label}`, sequence }, groups };
    },

    'search.choose': ({ group, key }) => {
      if (group === 'actions') {
        const action = data.search.actions.find((entry) => entry.key === key);
        if (!action) return refused('That action is not offered here.');
        return { answer: 'applied', href: null, action: action.key };
      }
      const row = findRow(key);
      if (!row) return refused('That result is no longer there.');
      return { answer: 'applied', href: row.href };
    },

    'favourite.toggle': ({ key, on, label, icon = null, href }) => {
      const row = findRow(key);
      let place = row ? asFavourite(row) : null;
      if (!place) {
        // A page that is no row: it comes with what to show for it, or it is
        // not something the host can keep.
        const already = allFavourites().find((entry) => entry.key === key);
        if (!on && already) place = already;
        else if (label && href) place = { key, label, icon, href, level: 'site' };
        else return refused('That place is neither a menu row nor a page given with its label and address.');
      }
      const list = place.level === 'install' ? installFavourites() : siteFavourites(state.site);
      const at = list.findIndex((entry) => entry.key === key);
      if (on && at < 0) list.push(place);
      if (!on && at >= 0) list.splice(at, 1);
      return { answer: 'applied', favourites: allFavourites() };
    },

    'view.profile': ({ profile }) => {
      if (!profiles.some((entry) => entry.key === profile)) return refused(`There is no profile «${profile}».`);
      state.profile = profile;
      return { answer: 'applied', navigation: navigation() };
    },

    'view.create': ({ label, shared, from }) => {
      if (shared && !rights.create_shared) return refused('Shared profiles are made by an administrator.');
      if (!shared && profiles.some((entry) => entry.kind === 'personal')) {
        return refused('A person has one personal profile.');
      }
      if (!layouts.has(from)) return refused(`There is no profile «${from}» to start from.`);
      const key = `profile-${state.nextProfile++}`;
      profiles.push({ key, label, kind: shared ? 'shared' : 'personal' });
      layouts.set(key, copy(layouts.get(from)));
      revisions.set(key, `${key}-1`);
      return { answer: 'applied', profiles: { current: state.profile, list: profileList() } };
    },

    'view.rename': ({ profile, label }) => {
      const found = profiles.find((entry) => entry.key === profile);
      if (!found) return refused(`There is no profile «${profile}».`);
      if (!mayEdit(found)) return refused('This profile is not yours to rename.');
      found.label = label;
      return { answer: 'applied', profiles: { current: state.profile, list: profileList() } };
    },

    'view.delete': ({ profile }) => {
      const found = profiles.find((entry) => entry.key === profile);
      if (!found) return refused(`There is no profile «${profile}».`);
      if (!mayEdit(found)) return refused('This profile is not yours to remove.');
      if (found.kind === 'shared' && sharedCount() === 1) {
        return refused('The last shared profile stays: a site with none has nothing for a person who has made none of their own.');
      }
      profiles = profiles.filter((entry) => entry.key !== profile);
      layouts.delete(profile);
      if (state.profile === profile) state.profile = profiles.find((entry) => entry.kind === 'shared').key;
      return { answer: 'applied', profiles: { current: state.profile, list: profileList() }, navigation: navigation() };
    },

    'view.save': ({ profile, revision, layout }) => {
      const found = profiles.find((entry) => entry.key === profile);
      if (!found) return refused(`There is no profile «${profile}».`);
      if (!mayEdit(found)) return refused('Shared profiles are changed by an administrator.');
      if (revision !== revisions.get(profile)) {
        return { answer: 'conflict', revision: revisions.get(profile), layout: copy(layouts.get(profile)) };
      }
      layouts.set(profile, copy(layout));
      const next = `${profile[0]}${Number(String(revision).replace(/\D/gu, '') || 1) + 1}`;
      revisions.set(profile, next);
      return { answer: 'applied', revision: next };
    },

    'view.reset': ({ profile, revision }) => {
      const found = profiles.find((entry) => entry.key === profile);
      if (!found) return refused(`There is no profile «${profile}».`);
      if (!mayEdit(found)) return refused('Shared profiles are changed by an administrator.');
      if (revision !== revisions.get(profile)) {
        return { answer: 'conflict', revision: revisions.get(profile), layout: copy(layouts.get(profile)) };
      }
      layouts.set(profile, { schema_version: 1, items: {}, own: [] });
      const next = `${profile[0]}${Number(String(revision).replace(/\D/gu, '') || 1) + 1}`;
      revisions.set(profile, next);
      return { answer: 'applied', revision: next, navigation: navigation() };
    },

    'preference.theme': ({ theme }) => {
      if (!['light', 'dark', 'system'].includes(theme)) return refused(`«${theme}» is not a theme.`);
      state.theme = theme;
      return { answer: 'applied', theme };
    },

    'preference.language': ({ language }) => {
      if (!data.person.languages.some((entry) => entry.code === language)) {
        return refused(`The admin is not offered in «${language}».`);
      }
      state.language = language;
      // This host draws nothing on a server, so nothing of its own needs a
      // reload. A host with server-rendered text would answer true.
      return { answer: 'applied', language, reload: false };
    },

    'preference.compact': ({ compact }) => {
      state.compact = Boolean(compact);
      return { answer: 'applied', compact: state.compact };
    },

    'notifications.load': () => {
      const groups = data.notification_groups.map((group) => ({
        key: group.key,
        label: group.label,
        items: data.notifications
          .filter((item) => item.group === group.key)
          .map(({ group: _group, ...item }) => ({ ...item, unread: item.unread && !state.read.has(item.key) })),
      })).filter((group) => group.items.length);
      return {
        answer: 'applied', groups, unread: unread(),
        settings_href: data.notifications_settings_href,
        // One page holds them all here; a host with more answers a cursor.
        next_cursor: null,
      };
    },

    'notifications.read': ({ keys = [], all }) => {
      const known = new Set(data.notifications.map((item) => item.key));
      const unknown = keys.filter((key) => !known.has(key));
      if (unknown.length) return refused(`No notification «${unknown[0]}».`);
      for (const item of data.notifications) if (all || keys.includes(item.key)) state.read.add(item.key);
      return { answer: 'applied', unread: unread() };
    },

    'session.sign-out': () => ({ answer: 'applied', href: '/admin/login' }),

    // What runs in the background: running ones first, each with its state.
    'activity.load': () => ({ answer: 'applied', runs: activityPage() }),

    // Retry is the person's request on a run that failed or was cancelled; the
    // host starts it again from the beginning.
    'activity.retry': ({ id }) => {
      const run = state.runs.find((item) => item.id === id);
      if (!run) return refused(`No run «${id}».`);
      if (!['failed', 'cancelled'].includes(run.state) || !run.retryable) {
        return refused(`«${run.label}» cannot be started again now.`);
      }
      Object.assign(run, { state: 'running', value: run.total ? 0 : null, text: null });
      return { answer: 'applied', runs: activityPage() };
    },

    // Cancel is the person's request on a running run; the host stops it.
    'activity.cancel': ({ id }) => {
      const run = state.runs.find((item) => item.id === id);
      if (!run) return refused(`No run «${id}».`);
      if (run.state !== 'running' || !run.cancelable) return refused(`«${run.label}» cannot be stopped now.`);
      Object.assign(run, { state: 'cancelled', text: null });
      return { answer: 'applied', runs: activityPage() };
    },
  };

  // Which capability each intent belongs to; an intent outside every capability
  // is always offered.
  const capabilityOf = {
    'site.switch': 'site-switch', 'sites.search': 'site-switch',
    'search.query': 'search', 'search.choose': 'search',
    'favourite.toggle': 'favourites',
    'view.profile': 'menu-profiles', 'view.create': 'menu-profiles', 'view.rename': 'menu-profiles',
    'view.delete': 'menu-profiles', 'view.save': 'menu-profiles', 'view.reset': 'menu-profiles',
    'preference.theme': 'preferences', 'preference.language': 'preferences', 'preference.compact': 'preferences',
    'notifications.load': 'notifications', 'notifications.read': 'notifications',
    'session.sign-out': 'sign-out',
    'activity.load': 'activity', 'activity.retry': 'activity', 'activity.cancel': 'activity',
  };

  return {
    port: 'simai.admin-navigation-port',
    version: '1.0.0',
    capabilities: [...offered].sort(),
    /** What the component would read on connect. */
    navigation: () => navigation(),
    async raise(intent, payload = {}) {
      if (scenario === 'unavailable') return unavailable();
      const handler = handlers[intent];
      if (!handler) return refused(`This host does not answer «${intent}».`);
      const capability = capabilityOf[intent];
      if (capability && !offered.has(capability)) {
        return unavailable(`This host does not offer ${capability}.`);
      }
      return handler(payload);
    },
  };
}

const DATA = {"schema":"ui-admin.navigation.v1","summary":"Demo data of the site examples: a server panel with three servers, as the admin menu showcase the owner approved draws it. Not a product contract; a real page answers from its own server.","roots":[{"key":"sites","kind":"page","label":"Сайты","icon":"language","href":"#/sites","level":"site"},{"key":"db","kind":"page","label":"Базы данных","icon":"database","href":"#/db","level":"site"},{"key":"history","kind":"page","label":"История","icon":"history","href":"#/history","level":"site"},{"key":"users","kind":"page","label":"Пользователи","icon":"group","href":"#/users","level":"install"},{"key":"server","kind":"root","level":"install","label":"Сервер","icon":"dns","rows":"server_rows"},{"key":"panel","kind":"root","level":"install","label":"Настройки панели","icon":"settings","rows":"panel_rows"}],"rows":{"server_rows":[{"key":"srv.overview","kind":"page","label":"Обзор","icon":"monitoring","href":"#/srv.overview"},{"key":"srv.dns","kind":"page","label":"DNS-зоны","icon":"lan","href":"#/srv.dns"},{"key":"srv.security","kind":"page","label":"Безопасность","icon":"shield","href":"#/srv.security"},{"key":"srv.services","kind":"page","label":"Службы","icon":"settings_applications","href":"#/srv.services"},{"key":"srv.firewall","kind":"page","label":"Файрвол","icon":"local_fire_department","href":"#/srv.firewall"},{"key":"srv.software","kind":"page","label":"Программы и обновления","icon":"system_update","href":"#/srv.software","attention":{"tone":"info","label":"3"}},{"key":"srv.backups","kind":"page","label":"Хранилища копий","icon":"backup","href":"#/srv.backups"},{"key":"srv.php","kind":"page","label":"PHP","icon":"code","href":"#/srv.php"}],"panel_rows":[{"key":"panel.general","kind":"page","label":"Общие","icon":"tune","href":"#/panel.general"},{"key":"panel.access","kind":"page","label":"Доступ","icon":"key","href":"#/panel.access"},{"key":"panel.notify","kind":"page","label":"Уведомления","icon":"notifications","href":"#/panel.notify"},{"key":"panel.license","kind":"page","label":"Лицензия","icon":"verified","href":"#/panel.license"}]},"sites":[{"key":"srv1.larena.cloud","label":"srv1.larena.cloud","caption":"Сервер · Москва","mark":"L","storages":[],"favourites":[]},{"key":"srv2.larena.cloud","label":"srv2.larena.cloud","caption":"Сервер · Франкфурт","mark":"F","storages":[],"favourites":[]},{"key":"stage.larena.cloud","label":"stage.larena.cloud","caption":"Тестовый сервер","mark":null,"storages":[],"favourites":[]}],"current_site":"srv1.larena.cloud","manage_sites_href":"#/servers","install_favourites":["srv.firewall","panel.notify"],"profiles":[{"key":"everyone","label":"Для всех","kind":"shared"},{"key":"ops","label":"Операторы","kind":"shared"},{"key":"personal","label":"Лично","kind":"personal"}],"current_profile":"personal","layouts":{"everyone":{"schema_version":1,"items":{},"own":[]},"ops":{"schema_version":1,"items":{"history":{"parent":null,"order":2,"hidden":true,"label":null,"icon":null}},"own":[]},"personal":{"schema_version":1,"items":{},"own":[]}},"person":{"name":"Super User","email":"admin@example.com","role":"Администратор","avatar":null,"links":[{"key":"profile","label":"Профиль","icon":"badge","href":"#/profile.profile"},{"key":"security","label":"Безопасность входа","icon":"shield_lock","href":"#/profile.security"},{"key":"sessions","label":"Активные сеансы","icon":"devices","href":"#/profile.sessions"},{"key":"shortcuts","label":"Горячие клавиши","icon":"keyboard","href":"#/profile.shortcuts"},{"key":"help","label":"Справка","icon":"help","href":"https://docs.simai.ru/"}],"theme":"system","language":"ru","compact":true,"languages":[{"code":"ru","native":"Русский","english":"Russian"},{"code":"en","native":"English","english":"English"},{"code":"zh","native":"中文","english":"Chinese"},{"code":"es","native":"Español","english":"Spanish"},{"code":"pt","native":"Português","english":"Portuguese"},{"code":"de","native":"Deutsch","english":"German"},{"code":"fr","native":"Français","english":"French"},{"code":"it","native":"Italiano","english":"Italian"},{"code":"ja","native":"日本語","english":"Japanese"},{"code":"ko","native":"한국어","english":"Korean"},{"code":"ar","native":"العربية","english":"Arabic"}]},"notification_groups":[{"key":"today","label":"Сегодня"},{"key":"yesterday","label":"Вчера"}],"notifications":[{"key":"n1","group":"today","level":"warning","object":"srv1.larena.cloud","title":"Сертификат истекает через 7 дней","body":"Продлите в «Безопасность».","when":"10:42","unread":true,"icon":"verified_user","href":"#/srv.security"},{"key":"n2","group":"today","level":"error","object":"stage.larena.cloud","title":"Копия не сделана: хранилище не ответило","body":null,"when":"03:10","unread":true,"icon":"backup","href":"#/srv.backups"},{"key":"n3","group":"today","level":"info","object":"srv1.larena.cloud","title":"Доступно обновление PHP 8.4","body":null,"when":"09:15","unread":true,"icon":"system_update","href":"#/srv.software"},{"key":"n4","group":"today","level":"success","object":"simai.ru","title":"Копия готова, 1,2 ГБ","body":null,"when":"03:00","unread":false,"icon":"backup","href":"#/srv.backups"},{"key":"n5","group":"today","level":"info","object":"srv1.larena.cloud","title":"Служба почты перезапущена","body":null,"when":"02:40","unread":false,"icon":"settings_applications","href":"#/srv.services"},{"key":"n6","group":"yesterday","level":"error","object":"srv2.larena.cloud","title":"Сервер не отвечал","resolved":"снова отвечает с 09:11, перерыв 9 минут","body":null,"when":"09:02","unread":false,"icon":"dns","href":"#/srv.overview"},{"key":"n7","group":"yesterday","level":"info","object":"Пользователи","title":"Вход с нового устройства: Chrome, macOS","body":null,"when":"18:20","unread":false,"icon":"shield","href":"#/profile.sessions"}],"notifications_settings_href":"#/panel.notify","search":{"recent":["srv.services","srv.firewall","sites","db"],"actions":[{"key":"site.create","label":"Создать сайт…","caption":"на этом сервере","icon":"add"},{"key":"theme.toggle","label":"Сменить тему","caption":"Светлая / тёмная","icon":"dark_mode"},{"key":"site.choose","label":"Сменить сервер…","caption":null,"icon":"swap_horiz"}]}};

// The demo side of the site's live examples, as window.AdminDemo. A real page
// answers the same requests from its own server; here a host kept in memory
// answers them (createNavigationHost above, the repository's own demo host).
//
//   AdminDemo.host({current, context, capabilities})  a port object: {port, version, capabilities, raise}
//   AdminDemo.serve(host)    hands the port to every set component that asks for it
//   AdminDemo.notices()      the demo notifications as items (for a list without a port)
//   AdminDemo.runs(kind)     background runs: 'two', 'failed', 'done-failed', 'none'
//   AdminDemo.log(text)      writes a line into the example's [data-log] element
// copy() comes from the host above.

const log = (text) => {
  const line = document.querySelector('[data-log]');
  if (line) line.textContent = text;
};

// Every link of the demo data is a fragment («#/srv.dns»). In an example
// frame a fragment resolves against the frame's base address and would load
// another page into the frame, so a click on one stays here and is told in
// the example's log line instead. A component that handles a click itself
// has already done so: this runs last, on the window.
addEventListener('click', (event) => {
  const link = event.composedPath().find((node) => node instanceof Element && node.tagName === 'A');
  const href = link?.getAttribute('href') ?? '';
  if (!href.startsWith('#')) return;
  event.preventDefault();
  if (href.length > 1) log(`Переход: ${href.slice(1)}`);
});

// The menu of the object a page shows (port 1.1.0, field `context`): the
// server panel's page of one server.
const SERVER_CONTEXT = {
  title: 'srv1.larena.cloud',
  subtitle: 'Москва · Ubuntu 24.04',
  status: {text: 'Работает', status: 'success'},
  back: {label: 'Все серверы', href: '#/servers'},
  groups: [
    {label: null, items: [
      {key: 'srv1.overview', label: 'Обзор', href: '#/srv1/overview', icon: 'monitoring'},
      {key: 'srv1.sites', label: 'Сайты', href: '#/srv1/sites', icon: 'language'},
      {key: 'srv1.backups', label: 'Резервные копии', href: '#/srv1/backups', icon: 'backup', badge: {text: '1', status: 'error'}},
    ]},
    {label: 'Дополнительно', items: [
      {key: 'srv1.php', label: 'PHP и веб-сервер', href: '#/srv1/php', icon: 'code'},
      {key: 'srv1.firewall', label: 'Файрвол', href: '#/srv1/firewall', icon: 'local_fire_department'},
    ]},
  ],
  current: 'srv1.overview',
};

const host = ({current = null, context = false, capabilities} = {}) => {
  const inner = createNavigationHost({data: copy(DATA), current, ...(capabilities ? {capabilities} : {})});
  return {
    port: inner.port,
    version: '1.1.0',
    capabilities: inner.capabilities,
    async raise(intent, payload = {}) {
      const answer = await inner.raise(intent, payload);
      if (intent === 'navigation.load' && context && answer.answer === 'applied') {
        return {...answer, context: copy(SERVER_CONTEXT)};
      }
      return answer;
    },
  };
};

const OWNERS = new Set(['admin-menu', 'admin-notifications']);
const serve = (port) => {
  addEventListener('sf-host-port-request', (event) => {
    const detail = event.detail;
    if (!detail?.component || !OWNERS.has(detail.context?.owner)) return;
    (detail.component.connectPort ?? detail.component.setHostPort)?.call(detail.component, {port});
  });
  const hand = (selector, tag) => customElements.whenDefined(tag).then(() => {
    for (const element of document.querySelectorAll(selector)) element.connectPort?.({port});
  });
  hand('sf-admin-menu', 'sf-admin-menu');
  hand('sf-admin-notifications', 'sf-admin-notifications');
  return port;
};

const notices = () => DATA.notifications.map(({group, ...item}) => ({
  ...item,
  group,
  'group-label': DATA.notification_groups.find((one) => one.key === group)?.label ?? group,
}));

const RUNS = {
  two: [
    {id: 'r1', label: 'Копия srv1.larena.cloud', state: 'running', value: 42, total: 100, unit: '%', href: '#/srv.backups'},
    {id: 'r2', label: 'Обновление PHP на stage', state: 'running', href: '#/srv.software', object: 'stage.larena.cloud'},
  ],
  failed: [
    {id: 'r1', label: 'Копия srv1.larena.cloud', state: 'running', value: 42, total: 100, unit: '%', href: '#/srv.backups'},
    {id: 'r2', label: 'Обновление PHP на stage', state: 'failed', text: 'Хранилище пакетов не ответило.', href: '#/srv.software', object: 'stage.larena.cloud'},
  ],
  'done-failed': [
    {id: 'r1', label: 'Копия srv1.larena.cloud', state: 'done', value: 100, total: 100, unit: '%', href: '#/srv.backups'},
    {id: 'r2', label: 'Обновление PHP на stage', state: 'failed', text: 'Хранилище пакетов не ответило.', href: '#/srv.software', object: 'stage.larena.cloud'},
  ],
  none: [],
};
const runs = (kind = 'two') => copy(RUNS[kind] ?? RUNS.two);

window.AdminDemo = {host, serve, notices, runs, log, data: () => copy(DATA)};
})();
