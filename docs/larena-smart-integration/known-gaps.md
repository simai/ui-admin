# Known Gaps

## Blocking P0 gaps

- Нет checkout или artifact UI Smart exact revision
  `e28eccc65273d61b27b802139eac56a4a537c01f`.
- Нет runtime inspection или browser tests deployed `ui-admin.test`.
- Current observed Core artifact не совпадает с SHA-256, закреплённым Admin
  lock-файлом; он не может подтверждать exact runtime pair.
- Невозможно доказать, что observed SF5 source commit собрал locked Smart
  artifact.
- Текущий shared runtime не содержит provenance с source commits; доступные
  build и Smart source worktrees dirty, поэтому их `HEAD` нельзя переносить в
  Admin lock.

## Не подтверждать до закрытия P0

- ABI `sf-table` и `sf-admin-menu` в production/deployed runtime;
- ошибки, return values, bubbling/composed/cancelable событий;
- accessibility, mobile, loading/empty/error states;
- Larena views, presets, modifiers, registry и server-side composition;
- menu event/persistence contract beyond observed local storage key;
- restore, optimistic locking, access denied и revision conflict flows.

## Следующий безопасный шаг

Зафиксировать intended Core и Smart source state отдельными immutable commits,
собрать новый runtime в отдельный каталог и записать provenance с commits и
SHA-256. Затем обновить Admin lock, выполнить strict materialization и browser
tests. После этого статусы можно перевести в `RUNTIME_CONFIRMED` только с hash
и test ref.
