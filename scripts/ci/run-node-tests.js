#!/usr/bin/env node

const cp = require('node:child_process');

const args = ['--test', ...process.argv.slice(2)];
const result = cp.spawnSync(process.execPath, args, {
  shell: false,
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
