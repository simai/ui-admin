// Generated from component.json by scripts/generate-component-files.mjs; do not edit.
SF.RuleLoader['cl-admin-notifications'] = {
  tags: ['sf-admin-notifications'],
  type: 'smart',
  mode: 'smart',
  js: true,
  css: true,
  relation: [
    { name: 'icons' },
    // A notification's level glyph is sf-icon; a tag the list renders is a tag it fetches.
    { name: 'cl-icon' },
    // «Прочитать все», «Показать ещё» and «Повторить».
    { name: 'cl-button' },
    // A list the host could not load says so in sf-alert; not on screen when the page starts.
    { name: 'cl-alert', lazy: true },
  ],
};
