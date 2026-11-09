import {createHash} from 'node:crypto';
import {cp, mkdir, readdir, readFile, rm, writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const loaderRoot = resolve(projectRoot, process.env.SIMAI_UI_SOURCE_REPO || process.env.SIMAI_UI_LOADER_REPO || '../ui-source');
const registrySource = resolve(loaderRoot, 'contracts/generated/smart-component-contract-registry.json');
const target = resolve(projectRoot, 'public/contracts');
// The pinned component package, as `npm run prepare:runtime` materialised it
// from the archive whose sha256 the package lock records. Its components
// (sf-admin-menu, sf-view-table, ...) left the Framework registry with the Pro
// split; their contracts travel inside the package as smart.manifest.json.
const packageRuntime = resolve(projectRoot, process.env.SIMAI_PACKAGE_RUNTIME || '.runtime-package');
const hash = (content) => createHash('sha256').update(content).digest('hex');

const registryContent = await readFile(registrySource);
const registry = JSON.parse(registryContent.toString('utf8'));
// Both forms of the name are read (names carry no version, 2026-10-11).
if (registry.schema !== 'simai.smart-component-contract-registry.v2'
    && !(registry.schema === 'simai.smart-component-contract-registry' && registry.schema_version === 2)) {
  throw new Error(`Unsupported smart-component registry: ${registry.schema || 'missing schema'}.`);
}
if (registry.schema_id !== 'https://simai.io/contracts/smart-component-manifest.v2.schema.json') {
  throw new Error(`Unsupported smart-component contract schema: ${registry.schema_id || 'missing schema id'}.`);
}

const schemaSource = resolve(loaderRoot, registry.schema_path);
const schemaContent = await readFile(schemaSource);
if (registry.schema_sha256 !== hash(schemaContent)) {
  throw new Error('Smart-component contract schema does not match the canonical registry.');
}

await mkdir(target, {recursive: true});
await cp(registrySource, resolve(target, 'smart-component-contract-registry.json'));
await cp(schemaSource, resolve(target, 'smart-component-manifest.schema.json'));
const contracts = [];
for (const entry of registry.entries) {
  const manifestSource = resolve(loaderRoot, entry.manifest_path);
  const manifestContent = await readFile(manifestSource);
  if (entry.manifest_sha256 !== hash(manifestContent)) {
    throw new Error(`${entry.id} contract registry is stale; run ui-source contract:build first.`);
  }
  const manifest = JSON.parse(manifestContent.toString('utf8'));
  if (manifest.id !== entry.id || ![1, 2].includes(manifest.compatibility?.contract_schema?.version)) {
    throw new Error(`${entry.id} manifest identity is incompatible with its declared contract schema.`);
  }
  const file = `${entry.id}.json`;
  await cp(manifestSource, resolve(target, file));
  contracts.push({
    id: entry.id,
    version: manifest.version,
    file,
    manifest_sha256: entry.manifest_sha256,
  });
}
const provenancePath = resolve(packageRuntime, 'simai-package.provenance.json');
if (!existsSync(provenancePath)) {
  throw new Error(`${packageRuntime} holds no materialised package; run \`npm run prepare:runtime\` first.`);
}
const provenance = JSON.parse(await readFile(provenancePath, 'utf8'));
const frameworkIds = new Set(contracts.map(({id}) => id));
const packageDirectories = (await readdir(packageRuntime, {withFileTypes: true}))
  .filter((entry) => entry.isDirectory()).map(({name}) => name).sort();
for (const directory of packageDirectories) {
  const manifestSource = resolve(packageRuntime, directory, 'smart.manifest.json');
  if (!existsSync(manifestSource)) continue;
  const manifestContent = await readFile(manifestSource);
  const manifest = JSON.parse(manifestContent.toString('utf8'));
  if (![1, 2].includes(manifest.compatibility?.contract_schema?.version)
      || manifest.compatibility?.contract_schema?.id !== registry.schema_id) {
    throw new Error(`${provenance.compatibilityId} ${directory}: manifest is not on the registry's contract schema.`);
  }
  if (frameworkIds.has(manifest.id)) {
    throw new Error(`${manifest.id} is declared by both the Framework registry and ${provenance.compatibilityId}.`);
  }
  const file = `${manifest.id}.json`;
  await cp(manifestSource, resolve(target, file));
  contracts.push({
    id: manifest.id,
    version: manifest.version,
    file,
    manifest_sha256: hash(manifestContent),
    source: `package:${provenance.package}`,
  });
}

// The folder is this script's output, and only this script's: a contract the
// registry or the package no longer declares is removed, not left behind for
// the catalog to load (smart.data-view outlived its move to sf-view-table).
const written = new Set(contracts.map(({file}) => file));
for (const name of await readdir(target)) {
  if (/^smart\.[a-z0-9-]+\.json$/.test(name) && !written.has(name)) await rm(resolve(target, name));
}

await writeFile(resolve(target, 'materialization.json'), `${JSON.stringify({
  schema: 'simai.ui-admin.contract-materialization.v1',
  package: {name: provenance.package, compatibility_id: provenance.compatibilityId, archive_sha256: provenance.archiveSha256},
  contracts,
  registry_sha256: hash(registryContent),
  registry_schema_sha256: registry.schema_sha256,
}, null, 2)}\n`);
