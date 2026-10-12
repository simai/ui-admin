// A host for simai.dataview-port 1.9.0 that answers a tree: a site's pages.
//
// What Larena's site-pages host answers, kept in memory: pages under pages,
// each with a revision and a publication per language, answered one level at
// a time. It decides where a page may move and checks the revision; the view
// draws and asks. scripts/check-polygon.mjs drives the 1.8.0 kit through it,
// and site-pages.html shows it in sf-data-view.
//
// Scenarios:
//   default  -- pages with revisions: a stale move is a conflict;
//   confirm  -- nodes without revisions (Larena's group planes): a move is
//               confirmed first, refused with confirm_required and a digest;
//   flat     -- a plane with no nesting, answered as a list.

const PAGE_SIZE = 10;
const LOCALES = ['ru', 'en'];

const copy = (value) => JSON.parse(JSON.stringify(value));

// The pages: parent, title, slug and a publication per language. Generated
// rather than written out, so a level is long enough to page.
const seed = () => {
  const pages = [];
  const add = (id, parent, title, slug, publication = {ru: 'published', en: 'draft'}) => {
    pages.push({id, parent, title, slug, revision: 1, order: pages.filter((page) => page.parent === parent).length, publication});
  };
  add('home', null, 'Главная', '/');
  add('about', null, 'О компании', '/about', {ru: 'published', en: 'published'});
  add('team', 'about', 'Команда', '/about/team');
  add('history', 'about', 'История', '/about/history', {ru: 'scheduled', en: 'draft', at: '2026-10-14T09:00:00Z'});
  add('people', 'team', 'Люди', '/about/team/people');
  add('services', null, 'Услуги', '/services');
  for (let index = 1; index <= 14; index += 1) {
    add(`service-${index}`, 'services', `Услуга ${index}`, `/services/s${index}`,
      {ru: index % 3 === 0 ? 'archived' : 'published', en: index % 2 ? 'draft' : 'published'});
  }
  add('blog', null, 'Блог', '/blog', {ru: 'published', en: 'published'});
  add('contacts', null, 'Контакты', '/contacts');
  return pages;
};

const BADGES = [
  {value: 'published', label: 'Опубликовано', scheme: 'success'},
  {value: 'scheduled', label: 'Запланировано', scheme: 'warning'},
  {value: 'draft', label: 'Черновик', scheme: 'neutral'},
  {value: 'archived', label: 'В архиве', scheme: 'neutral'},
];

const COLUMNS = [
  {key: 'title', label: 'Страница', role: 'title', visible: true},
  {key: 'slug', label: 'Адрес', visible: true},
  {key: 'publication', label: 'Публикация', property_type: 'choices', variant: 'badges', options: BADGES, visible: true},
];
// No actions column: a page has a dozen actions (each language's publication
// among them), which belong in the row menu, not in a row of buttons.

const ROW_ACTIONS = [
  {id: 'rename', label: 'Переименовать', icon: 'edit'},
  ...LOCALES.flatMap((locale) => [
    {id: `publish:${locale}`, label: locale, group: 'publish', group_label: 'Опубликовать'},
    {id: `unpublish:${locale}`, label: locale, group: 'unpublish', group_label: 'Снять с публикации'},
    {id: `archive:${locale}`, label: locale, group: 'archive', group_label: 'В архив', danger: true},
  ]),
];

/**
 * @param {{capabilities?: string[], scenario?: string}} [options]
 */
export const createTreeHost = ({capabilities = ['tree', 'tree-move', 'row-actions'], scenario = 'default'} = {}) => {
  const pages = seed();
  const confirming = scenario === 'confirm';
  const byId = (id) => pages.find((page) => page.id === String(id));
  const childrenOf = (parent) => pages
    .filter((page) => page.parent === (parent ?? null))
    .sort((left, right) => left.order - right.order);
  const ancestors = (page) => {
    const chain = [];
    for (let current = byId(page.parent); current; current = byId(current.parent)) chain.unshift(current);
    return chain;
  };
  const isUnder = (page, ancestor) => ancestors(page).some((item) => item.id === ancestor.id);

  const fmt = (iso) => new Date(iso).toLocaleString('ru-RU', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'UTC'});
  // A row: the page as the port names it, with its publication as badges and
  // the actions this page allows -- publishing a language that is not
  // published, withdrawing one that is.
  const asRow = (page, {path = false} = {}) => {
    const actions = ['view', 'rename', 'move', 'create'];
    for (const locale of LOCALES) {
      const state = page.publication[locale];
      if (state === 'published' || state === 'scheduled') actions.push(`unpublish:${locale}`);
      else if (state !== 'archived') actions.push(`publish:${locale}`);
      if (state !== 'archived') actions.push(`archive:${locale}`);
    }
    const row = {
      id: page.id,
      title: page.title,
      slug: page.slug,
      publication: LOCALES.map((locale) => {
        const state = page.publication[locale];
        return state === 'scheduled' && page.publication.at
          ? {value: state, text: `${locale} · ${fmt(page.publication.at)}`}
          : {value: state, text: `${locale} · ${BADGES.find((badge) => badge.value === state)?.label ?? state}`};
      }),
      actions,
      ...(confirming ? {} : {revision: `r${page.revision}`}),
    };
    if (scenario === 'flat') return row;
    row.parent = page.parent;
    row.has_children = childrenOf(page.id).length > 0;
    // The host names what a node is (port 1.9.0): a section of the site and a
    // page -- not a folder and a file, which a page with pages under it is not.
    row.icon = row.has_children ? 'library_books' : 'article';
    if (path) row.path = ancestors(page).map((item) => ({id: item.id, label: item.title}));
    return row;
  };

  const level = (parent, cursor) => {
    const all = childrenOf(parent);
    const from = Number(cursor ?? 0) || 0;
    const slice = all.slice(from, from + PAGE_SIZE);
    const next = from + PAGE_SIZE < all.length ? String(from + PAGE_SIZE) : null;
    return {records: slice.map((page) => asRow(page)), has_next: next !== null, cursor: next};
  };

  const digestOf = (payload) => `move:${payload.id}:${payload.parent ?? 'root'}:${payload.index ?? 'end'}`;

  return {
    version: '1.9.0',
    capabilities,

    async raise(intent, payload = {}) {
      if (intent === 'query.change') {
        const query = payload.query ?? {};
        const search = String(query.search ?? '').trim().toLowerCase();
        const echo = {search: query.search ?? '', filters: query.filters ?? {}, sort: [], page: query.page ?? 1, per_page: PAGE_SIZE};
        if (scenario === 'flat') {
          return {answer: 'applied', sequence: payload.sequence, data: {
            columns: COLUMNS, row_actions: ROW_ACTIONS, echo, total: pages.length,
            records: pages.map((page) => asRow(page)), tree: {mode: 'flat'},
          }};
        }
        if (search) {
          // A search over the tree is a list of what matches, each with the
          // path it lives under.
          const found = pages.filter((page) => `${page.title} ${page.slug}`.toLowerCase().includes(search));
          return {answer: 'applied', sequence: payload.sequence, data: {
            columns: COLUMNS, row_actions: ROW_ACTIONS, echo, total: found.length,
            records: found.map((page) => asRow(page, {path: true})), tree: {mode: 'flattened'},
          }};
        }
        const page = Math.max(1, Number(query.page ?? 1));
        const roots = level(null, (page - 1) * PAGE_SIZE);
        return {answer: 'applied', sequence: payload.sequence, data: {
          columns: COLUMNS, row_actions: ROW_ACTIONS, echo, records: roots.records, has_next: roots.has_next,
          tree: {mode: 'tree', parent: null, has_next: roots.has_next, cursor: roots.cursor},
        }};
      }

      if (intent === 'tree.expand') {
        if (!capabilities.includes('tree')) return {answer: 'unavailable', reason: 'capability-not-provided'};
        const node = byId(payload.id);
        if (!node) return {answer: 'refused', reason: 'record-unknown'};
        const children = level(node.id, payload.cursor);
        return {answer: 'applied', data: {records: children.records,
          tree: {mode: 'tree', parent: node.id, has_next: children.has_next, cursor: children.cursor}}};
      }

      if (intent === 'node.targets') {
        if (!capabilities.includes('tree-move')) return {answer: 'unavailable', reason: 'capability-not-provided'};
        const node = byId(payload.id);
        if (!node) return {answer: 'refused', reason: 'record-unknown'};
        // Anywhere but under itself: a page cannot become its own descendant.
        const parents = pages
          .filter((page) => page.id !== node.id && !isUnder(page, node))
          .map((page) => ({id: page.id, label: page.title, path: ancestors(page).map((item) => item.title)}));
        return {answer: 'applied', data: {move_targets: {id: node.id, parents, root: true, reorder: true}}};
      }

      if (intent === 'node.move') {
        if (!capabilities.includes('tree-move')) return {answer: 'unavailable', reason: 'capability-not-provided'};
        const node = byId(payload.id);
        if (!node) return {answer: 'refused', reason: 'record-unknown'};
        const parent = payload.parent === null || payload.parent === undefined ? null : byId(payload.parent);
        if (payload.parent !== null && payload.parent !== undefined && !parent) return {answer: 'refused', reason: 'target-unknown'};
        if (parent && (parent.id === node.id || isUnder(parent, node))) {
          return {answer: 'refused', reason: 'target-not-offered', message: 'Страницу нельзя переместить внутрь неё самой'};
        }
        if (confirming && payload.confirm !== digestOf(payload)) {
          if (payload.confirm) return {answer: 'refused', reason: 'confirm-mismatch'};
          return {answer: 'refused', reason: 'confirm_required', data: {confirm: {
            summary: `«${node.title}» переместится ${parent ? `в «${parent.title}»` : 'на верхний уровень'}.`,
            digest: digestOf(payload),
          }}};
        }
        if (!confirming && payload.revision !== undefined && String(payload.revision) !== `r${node.revision}`) {
          return {answer: 'conflict', reason: 'stale-revision', current_revision: `r${node.revision}`};
        }
        const siblings = childrenOf(parent?.id ?? null).filter((page) => page.id !== node.id);
        const index = Number.isInteger(payload.index) ? Math.min(payload.index, siblings.length) : siblings.length;
        siblings.splice(index, 0, node);
        node.parent = parent?.id ?? null;
        siblings.forEach((page, order) => { page.order = order; });
        node.revision += 1;
        return {answer: 'applied'};
      }

      if (intent === 'record.mutate') {
        if (!capabilities.includes('row-actions')) return {answer: 'unavailable', reason: 'capability-not-provided'};
        const node = byId(payload.record_ids?.[0]);
        if (!node) return {answer: 'refused', reason: 'record-unknown'};
        const revision = payload.revisions?.[node.id];
        if (!confirming && revision !== undefined && String(revision) !== `r${node.revision}`) {
          return {answer: 'conflict', reason: 'stale-revision', current_revision: `r${node.revision}`};
        }
        const [verb, locale] = String(payload.action_id ?? '').split(':');
        if (LOCALES.includes(locale)) {
          node.publication[locale] = {publish: 'published', unpublish: 'draft', archive: 'archived'}[verb] ?? node.publication[locale];
        } else if (verb === 'rename') {
          node.title = `${node.title} (переименовано)`;
        } else {
          return {answer: 'refused', reason: 'action-unknown'};
        }
        node.revision += 1;
        return {answer: 'applied', data: {records: [asRow(node)]}};
      }

      // The checked pages, all or nothing. A bulk action has its own id in the
      // host (`publish-ru`, not the row's `publish:ru`): the pagination reads
      // its list from an attribute, where a colon separates the id from its
      // label.
      if (intent === 'bulk.apply_selected') {
        const ids = (payload.record_ids ?? []).map(String);
        const found = ids.map((id) => byId(id));
        if (!ids.length || found.some((node) => !node)) {
          return {answer: 'refused', reason: 'record-unknown', records: ids.filter((id) => !byId(id))};
        }
        const [verb, locale] = String(payload.action_id ?? '').split('-');
        const state = {publish: 'published', unpublish: 'draft', archive: 'archived'}[verb];
        if (!state || !LOCALES.includes(locale)) return {answer: 'refused', reason: 'action-unknown'};
        const revisions = payload.revisions ?? {};
        const conflicts = found
          .filter((node) => revisions[node.id] !== undefined && String(revisions[node.id]) !== `r${node.revision}`)
          .map((node) => ({id: node.id, current_revision: `r${node.revision}`}));
        if (conflicts.length) {
          return {answer: 'conflict', reason: 'stale-revision', conflicts, current_revision: conflicts[0].current_revision};
        }
        for (const node of found) {
          node.publication[locale] = state;
          node.revision += 1;
        }
        return {answer: 'applied', data: {records: found.map((node) => asRow(node))}};
      }

      if (intent === 'record.open') {
        const node = byId(payload.record_ids?.[0] ?? payload.record_id);
        return node ? {answer: 'applied', record_id: node.id} : {answer: 'refused', reason: 'record-unknown'};
      }

      if (intent === 'view.create_record') {
        if (payload.parent !== undefined && payload.parent !== null && !byId(payload.parent)) {
          return {answer: 'refused', reason: 'target-unknown'};
        }
        return {answer: 'applied', parent: payload.parent ?? null};
      }

      return {answer: 'unavailable', reason: 'capability-not-provided'};
    },
  };
};
