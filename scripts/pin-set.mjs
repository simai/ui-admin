#!/usr/bin/env node
// Usage: node scripts/pin-set.mjs [<release id>] [--check]
//
// The pin of the Admin set the site serves (scripts/set-runtime.mjs). Without
// --check the lock is rewritten from a release lock of this repository
// (contracts/releases/<id>.lock.json; the newest admin release when no id is
// given): its id, version, Framework, build tree, and the hash of every file
// the set's receipt calls required. With --check nothing is written and a pin
// that is not served as it is -- another Framework, or a package/dist that is
// not the release's -- exits 1, naming what moved.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectRoot, readLock, FRAMEWORK_LOCK } from './runtime-base.mjs';
import { SET_LOCK, readRelease, readSetLock, setProblems } from './set-runtime.mjs';

const check = process.argv.includes('--check');
const framework = readLock(FRAMEWORK_LOCK);

if (check) {
  const lock = readSetLock();
  if (!lock) {
    process.stderr.write(`ADMIN_SET_PIN_MISSING — ${SET_LOCK} is absent; run \`npm run pin:set\`\n`);
    process.exit(1);
  }
  const problems = setProblems(lock, framework);
  if (problems.length === 0) {
    process.stdout.write(`the ${lock.package} set pin is current: ${lock.compatibilityId} (${lock.version}) over ${framework.compatibilityId}\n`);
    process.exit(0);
  }
  for (const problem of problems) process.stderr.write(`${problem}\n`);
  process.stderr.write('ADMIN_SET_PIN_BEHIND — run `npm run pin:set` to take the set release HEAD holds\n');
  process.exit(1);
}

const requested = process.argv.slice(2).find((argument) => !argument.startsWith('--'));
const releases = readdirSync(resolve(projectRoot, 'contracts/releases'))
  .filter((name) => /^admin-[0-9a-f]{12}\.lock\.json$/u.test(name))
  .map((name) => readRelease(name.replace(/\.lock\.json$/u, '')));
// The release whose build tree HEAD holds is the only one that can be served.
const release = requested
  ? readRelease(requested)
  : releases.find((one) => {
    try {
      return setProblems({
        package: one.package, compatibilityId: one.id, version: one.version,
        requires: { framework: one.requires?.framework }, build: { path: one.build.path, tree: one.build.tree },
      }, framework).length === 0;
    } catch {
      return false;
    }
  });
if (!release) {
  process.stderr.write(`ADMIN_SET_NO_RELEASE — no admin release lock in contracts/releases matches HEAD's package/dist over ${framework.compatibilityId}\n`);
  process.exit(1);
}

const receipt = JSON.parse(readFileSync(resolve(projectRoot, release.receipt.path), 'utf8'));
const requiredFiles = (receipt.required_files ?? []).map(({ path, sha256 }) => {
  if (!path.startsWith('smart/')) throw new Error(`the receipt requires ${path}, outside smart/`);
  return { path: path.slice('smart/'.length), sha256 };
});
if (requiredFiles.length === 0) throw new Error('the receipt names no required files');

const lock = {
  schemaVersion: 1,
  kind: 'set',
  package: release.package,
  compatibilityId: release.id,
  version: release.version,
  npm: `@simai-studio/${release.package}@${release.version}`,
  release: `contracts/releases/${release.id}.lock.json`,
  requires: { framework: release.requires.framework },
  build: { revision: release.build.revision, path: release.build.path, tree: release.build.tree },
  smart: { targetDir: '', requiredFiles },
};
const problems = setProblems(lock, framework);
if (problems.length) {
  for (const problem of problems) process.stderr.write(`${problem}\n`);
  process.exit(1);
}
writeFileSync(resolve(projectRoot, SET_LOCK), `${JSON.stringify(lock, null, 2)}\n`);
process.stdout.write(`pinned ${lock.compatibilityId} (${lock.npm}) over ${lock.requires.framework} (${requiredFiles.length} files)\n`);
