#!/usr/bin/env node
// Usage: node scripts/materialize-package-runtime.mjs --target <directory>
//
// Materialises the pinned component package and proves it is the build the
// lock names -- including that it was built over the Framework this site runs.
//
// The package reaches the page as a component package of the Loader: the page
// declares SF_BOOT_CONFIG.packages.<name>.base, the Loader fetches
// <base>/rule.js before its first scan, and the package's components load from
// that base. So the package is served from the root of its own stamped path,
// which is the `smart/` directory of its build.
//
// The bytes come from building the pinned source revision with ui-builder
// (scripts/package-build.mjs), and are trusted only if the build's archive has
// the hash the lock recorded when it was pinned and every required file has
// its hash. A build that differs in one byte is refused, not served.
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { loadLocalEnv, verifyRequiredFiles } from './runtime-extract.mjs';
import { projectRoot, readLock, FRAMEWORK_LOCK, PACKAGE_LOCK } from './runtime-base.mjs';
import { ensureBuild } from './package-build.mjs';
import { distributionIdentitySha256 } from './pin-package-identity.mjs';

await loadLocalEnv(projectRoot);

const targetIndex = process.argv.indexOf('--target');
const targetArgument = targetIndex >= 0 ? process.argv[targetIndex + 1] : null;
if (!targetArgument) throw new Error('Usage: materialize-package-runtime.mjs --target <directory>');

const lock = readLock(PACKAGE_LOCK);
const framework = readLock(FRAMEWORK_LOCK);

if (!lock.compatibilityId) throw new Error(`${PACKAGE_LOCK} is not pinned — run \`npm run pin:package\` first.`);

// The cross-check, repeated here rather than trusted from the pin. The pin runs
// when someone takes a package; this runs on every build.
if (lock.requires?.framework !== framework.compatibilityId) {
  throw new Error(`${lock.compatibilityId} was built over ${lock.requires?.framework}, this site runs ${framework.compatibilityId}.`);
}
if (lock.distributionIdentitySha256 !== distributionIdentitySha256(lock)) {
  throw new Error(`${PACKAGE_LOCK}: the distribution identity does not match the lock; pin again.`);
}

const { workspace, receipt, base } = ensureBuild({
  name: lock.package, folder: lock.source.path, revision: lock.source.revision,
});
const archive = join(workspace, receipt.output.archive);
const archiveSha = existsSync(archive)
  ? createHash('sha256').update(await readFile(archive)).digest('hex')
  : null;
if (archiveSha !== lock.archiveSha256) {
  throw new Error(`${lock.compatibilityId}: the build's archive is ${archiveSha}, the lock pinned ${lock.archiveSha256}.`);
}

const target = resolve(projectRoot, targetArgument);
const staging = await mkdtemp(resolve(tmpdir(), 'simai-package-runtime-'));
try {
  await cp(base, staging, { recursive: true });
  const files = await verifyRequiredFiles(staging, lock.smart.requiredFiles, lock.package);
  const provenance = {
    schemaVersion: 1,
    package: lock.package,
    compatibilityId: lock.compatibilityId,
    distributionIdentitySha256: lock.distributionIdentitySha256,
    requires: lock.requires,
    source: lock.source,
    archiveSha256: lock.archiveSha256,
    smart: { files },
  };
  await writeFile(join(staging, 'simai-package.provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`);
  await rm(target, { recursive: true, force: true });
  await mkdir(dirname(target), { recursive: true });
  await cp(staging, target, { recursive: true });
  process.stdout.write(`${JSON.stringify(provenance, null, 2)}\n`);
} finally {
  await rm(staging, { recursive: true, force: true });
}
