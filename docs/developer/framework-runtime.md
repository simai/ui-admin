# Framework runtime

## Источник версий

`config/simai-assets.lock.json` фиксирует совместимую пару SIMAI UI Core и UI Smart: полные SHA коммитов, исходные каталоги, обязательные файлы и их SHA-256. Lock-файл является источником истины для production materialization.

Materializer `scripts/materialize-framework-runtime.mjs` читает локальный `.env`, определяет пути к репозиториям, проверяет точные SHA, извлекает зафиксированные каталоги без переключения веток, проверяет SHA-256 и создаёт `simai-assets.provenance.json`.

Материализация создаёт `.runtime/` для строгого dev-режима и `dist/distr/` для production-сборки. Эти каталоги генерируются и не коммитятся.

## Как Vite отдаёт assets

Vite plugin в `vite.config.ts` монтирует выбранный runtime как `/distr`. В `dev:runtime` это `SIMAI_RUNTIME_ROOT`; без него Vite использует `.runtime`. Плагин нормализует путь и не выдаёт файлы за границами указанного каталога.

| Сценарий | Откуда assets | Проверка lock |
| --- | --- | --- |
| `npm run dev` | новая `.runtime/` | да |
| `npm run dev:runtime` | готовый `SIMAI_RUNTIME_ROOT` | нет |
| `npm run build` | новая `dist/distr/` | да |
| `npm run preview` | built assets и выбранный Vite runtime | зависит от ранее выполненной сборки |

Не используйте `SIMAI_RUNTIME_ROOT` как способ обойти проверку assets перед релизом: `build` всегда запускает strict materializer.

## Проверка и выпуск

```bash
npm run test:runtime
npm run build
npm run preview
```

Перед выгрузкой `dist/` проверьте в браузере загрузку `core.js`, `core.css` и smart components, список, detail, сохранение настроек и фильтров, CRUD записи, CRUD пользовательских полей и сценарии файлов/аватара, если они включены.

На web-сервер выгружается содержимое `dist/`. Backend должен обслуживать или проксировать `/api/*` с того же origin. Файлы Core окажутся в `dist/distr/`, Smart - в `dist/distr/smart/`.
