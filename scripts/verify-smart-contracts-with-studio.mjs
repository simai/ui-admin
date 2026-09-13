#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const studio = path.resolve(root, process.env.SIMAI_UI_STUDIO_REPO || '../ui-studio');
const verifier = path.join(studio, 'checks/verify-consumer-parity.mjs');

execFileSync(process.execPath, [
  verifier,
  '--consumer', 'ui-admin',
  '--ui-admin-root', path.join(root, 'public/contracts'),
  '--source-registry', path.resolve(root, process.env.SIMAI_UI_SOURCE_REPO || process.env.SIMAI_UI_LOADER_REPO || '../ui-source', 'contracts/generated/smart-component-contract-registry.json')
], { cwd: studio, stdio: 'inherit' });
