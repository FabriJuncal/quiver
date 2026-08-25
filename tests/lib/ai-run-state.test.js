const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  acquireAiRunLock,
  assertAiRunPhaseAllows,
  bindAiRunGovernance,
  createAiRun,
  formatAiRunResume,
  formatAiRunStatus,
  readAiRun,
  readAiRunLock,
  readRunGovernance,
  recordAiRunApproval,
  releaseAiRunLock,
  resolveGovernedAiRun,
  runApprovalsPath,
  runStatePath,
  updateAiRunPhase,
  withAiRunLock,
  writeRunGovernance,
} = require('../../src/create-quiver/lib/ai/run-state');

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
