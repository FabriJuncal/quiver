const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  approvePlannerPhase,
  approvalApprovedPath,
  approvalDraftPath,
  readPhaseApproval,
  resolveApprovedPlannerInput,
  savePlannerDraft,
  summarizePlannerApproval,
} = require('../../src/create-quiver/lib/approvals');

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-approvals-'));
  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

test('planner approvals persist draft and approved metadata with status summaries', () => {
  const repo = makeRepo();

  try {
    writeFile(path.join(repo.root, 'acceptance.md'), '# Acceptance\n- Approve this.');

    const draft = savePlannerDraft(repo.root, 'acceptance', 'acceptance.md', 'draft text\n');
    assert.equal(fs.existsSync(draft.filePath), true);

    const draftState = readPhaseApproval(repo.root, 'acceptance');
    assert.equal(draftState.status, 'draft');
    assert.equal(draftState.draft.path, '.quiver/approvals/acceptance/draft.md');
    assert.match(summarizePlannerApproval(repo.root, 'acceptance'), /Status: draft/);

    const approved = approvePlannerPhase(repo.root, 'acceptance', 'acceptance.md', 'approved text\n');
    assert.equal(fs.existsSync(approved.filePath), true);
    assert.equal(approvalApprovedPath(repo.root, 'acceptance'), approved.filePath);

    const approvedState = readPhaseApproval(repo.root, 'acceptance');
    assert.equal(approvedState.status, 'approved');
    assert.equal(approvedState.meta.approved.phase, 'acceptance');
    assert.equal(approvedState.meta.approved.source_file, 'acceptance.md');
    assert.equal(typeof approvedState.meta.approved.approved_at, 'string');
  } finally {
    repo.cleanup();
  }
});

test('planner approvals block unapproved or stale inputs before later phases', async () => {
  const repo = makeRepo();

  try {
    writeFile(path.join(repo.root, 'acceptance.md'), '# Acceptance\n- Approved.');
    assert.throws(
      () => resolveApprovedPlannerInput(repo.root, 'technical-plan'),
      (error) => error.message.includes('requires approved acceptance input') && error.message.includes('current status: missing'),
    );

    approvePlannerPhase(repo.root, 'acceptance', 'acceptance.md', 'approved acceptance\n');
    await new Promise((resolve) => setTimeout(resolve, 15));
    savePlannerDraft(repo.root, 'acceptance', 'acceptance.md', 'newer draft\n');

    assert.equal(readPhaseApproval(repo.root, 'acceptance').status, 'stale');
    assert.throws(
      () => resolveApprovedPlannerInput(repo.root, 'technical-plan'),
      (error) => error.message.includes('current status: stale'),
    );

    writeFile(path.join(repo.root, 'technical-plan.md'), '# Technical plan\n- Approved.');
    approvePlannerPhase(repo.root, 'technical-plan', 'technical-plan.md', 'approved technical plan\n');
    const resolved = resolveApprovedPlannerInput(repo.root, 'spec');
    assert.equal(resolved.inputPath, '.quiver/approvals/technical-plan/approved.md');
  } finally {
    repo.cleanup();
  }
});
