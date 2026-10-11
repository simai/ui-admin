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

// Which elements each package provides, read off the published Framework this
// check is checking. Since ui-760be10c84f7 the package reference ships in the
// distribution (`core/contracts/packages/<name>.package.json`, beside the
// ports), so it is read from the same base the pages ask for -- the same
// source Larena or Docara would have, which have only the runtime. Before
// that it lived in `ui` alone and was read from the pinned commit; the
// authored copy there is gone, so a consumer still reading it would find
// nothing.
const packageElements = new Map();
const frameworkBase = served.find((found) => found.name === 'framework').base;
for (const one of served) {
  if (one.name === 'framework') continue;
  const url = `${origin}${frameworkBase}core/contracts/packages/${one.name}.package.json`;
  try {
    const reference = JSON.parse(await (await fetchText(url)).text());
    packageElements.set(
      one.name,
      (reference.provides ?? []).map((item) => item.element).filter(Boolean),
    );
  } catch (error) {
    // A package the Framework publishes no reference for is a package this
    // check cannot reason about; it says so rather than inventing a list.
    failures.push({
      distribution: one.name,
      said: `the published Framework carries no package reference for this distribution, so what it provides cannot be checked: ${error.message}`,
      url,
    });
  }
}
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
  // Pro is served from the root of its own base, so its targetDir is empty and
  // joining it with a slash would ask for `//rule.js`.
  ...(lock.smart?.requiredFiles ?? []).map((file) => ({
    distribution: name, base, side: 'smart',
    path: [lock.smart.targetDir, file.path].filter(Boolean).join('/'),
    sha256: file.sha256,
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

  // Each distribution is looked for by its own placeholder. Matching one
  // pattern over `/distr/` could not see Pro at all: its base is
  // `/distr-pro/pro-<12>/`, it is handed to the Loader rather than written into
  // a URL, and nothing follows it in the page -- so a check built around the
  // Framework's shape would have certified half the runtime while saying
  // nothing about the other half, which is the failure the stamping exists to
  // prevent.
  const asked = [];
  for (const one of served) {
    const occurrences = [...html.matchAll(new RegExp(one.placeholder, 'gu'))];
    if (occurrences.length === 0) continue;
    const stamped = occurrences.filter(
      (match) => html.startsWith(`${one.placeholder}${one.directory}/`, match.index),
    );
    if (stamped.length < occurrences.length) {
      failures.push({
        page,
        distribution: one.name,
        said: 'the page still asks for the unstamped placeholder, so a cache may answer with any release',
        found: one.placeholder,
      });
    }
    if (stamped.length > 0) asked.push(one.base);
  }

  if (!asked.length) {
    failures.push({ page, said: 'the page asks for no runtime at all' });
    continue;
  }

  // And the rule the split makes necessary: the Pro rules are gone from the
  // free core, so a page that uses a Pro element without declaring the package
  // base renders nothing. The elements are read from the free Framework's own
  // package reference rather than listed here, because the Framework is what
  // decides which elements belong to the package.
  for (const one of served) {
    if (one.name === 'framework') continue;
    const used = (packageElements.get(one.name) ?? []).filter(
      (element) => new RegExp(`<${element}[\\s/>]`, 'u').test(html),
    );
    if (used.length > 0 && !asked.includes(one.base)) {
      failures.push({
        page,
        distribution: one.name,
        said: `the page uses ${used.join(', ')} without declaring the ${one.name} package base, so those components cannot load`,
      });
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
