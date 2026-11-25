// The admin menu on the polygon: sf-admin-menu answered with the navigation
// port, over data/navigation.json, so the menu that replaces the admin's top bar
// can be worked on against data with the shape Larena agreed to.
//
// The menu asks for its port when it connects (`sf-host-port-request`), and the
// data arrives over the network, so either can come first. A request that
// arrives before the data is answered once the data is in; a menu that
// connected before this module listened is given the port directly, which
// replaces the `items` menu it drew meanwhile.
// @ts-expect-error -- plain JavaScript, shared with scripts/check-polygon.mjs.
import { createNavigationHost } from './ports/navigation-host.mjs';

type NavigationHost = { port: string; version: string; raise: (intent: string, payload?: unknown) => Promise<unknown> };
type MenuElement = HTMLElement & { setHostPort?: (host: NavigationHost) => unknown; _navigation?: unknown };

// The row this page is: the catalogue by default, or what the page names.
const PAGE_KEY = document.body?.dataset.page || 'data.catalog';
const waiting = new Set<MenuElement>();
let host: NavigationHost | null = null;

const give = (menu: MenuElement) => {
  if (!host || typeof menu.setHostPort !== 'function') return;
  menu.setHostPort(host);
};

addEventListener('sf-host-port-request', (event) => {
  const detail = (event as CustomEvent).detail as { component?: MenuElement; context?: { owner?: string } } | undefined;
  if (detail?.context?.owner !== 'admin-menu' || !detail.component) return;
  if (host) give(detail.component);
  else waiting.add(detail.component);
});

const start = async () => {
  const response = await fetch('/data/navigation.json');
  const data = await response.json();
  // This page is the solutions catalog, which is the row data.catalog.
  host = createNavigationHost({ data, current: PAGE_KEY }) as NavigationHost;
  for (const menu of waiting) give(menu);
  waiting.clear();
  await customElements.whenDefined('sf-admin-menu');
  for (const menu of document.querySelectorAll<MenuElement>('sf-admin-menu')) {
    if (!menu._navigation) give(menu);
  }

  // The page header's star is the same favourite as the menu's: the header says
  // it was pressed, the host keeps it, and the menu reads the menu again so the
  // favourites block agrees with the star.
  const header = document.querySelector('sf-header-page');
  const menu = document.querySelector<MenuElement & { refresh?: () => Promise<unknown> }>('sf-admin-menu');
  const starred = async () => {
    const answer = await host!.raise('navigation.load', { reason: 'requested', site: null }) as { favourites?: Array<{ key: string }> };
    return (answer.favourites ?? []).some((entry) => entry.key === PAGE_KEY);
  };
  header?.setAttribute('star', (await starred()) ? 'on' : 'off');
  header?.addEventListener('sf-header-page-toggle', async (event) => {
    event.preventDefault();
    const { on } = (event as CustomEvent<{ on: boolean }>).detail;
    const answer = await host!.raise('favourite.toggle', { key: PAGE_KEY, on }) as { answer: string };
    if (answer.answer === 'applied') header.setAttribute('star', on ? 'on' : 'off');
    await menu?.refresh?.();
  });
};

void start();

// On a phone the menu is opened from a button above the page and covers it;
// choosing a row, pressing the button again or Escape closes it.
const addPhoneToggle = () => {
  if (document.querySelector('.admin-navigation-toggle')) return;
  const bar = document.createElement('div');
  bar.className = 'admin-navigation-toggle';
  const button = document.createElement('sf-button');
  button.setAttribute('appearance', 'outline');
  button.setAttribute('size', '1');
  button.setAttribute('icon-left', 'menu');
  button.setAttribute('text', document.documentElement.lang === 'en' ? 'Menu' : 'Меню');
  button.setAttribute('aria-expanded', 'false');
  button.addEventListener('click', () => {
    const open = !document.body.hasAttribute('data-menu-open');
    document.body.toggleAttribute('data-menu-open', open);
    button.setAttribute('aria-expanded', String(open));
  });
  bar.append(button);
  document.body.prepend(bar);
  // The open menu is placed under the bar (src/style.css), so the bar's height
  // is said where the stylesheet can read it. Measured rather than written
  // down: it follows the button's size and the reader's font size.
  const measure = () => {
    document.documentElement.style.setProperty(
      '--admin-navigation-toggle-block-size', `${bar.getBoundingClientRect().height}px`,
    );
  };
  if (typeof ResizeObserver === 'function') new ResizeObserver(measure).observe(bar);
  measure();
  addEventListener('sf-admin-menu-navigate', () => {
    document.body.removeAttribute('data-menu-open');
    button.setAttribute('aria-expanded', 'false');
  });
  // Escape with nothing over the menu closes it and gives the focus back to
  // the button (bus msg-513615b18308472cbb97: the menu stayed open after the
  // Escape that had closed the bell's panel). Something over the menu -- the
  // bell's panel, the person menu, the search window, a dialog -- takes the
  // Escape first and closes itself, so whether anything was open is read in
  // the capture phase on window, before any of them answers, and the menu
  // closes in the bubble phase only when nothing was open, nobody took the
  // key and it was not pressed in one of the menu's own fields (the same
  // rule as sf-admin-menu's own Escape, escapeTaken).
  let overlayOpen = false;
  const popoverOpen = () => {
    try { return Boolean(document.querySelector(':popover-open')); } catch { return false; }
  };
  const OVERLAYS = 'sf-drawer[open], sf-search[open], sf-modal[open], sf-confirm[open], sf-dropdown[open]';
  addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    overlayOpen = Boolean(document.querySelector(OVERLAYS))
      || [...document.querySelectorAll('sf-menu-context')].some((menu) => (menu as { isOpen?: boolean }).isOpen)
      || popoverOpen();
  }, true);
  addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || event.defaultPrevented || overlayOpen) return;
    if (!document.body.hasAttribute('data-menu-open')) return;
    const target = (event.composedPath?.()[0] ?? event.target) as Element | null;
    if (target?.closest?.('input, textarea, [contenteditable="true"]') && target.closest('sf-admin-menu')) return;
    document.body.removeAttribute('data-menu-open');
    button.setAttribute('aria-expanded', 'false');
    (button.querySelector('button') ?? button).focus();
  });
};
if (document.body) addPhoneToggle();
else addEventListener('DOMContentLoaded', addPhoneToggle);
