# sf-admin-menu

Smart-компонент административного меню над портом навигации хоста
(`simai.admin-navigation-port`): рейка разделов, колонка раздела, поиск ⌘K,
избранное, уведомления и режим настройки. Разметка, атрибуты и события описаны
на странице «Административное меню» в ui-doc.

С 1.15.0 у меню один путь — навигация над портом. Меню из дочерних
`<sf-admin-menu-item>` со своим окном настроек, панелью поиска, компактным
режимом и хранением настроек (путь «items») убрано до первого выпуска набора
(AM-7, решение C384): набор с ним не выпускался, поэтому прежние имена не
оставлены псевдонимами. Пока порт не ответил и страница не напечатала первый
ответ (`first-answer`), меню — своя заготовка.

## Сценарии соответствия

Проверки контракта — страница `conformance` в `examples.json` (стандарт 1.3.8
§12, gate 20): события по глаголам, открытие строки с клавиатуры, избранное и
настройки, сброс вида, поиск и вручение порта. Фикстура Studio —
`studio.fixture.json`, дымовой сценарий — `studio.scenario.json`.

## Интерфейс по стандарту simai.smart-component 1.3.8

Контракт — `component.json`; слова — `lang/<язык>.json` (словари меню собираются
из них в `js/words.js`); старые имена с датами — `aliases.json`.

### Events

Что человек попросил у хоста через порт `simai.admin-navigation-port`, меню сообщает
глаголом словаря 1.1.5 (§5.1): `detail` — `{kind, …поля словаря, intent, payload}`,
где `intent` и `payload` — намерение порта и его данные как есть.

| Event | Intent порта | kind и поля |
|:---|:---|:---|
| `sf-admin-menu-refresh` | `navigation.load`, `notifications.load` | `navigation` `{reason, site}`, `notifications` |
| `sf-admin-menu-open` | `item.open`, `site.switch`, `view.profile`, `search.choose` | `item` `{id, href}`, `site` `{id}`, `view` `{id}`, `search` `{id, group}` |
| `sf-admin-menu-toggle` | `favourite.toggle` | `favourite` `{id, on}` |
| `sf-admin-menu-save` | `preference.*`, `view.save` | `preference` `{values}`, `view` `{id, revision}` |
| `sf-admin-menu-query` | `sites.search`, `search.query` | `site`, `search` `{query}` |
| `sf-admin-menu-create` | `view.create` | `view` |
| `sf-admin-menu-rename` | `view.rename` | `view` `{id, title}` |
| `sf-admin-menu-delete` | `view.delete` | `view` `{ids}` |
| `sf-admin-menu-read` | `notifications.read` | `notifications` `{ids}` |
| `sf-admin-menu-reset` | `view.reset` | `view` `{id}` |
| `sf-admin-menu-sign-out` | `session.sign-out` | `session` |
| `sf-admin-menu-navigate` | — | хост ответил `applied` на открытие: `{id, key, href, region}` |
| `sf-admin-menu-column-change` | — | колонка раздела показана или скрыта: `{open}` |

Старое имя `sf-admin-menu-intent` `{intent, payload}` следует за каждым событием,
у которого есть `intent`, до 2026-12-01; каждое использование записывается в
`SF.deprecations`.

### Settings и actions

Порт вручается базовым действием `connectPort({port})` (`setHostPort` — его
прежнее имя); событие `sf-host-port-request` ещё отправляется до 2026-12-01.
Без порта меню остаётся заготовкой; `refresh()` ничего не делает, `toggle()`
отвечает `refused`.

`expected-columns` (1 или 2, по умолчанию 2) — сколько колонок рисует заготовка
меню на широком экране, пока хост не ответил. Сервер знает, открыт ли у строки
страницы корень: на главной его нет, и меню — одна колонка
(`expected-columns="1"`), в разделе — две. С верным числом меню до ответа такой
же ширины, как после, и страница рядом не сдвигается. Это форма заготовки, а не
ограничение: ответившее меню берёт столько колонок, сколько нужно его строкам.

`search-shortcut` (по умолчанию `mod+k`) открывает поиск с любого места страницы;
пустое значение выключает. `current` — ключ строки, на которой страница; `open` —
показано ли меню там, где страница его складывает (уже 44rem). Колонку раздела
открывают и скрывают `showColumn()`, `hideColumn()`, `toggleColumn()` и Ctrl/Cmd+B;
у хоста — `data-column` `open | hidden | none`.

### Вторая колонка — о том, где человек (1.7.0)

Решение владельца 2026-11-05 после UX-аудита Larena Panel: на экране не больше
двух меню, и второе всегда о том месте, где человек сейчас. Вторая колонка
показывает:

1. меню объекта, который открыт на странице (`context` в ответе хоста), если
   страница его дала;
2. иначе — пункты корня, в котором лежит строка страницы (`navigation.current`);
3. иначе — ничего: колонка закрыта. Чужой корень (открытый на прошлой странице)
   она больше не показывает; память открытого корня по сайтам (`openRoots`)
   удалена.

Корень, на который нажали в первой колонке, показывается во второй, пока
человек не откроет страницу; дальше колонка снова следует за страницей.
Открыта колонка или закрыта — один выбор человека на всех страницах и сайтах
(`SF.Preferences`, ключ `sf-admin-menu/main`, поле `second`), так что меню не
прыгает (правило 2026-10-13 остаётся). Если колонка закрыта, а странице есть
что в ней показать, рядом с кнопкой сворачивания стоит «Показать колонку».

#### Меню объекта: поле ответа `context`

Хост получает адрес страницы в `navigation.load` как `page` (путь и запрос,
без домена) и может ответить меню объекта этой страницы:

```json
{
  "context": {
    "title": "demo-owned.test",
    "subtitle": "PHP 8.3",
    "status": {"text": "Работает", "status": "success"},
    "back": {"label": "Все сайты", "href": "/panel/sites"},
    "groups": [
      {"label": null, "items": [
        {"key": "site.overview", "label": "Обзор", "href": "/panel/sites/demo", "icon": "dashboard"},
        {"key": "site.backups", "label": "Резервные копии", "href": "/panel/sites/demo/backups", "icon": "backup",
         "badge": {"text": "1", "status": "error"}}
      ]},
      {"label": "Дополнительно", "items": [
        {"key": "site.php", "label": "PHP и веб-сервер", "href": "/panel/sites/demo/php", "icon": "code"}
      ]}
    ],
    "current": "site.overview"
  }
}
```

- `status` — строка или `{text, status}` (`info`, `success`, `warning`, `error`);
  `badge` пункта — `{text, status}`.
- Первая колонка оставляет текущим корень страницы (`navigation.current`).
- Пункты — обычные ссылки: средний клик открывает вкладку; обычный клик идёт
  через region navigation, когда она включена, иначе браузер переходит сам.
  Меню сообщает `sf-admin-menu-navigate` `{id, key, href, region}` (у «назад»
  `id` — `sf:context-back`). Намерения порта нет, в избранное пункты не
  предлагаются, в режиме правки меню их нет.
- После мягкой смены содержимого (region navigation) меню снова спрашивает
  `navigation.load` с новым `page`; ответ заменяет `context` или убирает его.
  Хост отвечает `current` той страницы, о которой его спросили.
- На телефоне меню объекта — экран, который открыт по умолчанию: вверху
  «← Все сайты» (`back.label`), рядом с заголовком кнопка «Все разделы» к первой
  колонке.

Поля `page` (в запросе) и `context` (в ответе) описаны в порту
`simai.admin-navigation-port` 1.1.0 (ui-source), который объявляет меню; хост
порта 1.0.0 меню тоже принимает: он не присылает `context` и не читает `page`.

#### Длинное название пункта

Длинное название пункта переносится на вторую строку, а не обрезается
многоточием — в обеих колонках и в меню объекта. Пункт становится выше на одну
строку текста; значок, стрелка и бейдж стоят по середине первой строки.
Однострочный пункт сохраняет прежнюю высоту.

#### Подпись «Общее для всех сайтов» (1.7.1)

Под названием раздела уровня установки (`level: "install"`) вторая колонка
пишет «Общее для всех сайтов» только тогда, когда меню переключает сайты: в
`capabilities` хоста есть `site-switch`. У хоста без переключения сайтов других
сайтов нет, и подписи нет совсем. Раздел уровня сайта, как и раньше, подписан
названием текущего сайта.

#### Первый ответ в странице: `first-answer`

Сервер, у которого меню уже есть, печатает первый ответ `navigation.load` в
островке настроек меню, и меню рисуется из него сразу, без заготовки и без
порта; порт, когда хост его подключит, отвечает за ним без состояния загрузки:

```html
<sf-admin-menu aria-label="Меню">
  <script type="application/json" data-sf-settings>
    {"first-answer": {"revision": "1", "current": "sites", "items": [...], "context": {...},
                      "capabilities": ["notifications", "search"]}}
  </script>
</sf-admin-menu>
```

`capabilities` — возможности порта, известные до порта, чтобы первая отрисовка
была окончательной. До подключения порта пункты страниц — обычные ссылки.
Это та же настройка `first-answer` в островке `data-sf-settings`, что у
`sf-view`.

### CSS variables

Ширина меню публикуется на `:root`, чтобы страница резервировала ровно его коробку
до отрисовки (переменные зарегистрированы как длины: из скрипта читаются в px,
`getComputedStyle(document.documentElement).getPropertyValue('--sf-admin-menu-two-columns-inline-size')`):

| Переменная | Что это | По умолчанию |
|---|---|---|
| `--sf-admin-menu-one-column-inline-size` | рейка без открытого раздела (`expected-columns="1"`) | `var(--sf-d4)` |
| `--sf-admin-menu-two-columns-inline-size` | рейка с открытой колонкой раздела | `calc(var(--sf-d4) + var(--sf-f6))` |
| `--sf-admin-menu-compact-one-column-inline-size` | то же, что одна колонка: первый уровень всегда рейка | `var(--sf-d4)` |
| `--sf-admin-menu-compact-two-columns-inline-size` | то же, что две колонки | `calc(var(--sf-d4) + var(--sf-f6))` |

Колонки — ширины из токенов (рейка `--sf-d4`, колонка раздела `--sf-f6`) в любом
разделе: длинные подписи кончаются «…», поле «Найти в разделе» колонку не
расширяет. Ручки ширины у колонки нет (C365).

Публичные переменные оболочки навигации; компонент их не задаёт.

| Variable | Default |
|:---|:---|
| `--sf-admin-menu-color` | `var(--sf-on-surface)` |
| `--sf-admin-menu-first-background-color` | `var(--sf-surface-1)` |
| `--sf-admin-menu-second-background-color` | `var(--sf-surface-0)` |
| `--sf-admin-menu-border-color` | `var(--sf-outline-variant)` |
| `--sf-admin-menu-padding` | `var(--sf-a4)` |
