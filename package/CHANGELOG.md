# Changelog of the set `admin` (@simai-studio/admin)

## 1.0.0 (candidate, 2026-11-22)

The first release of the set: the admin menu `sf-admin-menu` 1.15.0, the
navigation menu the owner approved on the showcase (decision C384 of
2026-11-19, with C320–C329 and C352–C354; order AM-1..AM-61), released on
its own as the set's first step (decisions C415–C418 of 2026-11-22).

Built and tested against SIMAI Framework `ui-9ceecc24c988`
(npm `@simai-studio/ui@5.20261121.928`, ui-source `e7ea89e07a3a`).
Requires Core runtime `>=1.61.0` and no other set.

### Public CSS variables (9)

| Variable | Type | What it sets |
|:---|:---|:---|
| `--sf-admin-menu-color` | color | the menu's ink |
| `--sf-admin-menu-first-background-color` | color | the rail's fill |
| `--sf-admin-menu-second-background-color` | color | the section column's fill |
| `--sf-admin-menu-border-color` | color | the column borders |
| `--sf-admin-menu-padding` | length | the menu's inner padding |
| `--sf-admin-menu-one-column-inline-size` | length | published on `:root`, read by a page: the menu with no open section (`expected-columns="1"`) |
| `--sf-admin-menu-two-columns-inline-size` | length | published on `:root`, read by a page: the menu with its section open |
| `--sf-admin-menu-compact-one-column-inline-size` | length | published on `:root`, read by a page: the rail alone |
| `--sf-admin-menu-compact-two-columns-inline-size` | length | published on `:root`, read by a page: the rail with its section open |

The four inline sizes let a page reserve the menu's room before its code
arrives (no shift on the first paint).

### The navigation port: `simai.admin-navigation-port` 1.1.0

The menu has one path: it draws what a host answers over the port
(`src/core/contracts/ports/simai.admin-navigation-port/1.1.0/port.json` of
ui-source, conformance kit of 39 cases). The page hands the port with the
base action `connectPort({port})` of SIMAI Framework's smart base.

- Data: `navigation` (required: revision, echo, site, items, favourites,
  profiles, rights, person), `sites_page`, `search_results`,
  `notifications_page`.
- Intents: `navigation.load` (since 1.1.0 it carries the page's address and
  is asked again on a page change without a reload), `item.open`,
  `site.switch`, `sites.search`, `search.query`, `search.choose`,
  `favourite.toggle`, `view.profile`, `view.create`, `view.rename`,
  `view.delete`, `view.save`, `view.reset`, `preference.theme`,
  `preference.language`, `preference.compact`, `notifications.load`,
  `notifications.read`, `session.sign-out`.
- Capabilities (a control without its capability is not drawn):
  `site-switch`, `search`, `favourites`, `menu-profiles`, `preferences`,
  `notifications`, `sign-out`.
- Actions: `refresh`, `toggle`, `show-column`, `hide-column`,
  `toggle-column`. Events: `query`, `reset`, `navigate`, `refresh`, `open`,
  `toggle`, `save`, `create`, `rename`, `delete`, `read`, `sign-out`,
  `column-change` (each `sf-admin-menu-<name>`).
- Settings of the element: `search-shortcut`, `current`, `expected-columns`,
  `first-answer`, `open`.

### Not in 1.0.0

- The items path (the menu of `<sf-admin-menu-item>` children, its settings
  menu, search panel, compact mode and persistence, the setting `source`,
  the names `sf-admin-menu-search`, `sf-admin-menu-settings-reset` and
  `setRecentResults`) was removed before this release (AM-7) and has no
  alias. `source="port"` on a page is harmless: it is not read.
- Dated aliases that do ship, until 2026-12-01: the event
  `sf-admin-menu-intent` (split into one event per verb) and the request
  `sf-host-port-request` (`aliases.json`).
