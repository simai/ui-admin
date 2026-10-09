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
import { createPropertyViewHost } from './ports/property-view-host.mjs';

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

// The record host lives in src/ports, because the conformance runner drives
// the same one: a page that used its own would be a page whose answers nobody
// checks.
const recordHost = (): HostPort => createPropertyViewHost({
  capabilities: ['field-options', 'field-upload', 'view-settings'],
}) as unknown as HostPort;

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
  // The data view re-raises the table's own action intent rather than inventing
  // a second name for it, so this is the event to listen for.
  list?.addEventListener('sf-table-action-intent', (event) => {
    const detail = (event as CustomEvent).detail ?? {};
    if (!String(detail.action_id ?? '').includes('view')) return;
    const id = String(detail.record_ids?.[0] ?? 'r-1');
    // The panel's head carries what the port does not: which collection this
    // is and what the record is called. A host knows both; the panel would
    // otherwise have to guess at a title from a field, and guess wrong.
    const record = RECORDS.find((item) => item.id === id);
    panel?.setAttribute('record-id', id);
    if (record) panel?.setAttribute('panel-label', record.title);
    panel?.load?.();
  });
};

void start();
