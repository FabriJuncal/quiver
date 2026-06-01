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

test('evidence run supports Spanish human output without translating command or path', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const output = runCli([
      '--lang',
      'es',
      'evidence',
      'run',
      '--output',
      'exito.md',
      '--',
      process.execPath,
      '-e',
      'console.log("ok")',
    ], { cwd: dir });

    assert.match(output, /Evidencia de Quiver registrada/);
    assert.match(output, /Comando: .*node/);
    assert.match(output, /Codigo de salida: 0/);
    assert.match(output, /Salida: exito\.md/);
    assert.equal(fs.existsSync(path.join(dir, 'exito.md')), true);
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

test('evidence list and show browse generated evidence safely', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    runCli([
      'evidence',
      'run',
      '--output',
      '.quiver/evidence/first.md',
      '--',
      process.execPath,
      '-e',
      'console.log("first")',
    ], { cwd: dir });
    runCli([
      'evidence',
      'run',
      '--output',
      '.quiver/evidence/second.md',
      '--',
      process.execPath,
      '-e',
      'console.log("second")',
    ], { cwd: dir });
    fs.utimesSync(path.join(dir, '.quiver/evidence/first.md'), new Date('2026-05-22T10:00:00.000Z'), new Date('2026-05-22T10:00:00.000Z'));
    fs.utimesSync(path.join(dir, '.quiver/evidence/second.md'), new Date('2026-05-22T11:00:00.000Z'), new Date('2026-05-22T11:00:00.000Z'));

    const listOutput = runCli(['evidence', 'list'], { cwd: dir });
    const jsonOutput = runCli(['evidence', 'list', '--json'], { cwd: dir });
    const parsed = JSON.parse(jsonOutput);
    const showOutput = runCli(['evidence', 'show', '.quiver/evidence/second.md'], { cwd: dir });

    assert.match(listOutput, /Quiver evidence artifacts/);
    assert.ok(listOutput.indexOf('second.md') < listOutput.indexOf('first.md'));
    assert.equal(parsed.schema_version, 1);
    assert.deepEqual(parsed.items.map((item) => item.path), [
      '.quiver/evidence/second.md',
      '.quiver/evidence/first.md',
    ]);
    assert.match(showOutput, /Command: `.*node/);
    assert.match(showOutput, /second/);
  } finally {
    cleanup();
  }
});

test('evidence show rejects unsafe paths', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    fs.mkdirSync(path.join(dir, '.quiver', 'evidence'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.quiver', 'evidence', 'safe.md'), '# Safe\n');
    fs.writeFileSync(path.join(dir, 'outside.md'), '# Outside\n');

    const error = runCliFailure(['evidence', 'show', 'outside.md'], { cwd: dir });

    assert.equal(error.status, 1);
    assert.match(String(error.stderr), /evidence path must stay inside \.quiver\/evidence/);
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

test('evidence command errors localize in Spanish', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const missingCommand = runCliFailure(['--lang', 'es', 'evidence', 'run'], { cwd: dir });
    const missingSubcommand = runCliFailure(['--lang', 'es', 'evidence'], { cwd: dir });

    assert.equal(missingCommand.status, 1);
    assert.match(String(missingCommand.stderr), /create-quiver: evidence run requiere un comando despues de --/);
    assert.equal(missingSubcommand.status, 1);
    assert.match(String(missingSubcommand.stderr), /create-quiver: falta el subcomando evidence/);
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
