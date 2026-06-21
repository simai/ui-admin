# SIMAI Admin

Демо-админка на Vite для проверки SIMAI Framework smart components: таблицы, меню, фильтров, модального просмотра задачи, редактирования полей и сохранения пользовательских настроек.

## Быстрый старт

```bash
npm install
npm run dev
```

По умолчанию Vite запускает приложение на свободном локальном порту. Mock API ожидается на `http://localhost:5001` и проксируется через `/api`.

## Larena read-only adapter smoke

Для проверки с Larena backend без изменения маршрутов демо-приложения можно
переключить read-only endpoints через Vite env:

```bash
VITE_API_PROXY_TARGET=http://127.0.0.1:8000 \
VITE_ADMIN_TABLE_LIST_PATH=/api/larena/cms/admin-table \
VITE_ADMIN_TABLE_DETAIL_PATH=/api/larena/cms/admin-table/{id} \
VITE_ADMIN_TABLE_SETTINGS_PATH=/api/larena/cms/admin-table-settings \
npm run dev
```

В этом режиме frontend читает package-owned Larena endpoints. Write endpoints
остаются демо-путями и должны возвращать отказ/ошибку backend-а:

- `POST /api/template/save`;
- `POST /api/view-settings/:tableId`;
- `PATCH /api/tasks/:id`.

Такой smoke не делает frontend runtime частью root `simai/larena` и не копирует
`dist/`, `distr/`, `smart/` или `node_modules` в Larena.

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

В production-режиме приложение подключает опубликованные релизы:

```html
window.sfPath = 'https://cdn.jsdelivr.net/gh/simai/ui@v5.2.0/distr';
window.sfSmartPath = 'https://cdn.jsdelivr.net/gh/simai/ui-smart@v5.2.0';
```

Такой режим не требует хранить `distr/` или `smart/` внутри admin-репозитория.

Для локальной разработки SIMAI Framework core можно временно заменить пути на
`/distr/`. Vite-конфиг уже умеет отдавать `/distr` из
`C:/Applications/SIMAI/sf5.webpack/distr`.

## Команды

```bash
npm run dev
npm run build
npm run preview
```

- `dev` - локальная разработка через Vite;
- `build` - TypeScript check и сборка в `dist/`;
- `preview` - предпросмотр собранного `dist/`.

## Выгрузка

1. Убедитесь, что нужные версии UI опубликованы:
   - `simai/ui@v5.2.0`;
   - `simai/ui-smart@v5.2.0`.
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
