const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  collectUnreleasedEntries,
  extractUnreleasedSection,
  runChangelogCheck,
} = require('../../scripts/ci/check-changelog');

function withTempChangelog(content, callback) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-changelog-'));
  try {
    fs.writeFileSync(path.join(repoRoot, 'CHANGELOG.md'), content);
    return callback(repoRoot);
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
}

test('extractUnreleasedSection returns only the current unreleased body', () => {
  const section = extractUnreleasedSection([
    '# Changelog',
    '',
    '## [Unreleased]',
    '',
    '### Added',
    '',
    '- Current entry.',
    '',
    '## [0.1.0] - 2026-01-01',
    '',
    '### Added',
    '',
    '- Old entry.',
  ].join('\n'));

  assert.match(section, /Current entry/);
  assert.doesNotMatch(section, /Old entry/);
});

test('collectUnreleasedEntries reads categorized changelog bullets', () => {
  const entries = collectUnreleasedEntries([
    '### Added',
    '',
    '- Added one thing.',
    '',
    '### Fixed',
    '',
    '- Fixed another thing.',
  ].join('\n'));

  assert.deepEqual(entries, [
    { category: 'Added', text: 'Added one thing.' },
    { category: 'Fixed', text: 'Fixed another thing.' },
  ]);
});

test('runChangelogCheck requires an unreleased section with entries', () => {
  withTempChangelog([
    '# Changelog',
    '',
    '## [Unreleased]',
    '',
    '### Changed',
    '',
    '- Documented release smoke gates.',
  ].join('\n'), (repoRoot) => {
    const report = runChangelogCheck({ repoRoot });
    assert.equal(report.ok, true, report.failures.join('\n'));
    assert.equal(report.entries.length, 1);
  });

  withTempChangelog('# Changelog\n\n## [0.1.0] - 2026-01-01\n', (repoRoot) => {
    const report = runChangelogCheck({ repoRoot });
    assert.equal(report.ok, false);
    assert.match(report.failures.join('\n'), /Unreleased/);
  });

  withTempChangelog('# Changelog\n\n## [Unreleased]\n\n### Added\n', (repoRoot) => {
    const report = runChangelogCheck({ repoRoot });
    assert.equal(report.ok, false);
    assert.match(report.failures.join('\n'), /categorized bullet/);
  });
});
