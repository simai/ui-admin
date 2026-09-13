# Navigation parity lab design QA

Status: stress correction passed locally.

## Surfaces

- Direct SF reference: `navigation-menu-reference.html`.
- Larena Smart/backend integration:
  `https://larena.test/admin/ui/navigation-lab/integrated?locale=ru`.

## Verified

- The direct `sf-admin-menu` renders the requested dark sidebar composition:
  logo, search, active row, icons, badges, separator, nested group, favorites,
  settings and collapse control.
- Both variants enter the component's real settings mode and expose drag
  handles and Save state.
- The Larena variant is rendered through `Smart::render('ui.admin_menu')`, uses
  `persistence-mode="external"`, and keeps route/access semantics on backend.
- Desktop `1440x1100` and mobile `390x844` screenshots have no horizontal page
  overflow, console errors or failed network requests.

## Corrected interpretation

The component and current SF runtime are capable of the target menu, but the
first audit missed an integration-width mismatch. The component panel contract
is 320px while the Larena product shell allocated 272px and clipped the rest.
The stress pass now covers nested badges, multiple dividers, long scrolling
content, footer wrapping and compact/settings states before restoring PASS.

## Stress result

- 44 fixture nodes and five dividers exercise the real hidden-items and scroll
  paths rather than a short recognizable skeleton.
- Desktop sidebar: 320px; main panel: 319px; nested panel: 320px.
- Mobile host: 390px; component and nested panel: 320px.
- Four measured nested badges fit without clipping.
- Expanded scrolling uses `overflow-y: auto`, reaches a positive scroll
  position and never crosses the footer boundary.
- Footer settings text stays on one line in all accepted normal/nested/scroll
  states.
- Desktop/mobile normal, nested and scroll states plus desktop settings and
  compact states have zero console errors and failed requests.

## Evidence

- `output/playwright/navigation-parity-lab/report.json`
- `output/playwright/navigation-parity-lab/reference-1440x1100.png`
- `output/playwright/navigation-parity-lab/reference-1440x1100-settings.png`
- `output/playwright/navigation-parity-lab/reference-390x844.png`
- `output/playwright/navigation-parity-lab/integrated-1440x1100.png`
- `output/playwright/navigation-parity-lab/integrated-1440x1100-settings.png`
- `output/playwright/navigation-parity-lab/integrated-390x844.png`
- `output/playwright/navigation-stress-reference-final-8/report.json`
- `output/playwright/navigation-stress-reference-final-8/reference-1440x1100-nested.png`
- `output/playwright/navigation-stress-reference-final-8/reference-1440x1100-scroll.png`
- `output/playwright/navigation-stress-reference-final-8/reference-390x844-nested.png`
- `output/playwright/navigation-stress-integrated-final-7/report.json`
- `output/playwright/navigation-stress-integrated-final-7/integrated-1440x1100-nested.png`
- `output/playwright/navigation-stress-integrated-final-7/integrated-390x844-nested.png`
- `output/playwright/navigation-stress-integrated-final-6/larena-cms-1440x1100.png`

## Final controls and responsive pass

- Direct control coverage: Favorites, settings, item Hide, Add divider, Save,
  reload, Reset, drag reorder, Cancel, compact, compact search, mobile resize
  and mobile settings/cancel.
- Integrated lab and the real CMS cover desktop, compact, re-expanded, direct
  mobile, resized mobile, search, nested panel and settings states.
- Real CMS measurements: `320px` expanded, `90px` compact and `390px` mobile.
  Mobile blank-strip measurement is `0px`; the `1px` desktop difference is the
  intended panel border.
- Final runs have no console errors, failed requests or HTTP errors. Larena
  persistence was not mutated; save/reset persistence was exercised only in
  the isolated direct reference.
- Two popup defects were corrected during the pass: the portal now retains its
  rendered context-menu reference and Reset closes the popup.

Evidence:

- `output/playwright/navigation-controls-final/report.json`
- `output/playwright/navigation-controls-final/controls-mobile-final.png`
- `output/playwright/navigation-integrated-lab-final/report.json`
- `output/playwright/navigation-integrated-cms-final/report.json`
- `output/playwright/navigation-integrated-cms-final/integrated-1440x1100-collapsed.png`
- `output/playwright/navigation-integrated-cms-final/integrated-1440x1100-resized-mobile.png`
- `output/playwright/navigation-integrated-cms-final/integrated-390x844-settings.png`
