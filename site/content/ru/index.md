---
description: SIMAI Admin — каркас админки для SIMAI Framework: меню, рамка страницы, уведомления и фоновые действия одной строкой подключения.
profile: landing
---

:::hero {layout=split padding=2xl media=none effect=data-flow}
# SIMAI Admin

Каркас админки для SIMAI Framework: меню разделов, рамка страницы, уведомления и фоновые действия. Сервер отдаёт данные, а компоненты сами рисуют навигацию, держат место на экране и сообщают о событиях.

[Начать](/ru/guide/)

[Компоненты](/ru/components/)
:::

## Админка из четырёх частей

Это живые части набора на одной демонстрационной панели серверов.
Переключите вкладки: «Каркас» — экран админки целиком, «Меню» — меню с
меню открытого сервера, «Уведомления» — список по дням, «Фоновые действия» —
индикатор того, что идёт в фоне. Все данные приходят от демонстрационного
хоста в памяти страницы; настоящая админка отвечает теми же ответами со
своего сервера.

:::example {id="home/showcase" label="Примеры SIMAI Admin" fullscreen=false wrap=false}
:::

[Полный пример админки](/demo/) · [Эти примеры с кодом](/ru/guide/showcase/)

## Подключение

Набор подключается одной строкой рядом с SIMAI Framework — Loader сам
загрузит компоненты, которые есть на странице:

<!-- release:cdn -->
```html
<script src="https://cdn.jsdelivr.net/npm/@simai-studio/ui@5.20261123.1101/distr/core/js/core.min.js" data-sf-sets="admin"></script>
```
<!-- /release:cdn -->

Другие способы, версии и лицензия — в разделе [Подключение](/ru/guide/connection/).

## Почему SIMAI Admin

:::features
- :icon[bolt]{size=2 container=square variant=tonal scheme=primary} **Одна строка.** `data-sf-sets="admin"` рядом с SIMAI Framework — и каркас админки готов на странице.
- :icon[dns]{size=2 container=square variant=tonal scheme=primary} **Данные остаются у вас.** Меню и уведомления спрашивают сервер через порт: что показать и что разрешить, решает приложение.
- :icon[view_sidebar]{size=2 container=square variant=tonal scheme=primary} **Страница не прыгает.** Каркас держит место меню до его отрисовки, а сервер может напечатать первый ответ прямо в странице.
- :icon[devices]{size=2 container=square variant=tonal scheme=primary} **Любой экран.** Две колонки меню на широком экране, тонкая верхняя строка и меню на весь экран — на телефоне.
- :icon[notifications]{size=2 container=square variant=tonal scheme=primary} **Тихие уведомления.** Повторы свёрнуты, решённое помечено, а неудача фонового действия сама становится уведомлением.
- :icon[accessibility_new]{size=2 container=square variant=tonal scheme=primary} **Клавиатура и диктор.** Ссылка к содержимому, ⌘K для поиска, Escape закрывает панели, фокус всегда возвращается туда, откуда пришёл.
:::

:::::surface {width=full tone=muted padding=lg}
<!-- release:footer -->
::::grid {columns=3 gap=4}
:::card {variant=plain}
### Версия
SIMAI Admin 1.2.0 от 23 ноября 2026 года. [История изменений](/ru/guide/changes/)
:::
:::card {variant=plain}
### Совместимость
Собран и проверен над выпуском SIMAI Framework `ui-b4f79e1c58b7`; работает с Core `core.runtime` 1.67.0 или новее. [Подключение](/ru/guide/connection/)
:::
:::card {variant=plain}
### Лицензия
Бесплатно для малого бизнеса и некоммерческого использования, остальным — коммерческая лицензия SIMAI. [Условия лицензии](/ru/guide/connection/#лицензия)
:::
::::

[Руководство](/ru/guide/) · [Компоненты](/ru/components/) · [Полный пример](/demo/) · [npm](https://www.npmjs.com/package/@simai-studio/admin) · [SIMAI Framework](https://ui.simai.io/)
<!-- /release:footer -->
:::::
