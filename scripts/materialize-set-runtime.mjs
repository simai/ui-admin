#!/usr/bin/env node
// Usage: node scripts/materialize-set-runtime.mjs --target <directory>
//
// Lays out the pinned Admin set (scripts/set-runtime.mjs) for the Loader: the
// page declares SF_BOOT_CONFIG.packages.admin.base, the Loader fetches
// <base>/rule.js, and the set's components load from that base -- the smart/
// directory of the set's committed release output. The set's passport,
// set.json, goes beside rule.js so the published check can read which
// elements the set provides.
//
// Served only while HEAD holds the release's build tree and the working tree
// has no change under it, and only if every file the receipt requires has its
// hash: a byte that differs is refused, not served.
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { projectRoot, readLock, FRAMEWORK_LOCK } from './runtime-base.mjs';
import { readSetLock, setProblems, setWorkingTreeChanges, SET_LOCK } from './set-runtime.mjs';

const targetIndex = process.argv.indexOf('--target');
const targetArgument = targetIndex >= 0 ? process.argv[targetIndex + 1] : null;
if (!targetArgument) throw new Error('Usage: materialize-set-runtime.mjs --target <directory>');

const lock = readSetLock();
if (!lock) throw new Error(`${SET_LOCK} is absent — run \`npm run pin:set\` first.`);
const problems = setProblems(lock, readLock(FRAMEWORK_LOCK));
const changed = setWorkingTreeChanges(lock);
if (changed.length) problems.push(`${lock.build.path} differs from HEAD: ${changed.slice(0, 5).join('; ')}`);
if (problems.length) throw new Error(`${lock.compatibilityId} cannot be served:\n${problems.join('\n')}`);

const source = resolve(projectRoot, lock.build.path, 'smart');
const target = resolve(projectRoot, targetArgument);
const staging = await mkdtemp(resolve(tmpdir(), 'simai-set-runtime-'));
try {
  await cp(source, staging, { recursive: true });
  await cp(resolve(projectRoot, lock.build.path, 'set.json'), join(staging, 'set.json'));
  const files = [];
  for (const required of lock.smart.requiredFiles) {
    const bytes = await readFile(join(staging, required.path));
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    if (sha256 !== required.sha256) {
      throw new Error(`${lock.compatibilityId}: ${required.path} is ${sha256}, the release requires ${required.sha256}`);
    }
    files.push({ path: required.path, sha256, bytes: bytes.length });
  }
  const provenance = {
    schemaVersion: 1,
    kind: 'set',
    package: lock.package,
    compatibilityId: lock.compatibilityId,
    version: lock.version,
    npm: lock.npm,
    requires: lock.requires,
    build: lock.build,
    smart: { files },
  };
  await writeFile(join(staging, 'simai-package.provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`);
  await rm(target, { recursive: true, force: true });
  await mkdir(dirname(target), { recursive: true });
  await cp(staging, target, { recursive: true });
  process.stdout.write(`${JSON.stringify({ set: lock.compatibilityId, version: lock.version, files: files.length, target }, null, 2)}\n`);
} finally {
  await rm(staging, { recursive: true, force: true });
}
