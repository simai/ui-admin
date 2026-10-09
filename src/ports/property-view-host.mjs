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

export const createPropertyViewHost = ({ record = RECORD, capabilities = [] } = {}) => {
  const state = { record: copy(record), views: {} };

  return {
    version: '1.9.0',
    capabilities,

    async raise(intent, payload = {}) {
      const recordId = String(payload.record_id ?? '');

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
        return { answer: 'applied', record: copy(state.record) };
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
        return { answer: 'applied', record: copy(state.record) };
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
