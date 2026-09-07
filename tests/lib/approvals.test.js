const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  approvePlannerPhase,
  approvalApprovedPath,
  approvalDraftVersionPath,
  approvalDraftPath,
  approvalMetaPath,
  buildPlannerApprovalCandidates,
  preparePlannerApprovalProjection,
  plannerApprovalLockName,
  readPhaseApproval,
  readProjectFileBytes,
  recoverDraftIntegrityCommit,
  resolveApprovedPlannerInput,
  savePlannerDraft,
  summarizePlannerApproval,
} = require('../../src/create-quiver/lib/approvals');
const { journalPath } = require('../../src/create-quiver/lib/ai/draft-integrity');
const { buildDefaultGovernanceConfig } = require('../../src/create-quiver/lib/ai/review-governance');
const { acquireLock, releaseLock } = require('../../src/create-quiver/lib/locks');
const packageJson = require('../../package.json');

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function sha256Bytes(contents) {
  return `sha256:${crypto.createHash('sha256').update(contents).digest('hex')}`;
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

    const draft = savePlannerDraft(repo.root, 'acceptance', 'acceptance.md', 'AC-01 draft text\n');
    assert.equal(fs.existsSync(draft.filePath), true);
    assert.equal(draft.version, 1);
    assert.equal(fs.existsSync(approvalDraftVersionPath(repo.root, 'acceptance', 1)), true);

    const draftState = readPhaseApproval(repo.root, 'acceptance');
    assert.equal(draftState.status, 'draft');
    assert.equal(draftState.draft.path, '.quiver/approvals/acceptance/draft.md');
    assert.equal(draftState.meta.draft.version, 1);
    assert.equal(draftState.meta.selected_version, 1);
    assert.equal(draftState.meta.draft_integrity_version, 1);
    assert.equal(draftState.meta.drafts[0].integrity.status, 'preserved');
    assert.equal(draftState.meta.drafts[0].lifecycle_state, 'current');
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

    const first = savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'AC-01 draft v1\n');
    const second = savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'AC-01 draft v2\n');

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
    assert.equal(state.approved.contents, 'AC-01 draft v2\n');
    assert.equal(state.meta.drafts.length, 2);
    assert.match(summarizePlannerApproval(repo.root, 'acceptance'), /- v1: \.quiver\/approvals\/acceptance\/drafts\/001\.md/);
    assert.match(summarizePlannerApproval(repo.root, 'acceptance'), /- v2: \.quiver\/approvals\/acceptance\/drafts\/002\.md/);
    assert.match(summarizePlannerApproval(repo.root, 'acceptance'), /Approved v2/);
  } finally {
    repo.cleanup();
  }
});

test('legacy planner approval writer rejects approved-with-conditions without creating approved.md', () => {
  const repo = makeRepo();

  try {
    writeFile(path.join(repo.root, 'technical-plan.md'), '# Technical plan\n');
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', '# Technical plan\n\nslice-01-plan\n');

    assert.throws(
      () => approvePlannerPhase(repo.root, 'technical-plan', '', '', {
        decision: 'approved-with-conditions',
        version: 1,
      }),
      /canonical run governance store.*cannot create legacy approved\.md/,
    );
    assert.equal(fs.existsSync(approvalApprovedPath(repo.root, 'technical-plan')), false);
    assert.equal(readPhaseApproval(repo.root, 'technical-plan').status, 'draft');
  } finally {
    repo.cleanup();
  }
});

test('planner approval candidates expose current draft, history, and safe previews', () => {
  const repo = makeRepo();

  try {
    writeFile(path.join(repo.root, 'requirements.md'), '# Requirements\n');

    savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'AC-01 draft v1\n');
    savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'AC-01 draft v2 token=secret-value\n');

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

    savePlannerDraft(repo.root, 'acceptance', 'acceptance.md', 'AC-01 approved acceptance\n');
    approvePlannerPhase(repo.root, 'acceptance', '', '', { version: 1 });
    await new Promise((resolve) => setTimeout(resolve, 15));
    savePlannerDraft(repo.root, 'acceptance', 'acceptance.md', 'AC-01 newer draft\n');

    assert.equal(readPhaseApproval(repo.root, 'acceptance').status, 'stale');
    assert.throws(
      () => resolveApprovedPlannerInput(repo.root, 'technical-plan'),
      (error) => error.message.includes('current status: stale'),
    );

    writeFile(path.join(repo.root, 'technical-plan.md'), '# Technical plan\n- Approved.');
    savePlannerDraft(repo.root, 'technical-plan', 'technical-plan.md', 'slice-01-plan approved technical plan\n');
    approvePlannerPhase(repo.root, 'technical-plan', '', '', { version: 1 });
    const resolved = resolveApprovedPlannerInput(repo.root, 'spec');
    assert.equal(resolved.inputPath, '.quiver/approvals/technical-plan/approved.md');
  } finally {
    repo.cleanup();
  }
});

test('planner drafts persist exact artifact and input byte digests', () => {
  const repo = makeRepo();

  try {
    const inputBytes = Buffer.from('\uFEFF# Requerimiento\r\n- café y emoji 🧭\r\n', 'utf8');
    const artifactContents = '# Acceptance\r\n- AC-01 preserves exact bytes 🧭\nfinal line';
    const artifactBytes = Buffer.from(artifactContents, 'utf8');
    writeFile(path.join(repo.root, 'requirements.md'), inputBytes);

    const saved = savePlannerDraft(
      repo.root,
      'acceptance',
      'requirements.md',
      artifactContents,
      { requireDigestBindings: true },
    );
    const state = readPhaseApproval(repo.root, 'acceptance');
    const versionRecord = state.meta.drafts[0];

    assert.deepEqual(fs.readFileSync(saved.filePath), artifactBytes);
    assert.deepEqual(fs.readFileSync(approvalDraftVersionPath(repo.root, 'acceptance', 1)), artifactBytes);
    assert.equal(versionRecord.artifact_sha256, sha256Bytes(artifactBytes));
    assert.equal(state.meta.draft.artifact_sha256, sha256Bytes(artifactBytes));
    assert.equal(versionRecord.input_path, 'requirements.md');
    assert.equal(versionRecord.input_sha256, sha256Bytes(inputBytes));
    assert.equal(state.meta.draft.input_sha256, sha256Bytes(inputBytes));
  } finally {
    repo.cleanup();
  }
});

test('digest-bound projection rejects artifact and input tampering without approving', () => {
  const repo = makeRepo();

  try {
    const inputPath = path.join(repo.root, 'requirements.md');
    const inputContents = '# Requirements\n- Original input.\n';
    const artifactContents = '# Acceptance\n- AC-01 Original draft.\n';
    writeFile(inputPath, inputContents);
    savePlannerDraft(
      repo.root,
      'acceptance',
      'requirements.md',
      artifactContents,
      { requireDigestBindings: true },
    );

    writeFile(approvalDraftVersionPath(repo.root, 'acceptance', 1), '# Acceptance\n- AC-01 Tampered draft.\n');
    assert.throws(
      () => preparePlannerApprovalProjection(repo.root, 'acceptance', 1, { requireDigestBindings: true }),
      /selected draft bytes do not match the immutable artifact/,
    );
    assert.equal(fs.existsSync(approvalApprovedPath(repo.root, 'acceptance')), false);
    assert.equal(JSON.parse(fs.readFileSync(approvalMetaPath(repo.root, 'acceptance'), 'utf8')).approved, null);

    writeFile(approvalDraftVersionPath(repo.root, 'acceptance', 1), artifactContents);
    writeFile(inputPath, '# Requirements\n- Tampered input.\n');
    assert.throws(
      () => preparePlannerApprovalProjection(repo.root, 'acceptance', 1, { requireDigestBindings: true }),
      /approval input digest no longer matches draft version 1/,
    );
    assert.equal(fs.existsSync(approvalApprovedPath(repo.root, 'acceptance')), false);
    assert.equal(readPhaseApproval(repo.root, 'acceptance').status, 'draft');
    assert.equal(readPhaseApproval(repo.root, 'acceptance').meta.approved, null);
  } finally {
    repo.cleanup();
  }
});

test('content loss persists a corrupted immutable candidate without replacing current or approval history', () => {
  const repo = makeRepo();

  try {
    writeFile(path.join(repo.root, 'requirements.md'), '# Requirements\n');
    const first = savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'AC-01 first\nAC-02 second\n');
    approvePlannerPhase(repo.root, 'acceptance', '', '', { version: first.version });
    const currentBytes = fs.readFileSync(approvalDraftPath(repo.root, 'acceptance'));
    const approvedBytes = fs.readFileSync(approvalApprovedPath(repo.root, 'acceptance'));

    const defective = savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'AC-01 first remains\n');
    const state = readPhaseApproval(repo.root, 'acceptance');

    assert.equal(defective.version, 2);
    assert.equal(defective.selected, false);
    assert.equal(defective.integrity.status, 'corrupted');
    assert.equal(state.meta.selected_version, 1);
    assert.equal(state.meta.draft.version, 1);
    assert.equal(state.meta.drafts[0].lifecycle_state, 'approved');
    assert.equal(state.meta.drafts[1].lifecycle_state, 'corrupted');
    assert.ok(state.meta.drafts[1].integrity.diagnostics.some((item) => item.code === 'IDENTITY_REMOVED'));
    assert.deepEqual(fs.readFileSync(approvalDraftPath(repo.root, 'acceptance')), currentBytes);
    assert.deepEqual(fs.readFileSync(approvalApprovedPath(repo.root, 'acceptance')), approvedBytes);
    assert.equal(fs.readFileSync(approvalDraftVersionPath(repo.root, 'acceptance', 2), 'utf8'), 'AC-01 first remains\n');
    assert.throws(
      () => approvePlannerPhase(repo.root, 'acceptance', '', '', { version: 2 }),
      /draft version 2 is not current/,
    );
  } finally {
    repo.cleanup();
  }
});

test('unsupported free text remains inspectable but never becomes current automatically', () => {
  const repo = makeRepo();

  try {
    writeFile(path.join(repo.root, 'requirements.md'), '# Requirements\n');
    const saved = savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'plain prose only\n');
    const state = readPhaseApproval(repo.root, 'acceptance');
    const candidates = buildPlannerApprovalCandidates(repo.root, 'acceptance');

    assert.equal(saved.selected, false);
    assert.equal(saved.lifecycleState, 'draft');
    assert.equal(saved.integrity.status, 'unsupported');
    assert.equal(state.status, 'draft');
    assert.equal(state.draft, null);
    assert.equal(state.meta.selected_version, null);
    assert.equal(fs.existsSync(approvalDraftPath(repo.root, 'acceptance')), false);
    assert.equal(fs.existsSync(approvalDraftVersionPath(repo.root, 'acceptance', 1)), true);
    assert.equal(candidates.current, null);
    assert.equal(candidates.recommended, null);
    assert.equal(candidates.candidates[0].blocked, true);
    assert.throws(
      () => approvePlannerPhase(repo.root, 'acceptance', '', '', { version: 1 }),
      /draft version 1 is not current/,
    );
  } finally {
    repo.cleanup();
  }
});

test('draft projection journal rolls forward deterministically from every committed crash point', () => {
  for (const faultPoint of ['after-journal', 'after-metadata', 'after-current-draft', 'before-journal-cleanup']) {
    const repo = makeRepo();
    try {
      writeFile(path.join(repo.root, 'requirements.md'), '# Requirements\n');
      savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'AC-01 initial\n');
      assert.throws(
        () => savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'AC-01 revised\nAC-02 added\n', {
          faultInjector(point) {
            if (point === faultPoint) throw new Error(`fault:${faultPoint}`);
          },
        }),
        new RegExp(`fault:${faultPoint}`),
      );
      const phaseRoot = path.dirname(approvalMetaPath(repo.root, 'acceptance'));
      assert.equal(fs.existsSync(journalPath(phaseRoot)), true);
      assert.throws(
        () => readPhaseApproval(repo.root, 'acceptance'),
        (error) => error.code === 'RECOVERY_REQUIRED',
      );

      const recovered = recoverDraftIntegrityCommit(repo.root, 'acceptance');
      const state = readPhaseApproval(repo.root, 'acceptance');
      assert.equal(recovered.recovered, true);
      assert.equal(state.meta.selected_version, 2);
      assert.equal(state.draft.contents, 'AC-01 revised\nAC-02 added\n');
      assert.equal(fs.existsSync(journalPath(phaseRoot)), false);
      assert.equal(recoverDraftIntegrityCommit(repo.root, 'acceptance').recovered, false);
    } finally {
      repo.cleanup();
    }
  }
});

test('a crash before journal publication leaves an immutable orphan and unchanged projections', () => {
  const repo = makeRepo();

  try {
    writeFile(path.join(repo.root, 'requirements.md'), '# Requirements\n');
    savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'AC-01 initial\n');
    const beforeMeta = fs.readFileSync(approvalMetaPath(repo.root, 'acceptance'));
    const beforeDraft = fs.readFileSync(approvalDraftPath(repo.root, 'acceptance'));
    assert.throws(
      () => savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'AC-01 replacement\n', {
        faultInjector(point) {
          if (point === 'after-candidate') throw new Error('fault:after-candidate');
        },
      }),
      /fault:after-candidate/,
    );
    assert.deepEqual(fs.readFileSync(approvalMetaPath(repo.root, 'acceptance')), beforeMeta);
    assert.deepEqual(fs.readFileSync(approvalDraftPath(repo.root, 'acceptance')), beforeDraft);
    assert.equal(fs.existsSync(approvalDraftVersionPath(repo.root, 'acceptance', 2)), true);
    assert.throws(
      () => savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'AC-01 retry\n'),
      (error) => error.code === 'REVISION_CONFLICT',
    );
  } finally {
    repo.cleanup();
  }
});

test('corrupt metadata, duplicate versions, competing writers, and unexpected recovery digests fail closed', () => {
  const corruptRepo = makeRepo();
  try {
    writeFile(path.join(corruptRepo.root, 'requirements.md'), '# Requirements\n');
    writeFile(approvalMetaPath(corruptRepo.root, 'acceptance'), '{not json');
    assert.throws(
      () => savePlannerDraft(corruptRepo.root, 'acceptance', 'requirements.md', 'AC-01 candidate\n'),
      /invalid approval metadata/,
    );
    assert.equal(fs.existsSync(approvalDraftVersionPath(corruptRepo.root, 'acceptance', 1)), false);
  } finally {
    corruptRepo.cleanup();
  }

  const duplicateRepo = makeRepo();
  try {
    writeFile(path.join(duplicateRepo.root, 'requirements.md'), '# Requirements\n');
    savePlannerDraft(duplicateRepo.root, 'acceptance', 'requirements.md', 'AC-01 candidate\n');
    const metaPath = approvalMetaPath(duplicateRepo.root, 'acceptance');
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    meta.drafts.push({ ...meta.drafts[0] });
    writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
    assert.throws(
      () => savePlannerDraft(duplicateRepo.root, 'acceptance', 'requirements.md', 'AC-01 next\n'),
      (error) => error.code === 'REVISION_CONFLICT',
    );
  } finally {
    duplicateRepo.cleanup();
  }

  const lockedRepo = makeRepo();
  try {
    writeFile(path.join(lockedRepo.root, 'requirements.md'), '# Requirements\n');
    const handle = acquireLock(lockedRepo.root, plannerApprovalLockName('acceptance'), { command: 'competing writer' });
    try {
      assert.throws(
        () => savePlannerDraft(lockedRepo.root, 'acceptance', 'requirements.md', 'AC-01 candidate\n'),
        /operation is locked/,
      );
    } finally {
      releaseLock(handle);
    }
  } finally {
    lockedRepo.cleanup();
  }

  const recoveryRepo = makeRepo();
  try {
    writeFile(path.join(recoveryRepo.root, 'requirements.md'), '# Requirements\n');
    savePlannerDraft(recoveryRepo.root, 'acceptance', 'requirements.md', 'AC-01 initial\n');
    assert.throws(
      () => savePlannerDraft(recoveryRepo.root, 'acceptance', 'requirements.md', 'AC-01 revised\n', {
        faultInjector(point) {
          if (point === 'after-journal') throw new Error('fault:after-journal');
        },
      }),
      /fault:after-journal/,
    );
    writeFile(approvalDraftPath(recoveryRepo.root, 'acceptance'), 'AC-99 unexpected bytes\n');
    const markerPath = journalPath(path.dirname(approvalMetaPath(recoveryRepo.root, 'acceptance')));
    const markerBefore = fs.readFileSync(markerPath);
    assert.throws(
      () => recoverDraftIntegrityCommit(recoveryRepo.root, 'acceptance'),
      (error) => error.code === 'RECOVERY_REQUIRED' && /unexpected target digest/.test(error.message),
    );
    assert.deepEqual(fs.readFileSync(markerPath), markerBefore);
    assert.equal(fs.readFileSync(approvalDraftPath(recoveryRepo.root, 'acceptance'), 'utf8'), 'AC-99 unexpected bytes\n');
  } finally {
    recoveryRepo.cleanup();
  }
});

test('v1 readers reject inconsistent selection, invalid history, tampered projection, and unsafe candidate paths', (t) => {
  function seededRepo() {
    const repo = makeRepo();
    writeFile(path.join(repo.root, 'requirements.md'), '# Requirements\n');
    savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'AC-01 original\n');
    return repo;
  }

  for (const mutate of [
    (meta) => { meta.selected_version = 999; },
    (meta) => { meta.drafts.push(null); },
    (meta) => { meta.drafts[0].path = '../outside.txt'; },
    (meta) => { meta.draft_integrity_version = 2; },
  ]) {
    const repo = seededRepo();
    try {
      const metaPath = approvalMetaPath(repo.root, 'acceptance');
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      mutate(meta);
      writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
      assert.throws(
        () => readPhaseApproval(repo.root, 'acceptance'),
        (error) => error.code === 'RECOVERY_REQUIRED',
      );
      assert.throws(
        () => buildPlannerApprovalCandidates(repo.root, 'acceptance'),
        (error) => error.code === 'RECOVERY_REQUIRED',
      );
    } finally {
      repo.cleanup();
    }
  }

  const tampered = seededRepo();
  try {
    writeFile(approvalDraftPath(tampered.root, 'acceptance'), 'AC-99 tampered\n');
    assert.throws(
      () => readPhaseApproval(tampered.root, 'acceptance'),
      (error) => error.code === 'RECOVERY_REQUIRED' && /selected draft bytes/.test(error.message),
    );
  } finally {
    tampered.cleanup();
  }

  const symlinked = seededRepo();
  const externalRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-draft-history-outside-'));
  try {
    const draftsDir = path.dirname(approvalDraftVersionPath(symlinked.root, 'acceptance', 1));
    fs.renameSync(draftsDir, `${draftsDir}-original`);
    try {
      fs.symlinkSync(externalRoot, draftsDir, 'dir');
    } catch (error) {
      if (['EACCES', 'EPERM', 'ENOTSUP'].includes(error.code)) {
        t.diagnostic(`symlink candidate-path check skipped: ${error.code}`);
        return;
      }
      throw error;
    }
    assert.throws(
      () => buildPlannerApprovalCandidates(symlinked.root, 'acceptance'),
      (error) => error.code === 'RECOVERY_REQUIRED',
    );
  } finally {
    symlinked.cleanup();
    fs.rmSync(externalRoot, { recursive: true, force: true });
  }
});

test('draft recovery respects governance read-only mode without changing marker or projections', () => {
  const repo = makeRepo();

  try {
    writeFile(path.join(repo.root, 'requirements.md'), '# Requirements\n');
    savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'AC-01 initial\n');
    assert.throws(
      () => savePlannerDraft(repo.root, 'acceptance', 'requirements.md', 'AC-01 revised\nAC-02 added\n', {
        faultInjector(point) {
          if (point === 'after-journal') throw new Error('fault:after-journal');
        },
      }),
      /fault:after-journal/,
    );

    const governance = buildDefaultGovernanceConfig();
    governance.compatibility.writer_mode = 'read-only';
    writeFile(path.join(repo.root, '.quiver', 'config.json'), `${JSON.stringify({ governance }, null, 2)}\n`);
    writeFile(path.join(repo.root, '.quiver', 'state.json'), `${JSON.stringify({
      quiver_version: packageJson.version,
      initialized_version: packageJson.version,
      last_initialized_at: '2026-09-06T00:00:00.000Z',
    }, null, 2)}\n`);

    const phaseRoot = path.dirname(approvalMetaPath(repo.root, 'acceptance'));
    const markerPath = journalPath(phaseRoot);
    const beforeMarker = fs.readFileSync(markerPath);
    const beforeMeta = fs.readFileSync(approvalMetaPath(repo.root, 'acceptance'));
    const beforeDraft = fs.readFileSync(approvalDraftPath(repo.root, 'acceptance'));
    assert.throws(
      () => recoverDraftIntegrityCommit(repo.root, 'acceptance'),
      (error) => error.code === 'GOVERNANCE_READ_ONLY',
    );
    assert.deepEqual(fs.readFileSync(markerPath), beforeMarker);
    assert.deepEqual(fs.readFileSync(approvalMetaPath(repo.root, 'acceptance')), beforeMeta);
    assert.deepEqual(fs.readFileSync(approvalDraftPath(repo.root, 'acceptance')), beforeDraft);
  } finally {
    repo.cleanup();
  }
});

test('project file byte reader rejects path traversal outside the project root', () => {
  const repo = makeRepo();
  const externalRoot = fs.mkdtempSync(path.join(path.dirname(repo.root), 'quiver-approvals-outside-'));

  try {
    const externalPath = path.join(externalRoot, 'outside.md');
    writeFile(externalPath, '# Outside\n');
    const escapedPath = path.relative(repo.root, externalPath);

    assert.match(escapedPath, /^\.\.[\\/]/);
    assert.throws(
      () => readProjectFileBytes(repo.root, escapedPath, 'approval input'),
      /approval input must be inside the project root/,
    );
  } finally {
    repo.cleanup();
    fs.rmSync(externalRoot, { recursive: true, force: true });
  }
});

test('project file byte reader rejects symlinks that resolve outside the project root', (t) => {
  const repo = makeRepo();
  const externalRoot = fs.mkdtempSync(path.join(path.dirname(repo.root), 'quiver-approvals-outside-'));

  try {
    const externalPath = path.join(externalRoot, 'outside.md');
    const symlinkPath = path.join(repo.root, 'linked.md');
    writeFile(externalPath, '# Outside\n');
    try {
      fs.symlinkSync(externalPath, symlinkPath, 'file');
    } catch (error) {
      if (['EACCES', 'EPERM', 'ENOTSUP'].includes(error.code)) {
        t.skip(`symlinks are not supported in this environment: ${error.code}`);
        return;
      }
      throw error;
    }

    assert.throws(
      () => readProjectFileBytes(repo.root, 'linked.md', 'approval input'),
      /approval input (?:cannot use a symlinked path component|resolves outside the project root)/,
    );
  } finally {
    repo.cleanup();
    fs.rmSync(externalRoot, { recursive: true, force: true });
  }
});

test('project file byte reader rejects in-project symlink aliases', (t) => {
  const repo = makeRepo();

  try {
    writeFile(path.join(repo.root, 'canonical.md'), '# Canonical\n');
    try {
      fs.symlinkSync('canonical.md', path.join(repo.root, 'alias.md'), 'file');
    } catch (error) {
      if (['EACCES', 'EPERM', 'ENOTSUP'].includes(error.code)) {
        t.skip(`symlinks are not supported in this environment: ${error.code}`);
        return;
      }
      throw error;
    }

    assert.throws(
      () => readProjectFileBytes(repo.root, 'alias.md', 'approval input'),
      /approval input cannot use a symlinked path component/,
    );
  } finally {
    repo.cleanup();
  }
});
