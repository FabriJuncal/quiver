#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_CHANGELOG_PATH = 'CHANGELOG.md';
const RELEASE_HEADING_RE = /^## \[[^\]]+\](?:\s+-\s+\d{4}-\d{2}-\d{2})?\s*$/m;
const UNRELEASED_HEADING_RE = /^## \[Unreleased\]\s*$/m;
const CHANGE_CATEGORY_RE = /^### (Added|Changed|Deprecated|Removed|Fixed|Security)\s*$/;

function repoRootFromScript() {
  return path.resolve(__dirname, '..', '..');
}

function extractUnreleasedSection(changelog) {
  const match = changelog.match(UNRELEASED_HEADING_RE);
  if (!match || typeof match.index !== 'number') {
    return null;
  }

  const start = match.index + match[0].length;
  const remaining = changelog.slice(start);
  const nextRelease = remaining.match(RELEASE_HEADING_RE);
  const end = nextRelease && typeof nextRelease.index === 'number'
    ? start + nextRelease.index
    : changelog.length;

  return changelog.slice(start, end);
}

function collectUnreleasedEntries(section) {
  const entries = [];
  let currentCategory = null;

  for (const line of String(section || '').split(/\r?\n/)) {
    const categoryMatch = line.match(CHANGE_CATEGORY_RE);
    if (categoryMatch) {
      currentCategory = categoryMatch[1];
      continue;
    }

    if (currentCategory && /^-\s+\S/.test(line)) {
      entries.push({
        category: currentCategory,
        text: line.replace(/^-\s+/, '').trim(),
      });
    }
  }

  return entries;
}

function runChangelogCheck(options = {}) {
  const repoRoot = options.repoRoot || repoRootFromScript();
  const changelogPath = options.changelogPath || DEFAULT_CHANGELOG_PATH;
  const fullPath = path.join(repoRoot, changelogPath);
  const failures = [];

  if (!fs.existsSync(fullPath)) {
    return {
      ok: false,
      changelogPath,
      entries: [],
      failures: [`${changelogPath} is missing.`],
    };
  }

  const changelog = fs.readFileSync(fullPath, 'utf8');
  const section = extractUnreleasedSection(changelog);
  if (section === null) {
    failures.push(`${changelogPath} must include a "## [Unreleased]" section.`);
  }

  const entries = collectUnreleasedEntries(section || '');
  if (section !== null && entries.length === 0) {
    failures.push('[Unreleased] must include at least one categorized bullet entry.');
  }

  return {
    ok: failures.length === 0,
    changelogPath,
    entries,
    failures,
  };
}

function formatReport(report) {
  const lines = [
    'Changelog validation',
    `File: ${report.changelogPath}`,
    `Unreleased entries: ${report.entries.length}`,
  ];

  if (report.failures.length > 0) {
    lines.push('Failures:');
    for (const failure of report.failures) {
      lines.push(`- ${failure}`);
    }
  }

  lines.push(report.ok ? 'PASS: changelog validation passed.' : 'FAIL: changelog validation failed.');
  return `${lines.join('\n')}\n`;
}

if (require.main === module) {
  const report = runChangelogCheck();
  process.stdout.write(formatReport(report));
  if (!report.ok) {
    process.exit(1);
  }
}

module.exports = {
  collectUnreleasedEntries,
  extractUnreleasedSection,
  runChangelogCheck,
};
