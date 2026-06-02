#!/usr/bin/env node

const path = require('node:path');
const cp = require('node:child_process');
const { collectDocsScope } = require('./docs-scope');

const repoRoot = path.resolve(__dirname, '..', '..');
const files = collectDocsScope(repoRoot);
const bin = process.platform === 'win32'
  ? path.join(repoRoot, 'node_modules', '.bin', 'markdown-link-check.cmd')
  : path.join(repoRoot, 'node_modules', '.bin', 'markdown-link-check');

if (files.length === 0) {
  console.error('No markdown files found in the configured docs link scope.');
  process.exit(1);
}

console.log(`Markdown link scope: ${files.length} files`);

const failed = [];
for (const file of files) {
  const result = cp.spawnSync(bin, ['-q', '-c', '.markdown-link-check.json', file], {
    cwd: repoRoot,
    shell: false,
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    failed.push(file);
  }
}

if (failed.length > 0) {
  console.error(`Markdown link check failed for ${failed.length} file(s):`);
  for (const file of failed) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}
