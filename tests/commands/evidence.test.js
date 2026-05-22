const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const cliPath = path.resolve(__dirname, '../../bin/create-quiver.js');
const { formatOutputPath } = require('../../src/create-quiver/commands/evidence');

function makeTmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-evidence-cli-test-'));
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

function runCli(args, options = {}) {
  return execFileSync(process.execPath, [cliPath, ...args], {
    cwd: options.cwd || path.resolve(__dirname, '../..'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function runCliFailure(args, options = {}) {
  try {
    runCli(args, options);
  } catch (error) {
    return error;
  }

  throw new Error('Expected CLI command to fail');
}

test('evidence run records successful command output', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const output = runCli([
      'evidence',
      'run',
      '--output',
      'success.md',
      '--max-output',
      '120',
      '--',
      process.execPath,
      '-e',
      'console.log("TOKEN=secret-value"); console.error("Authorization: Bearer bearer-secret")',
    ], { cwd: dir });
    const evidence = fs.readFileSync(path.join(dir, 'success.md'), 'utf8');

    assert.match(output, /Quiver evidence recorded/);
    assert.match(output, /Exit code: 0/);
    assert.match(output, /Output: success\.md/);
    assert.match(evidence, /Exit code: 0/);
    assert.match(evidence, /\[REDACTED\]/);
    assert.doesNotMatch(evidence, /secret-value/);
    assert.doesNotMatch(evidence, /bearer-secret/);
  } finally {
    cleanup();
  }
});

test('evidence run preserves failing command exit code', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const error = runCliFailure([
      'evidence',
      'run',
      '--output',
      'failure.md',
      '--',
      process.execPath,
      '-e',
      'console.error("failing command"); process.exit(7)',
    ], { cwd: dir });
    const evidence = fs.readFileSync(path.join(dir, 'failure.md'), 'utf8');

    assert.equal(error.status, 7);
    assert.match(String(error.stdout), /Exit code: 7/);
    assert.match(evidence, /Exit code: 7/);
    assert.match(evidence, /failing command/);
  } finally {
    cleanup();
  }
});

test('evidence run truncates long output', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    runCli([
      'evidence',
      'run',
      '--output',
      'truncated.md',
      '--max-output',
      '30',
      '--',
      process.execPath,
      '-e',
      `console.log("${'x'.repeat(100)}")`,
    ], { cwd: dir });
    const evidence = fs.readFileSync(path.join(dir, 'truncated.md'), 'utf8');

    assert.match(evidence, /Output truncated: yes/);
    assert.match(evidence, /\[\.\.\. truncated /);
  } finally {
    cleanup();
  }
});

test('evidence run requires a command after separator', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const error = runCliFailure(['evidence', 'run'], { cwd: dir });

    assert.equal(error.status, 1);
    assert.match(String(error.stderr), /evidence run requires a command after --/);
  } finally {
    cleanup();
  }
});

test('formatOutputPath keeps external outputs absolute', () => {
  const repoRoot = path.join(path.sep, 'repo');

  assert.equal(
    formatOutputPath(repoRoot, path.join(repoRoot, '.quiver', 'evidence', 'evidence.md')),
    '.quiver/evidence/evidence.md',
  );
  assert.equal(
    formatOutputPath(repoRoot, path.join(path.sep, 'private', 'tmp', 'evidence.md')),
    path.join(path.sep, 'private', 'tmp', 'evidence.md'),
  );
});
