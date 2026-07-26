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
    assert.equal(
      provenance.frameworkRegistry.commit,
      lock.frameworkRegistry.commit,
    );
    assert.equal(
      provenance.frameworkRegistry.sha256,
      lock.frameworkRegistry.sha256,
    );
    assert.match(provenance.pairIdentitySha256, /^[0-9a-f]{64}$/);
    assert.equal(provenance.horizontalAssertions, 0);
    assert.equal(provenance.core.files.length, 4);
    assert.equal(provenance.smart.files.length, 3);

    const contract = JSON.parse(
      await readFile(
        resolve(target, 'core/contracts/adaptive-sizing.v1.json'),
        'utf8',
      ),
    );
    assert.equal(contract.meta.contractId, 'simai.vertical-sizing');
    await readFile(resolve(target, 'smart/icon-buttons/js/icon-buttons.js'));
    await readFile(resolve(target, 'smart/admin-menu/js/admin-menu.js'));
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});
