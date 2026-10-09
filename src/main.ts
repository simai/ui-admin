import type {
  HTMLSfTagElement,
  HTMLSfTableElement,
  HTMLSfToggleElement,
} from '../types/smart-components';
import type { AdminTableMockResponse, AdminViewSettings } from './adminTable';
import {
  createEntityItem,
  createEntityField,
  deleteEntityItem,
  deleteEntityField,
  fetchEntityCreateDraft,
  fetchMockSolutions,
  fetchTaskDetail,
  fetchTemplate,
  fetchUserDetail,
  saveTaskFields,
  saveTemplate,
  saveUserFields,
  saveViewSettings,
  updateEntityField,
} from './adminTable';
import './larenaSmokeSmartAdapter';
import { watchForStalePage } from './stale-page-notice';

type TablePageRequestDetail = {
  mode?: 'replace' | 'append';
  page?: number;
  current?: number;
  limit?: number;
  pageSize?: number;
  offset?: number;
};

class AdminManager {
  themeButton: HTMLSfToggleElement | null;
  table: HTMLSfTableElement | null;
  pageSize: number;
  columnsLoaded: boolean;
  filters: { [key: string]: any } = {};
  filterFieldsLoaded: boolean;
  viewSettings: AdminViewSettings | null;
  searchText: string;
  users: HTMLSfTagElement | null;
  constructor() {
    this.themeButton = null;
    this.table = null;
    this.pageSize = 10;
    this.searchText = '';
    this.users = document.getElementById('users_count') as any | null;
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
      const filters = e.detail;
      this.filters = filters.values;
      await this.updateTable({ page: 1, mode: 'replace' });
    });
    this.table.addEventListener('onSearchEnd', async (event) => {
      const e = event as CustomEvent<string>;
      this.searchText = e.detail;
      await this.updateTable({ page: 1, mode: 'replace' });
    });
    this.table.addEventListener('sf-table:page-request', async (event) => {
      const e = event as CustomEvent<TablePageRequestDetail>;
      await this.updateTable(e.detail);
    });
    this.table.addEventListener('onRowDetailRequest', async (event: Event) => {
      const e = event as CustomEvent<{
        row?: { id?: number | string; value?: number | string };
        entity?: string;
        detailEntity?: string;
        tableSettingsKey?: string;
      }>;
      const rowId = e.detail?.row?.id ?? e.detail?.row?.value;
      if (!rowId) return;
      const entity = e.detail?.entity || e.detail?.detailEntity || 'task';

      const tableSettingsKey =
        e.detail?.tableSettingsKey ||
        this.table?.getTableSettingsKey?.() ||
        'admin_table';
      const detail =
        entity === 'user'
          ? await fetchUserDetail(rowId, tableSettingsKey)
          : await fetchTaskDetail(rowId, tableSettingsKey);
      if (detail.viewSettings) {
        this.viewSettings = this.mergeViewSettings(detail.viewSettings);
      }
      (this.table as any)?.setDetailData?.({
        entity,
        title: detail.title,
        heading: detail.heading,
        row: detail.item,
        fields: detail.fields || [],
        viewSettings: detail.viewSettings,
      });
    });
    this.table.addEventListener('onRowCreateRequest', async (event: Event) => {
      const e = event as CustomEvent<{
        entity?: string;
        detailEntity?: string;
        tableSettingsKey?: string;
      }>;
      const entity = e.detail?.entity || e.detail?.detailEntity || 'task';
      const tableSettingsKey =
        e.detail?.tableSettingsKey ||
        this.table?.getTableSettingsKey?.() ||
        'admin_table';
      const detail = await fetchEntityCreateDraft(entity, tableSettingsKey);

      if (detail.viewSettings) {
        this.viewSettings = this.mergeViewSettings(detail.viewSettings);
      }

      (this.table as any)?.setDetailData?.({
        mode: 'create',
        entity,
        title: detail.title,
        heading: detail.heading,
        row: detail.item,
        fields: detail.fields || [],
        viewSettings: detail.viewSettings,
        editAll: true,
      });
      await (this.table as any)?.setAllDetailFieldsEdited?.(true, 'row-create-edit-all');
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
        entity?: string;
        detailEntity?: string;
        tableSettingsKey?: string;
      }>;
      const rowId = e.detail?.rowId;
      if (!rowId || !e.detail?.values) return;
      const entity = e.detail?.entity || e.detail?.detailEntity || 'task';

      const payload = {
        tableSettingsKey:
          e.detail.tableSettingsKey ||
          this.table?.getTableSettingsKey?.() ||
          'admin_table',
        values: e.detail.values,
        fields: e.detail.fields || [],
      };
      const detail =
        entity === 'user'
          ? await saveUserFields(rowId, payload)
          : await saveTaskFields(rowId, payload);

      if (detail.viewSettings) {
        this.viewSettings = this.mergeViewSettings(detail.viewSettings);
      }
      if (detail.item) {
        this.applySavedTableRows(detail);
        (this.table as any)?.setDetailData?.({
          entity,
          title: detail.title,
          heading: detail.heading,
          row: detail.item,
          fields: detail.fields || [],
          viewSettings: detail.viewSettings,
        });
        (this.table as any)?.notifyTableSuccess?.('Данные успешно изменены');
      }
    });
    this.table.addEventListener('onRowCreateSubmit', async (event: Event) => {
      const e = event as CustomEvent<{
        values?: Record<string, unknown>;
        fields?: Array<Record<string, unknown>>;
        entity?: string;
        detailEntity?: string;
        tableSettingsKey?: string;
      }>;
      if (!e.detail?.values) return;
      const entity = e.detail?.entity || e.detail?.detailEntity || 'task';
      const tableSettingsKey =
        e.detail.tableSettingsKey ||
        this.table?.getTableSettingsKey?.() ||
        'admin_table';
      const payload = {
        tableSettingsKey,
        values: e.detail.values,
        fields: e.detail.fields || [],
      };
      const detail = await createEntityItem(entity, payload);

      if (detail.viewSettings) {
        this.viewSettings = this.mergeViewSettings(detail.viewSettings);
      }

      if (detail.item) {
        const pagination = (this.table as any)?.getPaginationData?.() || {};
        await this.updateTable({
          page: pagination.current || pagination.page || 1,
          limit: pagination.pageSize || this.pageSize,
          mode: 'replace',
        });
        (this.table as any)?.setDetailData?.({
          mode: 'view',
          entity,
          title: detail.title,
          heading: detail.heading,
          row: detail.item,
          fields: detail.fields || [],
          viewSettings: detail.viewSettings,
        });
        (this.table as any)?.notifyTableSuccess?.('Запись успешно создана');
      }
    });
    this.table.addEventListener('onFieldCreateSubmit', async (event: Event) => {
      const e = event as CustomEvent<{
        entity?: string;
        tableSettingsKey?: string;
        fieldType?: string;
        settings?: Record<string, unknown>;
      }>;
      const entity = e.detail.entity || 'task';
      const fieldType = e.detail.fieldType;

      if (!fieldType || !e.detail.settings) {
        return;
      }

      const result = await createEntityField(entity, {
        tableSettingsKey:
          e.detail.tableSettingsKey ||
          this.table?.getTableSettingsKey?.() ||
          'admin_table',
        fieldType,
        settings: e.detail.settings,
      });

      if (result.viewSettings) {
        this.viewSettings = this.mergeViewSettings(result.viewSettings);
      }

      this.applySavedTableRows(result);
      (this.table as any)?.applyCreatedFieldResponse?.(result);
    });
    this.table.addEventListener('onFieldSettingsSubmit', async (event: Event) => {
      const e = event as CustomEvent<{
        entity?: string;
        tableSettingsKey?: string;
        fieldKey?: string;
        fieldType?: string;
        settings?: Record<string, unknown>;
      }>;
      const entity = e.detail.entity || 'task';
      const fieldKey = e.detail.fieldKey;

      if (!fieldKey || !e.detail.settings) {
        return;
      }

      const result = await updateEntityField(entity, fieldKey, {
        tableSettingsKey:
          e.detail.tableSettingsKey ||
          this.table?.getTableSettingsKey?.() ||
          'admin_table',
        fieldType: e.detail.fieldType,
        settings: e.detail.settings,
      });

      if (result.viewSettings) {
        this.viewSettings = this.mergeViewSettings(result.viewSettings);
      }

      this.applySavedTableRows(result);
      (this.table as any)?.applyCreatedFieldResponse?.(result);
    });
    this.table.addEventListener('onFieldDeleteSubmit', async (event: Event) => {
      const e = event as CustomEvent<{
        entity?: string;
        tableSettingsKey?: string;
        fieldKey?: string;
      }>;
      const entity = e.detail.entity || 'task';
      const fieldKey = e.detail.fieldKey;

      if (!fieldKey) {
        return;
      }

      const result = await deleteEntityField(entity, fieldKey, {
        tableSettingsKey:
          e.detail.tableSettingsKey ||
          this.table?.getTableSettingsKey?.() ||
          'admin_table',
        itemId: (this.table as any)?.getDetailRow?.()?.id,
      });

      if (result.viewSettings) {
        this.viewSettings = this.mergeViewSettings(result.viewSettings);
      }

      this.applySavedTableRows(result);
      (this.table as any)?.applyDeletedFieldResponse?.(result);
    });
    this.table.addEventListener('onRowDeleteSubmit', async (event: Event) => {
      const e = event as CustomEvent<{
        entity?: string;
        rowId?: number | string | null;
        tableSettingsKey?: string;
      }>;
      const entity = e.detail.entity || 'task';
      const rowId = e.detail.rowId;

      if (!rowId) {
        return;
      }

      const tableSettingsKey =
        e.detail.tableSettingsKey ||
        this.table?.getTableSettingsKey?.() ||
        'admin_table';
      const pagination = (this.table as any)?.getPaginationData?.() || {};

      await deleteEntityItem(entity, rowId, tableSettingsKey);
      await this.updateTable({
        page: pagination.current || pagination.page || 1,
        limit: pagination.pageSize || this.pageSize,
        mode: 'replace',
      });
      (this.table as any)?.notifyTableSuccess?.('Запись успешно удалена');
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
      'onDetailFieldSettingsChange',
      async (event: Event) => {
        const e = event as CustomEvent<{
          detailFieldSettings: Record<string, Record<string, unknown>>;
          tableSettingsKey: string;
        }>;
        const tableSettingsKey = e.detail.tableSettingsKey;
        this.viewSettings = this.mergeViewSettings({
          detail: {
            fields: e.detail.detailFieldSettings,
          },
        });
        await saveViewSettings(tableSettingsKey, this.viewSettings);
      },
    );
    this.table.addEventListener(
      'sf-after-render',
      async () => {
        try {
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
          await this.updateTable({ page: 1, mode: 'replace' });
        } catch (error) {
          console.error('Failed to initialize admin table', error);
          this.table?.notifyTableError(error);
        }
      },
      { once: true },
    );
  }

  applySavedTableRows(detail: {
    item?: Record<string, any>;
    affectedRows?: Array<Record<string, any>>;
    rows?: Array<Record<string, any>>;
  }) {
    if (!this.table?.updateRowByKey) {
      return;
    }

    const rows = detail.affectedRows?.length
      ? detail.affectedRows
      : detail.rows?.length
        ? detail.rows
        : [];

    rows.forEach((row) => {
      if (row?.id) {
        this.table?.updateRowByKey('id', row.id, row as any);
      }
    });
  }

  updateTable = async (request: TablePageRequestDetail = {}) => {
    const page = request.page || request.current || 1;
    const limit = request.limit || request.pageSize || this.pageSize;
    const append = request.mode === 'append';

    this.pageSize = limit;

    const tableId = this.table?.getTableSettingsKey?.() || 'admin_table';
    const { rows, columns, fields, fieldTypes, viewSettings, pagination, users } =
      await fetchMockSolutions({
        page,
        limit,
        search: this.searchText,
        filters: this.filters,
        tableId,
      });
    if (viewSettings) {
      this.viewSettings = this.mergeViewSettings(viewSettings);
    }
    this.applyServerColumns(columns);
    this.table?.setFieldTypes?.(fieldTypes || []);
    this.applyServerFilterFields(fields);
    if (append) {
      this.table?.appendTableData?.({ rows, pagination });
    } else {
      this.table?.setTableData?.({ rows, pagination });
    }
    await SF.whenDefined('sf-tag');
    if (this.users) {
      this.users.setState({
        text: users.count,
      });
    }
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

// The host sends no Cache-Control, so a browser may be showing a copy of this
// page from before the last publish. Say so rather than letting it pass.
watchForStalePage();
