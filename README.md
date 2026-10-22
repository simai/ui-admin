# SIMAI Admin

The SIMAI Admin components kit, with the reference host and the polygon it is
built and tried on.

- **`components/`** — the admin Smart components: `sf-table`, `sf-data-view`,
  `sf-property-view` and `sf-admin-menu`. They are published as the component
  package `larena` (the id Larena loads them by). See
  [`components/README.md`](components/README.md).
- **The reference host** — a Vite site that runs those components the way an
  admin does: a records list and record panel, the admin menu, filters,
  field editing and user settings.
- **The polygon** (`/`, the index page) — 120 seeded records using every property
  type, answered by a mock host that does the work a backend does. See
  [`docs/POLYGON.md`](docs/POLYGON.md).
- **`server.js`** — the mock API the host talks to in development.

Everything here is built on the **SIMAI Framework**, which is free and open
source under Apache-2.0. Framework documentation: https://ui.simai.io/.

## Licensing

This repository is not under the SIMAI Framework's licence. Its own terms are
in [`LICENSE.md`](LICENSE.md); in plain words:

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

Versions of the components published earlier from `simai/larena-ui` remain
under Apache-2.0.

## Quick start

The site reads its sibling repositories by default (`../ui` for the pinned
SIMAI Framework pair, `../ui-source` and `../ui-builder` to build the
component package); `.env.example` lists the variables that point elsewhere.

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
npm run pin:package    # build components/ and pin the package
npm run test:runtime
npm run test:api
npm run test:browser
cd components && npm test   # the components' own suite
```

## Documentation

Developer notes are in [`docs/README.md`](docs/README.md): local development,
the Framework runtime and its lock, the mock API contract, the `sf-table`
integration.
