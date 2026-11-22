# Changelog of the set `admin` (@simai-studio/admin)

## 1.1.0 (candidate, 2026-11-22)

Three components join the menu as `preview` (owner decisions C420 and C421 of
2026-11-22, with C415–C419 and C320–C342; study ui-control
`control/research/2026-11-22-admin-shell-study`):

- `sf-admin-shell` 1.0.0: the admin page frame on document scroll. Slots
  `bar`, `menu`, `head`, `top-end`, the content unslotted; settings `width`
  (list|read), `menu-reserve` (rail-column|rail|none), `product`,
  `skip-label`, `menu-open`; actions `open-menu`, `close-menu`,
  `focus-content`; events `menu-open`, `menu-close` {reason}. Writes
  `--sf-admin-shell-stick` (what sticks at the top) for a page's sticky parts.
- `sf-admin-notifications` 1.0.0: the notifications list. Settings `look`
  (panel|page), `group-by` (day|object), `fold`, `unread-only`,
  `history-href`, `settings-href`, `heading-level`, `items`; actions
  `refresh`, `read-all`, `read {keys}`, `add {item}`, `load-more`; events
  `open`, `read`, `read-all`, `load-more`, `failed`. Data over
  `simai.admin-navigation-port` 1.1.0 (`notifications.load`,
  `notifications.read`) or `items`.
- `sf-admin-activity` 1.0.0: the background-activity indicator. Settings
  `runs`, `history-href`, `size`, `placement`, `notify`; actions `refresh`,
  `show`, `close`; events `open`, `close`, `retry`, `cancel`, `finished`.

`sf-admin-menu` 1.15.1 (a patch, the follow-up the set build found):

- The bell opens the set's notifications panel when the page holds one: an
  `sf-admin-notifications` in its panel look (not `look="page"`) inside an
  `sf-drawer`, found by markup. The bell opens and closes that drawer, the
  list reads the port again as it opens, `aria-expanded` follows the drawer,
  Escape closes it and the focus comes back to the bell. A page no longer
  intercepts the bell. Without such a list the menu draws its own as before.
  No new event or setting.
- `notifications.read` carries the port's payload `{keys, all}`
  (`simai.admin-navigation-port` 1.1.0): a notice opened from the menu's own
  list was read with `{ids}`, and not at all once sf-drawer had carried the
  list into its portal (the click listener sat on the drawer element). The
  event `sf-admin-menu-read` keeps its vocabulary field `ids`.

`sf-admin-menu` 1.16.0 and the port editions (SIMAI Framework AN-2,
`simai.admin-navigation-port` 1.2.0, additive):

- Every implementer of the port in the set declares the editions it takes in
  `component.json` `x-port.supports`, which the pair's port edition gate
  reads: `sf-admin-menu` 1.0.0, 1.1.0, 1.2.0 (its declared edition stays
  1.1.0); `sf-admin-notifications` and `sf-admin-activity` 1.1.0, 1.2.0.
- `sf-admin-notifications` reads a notification's `object`, `level` and
  `resolved` from a host that declares 1.2.0 or later; a 1.1.0 host's
  notifications are drawn as in 1.1.0. The setting `items` keeps all three.
- `sf-admin-activity` asks `activity.load`, `activity.retry {id}` and
  `activity.cancel {id}` of a host that declares 1.2.0 or later and offers
  `activity`, takes the runs of the answer, and offers no Retry for a run with
  `retryable: false` (new optional field of the setting `runs`). A 1.1.0 host
  is asked nothing.

Two defects the admin settings study found (ui-control
`control/research/2026-11-22-admin-settings-study`):

- `sf-admin-menu` 1.16.1 (AS-6): `sf-admin-menu-navigate` is cancelable and
  is sent before the menu marks anything. A page with unsaved changes calls
  `preventDefault()`: the current row, the phone screen and the focus stay,
  the menu goes nowhere and an object-menu link is not followed; the page
  that later agrees goes there itself and sets `current`. Before, the menu
  marked the pressed row first and offered no way to refuse. `sf-admin-shell`
  closes its phone menu on the event only when no listener refused it.
- `sf-admin-shell` 1.0.0 (AS-5, before its first release): the shell places
  only what is in it now. A node it placed and the page then took out is
  forgotten, never put back (a page that swapped its body without a reload
  got the old form back when the phone menu closed: two forms at 390).

Over the SIMAI Framework candidate ui-source `245f2ac65ed2`
(`feat/admin-shell-parts`, group build 17; branch `admin/over-gb17-parts`):
the two fallbacks are gone. The activity indicator goes in sf-header-page's
slot `path-end` (AS-2) instead of the shell's `.sf-admin-shell-path` row,
which is removed; a failed run's «Повторить» is sf-progress-run's own in the
notice look (AS-4) instead of the set's sf-button under it (the relation
`cl-button` and the word `retry` of sf-admin-activity go with it). AS-1 and
AS-3 needed none. sf-admin-notifications and sf-admin-activity declare port
edition 1.2.0. Port 1.2.0 carries what the
1.1.0 gap lacked (see above).

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
