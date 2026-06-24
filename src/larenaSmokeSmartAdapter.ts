type TableRow = {
  id?: number | string;
  title?: { name?: string } | string;
  code?: string;
  package?: string;
  scope?: string;
  source_layer?: string;
  state?: string;
};

type TableSettings = {
  key?: string;
  columnSettings?: Record<string, unknown>;
};

const enabled = import.meta.env.VITE_LARENA_SMOKE_SMART_ADAPTER === '1';

function defineElement(name: string, constructor: CustomElementConstructor) {
  if (!customElements.get(name)) {
    customElements.define(name, class extends constructor {});
  }
}

function textValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object') {
    const candidate = value as { name?: unknown; text?: unknown; title?: unknown };
    return String(candidate.name ?? candidate.text ?? candidate.title ?? '');
  }

  return String(value);
}

class LarenaSmokeElement extends HTMLElement {
  connectedCallback() {
    this.dataset.larenaSmokeSmartAdapter = '1';
  }

  setState(state: Record<string, unknown>) {
    Object.entries(state).forEach(([key, value]) => {
      this.dataset[key] = String(value ?? '');
    });
  }
}

class LarenaSmokeToggle extends LarenaSmokeElement {
  private changeHandler: (() => void) | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', this.getAttribute('role') || 'switch');
    this.tabIndex = this.tabIndex || 0;
    this.addEventListener('click', () => this.changeHandler?.());
  }

  onChange(handler: () => void) {
    this.changeHandler = handler;
  }

  setState(state: Record<string, unknown>) {
    if (state.icon) {
      this.setAttribute('icon', String(state.icon));
    }
    if ('checked' in state) {
      this.setAttribute('aria-checked', String(Boolean(state.checked)));
    }
  }
}

class LarenaSmokePagination extends LarenaSmokeElement {
  private state: Record<string, unknown> = { pageSize: 10, total: 0 };
  private rendered = false;

  connectedCallback() {
    super.connectedCallback();
    setTimeout(() => {
      this.rendered = true;
      this.dispatchEvent(new CustomEvent('sf-after-render'));
    });
  }

  onAfterRender(handler: () => void) {
    if (this.rendered) {
      queueMicrotask(handler);
      return;
    }

    this.addEventListener('sf-after-render', handler, { once: true });
  }

  getProp(key: string) {
    return this.state[key] ?? (key === 'pageSize' ? 10 : undefined);
  }

  setState(state: Record<string, unknown>) {
    this.state = { ...this.state, ...state };
    this.dataset.total = String(this.state.total ?? 0);
  }
}

class LarenaSmokeTable extends LarenaSmokeElement {
  private rows: TableRow[] = [];
  private columns: Array<Record<string, unknown>> = [];
  private settings: TableSettings = { key: 'admin_table' };
  private rendered = false;

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', this.getAttribute('role') || 'table');
    setTimeout(() => {
      this.rendered = true;
      this.dispatchEvent(new CustomEvent('sf-after-render'));
    });
  }

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) {
    super.addEventListener(type, listener, options);

    if (type === 'sf-after-render' && this.rendered) {
      queueMicrotask(() => {
        if (typeof listener === 'function') {
          listener.call(this, new CustomEvent('sf-after-render'));
          return;
        }

        listener.handleEvent(new CustomEvent('sf-after-render'));
      });
    }
  }

  getTableSettingsKey() {
    return this.settings.key || this.getAttribute('settings-key') || 'admin_table';
  }

  setTemplates() {
    return this;
  }

  getSelectedFilterTemplate() {
    return null;
  }

  setTableSettings(settings: TableSettings) {
    this.settings = { ...this.settings, ...settings };
  }

  setColumns(columns: Array<Record<string, unknown>>) {
    this.columns = [...columns];
    this.dataset.columnCount = String(this.columns.length);
  }

  setRows(rows: TableRow[]) {
    this.rows = [...rows];
    this.renderRows();
  }

  addRows(rows: TableRow[]) {
    this.rows = [...this.rows, ...rows];
    this.renderRows();
  }

  updateRowByKey(key: keyof TableRow, value: unknown, row: TableRow) {
    this.rows = this.rows.map((item) => (item[key] === value ? { ...item, ...row } : item));
    this.renderRows();
  }

  setDetailData(data: Record<string, unknown>) {
    this.dataset.detailLoaded = data.row ? '1' : '0';
  }

  private renderRows() {
    const table = document.createElement('table');
    table.className = 'larena-smoke-table';

    const tbody = document.createElement('tbody');
    for (const row of this.rows) {
      const tr = document.createElement('tr');
      tr.dataset.rowId = String(row.id ?? '');
      for (const value of [
        row.id,
        textValue(row.title),
        row.code,
        row.package,
        row.scope,
        row.source_layer,
        row.state,
      ]) {
        const td = document.createElement('td');
        td.textContent = textValue(value);
        tr.append(td);
      }
      tbody.append(tr);
    }

    table.append(tbody);
    this.replaceChildren(table);
    this.dataset.rowCount = String(this.rows.length);
  }
}

if (enabled) {
  const whenDefined = async (names: string | string[]) => {
    const list = Array.isArray(names) ? names : [names];
    await Promise.all(list.map((name) => customElements.whenDefined(name)));

    return list;
  };

  window.SF = {
    ...(window.SF ?? {}),
    whenDefine: whenDefined,
    whenDefined,
  };

  defineElement('sf-admin-menu', LarenaSmokeElement);
  defineElement('sf-admin-menu-item', LarenaSmokeElement);
  defineElement('sf-breadcrumbs', LarenaSmokeElement);
  defineElement('sf-table', LarenaSmokeTable);
  defineElement('sf-tree-item', LarenaSmokeElement);
  defineElement('sf-checkbox', LarenaSmokeElement);
  defineElement('sf-avatar', LarenaSmokeElement);
  defineElement('sf-pagination', LarenaSmokePagination);
  defineElement('sf-progress-scale', LarenaSmokeElement);
  defineElement('sf-tag', LarenaSmokeElement);
  defineElement('sf-toggle', LarenaSmokeToggle);
  defineElement('sf-icon-button', LarenaSmokeElement);

  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('sf-loader-init'));
  });
}
