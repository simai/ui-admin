// The frame with the bar, the menu over the demo host, the page head and the
// content. On a phone width the menu goes behind the button of the top line.
AdminDemo.serve(AdminDemo.host({current: 'srv.dns'}));
const shell = document.querySelector('#shell');
shell.addEventListener('sf-admin-shell-menu-open', () => AdminDemo.log('Меню открыто'));
shell.addEventListener('sf-admin-shell-menu-close', (event) => AdminDemo.log(`Меню закрыто: ${event.detail?.reason ?? ''}`));
