// The record workbench: the two composites Larena's /admin/cms is built from,
// answered by a host that lives in this page.
//
// This is a reference, so the hosts here are fixtures — but their ANSWERS are
// the shapes Larena's ports answer with, because that is the only part a
// consumer can copy. A page that showed the markup and invented the data would
// be a drawing of an admin rather than an admin, and the two would drift the
// first time a port changed. That is how the embedded list came to draw a
// fallback toolbar for a fortnight.
import './style.css';

type Answer = Record<string, unknown>;
type HostPort = {
  version: string;
  capabilities: string[];
  raise(intent: string, payload: Record<string, unknown>): Promise<Answer>;
};

const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

// ─── The collection the list shows ────────────────────────────────────────────

const COLUMNS = [
  { key: 'title', label: 'Название', role: 'title', sortable: true },
  { key: 'code', label: 'Код решения', sortable: true },
  { key: 'section', label: 'Раздел' },
  { key: 'status', label: 'Статус' },
  { key: 'updated', label: 'Обновлено', sortable: true },
];

const RECORDS = [
  { id: 'r-1', title: 'SIMAI: Платежи №178', code: 'simai.payments', section: 'Платежи и биллинг', status: 'В работе', updated: '2026-12-25', actions: ['view', 'edit'] },
  { id: 'r-2', title: 'SIMAI: Уведомления №387', code: 'simai.notify', section: 'Коммуникации', status: 'Готово', updated: '2026-12-18', actions: ['view'] },
  { id: 'r-3', title: 'SIMAI: Биллинг №277', code: 'simai.billing', section: 'Платежи и биллинг', status: 'В работе', updated: '2026-12-11', actions: ['view', 'edit'] },
  { id: 'r-4', title: 'SIMAI: Резервные копии №441', code: 'simai.filebackup', section: 'Инфраструктура', status: 'Заморожено', updated: '2026-11-30', actions: ['view'] },
  { id: 'r-5', title: 'SIMAI: Корзина №034', code: 'simai.cart', section: 'Магазин', status: 'В работе', updated: '2026-11-22', actions: ['view', 'edit'] },
];

// ─── The record the panel shows ───────────────────────────────────────────────

const RECORD = {
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
            { key: 'status', label: 'Статус', propertyType: 'enum', width: 'half', value: 'active',
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

// ─── The hosts ────────────────────────────────────────────────────────────────

const listHost = (): HostPort => ({
  version: '1.6.0',
  // What this host can do, declared rather than assumed: the list draws only
  // the controls whose capability is claimed here.
  capabilities: ['row-actions'],
  async raise(intent, payload) {
    if (intent !== 'query.change') return { answer: 'applied' };
    return {
      answer: 'applied',
      sequence: payload.sequence,
      data: { records: copy(RECORDS), columns: copy(COLUMNS), total: RECORDS.length },
    };
  },
});

const recordHost = (): HostPort => ({
  version: '1.7.0',
  capabilities: [],
  async raise(intent, payload) {
    if (intent === 'record.load') return { answer: 'applied', record: copy(RECORD) };
    if (intent === 'group.save') {
      // A real host validates and stores. This one takes the values as given
      // and answers with the next revision, which is what makes the panel
      // leave editing — the panel waits for the host, it does not assume.
      const group = RECORD.sections
        .find((section) => section.key === payload.section)?.groups
        .find((item) => item.key === payload.group);
      const values = payload.values as Record<string, unknown> | undefined;
      for (const field of group?.fields ?? []) {
        if (values && field.key in values) (field as Record<string, unknown>).value = values[field.key];
      }
      RECORD.revision += 1;
      return { answer: 'applied', record: copy(RECORD) };
    }
    return { answer: 'unavailable', reason: 'unknown-intent' };
  },
});

// ─── Wiring ───────────────────────────────────────────────────────────────────

type WithPort = Element & { setHostPort?: (host: HostPort) => void; load?: () => void };

const start = async () => {
  await Promise.all(
    ['sf-data-view', 'sf-table', 'sf-property-view'].map((tag) => customElements.whenDefined(tag)),
  );

  const list = document.querySelector<WithPort>('#solutions');
  list?.setHostPort?.(listHost());

  const panel = document.querySelector<WithPort>('#record');
  panel?.setHostPort?.(recordHost());

  // A row's view action opens the record over the list, which is the one
  // behaviour that makes these two composites a page rather than two widgets.
  list?.addEventListener('sf-data-view-action-intent', (event) => {
    const detail = (event as CustomEvent).detail ?? {};
    if (!String(detail.action_id ?? '').includes('view')) return;
    panel?.setAttribute('record-id', String(detail.record_ids?.[0] ?? 'r-1'));
    panel?.load?.();
  });
};

void start();
