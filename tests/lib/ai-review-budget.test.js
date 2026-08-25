const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const test = require('node:test');

const {
  REVIEW_BUDGET_EXHAUSTED,
  REVIEW_BUDGET_NEXT_ACTIONS,
  classifyReviewIntent,
  extendReviewBudget,
  finalizeReviewBudget,
  formatReviewBudget,
  projectReviewBudget,
  readReviewBudget,
  readReviewBudgetEvents,
  reserveReviewBudget,
} = require('../../src/create-quiver/lib/ai/review-budget');
const {
  buildDefaultGovernanceConfig,
  resolveEffectiveProfile,
  stableStringify,
} = require('../../src/create-quiver/lib/ai/review-governance');
const {
  createAiRun,
  updateAiRunPhase,
} = require('../../src/create-quiver/lib/ai/run-state');

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-review-budget-'));
  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function seedRun(repoRoot, runId, governance, requestedProfile = governance.requested_profile) {
  const profile = resolveEffectiveProfile({
    governance,
    requestedProfile,
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
  updateAiRunPhase(repoRoot, runId, 'technical-plan-draft', {
    command: 'test technical plan draft',
  });
  return profile;
}

function fullIntent(candidateId = 'candidate-v1', parentReviewId = null) {
  return {
    event_class: 'full',
    candidate_id: candidateId,
    complete_replacement: true,
    reviewed_parent_id: parentReviewId,
  };
}

function requestEnvelope(runId, candidate = 'candidate-v1') {
  return {
    schema_version: 1,
    command: 'ai review-plan',
    run_id: runId,
    phase: 'technical-plan',
    candidate_sha256: `sha256:${candidate.padEnd(64, '0').slice(0, 64).replace(/[^a-f0-9]/g, 'a')}`,
  };
}

function spawnReservation(modulePath, repoRoot, runId, governance, label) {
  const script = `
    const { reserveReviewBudget } = require(${JSON.stringify(modulePath)});
    const { resolveEffectiveProfile } = require(${JSON.stringify(path.resolve(__dirname, '../../src/create-quiver/lib/ai/review-governance.js'))});
    const governance = JSON.parse(process.env.TEST_GOVERNANCE);
    const profile = resolveEffectiveProfile({ governance });
    try {
      const value = reserveReviewBudget(${JSON.stringify(repoRoot)}, {
        runId: ${JSON.stringify(runId)},
        governance,
        profile,
        intent: { event_class: 'full', candidate_id: ${JSON.stringify(label)}, complete_replacement: true, reviewed_parent_id: null },
        requestEnvelope: { schema_version: 1, run_id: ${JSON.stringify(runId)}, label: ${JSON.stringify(label)} },
      });
      process.stdout.write(JSON.stringify(value));
    } catch (error) {
      process.stderr.write(String(error.code || error.message));
      process.exitCode = 2;
    }
  `;
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['-e', script], {
      cwd: repoRoot,
      env: { ...process.env, TEST_GOVERNANCE: JSON.stringify(governance) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

test('review intent classification is explicit and rejects selectable retry or stale targets', () => {
  assert.deepEqual(classifyReviewIntent(fullIntent(), { currentReviewId: null }), fullIntent());
  assert.deepEqual(
    classifyReviewIntent(fullIntent('candidate-v2', 'R-001'), { currentReviewId: 'R-001' }),
    fullIntent('candidate-v2', 'R-001'),
  );
  assert.deepEqual(classifyReviewIntent({
    event_class: 'targeted',
    candidate_id: 'candidate-v2',
    base_review_id: 'R-001',
    finding_ids: ['F-002', 'F-001', 'F-001'],
    sections: [],
  }, { currentReviewId: 'R-001' }), {
    event_class: 'targeted',
    candidate_id: 'candidate-v2',
    base_review_id: 'R-001',
    finding_ids: ['F-001', 'F-002'],
    sections: [],
  });
  assert.equal(classifyReviewIntent({
    event_class: 'external',
    declared_class: 'targeted',
    adapter_id: 'signed-json-adapter-v1',
    candidate_id: 'candidate-v2',
    complete_replacement: false,
    reviewed_parent_id: null,
    base_review_id: 'R-001',
    finding_ids: ['F-001'],
    sections: [],
  }, { currentReviewId: 'R-001' }).event_class, 'external');

  assert.throws(
    () => classifyReviewIntent({ event_class: 'retry' }),
    (error) => error.code === 'REVIEW_INTENT_INVALID',
  );
  assert.throws(
    () => classifyReviewIntent({
      event_class: 'targeted',
      candidate_id: 'candidate-v2',
      base_review_id: 'R-foreign',
      finding_ids: ['F-001'],
      sections: [],
    }, { currentReviewId: 'R-001' }),
    (error) => error.code === 'REVIEW_INTENT_INVALID',
  );
});

test('atomic reservation exhausts fast delivery before a second provider attempt', () => {
  const repo = makeRepo();
  const governance = buildDefaultGovernanceConfig();
  try {
    const profile = seedRun(repo.root, 'run-fast-budget', governance);
    const first = reserveReviewBudget(repo.root, {
      runId: 'run-fast-budget',
      governance,
      profile: {
        ...profile,
        controls: { technical_plan: { max_reviews: 99, max_full_revisions: 99 } },
      },
      intent: fullIntent(),
      requestEnvelope: requestEnvelope('run-fast-budget'),
    });
    assert.equal(first.event_class, 'full');
    assert.equal(first.budget.counts.review_count, 1);
    assert.equal(first.budget.counts.full_revision_count, 0);
    assert.equal(first.budget.counts.pending_reservation_count, 1);
    assert.equal(first.budget.exhausted, true);

    assert.throws(
      () => reserveReviewBudget(repo.root, {
        runId: 'run-fast-budget',
        governance,
        profile,
        intent: fullIntent('candidate-v2'),
        requestEnvelope: requestEnvelope('run-fast-budget', 'candidate-v2'),
      }),
      (error) => error.code === REVIEW_BUDGET_EXHAUSTED
        && error.details.machine_codes.includes('HUMAN_DECISION_REQUIRED')
        && error.details.next_actions.length === 5,
    );
    assert.deepEqual(readReviewBudgetEvents(repo.root, 'run-fast-budget').map((event) => event.kind), ['reservation']);
  } finally {
    repo.cleanup();
  }
});

test('reservation rejects a request snapshot that changed before the atomic commit', () => {
  const repo = makeRepo();
  const governance = buildDefaultGovernanceConfig();
  try {
    const profile = seedRun(repo.root, 'run-stale-reservation', governance);
    assert.throws(
      () => reserveReviewBudget(repo.root, {
        runId: 'run-stale-reservation',
        governance,
        profile,
        intent: fullIntent(),
        requestEnvelope: requestEnvelope('run-stale-reservation', 'candidate-v1'),
        currentRequestEnvelope: () => requestEnvelope('run-stale-reservation', 'candidate-v2'),
      }),
      (error) => error.code === 'REVIEW_REQUEST_STALE',
    );
    assert.deepEqual(readReviewBudgetEvents(repo.root, 'run-stale-reservation'), []);
  } finally {
    repo.cleanup();
  }
});

test('a semantic review may reserve the same envelope again after invalid output when capacity remains', () => {
  const repo = makeRepo();
  const governance = buildDefaultGovernanceConfig();
  governance.requested_profile = 'high-assurance';
  try {
    const profile = seedRun(repo.root, 'run-invalid-rereserve', governance, 'high-assurance');
    const envelope = requestEnvelope('run-invalid-rereserve');
    const first = reserveReviewBudget(repo.root, {
      runId: 'run-invalid-rereserve', governance, profile, intent: fullIntent(), requestEnvelope: envelope,
    });
    finalizeReviewBudget(repo.root, {
      runId: 'run-invalid-rereserve', governance, profile,
      reservationId: first.reservation_id,
      attempt: first.attempt,
      requestEnvelopeDigest: first.request_envelope_digest,
      outcome: 'invalid-output',
      receivedPayload: true,
    });

    const second = reserveReviewBudget(repo.root, {
      runId: 'run-invalid-rereserve', governance, profile, intent: fullIntent(), requestEnvelope: envelope,
    });
    assert.equal(second.reservation_id, 'BR-000002');
    assert.equal(second.event_class, 'full');
    assert.equal(second.attempt, 1);
    assert.equal(second.budget.counts.review_count, 2);
    assert.equal(second.budget.counts.invalid_output_count, 1);
    assert.equal(second.budget.counts.pending_reservation_count, 1);
  } finally {
    repo.cleanup();
  }
});

test('a policy change cannot be masked by a stale profile object', () => {
  const repo = makeRepo();
  const governance = buildDefaultGovernanceConfig();
  try {
    const profile = seedRun(repo.root, 'run-policy-mask', governance);
    governance.policy.authorization.actions.approve.allowed_roles = ['maintainer'];
    assert.throws(
      () => reserveReviewBudget(repo.root, {
        runId: 'run-policy-mask',
        governance,
        profile,
        intent: fullIntent(),
        requestEnvelope: requestEnvelope('run-policy-mask'),
      }),
      (error) => error.code === 'GOVERNANCE_STATE_INVALID',
    );
    assert.deepEqual(readReviewBudgetEvents(repo.root, 'run-policy-mask'), []);
  } finally {
    repo.cleanup();
  }
});

test('pre-payload timeout becomes retry and the same envelope consumes exactly one semantic slot', () => {
  const repo = makeRepo();
  const governance = buildDefaultGovernanceConfig();
  governance.requested_profile = 'high-assurance';
  try {
    const profile = seedRun(repo.root, 'run-retry-budget', governance, 'high-assurance');
    const envelope = requestEnvelope('run-retry-budget');
    const first = reserveReviewBudget(repo.root, {
      runId: 'run-retry-budget', governance, profile, intent: fullIntent(), requestEnvelope: envelope,
    });
    const retryOutcome = finalizeReviewBudget(repo.root, {
      runId: 'run-retry-budget',
      governance,
      profile,
      reservationId: first.reservation_id,
      attempt: first.attempt,
      requestEnvelopeDigest: first.request_envelope_digest,
      outcome: 'retry',
      receivedPayload: false,
      failureKind: 'timeout',
    });
    assert.equal(retryOutcome.budget.counts.review_count, 0);
    assert.equal(retryOutcome.budget.counts.retry_count, 1);

    const retry = reserveReviewBudget(repo.root, {
      runId: 'run-retry-budget', governance, profile, intent: fullIntent(), requestEnvelope: envelope,
    });
    assert.equal(retry.event_class, 'retry');
    assert.equal(retry.attempt, 2);
    assert.equal(retry.budget.counts.review_count, 1);
    const invalid = finalizeReviewBudget(repo.root, {
      runId: 'run-retry-budget',
      governance,
      profile,
      reservationId: retry.reservation_id,
      attempt: retry.attempt,
      requestEnvelopeDigest: retry.request_envelope_digest,
      outcome: 'invalid-output',
      receivedPayload: true,
    });
    assert.equal(invalid.budget.counts.review_count, 1);
    assert.equal(invalid.budget.counts.invalid_output_count, 1);
    assert.equal(invalid.budget.counts.retry_count, 1);
  } finally {
    repo.cleanup();
  }
});

test('a reviewed candidate cannot be relabeled as a later full review', () => {
  const repo = makeRepo();
  const governance = buildDefaultGovernanceConfig();
  governance.requested_profile = 'high-assurance';
  try {
    const profile = seedRun(repo.root, 'run-full-candidate', governance, 'high-assurance');
    const first = reserveReviewBudget(repo.root, {
      runId: 'run-full-candidate',
      governance,
      profile,
      intent: fullIntent('candidate-v1'),
      requestEnvelope: requestEnvelope('run-full-candidate', 'candidate-v1'),
    });
    const runStatePath = path.join(repo.root, '.quiver/runs/run-full-candidate/review-governance.json');
    fs.writeFileSync(runStatePath, `${JSON.stringify({
      schema_version: 1,
      run_id: 'run-full-candidate',
      next_finding_number: 1,
      current_review_id: 'R-001',
      reviews: [{
        schema_version: 1,
        review_id: 'R-001',
        run_id: 'run-full-candidate',
        source_file: 'technical-plan.md',
        source_kind: 'draft',
        source_version: 1,
        raw_artifact_path: null,
        output_source: 'stdout',
        provider_finding_ids: [],
        finding_ids: [],
        requested_profile: profile.requested_profile,
        effective_profile: profile.effective_profile,
        policy_version: profile.policy_version,
        policy_digest: profile.policy_digest,
        provider_recommendation: 'approve',
        provider_blocking: false,
        projection: {
          blocking: false,
          approval_recommendation: 'approve',
          required_fixes: [],
          plan_required_fixes: [],
          slice_required_fixes: [],
          pr_required_fixes: [],
          follow_ups: [],
          optional_hardening: [],
          current_blockers: [],
          later_phase_transfers: [],
        },
        reviewed_at: '2026-08-25T00:00:00.000Z',
      }],
      findings: [],
    }, null, 2)}\n`);
    finalizeReviewBudget(repo.root, {
      runId: 'run-full-candidate',
      governance,
      profile,
      reservationId: first.reservation_id,
      attempt: first.attempt,
      requestEnvelopeDigest: first.request_envelope_digest,
      outcome: 'valid',
      receivedPayload: true,
      reviewId: 'R-001',
      prevalidated: true,
    });

    assert.throws(
      () => reserveReviewBudget(repo.root, {
        runId: 'run-full-candidate',
        governance,
        profile,
        intent: fullIntent('candidate-v1', 'R-001'),
        requestEnvelope: { ...requestEnvelope('run-full-candidate', 'candidate-v1'), pass: 2 },
      }),
      (error) => error.code === 'REVIEW_INTENT_INVALID'
        && error.details.governed_next_action === 'targeted-amendment',
    );
    assert.equal(readReviewBudgetEvents(repo.root, 'run-full-candidate').length, 2);
  } finally {
    repo.cleanup();
  }
});

test('all counters and human output derive from one canonical event fold', () => {
  const governance = buildDefaultGovernanceConfig();
  governance.requested_profile = 'high-assurance';
  const commonDigest = `sha256:${'a'.repeat(64)}`;
  const events = [
    {
      kind: 'reservation', reservation_id: 'BR-000001', attempt: 1, event_class: 'full', semantic_class: 'full',
      request_envelope_digest: commonDigest, intent_digest: commonDigest, intent: fullIntent(),
    },
    {
      kind: 'outcome', reservation_id: 'BR-000001', attempt: 1, event_class: 'full',
      request_envelope_digest: commonDigest, outcome: 'valid', received_payload: true, review_id: 'R-001', failure_kind: null,
    },
    {
      kind: 'reservation', reservation_id: 'BR-000002', attempt: 1, event_class: 'full', semantic_class: 'full',
      request_envelope_digest: commonDigest, intent_digest: commonDigest, intent: fullIntent('candidate-v2', 'R-001'),
    },
    {
      kind: 'reservation', reservation_id: 'BR-000003', attempt: 1, event_class: 'external', semantic_class: 'targeted',
      request_envelope_digest: commonDigest, intent_digest: commonDigest,
      intent: {
        event_class: 'external', declared_class: 'targeted', adapter_id: 'adapter-v1', candidate_id: 'candidate-v2',
        complete_replacement: false, reviewed_parent_id: null, base_review_id: 'R-001', finding_ids: ['F-001'], sections: [],
      },
    },
  ];
  const profile = resolveEffectiveProfile({ governance, requestedProfile: 'high-assurance' });
  const projection = projectReviewBudget(events, { governance, profile, runId: 'run-fold' });
  assert.deepEqual(projection.counts, {
    review_count: 3,
    full_revision_count: 1,
    targeted_amendment_count: 1,
    external_review_count: 1,
    invalid_output_count: 0,
    retry_count: 0,
    pending_reservation_count: 2,
  });
  const human = formatReviewBudget(projection);
  assert.match(human, /Reviews: 3\/2/);
  assert.match(human, /Full revisions: 1\/1/);
  assert.match(human, /Targeted amendments: 1/);
  assert.match(human, /External reviews: 1/);
  assert.match(human, /Pending reservations: 2/);
  assert.deepEqual(JSON.parse(JSON.stringify(projection)).counts, projection.counts);
});

test('budget extension is default-deny without mutating the ledger', () => {
  const repo = makeRepo();
  const governance = buildDefaultGovernanceConfig();
  const verifiedActor = {
    actor_id: 'github:github.com:42',
    provider: 'github-cli',
    provider_subject: 'github:github.com:42',
    verified: true,
  };
  governance.policy.authorization.actor_bindings[verifiedActor.provider_subject] = {
    actor_id: verifiedActor.actor_id,
    roles: ['maintainer'],
  };
  try {
    const profile = seedRun(repo.root, 'run-extension', governance);
    reserveReviewBudget(repo.root, {
      runId: 'run-extension', governance, profile, intent: fullIntent(), requestEnvelope: requestEnvelope('run-extension'),
    });
    assert.throws(
      () => extendReviewBudget(repo.root, { runId: 'run-extension', governance, profile, actor: verifiedActor }),
      (error) => error.code === 'AUTHORIZATION_DENIED',
    );
    assert.equal(readReviewBudgetEvents(repo.root, 'run-extension').length, 1);
  } finally {
    repo.cleanup();
  }
});

test('authorized extension preserves policy bytes and ledger audit while increasing only review capacity', () => {
  const repo = makeRepo();
  const governance = buildDefaultGovernanceConfig();
  governance.requested_profile = 'high-assurance';
  const actor = {
    actor_id: 'github:github.com:42', provider: 'github-cli', provider_subject: 'github:github.com:42', verified: true,
  };
  governance.policy.authorization.actor_bindings[actor.provider_subject] = {
    actor_id: actor.actor_id,
    roles: ['maintainer'],
  };
  const localActor = {
    actor_id: 'local:maintainer', provider: 'local', provider_subject: null, verified: false,
  };
  governance.policy.authorization.actor_bindings[localActor.actor_id] = {
    actor_id: localActor.actor_id,
    roles: ['maintainer'],
  };
  governance.policy.authorization.actions['extend-review-budget'] = {
    allowed_actor_ids: [], allowed_roles: ['maintainer'], independence: 'none',
  };
  const policyBytes = stableStringify(governance);
  try {
    const profile = seedRun(repo.root, 'run-authorized-extension', governance);
    reserveReviewBudget(repo.root, {
      runId: 'run-authorized-extension', governance, profile, intent: fullIntent(), requestEnvelope: requestEnvelope('run-authorized-extension'),
    });
    assert.throws(
      () => extendReviewBudget(repo.root, {
        runId: 'run-authorized-extension', governance, profile, actor: localActor,
      }),
      (error) => error.code === 'VERIFIED_ACTOR_REQUIRED',
    );
    assert.throws(
      () => extendReviewBudget(repo.root, {
        runId: 'run-authorized-extension', governance, profile: {}, actor: localActor,
      }),
      (error) => error.code === 'VERIFIED_ACTOR_REQUIRED',
    );
    const extension = extendReviewBudget(repo.root, {
      runId: 'run-authorized-extension', governance, profile, actor,
    });
    assert.equal(extension.budget.limits.max_reviews, 3);
    assert.equal(extension.budget.limits.max_full_revisions, 1);
    assert.equal(extension.budget.remaining.reviews, 2);
    assert.equal(extension.event.additional_reviews, 1);
    assert.equal(extension.event.authorization_evidence.actor_id, actor.actor_id);
    assert.deepEqual(extension.event.authorization_evidence.matched_roles, ['maintainer']);
    assert.equal(stableStringify(governance), policyBytes);
  } finally {
    repo.cleanup();
  }
});

test('fast delivery permits an explicitly bound local actor to extend budget with an audit label', () => {
  const repo = makeRepo();
  const governance = buildDefaultGovernanceConfig();
  const localActor = {
    actor_id: 'local:maintainer', provider: 'local', provider_subject: null, verified: false,
  };
  governance.policy.authorization.actor_bindings[localActor.actor_id] = {
    actor_id: localActor.actor_id,
    roles: ['maintainer'],
  };
  governance.policy.authorization.actions['extend-review-budget'] = {
    allowed_actor_ids: [], allowed_roles: ['maintainer'], independence: 'none',
  };
  try {
    const profile = seedRun(repo.root, 'run-local-extension', governance);
    reserveReviewBudget(repo.root, {
      runId: 'run-local-extension', governance, profile, intent: fullIntent(), requestEnvelope: requestEnvelope('run-local-extension'),
    });
    const extension = extendReviewBudget(repo.root, {
      runId: 'run-local-extension', governance, profile, actor: localActor,
    });
    assert.equal(extension.authorization.authorized, true);
    assert.equal(extension.event.authorization_evidence.verified, false);
    assert.equal(extension.event.authorization_evidence.identity_label, 'LOCAL_UNVERIFIED_IDENTITY');
    assert.equal(extension.budget.limits.max_reviews, 2);
  } finally {
    repo.cleanup();
  }
});

test('review budgets are isolated by run and foreign ledger events fail closed', () => {
  const repo = makeRepo();
  const governance = buildDefaultGovernanceConfig();
  try {
    const profileA = seedRun(repo.root, 'run-a', governance);
    const profileB = seedRun(repo.root, 'run-b', governance);
    reserveReviewBudget(repo.root, {
      runId: 'run-a', governance, profile: profileA, intent: fullIntent('candidate-a'), requestEnvelope: requestEnvelope('run-a', 'candidate-a'),
    });
    assert.equal(readReviewBudget(repo.root, 'run-a', { governance, profile: profileA }).projection.counts.review_count, 1);
    assert.equal(readReviewBudget(repo.root, 'run-b', { governance, profile: profileB }).projection.counts.review_count, 0);

    const eventFile = fs.readdirSync(path.join(repo.root, '.quiver/runs/run-a/review-budget-events'))[0];
    const eventPath = path.join(repo.root, '.quiver/runs/run-a/review-budget-events', eventFile);
    const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
    event.run_id = 'run-b';
    fs.writeFileSync(eventPath, `${JSON.stringify(event, null, 2)}\n`);
    assert.throws(
      () => readReviewBudgetEvents(repo.root, 'run-a'),
      (error) => error.code === 'REVIEW_BUDGET_LEDGER_INVALID',
    );
  } finally {
    repo.cleanup();
  }
});

test('cross-process reservations cannot overspend one run budget', async () => {
  const repo = makeRepo();
  const governance = buildDefaultGovernanceConfig();
  try {
    const profile = seedRun(repo.root, 'run-concurrent', governance);
    const modulePath = path.resolve(__dirname, '../../src/create-quiver/lib/ai/review-budget.js');
    const results = await Promise.all([
      spawnReservation(modulePath, repo.root, 'run-concurrent', governance, 'candidate-a'),
      spawnReservation(modulePath, repo.root, 'run-concurrent', governance, 'candidate-b'),
    ]);
    assert.equal(results.filter((result) => result.code === 0).length, 1);
    assert.equal(results.filter((result) => result.code !== 0).length, 1);
    const budget = readReviewBudget(repo.root, 'run-concurrent', { governance, profile }).projection;
    assert.equal(budget.counts.review_count, 1);
    assert.equal(budget.counts.pending_reservation_count, 1);
    assert.deepEqual(budget.next_actions, REVIEW_BUDGET_NEXT_ACTIONS);
  } finally {
    repo.cleanup();
  }
});
