// The four parts of SIMAI Admin, one per tab. The port answers come from a
// demo host kept in memory (assets/admin-demo.js); a real admin answers the
// same requests from its server.
AdminDemo.serve(AdminDemo.host({current: 'srv.overview'}));

// «Меню»: the same host, with the open server's menu in the second column.
customElements.whenDefined('sf-admin-menu').then(() => {
  const menu = document.querySelector('#object-menu');
  menu.connectPort({port: AdminDemo.host({context: true})});
  menu.addEventListener('sf-admin-menu-navigate', (event) => AdminDemo.log(`Открыто: ${event.detail.key}`));
});

// «Каркас»: the indicators of the crumbs row and of the phone top line show
// the runs printed with the page (runs='…'): the first list tells nothing.
customElements.whenDefined('sf-admin-activity').then(() => {
  // «Фоновые действия»: a short story — the copy runs to its end, the PHP
  // update fails half way.
  const activity = document.querySelector('#activity');
  let timer = null;
  const start = () => {
    clearInterval(timer);
    let value = 10;
    const [copy, update] = AdminDemo.runs('two');
    activity.runs = [{...copy, value}, update];
    timer = setInterval(() => {
      value = Math.min(100, value + 15);
      const failed = value >= 55 ? {...update, state: 'failed', text: 'Хранилище пакетов не ответило.'} : update;
      activity.runs = [{...copy, value, state: value >= 100 ? 'done' : 'running'}, failed];
      if (value >= 100) clearInterval(timer);
    }, 700);
  };
  activity.addEventListener('sf-admin-activity-finished', (event) => AdminDemo.log(`Закончилось: ${event.detail.id}, ${event.detail.state === 'done' ? 'готово' : 'не удалось'}`));
  document.querySelector('#play').addEventListener('click', start);
  document.querySelector('#reset').addEventListener('click', () => {
    clearInterval(timer);
    const [copy, update] = AdminDemo.runs('two');
    activity.runs = [{...copy, value: 10}, update];
    AdminDemo.log('');
  });
});
