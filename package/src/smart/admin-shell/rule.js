// Generated from component.json by scripts/generate-component-files.mjs; do not edit.
SF.RuleLoader['cl-admin-shell'] = {
  tags: ['sf-admin-shell'],
  type: 'smart',
  mode: 'smart',
  js: true,
  css: true,
  relation: [
    { name: 'icons' },
    // The phone top line's menu button is sf-button-icon, ghost, the 1 rung;
    // a tag the shell renders is a tag it fetches. The page's own parts
    // (the bar, the menu, the head, the content) are found by the Loader where
    // the page wrote them.
    { name: 'cl-button-icon' },
  ],
};
