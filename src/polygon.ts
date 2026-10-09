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
import type { PolygonDataset, PolygonRecord, PolygonScenario } from './ports/polygon-host.d.mts';

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
  // The list's components, and not the record panel's. The Framework's loader
  // is markup-driven: it loads a component when it sees its tag, so with no
  // `sf-property-view` in the page nothing ever loads it and waiting for it
  // here never returns. The whole page sat empty until this was separated --
  // the loader is why the element used to be in the markup, and the reason it
  // could not simply be deleted.
  await Promise.all(
    ['sf-data-view', 'sf-table', 'sf-dropdown', 'sf-switch']
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
  const count = element('#count');

  // The record panel is made when it is wanted and removed when it is not. A
  // property view carrying `panel` is open from the moment it is in the
  // document -- the drawer portals its content out, so `hidden` on the element
  // leaves the panel painted -- and the composite has no closed state of its
  // own: its own comment says closing is the host's decision. This is that
  // decision. The attributes are set before the port is bound, because binding
  // is what triggers the read.
  const PANEL_ATTRIBUTES: Array<[string, string]> = [
    ['id', 'record'],
    ['panel-width', '44rem'],
    ['collection', 'workbench.solutions'],
    ['collection-label', 'Решения'],
    ['collection-icon', 'inventory_2'],
    ['aria-label', 'Карточка решения'],
  ];

  let panel: (WithPort & HTMLElement) | null = null;

  const listen = (made: HTMLElement) => {
    // Closing is the page's decision, which is why the component only
    // announces it. Back rather than a push, so Escape undoes the press that
    // opened the record instead of adding a third entry to the history.
    made.addEventListener('sf-property-view-close', () => {
      if (history.state?.record) history.back();
      else go({ record: null });
    });

    // «Open on a full page» is a real navigation to the record's own address.
    // Larena serves that address from a server; here the same page reads it and
    // puts the list away.
    made.addEventListener('sf-property-view-open-full', (event) => {
      const id = String((event as CustomEvent).detail?.record_id ?? addressNow().record ?? '');
      if (id) go({ record: id, full: true });
    });

    // A reference inside the record is another record's address.
    made.addEventListener('sf-property-view-open-record', (event) => {
      const id = String((event as CustomEvent).detail?.record_id ?? '');
      if (id && host.records.some((item) => item.record_id === id)) go({ record: id });
    });
  };

  const removePanel = () => {
    panel?.remove();
    panel = null;
    panelPort = null;
  };

  const makePanel = async (full: boolean, record: PolygonRecord) => {
    removePanel();
    const made = document.createElement('sf-property-view') as WithPort & HTMLElement;
    for (const [name, value] of PANEL_ATTRIBUTES) made.setAttribute(name, value);
    // Over the list it is a modeless panel; as the page it is the page.
    if (!full) made.setAttribute('panel', '');
    made.setAttribute('record-id', record.record_id);
    // The head carries what the port does not: which collection this is and
    // what the record is called. A host knows both; the panel would otherwise
    // guess a title from a field, and guess wrong.
    made.setAttribute('panel-label', String(record.label ?? record.record_id));
    listen(made);
    document.body.append(made);
    panel = made;
    // Appending the tag is what makes the loader fetch the component; binding
    // the port before it is upgraded would call a method that does not exist
    // yet.
    await customElements.whenDefined('sf-property-view');
    return made;
  };

  let host: ReturnType<typeof createPolygonHost>;
  let panelPort: HostPort | null = null;

  // ─── The address is the state ───────────────────────────────────────────────
  //
  // Three of them, and the page reads them rather than remembering anything:
  //
  //   /                           the list
  //   /?record=r-007              the list with that record open over it
  //   /?record=r-007&view=full    that record as the page, the list put away
  //
  // A query rather than a path (`/records/r-007`) because this is a static
  // site: a path would be a 404 on reload, and an address that only works
  // until you press F5 is not an address. Larena's own detail page is a path,
  // because Larena has a server to route it.
  const addressNow = () => {
    const query = new URLSearchParams(location.search);
    return { record: query.get('record') ?? null, full: query.get('view') === 'full' };
  };

  const addressFor = ({ record, full }: { record: string | null; full?: boolean }) => {
    const query = new URLSearchParams();
    if (record) query.set('record', record);
    if (record && full) query.set('view', 'full');
    const search = query.toString();
    return `${location.pathname}${search ? `?${search}` : ''}`;
  };

  // A press that changes what is open pushes, so Back undoes exactly it.
  const go = (to: { record: string | null; full?: boolean }) => {
    const next = addressFor(to);
    if (next !== `${location.pathname}${location.search}`) history.pushState(to, '', next);
    void show(to);
  };

  const show = async ({ record, full }: { record: string | null; full?: boolean }) => {
    const listSection = element('#list-section');

    if (!record) {
      listSection?.removeAttribute('hidden');
      removePanel();
      say(summary());
      return;
    }

    const found = host.records.find((item) => item.record_id === record);
    if (!found) {
      // An address naming a record that is not there is a thing to say, not a
      // blank panel: a stale link is the commonest way to arrive at one. Said
      // after the list is shown, because showing it says the summary and would
      // otherwise wipe this.
      history.replaceState({ record: null }, '', addressFor({ record: null }));
      await show({ record: null });
      say(`Записи ${record} нет — возможно, её удалили. Открыт список.`);
      return;
    }

    if (full) listSection?.setAttribute('hidden', '');
    else listSection?.removeAttribute('hidden');

    const made = await makePanel(Boolean(full), found);
    // The address may have changed again while the component was loading.
    if (panel !== made) return;
    panelPort = watchSaves(host.propertyView() as unknown as HostPort);
    made.setHostPort?.(panelPort);
  };

  const summary = () => [
    `${dataset.records.length} записей, ${dataset.structure.fields.length} полей`,
    `типов свойств: ${new Set(dataset.structure.fields.map((field) => field.property_type)).size}`,
    `права хоста: ${chosenCapabilities().length ? chosenCapabilities().join(', ') : 'нет ни одного'}`,
  ].join(' · ');

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
    // The panel is NOT wired here. `setHostPort` reads the record at once, so
    // binding it at startup opened a record nobody had asked for -- the admin
    // came up with a card already over it. It is bound the first time a record
    // is opened, after the id is set, which is also the only moment a read is
    // wanted (owner, 2026-10-10).
    panelPort = null;
    list?.refresh?.();
    list?.refresh?.();

    say(summary());
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
      // Pressing a row changes the address, and the address is what decides
      // what is open. Back and forward then work, a reload lands on the same
      // record, and the link can be sent to somebody -- which is what an admin
      // is expected to do and what this page did not do at all.
      go({ record: id });
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


  // Back and forward are the reader's, so the address is read rather than
  // remembered.
  addEventListener('popstate', () => { void show(addressNow()); });

  mount();
  // What the address asked for, which on a first visit is the list.
  void show(addressNow());
};

void start();
