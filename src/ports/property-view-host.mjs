// The record panel's host, as the port declares one.
//
// This is a reference, so the data is a fixture — but the ANSWERS are the port's
// own, because that is the only part a consumer can copy. The Framework ships a
// conformance kit with the port (simai.composite.host-port.conformance.v1, 28
// cases), and this host is driven through it by
// scripts/check-port-conformance.mjs: a fixture that answered «applied» to
// everything would be a drawing of a host, and the first consumer to meet a
// refusal would have nothing to copy (owner, 2026-10-09).
//
// Plain JavaScript rather than TypeScript so the page and the conformance
// runner can import the same module without a build step between them.

const copy = (value) => JSON.parse(JSON.stringify(value));
const emptyLayer = () => ({ schema_version: 1, sections: {}, groups: {}, fields: {} });

export const RECORD = {
  record_id: 'r-1',
  collection: 'admin.solutions',
  revision: 7,
  // What this person may do with the record (port 1.12.0): change its fields.
  actions: ['record.edit'],
  label: 'SIMAI: Платежи №178',
  sections: [
    {
      key: 'main',
      label: 'Общее',
      groups: [
        {
          key: 'main',
          label: 'Основное',
          columns: 2,
          fields: [
            { key: 'code', label: 'Код решения', propertyType: 'string', value: 'simai.payments', width: 'half', required: true },
            { key: 'title', label: 'Название', propertyType: 'string', value: 'SIMAI: Платежи №178', width: 'half', required: true },
            { key: 'section', label: 'Раздел', propertyType: 'record', width: 'half',
              value: { value: 'sec-1', label: 'Платежи и биллинг', href: '/workbench.html' } },
            { key: 'status', label: 'Статус', propertyType: 'choice', width: 'half', value: 'active',
              options: [
                { value: 'active', label: 'В работе' },
                { value: 'done', label: 'Готово' },
                { value: 'frozen', label: 'Заморожено' },
              ] },
            { key: 'summary', label: 'Описание', propertyType: 'text', width: 'full',
              value: 'Приём платежей, возвраты и сверка с банком.' },
          ],
        },
        {
          key: 'dates',
          label: 'Сроки',
          columns: 2,
          fields: [
            { key: 'released', label: 'Выпущено', propertyType: 'date', value: '2026-09-18', width: 'half' },
            { key: 'public', label: 'Доступно всем', propertyType: 'boolean', value: true, width: 'half' },
          ],
        },
      ],
    },
  ],
};

// Which records this host refuses and which it cannot reach. A host that always
// says yes teaches a consumer nothing about the two answers they will actually
// have to handle.
const FORBIDDEN = /forbidden/;
const UNREACHABLE = /unavailable|missing/;

export const PROFILES = [
  { id: 'default', label: 'Обычный', shared: true },
  { id: 'expert', label: 'Экспертный', shared: true },
  { id: 'mine', label: 'Персональный', shared: false },
];

// `profiles` is here so a caller can stand the host up with a list of its own —
// one shared view, say, which is the state in which removing it is refused and
// which no sequence of calls on the default list reaches.
export const createPropertyViewHost = ({ record = RECORD, capabilities = [], profiles = PROFILES } = {}) => {
  const state = { record: copy(record), views: {}, profiles: copy(profiles), profile: copy(profiles)[0]?.id ?? null, next: 4 };

  // The record a read answers with carries the list this host is keeping, not
  // the one the fixture was written with: the list is the host's.
  const answerRecord = () => {
    const answer = copy(state.record);
    answer.view = { ...(answer.view ?? {}), profiles: copy(state.profiles), profile: state.profile };
    return answer;
  };
  const asRead = () => ({ answer: 'applied', record: answerRecord() });

  return {
    version: '1.13.0',
    capabilities,

    async raise(intent, payload = {}) {
      const recordId = String(payload.record_id ?? '');

      // An empty object of the collection for a create (port 1.12.0): the
      // record's own arrangement, every value empty, no id and no revision --
      // so a view arranged once is arranged for creating too.
      if (intent === 'record.load' && payload.mode === 'create') {
        const empty = copy(state.record);
        empty.record_id = null;
        empty.revision = null;
        for (const section of empty.sections ?? []) {
          for (const group of section.groups ?? []) {
            for (const field of group.fields ?? []) field.value = null;
          }
        }
        return { answer: 'applied', record: empty };
      }

      // Making the object: refused with errors keyed by field, or applied with
      // the new id and the object as it now stands.
      if (intent === 'record.create') {
        const values = payload.values ?? {};
        if (!String(values.title ?? '').trim()) {
          return { answer: 'refused', reason: 'validation', errors: { title: 'Название не может быть пустым' } };
        }
        const made = copy(state.record);
        made.record_id = `r-new-${state.next++}`;
        made.revision = 1;
        for (const section of made.sections ?? []) {
          for (const group of section.groups ?? []) {
            for (const field of group.fields ?? []) {
              field.value = Object.prototype.hasOwnProperty.call(values, field.key) ? values[field.key] : null;
            }
          }
        }
        return { answer: 'applied', record_id: made.record_id, record: made };
      }

      // The whole object as one revision, from a surface open all at once.
      if (intent === 'record.save') {
        if (String(payload.revision ?? '') !== String(state.record.revision)) {
          return { answer: 'conflict', reason: 'stale-revision', message: 'Запись изменилась, обновите её' };
        }
        const values = payload.values ?? {};
        if (Object.prototype.hasOwnProperty.call(values, 'title') && !String(values.title ?? '').trim()) {
          return { answer: 'refused', reason: 'validation', errors: { title: 'Название не может быть пустым' } };
        }
        for (const section of state.record.sections ?? []) {
          for (const group of section.groups ?? []) {
            for (const field of group.fields ?? []) {
              if (Object.prototype.hasOwnProperty.call(values, field.key)) field.value = values[field.key];
            }
          }
        }
        state.record.revision += 1;
        return asRead();
      }

      if (intent === 'record.load') {
        // An empty arrangement and a refused read look identical on screen
        // unless the refusal is said out loud, and only the second is something
        // a person can act on.
        if (FORBIDDEN.test(recordId)) {
          return { answer: 'refused', reason: 'access-denied', message: 'Нет доступа к записи' };
        }
        if (UNREACHABLE.test(recordId)) {
          return { answer: 'unavailable', reason: 'host-down', message: 'Источник данных недоступен' };
        }
        return asRead();
      }

      if (intent === 'group.save') {
        // The revision the read carried is what a write is compared against.
        // Answering applied to a stale one would lose somebody else's save
        // without anyone being told.
        if (String(payload.revision ?? '') !== String(state.record.revision)) {
          return { answer: 'conflict', reason: 'stale-revision', message: 'Запись изменилась, обновите её' };
        }
        const values = payload.values ?? {};
        if (Object.prototype.hasOwnProperty.call(values, 'title') && !String(values.title ?? '').trim()) {
          return { answer: 'refused', reason: 'validation', errors: { title: 'Название не может быть пустым' } };
        }
        const group = state.record.sections
          .find((section) => section.key === payload.section)?.groups
          .find((item) => item.key === payload.group);
        for (const field of group?.fields ?? []) {
          if (Object.prototype.hasOwnProperty.call(values, field.key)) field.value = values[field.key];
        }
        state.record.revision += 1;
        return asRead();
      }

      if (intent === 'field.options') {
        if (!capabilities.includes('field-options')) {
          return { answer: 'unavailable', reason: 'capability-not-provided' };
        }
        if (FORBIDDEN.test(String(payload.field ?? ''))) {
          return { answer: 'refused', reason: 'access-denied' };
        }
        // One page of candidates, not every candidate: a host that answers with
        // all of them makes the component's paging meaningless and its own
        // query unbounded. An absent next_cursor means this was the last page.
        const search = String(payload.search ?? '').toLowerCase();
        const all = [
          { value: 'sec-1', label: 'Платежи и биллинг' },
          { value: 'sec-2', label: 'Коммуникации' },
          { value: 'sec-3', label: 'Инфраструктура' },
        ].filter((option) => !search || option.label.toLowerCase().includes(search));
        return { answer: 'applied', options_page: { options: all, next_cursor: null } };
      }

      if (intent === 'field.upload') {
        if (!capabilities.includes('field-upload')) {
          return { answer: 'refused', reason: 'capability-not-provided' };
        }
        // What the host rejects is the host's business; the reference rejects
        // by size so the refused answer is reachable at all. A silent failure
        // leaves a person looking at a field that did not change.
        const file = payload.file ?? {};
        if (Number(file.size ?? 0) > 16 * 1024 * 1024) {
          return { answer: 'refused', reason: 'file-too-large', message: 'Файл больше 16 МБ' };
        }
        // The same shape the field already reads, so the view shows the stored
        // file without a second read.
        return {
          answer: 'applied',
          file: { value: 'u-1', label: String(file.name ?? 'file'), mime: 'application/pdf', href: '/workbench.html' },
        };
      }

      if (intent === 'record.open') return { answer: 'applied' };

      // The named views, and the three acts that keep the list of them.
      if (intent === 'view.profile' || intent === 'view.create'
          || intent === 'view.rename' || intent === 'view.delete') {
        if (!capabilities.includes('view-settings')) {
          return { answer: 'unavailable', reason: 'capability-not-provided' };
        }
        const wanted = String(payload.profile ?? '');

        if (intent === 'view.profile') {
          if (FORBIDDEN.test(wanted)) return { answer: 'refused', reason: 'access-denied' };
          const found = state.profiles.find((profile) => profile.id === wanted);
          if (!found) return { answer: 'refused', reason: 'unknown-view' };
          state.profile = found.id;
          return asRead();
        }

        if (intent === 'view.create') {
          // The same right that governs the shared layer governs a shared view.
          if (payload.shared && !capabilities.includes('shared-view-settings')) {
            return { answer: 'refused', reason: 'access-denied', message: 'Общий вид заводит администратор' };
          }
          const id = `view-${state.next++}`;
          state.profiles.push({ id, label: String(payload.label ?? 'Новый вид'), shared: Boolean(payload.shared) });
          state.profile = id;
          return asRead();
        }

        const found = state.profiles.find((profile) => profile.id === wanted);
        if (!found) return { answer: 'refused', reason: 'unknown-view' };

        if (intent === 'view.rename') {
          // The label and nothing else: the id is what anything pointing at
          // this view points at.
          found.label = String(payload.label ?? found.label);
          return asRead();
        }

        // Removing. The last shared one stays: a scope with none has nothing
        // for a person who has made none of their own.
        if (found.shared && state.profiles.filter((profile) => profile.shared).length < 2) {
          return { answer: 'refused', reason: 'last-shared-view', message: 'Это единственный общий вид' };
        }
        state.profiles.splice(state.profiles.indexOf(found), 1);
        if (state.profile === found.id) state.profile = state.profiles[0]?.id ?? null;
        return asRead();
      }

      if (intent === 'view.save') {
        const target = payload.target ?? {};
        if (!capabilities.includes('view-settings')) {
          return { answer: 'unavailable', reason: 'capability-not-provided' };
        }
        if (target.kind === 'shared' && !capabilities.includes('shared-view-settings')) {
          return { answer: 'refused', reason: 'access-denied', message: 'Общий вид меняет администратор' };
        }
        const stored = state.views[target.kind] ?? { revision: 'v1', view: emptyLayer() };
        if (target.revision && String(target.revision) !== String(stored.revision)) {
          // The conflict carries the stored layer, not only its revision:
          // without it the component is left drawing an arrangement that is no
          // longer the one on the server.
          return { answer: 'conflict', reason: 'stale-revision', revision: stored.revision, view: copy(stored.view) };
        }
        state.views[target.kind] = { revision: `v${Number(String(stored.revision).slice(1)) + 1}`, view: copy(payload.view ?? emptyLayer()) };
        return { answer: 'applied', revision: state.views[target.kind].revision };
      }

      if (intent === 'view.reset') {
        if (!capabilities.includes('view-settings')) {
          return { answer: 'unavailable', reason: 'capability-not-provided' };
        }
        state.views = {};
        return { answer: 'applied', revision: 'v0', view: emptyLayer() };
      }

      return { answer: 'unavailable', reason: 'unknown-intent' };
    },
  };
};
