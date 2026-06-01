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
const hardcodedCommandErrorFiles = [
  'src/create-quiver/index.js',
  'src/create-quiver/commands/config.js',
  'src/create-quiver/commands/evidence.js',
  'src/create-quiver/commands/spec.js',
  'src/create-quiver/commands/graph.js',
  'src/create-quiver/commands/prepare.js',
  'src/create-quiver/commands/ai.js',
];
const hardcodedCommandErrorAllowlist = [
  {
    file: 'src/create-quiver/index.js',
    pattern: /formatError\('(?:missing|invalid) value for --[a-z-]+'\)/,
    reason: 'Generic parser flag errors are localized by localizeParserMessage before rendering.',
  },
  {
    file: 'src/create-quiver/index.js',
    pattern: /formatError\(`unknown flag: \$\{arg\}`\)/,
    reason: 'Generic unknown-flag errors are localized by localizeParserMessage before rendering.',
  },
  {
    file: 'src/create-quiver/index.js',
    pattern: /formatError\('(?:missing language for config language set|config language show does not accept a language value|--global is only supported by config language set|missing evidence subcommand|evidence run does not accept positional arguments before --|missing spec subcommand|spec create does not accept positional arguments|missing spec directory\. Use: npx create-quiver spec|prepare does not accept positional arguments|missing slice subcommand|missing handoff subcommand|missing handoff or brief path)/,
    reason: 'Targeted parser command errors are localized by localizeParserMessage exact-message mappings.',
  },
  {
    file: 'src/create-quiver/index.js',
    pattern: /formatError\(`unsupported (?:config|evidence|ai|slice|handoff)/,
    reason: 'Targeted parser command errors are localized by localizeParserMessage regex mappings.',
  },
  {
    file: 'src/create-quiver/index.js',
    pattern: /formatError\('(?:plan|flow|version|dashboard|ai|refresh-active-slices|demo|missing demo|too many)/,
    reason: 'Out of slice-01 targeted command set; covered by existing parser tests or future slices.',
  },
  {
    file: 'src/create-quiver/index.js',
    pattern: /formatError\(`(?:unsupported demo|pack output not found|docs-template already exists|missing package\.json|target directory does not exist|unsupported methodology|unsupported spec subcommand|\$\{requestedDashboardFlags)/,
    reason: 'Out of slice-01 targeted command set; owned by demo, init, migrate, doctor, or later namespace slices.',
  },
  {
    file: 'src/create-quiver/index.js',
    pattern: /formatError\('(?:migrate|init|doctor|missing handoff)/,
    reason: 'Write-command and handoff namespace messages are owned by later v46 slices.',
  },
  {
    file: 'src/create-quiver/commands/spec.js',
    pattern: /formatError\('spec create --interactive requires an interactive TTY/,
    reason: 'Accepted temporary exception; review/create errors are localized where user-facing review artifacts are emitted.',
  },
  {
    file: 'src/create-quiver/commands/ai.js',
    pattern: /formatError\('(?:ai repair-plan requires an approved technical-plan artifact|approved technical-plan already includes a valid structured)/,
    reason: 'AI repair-plan deep workflow errors are deferred to v48 AI command modularization.',
  },
  {
    file: 'src/create-quiver/commands/ai.js',
    pattern: /formatError\(`(?:missing input file|invalid timeout value|ai revise --phase|missing \$\{phase\} draft|\$\{phase\} draft version|ai repair-plan input must match|missing feedback input file for ai revise phase|missing input file for ai plan phase)/,
    reason: 'AI planner deep workflow errors are deferred to v48 AI command modularization.',
  },
];

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

test('command error audit blocks new non-allowlisted hardcoded errors', () => {
  const offenders = [];

  for (const relativeFile of hardcodedCommandErrorFiles) {
    const text = fs.readFileSync(path.join(repoRoot, relativeFile), 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const suspicious = /throw new Error\(formatError\((['"`])/.test(trimmed)
        || /throw new Error\((['"`])create-quiver:/.test(trimmed);
      if (!suspicious || trimmed.includes('translator.t(') || trimmed.includes('createTranslator(') || trimmed.includes('formatCatalogError(')) {
        return;
      }
      const allowed = hardcodedCommandErrorAllowlist.some((entry) => entry.file === relativeFile && entry.pattern.test(trimmed));
      if (!allowed) {
        offenders.push(`${relativeFile}:${index + 1}: ${trimmed}`);
      }
    });
  }

  assert.deepEqual(offenders, []);
});
