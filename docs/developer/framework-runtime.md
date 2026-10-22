# Framework runtime и пакет компонентов

Сайт отдаёт две закреплённые поставки: SIMAI Framework и пакет компонентов
`larena`, собранный из `components/` этого репозитория. Каждая закреплена
своим lock-файлом и лежит по своему пути, в имени которого есть id выпуска.

## Framework: `config/simai-assets.lock.json`

Lock называет выпуск Framework (`compatibilityId`, вида `ui-<12>`) и коммит
репозитория `simai/ui`, который этот выпуск собрал. Core берётся из `distr/`
этого коммита, Smart — из `distr/smart/`; оба из одного репозитория `../ui`.
Для каждого обязательного файла записан SHA-256.

```bash
npm run pin:check   # пин совпадает с последним выпуском в ../ui?
npm run pin         # закрепить последний выпуск
```

`pin:check` падает, если вышел более новый выпуск: сайт существует, чтобы
показывать текущий Framework, поэтому отставание — ошибка, а не заметка.
Закрепляется коммит, который записал `distr`, а не голова репозитория.

## Пакет `larena`: `config/simai-package.lock.json`

Пакет собирается из `components/` командой `ui-builder` поверх ревизии
`ui-source`, закреплённой в `components/framework.lock.json`. Lock называет
ревизию исходника и его tree, ревизию `ui-builder`, выпуск Framework, поверх
которого собран пакет (`requires.framework`), SHA-256 архива и обязательных
файлов. id пакета — `larena-<12>`, по коммиту, который последним менял
`components/`.

```bash
npm run pin:package:check   # пакет собран из текущего components/ и поверх закреплённого Framework?
npm run pin:package         # собрать и закрепить
```

Пакет, собранный поверх другого выпуска Framework, чем закреплён у сайта,
отклоняется. Сборки кешируются вне checkout: `../.package-build/ui-admin/`
(или `SIMAI_PACKAGE_BUILD_ROOT`).

Сборка пакета для Larena и его публикация (GitHub release в `simai/larena-ui`,
откуда его берёт установщик Larena) — у диспетчера SIMAI Framework
(`ui-control/tools/release`). Правила для `components/`:

- коммит в `components/` и коммит с перезакреплением — отдельные коммиты;
- перед каждым коммитом в `components/` пересчитываются digests в манифестах:
  `python3 ../ui-control/tools/release/refresh-provenance.py components`
  (сборка контрактов отклоняет манифест, чей исходник изменился).

## Материализация

`npm run dev` и `npm run build` раскладывают обе поставки и проверяют каждый
файл по lock:

| Поставка | dev | build | URL на странице |
| --- | --- | --- | --- |
| Framework | `.runtime/` | `dist/distr/<ui-id>/` | `/distr/<ui-id>/` |
| `larena` | `.runtime-package/` | `dist/distr-larena/<larena-id>/` | `/distr-larena/<larena-id>/` |

id выпуска в пути (`scripts/runtime-base.mjs`) нужен потому, что после
переиздания сайта любой кеш иначе мог отдать старую пару. Файлы по таким
путям никогда не меняются, их можно кешировать навсегда.

`npm run dev:runtime` пропускает материализацию и отдаёт готовый каталог из
`SIMAI_RUNTIME_ROOT`; соответствие lock он не проверяет. Перед сборкой нужен
строгий режим.

## Проверки

| Команда | Что отклоняет |
| --- | --- |
| `npm run test:runtime` | файлы, не совпадающие с lock-парой |
| `npm run check:published` | опубликованную страницу, которая грузит не закреплённую пару (спрашивает по HTTP, как браузер; по умолчанию `https://ui-admin.test`, иначе `ADMIN_ORIGIN`) |
| `npm run test:browser` | неработающую связку Vite, mock API, Framework и пакета |

## Публикация

- **Локально:** `npm run publish` собирает сайт и выкладывает его как
  `ui-admin.test`.
- **Сервер:** `.github/workflows/deploy-server.yml` собирает и выкладывает
  сайт на сервер simai-env при каждом push в `main` (переменная репозитория
  `SIMAI_SERVER_DEPLOY=true`) или вручную. Сервер запускает `node server.js`,
  который отдаёт собранный `dist/` и mock API (`deploy/simai-server/app.json`).
