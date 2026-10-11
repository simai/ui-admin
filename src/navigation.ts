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
  host = createNavigationHost({ data }) as NavigationHost;
  for (const menu of waiting) give(menu);
  waiting.clear();
  await customElements.whenDefined('sf-admin-menu');
  for (const menu of document.querySelectorAll<MenuElement>('sf-admin-menu')) {
    if (!menu._navigation) give(menu);
  }
};

void start();
