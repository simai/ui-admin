# sf-admin-activity

Что идёт в фоне админки (решения C421, C332, C339, C342): в конце строки
крошек и в верхней строке телефона.

```html
<sf-header-page heading="Главная">
  <sf-breadcrumbs slot="path" items='[{"label": "simai.ru", "href": "/admin"}]'></sf-breadcrumbs>
  <sf-admin-activity slot="path-end" history-href="/panel/activity"></sf-admin-activity>
</sf-header-page>
```

Хозяин задаёт `runs` заново при каждом изменении: каждый
`{id, label, state, value, total, unit, text, href, object, cancelable, retryable}`,
`state` — `running`, `failed`, `done`, `cancelled`.

## Что видно

- Что-то идёт — «Идёт N».
- Что-то не удалось, пока другое идёт, — красная метка рядом, пока человек не
  открыл список.
- Ничего не идёт — «Не удалось N» словами.
- Нечего показать — элемента нет.

Список открывается в sf-popover: строки sf-progress-run в виде уведомления и
«Все действия» (`history-href`).

## Когда действие закончилось

- Готово — SF.notify success, исчезает само.
- Не удалось — SF.notify error, остаётся до закрытия, и уведомление в списке
  sf-admin-notifications страницы.
- Событие `sf-admin-activity-finished {id, state}` (отменяемое): отменённое —
  ни сообщения, ни уведомления. `notify="false"` — только событие.

Два индикатора одной страницы (в строке крошек и в верхней строке телефона)
говорят о конце один раз и вместе убирают метку.

## Действия и события

- Действия: `refresh`, `show`, `close`.
- События: `open`, `close`, `retry {id}`, `cancel {id}`, `finished {id, state}`.

## Порт

Индикатор принимает издания порта навигации 1.1.0 и 1.2.0 (`x-port.supports`).
Возможность `activity` есть с 1.2.0: у хозяина, который заявил 1.2.0 или новее
и назвал `activity` в возможностях, индикатор спрашивает `activity.load` при
подключении порта и по `refresh`; «Повторить» — `activity.retry {id}`,
«Отменить» — `activity.cancel {id}`. Ответ несёт запуски, какими они стали
(`activity_page`); ответ без них — индикатор перечитывает. Запуск с
`retryable: false` «Повторить» не предлагает. У хозяина 1.1.0 действий нет:
его ни о чём не спрашивают, путь — настройка `runs`.

## «Повторить»

У неудавшегося запуска строка sf-progress-run в виде уведомления сама рисует
«Повторить» перед «Развернуть» (sf-progress-run 1.6.0, AS-4); нажатие —
событие `retry {id}` элемента и, у хозяина с `activity`, `activity.retry {id}`.
