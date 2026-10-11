// Extracting a distribution out of a repository, and proving it is the one the
// lock names.
//
// Shared by both materialisers. The Framework and Pro arrive from different
// repositories on different cadences, but they are served side by side off one
// static site, and a consumer that verified one of them more carefully than the
// other would be attesting half a runtime. So the hashing, the commit check and
// the extraction live in one place: a change to how bytes are proved applies to
// everything this site serves, or to nothing.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';

export async function loadLocalEnv(projectRoot) {
  const envPath = resolve(projectRoot, '.env');
  let content = '';

  try {
    content = await readFile(envPath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return;
    }

    throw error;
  }

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

export function git(repo, args, options = {}) {
  return execFileSync('git', ['-C', repo, ...args], {
    encoding: options.encoding ?? 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
}

export function assertExactCommit(repo, commit, label) {
  if (!/^[0-9a-f]{40}$/.test(commit)) {
    throw new Error(`${label} lock must contain a full 40-character commit.`);
  }
  const resolved = git(repo, ['rev-parse', `${commit}^{commit}`]).trim();
  if (resolved !== commit) {
    throw new Error(`${label} resolved to ${resolved}, expected ${commit}.`);
  }
}

export async function extract(repo, commit, sourceDir, destination) {
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

export async function sha256(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

export function stableJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export async function verifyRequiredFiles(root, requiredFiles, label) {
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
