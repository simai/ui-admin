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
 * }} options
 */
export function createNavigationHost({ data, capabilities = ALL_CAPABILITIES, scenario = 'default' }) {
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
    favourites: new Map(data.sites.map((site) => [site.key, [...site.favourites]])),
    installFavourites: [...data.install_favourites],
    theme: data.person.theme,
    language: data.person.language,
    read: new Set(data.notifications.filter((item) => !item.unread).map((item) => item.key)),
    nextProfile: 1,
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
    return data.roots.map((root, rootIndex) => {
      const node = decorate(root, root.level);
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
      current: null,
      items: treeFor(state.site, state.profile),
      favourites: offered.has('favourites')
        ? [...state.installFavourites, ...(state.favourites.get(state.site) ?? [])]
        : [],
      profiles: { current: state.profile, list: profileList() },
      rights: offered.has('menu-profiles') ? rights : { edit_personal: false, edit_shared: false, create_shared: false },
      person: { ...copy(data.person), theme: state.theme, language: state.language },
      notifications: offered.has('notifications') ? { unread: unread() } : null,
    };
  };

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
        if (go.length) groups.push({ key: 'go', label: 'Перейти', items: go.map(result) });
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

    'favourite.toggle': ({ key, on }) => {
      const row = findRow(key);
      if (!row) return refused('That row is not in the menu.');
      const list = row.level === 'install' ? state.installFavourites : state.favourites.get(state.site);
      const at = list.indexOf(key);
      if (on && at < 0) list.push(key);
      if (!on && at >= 0) list.splice(at, 1);
      return { answer: 'applied', favourites: [...state.installFavourites, ...state.favourites.get(state.site)] };
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
  };

  // Which capability each intent belongs to; an intent outside every capability
  // is always offered.
  const capabilityOf = {
    'site.switch': 'site-switch', 'sites.search': 'site-switch',
    'search.query': 'search', 'search.choose': 'search',
    'favourite.toggle': 'favourites',
    'view.profile': 'menu-profiles', 'view.create': 'menu-profiles', 'view.rename': 'menu-profiles',
    'view.delete': 'menu-profiles', 'view.save': 'menu-profiles', 'view.reset': 'menu-profiles',
    'preference.theme': 'preferences', 'preference.language': 'preferences',
    'notifications.load': 'notifications', 'notifications.read': 'notifications',
    'session.sign-out': 'sign-out',
  };

  return {
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
