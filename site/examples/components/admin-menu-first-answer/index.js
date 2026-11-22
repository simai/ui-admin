// No port on this page: the menu draws the printed answer, and its page rows
// are plain links. In this example frame the links stay on the page.
addEventListener('click', (event) => {
  const link = event.composedPath().find((node) => node.tagName === 'A');
  if (link?.getAttribute('href')?.startsWith('#')) event.preventDefault();
});
