// The property workbench (owner, 2026-10-15, remark 17 and its follow-up):
// every universal property of the Framework in its three modes -- shown,
// edited, filtered -- drawn by the Framework's own field renderers
// (SF.fieldRenderers), the ones the record view and the table use. The list
// is the Framework's registry of properties (SF.fieldRenderers.registry), so a
// new property or variant appears here as soon as the Framework has it; the
// values are the polygon's own where it has one of that kind, made up where
// it does not.
type Entry = {type: string; label: {ru: string; en: string}; variants: Array<{id: string; label: {ru: string}}>; params: string[];
  modes: {view: boolean; edit: boolean; cell: string; filter: string}};
type Field = Record<string, any> & {key: string; label: string; property_type: string; variant?: string};
type Renderers = {
  renderViewField: (field: object, value: unknown, host: object, options?: object) => unknown;
  renderEditField: (field: object, value: unknown, host: object, options?: object) => unknown;
  renderFilterField: (field: object, host: object) => unknown;
  registry?: Entry[];
};
type SFGlobal = {fieldRenderers?: Renderers; html: (strings: TemplateStringsArray, ...values: unknown[]) => unknown; render: (what: unknown, where: Element) => void; nothing: unknown};

const sf = () => (window as unknown as {SF: SFGlobal}).SF;
const rows = document.querySelector<HTMLElement>('[data-rows]')!;
const sizeControl = document.querySelector<HTMLSelectElement>('[data-size]')!;
const stateControl = document.querySelector<HTMLSelectElement>('[data-state]')!;
const search = document.querySelector<HTMLInputElement>('[data-search]')!;

const dataset = await fetch('/data/polygon.json').then((response) => response.json());
const references: Record<string, Array<Record<string, any>>> = dataset.references ?? {};
const polygonFields: Field[] = dataset.structure.fields;

// Options for a type: the polygon's references where it has them.
const OPTIONS: Record<string, Array<Record<string, any>>> = {
  user: references.users ?? [],
  record: references.sections ?? [],
  relation: references.relations ?? [],
  choice: polygonFields.find((field) => field.property_type === 'choice')?.options ?? [{value: 'a', label: 'Первый'}, {value: 'b', label: 'Второй'}],
  choices: polygonFields.find((field) => field.property_type === 'choices')?.options ?? [{value: 'a', label: 'Первый'}, {value: 'b', label: 'Второй'}],
};

// A value of each kind: the polygon's, or a made-up one.
const MADE_UP: Record<string, unknown> = {
  'string': 'simai.payments.v1', 'string:phone': '+7 916 123-45-67', 'text': 'Приём платежей, возвраты и сверка с банком.',
  'integer': 42, 'number': 1474500.5, 'number:scale': 64, 'date': '2026-10-15', 'datetime': '2026-10-15T10:30:00+03:00',
  'boolean': true, 'color': '#2f6feb', 'include': '<div class="banner">Привет</div>',
};
const LONG: Record<string, unknown> = {
  'string': 'Очень длинное значение строки, которое не помещается в одну строку и проверяет перенос и обрезку текста в каждом режиме',
  'text': 'Очень длинный текст. '.repeat(12), 'integer': 9876543210, 'number': 123456789012.75,
};
const polygonValue = (type: string, variant: string) => {
  const field = polygonFields.find((one) => one.property_type === type && String(one.variant ?? '') === variant);
  if (!field) return undefined;
  for (const record of dataset.records) {
    const value = record.values?.[field.key];
    if (value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && !value.length)) return value;
  }
  return undefined;
};
const sampleOf = (type: string, variant: string): unknown => {
  const kind = variant ? `${type}:${variant}` : type;
  if (stateControl.value === 'empty') return type === 'choices' || type === 'file' ? [] : null;
  if (stateControl.value === 'long' && kind in LONG) return LONG[kind];
  const fromPolygon = polygonValue(type, variant);
  if (fromPolygon !== undefined) return fromPolygon;
  if (kind in MADE_UP) return MADE_UP[kind];
  if (type in MADE_UP) return MADE_UP[type];
  const options = OPTIONS[type] ?? [];
  if (type === 'choices') return options.slice(0, 2).map((option) => option.value);
  if (type === 'choice') return options[0]?.value ?? null;
  if (['user', 'record', 'relation'].includes(type)) return options[0] ? {value: options[0].value, label: options[0].label, avatarText: options[0].avatarText} : null;
  if (type === 'file') return polygonValue('file', 'image-card') ?? {value: 'f-1', label: 'Отчёт.pdf', mime: 'application/pdf', size: 120400};
  return null;
};

const values = new Map<string, unknown>();
const filters = new Map<string, Record<string, any>>();
const searches = new Map<string, string>();

const fieldOf = (entry: Entry, variant: string): Field => {
  const key = variant ? `${entry.type}-${variant}` : entry.type;
  const label = variant ? `${entry.label.ru} · ${entry.variants.find((one) => one.id === variant)?.label.ru ?? variant}` : entry.label.ru;
  const options = OPTIONS[entry.type] ?? [];
  return {
    key, label, property_type: entry.type, propertyType: entry.type, ...(variant ? {variant} : {}), options,
    readonly: stateControl.value === 'readonly',
    ...(entry.type === 'number' && variant === 'scale' ? {constraints: {min: 0, max: 100}} : {}),
    filter: {options, defaultOperator: 'in'},
  };
};

// The small interface the renderers ask of whoever places them.
const host = {
  get size() { return sizeControl.value; },
  setFieldValue(key: string, value: unknown) { values.set(key, value); draw(); },
  getFilterControlValue(key: string) { return filters.get(key) ?? {}; },
  patchTempFilterValue(key: string, patch: object) { filters.set(key, {...(filters.get(key) ?? {}), ...patch}); draw(); },
  getFilterOperatorLabel(operator: string) {
    return ({eq: 'равно', gt: 'больше', gte: 'не меньше', lt: 'меньше', lte: 'не больше', between: 'между', contains: 'содержит',
      startsWith: 'начинается с', any: 'любое', today: 'сегодня', week: 'неделя', month: 'месяц', in: 'одно из'} as Record<string, string>)[operator] ?? operator;
  },
  getFilterOptionSearch(key: string) { return searches.get(key) ?? ''; },
  patchTempFilterOptionSearch(key: string, value: string) { searches.set(key, value); draw(); },
  getVisibleFilterOptions(field: Field) {
    const query = (searches.get(field.key) ?? '').toLowerCase();
    return (field.options ?? []).filter((option: Record<string, any>) => !query || String(option.label ?? '').toLowerCase().includes(query));
  },
  renderFilterOption(field: Field, option: Record<string, any>) {
    const {html} = sf();
    const value = option.value ?? option.id;
    const chosen = new Set((filters.get(field.key)?.values ?? []) as unknown[]);
    return html`<label class="properties-option"><span>${option.label ?? value}</span>
      <sf-checkbox size=${host.size} ?checked=${chosen.has(value)} @change=${(event: Event) => {
        const next = new Set(chosen);
        if ((event.target as HTMLInputElement)?.checked) next.add(value); else next.delete(value);
        host.patchTempFilterValue(field.key, {values: [...next], operator: 'in'});
      }}></sf-checkbox></label>`;
  },
  getEndpointFilterPage() { return null; },
  loadEndpointFilterPage() { return Promise.resolve(); },
  getFieldOptionsPage() { return null; },
  loadFieldOptions() { return Promise.resolve(); },
  getFieldUploads() { return []; },
  startFieldUpload() { return null; },
  retryFieldUpload() { return null; },
};

// The filter column is what a list shows: the field's chip, and on a click
// the list's own filter window for it -- its controls, «Сбросить» and
// «Применить» -- from a real sf-table that holds every field as a filter.
type FilterTable = HTMLElement & {setColumns: (c: object[]) => void; setRows: (r: object[]) => void; setFilterFields: (f: object[]) => void;
  openContextMenu: (event: object, data: object) => void; size?: string};
const filterTable = () => document.getElementById('filters') as FilterTable | null;
let filtersKey = '';
function syncFilterTable(fields: Field[]): void {
  const table = filterTable();
  if (!table || typeof table.setFilterFields !== 'function') return;
  const key = `${sizeControl.value}|${fields.map((field) => field.key).join(',')}`;
  if (key === filtersKey) return;
  filtersKey = key;
  table.setAttribute('size', sizeControl.value);
  table.setColumns(fields.map((field) => ({key: field.key, label: field.label})));
  table.setRows([]);
  table.setFilterFields(fields.map((field) => ({...field, filter: {...field.filter, searchable: true}})));
}
function openFilter(event: Event, field: Field): void {
  const table = filterTable();
  if (!table?.openContextMenu) return;
  const anchor = (event.currentTarget as HTMLElement).querySelector('button') ?? event.currentTarget;
  table.openContextMenu({currentTarget: anchor, target: anchor, preventDefault() {}, stopPropagation() {}, composedPath: () => [anchor]},
    {type: 'bottom', menu: 'tag-settings', fieldKey: field.key});
}

function draw(): void {
  const {html, render, nothing, fieldRenderers} = sf();
  if (!fieldRenderers?.registry) return;
  const query = search.value.trim().toLowerCase();
  const size = sizeControl.value;
  const kinds = fieldRenderers.registry.flatMap((entry) => ['', ...entry.variants.map((variant) => variant.id)].map((variant) => ({entry, variant})));
  const shown = kinds.filter(({entry, variant}) => !query || `${entry.label.ru} ${entry.type} ${variant}`.toLowerCase().includes(query));
  syncFilterTable(kinds.map(({entry, variant}) => fieldOf(entry, variant)));
  render(html`${shown.map(({entry, variant}) => {
    const field = fieldOf(entry, variant);
    if (!values.has(field.key) || stateControl.dataset.drawn !== stateControl.value) values.set(field.key, sampleOf(entry.type, variant));
    const value = values.get(field.key);
    const view = fieldRenderers.renderViewField(field, value, host, {size});
    const edit = fieldRenderers.renderEditField(field, value, host, {size});
    const none = html`<span class="properties-empty">—</span>`;
    const textFilter = entry.modes.filter === 'text';
    return html`<div class="properties-row" role="row" data-property=${`${entry.type}${variant ? `:${variant}` : ''}`}>
      <div class="properties-name" role="cell"><strong>${field.label}</strong>
        <code>${entry.type}${variant ? ` · ${variant}` : nothing}</code>
        <span class="properties-params">${entry.params.join(', ')}</span></div>
      <div class="properties-cell" role="cell" data-mode="view">${view ?? none}</div>
      <div class="properties-cell" role="cell" data-mode="edit">${edit ?? none}</div>
      <div class="properties-cell properties-filter" role="cell" data-mode="filter" data-filter=${entry.modes.filter}>
        <sf-tag type="default" size=${size} text=${field.label} interactive
                @click=${(event: Event) => openFilter(event, field)}></sf-tag>
        ${textFilter ? html`<span class="properties-note">Своего фильтра нет — поиск по тексту</span>` : nothing}</div>
    </div>`;
  })}`, rows);
  stateControl.dataset.drawn = stateControl.value;
}

sizeControl.addEventListener('change', draw);
stateControl.addEventListener('change', draw);
search.addEventListener('input', draw);
document.querySelector('[data-theme]')?.addEventListener('click', () => {
  const dark = !document.documentElement.classList.contains('theme-dark');
  document.documentElement.classList.toggle('theme-dark', dark);
  document.documentElement.classList.toggle('theme-light', !dark);
});

// The renderers arrive with the record view's bundle, which the Loader brings
// for the element on the page.
const ready = () => Boolean(sf()?.fieldRenderers && sf()?.html);
for (let wait = 0; !ready() && wait < 200; wait += 1) await new Promise((done) => setTimeout(done, 50));
if (!ready()) rows.textContent = 'Рендереры полей не загрузились.';
else if (!sf().fieldRenderers?.registry) rows.textContent = 'В этой паре Framework ещё нет реестра свойств.';
else draw();
