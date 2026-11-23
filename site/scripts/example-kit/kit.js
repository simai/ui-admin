// The demo side of the site's live examples, as window.AdminDemo. A real page
// answers the same requests from its own server; here a host kept in memory
// answers them (createNavigationHost above, the repository's own demo host).
//
//   AdminDemo.host({current, context, capabilities})  a port object: {port, version, capabilities, raise}
//   AdminDemo.serve(host)    hands the port to every set component that asks for it
//   AdminDemo.notices()      the demo notifications as items (for a list without a port)
//   AdminDemo.runs(kind)     background runs: 'two', 'failed', 'done-failed', 'none'
//   AdminDemo.log(text)      writes a line into the example's [data-log] element
// copy() comes from the host above.

const log = (text) => {
  const line = document.querySelector('[data-log]');
  if (line) line.textContent = text;
};

// Every link of the demo data is a fragment («#/srv.dns»). In an example
// frame a fragment resolves against the frame's base address and would load
// another page into the frame, so a click on one stays here and is told in
// the example's log line instead. A component that handles a click itself
// has already done so: this runs last, on the window.
addEventListener('click', (event) => {
  const link = event.composedPath().find((node) => node instanceof Element && node.tagName === 'A');
  const href = link?.getAttribute('href') ?? '';
  if (!href.startsWith('#')) return;
  event.preventDefault();
  if (href.length > 1) log(`Переход: ${href.slice(1)}`);
});

// The menu of the object a page shows (port 1.1.0, field `context`): the
// server panel's page of one server.
const SERVER_CONTEXT = {
  title: 'srv1.larena.cloud',
  subtitle: 'Москва · Ubuntu 24.04',
  status: {text: 'Работает', status: 'success'},
  back: {label: 'Все серверы', href: '#/servers'},
  groups: [
    {label: null, items: [
      {key: 'srv1.overview', label: 'Обзор', href: '#/srv1/overview', icon: 'monitoring'},
      {key: 'srv1.sites', label: 'Сайты', href: '#/srv1/sites', icon: 'language'},
      {key: 'srv1.backups', label: 'Резервные копии', href: '#/srv1/backups', icon: 'backup', badge: {text: '1', status: 'error'}},
    ]},
    {label: 'Дополнительно', items: [
      {key: 'srv1.php', label: 'PHP и веб-сервер', href: '#/srv1/php', icon: 'code'},
      {key: 'srv1.firewall', label: 'Файрвол', href: '#/srv1/firewall', icon: 'local_fire_department'},
    ]},
  ],
  current: 'srv1.overview',
};

const host = ({current = null, context = false, capabilities} = {}) => {
  const inner = createNavigationHost({data: copy(DATA), current, ...(capabilities ? {capabilities} : {})});
  return {
    port: inner.port,
    version: '1.1.0',
    capabilities: inner.capabilities,
    async raise(intent, payload = {}) {
      const answer = await inner.raise(intent, payload);
      if (intent === 'navigation.load' && context && answer.answer === 'applied') {
        return {...answer, context: copy(SERVER_CONTEXT)};
      }
      return answer;
    },
  };
};

const OWNERS = new Set(['admin-menu', 'admin-notifications']);
const serve = (port) => {
  addEventListener('sf-host-port-request', (event) => {
    const detail = event.detail;
    if (!detail?.component || !OWNERS.has(detail.context?.owner)) return;
    (detail.component.connectPort ?? detail.component.setHostPort)?.call(detail.component, {port});
  });
  const hand = (selector, tag) => customElements.whenDefined(tag).then(() => {
    for (const element of document.querySelectorAll(selector)) element.connectPort?.({port});
  });
  hand('sf-admin-menu', 'sf-admin-menu');
  hand('sf-admin-notifications', 'sf-admin-notifications');
  return port;
};

const notices = () => DATA.notifications.map(({group, ...item}) => ({
  ...item,
  group,
  'group-label': DATA.notification_groups.find((one) => one.key === group)?.label ?? group,
}));

const RUNS = {
  two: [
    {id: 'r1', label: 'Копия srv1.larena.cloud', state: 'running', value: 42, total: 100, unit: '%', href: '#/srv.backups'},
    {id: 'r2', label: 'Обновление PHP на stage', state: 'running', href: '#/srv.software', object: 'stage.larena.cloud'},
  ],
  failed: [
    {id: 'r1', label: 'Копия srv1.larena.cloud', state: 'running', value: 42, total: 100, unit: '%', href: '#/srv.backups'},
    {id: 'r2', label: 'Обновление PHP на stage', state: 'failed', text: 'Хранилище пакетов не ответило.', href: '#/srv.software', object: 'stage.larena.cloud'},
  ],
  'done-failed': [
    {id: 'r1', label: 'Копия srv1.larena.cloud', state: 'done', value: 100, total: 100, unit: '%', href: '#/srv.backups'},
    {id: 'r2', label: 'Обновление PHP на stage', state: 'failed', text: 'Хранилище пакетов не ответило.', href: '#/srv.software', object: 'stage.larena.cloud'},
  ],
  none: [],
};
const runs = (kind = 'two') => copy(RUNS[kind] ?? RUNS.two);

window.AdminDemo = {host, serve, notices, runs, log, data: () => copy(DATA)};
