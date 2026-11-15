// The one output root the probes of this set run against (scripts/run-browser-probes.mjs,
// scripts/run-manifest-probes.mjs): the free SIMAI Framework laid out as a
// product root (core/core, core/rule, component/component, smart/smart,
// utility/utility) with this set's built folders and its rule file inside
// smart/smart, and each required set under smart/smart/set-<id>/.
//
// The free side is given either as a product root or as the `distr` of the ui
// distribution. Either way it is read, never written: core, rule, component and
// utility are linked (nothing lands in them), and smart/smart, where the set's
// folders and rule.js land, is a real copy, links resolved. Before 2026-11-09
// smart/smart was copied as a link when the free side was a distr, so the
// set's rule.js was written into the distr given (gates.sh's free distr, or a
// ui checkout's), and the next run refused to replace it.
import {cpSync, existsSync, lstatSync, mkdirSync, readdirSync, realpathSync, rmSync, symlinkSync} from 'node:fs';
import {join, relative, resolve, sep} from 'node:path';

const PRODUCTS = {core: ['core', 'core'], rule: ['core', 'rule'], component: ['component', 'component'], smart: ['smart', 'smart'], utility: ['utility', 'utility']};

// 'product', 'distr' or '' for a folder that is neither.
export function freeLayoutOf(free) {
  if (existsSync(join(free, 'core', 'core', 'js', 'core.js'))) return 'product';
  if (existsSync(join(free, 'core', 'js', 'core.js'))) return 'distr';
  return '';
}

// Every link under a folder, as paths relative to it.
export function linksUnder(root, current = root) {
  return readdirSync(current, {withFileTypes: true}).flatMap((entry) => {
    const path = join(current, entry.name);
    if (entry.isSymbolicLink()) return [relative(root, path)];
    return entry.isDirectory() ? linksUnder(root, path) : [];
  });
}

// Lays <target> (replaced) from the free output, the set's build output (the
// folder holding smart/) and the required sets [{id, output}]. Returns the roots
// the probes ask for.
export function layProbeOutput({free: freeInput, built: builtInput, required = [], target: targetInput}) {
  const free = resolve(freeInput);
  const built = resolve(builtInput);
  const target = resolve(targetInput);
  const layout = freeLayoutOf(free);
  if (!layout) throw new Error(`no core/js/core.js under ${free} (a product output root or a ui distr)`);
  if (!existsSync(join(built, 'smart', 'rule.js'))) throw new Error(`the package output has no smart/rule.js: ${built}`);
  rmSync(target, {force: true, recursive: true});
  for (const [product, [folder, inner]] of Object.entries(PRODUCTS)) {
    const from = layout === 'product' ? join(free, folder, inner) : join(free, product);
    if (!existsSync(from)) throw new Error(`the free output has no ${product}: ${free}`);
    mkdirSync(join(target, folder), {recursive: true});
    if (product === 'smart') cpSync(from, join(target, folder, inner), {recursive: true, dereference: true});
    else symlinkSync(realpathSync(from), join(target, folder, inner));
  }
  const smart = join(target, 'smart', 'smart');
  // What is written below must stay below: a link here would carry it out.
  if (lstatSync(smart).isSymbolicLink() || !realpathSync(smart).startsWith(`${realpathSync(target)}${sep}`)) {
    throw new Error(`${smart} is not a folder of its own; the set would be written into the free output`);
  }
  const links = linksUnder(smart);
  if (links.length) throw new Error(`${smart} holds links into the free output: ${links.slice(0, 3).join(', ')}`);
  for (const entry of readdirSync(join(built, 'smart'))) {
    const destination = join(smart, entry);
    if (existsSync(destination)) throw new Error(`the package output would replace the free smart/${entry}`);
    cpSync(join(built, 'smart', entry), destination, {recursive: true, dereference: true});
  }
  for (const {id, output} of required) {
    if (!existsSync(join(output, 'smart', 'rule.js'))) throw new Error(`the required set ${id} has no smart/rule.js: ${output}`);
    cpSync(join(output, 'smart'), join(smart, `set-${id}`), {recursive: true, dereference: true});
  }
  return {output: target, smart, smartParent: join(target, 'smart'), core: join(target, 'core')};
}
