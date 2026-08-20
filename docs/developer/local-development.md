# Локальная разработка

## Требования

- Node.js и npm;
- Git, если используется строгий runtime materializer;
- отдельный backend или mock API, по умолчанию на `http://localhost:5001`.

Установка зависимостей:

```bash
npm install
```

## Режимы запуска

### Строгий runtime

```bash
npm run dev
```

Команда до запуска Vite собирает `.runtime/` из точных ревизий Core и Smart, зафиксированных в `config/simai-assets.lock.json`. Для этого оба репозитория должны быть доступны локально, а их точные коммиты должны существовать.

### Общий готовый distr

```bash
npm run dev:runtime
```

Этот режим не запускает materializer. Vite отдаёт готовый каталог из `SIMAI_RUNTIME_ROOT` по URL-префиксу `/distr`. Он нужен, когда Core и Smart уже доступны в готовом runtime или когда рядом нет отдельного checkout `ui-smart`.

`dev:runtime` удобен для локальной разработки, но не подтверждает соответствие assets lock-файлу. Для такой проверки используйте строгий режим и `npm run test:runtime`.

## Переменные окружения

Создайте локальный `.env` по примеру `.env.example`. Он игнорируется Git.

| Переменная | Назначение | Используется |
| --- | --- | --- |
| `SIMAI_UI_REPO` | Путь к репозиторию UI Core для materializer | `dev`, `build`, `test:runtime` |
| `SIMAI_UI_SMART_REPO` | Путь к репозиторию UI Smart для materializer | `dev`, `build`, `test:runtime` |
| `SIMAI_RUNTIME_ROOT` | Готовый каталог с `core/` и `smart/` | `dev:runtime`, Vite preview |
| `VITE_API_PROXY_TARGET` | Целевой backend для прокси `/api` и `/assets` | Vite |

Пример для workspace с готовым runtime и каталогом Core `ui-core`:

```env
SIMAI_UI_REPO=../ui-core
SIMAI_RUNTIME_ROOT=<путь-к-готовому-distr>
VITE_API_PROXY_TARGET=http://localhost:5001
```

`SIMAI_UI_SMART_REPO` в таком сценарии не требуется для `npm run dev:runtime`. Он понадобится только для строгих `dev`, `build` и `test:runtime`.

## Команды

| Команда | Результат |
| --- | --- |
| `npm run dev` | Строго материализует `.runtime/`, затем запускает Vite |
| `npm run dev:runtime` | Запускает Vite от готового `SIMAI_RUNTIME_ROOT` |
| `npm run build` | Проверяет TypeScript, собирает `dist/` и materializes `dist/distr/` |
| `npm run test:runtime` | Проверяет lock-пару, хэши и provenance |
| `npm run preview` | Локально отдаёт сборку Vite |

Vite выбирает свободный локальный порт. Запросы к `/api` и `/assets` проксируются на `VITE_API_PROXY_TARGET`, поэтому frontend не должен обращаться к backend по жёстко заданному внешнему URL.

## Быстрая диагностика

Ошибка вида `git -C ...\\ui rev-parse ...` означает, что strict materializer взял дефолтный путь `core.repository` из lock-файла. Задайте фактический путь через `SIMAI_UI_REPO`, либо используйте `npm run dev:runtime` с готовым `SIMAI_RUNTIME_ROOT`.

Ошибка аналогичного вида для Smart означает, что отсутствует путь из `SIMAI_UI_SMART_REPO` или дефолтного lock-файла. Готовый `distr/` помогает только в runtime-режиме и намеренно не заменяет строгую проверку при build.
