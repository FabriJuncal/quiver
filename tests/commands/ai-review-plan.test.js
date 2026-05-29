const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const { runApprove, runReviewPlan } = require('../../src/create-quiver/commands/ai');
const { approvePlannerPhase, savePlannerDraft } = require('../../src/create-quiver/lib/approvals');
const { buildTechnicalPlanApprovalCandidates, readPlanReview, summarizePlanReview } = require('../../src/create-quiver/lib/ai/plan-review');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function makeRepo(structure = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-review-plan-'));
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
  return execFileSync('node', [BIN_PATH, 'ai', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

function structuredTechnicalPlanText(slug = 'reviewed-plan') {
  return `${JSON.stringify({
    spec: {
      slug,
      title: 'Reviewed plan',
      objective: 'Create specs from a reviewed technical plan.',
      slices: [
        {
          slice_id: 'slice-01-reviewed-plan',
          title: 'Reviewed plan implementation',
          objective: 'Implement the reviewed plan.',
          files: ['src/app.js'],
        },
      ],
    },
  }, null, 2)}\n`;
}

function createProgressRecorder() {
  const events = [];
  return {
    events,
    write: (text) => events.push(['write', text]),
    prompts: {
      spinner() {
        return {
          start(message) {
            events.push(['start', message]);
          },
          stop(message, code) {
            events.push(['stop', message, code]);
          },
        };
      },
    },
  };
}

test('ai review-plan dry-run uses the latest technical-plan draft', () => {
  const repo = makeRepo({
    'technical-plan.md': '# Technical plan\n- Build the flow.\n',
  });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', '# Technical plan v1\n');

    const output = execAi(repo.root, ['review-plan', '--dry-run']);

    assert.match(output, /AI review-plan dry-run/);
    assert.match(output, /Role: reviewer/);
    assert.match(output, /Phase: plan-review/);
    assert.match(output, /Prompt source: packaged production-readiness plan review template/);
    assert.match(output, /Input file: \.quiver\/approvals\/technical-plan\/drafts\/001\.md/);
    assert.match(output, /Input kind: draft/);
    assert.match(output, /Input version: v1/);
  } finally {
    repo.cleanup();
  }
});

test('ai review-plan print-prompt renders review prompt without provider auth', () => {
  const repo = makeRepo({
    'technical-plan.md': '# Technical plan\n- Build the flow.\n',
  });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', '# Technical plan v1\n');

    const output = execAi(repo.root, ['review-plan', '--print-prompt']);

    assert.match(output, /AI review-plan prompt-only/);
    assert.match(output, /Role: reviewer/);
    assert.match(output, /Phase: plan-review/);
    assert.match(output, /--- PROMPT START ---/);
    assert.match(output, /# Technical plan v1/);
    assert.match(output, /approvalRecommendation/);
    assert.match(output, /approve\|approve-with-risk\|revise/);
    assert.match(output, /--- PROMPT END ---/);
  } finally {
    repo.cleanup();
  }
});

test('ai review-plan rejects missing technical-plan draft', () => {
  const repo = makeRepo();

  try {
    assert.throws(
      () => execAi(repo.root, ['review-plan', '--dry-run']),
      (error) => error.stderr.includes('ai review-plan requires a generated technical-plan draft'),
    );
  } finally {
    repo.cleanup();
  }
});

test('ai review-plan persists review state and becomes valid after approving the reviewed draft', async () => {
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText(),
  });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText());

    const result = await runReviewPlan(repo.root, {
      runProviderFn: async (provider, options) => {
        assert.equal(provider, 'codex');
        assert.match(options.prompt, /review the technical plan/);
        assert.match(options.prompt, /Do not question the approved scope/);
        assert.match(options.prompt, /fragile assumptions/);
        assert.match(options.prompt, /slice-01-reviewed-plan/);
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
          stdout: 'review output\n',
          stderr: 'authorization: bearer secret-value\n',
          error: null,
          preflight: { ok: true },
        };
      },
    });

    const reviewPath = path.join(repo.root, '.quiver', 'approvals', 'plan-review', 'review.md');
    const metaPath = path.join(repo.root, '.quiver', 'approvals', 'plan-review', 'meta.json');
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    const raw = JSON.parse(fs.readFileSync(path.join(repo.root, meta.raw_artifact_path), 'utf8'));

    assert.equal(result.inputKind, 'draft');
    assert.equal(result.inputVersion, 1);
    assert.equal(fs.readFileSync(reviewPath, 'utf8'), 'review output\n');
    assert.equal(meta.source_file, '.quiver/approvals/technical-plan/drafts/001.md');
    assert.equal(meta.source_kind, 'draft');
    assert.equal(meta.source_version, 1);
    assert.equal(meta.review_result.approval_recommendation, 'approve-with-risk');
    assert.equal(meta.review_result.blocking, false);
    assert.match(meta.review_result.next_command, /ai approve --phase technical-plan --version 1/);
    assert.ok(meta.raw_artifact_path.startsWith('.quiver/runs/'));
    assert.equal(raw.stderr.includes('secret-value'), false);
    assert.ok(raw.stderr.includes('authorization: bearer [REDACTED]'));
    assert.equal(readPlanReview(repo.root).status, 'unapproved');

    const approveOutput = execAi(repo.root, ['approve', '--phase', 'technical-plan', '--version', '1']);
    const approvalsOutput = execAi(repo.root, ['approvals']);

    assert.match(approveOutput, /Version: v1/);
    assert.equal(readPlanReview(repo.root).status, 'reviewed');
    assert.match(approvalsOutput, /Phase: plan-review/);
    assert.match(approvalsOutput, /Status: reviewed/);
    assert.match(approvalsOutput, /Approval recommendation: approve-with-risk/);
  } finally {
    repo.cleanup();
  }
});

test('ai review-plan shows human TTY progress during live provider execution', async () => {
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('review-progress-plan'),
  });
  const progress = createProgressRecorder();

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('review-progress-plan'));

    await runReviewPlan(repo.root, {
      provider: 'codex',
      providerExplicit: true,
      stdoutIsTTY: true,
      stdinIsTTY: true,
      stderrIsTTY: true,
      noColor: true,
      env: { LANG: 'en_US.UTF-8' },
      write: progress.write,
      prompts: progress.prompts,
      runProviderFn: async () => ({
        ok: true,
        dryRun: false,
        provider: 'codex',
        command: 'codex',
        args: ['exec'],
        cwd: repo.root,
        timeoutMs: 0,
        promptTransport: { mode: 'stdin' },
        exitCode: 0,
        stdout: 'review output\n',
        stderr: '',
        error: null,
        preflight: { ok: true },
      }),
    });

    assert.deepEqual(progress.events, [
      ['write', '◇ Running plan review with codex\n'],
      ['write', '✓ Reading technical plan\n'],
      ['write', '✓ Preparing context\n'],
      ['write', '✓ Preparing prompt\n'],
      ['start', 'Running agent...'],
      ['stop', 'Agent finished', undefined],
    ]);
  } finally {
    repo.cleanup();
  }
});

test('ai approve selects acceptance draft interactively when version is omitted', async () => {
  const repo = makeRepo({
    'requirements.md': '# Requirements\n- Approve latest.\n',
  });

  try {
    savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'acceptance v1\n');
    savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'acceptance v2\n');

    const result = await runApprove(repo.root, {
      phase: 'acceptance',
      stdinIsTTY: true,
      stdoutIsTTY: true,
      stderrIsTTY: true,
      promptSelect: async (message, options) => {
        assert.match(message, /acceptance draft/);
        assert.equal(options.length, 2);
        assert.equal(options.find((option) => option.value === '2').default, true);
        return '2';
      },
    });

    assert.equal(result.version, 2);
  } finally {
    repo.cleanup();
  }
});

test('ai approve without version remains explicit in no-TTY mode', () => {
  const repo = makeRepo({
    'requirements.md': '# Requirements\n- Approve latest.\n',
  });

  try {
    savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'acceptance v1\n');

    assert.throws(
      () => execAi(repo.root, ['approve', '--phase', 'acceptance']),
      (error) => error.stderr.includes('requires --version <n> when prompts are not available')
        && error.stderr.includes('Next command: npx create-quiver ai approve --phase acceptance --version 1'),
    );
  } finally {
    repo.cleanup();
  }
});

test('ai approve interactive selection refuses non-current acceptance drafts', async () => {
  const repo = makeRepo({
    'requirements.md': '# Requirements\n- Approve latest.\n',
  });

  try {
    savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'acceptance v1\n');
    savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'acceptance v2\n');

    await assert.rejects(
      runApprove(repo.root, {
        phase: 'acceptance',
        stdinIsTTY: true,
        stdoutIsTTY: true,
        stderrIsTTY: true,
        promptSelect: async () => '1',
      }),
      /not approvable/,
    );
  } finally {
    repo.cleanup();
  }
});

test('ai review-plan marks review stale when the technical-plan draft changes', async () => {
  const repo = makeRepo({
    'technical-plan.md': '# Technical plan\n- Build the flow.\n',
  });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', '# Technical plan v1\n');
    await runReviewPlan(repo.root, {
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
        stdout: 'review v1\n',
        stderr: '',
        error: null,
        preflight: { ok: true },
      }),
    });
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', '# Technical plan v2\n');

    assert.equal(readPlanReview(repo.root).status, 'stale');
  } finally {
    repo.cleanup();
  }
});

test('ai approve blocks technical-plan approval when the latest review is stale', async () => {
  const repo = makeRepo({
    'technical-plan.md': '# Technical plan\n- Build the flow.\n',
  });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', '# Technical plan v1\n');
    await runReviewPlan(repo.root, {
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
        stdout: 'review v1\n',
        stderr: '',
        error: null,
        preflight: { ok: true },
      }),
    });
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', '# Technical plan v2\n');

    assert.equal(readPlanReview(repo.root).status, 'stale');
    assert.throws(
      () => execAi(repo.root, ['approve', '--phase', 'technical-plan', '--version', '2']),
      (error) => error.stderr.includes('requires a production review for the current draft')
        && error.stderr.includes('current review status is stale'),
    );
  } finally {
    repo.cleanup();
  }
});

test('ai review-plan persists approve recommendation metadata', async () => {
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('approve-plan'),
  });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('approve-plan'));
    await runReviewPlan(repo.root, {
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
        stdout: '```json\n{"review":{"blocking":false,"approvalRecommendation":"approve","requiredFixes":[],"optionalHardening":[],"risks":[]}}\n```\n',
        stderr: '',
        error: null,
        preflight: { ok: true },
      }),
    });

    const review = readPlanReview(repo.root);

    assert.equal(review.meta.review_result.approval_recommendation, 'approve');
    assert.equal(review.meta.review_result.blocking, false);
    assert.deepEqual(review.meta.review_result.required_fixes, []);
    assert.match(summarizePlanReview(repo.root), /Next command: npx create-quiver ai approve --phase technical-plan --version 1/);
    assert.doesNotThrow(() => execAi(repo.root, ['approve', '--phase', 'technical-plan', '--version', '1']));
  } finally {
    repo.cleanup();
  }
});

test('ai review-plan approve-with-risk recommendation still allows explicit approval', async () => {
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('risk-plan'),
  });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('risk-plan'));
    await runReviewPlan(repo.root, {
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
        stdout: '```json\n{"review":{"blocking":false,"approvalRecommendation":"approve-with-risk","requiredFixes":[],"optionalHardening":["Add one extra smoke test"],"risks":["Minor docs drift"]}}\n```\n',
        stderr: '',
        error: null,
        preflight: { ok: true },
      }),
    });

    const review = readPlanReview(repo.root);
    const output = execAi(repo.root, ['approve', '--phase', 'technical-plan', '--version', '1']);

    assert.equal(review.meta.review_result.approval_recommendation, 'approve-with-risk');
    assert.equal(review.meta.review_result.blocking, false);
    assert.deepEqual(review.meta.review_result.optional_hardening, ['Add one extra smoke test']);
    assert.match(output, /Version: v1/);
  } finally {
    repo.cleanup();
  }
});

test('technical-plan approval candidates expose review recommendation and approvability', async () => {
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('candidate-risk-plan'),
  });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('candidate-risk-plan'));
    await runReviewPlan(repo.root, {
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
        stdout: '```json\n{"review":{"blocking":false,"approvalRecommendation":"approve-with-risk","requiredFixes":[],"optionalHardening":["Add one extra smoke test"],"risks":["Minor docs drift"]}}\n```\n',
        stderr: '',
        error: null,
        preflight: { ok: true },
      }),
    });

    const candidates = buildTechnicalPlanApprovalCandidates(repo.root);

    assert.equal(candidates.review.status, 'unapproved');
    assert.equal(candidates.review.recommendation, 'approve-with-risk');
    assert.equal(candidates.review.blocking, false);
    assert.equal(candidates.review.optional_hardening_count, 1);
    assert.equal(candidates.review.risks_count, 1);
    assert.equal(candidates.recommended.version, 1);
    assert.equal(candidates.recommended.approvable, true);
    assert.match(candidates.recommended.reason, /approve-with-risk/);
  } finally {
    repo.cleanup();
  }
});

test('ai approve selects technical-plan draft interactively with review context', async () => {
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('interactive-risk-plan'),
  });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('interactive-risk-plan'));
    await runReviewPlan(repo.root, {
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
        stdout: '```json\n{"review":{"blocking":false,"approvalRecommendation":"approve-with-risk","requiredFixes":[],"optionalHardening":["Add one extra smoke test"],"risks":["Minor docs drift"]}}\n```\n',
        stderr: '',
        error: null,
        preflight: { ok: true },
      }),
    });

    const result = await runApprove(repo.root, {
      phase: 'technical-plan',
      stdinIsTTY: true,
      stdoutIsTTY: true,
      stderrIsTTY: true,
      promptSelect: async (message, options) => {
        assert.match(message, /technical-plan draft/);
        assert.equal(options.length, 1);
        assert.match(options[0].hint, /review=approve-with-risk/);
        assert.match(options[0].hint, /optional hardening=1/);
        assert.match(options[0].hint, /risks=1/);
        return '1';
      },
    });

    assert.equal(result.version, 1);
    assert.equal(readPlanReview(repo.root).status, 'reviewed');
  } finally {
    repo.cleanup();
  }
});

test('ai review-plan revise recommendation blocks technical-plan approval', async () => {
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('revise-plan'),
  });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('revise-plan'));
    await runReviewPlan(repo.root, {
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
        stdout: '```json\n{"review":{"blocking":true,"approvalRecommendation":"revise","requiredFixes":["Define rollback validation"],"optionalHardening":["Add screenshots"],"risks":["Plan cannot be tested safely yet"]}}\n```\n',
        stderr: '',
        error: null,
        preflight: { ok: true },
      }),
    });

    const review = readPlanReview(repo.root);

    assert.equal(review.meta.review_result.approval_recommendation, 'revise');
    assert.equal(review.meta.review_result.blocking, true);
    assert.deepEqual(review.meta.review_result.required_fixes, ['Define rollback validation']);
    const candidates = buildTechnicalPlanApprovalCandidates(repo.root);
    assert.equal(candidates.review.recommendation, 'revise');
    assert.equal(candidates.review.blocking, true);
    assert.equal(candidates.recommended, null);
    assert.equal(candidates.current.approvable, false);
    assert.match(candidates.current.reason, /blocks approval/);
    await assert.rejects(
      runApprove(repo.root, {
        phase: 'technical-plan',
        stdinIsTTY: true,
        stdoutIsTTY: true,
        stderrIsTTY: true,
        promptSelect: async () => '1',
      }),
      /not approvable/,
    );
    assert.throws(
      () => execAi(repo.root, ['approve', '--phase', 'technical-plan', '--version', '1']),
      (error) => error.stderr.includes('blocked by plan review')
        && error.stderr.includes('approval recommendation is revise')
        && error.stderr.includes('Required fixes: 1')
        && error.stderr.includes('Next command: npx create-quiver ai revise --phase technical-plan --input <feedback.md> --dry-run'),
    );
  } finally {
    repo.cleanup();
  }
});

test('ai plan spec phase rejects approved technical plans that were not reviewed', () => {
  const repo = makeRepo({
    'technical-plan.md': JSON.stringify({
      spec: {
        slug: 'unreviewed-plan',
        title: 'Unreviewed plan',
        objective: 'Reject spec generation before review.',
      },
    }, null, 2),
  });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', fs.readFileSync(path.join(repo.root, 'technical-plan.md'), 'utf8'));
    approvePlannerPhase(repo.root, 'technical-plan', '', '', { version: 1 });

    assert.throws(
      () => execAi(repo.root, ['plan', '--phase', 'spec', '--dry-run']),
      (error) => error.stderr.includes('requires a reviewed and approved technical-plan input')
        && error.stderr.includes('current review status: missing')
        && error.stderr.includes('Run `npx create-quiver ai review-plan --dry-run`')
        && error.stderr.includes('then run `npx create-quiver ai review-plan`'),
    );
  } finally {
    repo.cleanup();
  }
});

test('ai review-plan surfaces provider failures with task context', async () => {
  const repo = makeRepo({
    'technical-plan.md': '# Technical plan\n- Build the flow.\n',
  });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', '# Technical plan v1\n');

    await assert.rejects(
      runReviewPlan(repo.root, {
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
            message: "Provider CLI 'codex' is not available.",
          },
          preflight: null,
        }),
      }),
      (error) => error.message.includes("ai review-plan failed")
        && error.message.includes("Provider CLI 'codex' is not available")
        && error.code === 'MISSING_PROVIDER_CLI',
    );
  } finally {
    repo.cleanup();
  }
});
