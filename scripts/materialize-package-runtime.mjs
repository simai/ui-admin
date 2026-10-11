#!/usr/bin/env node
// Usage: node scripts/materialize-package-runtime.mjs --target <directory>
//
// Materialises the pinned Pro package and proves it is the release the lock
// names -- including that it is the release built over the Framework this site
// runs.
//
// Pro reaches the page as a component package of the Loader rather than as part
// of the Framework: the page declares `SF_BOOT_CONFIG.packages.pro.base`, the
// Loader fetches `<base>/rule.js` before its first scan, and the four Pro
// components load from that base. So the package is served from the root of its
// own stamped path and the distribution is ui-pro's `smart/` tree, which is why
// `targetDir` is empty here where the Framework's is `smart`.
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import {
  assertExactCommit,
  extract,
  loadLocalEnv,
  stableJson,
  verifyRequiredFiles,
} from './runtime-extract.mjs';
import { projectRoot, readLock, FRAMEWORK_LOCK, PRO_LOCK } from './runtime-base.mjs';

await loadLocalEnv(projectRoot);

const targetIndex = process.argv.indexOf('--target');
const targetArgument = targetIndex >= 0 ? process.argv[targetIndex + 1] : null;

if (!targetArgument) {
  throw new Error('Usage: materialize-package-runtime.mjs --target <directory>');
}

const lock = readLock(PRO_LOCK);
const framework = readLock(FRAMEWORK_LOCK);

if (!lock.compatibilityId) {
  throw new Error(`${PRO_LOCK} is not pinned — run \`npm run pin:pro\` first.`);
}

// The cross-check, repeated here rather than trusted from the pin. The pin runs
// when someone takes a release; this runs on every build, and a lock edited by
// hand or a Framework taken without its Pro would otherwise reach the site.
if (lock.requires?.framework !== framework.compatibilityId) {
  throw new Error(
    `Pro ${lock.compatibilityId} was built over ${lock.requires?.framework}, `
    + `this site runs ${framework.compatibilityId}.`,
  );
}

const target = resolve(projectRoot, targetArgument);
const repository = resolve(
  projectRoot,
  process.env.SIMAI_UI_PRO_REPO || lock.smart.repository,
);

function distributionIdentitySha256(pro) {
  return createHash('sha256').update(stableJson({
    package: pro.package,
    requires: pro.requires,
    smart: { commit: pro.smart.commit, requiredFiles: pro.smart.requiredFiles },
  })).digest('hex');
}

assertExactCommit(repository, lock.smart.commit, 'Pro');

const expected = distributionIdentitySha256(lock);
if (lock.distributionIdentitySha256 !== expected) {
  throw new Error(
    `Pro distribution identity ${lock.distributionIdentitySha256} does not match ${expected}.`,
  );
}

const staging = await mkdtemp(resolve(tmpdir(), 'simai-pro-runtime-'));
try {
  await extract(
    repository,
    lock.smart.commit,
    lock.smart.sourceDir,
    resolve(staging, lock.smart.targetDir),
  );

  const files = await verifyRequiredFiles(
    resolve(staging, lock.smart.targetDir),
    lock.smart.requiredFiles,
    'Pro',
  );

  const provenance = {
    schemaVersion: 1,
    package: lock.package,
    compatibilityId: lock.compatibilityId,
    distributionIdentitySha256: lock.distributionIdentitySha256,
    requires: lock.requires,
    smart: { commit: lock.smart.commit, files },
  };
  await writeFile(
    resolve(staging, 'simai-package.provenance.json'),
    `${JSON.stringify(provenance, null, 2)}\n`,
  );

  await rm(target, { recursive: true, force: true });
  await mkdir(dirname(target), { recursive: true });
  await cp(staging, target, { recursive: true, force: true });
  process.stdout.write(`${JSON.stringify(provenance, null, 2)}\n`);
} finally {
  await rm(staging, { recursive: true, force: true });
}
