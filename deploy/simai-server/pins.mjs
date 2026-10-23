#!/usr/bin/env node
// Usage: node deploy/simai-server/pins.mjs
//        node deploy/simai-server/pins.mjs --verify-ui <ui clone>
//
// Prints the revisions a clean checkout needs beside this one to build the
// site, as NAME=value lines for `>> "$GITHUB_ENV"`. Every value comes from the
// two locks the build itself verifies against, never from a branch head, so a
// repin commit is the whole change the deploy needs:
//
//   config/simai-assets.lock.json   the Framework pair: one ui clone holding
//                                   core.commit and smart.commit, checked out
//                                   at core.commit (the release build commit)
//   config/simai-package.lock.json  the larena package: simai/ui-pro's
//                                   components/ at source.revision, ui-builder at
//                                   builder.revision, the archive digest
//
// ui-source is the one input no lock here names: it is the revision the
// package source pins (components/framework.lock.json in simai/ui-pro at
// source.revision), read by clone-inputs.sh from that clone.
//
// The two sides of the pair need not be one commit. A release whose Smart did
// not change pins core at the build commit and smart at the older commit that
// last wrote distr/smart -- both in ui, both named by the release contract
// (ui contracts/releases/<compatibilityId>.lock.json). The identity of the pair
// is that release, not equal commits, the same as for the materialiser and
// scripts/pin-framework-pair.mjs. --verify-ui checks a ui clone against it:
// both commits exist, the checkout is core.commit, smart.commit is what wrote
// smart.sourceDir there, and a release contract on the default branch issued
// compatibilityId for exactly these two commits.
//
// Exits 1 when a pin is missing or malformed, so a reshaped lock fails the
// deploy loudly instead of cloning the wrong revision.
import { execFileSync } from 'node:child_process';
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

// After the split both sides of the pair live in one repository, ui, read from
// ../ui. The clone step lays out exactly that; a lock that names another layout
// needs its own clone, so it fails here. The commits may differ (see above).
for (const side of ['core', 'smart']) {
  if (framework[side]?.repository !== '../ui') fail(`${side}.repository is ${framework[side]?.repository}, not ../ui`);
  if (!commit.test(framework[side]?.commit ?? '')) fail(`${side}.commit`);
  if (!/^[A-Za-z0-9._/-]+$/.test(framework[side]?.sourceDir ?? '')) fail(`${side}.sourceDir`);
}
if (!/^ui-[0-9a-f]{12}(-smart-[0-9a-f]{12})?$/.test(framework.compatibilityId ?? '')) fail('compatibilityId');
if (pkg.requires?.framework !== framework.compatibilityId) fail('the package is pinned over another Framework release');
if (!repository.test(pkg.source?.repository ?? '')) fail('package source.repository');
// The package source is simai/ui-pro (owner, 2026-10-23); clone-inputs.sh
// clones it beside this checkout at source.revision. A lock that names another
// repository needs its own clone step, so it fails here.
if (pkg.source.repository !== 'simai/ui-pro') fail(`package source.repository is ${pkg.source.repository}, not simai/ui-pro`);
if (!commit.test(pkg.source?.revision ?? '')) fail('package source.revision');
if (!/^[A-Za-z0-9._/-]+$/.test(pkg.source?.path ?? '')) fail('package source.path');
if (!repository.test(pkg.builder?.repository ?? '')) fail('package builder.repository');
if (!commit.test(pkg.builder?.revision ?? '')) fail('package builder.revision');
if (!/^[0-9a-f]{64}$/.test(pkg.archiveSha256 ?? '')) fail('package archiveSha256');

const verifyIndex = process.argv.indexOf('--verify-ui');
if (verifyIndex >= 0) {
  const ui = process.argv[verifyIndex + 1] ?? fail('--verify-ui needs the ui clone');
  const git = (...args) => execFileSync('git', ['-C', ui, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 1024 * 1024 * 64,
  }).trim();
  const tryGit = (...args) => { try { return git(...args); } catch { return null; } };
  const { core, smart, compatibilityId } = framework;
  for (const [side, pinned] of [['core', core.commit], ['smart', smart.commit]]) {
    if (tryGit('rev-parse', '--verify', '--quiet', `${pinned}^{commit}`) !== pinned) {
      fail(`${side}.commit ${pinned} is not a commit of the ui clone`);
    }
  }
  if (git('rev-parse', 'HEAD') !== core.commit) fail(`the ui clone is not checked out at core.commit ${core.commit}`);
  // What the checkout serves for each side is what the lock pins (the same
  // question `npm run pin:check` asks the working tree during the build).
  for (const [side, { commit: pinned, sourceDir }] of [['core', core], ['smart', smart]]) {
    const wrote = git('log', '-1', '--format=%H', core.commit, '--', sourceDir);
    if (wrote !== pinned) fail(`${sourceDir} at ${core.commit.slice(0, 12)} was last written by ${wrote.slice(0, 12)}, the lock pins ${side} ${pinned.slice(0, 12)}`);
  }
  // The release contract is the identity. The registry binding writes it in a
  // bookkeeping commit after the build commit, so it is read from the default
  // branch rather than from the checkout.
  const tip = git('rev-parse', 'refs/remotes/origin/HEAD');
  const names = git('ls-tree', '--name-only', `${tip}:contracts/releases`).split('\n');
  const claims = names.filter((name) => name.endsWith('.lock.json')).some((name) => {
    let release;
    try { release = JSON.parse(git('show', `${tip}:contracts/releases/${name}`)); } catch { return false; }
    if (release?.compatibility_id !== compatibilityId) return false;
    const sources = Object.values(release.runtime_sources ?? {});
    return [core, smart].every(({ commit: pinned, sourceDir }) => sources.some(
      (source) => source?.runtime_path === sourceDir && source?.commit === pinned,
    ));
  });
  if (!claims) fail(`no release contract in ui contracts/releases issues ${compatibilityId} for core ${core.commit.slice(0, 12)} and smart ${smart.commit.slice(0, 12)}`);
  process.stdout.write(`ui pair ${compatibilityId}: core ${core.commit}, smart ${smart.commit}\n`);
  process.exit(0);
}

const pins = {
  UI_COMPATIBILITY_ID: framework.compatibilityId,
  UI_CORE_REVISION: framework.core.commit,
  UI_SMART_REVISION: framework.smart.commit,
  LARENA_REPOSITORY: pkg.source.repository,
  LARENA_REVISION: pkg.source.revision,
  LARENA_PATH: pkg.source.path,
  LARENA_ARCHIVE_SHA256: pkg.archiveSha256,
  BUILDER_REPOSITORY: pkg.builder.repository,
  BUILDER_REVISION: pkg.builder.revision,
};
for (const [name, value] of Object.entries(pins)) process.stdout.write(`${name}=${value}\n`);
