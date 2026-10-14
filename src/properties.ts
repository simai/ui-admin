// The property showcase (owner, 2026-10-14, remark 17): every universal
// property of the Framework in its three modes -- shown, edited, filtered --
// drawn by the Framework's own field renderers (SF.fieldRenderers), the ones
// the record view and the table use. The fields and values are the polygon's
// (data/polygon.json), with a few variants added so each one is on the page.
type Field = Record<string, any> & {key: string; label: string; property_type: string};
type Renderers = {
  renderViewField: (field: object, value: unknown, host: object, options?: object) => unknown;
  renderEditField: (field: object, value: unknown, host: object, options?: object) => unknown;
  renderFilterField: (field: object, host: object) => unknown;
};
type SFGlobal = {fieldRenderers?: Renderers; html: (strings: TemplateStringsArray, ...values: unknown[]) => unknown; render: (what: unknown, where: Element) => void; nothing: unknown};

const sf = () => (window as unknown as {SF: SFGlobal}).SF;
const rows = document.querySelector<HTMLElement>('[data-rows]')!;
const sizeControl = document.querySelector<HTMLSelectElement>('[data-size]')!;
const search = document.querySelector<HTMLInputElement>('[data-search]')!;

const dataset = await fetch('/data/polygon.json').then((response) => response.json());
const references: Record<string, Array<Record<string, any>>> = dataset.references ?? {};
const OPTIONS_FROM: Record<string, string> = {section: 'sections', parent: 'sections', owner: 'users', reviewer: 'users', depends_on: 'relations'};

// One field per type and variant: the polygon's first of each, then the
// variants it does not carry.
const seen = new Set<string>();
const fields: Field[] = [];
for (const field of dataset.structure.fields as Field[]) {
  const kind = `${field.property_type}:${field.variant ?? ''}`;
  if (seen.has(kind)) continue;
  seen.add(kind);
  fields.push(field);
}
fields.push(
  {key: 'phone', label: 'Телефон', property_type: 'string', variant: 'phone'},
  {key: 'progress', label: 'Готовность', property_type: 'number', variant: 'scale', min: 0, max: 100},
  {key: 'labels', label: 'Метки значками', property_type: 'choices', variant: 'badges',
    options: (dataset.structure.fields.find((one: Field) => one.key === 'tags')?.options ?? [])},
);

// A value to show: the first record that has one, or a made-up one.
const EXTRA: Record<string, unknown> = {phone: '+7 916 123-45-67', progress: 64};
const sample = (field: Field): unknown => {
  if (field.key in EXTRA) return EXTRA[field.key];
  const source = field.key === 'labels' ? 'tags' : field.key;
  for (const record of dataset.records) {
    const value = record.values?.[source];
    if (value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && !value.length)) return value;
  }
  return null;
};

const optionsOf = (field: Field): Array<Record<string, any>> => {
  if (Array.isArray(field.options)) return field.options;
  const from = OPTIONS_FROM[field.key];
  return from ? (references[from] ?? []) : [];
};

const values = new Map<string, unknown>(fields.map((field) => [field.key, sample(field)]));
const filters = new Map<string, Record<string, any>>();
const searches = new Map<string, string>();

const asField = (field: Field) => ({
  ...field, propertyType: field.property_type, options: optionsOf(field),
  filter: {...(field.filter ?? {}), options: optionsOf(field), defaultOperator: 'in'},
});

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
    return optionsOf(field).filter((option) => !query || String(option.label ?? '').toLowerCase().includes(query));
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

function draw(): void {
  const {html, render, nothing, fieldRenderers} = sf();
  if (!fieldRenderers) return;
  const query = search.value.trim().toLowerCase();
  const size = sizeControl.value;
  const shown = fields.filter((field) => !query || `${field.label} ${field.property_type} ${field.variant ?? ''}`.toLowerCase().includes(query));
  render(html`${shown.map((field) => {
    const definition = asField(field);
    const value = values.get(field.key);
    const view = fieldRenderers.renderViewField(definition, value, host, {size});
    const edit = fieldRenderers.renderEditField(definition, value, host, {size});
    const filter = fieldRenderers.renderFilterField(definition, host);
    const none = html`<span class="properties-empty">—</span>`;
    return html`<div class="properties-row" role="row" data-property=${`${field.property_type}${field.variant ? `:${field.variant}` : ''}`}>
      <div class="properties-name" role="cell"><strong>${field.label}</strong><code>${field.property_type}${field.variant ? ` · ${field.variant}` : nothing}</code></div>
      <div class="properties-cell" role="cell" data-mode="view">${view ?? none}</div>
      <div class="properties-cell" role="cell" data-mode="edit">${edit ?? none}</div>
      <div class="properties-cell properties-filter" role="cell" data-mode="filter">${filter ?? none}</div>
    </div>`;
  })}`, rows);
}

sizeControl.addEventListener('change', draw);
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
else draw();
