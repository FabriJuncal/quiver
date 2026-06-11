const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  byteLength,
  limitRawProviderStream,
  writeRawProviderArtifact,
} = require('../../src/create-quiver/lib/ai/artifacts');

test('limitRawProviderStream preserves head, tail, hash, and byte cap', () => {
  const input = `head-line\n${'middle-secret-value\n'.repeat(80)}tail-line\n`;
  const limited = limitRawProviderStream(input, { maxBytes: 420 });

  assert.equal(limited.metadata.truncated, true);
  assert.equal(limited.metadata.bytes, byteLength(input));
  assert.equal(limited.metadata.stored_bytes <= 420, true);
  assert.match(limited.text, /head-line/);
  assert.match(limited.text, /tail-line/);
  assert.match(limited.text, /sha256=[a-f0-9]{64}/);
});

test('writeRawProviderArtifact stores redacted and size-controlled provider streams', () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-artifacts-'));
  try {
    const written = writeRawProviderArtifact(repoRoot, 'run-artifacts', 'provider-output', {
      ok: true,
      provider: 'codex',
      command: 'codex',
      args: ['exec'],
      cwd: repoRoot,
      stdout: `Authorization: Bearer ${'a'.repeat(32)}\n${'x'.repeat(1000)}\nTAIL\n`,
      stderr: '',
      exitCode: 0,
    }, {
      now: new Date('2026-06-11T12:00:00.000Z'),
      maxRawProviderStreamBytes: 360,
    });

    assert.equal(written.path, '.quiver/runs/run-artifacts/raw/2026-06-11t12-00-00z-provider-output.json');
    const artifact = JSON.parse(fs.readFileSync(path.join(repoRoot, written.path), 'utf8'));
    assert.equal(artifact.kind, 'provider-output');
    assert.equal(artifact.streams.stdout.truncated, true);
    assert.equal(artifact.streams.stdout.stored_bytes <= 360, true);
    assert.equal(artifact.stdout.includes('a'.repeat(32)), false);
    assert.match(artifact.stdout, /\[REDACTED\]/);
    assert.match(artifact.stdout, /TAIL/);
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
});
