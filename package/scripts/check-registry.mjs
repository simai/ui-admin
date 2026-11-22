#!/usr/bin/env node
// Usage: node scripts/check-registry.mjs [--registry <file>]
//
// The set's passport against the shared name registry at simai/ui-source main
// (standard simai.component-set 1.0.0, family-has-one-owner: "the registry is
// public and read from simai/ui-source main ... so a set checks against it
// without a SIMAI Framework release"). The unit suite checks the registry at the
// pinned revision; this checks the one that is current. It also says the
// registry's status of the set (pending, planned, active), which the gate does
// not judge: a family is taken before the set's first release.
import {readFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {registryProblems} from '../tests/set-registry.mjs';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY_URL = 'https://raw.githubusercontent.com/simai/ui-source/main/contracts/registry/names.json';
const at = process.argv.indexOf('--registry');
const registry = at > 0
  ? JSON.parse(readFileSync(resolve(process.argv[at + 1]), 'utf8'))
  : await (await fetch(REGISTRY_URL)).json();
const passport = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'set.json'), 'utf8'));
const problems = registryProblems(registry, passport);
const owner = registry.owners.find((entry) => entry.id === passport.id);
console.log(JSON.stringify({registry: at > 0 ? process.argv[at + 1] : REGISTRY_URL, set: passport.id, status: owner?.status ?? null, problems}, null, 1));
process.exit(problems.length ? 1 : 0);
