// The shared name registry's view of one set (standard simai.component-set
// 1.0.0, family-has-one-owner, names-start-with-owned-family), shared by
// tests/set-passport.contract.test.mjs and scripts/check-registry.mjs.
export function registryProblems(registry, passport) {
  const problems = [];
  const owner = registry.owners.find((entry) => entry.id === passport.id);
  if (!owner) return [`the registry has no owner ${passport.id}`];
  if (owner.kind !== 'set') problems.push(`owner ${passport.id} is a ${owner.kind}, not a set`);
  if (owner.repository !== passport.repository) problems.push(`owner ${passport.id} names ${owner.repository}`);
  if (JSON.stringify([...owner.families].sort()) !== JSON.stringify([...passport.families].sort())) {
    problems.push(`families: the registry gives ${owner.families.join(', ')}, the passport lists ${passport.families.join(', ')}`);
  }
  for (const family of passport.families) {
    const others = registry.owners.filter((entry) => entry.id !== passport.id && entry.families.includes(family));
    if (others.length) problems.push(`family ${family} is also owned by ${others.map((entry) => entry.id).join(', ')}`);
  }
  const names = new Set((owner.names ?? []).map((entry) => entry.element));
  for (const component of passport.components) {
    if (!names.has(component.element)) problems.push(`${component.element} is not a registered name of ${passport.id}`);
  }
  return problems;
}
