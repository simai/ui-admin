type AdminTableColumnType =
  | 'select'
  | 'handle'
  | 'text'
  | 'tree'
  | 'tag'
  | 'progress'
  | 'avatar'
  | 'actions';

type AdminSmartComponentMeta = {
  type: string;
  props?: Record<string, unknown>;
  propsMap?: Record<string, string>;
};

type AdminTableColumn = {
  key: string;
  label: string;
  type?: AdminTableColumnType;
  width?: string;
  sortable?: boolean;
  visible?: boolean;
};

export type AdminViewSettings = {
  key?: string;
  table?: {
    columns?: Record<string, Record<string, unknown>>;
  };
  detail?: {
    fields?: Record<string, Record<string, unknown>>;
  };
  filter?: {
    fields?: Record<string, Record<string, unknown>>;
  };
  editor?: {
    fields?: Record<string, Record<string, unknown>>;
  };
  updatedAt?: string;
};

type AdminTableFilterField = {
  key: string;
  label: string;
  dataType?: string;
  type: string;
  column?: {
    enabled?: boolean;
    visible?: boolean;
    renderer?: string;
    component?: AdminSmartComponentMeta;
  };
  filter?: {
    enabled?: boolean;
    control?: string;
    searchable?: boolean;
    searchKeys?: string[];
    optionSearchKeys?: string[];
    options?: Array<Record<string, unknown>>;
    optionsEndpoint?: string;
    optionsSource?: {
      type: 'static' | 'endpoint';
      url?: string;
      items?: Array<Record<string, unknown>>;
    };
    operators?: string[];
    defaultOperator?: string;
    optionRenderer?: string;
    optionComponent?: AdminSmartComponentMeta;
  };
  detail?: {
    enabled?: boolean;
    renderer?: string;
    component?: AdminSmartComponentMeta | null;
  };
  editor?: {
    enabled?: boolean;
    control?: string;
    options?: Array<Record<string, unknown>>;
    optionsSource?: {
      type: 'static' | 'endpoint';
      url?: string;
      items?: Array<Record<string, unknown>>;
    };
    component?: AdminSmartComponentMeta | null;
  };
  capabilities?: {
    editableDisplay?: boolean;
    editableFilter?: boolean;
    sortable?: boolean;
    hideable?: boolean;
  };
  displayOptions?: {
    columnRenderers?: string[];
    filterControls?: string[];
    editorControls?: string[];
  };
};

type AdminTableTag = {
  text: string;
  type: string;
};

type AdminTableAvatar = {
  title: string;
  ariaLabel: string;
  imageUrl: string;
};

type AdminTableAction = {
  id?: string;
  icon: string;
  label: string;
  value: string;
  component?: {
    type: string;
    props?: Record<string, unknown>;
  };
};

export type AdminTableRow = {
  id: number;
  title: {
    name: string;
    icon?: string | false;
  };
  code: string;
  version: AdminTableTag;
  status: number;
  author: AdminTableAvatar;
  createdAt: string;
  updatedAt: string;
  actions: AdminTableAction[];
};

export type AdminTableMockResponse = {
  columns?: AdminTableColumn[];
  fields?: AdminTableFilterField[];
  columnSettings?: Record<string, Record<string, unknown>>;
  tableSettings?: {
    key?: string;
    columnSettings?: Record<string, Record<string, unknown>>;
    updatedAt?: string;
  };
  viewSettings?: AdminViewSettings;
  items: Array<
    Omit<AdminTableRow, 'actions'> & {
      actions?: AdminTableAction[];
    }
  >;
  meta?: {
    current: number;
    limit: number;
    total: number;
    pageSize: number;
  };
  users: { count: number };
};

export type AdminTaskDetailResponse = {
  success?: boolean;
  item?: AdminTableMockResponse['items'][number];
  fields?: AdminTableFilterField[];
  viewSettings?: AdminViewSettings;
};

export type AdminTaskFieldsSavePayload = {
  tableSettingsKey?: string;
  values: Record<string, unknown>;
  fields?: Array<Record<string, unknown>>;
};

export const adminTableColumns: AdminTableColumn[] = [
  { key: 'select', label: '', type: 'select' },
  { key: 'handle', label: '', type: 'handle' },
  { key: 'id', label: 'ID', type: 'text' },
  { key: 'title', label: 'Название', type: 'tree' },
  { key: 'code', label: 'Код решения', type: 'text' },
  { key: 'version', label: 'Последняя версия', type: 'tag' },
  { key: 'status', label: 'Статус', type: 'progress' },
  { key: 'author', label: 'Автор', type: 'avatar' },
  { key: 'createdAt', label: 'Создан', type: 'text' },
  { key: 'updatedAt', label: 'Обновлен', type: 'text' },
  { key: 'actions', label: 'Действия', type: 'actions' },
];

const defaultActions: AdminTableAction[] = [
  createTableAction('edit', 'edit', 'Редактировать'),
  createTableAction('view', 'visibility', 'Посмотреть'),
  createTableAction('delete', 'delete', 'Удалить'),
];

export const initialAdminTableRows: AdminTableRow[] = [
  createAdminRow(12928, 'SIMAI: Бекап файлов', 'simai.filebackup'),
  createAdminRow(12929, 'SIMAI: Платежи', 'simai.payments'),
  createAdminRow(12930, 'SIMAI: Хранилище данных', 'simai.storage'),
  createAdminRow(12931, 'SIMAI: Редактор контента', 'simai.content', false),
  createAdminRow(12932, 'SIMAI: Управление пользователями', 'simai.users'),
  createAdminRow(12933, 'SIMAI: Аналитика', 'simai.analytics'),
  createAdminRow(12934, 'SIMAI: Интеграции', 'simai.integrations'),
  createAdminRow(12935, 'SIMAI: Документы', 'simai.documents'),
  createAdminRow(12936, 'SIMAI: Уведомления', 'simai.notifications'),
  createAdminRow(12937, 'SIMAI: Каталог', 'simai.catalog'),
];

export async function fetchTemplate(key: string) {
  const url = new URL(
    `/api/settings/get?tableId=${key}`,
    window.location.origin,
  );
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch template');
  }
  return await response.json();
}

export async function saveTemplate(
  data: Record<string, unknown> | Record<string, unknown>[],
) {
  const url = new URL('/api/template/save', window.location.origin);
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to save template');
  }
}

export async function saveViewSettings(
  tableId: string,
  data: AdminViewSettings,
) {
  const url = new URL(`/api/view-settings/${tableId}`, window.location.origin);
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to save view settings for ${tableId}`);
  }

  return await response.json();
}

export async function fetchTaskDetail(
  taskId: number | string,
  tableId = 'admin_table',
): Promise<AdminTaskDetailResponse> {
  const url = new URL(`/api/tasks/${taskId}`, window.location.origin);
  url.searchParams.set('tableId', tableId);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to load task detail ${taskId}`);
  }

  return (await response.json()) as AdminTaskDetailResponse;
}

export async function saveTaskFields(
  taskId: number | string,
  data: AdminTaskFieldsSavePayload,
): Promise<AdminTaskDetailResponse> {
  const url = new URL(`/api/tasks/${taskId}`, window.location.origin);

  const response = await fetch(url.toString(), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to save task fields ${taskId}`);
  }

  return (await response.json()) as AdminTaskDetailResponse;
}

export async function fetchMockSolutions({
  page = 1,
  limit = 10,
  search = '',
  tableId = 'admin_table',
  ...filters
}: {
  page?: number;
  limit?: number;
  search?: string;
  tableId?: string;
  [key: string]: any;
} = {}): Promise<{
  rows: AdminTableRow[];
  columns?: AdminTableColumn[];
  fields?: AdminTableFilterField[];
  viewSettings?: AdminViewSettings;
  meta?: AdminTableMockResponse['meta'];
  users: { count: number };
}> {
  const url = new URL('/api/tasks', window.location.origin);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('tableId', tableId);
  if (search) {
    url.searchParams.set('search', search);
  }
  if (Object.keys(filters?.filters ?? {}).length) {
    url.searchParams.set('filters', JSON.stringify(filters.filters));
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to load mock solutions page ${page}`);
  }

  const data = (await response.json()) as AdminTableMockResponse;

  return {
    columns: data.columns,
    fields: data.fields,
    viewSettings: data.viewSettings,
    users: data.users,
    rows: data.items.map((item) => ({
      ...item,
      actions: normalizeTableActions(item.actions || defaultActions),
    })),
    meta: data.meta,
  };
}

function normalizeTableActions(actions: AdminTableAction[] = []) {
  return actions.map((action) => {
    const id = action.id || action.value;

    if (action.component) {
      return {
        ...action,
        id,
      };
    }

    return createTableAction(id, action.icon, action.label, action.value);
  });
}

function createTableAction(
  id: string,
  icon: string,
  label: string,
  value = id,
): AdminTableAction {
  return {
    id,
    icon,
    label,
    value,
    component: {
      type: 'icon-button',
      props: {
        variant: 'icon',
        size: '1',
        type: 'link',
        scheme: 'on-surface',
        icon,
        ariaLabel: label,
        value,
      },
    },
  };
}

export class AdminTableRenderer {
  private rows: AdminTableRow[] = [];
  private readonly tbody: HTMLTableSectionElement;
  private readonly columns: AdminTableColumn[];

  constructor(tbody: HTMLTableSectionElement, columns: AdminTableColumn[]) {
    this.tbody = tbody;
    this.columns = columns;
  }

  setRows(rows: AdminTableRow[]) {
    this.rows = [...rows];
    this.render();
  }

  appendRows(rows: AdminTableRow[]) {
    this.rows = [...this.rows, ...rows];
    this.render();
  }

  getRows() {
    return [...this.rows];
  }

  private render() {
    this.tbody.replaceChildren(...this.rows.map((row) => this.renderRow(row)));
  }

  private renderRow(row: AdminTableRow) {
    const tr = document.createElement('tr');
    tr.dataset.rowId = String(row.id);
    tr.append(...this.columns.map((column) => this.renderCell(row, column)));
    return tr;
  }

  private renderCell(row: AdminTableRow, column: AdminTableColumn) {
    const td = document.createElement('td');
    const content = this.renderCellContent(row, column);

    if (content instanceof Node) {
      td.append(content);
    } else {
      td.textContent = content;
    }

    return td;
  }

  private renderCellContent(row: AdminTableRow, column: AdminTableColumn) {
    switch (column.type) {
      case 'select':
        return SF.create('sf-checkbox', { value: String(row.id) });
      case 'handle':
        return SF.create('sf-icon-button', {
          size: '1',
          type: 'link',
          scheme: 'on-surface',
          icon: 'menu',
          'aria-label': `Перетащить ${row.title}`,
        });
      case 'tree':
        const { name, icon } = row.title;
        return createElement(
          'sf-tree-item',
          {
            filled: true,
            icon: icon === false ? 'false' : icon || undefined,
          },
          name,
        );
      case 'tag':
        return SF.create('sf-tag', {
          type: row.version.type,
          size: '1/2',
          text: row.version.text,
        });
      case 'progress':
        return SF.create('sf-progress-scale', {
          size: '1',
          value: String(row.status),
        });
      case 'avatar':
        return SF.create('sf-avatar', {
          size: '1',
          template: 'label',
          rootClass: 'sf-admin-table-avatar',
          'image-url': row.author.imageUrl,
          title: row.author.title,
          'aria-label': row.author.ariaLabel,
        });
      case 'actions':
        return renderActions(row);
      case 'text':
      default:
        return String(row[column.key as keyof AdminTableRow] ?? '');
    }
  }
}

function createAdminRow(
  id: number,
  title: string,
  code: string,
  titleIcon: string | false | undefined = undefined,
): AdminTableRow {
  return {
    id,
    title: {
      name: title,
      icon: titleIcon,
    },
    code,
    version: {
      type: 'success',
      text: 'Success',
    },
    status: 40,
    author: {
      title: 'Александр',
      ariaLabel: 'Егор',
      imageUrl: 'https://randomuser.me/api/portraits/men/75.jpg',
    },
    createdAt: '15.03.2025',
    updatedAt: '15.03.2025',
    actions: defaultActions,
  };
}

function renderActions(row: AdminTableRow) {
  const wrap = document.createElement('div');
  wrap.className = 'flex items-cross-center gap-1/3';
  wrap.append(
    ...row.actions.map((action) =>
      SF.create('sf-icon-button', {
        variant: 'icon',
        size: '1',
        type: 'link',
        scheme: 'on-surface',
        icon: action.icon,
        value: action.value,
        'aria-label': `${action.label}: ${row.title}`,
      }),
    ),
  );
  return wrap;
}

function createElement(
  tagName: string,
  attrs: Record<string, string | boolean | undefined>,
  textContent = '',
) {
  const element = document.createElement(tagName);

  Object.entries(attrs).forEach(([name, value]) => {
    if (value === false || value === undefined || value === '') {
      return;
    }

    if (value === true) {
      element.setAttribute(name, '');
      return;
    }

    element.setAttribute(name, value);
  });

  if (textContent) {
    element.textContent = textContent;
  }

  return element;
}
