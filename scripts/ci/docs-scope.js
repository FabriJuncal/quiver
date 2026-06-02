#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const ROOT_DOC_FILES = [
  '.github/pull_request_template.md',
  'ARCHITECTURE.md',
  'CONTRIBUTING.md',
  'README.md',
  'SECURITY.md',
  'docs/CLI_UX_GUIDE.md',
  'docs/GITFLOW_PR_GUIDE.md',
  'docs/INDEX.md',
  'docs/TROUBLESHOOTING.md',
  'docs/ai/PRINCIPLES.md',
];

const DOC_DIRECTORIES = [
  'docs/getting-started',
  'docs/reference',
  'docs/workflows',
];

function walkMarkdownFiles(repoRoot, relativeDir) {
  const directory = path.join(repoRoot, relativeDir);
  if (!fs.existsSync(directory)) {
    return [];
  }

  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const relativePath = path.posix.join(relativeDir, entry.name);
    const fullPath = path.join(repoRoot, relativePath);
    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(repoRoot, relativePath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(relativePath);
    }
  }
  return files;
}

function collectDocsScope(repoRoot) {
  const scoped = [
    ...ROOT_DOC_FILES.filter((filePath) => fs.existsSync(path.join(repoRoot, filePath))),
    ...DOC_DIRECTORIES.flatMap((directory) => walkMarkdownFiles(repoRoot, directory)),
  ];

  return [...new Set(scoped)].sort();
}

module.exports = {
  collectDocsScope,
  DOC_DIRECTORIES,
  ROOT_DOC_FILES,
};
