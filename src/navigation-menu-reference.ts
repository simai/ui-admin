import './style.css';
import './navigation';
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

// The menu draws the host's rows once the port answers (src/navigation.ts);
// the page says so for a harness that waits on it.
window.customElements.whenDefined('sf-admin-menu').then(async () => {
  const menu = document.querySelector('sf-admin-menu');
  for (let i = 0; i < 100 && !menu?.querySelector('.sf-admin-nav:not(.sf-admin-nav--skeleton)'); i += 1) {
    await new Promise((settle) => setTimeout(settle, 50));
  }
  document.documentElement.dataset.navigationReferenceReady = 'true';
});

export {};

// The host sends no Cache-Control, so a browser may be showing a copy of this
// page from before the last publish. Say so rather than letting it pass.
watchForStalePage();
