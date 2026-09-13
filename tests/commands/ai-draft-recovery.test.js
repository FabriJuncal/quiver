const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  approvalApprovedPath,
  approvalDraftPath,
  comparePlannerDraftVersions,
  preparePlannerApprovalProjection,
  readPhaseApproval,
  rejectPlannerDraftVersion,
  resolveApprovedPlannerInput,
  restorePlannerDraftVersion,
  savePlannerDraft,
  selectPlannerDraftVersion,
} = require('../../src/create-quiver/lib/approvals');
const {
  createAiRun,
  updateAiRunPhase,
} = require('../../src/create-quiver/lib/ai/run-state');

const AUTHORIZATION = Object.freeze({
  authorized: true,
  evidence: { actor_id: 'github:github.com:42' },
});

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-draft-recovery-'));
  return {
    root,
    write(relative, contents) {
      const target = path.join(root, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, contents);
      return target;
    },
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

test('compare, select, reject, and restore preserve immutable history and gate every legacy approval consumer', () => {
  const repo = makeRepo();
  try {
    repo.write('requirements.md', '# Requirements\n');
    savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'AC-01 v1\n');
    savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'AC-01 v2\nAC-02 added\n');

    const comparison = comparePlannerDraftVersions(repo.root, 'acceptance', 1, 2);
    assert.equal(comparison.same_input, true);
    assert.equal(comparison.comparison.status, 'preserved');
    assert.deepEqual(comparison.comparison.added_ids, ['acceptance_criteria:AC-02']);

    selectPlannerDraftVersion(repo.root, 'acceptance', 1, { authorization: AUTHORIZATION });
    assert.equal(readPhaseApproval(repo.root, 'acceptance').meta.selected_version, 1);
    const approved = preparePlannerApprovalProjection(repo.root, 'acceptance', 1, { requireDigestBindings: true });
    for (const target of approved.targets) fs.writeFileSync(target.path, target.contents);
    const approvedBytes = fs.readFileSync(approvalApprovedPath(repo.root, 'acceptance'));

    rejectPlannerDraftVersion(repo.root, 'acceptance', 1, { authorization: AUTHORIZATION });
    const rejected = readPhaseApproval(repo.root, 'acceptance');
    assert.equal(rejected.status, 'rejected');
    assert.equal(rejected.meta.selected_version, 1);
    assert.deepEqual(fs.readFileSync(approvalApprovedPath(repo.root, 'acceptance')), approvedBytes);
    assert.throws(
      () => preparePlannerApprovalProjection(repo.root, 'acceptance', 1, { requireDigestBindings: true }),
      /requires explicit valid restore/,
    );
    assert.throws(
      () => resolveApprovedPlannerInput(repo.root, 'technical-plan'),
      /current status: rejected/,
    );

    restorePlannerDraftVersion(repo.root, 'acceptance', 1, { authorization: AUTHORIZATION });
    const restored = readPhaseApproval(repo.root, 'acceptance');
    assert.equal(restored.status, 'approved');
    assert.equal(restored.meta.drafts.length, 2);
    assert.equal(restored.meta.drafts[0].lifecycle.at(-1).state, 'current');
    assert.equal(fs.readFileSync(approvalDraftPath(repo.root, 'acceptance'), 'utf8'), 'AC-01 v1\n');
    assert.equal(resolveApprovedPlannerInput(repo.root, 'technical-plan').inputPath,
      '.quiver/approvals/acceptance/approved.md');
  } finally {
    repo.cleanup();
  }
});

test('run-owned selection rejects a foreign run canonical input without any projection write', () => {
  const repo = makeRepo();
  try {
    repo.write('requirements-a.md', '# Requirements A\n');
    repo.write('requirements-b.md', '# Requirements B\n');
    const runA = createAiRun(repo.root, { input: 'requirements-a.md', runId: 'run-a' });
    const runB = createAiRun(repo.root, { input: 'requirements-b.md', runId: 'run-b' });
    const first = savePlannerDraft(repo.root, 'acceptance', 'requirements-a.md', 'AC-01 v1\n', { runId: runA.run_id });
    updateAiRunPhase(repo.root, runA.run_id, 'acceptance-draft', { artifact: first.versionPath });
    updateAiRunPhase(repo.root, runB.run_id, 'acceptance-draft', { artifact: first.versionPath });
    savePlannerDraft(repo.root, 'acceptance', 'requirements-a.md', 'AC-01 v2\n', { runId: runA.run_id });
    const beforeMeta = fs.readFileSync(path.join(repo.root, '.quiver/approvals/acceptance/meta.json'));
    const beforeDraft = fs.readFileSync(approvalDraftPath(repo.root, 'acceptance'));

    assert.throws(
      () => selectPlannerDraftVersion(repo.root, 'acceptance', 1, {
        authorization: AUTHORIZATION,
        runId: runB.run_id,
      }),
      (error) => error.code === 'APPROVAL_BINDING_MISMATCH'
        && /different run|canonical requirement/.test(error.message),
    );
    assert.deepEqual(fs.readFileSync(path.join(repo.root, '.quiver/approvals/acceptance/meta.json')), beforeMeta);
    assert.deepEqual(fs.readFileSync(approvalDraftPath(repo.root, 'acceptance')), beforeDraft);
  } finally {
    repo.cleanup();
  }
});

test('run-owned acceptance selection requires canonical input path identity, not equal bytes', () => {
  const repo = makeRepo();
  try {
    repo.write('requirements.md', '# Requirements\n');
    repo.write('alias.md', '# Requirements\n');
    const run = createAiRun(repo.root, { input: 'requirements.md', runId: 'run-canonical' });
    const first = savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'AC-01 v1\n', { runId: run.run_id });
    updateAiRunPhase(repo.root, run.run_id, 'acceptance-draft', { artifact: first.versionPath });
    const second = savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'AC-01 v2\n', { runId: run.run_id });
    updateAiRunPhase(repo.root, run.run_id, 'acceptance-draft', { artifact: second.versionPath });
    const metaPath = path.join(repo.root, '.quiver/approvals/acceptance/meta.json');
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    assert.equal(meta.drafts[0].input_path, '.quiver/runs/run-canonical/requirement.md');
    meta.drafts[0].input_path = 'alias.md';
    fs.writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
    const beforeMeta = fs.readFileSync(metaPath);
    const beforeDraft = fs.readFileSync(approvalDraftPath(repo.root, 'acceptance'));

    assert.throws(
      () => selectPlannerDraftVersion(repo.root, 'acceptance', 1, {
        authorization: AUTHORIZATION,
        runId: run.run_id,
      }),
      (error) => error.code === 'APPROVAL_BINDING_MISMATCH'
        && error.details?.mismatch === 'input_path',
    );
    assert.deepEqual(fs.readFileSync(metaPath), beforeMeta);
    assert.deepEqual(fs.readFileSync(approvalDraftPath(repo.root, 'acceptance')), beforeDraft);
  } finally {
    repo.cleanup();
  }
});

test('digest-bound save never infers a latest run from equal requirement bytes', () => {
  const repo = makeRepo();
  try {
    repo.write('a.md', '# Same requirement\n');
    repo.write('b.md', '# Same requirement\n');
    createAiRun(repo.root, { input: 'a.md', runId: 'run-a' });
    createAiRun(repo.root, { input: 'b.md', runId: 'run-b' });

    assert.throws(
      () => savePlannerDraft(repo.root, 'acceptance', 'a.md', 'AC-01\n', {
        requireDigestBindings: true,
      }),
      (error) => error.code === 'APPROVAL_BINDING_MISMATCH'
        && error.details?.mismatch === 'run_id',
    );
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver/approvals/acceptance/meta.json')), false);

    const saved = savePlannerDraft(repo.root, 'acceptance', 'a.md', 'AC-01\n', {
      requireDigestBindings: true,
      runId: 'run-a',
    });
    assert.equal(saved.version, 1);
    assert.equal(readPhaseApproval(repo.root, 'acceptance').meta.drafts[0].input_path,
      '.quiver/runs/run-a/requirement.md');
  } finally {
    repo.cleanup();
  }
});

test('restore recovers the valid predecessor of a corrupted last candidate without erasing either version', () => {
  const repo = makeRepo();
  try {
    repo.write('requirements.md', '# Requirements\n');
    savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'AC-01 keep\nAC-02 keep\n');
    const corrupted = savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'AC-01 keep\n');
    assert.equal(corrupted.integrity.status, 'corrupted');

    restorePlannerDraftVersion(repo.root, 'acceptance', 1, { authorization: AUTHORIZATION });
    const state = readPhaseApproval(repo.root, 'acceptance');
    assert.equal(state.meta.selected_version, 1);
    assert.equal(state.meta.drafts.length, 2);
    assert.equal(state.meta.drafts[1].lifecycle_state, 'corrupted');
    assert.equal(fs.readFileSync(state.meta.drafts[1].path.startsWith('/')
      ? state.meta.drafts[1].path
      : path.join(repo.root, state.meta.drafts[1].path), 'utf8'), 'AC-01 keep\n');
  } finally {
    repo.cleanup();
  }
});

test('unsupported acknowledgement can select bytes but remains unverified and unapprovable', () => {
  const repo = makeRepo();
  try {
    repo.write('requirements.md', '# Requirements\n');
    savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'plain prose only\n');
    selectPlannerDraftVersion(repo.root, 'acceptance', 1, {
      acknowledgeUnverified: true,
      authorization: AUTHORIZATION,
      reason: 'Human needs to inspect the legacy prose.',
    });
    const state = readPhaseApproval(repo.root, 'acceptance');
    assert.equal(state.status, 'unverified');
    assert.equal(state.meta.drafts[0].acknowledgement.verification, 'unverified');
    assert.throws(
      () => preparePlannerApprovalProjection(repo.root, 'acceptance', 1, { requireDigestBindings: true }),
      /integrity is unsupported|remains unverified/,
    );
  } finally {
    repo.cleanup();
  }
});
