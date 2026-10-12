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
  const header = document.querySelector('sf-page-header');
  const menu = document.querySelector<MenuElement & { refresh?: () => Promise<unknown> }>('sf-admin-menu');
  const starred = async () => {
    const answer = await host!.raise('navigation.load', { reason: 'requested', site: null }) as { favourites?: Array<{ key: string }> };
    return (answer.favourites ?? []).some((entry) => entry.key === PAGE_KEY);
  };
  header?.setAttribute('star', (await starred()) ? 'on' : 'off');
  header?.addEventListener('sf-page-header-star', async (event) => {
    event.preventDefault();
    const { on } = (event as CustomEvent<{ on: boolean }>).detail;
    const answer = await host!.raise('favourite.toggle', { key: PAGE_KEY, on }) as { answer: string };
    if (answer.answer === 'applied') header.setAttribute('star', on ? 'on' : 'off');
    await menu?.refresh?.();
  });
};

void start();
