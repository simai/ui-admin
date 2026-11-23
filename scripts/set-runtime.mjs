// The component set this repository releases -- the Admin set, package
// `admin` -- served by the site beside the Framework and Pro.
//
// Pro dropped its copy of sf-admin-menu with pro-53cd26ab57cd (2026-11-23):
// the menu, the frame, the notifications and the activity indicator ship in
// the Admin set only (@simai-studio/admin), so every page that draws one of
// them declares the `admin` package beside `pro`.
//
// The set is built from this repository's own package/ and its release output
// is committed: package/dist at the Build commit, whose tree the release lock
// (contracts/releases/<id>.lock.json, written by the Bind commit) names. So
// the site needs no sibling checkout and no rebuild to serve the set: it pins
// a release lock, and serves package/dist/smart only while HEAD still holds
// exactly that tree. A later candidate that rewrites package/dist stops the
// build until the site is pinned to its release -- the site never shows an
// unreleased set as if it were one.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectRoot } from './runtime-base.mjs';

export const SET_LOCK = 'config/simai-set.lock.json';

const git = (...args) =>
  execFileSync('git', ['-C', projectRoot, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

export const readSetLock = () => {
  const path = resolve(projectRoot, SET_LOCK);
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
};

export const readRelease = (id) =>
  JSON.parse(readFileSync(resolve(projectRoot, 'contracts/releases', `${id}.lock.json`), 'utf8'));

/**
 * Problems that keep the pinned set from being served, as sentences; empty
 * when HEAD holds the release's output untouched and the set is built over
 * the Framework this site runs.
 */
export const setProblems = (lock, framework) => {
  const problems = [];
  let release;
  try {
    release = readRelease(lock.compatibilityId);
  } catch (error) {
    return [`no release lock contracts/releases/${lock.compatibilityId}.lock.json: ${error.message}`];
  }
  if (release.package !== lock.package) problems.push(`the release lock is for ${release.package}, not ${lock.package}`);
  if (release.version !== lock.version) problems.push(`the release is ${release.version}, the pin says ${lock.version}`);
  if (release.requires?.framework !== framework.compatibilityId) {
    problems.push(`${lock.compatibilityId} was built over ${release.requires?.framework}, this site runs ${framework.compatibilityId}`);
  }
  if (lock.requires?.framework !== framework.compatibilityId) {
    problems.push(`the set pin names ${lock.requires?.framework}, this site runs ${framework.compatibilityId}`);
  }
  if (release.build?.tree !== lock.build?.tree || release.build?.path !== lock.build?.path) {
    problems.push(`the pin's build ${lock.build?.path}@${lock.build?.tree} is not the release's ${release.build?.path}@${release.build?.tree}`);
  }
  let head = null;
  try {
    head = git('rev-parse', `HEAD:${release.build.path}`);
  } catch {
    problems.push(`HEAD has no ${release.build?.path}`);
  }
  if (head && head !== release.build.tree) {
    problems.push(`HEAD's ${release.build.path} is tree ${head.slice(0, 12)}, the release built ${String(release.build.tree).slice(0, 12)}; pin the set release that wrote it`);
  }
  return problems;
};

/** Untracked or changed files under the build path, which a copy would carry. */
export const setWorkingTreeChanges = (lock) =>
  git('status', '--porcelain', '--untracked-files=all', '--', lock.build.path)
    .split('\n').filter(Boolean);
