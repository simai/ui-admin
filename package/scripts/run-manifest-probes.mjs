#!/usr/bin/env node
// Usage: node scripts/run-manifest-probes.mjs <free output> <package output> [folder ...] [--overlay <directory>]
//
// The conformance probes of standard simai.smart-component 1.3.8 §12 (gate
// 20) for the package components: every src/smart/<folder>/probe.json of this
// repository, on the built bytes with the real Loader, the package declared as
// a page declares it (SF_BOOT_CONFIG.packages.admin, the name the build
// registers).
//
// It runs ui-source's one runner for them (tests/browser/manifest-probes.browser.mjs
// at the pinned revision, from the overlay), so a package probe means what a
// free probe means. The runner's page declares no package; this script gives it
// the one line that does, and refuses to run when that line is not where it
// was (the runner moved on and this script must follow).
//
// <free output> is the free Framework the package was built against: a product
// output root (core/core, smart/smart, …) or the `distr` of the ui
// distribution (core, smart, …). <package output> holds smart/<folder> and
// smart/rule.js (ui-builder's run-package-product-build.cjs).
import {spawnSync} from 'node:child_process';
import {existsSync, readdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {PACKAGE_ROOT, materializeOverlay, packageNameOf} from './overlay.mjs';
import {layProbeOutput} from './probe-layout.mjs';

const args = process.argv.slice(2);
// --set <id>=<output>: a released set this set requires (set.json requires_sets),
// its output holding smart/<folder> and smart/rule.js. It is laid beside the
// set's own folders under smart/smart/set-<id>/ and declared on the page with
// its own base, as a page declares both (data-sf-sets="<set> <required set>").
const required = [];
for (let index = args.indexOf('--set'); index !== -1; index = args.indexOf('--set', index)) {
  const [id, path] = String(args[index + 1] ?? '').split('=');
  if (!/^[a-z][a-z0-9-]*$/u.test(id ?? '') || !path) throw new Error('--set takes <id>=<output of that set>');
  required.push({id, output: resolve(path)});
  args.splice(index, 2);
}
const at = args.indexOf('--overlay');
const overlay = resolve(at === -1 ? join(PACKAGE_ROOT, '.overlay') : args[at + 1]);
const [freeInput, packageInput, ...folders] = args.filter((value, index) => !value.startsWith('--') && (at === -1 || index !== at + 1));
if (!freeInput || !packageInput) throw new Error('usage: run-manifest-probes.mjs <free output> <package output> [folder ...] [--overlay <directory>]');
const free = resolve(freeInput);
const built = resolve(packageInput);
if (!existsSync(join(built, 'smart', 'rule.js'))) throw new Error(`the package output has no smart/rule.js: ${built}`);
if (!existsSync(overlay)) materializeOverlay(overlay);

// One output root in the product layout, the package's folders and its rule
// file inside smart/smart beside the free components (scripts/probe-layout.mjs):
// the free output, a product root or a ui distr, is read and never written.
const combined = layProbeOutput({free, built, required, target: join(overlay, '.manifest-probe-output')}).output;

// The free runner, with the page declaring the package. The runner resolves
// probes from <overlay>/src/smart, where this repository's folders are laid.
const runner = join(overlay, 'tests', 'browser', 'manifest-probes.browser.mjs');
const source = readFileSync(runner, 'utf8');
const anchor = 'window.SF_BOOT_CONFIG={preloader:{enabled:false}};';
if (source.split(anchor).length !== 2) throw new Error(`${runner}: the page's SF_BOOT_CONFIG line moved; this script must follow it`);
const declared = join(overlay, 'tests', 'browser', '.manifest-probes.package.browser.mjs');
const name = packageNameOf(join(built, 'smart', 'rule.js'));
const others = required.map(({id}) => `,${id}:{base:'/distr/smart/set-${id}/'}`).join('');
writeFileSync(declared, source.replace(anchor, `window.SF_BOOT_CONFIG={preloader:{enabled:false},packages:{${name}:{base:'/distr/smart/'}${others}}};`));
const own = folders.length ? folders : readdirSync(join(PACKAGE_ROOT, 'src', 'smart')).filter((folder) => existsSync(join(PACKAGE_ROOT, 'src', 'smart', folder, 'probe.json')));
const result = spawnSync(process.execPath, [declared, combined, ...own], {cwd: overlay, stdio: 'inherit'});
process.exitCode = result.status ?? 1;
