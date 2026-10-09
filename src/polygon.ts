// The polygon: the admin's two composites over a dataset big enough to work in,
// with the host's answers under the reader's control.
//
// Three things are deliberate here and each one answers a question the old
// five-record reference could not be asked.
//
// The dataset is loaded, not written here. It is a file in this repository
// (data/polygon.json, built by scripts/build-polygon-data.mjs) with every
// property type the Framework renders and 120 records, so there is a second
// page to go to, a sort that changes the order, a filter that removes rows, and
// an empty value beside a filled one. Larena can serve the same file from its
// own backend, which is why the data is a file and the answers are code.
//
// The host is the one in src/ports, the same module the conformance runner
// drives. A page with its own private answers is a page whose answers nobody
// checks.
//
// The conditions are switchable. «Нет доступа», «хост недоступен», an empty
// list and a slow one are the states a consumer handles worst and sees least,
// so they are two clicks away rather than a code change.
import './style.css';
import { createPolygonHost } from './ports/polygon-host.mjs';

type Answer = Record<string, unknown>;
type HostPort = {
  version: string;
  capabilities: string[];
  raise(intent: string, payload: Record<string, unknown>): Promise<Answer>;
};
type WithPort = Element & {
  setHostPort?: (host: HostPort) => void;
  load?: () => void;
  refresh?: () => void;
};
import type { PolygonDataset, PolygonScenario } from './ports/polygon-host.d.mts';

type Dataset = PolygonDataset;

const CAPABILITY_SWITCHES: Array<{ id: string; grants: string[] }> = [
  { id: 'cap-row-actions', grants: ['row-actions'] },
  { id: 'cap-saved-views', grants: ['saved-views', 'shared-saved-views'] },
  { id: 'cap-shared', grants: ['shared-column-settings', 'bulk-under-filter'] },
  { id: 'cap-count', grants: ['count-on-request'] },
];

const element = <T extends Element = Element>(selector: string) =>
  document.querySelector<T>(selector);

const say = (text: string) => {
  const state = element('#state');
  if (state) state.textContent = text;
};

const start = async () => {
  await Promise.all(
    ['sf-data-view', 'sf-table', 'sf-property-view', 'sf-dropdown', 'sf-switch']
      .map((tag) => customElements.whenDefined(tag)),
  );

  // Fetched rather than imported so the published page reads the same file the
  // generator wrote and the checks read: one dataset, one copy of it.
  const response = await fetch('/data/polygon.json');
  if (!response.ok) {
    say(`Данные полигона не загрузились: ${response.status}`);
    return;
  }
  const dataset = (await response.json()) as Dataset;

  const list = element<WithPort>('#solutions');
  const panel = element<WithPort>('#record');
  const count = element('#count');

  let host: ReturnType<typeof createPolygonHost>;

  const chosenCapabilities = () => CAPABILITY_SWITCHES
    .filter(({ id }) => (element<HTMLInputElement>(`#${id}`) as { checked?: boolean } | null)?.checked !== false)
    .flatMap(({ grants }) => grants);

  // The dropdown's own word for the chosen option is `selectedValue`; `value`
  // on it is an object. Reading the wrong one gave every scenario as
  // «[object Object]», which is the sort of thing that only shows up in a
  // browser.
  const SCENARIOS: PolygonScenario[] = ['default', 'empty', 'forbidden', 'unavailable'];
  // The dropdown's own word for the chosen option is `selectedValue`; `value`
  // on it is an object. Reading the wrong one gave every scenario as
  // «[object Object]», which is the sort of thing that only shows up in a
  // browser. «slow» is this page's word, not the host's: the host is given the
  // ordinary answers and a delay.
  const chosenScenario = () => String(
    (element('#scenario') as { selectedValue?: string } | null)?.selectedValue || 'default',
  );
  const hostScenario = (chosen: string): PolygonScenario =>
    (SCENARIOS as string[]).includes(chosen) ? (chosen as PolygonScenario) : 'default';

  // Rebuilding rather than mutating: a host that changes what it can do while a
  // component is holding it is a state no real host is ever in, and a polygon
  // that pretended otherwise would teach the wrong lesson.
  const mount = () => {
    const chosen = chosenScenario();
    host = createPolygonHost({
      dataset,
      capabilities: chosenCapabilities(),
      scenario: hostScenario(chosen),
      latencyMs: chosen === 'slow' ? 900 : 0,
    });

    list?.setHostPort?.(host as unknown as HostPort);
    // The panel reads as soon as it is given a port -- `setHostPort` calls
    // `load` itself -- so it is pointed at a record first. Without this the
    // first thing the page did was ask the host for the record with no id and
    // show «Запись не найдена» before anyone had touched anything.
    const first = host.records[0];
    if (first) {
      panel?.setAttribute('record-id', first.record_id);
      panel?.setAttribute('panel-label', String(first.label ?? first.record_id));
    }
    panel?.setHostPort?.(watchSaves(host.propertyView() as unknown as HostPort));
    list?.refresh?.();

    say([
      `${dataset.records.length} записей, ${dataset.structure.fields.length} полей`,
      `типов свойств: ${new Set(dataset.structure.fields.map((field) => field.property_type)).size}`,
      `права хоста: ${chosenCapabilities().length ? chosenCapabilities().join(', ') : 'нет ни одного'}`,
    ].join(' · '));
  };

  element('#scenario')?.addEventListener('sf-dropdown:change', mount);
  for (const { id } of CAPABILITY_SWITCHES) {
    element(`#${id}`)?.addEventListener('change', mount);
  }

  // A row's view action opens the record over the list. The data view re-raises
  // the table's own intent, so this is the event to listen for rather than a
  // second name for the same thing.
  list?.addEventListener('sf-table-action-intent', (event) => {
    const detail = (event as CustomEvent).detail ?? {};
    const action = String(detail.action_id ?? '');
    const id = String(detail.record_ids?.[0] ?? '');
    if (!id) return;

    if (action.includes('view') || action.includes('edit')) {
      const record = host.records.find((item) => item.record_id === id);
      // The panel's head carries what the port does not: which collection this
      // is and what the record is called. A host knows both; the panel would
      // otherwise guess a title from a field, and guess wrong.
      panel?.setAttribute('record-id', id);
      if (record) panel?.setAttribute('panel-label', String(record.label ?? id));
      panel?.load?.();
      return;
    }

    // Everything else is the host's to apply, and the list is told to read
    // again afterwards so the row shows what the host now holds.
    void host.raise('record.mutate', {
      action_id: action,
      record_ids: detail.record_ids ?? [id],
      revisions: detail.revisions ?? {},
    }).then((answer) => {
      say(`${action}: ${String(answer.answer)}${answer.reason ? ` (${String(answer.reason)})` : ''}`);
      list?.refresh?.();
    });
  });

  // A record saved in the panel is a row in the list. The panel emits no
  // «saved» event of its own -- it has `sf-property-view-state`, which says
  // loading, populated or empty and nothing about a write -- so the write is
  // noticed where it actually happens: in the port the panel is holding. The
  // panel host is wrapped rather than the list polled, because polling would
  // redraw the list on every keystroke.
  const watchSaves = (port: HostPort): HostPort => ({
    ...port,
    async raise(intent, payload) {
      const answer = await port.raise(intent, payload);
      if (intent === 'group.save' && answer.answer === 'applied') list?.refresh?.();
      return answer;
    },
  });

  element('#create')?.addEventListener('click', () => {
    void host.raise('view.create_record', { kind: dataset.structure.structure_id })
      .then((answer) => {
        say(`Создание: ${String(answer.answer)}`);
        list?.refresh?.();
      });
  });

  // The number the host counts, shown beside the heading so a filter that
  // removes rows is visible as a number and not only as a shorter list.
  list?.addEventListener('sf-data-view-answer', (event) => {
    const total = (event as CustomEvent).detail?.data?.total;
    if (count) count.setAttribute('text', total == null ? '—' : String(total));
  });

  mount();
};

void start();
