# SIMAI Admin

The Admin set of SIMAI Framework, its documentation site and the reference
application with the polygon the admin components are built and tried on.
https://admin.simai.io/ serves the documentation at the root and the polygon
at `/demo/` (owner, 2026-11-23).

- **The Admin set** (`package/`, npm `@simai-studio/admin`) — `sf-admin-menu`,
  `sf-admin-shell`, `sf-admin-notifications` and `sf-admin-activity`. Its
  release output is committed (`package/dist`) and the site serves it from
  there under `/distr-admin/<release>/`, pinned in
  `config/simai-set.lock.json` (`npm run pin:set`). Pro dropped its copy of
  the admin menu with `pro-53cd26ab57cd`, so every page with the menu declares
  the `admin` package beside `pro`.
- **The documentation** (`site/`) — a Docara site; see `site/README.md`.
- **The Pro components** — `sf-table`, `sf-data-view` and `sf-property-view` —
  live in [`simai/ui-pro`](https://github.com/simai/ui-pro)
  (owner, 2026-10-23; before that in this repository, and before that in
  `simai/larena-ui`). They are published as the component package `pro`
  (the id Larena loads them by; named `larena` until 2026-11-02). This site builds that package from the
  sibling checkout `../ui-pro` and pins it
  ([Framework runtime](docs/developer/framework-runtime.md)).
- **The reference host** — a Vite site that runs those components the way an
  admin does: a records list and record panel, the admin menu, filters,
  field editing and user settings.
- **The polygon** (`index.html`, served at `/demo/` on the site) — 120 seeded records using every property
  type, answered by a mock host that does the work a backend does. See
  [`docs/POLYGON.md`](docs/POLYGON.md).
- **`server.js`** — the mock API the host talks to in development.

Everything here is built on the **SIMAI Framework**, which is free and open
source under Apache-2.0. Framework documentation: https://ui.simai.io/.

## Licensing

This repository is not under the SIMAI Framework's licence. Its own terms —
for the reference application, the polygon and the mock server; the
components' licence is in `simai/ui-pro` — are in
[`LICENSE.md`](LICENSE.md); in plain words:

- **Small businesses use it free** — individuals, and companies with fewer than
  100 people and under USD 1,000,000 a year in revenue (PolyForm Small
  Business License 1.0.0).
- **Non-commercial use is free** — personal projects, study, research,
  charities, schools, public institutions (PolyForm Noncommercial License
  1.0.0).
- **Everyone else pays** — a SIMAI Commercial License, available on request
  from SIMAI.
- **Inside Larena it is included** — use as part of Larena is covered by
  Larena's own licence.

## Quick start

The site reads its sibling repositories by default (`../ui` for the pinned
SIMAI Framework pair, `../ui-pro` for the component package's source, and
`../ui-source` and `../ui-builder` to build it); `.env.example` lists the
variables that point elsewhere.

```bash
npm install
npm run dev           # checks the pins, lays out the runtime, starts Vite
npm run dev:api       # the mock API (server.js)
```

`npm run dev:runtime` serves a ready `distr/` named by `SIMAI_RUNTIME_ROOT`
instead, without the sibling checkouts.

## Commands

```bash
npm run build          # data check, pins, runtime, contracts, polygon check, Vite build
npm run pin            # pin the SIMAI Framework pair
npm run pin:package    # build ../ui-pro/components and pin the package
npm run pin:set        # pin the Admin set release package/dist holds
npm run publish        # build the polygon and the docs, publish to ui-admin.test
npm run test:runtime
npm run test:api
npm run test:browser
```

## Documentation

Developer notes are in [`docs/README.md`](docs/README.md): local development,
the Framework runtime and its lock, the mock API contract, the `sf-table`
integration.
