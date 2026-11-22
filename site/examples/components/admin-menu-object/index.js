// The page shows one server: the host answers navigation.load with
// `context`, the menu of that object, and the second column shows it.
AdminDemo.serve(AdminDemo.host({context: true}));
document.querySelector('#menu').addEventListener('sf-admin-menu-navigate', (event) => {
  AdminDemo.log(`Переход: ${event.detail.href}`);
});
