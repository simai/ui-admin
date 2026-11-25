---
description: Быстрый старт — каркас админки с меню за пять минут — подключение, разметка и порт, который отвечает меню.
profile: tutorial
---

# Быстрый старт

За пять минут на странице появится каркас админки: меню слева, голова
страницы и содержимое. Меню получает разделы от порта — небольшого объекта,
который отвечает на его запросы.

## Перед началом

Нужна страница, на которой можно добавить скрипт. Сервер пока не нужен:
ответы порта написаны прямо в коде страницы.

## Шаги

1. Подключите SIMAI Framework и набор одной строкой:

   <!-- release:cdn -->
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@simai-studio/ui@5.20261125.1855/distr/core/js/core.min.js" data-sf-sets="admin"></script>
   ```
   <!-- /release:cdn -->

2. Поставьте каркас и меню. Меню идёт в место `menu`, голова страницы — в
   `head`, всё без `slot` — содержимое:

   ```html
   <sf-admin-shell product="Моя админка">
     <sf-admin-menu slot="menu" aria-label="Меню" expected-columns="2" current="orders"></sf-admin-menu>
     <sf-header-page slot="head" heading="Заказы"></sf-header-page>
     <p>Здесь содержимое страницы.</p>
   </sf-admin-shell>
   ```

3. Вручите меню порт. Порт — объект с именем, версией, возможностями и
   методом `raise(intent, payload)`: меню спрашивает `navigation.load` и
   рисует разделы из ответа.

   ```js
   const port = {
     port: 'simai.admin-navigation-port',
     version: '1.1.0',
     capabilities: [],
     async raise(intent) {
       if (intent === 'navigation.load') return {answer: 'applied', revision: '1', current: 'orders', items: [/* разделы */]};
       if (intent === 'item.open') return {answer: 'applied'};
       return {answer: 'refused', reason: 'Не умею'};
     },
   };
   customElements.whenDefined('sf-admin-menu').then(() => document.querySelector('sf-admin-menu').connectPort({port}));
   ```

4. Откройте страницу. Нажмите «Магазин» на рейке — раздел откроется в
   колонке. Нажмите «Товары» — меню спросит `item.open` и сделает строку
   текущей.

## Результат

:::example {id="guide/quick-start" label="Каркас с меню"}
:::

Сузьте пример до ширины телефона кнопкой проверки ширины: меню уйдёт за
кнопку в тонкой верхней строке.

## См. также

- [Порт навигации](../concepts/port/) — все запросы меню и форма ответов.
- [Каркас админки](/ru/components/admin-shell/)
- [Меню администратора](/ru/components/admin-menu/)
- [Сервер](../server/) — те же ответы из REST, Laravel или Битрикса.
