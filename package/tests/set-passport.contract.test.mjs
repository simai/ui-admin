import assert from 'node:assert/strict';
import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import test from 'node:test';

import {registryProblems} from './set-registry.mjs';

// The set's passport (standard simai.component-set 1.0.0, passport-form,
// set-describes-its-components, names-start-with-owned-family,
// family-has-one-owner): set.json against the passport schema of the pinned
// SIMAI Framework, against this folder's components and against the shared name
// registry at the pinned revision. scripts/check-registry.mjs holds the same
// passport against the registry at simai/ui-source main, which the standard
// names as the registry a set checks against.
//
// It runs in the overlay (scripts/test.mjs), which holds src/, tests/ and docs/
// of the set; the passport and the lock come from SET_ROOT.

const overlay = new URL('../', import.meta.url);
const setRoot = process.env.SET_ROOT;
const json = (path) => JSON.parse(readFileSync(path, 'utf8'));
const fromOverlay = (relative) => json(new URL(relative, overlay));

const PRO_SPDX = 'PolyForm-Small-Business-1.0.0 OR PolyForm-Noncommercial-1.0.0 OR LicenseRef-SIMAI-Commercial';
const LICENCES = {'simai-pro': PRO_SPDX, framework: 'Apache-2.0'};
const familyOf = (element) => element.split('-')[1];

// The subset of JSON Schema 2020-12 the passport schema uses, checked without a
// schema runtime, as ui-source tests/component-set.contract.test.mjs does.
function validate(schema, value, where = '$', defs = schema.$defs ?? {}) {
  const errors = [];
  if (schema.$ref) return validate(defs[schema.$ref.replace('#/$defs/', '')], value, where, defs);
  if ('const' in schema && value !== schema.const) errors.push(`${where}: must be ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${where}: must be one of ${schema.enum.join(', ')}`);
  if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return [...errors, `${where}: must be an object`];
    for (const key of schema.required ?? []) if (!(key in value)) errors.push(`${where}: ${key} is required`);
    for (const [key, entry] of Object.entries(value)) {
      const property = schema.properties?.[key];
      if (property) errors.push(...validate(property, entry, `${where}.${key}`, defs));
      else if (schema.additionalProperties === false) errors.push(`${where}: unknown key ${key}`);
    }
  }
  if (schema.type === 'array') {
    if (!Array.isArray(value)) return [...errors, `${where}: must be an array`];
    if (schema.minItems && value.length < schema.minItems) errors.push(`${where}: at least ${schema.minItems}`);
    if (schema.uniqueItems && new Set(value.map((entry) => JSON.stringify(entry))).size !== value.length) errors.push(`${where}: items repeat`);
    value.forEach((entry, index) => errors.push(...validate(schema.items ?? {}, entry, `${where}[${index}]`, defs)));
  }
  if (schema.type === 'string') {
    if (typeof value !== 'string') return [...errors, `${where}: must be a string`];
    if (schema.minLength && value.length < schema.minLength) errors.push(`${where}: too short`);
    if (schema.pattern && !new RegExp(schema.pattern, 'u').test(value)) errors.push(`${where}: ${value} does not match ${schema.pattern}`);
  }
  return errors;
}

test('the passport takes the form the pinned SIMAI Framework gives', {skip: !setRoot && 'SET_ROOT is not given'}, () => {
  const passport = json(join(setRoot, 'set.json'));
  assert.deepEqual(validate(fromOverlay('contracts/schema/component-set.v1.schema.json'), passport), []);
  assert.equal(passport.repository, `simai/ui-${passport.id}`, 'the set id is the repository name without ui-');
  assert.equal(passport.licence.spdx, LICENCES[passport.licence.class], 'the licence class names its expression');
  assert.equal(json(join(setRoot, 'package.json')).license, passport.licence.spdx, 'package.json carries the same expression');
  assert.equal(json(join(setRoot, 'package.json')).name, `@simai-studio/${passport.id}`);
  const lock = json(join(setRoot, 'framework.lock.json'));
  assert.equal(lock.package, passport.id);
  assert.equal(lock.source.revision, passport.framework.source_revision, 'the passport and the lock name one SIMAI Framework revision');
  assert.equal(passport.release, undefined, 'the release block is written by the release route, not in the source');
});

test('the passport lists every component of the set and only them', {skip: !setRoot && 'SET_ROOT is not given'}, () => {
  const passport = json(join(setRoot, 'set.json'));
  const folders = readdirSync(join(setRoot, 'src', 'smart'), {withFileTypes: true}).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  assert.deepEqual(passport.components.map((component) => component.folder).sort(), folders);
  for (const component of passport.components) {
    const where = new URL(`src/smart/${component.folder}/`, overlay);
    const manifest = json(new URL('component.json', where));
    assert.equal(manifest.tag, component.element, `${component.folder}: the element is the manifest's tag`);
    assert.equal(component.rule, `cl-${component.folder}`);
    assert.ok(passport.families.includes(familyOf(component.element)), `${component.element} starts with an owned family`);
    // The rule file carries the rule, the element and its former tags.
    const rule = readFileSync(new URL('rule.js', where), 'utf8');
    assert.match(rule, new RegExp(`SF\\.RuleLoader\\['${component.rule}'\\]`, 'u'));
    const tags = /tags: \[([^\]]*)\]/u.exec(rule)[1].split(',').map((tag) => tag.trim().replace(/'/gu, '')).filter(Boolean);
    assert.deepEqual(tags, [component.element, ...(component.element_aliases ?? []).map((alias) => alias.from)]);
    // requires: every cl- relation of the rule, nothing else.
    const relations = [...rule.matchAll(/\{ name: '(cl-[a-z0-9-]+)'/gu)].map((match) => match[1]).filter((name) => name !== component.rule);
    assert.deepEqual([...component.requires].sort(), [...new Set(relations)].sort(), `${component.element}: requires is the rule's relations`);
    // A former tag is the one aliases.json dates, with the same dates.
    // A component with no former names has no aliases.json (the generator writes
    // one only for an aliases block): it has no former tag either.
    const aliasFile = new URL('aliases.json', where);
    const dated = (existsSync(aliasFile) ? json(aliasFile).aliases : []).filter((alias) => alias.kind === 'tag');
    assert.deepEqual((component.element_aliases ?? []).map(({from, since, remove_after: removeAfter}) => ({from, since, removeAfter})),
      dated.map(({from, since, remove_after: removeAfter}) => ({from, since, removeAfter})));
  }
});

test('the registry at the pinned revision gives the set its family and names', {skip: !setRoot && 'SET_ROOT is not given'}, () => {
  const passport = json(join(setRoot, 'set.json'));
  const registry = fromOverlay('contracts/registry/names.json');
  assert.deepEqual(registryProblems(registry, passport), []);
  // Each relation names a rule of this set, of a set it requires (a name the
  // registry gives that set's owner) or of SIMAI Framework (the free rule
  // exists in the overlay).
  const own = new Set(passport.components.map((component) => component.rule));
  const required = new Set((passport.requires_sets ?? []).map(({id}) => id));
  const ofRequired = new Set(registry.owners
    .filter((owner) => owner.kind === 'set' && required.has(owner.id))
    .flatMap((owner) => owner.names.map(({element}) => `cl-${element.slice(3)}`)));
  for (const component of passport.components) {
    for (const rule of component.requires.filter((name) => !own.has(name) && !ofRequired.has(name))) {
      const folder = rule.slice(3);
      assert.ok(existsSync(new URL(`src/smart/${folder}/rule.js`, overlay)) || existsSync(new URL(`src/component/${folder}`, overlay)),
        `${component.element} needs ${rule}, which neither the pinned SIMAI Framework nor a required set holds`);
    }
  }
});
