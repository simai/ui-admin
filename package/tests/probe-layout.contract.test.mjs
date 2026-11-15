// The probe tooling reads the free SIMAI Framework it is given and never writes
// into it (scripts/probe-layout.mjs, used by scripts/run-browser-probes.mjs and
// scripts/run-manifest-probes.mjs). Until 2026-11-09 the browser runner copied
// smart/smart as a link when given a ui distr, and the set's rule.js landed in
// that distr. The script is this repository's (scripts/ is not in the overlay),
// read from SET_ROOT.
import assert from 'node:assert/strict';
import {existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, readlinkSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import test from 'node:test';

const setRoot = process.env.SET_ROOT;
const skip = !setRoot && 'SET_ROOT is not given';
const layout = async () => import(pathToFileURL(join(setRoot, 'scripts', 'probe-layout.mjs')).href);

const write = (path, text) => {
  mkdirSync(dirname(path), {recursive: true});
  writeFileSync(path, text);
};
// Every entry under a folder with what it is: a file's text, a link's target.
const state = (root, current = root) => readdirSync(current, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name)).flatMap((entry) => {
  const path = join(current, entry.name);
  const name = relative(root, path);
  if (entry.isSymbolicLink()) return [`${name} -> ${readlinkSync(path)}`];
  if (entry.isDirectory()) return [`${name}/`, ...state(root, path)];
  return [`${name} = ${readFileSync(path, 'utf8')}`];
});

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'admin-probe-layout-'));
  const distr = join(root, 'distr');
  write(join(distr, 'core', 'js', 'core.js'), 'core');
  write(join(distr, 'rule', 'core.rule.js'), 'rule');
  write(join(distr, 'component', 'button', 'button.css'), 'button');
  write(join(distr, 'smart', 'field-renderers', 'index.js'), 'renderers');
  write(join(distr, 'utility', 'spacing.css'), 'spacing');
  const built = join(root, 'built');
  write(join(built, 'smart', 'rule.js'), 'registerPackage("admin")');
  write(join(built, 'smart', 'admin-menu', 'index.js'), 'menu');
  const required = join(root, 'required');
  write(join(required, 'smart', 'rule.js'), 'registerPackage("editor")');
  write(join(required, 'smart', 'editor-content', 'index.js'), 'editor');
  return {root, distr, built, required};
}

test('given a ui distr, the layout writes nothing into it', {skip}, async () => {
  const {layProbeOutput, linksUnder} = await layout();
  const {root, distr, built, required} = fixture();
  try {
    const before = state(distr);
    const roots = layProbeOutput({free: distr, built, required: [{id: 'editor', output: required}], target: join(root, 'out')});
    assert.deepEqual(state(distr), before, 'the distr is unchanged');
    assert.equal(existsSync(join(distr, 'smart', 'rule.js')), false, 'no rule.js in the distr');
    assert.equal(readFileSync(join(roots.smart, 'rule.js'), 'utf8'), 'registerPackage("admin")');
    assert.equal(readFileSync(join(roots.smart, 'field-renderers', 'index.js'), 'utf8'), 'renderers');
    assert.equal(readFileSync(join(roots.smart, 'set-editor', 'rule.js'), 'utf8'), 'registerPackage("editor")');
    assert.equal(lstatSync(roots.smart).isSymbolicLink(), false);
    assert.deepEqual(linksUnder(roots.smart), []);
    assert.equal(readFileSync(join(roots.core, 'core', 'js', 'core.js'), 'utf8'), 'core');
    // A probe writing in the smart root stays in the layout.
    writeFileSync(join(roots.smart, 'probe-wrote.txt'), 'x');
    assert.deepEqual(state(distr), before);
    // Laid twice over the same distr: the second run meets no rule.js of the first.
    layProbeOutput({free: distr, built, target: join(root, 'out')});
    assert.deepEqual(state(distr), before);
  } finally {
    rmSync(root, {force: true, recursive: true});
  }
});

test('given a product root whose smart/smart links into a distr, the distr stays unwritten', {skip}, async () => {
  const {layProbeOutput} = await layout();
  const {root, distr, built} = fixture();
  try {
    // The shape run-browser-probes.mjs made of a distr before 2026-11-09.
    const product = join(root, 'product');
    for (const [product_, [folder, inner]] of Object.entries({core: ['core', 'core'], rule: ['core', 'rule'], component: ['component', 'component'], smart: ['smart', 'smart'], utility: ['utility', 'utility']})) {
      mkdirSync(join(product, folder), {recursive: true});
      symlinkSync(join(distr, product_), join(product, folder, inner));
    }
    const before = state(distr);
    const roots = layProbeOutput({free: product, built, target: join(root, 'out')});
    assert.deepEqual(state(distr), before);
    assert.equal(existsSync(join(roots.smart, 'rule.js')), true);
  } finally {
    rmSync(root, {force: true, recursive: true});
  }
});

test('a package folder never replaces a free one', {skip}, async () => {
  const {layProbeOutput} = await layout();
  const {root, distr, built} = fixture();
  try {
    write(join(built, 'smart', 'field-renderers', 'index.js'), 'shadow');
    const before = state(distr);
    assert.throws(() => layProbeOutput({free: distr, built, target: join(root, 'out')}), /would replace the free smart\/field-renderers/u);
    assert.deepEqual(state(distr), before);
  } finally {
    rmSync(root, {force: true, recursive: true});
  }
});

test('the probe runners lay their output through the one layout', {skip}, () => {
  for (const script of ['run-browser-probes.mjs', 'run-manifest-probes.mjs']) {
    const source = readFileSync(join(setRoot, 'scripts', script), 'utf8');
    assert.match(source, /import \{layProbeOutput\} from '\.\/probe-layout\.mjs';/u, script);
    assert.doesNotMatch(source, /\b(?:cpSync|symlinkSync)\b/u, `${script} copies or links nothing of its own`);
  }
});
