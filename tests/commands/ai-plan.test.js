const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const { runPlan } = require('../../src/create-quiver/commands/ai');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function makeRepo(structure) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-plan-'));
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
  return execFileSync('node', [BIN_PATH, 'ai', 'plan', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

test('ai plan CLI dry-run defaults to acceptance phase and planning context', () => {
  const repo = makeRepo({
    'requirements.md': '# requirements\n- Ship a gated planner flow.',
  });

  try {
    const output = execAi(repo.root, ['--dry-run', '--input', 'requirements.md']);
    assert.ok(output.includes('AI plan dry-run'));
    assert.ok(output.includes('Provider: codex'));
    assert.ok(output.includes('Role: planner'));
    assert.ok(output.includes('Context pack: planning'));
    assert.ok(output.includes('Phase: acceptance'));
    assert.ok(output.includes('Command: codex exec'));
  } finally {
    repo.cleanup();
  }
});

test('ai plan acceptance and technical-plan phases do not create files', async () => {
  const repo = makeRepo({
    'requirements.md': '# requirements\n- Ship a gated planner flow.',
    'existing/keep.txt': 'keep',
  });

  try {
    const before = new Set(
      fs.readdirSync(repo.root, { withFileTypes: true }).map((entry) => entry.name),
    );

    let calls = 0;
    await runPlan(repo.root, {
      input: 'requirements.md',
      phase: 'technical-plan',
      runProviderFn: async (provider, options) => {
        calls += 1;
        assert.equal(provider, 'codex');
        assert.ok(options.prompt.includes('Phase: technical-plan'));
        assert.ok(options.prompt.includes('Do not create files or modify product code.'));
        return {
          ok: true,
          dryRun: false,
          provider,
          command: 'codex',
          args: ['exec'],
          cwd: repo.root,
          timeoutMs: 0,
          promptTransport: { mode: 'stdin' },
          exitCode: 0,
          stdout: '',
          stderr: '',
          error: null,
          preflight: { ok: true },
        };
      },
    });

    const after = new Set(
      fs.readdirSync(repo.root, { withFileTypes: true }).map((entry) => entry.name),
    );

    assert.equal(calls, 1);
    assert.deepEqual(after, before);
  } finally {
    repo.cleanup();
  }
});

test('ai plan fails with a clear missing-input error', () => {
  const repo = makeRepo({});
  try {
    assert.throws(
      () => execAi(repo.root, ['--dry-run']),
      (error) => error.stderr.includes("missing input file for ai plan phase 'acceptance'"),
    );
  } finally {
    repo.cleanup();
  }
});

test('ai plan spec phase dry-run reports spec generation instead of provider invocation', () => {
  const repo = makeRepo({
    'docs/approved-plan.json': JSON.stringify({
      spec: {
        slug: 'quiver-v21-dry-run-spec',
        title: 'Quiver v21 dry-run spec',
        ticket: 'QUIVER-21-03',
        objective: 'Generate a spec pack from approved input.',
        slices: [
          {
            slice_id: 'slice-01-dry-run',
            ticket: 'QUIVER-21-03',
            title: 'Dry run slice',
            objective: 'Render the spec tree.',
            description: 'Generate the expected files.',
            files: ['src/create-quiver/lib/ai/spec-generator.js'],
            acceptance: ['The generator writes a valid spec tree.'],
          },
        ],
      },
    }, null, 2),
  });

  try {
    const output = execAi(repo.root, ['--phase', 'spec', '--dry-run', '--input', 'docs/approved-plan.json']);
    assert.ok(output.includes('AI plan dry-run'));
    assert.ok(output.includes('Phase: spec'));
    assert.ok(output.includes('Spec slug: quiver-v21-dry-run-spec'));
  } finally {
    repo.cleanup();
  }
});

test('ai plan surfaces provider failures with phase context', async () => {
  const repo = makeRepo({
    'requirements.md': '# requirements',
  });

  try {
    await assert.rejects(
      runPlan(repo.root, {
        input: 'requirements.md',
        phase: 'acceptance',
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
      (error) => error.message.includes("ai plan phase 'acceptance' failed")
        && error.message.includes('Install the Codex CLI')
        && error.code === 'MISSING_PROVIDER_CLI',
    );
  } finally {
    repo.cleanup();
  }
});
