# Changelog of the set `admin` (@simai-studio/admin)

## 1.2.2 (2026-11-26)

Built against ui-73df5d1b4d4c (SIMAI Framework pair of group build 19,
npm `@simai-studio/ui@5.20261125.1855`, ui-source `5e30b946fd0e`).
Requires Core runtime `>=1.67.0` and no other set.

The components of 1.2.1 (sf-admin-shell 1.0.1, sf-admin-notifications
1.0.0, sf-admin-activity 1.0.0; sf-admin-menu 1.17.2), rebuilt over the
new pair: a site serves a set only over its own exact pair, and 1.2.1 is
built over ui-3963bfe39302.

- `sf-admin-menu` 1.17.2 (a patch): in the setting mode, an Escape pressed
  in the ⌘K window closes the window only. The menu asked whether the
  window was open by `sf-search[open]`, but sf-search marks its open window
  with the host state `data-open`, so the same Escape also left the setting
  mode. The menu now reads `sf-search[data-open]`.

## 1.2.1 (2026-11-25)

Built against ui-3963bfe39302 (SIMAI Framework pair of group build 18,
npm `@simai-studio/ui@5.20261124.2316`, ui-source `96234dd717fb`).
Requires Core runtime `>=1.67.0` and no other set.

The components of 1.2.0 (sf-admin-shell 1.0.1, sf-admin-notifications
1.0.0, sf-admin-activity 1.0.0; sf-admin-menu 1.17.1), rebuilt over the
new pair: a site serves a set only over its own exact pair, and 1.2.0 is
built over ui-b4f79e1c58b7. No behaviour changed. What the pair forced:

- `sf-admin-menu` 1.17.1 (a patch): the pair's first-paint gate rule 24d
  now counts the sheets the Loader fetches for the printed parts after the
  element drew. The object menu's skeleton draws skeleton rows, and its
  example's sheet list (`static/sheets.json`) lacked
  `component/skeleton/css/skeleton.min.css`; the list now names it.
- The four `smart.manifest.json` carry the release pair marker in
  `compatibility.runtime_pair` (forty zeros; ui-source 96234dd71's
  generate-component-files writes it, and its content hash reads the field
  as the marker), not the old ui revision. The marker is hash-neutral, so it
  moves no component version.

## 1.2.0 (2026-11-23)

Built against ui-b4f79e1c58b7 (SIMAI Framework pair of group build 17,
npm `@simai-studio/ui@5.20261123.1101`, ui-source `e59dbad1c108`), as 1.1.0.
Requires Core runtime `>=1.67.0` and no other set.

`sf-admin-menu` 1.17.0 (a minor; DEV msg-25d02219, Larena msg-bc572080):
a closed menu fetches only what it draws.

- The ⌘K window (`sf-search` and the parts it is drawn with) is drawn on its
  first open, not with the menu, and stays drawn. Its code is fetched ahead
  when a pointer or the focus is on the search row, or Ctrl/⌘ is pressed.
- A control's part is fetched when a pointer comes over it or the focus
  reaches it: the bell's panel (`sf-drawer`), the person, rail root and site
  menus (`sf-menu-context`); the setting mode's parts when a menu with
  «Настроить меню» opens.
- A press waits up to 30 s for the part it opens: the Loader's `ensure`
  gives up after 3 s by default, and on a slow line the first press of the
  person menu, the bell or ⌘K did nothing.
- Relations: `cl-button` and `cl-input` are lazy; `inputs` (brought by
  `cl-input`) and the free `admin-menu` component (the former items menu's
  class enhancer and sheet, `.sf-admin-menu-*`, which the element does not
  use) are no longer relations. The find row holds a rung-1 control's height
  until its field is defined.
- On a Larena-like page (sets pro, chart and admin declared) with the menu
  closed: 88 files before, 49 after; the menu alone: 83 before, 42 after.
- Unchanged: settings, values, events, actions, words, the port. «Уведомления»
  is drawn only when the host announces the `notifications` capability
  (since 1.15.0).

`sf-admin-shell` 1.0.1 (a patch; DEV acceptance LM-R1): on a phone with the
menu open, Escape goes first to a layer opened over the menu. The bell's
notifications panel is a non-modal `sf-drawer` that leaves the focus on the
bell, so the shell's Escape closed the menu under the open panel, the panel
stayed and the focus went to the hidden menu button. Now the first Escape
closes the panel and the focus comes back to the bell; the next one closes
the menu. Browser probe `admin-shell-phone-escape` (390, light and dark).

## 1.1.0 (2026-11-23)

Built against ui-b4f79e1c58b7 (SIMAI Framework pair of group build 17,
npm `@simai-studio/ui@5.20261123.1101`, ui-source `e59dbad1c108`).
Requires Core runtime `>=1.67.0` (the `path-end` slot of sf-header-page and
sf-progress-run's notice Retry and Cancel) and no other set.

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

Over the SIMAI Framework group build 17 (ui-source `e59dbad1c108`, which took
in `feat/admin-shell-parts`): the two fallbacks are gone. The activity indicator goes in sf-header-page's
slot `path-end` (AS-2) instead of the shell's `.sf-admin-shell-path` row,
which is removed; a failed run's «Повторить» is sf-progress-run's own in the
notice look (AS-4) instead of the set's sf-button under it (the relation
`cl-button` and the word `retry` of sf-admin-activity go with it). AS-1 and
AS-3 needed none. sf-admin-notifications and sf-admin-activity declare port
edition 1.2.0. Port 1.2.0 carries what the
1.1.0 gap lacked (see above). A running cancelable run's notice row offers
sf-progress-run's own «Отменить» (ASR-1): one click asks the host
`activity.cancel {id}` and sends `sf-admin-activity-cancel`. `activity.load`,
`activity.retry` and `activity.cancel` carry no `event` (ASR-2); the
`x-port.sha256` of the indicator and the list name the 1.2.0 bytes of the pair.

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
