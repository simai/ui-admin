// Where the pinned Framework is served from, and why the pair is in the path.
//
// The reference served its runtime from a fixed `/distr/`, with no
// Cache-Control of its own: the local site is static files behind caddy, which
// sends only etag and last-modified, and Chrome is then free to decide a copy
// is still fresh without asking. On 2026-10-09 that is exactly what happened —
// the pin was current, the files on disk were the new pair, and the page in the
// owner's browser was running a Framework from two pairs earlier. Nothing
// failed, which is the whole defect: the reference exists to show what the
// Framework does now.
//
// So the pair goes in the path. A republish changes every runtime URL, and no
// cache anywhere can answer with another pair's bytes, on any static host and
// without a server-side rule the reference cannot carry in its own repository.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PLACEHOLDER = '/distr/';

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const readLock = () =>
  JSON.parse(readFileSync(resolve(projectRoot, 'config/simai-assets.lock.json'), 'utf8'));

/**
 * What a release id may look like: a product name and twelve hex digits, with
 * an optional second pair of the same.
 *
 * It was `ui-<12>-smart-<12>` exactly, which is the shape of today's pair and
 * only of today's pair. The split gives the Framework release the id `ui-<12>`
 * (stage 1 of the Pro plan, one `ui` commit) and the paid release `pro-<12>`,
 * so the exact shape would have stopped the build dead on the day the first
 * lock v2 was published — «the lock has no usable compatibilityId», from a
 * check that was only ever meant to refuse nonsense.
 *
 * Still strict: a name, a hyphen and twelve hex digits. What it no longer does
 * is insist on which products those are.
 */
export const RELEASE_ID = /^[a-z][a-z0-9]*-[0-9a-f]{12}(?:-[a-z][a-z0-9]*-[0-9a-f]{12})?$/;

/** The release's own id, which is what makes the path unique per release. */
export const runtimeDirectory = (lock = readLock()) => {
  const id = String(lock.compatibilityId ?? '');
  if (!RELEASE_ID.test(id)) {
    throw new Error(`the lock has no usable compatibilityId: ${JSON.stringify(id)}`);
  }
  return id;
};

/** The URL prefix the pages ask for, with the trailing slash the loader joins onto. */
export const runtimeBase = (lock = readLock()) => `${PLACEHOLDER}${runtimeDirectory(lock)}/`;

/**
 * Every distribution this site serves, as {name, lock, directory, base}.
 *
 * There is one today. The Framework is splitting into a free release and a
 * paid one loaded through a second Loader path (owner, 2026-10-10), and when
 * the second arrives the only thing that should change is this list: the
 * stamping, the publish and the check all read it rather than a single lock.
 * A half-stamped site would let the paid half be served from a cache after a
 * republish, and a check that knew about one lock would certify half the
 * runtime while saying nothing about the other — which is the failure this
 * whole mechanism exists to prevent.
 */
export const distributions = () => {
  const lock = readLock();
  return [{
    name: 'framework',
    lock,
    directory: runtimeDirectory(lock),
    base: runtimeBase(lock),
  }];
};

/**
 * Rewrites the placeholder every page and stylesheet is written with.
 *
 * Idempotent on purpose: the build stamps twice -- once as Vite transforms a
 * page, once over whatever was copied verbatim out of public/ -- and a plain
 * replace stamped the already-stamped pages a second time, giving
 * `/distr/<pair>/<pair>/`. The published check caught it, which is the only
 * reason it is written down here rather than shipped.
 */
export const stamp = (text, base = runtimeBase()) => {
  const directory = base.slice(PLACEHOLDER.length, -1);
  return text.replace(
    new RegExp(`${PLACEHOLDER}(?!${directory}/)`, 'gu'),
    base,
  );
};

// Run directly, it prints what the build needs: the directory the runtime is
// materialised into, or the URL prefix the pages ask for.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(
    `${process.argv.includes('--directory') ? runtimeDirectory() : runtimeBase()}\n`,
  );
}
