# The polygon

`/polygon.html` is a records list and a record panel over 120 records that use
every property type the Framework renders, answered by a host that does the work
a backend does. It exists so that a scenario can be tried rather than described,
and so that what Larena's admin needs is assembled here first.

## What is in it

| | |
|:---|:---|
| Records | 120, seeded, the same every time |
| Fields | 23, covering all 15 property types: `string text integer number date datetime boolean choice choices user record relation file color include` |
| List columns | 16, so every cell renderer is on screen at once |
| Edge cases | empty optional values, a title that wraps, zero and negative numbers, a record with five attachments, a record nobody may edit, rows offering one action and rows offering three |

The data is `data/polygon.json`, written by `scripts/build-polygon-data.mjs` and
committed. `npm run data:check` proves the committed file is what the generator
produces; the build runs it first, so the two cannot drift.

The host is `src/ports/polygon-host.mjs`. It searches across every field,
filters with the operators the Framework's filter controls produce, sorts with
empties last, pages, counts, mutates with revision comparison, keeps column
settings in three layers and keeps saved views. The record panel is a second
port over the *same* records, so a value saved in the panel is the value the
list shows on its next answer.

## Trying the hard states

The bar above the list is not part of an admin. It makes the host answer the way
a real one does on a bad day, which is what a consumer handles worst and sees
least:

- **Ответы хоста** — ordinary answers, an empty list, a slow host (900 ms),
  «нет доступа» (`refused`), «хост недоступен» (`unavailable`).
- **Права хоста** — each switch removes a capability. The list stops offering
  what the host no longer claims: without `row-actions` the actions column goes,
  without `saved-views` the saved-view controls go, without `count-on-request`
  the total is replaced by «есть ещё страница».

## Using it with a real backend

The split is deliberate: **the dataset is a file, the answers are code.** To put
Larena's own data behind the same page, replace the dataset, not the host.

```js
import { createPolygonHost } from './ports/polygon-host.mjs';

const host = createPolygonHost({
  dataset: await (await fetch('/admin/api/structure/workbench.solutions')).json(),
});
```

`data/polygon.json` is the shape to answer with, and `src/ports/polygon-host.d.mts`
is its written contract. A structure carries `fields` (each with a
`property_type`), the `sections`/`groups` the panel arranges them in, and a
`list` block naming its columns, page size, filterable and sortable fields. A
record carries `record_id`, `revision`, `editable`, the `actions` the host allows
for it, and `values` keyed by field.

That shape is Larena's own, not an invention here: `RootMinimalCmsGateway`
already describes a structure as `{key, property_type, label_key, hidden,
readonly}` with a `query` block and an `interaction` block, and
`CmsPropertyViewPort` already answers a record as `{record_id, revision, values,
editable}`.

To go further and answer the ports from PHP instead, the host is the list of
what to implement: every intent, every answer, and what each answer carries.
`npm run check:polygon` drives it through the conformance kits the Framework
ships beside each port version, so a PHP port can be held to the same list.

### What Larena should take from this first

**Columns must say what they hold.** `StorageWorkbenchDataviewPort` sends
columns as `{key, label, role, sortable, order, width, min_width, priority,
sticky, pinned}` — with no property type, because until data view port 1.7.0
there was nowhere to put one. Without it a boolean cell reads «true», a choice
reads its stored code, a colour reads its hex and a file reads as an object.
Adding `property_type` to each column, with `options` for a choice, puts
Larena's lists on the Framework's renderer set at once. The structure already
has the value — `array_column($fields, 'property_type', 'key')` — it was being
dropped on the way to the column.

**A host may format.** The renderer set asks the host through
`formatFieldValue(field, value)` and never guesses, so a date or an amount reads
the way the product says it reads. From 1.7.0 this is reachable from a list cell
as well as from a record panel.

## The checks that keep it honest

| Check | What it refuses |
|:---|:---|
| `npm run data:check` | a dataset that is not the generator's own output |
| `npm run check:polygon` | a property type the Framework renders and the polygon does not show, in a field or in a column; a field no record carries a value for; an answer either port's kit declares and this host cannot produce; an answer missing what the kit requires of it |
| `npm run check:published` | a published page running anything other than the pinned pair |
| `npm run pin:check` | a pin behind `ui`/`ui-smart` |

`check:polygon` reads the list of property types out of the renderer set that
ships in the pinned runtime, so a type added to the Framework fails here until
the polygon shows it. That is the whole mechanism by which this stays current
rather than becoming a page somebody once made.
