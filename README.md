# SIMAI Admin

Демо-админка на Vite для проверки SIMAI Framework smart components: таблиц, меню, фильтров, detail-форм, редактирования полей и пользовательских настроек.

## Быстрый старт

```bash
npm install
npm run dev:runtime
```

Для локальной разработки задайте `.env` по `.env.example`, например:

```env
SIMAI_RUNTIME_ROOT=<путь-к-готовому-distr>
VITE_API_PROXY_TARGET=http://localhost:5001
```

`npm run dev:runtime` использует готовый `distr/` и не требует checkout UI Smart. Для строгой проверки locked revisions используйте `npm run dev`; ему нужны доступные `SIMAI_UI_REPO` и `SIMAI_UI_SMART_REPO`.

## Команды

```bash
npm run dev
npm run dev:runtime
npm run build
npm run test:runtime
npm run preview
```

## Документация

Подробные инструкции и подтверждённые ограничения находятся в [docs/README.md](docs/README.md):

- локальная разработка и переменные окружения;
- Framework runtime, lock-файл и выпуск сборки;
- контракт mock/Larena API;
- интеграция `sf-table`;
- технический аудит репозитория.

## Структура

```text
src/main.ts         Инициализация таблицы и обработка событий smart components
src/adminTable.ts   API-клиент и нормализация данных таблицы
scripts/            Materializer Framework runtime
config/             Immutable assets lock
types/              Локальные типы smart components
docs/               Техническая документация
```
