---
description: Колокол меню администратора открывает панель уведомлений набора — шторка справа, список над портом, Escape и возврат фокуса.
profile: how_to
---

# Колокол с панелью уведомлений

Колокол меню открывает панель уведомлений справа. Список в панели — тот же
`sf-admin-notifications`, что на странице истории, только в виде панели.

## Перед началом

- У порта навигации есть возможность `notifications` и ответы на
  `notifications.load` и `notifications.read` — [Порт навигации](../../concepts/port/).

## Шаги

1. Поставьте на страницу шторку `sf-drawer` справа со списком в виде
   панели:

   ```html
   <sf-drawer placement="right" size="2" heading="Уведомления">
     <div slot="content">
       <sf-admin-notifications look="panel" aria-label="Уведомления"
         history-href="/admin/notifications"></sf-admin-notifications>
     </div>
   </sf-drawer>
   ```

2. Вручите порт и меню, и списку:

   ```js
   for (const element of document.querySelectorAll('sf-admin-menu, sf-admin-notifications')) {
     element.connectPort({port});
   }
   ```

Больше ничего не нужно: меню находит панель по разметке. Колокол открывает
и закрывает шторку, список читает порт заново при каждом открытии, Escape
закрывает панель, и фокус возвращается на колокол.

## Результат

:::example {id="components/admin-menu-bell" label="Колокол и панель уведомлений"}
:::

## См. также

- [Уведомления](../../concepts/notifications/)
- [Уведомления — справочник](/ru/components/admin-notifications/)
