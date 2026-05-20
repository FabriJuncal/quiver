const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const { runOnboard } = require('../../src/create-quiver/commands/ai');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function makeRepo(structure) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-onboard-'));
  for (const [relativePath, contents] of Object.entries(structure)) {
    writeFile(path.join(root, relativePath), contents);
  }
  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function execAi(repoRoot, args = [], env = {}) {
  return execFileSync('node', [BIN_PATH, 'ai', 'onboard', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

test('ai onboard CLI dry-run prints provider, role, context pack, and invocation plan', () => {
  const repo = makeRepo({
    'docs/onboarding-notes.md': '# onboarding notes\nRead-only planning only.',
  });
  try {
    const output = execAi(repo.root, [
      '--provider',
      'claude',
      '--role',
      'planner',
      '--context',
      'full',
      '--input',
      'docs/onboarding-notes.md',
      '--timeout',
      '120',
      '--dry-run',
    ]);
    assert.ok(output.includes('AI onboard dry-run'));
    assert.ok(output.includes('Provider: claude'));
    assert.ok(output.includes('Role: planner'));
    assert.ok(output.includes('Context pack: full'));
    assert.ok(output.includes('Command: claude -p'));
    assert.ok(output.includes('Timeout: 120ms'));
    assert.ok(output.includes('Prompt transport: stdin'));
  } finally {
    repo.cleanup();
  }
});

test('ai onboard forwards custom provider, role, context, input, and timeout to the provider runner', async () => {
  const repo = makeRepo({
    'docs/onboarding-notes.md': '# onboarding notes\nKeep the repo in read-only mode.',
  });

  try {
    let captured = null;
    const result = await runOnboard(repo.root, {
      provider: 'claude',
      role: 'planner',
      context: 'full',
      input: 'docs/onboarding-notes.md',
      timeout: 4321,
      runProviderFn: async (provider, options) => {
        captured = { provider, options };
        return {
          ok: true,
          dryRun: false,
          provider,
          command: 'claude',
          args: ['-p'],
          cwd: repo.root,
          timeoutMs: 4321,
          promptTransport: { mode: 'stdin' },
          exitCode: 0,
          stdout: 'onboard output\n',
          stderr: '',
          error: null,
          preflight: { ok: true },
        };
      },
    });

    assert.equal(result.provider, 'claude');
    assert.equal(captured.provider, 'claude');
    assert.equal(captured.options.cwd, repo.root);
    assert.equal(captured.options.timeoutMs, 4321);
    assert.ok(captured.options.prompt.includes('onboarding notes'));
    assert.ok(captured.options.prompt.includes('Do not modify product code.'));
    assert.ok(captured.options.prompt.includes('Context pack: full'));
  } finally {
    repo.cleanup();
  }
});

test('ai onboard surfaces provider failures with actionable context', async () => {
  const repo = makeRepo({});
  try {
    await assert.rejects(
      runOnboard(repo.root, {
        provider: 'codex',
        runProviderFn: async () => ({
          ok: false,
          dryRun: false,
          provider: 'codex',
          command: 'codex',
          args: ['exec'],
          cwd: repo.root,
          timeoutMs: 0,
          promptTransport: { mode: 'stdin' },
          exitCode: null,
          stdout: '',
          stderr: '',
          error: {
            code: 'MISSING_PROVIDER_CLI',
            message: "Provider CLI 'codex' is not available. Install the Codex CLI and make sure it is available on PATH.",
          },
          preflight: null,
        }),
      }),
      (error) => error.message.includes('ai onboard failed')
        && error.message.includes('Install the Codex CLI')
        && error.code === 'MISSING_PROVIDER_CLI',
    );
  } finally {
    repo.cleanup();
  }
});
