#!/usr/bin/env node
// Usage: node deploy/simai-server/pins.mjs
//
// Prints the revisions a clean checkout needs beside this one to build the
// site, as NAME=value lines for `>> "$GITHUB_ENV"`. Every value comes from the
// two locks the build itself verifies against, never from a branch head, so a
// repin commit is the whole change the deploy needs:
//
//   config/simai-assets.lock.json   the Framework pair: ui at core.commit
//   config/simai-package.lock.json  the larena package: larena-ui at
//                                   source.revision, ui-builder at
//                                   builder.revision, the archive digest
//
// ui-source is the one input no lock here names: it is the revision the
// package source pins (components/framework.lock.json in larena-ui), read by
// clone-inputs.sh once larena-ui is cloned.
//
// Exits 1 when a pin is missing or malformed, so a reshaped lock fails the
// deploy loudly instead of cloning the wrong revision.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file) => JSON.parse(readFileSync(resolve(root, file), 'utf8'));
const framework = read('config/simai-assets.lock.json');
const pkg = read('config/simai-package.lock.json');

const commit = /^[0-9a-f]{40}$/;
const repository = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;
const fail = (message) => {
  process.stderr.write(`pin unreadable: ${message}\n`);
  process.exit(1);
};

// After the split both sides of the pair are one ui commit, read from ../ui.
// The clone step lays out exactly that; a lock that names another layout needs
// its own clone, so it fails here.
for (const side of ['core', 'smart']) {
  if (framework[side]?.repository !== '../ui') fail(`${side}.repository is ${framework[side]?.repository}, not ../ui`);
  if (!commit.test(framework[side]?.commit ?? '')) fail(`${side}.commit`);
}
if (framework.core.commit !== framework.smart.commit) fail('core and smart name different ui commits');
if (pkg.requires?.framework !== framework.compatibilityId) fail('the package is pinned over another Framework release');
if (!repository.test(pkg.source?.repository ?? '')) fail('package source.repository');
if (!commit.test(pkg.source?.revision ?? '')) fail('package source.revision');
if (!/^[A-Za-z0-9._/-]+$/.test(pkg.source?.path ?? '')) fail('package source.path');
if (!repository.test(pkg.builder?.repository ?? '')) fail('package builder.repository');
if (!commit.test(pkg.builder?.revision ?? '')) fail('package builder.revision');
if (!/^[0-9a-f]{64}$/.test(pkg.archiveSha256 ?? '')) fail('package archiveSha256');

const pins = {
  UI_REVISION: framework.core.commit,
  LARENA_REPOSITORY: pkg.source.repository,
  LARENA_REVISION: pkg.source.revision,
  LARENA_PATH: pkg.source.path,
  LARENA_ARCHIVE_SHA256: pkg.archiveSha256,
  BUILDER_REPOSITORY: pkg.builder.repository,
  BUILDER_REVISION: pkg.builder.revision,
};
for (const [name, value] of Object.entries(pins)) process.stdout.write(`${name}=${value}\n`);
