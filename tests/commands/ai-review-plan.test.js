const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const { runApprove, runReviewPlan, runRevise } = require('../../src/create-quiver/commands/ai');
const { approvePlannerPhase, readPhaseApproval, savePlannerDraft } = require('../../src/create-quiver/lib/approvals');
const {
  buildTechnicalPlanApprovalCandidates,
  readPlanReview,
  saveGovernedPlanReview,
  summarizePlanReview,
} = require('../../src/create-quiver/lib/ai/plan-review');
const { buildDefaultGovernanceConfig, resolveEffectiveProfile } = require('../../src/create-quiver/lib/ai/review-governance');
const {
  bindAiRunGovernance,
  createAiRun,
  listAiRuns,
  readAiRun,
  readAiRunLock,
  readRunGovernance,
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

    await assert.rejects(
      () => runReviewPlan(repo.root, {
        runId: 'run-governed-review',
        runProviderFn: async () => providerSuccess(repo.root, 'authorization: bearer secret-value\nnot json\n'),
      }),
      (error) => error.code === 'PROVIDER_OUTPUT_INVALID',
    );
    assert.deepEqual(fs.readFileSync(metaPath), firstMetaBytes);
    assert.deepEqual(fs.readFileSync(governancePath), firstGovernanceBytes);

    await assert.rejects(
      () => runReviewPlan(repo.root, {
        runId: 'run-governed-review',
        runProviderFn: async () => providerSuccess(repo.root, governedReviewOutput([{
          ...blocker,
          summary: 'authorization: bearer contract-secret-value-123456789',
        }])),
      }),
      (error) => error.code === 'PROVIDER_OUTPUT_INVALID' && /sensitive values/.test(error.message),
    );
    assert.deepEqual(fs.readFileSync(metaPath), firstMetaBytes);
    assert.deepEqual(fs.readFileSync(governancePath), firstGovernanceBytes);

    await assert.rejects(
      () => runReviewPlan(repo.root, {
        runId: 'run-governed-review',
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

    let secondPrompt = '';
    await assert.rejects(
      () => runReviewPlan(repo.root, {
        runId: 'run-governed-review',
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
    assert.deepEqual(fs.readFileSync(metaPath), firstMetaBytes);
    assert.deepEqual(fs.readFileSync(governancePath), firstGovernanceBytes);

    const repeated = await runReviewPlan(repo.root, {
      runId: 'run-governed-review',
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

test('governed approval rechecks canonical blockers under the run lock after identity resolution', async () => {
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
