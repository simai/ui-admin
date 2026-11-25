---
description: Уведомления sf-admin-notifications — по дням, повторы одного объекта свёрнуты, решённое помечено; панель у колокола и страница истории, над портом или из items.
profile: reference
---

# Уведомления

<!-- release:badges -->
:badge[sf-admin-notifications]{variant=main scheme=on-surface size=1} :badge[Версия 1.0.0]{variant=tonal scheme=neutral size=1} :badge[предварительный]{variant=tonal scheme=warning size=1}
<!-- /release:badges -->

Список уведомлений админки делит сообщения по дням, сворачивает повторы одного объекта под «Ещё N по …» и помечает решённые проблемы словами «→ решено». Он стоит в панели у колокола или на странице истории и берёт уведомления из порта навигации или из атрибута `items`.

## Пример

Уведомления из `items`. Раскройте «Ещё N по …», откройте уведомление — оно станет прочитанным; «Прочитать все» отметит весь список.

:::example {id="components/admin-notifications" label="Уведомления по дням" log="sf-admin-notifications-open sf-admin-notifications-read sf-admin-notifications-read-all"}
:::

## Над портом

Без `items` список читает порт навигации: `notifications.load` — список, `notifications.read {keys, all}` — отметка прочитанного.

:::example {id="components/admin-notifications-port" label="Уведомления над портом" log="sf-admin-notifications-open sf-admin-notifications-read sf-admin-notifications-read-all"}
:::

## Страница истории

`look="page"` — вся история на ширину страницы, по частям с «Показать ещё». `group-by="object"` группирует по объекту вместо дней.

:::example {id="components/admin-notifications-page" label="Страница истории по объектам"}
:::

## Пусто

Когда уведомлений нет, список так и говорит; место `empty` заменяет этот текст своим.

:::example {id="components/admin-notifications-empty" label="Нет уведомлений"}
:::

## Параметры

Справочник собран из манифеста компонента в выпуске набора `admin-45b580402884` (версия 1.2.2) и обновляется вместе с выпуском. Каждому атрибуту соответствует свойство элемента с тем же именем в camelCase: `history-href` — `historyHref`.

| | |
|:---|:---|
| Тег | `<sf-admin-notifications>` |
| Назначение | Уведомления админки: по дням, повторы одного объекта свёрнуты под «Ещё N по …», одна проблема — одна запись с «→ решено», «Прочитать все», последние в панели или вся история на своей странице по частям; через порт меню администратора или из списка, который дала страница. |
| Контракт | `smart.admin-notifications`, версия `1.0.0` |
| Жизненный цикл | экспериментальный: API может меняться между выпусками |

### Атрибуты

- `template` — `string`, по умолчанию `default`. Имя варианта шаблона для внешних шаблонов SfBaseElement.
- `root-class` — `string`, по умолчанию пусто. Классы, которые получает корневой элемент компонента.
- `root-style` — `string`, по умолчанию пусто. Встроенные стили корневого элемента компонента, включая пользовательские свойства.
- `look` — `string`, по умолчанию `panel`, значения: `panel`, `page`. `panel` — последние, в панели уведомлений (`sf-drawer` справа), внизу «Вся история» и «Настройки уведомлений». `page` — страница истории во всю ширину, по частям с «Показать ещё».
- `group-by` — `string`, по умолчанию `day`, значения: `day`, `object`. `day` — дни хоста («Сегодня», «Вчера»), повторы одного объекта свёрнуты. `object` — группа на объект (сервер, сайт) в порядке хоста, ничего не свёрнуто.
- `fold` — `boolean`, по умолчанию `true`. В пределах дня уведомления одного объекта после первого свёрнуты под «Ещё N по …» — тихой строкой-ссылкой в начале текста первого.
- `unread-only` — `boolean`, по умолчанию `false`. Показывать только непрочитанные.
- `history-href` — `string`, по умолчанию пусто. Адрес страницы истории: «Вся история» внизу панели.
- `settings-href` — `string`, по умолчанию пусто. Адрес настроек уведомлений; пусто — `settings_href` из ответа порта.
- `heading-level` — `string`, по умолчанию `3`, значения: `2`, `3`, `4`, `5`, `6`. Уровень заголовка дня там, где стоит список.
- `aria-label` — `string`, по умолчанию пусто.
- `items` — `array`, по умолчанию `[]`. Уведомления, которые дала страница, для хоста без порта: каждое `{key, title, when, unread, href, icon, body, object, level, resolved, group, group-label}`, группы — по `group` по порядку. Если список задан, порт не читается.

## События

События приходят на сам элемент и всплывают.

- `sf-admin-notifications-open` — `detail`: `{ key: string, href: string }`. Нажата ссылка уведомления: список отмечает его прочитанным; если событие не отменено, браузер идёт по ссылке.
- `sf-admin-notifications-read` — `detail`: `{ keys: array }`. Уведомления отмечены прочитанными: те, что открыли.
- `sf-admin-notifications-read-all` — `detail` не описан. «Прочитать все» отметило прочитанными все уведомления, а не только показанные.
- `sf-admin-notifications-load-more` — `detail`: `{ cursor: string }`. «Показать ещё» попросило у хоста следующую часть (вид `page`).
- `sf-admin-notifications-failed` — `detail`: `{ reason: string }`. Хост не ответил на `notifications.load`, или у порта нет уведомлений; список говорит об этом и предлагает «Повторить».

## Методы

- `refresh()` — возвращает `object`. Заново читает список (`notifications.load`); если задан `items` — рисует его заново.
- `readAll()` — возвращает `object`. Отмечает прочитанными все уведомления (`notifications.read {all: true}`) и переводит фокус на счёт.
- `read(args: object)` — возвращает `object`. Отмечает прочитанными названные уведомления (`notifications.read {keys, all: false}`).
- `add(args: object)` — возвращает `object`. Уведомление, которое страница добавляет сверху (например, о неудавшемся действии): при `items` оно встаёт к ним; через порт оно уже есть у хоста, и список читается заново.
- `loadMore()` — возвращает `object`. Следующая часть истории (вид `page`): `notifications.load {cursor}`.

## CSS-переменные

Задаются на элементе или на любом предке.

| Переменная | Тип | Что задаёт |
|:---|:---|:---|
| `--sf-admin-notifications-unread-color` | `color` | Цвет метки непрочитанного. |
| `--sf-admin-notifications-resolved-color` | `color` | Цвет пометки «решено». |
| `--sf-admin-notifications-divider-color` | `color` | Цвет разделительных линий. |
| `--sf-admin-notifications-row-padding-block` | `length` | Отступ строки сверху и снизу. |
| `--sf-admin-notifications-row-gap` | `length` | Промежуток внутри строки. |
| `--sf-admin-notifications-group-gap` | `length` | Промежуток между группами. |

## Доступность

- Роль: `region`.
- Доступное имя: рекомендуется.
- Клавиши: `Tab`, `Enter`, `Space`.
- Фокус: Ссылки и кнопки по порядку чтения; «Ещё N по …» оставляет фокус на месте; после «Прочитать все» фокус переходит на счёт (роль `status`).

## Источник

- `simai/ui-admin@45b580402884:package/src/smart/admin-notifications`

## См. также

- [Уведомления — понятие](/ru/guide/concepts/notifications/)
- [Рецепт «Колокол с панелью»](/ru/guide/recipes/notifications-bell/)
- [Меню администратора](../admin-menu/)
