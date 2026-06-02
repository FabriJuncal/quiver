#!/usr/bin/env node

const path = require('node:path');
const cp = require('node:child_process');
const { collectDocsScope } = require('./docs-scope');

const repoRoot = path.resolve(__dirname, '..', '..');
const files = collectDocsScope(repoRoot);
const bin = process.platform === 'win32'
  ? path.join(repoRoot, 'node_modules', '.bin', 'markdownlint-cli2.cmd')
  : path.join(repoRoot, 'node_modules', '.bin', 'markdownlint-cli2');

if (files.length === 0) {
  console.error('No markdown files found in the configured docs lint scope.');
  process.exit(1);
}

console.log(`Markdown lint scope: ${files.length} files`);
const result = cp.spawnSync(bin, files, {
  cwd: repoRoot,
  shell: false,
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
