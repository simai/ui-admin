# The site of the set admin

Documentation and demonstrations of SIMAI Admin, built with Docara 3.18.0
(`composer.json` pins it). Its live examples run the set's own build over the
SIMAI Framework pair the set is built on. The layout follows the set site
scheme (ui-control `control/decisions/2026-11-03-component-sets.md`, «The set
site»); the site of the set view (`simai/ui-view`, `site/`) is its reference.

- **Home** (`/ru/`): hero (name, sentence, two buttons), the four parts of the
  set in Framework pill tabs, each a surface-1 card (the frame, the menu with
  an object menu, notifications, background activity — one frame,
  `examples/home/showcase/`), a link to the full example (`/demo/`), the
  one-line connection, six advantages and a footer with version,
  compatibility, licence and links.
- **Руководство** (`/ru/guide/`), simple to advanced: introduction, quick
  start, connection (CDN, own copy, npm, versions, licence), the showcase
  with its code, the full example, concepts (frame, navigation port,
  notifications, background activity, first paint; each with a diagram and a
  live example), recipes (the set's own — settings page, bell with the
  notifications panel, long operation — and links to the SIMAI Framework
  recipes for the service screens on ui.simai.io), server (the port on the
  page, REST, Laravel and Larena, 1C-Bitrix), appearance, keyboard and
  accessibility, large data, upgrading, change history, FAQ.
- **Компоненты** (`/ru/components/`): an overview and one page per component
  (`sf-admin-shell`, `sf-admin-menu`, `sf-admin-notifications`,
  `sf-admin-activity`): a hand-written top with live examples per feature,
  the badges block, and the generated reference between `## Параметры` and
  `## См. также` (attributes, events, methods, CSS variables, accessibility,
  source).

```bash
sh package/scripts/gates.sh <workspace>                  # build and check the set
sh site/scripts/build.sh <workspace> [--ui DIR]          # build the site over that build (every --check, verify-static, the lint)
node site/scripts/build-pages.mjs [--receipt FILE]       # release blocks and badges
node site/scripts/build-examples.mjs                     # the examples' demo host (assets/admin-demo.js)
node site/scripts/build-reference.mjs [--receipt FILE]   # the generated reference
node site/scripts/site-lint.mjs                          # the content rules
node site/scripts/serve.mjs                              # http://127.0.0.1:8790/
bash site/scripts/publish-local.sh --polygon DIR         # a new release on https://ui-admin.test
node site/scripts/evidence.mjs <site URL> <out>          # every page, 1440/390, light/dark, cold loads
```

Each generator takes `--check` (fails on drift).

- `content/ru/` — the pages; `examples/` — the live examples. Decision ids,
  version history (outside the change history and the upgrade guide),
  promises and release literals are refused by the lint.
- Release data (versions, the pair, the connection lines, the footer, the
  badges) lives between `<!-- release:<name> -->` markers and is written by
  `build-pages.mjs` from the set receipt (its commit's `package/CHANGELOG.md`
  heading, `package/set.json`, each `component.json`), `contracts/releases/`
  and the materializer's pin. A block may stand indented in a list.
- `scripts/example-kit/kit.js` and `config/demo-panel.json` — the examples'
  demo host: `build-examples.mjs` writes `assets/admin-demo.js` into every
  example that loads it, one script holding the repository's own
  `src/ports/navigation-host.mjs` (the polygon's host), the demo panel's data
  and the kit (`window.AdminDemo`: `host`, `serve`, `notices`, `runs`).
- `config/reference.ru.json` — Russian for every manifest string the
  reference shows (`css:<variable>` keys for CSS variables). The generator
  reads the manifests at the commit the set receipt names, not the working
  tree.
- `simai-framework.lock.json` and `contracts/generated/` are written by
  `scripts/materialize-framework-runtime.php`; commit them after a rebuild.
- `vendor/`, `.docara/`, `.framework/`, `build_production/` and
  `.docara-verify.out` are local.

## The admin frame in an example

`sf-admin-shell` sizes itself to the window (`100dvh`). A Docara example
frame grows to its content, so a shell in it would grow without end. The
examples put the shell in a `.page-screen` box of a fixed height on the size
ladder and give the shell and its menu column that height; a real page needs
none of it. Docara has no fixed-height or window-sized example frame.

## The full example at /demo/

The polygon of this repository (the Vite site at the root, `npm run build`)
is the full example. `publish-local.sh --polygon DIR` lays it beside the
docs: its `index.html` becomes `/demo/index.html` and its links home point to
`/demo/`; its other files keep their root paths (`/assets/`, `/distr/`,
`/distr-pro/`, `/data/`, `/contracts/`, `/mock/`, its other pages), which the
Docara build does not use. `build.sh` allows `/demo/` as the one reference
outside the Docara build.

## Publishing (proposal; the owner decides)

Today the site is local only: `publish-local.sh` writes a new release folder
under `~/Sites/.ui-admin-releases/`, moves the `~/Sites/ui-admin.test`
symlink to it and keeps every earlier folder. Nothing deploys it, and
`.github/workflows/deploy-server.yml` is unchanged: a push to `main`
deploys the polygon alone to admin.simai.io.

A public site would take the same shape as the local one:

1. CI builds the set (`package/scripts/gates.sh`), the polygon
   (`npm run build`) and the site (`site/scripts/build.sh`) at one commit.
2. The release folder is assembled like `publish-local.sh` does — the docs at
   the root, the polygon under `/demo/` — with two differences: the example
   frames keep Docara's `sandbox="allow-scripts"` (a public host is not
   blocked by Local Network Access), so the Framework and set files the
   examples load (scripts, styles, fonts, JSON) must be served with
   `Access-Control-Allow-Origin: *`; and `landing-transform.mjs` runs after
   `verify-static`, as here.
3. The deploy job of `deploy-server.yml` uploads that folder instead of the
   polygon's `dist/` and switches the server's release link, keeping the
   previous release for a rollback.

Which host (admin.simai.io itself, with the polygon moving to `/demo/`, or a
docs host of its own) and when are the owner's decision.

## Languages

`docara.json` declares `ru` and `en`, each under its prefix, with
`locale_routing` `prefixed`. Content is Russian only: `content/en/` holds the
English home as a draft (`draft: true`), so no English page is published
until its text is accepted. The root redirects to `/ru/`.
