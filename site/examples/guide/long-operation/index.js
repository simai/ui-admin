// A long operation in the background. The page keeps the list of runs and
// sets it anew on every change; the indicator tells the end itself: a toast,
// and for a failure a notification in the list of the page.
const activity = document.querySelector('#activity');
let runs = [];
const put = (run) => {
  runs = [...runs.filter((one) => one.id !== run.id), run];
  activity.runs = runs;
};

document.querySelector('#backup').addEventListener('click', () => {
  const id = `copy-${Date.now()}`;
  let value = 0;
  put({id, label: 'Копия srv1.larena.cloud', state: 'running', value, total: 100, unit: '%', href: '#/srv.backups'});
  const timer = setInterval(() => {
    value += 20;
    put({id, label: 'Копия srv1.larena.cloud', state: value >= 100 ? 'done' : 'running', value: Math.min(value, 100), total: 100, unit: '%', href: '#/srv.backups'});
    if (value >= 100) clearInterval(timer);
  }, 600);
});

document.querySelector('#update').addEventListener('click', () => {
  const id = `php-${Date.now()}`;
  put({id, label: 'Обновление PHP на stage', state: 'running', href: '#/srv.software', object: 'stage.larena.cloud'});
  setTimeout(() => put({id, label: 'Обновление PHP на stage', state: 'failed', text: 'Хранилище пакетов не ответило.', href: '#/srv.software', object: 'stage.larena.cloud'}), 2000);
});

// «Повторить» on a failed run: the page starts it again.
activity.addEventListener('sf-admin-activity-retry', (event) => {
  const run = runs.find((one) => one.id === event.detail.id);
  if (run) put({...run, state: 'running', text: undefined});
});

addEventListener('click', (event) => {
  const link = event.composedPath().find((node) => node.tagName === 'A');
  if (link?.getAttribute('href')?.startsWith('#')) event.preventDefault();
});
