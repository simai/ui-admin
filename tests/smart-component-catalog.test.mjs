import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const hash = (content) => createHash('sha256').update(content).digest('hex');

test('catalog switches between canonical whole-component contracts', async () => {
  const html = await readFile(new URL('smart-component-catalog.html', root), 'utf8');
  const source = await readFile(new URL('src/smart-component-catalog.ts', root), 'utf8');
  const materializer = await readFile(new URL('scripts/materialize-smart-contracts.mjs', root), 'utf8');
  assert.match(html, /data-contract-controls/);
  assert.match(html, /data-event-log/);
  assert.match(html, /persistence-mode="external"/);
  assert.match(html, /data-contract-select/);
  assert.match(html, /data-contract-fixture="smart\.data-view"/);
  assert.match(html, /id="catalog-data-view"/);
  assert.match(html, /id="catalog-pagination"/);
  assert.match(source, /fetch\(`\/contracts\/\$\{id\}\.json`/);
  assert.match(source, /Object\.entries\(manifest\.inputs\.properties\)/);
  assert.match(source, /Object\.keys\(manifest\.events\)/);
  assert.match(source, /sf-data-view-query-change/);
  assert.match(source, /sf-data-view-column-settings-save/);
  assert.match(materializer, /for \(const entry of registry\.entries\)/);
  assert.match(materializer, /entry\.manifest_sha256 !== hash\(manifestContent\)/);
  assert.match(materializer, /registry_sha256: hash\(registryContent\)/);
  assert.match(materializer, /smart-component-manifest\.schema\.json/);
  assert.doesNotMatch(source, /const\s+manifest\s*=\s*\{/);
});

test('materialized catalog is traceable to the canonical registry and schema', async () => {
  const materializationContent = await readFile(new URL('public/contracts/materialization.json', root));
  const materialization = JSON.parse(materializationContent.toString('utf8'));
  const registryContent = await readFile(new URL('public/contracts/smart-component-contract-registry.json', root));
  const registry = JSON.parse(registryContent.toString('utf8'));
  const schemaContent = await readFile(new URL('public/contracts/smart-component-manifest.schema.json', root));

  assert.equal(materialization.schema, 'simai.ui-admin.contract-materialization.v1');
  assert.equal(materialization.registry_sha256, hash(registryContent));
  assert.equal(materialization.registry_schema_sha256, hash(schemaContent));
  assert.equal(materialization.contracts.length, 44);
  assert.ok(materialization.contracts.some(({id, version}) => id === 'smart.admin-menu' && version === '1.0.0'));
  assert.ok(materialization.contracts.some(({id, version}) => id === 'smart.data-view' && version === '1.0.0'));
  assert.ok(materialization.contracts.some(({id}) => id === 'smart.button-group'));

  for (const contract of materialization.contracts) {
    const manifestContent = await readFile(new URL(`public/contracts/${contract.file}`, root));
    const manifest = JSON.parse(manifestContent.toString('utf8'));
    assert.equal(contract.manifest_sha256, hash(manifestContent));
    assert.equal(manifest.id, contract.id);
    assert.equal(manifest.version, contract.version);
    const registryEntry = registry.entries.find(({id}) => id === contract.id);
    assert.ok([1, 2].includes(manifest.compatibility.contract_schema.version));
    assert.equal(registryEntry?.contract_schema.version, 2);
    assert.equal(registryEntry?.manifest_sha256, contract.manifest_sha256);
  }
});
