// Generated from component.json by scripts/generate-component-files.mjs; do not edit.
SF.RuleLoader['cl-admin-activity'] = {
  tags: ['sf-admin-activity'],
  type: 'smart',
  mode: 'smart',
  js: true,
  css: true,
  relation: [
    { name: 'icons' },
    // «Идёт N», «Не удалось N» and the failure mark are sf-badge.
    { name: 'cl-badge' },
    // The list opens in sf-popover from the trigger.
    { name: 'cl-popover' },
    // A run is sf-progress-run in the notice look; drawn only when the list opens.
    { name: 'cl-progress-run', lazy: true },
    // Fallback until AS-4: «Повторить» under a failed run.
    { name: 'cl-button', lazy: true },
  ],
};
