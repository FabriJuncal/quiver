const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const { parseChangelog, readChangelog } = require('../../src/create-quiver/commands/changelog');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function runCli(args, options = {}) {
  return execFileSync(process.execPath, [BIN_PATH, ...args], {
    cwd: options.cwd || path.resolve(__dirname, '../..'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function makeTmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-changelog-'));
  return {
    dir,
    cleanup() {
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}

test('changelog command reads local changelog content without network access', () => {
  const output = runCli(['changelog']);

  assert.match(output, /Quiver changelog/);
  assert.match(output, /Unreleased/);
  assert.match(output, /0\.14\.1|0\.14\.0|0\.13\.0/);
});

test('changelog --json emits parseable local entries', () => {
  const parsed = JSON.parse(runCli(['changelog', '--json']));

  assert.equal(parsed.schema_version, 1);
  assert.equal(parsed.missing, false);
  assert.ok(parsed.source.endsWith('CHANGELOG.md'));
  assert.ok(parsed.entries.length > 0);
  assert.equal(parsed.entries[0].version, 'Unreleased');
});

test('parseChangelog handles missing release entries as malformed local content', () => {
  assert.deepEqual(parseChangelog('# Changelog\n\nNo releases yet.\n'), []);
});

test('readChangelog reports missing local changelog without throwing', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const report = readChangelog(dir);

    assert.equal(report.missing, true);
    assert.deepEqual(report.entries, []);
  } finally {
    cleanup();
  }
});
