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
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PLACEHOLDER = '/distr/';
// A component package is served under /distr-<package>/, its own path beside
// the Framework's: `/distr-larena/` for Larena's components.
export const packagePlaceholder = (name) => `/distr-${name}/`;

export const FRAMEWORK_LOCK = 'config/simai-assets.lock.json';
export const PACKAGE_LOCK = 'config/simai-package.lock.json';

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const readLock = (file = FRAMEWORK_LOCK) =>
  JSON.parse(readFileSync(resolve(projectRoot, file), 'utf8'));

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
  const framework = readLock();
  const found = [{
    name: 'framework',
    placeholder: PLACEHOLDER,
    lock: framework,
    directory: runtimeDirectory(framework),
    base: runtimeBase(framework),
  }];

  // The component package is a second distribution with its own source, its
  // own build and its own stamped path: Larena's components, package larena,
  // since SIMAI Framework Pro was dropped. It appears here once it is pinned --
  // an unpinned lock is the state between authoring the file and taking the
  // first build, and a site with no package pin serves no package.
  const packagePath = resolve(projectRoot, PACKAGE_LOCK);
  if (existsSync(packagePath)) {
    const pinned = readLock(PACKAGE_LOCK);
    if (pinned.compatibilityId) {
      const placeholder = packagePlaceholder(pinned.package);
      found.push({
        name: pinned.package,
        placeholder,
        lock: pinned,
        directory: runtimeDirectory(pinned),
        base: `${placeholder}${runtimeDirectory(pinned)}/`,
      });
    }
  }

  // Each distribution is stamped by its own placeholder, so no placeholder may
  // be a prefix of another: stamping `/distr/` over a path already stamped to
  // `/distr/larena-<12>/` would produce `/distr/ui-<12>/larena-<12>/`, which is the
  // double-stamping defect this file already carries a comment about -- one
  // level deeper and across two distributions, where no single check would see
  // the whole of it.
  for (const one of found) {
    for (const other of found) {
      if (one !== other && one.placeholder.startsWith(other.placeholder)) {
        throw new Error(
          `the ${one.name} placeholder ${one.placeholder} starts with the `
          + `${other.name} placeholder ${other.placeholder}`,
        );
      }
    }
  }

  return found;
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
export const stamp = (text, base = runtimeBase(), placeholder = PLACEHOLDER) => {
  if (!base.startsWith(placeholder) || !base.endsWith('/')) {
    throw new Error(`${base} is not a base under ${placeholder}`);
  }
  const directory = base.slice(placeholder.length, -1);
  return text.replace(
    new RegExp(`${placeholder}(?!${directory}/)`, 'gu'),
    base,
  );
};

/**
 * Stamps every distribution's placeholder, each with its own base.
 *
 * The single-base `stamp` is kept for callers that mean one distribution, but
 * a page declares both -- the Framework it loads and the package base it
 * hands the Loader -- so whatever writes a page has to stamp all of them or
 * ship a page that asks for a path nothing serves.
 */
export const stampAll = (text, found = distributions()) =>
  found.reduce((carried, one) => stamp(carried, one.base, one.placeholder), text);

/** True when the text still holds a placeholder nothing has stamped. */
export const unstamped = (text, found = distributions()) =>
  found.filter((one) => new RegExp(`${one.placeholder}(?!${one.directory}/)`, 'u').test(text));

// Run directly, it prints what the build needs: the directory a runtime is
// materialised into, or the URL prefix the pages ask for. `--name <name>`
// chooses the distribution; the Framework is the default, because the build
// chain asked for it before there was a second one.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const nameIndex = process.argv.indexOf('--name');
  const name = nameIndex >= 0 ? process.argv[nameIndex + 1] : 'framework';
  const one = distributions().find((found) => found.name === name);
  if (!one) {
    process.stderr.write(`no distribution named ${JSON.stringify(name)}\n`);
    process.exit(1);
  }
  process.stdout.write(
    `${process.argv.includes('--directory') ? one.directory : one.base}\n`,
  );
}
