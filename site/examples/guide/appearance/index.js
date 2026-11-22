// Public CSS variables of the menu, set on an ancestor: here a class on the
// box switches the rail's fill and the column's fill to other theme roles.
AdminDemo.serve(AdminDemo.host({current: 'srv.dns'}));
document.querySelector('#look').addEventListener('change', (event) => {
  document.querySelector('#box').classList.toggle('page-quiet', event.detail.value === 'quiet');
});
