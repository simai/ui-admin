// The indicator in its states: the host sets `runs` anew on every change.
// notify="false": a run's end is only the event here, no toast.
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
    {id: 'r2', label: 'Обновление PHP на stage', state: 'failed', text: 'Хранилище пакетов не ответило.', href: '#/srv.software', object: 'stage.larena.cloud'},
  ],
  none: [],
};
const activity = document.querySelector('#activity');
const log = document.querySelector('[data-log]');
document.querySelector('#state').addEventListener('change', (event) => {
  activity.runs = structuredClone(RUNS[event.detail?.value ?? event.target.value]);
});
activity.addEventListener('sf-admin-activity-finished', (event) => { log.textContent = `Закончилось: ${event.detail.id}, ${event.detail.state}`; });
activity.addEventListener('sf-admin-activity-retry', (event) => { log.textContent = `Повторить: ${event.detail.id}`; });
addEventListener('click', (event) => {
  const link = event.composedPath().find((node) => node.tagName === 'A');
  if (link?.getAttribute('href')?.startsWith('#')) event.preventDefault();
});
