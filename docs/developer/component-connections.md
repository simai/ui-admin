# Связи компонентов Admin

## Карта первого экрана

```text
index.html
  -> Core runtime создаёт SF и SF.Loader
  -> loader находит sf-* tags по RuleLoader.tags
  -> sf-admin-menu + relations -> меню слева
  -> sf-table + relations -> таблица и detail UI
  -> sf-toggle / sf-tag / sf-icon-button / sf-avatar -> header controls
  -> sf-loader-init
  -> src/main.ts создаёт AdminManager
  -> AdminManager связывает sf-table с API из src/adminTable.ts
```

`index.html` отвечает за composition: какие компоненты существуют и какие
атрибуты им переданы. Core loader отвечает за discovery и загрузку их runtime
assets. `src/main.ts` отвечает только за orchestration таблицы и темы; он не
должен знать внутреннюю разметку меню или `sf-table`.

## Меню и таблица

| Компонент | Инициализация в Admin | Внешние данные | Точка изменения |
| --- | --- | --- | --- |
| `sf-admin-menu` | HTML в `index.html` | нет | структура пунктов в `index.html` |
| `sf-table` | HTML в `index.html`, события в `src/main.ts` | список, detail, schema, settings через API | orchestration - `src/main.ts`; transport - `src/adminTable.ts` |
| `sf-toggle` | HTML + `AdminManager.initTheme()` | `localStorage['sf-theme']` | theme flow в `src/main.ts` |
| `sf-tag` | HTML + `updateTable()` | `users.count` из ответа списка | `src/main.ts` |

Меню и таблица независимы в данных: изменение меню не должно запускать загрузку
таблицы, а таблица не должна менять структуру меню. Их объединяет только общий
Core loader и статическая HTML composition.

## Граница public API

Admin общается с `sf-table` через публичные методы и CustomEvent:

- methods: `setColumns`, `setFieldTypes`, `setFilterFields`, `setTableData`,
  `appendTableData`, `setDetailData`, `updateRowByKey`, `notifyTableSuccess`;
- events: page, search, filters, detail, edit, CRUD записей, CRUD полей и
  сохранение view settings.

Admin не должен читать или изменять `table.state` напрямую. Menu также не
должно управляться через его внутреннее DOM после регистрации элемента.

## Порядок диагностики

1. Если компонент не появился, проверьте tag в `index.html`, его rule и
   `customElements.get('sf-...')` в браузере.
2. Если меню появилось, но пункты неверные, проверьте вложенность,
   `order`, `type="divider"` и local storage `main-menu-settings`.
3. Если таблица появилась, но пуста, проверьте API request, затем
   `AdminManager.updateTable()` и payload `rows`, `columns`, `fields`.
4. Если action таблицы не сохранился, проверьте событие компонента и backend
   response; применяйте response API через публичные методы таблицы.
