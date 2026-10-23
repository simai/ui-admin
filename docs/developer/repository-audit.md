# Технический аудит

Дата проверки: 2026-10-22, ревизия `d09b36f`. Предыдущий аудит (2026-08-20)
описывал репозиторий до полигона, до пакета `larena` и до переноса
компонентов; он заменён этим.

Поправка 2026-10-23 (решение владельца): компоненты переехали отсюда в
[`simai/ui-pro`](https://github.com/simai/ui-pro), этот репозиторий стал их
референсным приложением. Разделы ниже учитывают переезд; проверки и пины
остаются на дату аудита.

## Что в репозитории

- **Исходника пакета здесь больше нет.** `sf-table`, `sf-data-view`,
  `sf-property-view` и `sf-admin-menu` живут в `components/` репозитория
  `simai/ui-pro` (2026-10-23; до этого здесь, до 2026-10-22 — в
  `simai/larena-ui`). Собственный набор тестов пакета
  (`cd ../ui-pro/components && npm test`) — там же. Этот репозиторий собирает
  пакет из соседнего checkout `../ui-pro` и закрепляет его
  (`config/simai-package.lock.json`).
- **Сайт** (Vite/TypeScript): главная — полигон над `data/polygon.json`, плюс
  страницы дерева, свойств, рабочего стола, модального окна, меню и каталога
  ([список](local-development.md#страницы)).
- **Хосты портов** в `src/ports/` — то, что в Larena делает PHP; их держат
  conformance-наборы Framework (`check:port`, `check:polygon`).
- **`server.js`** — mock API для `/mock-api.html` и сервер собранного сайта.
- **Выкладка** — `.github/workflows/deploy-server.yml`, включена
  (`SIMAI_SERVER_DEPLOY=true`): каждый push в `main` выкладывается на сервер
  simai-env.

## Подтверждено 2026-10-22

- Пины текущие: Framework `ui-c408b1c544f9`, пакет `larena-9f3e80fb16e3`
  (`pin:check`, `pin:package:check`).
- Пакет `larena-9f3e80fb16e3` опубликован GitHub release в `simai/larena-ui`;
  в `larena-ui` больше нет `components/`.
- `components` (тогда ещё здесь): 445 тестов проходят; `test:api` 5/5, `test:runtime` 2/2,
  `data:check` — данные совпадают с генераторами.
- Выпуск `d09b36f` прошёл у диспетчера SIMAI Framework: тесты и browser-probes
  пакета, `build`, `test:api`, `test:runtime`, `test:browser`,
  `check:published`.

## Порядок ответственности

- Выпуск пакета для Larena (сборка, публикация release) — диспетчер SIMAI
  Framework, `ui-control/tools/release`.
- Общий редактор даты и времени и дефекты `sf-datepicker` — Framework.
- Повседневная работа над компонентами — `simai/ui-pro` (там же
  `refresh-provenance.py` перед коммитом в `components/`); работа над сайтом и
  перезакрепление пакета — этот репозиторий, отдельным коммитом после коммита
  в `ui-pro`.
- Компонент, который понадобится второму набору (`ui-chat`, `ui-mail`), не
  копируется, а продвигается во Framework или `ui-pro` (решение владельца
  2026-10-22, `ui-control/control/decisions/2026-10-22-component-layers-and-kits.md`).

## Открытые вопросы

1. **Варианты фильтра с сервера** (`filter.optionsSource.type = 'endpoint'`)
   есть в `sf-table` и описаны в `smart-table-guide.md`, но в Larena
   endpoint для вариантов пока не найден — интеграция и приёмка на стороне
   Larena не начаты.
2. **Массовое действие со своим id** (`bulk.apply_selected`) реализовано в
   `sf-data-view`; `DataviewHostPort` в Larena этот intent принимает
   (`record.bulk_delete`). Браузерная приёмка в Larena здесь не
   зафиксирована.
3. **Название платной лицензии** — «SIMAI Commercial License», как в
   `README.md` и `LICENSE.md` (решение владельца 2026-10-22). Решение о слоях
   в `ui-control` называет её «SIMAI Pro» и должно быть приведено к этому
   названию.
4. **CHANGELOG** отсутствует; история выпусков пакета — в коммитах
   «Pin …» и в release `simai/larena-ui`.
5. Каталог [`larena-smart-integration/`](../larena-smart-integration/README.md)
   — архив проверки 2026-08-20; его блокеры закрыты механизмом пинов и
   проверок, новые сведения туда не вносятся.
