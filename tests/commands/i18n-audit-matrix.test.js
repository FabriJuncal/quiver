const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const referencePath = path.join(repoRoot, 'docs/reference/commands.md');
const matrixPath = path.join(
  repoRoot,
  'specs/quiver-v43-cli-i18n-audit-release-readiness/command-language-mode-matrix.json',
);

function documentedCommands() {
  const text = fs.readFileSync(referencePath, 'utf8');
  const regex = /`npx --yes create-quiver@latest ([^`]+?)`/g;
  const commands = new Set();
  let match;
  while ((match = regex.exec(text))) {
    commands.add(match[1].trim().replace(/\s+/g, ' '));
  }
  return [...commands];
}

test('v43 i18n audit matrix covers every documented command', () => {
  const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
  const expected = documentedCommands();
  const actual = matrix.commands.map((entry) => entry.command);

  assert.equal(matrix.schema_version, 1);
  assert.equal(matrix.source, 'docs/reference/commands.md');
  assert.equal(matrix.status, 'pass');
  assert.deepEqual(new Set(actual), new Set(expected));
  assert.equal(actual.length, new Set(actual).size);
  assert.equal(actual.length, expected.length);
});

test('v43 i18n audit matrix records actionable mode and exception status', () => {
  const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
  const allowedModeStatuses = new Set([
    'pass',
    'not_applicable',
    'not_supported',
    'accepted_exception',
  ]);
  const requiredModes = ['en_human', 'es_human', 'json', 'dry_run', 'interactive', 'review', 'ci_no_tty', 'no_color'];

  for (const [profileName, profile] of Object.entries(matrix.coverage_profiles)) {
    assert.ok(profile.modes, `${profileName} must declare modes`);
    for (const mode of requiredModes) {
      assert.ok(mode in profile.modes, `${profileName} missing mode ${mode}`);
    }
    for (const [mode, status] of Object.entries(profile.modes)) {
      assert.ok(allowedModeStatuses.has(status), `${profileName}.${mode} has unsupported status ${status}`);
    }
    assert.ok(Array.isArray(profile.evidence), `${profileName} must declare evidence`);
    assert.ok(profile.evidence.length > 0, `${profileName} must include evidence`);
  }

  for (const entry of matrix.commands) {
    assert.ok(matrix.coverage_profiles[entry.profile], `${entry.command} references missing profile ${entry.profile}`);
    assert.equal(entry.critical, 'pass', `${entry.command} must not be a release blocker`);
  }

  assert.ok(Array.isArray(matrix.accepted_exceptions));
  for (const exception of matrix.accepted_exceptions) {
    assert.equal(exception.status, 'accepted');
    assert.ok(exception.owner);
    assert.ok(exception.reason);
    assert.ok(exception.follow_up);
  }
});
