# Контракт API

## Базовые пути

По умолчанию `src/adminTable.ts` использует следующие пути:

| Операция | Метод и путь |
| --- | --- |
| Список задач | `GET /api/tasks` |
| Деталь задачи | `GET /api/tasks/{id}?tableId=...` |
| Сохранение задачи | `PATCH /api/tasks/{id}` |
| Черновик задачи | `GET /api/tasks/create?tableId=...` |
| Создание задачи | `POST /api/tasks` |
| Удаление задачи | `DELETE /api/tasks/{id}` |
| Поля задачи | `POST/PATCH/DELETE /api/tasks/fields[/ {fieldKey}]` |
| Деталь пользователя | `GET /api/users/{id}?tableId=...` |
| Сохранение пользователя | `PATCH /api/users/{id}` |
| Черновик пользователя | `GET /api/users/create?tableId=...` |
| Создание пользователя | `POST /api/users` |
| Удаление пользователя | `DELETE /api/users/{id}` |
| Поля пользователя | `POST/PATCH/DELETE /api/users/fields[/ {fieldKey}]` |
| Настройки таблицы | `GET /api/settings/get?tableId=...` |
| Шаблоны фильтров | `POST /api/template/save` |
| Настройки вида | `POST /api/view-settings/{tableId}` |

`{fieldKey}` заменяется ключом пользовательского поля. Пути полей не имеют переменных окружения и являются контрактом демо backend.

## Переназначение основных путей

Для интеграции с другим backend можно переопределить следующие переменные Vite: `VITE_ADMIN_TABLE_LIST_PATH`, `VITE_ADMIN_TABLE_DETAIL_PATH`, `VITE_ADMIN_USER_DETAIL_PATH`, `VITE_ADMIN_TABLE_SETTINGS_PATH`, `VITE_ADMIN_TEMPLATE_SAVE_PATH`, `VITE_ADMIN_VIEW_SETTINGS_PATH`, `VITE_ADMIN_TASK_SAVE_PATH`, `VITE_ADMIN_USER_SAVE_PATH`, `VITE_ADMIN_TASK_DELETE_PATH`, `VITE_ADMIN_USER_DELETE_PATH`, `VITE_ADMIN_TASK_CREATE_PATH`, `VITE_ADMIN_USER_CREATE_PATH`.

Шаблоны detail/save/delete могут содержать `{id}`. Значение кодируется перед подстановкой. Все пути разрешаются относительно текущего origin и проходят через Vite proxy в режиме разработки.

## Формат данных

Основной payload редактирования и создания:

```json
{
  "tableSettingsKey": "admin_table",
  "values": { "name": "Новое значение" },
  "fields": []
}
```

Без файлов запрос отправляется как JSON. При наличии `File` frontend отправляет `multipart/form-data`: очищенный JSON находится в части `payload`, а каждый файл - в части `files.<path>`. Backend должен возвращать актуальные `item`, `rows`, `fields`, `fieldTypes` и `viewSettings` по необходимости: frontend применяет этот ответ вместо ручной реконструкции колонок и полей.

## Larena read-only smoke

Для проверки чтения через Larena можно указать:

```env
VITE_API_PROXY_TARGET=http://127.0.0.1:8000
VITE_ADMIN_TABLE_LIST_PATH=/api/larena/cms/admin-table
VITE_ADMIN_TABLE_DETAIL_PATH=/api/larena/cms/admin-table/{id}
VITE_ADMIN_TABLE_SETTINGS_PATH=/api/larena/cms/admin-table-settings
VITE_LARENA_TEST_ACTOR=allowed
VITE_LARENA_SMOKE_SMART_ADAPTER=1
```

`VITE_LARENA_TEST_ACTOR` добавляет заголовок `X-Larena-Test-Actor` только для локального smoke защищённого read-only API. Это не production-механизм авторизации. Write endpoints остаются демо-путями и должны быть отклонены backend, если Larena предоставляет только чтение.

`VITE_LARENA_SMOKE_SMART_ADAPTER=1` включает локальный адаптер компонентов для browser smoke при недоступных published smart assets. Он проверяет связку frontend с read-only API, но не заменяет production artifacts UI Smart.
