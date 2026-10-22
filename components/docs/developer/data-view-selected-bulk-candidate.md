# Selected bulk action routing (local candidate)

The `sf-data-view` composite previously checked a selected-bulk action ID
against each record's single-row `actions`. A host may expose a distinct bulk
ID, such as the Larena CMS `bulk_delete` control, so the composite refused the
request before the authenticated host port could check the batch.

An `sf-action-apply` selected-bulk event routes one or more selected records to
`bulk.apply_selected`; it verifies that every selected ID exists in the current
projection and attaches each current revision. A single-row
`sf-table-action-intent` still requires the row action ID and uses
`record.mutate` or `record.open`. The host remains responsible for whole-batch
authorization, revision conflicts and mutation. A missing record is refused
locally. The port schema is unchanged.

`node --test tests/table-*.test.mjs tests/data-view-composite.contract.test.mjs tests/smart-table-link-cell-contract.test.mjs` passed 45/45. ESLint for
`src/smart/data-view/index.js` and `src/smart/table/index.js` passed. The new
contract test verifies a distinct bulk ID reaches the host with one or two
selected records and their revisions, while row denial and missing-record
actions remain local. Larena
consumer repin and browser acceptance remain separate.
