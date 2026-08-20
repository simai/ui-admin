import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const requestedMode = process.argv[2] || 'dev';

if (!['dev', 'preview'].includes(requestedMode)) {
  throw new Error('Usage: node tests/run-browser-smoke.mjs [dev|preview]');
}

const child = spawn(
  process.execPath,
  ['--test', resolve('tests/admin-browser-smoke.test.mjs')],
  {
    env: {
      ...process.env,
      ADMIN_BROWSER_MODE: requestedMode,
    },
    stdio: 'inherit',
  },
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exitCode = code ?? 1;
});
