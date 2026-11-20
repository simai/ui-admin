// The parts of simai.property-view-port 1.21.0 and 1.22.0 both record hosts of
// this reference answer the same way: a record's change history a page at a
// time (`record.history`, capability `record-history`), publishing a person's
// layer for everyone (`view.publish`) and locking one setting below the shared
// layer (`view.lock`). The record panel's fixture host
// (property-view-host.mjs) and the polygon's (polygon-host.mjs) keep their own
// records and layers and call these with them, so the two cannot drift apart
// on what an answer carries.
//
// Plain JavaScript for the same reason as the hosts: the page and the
// conformance runners import it without a build step.

const copy = (value) => (value === undefined ? value : JSON.parse(JSON.stringify(value)));

export const HISTORY_LIMIT = 20;
export const HISTORY_LIMIT_MAX = 50;
export const HISTORY_KINDS = ['create', 'update', 'delete', 'restore', 'publish'];

const ACTORS = ['Игорь Смирнов', 'Анна Петрова', 'Елена Кузнецова'];
const DAY = 24 * 60 * 60 * 1000;
const START = Date.UTC(2026, 8, 1, 7, 0, 0);

// An ISO time with the +03:00 offset the polygon's dates carry.
const timeAt = (revision) => {
  const moment = new Date(START + revision * DAY + (revision % 5) * 37 * 60 * 1000 + 3 * 60 * 60 * 1000);
  return `${moment.toISOString().slice(0, 19)}+03:00`;
};

/**
 * One change as the history carries it. A sealed field -- the reader may not
 * see it, a password always -- is said with its label and no values.
 */
export const historyChange = (field, before, after, sealed) => (sealed
  ? { field: field.key, label: field.label ?? field.key, sealed: true }
  : { field: field.key, before: copy(before ?? null), after: copy(after ?? null) });

/**
 * The events a record has before anyone saves it in this session: its
 * creation at revision 1, then one update per revision up to the current one,
 * each naming one field in turn. Deterministic, so a page read twice is the
 * same page. `fields` is [{key, label, value, sealed}] in the record's order.
 */
export const seedHistory = (revision, fields) => {
  const current = Math.max(1, Number(revision) || 1);
  const events = [{ id: '1', revision: 1, time: timeAt(1), actor: { name: 'Система', system: true }, kind: 'create', changes: [] }];
  const changeable = fields.filter((field) => field.value !== null && field.value !== undefined && field.value !== '');
  for (let step = 2; step <= current; step += 1) {
    const field = changeable.length ? changeable[(step * 3) % changeable.length] : null;
    events.push({
      id: String(step),
      revision: step,
      time: timeAt(step),
      actor: ACTORS[step % ACTORS.length],
      kind: step === current && current > 3 && current % 4 === 0 ? 'publish' : 'update',
      changes: field ? [historyChange(field, null, field.value, field.sealed)] : [],
    });
  }
  return events;
};

/**
 * One page of a history, newest first (port 1.21.0): at most `limit` events
 * (20 by default, 50 at most), filtered by `kinds`, older than `cursor` when one
 * is sent. The cursor of the answer is the oldest event's revision on the page,
 * or null on the last page -- never the whole history in one answer.
 */
export const historyPage = (events, payload = {}) => {
  const asked = Number(payload.limit ?? HISTORY_LIMIT);
  const limit = Math.min(HISTORY_LIMIT_MAX, Math.max(1, Number.isFinite(asked) ? Math.floor(asked) : HISTORY_LIMIT));
  const kinds = Array.isArray(payload.kinds) && payload.kinds.length ? new Set(payload.kinds.map(String)) : null;
  const before = payload.cursor === null || payload.cursor === undefined || payload.cursor === ''
    ? Infinity : Number(payload.cursor);
  const matching = [...events]
    .sort((left, right) => right.revision - left.revision)
    .filter((event) => event.revision < before && (!kinds || kinds.has(event.kind)));
  const page = matching.slice(0, limit);
  const hasMore = matching.length > page.length;
  return {
    answer: 'applied',
    events: page.map(({ revision, ...event }) => copy(event)),
    has_more: hasMore,
    cursor: hasMore ? String(page[page.length - 1].revision) : null,
  };
};

/** The record before and after `id` in an ordered list of ids (port 1.21.0). */
export const neighboursIn = (ids, id) => {
  const at = ids.indexOf(String(id));
  if (at < 0) return { answer: 'applied', listed: false, previous: null, next: null };
  return {
    answer: 'applied',
    listed: true,
    previous: at > 0 ? { record_id: ids[at - 1] } : null,
    next: at < ids.length - 1 ? { record_id: ids[at + 1] } : null,
  };
};

export const emptyLayer = () => ({ schema_version: 1, sections: {}, groups: {}, fields: {} });

// The personal layer over the shared one, entry by entry: what the person
// decided wins, and what they left alone stays as everyone has it.
const mergeLayers = (shared, personal) => {
  const base = shared ?? emptyLayer();
  const over = personal ?? emptyLayer();
  const merged = { schema_version: 1, sections: {}, groups: {}, fields: {} };
  for (const part of ['sections', 'groups', 'fields']) {
    const keys = new Set([...Object.keys(base[part] ?? {}), ...Object.keys(over[part] ?? {})]);
    for (const key of keys) {
      const left = base[part]?.[key];
      const right = over[part]?.[key];
      merged[part][key] = left && right && typeof left === 'object' && typeof right === 'object' && !Array.isArray(right)
        ? { ...copy(left), ...copy(right) }
        : copy(right ?? left);
    }
  }
  const head = over.head ?? base.head;
  if (head) merged.head = copy(head);
  return merged;
};

// The next revision of a layer whose revisions read `<prefix><n>`
// («personal-3», «v3»), keeping its prefix.
export const nextRevision = (revision, fallback) => {
  const text = String(revision ?? fallback);
  const match = text.match(/^(.*?)(\d+)$/u);
  return match ? `${match[1]}${Number(match[2]) + 1}` : `${text}-2`;
};

/**
 * «Сохранить для всех» (port 1.22.0): the personal layer merged into the
 * shared one and cleared, in one write. `views` is the host's {personal,
 * shared}, each {revision, view}; it is changed in place on applied. Either
 * revision moved on is a conflict carrying the layers as they are now, and
 * nothing is written.
 */
export const publishLayers = (views, payload = {}) => {
  const shared = views.shared ?? { revision: null, view: null };
  const personal = views.personal ?? { revision: null, view: null };
  if (String(payload.shared_revision ?? '') !== String(shared.revision ?? '')
      || String(payload.personal_revision ?? '') !== String(personal.revision ?? '')) {
    return { answer: 'conflict', reason: 'stale-revision', shared: copy(shared), personal: copy(personal) };
  }
  views.shared = { revision: nextRevision(shared.revision, 'shared-1'), view: mergeLayers(shared.view, personal.view) };
  views.personal = { revision: nextRevision(personal.revision, 'personal-1'), view: null };
  return { answer: 'applied', shared: copy(views.shared), personal: copy(views.personal) };
};

/**
 * «Закрыть для изменений» (port 1.22.0): one path locked or unlocked for the
 * layers below the shared one. `locked` is the host's list, changed in place;
 * the shared revision moves on with it, and a lock against an older one is a
 * conflict naming the current revision and list.
 */
export const lockPath = (views, locked, payload = {}) => {
  const shared = views.shared ?? { revision: null, view: null };
  if (String(payload.revision ?? '') !== String(shared.revision ?? '')) {
    return { answer: 'conflict', reason: 'stale-revision', revision: shared.revision, locked: [...locked] };
  }
  const path = String(payload.path ?? '').trim();
  if (!path) return { answer: 'refused', reason: 'validation', message: 'Не указана настройка' };
  const at = locked.indexOf(path);
  if (payload.locked && at < 0) locked.push(path);
  if (!payload.locked && at >= 0) locked.splice(at, 1);
  views.shared = { revision: nextRevision(shared.revision, 'shared-1'), view: copy(shared.view ?? emptyLayer()) };
  return { answer: 'applied', locked: [...locked], revision: views.shared.revision };
};
