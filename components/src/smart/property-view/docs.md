# sf-property-view

One object's fields, shown and edited. The pair to `sf-data-view`: that one is a
set of records in any layout, this one is a single object — a storage record, a
related record, site settings, a profile.

The name is the property and not the record on purpose. Nothing in the component
knows what kind of object is behind a field; the renderer set it draws through is
addressed by a property **type** and a template. A name saying `record` would
narrow the component below its own contents, and the first consumer showing site
settings through it would be using a misnamed thing.

## What it owns, and what it does not

It owns the browser lifecycle and the arrangement on screen: sections, groups,
fields, which of them are hidden, which section is open.

It owns no data. Values, revisions, rights and addresses are the host's, reached
through `simai.property-view-port`. The component holds the host's last answer for
rendering and never writes to it — so a save, when the port can write, sends the
fields a person changed against the revision the read carried, and the host
answers with the object as it now is.

It chooses no component for a value. Every field is drawn by the published field
renderer set, addressed by the field's `propertyType`. A host that sends a
component name has moved a decision across the seam, and the next consumer will
have a different name for the same field.

## Connecting a host

```js
const view = document.querySelector('sf-property-view');
view.setHostPort({
  version: '1.0.0',
  capabilities: [],
  async raise(intent, payload) {
    if (intent === 'record.load') {
      return {answer: 'applied', record: await readObject(payload)};
    }
    return {answer: 'unavailable', reason: 'unknown-intent'};
  },
});
```

An answer is one of `applied`, `conflict`, `refused`, `unavailable`. Anything else
is a programming error and is thrown rather than drawn.

## The answer's shape

```json
{
  "answer": "applied",
  "record": {
    "record_id": "record-1",
    "collection": "pages",
    "revision": "7",
    "sections": [
      {"key": "main", "label": "Основное", "groups": [
        {"key": "about", "label": "О странице", "fields": [
          {"key": "title", "label": "Заголовок", "propertyType": "string", "value": "Первая запись"},
          {"key": "author", "label": "Автор", "propertyType": "user",
           "value": {"label": "Super User", "avatarText": "SU"}}
        ]}
      ]}
    ]
  }
}
```

`sections` is required even when there is one section: the arrangement belongs to
the host, and a flat list of values would make the component invent one. One
section renders as its groups alone, with no section list — a list of one is a
control that cannot be used.

## Password fields

A `string` field with `variant: "password"` is write-only. The host never sends
the password: its `value` is `{"set": true}` or `{"set": false}` (`null` reads as
not set), and the field reads «задан» or «не задан». In edit the control starts
empty; a save carries the field only when the person typed a new password, and
erasing what they typed takes the change back. An untouched password field is
never in `values`, so a save neither clears nor echoes one.

## Rare fields

A host marks a section, group or field `rare: true` and **sends it every time**.
The component hides it until `show-rare` is set. Filtering rare fields out of the
answer instead would make showing them a second read, and a person toggling the
view twice would see two different objects.

Showing them changes no value. It is a view decision, not a write.

## Field hints

A field's `hint` is drawn beside its label as `sf-help-mark`: a «?» that opens
the words on a press — by pointer, by finger and by Enter or space — and
announces them politely. It was a glyph carrying the words in a native `title`,
which needs a hover, so a touch device had no way to read a hint at all. The
button's accessible name is the hint itself, so what a screen reader says on
focus is what the mark opens.

## Inputs

| input | what it does |
|:---|:---|
| `record-id` | which object to read; changing it re-reads and keeps nothing from the previous one |
| `collection` | what kind of object, in the host's vocabulary; passed back, never interpreted |
| `show-rare` | show what the host marked rare |
| `empty-text` | what an empty value reads as; the host translates it |

## What is not here yet

This is the reading half. Editing a group, the modeless panel and its stack, the
field's own affordances, the related-records group and configuring the view each
arrive as their own published pair, in that order. The port version rises with
them, and the accepted versions live in one list in `index.js` that a contract
test compares with the manifest.
