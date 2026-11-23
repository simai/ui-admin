---
description: Как сервер отвечает меню и уведомлениям SIMAI Admin — порт навигации на странице и один адрес приложения для его намерений.
profile: landing
---

# Сервер

Компоненты набора не ходят на сервер сами. Страница держит порт навигации, а
порт пересылает намерения на один адрес приложения и возвращает ответ.
Поэтому серверу достаточно одного маршрута, который разбирает намерение и
отвечает в форме порта.

:::diagram {engine=mermaid title="Путь намерения от меню до сервера"}
flowchart LR
  menu["Меню и уведомления"] -- "raise(intent, payload)" --> port["Порт на странице"]
  port -- "POST /admin/navigation" --> app["Маршрут приложения"]
  app -- "ответ порта" --> port
  port --> menu
:::

## Порт на странице

Порт один на страницу, его получают все компоненты набора, которым он нужен:

```js
const port = {
  port: 'simai.admin-navigation-port',
  version: '1.1.0',
  capabilities: ['search', 'favourites', 'notifications', 'sign-out'],
  async raise(intent, payload = {}) {
    try {
      const response = await fetch('/admin/navigation', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-CSRF-Token': csrf},
        body: JSON.stringify({intent, payload, page: location.pathname}),
      });
      if (!response.ok) return {answer: 'unavailable', reason: `HTTP ${response.status}`};
      return await response.json();
    } catch {
      return {answer: 'unavailable', reason: 'Сервер не ответил.'};
    }
  },
};

for (const element of document.querySelectorAll('sf-admin-menu, sf-admin-notifications')) {
  element.connectPort({port});
}
```

`capabilities` перечисляет только то, на что сервер правда отвечает: меню
не нарисует управление без возможности.

## Что дальше

| Страница | О чём |
|:---|:---|
| [REST](rest/) | Форма запроса и ответа, коды, проверка прав. |
| [Laravel и Larena](laravel/) | Маршрут и контроллер намерений. |
| [1С-Битрикс](bitrix/) | Контроллер модуля и `BX.ajax.runAction`. |

## См. также

- [Порт навигации](../concepts/port/)
- [Первый кадр](../concepts/first-paint/)
