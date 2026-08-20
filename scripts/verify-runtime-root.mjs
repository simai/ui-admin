import { constants } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function loadLocalEnv() {
  let content = '';

  try {
    content = await readFile(resolve(projectRoot, '.env'), 'utf8');
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

await loadLocalEnv();

const configuredRoot = process.env.SIMAI_RUNTIME_ROOT;
if (!configuredRoot) {
  throw new Error(
    'SIMAI_RUNTIME_ROOT is required for dev:runtime. Set it in .env to a ready distr directory containing core/ and smart/.',
  );
}

const runtimeRoot = resolve(projectRoot, configuredRoot);
const requiredFiles = ['core/js/core.js', 'smart/table/js/table.js'];

for (const relativePath of requiredFiles) {
  try {
    await access(resolve(runtimeRoot, relativePath), constants.R_OK);
  } catch {
    throw new Error(
      `SIMAI_RUNTIME_ROOT is invalid: missing readable ${relativePath} in ${runtimeRoot}.`,
    );
  }
}

process.stdout.write(`SIMAI_RUNTIME_ROOT verified: ${runtimeRoot}\n`);
