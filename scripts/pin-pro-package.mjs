#!/usr/bin/env node
// Usage: node scripts/pin-pro-package.mjs [--check]
//
// The Pro package pin, and whether it agrees with the Framework pin.
//
// Pro is a second distribution, released from its own private repository on
// its own cadence, and loaded as a component package of the Loader rather than
// as part of the Framework. So it gets its own lock -- but not its own idea of
// which Framework it belongs to: a Pro release is built over exactly one free
// release and names it in `requires.framework`. If the two pins disagree, this
// site would be serving Pro components built against a Framework it is not
// running, which is the one failure a reference must never show silently. The
// check refuses, naming both.
//
// The verified set is taken from the release's own `required_files` rather than
// written here. ui-admin verified seven hand-picked files once and a whole
// release -- the Loader and 49 Smart manifests -- fell outside them, so every
// check passed over bytes the repository could not attest. The Framework says
// what matters in a release; a consumer that picks its own list is guessing.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectRoot, readLock, PRO_LOCK, FRAMEWORK_LOCK } from './runtime-base.mjs';

const lockPath = resolve(projectRoot, PRO_LOCK);
const check = process.argv.includes('--check');

const git = (root, ...args) =>
  execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();

const stableJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

const distributionIdentitySha256 = (lock) => createHash('sha256').update(stableJson({
  package: lock.package,
  requires: lock.requires,
  smart: { commit: lock.smart.commit, requiredFiles: lock.smart.requiredFiles },
})).digest('hex');

const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
const framework = readLock(FRAMEWORK_LOCK);
const root = resolve(projectRoot, lock.smart.repository);
const built = git(root, 'log', '-1', '--format=%H', '--', lock.smart.sourceDir);

if (!built) throw new Error(`no commit in ${root} has ever written ${lock.smart.sourceDir}`);

// The Pro release that built this tree. Same rule as the Framework pin: the
// release claims a distribution when one of its runtime sources built that
// `sourceDir` at that commit, so a contract that built another path cannot
// name this one.
const releaseDirectory = resolve(root, 'contracts/releases');
const releaseFor = (commit) => {
  for (const name of readdirSync(releaseDirectory)) {
    if (!name.endsWith('.lock.json')) continue;
    let release;
    try {
      release = JSON.parse(readFileSync(resolve(releaseDirectory, name), 'utf8'));
    } catch {
      continue;
    }
    if (typeof release?.compatibility_id !== 'string' || release.compatibility_id === '') continue;
    if (release.package !== lock.package) continue;
    const claims = Object.values(release.runtime_sources ?? {}).some(
      (source) => source?.runtime_path === lock.smart.sourceDir && source?.commit === commit,
    );
    if (claims) return { file: name, release };
  }
  return null;
};

const current = releaseFor(built);

if (check) {
  const problems = [];
  if (lock.smart.commit !== built) {
    problems.push(`pro: pinned ${String(lock.smart.commit).slice(0, 12)}, built ${built.slice(0, 12)}`);
  }
  if (current !== null && lock.compatibilityId !== current.release.compatibility_id) {
    problems.push(`identity: pinned ${lock.compatibilityId}, released ${current.release.compatibility_id}`);
  }
  // The cross-check, which is the reason this script exists at all.
  if (lock.requires?.framework !== framework.compatibilityId) {
    problems.push(
      `framework: Pro was built over ${lock.requires?.framework}, this site runs ${framework.compatibilityId}`,
    );
  }
  if (problems.length === 0) {
    process.stdout.write(
      `the Pro pin is the current release: ${lock.compatibilityId} over ${framework.compatibilityId}\n`,
    );
    process.exit(0);
  }
  for (const problem of problems) process.stderr.write(`${problem}\n`);
  process.stderr.write('ADMIN_PRO_PIN_BEHIND — run `npm run pin:pro` to take the current Pro release\n');
  process.exit(1);
}

if (current === null) {
  process.stderr.write(
    `ADMIN_PRO_UNRELEASED — no contract in ${releaseDirectory} claims `
    + `${lock.smart.sourceDir} at ${built.slice(0, 12)}.\n`,
  );
  process.exit(1);
}

const { release } = current;

// A Pro release names exactly one free release. Taking a Pro release that was
// built over a Framework this site does not run is refused here rather than
// written and discovered on the page.
if (release.requires?.framework !== framework.compatibilityId) {
  process.stderr.write(
    `ADMIN_PRO_FRAMEWORK_MISMATCH — ${release.compatibility_id} was built over `
    + `${release.requires?.framework}, this site runs ${framework.compatibilityId}.\n`
    + 'Take the matching Framework release first, then pin Pro.\n',
  );
  process.exit(1);
}

// What the release says matters, read out of the release. The paths are stated
// from the repository root and the distribution is served from `sourceDir`, so
// the prefix comes off: `smart/rule.js` is `rule.js` under the Pro base.
const prefix = `${lock.smart.sourceDir}/`;
const requiredFiles = [];
for (const path of release.required_files ?? []) {
  if (!path.startsWith(prefix)) {
    throw new Error(`${release.compatibility_id} requires ${path}, which is outside ${prefix}`);
  }
  const inside = path.slice(prefix.length);
  const blob = execFileSync('git', ['-C', root, 'show', `${built}:${path}`], {
    maxBuffer: 1024 * 1024 * 256,
  });
  requiredFiles.push({ path: inside, sha256: createHash('sha256').update(blob).digest('hex') });
}

if (requiredFiles.length === 0) {
  throw new Error(`${release.compatibility_id} names no required files`);
}

lock.compatibilityId = release.compatibility_id;
lock.requires = { framework: release.requires.framework };
lock.smart.commit = built;
lock.smart.requiredFiles = requiredFiles;
lock.distributionIdentitySha256 = distributionIdentitySha256(lock);

writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
process.stdout.write(
  `pinned ${lock.compatibilityId} over ${lock.requires.framework} `
  + `(${current.file}, ${requiredFiles.length} files)\n`,
);
