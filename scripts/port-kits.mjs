// Where a port and its conformance kit are found in a materialised runtime.
//
// They used to sit beside their component: `smart/property-view/port/<version>`.
// The Pro split moved them to `core/contracts/ports/<port id>/<version>`, which
// is where they belong -- a port is a statement about every host that answers
// it, and the components that answer these two now ship in a different
// repository from the port itself. Two scripts computed that path from a
// component name, so the move would have made both of them say «no port kit» in
// the same breath; the address is written here once, and keyed by the port's own
// id rather than by whichever component happens to implement it.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const PORT_ROOT = 'core/contracts/ports';

/** The port's directory inside a materialised runtime, or null. */
export const portDirectory = (runtime, portId) => {
  const root = join(runtime, PORT_ROOT, portId);
  return existsSync(root) ? root : null;
};

/** The newest version a runtime carries of a port, or null. */
export const newestVersion = (root) => readdirSync(root)
  .filter((name) => /^\d+\.\d+\.\d+$/u.test(name))
  .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
  .pop() ?? null;

/**
 * The newest kit for a port: {portId, version, root, manifest}, or null when
 * the runtime carries no kit for it.
 */
export const newestKit = (runtime, portId) => {
  const root = portDirectory(runtime, portId);
  if (!root) return null;
  const version = newestVersion(root);
  if (!version) return null;
  const kitRoot = join(root, version, 'kit');
  if (!existsSync(kitRoot)) return null;
  const manifestPath = join(kitRoot, 'manifest.json');
  if (!existsSync(manifestPath)) return null;
  return {
    portId,
    version,
    root: kitRoot,
    manifest: JSON.parse(readFileSync(manifestPath, 'utf8')),
  };
};
