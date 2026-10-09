#!/usr/bin/env node

const path = require('node:path');
const cp = require('node:child_process');
const { collectDocsScope } = require('./docs-scope');

const repoRoot = path.resolve(__dirname, '..', '..');
const files = collectDocsScope(repoRoot);
// Invoke the JavaScript entrypoint directly; Windows .cmd shims need a shell.
const bin = path.join(path.dirname(require.resolve('markdownlint-cli2')), 'markdownlint-cli2-bin.mjs');

if (files.length === 0) {
  console.error('No markdown files found in the configured docs lint scope.');
  process.exit(1);
}

console.log(`Markdown lint scope: ${files.length} files`);
const result = cp.spawnSync(process.execPath, [bin, ...files], {
  cwd: repoRoot,
  shell: false,
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
