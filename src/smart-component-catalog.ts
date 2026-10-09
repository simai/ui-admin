type JsonSchema = {type?: string; enum?: unknown[]; default?: unknown; const?: unknown};
import { watchForStalePage } from './stale-page-notice';
type Manifest = {
  id: string; title: string; summary: string; reuse_mode: string; custom_element: string;
  inputs: {properties: Record<string, JsonSchema>}; composition: {uses: string[]; public_parts: string[]};
  events: Record<string, {summary: string}>; scenarios: Array<{id: string; viewport: string; assertions: string[]}>;
  ai_guidance: unknown;
};
type Registry = {entries: Array<{id: string}>};
type AdminMenuElement = HTMLElement & {
  applyExternalSettingsState: (state: object, target: 'user' | 'system') => void;
  applySettingsResult: (result: object) => void;
};
type DataViewElement = HTMLElement & {
  setColumns: (columns: object[]) => DataViewElement;
  setRows: (rows: object[]) => DataViewElement;
  addRows: (rows: object[]) => DataViewElement;
  setFilterFields: (fields: object[]) => DataViewElement;
  setTemplates: (templates: object[]) => DataViewElement;
  setTableSettings: (settings: object) => DataViewElement;
  getTableData: () => {rows?: Array<Record<string, any>>};
};
type PaginationElement = HTMLElement & {setState: (state: object) => PaginationElement};

const supportedContracts = new Set(['smart.admin-menu', 'smart.data-view']);
const registry = await fetch('/contracts/smart-component-contract-registry.json', {cache: 'no-store'}).then((response) => {
  if (!response.ok) throw new Error(`Contract registry load failed: ${response.status}`);
  return response.json() as Promise<Registry>;
});
const availableContracts = registry.entries.map(({id}) => id).filter((id) => supportedContracts.has(id));
const requestedContract = new URL(location.href).searchParams.get('component') ?? 'smart.admin-menu';
let activeContractId = availableContracts.includes(requestedContract) ? requestedContract : 'smart.admin-menu';
let manifest: Manifest;
let activeElement: HTMLElement | null = null;
let controlInputs = new Map<string, HTMLInputElement | HTMLSelectElement>();
const eventHandlers = new Map<string, EventListener>();

document.documentElement.classList.remove('theme-light');
document.documentElement.classList.add('theme-dark');
const viewport = document.querySelector<HTMLElement>('.catalog-viewport');
const eventLog = document.querySelector<HTMLElement>('[data-event-log]');
const controls = document.querySelector<HTMLFormElement>('[data-contract-controls]');
const selector = document.querySelector<HTMLSelectElement>('[data-contract-select]');
const menu = document.querySelector<AdminMenuElement>('#catalog-menu');
const table = document.querySelector<DataViewElement>('#catalog-data-view');
const pagination = document.querySelector<PaginationElement>('#catalog-pagination');
const dataViewContent = document.querySelector<HTMLElement>('[data-data-view-content]');
const dataViewStateMessage = document.querySelector<HTMLElement>('[data-data-view-state-message]');
const dataViewCount = document.querySelector<HTMLElement>('[data-data-view-count]');

const logEvent = (event: Event): void => {
  if (!eventLog) return;
  if (eventLog.firstElementChild?.textContent === 'Событий пока нет.') eventLog.replaceChildren();
  const record = document.createElement('div');
  record.className = 'event-record';
  record.textContent = `${new Date().toLocaleTimeString()} ${event.type} ${JSON.stringify((event as CustomEvent).detail ?? {})}`;
  eventLog.prepend(record);
};

const bindManifestEvents = (): void => {
  for (const [name, handler] of eventHandlers) document.removeEventListener(name, handler);
  eventHandlers.clear();
  for (const eventName of Object.keys(manifest.events)) {
    const handler = ((event: Event) => logEvent(event)) as EventListener;
    document.addEventListener(eventName, handler);
    eventHandlers.set(eventName, handler);
  }
};

const updateAttribute = (name: string, schema: JsonSchema, value: string | boolean): void => {
  if (!activeElement) return;
  if (schema.type === 'boolean') {
    if (value === true) activeElement.setAttribute(name, '');
    else if (['selectable', 'settings', 'actions'].includes(name)) activeElement.setAttribute(name, 'false');
    else activeElement.removeAttribute(name);
  } else if (value === '') activeElement.removeAttribute(name);
  else activeElement.setAttribute(name, String(value));
};

const renderControls = (): void => {
  controls?.replaceChildren();
  controlInputs = new Map();
  for (const [name, schema] of Object.entries(manifest.inputs.properties)) {
    if (name === 'aria-label') continue;
    const wrapper = document.createElement('label');
    wrapper.className = `catalog-control${schema.type === 'boolean' ? ' catalog-control--checkbox' : ''}`;
    const label = document.createElement('span');
    label.textContent = name;
    let input: HTMLInputElement | HTMLSelectElement;
    if (schema.enum) {
      input = document.createElement('select');
      for (const option of schema.enum) {
        const element = document.createElement('option');
        element.value = String(option); element.textContent = String(option); input.append(element);
      }
      input.value = activeElement?.getAttribute(name) ?? String(schema.default ?? schema.enum[0]);
    } else {
      input = document.createElement('input');
      input.type = schema.type === 'boolean' ? 'checkbox' : schema.type === 'integer' ? 'number' : 'text';
      if (input.type === 'checkbox') input.checked = activeElement?.getAttribute(name) !== 'false' && (activeElement?.hasAttribute(name) ?? Boolean(schema.default));
      else input.value = activeElement?.getAttribute(name) ?? String(schema.default ?? '');
    }
    input.addEventListener('change', () => updateAttribute(name, schema, input instanceof HTMLInputElement && input.type === 'checkbox' ? input.checked : input.value));
    controlInputs.set(name, input);
    wrapper.append(label, input); controls?.append(wrapper);
  }
};

const renderManifest = (): void => {
  document.querySelector<HTMLElement>('[data-contract-title]')!.textContent = `${manifest.id} · ${manifest.reuse_mode}`;
  document.querySelector<HTMLElement>('[data-contract-summary]')!.textContent = manifest.summary;
  document.querySelector<HTMLElement>('[data-contract-guidance]')!.textContent = JSON.stringify(manifest.ai_guidance, null, 2);
  document.querySelector<HTMLElement>('[data-contract-composition]')!.innerHTML = manifest.composition.uses
    .map((dependency) => `<div class="composition-node"><strong>${dependency}</strong><span>internal dependency</span></div>`).join('');
  document.querySelector<HTMLElement>('[data-contract-scenarios]')!.innerHTML = manifest.scenarios
    .map((scenario) => `<div class="scenario-item"><strong>${scenario.id} · ${scenario.viewport}</strong><span>${scenario.assertions.join(' · ')}</span></div>`).join('');
  if (eventLog) eventLog.innerHTML = '<p>Событий пока нет.</p>';
  renderControls();
  bindManifestEvents();
};

const demoRows = Array.from({length: 24}, (_, index) => {
  const id = index + 1001;
  const statuses = ['Опубликован', 'Черновик', 'На проверке'];
  const owners = ['Александр', 'Мария', 'Елена', 'Роман'];
  return {
    id,
    title: `Проект ${String(index + 1).padStart(2, '0')} — ${['Каталог', 'Аналитика', 'Интеграция', 'Контент'][index % 4]}`,
    code: `larena.project.${String(index + 1).padStart(2, '0')}`,
    status: statuses[index % statuses.length],
    owner: owners[index % owners.length],
    version: `${1 + (index % 3)}.${index % 10}.${index % 5}`,
    updated: `2026-08-${String(1 + (index % 21)).padStart(2, '0')}`,
    package: ['content', 'storage', 'dataview', 'layout'][index % 4],
    actions: [
      {component: {type: 'icon-button', props: {icon: 'visibility', type: 'link', scheme: 'on-surface', ariaLabel: `Открыть проект ${id}`, value: 'view', '@click': () => emitDataView('sf-data-view-row-action', {action_id: 'view', record_ids: [id]})}}},
      {component: {type: 'icon-button', props: {icon: 'archive', type: 'link', scheme: 'on-surface', ariaLabel: `Архивировать проект ${id}`, value: 'archive', '@click': () => emitDataView('sf-data-view-row-action', {action_id: 'archive', record_ids: [id]})}}},
    ],
  };
});
const dataViewQuery = {search: '', filters: {} as Record<string, any>, sort: [] as object[], page: 1, pageSize: 5};

function emitDataView(name: string, detail: object): void {
  table?.dispatchEvent(new CustomEvent(name, {bubbles: true, detail}));
}

const filteredRows = (): typeof demoRows => {
  const search = dataViewQuery.search.trim().toLocaleLowerCase('ru');
  return demoRows.filter((row) => !search || [row.id, row.title, row.code, row.status, row.owner, row.package]
    .some((value) => String(value).toLocaleLowerCase('ru').includes(search)));
};

const applyDataViewPage = (append = false): void => {
  const rows = filteredRows();
  const start = (dataViewQuery.page - 1) * dataViewQuery.pageSize;
  const pageRows = rows.slice(start, start + dataViewQuery.pageSize);
  if (append) table?.addRows(pageRows); else table?.setRows(pageRows);
  pagination?.setState({current: dataViewQuery.page, total: rows.length, pageSize: dataViewQuery.pageSize});
  if (dataViewCount) dataViewCount.textContent = String(rows.length);
};

const queryIntent = (): object => ({search: dataViewQuery.search, filters: dataViewQuery.filters, sort: dataViewQuery.sort, page: dataViewQuery.page, page_size: dataViewQuery.pageSize});

const bindDataViewHost = (): void => {
  table?.addEventListener('onSearchEnd', (event) => {
    dataViewQuery.search = String((event as CustomEvent).detail ?? ''); dataViewQuery.page = 1;
    emitDataView('sf-data-view-query-change', queryIntent()); applyDataViewPage();
  });
  table?.addEventListener('onFilterUpdate', (event) => {
    dataViewQuery.filters = (event as CustomEvent).detail?.values ?? {}; dataViewQuery.page = 1;
    emitDataView('sf-data-view-query-change', queryIntent()); applyDataViewPage();
  });
  table?.addEventListener('onTemplateSave', (event) => {
    const value = (event as CustomEvent).detail;
    emitDataView('sf-data-view-template-save', {templates: Array.isArray(value) ? value : [value]});
  });
  table?.addEventListener('onColumnSettingsChange', (event) => {
    const detail = (event as CustomEvent).detail ?? {};
    emitDataView('sf-data-view-column-settings-save', {table_settings_key: detail.tableSettingsKey ?? 'catalog.projects', column_settings: detail.columnSettings ?? {}});
  });
  pagination?.addEventListener('sf-page-change', (event) => {
    dataViewQuery.page = Number((event as CustomEvent).detail?.current ?? 1);
    emitDataView('sf-data-view-page-change', {page: dataViewQuery.page}); applyDataViewPage();
  });
  pagination?.addEventListener('sf-page-size-change', (event) => {
    dataViewQuery.pageSize = Number((event as CustomEvent).detail?.pageSize ?? 5); dataViewQuery.page = 1;
    emitDataView('sf-data-view-page-size-change', {page_size: dataViewQuery.pageSize}); applyDataViewPage();
  });
  pagination?.addEventListener('sf-show-more', () => {
    const next = Math.min(dataViewQuery.page + 1, Math.max(1, Math.ceil(filteredRows().length / dataViewQuery.pageSize)));
    if (next === dataViewQuery.page) return;
    dataViewQuery.page = next; emitDataView('sf-data-view-show-more', {page: next}); applyDataViewPage(true);
  });
  pagination?.addEventListener('sf-action-apply', (event) => {
    const detail = (event as CustomEvent).detail ?? {};
    const rows = table?.getTableData?.().rows ?? [];
    const selected = detail.actionForAll ? filteredRows().map(({id}) => id) : rows
      .filter((row) => row.select?.component?.props?.checked === true).map((row) => row.id);
    emitDataView('sf-data-view-bulk-action', {action_id: detail.action, record_ids: selected.length ? selected : rows.slice(0, 1).map((row) => row.id)});
  });
};

const initializeDataView = async (): Promise<void> => {
  await Promise.all([customElements.whenDefined('sf-table'), customElements.whenDefined('sf-pagination')]);
  table?.setColumns([
    {key: 'id', label: 'ID', width: '90px'}, {key: 'title', label: 'Название', minWidth: '280px'},
    {key: 'code', label: 'Код', minWidth: '210px'}, {key: 'status', label: 'Статус', width: '150px'},
    {key: 'owner', label: 'Ответственный', width: '170px'}, {key: 'version', label: 'Версия', width: '110px'},
    {key: 'updated', label: 'Обновлён', width: '140px'}, {key: 'package', label: 'Пакет', width: '130px'},
  ]);
  table?.setFilterFields([
    {key: 'title', label: 'Название', filter: {enabled: true, control: 'text', operators: ['contains'], defaultOperator: 'contains'}},
    {key: 'status', label: 'Статус', filter: {enabled: true, control: 'text', operators: ['eq', 'contains'], defaultOperator: 'eq'}},
    {key: 'updated', label: 'Дата обновления', filter: {enabled: true, control: 'date-range', operators: ['between'], defaultOperator: 'between'}},
  ]);
  table?.setTemplates([{key: 'default', label: 'Все проекты', selected: true, default: true, data: {tags: {}, values: {}}}]);
  table?.setTableSettings({key: 'catalog.projects', columnSettings: {title: {order: 10, width: '300px'}, code: {order: 20}, status: {order: 30}}});
  bindDataViewHost(); applyDataViewPage();
};

const showDataViewState = (state: string): void => {
  document.querySelectorAll<HTMLButtonElement>('[data-data-state]').forEach((button) => button.classList.toggle('is-active', button.dataset.dataState === state));
  if (!dataViewContent || !dataViewStateMessage) return;
  dataViewContent.hidden = state !== 'populated'; dataViewStateMessage.hidden = state === 'populated'; dataViewStateMessage.dataset.state = state;
  dataViewStateMessage.innerHTML = state === 'loading'
    ? '<strong>Загрузка данных…</strong><span>Запрос выполняется backend-представлением.</span>'
    : state === 'empty'
      ? '<strong>Ничего не найдено</strong><span>Измените условия поиска или сбросьте фильтр.</span>'
      : '<strong>Не удалось загрузить данные</strong><span>Черновик запроса сохранён. Повторите попытку.</span><button type="button" data-retry-data-view>Повторить</button>';
  dataViewStateMessage.querySelector('[data-retry-data-view]')?.addEventListener('click', () => showDataViewState('populated'));
};

const loadContract = async (id: string): Promise<void> => {
  manifest = await fetch(`/contracts/${id}.json`, {cache: 'no-store'}).then((response) => {
    if (!response.ok) throw new Error(`Contract load failed: ${response.status}`);
    return response.json() as Promise<Manifest>;
  });
  activeContractId = id;
  document.querySelectorAll<HTMLElement>('[data-contract-fixture]').forEach((fixture) => { fixture.hidden = fixture.dataset.contractFixture !== id; });
  activeElement = document.querySelector<HTMLElement>(`[data-contract-fixture="${id}"] ${manifest.custom_element}`);
  viewport?.classList.toggle('catalog-viewport--data-view', id === 'smart.data-view');
  document.querySelector<HTMLElement>('[data-persistence-controls]')!.hidden = id !== 'smart.admin-menu';
  document.querySelector<HTMLElement>('[data-data-view-states]')!.hidden = id !== 'smart.data-view';
  if (selector) selector.value = id;
  const url = new URL(location.href); url.searchParams.set('component', id); history.replaceState({}, '', url);
  await customElements.whenDefined(manifest.custom_element);
  renderManifest();
  document.documentElement.dataset.smartCatalogComponent = id;
  document.documentElement.dataset.smartCatalogReady = 'true';
};

const demoRevisions = {user: 0, system: 0};
const emptyProfile = (): object => ({schema_version: 1, items: {}, layout: {compact: false}});
const externalState = (): object => ({profiles: {user: {revision: demoRevisions.user, profile: emptyProfile()}, system: {revision: demoRevisions.system, profile: emptyProfile()}}});
for (const eventName of ['sf-admin-menu-settings-refresh', 'sf-admin-menu-settings-mode-change']) {
  document.addEventListener(eventName, (event) => {
    const target = (event as CustomEvent).detail?.target === 'system' ? 'system' : 'user';
    queueMicrotask(() => menu?.applyExternalSettingsState(externalState(), target));
  });
}
document.addEventListener('sf-admin-menu-settings-save', (event) => {
  const detail = (event as CustomEvent).detail ?? {}; const target: 'user' | 'system' = detail.target === 'system' ? 'system' : 'user';
  demoRevisions[target] += 1; queueMicrotask(() => menu?.applySettingsResult({target, revision: demoRevisions[target], profile: detail.profile ?? emptyProfile()}));
});
document.addEventListener('sf-admin-menu-settings-reset', (event) => {
  const target: 'user' | 'system' = (event as CustomEvent).detail?.target === 'system' ? 'system' : 'user';
  demoRevisions[target] += 1; queueMicrotask(() => menu?.applySettingsResult({target, revision: demoRevisions[target], profile: emptyProfile()}));
});

selector?.addEventListener('change', () => void loadContract(selector.value));
document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('[data-mode]').forEach((item) => item.classList.remove('is-active'));
  const mode = button.dataset.mode ?? 'external'; button.classList.add('is-active'); menu?.setAttribute('persistence-mode', mode);
  const persistenceControl = controlInputs.get('persistence-mode'); if (persistenceControl) persistenceControl.value = mode;
}));
document.querySelectorAll<HTMLButtonElement>('[data-data-state]').forEach((button) => button.addEventListener('click', () => showDataViewState(button.dataset.dataState ?? 'populated')));
document.querySelector<HTMLButtonElement>('[data-action="theme"]')?.addEventListener('click', (event) => {
  const light = document.documentElement.classList.toggle('theme-light'); document.documentElement.classList.toggle('theme-dark', !light);
  (event.currentTarget as HTMLButtonElement).textContent = light ? 'Тёмная тема' : 'Светлая тема';
});
document.querySelector<HTMLButtonElement>('[data-action="locale"]')?.addEventListener('click', (event) => {
  const next = document.documentElement.lang === 'ru' ? 'en' : 'ru'; document.documentElement.lang = next;
  (event.currentTarget as HTMLButtonElement).textContent = next === 'ru' ? 'EN' : 'RU';
  if (table) {
    const ru = next === 'ru'; table.setAttribute('filter-text', ru ? 'Фильтр' : 'Filter'); table.setAttribute('clear-text', ru ? 'Очистить' : 'Clear');
    table.setAttribute('search-placeholder', ru ? 'Поиск' : 'Search'); table.setAttribute('create-text', ru ? 'Создать' : 'Create');
  }
});
document.querySelector<HTMLButtonElement>('[data-action="viewport"]')?.addEventListener('click', (event) => {
  const mobile = viewport?.dataset.catalogViewport !== 'mobile'; if (viewport) viewport.dataset.catalogViewport = mobile ? 'mobile' : 'desktop';
  (event.currentTarget as HTMLButtonElement).textContent = mobile ? 'Desktop' : 'Mobile';
});

await initializeDataView();
await loadContract(activeContractId);

export {};

// The host sends no Cache-Control, so a browser may be showing a copy of this
// page from before the last publish. Say so rather than letting it pass.
watchForStalePage();
