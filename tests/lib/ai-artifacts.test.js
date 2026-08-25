const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  byteLength,
  limitRawProviderStream,
  redactSensitiveValue,
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

test('redactSensitiveValue recursively redacts structured secrets without mutating input', () => {
  const input = {
    apiKey: 'api-key-value',
    nested: {
      authorization: 'Bearer nested-secret',
      credentials: { user: 'octocat', password: 'nested-password' },
      secrets: ['one', 'two'],
      note: 'token=inline-value',
      prompt_tokens: 42,
    },
    args: ['exec', '--token=argument-value'],
  };

  const redacted = redactSensitiveValue(input);

  assert.deepEqual(redacted, {
    apiKey: '[REDACTED]',
    nested: {
      authorization: '[REDACTED]',
      credentials: '[REDACTED]',
      secrets: '[REDACTED]',
      note: 'token=[REDACTED]',
      prompt_tokens: 42,
    },
    args: ['exec', '--token=[REDACTED]'],
  });
  assert.equal(input.apiKey, 'api-key-value');
  assert.equal(input.nested.note, 'token=inline-value');
  assert.equal(input.args[1], '--token=argument-value');
});

test('writeRawProviderArtifact stores redacted and size-controlled provider streams', () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-artifacts-'));
  const metadata = {
    access_token: 'metadata-token-value',
    nested: {
      clientSecret: 'metadata-secret-value',
      source_path: repoRoot,
      prompt_tokens: 64,
    },
  };
  try {
    const written = writeRawProviderArtifact(repoRoot, 'run-artifacts', 'provider-output', {
      ok: true,
      provider: 'codex',
      command: path.join(repoRoot, 'bin/provider'),
      args: ['exec', '--token=argument-value', repoRoot],
      cwd: repoRoot,
      stdout: `Authorization: Bearer ${'a'.repeat(32)}\n${'x'.repeat(1000)}\nTAIL\n`,
      stderr: '',
      promptTransport: {
        mode: 'temp-file',
        filePath: path.join(repoRoot, 'token=prompt-secret', 'prompt.txt'),
      },
      exitCode: 0,
    }, {
      metadata,
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
    assert.equal(artifact.command, '[PROJECT_ROOT]/bin/provider');
    assert.deepEqual(artifact.args, ['exec', '--token=[REDACTED]', '[PROJECT_ROOT]']);
    assert.deepEqual(artifact.prompt_transport, {
      mode: 'temp-file',
      filePath: '[PROJECT_ROOT]/token=[REDACTED]',
    });
    assert.deepEqual(artifact.metadata, {
      access_token: '[REDACTED]',
      nested: {
        clientSecret: '[REDACTED]',
        source_path: '[PROJECT_ROOT]',
        prompt_tokens: 64,
      },
    });
    assert.equal(metadata.access_token, 'metadata-token-value');
    assert.equal(metadata.nested.source_path, repoRoot);

    const second = writeRawProviderArtifact(repoRoot, 'run-artifacts', 'provider-output', {
      ok: true,
      provider: 'codex',
      command: 'codex',
      args: [],
      cwd: repoRoot,
      stdout: 'second payload\n',
      stderr: '',
      exitCode: 0,
    }, {
      now: new Date('2026-06-11T12:00:00.000Z'),
    });
    assert.equal(second.path, '.quiver/runs/run-artifacts/raw/2026-06-11t12-00-00z-provider-output-001.json');
    assert.equal(fs.readFileSync(path.join(repoRoot, written.path), 'utf8').includes('second payload'), false);
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
});
