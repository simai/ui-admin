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
// Without --check the lock is rewritten from the heads of ui and ui-smart: the
// two commits, the hash of every file the lock requires, the pair identity the
// materialiser recomputes, and the compatibility id the pair itself carries.
// With --check nothing is written and a lock that is not the current pair
// exits 1, naming both sides.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lockPath = resolve(projectRoot, 'config/simai-assets.lock.json');
const check = process.argv.includes('--check');

const git = (root, ...args) =>
  execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();

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
const sides = ['core', 'smart'].map((side) => {
  const root = resolve(projectRoot, lock[side].repository);
  return { side, root, head: git(root, 'rev-parse', 'HEAD') };
});

const behind = sides.filter(({ side, head }) => lock[side].commit !== head);

if (check) {
  if (behind.length === 0) {
    process.stdout.write(`the pin is the current pair: ${lock.compatibilityId}\n`);
    process.exit(0);
  }
  for (const { side, head } of behind) {
    const pinned = lock[side].commit;
    const root = resolve(projectRoot, lock[side].repository);
    // How far behind, in the words a person asks it in: how many pairs, and
    // since when. «Behind» with no distance is a fact nobody acts on.
    let distance = '';
    try {
      const count = git(root, 'rev-list', '--count', `${pinned}..${head}`);
      const when = git(root, 'show', '-s', '--format=%ad', '--date=short', pinned);
      distance = ` — ${count} commit(s) behind, pinned at ${when}`;
    } catch { distance = ''; }
    process.stderr.write(`${side}: pinned ${pinned.slice(0, 12)}, head ${head.slice(0, 12)}${distance}\n`);
  }
  process.stderr.write('ADMIN_PIN_BEHIND — run `npm run pin` to take the current pair\n');
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

lock.compatibilityId = `ui-${lock.core.commit.slice(0, 12)}-smart-${lock.smart.commit.slice(0, 12)}`;
lock.pairIdentitySha256 = pairIdentitySha256(lock);
// The adaptive-sizing contract the core carries, which the lock states twice --
// once as a required file and once on its own, so a materialised runtime can be
// checked against it without reading the lock's file list.
const contract = lock.core.requiredFiles.find((file) => file.path.endsWith('adaptive-sizing.v1.json'));
if (contract) lock.contractSha256 = contract.sha256;

writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
process.stdout.write(`pinned ${lock.compatibilityId}\n`);
