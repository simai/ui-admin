// Materialises the pinned Framework distribution and proves it is the pair the
// lock names. The extraction and the hashing are shared with the package
// materialiser (scripts/runtime-extract.mjs) so both distributions this site
// serves are proved the same way.
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertExactCommit,
  extract,
  git,
  loadLocalEnv,
  stableJson,
  verifyRequiredFiles,
} from './runtime-extract.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lockPath = resolve(projectRoot, 'config/simai-assets.lock.json');

await loadLocalEnv(projectRoot);

const lock = JSON.parse(await readFile(lockPath, 'utf8'));
const targetIndex = process.argv.indexOf('--target');
const targetArgument = targetIndex >= 0 ? process.argv[targetIndex + 1] : null;

if (!targetArgument) {
  throw new Error('Usage: materialize-framework-runtime.mjs --target <directory>');
}

const target = resolve(projectRoot, targetArgument);
const uiRepo = resolve(
  projectRoot,
  process.env.SIMAI_UI_REPO || lock.core.repository,
);
const smartRepo = resolve(
  projectRoot,
  process.env.SIMAI_UI_SMART_REPO || lock.smart.repository,
);






function pairIdentitySha256(lock) {
  const identity = {
    core: {
      commit: lock.core.commit,
      requiredFiles: lock.core.requiredFiles,
    },
    smart: {
      commit: lock.smart.commit,
      requiredFiles: lock.smart.requiredFiles,
    },
  };

  return createHash('sha256')
    .update(stableJson(identity))
    .digest('hex');
}


assertExactCommit(uiRepo, lock.core.commit, 'Core');
assertExactCommit(smartRepo, lock.smart.commit, 'Smart');

const expectedPairIdentity = pairIdentitySha256(lock);
if (lock.pairIdentitySha256 !== expectedPairIdentity) {
  throw new Error(
    `Framework pair identity ${lock.pairIdentitySha256} does not match ${expectedPairIdentity}.`,
  );
}

const staging = await mkdtemp(resolve(tmpdir(), 'simai-framework-runtime-'));
try {
  await extract(uiRepo, lock.core.commit, lock.core.sourceDir, staging);
  await extract(
    smartRepo,
    lock.smart.commit,
    lock.smart.sourceDir,
    resolve(staging, lock.smart.targetDir),
  );

  const coreFiles = await verifyRequiredFiles(
    staging,
    lock.core.requiredFiles,
    'Core',
  );
  const smartFiles = await verifyRequiredFiles(
    resolve(staging, lock.smart.targetDir),
    lock.smart.requiredFiles,
    'Smart',
  );

  const provenance = {
    schemaVersion: 1,
    compatibilityId: lock.compatibilityId,
    pairIdentitySha256: lock.pairIdentitySha256,
    contractSha256: lock.contractSha256,
    core: { commit: lock.core.commit, files: coreFiles },
    smart: { commit: lock.smart.commit, files: smartFiles },
    horizontalAssertions: 0,
  };
  await writeFile(
    resolve(staging, 'simai-assets.provenance.json'),
    `${JSON.stringify(provenance, null, 2)}\n`,
  );

  await rm(target, { recursive: true, force: true });
  await mkdir(dirname(target), { recursive: true });
  await cp(staging, target, { recursive: true, force: true });
  process.stdout.write(`${JSON.stringify(provenance, null, 2)}\n`);
} finally {
  await rm(staging, { recursive: true, force: true });
}
