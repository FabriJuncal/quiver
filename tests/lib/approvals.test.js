const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  approvePlannerPhase,
  approvalApprovedPath,
  approvalDraftVersionPath,
  approvalDraftPath,
  buildPlannerApprovalCandidates,
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
    assert.equal(draft.version, 1);
    assert.equal(fs.existsSync(approvalDraftVersionPath(repo.root, 'acceptance', 1)), true);

    const draftState = readPhaseApproval(repo.root, 'acceptance');
    assert.equal(draftState.status, 'draft');
    assert.equal(draftState.draft.path, '.quiver/approvals/acceptance/draft.md');
    assert.equal(draftState.meta.draft.version, 1);
    assert.equal(draftState.meta.drafts.length, 1);
    assert.match(summarizePlannerApproval(repo.root, 'acceptance'), /Status: draft/);

    const approved = approvePlannerPhase(repo.root, 'acceptance', '', '', { version: 1 });
    assert.equal(fs.existsSync(approved.filePath), true);
    assert.equal(approved.version, 1);
    assert.equal(approvalApprovedPath(repo.root, 'acceptance'), approved.filePath);

    const approvedState = readPhaseApproval(repo.root, 'acceptance');
    assert.equal(approvedState.status, 'approved');
    assert.equal(approvedState.meta.approved.phase, 'acceptance');
    assert.equal(approvedState.meta.approved.source_file, '.quiver/approvals/acceptance/drafts/001.md');
    assert.equal(approvedState.meta.approved.version, 1);
    assert.equal(typeof approvedState.meta.approved.approved_at, 'string');
  } finally {
    repo.cleanup();
  }
});

test('planner approvals keep multiple drafts and only approve the current version', () => {
  const repo = makeRepo();

  try {
    writeFile(path.join(repo.root, 'requirements.md'), '# Requirements\n');

    const first = savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'draft v1\n');
    const second = savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'draft v2\n');

    assert.equal(first.version, 1);
    assert.equal(second.version, 2);

    assert.throws(
      () => approvePlannerPhase(repo.root, 'acceptance', '', '', { version: 1 }),
      /draft version 1 is not current; latest draft version is 2/,
    );

    const approved = approvePlannerPhase(repo.root, 'acceptance', '', '', { version: 2 });
    const state = readPhaseApproval(repo.root, 'acceptance');

    assert.equal(approved.version, 2);
    assert.equal(state.status, 'approved');
    assert.equal(state.approved.contents, 'draft v2\n');
    assert.equal(state.meta.drafts.length, 2);
    assert.match(summarizePlannerApproval(repo.root, 'acceptance'), /- v1: \.quiver\/approvals\/acceptance\/drafts\/001\.md/);
    assert.match(summarizePlannerApproval(repo.root, 'acceptance'), /- v2: \.quiver\/approvals\/acceptance\/drafts\/002\.md/);
    assert.match(summarizePlannerApproval(repo.root, 'acceptance'), /Approved v2/);
  } finally {
    repo.cleanup();
  }
});

test('planner approval candidates expose current draft, history, and safe previews', () => {
  const repo = makeRepo();

  try {
    writeFile(path.join(repo.root, 'requirements.md'), '# Requirements\n');

    savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'draft v1\n');
    savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'draft v2 token=secret-value\n');

    const result = buildPlannerApprovalCandidates(repo.root, 'acceptance');

    assert.equal(result.phase, 'acceptance');
    assert.equal(result.approval_status, 'draft');
    assert.equal(result.latest_version, 2);
    assert.equal(result.candidates.length, 2);
    assert.equal(result.current.version, 2);
    assert.equal(result.recommended.version, 2);
    assert.equal(result.candidates[0].recommended, false);
    assert.equal(result.candidates[0].status, 'history');
    assert.equal(result.candidates[1].approvable, true);
    assert.match(result.candidates[1].next_command, /ai approve --phase acceptance --version 2/);
    assert.equal(result.candidates[1].preview.includes('secret-value'), false);
    assert.match(result.candidates[1].preview, /token=\[REDACTED\]/);
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

    savePlannerDraft(repo.root, 'acceptance', 'acceptance.md', 'approved acceptance\n');
    approvePlannerPhase(repo.root, 'acceptance', '', '', { version: 1 });
    await new Promise((resolve) => setTimeout(resolve, 15));
    savePlannerDraft(repo.root, 'acceptance', 'acceptance.md', 'newer draft\n');

    assert.equal(readPhaseApproval(repo.root, 'acceptance').status, 'stale');
    assert.throws(
      () => resolveApprovedPlannerInput(repo.root, 'technical-plan'),
      (error) => error.message.includes('current status: stale'),
    );

    writeFile(path.join(repo.root, 'technical-plan.md'), '# Technical plan\n- Approved.');
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', 'approved technical plan\n');
    approvePlannerPhase(repo.root, 'technical-plan', '', '', { version: 1 });
    const resolved = resolveApprovedPlannerInput(repo.root, 'spec');
    assert.equal(resolved.inputPath, '.quiver/approvals/technical-plan/approved.md');
  } finally {
    repo.cleanup();
  }
});
