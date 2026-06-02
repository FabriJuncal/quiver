const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  defaultEvidencePath,
  listEvidenceFiles,
  redactSecrets,
  resolveEvidenceOutputPath,
  resolveEvidenceReadPath,
  runEvidenceCommand,
  showEvidenceFile,
  signalExitCode,
  truncateText,
} = require('../../src/create-quiver/lib/evidence');

function makeTmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-evidence-lib-test-'));
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

test('redactSecrets removes common token and password patterns', () => {
  const output = redactSecrets([
    'Authorization: Bearer abc123',
    'TOKEN=secret-value',
    'api_key: key-value',
    'password=hunter2',
    'npm_123456789012345678901234',
  ].join('\n'));

  assert.doesNotMatch(output, /abc123/);
  assert.doesNotMatch(output, /secret-value/);
  assert.doesNotMatch(output, /key-value/);
  assert.doesNotMatch(output, /hunter2/);
  assert.match(output, /\[REDACTED\]/);
  assert.match(output, /\[REDACTED_NPM_TOKEN\]/);
});

test('truncateText marks long output without changing short output', () => {
  assert.deepEqual(truncateText('short', 10), { text: 'short', truncated: false });

  const result = truncateText('abcdefghijklmnopqrstuvwxyz', 5);

  assert.equal(result.truncated, true);
  assert.match(result.text, /^abcde/);
  assert.match(result.text, /\[\.\.\. truncated 21 chars \.\.\.\]/);
});

test('defaultEvidencePath writes under .quiver evidence', () => {
  const evidencePath = defaultEvidencePath('/repo', new Date('2026-05-22T12:34:56.000Z'));

  assert.equal(evidencePath, path.join('/repo', '.quiver', 'evidence', 'evidence-20260522T123456Z.md'));
});

test('runEvidenceCommand records redacted and truncated output', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const result = runEvidenceCommand(dir, ['npm', 'test'], {
      maxOutput: 45,
      outputPath: 'evidence.md',
      spawnSync(command, args, options) {
        assert.equal(command, 'npm');
        assert.deepEqual(args, ['test']);
        assert.equal(options.cwd, dir);
        assert.equal(options.shell, false);

        return {
          status: 0,
          stdout: `TOKEN=very-secret-value\n${'x'.repeat(80)}`,
          stderr: 'Authorization: Bearer bearer-secret\n',
        };
      },
    });

    const content = fs.readFileSync(path.join(dir, 'evidence.md'), 'utf8');

    assert.equal(result.exitCode, 0);
    assert.equal(result.outputPath, path.join(dir, 'evidence.md'));
    assert.equal(result.record.output_truncated, true);
    assert.match(content, /Command: `npm test`/);
    assert.match(content, /Exit code: 0/);
    assert.match(content, /\[REDACTED\]/);
    assert.match(content, /\[\.\.\. truncated /);
    assert.doesNotMatch(content, /very-secret-value/);
    assert.doesNotMatch(content, /bearer-secret/);
  } finally {
    cleanup();
  }
});

test('runEvidenceCommand rejects traversal output before spawning child', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    let spawned = false;
    assert.throws(
      () => runEvidenceCommand(dir, ['npm', 'test'], {
        outputPath: '../escape.md',
        spawnSync() {
          spawned = true;
          return { status: 0, stdout: '', stderr: '' };
        },
      }),
      /evidence output path must stay inside the project root/,
    );
    assert.equal(spawned, false);
  } finally {
    cleanup();
  }
});

test('evidence path policy rejects symlink output and read escapes', () => {
  const { dir, cleanup } = makeTmpDir();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-evidence-outside-'));
  try {
    const linkDir = path.join(dir, 'linked');
    fs.symlinkSync(outside, linkDir, 'dir');
    assert.throws(
      () => resolveEvidenceOutputPath(dir, path.join('linked', 'escape.md')),
      /must stay inside the project root/,
    );

    const outsideFile = path.join(outside, 'outside.md');
    fs.writeFileSync(outsideFile, '# outside\n');
    const linkFile = path.join(dir, 'linked-file.md');
    fs.symlinkSync(outsideFile, linkFile);
    assert.throws(
      () => resolveEvidenceReadPath(dir, 'linked-file.md'),
      /must stay inside the project root/,
    );
  } finally {
    cleanup();
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

test('runEvidenceCommand records signal metadata and signal exit code', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const result = runEvidenceCommand(dir, ['node', 'script.js'], {
      outputPath: 'signal.md',
      spawnSync() {
        return {
          signal: 'SIGTERM',
          status: null,
          stdout: 'partial output',
          stderr: 'terminated',
        };
      },
    });
    const content = fs.readFileSync(path.join(dir, 'signal.md'), 'utf8');

    assert.equal(signalExitCode('SIGTERM'), 143);
    assert.equal(result.exitCode, 143);
    assert.equal(result.record.signal, 'SIGTERM');
    assert.match(content, /Signal: SIGTERM/);
    assert.match(content, /Exit code: 143/);
    assert.match(content, /partial output/);
  } finally {
    cleanup();
  }
});

test('listEvidenceFiles and showEvidenceFile return parseable safe records', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    runEvidenceCommand(dir, ['npm', 'test'], {
      outputPath: path.join('.quiver', 'evidence', 'one.md'),
      spawnSync() {
        return {
          status: 0,
          stdout: 'ok',
          stderr: '',
        };
      },
    });

    const list = listEvidenceFiles(dir);
    const shown = showEvidenceFile(dir, '.quiver/evidence/one.md');

    assert.equal(list.length, 1);
    assert.equal(list[0].path, '.quiver/evidence/one.md');
    assert.equal(list[0].command, 'npm test');
    assert.equal(list[0].exit_code, 0);
    assert.equal(shown.path, '.quiver/evidence/one.md');
    assert.equal(shown.record.command, 'npm test');
    assert.match(shown.content, /# Quiver Evidence/);
  } finally {
    cleanup();
  }
});
