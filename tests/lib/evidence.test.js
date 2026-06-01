const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  defaultEvidencePath,
  listEvidenceArtifacts,
  redactSecrets,
  readEvidenceArtifact,
  runEvidenceCommand,
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

test('listEvidenceArtifacts returns markdown evidence in stable newest-first order', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const evidenceDir = path.join(dir, '.quiver', 'evidence');
    fs.mkdirSync(evidenceDir, { recursive: true });
    const older = path.join(evidenceDir, 'older.md');
    const newer = path.join(evidenceDir, 'newer.md');
    const ignored = path.join(evidenceDir, 'ignored.txt');
    fs.writeFileSync(older, '# Older\n');
    fs.writeFileSync(newer, '# Newer\n');
    fs.writeFileSync(ignored, 'ignore');
    fs.utimesSync(older, new Date('2026-05-22T10:00:00.000Z'), new Date('2026-05-22T10:00:00.000Z'));
    fs.utimesSync(newer, new Date('2026-05-22T11:00:00.000Z'), new Date('2026-05-22T11:00:00.000Z'));

    const artifacts = listEvidenceArtifacts(dir);

    assert.deepEqual(artifacts.map((artifact) => artifact.path), [
      '.quiver/evidence/newer.md',
      '.quiver/evidence/older.md',
    ]);
  } finally {
    cleanup();
  }
});

test('readEvidenceArtifact rejects traversal and non-evidence paths', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    fs.mkdirSync(path.join(dir, '.quiver', 'evidence'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.quiver', 'evidence', 'safe.md'), '# Safe\n');
    fs.writeFileSync(path.join(dir, 'outside.md'), '# Outside\n');

    const artifact = readEvidenceArtifact(dir, '.quiver/evidence/safe.md');

    assert.equal(artifact.relativePath, '.quiver/evidence/safe.md');
    assert.equal(artifact.content, '# Safe\n');
    assert.throws(
      () => readEvidenceArtifact(dir, '../outside.md'),
      /evidence artifact not found|evidence path must stay inside/,
    );
    assert.throws(
      () => readEvidenceArtifact(dir, 'outside.md'),
      /evidence path must stay inside/,
    );
  } finally {
    cleanup();
  }
});
