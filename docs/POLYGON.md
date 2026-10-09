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

## The address is the state

The admin opens as a list. Pressing a row opens the record and changes the
address; Back closes it again.

| Address | What is on screen |
|:---|:---|
| `/` | the list |
| `/?record=r-007` | the list with that record open over it |
| `/?record=r-007&view=full` | that record as the page, the list put away |

A reload lands on the same record, Back and Forward work, and the link can be
sent to somebody — which is what an admin is expected to do. A query rather
than a path (`/records/r-007`) because this is a static site: a path would be a
404 on reload, and an address that only works until you press F5 is not an
address. Larena's detail page is a path, because Larena has a server to route
it; the page reads one parameter either way.

Two things about the record panel are worth knowing before copying it.

**A property view carrying `panel` is open from the moment it is in the
document.** The drawer portals its content out of the element, so `hidden` on
the element leaves the panel painted, and the composite has no closed state of
its own — its own source says closing is the host's decision. The page makes
the element when the address names a record and removes it when it does not.
`hidden` is the first thing a consumer reaches for and it quietly does nothing.

**The Framework's loader is markup-driven**: it fetches a component when it
sees its tag. With no `sf-property-view` in the page, nothing loads it, so
`customElements.whenDefined('sf-property-view')` never returns — the whole page
sat empty until the startup wait was narrowed to the list's own components and
the panel's class was awaited after its tag was appended.

## The toolbar is the table's

The data view's `toolbar` slot has fallback content of its own — a bare
«Поиск» input, a «Вид» select and two buttons, raw and unstyled, meant to be
replaced. A host that also writes `toolbar="false"` on its table gets exactly
that and nothing else. This page did, and it looked like a form somebody forgot
to style.

The composition Larena serves, and the one to copy:

```html
<sf-data-view aria-label="Решения">
  <span slot="toolbar"></span>          <!-- suppresses the raw fallback -->
  <sf-table slot="content" aria-label="Решения"></sf-table>
  <sf-pagination slot="pagination"></sf-pagination>
</sf-data-view>
```

The table's own toolbar then does the work: search, «Фильтр» with its field list
and filter templates, and «Создать». Do not add a create button of your own
beside it — the table raises `sf-table-create-intent` and the data view turns
it into `view.create_record` already.

## Trying the hard states

An admin does not carry switches for its own host, so the conditions are in the
address. They travel with every address the page writes, so a link to a record
under «нет доступа» is still that link.

| | |
|:---|:---|
| `?scenario=empty` | the list answers with nothing |
| `?scenario=slow` | every answer takes 900 ms |
| `?scenario=forbidden` | the host refuses (`refused`) |
| `?scenario=unavailable` | the host is down (`unavailable`) |
| `?caps=-row-actions` | the host stops claiming a capability — repeatable, comma separated |
| `?caps=row-actions` | the host claims only the ones named |

The list stops offering what the host no longer claims: without `row-actions`
the actions column goes, without `saved-views` the saved-view controls go,
without `count-on-request` the total is replaced by «есть ещё страница». The
line under the heading is empty unless the page is being driven somewhere
unusual, and then it says where.

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
