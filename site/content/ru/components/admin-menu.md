---
description: Меню администратора sf-admin-menu — рейка разделов, колонка раздела, поиск ⌘K, меню объекта, избранное, колокол и профиль по ответам порта навигации.
profile: reference
---

# Меню администратора

<!-- release:badges -->
:badge[sf-admin-menu]{variant=main scheme=on-surface size=1} :badge[Версия 1.17.2]{variant=tonal scheme=neutral size=1} :badge[выпущен]{variant=tonal scheme=success size=1}
<!-- /release:badges -->

Меню администратора рисует навигацию админки по ответам сервера: рейку разделов, колонку открытого раздела, поиск, избранное, колокол уведомлений и профиль. Что показать и что разрешить, решает сервер через порт навигации; меню только спрашивает и рисует.

## Пример

Нажмите раздел на рейке, откройте поиск лупой или клавишами ⌘K, отметьте строку звездой, переключите сервер, откройте профиль. Журнал показывает, что меню спросило у хоста.

:::example {id="components/admin-menu" label="Меню над портом" log="sf-admin-menu-navigate sf-admin-menu-query sf-admin-menu-toggle sf-admin-menu-open sf-admin-menu-save sf-admin-menu-read sf-admin-menu-sign-out sf-admin-menu-column-change"}
:::

## Меню объекта

Когда открыт объект — сервер, сайт, — сервер отвечает его меню в поле `context`, и меню показывает его во второй колонке вместо раздела.

:::example {id="components/admin-menu-object" label="Меню открытого сервера"}
:::

## Первый ответ в странице

Сервер может напечатать первый ответ `navigation.load` в островке `data-sf-settings`: меню нарисует разделы сразу, без заготовки. Этот пример работает вовсе без порта.

:::example {id="components/admin-menu-first-answer" label="Меню из первого ответа"}
:::

## Колокол и панель

Колокол и пункт «Уведомления» меню рисует, только если хост объявляет возможность `notifications`. Если на странице есть `sf-admin-notifications` в виде панели внутри `sf-drawer`, колокол открывает эту шторку. Без неё меню показывает свой список уведомлений.

:::example {id="components/admin-menu-bell" label="Колокол открывает панель"}
:::

## Загрузка частей

Закрытое меню загружает только то, что рисует. Окно поиска, панель колокола, меню профиля, раздела и сервера, части режима настройки загружаются, когда указатель наводится на кнопку или на неё приходит фокус; нажатие ждёт нужную часть до 30 секунд. Странице ничего делать не нужно.

## Колонка раздела

Колонку раздела человек прячет и показывает сам, Ctrl/Cmd+B делает то же с клавиатуры; выбор запоминается. Странице для этого служат действия `showColumn()`, `hideColumn()` и `toggleColumn()`, а событие `sf-admin-menu-column-change` говорит, что колонка открылась или закрылась — его видно в журнале первого примера.

## Параметры

Справочник собран из манифеста компонента в выпуске набора `admin-45b580402884` (версия 1.2.2) и обновляется вместе с выпуском. Каждому атрибуту соответствует свойство элемента с тем же именем в camelCase: `history-href` — `historyHref`.

| | |
|:---|:---|
| Тег | `<sf-admin-menu>` |
| Назначение | Навигация админки над портом навигации хоста: рейка разделов, колонка раздела, поиск, избранное, уведомления и режим настройки. |
| Контракт | `smart.admin-menu`, версия `1.17.2` |
| Жизненный цикл | экспериментальный: API может меняться между выпусками |
| Порт | `simai.admin-navigation-port`, версии с `1.0.0` по `1.2.0` |

### Атрибуты

- `template` — `string`, по умолчанию `default`. Имя варианта шаблона для внешних шаблонов SfBaseElement.
- `root-class` — `string`, по умолчанию пусто. Классы, которые получает корневой элемент компонента.
- `root-style` — `string`, по умолчанию пусто. Встроенные стили корневого элемента компонента, включая пользовательские свойства.
- `search-shortcut` — `string`, по умолчанию `mod+k`. Клавиши, которые открывают поиск с любого места страницы; пусто — выключено.
- `current` — `string`, по умолчанию пусто. Строка, на которой страница, по её ключу; пусто — строка, чей адрес совпадает с адресом страницы.
- `expected-columns` — `integer`, по умолчанию `2`. Сколько колонок рисует заготовка меню на широком экране, пока хост не ответил: 1 — у строки страницы нет открытого раздела (главная), 2 — есть. Это знает сервер; с верным числом меню до ответа такой же ширины, как после. Это не ограничение: ответившее меню берёт столько колонок, сколько нужно его строкам.
- `open` — `boolean`, по умолчанию `false`. Пишет страница, которая открывает меню своей кнопкой: на узком экране меню сложено, пока значение `false` (`data-open`). Не записано — ничего не меняет.
- `aria-label` — `string`, по умолчанию `Admin menu`.
- `first-answer` — `object`. Первый ответ хоста на `navigation.load`, напечатанный в странице (островок `data-sf-settings`). Меню рисуется из него сразу, без заготовки; порт отвечает следом.

## События

События приходят на сам элемент и всплывают.

- `sf-admin-menu-query` — `detail`: `{ kind, query: string, requestId?: string, intent?: string, payload?: object }`. Запрос к хосту: `kind` — `site` или `search`.
- `sf-admin-menu-reset` — `detail`: `{ kind, id?, intent?: string, payload?: object }`. `kind` — `view`.
- `sf-admin-menu-navigate` — `detail`: `{ id, key: string, href: string|null, region?: boolean }`. Хост ответил `applied` на `item.open`: страница теперь принадлежит этой строке. Для хоста, который переходит своим маршрутизатором, а не по адресу из ответа. Событие можно отменить (AS-6): страница, которая не готова уйти (есть несохранённые изменения), вызывает `preventDefault` — текущая строка, экран и фокус остаются на месте, меню никуда не переходит, а ссылка из меню объекта не открывается; когда человек согласится, страница переходит сама и называет строку через `current`. Если событие не отменено, строка становится текущей.
- `sf-admin-menu-refresh` — `detail`: `{ kind: string, intent: string, payload: object, reason?: string|null, site? }`. Хоста спросили `navigation.load` или `notifications.load`.
- `sf-admin-menu-open` — `detail`: `{ kind: string, intent: string, payload: object, id, href?: string|null, group?: string|null }`. Спросили `item.open`, `site.switch`, `view.profile` или `search.choose`.
- `sf-admin-menu-toggle` — `detail`: `{ kind: string, intent: string, payload: object, id, on: boolean }`. Спросили `favourite.toggle`.
- `sf-admin-menu-save` — `detail`: `{ kind: string, intent: string, payload: object, values?: object, id?, revision?: number|null }`. Спросили настройку человека или `view.save`.
- `sf-admin-menu-create` — `detail`: `{ kind: string, intent: string, payload: object }`. Спросили `view.create`.
- `sf-admin-menu-rename` — `detail`: `{ kind: string, intent: string, payload: object, id, title: string }`. Спросили `view.rename`.
- `sf-admin-menu-delete` — `detail`: `{ kind: string, intent: string, payload: object, ids: array }`. Спросили `view.delete`.
- `sf-admin-menu-read` — `detail`: `{ kind: string, intent: string, payload: object, ids: array }`. Спросили `notifications.read`: `ids` — прочитанные ключи (пусто, если «Прочитать все»); `payload` — данные порта `{keys, all}`.
- `sf-admin-menu-sign-out` — `detail`: `{ kind: string, intent: string, payload: object }`. Спросили `session.sign-out`.
- `sf-admin-menu-column-change` — `detail`: `{ open: boolean }`. Колонку раздела показал или скрыл человек или страница; `open` говорит, что именно. Выбор запоминается для человека (`SF.Preferences`, ключ `sf-admin-menu/main`, поле `second`).
- `sf-host-port-request` — `detail`: `{ component: object, context: object }`. Попросить порт у страницы при подключении. Страница, которая отвечает портом `simai.admin-navigation-port`, получает меню; страница без ответа оставляет заготовку, пока не вручит порт. Уходит: страница вручает порт действием `connectPort({port})`; событие отправляется до 2026-12-01.

Прежние имена событий приходят следом с тем же `detail` и отмечаются в `SF.deprecations`:

`sf-admin-menu-intent` → `sf-admin-menu-refresh`.

## Методы

- `refresh()` — возвращает `object`. Заново прочитать меню у хоста после того, как что-то вне меню изменило то, что оно показывает (звезда в голове страницы). До порта ничего не делает.
- `toggle(args: object)` — возвращает `object`. Добавить строку в избранное человека или убрать её (`favourite.toggle`). Без порта — отказ.
- `showColumn()` — возвращает `object`. Снова показать колонку раздела: меню объекта страницы или раздел, в котором лежит страница. Если показать нечего, ничего не открывается. Его вызывает «Показать колонку» страницы.
- `hideColumn()` — возвращает `object`. Скрыть колонку раздела: рейка остаётся, колонка места не занимает.
- `toggleColumn()` — возвращает `object`. Скрыть открытую колонку или показать скрытую, как Ctrl/Cmd+B.
- `setHostPort(host: object)` — возвращает `object`. Подключить хост порта `simai.admin-navigation-port`; меню рисует ответ хоста вместо заготовки.
- `connectPort(port: object)` — возвращает `object`. Базовое действие SIMAI Framework `connect-port {port}`: вручает порт навигации, он хранится как `sfPort`; отвечает исходом (`refused` `other-port` для чужого порта, `port-unsupported` для версии, которую меню не берёт). `setHostPort` — его прежнее имя.

## CSS-переменные

Задаются на элементе или на любом предке.

| Переменная | Тип | Что задаёт |
|:---|:---|:---|
| `--sf-admin-menu-color` | `color` | Цвет текста и значков меню. |
| `--sf-admin-menu-first-background-color` | `color` | Фон рейки. |
| `--sf-admin-menu-second-background-color` | `color` | Фон колонки раздела. |
| `--sf-admin-menu-border-color` | `color` | Цвет линий меню. |
| `--sf-admin-menu-padding` | `length` | Внутренний отступ меню. |
| `--sf-admin-menu-one-column-inline-size` | `length` | Публикуется на `:root`, задаётся таблицей стилей меню, читается страницей: ширина меню страницы без открытого раздела (`expected-columns="1"`). |
| `--sf-admin-menu-two-columns-inline-size` | `length` | Публикуется на `:root`, задаётся таблицей стилей меню, читается страницей: ширина меню с открытым разделом. |
| `--sf-admin-menu-compact-one-column-inline-size` | `length` | Публикуется на `:root`, задаётся таблицей стилей меню, читается страницей: одна рейка. |
| `--sf-admin-menu-compact-two-columns-inline-size` | `length` | Публикуется на `:root`, задаётся таблицей стилей меню, читается страницей: рейка с открытым разделом. |

## Доступность

- Роль: `navigation`.
- Доступное имя: обязательно.
- Клавиши: `Tab`, `Enter`, `Space`, `Escape`.
- Фокус: Контекстные меню после отрисовки ставят фокус на первый доступный пункт. Escape возвращает фокус на кнопку, которая открыла меню; Tab и Shift+Tab закрывают меню и продолжают от неё. Фокус вне меню не трогается. «Готово», Escape и «Закончить настройку» закрывают режим настройки и возвращают фокус на кнопку, которая его открыла.

## Источник

- `simai/ui-admin@45b580402884:package/src/smart/admin-menu`

## См. также

- [Порт навигации](/ru/guide/concepts/port/)
- [Первый кадр](/ru/guide/concepts/first-paint/)
- [Каркас админки](../admin-shell/)
- [Уведомления](../admin-notifications/)
