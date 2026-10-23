# sf-table на mock API (`/mock-api.html`)

Этот документ — о странице `/mock-api.html`, где `sf-table` управляется
методами и событиями через `src/main.ts` и ходит в `server.js` по HTTP.
Главная страница (`/`) соединяет `sf-data-view` и `sf-table` с хостом через
host port — см. [связи компонентов](component-connections.md) и
[POLYGON.md](../POLYGON.md).

`sf-table` - stateful smart-компонент административной таблицы. Он управляет
табличной разметкой, поиском, фильтрами, настройками колонок, detail-формой,
созданием и удалением записей, пользовательскими полями, пагинацией и alerts.
Компонент не делает HTTP-запросов сам: данные и сохранение принадлежат Admin и
backend.

Исходник компонента — пакет `larena` в репозитории
[`simai/ui-pro`](https://github.com/simai/ui-pro),
`components/src/smart/table/`; полное
руководство — `docs/smart-table-guide.md` там же. Rule
связывает `sf-table` с loader key `cl-table`, а `index.js` регистрирует custom
element через `SfTable.define('sf-table')`.

## Статус доказательств

Связь страницы с таблицей, URL и преобразование HTTP payload подтверждены
`mock-api.html`, `src/main.ts` и `src/adminTable.ts`; публичные методы и
события — исходником таблицы в `simai/ui-pro`. Что страница грузит именно
закреплённые выпуски, проверяют `npm run test:runtime` и
`npm run check:published` ([Framework runtime](framework-runtime.md)).

## Граница ответственности

| Слой | Отвечает за |
| --- | --- |
| `sf-table` | UI state, валидацию detail, CustomEvent, рендер таблицы и модалок |
| `mock-api.html` | создаёт `<sf-table>` с `table-settings-key` |
| `src/main.ts` | подписывается на события, запрашивает/применяет данные, сохраняет view settings |
| `src/adminTable.ts` | строит URLs, отправляет JSON/multipart, нормализует ответы |
| Backend | rows, columns, fields, fieldTypes, detail, persistence и конечная схема |

После create/update/delete Admin не конструирует схему таблицы вручную. Ответ
backend является источником истины для `rows`, `columns`, `fields`,
`fieldTypes` и `viewSettings`.

## Загрузка и инициализация

Core loader обнаруживает `<sf-table>` по `RuleLoader.tags`. Rule `cl-table`
загружает сам компонент и relation-зависимости: checkbox, buttons,
icon-buttons, icons, inputs, list, tags, pagination, datepicker, context-menu,
tabs и radio. Их не нужно подключать отдельными script tags на странице.

После регистрации элемента Admin ждёт `SF.Loader` или событие `sf-loader-init`,
создаёт `AdminManager` и подписывается на table events. Первый `updateTable()`
загружает список и передаёт данные через public API:

```ts
table.setColumns(columns)
table.setFieldTypes(fieldTypes)
table.setFilterFields(fields)
table.setTableData({ rows, pagination })
```

`columnsLoaded` и `filterFieldsLoaded` в `AdminManager` защищают базовую схему
от повторной замены при каждом запросе страницы. Актуальные строки и pagination
при этом обновляются на каждом `updateTable()`.

Первичная загрузка выполняется после `sf-after-render` как одна async-операция:
сначала settings и templates, затем первая страница данных. Ошибка на любом
этапе перехватывается, записывается в console и выводится пользователю через
`notifyTableError()`. Локального fallback-набора строк нет: при такой ошибке
состояние таблицы не считается актуальным, а причину нужно исправлять в API или
runtime.

## Атрибуты элемента

| Атрибут | Значение по умолчанию | Роль |
| --- | --- | --- |
| `table-settings-key` | `users` | ключ пользовательских settings; Admin задаёт `admin_table` |
| `pagin` | `false` | включает встроенный `sf-pagination`; в Admin включён |
| `selectable` | `true` | системная колонка выбора |
| `settings` | `true` | системная колонка настроек строки |
| `actions` | `true` | системная колонка действий справа |
| `filter-text`, `clear-text`, `search-placeholder`, `create-text` | локализованные строки | подписи UI |
| `pagination-total`, `pagination-page-size`, `page-sizes` | fallback pagination | используются без ответа API |

## Данные таблицы

Главный public method:

```ts
table.setTableData({
  columns,
  rows,
  fields,
  columnSettings,
  pagination,
})
```

`items` допустим как alias для `rows`. `setTableData()` нормализует данные и
добавляет системные ячейки `select`, `settings`, `actions`, если соответствующие
колонки включены. Для дозагрузки следующей страницы применяется
`appendTableData({ rows, pagination })`; он сохраняет текущие строки и меняет
только pagination/добавляемую часть.

## Типы данных: вход и выход

### Что принимает публичный API таблицы

| Метод | Принимает | Результат |
| --- | --- | --- |
| `setTableData(patch)` | object с любым подмножеством `columns`, `rows`/`items`, `fields`, `columnSettings`, `pagination` | merge в table data, нормализация rows и pagination |
| `appendTableData(patch)` | тот же object, но `rows` добавляются к текущим | расширенный список rows и обновлённая pagination |
| `setColumns(columns)` | `Array<Column>` или функция от текущего массива | заменяет только базовые columns |
| `setFilterFields(fields)` | `Array<Field>` | заменяет описание доступных фильтров |
| `setFieldTypes(fieldTypes)` | `Array<FieldType>` | заменяет каталог типов для flow создания полей |
| `setDetailData(data)` | `entity`, `title`, `heading`, `row`, `fields`, `viewSettings`, опционально `mode` и `editAll` | открывает/обновляет detail state |
| `updateRowByKey(key, value, patch)` | ключ строки, искомое значение и object/function patch | обновляет строку текущей страницы |

`setTableData()` и `appendTableData()` принимают также функцию: она получает
текущее состояние данных и должна вернуть новый patch. Это полезно только для
локальных UI-изменений; для server-backed CRUD используйте ответ backend.

### Column

Минимальный тип колонки в текущем Admin:

```ts
type Column = {
  key: string
  label: string
  type?: 'select' | 'handle' | 'text' | 'tree' | 'tag' | 'progress' | 'avatar' | 'actions'
  width?: string
  sortable?: boolean
  visible?: boolean
}
```

`sf-table` допускает расширение: `order`, `minWidth`, `maxWidth`,
`displayField`, `renderer`, `component`, `draggable`, `resizable`. Значение
`key` должно совпадать с ключом в row и, когда поле является редактируемым, с
`fields[].key`.

### Row

Строка - объект с обязательным идентификатором для текущего CRUD flow. Демо
использует `id: number`, `title`, `code`, `version`, `status`, `author`, даты и
массив actions, но table может отрисовывать произвольные поля, описанные
columns/fields.

```ts
type Row = {
  id: number | string
  [fieldKey: string]: unknown
}
```

Для object cell указывайте `displayField` в column либо возвращайте одно из
распознаваемых display-свойств: `displayValue`, `label`, `title`, `name`,
`value`, `id`. `actions` - массив объектов с `id?`, `icon`, `label`, `value` и
опциональным `{ component: { type, props } }`.

### Field и FieldType

`Field` описывает значение и его UI-представления. Минимально нужны `key`,
`label` и тип (`fieldType`, `type` или `dataType`). Дополнительные зоны:

```ts
type Field = {
  key: string
  label: string
  fieldType?: string
  type?: string
  dataType?: string
  column?: { enabled?: boolean; visible?: boolean; renderer?: string; component?: ComponentMeta }
  filter?: { enabled?: boolean; control?: string; options?: Array<Record<string, unknown>> }
  detail?: { enabled?: boolean; renderer?: string; component?: ComponentMeta | null }
  editor?: { enabled?: boolean; control?: string; options?: Array<Record<string, unknown>> }
  capabilities?: { editableDisplay?: boolean; editableFilter?: boolean; sortable?: boolean; hideable?: boolean }
}

type FieldType = {
  id: string
  label: string
  icon?: string
  group?: string
  dataType?: string
  editorComponent?: string
  settings?: Array<Record<string, unknown>>
}
```

`ComponentMeta` имеет `type: string`, optional `props` и `propsMap`. Поле
`optionsSource` может задать статические `items` либо endpoint URL. Это contract
для UI; backend сам определяет, разрешено ли использовать endpoint и какие
options вернуть.

### Pagination и view settings

```ts
type Pagination = {
  current?: number
  page?: number
  limit: number
  pageSize: number | number[]
  total: number
  offset?: number
  nextOffset?: number
  pageSizes?: number[]
  totalPages?: number
  pageCount?: number
  hasMore?: boolean
}

type ViewSettings = {
  key?: string
  table?: { columns?: Record<string, Record<string, unknown>> }
  detail?: { fields?: Record<string, Record<string, unknown>> }
  filter?: { fields?: Record<string, Record<string, unknown>> }
  editor?: { fields?: Record<string, Record<string, unknown>> }
  updatedAt?: string
}
```

Table нормализует pagination и принимает синонимы `current/page`,
`limit/pageSize`, `pageCount/totalPages`. `ViewSettings` хранится частями:
Admin объединяет patch, а не заменяет весь объект при изменении одной зоны.

### Что table отправляет через события

| Событие | Минимальный `event.detail` |
| --- | --- |
| `sf-table:page-request` | `mode`, `page/current`, `limit/pageSize`, `offset`, `tableSettingsKey`, filters/search |
| `onRowDetailRequest` | `row` с `id` или `value`, `entity`/`detailEntity`, `tableSettingsKey` |
| `onFieldEdit` | `rowId`, `entity`/`detailEntity`, `tableSettingsKey`, `values: Record<string, unknown>`, `fields: Array<Record<string, unknown>>` |
| `onRowCreateSubmit` | `entity`/`detailEntity`, `tableSettingsKey`, `values`, `fields` |
| `onRowDeleteSubmit` | `entity`, `rowId`, `tableSettingsKey` |
| `onFieldCreateSubmit` | `entity`, `tableSettingsKey`, `fieldType`, `settings` |
| `onFieldSettingsSubmit` | `entity`, `tableSettingsKey`, `fieldKey`, `fieldType?`, `settings` |
| `onFieldDeleteSubmit` | `entity`, `tableSettingsKey`, `fieldKey` |
| settings events | `tableSettingsKey` и соответствующий map: `columnSettings`, `filterFieldSettings` или `detailFieldSettings` |

### HTTP payload и ожидаемые ответы Admin

Редактирование и создание записи используют один payload:

```json
{
  "tableSettingsKey": "admin_table",
  "values": { "status": "done" },
  "fields": []
}
```

Создание поля передаёт `{ tableSettingsKey?, fieldType, settings }`; изменение
поля - `{ tableSettingsKey?, fieldType?, settings }`; удаление поля -
`{ tableSettingsKey?, itemId? }`.

List response должен содержать `items`, `users`, а по необходимости `columns`,
`fields`, `fieldTypes`, `viewSettings`, `tableSettings`/`columnSettings` и
`pagination`. Detail/CRUD response должен вернуть как минимум `item` либо
`rows`, а также актуальные `fields`, `fieldTypes`, `viewSettings`, `entity`,
`title`, `heading` при наличии этих данных. Для field CRUD дополнительно
допустим `columns`.

Larena read-only adapter поддерживает вложенную форму
`{ data: { read_model: ... } }`; `src/adminTable.ts` нормализует её в тот же
контракт до передачи в `sf-table`.

### Колонки

Колонка связывается с данными строки по `key`. Основные параметры: `label`,
`visible`, `order`, `width`/`minWidth`/`maxWidth`, `displayField`, `renderer`,
`component`, `draggable`, `resizable`.

Компонент собирает итоговую таблицу так: системные колонки слева, backend
`columns`, одноимённые настройки из `fields[].column`, пользовательские
`columnSettings`, затем системная колонка actions справа. Системные колонки не
должны приходить с backend как обычные columns.

Изменение ширины, порядка или видимости идёт в `columnSettings`; drag не должен
переставлять DOM вручную. Admin объединяет новые settings с `viewSettings.table`
и сохраняет их через `saveViewSettings()`.

### Поля и типы

`fields` описывает одну сущность одновременно для колонки, detail, editor и
фильтра. Важны `key`, `label`, `fieldType`/`type`/`dataType`, `schema`,
`column`, `detail`, `editor`, `filter`, `custom` и `permissions`.

Список доступных новых типов приходит отдельно в `fieldTypes` и передаётся в
`setFieldTypes()`. Текущий Admin поддерживает `text`, `textarea`, `html`,
`number`, `money`, `rating`, `date`, `dropdown`, `checkbox`, `steps`, `phone`,
`email`, `password`, `link`, `user`, `file`, `avatar`.

Object values могут отображаться через `displayField`, `displayValue`, `label`,
`title`, `name`, `value` или `id`. Для `steps` текущее значение хранится в
`current`, а список шагов - в настройках поля.

## Pagination, поиск и фильтры

Встроенная pagination использует `data.pagination`, затем внутренний state, а
затем fallback attributes. Нормализованный результат содержит `current/page`,
`pageSize/limit`, `total`, `pageCount/totalPages`, `offset`, `nextOffset` и
`hasMore`.

При смене страницы, page size или "Показать ещё" компонент отправляет
`sf-table:page-request` с `mode: replace` или `append`. `AdminManager` передаёт
detail запроса в `updateTable()` и выбирает `setTableData()` или
`appendTableData()`.

`onFilterUpdate` передаёт filters; Admin сохраняет `detail.values` в
`this.filters` и перезапрашивает первую страницу. `onSearchEnd` обновляет
`this.searchText` и делает то же самое. Шаблоны фильтров загружаются после
`sf-after-render` через `fetchTemplate()` и сохраняются через `onTemplateSave`.

## Detail и CRUD записей

### Открытие и редактирование

`onRowDetailRequest` содержит row id, entity и table settings key. Admin
загружает detail задачи или пользователя, объединяет `viewSettings` и вызывает
`setDetailData({ entity, title, heading, row, fields, viewSettings })`.

При `onFieldEdit` компонент уже провёл клиентскую validation и передаёт
`rowId`, `entity`, `values`, `fields` и `tableSettingsKey`. Admin отправляет
payload в `saveTaskFields()` или `saveUserFields()`. При успешном ответе он
обновляет строки через `updateRowByKey`, перезадаёт detail server values и
показывает `notifyTableSuccess()`.

### Создание и удаление

`onRowCreateRequest` не создаёт сущность. Он требует draft: Admin вызывает
`fetchEntityCreateDraft()` и открывает detail через
`setDetailData({ mode: 'create', editAll: true, ... })`.

`onRowCreateSubmit` передаёт те же `values` и `fields`. Admin вызывает
`createEntityItem()`, затем повторно загружает текущую страницу, переводит
detail в `mode: 'view'` и показывает success alert.

`onRowDeleteSubmit` передаёт entity и row id. Admin вызывает
`deleteEntityItem()`, перезагружает текущую страницу и показывает success
alert. Повторная загрузка обязательна: backend определяет total, страницу и
видимые строки после удаления.

## Пользовательские поля

| Событие | Действие Admin |
| --- | --- |
| `onFieldCreateSubmit` | `createEntityField()`, затем `applyCreatedFieldResponse()` |
| `onFieldSettingsSubmit` | `updateEntityField()`, затем `applyCreatedFieldResponse()` |
| `onFieldDeleteSubmit` | `deleteEntityField()`, затем `applyDeletedFieldResponse()` |

В каждом случае Admin сначала объединяет returned `viewSettings`, затем
обновляет сохранённые строки. Backend должен возвращать актуальные columns,
fields, rows и settings; локально достраивать новую колонку нельзя.

## Полная карта событий текущей Admin

| Событие | Что делает компонент | Обработчик Admin |
| --- | --- | --- |
| `onTemplateSave` | пользователь сохранил шаблон фильтра | `saveTemplate()` |
| `onFilterUpdate` | изменился фильтр | сохраняет values, первая страница `updateTable()` |
| `onSearchEnd` | завершён ввод поиска | сохраняет text, первая страница `updateTable()` |
| `sf-table:page-request` | нужна другая страница/append | `updateTable(event.detail)` |
| `onRowDetailRequest` | нужен detail строки | `fetchTaskDetail()`/`fetchUserDetail()`, `setDetailData()` |
| `onRowCreateRequest` | нужен draft сущности | `fetchEntityCreateDraft()`, create detail |
| `onColumnSettingsChange` | изменён порядок/ширина/видимость колонок | merge `viewSettings.table`, `saveViewSettings()` |
| `onFieldEdit` | сохранены detail fields | task/user PATCH, row/detail update |
| `onRowCreateSubmit` | подтверждено создание записи | POST, reload page, detail view |
| `onRowDeleteSubmit` | подтверждено удаление записи | DELETE, reload page |
| `onFieldCreateSubmit` | создано пользовательское поле | POST field, apply response |
| `onFieldSettingsSubmit` | изменены settings поля | PATCH field, apply response |
| `onFieldDeleteSubmit` | удалено пользовательское поле | DELETE field, apply response |
| `onFilterFieldSettingsChange` | изменена схема фильтров | merge `viewSettings.filter`, save |
| `onDetailFieldSettingsChange` | изменена схема detail | merge `viewSettings.detail`, save |
| `sf-after-render` | готов первичный render | загрузка templates и initial table data |

## Файлы

Таблица передаёт `File` в `onFieldEdit`, но не делает upload сама. В
`src/adminTable.ts` payload с файлами преобразуется в `multipart/form-data`:
JSON размещается в части `payload`, файлы - в `files.<path>`. Без файлов
отправляется обычный JSON. После сохранения backend должен вернуть display
данные, а не browser `File`/blob URL.

## Инварианты и диагностика

- Используйте public methods и events, не изменяйте `table.state` напрямую.
- Не добавляйте системные `select`, `settings`, `actions` в backend columns.
- Не меняйте columns/fields локальными догадками после CRUD; применяйте server
  response.
- Rich text отображается после sanitization; file values должны сохранить
  оригинальный `File` до transport layer.
- Если table не определена: проверьте `SF.RuleLoader['cl-table']`,
  `customElements.get('sf-table')` и Network bundles relations.
- Если table определена, но пуста: проверьте API list request, `updateTable()`
  и наличие `rows`, `columns`, `fields`, `pagination` в response.
