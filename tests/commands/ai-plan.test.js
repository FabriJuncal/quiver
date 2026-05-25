const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const { runPlan, runRevise } = require('../../src/create-quiver/commands/ai');
const { savePlanReview } = require('../../src/create-quiver/lib/ai/plan-review');
const { savePlannerDraft } = require('../../src/create-quiver/lib/approvals');

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

test('ai plan print-prompt renders acceptance prompt without provider auth', () => {
  const repo = makeRepo({
    'requirements.md': '# requirements\n- Ship a gated planner flow.',
  });

  try {
    const output = execAi(repo.root, ['--print-prompt', '--input', 'requirements.md']);
    assert.ok(output.includes('AI plan prompt-only'));
    assert.ok(output.includes('Phase: acceptance'));
    assert.ok(output.includes('--- PROMPT START ---'));
    assert.ok(output.includes('Ship a gated planner flow.'));
    assert.ok(output.includes('Task: produce acceptance criteria only.'));
    assert.ok(output.includes('--- PROMPT END ---'));
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

test('ai plan redacts likely secrets before saving provider output drafts', async () => {
  const repo = makeRepo({
    'requirements.md': '# requirements\n- Avoid leaking provider logs.',
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
        stdout: 'token=abc123\ncriteria draft\n',
        stderr: 'authorization: bearer secret-value\n',
        error: null,
        preflight: { ok: true },
      }),
    });

    const draftPath = path.join(repo.root, '.quiver', 'approvals', 'acceptance', 'draft.md');
    const metaPath = path.join(repo.root, '.quiver', 'approvals', 'acceptance', 'meta.json');
    const draft = fs.readFileSync(draftPath, 'utf8');
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    const raw = JSON.parse(fs.readFileSync(path.join(repo.root, meta.draft.raw_artifact_path), 'utf8'));

    assert.equal(draft.includes('abc123'), false);
    assert.equal(draft.includes('secret-value'), false);
    assert.ok(draft.includes('token=[REDACTED]'));
    assert.ok(draft.includes('criteria draft'));
    assert.equal(draft.includes('authorization: bearer [REDACTED]'), false);
    assert.ok(meta.draft.raw_artifact_path.startsWith('.quiver/runs/'));
    assert.ok(meta.draft.raw_artifact_path.includes('/raw/'));
    assert.ok(raw.stdout.includes('token=[REDACTED]'));
    assert.ok(raw.stderr.includes('authorization: bearer [REDACTED]'));
  } finally {
    repo.cleanup();
  }
});

test('ai plan stores clean drafts and separates redacted raw provider logs', async () => {
  const repo = makeRepo({
    'requirements.md': '# requirements\n- Keep the draft useful.',
  });

  try {
    await runPlan(repo.root, {
      input: 'requirements.md',
      phase: 'acceptance',
      runProviderFn: async (provider, options) => ({
        ok: true,
        dryRun: false,
        provider,
        command: 'codex',
        args: ['exec'],
        cwd: repo.root,
        timeoutMs: 0,
        promptTransport: { mode: 'stdin' },
        exitCode: 0,
        stdout: `${options.prompt}\nINFO provider started\n# Acceptance\n- Clear criterion.\n`,
        stderr: `debug token=abc123 cwd=${repo.root}\n`,
        error: null,
        preflight: { ok: true },
      }),
    });

    const draft = fs.readFileSync(path.join(repo.root, '.quiver', 'approvals', 'acceptance', 'draft.md'), 'utf8');
    const meta = JSON.parse(fs.readFileSync(path.join(repo.root, '.quiver', 'approvals', 'acceptance', 'meta.json'), 'utf8'));
    const rawPath = path.join(repo.root, meta.draft.raw_artifact_path);
    const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

    assert.equal(draft, '# Acceptance\n- Clear criterion.\n');
    assert.equal(meta.draft.output_source, 'stdout');
    assert.ok(meta.draft.raw_artifact_path.startsWith('.quiver/runs/'));
    assert.ok(meta.draft.raw_artifact_path.includes('/raw/'));
    assert.equal(raw.stderr.includes('abc123'), false);
    assert.ok(raw.stderr.includes('token=[REDACTED]'));
    assert.equal(raw.stderr.includes(repo.root), false);
    assert.ok(raw.stderr.includes('[PROJECT_ROOT]'));
  } finally {
    repo.cleanup();
  }
});

test('ai approve only approves the current draft version', async () => {
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

    assert.throws(
      () => execAiSubcommand(repo.root, ['approve', '--phase', 'acceptance', '--version', '1']),
      (error) => error.stderr.includes('draft version 1 is not current') && error.stderr.includes('latest draft version is 2'),
    );

    const output = execAiSubcommand(repo.root, ['approve', '--phase', 'acceptance', '--version', '2']);
    const approvedPath = path.join(repo.root, '.quiver', 'approvals', 'acceptance', 'approved.md');
    const status = execAiSubcommand(repo.root, ['approvals']);
    const meta = JSON.parse(fs.readFileSync(path.join(repo.root, '.quiver', 'approvals', 'acceptance', 'meta.json'), 'utf8'));

    assert.ok(output.includes('Version: v2'));
    assert.equal(fs.readFileSync(approvedPath, 'utf8'), 'acceptance draft v2\n');
    assert.equal(meta.approved.version, 2);
    assert.equal(meta.drafts.length, 2);
    assert.ok(status.includes('Draft history:'));
    assert.ok(status.includes('Status: approved'));
  } finally {
    repo.cleanup();
  }
});

test('ai approve requires a version and rejects direct input files', async () => {
  const repo = makeRepo({
    'requirements.md': '# requirements\n- Gate approval.',
    'accepted.md': '# Accepted manually\n',
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

    assert.throws(
      () => execAiSubcommand(repo.root, ['approve', '--phase', 'acceptance']),
      (error) => error.stderr.includes('requires --version <n>'),
    );
    assert.throws(
      () => execAiSubcommand(repo.root, ['approve', '--phase', 'acceptance', '--input', 'accepted.md', '--version', '1']),
      (error) => error.stderr.includes('approves saved draft versions only')
        && error.stderr.includes('ai revise --phase acceptance --input accepted.md'),
    );
  } finally {
    repo.cleanup();
  }
});

test('ai revise creates a new draft version without approving the phase', async () => {
  const repo = makeRepo({
    'requirements.md': '# requirements\n- Iterate criteria.',
    'feedback.md': '# feedback\n- Tighten acceptance criteria.',
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

    await runRevise(repo.root, {
      input: 'feedback.md',
      phase: 'acceptance',
      runProviderFn: async (provider, options) => {
        assert.ok(options.prompt.includes('revise the current draft and produce a new version only'));
        assert.ok(options.prompt.includes('Current acceptance draft'));
        assert.ok(options.prompt.includes('acceptance draft v1'));
        assert.ok(options.prompt.includes('Tighten acceptance criteria.'));
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
          stdout: 'acceptance draft v2\n',
          stderr: '',
          error: null,
          preflight: { ok: true },
        };
      },
    });

    const meta = JSON.parse(fs.readFileSync(path.join(repo.root, '.quiver', 'approvals', 'acceptance', 'meta.json'), 'utf8'));
    const status = execAiSubcommand(repo.root, ['approvals']);

    assert.equal(meta.draft.version, 2);
    assert.equal(meta.approved, null);
    assert.equal(meta.drafts.length, 2);
    assert.equal(fs.readFileSync(path.join(repo.root, '.quiver', 'approvals', 'acceptance', 'drafts', '002.md'), 'utf8'), 'acceptance draft v2\n');
    assert.ok(status.includes('Status: draft'));
  } finally {
    repo.cleanup();
  }
});

test('ai revise compacts oversized feedback before provider execution', async () => {
  const filler = Array.from({ length: 160 }, (_, index) => `filler line ${index}: repeated context that should not be sent in full`).join('\n');
  const repo = makeRepo({
    'requirements.md': '# requirements\n- Iterate criteria.',
    'feedback.md': [
      '# feedback',
      '- Decision: keep the planner gate mandatory.',
      '- Risk: provider context can overflow.',
      '- Files: src/create-quiver/commands/ai.js and tests/commands/ai-plan.test.js.',
      '- Acceptance criteria: compact feedback before provider execution.',
      filler,
    ].join('\n'),
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

    await runRevise(repo.root, {
      input: 'feedback.md',
      phase: 'acceptance',
      maxRevisionInputBytes: 1800,
      compactedRevisionInputBytes: 1500,
      maxProviderPromptBytes: 20000,
      runProviderFn: async (provider, options) => {
        assert.ok(options.prompt.includes('[Quiver compacted oversized revise input'));
        assert.ok(options.prompt.includes('Decision: keep the planner gate mandatory.'));
        assert.ok(options.prompt.includes('Risk: provider context can overflow.'));
        assert.ok(options.prompt.includes('Files: src/create-quiver/commands/ai.js'));
        assert.ok(options.prompt.includes('Acceptance criteria: compact feedback'));
        assert.equal(options.prompt.includes('filler line 159'), false);
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
          stdout: 'acceptance draft v2\n',
          stderr: '',
          error: null,
          preflight: { ok: true },
        };
      },
    });

    const meta = JSON.parse(fs.readFileSync(path.join(repo.root, '.quiver', 'approvals', 'acceptance', 'meta.json'), 'utf8'));
    assert.equal(meta.draft.version, 2);
    assert.equal(meta.draft.input_compaction.compacted, true);
    assert.ok(meta.draft.input_compaction.original_bytes > meta.draft.input_compaction.compacted_bytes);
  } finally {
    repo.cleanup();
  }
});

test('ai plan rejects oversized prompts before provider execution', async () => {
  const repo = makeRepo({
    'requirements.md': `# requirements\n${'large input\n'.repeat(100)}`,
  });

  try {
    await assert.rejects(
      runPlan(repo.root, {
        input: 'requirements.md',
        phase: 'acceptance',
        maxProviderPromptBytes: 100,
        runProviderFn: async () => {
          throw new Error('provider should not run');
        },
      }),
      (error) => error.code === 'AI_PROMPT_TOO_LARGE'
        && error.message.includes('provider prompt is too large')
        && error.message.includes('before invoking the provider'),
    );
  } finally {
    repo.cleanup();
  }
});

test('ai revise technical-plan includes approved acceptance, current draft, and feedback', async () => {
  const repo = makeRepo({
    'acceptance.md': '# Acceptance\n- Approved criteria.',
    'plan-feedback.md': '# feedback\n- Reduce risk in rollout.',
  });

  try {
    await runPlan(repo.root, {
      input: 'acceptance.md',
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
        stdout: '# Acceptance\n- Approved criteria.',
        stderr: '',
        error: null,
        preflight: { ok: true },
      }),
    });
    execAiSubcommand(repo.root, ['approve', '--phase', 'acceptance', '--version', '1']);
    savePlannerDraft(repo.root, 'technical-plan', '.quiver/approvals/acceptance/approved.md', '# Technical plan v1\n');

    await runRevise(repo.root, {
      input: 'plan-feedback.md',
      phase: 'technical-plan',
      runProviderFn: async (provider, options) => {
        assert.ok(options.prompt.includes('Approved acceptance input'));
        assert.ok(options.prompt.includes('Approved criteria.'));
        assert.ok(options.prompt.includes('Current technical-plan draft'));
        assert.ok(options.prompt.includes('# Technical plan v1'));
        assert.ok(options.prompt.includes('Reduce risk in rollout.'));
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
          stdout: '# Technical plan v2\n',
          stderr: '',
          error: null,
          preflight: { ok: true },
        };
      },
    });

    const meta = JSON.parse(fs.readFileSync(path.join(repo.root, '.quiver', 'approvals', 'technical-plan', 'meta.json'), 'utf8'));

    assert.equal(meta.draft.version, 2);
    assert.equal(meta.approved, null);
    assert.equal(fs.readFileSync(path.join(repo.root, '.quiver', 'approvals', 'technical-plan', 'drafts', '002.md'), 'utf8'), '# Technical plan v2\n');
  } finally {
    repo.cleanup();
  }
});

test('ai revise requires an existing draft', async () => {
  const repo = makeRepo({
    'feedback.md': '# feedback\n- Update criteria.',
  });

  try {
    await assert.rejects(
      runRevise(repo.root, {
        input: 'feedback.md',
        phase: 'acceptance',
        runProviderFn: async () => {
          throw new Error('provider should not run');
        },
      }),
      (error) => error.message.includes('requires an existing draft') && error.message.includes('current status is missing'),
    );
  } finally {
    repo.cleanup();
  }
});

test('ai approve writes an approved acceptance artifact with metadata', async () => {
  const repo = makeRepo({
    'acceptance.md': '# Acceptance\n- Approved criteria.',
  });

  try {
    await runPlan(repo.root, {
      input: 'acceptance.md',
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
        stdout: '# Acceptance\n- Approved criteria.',
        stderr: '',
        error: null,
        preflight: { ok: true },
      }),
    });
    const output = execAiSubcommand(repo.root, ['approve', '--phase', 'acceptance', '--version', '1']);
    const approvedPath = path.join(repo.root, '.quiver', 'approvals', 'acceptance', 'approved.md');
    const metaPath = path.join(repo.root, '.quiver', 'approvals', 'acceptance', 'meta.json');
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

    assert.ok(output.includes('AI approval saved'));
    assert.ok(fs.existsSync(approvedPath));
    assert.equal(fs.readFileSync(approvedPath, 'utf8'), '# Acceptance\n- Approved criteria.');
    assert.equal(meta.phase, 'acceptance');
    assert.equal(meta.approved.source_file, '.quiver/approvals/acceptance/drafts/001.md');
    assert.equal(meta.approved.path, '.quiver/approvals/acceptance/approved.md');
    assert.equal(typeof meta.approved.approved_at, 'string');
  } finally {
    repo.cleanup();
  }
});

test('ai approvals prints draft and approved status', async () => {
  const repo = makeRepo({
    'acceptance.md': '# Acceptance\n- Approved criteria.',
  });

  try {
    await runPlan(repo.root, {
      input: 'acceptance.md',
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
        stdout: '# Acceptance\n- Approved criteria.',
        stderr: '',
        error: null,
        preflight: { ok: true },
      }),
    });
    execAiSubcommand(repo.root, ['approve', '--phase', 'acceptance', '--version', '1']);
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
    await runPlan(approvedRepo.root, {
      input: 'acceptance.md',
      phase: 'acceptance',
      runProviderFn: async (provider) => ({
        ok: true,
        dryRun: false,
        provider,
        command: 'codex',
        args: ['exec'],
        cwd: approvedRepo.root,
        timeoutMs: 0,
        promptTransport: { mode: 'stdin' },
        exitCode: 0,
        stdout: '# Acceptance\n- Approved criteria.',
        stderr: '',
        error: null,
        preflight: { ok: true },
      }),
    });
    execAiSubcommand(approvedRepo.root, ['approve', '--phase', 'acceptance', '--version', '1']);

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
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', fs.readFileSync(path.join(repo.root, 'technical-plan.md'), 'utf8'));
    savePlanReview(repo.root, {
      contents: 'production review\n',
      inputPath: '.quiver/approvals/technical-plan/drafts/001.md',
      inputKind: 'draft',
      inputVersion: 1,
    });
    execAiSubcommand(repo.root, ['approve', '--phase', 'technical-plan', '--version', '1']);
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
