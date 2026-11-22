# Административное меню

`sf-admin-menu` — компонент набора `admin`, исходник и владелец — папка
[`package/`](../../package/README.md) этого репозитория
(`package/src/smart/admin-menu/`, документация — `docs/docs.md` там же).
Копия в пакете `pro` (`simai/ui-pro`, `components/src/smart/admin-menu/`)
заморожена и уйдёт из него в первом выпуске Pro после выпуска набора; до тех
пор страницы этого сайта берут меню из закреплённого пакета `pro`.
Базовый presentation-компонент `component/admin-menu` — во Framework
(`ui-source`).

У меню один режим: строки приходят от хоста через порт навигации. Меню из
дочерних элементов в разметке убрано в 1.15.0 (AM-7), и на всех страницах
сайта меню одно и то же.

## Через порт навигации (все страницы)

В разметке только пустой элемент:

```html
<aside class="admin-navigation h-full">
  <sf-admin-menu class="h-full" aria-label="Разделы админки" data-sf-skeleton="menu"></sf-admin-menu>
</aside>
```

При подключении меню поднимает `sf-host-port-request` с
`context.owner = 'admin-menu'`; `src/navigation.ts` отвечает
`setHostPort(host)` (в 1.15.0 — базовое действие `connectPort({port})`,
`setHostPort` — его прежнее имя). Хост —
[`src/ports/navigation-host.mjs`](../../src/ports/navigation-host.mjs)
над `data/navigation.json` (240 сайтов, генератор `scripts/build-navigation-data.mjs`),
порт `simai.admin-navigation-port`. Строка страницы — `data-page` на `<body>`
(по умолчанию `data.catalog`). Страница подключает хост одной строкой:
`import './navigation';` в своём модуле.

Хост отвечает на `navigation.load` и `item.open`, а по заявленным
возможностям — на переключение сайта, поиск, избранное, профили меню
(`view.*`), настройки темы и языка (`preference.*`), уведомления и выход.
Возможность, которую хост не заявил, меню не предлагает. Маршруты и права
остаются у хоста.

`/navigation-menu-reference.html` — то же меню отдельно, без страницы рядом;
`/smart-component-catalog.html` — меню рядом с его машинным контрактом.

Сервер, у которого ответ уже есть, может напечатать первый ответ
`navigation.load` в островке `data-sf-settings` (настройка `first-answer`), и
меню нарисуется сразу, без заготовки; порт ответит за ним.

## Что не делать

- Не править DOM, который меню отрисовало: он перерисовывается из состояния.
- Не задавать строки разметкой: элемент их не читает.
- Поведение меню меняется в `package/src/smart/admin-menu/`, а не в
  страницах ([README набора](../../package/README.md)).
