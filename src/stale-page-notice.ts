// Say so when the page in front of you is not the page on the server.
//
// The pair's id is in the runtime path, so a cached runtime file can never be
// the wrong pair's — its URL changes with the pair. The document has no such
// protection: `/` is `/`, and this site is static files behind a host that
// sends no Cache-Control, so a browser is free to keep its copy. On 2026-10-10
// the owner opened the site and Chrome served the previous page out of its own
// cache, transferSize 0, while a fresh fetch gave the new one.
//
// The remedy is a response header, which is not this repository's to set: the
// host's config is machine-generated and says so in its first line, and a hand
// edit there would vanish the next time it is regenerated — a fix that
// disappears silently is worse than no fix.
//
// So this does not prevent the stale load. It makes it impossible to miss and
// one press to undo, which is the same move as check:published: turn an
// invisible wrong answer into a visible one.
const asked = () => String((globalThis as { sfPath?: string }).sfPath ?? '');

const baseIn = (html: string) => {
  const found = html.match(
    /\/distr\/(?:(ui-[0-9a-f]{12}-smart-[0-9a-f]{12})\/)?(?:core|component|smart|rule|utility|fonts)\//u,
  );
  return found ? `/distr/${found[1] ? `${found[1]}/` : ''}` : '';
};

const show = (running: string, served: string) => {
  const bar = document.createElement('div');
  bar.className = 'flex items-cross-center gap-2 p-x-4 p-y-2 bg-error-container color-on-error-container';
  bar.setAttribute('role', 'alert');
  bar.style.position = 'relative';
  bar.style.zIndex = '40';

  const text = document.createElement('span');
  text.className = 'sf-text-1';
  text.textContent = `Открыта сохранённая копия страницы: в ней ${running || 'другая сборка'}, а на сервере ${served}.`;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'sf-button sf-button--size-1 sf-button--outline sf-button--on-surface';
  button.textContent = 'Обновить';
  button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = 'Обновляю…';
    // Refilling the cache for the document and everything it names is what a
    // hard reload does; a plain reload would be answered from the cache again.
    try {
      const html = await (await fetch(location.href, { cache: 'reload' })).text();
      const urls = [...html.matchAll(/(?:src|href)="(\/(?:assets|distr|data)\/[^"]+)"/gu)]
        .map(([, url]) => url);
      await Promise.all([...new Set(urls)].map((url) => fetch(url, { cache: 'reload' }).catch(() => null)));
    } catch {
      // Offline, or the host is gone: reloading is still the right next step.
    }
    location.reload();
  });

  bar.append(text, button);
  document.body.prepend(bar);
};

/** Compares what is running with what the server would send, once, after load. */
export const watchForStalePage = () => {
  const running = asked();
  if (!running) return;

  setTimeout(() => {
    void fetch(location.href, { cache: 'no-store' })
      .then((response) => (response.ok ? response.text() : null))
      .then((html) => {
        if (!html) return;
        const served = baseIn(html);
        if (served && served !== running) show(running, served);
      })
      .catch(() => null);
  }, 1500);
};
