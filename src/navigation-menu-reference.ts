import { watchForStalePage } from './stale-page-notice';

const applyTheme = (): void => {
  const theme = window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
  document.documentElement.classList.toggle('theme-light', theme === 'light');
  document.documentElement.classList.toggle('theme-dark', theme === 'dark');
};

applyTheme();
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', applyTheme);

window.customElements.whenDefined('sf-admin-menu').then(() => {
  const menu = document.querySelector('sf-admin-menu') as HTMLElement & {
    getProp?: (name: string) => unknown;
  } | null;
  const reference = document.querySelector<HTMLElement>('.navigation-reference');
  const compact = menu?.getProp?.('compact') === true || menu?.hasAttribute('compact') === true;
  if (reference) reference.dataset.navigationCompact = compact ? 'true' : 'false';
  document.documentElement.dataset.navigationReferenceReady = 'true';
});

document.addEventListener('sf-admin-menu-compact-change', (event) => {
  const detail = (event as CustomEvent<{ compact?: boolean }>).detail;
  const reference = document.querySelector<HTMLElement>('.navigation-reference');
  if (reference) reference.dataset.navigationCompact = detail?.compact === true ? 'true' : 'false';
});

export {};

// The host sends no Cache-Control, so a browser may be showing a copy of this
// page from before the last publish. Say so rather than letting it pass.
watchForStalePage();
