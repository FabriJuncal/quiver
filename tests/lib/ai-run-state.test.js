const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  acquireAiRunLock,
  assertAiRunPhaseAllows,
  createAiRun,
  formatAiRunResume,
  formatAiRunStatus,
  readAiRun,
  readAiRunLock,
  recordAiRunApproval,
  releaseAiRunLock,
  runApprovalsPath,
  runStatePath,
  updateAiRunPhase,
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
