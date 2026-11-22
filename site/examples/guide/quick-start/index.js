// The quick start: a frame, a menu and a port that answers the menu.
// A real page asks its server; here the answers are written in place.
const MENU = {
  answer: 'applied',
  revision: '1',
  current: 'orders',
  items: [
    {key: 'home', kind: 'page', level: 'site', label: 'Главная', icon: 'home', href: '#/'},
    {key: 'shop', kind: 'root', level: 'site', label: 'Магазин', icon: 'storefront', children: [
      {key: 'orders', kind: 'page', level: 'site', label: 'Заказы', icon: 'receipt_long', href: '#/orders'},
      {key: 'goods', kind: 'page', level: 'site', label: 'Товары', icon: 'inventory_2', href: '#/goods'},
      {key: 'clients', kind: 'page', level: 'site', label: 'Покупатели', icon: 'group', href: '#/clients'},
    ]},
    {key: 'settings', kind: 'page', level: 'site', label: 'Настройки', icon: 'settings', href: '#/settings'},
  ],
  person: {name: 'Анна Белова', language: 'ru', languages: [{code: 'ru', native: 'Русский', english: 'Russian'}]},
};

const port = {
  port: 'simai.admin-navigation-port',
  version: '1.1.0',
  capabilities: [],
  async raise(intent, payload) {
    if (intent === 'navigation.load') return structuredClone(MENU);
    if (intent === 'item.open') return {answer: 'applied'};
    return {answer: 'refused', reason: `Хост не отвечает на «${intent}».`};
  },
};

customElements.whenDefined('sf-admin-menu').then(() => {
  const menu = document.querySelector('sf-admin-menu');
  menu.connectPort({port});
  menu.addEventListener('sf-admin-menu-navigate', (event) => {
    document.querySelector('[data-log]').textContent = `Открыта страница «${event.detail.key}»`;
  });
});

// The menu's links are fragments; in this example frame they stay on the page.
addEventListener('click', (event) => {
  const link = event.composedPath().find((node) => node.tagName === 'A');
  if (link?.getAttribute('href')?.startsWith('#')) event.preventDefault();
});
