---
description: Как подключить SIMAI Admin одной строкой, из npm или из своей копии; версии, совместимость с SIMAI Framework и лицензия.
profile: article
---

# Подключение

Страница подключает SIMAI Framework и называет наборы, которые использует.
Loader сам находит набор, загружает его правила и подгружает только те
компоненты, которые есть на странице.

## Одна строка

<!-- release:cdn -->
```html
<script src="https://cdn.jsdelivr.net/npm/@simai-studio/ui@5.20261124.2316/distr/core/js/core.min.js" data-sf-sets="admin"></script>
```
<!-- /release:cdn -->

Атрибут `data-sf-sets` перечисляет наборы через пробел. Админка, которая
показывает и списки данных, называет оба набора: `data-sf-sets="admin view"`.
Конкретную версию набора задают через `@`: `data-sf-sets="admin@<версия>"`.
Без версии Loader выбирает по общему индексу совместимости самый новый выпуск
набора, который подходит к подключённому Core.

<!-- release:compat -->
Эта сборка сайта показывает версию 1.2.1 (`admin-13b82de3be68`): она собрана над выпуском SIMAI Framework `ui-3963bfe39302` (npm `@simai-studio/ui@5.20261124.2316`) и работает с `core.runtime` 1.67.0 или новее.
<!-- /release:compat -->

Ссылка на выпуск закрепляет Core и набор вместе:

<!-- release:cdn-pinned -->
```html
<script src="https://cdn.jsdelivr.net/npm/@simai-studio/ui@5.20261124.2316/distr/core/js/core.min.js" data-sf-sets="admin@1.2.1"></script>
```
<!-- /release:cdn-pinned -->

## Из своей копии

Если страница раздаёт сборку набора сама — со своего сервера или из своей
сборки сайта, — она указывает адрес до запуска Core:

<!-- release:boot -->
```html
<script>
  window.SF_BOOT_CONFIG = {
    packages: {
      admin: {base: '/assets/ui-admin/smart', version: '1.2.1'}
    }
  };
</script>
<script src="/assets/ui/distr/core/js/core.min.js"></script>
```
<!-- /release:boot -->

`base` — папка `smart/` сборки набора: в ней лежат `rule.js` и папки
компонентов. Этот сайт подключает набор именно так, из своей сборки.

## Компоненты на странице

После подключения компоненты набора пишут обычной разметкой:

```html
<sf-admin-shell product="Моя админка">
  <sf-admin-menu slot="menu" aria-label="Меню"></sf-admin-menu>
  <sf-header-page slot="head" heading="Заказы"></sf-header-page>
  <p>Содержимое страницы</p>
</sf-admin-shell>
```

Меню и уведомлениям нужен порт навигации — см.
[Порт навигации](../concepts/port/) и [Быстрый старт](../quick-start/).

## Из npm

Набор опубликован в npm как `@simai-studio/admin`. Пакет нужен, когда
страница раздаёт файлы со своего сервера или собирает их своей сборкой:

<!-- release:npm -->
```bash
npm install @simai-studio/admin@1.2.1 @simai-studio/ui@5.20261124.2316
```
<!-- /release:npm -->

Готовая сборка набора лежит в `node_modules/@simai-studio/admin/dist/`:
паспорт `set.json` и папка `smart/` с `rule.js` и папками компонентов.
Скопируйте `dist/smart/` к себе и укажите её в `SF_BOOT_CONFIG`, как в
разделе [Из своей копии](#из-своей-копии).

## Версии и совместимость

Версия набора — версия его npm-пакета. Каждый выпуск собран и проверен
ровно над одним выпуском SIMAI Framework и называет наименьший Core, с
которым работает.

<!-- release:versions -->
| Набор | Выпуск | Собран над SIMAI Framework | Нужен Core |
|:---|:---|:---|:---|
| 1.2.1 | `admin-13b82de3be68`, 25 ноября 2026 года | `ui-3963bfe39302` | `core.runtime` 1.67.0 или новее |
| 1.2.0 | `admin-ebc242e8fa56`, 23 ноября 2026 года | `ui-b4f79e1c58b7` | `core.runtime` 1.67.0 или новее |
| 1.1.0 | `admin-25245d70cde8`, 23 ноября 2026 года | `ui-b4f79e1c58b7` | `core.runtime` 1.67.0 или новее |
| 1.0.0 | `admin-8cff3084cfaf`, 22 ноября 2026 года | `ui-9ceecc24c988` | `core.runtime` 1.61.0 или новее |
<!-- /release:versions -->

Строка без версии (`data-sf-sets="admin"`) берёт самый новый выпуск набора,
который подходит к подключённому Core. Для рабочего сайта закрепите версию
(`data-sf-sets="admin@<версия>"`): обновление станет вашим решением, а не
случайностью. Как переходить на новую версию — в разделе
[Обновление версий](../upgrading/).

Набор не требует других наборов. Компоненты, из которых он собран (кнопки,
поиск, шторка, всплывающее окно, строки действий), берутся из самого
SIMAI Framework.

## Лицензия

SIMAI Admin распространяется на одном из трёх условий на выбор:

- бесплатно для малого бизнеса — PolyForm Small Business 1.0.0;
- бесплатно для некоммерческого использования — PolyForm Noncommercial 1.0.0;
- остальным — коммерческая лицензия SIMAI по запросу;
- в составе Larena набор входит в лицензию Larena.

Автор и правообладатель — Рим Забаров. Сам SIMAI Framework распространяется
по лицензии Apache-2.0.

## См. также

- [Быстрый старт](../quick-start/)
- [История изменений](../changes/)
- [Компоненты](/ru/components/)
