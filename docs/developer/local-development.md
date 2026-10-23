# Локальная разработка

## Требования

- Node.js и npm, Git;
- Chrome или Microsoft Edge для `npm run test:browser`;
- соседние checkout рядом с `ui-admin`:

| Каталог | Зачем | Переопределить |
| --- | --- | --- |
| `../ui` | закреплённый выпуск SIMAI Framework (Core и Smart) | `SIMAI_UI_REPO` |
| `../ui-pro` | исходник пакета `larena` — `components/` репозитория `simai/ui-pro` | `SIMAI_UI_PRO` |
| `../ui-source` | исходник Framework, поверх которого собирается и тестируется пакет | `SIMAI_UI_SOURCE`, `UI_SOURCE_ROOT` (тесты пакета) |
| `../ui-builder` | сборка пакета `larena` | `SIMAI_UI_BUILDER` |

Без соседних checkout можно работать только в режиме `dev:runtime` (ниже).

```bash
npm install
```

## Режимы запуска

```bash
npm run dev       # проверяет пины, раскладывает Framework и пакет, запускает Vite
npm run dev:api   # mock API (server.js) на http://localhost:5001
```

`npm run dev` до запуска Vite проверяет, что пины текущие
(`pin:check`, `pin:package:check`), и раскладывает `.runtime/` и
`.runtime-package/` с проверкой каждого файла по lock. Подробно —
[Framework runtime](framework-runtime.md).

```bash
npm run dev:runtime
```

Отдаёт готовый каталог из `SIMAI_RUNTIME_ROOT` без материализации и без
сверки с lock. Подходит для быстрой работы, не подходит для проверки перед
выпуском.

## Страницы

| Адрес | Что это |
| --- | --- |
| `/` | полигон: список и карточка 120 записей, меню через порт навигации — [POLYGON.md](../POLYGON.md) |
| `/site-pages.html` | страницы сайта деревом |
| `/properties.html` | все универсальные свойства в трёх режимах |
| `/workbench.html` | рабочий стол |
| `/modal-demo.html` | все возможности `sf-modal` |
| `/navigation-menu-reference.html` | `sf-admin-menu`, собранный разметкой |
| `/smart-component-catalog.html` | каталог Smart-компонентов |
| `/mock-api.html` | `sf-table`, работающая через HTTP с mock API — [контракт API](api-contract.md) |

## Переменные окружения

Локальный `.env` по образцу `.env.example`; он игнорируется Git.

| Переменная | Назначение |
| --- | --- |
| `SIMAI_UI_REPO` | путь к `ui`, если не `../ui` |
| `SIMAI_UI_SOURCE`, `SIMAI_UI_BUILDER` | пути к `ui-source` и `ui-builder` для сборки пакета |
| `SIMAI_PACKAGE_BUILD_ROOT` | где хранить сборки пакета (по умолчанию `../.package-build/ui-admin`) |
| `SIMAI_RUNTIME_ROOT` | готовый каталог Framework для `dev:runtime` и проверок |
| `SIMAI_PREVIEW_RUNTIME_ROOT` | каталог Framework для `vite preview` вместо `dist/distr/<ui-id>` |
| `VITE_API_PROXY_TARGET` | куда проксировать `/api` (по умолчанию `http://localhost:5001`) |
| `ADMIN_ORIGIN` | сайт для `check:published` (по умолчанию `https://ui-admin.test`) |

## Команды

| Команда | Результат |
| --- | --- |
| `npm run build` | проверка данных, пины, раскладка, контракты, порты, полигон, TypeScript, сборка `dist/` с обеими поставками |
| `npm run data` / `data:check` | пересоздать / сверить `data/polygon.json` и `data/navigation.json` с генераторами |
| `npm run check:polygon` | полигон показывает каждый тип свойства и отвечает всем, чего требуют порты |
| `npm run check:port` | хост полигона проходит conformance-наборы портов |
| `npm run test:runtime` | lock-пара, хэши, provenance |
| `npm run test:api` | HTTP-контракт mock API во временном каталоге |
| `npm run test:browser` | Vite, mock API, Framework и пакет вместе в Chrome |
| `npm run test:preview` | то же над собранным `dist/` |
| `npm run publish` | собрать и выложить как `ui-admin.test` |
| `npm run check:published` | опубликованный сайт грузит закреплённые поставки |
| `cd ../ui-pro/components && npm test` | собственные тесты пакета в overlay над `ui-source` (в `simai/ui-pro`) |

Vite выбирает свободный порт. `/api` проксируется на `VITE_API_PROXY_TARGET`;
`/assets` принадлежит Vite и не проксируется.

## Быстрая диагностика

- `ADMIN_PIN_BEHIND` — вышел новый выпуск Framework: `npm run pin`.
- `ADMIN_PACKAGE_PIN_BEHIND` — `../ui-pro/components` изменён после последнего
  закрепления пакета: `npm run pin:package` (отдельным коммитом здесь, после
  коммита в `simai/ui-pro`).
- Ошибка `git -C …/ui rev-parse …` — нет `../ui` или в нём нет закреплённого
  коммита: задайте `SIMAI_UI_REPO` или выполните `git fetch` в `ui`.
