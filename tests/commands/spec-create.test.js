const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const {
  approvePlannerPhase,
  readPhaseApproval,
  savePlannerDraft,
} = require('../../src/create-quiver/lib/approvals');
const { savePlanReview } = require('../../src/create-quiver/lib/ai/plan-review');
const { runApprove, runPlan, runReviewPlan } = require('../../src/create-quiver/commands/ai');
const { runCreateSpec } = require('../../src/create-quiver/commands/spec');
const {
  GovernanceError,
  buildDefaultGovernanceConfig,
  resolveEffectiveProfile,
} = require('../../src/create-quiver/lib/ai/review-governance');
const {
  createAiRun,
  updateAiRunPhase,
} = require('../../src/create-quiver/lib/ai/run-state');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function makeRepo(structure = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-spec-create-'));
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

function execCli(repoRoot, args = [], env = {}) {
  return execFileSync('node', [BIN_PATH, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, QUIVER_LANG: 'en', ...env },
  });
}

function approvedPlanManifest() {
  return {
    spec: {
      slug: 'quiver-v23-created-spec',
      title: 'Quiver v23 created spec',
      ticket: 'QUIVER-23-CREATE',
      objective: 'Create a spec from a reviewed approved plan.',
      acceptance: [
        'slice-00 exists',
        'pr.md exists',
      ],
      slices: [
        {
          slice_id: 'slice-01-create-core',
          ticket: 'QUIVER-23-CREATE',
          title: 'Create core',
          objective: 'Render the spec tree from the approved plan.',
          description: 'Generate the expected files.',
          files: ['src/create-quiver/commands/spec.js'],
          acceptance: ['Spec create writes a valid spec tree.'],
        },
      ],
    },
  };
}

function seedReviewedApprovedPlan(repoRoot) {
  writeFile(path.join(repoRoot, 'technical-plan.json'), `${JSON.stringify(approvedPlanManifest(), null, 2)}\n`);
  savePlannerDraft(repoRoot, 'technical-plan', 'technical-plan.json', fs.readFileSync(path.join(repoRoot, 'technical-plan.json'), 'utf8'));
  savePlanReview(repoRoot, {
    contents: 'reviewed\n',
    inputPath: '.quiver/approvals/technical-plan/drafts/001.md',
    inputKind: 'draft',
    inputVersion: 1,
  });
  execCli(repoRoot, ['ai', 'approve', '--phase', 'technical-plan', '--version', '1']);
}

function governedApprovedContext(repoRoot) {
  const source = approvedPlanManifest();
  const runId = 'run-spec-create-governed';
  const reviewId = 'R-001';
  return {
    canonicalRoot: repoRoot,
    inputPath: `.quiver/runs/${runId}/approvals/technical-plan/v001.md`,
    inputText: `${JSON.stringify(source, null, 2)}\n`,
    governanceState: {
      schema_version: 1,
      run_id: runId,
      next_finding_number: 1,
      current_review_id: reviewId,
      reviews: [],
      findings: [],
      dispositions: [],
      condition_evaluations: [],
      conditioned_candidates: [],
      decisions: [],
      updated_at: '2099-08-27T12:00:00.000Z',
    },
    decision: {
      decision_id: 'A-002',
      decision_sha256: `sha256:${'1'.repeat(64)}`,
      run_id: runId,
      review_id: reviewId,
      phase: 'technical-plan',
      decision: 'approved',
      publication_state: 'final',
      candidate_id: null,
      evaluation_id: null,
      version: 1,
      artifact_path: `.quiver/runs/${runId}/approvals/technical-plan/v001.md`,
      artifact_sha256: `sha256:${'2'.repeat(64)}`,
      input_path: `.quiver/runs/${runId}/approvals/acceptance/v001.md`,
      input_sha256: `sha256:${'3'.repeat(64)}`,
      review_sha256: `sha256:${'4'.repeat(64)}`,
      finding_count: 0,
      criterion_count: 1,
      disposition_ids: [],
      disposition_sha256: `sha256:${'5'.repeat(64)}`,
      reason_path: null,
      reason_sha256: null,
      reviewer_recommendation: 'approve',
      reviewer_approved: null,
      recorded_at: '2099-08-27T12:01:00.000Z',
    },
  };
}

function governedReviewOutput() {
  return `${JSON.stringify({
    schema_version: 2,
    kind: 'quiver-plan-review',
    review: {
      recommendation: 'approve',
      blocking: false,
      findings: [],
      plan_required_fixes: [],
      slice_required_fixes: [],
      pr_required_fixes: [],
      follow_ups: [],
      optional_hardening: [],
    },
  })}\n`;
}

function providerSuccess(repoRoot, stdout) {
  return {
    ok: true,
    dryRun: false,
    provider: 'codex',
    command: 'codex',
    args: ['exec'],
    cwd: repoRoot,
    timeoutMs: 0,
    promptTransport: { mode: 'stdin' },
    exitCode: 0,
    stdout,
    stderr: '',
    error: null,
    preflight: { ok: true },
    payloadReceived: true,
  };
}

async function seedCanonicalApprovedPlan(repoRoot) {
  const runId = 'run-spec-create-ledger';
  const actor = {
    actor_id: 'github:github.com:58',
    provider: 'github-cli',
    provider_subject: 'github:github.com:58',
    verified: true,
  };
  const governance = buildDefaultGovernanceConfig();
  governance.policy.authorization.actor_bindings[actor.provider_subject] = {
    actor_id: actor.actor_id,
    roles: ['maintainer'],
  };
  governance.policy.authorization.actions.approve = {
    allowed_actor_ids: [],
    allowed_roles: ['maintainer'],
    independence: 'none',
  };
  const profile = resolveEffectiveProfile({
    governance,
    requirementCategories: governance.requirement_categories,
  });
  const binding = {
    requested_profile: profile.requested_profile,
    effective_profile: profile.effective_profile,
    policy_version: profile.policy_version,
    policy_digest: profile.policy_digest,
    requirement_categories: [...governance.requirement_categories],
  };
  writeFile(path.join(repoRoot, 'requirements.md'), '# Requirement\n\nCreate a spec from canonical approvals.\n');
  writeFile(path.join(repoRoot, '.quiver/config.json'), `${JSON.stringify({ governance }, null, 2)}\n`);
  createAiRun(repoRoot, { input: 'requirements.md', runId, governance: binding });

  savePlannerDraft(repoRoot, 'acceptance', 'requirements.md', `${JSON.stringify({
    spec: { acceptance: ['AC-01 creates the approved spec.'] },
  }, null, 2)}\n`, { requireDigestBindings: true });
  const acceptanceDraft = readPhaseApproval(repoRoot, 'acceptance').meta.drafts[0];
  updateAiRunPhase(repoRoot, runId, 'acceptance-draft', {
    artifact: acceptanceDraft.path,
    command: 'ai plan --phase acceptance',
  });
  await runApprove(repoRoot, {
    actor,
    digestBound: true,
    phase: 'acceptance',
    publishFinal: true,
    runId,
    version: 1,
  });
  await runPlan(repoRoot, {
    phase: 'technical-plan',
    runId,
    runProviderFn: async () => providerSuccess(
      repoRoot,
      `${JSON.stringify(approvedPlanManifest(), null, 2)}\n`,
    ),
  });
  await runReviewPlan(repoRoot, {
    runId,
    runProviderFn: async () => providerSuccess(repoRoot, governedReviewOutput()),
  });
  await runApprove(repoRoot, {
    actor,
    digestBound: true,
    phase: 'technical-plan',
    runId,
    version: 1,
  });
  return runId;
}

test('spec create dry-run previews files and next safe commands without writing', () => {
  const repo = makeRepo();

  try {
    seedReviewedApprovedPlan(repo.root);
    const output = execCli(repo.root, ['spec', 'create', '--dry-run']);

    assert.match(output, /Quiver spec create dry-run/);
    assert.match(output, /Spec slug: quiver-v23-created-spec/);
    assert.match(output, /Target: specs\/quiver-v23-created-spec/);
    assert.match(output, /slices\/slice-00-spec-foundation\/slice\.json/);
    assert.match(output, /Next safe commands:/);
    assert.match(output, /npx create-quiver spec start specs\/quiver-v23-created-spec/);
    assert.equal(fs.existsSync(path.join(repo.root, 'specs', 'quiver-v23-created-spec')), false);
  } finally {
    repo.cleanup();
  }
});

test('spec create --review dry-run advertises review without opening an editor or writing', () => {
  const repo = makeRepo();

  try {
    seedReviewedApprovedPlan(repo.root);
    const output = execCli(repo.root, ['spec', 'create', '--dry-run', '--review']);

    assert.match(output, /Quiver spec create dry-run/);
    assert.match(output, /Review requested: yes \(dry-run preview only; no editor opened and no files written\)\./);
    assert.equal(fs.existsSync(path.join(repo.root, 'specs', 'quiver-v23-created-spec')), false);
  } finally {
    repo.cleanup();
  }
});

test('spec create dry-run renders Spanish from explicit language without translating commands', () => {
  const repo = makeRepo();

  try {
    seedReviewedApprovedPlan(repo.root);
    const output = execCli(repo.root, ['--lang', 'es', 'spec', 'create', '--dry-run']);

    assert.match(output, /Dry-run de spec create de Quiver/);
    assert.match(output, /Slug de spec: quiver-v23-created-spec/);
    assert.match(output, /Archivo de entrada:/);
    assert.match(output, /Destino: specs\/quiver-v23-created-spec/);
    assert.match(output, /Proximos comandos seguros:/);
    assert.match(output, /npx create-quiver spec start specs\/quiver-v23-created-spec/);
    assert.match(output, /No se escribiran archivos en modo dry-run\./);
    assert.equal(fs.existsSync(path.join(repo.root, 'specs', 'quiver-v23-created-spec')), false);
  } finally {
    repo.cleanup();
  }
});

test('spec create review dry-run renders Spanish review wrapper safely', () => {
  const repo = makeRepo();

  try {
    seedReviewedApprovedPlan(repo.root);
    const output = execCli(repo.root, ['--lang', 'es', 'spec', 'create', '--dry-run', '--review']);

    assert.match(output, /Dry-run de spec create de Quiver/);
    assert.match(output, /Revision solicitada: si \(preview dry-run solamente; no se abre editor ni se escriben archivos\)\./);
    assert.equal(fs.existsSync(path.join(repo.root, 'specs', 'quiver-v23-created-spec')), false);
  } finally {
    repo.cleanup();
  }
});

test('spec create dry-run uses configured project language when no flag is provided', () => {
  const repo = makeRepo();

  try {
    seedReviewedApprovedPlan(repo.root);
    writeFile(path.join(repo.root, '.quiver', 'config.json'), `${JSON.stringify({ language: 'es' }, null, 2)}\n`);
    const output = execCli(repo.root, ['spec', 'create', '--dry-run'], { QUIVER_LANG: '' });

    assert.match(output, /Dry-run de spec create de Quiver/);
    assert.match(output, /Proximos comandos seguros:/);
    assert.match(output, /npx create-quiver spec status specs\/quiver-v23-created-spec/);
  } finally {
    repo.cleanup();
  }
});

test('spec create --review cancellation blocks writes', async () => {
  const repo = makeRepo();

  try {
    seedReviewedApprovedPlan(repo.root);
    await assert.rejects(
      runCreateSpec(repo.root, {
        review: true,
        openEditorFn: () => ({ ok: false, canceled: true, reason: 'review canceled' }),
      }),
      /review canceled/,
    );
    assert.equal(fs.existsSync(path.join(repo.root, 'specs', 'quiver-v23-created-spec')), false);
  } finally {
    repo.cleanup();
  }
});

test('spec create --interactive can decline writes', async () => {
  const repo = makeRepo();

  try {
    seedReviewedApprovedPlan(repo.root);
    const selections = [];
    await assert.rejects(
      runCreateSpec(repo.root, {
        interactive: true,
        language: 'es',
        promptSelect: async (message, options) => {
          selections.push(message);
          return options.find((option) => option.default)?.value || options[0].value;
        },
        promptConfirm: async () => false,
        stdinIsTTY: true,
        stdoutIsTTY: true,
        stderrIsTTY: true,
        write: () => {},
      }),
      /aprobacion interactiva de spec create rechazada/,
    );
    assert.deepEqual(selections, [
      'Que metodologia aplica esta spec?',
      'Que plan aprobado queres usar?',
      'Como queres revisar antes de escribir?',
    ]);
    assert.equal(fs.existsSync(path.join(repo.root, 'specs', 'quiver-v23-created-spec')), false);
  } finally {
    repo.cleanup();
  }
});

test('spec create --interactive writes after guided summary approval', async () => {
  const repo = makeRepo();
  const writes = [];

  try {
    seedReviewedApprovedPlan(repo.root);
    const result = await runCreateSpec(repo.root, {
      interactive: true,
      language: 'es',
      promptSelect: async (message, options) => {
        if (message.includes('metodologia')) {
          return 'wdd-sdd';
        }
        return options.find((option) => option.default)?.value || options[0].value;
      },
      promptConfirm: async () => true,
      stdinIsTTY: true,
      stdoutIsTTY: true,
      stderrIsTTY: true,
      write: (text) => writes.push(text),
    });

    assert.equal(result.specSlug, 'quiver-v23-created-spec');
    assert.equal(fs.existsSync(path.join(repo.root, 'specs', 'quiver-v23-created-spec', 'SPEC.md')), true);
    assert.ok(writes.some((line) => line.includes('Spec create')));
    assert.ok(writes.some((line) => line.includes('Metodologia: WDD + SDD')));
    assert.ok(writes.some((line) => line.includes('Plan tecnico: aprobado, v1, review=approve-with-risk')));
  } finally {
    repo.cleanup();
  }
});

test('spec create writes the generated spec tree and refuses collisions', () => {
  const repo = makeRepo();

  try {
    seedReviewedApprovedPlan(repo.root);
    const output = execCli(repo.root, ['spec', 'create']);
    const specDir = path.join(repo.root, 'specs', 'quiver-v23-created-spec');

    assert.match(output, /Quiver spec created/);
    assert.match(output, /Next safe commands:/);
    assert.ok(fs.existsSync(path.join(specDir, 'SPEC.md')));
    assert.ok(fs.existsSync(path.join(specDir, 'STATUS.md')));
    assert.ok(fs.existsSync(path.join(specDir, 'EVIDENCE_REPORT.md')));
    assert.ok(fs.existsSync(path.join(specDir, 'EXECUTION_PLAN.md')));
    assert.ok(fs.existsSync(path.join(specDir, 'pr.md')));
    assert.ok(fs.existsSync(path.join(specDir, 'slices', 'slice-00-spec-foundation', 'slice.json')));
    assert.ok(fs.existsSync(path.join(specDir, 'slices', 'slice-01-create-core', 'EXECUTION_BRIEF.md')));

    const sliceJson = JSON.parse(fs.readFileSync(path.join(specDir, 'slices', 'slice-01-create-core', 'slice.json'), 'utf8'));
    assert.deepEqual(sliceJson.depends_on, ['slice-00-spec-foundation']);
    assert.deepEqual(sliceJson.allowed_write_paths, ['src/create-quiver/commands/spec.js']);
    assert.deepEqual(sliceJson.validation_hints, []);
    assert.ok(sliceJson.expected_read_paths.includes('specs/quiver-v23-created-spec/SPEC.md'));

    assert.throws(
      () => execCli(repo.root, ['spec', 'create']),
      (error) => error.stderr.includes('spec directory already exists: specs/quiver-v23-created-spec'),
    );
  } finally {
    repo.cleanup();
  }
});

test('spec create collision error localizes', () => {
  const repo = makeRepo();

  try {
    seedReviewedApprovedPlan(repo.root);
    execCli(repo.root, ['spec', 'create']);

    assert.throws(
      () => execCli(repo.root, ['--lang', 'es', 'spec', 'create']),
      (error) => {
        const output = `${error.stdout || ''}${error.stderr || ''}`;
        assert.match(output, /create-quiver: el directorio de spec ya existe: specs\/quiver-v23-created-spec/);
        return true;
      },
    );
  } finally {
    repo.cleanup();
  }
});

test('spec create blocks when the approved technical plan was not reviewed', () => {
  const repo = makeRepo();

  try {
    writeFile(path.join(repo.root, 'technical-plan.json'), `${JSON.stringify(approvedPlanManifest(), null, 2)}\n`);
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.json', fs.readFileSync(path.join(repo.root, 'technical-plan.json'), 'utf8'));
    approvePlannerPhase(repo.root, 'technical-plan', '', '', { version: 1 });

    assert.throws(
      () => execCli(repo.root, ['spec', 'create', '--dry-run']),
      (error) => error.stderr.includes('requires a reviewed and approved technical-plan input')
        && error.stderr.includes('current review status: missing'),
    );
  } finally {
    repo.cleanup();
  }
});

test('spec create fails before writing when approved plan lacks structured slices', () => {
  const repo = makeRepo({
    'technical-plan.md': '# Technical plan\n\nThis plan has no structured slice block.\n',
  });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', fs.readFileSync(path.join(repo.root, 'technical-plan.md'), 'utf8'));
    savePlanReview(repo.root, {
      contents: 'reviewed\n',
      inputPath: '.quiver/approvals/technical-plan/drafts/001.md',
      inputKind: 'draft',
      inputVersion: 1,
    });
    approvePlannerPhase(repo.root, 'technical-plan', '', '', { version: 1 });

    assert.throws(
      () => execCli(repo.root, ['spec', 'create', '--dry-run']),
      (error) => error.stderr.includes('approved technical plan must include a structured slices array'),
    );
    assert.equal(fs.existsSync(path.join(repo.root, 'specs')), false);
  } finally {
    repo.cleanup();
  }
});

test('spec create accepts a canonical unconditional decision and publishes its governance manifest', async () => {
  const repo = makeRepo();
  let preflightCalls = 0;

  try {
    const context = governedApprovedContext(repo.root);
    const result = await runCreateSpec(repo.root, {
      resolveGovernanceContextFn: () => {
        preflightCalls += 1;
        return context;
      },
    });
    const specDir = path.join(repo.root, result.specDir);
    assert.equal(preflightCalls, 2);
    assert.ok(fs.existsSync(path.join(specDir, 'GOVERNANCE_MANIFEST.json')));
    const governance = JSON.parse(fs.readFileSync(path.join(specDir, 'GOVERNANCE_MANIFEST.json'), 'utf8'));
    assert.equal(governance.decision.decision, 'approved');
    assert.deepEqual(governance.findings, []);
    assert.deepEqual(governance.dispositions, []);
    const slice = JSON.parse(fs.readFileSync(path.join(
      specDir,
      'slices',
      'slice-01-create-core',
      'slice.json',
    ), 'utf8'));
    assert.deepEqual(slice.planning_governance.pending_finding_ids, []);
  } finally {
    repo.cleanup();
  }
});

test('spec create resolves an on-disk canonical ledger without an injected governance resolver', async () => {
  const repo = makeRepo();

  try {
    const runId = await seedCanonicalApprovedPlan(repo.root);
    const result = await runCreateSpec(repo.root, { runId });
    const specDir = path.join(repo.root, result.specDir);
    const manifest = JSON.parse(
      fs.readFileSync(path.join(specDir, 'GOVERNANCE_MANIFEST.json'), 'utf8'),
    );

    assert.equal(manifest.source.run_id, runId);
    assert.equal(manifest.decision.decision, 'approved');
    assert.equal(manifest.decision.publication_state, 'final');
    assert.deepEqual(manifest.findings, []);
    assert.deepEqual(manifest.dispositions, []);
    assert.equal(fs.existsSync(path.join(specDir, 'SPEC.md')), true);
  } finally {
    repo.cleanup();
  }
});

test('spec create revalidates governance after preview and fails before publication when parity changes', async () => {
  const repo = makeRepo();
  const context = governedApprovedContext(repo.root);
  let preflightCalls = 0;

  try {
    await assert.rejects(
      runCreateSpec(repo.root, {
        resolveGovernanceContextFn: () => {
          preflightCalls += 1;
          if (preflightCalls === 2) {
            throw new GovernanceError('APPROVAL_BINDING_MISMATCH', 'Canonical state changed after preview.');
          }
          return context;
        },
      }),
      (error) => error.code === 'APPROVAL_BINDING_MISMATCH',
    );
    assert.equal(preflightCalls, 2);
    assert.equal(fs.existsSync(path.join(repo.root, 'specs', 'quiver-v23-created-spec')), false);
  } finally {
    repo.cleanup();
  }
});
