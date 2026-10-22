# Larena Smart Integration: P0 evidence

> **Архив, 2026-08-20.** Снимок проверки до пинов по выпускам, до пакета
> `larena` и до переноса компонентов в этот репозиторий. Его блокеры закрыты:
> Framework закрепляется по выпуску `ui-<12>` с хэшами файлов, пакет — по
> квитанции сборки из `components/`, опубликованный сайт проверяет
> `npm run check:published`. Текущее состояние —
> [технический аудит](../developer/repository-audit.md) и
> [Framework runtime](../developer/framework-runtime.md). Файлы ниже не
> обновляются.

Этот пакет отвечает на P0 handoff для интеграции Larena Admin со Smart
Components. Его задача - разделить доказанный runtime, наблюдаемый source и
неподтверждённые предположения.

## Статус пакета

- `RUNTIME_CONFIRMED`: отсутствует для `sf-table` и `sf-admin-menu` на
  locked Smart revision, потому что checkout/артефакт Smart отсутствует.
- `SOURCE_CONFIRMED`: table/menu rules и реализация наблюдались в доступном
  SF5 source tree, но этот source не доказан как источник locked Smart bundle.
- `UNKNOWN`: deployed `ui-admin.test`, ABI exact Smart bundle, Larena views,
  presets, modifiers, screenshots, accessibility и responsive contracts.

Пакет не является разрешением использовать source-only API в Larena.

## Файлы

- `provenance.json` - доступные commits и artifact hash evidence;
- `component-inventory.json` - критический inventory компонентов первого экрана;
- `smart-abi.json` - source-level ABI table/menu с границей доказательств;
- `event-contracts.json` - события, которые реально обрабатывает Admin;
- `development-runtime-observation.json` - отдельное наблюдение shared runtime из `.env`, не равное lock-паре;
- `runtime-provenance-audit.json` - проверка воспроизводимости shared runtime по доступным Git evidence;
- `known-gaps.md` - блокеры и следующий безопасный шаг;
- `minimal-examples/` - изолированные markup examples, ожидающие exact runtime.

## Shared development runtime

Для проверки локальной пары через Vite доступен `/smart-runtime-probe.html`.
Он проверяет upgrade table/menu, вызов `setTableData()` и выводит результат в
DOM. Результат этой страницы относится только к
`DEVELOPMENT_RUNTIME_OBSERVED`: hashes текущего `SIMAI_RUNTIME_ROOT` не
совпадают с lock-парой. Наблюдение от 2026-08-20 подтверждает рендер table/menu,
восемь table methods и payload `sf-table:page-request`; полный результат
сохранён в `development-runtime-observation.json`.

## Provenance shared runtime

Текущий shared runtime нельзя использовать для обновления Admin lock. Он не
содержит source commit metadata, а доступные build и Smart source worktrees
имеют незакоммиченные изменения. Полный вывод и безопасная последовательность
создания новой lock-пары находятся в `runtime-provenance-audit.json`.

## Как закрыть P0

1. Получить UI Smart checkout или опубликованный artifact exact revision
   `e28eccc65273d61b27b802139eac56a4a537c01f`.
2. Запустить browser/runtime reflection на этой Core/Smart паре.
3. Сравнить file hashes с `config/simai-assets.lock.json`.
4. Обновить `RUNTIME_CONFIRMED` записи ссылками на runtime test и artifact hash.
5. Отдельно запросить у Larena owner registry views/presets/modifiers.
