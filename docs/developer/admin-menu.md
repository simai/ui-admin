# Административное меню

`sf-admin-menu` — компонент пакета `larena`, исходник в
`components/src/smart/admin-menu/` репозитория
[`simai/ui-pro`](https://github.com/simai/ui-pro), его документация —
`docs/docs.md` там же и
[ui.simai.io](https://ui.simai.io/ru/smart-components/composite/admin-menu/).
Базовый presentation-компонент `component/admin-menu` — во Framework
(`ui-source`).

Меню работает в двух режимах: строки приходят от хоста через порт навигации
или задаются разметкой. В Larena используется первый.

## Через порт навигации (главная страница)

На `/` в разметке только пустой элемент:

```html
<sf-admin-menu class="h-full" aria-label="Разделы админки" data-sf-skeleton="menu"></sf-admin-menu>
```

При подключении меню поднимает `sf-host-port-request` с
`context.owner = 'admin-menu'`; `src/navigation.ts` отвечает
`setHostPort(host)`. Хост — [`src/ports/navigation-host.mjs`](../../src/ports/navigation-host.mjs)
над `data/navigation.json` (240 сайтов, генератор `scripts/build-navigation-data.mjs`),
порт `simai.admin-navigation-port` 1.0.0.

Хост отвечает на `navigation.load` и `item.open`, а по заявленным
возможностям — на переключение сайта, поиск, избранное, профили меню
(`view.*`), настройки темы, языка и компактного вида (`preference.*`),
уведомления и выход. Возможность, которую хост не заявил, меню не
предлагает. Маршруты и права остаются у хоста.

## Разметкой (`/navigation-menu-reference.html`)

```html
<sf-admin-menu searchable settings logo="/logo.svg" persistence-mode="local">
  <sf-admin-menu-item item-id="demo.dashboard" left-icon="home" href="/" active>
    Дашборд
    <sf-admin-menu-item item-id="demo.dashboard.orders" badge="99+" href="/">Заказы</sf-admin-menu-item>
  </sf-admin-menu-item>
  <sf-admin-menu-item type="divider"></sf-admin-menu-item>
</sf-admin-menu>
```

`sf-admin-menu-item` поддерживает текст узла или `label`, `left-icon`,
`right-icon`, `href`, `target`, `rel`, `badge`, `value`, `order`, `slot` или
`position`, состояния `active`, `current`, `disabled`, `hidden`;
`type="divider"` или `divider` — разделитель. Вложенные пункты становятся
дочерним уровнем; порядок — по `order`, иначе по разметке.

С `persistence-mode="local"` пользовательские настройки (порядок, скрытые
пункты) хранятся в `localStorage`; с `external` их сохраняет хост. Разметка —
исходная структура, локальное состояние меняет её после загрузки.

## Что не делать

- Не править DOM, который меню отрисовало: он перерисовывается из state.
- Поведение меню меняется в `components/src/smart/admin-menu/` репозитория
  `simai/ui-pro`, а не в страницах. Такая правка — изменение пакета: коммит в
  `ui-pro`, затем перезакрепление здесь
  ([Framework runtime](framework-runtime.md)).
- Панель меню рассчитана на 320px; колонка хоста уже этого её обрежет.
