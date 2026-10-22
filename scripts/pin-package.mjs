#!/usr/bin/env node
// Usage: node scripts/pin-package.mjs [--check]
//
// The pin of the component package this site serves beside the Framework, and
// whether it agrees with the Framework pin.
//
// The package is `larena`: the admin components, whose source is the
// `components/` folder of this repository (standard simai.component-package;
// owner, 2026-10-11; moved here from simai/larena-ui, owner, 2026-10-22). There is no
// repository of built bytes to pin, so the pin is the source revision -- the
// commit that last wrote the folder -- and the receipt of building it: the free
// release it was built over, the archive's hash and the hash of every file the
// receipt calls required. The verified set is the receipt's, never a list
// written here: a list picked by hand once let a whole release through
// unverified.
//
// A package is built over exactly one free release and the receipt names it. If
// that is not the release this site runs, the site would serve components built
// against another Framework: the pin refuses, naming both.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectRoot, readLock, PACKAGE_LOCK, FRAMEWORK_LOCK } from './runtime-base.mjs';
import { ensureBuild, packageRevision, roots } from './package-build.mjs';
import { distributionIdentitySha256 } from './pin-package-identity.mjs';

const lockPath = resolve(projectRoot, PACKAGE_LOCK);
const check = process.argv.includes('--check');

const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
const framework = readLock(FRAMEWORK_LOCK);
const folder = lock.source.path;
const current = packageRevision(roots().package, folder);

if (check) {
  const problems = [];
  if (lock.source.revision !== current) {
    problems.push(`${lock.package}: pinned ${String(lock.source.revision).slice(0, 12)}, ${folder}/ last written at ${current.slice(0, 12)}`);
  }
  // The cross-check, which is the reason this script exists at all.
  if (lock.requires?.framework !== framework.compatibilityId) {
    problems.push(`framework: ${lock.package} was built over ${lock.requires?.framework}, this site runs ${framework.compatibilityId}`);
  }
  if (problems.length === 0) {
    process.stdout.write(`the ${lock.package} pin is current: ${lock.compatibilityId} over ${framework.compatibilityId}\n`);
    process.exit(0);
  }
  for (const problem of problems) process.stderr.write(`${problem}\n`);
  process.stderr.write('ADMIN_PACKAGE_PIN_BEHIND — run `npm run pin:package` to take the current package\n');
  process.exit(1);
}

const { receipt } = ensureBuild({ name: lock.package, folder, revision: current });

if (receipt.framework?.release !== framework.compatibilityId) {
  process.stderr.write(
    `ADMIN_PACKAGE_FRAMEWORK_MISMATCH — ${lock.package} at ${current.slice(0, 12)} pins ui-source `
    + `${String(receipt.framework?.source?.revision).slice(0, 12)} (${receipt.framework?.release}); this site runs `
    + `${framework.compatibilityId}. Move one of them so they agree.\n`,
  );
  process.exit(1);
}

// The receipt states its paths from the output root; the package base is its
// smart/ directory, so the prefix comes off: `smart/rule.js` is `rule.js`.
const requiredFiles = (receipt.required_files ?? []).map(({ path, sha256 }) => {
  if (!path.startsWith('smart/')) throw new Error(`the receipt requires ${path}, outside smart/`);
  return { path: path.slice('smart/'.length), sha256 };
});
if (requiredFiles.length === 0) throw new Error('the receipt names no required files');

lock.compatibilityId = `${lock.package}-${current.slice(0, 12)}`;
lock.requires = { framework: receipt.framework.release };
lock.source = {
  repository: receipt.package_source.repository,
  revision: current,
  path: folder,
  tree: receipt.package_source.tree,
};
// The ui-builder commit that wrote the pinned archive. The archive digest is
// what proves the bytes; this names the builder a clean checkout (the server
// deploy workflow) rebuilds them with. Outside the distribution identity: a
// later builder that writes the same archive is not a new package.
if (!receipt.builder?.clean) throw new Error('the package was built by a ui-builder checkout with local changes');
lock.builder = { repository: receipt.builder.repository, revision: receipt.builder.revision };
lock.archiveSha256 = receipt.output.archive_sha256;
lock.smart = { ...lock.smart, requiredFiles };
lock.distributionIdentitySha256 = distributionIdentitySha256(lock);

writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
process.stdout.write(
  `pinned ${lock.compatibilityId} over ${lock.requires.framework} (${requiredFiles.length} files, `
  + `reference ${receipt.package_reference?.status ?? 'unknown'})\n`,
);
