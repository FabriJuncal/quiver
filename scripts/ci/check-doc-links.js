#!/usr/bin/env node

const path = require('node:path');
const cp = require('node:child_process');
const { collectDocsScope } = require('./docs-scope');

const repoRoot = path.resolve(__dirname, '..', '..');
const files = collectDocsScope(repoRoot);
// Run the package's JavaScript CLI without relying on platform-specific shims.
const bin = require.resolve('markdown-link-check/markdown-link-check');

if (files.length === 0) {
  console.error('No markdown files found in the configured docs link scope.');
  process.exit(1);
}

console.log(`Markdown link scope: ${files.length} files`);

const failed = [];
for (const file of files) {
  const result = cp.spawnSync(process.execPath, [bin, '-q', '-c', '.markdown-link-check.json', file], {
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
