---
description: Порт навигации simai.admin-navigation-port — объект страницы, через который меню и уведомления спрашивают сервер; намерения, ответы и возможности.
profile: article
---

# Порт навигации

Меню администратора и уведомления не знают, где живут данные. Они задают
вопросы порту — объекту, который страница вручает компоненту. Порт решает,
что ответить: из памяти, из запроса к серверу или из того, что сервер
напечатал вместе со страницей.

## Как устроен порт

Порт — обычный объект с четырьмя полями:

```js
const port = {
  port: 'simai.admin-navigation-port',
  version: '1.1.0',
  capabilities: ['search', 'favourites', 'notifications', 'sign-out'],
  async raise(intent, payload) {
    // спросить сервер и вернуть ответ
    return {answer: 'applied', /* данные ответа */};
  },
};

document.querySelector('sf-admin-menu').connectPort({port});
```

Компонент вызывает `raise` с намерением — что хочет человек — и данными.
Ответ всегда говорит, чем кончилось: `applied` — сделано, `refused` —
нельзя, с причиной, `unavailable` — сервер не ответил, `conflict` — данные
уже изменились, с новыми данными.

:::diagram {engine=mermaid title="Один вопрос меню серверу"}
sequenceDiagram
  participant Человек
  participant Меню
  participant Порт
  participant Сервер
  Человек->>Меню: отмечает строку звездой
  Меню->>Порт: raise('favourite.toggle', {key})
  Порт->>Сервер: запрос приложения
  Сервер-->>Порт: избранное
  Порт-->>Меню: {answer: 'applied', favourites}
  Меню-->>Человек: звезда и строка в избранном
:::

## Пример

Меню ниже работает над демонстрационным портом. Журнал под примером
показывает события меню: что человек попросил у хоста.

:::example {id="components/admin-menu" label="Меню над портом" log="sf-admin-menu-navigate sf-admin-menu-query sf-admin-menu-toggle sf-admin-menu-open sf-admin-menu-save sf-admin-menu-read sf-admin-menu-sign-out sf-admin-menu-column-change"}
:::

## Намерения

| Намерение | Когда спрашивают |
|:---|:---|
| `navigation.load` | При подключении и при смене страницы без перезагрузки: что показать в меню. |
| `item.open` | Человек выбрал строку меню. |
| `site.switch`, `sites.search` | Переключение сайта и поиск по сайтам. |
| `search.query`, `search.choose` | Поиск по админке (⌘K) и выбор результата. |
| `favourite.toggle` | Звезда у строки. |
| `view.profile`, `view.create`, `view.rename`, `view.delete`, `view.save`, `view.reset` | Профили меню и режим его настройки. |
| `preference.theme`, `preference.language`, `preference.compact` | Тема, язык и компактное меню из профиля. |
| `notifications.load`, `notifications.read` | Список уведомлений и отметка прочитанного (`{keys, all}`). |
| `session.sign-out` | Выход из профиля. |

## Ответ на navigation.load

Главный ответ — дерево меню:

```json
{
  "answer": "applied",
  "revision": "r12",
  "current": "srv.dns",
  "items": [
    {"key": "srv", "kind": "root", "level": "site", "label": "Серверы", "icon": "dns",
     "children": [
       {"key": "srv.dns", "kind": "page", "label": "DNS-зоны", "href": "/admin/dns"}
     ]}
  ],
  "person": {"name": "Анна Смирнова", "theme": "auto", "language": "ru"}
}
```

Строки бывают `root` — раздел на рейке, `page` — страница, `section` —
заголовок группы внутри раздела, `link` — внешняя ссылка. В ответе также
сайт, избранное, профили меню, права и число непрочитанных уведомлений.

Открытый объект — сервер, сайт — приносит своё меню в поле `context`: меню
показывает его во второй колонке.

:::example {id="components/admin-menu-object" label="Меню открытого сервера"}
:::

## Возможности

Поле `capabilities` говорит, что умеет сервер: `site-switch`, `search`,
`favourites`, `menu-profiles`, `preferences`, `notifications`, `sign-out`.
Управление без своей возможности меню не рисует: нет поиска на сервере —
нет и значка лупы.

## Как вручить порт

Страница вручает порт действием `connectPort({port})` каждому компоненту,
которому он нужен: меню и спискам уведомлений. Компонент, у которого порта
ещё нет, показывает заготовку и ждёт.

## См. также

- [Сервер](../../server/)
- [Первый кадр](../first-paint/)
- [Меню администратора](/ru/components/admin-menu/)
