import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lockPath = resolve(projectRoot, 'config/simai-assets.lock.json');
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

function git(repo, args, options = {}) {
  return execFileSync('git', ['-C', repo, ...args], {
    encoding: options.encoding ?? 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
}

function assertExactCommit(repo, commit, label) {
  if (!/^[0-9a-f]{40}$/.test(commit)) {
    throw new Error(`${label} lock must contain a full 40-character commit.`);
  }
  const resolved = git(repo, ['rev-parse', `${commit}^{commit}`]).trim();
  if (resolved !== commit) {
    throw new Error(`${label} resolved to ${resolved}, expected ${commit}.`);
  }
}

async function extract(repo, commit, sourceDir, destination) {
  const archive = git(repo, ['archive', '--format=tar', commit, sourceDir], {
    encoding: null,
  });
  const temporaryRoot = await mkdtemp(resolve(tmpdir(), 'simai-runtime-'));
  try {
    execFileSync('tar', ['-xf', '-', '-C', temporaryRoot], {
      input: archive,
      maxBuffer: 256 * 1024 * 1024,
      stdio: ['pipe', 'ignore', 'pipe'],
    });
    await mkdir(dirname(destination), { recursive: true });
    await cp(resolve(temporaryRoot, sourceDir), destination, {
      recursive: true,
      force: true,
    });
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

async function sha256(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

async function verifyRequiredFiles(root, requiredFiles, label) {
  const verified = [];
  for (const required of requiredFiles) {
    const actual = await sha256(resolve(root, required.path));
    if (actual !== required.sha256) {
      throw new Error(
        `${label}/${required.path} SHA-256 ${actual} does not match ${required.sha256}.`,
      );
    }
    verified.push({ path: required.path, sha256: actual });
  }
  return verified;
}

assertExactCommit(uiRepo, lock.core.commit, 'Core');
assertExactCommit(smartRepo, lock.smart.commit, 'Smart');

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
