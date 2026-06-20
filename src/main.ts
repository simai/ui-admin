import type {
  HTMLSfPaginationElement,
  HTMLSfTagElement,
  HTMLSfTableElement,
  HTMLSfToggleElement,
} from '../types/smart-components';
import type { AdminTableMockResponse, AdminViewSettings } from './adminTable';
import {
  fetchMockSolutions,
  fetchTaskDetail,
  fetchTemplate,
  saveTaskFields,
  saveTemplate,
  saveViewSettings,
} from './adminTable';

class AdminManager {
  themeButton: HTMLSfToggleElement | null;
  table: HTMLSfTableElement | null;
  pagination: HTMLSfPaginationElement | null;
  pageSize: number;
  meta: AdminTableMockResponse['meta'] | undefined;
  loadedBatchCount: number;
  columnsLoaded: boolean;
  filters: { [key: string]: any } = {};
  filterFieldsLoaded: boolean;
  viewSettings: AdminViewSettings | null;
  searchText: string;
  users: HTMLSfTagElement | null;
  constructor() {
    this.themeButton = null;
    this.table = null;
    this.pagination = null;
    this.pageSize = 10;
    this.meta = undefined;
    this.searchText = '';
    this.users = document.getElementById('users_count') as any | null;
    this.loadedBatchCount = 1;
    this.columnsLoaded = false;
    this.filterFieldsLoaded = false;
    this.viewSettings = null;
    this.init();
  }

  init() {
    this.initTheme();
    this.initTable();
  }

  async initTheme() {
    await SF.whenDefined('sf-toggle');
    this.themeButton = document.querySelector('#theme_toggle');
    this.applyTheme(this.detectTheme());
    this.themeButton?.onChange(this.toggleTheme);
  }
  toggleTheme = () => {
    const next = this.detectTheme() === 'dark' ? 'light' : 'dark';
    localStorage.setItem('sf-theme', next);
    this.applyTheme(next);
  };
  getStoredTheme = (): 'light' | 'dark' | null => {
    const stored = localStorage.getItem('sf-theme');
    return stored === 'light' || stored === 'dark' ? stored : null;
  };
  detectTheme = (): 'light' | 'dark' => {
    const stored = this.getStoredTheme();
    if (stored) return stored;
    if (document.documentElement.classList.contains('theme-dark'))
      return 'dark';
    if (document.documentElement.classList.contains('theme-light'))
      return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  };
  applyTheme = (theme: 'light' | 'dark') => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-light');
    root.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
    this.themeButton?.setState({
      icon: theme !== 'dark' ? 'light_mode' : 'dark_mode',
      checked: theme === 'dark',
    });
  };

  async initTable() {
    this.table = document.querySelector('sf-table');
    if (!this.table) return false;
    this.table?.addEventListener('onTemplateSave', async (event: Event) => {
      const e = event as CustomEvent<
        { [key: string]: any } | { [key: string]: any }[]
      >;
      console.log('Template saved with values:', e.detail);
      await saveTemplate(e.detail);
    });
    this.table.addEventListener('onFilterUpdate', async (event: Event) => {
      const e = event as CustomEvent<{ [key: string]: any }>;
      this.loadedBatchCount = 1;
      const filters = e.detail;
      this.filters = filters.values;
      await this.updateTable();
    });
    this.table.addEventListener('onSearchEnd', async (event) => {
      const e = event as CustomEvent<string>;
      this.searchText = e.detail;
      this.loadedBatchCount = 1;
      await this.updateTable();
    });
    this.table.addEventListener('onRowDetailRequest', async (event: Event) => {
      const e = event as CustomEvent<{
        row?: { id?: number | string; value?: number | string };
        tableSettingsKey?: string;
      }>;
      const rowId = e.detail?.row?.id ?? e.detail?.row?.value;
      if (!rowId) return;

      const tableSettingsKey =
        e.detail?.tableSettingsKey ||
        this.table?.getTableSettingsKey?.() ||
        'admin_table';
      const detail = await fetchTaskDetail(rowId, tableSettingsKey);
      if (detail.viewSettings) {
        this.viewSettings = this.mergeViewSettings(detail.viewSettings);
      }
      (this.table as any)?.setDetailData?.({
        row: detail.item,
        fields: detail.fields || [],
        viewSettings: detail.viewSettings,
      });
    });
    this.table.addEventListener(
      'onColumnSettingsChange',
      async (event: Event) => {
        const e = event as CustomEvent<{
          columnSettings: any;
          tableSettingsKey: string;
        }>;
        const tableSettingsKey = e.detail.tableSettingsKey;
        this.viewSettings = this.mergeViewSettings({
          table: {
            columns: e.detail.columnSettings,
          },
        });
        await saveViewSettings(tableSettingsKey, this.viewSettings);
      },
    );
    this.table.addEventListener('onFieldEdit', async (event: Event) => {
      const e = event as CustomEvent<{
        rowId?: number | string | null;
        values?: Record<string, unknown>;
        fields?: Array<Record<string, unknown>>;
        tableSettingsKey?: string;
      }>;
      const rowId = e.detail?.rowId;
      if (!rowId || !e.detail?.values) return;

      const detail = await saveTaskFields(rowId, {
        tableSettingsKey:
          e.detail.tableSettingsKey ||
          this.table?.getTableSettingsKey?.() ||
          'admin_table',
        values: e.detail.values,
        fields: e.detail.fields || [],
      });

      if (detail.viewSettings) {
        this.viewSettings = this.mergeViewSettings(detail.viewSettings);
      }
      if (detail.item) {
        this.table?.updateRowByKey('id', detail.item.id, detail.item as any);
        (this.table as any)?.setDetailData?.({
          row: detail.item,
          fields: detail.fields || [],
          viewSettings: detail.viewSettings,
        });
      }
    });
    this.table.addEventListener(
      'onFilterFieldSettingsChange',
      async (event: Event) => {
        const e = event as CustomEvent<{
          filterFieldSettings: Record<string, Record<string, unknown>>;
          tableSettingsKey: string;
        }>;
        const tableSettingsKey = e.detail.tableSettingsKey;
        this.viewSettings = this.mergeViewSettings({
          filter: {
            fields: e.detail.filterFieldSettings,
          },
        });
        await saveViewSettings(tableSettingsKey, this.viewSettings);
      },
    );
    this.table.addEventListener(
      'sf-after-render',
      async () => {
        const key = this.table?.getTableSettingsKey() || 'default';
        const data = await fetchTemplate(key);
        this.viewSettings = this.normalizeViewSettings(
          key,
          data.viewSettings,
          data.tableSettings,
        );
        const activeTemplate = this.table
          ?.setTemplates(data.templates || [])
          .getSelectedFilterTemplate?.();
        this.table?.setTableSettings({
          key,
          columnSettings: this.getTableColumnSettings(),
        });
        this.filters = activeTemplate?.data?.values || {};
        try {
          this.loadedBatchCount = 1;
          this.updateTable();
        } catch (error) {
          console.warn('Mock solutions load failed, use local fallback', error);
        }
        this.pagination = document.querySelector('sf-pagination');
        if (this.pagination) {
          this.pagination.onAfterRender(() => {
            this.pageSize = this.pagination?.getProp('pageSize') || 10;
            this.pagination?.setState({
              total: this.meta?.total || 0,
            });
          });
          this.pagination.addEventListener('sf-page-size-change', (e: Event) =>
            this.handlePageSizeChange(e as CustomEvent<{ pageSize: number }>),
          );
          this.pagination.addEventListener('sf-show-more', () =>
            this.handleShowMore(),
          );
          this.pagination.addEventListener('sf-page-change', (e: Event) =>
            this.handlePageChange(e as CustomEvent<{ current: number }>),
          );
        }
      },
      { once: true },
    );
  }
  updateTable = async (page = 1, update = false) => {
    const tableId = this.table?.getTableSettingsKey?.() || 'admin_table';
    const { rows, columns, fields, viewSettings, meta, users } =
      await fetchMockSolutions({
        page,
        limit: this.pageSize,
        search: this.searchText,
        filters: this.filters,
        tableId,
      });
    if (viewSettings) {
      this.viewSettings = this.mergeViewSettings(viewSettings);
    }
    this.applyServerColumns(columns);
    this.applyServerFilterFields(fields);
    if (update) {
      this.table?.addRows(rows);
    } else {
      this.table?.setRows(rows);
    }
    this.pagination?.setState({
      current: page,
      total: meta?.total || 0,
    });
    await SF.whenDefined('sf-tag');
    if (this.users) {
      this.users.setState({
        text: users.count,
      });
    }
  };
  handlePageChange = async (data: CustomEvent<{ current: number }>) => {
    const page = data.detail.current;
    await this.updateTable(page);
  };
  handlePageSizeChange = async (data: CustomEvent<{ pageSize: number }>) => {
    this.pageSize = data.detail.pageSize;
    this.loadedBatchCount = 1;
    this.columnsLoaded = false;
    this.filterFieldsLoaded = false;
    await this.updateTable();
  };

  handleShowMore = async () => {
    if (!this.table) return;

    const page = (this.loadedBatchCount += 1);
    await this.updateTable(page, true);
  };

  applyServerColumns(columns?: AdminTableMockResponse['columns']) {
    if (this.columnsLoaded || !columns?.length) return;

    this.table?.setColumns(columns);
    this.columnsLoaded = true;
  }

  applyServerFilterFields(fields?: AdminTableMockResponse['fields']) {
    if (this.filterFieldsLoaded || !fields?.length) return;

    this.table?.setFilterFields?.(this.applyFilterFieldSettings(fields));
    this.filterFieldsLoaded = true;
  }

  applyFilterFieldSettings(fields: AdminTableMockResponse['fields'] = []) {
    const settings = this.getFilterFieldSettings();

    return [...fields]
      .map((field, index) => {
        const fieldSettings = settings[field.key] || {};
        const control =
          typeof fieldSettings.control === 'string'
            ? fieldSettings.control
            : undefined;

        return {
          ...field,
          ...fieldSettings,
          filter: {
            ...(field.filter || {}),
            ...(control ? { control } : {}),
          },
          __sfOrder:
            typeof fieldSettings.order === 'number'
              ? fieldSettings.order
              : (index + 1) * 10,
        };
      })
      .sort((a, b) => {
        const orderDiff = (a.__sfOrder || 0) - (b.__sfOrder || 0);

        return (
          orderDiff ||
          String(a.label || '').localeCompare(String(b.label || ''))
        );
      })
      .map(({ __sfOrder, ...field }) => field);
  }

  normalizeViewSettings(
    key: string,
    viewSettings?: AdminViewSettings,
    legacyTableSettings?: {
      columnSettings?: Record<string, Record<string, unknown>>;
    },
  ): AdminViewSettings {
    const tableColumns =
      viewSettings?.table?.columns || legacyTableSettings?.columnSettings || {};

    return {
      key,
      ...(viewSettings || {}),
      table: {
        ...(viewSettings?.table || {}),
        columns: tableColumns,
      },
      detail: {
        ...(viewSettings?.detail || {}),
        fields: viewSettings?.detail?.fields || {},
      },
      filter: {
        ...(viewSettings?.filter || {}),
        fields: viewSettings?.filter?.fields || {},
      },
      editor: {
        ...(viewSettings?.editor || {}),
        fields: viewSettings?.editor?.fields || {},
      },
    };
  }

  mergeViewSettings(patch: AdminViewSettings): AdminViewSettings {
    const key = this.table?.getTableSettingsKey?.() || 'admin_table';
    const current = this.normalizeViewSettings(key, this.viewSettings || {});

    return {
      ...current,
      ...patch,
      table: {
        ...(current.table || {}),
        ...(patch.table || {}),
        columns: {
          ...(current.table?.columns || {}),
          ...(patch.table?.columns || {}),
        },
      },
      detail: {
        ...(current.detail || {}),
        ...(patch.detail || {}),
        fields: {
          ...(current.detail?.fields || {}),
          ...(patch.detail?.fields || {}),
        },
      },
      filter: {
        ...(current.filter || {}),
        ...(patch.filter || {}),
        fields: {
          ...(current.filter?.fields || {}),
          ...(patch.filter?.fields || {}),
        },
      },
      editor: {
        ...(current.editor || {}),
        ...(patch.editor || {}),
        fields: {
          ...(current.editor?.fields || {}),
          ...(patch.editor?.fields || {}),
        },
      },
    };
  }

  getTableColumnSettings() {
    return this.viewSettings?.table?.columns || {};
  }

  getFilterFieldSettings() {
    return this.viewSettings?.filter?.fields || {};
  }
}
function bootstrapAdmin() {
  if (window.adminManager) return;
  window.adminManager = new AdminManager();
}

if (window.SF?.Loader) {
  bootstrapAdmin();
} else {
  window.addEventListener('sf-loader-init', bootstrapAdmin, { once: true });
}

declare global {
  interface Window {
    adminManager?: AdminManager;
  }
}
