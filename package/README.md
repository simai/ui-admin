# The component set `admin`

This folder is the source of the component set `admin` (standard
`simai.component-set` 1.0.0 of SIMAI Framework), product «SIMAI Admin», Pro
licence: its passport `set.json`, the admin menu under `src/smart/`, its
tests and the scripts that test, probe and stage it. The rest of this
repository is the admin demo site; the set does not depend on it.

| Folder | Element | Former tag (until 2027-01-01) | What it is |
|:---|:---|:---|:---|
| `src/smart/admin-menu` | `sf-admin-menu` | none | the admin menu: a site's navigation over a host's navigation port (`simai.admin-navigation-port`), search, the object menu, edit mode, profiles and settings |

The component came from `simai/ui-pro` `components/src/smart/admin-menu` at
`2ba35fa` byte for byte (sf-admin-menu 1.11.2), was carried to ui-pro's
1.14.2 and is 1.15.0 here: the navigation menu as the owner approved it on
the showcase (decision C384 of 2026-11-19, order AM-1..AM-61). Its history
before the move is in ui-pro. Its dated event and action aliases
(`aliases.json`, until 2026-12-01) move with it unchanged; the tag itself has
no former name.

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

The pin is `1dd18375cbc2`, the source of the released pair
`ui-dc9fc39aeb26` (npm `@simai-studio/ui@5.20261118.1205`), with the Pro
release `pro-a57887949f9a` beside it on the admin pages. The passport names
the same commit.

```bash
node scripts/test.mjs                                   # unit and contract suite in the overlay
node scripts/check-registry.mjs                         # passport against the name registry at ui-source main
node scripts/run-manifest-probes.mjs <free> <set build> # every probe.json, real Loader, set declared
node scripts/run-browser-probes.mjs <free> <set build>  # tests/browser/*.browser.mjs in a real browser
node scripts/run-first-paint.mjs check|gate <free> <set build>
```

`<free>` is the `distr` of the released pair (`git -C <ui> archive
dc9fc39aeb26 distr`), `<set build>` the build output holding `smart/`
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

The output is `set.json`, `smart/admin-menu/…` and `smart/rule.js`, one
`SF.RuleLoader.registerPackage("admin", {rules})` call, and a receipt that
names the ui-source revision and the free release it was built over. The
release route (ui-builder `publish-package-release.sh`) lays it into
`package/dist/` and tags `admin-<12>`; it is not run yet.

## Connecting it

```html
<script src="https://cdn.jsdelivr.net/npm/@simai-studio/ui@5.20261118.1205/distr/core/js/core.min.js" data-sf-sets="admin"></script>
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
`sf-admin-menu` 1.15.0 — то самое меню, которое владелец утвердил на витрине
(решение C384, пункты AM-1..AM-61). Владелец меню — этот репозиторий
`simai/ui-admin`; копия в `simai/ui-pro` заморожена и уйдёт из пакета `pro`
в первом выпуске Pro после выпуска набора. Набор собирается и проверяется
ровно против одной ревизии SIMAI Framework — сейчас это пара
`ui-dc9fc39aeb26`.
