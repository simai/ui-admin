# Endpoint options for Smart Table filters (local candidate)

## Contract

`sf-table` accepts `filter.optionsSource = {type: 'endpoint', url}` for
`multi-select` and `entity-multi-select`. The endpoint must share the page's
origin. On first render the table sends `limit=50`, a monotonic `sequence`,
and repeated `selected_values[]`. Further pages use `cursor`. Search is
requested only after the server advertises `searchable: true`.

The response has `status: 'ok'`, the matching numeric `sequence`, `items`
and `selected` arrays of `{value, label}`, `next_cursor` (string or null),
and `searchable` (boolean). Selected labels remain visible when their value
is outside the current page. A failed request preserves prior options and
offers retry. Replaced requests are aborted, and stale answers are ignored.

## Local candidate and proof

- `ui-source` code/port commit: `a6b7a82e3e252a73ea122e8eef6f163af20e4e8f`;
  pair/registry commit: `c513ab65`.
- Core: `56cd91e1d7a3dc19b32a2acfdaa1389744e174a7`.
- `ui-smart` runtime commit: `53da6801f7b9fe7a864081c186ba652a470a6f96`;
  generated manifest commit: `5e7adda`.
- Smart product runner from `ui-builder` completed with `diagnostics: []`,
  `status: 0` against `ui-source` `c513ab65`; output
  `/tmp/larena-filter-smart-build-20260925-d`.
- `node --test tests/table-*.test.mjs tests/data-view-composite.contract.test.mjs
  tests/smart-table-link-cell-contract.test.mjs`: 44/44 passed.
- `node --test tests/smart-contract-registry.test.mjs
  tests/data-view-composite.contract.test.mjs`: 6/6 passed.
- `npx eslint src/smart/table/index.js`: passed.
- `node tests/browser/table-filter-endpoint.browser.mjs <Core distr>
  /tmp/larena-filter-smart-build-20260925-d`: passed for two pages,
  off-page selected label, stale response, error recovery and no page errors.
- The same browser script also passed against the packaged bytes in the
  isolated Larena laboratory bundle
  `ui-56cd91e1d7a3-smart-5e7adda70be4-registry-8969813a-exact-git-tree-v2`.
  This verifies the pinned Framework bytes, while the Larena host browser flow
  remains a separate acceptance step.

The Studio cross-repository verifier could not complete against the current
`ui-studio` checkout: its manifest schema rejects an existing
`smart.admin-menu` visual state at `/state/visual_states/7`. This does not
affect the local source registry tests above, but cross-repository verification
still needs a compatible Studio pin.

This is a local candidate. Larena must pin the pair in an isolated lab,
connect host-owned filter fields to its option endpoint, and prove the full
Admin path before accepting the integration.
