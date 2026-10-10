#!/usr/bin/env node
// Usage: node scripts/pin-framework-pair.mjs [--check]
//
// The pin, and whether it is behind.
//
// This repository is meant to be the place where the current Framework is seen
// working. It was pinned to a pair bound on 2026-09-13 and nothing in it failed
// for a month -- not the build, not a test, not a check. A reference that
// cannot tell it is stale is a showcase whatever it was meant to be, so the
// gap is a failure here rather than something somebody notices (owner,
// 2026-10-09).
//
// Two things the pin must get right, both learned the hard way:
//
// It pins the commit that produced the distribution, not the head of the
// repository. A release lands as a build commit that rewrites `distr` (and
// `smart`), and then one or more bookkeeping commits that bind a registry or
// bind Smart metadata and touch no runtime byte. Taking the head named a pair
// out of two bookkeeping commits -- `ui-8bb48ccad028-smart-faedb21b6ec9` for
// the runtime of `ui-3ded7b7c1850-smart-03ea2a1a0be1` -- so the admin ran a
// release nobody could look up, and `--check` went red for commits that
// changed nothing here.
//
// And it takes the identity from the release rather than building the string
// itself. The Framework issues the compatibility id; a consumer that
// recomputes it from two commits is guessing a name that is about to change
// shape (the Pro split issues `ui-<12>`, one revision for both sides). So the
// release contract in ui is the authority, and if no release claims these two
// commits the pin fails rather than inventing a name.
//
// Without --check the lock is rewritten from the distribution commits of ui
// and ui-smart: the two commits, the hash of every file the lock requires, the
// pair identity the materialiser recomputes, and the compatibility id the
// release carries. With --check nothing is written and a lock that is not the
// current release exits 1, naming what moved.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lockPath = resolve(projectRoot, 'config/simai-assets.lock.json');
const check = process.argv.includes('--check');

const git = (root, ...args) =>
  execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();

// The same, for a lookup whose failure is already handled: a history git
// cannot walk should cost the report its distance, not print `fatal:` into
// the middle of it.
const gitQuiet = (root, ...args) => execFileSync('git', ['-C', root, ...args], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore'],
}).trim();

// The same stable serialisation the materialiser uses, because the identity it
// recomputes has to be the identity written here.
const stableJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

const pairIdentitySha256 = (lock) => createHash('sha256').update(stableJson({
  core: { commit: lock.core.commit, requiredFiles: lock.core.requiredFiles },
  smart: { commit: lock.smart.commit, requiredFiles: lock.smart.requiredFiles },
})).digest('hex');

const lock = JSON.parse(readFileSync(lockPath, 'utf8'));

// The commit that last wrote the directory this side is taken from. A
// bookkeeping commit on top of it is not a new distribution.
const distributionCommit = (root, sourceDir) => {
  const commit = git(root, 'log', '-1', '--format=%H', '--', sourceDir);
  if (!commit) throw new Error(`no commit in ${root} has ever written ${sourceDir}`);
  return commit;
};

// The release that claims both commits. Keyed by neither repository name nor
// side, because the split moves smart into ui and the contract's own source
// names go with it: a release claims these commits if its runtime sources
// carry them, however many entries that takes.
const releaseDirectory = resolve(projectRoot, lock.core.repository, 'contracts/releases');
const releaseFor = (coreCommit, smartCommit) => {
  for (const name of readdirSync(releaseDirectory)) {
    if (!name.endsWith('.lock.json')) continue;
    let release;
    try {
      release = JSON.parse(readFileSync(resolve(releaseDirectory, name), 'utf8'));
    } catch {
      continue;
    }
    const id = release?.compatibility_id;
    if (typeof id !== 'string' || id === '') continue;
    const commits = Object.values(release.runtime_sources ?? {})
      .map((source) => source?.commit)
      .filter((commit) => typeof commit === 'string');
    if (commits.includes(coreCommit) && commits.includes(smartCommit)) return { file: name, id };
  }
  return null;
};

const sides = ['core', 'smart'].map((side) => {
  const root = resolve(projectRoot, lock[side].repository);
  return { side, root, head: distributionCommit(root, lock[side].sourceDir) };
});

const current = releaseFor(
  sides.find(({ side }) => side === 'core').head,
  sides.find(({ side }) => side === 'smart').head,
);
const behind = sides.filter(({ side, head }) => lock[side].commit !== head);

if (check) {
  const renamed = current !== null && lock.compatibilityId !== current.id;
  if (behind.length === 0 && !renamed) {
    process.stdout.write(`the pin is the current release: ${lock.compatibilityId}\n`);
    process.exit(0);
  }
  // After the split both sides read one repository at one revision, where a
  // side-by-side report is the same sentence twice. Sides that resolve to the
  // same checkout and the same move are named together.
  const moves = new Map();
  for (const { side, head } of behind) {
    const root = resolve(projectRoot, lock[side].repository);
    const key = `${root}\u0000${lock[side].commit}\u0000${head}`;
    if (!moves.has(key)) {
      moves.set(key, { sides: [], paths: [], root, pinned: lock[side].commit, head });
    }
    moves.get(key).sides.push(side);
    moves.get(key).paths.push(lock[side].sourceDir);
  }
  for (const { sides: named, paths, root, pinned, head } of moves.values()) {
    const side = named.join(' and ');
    // How far behind, in the words a person asks it in: how many
    // distributions, and since when. «Behind» with no distance is a fact
    // nobody acts on. The try covers the git calls only -- an unreadable
    // history is a fact to report without, a mistake in here is not.
    let distance = '';
    try {
      const count = gitQuiet(root, 'rev-list', '--count', `${pinned}..${head}`, '--', ...paths);
      const when = gitQuiet(root, 'show', '-s', '--format=%ad', '--date=short', pinned);
      // Zero means the pinned commit is not behind but beside: it wrote no
      // distribution at all, which is what taking the head used to do.
      distance = count === '0'
        ? ` — pinned at ${when}, on a commit that built no distribution`
        : ` — ${count} distribution(s) behind, pinned at ${when}`;
    } catch { distance = ''; }
    process.stderr.write(`${side}: pinned ${pinned.slice(0, 12)}, built ${head.slice(0, 12)}${distance}\n`);
  }
  if (renamed) {
    process.stderr.write(`identity: pinned ${lock.compatibilityId}, released ${current.id}\n`);
  }
  process.stderr.write('ADMIN_PIN_BEHIND — run `npm run pin` to take the current release\n');
  process.exit(1);
}

if (current === null) {
  const named = sides.map(({ side, head }) => `${side} ${head.slice(0, 12)}`).join(', ');
  process.stderr.write(
    `ADMIN_PIN_UNRELEASED — no contract in ${releaseDirectory} claims ${named}.\n`
    + 'A pair is pinned by the identity the Framework issued for it, so finish the\n'
    + 'release route (the registry binding writes the contract) and pin again.\n',
  );
  process.exit(1);
}

// Rewriting: the commits, then every required file's hash read out of that
// commit rather than off the working tree, which may be mid-change.
for (const { side, root, head } of sides) {
  lock[side].commit = head;
  for (const required of lock[side].requiredFiles) {
    const blob = execFileSync(
      'git',
      ['-C', root, 'show', `${head}:${lock[side].sourceDir}/${required.path}`],
      { maxBuffer: 1024 * 1024 * 256 },
    );
    required.sha256 = createHash('sha256').update(blob).digest('hex');
  }
}

lock.compatibilityId = current.id;
lock.pairIdentitySha256 = pairIdentitySha256(lock);
// The adaptive-sizing contract the core carries, which the lock states twice --
// once as a required file and once on its own, so a materialised runtime can be
// checked against it without reading the lock's file list.
const contract = lock.core.requiredFiles.find((file) => file.path.endsWith('adaptive-sizing.v1.json'));
if (contract) lock.contractSha256 = contract.sha256;

writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
process.stdout.write(`pinned ${lock.compatibilityId} (${current.file})\n`);
