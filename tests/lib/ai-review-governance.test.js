const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  FINDING_RECONCILIATION_AMBIGUOUS,
  PROVIDER_OUTPUT_INVALID,
  authorizeGovernanceAction,
  buildDefaultGovernanceConfig,
  computeFindingFingerprint,
  computePolicyDigest,
  hasGovernanceConfig,
  mergeGovernanceConfig,
  parseProviderReview,
  projectPhaseAwareReview,
  readGovernanceConfig,
  reconcileFindings,
  resolveEffectiveProfile,
  stableStringify,
  validateGovernanceConfig,
} = require('../../src/create-quiver/lib/ai/review-governance');
const {
  decisionSchema,
  dispositionSchema,
  reviewEventSchema,
} = require('../../src/create-quiver/lib/ai/review-governance.schema');

function makeFinding(overrides = {}) {
  return {
    id: 'provider-1',
    title: 'Unsafe administrative actor',
    summary: 'The technical plan does not bind the administrative actor.',
    severity: 'high',
    category: 'security',
    phase_owner: 'technical-plan',
    phase_blocking: true,
    blocking_justification: 'The current technical plan cannot be implemented safely.',
    evidence: ['technical-plan.json#/admin_path'],
    acceptance_refs: ['AC-03'],
    recommended_disposition: 'revise-plan',
    confidence: 'high',
    ...overrides,
  };
}

function makeReview(findings = [makeFinding()], overrides = {}) {
  const projection = projectPhaseAwareReview(findings);
  return {
    schema_version: 2,
    kind: 'quiver-plan-review',
    review: {
      recommendation: projection.approval_recommendation,
      blocking: projection.blocking,
      findings,
      plan_required_fixes: projection.plan_required_fixes,
      slice_required_fixes: projection.slice_required_fixes,
      pr_required_fixes: projection.pr_required_fixes,
      follow_ups: projection.follow_ups,
      optional_hardening: projection.optional_hardening,
      ...overrides,
    },
  };
}

function expectCode(code) {
  return (error) => error && error.code === code;
}

function makeTempProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-review-governance-'));
  return {
    root,
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}

test('default governance config is valid, secret-free, and merge preserves compatible keys', () => {
  const defaults = buildDefaultGovernanceConfig();
  const validated = validateGovernanceConfig(defaults);
  const merged = mergeGovernanceConfig({
    language: 'es',
    future_root_key: true,
    governance: {
      requested_profile: 'high-assurance',
      future_namespace_key: 'preserved',
      policy: {
        future_policy_key: { enabled: true },
      },
    },
  });

  assert.equal(validated.requested_profile, 'fast-delivery');
  assert.equal(validated.policy.authorization.default_effect, 'deny');
  assert.deepEqual(Object.keys(validated.policy.authorization.actions).sort(), [
    'accept-risk',
    'approve',
    'approve-with-conditions',
    'extend-review-budget',
    'transfer-blocker',
  ]);
  assert.equal(merged.language, 'es');
  assert.equal(merged.future_root_key, true);
  assert.equal(merged.governance.requested_profile, 'high-assurance');
  assert.equal(merged.governance.future_namespace_key, 'preserved');
  assert.deepEqual(merged.governance.policy.future_policy_key, { enabled: true });
});

test('versioned disposition, review-event, and decision envelopes are strict', () => {
  const digest = `sha256:${'a'.repeat(64)}`;
  assert.equal(dispositionSchema.parse({
    schema_version: 1,
    run_id: 'run-1',
    review_id: 'R-001',
    finding_id: 'F-001',
    action: 'transfer-to-slice',
    target: 'slice-02-runtime',
  }).action, 'transfer-to-slice');
  assert.equal(reviewEventSchema.parse({
    schema_version: 1,
    run_id: 'run-1',
    event_class: 'targeted',
  }).event_class, 'targeted');
  assert.equal(decisionSchema.parse({
    schema_version: 1,
    run_id: 'run-1',
    review_id: 'R-001',
    phase: 'technical-plan',
    decision: 'approved-with-conditions',
    actor_id: 'person:alice',
    policy_version: 'v58',
    policy_digest: digest,
    artifact_sha256: digest,
    reason_sha256: digest,
    recorded_at: '2026-08-24T10:00:00.000Z',
  }).decision, 'approved-with-conditions');
  assert.throws(() => reviewEventSchema.parse({
    schema_version: 1,
    run_id: 'run-1',
    event_class: 'full',
    inferred_from_prose: true,
  }));
});

test('governance config rejects secret-bearing compatible keys', () => {
  for (const key of ['api_key', 'secret', 'secrets', 'credentials', 'github_token', 'refresh_token', 'passwd', 'pwd']) {
    const config = buildDefaultGovernanceConfig();
    config.policy.integration = { [key]: 'must-not-be-stored' };
    assert.throws(
      () => validateGovernanceConfig(config),
      (error) => error.code === 'GOVERNANCE_CONFIG_INVALID'
        && error.details.issues.some((issue) => issue.path === `policy.integration.${key}`),
      key,
    );
  }
  const neutralKey = buildDefaultGovernanceConfig();
  neutralKey.policy.integration = { value: 'sk-abcdefghijklmnop' };
  assert.throws(
    () => validateGovernanceConfig(neutralKey),
    (error) => error.code === 'GOVERNANCE_CONFIG_INVALID'
      && error.details.issues.some((issue) => issue.path === 'policy.integration.value'),
  );
  assert.throws(
    () => mergeGovernanceConfig({ governance: null }),
    (error) => error.code === 'GOVERNANCE_CONFIG_INVALID',
  );
});

test('governance config cannot remove mandatory sensitive categories or weaken minimum profile controls', () => {
  const missingSensitive = buildDefaultGovernanceConfig();
  missingSensitive.policy.sensitive_categories = [];
  const weakReview = buildDefaultGovernanceConfig();
  weakReview.policy.profiles['high-assurance'].technical_plan.independent_review = false;
  const weakActor = buildDefaultGovernanceConfig();
  weakActor.policy.profiles['high-assurance'].execution.verified_approval_actor = false;
  const excessiveReviews = buildDefaultGovernanceConfig();
  excessiveReviews.policy.profiles['fast-delivery'].technical_plan.max_reviews = 2;

  for (const config of [missingSensitive, weakReview, weakActor, excessiveReviews]) {
    assert.throws(() => validateGovernanceConfig(config), expectCode('GOVERNANCE_CONFIG_INVALID'));
  }
  assert.throws(
    () => mergeGovernanceConfig({ governance: { policy: { sensitive_categories: [] } } }),
    expectCode('GOVERNANCE_CONFIG_INVALID'),
  );

  const stricter = buildDefaultGovernanceConfig();
  stricter.policy.sensitive_categories.push('custom-sensitive');
  stricter.policy.profiles['fast-delivery'].acceptance.human_approval = 'required';
  stricter.policy.profiles['fast-delivery'].technical_plan.max_reviews = 0;
  assert.equal(validateGovernanceConfig(stricter).policy.profiles['fast-delivery'].acceptance.human_approval, 'required');
});

test('readGovernanceConfig distinguishes absent namespace from default resolution', () => {
  const project = makeTempProject();
  try {
    fs.mkdirSync(path.join(project.root, '.quiver'), { recursive: true });
    fs.writeFileSync(path.join(project.root, '.quiver', 'config.json'), '{"language":"en"}\n');

    assert.equal(hasGovernanceConfig(project.root), false);
    assert.equal(readGovernanceConfig(project.root, { allowMissing: true }), null);
    assert.equal(readGovernanceConfig(project.root).requested_profile, 'fast-delivery');

    const merged = mergeGovernanceConfig({ language: 'en' });
    fs.writeFileSync(path.join(project.root, '.quiver', 'config.json'), `${JSON.stringify(merged, null, 2)}\n`);
    assert.equal(hasGovernanceConfig(project.root), true);
    assert.equal(readGovernanceConfig(project.root, { allowMissing: true }).policy.version, 'v58');
  } finally {
    project.cleanup();
  }
});

test('stable policy digest ignores object key insertion order and excludes a stored digest', () => {
  const left = {
    version: 'v58',
    nested: { beta: 2, alpha: 1 },
    values: ['a', 'b'],
  };
  const right = {
    values: ['a', 'b'],
    nested: { alpha: 1, beta: 2 },
    digest: 'stale',
    version: 'v58',
  };

  assert.equal(stableStringify(left), stableStringify({ nested: { alpha: 1, beta: 2 }, values: ['a', 'b'], version: 'v58' }));
  assert.equal(computePolicyDigest(left), computePolicyDigest(right));
  assert.match(computePolicyDigest(left), /^sha256:[a-f0-9]{64}$/);
});

test('profile resolution honors CLI selection, forces sensitive work, and rejects active downgrade', () => {
  const governance = buildDefaultGovernanceConfig();
  const selected = resolveEffectiveProfile({ governance, cliProfile: 'high-assurance' });
  const forced = resolveEffectiveProfile({
    governance,
    requestedProfile: 'fast-delivery',
    requirementCategories: ['documentation', 'RLS'],
  });

  assert.equal(selected.requested_profile, 'high-assurance');
  assert.equal(selected.effective_profile, 'high-assurance');
  assert.equal(forced.requested_profile, 'fast-delivery');
  assert.equal(forced.effective_profile, 'high-assurance');
  assert.deepEqual(forced.force_reasons, ['rls']);
  assert.match(forced.policy_digest, /^sha256:/);
  assert.throws(
    () => resolveEffectiveProfile({ governance, activeRunProfile: 'high-assurance', requestedProfile: 'fast-delivery' }),
    expectCode('PROFILE_DOWNGRADE_FORBIDDEN'),
  );
});

test('authorization uses only explicit bindings and defaults to deny', () => {
  const governance = buildDefaultGovernanceConfig();
  governance.policy.authorization.actor_bindings['github-cli:U_1'] = {
    actor_id: 'actor-fabri',
    roles: ['maintainer'],
  };
  governance.policy.authorization.actions.approve = {
    allowed_actor_ids: [],
    allowed_roles: ['maintainer'],
    independence: 'different-from-executor',
  };
  const actor = {
    actor_id: 'actor-fabri',
    provider: 'github-cli',
    provider_subject: 'github-cli:U_1',
    verified: true,
    roles: ['provider-must-not-grant-this-role'],
  };

  const allowed = authorizeGovernanceAction({
    governance,
    action: 'approve',
    actor,
    profile: 'high-assurance',
    context: { executor: { actor_id: 'actor-executor' } },
  });
  const independentFailure = authorizeGovernanceAction({
    governance,
    action: 'approve',
    actor,
    context: { executor: { actor_id: 'actor-fabri' } },
  });
  const unknown = authorizeGovernanceAction({
    governance,
    action: 'approve',
    actor: { ...actor, actor_id: 'unknown', provider_subject: 'github-cli:U_2' },
  });

  assert.equal(allowed.authorized, true);
  assert.deepEqual(allowed.evidence.matched_roles, ['maintainer']);
  assert.equal(independentFailure.code, 'AUTHORIZATION_INDEPENDENCE_FAILED');
  assert.equal(unknown.code, 'AUTHORIZATION_ACTOR_UNKNOWN');

  governance.policy.authorization.actor_bindings['github-cli:U_1'].roles = [];
  assert.equal(
    authorizeGovernanceAction({ governance, action: 'approve', actor }).code,
    'AUTHORIZATION_DENIED',
    'roles asserted by the identity provider must not grant policy roles',
  );

  governance.policy.authorization.actions.approve.independence = 'unknown-rule';
  assert.equal(
    authorizeGovernanceAction({ governance, action: 'approve', actor }).code,
    'AUTHORIZATION_INDEPENDENCE_INVALID',
  );

  delete governance.policy.authorization.actions['accept-risk'];
  assert.equal(authorizeGovernanceAction({ governance, action: 'accept-risk', actor }).code, 'AUTHORIZATION_RULE_MISSING');
});

test('local actors are labeled and cannot authorize high-assurance mutations', () => {
  const governance = buildDefaultGovernanceConfig();
  governance.policy.authorization.actor_bindings['local:fabri'] = {
    actor_id: 'local:fabri',
    roles: ['maintainer'],
  };
  governance.policy.authorization.actions.approve.allowed_roles = ['maintainer'];
  const actor = {
    actor_id: 'local:fabri',
    provider: 'local',
    provider_subject: null,
    verified: false,
  };

  const fast = authorizeGovernanceAction({ governance, action: 'approve', actor, profile: 'fast-delivery' });
  const high = authorizeGovernanceAction({ governance, action: 'approve', actor, profile: 'high-assurance' });

  assert.equal(fast.authorized, true);
  assert.equal(fast.evidence.identity_label, 'LOCAL_UNVERIFIED_IDENTITY');
  assert.equal(high.authorized, false);
  assert.equal(high.code, 'VERIFIED_ACTOR_REQUIRED');
  assert.equal(
    authorizeGovernanceAction({ governance, action: 'approve', actor: { ...actor, verified: true }, profile: 'high-assurance' }).code,
    'VERIFIED_ACTOR_REQUIRED',
    'a local identity cannot self-assert verification for high-assurance',
  );
  const localSelfAsserted = authorizeGovernanceAction({
    governance,
    action: 'approve',
    actor: { ...actor, verified: true },
    profile: 'fast-delivery',
  });
  assert.equal(localSelfAsserted.authorized, true);
  assert.equal(localSelfAsserted.evidence.verified, false);
  assert.equal(localSelfAsserted.evidence.identity_label, 'LOCAL_UNVERIFIED_IDENTITY');
});

test('authorization independence compares the canonical actor bound to provider subjects', () => {
  const governance = buildDefaultGovernanceConfig();
  governance.policy.authorization.actor_bindings['github:github.com:42'] = {
    actor_id: 'person:alice',
    roles: ['maintainer'],
  };
  governance.policy.authorization.actions.approve = {
    allowed_actor_ids: [],
    allowed_roles: ['maintainer'],
    independence: 'different-from-executor',
  };
  const result = authorizeGovernanceAction({
    governance,
    action: 'approve',
    actor: {
      actor_id: 'github:github.com:42',
      provider: 'github-cli',
      provider_subject: 'github:github.com:42',
      verified: true,
    },
    context: { executor: { actor_id: 'person:alice' } },
  });

  assert.equal(result.authorized, false);
  assert.equal(result.code, 'AUTHORIZATION_INDEPENDENCE_FAILED');
  assert.equal(result.evidence.actor_id, 'person:alice');
});

test('authorization selects bindings only by exact provider subject or explicit local actor key', () => {
  const governance = buildDefaultGovernanceConfig();
  governance.policy.authorization.actor_bindings = {
    'github:github.com:999': { actor_id: 'github:github.com:42', roles: ['release-admin'] },
    'github:github.com:42': { actor_id: 'person:alice', roles: [] },
    'github:github.com:777': { actor_id: 'person:bob', roles: ['release-admin'] },
  };
  governance.policy.authorization.actions.approve = {
    allowed_actor_ids: [],
    allowed_roles: ['release-admin'],
    independence: 'none',
  };
  const githubActor = {
    actor_id: 'github:github.com:42',
    provider: 'github-cli',
    provider_subject: 'github:github.com:42',
    verified: true,
  };
  const localActor = {
    actor_id: 'person:bob',
    provider: 'local',
    provider_subject: null,
    verified: false,
  };

  assert.equal(authorizeGovernanceAction({ governance, action: 'approve', actor: githubActor }).code, 'AUTHORIZATION_DENIED');
  assert.equal(authorizeGovernanceAction({ governance, action: 'approve', actor: localActor }).code, 'AUTHORIZATION_ACTOR_UNKNOWN');
});

test('strict provider parser accepts direct or single fenced JSON and rejects heuristic prose', () => {
  const payload = makeReview([makeFinding({ confidence: 'provider-defined-confidence' })]);
  const direct = parseProviderReview(JSON.stringify(payload));
  const fenced = parseProviderReview(`Review evidence follows.\n\n\`\`\`json\n${JSON.stringify(payload)}\n\`\`\`\n`);

  assert.equal(direct.kind, 'quiver-plan-review');
  assert.equal(direct.review.findings[0].confidence, 'provider-defined-confidence');
  assert.equal(fenced.review.findings[0].id, 'provider-1');
  assert.throws(() => parseProviderReview('The plan should be approved.'), expectCode(PROVIDER_OUTPUT_INVALID));
  assert.throws(
    () => parseProviderReview(`\`\`\`json\n${JSON.stringify(payload)}\n\`\`\`\n\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``),
    expectCode(PROVIDER_OUTPUT_INVALID),
  );
});

test('strict provider parser rejects invalid fields, unjustified blockers, and aggregate manipulation', () => {
  const invalidEnum = makeReview([makeFinding({ severity: 'urgent' })]);
  const unjustified = makeReview([makeFinding({ blocking_justification: undefined })]);
  const extraField = makeReview();
  extraField.review.findings[0].unexpected = true;
  const blockingMismatch = makeReview(undefined, { blocking: false });
  const recommendationMismatch = makeReview(undefined, { recommendation: 'approve' });
  const allowedNonBlockingSecurity = makeReview([makeFinding({
    phase_blocking: false,
    blocking_justification: undefined,
  })]);
  const ineligibleBlocker = makeReview([makeFinding({
    category: 'testing',
    recommended_disposition: 'revise-plan',
  })]);
  const optionalBlocker = makeReview([makeFinding({ recommended_disposition: 'optional' })]);
  const followUpBlocker = makeReview([makeFinding({ recommended_disposition: 'create-follow-up' })]);

  assert.equal(parseProviderReview(JSON.stringify(allowedNonBlockingSecurity)).review.findings[0].phase_blocking, false);
  for (const payload of [
    invalidEnum,
    unjustified,
    extraField,
    blockingMismatch,
    recommendationMismatch,
    ineligibleBlocker,
    optionalBlocker,
    followUpBlocker,
  ]) {
    assert.throws(() => parseProviderReview(JSON.stringify(payload)), expectCode(PROVIDER_OUTPUT_INVALID));
  }
});

test('phase-aware projection keeps plan, slice, PR, follow-up, and optional collections separate', () => {
  const findings = [
    makeFinding({ id: 'plan' }),
    makeFinding({
      id: 'slice',
      category: 'implementation-detail',
      phase_owner: 'slice',
      phase_blocking: false,
      blocking_justification: undefined,
      recommended_disposition: 'transfer-to-slice',
    }),
    makeFinding({
      id: 'pr',
      category: 'testing',
      phase_owner: 'pr-review',
      phase_blocking: false,
      blocking_justification: undefined,
      recommended_disposition: 'transfer-to-pr',
    }),
    makeFinding({
      id: 'follow',
      category: 'follow-up',
      phase_owner: 'follow-up',
      phase_blocking: false,
      blocking_justification: undefined,
      recommended_disposition: 'create-follow-up',
    }),
    makeFinding({
      id: 'optional',
      category: 'optional-hardening',
      phase_owner: 'follow-up',
      phase_blocking: false,
      blocking_justification: undefined,
      recommended_disposition: 'optional',
    }),
  ];

  const projection = projectPhaseAwareReview(findings);

  assert.equal(projection.blocking, true);
  assert.deepEqual(projection.required_fixes, ['plan']);
  assert.deepEqual(projection.plan_required_fixes, ['plan']);
  assert.deepEqual(projection.slice_required_fixes, ['slice']);
  assert.deepEqual(projection.pr_required_fixes, ['pr']);
  assert.deepEqual(projection.follow_ups, ['follow']);
  assert.deepEqual(projection.optional_hardening, ['optional']);
  assert.deepEqual(projection.later_phase_transfers.map((finding) => finding.id), ['slice', 'pr']);
});

test('phase-aware projection applies the versioned review policy deterministically to both profiles', () => {
  const governance = buildDefaultGovernanceConfig();
  const finding = makeFinding();

  assert.equal(projectPhaseAwareReview([finding], {
    governance,
    effectiveProfile: 'fast-delivery',
  }).blocking, true);
  assert.equal(projectPhaseAwareReview([finding], {
    governance,
    effectiveProfile: 'high-assurance',
  }).blocking, true);

  governance.policy.review_policy['technical-plan'] = {
    blocking_categories: [],
    non_blocking_categories: ['security'],
  };
  assert.equal(projectPhaseAwareReview([finding], {
    governance,
    effectiveProfile: 'fast-delivery',
  }).blocking, false);
  assert.equal(projectPhaseAwareReview([finding], {
    governance,
    effectiveProfile: 'high-assurance',
  }).blocking, false);
});

test('finding fingerprint uses only normalized invariant identity fields', () => {
  const first = makeFinding({
    id: 'provider-a',
    title: 'First title',
    acceptance_refs: ['AC-02', 'AC-01'],
    evidence: ['./src\\actor.js#/b', 'src/actor.js#/a'],
  });
  const equivalent = makeFinding({
    id: 'provider-b',
    title: 'Renamed finding',
    severity: 'critical',
    confidence: 'medium',
    acceptance_refs: ['AC-01', 'AC-02'],
    evidence: ['src/actor.js#/a', 'src/actor.js#/b'],
  });
  const changed = makeFinding({
    acceptance_refs: ['AC-01', 'AC-03'],
    evidence: ['src/actor.js#/a', 'src/actor.js#/b'],
  });

  assert.equal(computeFindingFingerprint(first), computeFindingFingerprint(equivalent));
  assert.notEqual(computeFindingFingerprint(first), computeFindingFingerprint(changed));
});

test('reconciliation allocates canonical IDs, reuses fingerprints, preserves omission, and reopens closed findings', () => {
  const created = reconcileFindings({
    runId: 'run-1',
    reviewId: 'review-1',
    incomingFindings: [makeFinding({ id: 'F-999' })],
    now: new Date('2026-08-24T10:00:00.000Z'),
  });
  assert.equal(created.reconciledFindings[0].finding_id, 'F-001');
  assert.equal(created.reconciledFindings[0].origins[0].provider_finding_id, 'F-999');
  assert.equal(created.nextFindingNumber, 2);

  const reused = reconcileFindings({
    runId: 'run-1',
    reviewId: 'review-2',
    incomingFindings: [makeFinding({ id: 'provider-renumbered', title: 'Updated title' })],
    existingFindings: created.findings,
    nextFindingNumber: created.nextFindingNumber,
  });
  assert.equal(reused.reconciledFindings[0].finding_id, 'F-001');
  assert.equal(reused.events[0].event, 'reused');

  const omitted = reconcileFindings({
    runId: 'run-1',
    incomingFindings: [],
    existingFindings: reused.findings,
    nextFindingNumber: reused.nextFindingNumber,
  });
  assert.equal(omitted.findings[0].state, 'open');

  const closed = omitted.findings.map((finding) => ({
    ...finding,
    state: 'closed',
    lifecycle: finding.lifecycle.concat({
      event: 'closed',
      at: '2026-08-24T10:30:00.000Z',
      review_id: 'review-2',
      disposition_id: 'disposition-1',
    }),
  }));
  const reopened = reconcileFindings({
    runId: 'run-1',
    reviewId: 'review-3',
    incomingFindings: [makeFinding({ id: 'provider-returned', canonical_id: 'F-001' })],
    existingFindings: closed,
    nextFindingNumber: omitted.nextFindingNumber,
  });
  assert.equal(reopened.reconciledFindings[0].state, 'open');
  assert.equal(reopened.events[0].event, 'reopened');
  assert.equal(reopened.reconciledFindings[0].lifecycle.at(-1).event, 'reopened');
});

test('supersession creates lineage without silently closing the prior finding', () => {
  const created = reconcileFindings({ runId: 'run-1', incomingFindings: [makeFinding()] });
  const superseded = reconcileFindings({
    runId: 'run-1',
    reviewId: 'review-2',
    incomingFindings: [makeFinding({
      id: 'provider-successor',
      category: 'data-integrity',
      supersedes: 'F-001',
    })],
    existingFindings: created.findings,
    nextFindingNumber: created.nextFindingNumber,
    now: new Date('2026-08-24T11:00:00.000Z'),
  });

  const prior = superseded.findings.find((finding) => finding.finding_id === 'F-001');
  const successor = superseded.findings.find((finding) => finding.finding_id === 'F-002');
  assert.equal(prior.state, 'open');
  assert.equal(prior.lifecycle.at(-1).event, 'superseded-by');
  assert.equal(prior.lifecycle.at(-1).successor_id, 'F-002');
  assert.equal(successor.supersedes, 'F-001');
});

test('reconciliation rejects duplicate fingerprints, ambiguous stores, and incompatible explicit IDs', () => {
  const finding = makeFinding();
  assert.throws(
    () => reconcileFindings({
      runId: 'run-1',
      incomingFindings: [finding, makeFinding({ id: 'provider-2', title: 'Duplicate identity' })],
    }),
    expectCode(FINDING_RECONCILIATION_AMBIGUOUS),
  );

  const created = reconcileFindings({ runId: 'run-1', incomingFindings: [finding] });
  const duplicateStore = created.findings.concat({
    ...created.findings[0],
    finding_id: 'F-002',
  });
  assert.throws(
    () => reconcileFindings({ runId: 'run-1', incomingFindings: [makeFinding({ id: 'provider-3' })], existingFindings: duplicateStore }),
    expectCode(FINDING_RECONCILIATION_AMBIGUOUS),
  );
  assert.throws(
    () => reconcileFindings({
      runId: 'run-1',
      incomingFindings: [makeFinding({ id: 'provider-4', canonical_id: 'F-001', category: 'rollout' })],
      existingFindings: created.findings,
    }),
    expectCode(FINDING_RECONCILIATION_AMBIGUOUS),
  );
  assert.throws(
    () => reconcileFindings({
      runId: 'run-1',
      incomingFindings: [],
      existingFindings: [{ ...created.findings[0], phase_owner: 'unknown-phase' }],
    }),
    expectCode('GOVERNANCE_STATE_INVALID'),
  );
  assert.throws(
    () => reconcileFindings({
      runId: 'run-1',
      incomingFindings: [],
      existingFindings: [{ ...created.findings[0], run_id: 'run-2' }],
    }),
    expectCode('GOVERNANCE_STATE_INVALID'),
  );
  assert.throws(
    () => reconcileFindings({
      runId: 'run-1',
      incomingFindings: [],
      existingFindings: [{ ...created.findings[0], acceptance_refs: ['AC-99'] }],
    }),
    expectCode('GOVERNANCE_STATE_INVALID'),
  );
});
