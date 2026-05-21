const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const { runReviewPlan } = require('../../src/create-quiver/commands/ai');
const { approvePlannerPhase, savePlannerDraft } = require('../../src/create-quiver/lib/approvals');
const { readPlanReview } = require('../../src/create-quiver/lib/ai/plan-review');

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
    'technical-plan.md': '# Technical plan\n- Build the flow.\n',
  });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', '# Technical plan v1\n');

    const result = await runReviewPlan(repo.root, {
      runProviderFn: async (provider, options) => {
        assert.equal(provider, 'codex');
        assert.match(options.prompt, /review the technical plan/);
        assert.match(options.prompt, /Do not question the approved scope/);
        assert.match(options.prompt, /fragile assumptions/);
        assert.match(options.prompt, /# Technical plan v1/);
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
          stderr: '',
          error: null,
          preflight: { ok: true },
        };
      },
    });

    const reviewPath = path.join(repo.root, '.quiver', 'approvals', 'plan-review', 'review.md');
    const metaPath = path.join(repo.root, '.quiver', 'approvals', 'plan-review', 'meta.json');
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

    assert.equal(result.inputKind, 'draft');
    assert.equal(result.inputVersion, 1);
    assert.equal(fs.readFileSync(reviewPath, 'utf8'), 'review output\n');
    assert.equal(meta.source_file, '.quiver/approvals/technical-plan/drafts/001.md');
    assert.equal(meta.source_kind, 'draft');
    assert.equal(meta.source_version, 1);
    assert.equal(readPlanReview(repo.root).status, 'unapproved');

    const approveOutput = execAi(repo.root, ['approve', '--phase', 'technical-plan', '--version', '1']);
    const approvalsOutput = execAi(repo.root, ['approvals']);

    assert.match(approveOutput, /Version: v1/);
    assert.equal(readPlanReview(repo.root).status, 'reviewed');
    assert.match(approvalsOutput, /Phase: plan-review/);
    assert.match(approvalsOutput, /Status: reviewed/);
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

test('ai review-plan marks review stale when a different technical-plan version is approved', async () => {
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
    execAi(repo.root, ['approve', '--phase', 'technical-plan', '--version', '2']);

    assert.equal(readPlanReview(repo.root).status, 'stale');
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
    approvePlannerPhase(repo.root, 'technical-plan', 'technical-plan.md', fs.readFileSync(path.join(repo.root, 'technical-plan.md'), 'utf8'));

    assert.throws(
      () => execAi(repo.root, ['plan', '--phase', 'spec', '--dry-run']),
      (error) => error.stderr.includes('requires a reviewed and approved technical-plan input')
        && error.stderr.includes('current review status: missing'),
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
