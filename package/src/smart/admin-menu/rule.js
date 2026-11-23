// Generated from component.json by scripts/generate-component-files.mjs; do not edit.
SF.RuleLoader['cl-admin-menu'] = {
  tags: ['sf-admin-menu'],
  type: 'smart',
  mode: 'smart',
  js: true,
  css: true,
  relation: [
    { name: 'admin-menu' },
    { name: 'icons' },
    { name: 'inputs' },
    { name: 'badges' },
    // A row's shortcut and the search row's keys are SIMAI Framework's kbd unit
    // (C04, KB-2, K-05): the menu writes the keys, the kbd sheet draws them.
    { name: 'kbd' },
    // The person's picture is the Framework's avatar drawing beside the button's text
    // (avatar/js/picture.js, K-06): the avatars sheet draws it.
    { name: 'avatars' },
    { name: 'cl-button' },
    { name: 'cl-menu-context', lazy: true },
    // The ⌘K palette is SIMAI Framework's search window in its admin command palette
    // recipe (C162, C175; K-04); it is fetched when the menu draws it.
    { name: 'cl-search', lazy: true },
    { name: 'cl-badge' },
    { name: 'cl-icon' },
    { name: 'cl-button-icon' },
    { name: 'cl-input' },
    // The navigation shell's edit mode moves rows with sf-sortable; a tag the
    // menu renders is a tag it fetches.
    { name: 'cl-sortable', lazy: true },
    // The rail's controls are named by SIMAI Framework's tooltip on hover and
    // focus (C320, AM-25); the rail draws them with the page.
    { name: 'cl-tooltip' },
    // The bell's notifications panel is sf-drawer beside the page (C340, AM-44): the
    // page's drawer holding sf-admin-notifications when there is one (1.15.1), else its own.
    { name: 'cl-drawer', lazy: true },
    // The setting header's levels are sf-segmented (C326 = C298, AM-41).
    { name: 'cl-segmented', lazy: true },
    // The edit mode's profiles are the profile picker (owner, 2026-10-14).
    { name: 'cl-profile-picker', lazy: true },
    // A row's glyph is chosen in the edit mode with the grid dropdown.
    { name: 'cl-dropdown', lazy: true },
    // A search that finds nothing and a menu the host could not load say so
    // in sf-empty-state; neither is on screen when the page starts.
    { name: 'cl-empty-state', lazy: true },
  ],
};
