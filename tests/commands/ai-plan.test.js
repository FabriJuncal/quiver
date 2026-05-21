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

function execAiSubcommand(repoRoot, args = [], env = {}) {
  return execFileSync('node', [BIN_PATH, 'ai', ...args], {
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

test('ai plan acceptance persists a draft approval state', async () => {
  const repo = makeRepo({
    'requirements.md': '# requirements\n- Ship a gated planner flow.',
  });

  try {
    await runPlan(repo.root, {
      input: 'requirements.md',
      phase: 'acceptance',
      runProviderFn: async (provider, options) => {
        assert.equal(provider, 'codex');
        assert.ok(options.prompt.includes('Phase: acceptance'));
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
          stdout: 'acceptance draft\n',
          stderr: '',
          error: null,
          preflight: { ok: true },
        };
      },
    });

    const draftPath = path.join(repo.root, '.quiver', 'approvals', 'acceptance', 'draft.md');
    const metaPath = path.join(repo.root, '.quiver', 'approvals', 'acceptance', 'meta.json');
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

    assert.equal(fs.existsSync(draftPath), true);
    assert.equal(fs.readFileSync(draftPath, 'utf8'), 'acceptance draft\n');
    assert.equal(meta.phase, 'acceptance');
    assert.equal(meta.draft.source_file, 'requirements.md');
    assert.equal(meta.draft.path, '.quiver/approvals/acceptance/draft.md');
    assert.equal(meta.draft.version, 1);
    assert.equal(meta.drafts.length, 1);
    assert.equal(typeof meta.draft.created_at, 'string');
  } finally {
    repo.cleanup();
  }
});

test('ai approve can approve a selected draft version from history', async () => {
  const repo = makeRepo({
    'requirements.md': '# requirements\n- Iterate criteria.',
  });

  try {
    await runPlan(repo.root, {
      input: 'requirements.md',
      phase: 'acceptance',
      runProviderFn: async (provider) => ({
        ok: true,
        dryRun: false,
        provider,
        command: 'codex',
        args: ['exec'],
        cwd: repo.root,
        timeoutMs: 0,
        promptTransport: { mode: 'stdin' },
        exitCode: 0,
        stdout: 'acceptance draft v1\n',
        stderr: '',
        error: null,
        preflight: { ok: true },
      }),
    });
    await runPlan(repo.root, {
      input: 'requirements.md',
      phase: 'acceptance',
      runProviderFn: async (provider) => ({
        ok: true,
        dryRun: false,
        provider,
        command: 'codex',
        args: ['exec'],
        cwd: repo.root,
        timeoutMs: 0,
        promptTransport: { mode: 'stdin' },
        exitCode: 0,
        stdout: 'acceptance draft v2\n',
        stderr: '',
        error: null,
        preflight: { ok: true },
      }),
    });

    const output = execAiSubcommand(repo.root, ['approve', '--phase', 'acceptance', '--version', '1']);
    const approvedPath = path.join(repo.root, '.quiver', 'approvals', 'acceptance', 'approved.md');
    const status = execAiSubcommand(repo.root, ['approvals']);
    const meta = JSON.parse(fs.readFileSync(path.join(repo.root, '.quiver', 'approvals', 'acceptance', 'meta.json'), 'utf8'));

    assert.ok(output.includes('Version: v1'));
    assert.equal(fs.readFileSync(approvedPath, 'utf8'), 'acceptance draft v1\n');
    assert.equal(meta.approved.version, 1);
    assert.equal(meta.drafts.length, 2);
    assert.ok(status.includes('Draft history:'));
    assert.ok(status.includes('Status: stale'));
  } finally {
    repo.cleanup();
  }
});

test('ai approve writes an approved acceptance artifact with metadata', () => {
  const repo = makeRepo({
    'acceptance.md': '# Acceptance\n- Approved criteria.',
  });

  try {
    const output = execAiSubcommand(repo.root, ['approve', '--phase', 'acceptance', '--input', 'acceptance.md']);
    const approvedPath = path.join(repo.root, '.quiver', 'approvals', 'acceptance', 'approved.md');
    const metaPath = path.join(repo.root, '.quiver', 'approvals', 'acceptance', 'meta.json');
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

    assert.ok(output.includes('AI approval saved'));
    assert.ok(fs.existsSync(approvedPath));
    assert.equal(fs.readFileSync(approvedPath, 'utf8'), '# Acceptance\n- Approved criteria.');
    assert.equal(meta.phase, 'acceptance');
    assert.equal(meta.approved.source_file, 'acceptance.md');
    assert.equal(meta.approved.path, '.quiver/approvals/acceptance/approved.md');
    assert.equal(typeof meta.approved.approved_at, 'string');
  } finally {
    repo.cleanup();
  }
});

test('ai approvals prints draft and approved status', () => {
  const repo = makeRepo({
    'acceptance.md': '# Acceptance\n- Approved criteria.',
  });

  try {
    execAiSubcommand(repo.root, ['approve', '--phase', 'acceptance', '--input', 'acceptance.md']);
    const output = execAiSubcommand(repo.root, ['approvals']);

    assert.ok(output.includes('AI approvals status'));
    assert.ok(output.includes('Phase: acceptance'));
    assert.ok(output.includes('Status: approved'));
    assert.ok(output.includes('Phase: technical-plan'));
    assert.ok(output.includes('Status: missing'));
  } finally {
    repo.cleanup();
  }
});

test('ai plan technical-plan uses approved acceptance by default and rejects drafts', async () => {
  const approvedRepo = makeRepo({
    'acceptance.md': '# Acceptance\n- Approved criteria.',
  });

  try {
    execAiSubcommand(approvedRepo.root, ['approve', '--phase', 'acceptance', '--input', 'acceptance.md']);

    const output = await runPlan(approvedRepo.root, {
      phase: 'technical-plan',
      runProviderFn: async (provider, options) => {
        assert.equal(provider, 'codex');
        assert.ok(options.prompt.includes('Phase: technical-plan'));
        assert.ok(options.prompt.includes('Approved criteria.'));
        return {
          ok: true,
          dryRun: false,
          provider,
          command: 'codex',
          args: ['exec'],
          cwd: approvedRepo.root,
          timeoutMs: 0,
          promptTransport: { mode: 'stdin' },
          exitCode: 0,
          stdout: 'technical-plan draft\n',
          stderr: '',
          error: null,
          preflight: { ok: true },
        };
      },
    });

    assert.equal(output.phase, 'technical-plan');
    assert.equal(fs.readFileSync(path.join(approvedRepo.root, '.quiver', 'approvals', 'technical-plan', 'draft.md'), 'utf8'), 'technical-plan draft\n');
  } finally {
    approvedRepo.cleanup();
  }

  const blockedRepo = makeRepo({
    'acceptance.md': '# Acceptance\n- Draft only.',
  });

  try {
    assert.throws(
      () => execAiSubcommand(blockedRepo.root, ['plan', '--phase', 'technical-plan', '--input', 'acceptance.md']),
      (error) => error.stderr.includes("requires approved acceptance input") && error.stderr.includes("current status: missing"),
    );
  } finally {
    blockedRepo.cleanup();
  }
});

test('ai plan fails with a clear missing-input error', () => {
  const repo = makeRepo({});
  try {
    assert.throws(
      () => execAi(repo.root, ['--phase', 'acceptance', '--dry-run']),
      (error) => error.stderr.includes("missing input file for ai plan phase 'acceptance'"),
    );
  } finally {
    repo.cleanup();
  }
});

test('ai plan spec phase dry-run reports spec generation instead of provider invocation', () => {
  const repo = makeRepo({
    'technical-plan.md': JSON.stringify({
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
    execAiSubcommand(repo.root, ['approve', '--phase', 'technical-plan', '--input', 'technical-plan.md']);
    const output = execAi(repo.root, ['--phase', 'spec', '--dry-run']);
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
