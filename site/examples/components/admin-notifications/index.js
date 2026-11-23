// A list without a port: the page gives the notifications in `items`.
// Opening one and «Прочитать все» are the page's to keep.
const list = document.querySelector('#list');
const log = document.querySelector('[data-log]');
list.addEventListener('click', (event) => {
  const link = event.composedPath().find((node) => node.tagName === 'A');
  if (link?.getAttribute('href')?.startsWith('#')) event.preventDefault();
});
list.addEventListener('sf-admin-notifications-open', (event) => { log.textContent = `Открыто: ${event.detail.key}`; });
list.addEventListener('sf-admin-notifications-read-all', () => { log.textContent = 'Все прочитаны'; });
