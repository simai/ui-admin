// The identity of a pinned component package: what the pin wrote and the
// materialiser recomputes, over the same stable serialisation, so a lock edited
// by hand is refused rather than served.
import { createHash } from 'node:crypto';

const stableJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

export const distributionIdentitySha256 = (lock) => createHash('sha256').update(stableJson({
  package: lock.package,
  requires: lock.requires,
  source: lock.source,
  archiveSha256: lock.archiveSha256,
  requiredFiles: lock.smart.requiredFiles,
})).digest('hex');
