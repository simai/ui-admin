// The site-pages page of the polygon: sf-data-view over the tree host, the
// reference for a list that is a tree (data view port 1.8.0).
import './style.css';
import './navigation';
// @ts-expect-error -- plain JavaScript, shared with scripts/check-polygon.mjs.
import { createTreeHost } from './ports/tree-host.mjs';

type HostPort = { version: string; capabilities: string[]; raise: (intent: string, payload?: unknown) => Promise<unknown> };
type DataViewElement = HTMLElement & { setHostPort?: (host: HostPort) => void };

const scenario = new URL(location.href).searchParams.get('scenario') || 'default';
const host = createTreeHost({ scenario }) as HostPort;

const start = async () => {
  await customElements.whenDefined('sf-data-view');
  const view = document.querySelector<DataViewElement>('#pages');
  view?.setHostPort?.(host);
  // What the host was asked, for a person looking at the polygon: the view
  // announces every answer it gets.
  view?.addEventListener('sf-data-view-answer', (event) => {
    const detail = (event as CustomEvent).detail as { intent?: string; answer?: string };
    if (detail?.intent === 'view.create_record') {
      console.info('[polygon] create', detail);
    }
  });
};

start();
