#!/usr/bin/env node
// Usage: node scripts/check-published-runtime.mjs [origin]
//
// What the browser actually runs, not what is on disk.
//
// On 2026-10-09 the pin was the current pair, the files under the published
// site were that pair's bytes, every check in this repository was green — and
// the page in the owner's Chrome was running a Framework from two pairs
// earlier, because the static host sends no Cache-Control and the browser was
// free to keep its copy. The reference's whole claim is that it shows what the
// Framework does now, and nothing here could tell that it did not.
//
// So this asks over HTTP, the way a browser does: it reads each page's own
// runtime base out of the served HTML, fetches the files the lock requires from
// that base, and hashes them. A base that is not pair-stamped, a file that is
// not the pinned pair's, or a page still asking for the bare placeholder is a
// failure.
import { createHash } from 'node:crypto';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { PLACEHOLDER, distributions, projectRoot } from './runtime-base.mjs';

const origin = (process.argv[2] ?? process.env.ADMIN_ORIGIN ?? 'https://ui-admin.test')
  .replace(/\/+$/, '');
// Every distribution the site serves, not one. There is a single one today;
// the paid release arrives behind a second Loader path, and a check that knew
// about one lock would certify half the runtime and say nothing about the
// other half.
const served = distributions();
const bases = new Set(served.map((one) => one.base));

// Every page the site publishes: the ones Vite builds from the repository root
// and the ones copied straight out of public/, which are exactly the ones that
// were missed when the stamping was first added.
const htmlIn = (directory) => {
  try {
    return readdirSync(directory).filter((name) => name.endsWith('.html'));
  } catch {
    return [];
  }
};
const pages = [...new Set([
  ...htmlIn(projectRoot),
  ...htmlIn(resolve(projectRoot, 'public')),
])].sort();

if (!pages.length) throw new Error('no pages to check');

// The local site is served over a certificate signed by the developer's own
// authority, which this runner has no reason to hold. `agent` is an https
// option and global fetch does not read it, so asking that way reported every
// file as missing rather than as mismatched. Verification is switched off for
// this process only, and only for a local origin: a public one still has to
// present a certificate that checks out.
const host = new URL(origin).hostname;
const local = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.test')
  || host.endsWith('.localhost');
if (origin.startsWith('https://')) {
  if (!local) {
    // Nothing to relax, and nothing to hide: a public origin is checked as one.
  } else {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
}
const fetchText = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response;
};

const failures = [];
const skipped = [];
// What the host says about keeping a copy. The pair in the runtime path means a
// cached runtime file can never be the wrong pair's -- its URL changes with the
// pair. The page itself has no such protection: `/` is `/`, and a response with
// no Cache-Control lets a browser decide for itself. Measured on 2026-10-10,
// after the index became the polygon: the owner opened the site and Chrome
// served the previous page out of its cache, transferSize 0.
//
// This is reported rather than failed, because it is not something this
// repository can fix: the remedy is a response header on the host that serves
// ~/Sites, which is an Ops change with its own gate. Reported so it is a named
// fact with a named remedy instead of a surprise.
const cachePolicy = [];
const required = served.flatMap(({ name, lock, base }) => [
  ...(lock.core?.requiredFiles ?? []).map((file) => ({
    distribution: name, base, side: 'core', path: file.path, sha256: file.sha256,
  })),
  ...(lock.smart?.requiredFiles ?? []).map((file) => ({
    distribution: name, base, side: 'smart',
    path: `${lock.smart.targetDir}/${file.path}`, sha256: file.sha256,
  })),
]);

for (const page of pages) {
  const url = `${origin}/${page}`;
  let html;
  try {
    const response = await fetchText(url);
    const control = response.headers.get('cache-control');
    if (!control || !/no-store|no-cache|max-age=0/u.test(control)) {
      cachePolicy.push({ page, cache_control: control ?? null, said: 'the page may be served from a browser cache after a republish' });
    }
    html = await response.text();
  } catch (error) {
    failures.push({ page, said: `the page could not be read: ${error.message}` });
    continue;
  }

  // A runtime URL is the prefix plus, when the page has been stamped, the
  // pair's own directory, and then one of the runtime's top-level folders.
  // Written as one group ending in a slash it demanded two, which is why the
  // first version of this check said every page asked for no runtime at all.
  // public/ also holds markup samples -- a bare <tr> block, for instance --
  // which a browser never loads as a document and which therefore ask for no
  // runtime quite correctly.
  if (!/<html[\s>]|<!doctype/iu.test(html)) {
    skipped.push({ page, why: 'a markup fragment, not a page' });
    continue;
  }

  // The same family of ids the stamping writes, rather than today's pair shape:
  // a page stamped with `ui-<12>` or `pro-<12>` would otherwise read as asking
  // for no runtime at all, which is the loudest possible wrong answer.
  const asked = [...new Set([...html.matchAll(
    /\/distr\/(?:([a-z][a-z0-9]*-[0-9a-f]{12}(?:-[a-z][a-z0-9]*-[0-9a-f]{12})?)\/)?(?:core|component|smart|rule|utility|fonts)\//gu,
  )].map(([, id]) => (id ? `${PLACEHOLDER}${id}/` : PLACEHOLDER)))];

  if (!asked.length) {
    failures.push({ page, said: 'the page asks for no runtime at all' });
    continue;
  }
  // A page may ask for more than one base once the paid release is served
  // beside the free one; what it may not do is ask for one nobody pinned.
  for (const base of asked) {
    if (base === PLACEHOLDER) {
      failures.push({ page, said: 'the page still asks for the unstamped placeholder, so a cache may answer with any pair' });
    } else if (!bases.has(base)) {
      failures.push({ page, said: 'the page asks for a base that is not a pinned distribution', found: base, pinned: [...bases] });
    }
  }
}

// The bytes themselves, fetched from the base the pages ask for.
const measured = [];
for (const file of required) {
  const url = `${origin}${file.base}${file.path}`;
  try {
    const bytes = Buffer.from(await (await fetchText(url)).arrayBuffer());
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    measured.push({ path: file.path, bytes: bytes.length, matches: sha256 === file.sha256 });
    if (sha256 !== file.sha256) {
      failures.push({ file: file.path, said: 'the served bytes are not the pinned pair', expected: file.sha256.slice(0, 12), found: sha256.slice(0, 12) });
    }
  } catch (error) {
    failures.push({ file: file.path, said: `the pinned runtime is not served there: ${error.message}` });
  }
}

process.stdout.write(`${JSON.stringify({
  check: 'published-runtime',
  origin,
  distributions: served.map(({ name, base, lock }) => ({ name, base, pair: lock.compatibilityId })),
  pages: pages.filter((page) => !skipped.some((item) => item.page === page)),
  skipped,
  // Not a failure, and not silence either: the pages whose own bytes a browser
  // may keep across a republish, and what would stop it.
  cache_policy: cachePolicy.length
    ? { pages: cachePolicy, remedy: 'serve *.html with Cache-Control: no-store on the host that serves this site' }
    : 'every page asks not to be kept',
  files: measured,
  result: failures.length ? 'PUBLISHED_RUNTIME_FAIL' : 'PUBLISHED_RUNTIME_OK',
  failures,
}, null, 2)}\n`);

if (failures.length) process.exit(1);
