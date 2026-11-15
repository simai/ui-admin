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
`2ba35fa` byte for byte (sf-admin-menu 1.11.2; the `pro` bundle keeps shipping
it until it is rebuilt from the sets). Its history before the move is there.
Its dated event and action aliases (`aliases.json`, until 2026-12-01) move
with it unchanged; the tag itself has no former name.

## Built against a pinned ui-source

The component imports the free SIMAI Framework by relative path
(`../../core/js/smart-base`, `../helpers/dom`). It is built and tested in an
**overlay**: ui-source at the revision `framework.lock.json` pins (from git,
never a working tree), with this folder's `src/`, `tests/` and `docs/` laid
over it. A file here may not replace a ui-source file.

The pin is `5f130e62f87a`, the source of the released pair
`ui-22690ab1c1dd` (core.runtime 1.57.0, npm `@simai-studio/ui@5.20261115.1622`).
The passport names the same commit.

```bash
node scripts/test.mjs                                   # unit and contract suite in the overlay
node scripts/check-registry.mjs                         # passport against the name registry at ui-source main
node scripts/run-manifest-probes.mjs <free> <set build> # every probe.json, real Loader, set declared
node scripts/run-browser-probes.mjs <free> <set build>  # tests/browser/*.browser.mjs in a real browser
node scripts/run-first-paint.mjs check|gate <free> <set build>
```

`<free>` is the `distr` of the released pair (`git -C <ui> archive
22690ab1c1dd distr`), `<set build>` the build output holding `smart/`
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
<script src="https://cdn.jsdelivr.net/npm/@simai-studio/ui@5.20261115.1622/distr/core/js/core.min.js" data-sf-sets="admin"></script>
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
