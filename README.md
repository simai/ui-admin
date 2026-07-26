# SIMAI Admin

Демо-админка на Vite для проверки SIMAI Framework smart components: таблицы, меню, фильтров, модального просмотра задачи, редактирования полей и сохранения пользовательских настроек.

## Быстрый старт

```bash
npm install
npm run dev
```

По умолчанию Vite запускает приложение на свободном локальном порту. Mock API ожидается на `http://localhost:5001` и проксируется через `/api`.

Перед запуском materializer извлекает Core и Smart из точных Git-ревизий,
заданных в `config/simai-assets.lock.json`, проверяет обязательные SHA-256 и
создаёт `.runtime/`. Он не переключает ветки соседних репозиториев. Пути можно
задать через `SIMAI_UI_REPO` и `SIMAI_UI_SMART_REPO`.

## Larena read-only adapter smoke

Для проверки с Larena backend без изменения маршрутов демо-приложения можно
переключить read-only endpoints через Vite env:

```bash
VITE_API_PROXY_TARGET=http://127.0.0.1:8000 \
VITE_ADMIN_TABLE_LIST_PATH=/api/larena/cms/admin-table \
VITE_ADMIN_TABLE_DETAIL_PATH=/api/larena/cms/admin-table/{id} \
VITE_ADMIN_TABLE_SETTINGS_PATH=/api/larena/cms/admin-table-settings \
VITE_LARENA_TEST_ACTOR=allowed \
VITE_LARENA_SMOKE_SMART_ADAPTER=1 \
npm run dev
```

В этом режиме frontend читает package-owned Larena endpoints. Write endpoints
остаются демо-путями и должны возвращать отказ/ошибку backend-а:

- `POST /api/template/save`;
- `POST /api/view-settings/:tableId`;
- `PATCH /api/tasks/:id`.

Такой smoke не делает frontend runtime частью root `simai/larena` и не копирует
`dist/`, `distr/`, `smart/` или `node_modules` в Larena.

`VITE_LARENA_TEST_ACTOR` нужен только для локального smoke Larena protected
read-only API и прокидывается как `X-Larena-Test-Actor`. Это не production auth
contract и не должен использоваться как модель доступа в реальной админке.

`VITE_LARENA_SMOKE_SMART_ADAPTER=1` включает локальный read-only adapter для
browser smoke, когда опубликованные smart components недоступны или CDN
нестабилен. Adapter проверяет связку UI -> Larena read-only API, но не является
заменой production smart components artifact.

## Mock API

Админка использует endpoints:

- `GET /api/tasks` - список задач, фильтрация, поиск, пагинация;
- `GET /api/tasks/:id` - детальная карточка задачи;
- `PATCH /api/tasks/:id` - сохранение отредактированных полей;
- `GET /api/settings/get?tableId=...` - шаблоны фильтров и настройки вида;
- `POST /api/template/save` - сохранение шаблонов фильтров;
- `POST /api/view-settings/:tableId` - сохранение настроек колонок, фильтров и detail-полей.

Локально mock-сервер находится отдельно от этого репозитория. Перед запуском админки поднимите его на порту `5001`.

## UI Assets

Dev и production используют одну immutable пару из
`config/simai-assets.lock.json`. Production-сборка помещает Core в
`dist/distr/`, а Smart — в `dist/distr/smart/`. Сгенерированные каталоги
`.runtime/` и `dist/` не коммитятся.

## Команды

```bash
npm run dev
npm run build
npm run test:runtime
npm run preview
```

- `dev` - локальная разработка через Vite;
- `build` - TypeScript check и сборка в `dist/`;
- `test:runtime` - проверка exact commits, обязательных хэшей и вертикального
  machine-readable контракта;
- `preview` - предпросмотр собранного `dist/`.

## Выгрузка

1. Убедитесь, что зафиксированная в `config/simai-assets.lock.json` пара
   SIMAI Framework 5.4.0 опубликована неизменяемыми тегами. Текущий lock
   использует candidate-ревизии для локальной приёмки и не объявляет их
   production-релизом.
2. Запустите `npm run build`.
3. Выгружайте содержимое `dist/` на web-сервер.
4. На сервере настройте backend/mock API так, чтобы `/api/*` отвечал с того же домена или проксировался на нужный сервис.
5. Проверьте в браузере:
   - загрузку `core.js` и `core.css`;
   - загрузку smart-компонентов из `ui-smart`;
   - список задач;
   - открытие detail-модалки;
   - сохранение фильтров, настроек колонок и редактируемых полей.

## Структура

```text
index.html          Entry point приложения
src/main.ts         Инициализация темы, таблицы, pagination и событий smart-компонентов
src/adminTable.ts   API-клиент и типы данных таблицы
src/style.css       Локальные стили админки
types/              Локальные типы smart-компонентов
public/             Статические файлы приложения
```

## Что не коммитим

- `node_modules/`;
- `dist/`;
- локальные dev-логи;
- `.env` и `.env.*`;
- локальную копию `smart/`;
- временные прототипы и scratch-файлы.
