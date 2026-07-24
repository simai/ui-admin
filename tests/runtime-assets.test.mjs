import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

const projectRoot = resolve(import.meta.dirname, '..');
const target = resolve(projectRoot, '.runtime-test');
const expectedCore = '3c86bb4dd27f3fbbcc14bb8202ad45b55a623fcf';
const expectedSmart = '7bfa9e60669e84c1b56b8404a9c22ebbf5b670c7';
const expectedContract =
  '333d78f0f3abe6f47c9caa1fc3c53c4d2894e122a922a400804383266cbd72f5';

test('materializes the exact accepted Framework pair', async () => {
  await rm(target, { recursive: true, force: true });
  try {
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
    assert.equal(provenance.core.commit, expectedCore);
    assert.equal(provenance.smart.commit, expectedSmart);
    assert.equal(provenance.contractSha256, expectedContract);
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
