const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  approvePlannerPhase,
  savePlannerDraft,
} = require('../../src/create-quiver/lib/approvals');

const {
  acquireAiRunLock,
  assertAiRunPhaseAllows,
  bindAiRunGovernance,
  buildAiRunGovernanceProjection,
  commitDigestBoundApproval,
  createAiRun,
  formatAiRunResume,
  formatAiRunStatus,
  listAiRuns,
  readAiRun,
  readAiRunLock,
  readRunGovernance,
  recoverDigestBoundApprovalCommit,
  recordAiRunApproval,
  releaseAiRunLock,
  resolveGovernedAiRun,
  runApprovalsPath,
  runApprovalArtifactPath,
  runApprovalCommitPath,
  runGovernancePath,
  runStatePath,
  updateAiRunPhase,
  withAiRunLock,
  writeRunGovernance,
} = require('../../src/create-quiver/lib/ai/run-state');
const {
  buildDefaultGovernanceConfig,
  canonicalSha256,
  computePolicyDigest,
} = require('../../src/create-quiver/lib/ai/review-governance');
const packageJson = require('../../package.json');

function sha256(value) {
  return `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
}

function refreshApprovalMarkerDigest(marker) {
  delete marker.marker_sha256;
  marker.marker_sha256 = canonicalSha256(marker);
  return marker;
}

function readBytesOrNull(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;
}

function approvalPrepareFixture(repoRoot, runId) {
  const policyDigest = `sha256:${'1'.repeat(64)}`;
  const artifactBytes = Buffer.from('# Acceptance\n\n- AC-01 exact bytes.\r\n', 'utf8');
  const inputPath = `.quiver/runs/${runId}/requirement.md`;
  const inputBytes = fs.readFileSync(path.join(repoRoot, inputPath));
  return {
    bindings: {
      run_id: runId,
      review_id: null,
      phase: 'acceptance',
      decision: 'approved',
      candidate_id: null,
      evaluation_id: null,
      version: 1,
      artifact_path: '.quiver/approvals/acceptance/drafts/001.md',
      artifact_sha256: sha256(artifactBytes),
      input_path: inputPath,
      input_sha256: sha256(inputBytes),
      review_sha256: null,
      requested_profile: 'fast-delivery',
      effective_profile: 'fast-delivery',
      profile_sha256: `sha256:${'2'.repeat(64)}`,
      policy_version: 'v58',
      policy_digest: policyDigest,
      finding_count: 0,
      criterion_count: 1,
      disposition_ids: [],
      disposition_sha256: sha256('[]'),
      reason_path: null,
      reason_sha256: null,
      actor_id: 'local:approver',
      authorization: {
        action: 'approve',
        policy_version: 'v58',
        policy_digest: policyDigest,
        actor_id: 'local:approver',
        provider_actor_id: 'local:approver',
        provider_subject: null,
        verified: false,
        binding: 'local:approver',
        matched_actor_ids: ['local:approver'],
        matched_roles: [],
        independence: 'none',
        independence_result: 'passed',
        identity_label: 'LOCAL_UNVERIFIED_IDENTITY',
      },
      reviewer_recommendation: null,
      reviewer_approved: null,
    },
    artifact: { bytes: artifactBytes },
    legacyProjection: {
      targets: [
        {
          path: path.join(repoRoot, '.quiver', 'approvals', 'acceptance', 'approved.md'),
          contents: artifactBytes,
        },
        {
          path: path.join(repoRoot, '.quiver', 'approvals', 'acceptance', 'meta.json'),
          contents: Buffer.from('{"phase":"acceptance"}\n', 'utf8'),
        },
      ],
    },
  };
}

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-run-state-'));
  fs.writeFileSync(path.join(root, 'requirements.md'), '# Requirement\n');
  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

test('AI run state can be created, read, updated, and rendered', () => {
  const repo = makeRepo();

  try {
    const run = createAiRun(repo.root, {
      input: 'requirements.md',
      runId: 'run-test',
      now: new Date('2026-05-22T00:00:00.000Z'),
    });

    assert.equal(run.run_id, 'run-test');
    assert.equal(run.phase, 'created');
    assert.equal(fs.existsSync(runStatePath(repo.root, 'run-test')), true);
    assert.equal(fs.existsSync(runApprovalsPath(repo.root, 'run-test')), true);
    assert.equal(fs.readFileSync(path.join(repo.root, '.quiver/runs/run-test/requirement.md'), 'utf8'), '# Requirement\n');

    const next = updateAiRunPhase(repo.root, 'run-test', 'acceptance-draft', {
      command: 'ai plan --phase acceptance',
      artifact: '.quiver/approvals/acceptance/draft.md',
      now: new Date('2026-05-22T00:01:00.000Z'),
    });
    assert.equal(next.phase, 'acceptance-draft');
    assert.equal(readAiRun(repo.root, 'run-test').history.length, 2);

    const status = formatAiRunStatus(repo.root, next);
    const resume = formatAiRunResume(repo.root, next);
    assert.match(status, /AI run status/);
    assert.match(status, /Next safe command: npx create-quiver ai approve --phase acceptance --version <n>/);
    assert.match(resume, /Current phase: acceptance-draft/);
  } finally {
    repo.cleanup();
  }
});

test('AI run listing fails closed when a run namespace is a symlink', (t) => {
  const repo = makeRepo();

  try {
    createAiRun(repo.root, {
      input: 'requirements.md',
      runId: 'run-list-target',
    });
    const runsRoot = path.join(repo.root, '.quiver', 'runs');
    try {
      fs.symlinkSync('run-list-target', path.join(runsRoot, 'run-list-alias'), 'dir');
    } catch (error) {
      if (['EACCES', 'EPERM', 'ENOTSUP'].includes(error.code)) {
        t.skip(`symlinks are not supported in this environment: ${error.code}`);
        return;
      }
      throw error;
    }

    assert.throws(
      () => listAiRuns(repo.root),
      (error) => error.code === 'APPROVAL_BINDING_MISMATCH'
        && error.details.run_id === 'run-list-alias'
        && error.details.symlink === '.quiver/runs/run-list-alias',
    );
  } finally {
    repo.cleanup();
  }
});

test('AI run phase guard blocks future-phase commands with next-step guidance', () => {
  const repo = makeRepo();

  try {
    const run = createAiRun(repo.root, {
      input: 'requirements.md',
      runId: 'run-guard',
    });

    assert.throws(
      () => assertAiRunPhaseAllows(run, 'technical-plan-approved', 'spec create'),
      /requires 'technical-plan-approved'.*Next: npx create-quiver ai plan --phase acceptance/s,
    );

    updateAiRunPhase(repo.root, 'run-guard', 'technical-plan-approved', { command: 'test' });
    assert.equal(assertAiRunPhaseAllows(readAiRun(repo.root, 'run-guard'), 'technical-plan-approved', 'spec create'), true);
  } finally {
    repo.cleanup();
  }
});

test('an advanced unbound legacy run stays unverifiable after migration and cannot advance or rebind', () => {
  const repo = makeRepo();
  const runId = 'run-legacy-advanced';

  try {
    createAiRun(repo.root, { input: 'requirements.md', runId });
    updateAiRunPhase(repo.root, runId, 'technical-plan-approved', { command: 'legacy pre-v58 flow' });

    const governance = buildDefaultGovernanceConfig();
    fs.writeFileSync(
      path.join(repo.root, '.quiver', 'config.json'),
      `${JSON.stringify({ governance }, null, 2)}\n`,
    );
    fs.writeFileSync(
      path.join(repo.root, '.quiver', 'state.json'),
      `${JSON.stringify({
        quiver_version: packageJson.version,
        project_name: 'Legacy advanced fixture',
        initialized_version: null,
        migrated_version: packageJson.version,
        last_initialized_at: null,
        last_migration_at: '2026-08-31T00:00:00.000Z',
        last_analysis_at: null,
      }, null, 2)}\n`,
    );

    const before = fs.readFileSync(runStatePath(repo.root, runId));
    const projection = buildAiRunGovernanceProjection(repo.root, readAiRun(repo.root, runId));
    assert.equal(projection.compatibility, 'legacy-unverified');
    assert.equal(projection.code, 'LEGACY_EVIDENCE_UNVERIFIED');
    assert.equal(projection.status, 'active');
    assert.equal(projection.next_command, 'npx create-quiver doctor --json');
    assert.equal(Object.values(projection.counts).every((value) => value === null), true);

    assert.throws(
      () => updateAiRunPhase(repo.root, runId, 'spec-generated', { command: 'spec create' }),
      (error) => error.code === 'LEGACY_EVIDENCE_UNVERIFIED',
    );
    assert.throws(
      () => bindAiRunGovernance(repo.root, runId, {
        requested_profile: 'fast-delivery',
        effective_profile: 'fast-delivery',
        policy_version: governance.policy.version,
        policy_digest: computePolicyDigest(governance),
        requirement_categories: [],
      }),
      (error) => error.code === 'LEGACY_EVIDENCE_UNVERIFIED',
    );
    assert.deepEqual(fs.readFileSync(runStatePath(repo.root, runId)), before);
  } finally {
    repo.cleanup();
  }
});

test('AI run approvals metadata and locks are persisted safely', () => {
  const repo = makeRepo();

  try {
    createAiRun(repo.root, {
      input: 'requirements.md',
      runId: 'run-lock',
    });
    const approvals = recordAiRunApproval(repo.root, 'run-lock', {
      phase: 'acceptance',
      artifact: '.quiver/approvals/acceptance/approved.md',
      version: 1,
      at: '2026-05-22T00:00:00.000Z',
    });
    assert.equal(approvals.approvals.length, 1);

    const acquired = acquireAiRunLock(repo.root, 'run-lock', {
      command: 'ai plan',
      now: new Date('2026-05-22T00:00:00.000Z'),
    });
    assert.equal(fs.existsSync(acquired.filePath), true);
    assert.equal(readAiRunLock(repo.root, 'run-lock').command, 'ai plan');
    assert.throws(
      () => acquireAiRunLock(repo.root, 'run-lock', { command: 'other' }),
      /AI run is locked:.*pid=.*command=ai plan/s,
    );
    releaseAiRunLock(repo.root, 'run-lock');
    assert.equal(readAiRunLock(repo.root, 'run-lock'), null);
  } finally {
    repo.cleanup();
  }
});

test('governed run selection is unambiguous and profile binding cannot downgrade', () => {
  const repo = makeRepo();

  try {
    createAiRun(repo.root, { input: 'requirements.md', runId: 'run-governed-a' });
    assert.equal(resolveGovernedAiRun(repo.root).run_id, 'run-governed-a');

    const high = bindAiRunGovernance(repo.root, 'run-governed-a', {
      requested_profile: 'high-assurance',
      effective_profile: 'high-assurance',
      policy_version: 'v58',
      policy_digest: 'sha256:policy',
      requirement_categories: ['roles', 'auth', 'roles'],
    });
    assert.deepEqual(high.governance.requirement_categories, ['auth', 'roles']);
    assert.equal(readAiRunLock(repo.root, 'run-governed-a'), null);
    assert.throws(
      () => bindAiRunGovernance(repo.root, 'run-governed-a', {
        requested_profile: 'fast-delivery',
        effective_profile: 'fast-delivery',
        policy_version: 'v58',
        policy_digest: 'sha256:policy',
      }),
      /PROFILE_DOWNGRADE_FORBIDDEN/,
    );
    assert.throws(
      () => bindAiRunGovernance(repo.root, 'run-governed-a', {
        requested_profile: 'high-assurance',
        effective_profile: 'high-assurance',
        policy_version: 'v58',
        policy_digest: 'sha256:different-policy',
      }),
      /GOVERNANCE_POLICY_MISMATCH/,
    );

    createAiRun(repo.root, { input: 'requirements.md', runId: 'run-governed-b' });
    assert.throws(() => resolveGovernedAiRun(repo.root), /AI_RUN_REQUIRED/);
    assert.equal(resolveGovernedAiRun(repo.root, 'run-governed-b').run_id, 'run-governed-b');
    updateAiRunPhase(repo.root, 'run-governed-b', 'closed');
    assert.throws(() => resolveGovernedAiRun(repo.root, 'run-governed-b'), /AI_RUN_CLOSED/);
    assert.throws(
      () => bindAiRunGovernance(repo.root, 'run-governed-b', {
        requested_profile: 'fast-delivery',
        effective_profile: 'fast-delivery',
        policy_version: 'v58',
        policy_digest: 'sha256:policy',
      }),
      /AI_RUN_CLOSED/,
    );
  } finally {
    repo.cleanup();
  }
});

test('run governance state is correlated and written inside the run lock', () => {
  const repo = makeRepo();

  try {
    createAiRun(repo.root, { input: 'requirements.md', runId: 'run-review-state' });
    const governanceState = {
      schema_version: 1,
      run_id: 'run-review-state',
      next_finding_number: 1,
      current_review_id: null,
      findings: [],
      reviews: [],
      dispositions: [],
      condition_evaluations: [],
      conditioned_candidates: [],
    };
    const result = withAiRunLock(repo.root, 'run-review-state', { command: 'test governance write' }, () => {
      const filePath = writeRunGovernance(repo.root, 'run-review-state', governanceState);
      assert.equal(readAiRunLock(repo.root, 'run-review-state').command, 'test governance write');
      return filePath;
    });

    assert.equal(result.endsWith('review-governance.json'), true);
    assert.deepEqual(readRunGovernance(repo.root, 'run-review-state'), governanceState);
    assert.equal(readAiRunLock(repo.root, 'run-review-state'), null);
    assert.throws(
      () => writeRunGovernance(repo.root, 'run-review-state', { ...governanceState, run_id: 'other-run' }),
      /belongs to 'other-run'/,
    );
  } finally {
    repo.cleanup();
  }
});

test('run lock remains held until an asynchronous callback settles', async () => {
  const repo = makeRepo();

  try {
    createAiRun(repo.root, { input: 'requirements.md', runId: 'run-async-lock' });
    const result = await withAiRunLock(repo.root, 'run-async-lock', { command: 'async governance write' }, async () => {
      assert.equal(readAiRunLock(repo.root, 'run-async-lock').command, 'async governance write');
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(readAiRunLock(repo.root, 'run-async-lock').command, 'async governance write');
      return 'done';
    });

    assert.equal(result, 'done');
    assert.equal(readAiRunLock(repo.root, 'run-async-lock'), null);
  } finally {
    repo.cleanup();
  }
});

test('run locks normalize aliases and release only the lock instance they own', () => {
  const repo = makeRepo();

  try {
    const first = acquireAiRunLock(repo.root, 'RUN-Alias', { command: 'first owner' });
    assert.equal(first.lock.run_id, 'run-alias');
    assert.throws(
      () => acquireAiRunLock(repo.root, 'run-alias', { command: 'case alias' }),
      /AI run is locked/,
    );

    fs.rmSync(first.filePath);
    const second = acquireAiRunLock(repo.root, 'run-alias', { command: 'second owner' });
    releaseAiRunLock(repo.root, 'RUN-ALIAS', { handle: first });
    assert.equal(readAiRunLock(repo.root, 'run-alias').nonce, second.lock.nonce);
    releaseAiRunLock(repo.root, 'run-alias', { handle: second });
    assert.equal(readAiRunLock(repo.root, 'run-alias'), null);
  } finally {
    repo.cleanup();
  }
});

test('governed phase transitions share the run lock with governance commits', () => {
  const repo = makeRepo();
  const governance = {
    requested_profile: 'fast-delivery',
    effective_profile: 'fast-delivery',
    policy_version: 'v58',
    policy_digest: 'sha256:policy',
    requirement_categories: [],
  };

  try {
    createAiRun(repo.root, {
      input: 'requirements.md',
      runId: 'run-transition-lock',
      governance,
    });
    withAiRunLock(repo.root, 'run-transition-lock', { command: 'governance commit' }, () => {
      assert.throws(
        () => updateAiRunPhase(repo.root, 'run-transition-lock', 'closed', { command: 'ai run close' }),
        /AI run is locked/,
      );
      assert.equal(readAiRun(repo.root, 'run-transition-lock').status, 'active');
    });

    updateAiRunPhase(repo.root, 'run-transition-lock', 'closed', { command: 'ai run close' });
    assert.equal(readAiRun(repo.root, 'run-transition-lock').status, 'closed');
  } finally {
    repo.cleanup();
  }
});

test('digest-bound approval commit rolls back every injected write failure without partial state', async () => {
  const faultPoints = [
    'after-prepare',
    'after-artifact',
    'after-governance',
    'after-run-approval',
    'after-legacy-projection',
    'after-phase',
    'before-wal-cleanup',
  ];

  for (const faultPoint of faultPoints) {
    const repo = makeRepo();
    const runId = `run-fault-${faultPoint}`;
    const governance = {
      requested_profile: 'fast-delivery',
      effective_profile: 'fast-delivery',
      policy_version: 'v58',
      policy_digest: `sha256:${'1'.repeat(64)}`,
      requirement_categories: [],
    };
    try {
      createAiRun(repo.root, {
        input: 'requirements.md',
        runId,
        governance,
        now: new Date('2026-08-01T00:00:00.000Z'),
      });
      updateAiRunPhase(repo.root, runId, 'acceptance-draft', {
        artifact: '.quiver/approvals/acceptance/drafts/001.md',
        command: 'ai plan --phase acceptance',
        now: new Date('2026-08-01T00:01:00.000Z'),
      });
      const tracked = [
        runStatePath(repo.root, runId),
        runApprovalsPath(repo.root, runId),
        runGovernancePath(repo.root, runId),
        runApprovalArtifactPath(repo.root, runId, 'acceptance', 1),
        path.join(repo.root, '.quiver', 'approvals', 'acceptance', 'approved.md'),
        path.join(repo.root, '.quiver', 'approvals', 'acceptance', 'meta.json'),
      ];
      const before = tracked.map(readBytesOrNull);

      await assert.rejects(
        () => commitDigestBoundApproval(repo.root, {
          runId,
          phase: 'acceptance',
          now: new Date('2026-08-01T00:02:00.000Z'),
          prepare: async () => approvalPrepareFixture(repo.root, runId),
          faultInjector(point) {
            if (point === faultPoint) throw new Error(`injected:${point}`);
          },
        }),
        (error) => {
          assert.equal(error.message, `injected:${faultPoint}`);
          assert.equal(error.details.final_decision_published, false);
          assert.equal(error.details.phase_advanced, false);
          return true;
        },
      );

      const after = tracked.map(readBytesOrNull);
      assert.deepEqual(after, before, `rollback mismatch at ${faultPoint}`);
      assert.equal(fs.existsSync(runApprovalCommitPath(repo.root, runId)), false);
      assert.equal(readAiRun(repo.root, runId).phase, 'acceptance-draft');
      assert.equal(readRunGovernance(repo.root, runId), null);
    } finally {
      repo.cleanup();
    }
  }
});

test('approval WAL makes readers fail closed and recovery rolls back idempotently', async () => {
  const repo = makeRepo();
  const runId = 'run-approval-recovery';
  const governance = {
    requested_profile: 'fast-delivery',
    effective_profile: 'fast-delivery',
    policy_version: 'v58',
    policy_digest: `sha256:${'1'.repeat(64)}`,
    requirement_categories: [],
  };
  let capturedWal = null;

  try {
    createAiRun(repo.root, { input: 'requirements.md', runId, governance });
    updateAiRunPhase(repo.root, runId, 'acceptance-draft', {
      artifact: '.quiver/approvals/acceptance/drafts/001.md',
      command: 'ai plan --phase acceptance',
    });
    await assert.rejects(() => commitDigestBoundApproval(repo.root, {
      runId,
      phase: 'acceptance',
      prepare: async () => approvalPrepareFixture(repo.root, runId),
      faultInjector(point) {
        if (point === 'after-prepare') {
          capturedWal = fs.readFileSync(runApprovalCommitPath(repo.root, runId));
          throw new Error('capture prepared WAL');
        }
      },
    }), /capture prepared WAL/);
    fs.writeFileSync(runApprovalCommitPath(repo.root, runId), capturedWal);

    assert.throws(
      () => readAiRun(repo.root, runId),
      (error) => error.code === 'APPROVAL_RECOVERY_REQUIRED',
    );
    assert.throws(
      () => readRunGovernance(repo.root, runId),
      (error) => error.code === 'APPROVAL_RECOVERY_REQUIRED',
    );
    const plannerPaths = [
      path.join(repo.root, '.quiver', 'approvals', 'acceptance', 'draft.md'),
      path.join(repo.root, '.quiver', 'approvals', 'acceptance', 'drafts', '001.md'),
      path.join(repo.root, '.quiver', 'approvals', 'acceptance', 'approved.md'),
      path.join(repo.root, '.quiver', 'approvals', 'acceptance', 'meta.json'),
    ];
    const plannerBefore = plannerPaths.map(readBytesOrNull);
    assert.throws(
      () => savePlannerDraft(repo.root, 'acceptance', 'requirements.md', '# conflicting draft\n'),
      (error) => error.code === 'APPROVAL_RECOVERY_REQUIRED',
    );
    assert.throws(
      () => approvePlannerPhase(repo.root, 'acceptance', '', '', { version: 1 }),
      (error) => error.code === 'APPROVAL_RECOVERY_REQUIRED',
    );
    assert.deepEqual(plannerPaths.map(readBytesOrNull), plannerBefore);
    createAiRun(repo.root, { input: 'requirements.md', runId: 'run-other-commit', governance });
    updateAiRunPhase(repo.root, 'run-other-commit', 'acceptance-draft', {
      artifact: '.quiver/approvals/acceptance/drafts/001.md',
      command: 'test other approval commit',
    });
    await assert.rejects(
      () => commitDigestBoundApproval(repo.root, {
        runId: 'run-other-commit',
        phase: 'acceptance',
        prepare: async () => approvalPrepareFixture(repo.root, 'run-other-commit'),
      }),
      (error) => error.code === 'APPROVAL_RECOVERY_REQUIRED',
    );
    assert.equal(readAiRun(repo.root, 'run-other-commit').phase, 'acceptance-draft');
    assert.equal(readRunGovernance(repo.root, 'run-other-commit'), null);
    assert.equal(fs.existsSync(runApprovalCommitPath(repo.root, 'run-other-commit')), false);
    assert.deepEqual(recoverDigestBoundApprovalCommit(repo.root, { runId }), {
      recovered: true,
      runId,
      decisionId: 'A-001',
    });
    assert.equal(readAiRun(repo.root, runId).phase, 'acceptance-draft');
    assert.equal(fs.existsSync(runApprovalCommitPath(repo.root, runId)), false);
    assert.deepEqual(recoverDigestBoundApprovalCommit(repo.root, { runId }), {
      recovered: false,
      runId,
    });
  } finally {
    repo.cleanup();
  }
});

test('canonical run readers reject copied or foreign run identities', () => {
  const repo = makeRepo();

  try {
    createAiRun(repo.root, { input: 'requirements.md', runId: 'run-identity-a' });
    createAiRun(repo.root, { input: 'requirements.md', runId: 'run-identity-b' });
    fs.copyFileSync(
      runStatePath(repo.root, 'run-identity-b'),
      runStatePath(repo.root, 'run-identity-a'),
    );
    assert.throws(
      () => readAiRun(repo.root, 'run-identity-a'),
      (error) => error.code === 'APPROVAL_BINDING_MISMATCH',
    );

    const foreignGovernance = {
      schema_version: 1,
      run_id: 'run-identity-b',
      next_finding_number: 1,
      current_review_id: null,
      reviews: [],
      findings: [],
      dispositions: [],
      condition_evaluations: [],
      conditioned_candidates: [],
      decisions: [],
    };
    fs.writeFileSync(
      runGovernancePath(repo.root, 'run-identity-a'),
      `${JSON.stringify(foreignGovernance, null, 2)}\n`,
    );
    assert.throws(
      () => readRunGovernance(repo.root, 'run-identity-a'),
      (error) => error.code === 'APPROVAL_BINDING_MISMATCH',
    );
  } finally {
    repo.cleanup();
  }
});

test('approval recovery rejects a validly rehashed WAL with a non-canonical target', async () => {
  const repo = makeRepo();
  const runId = 'run-wal-target-allowlist';
  const governance = {
    requested_profile: 'fast-delivery',
    effective_profile: 'fast-delivery',
    policy_version: 'v58',
    policy_digest: `sha256:${'1'.repeat(64)}`,
    requirement_categories: [],
  };
  let capturedWal;

  try {
    createAiRun(repo.root, { input: 'requirements.md', runId, governance });
    updateAiRunPhase(repo.root, runId, 'acceptance-draft', {
      artifact: '.quiver/approvals/acceptance/drafts/001.md',
      command: 'test prepared target allowlist',
    });
    await assert.rejects(() => commitDigestBoundApproval(repo.root, {
      runId,
      phase: 'acceptance',
      prepare: async () => approvalPrepareFixture(repo.root, runId),
      faultInjector(point) {
        if (point === 'after-prepare') {
          capturedWal = JSON.parse(fs.readFileSync(runApprovalCommitPath(repo.root, runId), 'utf8'));
          throw new Error('capture prepared WAL');
        }
      },
    }), /capture prepared WAL/);

    const configPath = path.join(repo.root, '.quiver', 'config.json');
    fs.writeFileSync(configPath, '{"safe":true}\n');
    capturedWal.targets[0].path = '.quiver/config.json';
    refreshApprovalMarkerDigest(capturedWal);
    fs.writeFileSync(
      runApprovalCommitPath(repo.root, runId),
      `${JSON.stringify(capturedWal, null, 2)}\n`,
    );

    assert.throws(
      () => recoverDigestBoundApprovalCommit(repo.root, { runId }),
      (error) => error.code === 'APPROVAL_RECOVERY_REQUIRED',
    );
    assert.equal(fs.readFileSync(configPath, 'utf8'), '{"safe":true}\n');
    assert.equal(JSON.parse(fs.readFileSync(runStatePath(repo.root, runId), 'utf8')).phase, 'acceptance-draft');
  } finally {
    repo.cleanup();
  }
});

test('normal approval commit validates its exact target allowlist before writing the WAL', async () => {
  const repo = makeRepo();
  const runId = 'run-normal-target-allowlist';
  const governance = {
    requested_profile: 'fast-delivery',
    effective_profile: 'fast-delivery',
    policy_version: 'v58',
    policy_digest: `sha256:${'1'.repeat(64)}`,
    requirement_categories: [],
  };

  try {
    createAiRun(repo.root, { input: 'requirements.md', runId, governance });
    updateAiRunPhase(repo.root, runId, 'acceptance-draft', {
      artifact: '.quiver/approvals/acceptance/drafts/001.md',
      command: 'test normal target allowlist',
    });
    const configPath = path.join(repo.root, '.quiver', 'config.json');
    fs.writeFileSync(configPath, '{"safe":true}\n');
    const prepared = approvalPrepareFixture(repo.root, runId);
    prepared.legacyProjection.targets[0] = {
      path: configPath,
      contents: Buffer.from('{"owned":true}\n', 'utf8'),
    };

    await assert.rejects(
      () => commitDigestBoundApproval(repo.root, {
        runId,
        phase: 'acceptance',
        prepare: async () => prepared,
      }),
      (error) => error.code === 'APPROVAL_RECOVERY_REQUIRED',
    );
    assert.equal(fs.readFileSync(configPath, 'utf8'), '{"safe":true}\n');
    assert.equal(fs.existsSync(runApprovalCommitPath(repo.root, runId)), false);
    assert.equal(fs.existsSync(runApprovalArtifactPath(repo.root, runId, 'acceptance', 1)), false);
    assert.equal(readAiRun(repo.root, runId).phase, 'acceptance-draft');
    assert.equal(readRunGovernance(repo.root, runId), null);
  } finally {
    repo.cleanup();
  }
});

test('digest-bound approval commit rejects an in-project symlinked run target', async (t) => {
  const repo = makeRepo();
  const runId = 'run-symlink-source';
  const targetRunId = 'run-symlink-target';
  const governance = {
    requested_profile: 'fast-delivery',
    effective_profile: 'fast-delivery',
    policy_version: 'v58',
    policy_digest: `sha256:${'1'.repeat(64)}`,
    requirement_categories: [],
  };

  try {
    createAiRun(repo.root, { input: 'requirements.md', runId, governance });
    createAiRun(repo.root, { input: 'requirements.md', runId: targetRunId, governance });
    updateAiRunPhase(repo.root, runId, 'acceptance-draft', {
      artifact: '.quiver/approvals/acceptance/drafts/001.md',
      command: 'test symlink target rejection',
    });
    const targetApprovals = path.join(repo.root, '.quiver', 'runs', targetRunId, 'approvals');
    fs.mkdirSync(targetApprovals, { recursive: true });
    try {
      fs.symlinkSync(`../${targetRunId}/approvals`, path.join(repo.root, '.quiver', 'runs', runId, 'approvals'), 'dir');
    } catch (error) {
      if (['EACCES', 'EPERM', 'ENOTSUP'].includes(error.code)) {
        t.skip(`symlinks are not supported in this environment: ${error.code}`);
        return;
      }
      throw error;
    }

    await assert.rejects(
      () => commitDigestBoundApproval(repo.root, {
        runId,
        phase: 'acceptance',
        prepare: async () => approvalPrepareFixture(repo.root, runId),
      }),
      (error) => error.code === 'APPROVAL_RECOVERY_REQUIRED',
    );
    assert.deepEqual(fs.readdirSync(targetApprovals), []);
    assert.equal(fs.existsSync(runApprovalCommitPath(repo.root, runId)), false);
    assert.equal(readAiRun(repo.root, runId).phase, 'acceptance-draft');
  } finally {
    repo.cleanup();
  }
});

test('digest-bound approval commit refuses to copy sensitive legacy snapshots into its WAL', async () => {
  const repo = makeRepo();
  const runId = 'run-sensitive-legacy-snapshot';
  const governance = {
    requested_profile: 'fast-delivery',
    effective_profile: 'fast-delivery',
    policy_version: 'v58',
    policy_digest: `sha256:${'1'.repeat(64)}`,
    requirement_categories: [],
  };
  const legacyPath = path.join(repo.root, '.quiver', 'approvals', 'acceptance', 'approved.md');
  const legacyBytes = Buffer.from(`token=legacy-${'s'.repeat(24)}\n`, 'utf8');

  try {
    createAiRun(repo.root, { input: 'requirements.md', runId, governance });
    updateAiRunPhase(repo.root, runId, 'acceptance-draft', {
      artifact: '.quiver/approvals/acceptance/drafts/001.md',
      command: 'test sensitive legacy snapshot',
    });
    fs.mkdirSync(path.dirname(legacyPath), { recursive: true });
    fs.writeFileSync(legacyPath, legacyBytes);

    await assert.rejects(
      () => commitDigestBoundApproval(repo.root, {
        runId,
        phase: 'acceptance',
        prepare: async () => approvalPrepareFixture(repo.root, runId),
      }),
      (error) => error.code === 'APPROVAL_BINDING_MISMATCH'
        && error.details.mismatches.includes('legacy-approved_before_sensitive_content'),
    );
    assert.deepEqual(fs.readFileSync(legacyPath), legacyBytes);
    assert.equal(fs.existsSync(runApprovalCommitPath(repo.root, runId)), false);
    assert.equal(readAiRun(repo.root, runId).phase, 'acceptance-draft');
  } finally {
    repo.cleanup();
  }
});

test('digest-bound WAL accepts schema-valid legacy authorization evidence without exempting its leaf values', async () => {
  const repo = makeRepo();
  const runId = 'run-legacy-authorization';
  const governance = {
    requested_profile: 'fast-delivery',
    effective_profile: 'fast-delivery',
    policy_version: 'v58',
    policy_digest: `sha256:${'1'.repeat(64)}`,
    requirement_categories: [],
  };

  try {
    createAiRun(repo.root, { input: 'requirements.md', runId, governance });
    const prepared = approvalPrepareFixture(repo.root, runId);
    recordAiRunApproval(repo.root, runId, {
      phase: 'acceptance',
      artifact: '.quiver/approvals/acceptance/approved.md',
      version: 1,
      governance: {
        requested_profile: 'fast-delivery',
        effective_profile: 'fast-delivery',
        policy_version: 'v58',
        policy_digest: governance.policy_digest,
        actor: {
          actor_id: 'local:approver',
          provider: 'local',
          provider_subject: null,
          verified: false,
        },
        authorization: prepared.bindings.authorization,
      },
    });
    updateAiRunPhase(repo.root, runId, 'acceptance-draft', {
      artifact: '.quiver/approvals/acceptance/drafts/001.md',
      command: 'test legacy authorization compatibility',
    });

    const result = await commitDigestBoundApproval(repo.root, {
      runId,
      phase: 'acceptance',
      prepare: async () => prepared,
    });
    assert.equal(result.decision.decision_id, 'A-001');
    assert.equal(readAiRun(repo.root, runId).phase, 'acceptance-approved');
    assert.equal(fs.existsSync(runApprovalCommitPath(repo.root, runId)), false);
  } finally {
    repo.cleanup();
  }
});
