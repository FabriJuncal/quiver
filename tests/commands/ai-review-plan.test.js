const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const {
  runApprove,
  runExtendReviewBudget,
  runLifecycleRun,
  runReviewPlan,
  runRevise,
} = require('../../src/create-quiver/commands/ai');
const { approvePlannerPhase, readPhaseApproval, savePlannerDraft } = require('../../src/create-quiver/lib/approvals');
const {
  buildTechnicalPlanApprovalCandidates,
  readPlanReview,
  recoverGovernedPlanReviewCommit,
  saveGovernedPlanReview,
  summarizePlanReview,
} = require('../../src/create-quiver/lib/ai/plan-review');
const { buildDefaultGovernanceConfig, resolveEffectiveProfile } = require('../../src/create-quiver/lib/ai/review-governance');
const {
  REVIEW_BUDGET_NEXT_ACTIONS,
  extendReviewBudget,
  readReviewBudget,
  readReviewBudgetEvents,
} = require('../../src/create-quiver/lib/ai/review-budget');
const {
  bindAiRunGovernance,
  createAiRun,
  listAiRuns,
  readAiRun,
  readAiRunLock,
  readRunGovernance,
  runReviewCommitPath,
  updateAiRunPhase,
} = require('../../src/create-quiver/lib/ai/run-state');

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

function snapshotFileContents(root) {
  const snapshot = {};
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(filePath);
      else snapshot[path.relative(root, filePath).split(path.sep).join('/')] = fs.readFileSync(filePath).toString('base64');
    }
  };
  visit(root);
  return snapshot;
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

function governedReviewOutput(findings = []) {
  const planRequiredFixes = findings
    .filter((finding) => finding.phase_owner === 'technical-plan'
      && finding.phase_blocking === true
      && ['security', 'data-integrity', 'rollout', 'architecture', 'business-rule'].includes(finding.category))
    .map((finding) => finding.id);
  const sliceRequiredFixes = findings.filter((finding) => finding.phase_owner === 'slice').map((finding) => finding.id);
  const prRequiredFixes = findings.filter((finding) => finding.phase_owner === 'pr-review').map((finding) => finding.id);
  const followUps = findings.filter((finding) => finding.phase_owner === 'follow-up' || finding.category === 'follow-up' || finding.recommended_disposition === 'create-follow-up').map((finding) => finding.id);
  const optionalHardening = findings.filter((finding) => finding.category === 'optional-hardening' || finding.recommended_disposition === 'optional').map((finding) => finding.id);
  return `${JSON.stringify({
    schema_version: 2,
    kind: 'quiver-plan-review',
    review: {
      recommendation: planRequiredFixes.length > 0 ? 'revise' : findings.length > 0 ? 'approve-with-risk' : 'approve',
      blocking: planRequiredFixes.length > 0,
      findings,
      plan_required_fixes: planRequiredFixes,
      slice_required_fixes: sliceRequiredFixes,
      pr_required_fixes: prRequiredFixes,
      follow_ups: followUps,
      optional_hardening: optionalHardening,
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

function providerFailure(repoRoot, options = {}) {
  return {
    ok: false,
    dryRun: false,
    provider: 'codex',
    command: 'codex',
    args: ['exec'],
    cwd: repoRoot,
    timeoutMs: 0,
    promptTransport: { mode: 'stdin' },
    exitCode: null,
    signal: options.signal || null,
    stdout: options.stdout || '',
    stderr: options.stderr || '',
    error: {
      code: options.code || 'PROVIDER_RUN_FAILED',
      message: options.message || 'provider failed',
    },
    preflight: { ok: true },
    payloadReceived: options.payloadReceived === true,
  };
}

function seedGovernedTechnicalPlanRun(repoRoot, runId, governance, artifactPath, requestedProfile) {
  const profile = resolveEffectiveProfile({
    governance,
    requestedProfile: requestedProfile || governance.requested_profile,
    requirementCategories: governance.requirement_categories,
  });
  const binding = {
    requested_profile: profile.requested_profile,
    effective_profile: profile.effective_profile,
    policy_version: profile.policy_version,
    policy_digest: profile.policy_digest,
    requirement_categories: [...governance.requirement_categories],
  };
  createAiRun(repoRoot, { runId, governance: binding });
  return updateAiRunPhase(repoRoot, runId, 'technical-plan-draft', {
    artifact: artifactPath,
    command: 'ai plan --phase technical-plan',
  });
}

function latestDraftArtifact(repoRoot, phase = 'technical-plan') {
  const drafts = readPhaseApproval(repoRoot, phase).meta?.drafts || [];
  return drafts.at(-1)?.path || '';
}

function conditionedApprovalActor(suffix = '42') {
  return {
    actor_id: `github:github.com:${suffix}`,
    provider: 'github-cli',
    provider_subject: `github:github.com:${suffix}`,
    verified: true,
  };
}

function allowConditionedApproval(governance, actor) {
  governance.policy.authorization.actor_bindings[actor.provider_subject] = {
    actor_id: actor.actor_id,
    roles: ['maintainer'],
  };
  governance.policy.authorization.actions['approve-with-conditions'] = {
    allowed_actor_ids: [],
    allowed_roles: ['maintainer'],
    independence: 'none',
  };
}

function transferableSliceFinding(overrides = {}) {
  return {
    id: 'provider-slice-1',
    title: 'Carry validation into the implementation slice',
    summary: 'The implementation slice must preserve the directed validation evidence.',
    severity: 'medium',
    category: 'implementation-detail',
    phase_owner: 'slice',
    phase_blocking: false,
    evidence: ['technical-plan.md#/validation'],
    acceptance_refs: ['AC-10'],
    recommended_disposition: 'transfer-to-slice',
    confidence: 'high',
    ...overrides,
  };
}

function conditionEnvelope(repoRoot, runId, dispositions) {
  const run = readAiRun(repoRoot, runId);
  const state = readRunGovernance(repoRoot, runId);
  return {
    schema_version: 1,
    run_id: runId,
    review_id: state.current_review_id,
    policy_version: run.governance.policy_version,
    policy_digest: run.governance.policy_digest,
    dispositions,
  };
}

async function captureStdout(run) {
  const originalWrite = process.stdout.write;
  let output = '';
  process.stdout.write = (chunk) => {
    output += String(chunk);
    return true;
  };
  try {
    return { result: await run(), output };
  } finally {
    process.stdout.write = originalWrite;
  }
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

test('governed review preserves the last valid state and omission does not close an open blocker', async () => {
  const governance = buildDefaultGovernanceConfig();
  governance.requirement_categories = ['auth'];
  const budgetActor = {
    actor_id: 'github:github.com:42',
    provider: 'github-cli',
    provider_subject: 'github:github.com:42',
    verified: true,
  };
  governance.policy.authorization.actor_bindings[budgetActor.provider_subject] = {
    actor_id: budgetActor.actor_id,
    roles: ['maintainer'],
  };
  governance.policy.authorization.actions['extend-review-budget'] = {
    allowed_actor_ids: [],
    allowed_roles: ['maintainer'],
    independence: 'none',
  };
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('governed-plan'),
    '.quiver/config.json': `${JSON.stringify({ governance }, null, 2)}\n`,
  });
  const blocker = {
    id: 'provider-security-1',
    title: 'Missing authorization boundary',
    summary: 'The plan does not verify the actor before the protected mutation.',
    severity: 'high',
    category: 'security',
    phase_owner: 'technical-plan',
    phase_blocking: true,
    blocking_justification: 'Authorization must be defined before implementation can be safe.',
    evidence: ['technical-plan.md#/admin-flow'],
    acceptance_refs: ['AC-03'],
    recommended_disposition: 'revise-plan',
    confidence: 'high',
  };

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('governed-plan'));
    seedGovernedTechnicalPlanRun(
      repo.root,
      'run-governed-review',
      governance,
      latestDraftArtifact(repo.root),
      'fast-delivery',
    );
    const first = await runReviewPlan(repo.root, {
      governanceProfile: 'fast-delivery',
      runId: 'run-governed-review',
      runProviderFn: async () => providerSuccess(repo.root, governedReviewOutput([blocker])),
    });
    const metaPath = path.join(repo.root, '.quiver/approvals/plan-review/meta.json');
    const governancePath = path.join(repo.root, '.quiver/runs/run-governed-review/review-governance.json');
    const firstMetaBytes = fs.readFileSync(metaPath);
    const firstGovernanceBytes = fs.readFileSync(governancePath);
    const firstState = readRunGovernance(repo.root, 'run-governed-review');

    assert.equal(first.reviewId, 'R-001');
    assert.equal(first.governance.requested_profile, 'fast-delivery');
    assert.equal(first.governance.effective_profile, 'high-assurance');
    assert.equal(readAiRun(repo.root, 'run-governed-review').phase, 'technical-plan-reviewed');
    assert.equal(firstState.findings[0].finding_id, 'F-001');
    assert.equal(firstState.reviews[0].projection.blocking, true);
    const targetedIntent = () => ({
      event_class: 'targeted',
      base_review_id: 'R-001',
      finding_ids: ['F-001'],
      sections: [],
    });
    const extendBudget = () => extendReviewBudget(repo.root, {
      runId: 'run-governed-review',
      governance,
      profile: first.governance,
      actor: budgetActor,
    });

    await assert.rejects(
      () => runReviewPlan(repo.root, {
        runId: 'run-governed-review',
        reviewIntent: targetedIntent('malformed-output-contract'),
        runProviderFn: async () => providerSuccess(repo.root, 'authorization: bearer secret-value\nnot json\n'),
      }),
      (error) => error.code === 'PROVIDER_OUTPUT_INVALID',
    );
    assert.deepEqual(fs.readFileSync(metaPath), firstMetaBytes);
    assert.deepEqual(fs.readFileSync(governancePath), firstGovernanceBytes);
    assert.equal(readReviewBudget(repo.root, 'run-governed-review', {
      governance,
      profile: first.governance,
    }).projection.counts.invalid_output_count, 1);

    extendBudget();
    await assert.rejects(
      () => runReviewPlan(repo.root, {
        runId: 'run-governed-review',
        reviewIntent: targetedIntent('sensitive-contract-output'),
        runProviderFn: async () => providerSuccess(repo.root, governedReviewOutput([{
          ...blocker,
          summary: 'authorization: bearer contract-secret-value-123456789',
        }])),
      }),
      (error) => error.code === 'PROVIDER_OUTPUT_INVALID' && /sensitive values/.test(error.message),
    );
    assert.deepEqual(fs.readFileSync(metaPath), firstMetaBytes);
    assert.deepEqual(fs.readFileSync(governancePath), firstGovernanceBytes);

    extendBudget();
    await assert.rejects(
      () => runReviewPlan(repo.root, {
        runId: 'run-governed-review',
        reviewIntent: targetedIntent('provider-redaction'),
        runProviderFn: async () => ({
          ...providerSuccess(repo.root, governedReviewOutput([{
            ...blocker,
            summary: 'token=[REDACTED]',
          }])),
          outputRedaction: { stdout: true, stderr: false },
        }),
      }),
      (error) => error.code === 'PROVIDER_OUTPUT_INVALID' && /required secret redaction/.test(error.message),
    );
    assert.deepEqual(fs.readFileSync(metaPath), firstMetaBytes);
    assert.deepEqual(fs.readFileSync(governancePath), firstGovernanceBytes);

    extendBudget();
    let secondPrompt = '';
    await assert.rejects(
      () => runReviewPlan(repo.root, {
        runId: 'run-governed-review',
        reviewIntent: targetedIntent('canonical-finding-omission'),
        runProviderFn: async (provider, providerOptions) => {
          secondPrompt = providerOptions.prompt;
          return providerSuccess(repo.root, governedReviewOutput([]));
        },
      }),
      (error) => error.code === 'PROVIDER_OUTPUT_INVALID'
        && /canonical phase-aware findings/.test(error.message),
    );
    assert.match(secondPrompt, /Canonical finding context for this run/);
    assert.match(secondPrompt, /"finding_id": "F-001"/);
    assert.match(secondPrompt, new RegExp(firstState.findings[0].origin_fingerprint));
    assert.match(secondPrompt, /"summary": "The plan does not verify the actor/);
    assert.match(secondPrompt, /"severity": "high"/);
    assert.match(secondPrompt, /"blocking_justification": "Authorization must be defined/);
    assert.match(secondPrompt, /"recommended_disposition": "revise-plan"/);
    assert.match(secondPrompt, /"confidence": "high"/);
    assert.match(secondPrompt, /Immutable review scope intent/);
    assert.match(secondPrompt, /"event_class": "targeted"/);
    assert.match(secondPrompt, /"finding_ids": \[/);
    assert.deepEqual(fs.readFileSync(metaPath), firstMetaBytes);
    assert.deepEqual(fs.readFileSync(governancePath), firstGovernanceBytes);

    extendBudget();
    const repeated = await runReviewPlan(repo.root, {
      runId: 'run-governed-review',
      reviewIntent: targetedIntent('canonical-finding-reconciliation'),
      runProviderFn: async () => providerSuccess(repo.root, governedReviewOutput([{
        ...blocker,
        id: 'provider-security-repeat',
        canonical_id: 'F-001',
      }])),
    });
    const repeatedMeta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    const repeatedState = readRunGovernance(repo.root, 'run-governed-review');
    assert.equal(repeated.reviewId, 'R-002');
    assert.equal(repeatedMeta.review_result.blocking, true);
    assert.equal(repeatedMeta.review_result.approval_recommendation, 'revise');
    assert.deepEqual(repeatedMeta.review_result.plan_required_fixes, ['F-001']);
    assert.equal(repeatedState.findings[0].state, 'open');
    assert.equal(repeatedState.reviews[1].provider_recommendation, 'revise');

    const rawContents = fs.readdirSync(path.join(repo.root, '.quiver/runs/run-governed-review/raw'))
      .map((name) => fs.readFileSync(path.join(repo.root, '.quiver/runs/run-governed-review/raw', name), 'utf8'))
      .join('\n');
    assert.equal(rawContents.includes('secret-value'), false);
    assert.equal(rawContents.includes('contract-secret-value'), false);
    assert.match(rawContents, /"contractual": false/);
    assert.equal(fs.readdirSync(path.join(repo.root, '.quiver/runs/run-governed-review/raw')).length, 6);

    const tamperedMeta = JSON.parse(JSON.stringify(repeatedMeta));
    tamperedMeta.review_result.blocking = false;
    tamperedMeta.review_result.approval_recommendation = 'approve';
    tamperedMeta.review_result.required_fixes = [];
    tamperedMeta.review_result.plan_required_fixes = [];
    tamperedMeta.review_result.current_blockers = [];
    writeFile(metaPath, `${JSON.stringify(tamperedMeta, null, 2)}\n`);
    await assert.rejects(
      () => runApprove(repo.root, {
        phase: 'technical-plan',
        runId: 'run-governed-review',
        version: 1,
      }),
      (error) => error.code === 'GOVERNANCE_STATE_INVALID'
        && error.details.mismatches.includes('review_result_projection'),
    );
    assert.equal(readPhaseApproval(repo.root, 'technical-plan').status, 'draft');
  } finally {
    repo.cleanup();
  }
});

test('governed approval is default-deny before mutation and records explicit authorization', async () => {
  const governance = buildDefaultGovernanceConfig();
  const actor = {
    actor_id: 'github:github.com:42',
    provider: 'github-cli',
    provider_subject: 'github:github.com:42',
    verified: true,
  };
  const unknownActor = {
    ...actor,
    actor_id: 'github:github.com:99',
    provider_subject: 'github:github.com:99',
  };
  governance.policy.authorization.actor_bindings[actor.provider_subject] = {
    actor_id: actor.actor_id,
    roles: ['maintainer'],
  };
  governance.policy.authorization.actions.approve = {
    allowed_actor_ids: [],
    allowed_roles: ['maintainer'],
    independence: 'none',
  };
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('authorized-plan'),
    '.quiver/config.json': `${JSON.stringify({ governance }, null, 2)}\n`,
  });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('authorized-plan'));
    seedGovernedTechnicalPlanRun(
      repo.root,
      'run-governed-approval',
      governance,
      latestDraftArtifact(repo.root),
    );
    await runReviewPlan(repo.root, {
      runId: 'run-governed-approval',
      runProviderFn: async () => providerSuccess(repo.root, governedReviewOutput([])),
    });

    await assert.rejects(
      () => runApprove(repo.root, { actor: unknownActor, phase: 'technical-plan', runId: 'run-governed-approval', version: 1 }),
      /AUTHORIZATION_ACTOR_UNKNOWN/,
    );
    assert.equal(readPhaseApproval(repo.root, 'technical-plan').status, 'draft');

    const approved = await runApprove(repo.root, {
      actor,
      phase: 'technical-plan',
      runId: 'run-governed-approval',
      version: 1,
    });
    const approvals = JSON.parse(fs.readFileSync(path.join(repo.root, '.quiver/runs/run-governed-approval/approvals.json'), 'utf8'));
    assert.equal(approved.governance.effective_profile, 'fast-delivery');
    assert.equal(readPhaseApproval(repo.root, 'technical-plan').status, 'approved');
    assert.equal(approvals.approvals[0].governance.actor.actor_id, actor.actor_id);
    assert.deepEqual(approvals.approvals[0].governance.authorization.matched_roles, ['maintainer']);
  } finally {
    repo.cleanup();
  }
});

test('conditioned approval persists only an eligible non-final candidate and keeps reviewer non-approval visible', async () => {
  const governance = buildDefaultGovernanceConfig();
  const actor = conditionedApprovalActor();
  allowConditionedApproval(governance, actor);
  const runId = 'run-conditioned-candidate';
  const reasonText = 'The remaining implementation finding is accepted only as an explicit slice obligation.';
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('conditioned-candidate'),
    'condition-reason.md': `${reasonText}\n`,
    '.quiver/config.json': `${JSON.stringify({ governance }, null, 2)}\n`,
  });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('conditioned-candidate'));
    seedGovernedTechnicalPlanRun(repo.root, runId, governance, latestDraftArtifact(repo.root));
    await runReviewPlan(repo.root, {
      runId,
      runProviderFn: async () => providerSuccess(repo.root, governedReviewOutput([transferableSliceFinding()])),
    });
    const conditionsPath = path.join(repo.root, 'conditions.json');
    const disposition = {
      finding_id: 'F-001',
      action: 'transfer-to-slice',
      target: 'slice-04-digest-bound-approvals',
      evidence_obligations: ['Record the directed slice validation result.'],
    };
    writeFile(conditionsPath, `${JSON.stringify(conditionEnvelope(repo.root, runId, [disposition]), null, 2)}\n`);
    const governancePath = path.join(repo.root, `.quiver/runs/${runId}/review-governance.json`);
    const beforeDryRun = fs.readFileSync(governancePath);

    writeFile(path.join(repo.root, 'conditions-duplicate-evidence.json'), `${JSON.stringify(conditionEnvelope(repo.root, runId, [{
      ...disposition,
      evidence_obligations: ['Duplicate obligation.', 'Duplicate obligation.'],
    }]), null, 2)}\n`);
    await assert.rejects(
      () => runApprove(repo.root, {
        actor,
        conditionsFile: 'conditions-duplicate-evidence.json',
        decision: 'approved-with-conditions',
        phase: 'technical-plan',
        reasonFile: 'condition-reason.md',
        runId,
        version: 1,
      }),
      (error) => error.code === 'DISPOSITION_UNRESOLVED',
    );
    assert.deepEqual(fs.readFileSync(governancePath), beforeDryRun);

    const preview = await captureStdout(() => runApprove(repo.root, {
      actor,
      conditionsFile: 'conditions.json',
      decision: 'approved-with-conditions',
      dryRun: true,
      now: new Date('2026-08-25T18:30:00.000Z'),
      phase: 'technical-plan',
      reasonFile: './condition-reason.md',
      runId,
      version: 1,
    }));
    assert.equal(preview.result.dry_run, true);
    assert.equal(preview.result.eligibility.code, 'ELIGIBLE_WITH_CONDITIONS');
    assert.match(preview.output, /Publication state: candidate/);
    assert.match(preview.output, /Reviewer recommendation: approve-with-risk/);
    assert.match(preview.output, /Reviewer approved: no/);
    assert.match(preview.output, /Final decision published: no/);
    assert.match(preview.output, /No files were changed\./);
    assert.deepEqual(fs.readFileSync(governancePath), beforeDryRun);

    const committed = await captureStdout(() => runApprove(repo.root, {
      actor,
      conditionsFile: 'conditions.json',
      decision: 'approved-with-conditions',
      now: new Date('2026-08-25T18:31:00.000Z'),
      phase: 'technical-plan',
      reasonFile: './condition-reason.md',
      runId,
      version: 1,
    }));
    const state = readRunGovernance(repo.root, runId);
    const approvals = JSON.parse(fs.readFileSync(path.join(repo.root, `.quiver/runs/${runId}/approvals.json`), 'utf8'));
    const serializedState = JSON.stringify(state);

    assert.equal(committed.result.decision, 'approved-with-conditions');
    assert.equal(committed.result.publication_state, 'candidate');
    assert.equal(committed.result.reviewer_recommendation, 'approve-with-risk');
    assert.equal(committed.result.reviewer_approved, false);
    assert.equal(committed.result.final_decision_published, false);
    assert.equal(committed.result.phase_advanced, false);
    assert.equal(committed.result.reason_path, 'condition-reason.md');
    assert.match(committed.output, /Legacy approved\.md written: no/);
    assert.equal(state.dispositions.length, 1);
    assert.equal(state.dispositions[0].state, 'current');
    assert.equal(state.condition_evaluations.length, 1);
    assert.equal(state.conditioned_candidates.length, 1);
    assert.equal(state.conditioned_candidates[0].publication_state, 'candidate');
    assert.equal(state.conditioned_candidates[0].reviewer_approved, false);
    assert.equal(serializedState.includes(reasonText), false);
    assert.equal(readAiRun(repo.root, runId).phase, 'technical-plan-reviewed');
    assert.equal(readPhaseApproval(repo.root, 'technical-plan').status, 'draft');
    assert.deepEqual(approvals.approvals, []);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver/approvals/technical-plan/approved.md')), false);

    const canonicalStateText = fs.readFileSync(governancePath, 'utf8');
    const actorTamper = JSON.parse(canonicalStateText);
    actorTamper.dispositions[0].actor_id = 'person:mallory';
    actorTamper.dispositions[0].authorization.actor_id = 'person:mallory';
    writeFile(governancePath, `${JSON.stringify(actorTamper, null, 2)}\n`);
    assert.throws(
      () => readRunGovernance(repo.root, runId),
      (error) => error.code === 'GOVERNANCE_STATE_INVALID'
        && error.details.issues.some((issue) => issue.message === 'condition evaluation disposition correlation is invalid'),
    );

    const recommendationTamper = JSON.parse(canonicalStateText);
    recommendationTamper.conditioned_candidates[0].reviewer_recommendation = 'approve';
    writeFile(governancePath, `${JSON.stringify(recommendationTamper, null, 2)}\n`);
    assert.throws(
      () => readRunGovernance(repo.root, runId),
      (error) => error.code === 'GOVERNANCE_STATE_INVALID'
        && error.details.issues.some((issue) => issue.message === 'conditioned candidate correlation is invalid'),
    );
    writeFile(governancePath, canonicalStateText);

    const beforeInvalidInputs = fs.readFileSync(governancePath);
    writeFile(path.join(repo.root, 'conditions-invalid.json'), '{not-json\n');
    writeFile(path.join(repo.root, 'conditions-invalid-schema.json'), '{"schema_version":1,"dispositions":[]}\n');
    for (const [conditionsFile, issue] of [
      ['conditions-missing.json', 'missing'],
      ['conditions-invalid.json', 'invalid-json'],
      ['conditions-invalid-schema.json', 'invalid-envelope'],
    ]) {
      await assert.rejects(
        () => runApprove(repo.root, {
          actor,
          conditionsFile,
          decision: 'approved-with-conditions',
          phase: 'technical-plan',
          reasonFile: 'condition-reason.md',
          runId,
          version: 1,
        }),
        (error) => {
          assert.equal(error.code, 'DISPOSITION_UNRESOLVED');
          assert.equal(error.details.input_issue, `conditions:${issue}`);
          return true;
        },
      );
      assert.deepEqual(fs.readFileSync(governancePath), beforeInvalidInputs);
    }

    const outsideReasonPath = path.join(os.tmpdir(), `quiver-condition-reason-${process.pid}-${Date.now()}.md`);
    writeFile(outsideReasonPath, '# Outside reason\n');
    fs.symlinkSync(outsideReasonPath, path.join(repo.root, 'condition-reason-link.md'));
    writeFile(path.join(repo.root, 'conditions-existing.json'), `${JSON.stringify(conditionEnvelope(repo.root, runId, []), null, 2)}\n`);
    try {
      await assert.rejects(
        () => runApprove(repo.root, {
          actor,
          conditionsFile: 'conditions-existing.json',
          decision: 'approved-with-conditions',
          phase: 'technical-plan',
          reasonFile: 'condition-reason-link.md',
          runId,
          version: 1,
        }),
        (error) => error.code === 'DISPOSITION_UNRESOLVED'
          && error.details.input_issue === 'reason:invalid-path',
      );
      assert.deepEqual(fs.readFileSync(governancePath), beforeInvalidInputs);
    } finally {
      fs.rmSync(outsideReasonPath, { force: true });
    }
  } finally {
    repo.cleanup();
  }
});

test('conditioned approval preserves authorization and protected-critical precedence without mutation', async () => {
  for (const scenario of ['unauthorized', 'protected-critical']) {
    const governance = buildDefaultGovernanceConfig();
    const actor = conditionedApprovalActor(scenario === 'unauthorized' ? '99' : '42');
    if (scenario === 'protected-critical') allowConditionedApproval(governance, actor);
    const runId = `run-conditioned-${scenario}`;
    const finding = scenario === 'protected-critical'
      ? transferableSliceFinding({
        category: 'security',
        id: 'provider-critical-security',
        severity: 'critical',
        title: 'Protected critical security finding',
      })
      : transferableSliceFinding();
    const repo = makeRepo({
      'technical-plan.md': structuredTechnicalPlanText(runId),
      'condition-reason.md': '# Condition reason\n',
      '.quiver/config.json': `${JSON.stringify({ governance }, null, 2)}\n`,
    });

    try {
      savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText(runId));
      seedGovernedTechnicalPlanRun(repo.root, runId, governance, latestDraftArtifact(repo.root));
      await runReviewPlan(repo.root, {
        runId,
        runProviderFn: async () => providerSuccess(repo.root, governedReviewOutput([finding])),
      });
      writeFile(path.join(repo.root, 'conditions.json'), `${JSON.stringify(conditionEnvelope(repo.root, runId, [{
        finding_id: 'F-001',
        action: 'transfer-to-slice',
        target: 'slice-04-digest-bound-approvals',
        evidence_obligations: ['Preserve this finding as downstream evidence.'],
      }]), null, 2)}\n`);
      const governancePath = path.join(repo.root, `.quiver/runs/${runId}/review-governance.json`);
      const before = fs.readFileSync(governancePath);
      const expectedCode = scenario === 'protected-critical'
        ? 'BREAK_GLASS_REQUIRED'
        : 'DISPOSITION_UNAUTHORIZED';

      await assert.rejects(
        () => runApprove(repo.root, {
          actor,
          conditionsFile: 'conditions.json',
          decision: 'approved-with-conditions',
          phase: 'technical-plan',
          reasonFile: 'condition-reason.md',
          runId,
          version: 1,
        }),
        (error) => error.code === expectedCode
          && (scenario !== 'protected-critical'
            || error.details.eligibility.code === 'PROTECTED_CRITICAL_REQUIRES_BREAK_GLASS'),
      );
      assert.deepEqual(fs.readFileSync(governancePath), before);
      assert.equal(readAiRun(repo.root, runId).phase, 'technical-plan-reviewed');
      assert.equal(readPhaseApproval(repo.root, 'technical-plan').status, 'draft');
      assert.equal(fs.existsSync(path.join(repo.root, '.quiver/approvals/technical-plan/approved.md')), false);
    } finally {
      repo.cleanup();
    }
  }
});

test('conditioned approval preserves a sanitized identity failure code without mutation', async () => {
  const governance = buildDefaultGovernanceConfig();
  const actor = conditionedApprovalActor();
  allowConditionedApproval(governance, actor);
  const runId = 'run-conditioned-identity-unavailable';
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText(runId),
    'condition-reason.md': '# Condition reason\n',
    '.quiver/config.json': `${JSON.stringify({ governance }, null, 2)}\n`,
  });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText(runId));
    seedGovernedTechnicalPlanRun(repo.root, runId, governance, latestDraftArtifact(repo.root));
    await runReviewPlan(repo.root, {
      runId,
      runProviderFn: async () => providerSuccess(repo.root, governedReviewOutput([transferableSliceFinding()])),
    });
    writeFile(path.join(repo.root, 'conditions.json'), `${JSON.stringify(conditionEnvelope(repo.root, runId, [{
      finding_id: 'F-001',
      action: 'transfer-to-slice',
      target: 'slice-04-digest-bound-approvals',
      evidence_obligations: ['Preserve this finding as downstream evidence.'],
    }]), null, 2)}\n`);
    const governancePath = path.join(repo.root, `.quiver/runs/${runId}/review-governance.json`);
    const before = fs.readFileSync(governancePath);

    await assert.rejects(
      () => runApprove(repo.root, {
        conditionsFile: 'conditions.json',
        decision: 'approved-with-conditions',
        phase: 'technical-plan',
        reasonFile: 'condition-reason.md',
        resolveActorFn: async () => {
          const error = new Error('sensitive identity adapter detail');
          error.code = 'GITHUB_IDENTITY_UNAVAILABLE';
          throw error;
        },
        runId,
        version: 1,
      }),
      (error) => {
        assert.equal(error.code, 'DISPOSITION_UNAUTHORIZED');
        assert.equal(error.details.eligibility.authorization_code, 'GITHUB_IDENTITY_UNAVAILABLE');
        assert.equal(JSON.stringify(error.details).includes('sensitive identity adapter detail'), false);
        return true;
      },
    );
    assert.deepEqual(fs.readFileSync(governancePath), before);
    assert.equal(readAiRun(repo.root, runId).phase, 'technical-plan-reviewed');
  } finally {
    repo.cleanup();
  }
});

test('governed approval rechecks canonical blockers under the run lock after identity resolution', async () => {
  const governance = buildDefaultGovernanceConfig();
  governance.requested_profile = 'high-assurance';
  const actor = {
    actor_id: 'github:github.com:42',
    provider: 'github-cli',
    provider_subject: 'github:github.com:42',
    verified: true,
  };
  governance.policy.authorization.actor_bindings[actor.provider_subject] = {
    actor_id: actor.actor_id,
    roles: ['maintainer'],
  };
  governance.policy.authorization.actions.approve = {
    allowed_actor_ids: [],
    allowed_roles: ['maintainer'],
    independence: 'none',
  };
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('approval-race-plan'),
    '.quiver/config.json': `${JSON.stringify({ governance }, null, 2)}\n`,
  });
  const blocker = {
    id: 'provider-race-blocker',
    title: 'Late authorization blocker',
    summary: 'The current review became blocking while approval identity was being resolved.',
    severity: 'high',
    category: 'security',
    phase_owner: 'technical-plan',
    phase_blocking: true,
    blocking_justification: 'Approval must consume the current canonical review.',
    evidence: ['technical-plan.md#/authorization'],
    acceptance_refs: ['AC-05'],
    recommended_disposition: 'revise-plan',
    confidence: 'high',
  };

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('approval-race-plan'));
    seedGovernedTechnicalPlanRun(repo.root, 'run-approval-race', governance, latestDraftArtifact(repo.root));
    await runReviewPlan(repo.root, {
      runId: 'run-approval-race',
      runProviderFn: async () => providerSuccess(repo.root, governedReviewOutput([])),
    });

    await assert.rejects(
      () => runApprove(repo.root, {
        phase: 'technical-plan',
        runId: 'run-approval-race',
        version: 1,
        resolveActorFn: async () => {
          await runReviewPlan(repo.root, {
            runId: 'run-approval-race',
            reviewIntent: {
              event_class: 'targeted',
              base_review_id: 'R-001',
              finding_ids: [],
              sections: ['objective'],
            },
            runProviderFn: async () => providerSuccess(repo.root, governedReviewOutput([blocker])),
          });
          return actor;
        },
      }),
      /blocked by plan review/,
    );
    const state = readRunGovernance(repo.root, 'run-approval-race');
    assert.equal(state.current_review_id, 'R-002');
    assert.equal(state.reviews[1].projection.blocking, true);
    assert.equal(readPhaseApproval(repo.root, 'technical-plan').status, 'draft');
    assert.equal(readAiRun(repo.root, 'run-approval-race').phase, 'technical-plan-reviewed');
  } finally {
    repo.cleanup();
  }
});

test('governed blocking review can revise to an owned draft and review again', async () => {
  const governance = buildDefaultGovernanceConfig();
  governance.requested_profile = 'high-assurance';
  const repo = makeRepo({
    'requirements.md': '# Requirements\n- Keep the review cycle traceable.\n',
    'technical-plan.md': structuredTechnicalPlanText('review-cycle-plan'),
    'feedback.md': '# Feedback\nAddress the current blocker.\n',
    '.quiver/config.json': `${JSON.stringify({ governance }, null, 2)}\n`,
  });
  const blocker = {
    id: 'provider-cycle-blocker',
    title: 'Review cycle blocker',
    summary: 'The plan needs a targeted correction before approval.',
    severity: 'high',
    category: 'architecture',
    phase_owner: 'technical-plan',
    phase_blocking: true,
    blocking_justification: 'The correction belongs to the technical plan.',
    evidence: ['technical-plan.md#/flow'],
    acceptance_refs: ['AC-04'],
    recommended_disposition: 'revise-plan',
    confidence: 'high',
  };

  try {
    savePlannerDraft(repo.root, 'acceptance', 'requirements.md', '# Accepted criteria\n');
    approvePlannerPhase(repo.root, 'acceptance', '', '', { version: 1 });
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('review-cycle-plan'));
    seedGovernedTechnicalPlanRun(repo.root, 'run-review-cycle', governance, latestDraftArtifact(repo.root));
    await runReviewPlan(repo.root, {
      runId: 'run-review-cycle',
      runProviderFn: async () => providerSuccess(repo.root, governedReviewOutput([blocker])),
    });
    assert.equal(readAiRun(repo.root, 'run-review-cycle').phase, 'technical-plan-reviewed');

    const revision = await runRevise(repo.root, {
      phase: 'technical-plan',
      input: 'feedback.md',
      runId: 'run-review-cycle',
      runProviderFn: async () => providerSuccess(repo.root, structuredTechnicalPlanText('review-cycle-plan-v2')),
    });
    const revisedRun = readAiRun(repo.root, 'run-review-cycle');
    assert.equal(revision.phase, 'technical-plan');
    assert.equal(revisedRun.phase, 'technical-plan-draft');
    assert.equal(revisedRun.history.at(-1).artifact, latestDraftArtifact(repo.root));
    assert.match(revisedRun.history.at(-1).artifact, /drafts\/002\.md$/);

    const second = await runReviewPlan(repo.root, {
      runId: 'run-review-cycle',
      runProviderFn: async () => providerSuccess(repo.root, governedReviewOutput([{
        ...blocker,
        id: 'provider-cycle-blocker-repeat',
        canonical_id: 'F-001',
      }])),
    });
    assert.equal(second.reviewId, 'R-002');
    assert.equal(readAiRun(repo.root, 'run-review-cycle').phase, 'technical-plan-reviewed');
  } finally {
    repo.cleanup();
  }
});

test('governed review exhaustion blocks provider preflight and execution with five explicit actions', async () => {
  const governance = buildDefaultGovernanceConfig();
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('exhausted-plan'),
    '.quiver/config.json': `${JSON.stringify({ governance }, null, 2)}\n`,
  });
  let probeCalls = 0;
  let spawnCalls = 0;

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('exhausted-plan'));
    seedGovernedTechnicalPlanRun(repo.root, 'run-exhausted', governance, latestDraftArtifact(repo.root));
    await runReviewPlan(repo.root, {
      runId: 'run-exhausted',
      runProviderFn: async () => providerSuccess(repo.root, governedReviewOutput([])),
    });
    const beforeEvents = readReviewBudgetEvents(repo.root, 'run-exhausted');

    await assert.rejects(
      () => runReviewPlan(repo.root, {
        runId: 'run-exhausted',
        reviewIntent: {
          event_class: 'targeted',
          base_review_id: 'R-001',
          finding_ids: [],
          sections: ['objective'],
        },
        probe() {
          probeCalls += 1;
          return { status: 0, stdout: 'codex 1.0.0', stderr: '' };
        },
        spawn() {
          spawnCalls += 1;
          throw new Error('provider must not start');
        },
      }),
      (error) => error.code === 'REVIEW_BUDGET_EXHAUSTED'
        && error.details.machine_codes.includes('HUMAN_DECISION_REQUIRED')
        && error.details.next_actions.length === 5
        && error.details.next_actions.every((action, index) => action === REVIEW_BUDGET_NEXT_ACTIONS[index]),
    );
    assert.equal(probeCalls, 0);
    assert.equal(spawnCalls, 0);
    assert.deepEqual(readReviewBudgetEvents(repo.root, 'run-exhausted'), beforeEvents);
  } finally {
    repo.cleanup();
  }
});

test('governed review validates immutable candidate and targeted scope before provider invocation', async () => {
  const governance = buildDefaultGovernanceConfig();
  governance.requested_profile = 'high-assurance';
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('intent-validation-plan'),
    '.quiver/config.json': `${JSON.stringify({ governance }, null, 2)}\n`,
  });
  let providerCalls = 0;

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('intent-validation-plan'));
    seedGovernedTechnicalPlanRun(repo.root, 'run-intent-validation', governance, latestDraftArtifact(repo.root));
    await assert.rejects(
      () => runReviewPlan(repo.root, {
        runId: 'run-intent-validation',
        reviewIntent: { event_class: 'full', candidate_id: 'caller-forged-candidate' },
        runProviderFn: async () => {
          providerCalls += 1;
          return providerSuccess(repo.root, governedReviewOutput([]));
        },
      }),
      (error) => error.code === 'REVIEW_INTENT_INVALID',
    );
    assert.equal(readReviewBudgetEvents(repo.root, 'run-intent-validation').length, 0);

    await runReviewPlan(repo.root, {
      runId: 'run-intent-validation',
      runProviderFn: async () => {
        providerCalls += 1;
        return providerSuccess(repo.root, governedReviewOutput([]));
      },
    });
    for (const reviewIntent of [{
      event_class: 'targeted', base_review_id: 'R-001', finding_ids: ['F-999'], sections: [],
    }, {
      event_class: 'targeted', base_review_id: 'R-001', finding_ids: [], sections: ['section-not-in-candidate'],
    }]) {
      await assert.rejects(
        () => runReviewPlan(repo.root, {
          runId: 'run-intent-validation',
          reviewIntent,
          runProviderFn: async () => {
            providerCalls += 1;
            return providerSuccess(repo.root, governedReviewOutput([]));
          },
        }),
        (error) => error.code === 'REVIEW_INTENT_INVALID',
      );
    }
    assert.equal(providerCalls, 1);
    assert.equal(readReviewBudgetEvents(repo.root, 'run-intent-validation').filter((event) => event.kind === 'reservation').length, 1);
  } finally {
    repo.cleanup();
  }
});

test('governed pre-payload timeout retries the same envelope and consumes one semantic review on success', async () => {
  const governance = buildDefaultGovernanceConfig();
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('retry-plan'),
    '.quiver/config.json': `${JSON.stringify({ governance }, null, 2)}\n`,
  });
  let providerCalls = 0;

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('retry-plan'));
    seedGovernedTechnicalPlanRun(repo.root, 'run-command-retry', governance, latestDraftArtifact(repo.root));
    await assert.rejects(
      () => runReviewPlan(repo.root, {
        runId: 'run-command-retry',
        runProviderFn: async () => {
          providerCalls += 1;
          return providerFailure(repo.root, {
            code: 'PROVIDER_TIMEOUT',
            message: 'provider timed out before output',
            payloadReceived: false,
          });
        },
      }),
      (error) => error.code === 'PROVIDER_TIMEOUT',
    );
    const retryBudget = readReviewBudget(repo.root, 'run-command-retry', {
      governance,
      profile: resolveEffectiveProfile({ governance }),
    }).projection;
    assert.equal(retryBudget.counts.review_count, 0);
    assert.equal(retryBudget.counts.retry_count, 1);

    const result = await runReviewPlan(repo.root, {
      runId: 'run-command-retry',
      runProviderFn: async () => {
        providerCalls += 1;
        return providerSuccess(repo.root, governedReviewOutput([]));
      },
    });
    assert.equal(providerCalls, 2);
    assert.equal(result.reviewId, 'R-001');
    assert.equal(result.budget.counts.review_count, 1);
    assert.equal(result.budget.counts.retry_count, 1);
    assert.equal(result.budget.counts.invalid_output_count, 0);
  } finally {
    repo.cleanup();
  }
});

test('missing provider CLI releases the semantic slot as a transport retry', async () => {
  const governance = buildDefaultGovernanceConfig();
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('missing-cli-retry'),
    '.quiver/config.json': `${JSON.stringify({ governance }, null, 2)}\n`,
  });
  let spawnCalls = 0;

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('missing-cli-retry'));
    seedGovernedTechnicalPlanRun(repo.root, 'run-missing-cli-retry', governance, latestDraftArtifact(repo.root));
    await assert.rejects(
      () => runReviewPlan(repo.root, {
        runId: 'run-missing-cli-retry',
        probe() {
          const error = new Error('codex not found');
          error.code = 'ENOENT';
          return { error };
        },
        spawn() {
          spawnCalls += 1;
          throw new Error('spawn must not run after failed preflight');
        },
      }),
      (error) => error.code === 'MISSING_PROVIDER_CLI',
    );
    const retryBudget = readReviewBudget(repo.root, 'run-missing-cli-retry', {
      governance,
      profile: resolveEffectiveProfile({ governance }),
    }).projection;
    assert.equal(spawnCalls, 0);
    assert.equal(retryBudget.counts.review_count, 0);
    assert.equal(retryBudget.counts.retry_count, 1);

    const result = await runReviewPlan(repo.root, {
      runId: 'run-missing-cli-retry',
      runProviderFn: async () => providerSuccess(repo.root, governedReviewOutput([])),
    });
    assert.equal(result.reviewId, 'R-001');
    assert.equal(result.budget.counts.review_count, 1);
    assert.equal(result.budget.counts.retry_count, 1);
  } finally {
    repo.cleanup();
  }
});

test('governed review rejects diagnostic-only success as a pre-payload transport retry', async () => {
  const governance = buildDefaultGovernanceConfig();
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('diagnostic-only-output'),
    '.quiver/config.json': `${JSON.stringify({ governance }, null, 2)}\n`,
  });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('diagnostic-only-output'));
    seedGovernedTechnicalPlanRun(repo.root, 'run-diagnostic-only', governance, latestDraftArtifact(repo.root));
    await assert.rejects(
      () => runReviewPlan(repo.root, {
        runId: 'run-diagnostic-only',
        runProviderFn: async () => ({
          ...providerSuccess(repo.root, ''),
          stdout: '',
          stderr: governedReviewOutput([]),
          payloadReceived: false,
        }),
      }),
      (error) => error.code === 'PROVIDER_TRANSPORT_ERROR',
    );
    const retryBudget = readReviewBudget(repo.root, 'run-diagnostic-only', {
      governance,
      profile: resolveEffectiveProfile({ governance }),
    }).projection;
    assert.equal(retryBudget.counts.review_count, 0);
    assert.equal(retryBudget.counts.retry_count, 1);
    assert.equal(readRunGovernance(repo.root, 'run-diagnostic-only'), null);

    const recovered = await runReviewPlan(repo.root, {
      runId: 'run-diagnostic-only',
      runProviderFn: async () => providerSuccess(repo.root, governedReviewOutput([])),
    });
    assert.equal(recovered.reviewId, 'R-001');
    assert.equal(recovered.budget.counts.review_count, 1);
    assert.equal(recovered.budget.counts.retry_count, 1);
  } finally {
    repo.cleanup();
  }
});

test('canonical reviews without ledger outcomes fail closed before provider or extension mutation', async () => {
  const governance = buildDefaultGovernanceConfig();
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('unverified-history'),
    '.quiver/config.json': `${JSON.stringify({ governance }, null, 2)}\n`,
  });
  let providerCalls = 0;
  let identityCalls = 0;

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('unverified-history'));
    seedGovernedTechnicalPlanRun(repo.root, 'run-unverified-history', governance, latestDraftArtifact(repo.root));
    await runReviewPlan(repo.root, {
      runId: 'run-unverified-history',
      runProviderFn: async () => providerSuccess(repo.root, governedReviewOutput([])),
    });
    fs.rmSync(path.join(repo.root, '.quiver/runs/run-unverified-history/review-budget-events'), {
      recursive: true,
      force: true,
    });

    await assert.rejects(
      () => runReviewPlan(repo.root, {
        runId: 'run-unverified-history',
        runProviderFn: async () => {
          providerCalls += 1;
          return providerSuccess(repo.root, governedReviewOutput([]));
        },
      }),
      (error) => error.code === 'REVIEW_BUDGET_HISTORY_UNVERIFIED',
    );
    await assert.rejects(
      () => runExtendReviewBudget(repo.root, {
        runId: 'run-unverified-history',
        resolveActorFn: async () => {
          identityCalls += 1;
          return {
            actor_id: 'github:github.com:42',
            provider: 'github-cli',
            provider_subject: 'github:github.com:42',
            verified: true,
          };
        },
      }),
      (error) => error.code === 'REVIEW_BUDGET_HISTORY_UNVERIFIED',
    );
    assert.equal(providerCalls, 0);
    assert.equal(identityCalls, 0);
    assert.deepEqual(readReviewBudgetEvents(repo.root, 'run-unverified-history'), []);
  } finally {
    repo.cleanup();
  }
});

test('governed review WAL recovers every interrupted commit point exactly once', async () => {
  const faultPoints = ['after-wal', 'after-canonical', 'after-outcome', 'after-review', 'after-meta', 'after-phase'];

  for (const faultPoint of faultPoints) {
    const governance = buildDefaultGovernanceConfig();
    const runId = `run-wal-${faultPoint}`;
    const repo = makeRepo({
      'technical-plan.md': structuredTechnicalPlanText(runId),
      '.quiver/config.json': `${JSON.stringify({ governance }, null, 2)}\n`,
    });
    try {
      savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText(runId));
      seedGovernedTechnicalPlanRun(repo.root, runId, governance, latestDraftArtifact(repo.root));
      await assert.rejects(
        () => runReviewPlan(repo.root, {
          runId,
          runProviderFn: async () => providerSuccess(repo.root, governedReviewOutput([])),
          commitFaultInjector(point) {
            if (point === faultPoint) {
              const error = new Error(`injected ${faultPoint}`);
              error.code = 'TEST_REVIEW_COMMIT_FAILURE';
              throw error;
            }
          },
        }),
        (error) => error.code === 'TEST_REVIEW_COMMIT_FAILURE',
      );
      assert.equal(fs.existsSync(runReviewCommitPath(repo.root, runId)), true);

      if (faultPoint === 'after-canonical') {
        await assert.rejects(() => runApprove(repo.root, {
          phase: 'technical-plan',
          runId,
          version: 1,
          dryRun: true,
        }));
        assert.equal(fs.existsSync(runReviewCommitPath(repo.root, runId)), true);
      }

      if (faultPoint === 'after-phase') {
        const beforeConditionedDryRun = snapshotFileContents(repo.root);
        await assert.rejects(
          () => runApprove(repo.root, {
            actor: {
              actor_id: 'local:wal-dry-run',
              provider: 'local',
              verified: false,
            },
            decision: 'approved-with-conditions',
            dryRun: true,
            phase: 'technical-plan',
            runId,
            version: 1,
          }),
          (error) => error.code === 'GOVERNANCE_RECOVERY_REQUIRED',
        );
        assert.deepEqual(snapshotFileContents(repo.root), beforeConditionedDryRun);
      }

      const recovery = recoverGovernedPlanReviewCommit(repo.root, { runId });
      assert.equal(recovery.recovered, true);
      assert.equal(fs.existsSync(runReviewCommitPath(repo.root, runId)), false);
      assert.equal(readAiRun(repo.root, runId).phase, 'technical-plan-reviewed');
      assert.equal(readRunGovernance(repo.root, runId).current_review_id, 'R-001');
      const events = readReviewBudgetEvents(repo.root, runId);
      assert.deepEqual(events.map((event) => event.kind), ['reservation', 'outcome']);
      assert.equal(events[1].outcome, 'valid');
      assert.equal(events[1].review_id, 'R-001');
      assert.equal(recoverGovernedPlanReviewCommit(repo.root, { runId }).recovered, false);
    } finally {
      repo.cleanup();
    }
  }
});

test('corrupt or foreign governed review WAL fails closed without publishing state', async () => {
  for (const corruption of ['digest', 'foreign-run']) {
    const governance = buildDefaultGovernanceConfig();
    const runId = `run-wal-corrupt-${corruption}`;
    const repo = makeRepo({
      'technical-plan.md': structuredTechnicalPlanText(runId),
      '.quiver/config.json': `${JSON.stringify({ governance }, null, 2)}\n`,
    });
    try {
      savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText(runId));
      seedGovernedTechnicalPlanRun(repo.root, runId, governance, latestDraftArtifact(repo.root));
      await assert.rejects(
        () => runReviewPlan(repo.root, {
          runId,
          runProviderFn: async () => providerSuccess(repo.root, governedReviewOutput([])),
          commitFaultInjector(point) {
            if (point === 'after-wal') {
              const error = new Error('injected after-wal');
              error.code = 'TEST_REVIEW_COMMIT_FAILURE';
              throw error;
            }
          },
        }),
        (error) => error.code === 'TEST_REVIEW_COMMIT_FAILURE',
      );
      const walPath = runReviewCommitPath(repo.root, runId);
      const marker = JSON.parse(fs.readFileSync(walPath, 'utf8'));
      if (corruption === 'digest') marker.meta_sha256 = `sha256:${'0'.repeat(64)}`;
      else marker.run_id = 'run-foreign';
      fs.writeFileSync(walPath, `${JSON.stringify(marker, null, 2)}\n`);

      assert.throws(
        () => recoverGovernedPlanReviewCommit(repo.root, { runId }),
        (error) => error.code === 'REVIEW_COMMIT_RECOVERY_REQUIRED',
      );
      assert.equal(readRunGovernance(repo.root, runId), null);
      assert.equal(readAiRun(repo.root, runId).phase, 'technical-plan-draft');
      assert.deepEqual(readReviewBudgetEvents(repo.root, runId).map((event) => event.kind), ['reservation']);
    } finally {
      repo.cleanup();
    }
  }
});

test('run close rejects an in-flight provider reservation and remains isolated by run', async () => {
  const governance = buildDefaultGovernanceConfig();
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('close-in-flight'),
    '.quiver/config.json': `${JSON.stringify({ governance }, null, 2)}\n`,
  });
  let resolveStarted;
  let resolveProvider;
  const started = new Promise((resolve) => { resolveStarted = resolve; });
  const providerResult = new Promise((resolve) => { resolveProvider = resolve; });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('close-in-flight'));
    const artifact = latestDraftArtifact(repo.root);
    seedGovernedTechnicalPlanRun(repo.root, 'run-close-in-flight', governance, artifact);
    seedGovernedTechnicalPlanRun(repo.root, 'run-close-independent', governance, artifact);
    const reviewPromise = runReviewPlan(repo.root, {
      runId: 'run-close-in-flight',
      runProviderFn: async () => {
        resolveStarted();
        return providerResult;
      },
    });
    await started;

    assert.throws(
      () => runLifecycleRun(repo.root, { command: 'close', runId: 'run-close-in-flight' }),
      (error) => error.code === 'REVIEW_BUDGET_RESERVATION_PENDING',
    );
    assert.equal(readAiRun(repo.root, 'run-close-in-flight').status, 'active');
    const independent = runLifecycleRun(repo.root, { command: 'close', runId: 'run-close-independent' });
    assert.equal(independent.run.status, 'closed');

    resolveProvider(providerSuccess(repo.root, governedReviewOutput([])));
    const reviewed = await reviewPromise;
    assert.equal(reviewed.reviewId, 'R-001');
    const closed = runLifecycleRun(repo.root, { command: 'close', runId: 'run-close-in-flight' });
    assert.equal(closed.run.status, 'closed');
    assert.equal(readReviewBudgetEvents(repo.root, 'run-close-in-flight').at(-1).outcome, 'valid');
  } finally {
    repo.cleanup();
  }
});

test('provider payload failures consume budget consistently in TTY and non-TTY modes', async () => {
  for (const tty of [false, true]) {
    const governance = buildDefaultGovernanceConfig();
    const repo = makeRepo({
      'technical-plan.md': structuredTechnicalPlanText(`payload-failure-${tty}`),
      '.quiver/config.json': `${JSON.stringify({ governance }, null, 2)}\n`,
    });
    const progress = createProgressRecorder();
    try {
      savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText(`payload-failure-${tty}`));
      seedGovernedTechnicalPlanRun(repo.root, `run-payload-${tty}`, governance, latestDraftArtifact(repo.root));
      await assert.rejects(
        () => runReviewPlan(repo.root, {
          runId: `run-payload-${tty}`,
          stdinIsTTY: tty,
          stdoutIsTTY: tty,
          stderrIsTTY: tty,
          write: progress.write,
          prompts: progress.prompts,
          runProviderFn: async () => providerFailure(repo.root, {
            code: 'PROVIDER_TIMEOUT',
            message: 'timeout after partial response',
            payloadReceived: true,
            stdout: '{"partial":',
          }),
        }),
        (error) => error.code === 'PROVIDER_OUTPUT_INVALID',
      );
      const budget = readReviewBudget(repo.root, `run-payload-${tty}`, {
        governance,
        profile: resolveEffectiveProfile({ governance }),
      }).projection;
      assert.equal(budget.counts.review_count, 1);
      assert.equal(budget.counts.invalid_output_count, 1);
      assert.equal(budget.counts.retry_count, 0);
      assert.equal(readRunGovernance(repo.root, `run-payload-${tty}`), null);
    } finally {
      repo.cleanup();
    }
  }
});

test('governed review rejects a candidate that changes while the provider is running and consumes the received payload', async () => {
  const governance = buildDefaultGovernanceConfig();
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('stale-provider-plan'),
    '.quiver/config.json': `${JSON.stringify({ governance }, null, 2)}\n`,
  });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('stale-provider-plan'));
    seedGovernedTechnicalPlanRun(repo.root, 'run-stale-provider', governance, latestDraftArtifact(repo.root));
    await assert.rejects(
      () => runReviewPlan(repo.root, {
        runId: 'run-stale-provider',
        runProviderFn: async () => {
          fs.appendFileSync(path.join(repo.root, latestDraftArtifact(repo.root)), '\nchanged while provider ran\n');
          return providerSuccess(repo.root, governedReviewOutput([]));
        },
      }),
      (error) => error.code === 'REVIEW_REQUEST_STALE',
    );
    const budget = readReviewBudget(repo.root, 'run-stale-provider', {
      governance,
      profile: resolveEffectiveProfile({ governance }),
    }).projection;
    assert.equal(budget.counts.review_count, 1);
    assert.equal(budget.counts.invalid_output_count, 1);
    assert.equal(readRunGovernance(repo.root, 'run-stale-provider'), null);
  } finally {
    repo.cleanup();
  }
});

test('review budget extension action resolves identity and rejects caller-supplied actor claims', async () => {
  const governance = buildDefaultGovernanceConfig();
  const localActor = {
    actor_id: 'local:maintainer', provider: 'local', provider_subject: null, verified: false,
  };
  const verifiedActor = {
    actor_id: 'github:github.com:42', provider: 'github-cli', provider_subject: 'github:github.com:42', verified: true,
  };
  governance.policy.authorization.actor_bindings[localActor.actor_id] = {
    actor_id: localActor.actor_id, roles: ['maintainer'],
  };
  governance.policy.authorization.actor_bindings[verifiedActor.provider_subject] = {
    actor_id: verifiedActor.actor_id, roles: ['maintainer'],
  };
  governance.policy.authorization.actions['extend-review-budget'] = {
    allowed_actor_ids: [], allowed_roles: ['maintainer'], independence: 'none',
  };
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('extension-action-plan'),
    '.quiver/config.json': `${JSON.stringify({ governance }, null, 2)}\n`,
  });

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('extension-action-plan'));
    seedGovernedTechnicalPlanRun(repo.root, 'run-extension-action', governance, latestDraftArtifact(repo.root));
    await runReviewPlan(repo.root, {
      runId: 'run-extension-action',
      runProviderFn: async () => providerSuccess(repo.root, governedReviewOutput([])),
    });
    const before = readReviewBudgetEvents(repo.root, 'run-extension-action');
    await assert.rejects(
      () => runExtendReviewBudget(repo.root, { runId: 'run-extension-action', actor: verifiedActor }),
      (error) => error.code === 'ACTOR_IDENTITY_UNAVAILABLE',
    );
    assert.deepEqual(readReviewBudgetEvents(repo.root, 'run-extension-action'), before);

    const local = await runExtendReviewBudget(repo.root, {
      runId: 'run-extension-action',
      resolveActorFn: async () => localActor,
    });
    assert.equal(local.budget.limits.max_reviews, 2);
    assert.equal(local.authorization.identity_label, 'LOCAL_UNVERIFIED_IDENTITY');

    const verified = await runExtendReviewBudget(repo.root, {
      runId: 'run-extension-action',
      resolveActorFn: async () => verifiedActor,
    });
    assert.equal(verified.budget.limits.max_reviews, 3);
    assert.equal(verified.authorization.verified, true);
    assert.equal(readReviewBudgetEvents(repo.root, 'run-extension-action').filter((event) => event.kind === 'extension').length, 2);
  } finally {
    repo.cleanup();
  }
});

test('governed review inherits the active profile and renders the effective policy in its prompt', async () => {
  const governance = buildDefaultGovernanceConfig();
  governance.policy.review_policy['technical-plan'].blocking_categories.push('testing');
  governance.policy.review_policy['technical-plan'].non_blocking_categories = governance.policy.review_policy['technical-plan']
    .non_blocking_categories.filter((category) => category !== 'testing');
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('inherited-profile-plan'),
    'feedback.md': '# Feedback\nKeep the governed profile.\n',
    '.quiver/config.json': `${JSON.stringify({ governance }, null, 2)}\n`,
  });

  try {
    savePlannerDraft(repo.root, 'acceptance', 'technical-plan.md', '# Accepted criteria\n');
    approvePlannerPhase(repo.root, 'acceptance', '', '', { version: 1 });
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('inherited-profile-plan'));
    seedGovernedTechnicalPlanRun(
      repo.root,
      'run-inherited-high',
      governance,
      latestDraftArtifact(repo.root),
      'high-assurance',
    );
    let prompt = '';
    const result = await runReviewPlan(repo.root, {
      runId: 'run-inherited-high',
      runProviderFn: async (provider, providerOptions) => {
        prompt = providerOptions.prompt;
        return providerSuccess(repo.root, governedReviewOutput([]));
      },
    });

    assert.equal(result.governance.requested_profile, 'high-assurance');
    assert.equal(result.governance.effective_profile, 'high-assurance');
    assert.match(prompt, /Effective governance: profile high-assurance, policy v58, digest sha256:/);
    assert.match(prompt, /blocking categories are: security, data-integrity, rollout, architecture, business-rule, testing/);
    assert.match(prompt, /Non-blocking categories are: implementation-detail/);

    assert.throws(
      () => execAi(repo.root, [
        'revise',
        '--phase', 'technical-plan',
        '--input', 'feedback.md',
        '--run', 'run-inherited-high',
        '--governance-profile', 'fast-delivery',
        '--dry-run',
      ]),
      (error) => error.stderr.includes('cannot be silently downgraded'),
    );
  } finally {
    repo.cleanup();
  }
});

test('governed runs fail closed when governance config disappears before review or approval', async () => {
  const governance = buildDefaultGovernanceConfig();
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('missing-config-plan'),
    '.quiver/config.json': `${JSON.stringify({ governance }, null, 2)}\n`,
  });
  let providerCalls = 0;
  let identityCalls = 0;

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('missing-config-plan'));
    seedGovernedTechnicalPlanRun(
      repo.root,
      'run-missing-config',
      governance,
      latestDraftArtifact(repo.root),
      'high-assurance',
    );
    fs.unlinkSync(path.join(repo.root, '.quiver/config.json'));

    await assert.rejects(
      () => runReviewPlan(repo.root, {
        runId: 'run-missing-config',
        runProviderFn: async () => {
          providerCalls += 1;
          return providerSuccess(repo.root, governedReviewOutput([]));
        },
      }),
      (error) => error.code === 'GOVERNANCE_CONFIG_MISSING',
    );
    await assert.rejects(
      () => runApprove(repo.root, {
        phase: 'technical-plan',
        runId: 'run-missing-config',
        version: 1,
        resolveActorFn: async () => {
          identityCalls += 1;
          return null;
        },
      }),
      (error) => error.code === 'GOVERNANCE_CONFIG_MISSING',
    );
    assert.equal(providerCalls, 0);
    assert.equal(identityCalls, 0);
    assert.equal(readPhaseApproval(repo.root, 'technical-plan').status, 'draft');
  } finally {
    repo.cleanup();
  }
});

test('an explicit governance profile without config fails before creating a run or invoking a provider', async () => {
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('no-governance-config'),
  });
  let providerCalls = 0;

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('no-governance-config'));
    await assert.rejects(
      () => runReviewPlan(repo.root, {
        governanceProfile: 'high-assurance',
        runId: 'run-no-config',
        runProviderFn: async () => {
          providerCalls += 1;
          return providerSuccess(repo.root, governedReviewOutput([]));
        },
      }),
      (error) => error.code === 'GOVERNANCE_CONFIG_MISSING',
    );
    assert.equal(providerCalls, 0);
    assert.equal(readAiRun(repo.root, 'run-no-config'), null);
  } finally {
    repo.cleanup();
  }
});

test('governed review without a run-owned versioned draft fails before provider invocation', async () => {
  const governance = buildDefaultGovernanceConfig();
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('unowned-plan'),
    '.quiver/config.json': `${JSON.stringify({ governance }, null, 2)}\n`,
  });
  let providerCalls = 0;

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('unowned-plan'));
    await assert.rejects(
      () => runReviewPlan(repo.root, {
        runProviderFn: async () => {
          providerCalls += 1;
          return providerSuccess(repo.root, governedReviewOutput([]));
        },
      }),
      (error) => error.code === 'AI_RUN_REQUIRED' && /owns the current versioned/.test(error.message),
    );
    assert.equal(providerCalls, 0);
    assert.equal(listAiRuns(repo.root).length, 0);
  } finally {
    repo.cleanup();
  }
});

test('governed reviews and approvals cannot consume another run artifact or review', async () => {
  const governance = buildDefaultGovernanceConfig();
  const actor = {
    actor_id: 'github:github.com:42',
    provider: 'github-cli',
    provider_subject: 'github:github.com:42',
    verified: true,
  };
  governance.policy.authorization.actor_bindings[actor.provider_subject] = {
    actor_id: actor.actor_id,
    roles: ['maintainer'],
  };
  governance.policy.authorization.actions.approve = {
    allowed_actor_ids: [],
    allowed_roles: ['maintainer'],
    independence: 'none',
  };
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('run-a-plan'),
    '.quiver/config.json': `${JSON.stringify({ governance }, null, 2)}\n`,
  });
  let providerCalls = 0;
  let identityCalls = 0;

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('run-a-plan'));
    seedGovernedTechnicalPlanRun(repo.root, 'run-a', governance, latestDraftArtifact(repo.root));
    await runReviewPlan(repo.root, {
      runId: 'run-a',
      runProviderFn: async () => providerSuccess(repo.root, governedReviewOutput([])),
    });

    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('run-b-plan'));
    seedGovernedTechnicalPlanRun(repo.root, 'run-b', governance, latestDraftArtifact(repo.root));
    await runReviewPlan(repo.root, {
      runId: 'run-b',
      runProviderFn: async () => providerSuccess(repo.root, governedReviewOutput([])),
    });
    const runAEvents = readReviewBudgetEvents(repo.root, 'run-a');
    const runBEvents = readReviewBudgetEvents(repo.root, 'run-b');
    assert.equal(runAEvents.every((event) => event.run_id === 'run-a'), true);
    assert.equal(runBEvents.every((event) => event.run_id === 'run-b'), true);
    assert.equal(runAEvents.filter((event) => event.kind === 'reservation').length, 1);
    assert.equal(runBEvents.filter((event) => event.kind === 'reservation').length, 1);

    await assert.rejects(
      () => runApprove(repo.root, {
        phase: 'technical-plan',
        runId: 'run-a',
        version: 1,
        resolveActorFn: async () => {
          identityCalls += 1;
          return actor;
        },
      }),
      (error) => error.code === 'GOVERNANCE_STATE_INVALID' && /not correlated/.test(error.message),
    );
    await assert.rejects(
      () => runReviewPlan(repo.root, {
        runId: 'run-a',
        runProviderFn: async () => {
          providerCalls += 1;
          return providerSuccess(repo.root, governedReviewOutput([]));
        },
      }),
      (error) => error.code === 'GOVERNANCE_STATE_INVALID' && /not owned/.test(error.message),
    );
    assert.equal(identityCalls, 0);
    assert.equal(providerCalls, 0);
    assert.equal(readPhaseApproval(repo.root, 'technical-plan').status, 'draft');
    assert.equal(readPlanReview(repo.root).meta.run_id, 'run-b');
  } finally {
    repo.cleanup();
  }
});

test('governed mutations reject a closed explicit run before provider, identity, or artifact writes', async () => {
  const governance = buildDefaultGovernanceConfig();
  const repo = makeRepo({
    'technical-plan.md': structuredTechnicalPlanText('closed-run-plan'),
    '.quiver/config.json': `${JSON.stringify({ governance }, null, 2)}\n`,
  });
  let providerCalls = 0;
  let identityCalls = 0;

  try {
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', structuredTechnicalPlanText('closed-run-plan'));
    seedGovernedTechnicalPlanRun(repo.root, 'run-closed', governance, latestDraftArtifact(repo.root));
    updateAiRunPhase(repo.root, 'run-closed', 'closed', { command: 'ai run close' });
    const statePath = path.join(repo.root, '.quiver/runs/run-closed/state.json');
    const stateBytes = fs.readFileSync(statePath);

    await assert.rejects(
      () => runReviewPlan(repo.root, {
        runId: 'run-closed',
        runProviderFn: async () => {
          providerCalls += 1;
          return providerSuccess(repo.root, governedReviewOutput([]));
        },
      }),
      /AI_RUN_CLOSED/,
    );
    await assert.rejects(
      () => runApprove(repo.root, {
        phase: 'technical-plan',
        runId: 'run-closed',
        version: 1,
        resolveActorFn: async () => {
          identityCalls += 1;
          return null;
        },
      }),
      /AI_RUN_CLOSED/,
    );
    assert.equal(providerCalls, 0);
    assert.equal(identityCalls, 0);
    assert.deepEqual(fs.readFileSync(statePath), stateBytes);
    assert.equal(readPhaseApproval(repo.root, 'technical-plan').status, 'draft');
  } finally {
    repo.cleanup();
  }
});

test('governed review commit rejects profile downgrade and foreign-run canonical state under the lock', () => {
  const governance = buildDefaultGovernanceConfig();
  const high = resolveEffectiveProfile({ governance, requestedProfile: 'high-assurance' });
  const fast = resolveEffectiveProfile({ governance, requestedProfile: 'fast-delivery' });
  const repo = makeRepo();
  const runId = 'run-governed-correlation';
  const binding = {
    requested_profile: high.requested_profile,
    effective_profile: high.effective_profile,
    policy_version: high.policy_version,
    policy_digest: high.policy_digest,
    requirement_categories: [],
  };

  try {
    createAiRun(repo.root, { runId, governance: binding });
    updateAiRunPhase(repo.root, runId, 'technical-plan-draft', {
      artifact: '.quiver/approvals/technical-plan/drafts/001.md',
      command: 'ai plan --phase technical-plan',
    });
    assert.throws(
      () => saveGovernedPlanReview(repo.root, {
        runId,
        governance,
        profile: fast,
        contents: governedReviewOutput([]),
      }),
      (error) => error.code === 'PROFILE_DOWNGRADE_FORBIDDEN',
    );
    assert.equal(readAiRunLock(repo.root, runId), null);
    assert.equal(readRunGovernance(repo.root, runId), null);

    bindAiRunGovernance(repo.root, runId, binding);
    const corruptedState = {
      schema_version: 1,
      run_id: runId,
      next_finding_number: 1,
      current_review_id: null,
      reviews: [{ review_id: 'R-900', run_id: 'other-run' }],
      findings: [],
    };
    fs.writeFileSync(
      path.join(repo.root, '.quiver/runs', runId, 'review-governance.json'),
      `${JSON.stringify(corruptedState, null, 2)}\n`,
    );
    assert.throws(
      () => saveGovernedPlanReview(repo.root, {
        runId,
        governance,
        profile: high,
        contents: governedReviewOutput([]),
      }),
      (error) => error.code === 'GOVERNANCE_STATE_INVALID',
    );
    assert.throws(() => readRunGovernance(repo.root, runId), (error) => error.code === 'GOVERNANCE_STATE_INVALID');
    assert.equal(readAiRunLock(repo.root, runId), null);

    updateAiRunPhase(repo.root, runId, 'closed', { command: 'ai run close' });
    assert.throws(
      () => saveGovernedPlanReview(repo.root, {
        runId,
        governance,
        profile: high,
        contents: governedReviewOutput([]),
      }),
      (error) => error.code === 'AI_RUN_CLOSED',
    );
    assert.equal(readAiRunLock(repo.root, runId), null);
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
