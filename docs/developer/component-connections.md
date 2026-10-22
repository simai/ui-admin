# Связи компонентов Admin

## Две поставки на странице

Каждая страница подключает Core Framework и объявляет пакет `larena` до
старта Core:

```html
<script>
  window.SF_BOOT_CONFIG = {
    ...window.SF_BOOT_CONFIG,
    packages: { larena: { base: '/distr-larena/' } },
  };
</script>
<script src="/distr/core/js/core.min.js"></script>
```

Сборка подставляет в `/distr/` и `/distr-larena/` id закреплённых выпусков
([Framework runtime](framework-runtime.md)). Loader находит `sf-*` теги в
разметке и грузит их: компоненты Framework — из `/distr/…`, четыре
компонента пакета (`sf-table`, `sf-data-view`, `sf-property-view`,
`sf-admin-menu`) — из `/distr-larena/…`. Loader работает по разметке: пока
тега нет в документе, компонент не грузится, и
`customElements.whenDefined()` для него не завершится.

## Главная страница (`/`, полигон)

```text
index.html
  sf-admin-menu            ← src/navigation.ts: порт навигации над data/navigation.json
  sf-page-header, sf-breadcrumbs
  sf-data-view
    sf-table (slot content)
    sf-pagination (slot pagination)
                           ← src/polygon.ts: порт data view из src/ports/polygon-host.mjs
  sf-property-view         ← создаётся src/polygon.ts, когда в адресе есть ?record=…;
                             порт property view над теми же записями
```

Компоненты не делают HTTP-запросов сами. Они получают **host port**
(`setHostPort(host)`) и поднимают через него intents (`query.change`,
`record.mutate`, `bulk.apply_selected`, `record.load`…); хост отвечает
`ok` / `refused` / `unavailable` / `conflict`. На полигоне хост — модуль в
`src/ports/`, тот же, что гоняют conformance-наборы (`npm run check:port`).
В Larena тот же контракт выполняет PHP (`DataviewHostPort` и соседние
классы).

| Компонент | Кто подключает | Данные |
| --- | --- | --- |
| `sf-admin-menu` | `src/navigation.ts` по событию `sf-host-port-request` | `data/navigation.json` |
| `sf-data-view` + `sf-table` | `src/polygon.ts` | `data/polygon.json` через `polygon-host.mjs` |
| `sf-property-view` | `src/polygon.ts`, по адресу | те же записи, второй порт того же хоста |

Список и карточка читают одни записи: значение, сохранённое в карточке,
список покажет при следующем ответе.

## Страница `/mock-api.html`

Единственная страница, где `sf-table` работает через HTTP:
`src/main.ts` (`AdminManager`) вызывает публичные методы таблицы
(`setColumns`, `setTableData`, `setDetailData`…) и слушает её события, а
`src/adminTable.ts` ходит в `server.js`. Подробно —
[sf-table на mock API](sf-table-integration.md) и [контракт API](api-contract.md).

## Порядок диагностики

1. Компонент не появился — есть ли тег в разметке, загрузился ли
   `rule.js` пакета из `/distr-larena/<id>/`, что даёт
   `customElements.get('sf-…')`.
2. Компонент появился, но пуст — получил ли он порт (`setHostPort`), и что
   хост ответил на первый intent.
3. Действие не сохранилось — какой intent поднят и что хост ответил;
   отказ показывается тостом с `message` хоста, код — в `data-sf-code`.
4. На опубликованном сайте старое поведение — `npm run check:published`.
