const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  runApprove,
  runReviewPlan,
} = require('../../src/create-quiver/commands/ai');
const {
  readPhaseApproval,
  savePlannerDraft,
} = require('../../src/create-quiver/lib/approvals');
const {
  analyzeDraftStructure,
  sha256Bytes,
} = require('../../src/create-quiver/lib/ai/draft-integrity');
const {
  createEffectiveAddendum,
  createEffectiveAmendment,
  effectiveContractRecordsDir,
  resolveEffectiveContract,
} = require('../../src/create-quiver/lib/ai/effective-contract');
const {
  buildDefaultGovernanceConfig,
  resolveEffectiveProfile,
  stableStringify,
} = require('../../src/create-quiver/lib/ai/review-governance');
const {
  REVIEW_BUDGET_EXHAUSTED,
  readReviewBudgetEvents,
} = require('../../src/create-quiver/lib/ai/review-budget');
const { recoverGovernedPlanReviewCommit } = require('../../src/create-quiver/lib/ai/plan-review');
const {
  createAiRun,
  readRunApprovalDecision,
  readRunGovernance,
  updateAiRunPhase,
} = require('../../src/create-quiver/lib/ai/run-state');
const packageJson = require('../../package.json');

const VERIFIED_ACTOR = Object.freeze({
  actor_id: 'github:github.com:42',
  provider: 'github-cli',
  provider_subject: 'github:github.com:42',
  verified: true,
});

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function makeRepo(prefix = 'quiver-effective-contract-') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function configuredGovernance(root) {
  const governance = buildDefaultGovernanceConfig();
  governance.policy.authorization.actor_bindings[VERIFIED_ACTOR.provider_subject] = {
    actor_id: VERIFIED_ACTOR.actor_id,
    roles: ['maintainer'],
  };
  governance.policy.authorization.actor_bindings['local:unverified'] = {
    actor_id: 'local:unverified',
    roles: ['maintainer'],
  };
  governance.policy.authorization.actions.approve = {
    allowed_actor_ids: [],
    allowed_roles: ['maintainer'],
    independence: 'none',
  };
  const profile = resolveEffectiveProfile({ governance, requirementCategories: [] });
  writeFile(path.join(root, '.quiver', 'config.json'), `${JSON.stringify({ governance }, null, 2)}\n`);
  writeFile(path.join(root, '.quiver', 'state.json'), `${JSON.stringify({
    quiver_version: packageJson.version,
    initialized_version: packageJson.version,
    last_initialized_at: '2026-09-12T00:00:00.000Z',
  }, null, 2)}\n`);
  return { governance, profile };
}

function baseContract() {
  return {
    spec: {
      requirements: [
        { id: 'V59-RQ-04', text: 'First-class addenda.' },
      ],
      acceptance_criteria: [
        { id: 'AC-01', requirement_ids: ['V59-RQ-04'], text: 'Effective content verifies.' },
      ],
      slices: [
        { slice_id: 'slice-01-base', depends_on: [] },
        { slice_id: 'slice-02-child', depends_on: ['slice-01-base'] },
      ],
    },
  };
}

function seedSelectedAcceptance(root, options = {}) {
  const runId = options.runId || 'run-effective-contract';
  const { governance, profile } = configuredGovernance(root);
  writeFile(path.join(root, 'requirements.md'), '# Requirements\n');
  createAiRun(root, {
    input: 'requirements.md',
    runId,
    governance: {
      requested_profile: profile.requested_profile,
      effective_profile: profile.effective_profile,
      policy_version: profile.policy_version,
      policy_digest: profile.policy_digest,
      requirement_categories: [],
    },
  });
  const contents = options.contents || `${JSON.stringify(baseContract(), null, 2)}\n`;
  const saved = savePlannerDraft(root, 'acceptance', 'requirements.md', contents, {
    requireDigestBindings: true,
    runId,
  });
  updateAiRunPhase(root, runId, 'acceptance-draft', {
    artifact: saved.versionPath,
    command: 'test acceptance draft',
  });
  const draft = readPhaseApproval(root, 'acceptance').meta.drafts[0];
  return {
    actor: VERIFIED_ACTOR,
    draft,
    governance,
    profile,
    runId,
  };
}

function changeOptions(seed, overrides = {}) {
  return {
    actor: seed.actor,
    governance: seed.governance,
    profile: seed.profile,
    runId: seed.runId,
    now: new Date('2026-09-12T12:00:00.000Z'),
    ...overrides,
  };
}

function draftParent(seed) {
  return {
    type: 'draft',
    version: seed.draft.version,
    sha256: seed.draft.artifact_sha256,
  };
}

function selectedInput(seed) {
  return {
    path: seed.draft.input_path,
    sha256: seed.draft.input_sha256,
  };
}

function recordParent(resolved) {
  return {
    type: 'effective-contract',
    record_id: resolved.record.record_id,
    sha256: resolved.record.record_sha256,
  };
}

function addendumRequest(seed, operations, operationId = 'addendum-1') {
  const affected = operations.map(({ collection, id }) => ({ collection, id }));
  return {
    operation_id: operationId,
    parent: draftParent(seed),
    input: selectedInput(seed),
    operations,
    affected_identities: affected,
    removals: [],
  };
}

function recordFiles(root, phase = 'acceptance') {
  const dir = effectiveContractRecordsDir(root, phase);
  return fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [];
}

function rewriteRecord(filePath, mutate) {
  const record = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  mutate(record);
  const { record_sha256: omitted, ...unsigned } = record;
  record.record_sha256 = `sha256:${crypto.createHash('sha256').update(stableStringify(unsigned)).digest('hex')}`;
  fs.writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`);
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

function providerResult(root, overrides = {}) {
  return {
    ok: true,
    dryRun: false,
    provider: 'codex',
    command: 'codex',
    args: ['exec'],
    cwd: root,
    timeoutMs: 0,
    promptTransport: { mode: 'stdin' },
    exitCode: 0,
    signal: null,
    stdout: governedReviewOutput(),
    stderr: '',
    error: null,
    preflight: { ok: true },
    payloadReceived: true,
    ...overrides,
  };
}

async function seedGovernedTechnicalPlan(root) {
  const runId = 'run-effective-review';
  const { governance, profile } = configuredGovernance(root);
  governance.requested_profile = 'high-assurance';
  const highProfile = resolveEffectiveProfile({
    governance,
    requestedProfile: 'high-assurance',
    requirementCategories: [],
  });
  writeFile(path.join(root, '.quiver', 'config.json'), `${JSON.stringify({ governance }, null, 2)}\n`);
  writeFile(path.join(root, 'requirements.md'), '# Requirements\n');
  createAiRun(root, {
    input: 'requirements.md',
    runId,
    governance: {
      requested_profile: highProfile.requested_profile,
      effective_profile: highProfile.effective_profile,
      policy_version: highProfile.policy_version,
      policy_digest: highProfile.policy_digest,
      requirement_categories: [],
    },
  });
  const acceptance = savePlannerDraft(root, 'acceptance', 'requirements.md', `${JSON.stringify({
    spec: { acceptance: ['AC-01 Effective plan is reviewed.'] },
  }, null, 2)}\n`, { requireDigestBindings: true, runId });
  const acceptanceDraft = readPhaseApproval(root, 'acceptance').meta.drafts[0];
  updateAiRunPhase(root, runId, 'acceptance-draft', {
    artifact: acceptanceDraft.path,
    command: 'test acceptance draft',
  });
  await runApprove(root, {
    actor: VERIFIED_ACTOR,
    digestBound: true,
    phase: 'acceptance',
    publishFinal: true,
    runId,
    suppressOutput: true,
    version: acceptance.version,
  });
  const decision = readRunApprovalDecision(root, runId, 'acceptance');
  const technical = savePlannerDraft(root, 'technical-plan', decision.artifact_path, `${JSON.stringify(baseContract(), null, 2)}\n`, {
    requireDigestBindings: true,
    runId,
  });
  const technicalDraft = readPhaseApproval(root, 'technical-plan').meta.drafts[0];
  updateAiRunPhase(root, runId, 'technical-plan-draft', {
    artifact: technicalDraft.path,
    command: 'test technical-plan draft',
  });
  return {
    actor: VERIFIED_ACTOR,
    draft: readPhaseApproval(root, 'technical-plan').meta.drafts[0],
    governance,
    profile: highProfile,
    runId,
  };
}

test('addenda are immutable, deterministic, parent/input-bound and idempotent', () => {
  const left = makeRepo('quiver-effective-left-');
  const right = makeRepo('quiver-effective-right-');
  try {
    const leftSeed = seedSelectedAcceptance(left.root);
    const rightSeed = seedSelectedAcceptance(right.root);
    const operations = [
      { op: 'add', collection: 'acceptance_criteria', id: 'AC-10-a', value: { id: 'AC-10-a', requirement_ids: ['V59-RQ-04'] } },
      { op: 'add', collection: 'acceptance_criteria', id: 'AC-10-Z', value: { id: 'AC-10-Z', requirement_ids: ['V59-RQ-04'] } },
    ];
    const leftResult = createEffectiveAddendum(
      left.root,
      'acceptance',
      addendumRequest(leftSeed, operations),
      changeOptions(leftSeed),
    );
    const rightResult = createEffectiveAddendum(
      right.root,
      'acceptance',
      addendumRequest(rightSeed, [...operations].reverse()),
      changeOptions(rightSeed),
    );

    assert.equal(leftResult.record.record_id, 'EC-000001');
    assert.deepEqual(leftResult.record.operations.map((item) => item.id), ['AC-10-Z', 'AC-10-a']);
    assert.equal(leftResult.effective_sha256, rightResult.effective_sha256);
    assert.equal(leftResult.record.record_sha256, rightResult.record.record_sha256);
    assert.equal(fs.readFileSync(path.join(left.root, leftSeed.draft.path), 'utf8'), `${JSON.stringify(baseContract(), null, 2)}\n`);
    assert.equal(sha256Bytes(Buffer.from(leftResult.contents)), leftResult.effective_sha256);

    const replay = createEffectiveAddendum(
      left.root,
      'acceptance',
      addendumRequest(leftSeed, operations),
      changeOptions(leftSeed),
    );
    assert.equal(replay.replayed, true);
    assert.deepEqual(recordFiles(left.root), ['000001.json']);

    assert.throws(
      () => createEffectiveAddendum(
        left.root,
        'acceptance',
        addendumRequest(leftSeed, [{
          op: 'add', collection: 'requirements', id: 'V59-RQ-05', value: { id: 'V59-RQ-05' },
        }]),
        changeOptions(leftSeed),
      ),
      (error) => error.code === 'IDEMPOTENCY_CONFLICT',
    );
  } finally {
    left.cleanup();
    right.cleanup();
  }
});

test('amendments require explicit removals and reject dangling depends_on before any write', () => {
  const repo = makeRepo();
  try {
    const seed = seedSelectedAcceptance(repo.root);
    const dangling = {
      operation_id: 'remove-base',
      parent: draftParent(seed),
      input: selectedInput(seed),
      operations: [{ op: 'remove', collection: 'slices', id: 'slice-01-base' }],
      affected_identities: [{ collection: 'slices', id: 'slice-01-base' }],
      removals: [{ collection: 'slices', id: 'slice-01-base' }],
    };
    assert.throws(
      () => createEffectiveAmendment(repo.root, 'acceptance', dangling, changeOptions(seed)),
      (error) => error.code === 'REFERENCE_INVALID'
        && error.details.diagnostics.some((item) => item.code === 'REFERENCE_BROKEN'),
    );
    assert.deepEqual(recordFiles(repo.root), []);

    const repaired = createEffectiveAmendment(repo.root, 'acceptance', {
      ...dangling,
      operation_id: 'remove-base-repaired',
      operations: [
        { op: 'remove', collection: 'slices', id: 'slice-01-base' },
        {
          op: 'replace',
          collection: 'slices',
          id: 'slice-02-child',
          value: { slice_id: 'slice-02-child', depends_on: [] },
        },
      ],
      affected_identities: [
        { collection: 'slices', id: 'slice-02-child' },
        { collection: 'slices', id: 'slice-01-base' },
      ],
    }, changeOptions(seed));
    assert.equal(repaired.document.spec.slices.length, 1);
    assert.deepEqual(repaired.document.spec.slices[0], { slice_id: 'slice-02-child', depends_on: [] });
    assert.deepEqual(repaired.record.removals, [{ collection: 'slices', id: 'slice-01-base' }]);
    assert.equal(analyzeDraftStructure(repaired.contents).diagnostics.length, 0);
  } finally {
    repo.cleanup();
  }
});

test('malformed operations, stale parents, Markdown patching and forged or unverified authority fail closed', () => {
  const repo = makeRepo();
  const markdownRepo = makeRepo('quiver-effective-markdown-');
  try {
    const seed = seedSelectedAcceptance(repo.root);
    const request = addendumRequest(seed, [{
      op: 'add', collection: 'requirements', id: 'V59-RQ-05', value: { id: 'V59-RQ-05' },
    }]);
    assert.throws(
      () => createEffectiveAddendum(repo.root, 'acceptance', {
        ...request,
        operations: [{ op: 'execute', collection: 'requirements', id: 'V59-RQ-05', value: 'rm -rf .' }],
      }, changeOptions(seed)),
      (error) => error.code === 'VALIDATION_FAILED',
    );
    assert.throws(
      () => createEffectiveAddendum(repo.root, 'acceptance', request, changeOptions(seed, {
        actor: undefined,
        authorization: { authorized: true, evidence: { action: 'approve', verified: true } },
      })),
      (error) => error.code === 'POLICY_DENIED',
    );
    assert.throws(
      () => createEffectiveAddendum(repo.root, 'acceptance', request, changeOptions(seed, {
        actor: {
          actor_id: 'local:unverified', provider: 'local', provider_subject: null, verified: false,
        },
      })),
      (error) => error.code === 'POLICY_DENIED' && /verified/.test(error.message),
    );

    const created = createEffectiveAddendum(repo.root, 'acceptance', request, changeOptions(seed));
    assert.throws(
      () => createEffectiveAddendum(repo.root, 'acceptance', {
        ...addendumRequest(seed, [{
          op: 'add', collection: 'requirements', id: 'V59-RQ-08', value: { id: 'V59-RQ-08' },
        }], 'stale-parent'),
      }, changeOptions(seed)),
      (error) => error.code === 'REVISION_CONFLICT',
    );
    assert.equal(created.record.actor.action, 'approve');
    assert.equal(created.record.actor.verification, 'verified');

    const markdownSeed = seedSelectedAcceptance(markdownRepo.root, {
      contents: '# Acceptance\n\n- AC-01 prose only\n',
    });
    assert.throws(
      () => createEffectiveAddendum(
        markdownRepo.root,
        'acceptance',
        addendumRequest(markdownSeed, [{
          op: 'add', collection: 'acceptance_criteria', id: 'AC-02', value: 'AC-02 text',
        }]),
        changeOptions(markdownSeed),
      ),
      (error) => error.code === 'VALIDATION_FAILED' && /structured JSON/.test(error.message),
    );
  } finally {
    repo.cleanup();
    markdownRepo.cleanup();
  }
});

test('lineage verification rejects tamper, missing parents, cycles and duplicate-parent branches', () => {
  const scenarios = [
    {
      label: 'tamper',
      mutate(root) {
        const first = path.join(effectiveContractRecordsDir(root, 'acceptance'), '000001.json');
        const record = JSON.parse(fs.readFileSync(first, 'utf8'));
        record.operations[0].value.text = 'tampered without digest';
        fs.writeFileSync(first, `${JSON.stringify(record, null, 2)}\n`);
      },
      code: 'RECOVERY_REQUIRED',
    },
    {
      label: 'missing-parent',
      mutate(root) {
        const second = path.join(effectiveContractRecordsDir(root, 'acceptance'), '000002.json');
        rewriteRecord(second, (record) => {
          record.parent.record_id = 'EC-999999';
        });
      },
      code: 'RECOVERY_REQUIRED',
    },
    {
      label: 'cycle',
      mutate(root) {
        const first = path.join(effectiveContractRecordsDir(root, 'acceptance'), '000001.json');
        rewriteRecord(first, (record) => {
          record.parent = {
            type: 'effective-contract',
            record_id: 'EC-000002',
            sha256: record.parent.sha256,
          };
        });
      },
      code: 'RECOVERY_REQUIRED',
    },
    {
      label: 'duplicate-parent',
      mutate(root) {
        const dir = effectiveContractRecordsDir(root, 'acceptance');
        const second = JSON.parse(fs.readFileSync(path.join(dir, '000002.json'), 'utf8'));
        second.sequence = 3;
        second.record_id = 'EC-000003';
        second.operation_id = 'branch-operation';
        second.parent.record_id = 'EC-000001';
        const first = JSON.parse(fs.readFileSync(path.join(dir, '000001.json'), 'utf8'));
        second.parent.sha256 = first.record_sha256;
        const { record_sha256: omitted, ...unsigned } = second;
        second.record_sha256 = `sha256:${crypto.createHash('sha256').update(stableStringify(unsigned)).digest('hex')}`;
        fs.writeFileSync(path.join(dir, '000003.json'), `${JSON.stringify(second, null, 2)}\n`);
      },
      code: 'RECOVERY_REQUIRED',
    },
  ];

  for (const scenario of scenarios) {
    const repo = makeRepo(`quiver-effective-${scenario.label}-`);
    try {
      const seed = seedSelectedAcceptance(repo.root);
      const first = createEffectiveAddendum(repo.root, 'acceptance', addendumRequest(seed, [{
        op: 'add', collection: 'requirements', id: 'V59-RQ-05', value: { id: 'V59-RQ-05', text: 'Amendments.' },
      }]), changeOptions(seed));
      const second = createEffectiveAddendum(repo.root, 'acceptance', {
        ...addendumRequest(seed, [{
          op: 'add', collection: 'requirements', id: 'V59-RQ-08', value: { id: 'V59-RQ-08', text: 'Retry lineage.' },
        }], 'addendum-2'),
        parent: recordParent(first),
      }, changeOptions(seed));
      scenario.mutate(repo.root);
      assert.throws(
        () => resolveEffectiveContract(repo.root, 'acceptance', second.record.record_id, { runId: seed.runId }),
        (error) => error.code === scenario.code,
        scenario.label,
      );
    } finally {
      repo.cleanup();
    }
  }
});

test('effective-contract store symlinks fail before writing outside the project', (t) => {
  const repo = makeRepo('quiver-effective-symlink-');
  const external = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-effective-outside-'));
  try {
    const seed = seedSelectedAcceptance(repo.root);
    const phaseRoot = path.join(repo.root, '.quiver', 'approvals', 'acceptance');
    fs.mkdirSync(phaseRoot, { recursive: true });
    try {
      fs.symlinkSync(external, path.join(phaseRoot, 'effective-contracts'), 'dir');
    } catch (error) {
      if (['EACCES', 'EPERM', 'ENOTSUP'].includes(error.code)) {
        t.skip(`symlinks are unavailable: ${error.code}`);
        return;
      }
      throw error;
    }
    assert.throws(
      () => createEffectiveAddendum(repo.root, 'acceptance', addendumRequest(seed, [{
        op: 'add', collection: 'requirements', id: 'V59-RQ-05', value: { id: 'V59-RQ-05' },
      }]), changeOptions(seed)),
      (error) => error.code === 'UNSAFE_PATH',
    );
    assert.deepEqual(fs.readdirSync(external), []);
  } finally {
    repo.cleanup();
    fs.rmSync(external, { recursive: true, force: true });
  }
});

test('runReviewPlan reviews exact effective bytes and separates retry identity from a new semantic revision', async () => {
  const repo = makeRepo('quiver-effective-review-');
  try {
    const seed = await seedGovernedTechnicalPlan(repo.root);
    await runReviewPlan(repo.root, {
      runId: seed.runId,
      runProviderFn: async () => providerResult(repo.root),
    });
    const rootLifecycleBefore = JSON.parse(JSON.stringify(
      readPhaseApproval(repo.root, 'technical-plan').meta.drafts[0].lifecycle,
    ));

    const first = createEffectiveAmendment(repo.root, 'technical-plan', {
      operation_id: 'effective-review-1',
      parent: draftParent(seed),
      input: selectedInput(seed),
      operations: [{
        op: 'replace',
        collection: 'requirements',
        id: 'V59-RQ-04',
        value: { id: 'V59-RQ-04', text: 'Effective bytes, not root draft bytes.' },
      }],
      affected_identities: [{ collection: 'requirements', id: 'V59-RQ-04' }],
      removals: [],
    }, changeOptions(seed, { now: new Date('2026-09-12T13:00:00.000Z') }));
    const reference = { phase: 'technical-plan', record_id: first.record.record_id };
    let reviewedPrompt = '';

    await assert.rejects(
      () => runReviewPlan(repo.root, {
        effectiveContract: reference,
        runId: seed.runId,
        runProviderFn: async (_provider, invocation) => {
          reviewedPrompt = invocation.prompt;
          return providerResult(repo.root, {
            ok: false,
            exitCode: null,
            stdout: '',
            error: { code: 'ETIMEDOUT', message: 'provider timeout before payload' },
            payloadReceived: false,
          });
        },
      }),
      (error) => /timeout before payload/.test(error.message),
    );
    assert.match(reviewedPrompt, /Effective bytes, not root draft bytes\./);
    assert.doesNotMatch(reviewedPrompt, /First-class addenda\./);

    await assert.rejects(() => runReviewPlan(repo.root, {
      effectiveContract: reference,
      runId: seed.runId,
      runProviderFn: async (_provider, invocation) => {
        assert.match(invocation.prompt, /Effective bytes, not root draft bytes\./);
        return providerResult(repo.root);
      },
      commitFaultInjector(point) {
        if (point === 'after-canonical') throw new Error('fault:effective-after-canonical');
      },
    }), /fault:effective-after-canonical/);
    const recovered = recoverGovernedPlanReviewCommit(repo.root, { runId: seed.runId });
    assert.equal(recovered.recovered, true);

    const events = readReviewBudgetEvents(repo.root, seed.runId);
    const effectiveReservation = events.find((event) => (
      event.kind === 'reservation' && event.intent?.effective_contract
    ));
    const retryReservation = events.find((event) => event.kind === 'retry-reservation');
    assert.equal(effectiveReservation.intent.candidate_id,
      `effective-contract:technical-plan:${first.record.record_id}:${first.effective_sha256}`);
    assert.equal(effectiveReservation.intent.base_review_id, 'R-001');
    assert.equal(effectiveReservation.intent.effective_contract.record_sha256, first.record.record_sha256);
    assert.equal(retryReservation.reservation_id, effectiveReservation.reservation_id);
    assert.equal(retryReservation.request_envelope_digest, effectiveReservation.request_envelope_digest);
    const expectedBinding = effectiveReservation.intent.effective_contract;
    const canonicalReview = readRunGovernance(repo.root, seed.runId).reviews.at(-1);
    const reviewMeta = JSON.parse(fs.readFileSync(
      path.join(repo.root, '.quiver', 'approvals', 'plan-review', 'meta.json'),
      'utf8',
    ));
    assert.equal(canonicalReview.review_id, 'R-002');
    assert.equal(canonicalReview.source_kind, 'effective-contract');
    assert.equal(canonicalReview.source_version, null);
    assert.deepEqual(canonicalReview.effective_contract, expectedBinding);
    assert.deepEqual(reviewMeta.effective_contract, expectedBinding);
    assert.deepEqual(
      readPhaseApproval(repo.root, 'technical-plan').meta.drafts[0].lifecycle,
      rootLifecycleBefore,
      'effective review recovery must not project R-002 onto the root draft',
    );
    await assert.rejects(
      () => runApprove(repo.root, {
        actor: seed.actor,
        phase: 'technical-plan',
        runId: seed.runId,
        version: seed.draft.version,
      }),
      (error) => /current review status is stale/.test(error.message),
      'an effective-contract review must not approve the unchanged root draft',
    );

    const second = createEffectiveAddendum(repo.root, 'technical-plan', {
      ...addendumRequest(seed, [{
        op: 'add',
        collection: 'requirements',
        id: 'V59-RQ-08',
        value: { id: 'V59-RQ-08', text: 'A new semantic revision.' },
      }], 'effective-review-2'),
      parent: recordParent(first),
    }, changeOptions(seed, { now: new Date('2026-09-12T14:00:00.000Z') }));
    await assert.rejects(
      () => runReviewPlan(repo.root, {
        effectiveContract: { phase: 'technical-plan', record_id: second.record.record_id },
        runId: seed.runId,
        runProviderFn: async () => {
          assert.fail('budget exhaustion must happen before provider invocation');
        },
      }),
      (error) => error.code === REVIEW_BUDGET_EXHAUSTED,
    );
  } finally {
    repo.cleanup();
  }
});
