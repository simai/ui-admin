import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

const projectRoot = resolve(import.meta.dirname, '..');
const target = resolve(projectRoot, '.runtime-test');

test('materializes the exact accepted Framework pair', async () => {
  await rm(target, { recursive: true, force: true });
  try {
    const lock = JSON.parse(
      await readFile(resolve(projectRoot, 'config/simai-assets.lock.json'), 'utf8'),
    );
    execFileSync(
      process.execPath,
      [
        'scripts/materialize-framework-runtime.mjs',
        '--target',
        '.runtime-test',
      ],
      {
        cwd: projectRoot,
        env: process.env,
        stdio: 'pipe',
      },
    );
    const provenance = JSON.parse(
      await readFile(resolve(target, 'simai-assets.provenance.json'), 'utf8'),
    );
    assert.equal(provenance.compatibilityId, lock.compatibilityId);
    assert.equal(provenance.pairIdentitySha256, lock.pairIdentitySha256);
    assert.equal(provenance.core.commit, lock.core.commit);
    assert.equal(provenance.smart.commit, lock.smart.commit);
    assert.equal(provenance.contractSha256, lock.contractSha256);
    assert.match(provenance.pairIdentitySha256, /^[0-9a-f]{64}$/);
    assert.equal(provenance.horizontalAssertions, 0);
    // The provenance has to account for exactly what the lock requires, each
    // side in order. Counting them instead cost a release: the lock grew the
    // Loader and a Smart manifest and the test failed on «5 !== 4», which says
    // nothing about what is missing and has to be edited every time the
    // verified set changes.
    for (const side of ['core', 'smart']) {
      assert.deepEqual(
        provenance[side].files.map((file) => file.path),
        lock[side].requiredFiles.map((file) => file.path),
        `${side}: the materialised runtime accounts for the files the lock requires`,
      );
    }

    const contract = JSON.parse(
      await readFile(
        resolve(target, 'core/contracts/adaptive-sizing.v1.json'),
        'utf8',
      ),
    );
    assert.equal(contract.meta.contractId, 'simai.vertical-sizing');
    // And every one of them is on disk where the page will ask for it, rather
    // than two of them spot-checked by hand.
    for (const required of lock.core.requiredFiles) {
      await readFile(resolve(target, required.path));
    }
    for (const required of lock.smart.requiredFiles) {
      await readFile(resolve(target, lock.smart.targetDir, required.path));
    }
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});
