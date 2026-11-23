---
description: Страница настроек в каркасе админки — ширина чтения, голова страницы, разделы формы и кнопка сохранения.
profile: how_to
---

# Страница настроек

Страница настроек стоит в каркасе на ширине чтения: форма не растягивается
на весь широкий экран, а меню и голова страницы остаются на своих местах.

## Перед началом

- Набор подключён — [Подключение](../../connection/).
- Порт навигации для меню — [Порт навигации](../../concepts/port/).

## Шаги

1. Поставьте каркас с `width="read"` и меню:

   ```html
   <sf-admin-shell product="Larena Panel" width="read">
     <sf-admin-menu slot="menu" aria-label="Меню" current="panel.general"></sf-admin-menu>
     <sf-header-page slot="head" heading="Общие настройки"></sf-header-page>
   </sf-admin-shell>
   ```

2. Разложите поля по разделам с заголовками второго уровня — голова
   страницы уже держит заголовок первого:

   ```html
   <section aria-labelledby="address">
     <h2 id="address">Адрес панели</h2>
     <sf-input size="1" label="Адрес" default-value="panel.larena.cloud"></sf-input>
     <sf-input size="1" label="Порт" default-value="9443" hint="Число от 1 до 65535"></sf-input>
   </section>
   ```

3. Поставьте кнопку сохранения в конце формы. Как сообщать об ошибках полей
   и ответа сервера — в рецепте
   [«Сохранение и ошибки»](https://ui.simai.io/ru/recipes/edit/save-and-errors/)
   SIMAI Framework.

## Результат

:::example {id="components/admin-shell-read" label="Страница настроек"}
:::

## См. также

- [Каркас страницы](../../concepts/frame/)
- [Рецепт «Форма настроек» SIMAI Framework](https://ui.simai.io/ru/recipes/edit/settings-form/)
