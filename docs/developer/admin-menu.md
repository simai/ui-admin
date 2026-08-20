# Административное меню

`sf-admin-menu` в Admin является декларативным smart-компонентом: его структура
задаётся непосредственно в `index.html`, а поведение и рендер принадлежат UI
runtime. `src/main.ts` не управляет меню и не подменяет его внутреннее state.

## Где что находится

| Уровень | Файл | Роль |
| --- | --- | --- |
| Разметка Admin | `index.html` | `<sf-admin-menu>` и вложенные `<sf-admin-menu-item>` |
| Smart rule | `src/smart/admin-menu/rule.js` в SF5 | связывает tag `sf-admin-menu` с loader key `cl-admin-menu` |
| Smart implementation | `src/smart/admin-menu/index.js` в SF5 | парсит items, хранит state, рендерит меню |
| Базовый presentation component | `src/component/admin-menu/` в SF5 | CSS и базовое поведение отрисованной структуры |

## Загрузка

Core loader обнаруживает `<sf-admin-menu>` в живом DOM по `tags` rule. Для
`cl-admin-menu` rule декларирует зависимости `admin-menu`, `icons`, `inputs` и
`badges`. Loader подгружает их до регистрации smart element.

После выполнения Smart bundle `SfAdminMenu.define('sf-admin-menu')`
регистрирует custom element. Браузер обновляет уже существующий tag, вызывает
`connectedCallback()` и компонент превращает дочерние `sf-admin-menu-item` в
своё внутреннее представление.

## Контракт разметки

```html
<sf-admin-menu searchable collapsible settings logo="/public/logo.svg">
  <sf-admin-menu-item left-icon="home" href="/" active>
    Дашборд
  </sf-admin-menu-item>
  <sf-admin-menu-item left-icon="key">
    Фреймворки
    <sf-admin-menu-item href="/sf5">SF5</sf-admin-menu-item>
  </sf-admin-menu-item>
  <sf-admin-menu-item type="divider"></sf-admin-menu-item>
</sf-admin-menu>
```

`sf-admin-menu-item` поддерживает `label`/текст узла, `left-icon`,
`right-icon`, `href`, `target`, `rel`, `badge`, `value`, `order`, `slot` или
`position`, а также состояния `active`, `current`, `disabled` и `hidden`.
`type="divider"` либо атрибут `divider` создаёт разделитель.

Вложенные `sf-admin-menu-item` становятся дочерним уровнем пункта. Порядок
берётся из `order`, при его отсутствии - из порядка в HTML. Прямой текст
родительского пункта становится label; текст вложенных пунктов в него не входит.

## Поведение и состояние

Компонент сохраняет пользовательские настройки меню в local storage под ключом
`main-menu-settings`. Поэтому разметка в `index.html` является исходной
структурой, а локальное состояние может менять видимость, порядок или другие
настройки конкретных пунктов после загрузки.

Для изменения меню Admin меняйте декларативную разметку в `index.html`. Не
редактируйте DOM, который компонент создаёт после рендера: он будет заменён при
следующем обновлении state. При изменении самого поведения меню работайте в
исходнике Smart/Component владельца, не в Admin.
