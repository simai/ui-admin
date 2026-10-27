// The polygon's host: one module that answers the data view port over the
// dataset, doing the work a backend does.
//
// A fixture that answers «applied» to everything is a drawing of a host. This
// one actually searches, filters, sorts, pages, counts, mutates with revisions,
// keeps column settings in layers and keeps saved views — so what the page shows
// is the Framework reacting to real answers, and a consumer has something to
// copy rather than something to read (owner, 2026-10-10: «желательно чтобы была
// реализована интерактивность чтобы можно было смотреть как все взаимодействует
// и работает... важно чтобы потом ларена могла использовать это все для своей
// админки и могла использовать с бекендом»).
//
// Larena's own ports are the same shape: a thin adapter over a gateway. The
// dataset is behind `source`, so swapping this fixture for an HTTP call is one
// object, not a rewrite — which is the whole point of keeping the data in a file
// and the answers in code.
//
// Plain JavaScript so the page, the conformance runner and the checks import the
// same module with no build step between them.

const copy = (value) => (value === undefined ? value : JSON.parse(JSON.stringify(value)));

const PER_PAGE_DEFAULT = 20;

/** The field index: what a key means, used by filtering, sorting and the cells. */
const indexFields = (structure) => {
  const byKey = new Map();
  for (const field of structure.fields ?? []) byKey.set(field.key, field);
  return byKey;
};

const scalar = (value) => {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.length ? value : null;
  if (typeof value === 'object') return value.value ?? value.label ?? null;
  return value;
};

const sortableValue = (field, value) => {
  const raw = scalar(value);
  if (raw === null) return null;
  switch (field?.property_type) {
    case 'integer':
    case 'number':
      return Number(raw);
    case 'boolean':
      return raw ? 1 : 0;
    case 'date':
    case 'datetime':
      return String(raw);
    case 'user':
    case 'record':
    case 'relation':
      return String(value?.label ?? raw);
    default:
      return String(raw).toLocaleLowerCase('ru');
  }
};

const searchableText = (structure, record) => {
  const parts = [];
  for (const field of structure.fields ?? []) {
    const value = record.values[field.key];
    if (value === null || value === undefined) continue;
    if (typeof value === 'object') {
      if (Array.isArray(value)) parts.push(...value.map((item) => String(item?.label ?? item)));
      else parts.push(String(value.label ?? value.value ?? ''));
    } else if (typeof value !== 'boolean') {
      parts.push(String(value));
    }
  }
  return parts.join(' ').toLocaleLowerCase('ru');
};

/**
 * One filter against one record. The operators are the ones the Framework's
 * filter controls produce; anything else is rejected by name rather than
 * quietly ignored, which is what `filters_rejected` in the echo is for.
 */
const OPERATORS = {
  in: (value, filter) => {
    const wanted = (filter.values ?? []).map(String);
    if (!wanted.length) return true;
    if (Array.isArray(value)) return value.some((item) => wanted.includes(String(scalar(item))));
    return wanted.includes(String(scalar(value)));
  },
  eq: (value, filter) => String(scalar(value) ?? '') === String(filter.value ?? ''),
  contains: (value, filter) => String(scalar(value) ?? '').toLocaleLowerCase('ru')
    .includes(String(filter.value ?? '').toLocaleLowerCase('ru')),
  startsWith: (value, filter) => String(scalar(value) ?? '').toLocaleLowerCase('ru')
    .startsWith(String(filter.value ?? '').toLocaleLowerCase('ru')),
  gt: (value, filter) => Number(scalar(value)) > Number(filter.value),
  gte: (value, filter) => Number(scalar(value)) >= Number(filter.value),
  lt: (value, filter) => Number(scalar(value)) < Number(filter.value),
  lte: (value, filter) => Number(scalar(value)) <= Number(filter.value),
  between: (value, filter) => {
    const raw = scalar(value);
    if (raw === null) return false;
    const [from, to] = [filter.from ?? filter.min, filter.to ?? filter.max];
    const numeric = typeof raw === 'number';
    const left = from === undefined || from === null || (numeric ? Number(raw) >= Number(from) : String(raw) >= String(from));
    const right = to === undefined || to === null || (numeric ? Number(raw) <= Number(to) : String(raw) <= String(to));
    return left && right;
  },
  is: (value, filter) => Boolean(scalar(value)) === Boolean(filter.value),
  empty: (value) => scalar(value) === null,
  filled: (value) => scalar(value) !== null,
};

// The polygon's deliberate refusals, worded so a visitor reads them as the
// demonstration they are rather than as a defect: four records nobody may
// change (their title ends in «Нет прав») and pinning, which the personal
// layer may not do (owner, 2026-10-19).
const LOCKED_RECORD = 'Нет прав: эта запись в демо только для чтения';
const PIN_REFUSED = 'Нет прав: в демо закреплять колонки может только администратор — закрепление видят все';

export const createPolygonHost = ({
  dataset,
  // What this actor may do. Absent capabilities are answered as absent rather
  // than as a refusal, because they are two different facts for a consumer.
  capabilities = [
    'row-actions', 'saved-views', 'shared-saved-views',
    'shared-column-settings', 'bulk-under-filter', 'count-on-request',
    // Port 1.10.0: creating and personal column settings are announced too.
    'create-record', 'personal-column-settings',
  ],
  // The scenario switch: a polygon has to be able to be an empty list, a
  // forbidden one and a broken one, because those are the states a consumer
  // handles worst and sees least.
  scenario = 'default',
  latencyMs = 0,
} = {}) => {
  if (!dataset?.structure) throw new Error('the polygon host needs a dataset');

  const structure = copy(dataset.structure);
  const fields = indexFields(structure);
  const state = {
    records: copy(dataset.records),
    // The hand-made order's revision (port 1.11.0, record.reorder).
    orderRevision: 'o1',
    settings: {
      package: { revision: 'pkg-1', columns: {} },
      shared: { revision: 'shared-1', columns: {} },
      personal: { revision: 'personal-1', columns: {} },
    },
    views: [
      {
        key: 'view-active', label: 'В работе', revision: 'v1', level: 'shared',
        query: { filters: { status: { operator: 'in', values: ['active', 'review'] } }, search: '', sort: [{ key: 'released', direction: 'desc' }] },
        roles: {}, layout: { columns: [] }, settings: { filter_fields: structure.list.filter_fields },
      },
      {
        key: 'view-mine', label: 'Мои', revision: 'v1', level: 'personal',
        query: { filters: { owner: { operator: 'in', values: ['u-igor'] } }, search: '', sort: [] },
        roles: {}, layout: { columns: [] }, settings: { filter_fields: structure.list.filter_fields },
      },
    ],
    sequence: 0,
    lastAnswered: 0,
  };

  const wait = () => (latencyMs > 0 ? new Promise((resolve) => setTimeout(resolve, latencyMs)) : null);

  const visibleRecords = () => (scenario === 'empty' ? [] : state.records);

  // The column vocabulary the port declares -- in the port's own words, snake
  // case, with no component's spelling in sight. It used to have to be written
  // twice, `property_type` for the contract and `propertyType` because that is
  // what the component read, which is the gap this polygon found and port 1.7.0
  // closed (2026-10-10).
  const columns = () => (structure.list.columns ?? []).map((column) => {
    const field = fields.get(column.key) ?? {};
    return {
      key: column.key,
      label: field.label ?? column.key,
      visible: column.visible ?? true,
      sortable: Boolean(column.sortable),
      ...(column.width ? { width: column.width } : {}),
      ...(column.pinned ? { sticky: 'start', role: 'title' } : {}),
      property_type: field.property_type,
      ...(field.options ? { options: field.options } : {}),
      ...(field.variant ? { variant: field.variant } : {}),
      ...(field.language ? { language: field.language } : {}),
      ...(field.multiple ? { multiple: field.multiple } : {}),
    };
  });

  /** A row as the table reads one: the values flattened beside id and permissions. */
  // Port 1.11.0: with inline-edit an editable record names the booleans a
  // person writes in place; «public» rewrites what visitors see, so it is
  // confirmed first.
  const INLINE_FIELDS = ['public', 'deprecated'];
  const CONFIRM_FIRST = new Set(['public']);
  const asRow = (record) => ({
    id: record.record_id,
    revision: record.revision,
    actions: record.actions ?? ['view'],
    ...(capabilities.includes('inline-edit') && record.editable !== false ? { editable: INLINE_FIELDS } : {}),
    ...record.values,
  });

  const applyQuery = (query = {}) => {
    const chosen = copy(query.filters ?? {}) ?? {};
    const applied = {};
    const rejected = [];
    const allowed = new Set(structure.list.filter_fields ?? []);

    for (const [key, filter] of Object.entries(chosen)) {
      const operator = String(filter?.operator ?? 'in');
      if (!allowed.has(key) || !fields.has(key) || !OPERATORS[operator]) {
        rejected.push(key);
        continue;
      }
      applied[key] = filter;
    }

    const search = String(query.search ?? '').trim().toLocaleLowerCase('ru');
    let rows = visibleRecords().filter((record) => {
      for (const [key, filter] of Object.entries(applied)) {
        if (!OPERATORS[String(filter.operator ?? 'in')](record.values[key], filter)) return false;
      }
      return !search || searchableText(structure, record).includes(search);
    });

    const sort = (Array.isArray(query.sort) && query.sort.length
      ? query.sort
      : [structure.list.default_sort].filter(Boolean).map((item) => ({ key: item.field, direction: item.direction })))
      .filter((item) => item?.key && fields.has(item.key));

    for (const { key, direction } of [...sort].reverse()) {
      const field = fields.get(key);
      rows = [...rows].sort((left, right) => {
        const a = sortableValue(field, left.values[key]);
        const b = sortableValue(field, right.values[key]);
        // An empty value sorts last in both directions: a column sorted
        // ascending that leads with twenty blanks tells a reader nothing.
        if (a === null && b === null) return 0;
        if (a === null) return 1;
        if (b === null) return -1;
        const order = a < b ? -1 : (a > b ? 1 : 0);
        return direction === 'desc' ? -order : order;
      });
    }

    const perPage = Number(query.per_page ?? structure.list.per_page ?? PER_PAGE_DEFAULT);
    const page = Math.max(1, Number(query.page ?? 1));
    const window = rows.slice((page - 1) * perPage, page * perPage);

    return { chosen, applied, rejected, search: String(query.search ?? ''), sort, page, perPage, rows, window };
  };

  const answerQuery = (query, sequence, extra = {}) => {
    const result = applyQuery(query);
    return {
      answer: 'applied',
      sequence,
      data: {
        columns: columns(),
        records: result.window.map(asRow),
        // The count is a capability: a host that cannot count says so by
        // sending has_next instead, and the view then offers no total.
        ...(capabilities.includes('count-on-request')
          ? { total: result.rows.length }
          : { has_next: result.page * result.perPage < result.rows.length }),
        has_next: result.page * result.perPage < result.rows.length,
        echo: {
          filters_chosen: result.chosen,
          filters: result.applied,
          filters_rejected: result.rejected,
          search: result.search,
          sort: result.sort.map(({ key, direction }) => ({ key, direction })),
          page: result.page,
          per_page: result.perPage,
          ...(extra.switch ? { switch: extra.switch } : {}),
        },
        column_settings: {
          layers: copy(state.settings),
          target: { kind: extra.savedView ? 'saved_view' : 'personal', revision: extra.savedView
            ? state.views.find((view) => view.key === extra.savedView)?.revision ?? 'v1'
            : state.settings.personal.revision, key: extra.savedView ?? null },
        },
        ...(capabilities.includes('saved-views') ? { saved_views: copy(state.views) } : {}),
      },
    };
  };

  const record = (id) => state.records.find((item) => item.record_id === String(id));

  // How this host formats a number or a date. The renderer set asks the host and
  // never guesses, which is right -- a thousands separator and a month's name
  // are a consumer's decision, not a framework's -- and until port 1.7.0 a cell
  // had no host to ask, so a list showed stored timestamps while the record
  // panel beside it showed readable dates.
  const formatFieldValue = (field, value) => {
    const type = field?.property_type ?? field?.propertyType;
    if (value === null || value === undefined || value === '') return '';
    if (type === 'date') {
      return new Date(`${String(value)}T00:00:00`).toLocaleDateString('ru-RU',
        {day: 'numeric', month: 'long', year: 'numeric'});
    }
    if (type === 'datetime') {
      return new Date(String(value)).toLocaleString('ru-RU',
        {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'});
    }
    if (type === 'number' || type === 'integer') {
      const number = Number(value);
      return Number.isFinite(number) ? number.toLocaleString('ru-RU') : '';
    }
    return undefined;
  };

  return {
    version: '1.12.0',
    capabilities,
    formatFieldValue,
    // Read by the page so the panel and the list agree on one dataset.
    structure,
    get records() { return state.records; },

    async raise(intent, payload = {}) {
      await wait();

      if (scenario === 'unavailable') {
        return { answer: 'unavailable', reason: 'host-down', message: 'Источник данных недоступен' };
      }
      if (scenario === 'forbidden') {
        return { answer: 'refused', reason: 'access-denied', message: 'Нет доступа к списку' };
      }

      if (intent === 'query.change') {
        const sequence = Number(payload.sequence ?? 0);
        // An answer to a question already superseded is worse than no answer:
        // it redraws the list with the previous filter.
        if (sequence < state.lastAnswered) return { answer: 'applied', sequence, dropped: true };
        state.lastAnswered = sequence;
        return answerQuery(payload.query ?? {}, sequence);
      }

      if (intent === 'query.count') {
        if (!capabilities.includes('count-on-request')) {
          return { answer: 'unavailable', reason: 'capability-not-provided' };
        }
        return { answer: 'applied', data: { total: applyQuery(payload.query ?? {}).rows.length } };
      }

      if (intent === 'record.open') {
        const found = record(payload.record_id ?? payload.record_ids?.[0]);
        if (!found) return { answer: 'refused', reason: 'record-unknown' };
        return { answer: 'applied', record_id: found.record_id };
      }

      if (intent === 'record.mutate' || intent === 'bulk.apply_selected') {
        if (!capabilities.includes('row-actions') && intent === 'record.mutate') {
          return { answer: 'unavailable', reason: 'capability-not-provided' };
        }
        const action = String(payload.action_id ?? '');
        const ids = (payload.record_ids ?? []).map(String);
        const revisions = payload.revisions ?? {};
        const targets = ids.map((id) => ({ id, found: record(id) }));

        const unknown = targets.filter((item) => !item.found).map((item) => item.id);
        if (unknown.length) return { answer: 'refused', reason: 'record-unknown', records: unknown };

        // All or nothing, and the stale ones are named: a bulk action that
        // half-applies leaves a person unable to say what happened.
        const stale = targets.filter(({ id, found }) => Object.prototype.hasOwnProperty.call(revisions, id)
          && String(revisions[id]) !== String(found.revision));
        if (stale.length) {
          // The names are the kit's, not invented here: a conflict on one
          // record carries `current_revision` and a batch carries `conflicts`.
          // Answering with a shape of one's own is how a consumer ends up
          // unable to tell the person which record moved (kit cases
          // record-mutate-conflict and bulk-selected-all-or-nothing).
          const conflicts = stale.map(({ found }) => ({ id: found.record_id, current_revision: found.revision }));
          return {
            answer: 'conflict', reason: 'stale-revision',
            conflicts,
            current_revision: conflicts[0].current_revision,
            message: 'Записи изменились, обновите список',
          };
        }

        const locked = targets.filter(({ found }) => found.editable === false);
        if (locked.length && action !== 'view') {
          return {
            answer: 'refused', reason: 'access-denied',
            records: locked.map(({ found }) => found.record_id),
            message: LOCKED_RECORD,
          };
        }

        // A delete is asked first, as the real Larena host asks: the first
        // call is refused with `confirm_required`, a digest of what is about to
        // go and a sentence a person can read; the same call carrying that
        // digest applies. The digest names the records and their revisions, so
        // a confirmation given for one state of the list does not delete
        // another (docs review, round 4, 2026-10-20). The data view shows its
        // «Подтвердите изменение» between the two calls.
        if (action === 'delete') {
          const digest = `delete:${ids.join(',')}:${targets.map(({ found }) => found.revision).join(',')}`;
          if (payload.confirm !== digest) {
            return {
              answer: 'refused', reason: 'confirm_required',
              data: { confirm: { digest,
                summary: ids.length === 1 ? 'Запись будет удалена.' : `Будут удалены записи: ${ids.length}.` } },
            };
          }
          for (const { found } of targets) {
            found.deleted = true;
            found.revision = Number(found.revision) + 1;
          }
          state.records = state.records.filter((item) => !item.deleted);
          return { answer: 'applied', removed: ids };
        }

        if (action === 'restore' || action === 'publish' || action === 'unpublish' || action === 'edit') {
          for (const { found } of targets) {
            if (action === 'publish') found.values.public = true;
            if (action === 'unpublish') found.values.public = false;
            found.revision = Number(found.revision) + 1;
          }
          // The records as they now are, so the view writes the rows in place
          // instead of asking for the page again.
          return { answer: 'applied', records: targets.map(({ found }) => asRow(found)) };
        }

        return { answer: 'applied', records: targets.map(({ found }) => asRow(found)) };
      }

      // Port 1.11.0: one boolean written in its cell.
      if (intent === 'record.set') {
        if (!capabilities.includes('inline-edit')) return { answer: 'unavailable', reason: 'capability-not-provided' };
        const found = record(payload.record_id);
        if (!found) return { answer: 'refused', reason: 'record-unknown' };
        if (found.editable === false || !INLINE_FIELDS.includes(String(payload.key))) {
          return { answer: 'refused', reason: 'access-denied', message: 'Это поле здесь не меняется' };
        }
        if (payload.revision !== undefined && payload.revision !== null && String(payload.revision) !== String(found.revision)) {
          return { answer: 'conflict', reason: 'stale-revision', current_revision: found.revision };
        }
        const digest = `set:${found.record_id}:${payload.key}:${payload.value}:${found.revision}`;
        if (CONFIRM_FIRST.has(String(payload.key)) && payload.confirm !== digest) {
          return { answer: 'refused', reason: 'confirm_required', data: { confirm: { digest,
            summary: payload.value ? 'Запись станет видна посетителям сайта.' : 'Запись перестанет быть видна посетителям сайта.' } } };
        }
        found.values[payload.key] = payload.value === true;
        found.revision = Number(found.revision) + 1;
        return { answer: 'applied', data: { records: [asRow(found)] } };
      }

      // Port 1.11.0: the list put in order by hand.
      if (intent === 'record.reorder') {
        if (!capabilities.includes('row-reorder')) return { answer: 'unavailable', reason: 'capability-not-provided' };
        if (payload.revision !== undefined && payload.revision !== null && String(payload.revision) !== state.orderRevision) {
          return { answer: 'conflict', reason: 'stale-revision', current_revision: state.orderRevision };
        }
        const ids = (payload.record_ids ?? []).map(String);
        const moving = state.records.filter((item) => ids.includes(item.record_id));
        if (!ids.length || moving.length !== ids.length) return { answer: 'refused', reason: 'record-unknown' };
        const rest = state.records.filter((item) => !ids.includes(item.record_id));
        const at = payload.before === null || payload.before === undefined
          ? rest.length
          : rest.findIndex((item) => item.record_id === String(payload.before));
        if (at < 0) return { answer: 'refused', reason: 'record-unknown' };
        state.records = [...rest.slice(0, at), ...moving, ...rest.slice(at)];
        state.orderRevision = `o${Number(state.orderRevision.slice(1)) + 1}`;
        return { answer: 'applied' };
      }

      if (intent === 'bulk.apply_under_filter') {
        if (!capabilities.includes('bulk-under-filter')) {
          return { answer: 'unavailable', reason: 'capability-not-provided' };
        }
        // `filters` and `confirmed_total` are the port's own words for this
        // intent; it does not carry a whole query.
        const matched = applyQuery({ filters: payload.filters ?? {} }).rows;
        // The number first, and the act only when the caller has confirmed it:
        // «apply to everything under the filter» is the one action nobody can
        // undo by hand.
        if (payload.confirmed_total === undefined || payload.confirmed_total === null) {
          return { answer: 'applied', data: { total: matched.length }, confirmation_required: true };
        }
        if (Number(payload.confirmed_total) !== matched.length) {
          return { answer: 'conflict', reason: 'count-changed', current_total: matched.length, data: { total: matched.length } };
        }
        for (const item of matched) item.revision = Number(item.revision) + 1;
        return { answer: 'applied', data: { total: matched.length } };
      }

      if (intent === 'view.create_record') {
        if (!capabilities.includes('create-record')) {
          return { answer: 'unavailable', reason: 'capability-not-provided' };
        }
        const kind = String(payload.kind ?? structure.structure_id);
        if (kind !== structure.structure_id) return { answer: 'refused', reason: 'unknown-kind' };
        const index = state.records.length + 1;
        const created = {
          record_id: `r-new-${index}`, revision: 1, label: 'Новое решение', editable: true,
          actions: ['view', 'edit', 'delete'],
          values: Object.fromEntries((structure.fields ?? []).map((field) => [
            field.key,
            field.property_type === 'boolean' ? false : (field.multiple ? [] : null),
          ])),
        };
        created.values.title = 'Новое решение';
        created.values.code = `simai.new.${index}`;
        created.values.status = 'active';
        state.records.unshift(created);
        return { answer: 'applied', record_id: created.record_id, records: [asRow(created)] };
      }

      if (intent === 'settings.save_personal' || intent === 'settings.save_shared') {
        const shared = intent === 'settings.save_shared';
        // Not connected here is a different fact from not allowed: without the
        // capability the view explains rather than showing a button that fails
        // (kit case settings-shared-needs-permission).
        if (!shared && !capabilities.includes('personal-column-settings')) {
          return { answer: 'unavailable', reason: 'capability-not-provided' };
        }
        if (shared && !capabilities.includes('shared-column-settings')) {
          return { answer: 'unavailable', reason: 'capability-not-provided', message: 'Общие настройки здесь не подключены' };
        }
        const settings = payload.columnSettings ?? payload.columns ?? {};
        // Pinning is a decision for everyone, so the personal layer cannot make
        // it by writing its own (kit case settings-shared-only-field).
        if (!shared) {
          const pinning = Object.entries(settings)
            .filter(([, options]) => options && Object.prototype.hasOwnProperty.call(options, 'pinned'))
            .map(([key]) => key);
          if (pinning.length) {
            return {
              answer: 'refused', reason: 'shared-only-field', fields: pinning,
              message: PIN_REFUSED,
            };
          }
        }
        const layer = state.settings[shared ? 'shared' : 'personal'];
        const base = payload.base_revision ?? payload.target?.revision;
        if (base && String(base) !== String(layer.revision)) {
          return { answer: 'conflict', reason: 'stale-revision', current_revision: layer.revision, columns: copy(layer.columns) };
        }
        layer.columns = copy(settings);
        layer.revision = `${shared ? 'shared' : 'personal'}-${Number(String(layer.revision).split('-')[1]) + 1}`;
        return { answer: 'applied', revision: layer.revision };
      }

      if (intent === 'view.open') {
        if (!capabilities.includes('saved-views')) return { answer: 'unavailable', reason: 'capability-not-provided' };
        const view = state.views.find((item) => item.key === String(payload.key ?? payload.saved_view_id ?? ''));
        if (!view) return { answer: 'refused', reason: 'unknown-view' };
        // What the switch carried over and what it dropped: a filter on a field
        // the new view does not offer cannot travel, and silently losing it is
        // how a person ends up reading the wrong list.
        const incoming = payload.query ?? {};
        const allowed = new Set(view.settings?.filter_fields ?? []);
        const dropped = Object.keys(incoming.filters ?? {}).filter((key) => !allowed.has(key));
        const query = {
          ...view.query,
          filters: { ...view.query.filters },
        };
        return {
          ...answerQuery(query, Number(payload.sequence ?? state.lastAnswered + 1), {
            savedView: view.key,
            switch: { query: copy(query), dropped },
          }),
        };
      }

      if (intent === 'view.save' || intent === 'view.save_shared') {
        const shared = intent === 'view.save_shared';
        if (!capabilities.includes('saved-views')) return { answer: 'unavailable', reason: 'capability-not-provided' };
        // Writing a view for everyone is its own capability, and its absence is
        // «not connected», not «not allowed» (kit case
        // view-save-shared-needs-permission).
        if (shared && !capabilities.includes('shared-saved-views')) {
          return { answer: 'unavailable', reason: 'capability-not-provided', message: 'Общие виды здесь не подключены' };
        }
        const key = String(payload.key ?? payload.saved_view_id ?? '');
        const existing = state.views.find((item) => item.key === key);
        const base = payload.base_revision ?? payload.revision;
        if (existing && base && String(base) !== String(existing.revision)) {
          return { answer: 'conflict', reason: 'stale-revision', current_revision: existing.revision, view: copy(existing) };
        }
        const next = {
          key: key || `view-${state.views.length + 1}`,
          label: String(payload.label ?? existing?.label ?? 'Новый вид'),
          revision: `v${Number(String(existing?.revision ?? 'v0').slice(1)) + 1}`,
          level: shared ? 'shared' : 'personal',
          query: copy(payload.query ?? existing?.query ?? {}),
          roles: copy(payload.roles ?? existing?.roles ?? {}),
          layout: copy(payload.layout ?? existing?.layout ?? { columns: [] }),
          // The fields the view offers to filter on travel with it: a view saved
          // with a filter nobody can reach again is a view that cannot be
          // undone.
          settings: copy(payload.settings ?? existing?.settings ?? { filter_fields: structure.list.filter_fields }),
        };
        if (existing) Object.assign(existing, next);
        else state.views.push(next);
        return { answer: 'applied', key: next.key, revision: next.revision, saved_views: copy(state.views) };
      }

      if (intent === 'view.delete') {
        if (!capabilities.includes('saved-views')) return { answer: 'unavailable', reason: 'capability-not-provided' };
        const key = String(payload.key ?? payload.saved_view_id ?? '');
        const view = state.views.find((item) => item.key === key);
        if (!view) return { answer: 'refused', reason: 'unknown-view' };
        if (view.level === 'shared' && !capabilities.includes('shared-saved-views')) {
          return { answer: 'refused', reason: 'access-denied' };
        }
        state.views.splice(state.views.indexOf(view), 1);
        return { answer: 'applied', saved_views: copy(state.views) };
      }

      if (intent === 'list.open') {
        // Opening the capped list is the host's: it answers with where the whole
        // list lives rather than the view guessing a URL.
        return { answer: 'applied', href: `/polygon.html?structure=${encodeURIComponent(structure.structure_id)}` };
      }

      return { answer: 'unavailable', reason: 'unknown-intent' };
    },

    // The record panel's port, over the same records the list is reading. Two
    // ports and one state, which is how Larena has it: CmsPropertyViewPort and
    // StorageWorkbenchDataviewPort are both thin adapters over one gateway. It
    // matters here for one visible reason -- a value saved in the panel is the
    // value the list shows on its next answer, so the polygon shows the two
    // components interacting rather than each one working alone.
    propertyView({ capabilities: panelCapabilities = [
      'field-options', 'field-upload', 'view-settings', 'shared-view-settings',
      // Not 'record-open': the admin reads a record in the panel and has no
      // page of its own to open it on, so the control did nothing a person
      // needed (owner, 2026-10-12). A host with record pages claims it.
    ], profiles: startingProfiles,
    // Where a record lives, as an address a person can copy and open. The host
    // knows its own routes; Larena's are paths because it has a server, and
    // this polygon's are a query because it is static.
    recordAddress = (id) => `/?record=${encodeURIComponent(id)}`,
    } = {}) {
      // `profiles` is here so a caller can stand the panel up with a list of
      // its own -- one shared view, say, which is the state in which removing it
      // is refused and which no sequence of calls on the default list reaches.
      const profiles = startingProfiles ?? [
        { id: 'default', label: 'Обычный', shared: true },
        { id: 'expert', label: 'Экспертный', shared: true },
        { id: 'mine', label: 'Персональный', shared: false },
      ];
      const emptyLayer = () => ({ schema_version: 1, sections: {}, groups: {}, fields: {} });
      const panel = {
        profiles: copy(profiles),
        profile: profiles[0].id,
        // The arrangement, by layer. The package layer is the structure as it
        // was declared; a person arranges over it in their own layer, and an
        // administrator in the shared one.
        views: {
          personal: { revision: 'personal-1', view: emptyLayer() },
          shared: { revision: 'shared-1', view: emptyLayer() },
        },
        target: 'personal',
        next: 4,
      };

      // The port's record: the structure's own sections and groups, each field
      // carrying the value this record holds. The arrangement is the structure's
      // and the values are the record's, which is the split the port is built
      // around -- and the reason one dataset can answer both ports.
      const project = (found) => ({
        record_id: found.record_id,
        collection: structure.structure_id,
        revision: found.revision,
        label: found.label ?? found.values.title ?? found.record_id,
        editable: found.editable !== false,
        // What this actor may do with it (port 1.12.0): a read-only record is
        // sent nothing, so the panel offers no way to change it.
        actions: found.editable === false ? [] : ['record.edit'],
        // The record's own address. The panel draws its copy-link control on
        // this alone, and offers to open the record as a page when the host
        // also claims `record-open` — an address worth copying does not
        // promise a page. Without it both controls are simply absent, which is
        // what this polygon looked like until the owner noticed the link was
        // missing beside the close button (2026-10-10).
        address: recordAddress(found.record_id),
        sections: (structure.sections ?? []).map((section) => ({
          key: section.key,
          label: section.label,
          groups: (section.groups ?? []).map((group) => ({
            key: group.key,
            label: group.label,
            columns: group.columns ?? 2,
            fields: (group.fields ?? []).map((key) => {
              const field = fields.get(key) ?? { key };
              return {
                key: field.key,
                label: field.label ?? field.key,
                propertyType: field.property_type,
                width: field.width ?? 'half',
                ...(field.required ? { required: true } : {}),
                ...(found.editable === false ? { readonly: true } : {}),
                ...(field.options ? { options: field.options } : {}),
                ...(field.source ? { source: field.source } : {}),
                ...(field.when ? { when: copy(field.when) } : {}),
                ...(field.variant ? { variant: field.variant } : {}),
                ...(field.language ? { language: field.language } : {}),
                ...(field.multiple ? { multiple: field.multiple } : {}),
                ...(field.inheritedValue ? { inheritedValue: field.inheritedValue } : {}),
                value: copy(found.values[field.key] ?? null),
              };
            }),
          })),
        })),
      });

      // The whole `view` block, not only the named views. The panel offers to
      // arrange a record — «Настроить», «Добавить область», the bin of
      // unplaced properties — only when the host says which layers this actor
      // may write, and it reads that from `view.editable`. A host that sends
      // the profiles alone gets a panel that can be read and not arranged,
      // which is what this one was until the owner compared it with the lab
      // the arranging was built in (2026-10-10).
      const editableLayers = () => {
        const layers = [];
        if (panelCapabilities.includes('view-settings')) layers.push('personal');
        if (panelCapabilities.includes('shared-view-settings')) layers.push('shared');
        return layers;
      };

      const answerFor = (found) => {
        const record = project(found);
        const editable = editableLayers();
        record.view = {
          // Where a save goes. It stays on a layer this actor may write.
          target: editable.includes(panel.target) ? panel.target : (editable[0] ?? 'personal'),
          layers: copy(panel.views),
          editable,
          // Why a layer is refused, said in words rather than by its absence.
          denied: editable.includes('shared')
            ? {}
            : { shared: 'Общую раскладку меняет администратор' },
          profiles: copy(panel.profiles),
          profile: panel.profile,
        };
        return { answer: 'applied', record };
      };

      // The fields a write may not leave empty, and the integers it may not
      // break: the same rules for a group, a whole object and a new one.
      const validate = (values, {all = false} = {}) => {
        const errors = {};
        for (const field of structure.fields ?? []) {
          const given = Object.prototype.hasOwnProperty.call(values, field.key);
          if (!given && !all) continue;
          const value = values[field.key];
          if (field.required && (value === null || value === undefined || String(value).trim() === '')) {
            errors[field.key] = `${field.label} не может быть пустым`;
          }
          if (given && field.property_type === 'integer' && value !== null && value !== ''
              && !Number.isInteger(Number(value))) {
            errors[field.key] = 'Нужно целое число';
          }
        }
        return errors;
      };

      return {
        version: '1.15.0',
        capabilities: panelCapabilities,
        formatFieldValue,

        async raise(intent, payload = {}) {
          await wait();
          const id = String(payload.record_id ?? '');

          if (scenario === 'unavailable') {
            return { answer: 'unavailable', reason: 'host-down', message: 'Источник данных недоступен' };
          }

          // An empty object of the collection for a create: the collection's
          // arrangement, every value empty, no id and no revision.
          if (intent === 'record.load' && payload.mode === 'create') {
            const empty = answerFor({record_id: null, revision: null, label: '', values: {}});
            empty.record.record_id = null;
            empty.record.revision = null;
            empty.record.address = null;
            return empty;
          }

          if (intent === 'record.create') {
            const values = payload.values ?? {};
            const errors = validate(values, {all: true});
            if (Object.keys(errors).length) return { answer: 'refused', reason: 'validation', errors };
            const made = {
              record_id: `new-${state.records.length + 1}`, revision: 1,
              label: String(values.title ?? ''), values: Object.fromEntries(Object.entries(values).filter(([key]) => fields.has(key)).map(([key, value]) => [key, copy(value)])),
            };
            state.records.push(made);
            return { answer: 'applied', record_id: made.record_id, record: answerFor(made).record };
          }

          // Port 1.14.0: a save that changes the licence re-prices the record,
          // so the host asks first -- refused with confirm_required and a
          // digest of exactly that save; the same save re-sent with the digest
          // is applied, and a stale digest is asked again with a new one.
          const askFirst = (found, values) => {
            if (!Object.prototype.hasOwnProperty.call(values, 'licence')) return null;
            const text = JSON.stringify([intent, found.record_id, found.revision, payload.section ?? null, payload.group ?? null, values]);
            let hash = 0x811c9dc5;
            for (let index = 0; index < text.length; index += 1) {
              hash = Math.imul(hash ^ text.charCodeAt(index), 0x01000193) >>> 0;
            }
            const digest = hash.toString(16).padStart(8, '0');
            if (payload.confirm === digest) return null;
            const label = values.licence?.label ?? 'без лицензии';
            return { answer: 'refused', reason: 'confirm_required',
              confirm: { digest, summary: `Лицензия станет «${label}», и стоимость решения пересчитается. Сохранить?` } };
          };

          if (intent === 'record.save') {
            const found = record(id);
            if (!found) return { answer: 'refused', reason: 'record-unknown' };
            if (found.editable === false) {
              return { answer: 'refused', reason: 'access-denied', message: LOCKED_RECORD };
            }
            if (String(payload.revision ?? '') !== String(found.revision)) {
              return { answer: 'conflict', reason: 'stale-revision', revision: found.revision, message: 'Запись изменилась, обновите её' };
            }
            const values = payload.values ?? {};
            const errors = validate(values);
            if (Object.keys(errors).length) return { answer: 'refused', reason: 'validation', errors };
            const asked = askFirst(found, values);
            if (asked) return asked;
            for (const [key, value] of Object.entries(values)) {
              if (fields.has(key)) found.values[key] = copy(value);
            }
            if (Object.prototype.hasOwnProperty.call(values, 'title')) found.label = String(values.title ?? found.label);
            found.revision = Number(found.revision) + 1;
            return answerFor(found);
          }

          if (intent === 'record.load') {
            const found = record(id);
            if (!found) return { answer: 'refused', reason: 'record-unknown', message: 'Запись не найдена' };
            // A record the host will not let this actor read, which is a
            // different fact from an empty arrangement and has to say so.
            if (found.editable === false && scenario === 'forbidden') {
              return { answer: 'refused', reason: 'access-denied', message: 'Нет доступа к записи' };
            }
            return answerFor(found);
          }

          // One group of a record (port 1.15.0, capability `group-load`): the
          // head and arrangement record.load answers, every group with its
          // field count, and the fields of the one group asked for. The
          // revision is the record's -- the same `found.revision` record.load
          // and every group.save compare against -- because a change to one
          // group is a change to the record: a revision per group would let a
          // save of «Числа» pass against a «Основное» someone has since
          // changed, and the list beside the panel would show the other save.
          if (intent === 'group.load') {
            // Not announced, not answered: a component whose host does not
            // claim group-load reads the record whole and never asks.
            if (!panelCapabilities.includes('group-load')) {
              return { answer: 'unavailable', reason: 'capability-not-provided' };
            }
            // The record's refusals, with record.load's reasons: a group of a
            // record this actor may not read is not «a group not found».
            const found = record(id);
            if (!found) return { answer: 'refused', reason: 'record-unknown', message: 'Запись не найдена' };
            if (found.editable === false && scenario === 'forbidden') {
              return { answer: 'refused', reason: 'access-denied', message: 'Нет доступа к записи' };
            }
            const read = answerFor(found);
            // No section named: the polygon's group keys are unique, so the key
            // alone finds the group. No group named: the one the panel opens
            // on, the first group of the first section -- the component knows
            // no arrangement before its first read and must not guess a key.
            const sections = (read.record.sections ?? [])
              .filter((section) => payload.section == null || section.key === payload.section);
            const wanted = payload.group ?? null;
            let asked = null;
            for (const section of sections) {
              const group = (section.groups ?? []).find((item) => wanted === null || item.key === wanted);
              if (group) { asked = { section, group }; break; }
            }
            // A key the arrangement no longer holds -- a view changed in another
            // window -- is refused rather than drawn as an empty section, so
            // the component reads the arrangement again.
            if (!asked) {
              return { answer: 'refused', reason: 'unknown-group', message: 'Такой группы в записи нет' };
            }
            // Every other group keeps its place and its size, not its fields:
            // `fields` empty with a count is a group not read yet, and the
            // count lets the panel draw the skeleton to the size it will have.
            for (const section of read.record.sections ?? []) {
              for (const group of section.groups ?? []) {
                group.field_count = (group.fields ?? []).length;
                if (group !== asked.group) group.fields = [];
              }
            }
            return {
              ...read,
              section: asked.section.key,
              group: asked.group.key,
              revision: read.record.revision,
            };
          }

          if (intent === 'group.save') {
            const found = record(id);
            if (!found) return { answer: 'refused', reason: 'record-unknown' };
            if (found.editable === false) {
              return { answer: 'refused', reason: 'access-denied', message: LOCKED_RECORD };
            }
            // The revision the read carried -- record.load's or group.load's,
            // one and the same -- is what the write is compared against;
            // answering applied to a stale one loses somebody else's save
            // without anyone being told. The conflict names the current
            // revision (port 1.15.0) so the panel reads the record again at it.
            if (String(payload.revision ?? '') !== String(found.revision)) {
              return { answer: 'conflict', reason: 'stale-revision', revision: found.revision, message: 'Запись изменилась, обновите её' };
            }
            const values = payload.values ?? {};
            const errors = {};
            for (const field of structure.fields ?? []) {
              if (!Object.prototype.hasOwnProperty.call(values, field.key)) continue;
              const value = values[field.key];
              if (field.required && (value === null || value === undefined || String(value).trim() === '')) {
                errors[field.key] = `${field.label} не может быть пустым`;
              }
              if (field.property_type === 'integer' && value !== null && value !== ''
                  && !Number.isInteger(Number(value))) {
                errors[field.key] = 'Нужно целое число';
              }
            }
            if (Object.keys(errors).length) return { answer: 'refused', reason: 'validation', errors };
            const asked = askFirst(found, values);
            if (asked) return asked;

            for (const [key, value] of Object.entries(values)) {
              if (fields.has(key)) found.values[key] = copy(value);
            }
            if (Object.prototype.hasOwnProperty.call(values, 'title')) {
              found.label = String(values.title ?? found.label);
            }
            found.revision = Number(found.revision) + 1;
            return answerFor(found);
          }

          if (intent === 'field.options') {
            if (!panelCapabilities.includes('field-options')) {
              return { answer: 'unavailable', reason: 'capability-not-provided' };
            }
            const field = fields.get(String(payload.field ?? ''));
            if (!field) return { answer: 'refused', reason: 'unknown-field' };
            const search = String(payload.search ?? '').toLocaleLowerCase('ru');
            const pool = field.options
              ?? (field.source ? dataset.references[field.source] : null)
              ?? (field.property_type === 'user' ? dataset.references.users
                : field.property_type === 'relation' ? dataset.references.relations
                  : dataset.references.sections);
            const matching = (pool ?? []).filter((option) => !search
              || String(option.label ?? '').toLocaleLowerCase('ru').includes(search));
            // One page, not every candidate: a host that answers with all of
            // them makes the component's paging meaningless.
            // The port's page is `items` of {value, label} and nothing else: the
            // picker reads that key, and a page under any other name shows an
            // empty list however many candidates match.
            const page = matching.slice(0, 5);
            return {
              answer: 'applied',
              options_page: {
                items: page.map((option) => ({ value: option.value, label: String(option.label ?? option.value) })),
                next_cursor: matching.length > page.length ? String(page.length) : null,
              },
            };
          }

          if (intent === 'field.upload') {
            if (!panelCapabilities.includes('field-upload')) {
              return { answer: 'refused', reason: 'capability-not-provided' };
            }
            const file = payload.file ?? {};
            if (Number(file.size ?? 0) > 16 * 1024 * 1024) {
              return { answer: 'refused', reason: 'file-too-large', message: 'Файл больше 16 МБ' };
            }
            return {
              answer: 'applied',
              file: {
                value: `u-${Date.now()}`,
                label: String(file.name ?? 'file'),
                mime: String(file.type ?? 'application/octet-stream'),
                size: Number(file.size ?? 0),
                href: '/logo.svg',
              },
            };
          }

          if (intent === 'record.open') return { answer: 'applied' };

          if (intent === 'view.profile' || intent === 'view.create'
              || intent === 'view.rename' || intent === 'view.delete') {
            if (!panelCapabilities.includes('view-settings')) {
              return { answer: 'unavailable', reason: 'capability-not-provided' };
            }
            const found = record(id) ?? state.records[0];
            const wanted = String(payload.profile ?? '');

            if (intent === 'view.profile') {
              const profile = panel.profiles.find((item) => item.id === wanted);
              if (!profile) return { answer: 'refused', reason: 'unknown-view' };
              panel.profile = profile.id;
              return answerFor(found);
            }

            if (intent === 'view.create') {
              if (payload.shared && !panelCapabilities.includes('shared-view-settings')) {
                return { answer: 'refused', reason: 'access-denied', message: 'Общий вид заводит администратор' };
              }
              const profile = { id: `view-${panel.next++}`, label: String(payload.label ?? 'Новый вид'), shared: Boolean(payload.shared) };
              panel.profiles.push(profile);
              panel.profile = profile.id;
              return answerFor(found);
            }

            const profile = panel.profiles.find((item) => item.id === wanted);
            if (!profile) return { answer: 'refused', reason: 'unknown-view' };

            if (intent === 'view.rename') {
              // The label and nothing else: the id is what anything pointing at
              // this view points at.
              profile.label = String(payload.label ?? profile.label);
              return answerFor(found);
            }

            // The last shared one stays: a scope with none has nothing for a
            // person who has made none of their own.
            if (profile.shared && panel.profiles.filter((item) => item.shared).length < 2) {
              return { answer: 'refused', reason: 'last-shared-view', message: 'Это единственный общий вид' };
            }
            panel.profiles.splice(panel.profiles.indexOf(profile), 1);
            if (panel.profile === profile.id) panel.profile = panel.profiles[0]?.id ?? null;
            return answerFor(found);
          }

          if (intent === 'view.save') {
            if (!panelCapabilities.includes('view-settings')) {
              return { answer: 'unavailable', reason: 'capability-not-provided' };
            }
            const target = payload.target ?? {};
            if (target.kind === 'shared' && !panelCapabilities.includes('shared-view-settings')) {
              return { answer: 'refused', reason: 'access-denied', message: 'Общий вид меняет администратор' };
            }
            const kind = String(target.kind ?? 'personal');
            const stored = panel.views[kind] ?? { revision: `${kind}-1`, view: emptyLayer() };
            if (target.revision && String(target.revision) !== String(stored.revision)) {
              // The conflict carries the stored layer, not only its revision:
              // without it the component draws an arrangement that is no longer
              // the one on the server.
              return { answer: 'conflict', reason: 'stale-revision', revision: stored.revision, view: copy(stored.view) };
            }
            const step = Number(String(stored.revision).split('-')[1] ?? 1) + 1;
            panel.views[kind] = { revision: `${kind}-${step}`, view: copy(payload.view ?? emptyLayer()) };
            panel.target = kind;
            return { answer: 'applied', revision: panel.views[kind].revision };
          }

          if (intent === 'view.reset') {
            if (!panelCapabilities.includes('view-settings')) {
              return { answer: 'unavailable', reason: 'capability-not-provided' };
            }
            // Resetting puts the layer back to the package's arrangement, which
            // is an empty layer: the structure as it was declared.
            const kind = String(payload.target?.kind ?? panel.target);
            panel.views[kind] = { revision: `${kind}-1`, view: emptyLayer() };
            return { answer: 'applied', revision: panel.views[kind].revision, view: emptyLayer() };
          }

          return { answer: 'unavailable', reason: 'unknown-intent' };
        },
      };
    },
  };
};
