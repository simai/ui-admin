# The component set `admin`

This folder is the source of the component set `admin` (standard
`simai.component-set` 1.0.0 of SIMAI Framework), product «SIMAI Admin», Pro
licence: its passport `set.json`, the admin menu under `src/smart/`, its
tests and the scripts that test, probe and stage it. The rest of this
repository is the admin demo site; the set does not depend on it.

| Folder | Element | Former tag (until 2027-01-01) | What it is |
|:---|:---|:---|:---|
| `src/smart/admin-menu` | `sf-admin-menu` | none | the admin menu: a site's navigation over a host's navigation port (`simai.admin-navigation-port`): the rail, the section column, search, the object menu, favourites, notifications and the setting mode |
| `src/smart/admin-shell` | `sf-admin-shell` | none | preview: the admin page frame (C420): the bar, the menu, the head and the content on document scroll; the menu's room held before its first paint; the skip link; width list or read; the phone's sticky top line and full-screen menu |
| `src/smart/admin-notifications` | `sf-admin-notifications` | none | preview: the notifications list (C421): by day, repeats of one object folded under «Ещё N по …», «Прочитать все», panel or history page; over the menu's port or as items |
| `src/smart/admin-activity` | `sf-admin-activity` | none | preview: the background-activity indicator (C421): «Идёт N», the failure mark until the list is opened, «Не удалось N»; runs in sf-popover; a run's end told by SF.notify and a notification |

Over the SIMAI Framework candidate this branch pins, the preview components
use the Framework's admin shell parts and carry no fallbacks: the activity
indicator stands at the end of the head's crumbs row in sf-header-page's slot
`path-end` (AS-2, 1.12.0), and a failed run's «Повторить» is
sf-progress-run's own in the notice look (AS-4, 1.6.0).

Port editions: every component of the set that speaks
`simai.admin-navigation-port` declares the editions it takes in its
`component.json` `x-port.supports` (the pair's port edition gate reads it):
the menu 1.0.0, 1.1.0 and 1.2.0 (declared edition 1.1.0), the notifications
list and the activity indicator 1.1.0 and 1.2.0 (declared edition 1.2.0). The list reads a notification's `object`, `level`
and `resolved`, and the indicator asks `activity.load/retry/cancel`, only of a
host that declares 1.2.0; a 1.1.0 host is drawn as in 1.1.0.

The component came from `simai/ui-pro` `components/src/smart/admin-menu` at
`2ba35fa` byte for byte (sf-admin-menu 1.11.2), was carried to ui-pro's
1.14.2 and is 1.15.0 here: the navigation menu as the owner approved it on
the showcase (decision C384 of 2026-11-19, order AM-1..AM-61); 1.15.1 opens
the set's sf-admin-notifications panel from the bell when the page holds one
(an sf-admin-notifications in an sf-drawer; docs.md «Колокол и список
уведомлений набора») and reads with the port's `{keys, all}`. 1.16.0 accepts
`simai.admin-navigation-port` 1.2.0 beside 1.0.0 and 1.1.0. Its history
before the move is in ui-pro. Its dated event aliases (`aliases.json`, until
2026-12-01) move with it; the tag itself has no former name.

Since 1.15.0 the menu has one path, the navigation over the port. The older
menu of child item elements (the "items" path: its settings
menu, search panel, compact mode, persistence, their settings, actions,
events, words and the aliases `sf-admin-menu-search`,
`sf-admin-menu-settings-reset` and `setRecentResults`) was removed before the
set's first release (AM-7): the set was never released with it, so no alias
follows it. The setting `source` is gone too; a page that still writes
`source="port"` loses nothing, the attribute is not read.

### Owner repository

`simai/ui-admin` (this folder) owns `sf-admin-menu`. Every change to the menu
is made here and nowhere else. The copy in `simai/ui-pro`
(`components/src/smart/admin-menu`, 1.14.2) is frozen: it is dropped from the
`pro` bundle in the first Pro release after the set `admin` is released, and
until then gets no new work. A page takes the menu from the set `admin`.

## Built against a pinned ui-source

The component imports the free SIMAI Framework by relative path
(`../../core/js/smart-base`, `../helpers/dom`). It is built and tested in an
**overlay**: ui-source at the revision `framework.lock.json` pins (from git,
never a working tree), with this folder's `src/`, `tests/` and `docs/` laid
over it. A file here may not replace a ui-source file.

On the branch `admin/over-gb17-parts` the pin is `245f2ac65ed2`, a
SIMAI Framework candidate (ui-source `feat/admin-shell-parts`, group build
17), not a released pair: it registers the set's names and carries the admin
shell parts AS-1..AS-4 and `simai.admin-navigation-port` 1.2.0. The gates
read a Framework built from it (the free side is that build's distr, the
registry its `contracts/registry/names.json`); the pin moves to the released
pair's source when the pair is cut. The passport names the same commit.

```bash
node scripts/test.mjs                                   # unit and contract suite in the overlay
node scripts/check-registry.mjs                         # passport against the name registry at ui-source main
node scripts/run-manifest-probes.mjs <free> <set build> # every probe.json, real Loader, set declared
node scripts/run-browser-probes.mjs <free> <set build>  # tests/browser/*.browser.mjs in a real browser
node scripts/run-first-paint.mjs check|gate <free> <set build>
```

`<free>` is the `distr` of the released pair (`git -C <ui> archive
9ceecc24c988 distr`), `<set build>` the build output holding `smart/`
(`wave-1/output/package/admin` of the build below). `scripts/gates.sh` runs
the whole chain: two builds, the receipt, the suite, the probes and the first
paint.

## Building the set

ui-builder builds it over the pinned ui-source, from committed bytes, twice:

```bash
node <ui-builder>/scripts/verify-package-reproducibility.cjs \
  <ui-source> <new workspace> --package admin \
  --package-source <ui-admin> --package-path package --package-revision <commit>
python3 <ui-builder>/scripts/write-package-receipt.py --report <workspace>/report.json --ui <ui>
```

The output is `set.json`, `smart/admin-menu/…` (and the other folders) and `smart/rule.js`, one
`SF.RuleLoader.registerPackage("admin", {rules})` call, and a receipt that
names the ui-source revision and the free release it was built over. The
release route (ui-builder `publish-package-release.sh`) lays it into
`package/dist/` and tags `admin-<12>`; it is not run yet.

## Connecting it

```html
<script src="https://cdn.jsdelivr.net/npm/@simai-studio/ui@5.20261121.928/distr/core/js/core.min.js" data-sf-sets="admin"></script>
```

or, from a base the page serves itself:

```js
window.SF_BOOT_CONFIG = {packages: {admin: {base: '/assets/ui-admin/smart', version: '1.0.0'}}};
```

An admin page that also shows data views declares both sets:
`data-sf-sets="admin view"`. The menu itself needs no other set.

## Moving to a newer SIMAI Framework

Change `framework.lock.json` and `set.json` `framework.source_revision` to the
ui-source revision of a newer released pair, run the gates against it and
build. A set is built and tested against exactly one revision.

## Кратко по-русски

Здесь исходник набора компонентов `admin`: меню администратора
`sf-admin-menu` 1.15.1 — то самое меню, которое владелец утвердил на витрине
(решение C384, пункты AM-1..AM-61). Владелец меню — этот репозиторий
`simai/ui-admin`; копия в `simai/ui-pro` заморожена и уйдёт из пакета `pro`
в первом выпуске Pro после выпуска набора. Набор собирается и проверяется
ровно против одной ревизии SIMAI Framework — сейчас это пара
`ui-9ceecc24c988`.

С 1.15.0 у меню один путь — навигация над портом хоста: старое меню из
дочерних элементов-пунктов с его окном настроек, панелью поиска и
компактным режимом убрано до первого выпуска набора (AM-7), без псевдонимов —
набор с ним не выпускался.
