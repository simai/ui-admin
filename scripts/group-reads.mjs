// Do a host's group reads keep to one revision -- the record's?
//
// The kit (property-view-port 1.15.0) states it in two cases that need more
// than one call: two group reads with no save between them answer the
// revision record.load answers, and a group save sent with a revision a group
// read gave, after another group's save moved the record on, is a conflict
// naming the current one. The catalogue rows in check-port-conformance.mjs and
// check-polygon.mjs reach those answers and check their keys; neither can see
// whether the NUMBERS agree, and a host keeping a revision per group would pass
// every key check while letting a save through against a state somebody else
// has since changed. So this drives one host through the sequence and compares
// the numbers. Both checkers run it, over their own host and their own groups,
// because the reference and the polygon are two hosts a consumer can copy.

/**
 * @param host     a property-view host announcing `group-load`
 * @param target   { record_id, collection, first: [section, group] the panel
 *                 opens on, other: [section, group, values] a valid save of a
 *                 second group }
 * @returns a list of failures, empty when the host keeps to the record's revision
 */
export const checkGroupReads = async (host, { record_id, collection, first, other }) => {
  const failures = [];
  const fail = (said, extra = {}) => failures.push({ intent: 'group.load', said, ...extra });
  const base = { record_id, collection };

  const whole = await host.raise('record.load', { ...base, reason: 'connected' });
  const revision = whole?.record?.revision;
  if (whole?.answer !== 'applied' || revision === undefined) {
    fail('record.load did not answer a revision to compare the group reads with', { got: whole?.answer });
    return failures;
  }

  // The read the panel starts with names no group, and the answer names the
  // one it carries: the first group of the first section.
  const opening = await host.raise('group.load', { ...base, group: null, reason: 'connected' });
  if (opening?.answer !== 'applied' || opening.section !== first[0] || opening.group !== first[1]) {
    fail('a read without a group does not answer the first group of the first section',
      { expected: first, got: [opening?.section ?? null, opening?.group ?? null] });
  }

  // Two groups, one revision, the record's.
  const reads = [];
  for (const [section, group] of [first, other]) {
    const read = await host.raise('group.load', { ...base, section, group, reason: 'started' });
    reads.push(read);
    if (read?.answer !== 'applied') {
      fail('a group the record holds is not read', { group, got: read?.answer });
      continue;
    }
    if (String(read.revision) !== String(revision) || String(read.record?.revision) !== String(revision)) {
      fail("a group read answers a revision other than the record's", { group, record: revision, got: read.revision });
    }
    // Only the group asked for carries its fields; every group carries its
    // count, and the one carried agrees with it.
    for (const placed of read.record?.sections ?? []) {
      for (const item of placed.groups ?? []) {
        if (typeof item.field_count !== 'number') {
          fail('a group in a group read carries no field_count', { group, of: item.key });
        } else if (item.key === group && item.fields.length !== item.field_count) {
          fail('the group read carries a field count that is not its fields', { group });
        } else if (item.key !== group && item.fields.length) {
          fail('a group not asked for carries its fields', { group, of: item.key });
        }
      }
    }
  }

  // Another group's save moves the RECORD on: a save of the first group sent
  // with the revision its read gave is now a conflict naming the new one.
  const [section, group, values] = other;
  const saved = await host.raise('group.save', { ...base, section, group, values, revision });
  if (saved?.answer !== 'applied') {
    fail('the save that moves the record on was not applied', { intent: 'group.save', got: saved?.answer, reason: saved?.reason });
    return failures;
  }
  const moved = await host.raise('record.load', { ...base, reason: 'requested' });
  const current = moved?.record?.revision;
  if (String(current) === String(revision)) {
    fail('a group save did not move the record to a new revision', { intent: 'group.save' });
  }
  const stale = await host.raise('group.save', {
    ...base, section: first[0], group: first[1], values: {}, revision: reads[0]?.revision ?? revision,
  });
  if (stale?.answer !== 'conflict' || String(stale.revision) !== String(current)) {
    fail('a group save against the revision a group read gave, after another group moved the record, is not a conflict naming the current revision',
      { intent: 'group.save', got: stale?.answer, revision: stale?.revision ?? null, current });
  }
  const again = await host.raise('group.load', { ...base, section: first[0], group: first[1], reason: 'requested' });
  if (String(again?.revision) !== String(current)) {
    fail('a group read after the save answers an older revision than the record holds', { got: again?.revision, current });
  }
  return failures;
};
