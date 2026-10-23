// Building a component package the way its owner does, and reading what the
// build says about itself.
//
// The admin components are the package `larena`: their source is the
// `components/` folder of simai/ui-pro, read from the sibling checkout
// ../ui-pro (or $SIMAI_UI_PRO). They moved there from this repository on
// 2026-10-23 (owner; before that simai/larena-ui), and this repository became
// the reference application that runs them. There is no separate repository of
// built bytes (standard simai.component-package; owner, 2026-10-11). So this
// site builds the package itself, with the same ui-builder command Larena
// uses, over the ui-source revision the folder pins, and trusts nothing but
// the build's own receipt: the package source revision and tree, the free
// release it was built over, and the hashes of what it wrote.
//
// Builds are kept under ../.package-build/ui-admin/<package>-<12> (or
// $SIMAI_PACKAGE_BUILD_ROOT/<package>-<12>) and reused: the same commit builds
// the same bytes (the builder proves that with two waves), so a second build
// of one revision would only cost time. They sit beside the checkouts rather
// than inside either of them: ui-builder refuses a workspace inside the
// package repository, and a build is not a file of this repository.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { projectRoot } from './runtime-base.mjs';

const sibling = (name, variable) => resolve(process.env[variable] || join(projectRoot, '..', name));

export const roots = () => ({
  builder: sibling('ui-builder', 'SIMAI_UI_BUILDER'),
  source: sibling('ui-source', 'SIMAI_UI_SOURCE'),
  ui: sibling('ui', 'SIMAI_UI_REPO'),
  // The package source is another repository: components/ lives in
  // simai/ui-pro, checked out beside this one.
  package: sibling('ui-pro', 'SIMAI_UI_PRO'),
});

const git = (root, ...args) =>
  execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

/** The commit that last wrote the package folder in the package repository
 * (../ui-pro): a later commit elsewhere in it is not a new package. */
export const packageRevision = (packageRoot, folder) => {
  const revision = git(packageRoot, 'log', '-1', '--format=%H', '--', folder);
  if (!revision) throw new Error(`no commit in ${packageRoot} has written ${folder}`);
  return revision;
};

export const buildRoot = () =>
  resolve(process.env.SIMAI_PACKAGE_BUILD_ROOT || join(projectRoot, '..', '.package-build', 'ui-admin'));

export const workspaceFor = (name, revision) =>
  join(buildRoot(), `${name}-${revision.slice(0, 12)}`);

/**
 * The receipt of a build of `name` at `revision`, building it first when this
 * site has not. Returns {workspace, receipt, base} where `base` is the
 * directory a page declares as the package base.
 */
export const ensureBuild = ({ name, folder, revision }) => {
  const workspace = workspaceFor(name, revision);
  const receiptPath = join(workspace, 'package-receipt.json');
  if (!existsSync(receiptPath)) {
    const { builder, source, ui, package: packageRoot } = roots();
    rmSync(workspace, { recursive: true, force: true });
    execFileSync(process.execPath, [
      join(builder, 'scripts/verify-package-reproducibility.cjs'),
      '--package-source', packageRoot, '--package-path', folder,
      source, workspace, '--package', name, '--package-revision', revision,
    ], { stdio: ['ignore', 'ignore', 'inherit'], maxBuffer: 64 * 1024 * 1024 });
    execFileSync('python3', [
      join(builder, 'scripts/write-package-receipt.py'),
      '--report', join(workspace, 'report.json'), '--ui', ui,
    ], { stdio: ['ignore', 'ignore', 'inherit'] });
  }
  const receipt = JSON.parse(readFileSync(receiptPath, 'utf8'));
  if (receipt.package !== name) throw new Error(`${receiptPath} is a receipt for ${receipt.package}, not ${name}`);
  if (receipt.package_source?.revision !== revision) {
    throw new Error(`${receiptPath} was built from ${receipt.package_source?.revision}, not ${revision}`);
  }
  return { workspace, receipt, base: join(workspace, 'wave-1/output/package', name, 'smart') };
};
