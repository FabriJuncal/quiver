const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { redactSecrets, truncateText } = require('./evidence');
const { quiverInternalPaths } = require('./init-layout');
const { withLockSync } = require('./locks');
const { assertProjectWriterAllowed } = require('./state');
const {
  DRAFT_INTEGRITY_VERSION,
  DRAFT_LIFECYCLE_STATES,
  assertNoPendingDraftIntegrityCommit,
  compareDraftStructure,
  commitDraftIntegrityProjection,
  recoverDraftIntegrityProjection,
  writeFileAtomic: writeFileDurable,
  writeFileImmutable,
} = require('./ai/draft-integrity');

const PLANNER_APPROVAL_PHASES = Object.freeze(['acceptance', 'technical-plan']);
const APPROVAL_DEPENDENCIES = Object.freeze({
  acceptance: null,
  'technical-plan': 'acceptance',
  spec: 'technical-plan',
});

function formatError(message) {
  return `create-quiver: ${message}`;
}

function normalizePhase(phase) {
  const normalized = String(phase || '').trim().toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(APPROVAL_DEPENDENCIES, normalized)) {
    throw new Error(formatError(`unsupported approval phase '${phase}'`));
  }
  return normalized;
}

function approvalRoot(projectRoot, phase) {
  return path.join(quiverInternalPaths(projectRoot).root, 'approvals', normalizePhase(phase));
}

function approvalDraftPath(projectRoot, phase) {
  return path.join(approvalRoot(projectRoot, phase), 'draft.md');
}

function approvalDraftsDir(projectRoot, phase) {
  return path.join(approvalRoot(projectRoot, phase), 'drafts');
}

function approvalDraftVersionPath(projectRoot, phase, version) {
  const padded = String(version).padStart(3, '0');
  return path.join(approvalDraftsDir(projectRoot, phase), `${padded}.md`);
}

function approvalApprovedPath(projectRoot, phase) {
  return path.join(approvalRoot(projectRoot, phase), 'approved.md');
}

function approvalMetaPath(projectRoot, phase) {
  return path.join(approvalRoot(projectRoot, phase), 'meta.json');
}

function plannerApprovalLockName(phase) {
  return `planner-approval-${normalizePhase(phase)}`;
}

function withPlannerApprovalLock(projectRoot, phase, options, callback) {
  return withLockSync(projectRoot, plannerApprovalLockName(phase), options || {}, callback);
}

function assertNoPendingDraftProjection(projectRoot, phase) {
  const normalizedPhase = normalizePhase(phase);
  assertNoPendingDraftIntegrityCommit(approvalRoot(projectRoot, normalizedPhase), normalizedPhase);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sha256Bytes(value) {
  return `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
}

function pathIsInside(root, target) {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function assertNoSymlinkPathComponents(root, target, label) {
  let current = target;
  while (current !== root) {
    try {
      if (fs.lstatSync(current).isSymbolicLink()) {
        throw new Error(formatError(`${label} cannot use a symlinked path component`));
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
}

function readProjectFileBytes(projectRoot, value, label = 'approval file') {
  const root = path.resolve(projectRoot);
  const target = path.resolve(root, String(value || ''));
  if (!value || !pathIsInside(root, target)) {
    throw new Error(formatError(`${label} must be inside the project root`));
  }
  assertNoSymlinkPathComponents(root, target, label);
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    throw new Error(formatError(`missing ${label}: ${value}`));
  }
  const realRoot = fs.realpathSync(root);
  const realTarget = fs.realpathSync(target);
  if (!pathIsInside(realRoot, realTarget)) {
    throw new Error(formatError(`${label} resolves outside the project root`));
  }
  const bytes = fs.readFileSync(realTarget);
  return {
    bytes,
    path: toRelativePosix(root, target),
    realPath: realTarget,
    sha256: sha256Bytes(bytes),
  };
}

function writeFileAtomic(filePath, contents) {
  ensureDir(path.dirname(filePath));
  const tempPath = path.join(
    path.dirname(filePath),
    `.tmp-${path.basename(filePath)}-${process.pid}-${crypto.randomBytes(6).toString('hex')}`,
  );
  try {
    fs.writeFileSync(tempPath, contents, { flag: 'wx' });
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    if (fs.existsSync(tempPath)) fs.rmSync(tempPath);
    throw error;
  }
}

function toRelativePosix(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function readTextFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(formatError(`missing approval input file: ${filePath}`));
  }

  return fs.readFileSync(filePath, 'utf8');
}

function readApprovalMeta(projectRoot, phase) {
  const metaPath = approvalMetaPath(projectRoot, phase);
  if (!fs.existsSync(metaPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  } catch (error) {
    throw new Error(formatError(`invalid approval metadata at ${toRelativePosix(projectRoot, metaPath)}: ${error.message}`));
  }
}

function assertNoPendingDigestBoundApproval(projectRoot, phase) {
  const runsRoot = quiverInternalPaths(projectRoot).runsDir;
  if (!fs.existsSync(runsRoot)) return;
  const pending = fs.readdirSync(runsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(runsRoot, entry.name, 'approval-commit-wal.json'))
    .filter((filePath) => {
      if (!fs.existsSync(filePath)) return false;
      try {
        const marker = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const markerPhase = marker?.decision?.phase;
        return !PLANNER_APPROVAL_PHASES.includes(markerPhase) || markerPhase === phase;
      } catch {
        return true;
      }
    });
  if (pending.length === 0) return;
  const error = new Error(formatError('APPROVAL_RECOVERY_REQUIRED: a prepared approval commit must be recovered before reading planner approvals'));
  error.code = 'APPROVAL_RECOVERY_REQUIRED';
  error.details = {
    wal_paths: pending.map((filePath) => toRelativePosix(projectRoot, filePath)),
  };
  throw error;
}

function normalizeDrafts(meta) {
  if (meta?.draft_integrity_version !== undefined
      && meta.draft_integrity_version !== DRAFT_INTEGRITY_VERSION) {
    const error = new Error(formatError(`unsupported draft integrity metadata version '${meta.draft_integrity_version}'`));
    error.code = 'RECOVERY_REQUIRED';
    throw error;
  }
  if (Number(meta?.draft_integrity_version) === DRAFT_INTEGRITY_VERSION && !Array.isArray(meta?.drafts)) {
    const error = new Error(formatError('draft integrity history must be an array'));
    error.code = 'RECOVERY_REQUIRED';
    throw error;
  }
  if (meta?.drafts !== undefined && !Array.isArray(meta.drafts)) {
    const error = new Error(formatError('invalid planner draft history metadata'));
    error.code = 'RECOVERY_REQUIRED';
    throw error;
  }
  if (Number(meta?.draft_integrity_version) === DRAFT_INTEGRITY_VERSION
      && meta.drafts.some((item) => !item || typeof item !== 'object' || Array.isArray(item))) {
    const error = new Error(formatError('draft integrity history contains an invalid entry'));
    error.code = 'RECOVERY_REQUIRED';
    throw error;
  }
  const drafts = Array.isArray(meta?.drafts)
    ? meta.drafts.filter((item) => item && typeof item === 'object' && !Array.isArray(item))
    : [];
  const versions = new Set();
  for (const draft of drafts) {
    const version = Number(draft.version);
    if (!Number.isInteger(version) || version <= 0 || versions.has(version)) {
      const error = new Error(formatError(`invalid or duplicate planner draft version '${draft.version}'`));
      error.code = 'REVISION_CONFLICT';
      error.details = { version: draft.version };
      throw error;
    }
    versions.add(version);
    if (draft.lifecycle_state && !DRAFT_LIFECYCLE_STATES.includes(draft.lifecycle_state)) {
      const error = new Error(formatError(`invalid planner draft lifecycle '${draft.lifecycle_state}'`));
      error.code = 'RECOVERY_REQUIRED';
      throw error;
    }
  }
  return drafts;
}

function draftMetadataError(message, details = {}) {
  const error = new Error(formatError(`RECOVERY_REQUIRED: ${message}`));
  error.code = 'RECOVERY_REQUIRED';
  error.details = details;
  return error;
}

function assertDraftIntegrityProjection(projectRoot, phase, meta, draftBytes) {
  const drafts = normalizeDrafts(meta);
  if (meta?.draft_integrity_version === undefined) return;
  for (const record of drafts) {
    const expectedPath = toRelativePosix(projectRoot, approvalDraftVersionPath(projectRoot, phase, record.version));
    if (record.path !== expectedPath) {
      throw draftMetadataError('planner draft history contains a non-canonical artifact path', {
        phase,
        version: record.version,
        path: record.path || null,
      });
    }
    try {
      assertNoSymlinkPathComponents(path.resolve(projectRoot), path.resolve(projectRoot, record.path), `${phase} draft artifact`);
      if (fs.existsSync(path.resolve(projectRoot, record.path))) {
        readProjectFileBytes(projectRoot, record.path, `${phase} draft artifact`);
      }
    } catch (error) {
      if (error?.code === 'RECOVERY_REQUIRED') throw error;
      throw draftMetadataError('planner draft history contains an unsafe artifact path', {
        phase,
        version: record.version,
        cause: error.message,
      });
    }
  }

  const selectedVersion = meta.selected_version;
  if (selectedVersion === null) {
    if (meta.draft !== null || draftBytes !== null) {
      throw draftMetadataError('unselected draft metadata cannot publish a current projection', { phase });
    }
    return;
  }
  if (!Number.isInteger(selectedVersion) || selectedVersion <= 0) {
    throw draftMetadataError('selected draft version is invalid', { phase, selected_version: selectedVersion });
  }
  const selected = drafts.filter((record) => Number(record.version) === selectedVersion);
  if (selected.length !== 1) {
    throw draftMetadataError('selected draft version does not resolve exactly once', {
      phase,
      selected_version: selectedVersion,
      matches: selected.length,
    });
  }
  const record = selected[0];
  if (record.integrity?.status === 'corrupted') {
    throw draftMetadataError('corrupted draft version cannot be selected', { phase, selected_version: selectedVersion });
  }
  const expectedProjectionPath = toRelativePosix(projectRoot, approvalDraftPath(projectRoot, phase));
  if (!meta.draft
      || Number(meta.draft.version) !== selectedVersion
      || meta.draft.path !== expectedProjectionPath
      || meta.draft.artifact_sha256 !== record.artifact_sha256
      || meta.draft.lifecycle_state !== record.lifecycle_state) {
    throw draftMetadataError('selected draft metadata does not match its current projection', {
      phase,
      selected_version: selectedVersion,
    });
  }
  if (!draftBytes) {
    throw draftMetadataError('selected draft current projection is missing', { phase, selected_version: selectedVersion });
  }
  let immutable;
  try {
    immutable = readProjectFileBytes(projectRoot, record.path, `${phase} selected draft artifact`);
  } catch (error) {
    throw draftMetadataError('selected immutable draft artifact is missing or unsafe', {
      phase,
      selected_version: selectedVersion,
      cause: error.message,
    });
  }
  const projectionSha256 = sha256Bytes(draftBytes);
  if (immutable.sha256 !== record.artifact_sha256
      || projectionSha256 !== record.artifact_sha256
      || !immutable.bytes.equals(draftBytes)) {
    throw draftMetadataError('selected draft bytes do not match the immutable artifact', {
      phase,
      selected_version: selectedVersion,
      immutable_sha256: immutable.sha256,
      projection_sha256: projectionSha256,
      expected_sha256: record.artifact_sha256 || null,
    });
  }
}

function nextDraftVersion(meta) {
  const versions = normalizeDrafts(meta)
    .map((item) => Number(item.version))
    .filter((value) => Number.isInteger(value) && value > 0);
  return versions.length > 0 ? Math.max(...versions) + 1 : 1;
}

function findDraftVersion(meta, version) {
  const parsed = Number(version);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(formatError(`invalid draft version: ${version}`));
  }
  const matches = normalizeDrafts(meta).filter((item) => Number(item.version) === parsed);
  if (matches.length > 1) {
    const error = new Error(formatError(`REPRESENTATION_MISMATCH: draft version ${parsed} appears ${matches.length} times`));
    error.code = 'REPRESENTATION_MISMATCH';
    error.details = { version: parsed, draft_count: matches.length };
    throw error;
  }
  return matches[0] || null;
}

function latestDraftVersion(meta) {
  if (Number(meta?.draft_integrity_version) === DRAFT_INTEGRITY_VERSION) {
    const selectedVersion = Number(meta?.selected_version || 0);
    return Number.isInteger(selectedVersion) && selectedVersion > 0 ? selectedVersion : null;
  }
  const draftVersion = Number(meta?.draft?.version || 0);
  if (Number.isInteger(draftVersion) && draftVersion > 0) {
    return draftVersion;
  }

  const versions = normalizeDrafts(meta)
    .map((item) => Number(item.version))
    .filter((value) => Number.isInteger(value) && value > 0);
  return versions.length > 0 ? Math.max(...versions) : null;
}

function selectedDraftRecord(meta) {
  const version = latestDraftVersion(meta);
  return version ? findDraftVersion(meta, version) : null;
}

function approvalBindingError(message, details = {}) {
  const error = new Error(formatError(`APPROVAL_BINDING_MISMATCH: ${message}`));
  error.code = 'APPROVAL_BINDING_MISMATCH';
  error.details = details;
  return error;
}

function assertDraftArtifactAndInput(projectRoot, phase, draft) {
  if (!draft?.artifact_sha256 || !draft?.input_path || !draft?.input_sha256) {
    throw approvalBindingError(`${phase} draft version ${draft?.version || 'unknown'} lacks immutable digest bindings`, {
      phase,
      version: Number(draft?.version) || null,
    });
  }
  const artifact = readProjectFileBytes(projectRoot, draft.path, `${phase} draft artifact`);
  if (artifact.sha256 !== draft.artifact_sha256) {
    throw approvalBindingError(`${phase} draft artifact digest no longer matches version ${draft.version}`, {
      phase,
      version: Number(draft.version),
      mismatch: 'artifact_sha256',
    });
  }
  const input = readProjectFileBytes(projectRoot, draft.input_path, `${phase} draft input`);
  if (input.sha256 !== draft.input_sha256) {
    throw approvalBindingError(`${phase} draft input digest no longer matches version ${draft.version}`, {
      phase,
      version: Number(draft.version),
      mismatch: 'input_sha256',
    });
  }
  return { artifact, input };
}

function normalizeRunArtifactPath(projectRoot, value) {
  if (!value) return '';
  const resolved = path.isAbsolute(value) ? value : path.resolve(projectRoot, value);
  return toRelativePosix(projectRoot, resolved);
}

function assertDraftOwnedByRun(projectRoot, phase, draft, runId) {
  if (!runId) return null;
  const { readAiRun, readRunApprovalDecision, runRequirementPath } = require('./ai/run-state');
  const run = readAiRun(projectRoot, runId);
  if (!run || run.status === 'closed') {
    throw approvalBindingError(`draft recovery cannot target closed or missing run '${runId}'`, {
      phase,
      run_id: runId,
    });
  }
  if (draft.run_id && draft.run_id !== run.run_id) {
    throw approvalBindingError(`draft version ${draft.version} belongs to a different run`, {
      phase,
      run_id: run.run_id,
      draft_run_id: draft.run_id,
    });
  }
  const artifactPath = normalizeRunArtifactPath(projectRoot, draft.path);
  const owned = (run.history || []).some((event) => (
    event?.phase === `${phase}-draft`
      && normalizeRunArtifactPath(projectRoot, event.artifact) === artifactPath
  ));
  if (!owned) {
    throw approvalBindingError(`draft version ${draft.version} is not owned by run '${run.run_id}'`, {
      phase,
      run_id: run.run_id,
      artifact: artifactPath,
    });
  }

  if (phase === 'acceptance') {
    const canonicalPath = toRelativePosix(projectRoot, runRequirementPath(projectRoot, run.run_id));
    if (run.requirement?.path !== canonicalPath) {
      throw approvalBindingError(`run '${run.run_id}' has a noncanonical requirement binding`, {
        phase,
        run_id: run.run_id,
        mismatch: 'run.requirement.path',
      });
    }
    const canonical = readProjectFileBytes(projectRoot, canonicalPath, 'canonical run requirement input');
    if (normalizeRunArtifactPath(projectRoot, draft.input_path) !== canonicalPath
        || canonical.sha256 !== draft.input_sha256) {
      throw approvalBindingError(`draft version ${draft.version} input is not the canonical requirement of run '${run.run_id}'`, {
        phase,
        run_id: run.run_id,
        mismatch: normalizeRunArtifactPath(projectRoot, draft.input_path) !== canonicalPath
          ? 'input_path'
          : 'input_sha256',
      });
    }
  } else {
    const decision = readRunApprovalDecision(projectRoot, run.run_id, 'acceptance');
    if (!decision || decision.publication_state !== 'final') {
      throw approvalBindingError(`run '${run.run_id}' has no canonical acceptance input for technical-plan recovery`, {
        phase,
        run_id: run.run_id,
      });
    }
    if (normalizeRunArtifactPath(projectRoot, decision.artifact_path)
          !== normalizeRunArtifactPath(projectRoot, draft.input_path)
        || decision.artifact_sha256 !== draft.input_sha256) {
      throw approvalBindingError(`draft version ${draft.version} input is not the canonical acceptance decision of run '${run.run_id}'`, {
        phase,
        run_id: run.run_id,
        mismatch: 'prior_phase_binding',
      });
    }
  }
  return run;
}

function assertDraftArtifactOwnedByRun(projectRoot, phase, draft, runId) {
  if (!runId) return null;
  const { readAiRun } = require('./ai/run-state');
  const run = readAiRun(projectRoot, runId);
  const artifactPath = normalizeRunArtifactPath(projectRoot, draft.path);
  const owned = run && run.status !== 'closed' && (run.history || []).some((event) => (
    event?.phase === `${phase}-draft`
      && normalizeRunArtifactPath(projectRoot, event.artifact) === artifactPath
  ));
  if (!owned) {
    throw approvalBindingError(`draft version ${draft.version} is not owned by active run '${runId}'`, {
      phase,
      run_id: runId,
      artifact: artifactPath,
    });
  }
  return run;
}

function assertSelectedDraftUsable(projectRoot, phase, meta, options = {}) {
  const draft = selectedDraftRecord(meta);
  if (!draft) {
    throw approvalBindingError(`${phase} has no selected current draft`, { phase });
  }
  if (draft.lifecycle_state === 'rejected') {
    throw approvalBindingError(`${phase} selected draft version ${draft.version} is rejected and requires explicit restore`, {
      phase,
      version: Number(draft.version),
      lifecycle_state: 'rejected',
    });
  }
  if (draft.integrity?.status === 'corrupted') {
    throw approvalBindingError(`${phase} selected draft version ${draft.version} is corrupted`, {
      phase,
      version: Number(draft.version),
    });
  }
  if (draft.selection_verification === 'unverified' || draft.integrity?.status === 'unsupported') {
    throw approvalBindingError(`${phase} selected draft version ${draft.version} remains unverified and cannot satisfy approval`, {
      phase,
      version: Number(draft.version),
      selection_verification: 'unverified',
    });
  }
  const bound = assertDraftArtifactAndInput(projectRoot, phase, draft);
  assertDraftOwnedByRun(projectRoot, phase, draft, options.runId);
  return { draft, ...bound };
}

function readPhaseApproval(projectRoot, phase) {
  const normalizedPhase = normalizePhase(phase);
  const draftPath = approvalDraftPath(projectRoot, normalizedPhase);
  const approvedPath = approvalApprovedPath(projectRoot, normalizedPhase);
  const metaPath = approvalMetaPath(projectRoot, normalizedPhase);
  const capture = () => [metaPath, draftPath, approvedPath]
    .map((filePath) => (fs.existsSync(filePath) ? fs.readFileSync(filePath) : null));
  assertNoPendingDigestBoundApproval(projectRoot, normalizedPhase);
  assertNoPendingDraftProjection(projectRoot, normalizedPhase);
  const first = capture();
  assertNoPendingDigestBoundApproval(projectRoot, normalizedPhase);
  assertNoPendingDraftProjection(projectRoot, normalizedPhase);
  const second = capture();
  assertNoPendingDigestBoundApproval(projectRoot, normalizedPhase);
  assertNoPendingDraftProjection(projectRoot, normalizedPhase);
  const stable = first.every((bytes, index) => (
    bytes === null ? second[index] === null : second[index] !== null && bytes.equals(second[index])
  ));
  if (!stable) {
    const error = new Error(formatError(`APPROVAL_RECOVERY_REQUIRED: ${normalizedPhase} approval changed while it was being read`));
    error.code = 'APPROVAL_RECOVERY_REQUIRED';
    error.details = { phase: normalizedPhase };
    throw error;
  }
  let meta = null;
  if (first[0]) {
    try {
      meta = JSON.parse(first[0].toString('utf8'));
    } catch (error) {
      throw new Error(formatError(`invalid approval metadata at ${toRelativePosix(projectRoot, metaPath)}: ${error.message}`));
    }
  }

  assertDraftIntegrityProjection(projectRoot, normalizedPhase, meta, first[1]);

  if (!meta && !first[1] && !first[2]) {
    return {
      phase: normalizedPhase,
      status: 'missing',
      draft: null,
      approved: null,
      meta: null,
    };
  }

  const draft = first[1]
    ? {
        path: toRelativePosix(projectRoot, draftPath),
        contents: first[1].toString('utf8'),
      }
    : null;
  const approved = first[2]
    ? {
        path: toRelativePosix(projectRoot, approvedPath),
        contents: first[2].toString('utf8'),
      }
    : null;

  const approvedSource = meta?.approved || null;
  const draftSource = meta?.draft || null;
  const selectedRecord = selectedDraftRecord(meta);
  const rejected = selectedRecord?.lifecycle_state === 'rejected';
  const conditioned = selectedRecord?.lifecycle_state === 'approved-with-conditions';
  const selectedUnverified = selectedRecord?.selection_verification === 'unverified'
    || selectedRecord?.integrity?.status === 'unsupported';
  const stale = Boolean(
    approvedSource
    && approvedSource.source_file
    && !fs.existsSync(path.resolve(projectRoot, approvedSource.source_file))
    && !approvedSource.source_file.startsWith('.quiver/approvals/'),
  ) || Boolean(
    draftSource?.version
    && approvedSource?.version
    && Number(draftSource.version) !== Number(approvedSource.version),
  );

  let status = 'missing';
  if (rejected) {
    status = 'rejected';
  } else if (selectedUnverified) {
    status = 'unverified';
  } else if (conditioned) {
    status = 'approved-with-conditions';
  } else if (approved) {
    status = stale ? 'stale' : 'approved';
  } else if (draft || normalizeDrafts(meta).length > 0) {
    status = 'draft';
  }

  return {
    phase: normalizedPhase,
    status,
    draft,
    approved,
    meta,
  };
}

function renderApprovalStatus(report) {
  if (!report || report.status === 'missing') {
    return `missing ${report ? report.phase : 'approval'} approval`;
  }

  if (report.status === 'draft') {
    return `draft ready for ${report.phase}`;
  }

  if (report.status === 'stale') {
    return `stale ${report.phase} approval`;
  }

  if (report.status === 'rejected') {
    return `rejected ${report.phase} draft; explicit restore required`;
  }

  if (report.status === 'unverified') {
    return `unverified ${report.phase} draft`;
  }

  if (report.status === 'approved-with-conditions') {
    return `approved-with-conditions ${report.phase}`;
  }

  return `approved ${report.phase}`;
}

function safePreview(text, maxLength = 180) {
  const firstLines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(' ');
  const truncated = truncateText(redactSecrets(firstLines), maxLength);
  return {
    text: truncated.text.replace(/\s+/g, ' ').trim(),
    truncated: truncated.truncated,
  };
}

function readCandidatePreview(projectRoot, draft) {
  const draftPath = draft?.path || '';
  if (!draftPath) {
    return safePreview('');
  }
  const resolved = path.resolve(projectRoot, draftPath);
  if (!fs.existsSync(resolved)) {
    return {
      text: '(missing draft artifact)',
      truncated: false,
    };
  }
  return safePreview(readProjectFileBytes(projectRoot, draftPath, 'planner draft preview').bytes.toString('utf8'));
}

function buildApprovalCandidate(projectRoot, phase, draft, latestVersion, report) {
  const version = Number(draft.version || 0) || null;
  const isCurrent = Boolean(version && latestVersion && version === latestVersion);
  const maxHistoryVersion = Math.max(0, ...normalizeDrafts(report.meta).map((item) => Number(item.version) || 0));
  const integrityStatus = draft.integrity?.status || 'legacy';
  const artifactExists = Boolean(draft.path && fs.existsSync(path.resolve(projectRoot, draft.path)));
  const preview = readCandidatePreview(projectRoot, draft);
  const integrityEligible = integrityStatus === 'preserved' || integrityStatus === 'legacy';
  const lifecycleEligible = draft.lifecycle_state !== 'rejected'
    && draft.selection_verification !== 'unverified';
  const approvable = isCurrent && integrityEligible && lifecycleEligible && artifactExists
    && (report.status === 'draft' || report.status === 'stale' || report.status === 'approved');
  const nextCommand = version
    ? `npx create-quiver ai approve --phase ${phase} --version ${version}`
    : `npx create-quiver ai approve --phase ${phase} --version <n>`;

  return {
    phase,
    run_id: draft.run_id || null,
    version,
    label: version ? `v${version}` : 'unknown version',
    path: draft.path || '',
    source_file: draft.source_file || '',
    artifact_sha256: draft.artifact_sha256 || null,
    input_path: draft.input_path || null,
    input_sha256: draft.input_sha256 || null,
    created_at: draft.created_at || '',
    raw_artifact_path: draft.raw_artifact_path || null,
    output_source: draft.output_source || null,
    input_compaction: draft.input_compaction || null,
    current: isCurrent,
    latest: Boolean(version && version === maxHistoryVersion),
    lifecycle_state: draft.lifecycle_state || (isCurrent ? 'current' : 'draft'),
    lifecycle: Array.isArray(draft.lifecycle) ? draft.lifecycle : [],
    integrity: draft.integrity || null,
    recommended: approvable,
    approvable,
    blocked: !approvable,
    status: approvable ? 'approvable' : isCurrent ? 'blocked' : 'history',
    reason: approvable
      ? 'selected current draft is eligible for approval'
      : isCurrent
        ? draft.lifecycle_state === 'rejected'
          ? 'selected draft is rejected; explicitly restore a valid version before approval'
          : draft.selection_verification === 'unverified'
            ? 'selected draft has only an acknowledgement and remains unverified'
            : `selected draft artifact is missing or integrity is ${integrityStatus}`
        : `not current; selected draft version is ${latestVersion || 'none'}`,
    preview: preview.text,
    preview_truncated: preview.truncated,
    next_command: nextCommand,
    recommended_action: approvable ? 'approve' : 'inspect',
    review: null,
  };
}

function buildPlannerApprovalCandidates(projectRoot, phase) {
  const normalizedPhase = normalizePhase(phase);
  if (!PLANNER_APPROVAL_PHASES.includes(normalizedPhase)) {
    throw new Error(formatError(`approval candidates are only supported for planner phases: ${PLANNER_APPROVAL_PHASES.join(', ')}`));
  }

  const report = readPhaseApproval(projectRoot, normalizedPhase);
  const drafts = normalizeDrafts(report.meta);
  const latestVersion = latestDraftVersion(report.meta);
  const candidates = drafts.map((draft) => buildApprovalCandidate(projectRoot, normalizedPhase, draft, latestVersion, report));
  const current = candidates.find((candidate) => candidate.current) || null;
  const recommended = candidates.find((candidate) => candidate.recommended) || null;

  return {
    phase: normalizedPhase,
    approval_status: report.status,
    latest_version: latestVersion,
    current,
    recommended,
    candidates,
    history: candidates.filter((candidate) => !candidate.current),
    approved: report.approved
      ? {
          path: report.approved.path,
          version: Number(report.meta?.approved?.version || 0) || null,
          source_file: report.meta?.approved?.source_file || '',
          approved_at: report.meta?.approved?.approved_at || '',
        }
      : null,
    next_command: recommended?.next_command || `npx create-quiver ai plan --phase ${normalizedPhase}${normalizedPhase === 'acceptance' ? ' --input <requirements.md>' : ''} --dry-run`,
  };
}

function preparePlannerApprovalProjection(projectRoot, phase, version, options = {}) {
  const normalizedPhase = normalizePhase(phase);
  assertNoPendingDigestBoundApproval(projectRoot, normalizedPhase);
  assertNoPendingDraftProjection(projectRoot, normalizedPhase);
  const root = approvalRoot(projectRoot, normalizedPhase);
  ensureDir(root);
  if (!version) {
    throw new Error(formatError(`${normalizedPhase} approval requires a concrete draft version. Use --version <n>.`));
  }
  const nowValue = options.now || new Date();
  const now = nowValue instanceof Date ? nowValue.toISOString() : new Date(nowValue).toISOString();
  const current = readPhaseApproval(projectRoot, normalizedPhase).meta || {};
  const latestVersion = latestDraftVersion(current);
  const selectedDraft = findDraftVersion(current, version);
  if (!selectedDraft) {
    throw new Error(formatError(`missing ${normalizedPhase} draft version ${version}`));
  }
  const hasRunLifecycle = (selectedDraft.lifecycle || []).some((event) => event?.run_id);
  const legacyRunHistorical = options.allowHistorical === true
    && options.runId
    && !selectedDraft.run_id
    && !hasRunLifecycle;
  if (options.allowHistorical !== true && (!latestVersion || Number(selectedDraft.version) !== latestVersion)) {
    throw new Error(formatError(`${normalizedPhase} draft version ${version} is not current; latest draft version is ${latestVersion}. Approve the latest version or revise again.`));
  }
  if ((!latestVersion || Number(selectedDraft.version) !== latestVersion) && !legacyRunHistorical) {
    throw new Error(formatError(`${normalizedPhase} draft version ${version} is not selected current; explicitly select or restore it before approval.`));
  }
  if (selectedDraft.integrity && selectedDraft.integrity.status !== 'preserved') {
    throw new Error(formatError(`${normalizedPhase} draft version ${version} is not eligible because integrity is ${selectedDraft.integrity.status}`));
  }
  const artifact = readProjectFileBytes(projectRoot, selectedDraft.path, `${normalizedPhase} draft artifact`);
  if (selectedDraft.artifact_sha256 && artifact.sha256 !== selectedDraft.artifact_sha256) {
    throw new Error(formatError(`${normalizedPhase} draft artifact digest no longer matches version ${version}`));
  }
  const inputPath = selectedDraft.input_path || selectedDraft.source_file || '';
  const input = readProjectFileBytes(projectRoot, inputPath, `${normalizedPhase} approval input`);
  if (selectedDraft.input_sha256 && input.sha256 !== selectedDraft.input_sha256) {
    throw new Error(formatError(`${normalizedPhase} approval input digest no longer matches draft version ${version}`));
  }
  if (options.requireDigestBindings === true
      && (!selectedDraft.artifact_sha256 || !selectedDraft.input_path || !selectedDraft.input_sha256)) {
    throw new Error(formatError(`${normalizedPhase} draft version ${version} lacks immutable v58 digest bindings`));
  }
  if (selectedDraft.lifecycle_state === 'rejected'
      || selectedDraft.selection_verification === 'unverified') {
    throw new Error(formatError(`${normalizedPhase} draft version ${version} requires explicit valid restore before approval`));
  }
  if (legacyRunHistorical) {
    assertDraftOwnedByRun(projectRoot, normalizedPhase, selectedDraft, options.runId);
  } else {
    assertSelectedDraftUsable(projectRoot, normalizedPhase, current, { runId: options.runId });
  }
  const decision = options.decision || 'approved';
  if (!['approved', 'approved-with-conditions'].includes(decision)) {
    throw new Error(formatError(`unsupported planner approval lifecycle decision '${decision}'`));
  }
  if (options.finalProjection === true
      && (!options.decisionId || !options.decisionSha256)) {
    throw new Error(formatError(`${normalizedPhase} final approval lifecycle projection requires exact decision identity`));
  }
  const filePath = approvalApprovedPath(projectRoot, normalizedPhase);
  const metaPath = approvalMetaPath(projectRoot, normalizedPhase);
  const drafts = normalizeDrafts(current).map((draft) => (
    Number(draft.version) === Number(selectedDraft.version)
      ? appendLifecycle(draft, decision, now, `approve-${normalizedPhase}-${version}`, {
          run_id: options.runId || draft.run_id || null,
          decision_id: options.decisionId || null,
          decision_sha256: options.decisionSha256 || null,
          verification: 'verified',
        })
      : draft
  ));
  const currentDraft = drafts.find((draft) => Number(draft.version) === Number(latestVersion));
  const nextMeta = {
    ...current,
    phase: normalizedPhase,
    drafts,
    draft: current.draft && currentDraft
      ? { ...currentDraft, path: current.draft.path }
      : null,
    approved: decision === 'approved'
      ? {
          phase: normalizedPhase,
          source_file: selectedDraft.path,
          path: toRelativePosix(projectRoot, filePath),
          version: Number(selectedDraft.version),
          created_at: now,
          approved_at: now,
          artifact_sha256: artifact.sha256,
          input_path: input.path,
          input_sha256: input.sha256,
          raw_artifact_path: options.rawArtifactPath || selectedDraft.raw_artifact_path || null,
          output_source: options.outputSource || selectedDraft.output_source || null,
          input_compaction: options.inputCompaction || selectedDraft.input_compaction || null,
        }
      : current.approved || null,
    last_operation: {
      operation_id: `approve-${normalizedPhase}-${version}`,
      kind: `project-${decision}`,
      version: Number(selectedDraft.version),
      run_id: options.runId || selectedDraft.run_id || null,
      evidence_id: options.decisionId || null,
      evidence_sha256: options.decisionSha256 || null,
      artifact_sha256: artifact.sha256,
      input_sha256: input.sha256,
      at: now,
      verification: 'verified',
    },
  };
  return {
    phase: normalizedPhase,
    kind: decision,
    version: Number(selectedDraft.version),
    createdAt: now,
    filePath,
    metaPath,
    artifact,
    input,
    selectedDraft,
    nextMeta,
    targets: [
      ...(decision === 'approved'
        ? [{ role: 'legacy-approved', path: filePath, contents: artifact.bytes }]
        : []),
      { role: 'legacy-meta', path: metaPath, contents: Buffer.from(`${JSON.stringify(nextMeta, null, 2)}\n`, 'utf8') },
    ],
  };
}

function commitPlannerApprovalProjection(projection) {
  for (const target of projection.targets) {
    writeFileAtomic(target.path, target.contents);
  }
  return projection;
}

function writeApprovalArtifacts(projectRoot, phase, kind, sourceFile, contents, options = {}) {
  const normalizedPhase = normalizePhase(phase);
  assertNoPendingDigestBoundApproval(projectRoot, normalizedPhase);
  assertNoPendingDraftProjection(projectRoot, normalizedPhase);
  if (kind === 'approved') {
    return commitPlannerApprovalProjection(preparePlannerApprovalProjection(
      projectRoot,
      normalizedPhase,
      options.version,
      options,
    ));
  }

  const root = approvalRoot(projectRoot, normalizedPhase);
  ensureDir(root);
  const filePath = approvalDraftPath(projectRoot, normalizedPhase);
  const nowValue = options.now || new Date();
  const now = nowValue instanceof Date ? nowValue.toISOString() : new Date(nowValue).toISOString();
  const current = readPhaseApproval(projectRoot, normalizedPhase).meta || {};
  const currentDrafts = normalizeDrafts(current);
  const finalContents = Buffer.from(`${contents}`, 'utf8');
  if (finalContents.length > 4 * 1024 * 1024) {
    const error = new Error(formatError('planner draft exceeds the 4 MiB input limit'));
    error.code = 'VALIDATION_FAILED';
    throw error;
  }
  const version = nextDraftVersion(current);
  const versionPath = approvalDraftVersionPath(projectRoot, normalizedPhase, version);
  const sourcePath = toRelativePosix(projectRoot, path.resolve(projectRoot, sourceFile));
  let inputBinding = readProjectFileBytes(projectRoot, sourceFile, `${normalizedPhase} planner input`);
  const inputBindingRunId = options.runId || options.bindingRunId;
  if (inputBindingRunId && normalizedPhase === 'acceptance') {
    const { readAiRun, runRequirementPath } = require('./ai/run-state');
    const run = readAiRun(projectRoot, inputBindingRunId);
    const canonicalPath = toRelativePosix(projectRoot, runRequirementPath(projectRoot, inputBindingRunId));
    if (!run || run.status === 'closed' || run.requirement?.path !== canonicalPath) {
      throw approvalBindingError(`acceptance draft cannot bind to closed, missing, or noncanonical run '${inputBindingRunId}'`, {
        phase: normalizedPhase,
        run_id: inputBindingRunId,
      });
    }
    const canonicalInput = readProjectFileBytes(projectRoot, canonicalPath, 'canonical run requirement input');
    if (options.revisionFeedback !== true && canonicalInput.sha256 !== inputBinding.sha256) {
      throw approvalBindingError(`acceptance planner input does not match canonical run '${inputBindingRunId}' requirement`, {
        phase: normalizedPhase,
        run_id: inputBindingRunId,
        mismatch: 'input_sha256',
      });
    }
    inputBinding = canonicalInput;
  }
  const operationId = `draft-${crypto.randomUUID()}`;
  const selectedVersion = latestDraftVersion(current);
  const selectedRecord = selectedVersion ? findDraftVersion(current, selectedVersion) : null;
  let selectedContents = null;
  if (selectedRecord) {
    const selectedArtifact = readProjectFileBytes(projectRoot, selectedRecord.path, `${normalizedPhase} selected draft artifact`);
    if (selectedRecord.artifact_sha256 && selectedRecord.artifact_sha256 !== selectedArtifact.sha256) {
      const error = new Error(formatError(`${normalizedPhase} selected draft artifact digest no longer matches version ${selectedVersion}`));
      error.code = 'RECOVERY_REQUIRED';
      throw error;
    }
    selectedContents = selectedArtifact.bytes.toString('utf8');
  }
  const comparison = compareDraftStructure(selectedContents, finalContents.toString('utf8'));
  const selected = comparison.status === 'preserved';
  const lifecycleState = comparison.status === 'corrupted' ? 'corrupted' : selected ? 'current' : 'draft';
  const draftRecord = {
    version,
    phase: normalizedPhase,
    run_id: options.runId || null,
    source_file: sourcePath,
    input_path: inputBinding.path,
    input_sha256: inputBinding.sha256,
    path: toRelativePosix(projectRoot, versionPath),
    artifact_sha256: sha256Bytes(finalContents),
    created_at: now,
    raw_artifact_path: options.rawArtifactPath || null,
    output_source: options.outputSource || null,
    input_compaction: options.inputCompaction || null,
    integrity: {
      schema_version: DRAFT_INTEGRITY_VERSION,
      status: comparison.status,
      compared_to_version: selectedVersion,
      format: comparison.candidate.format,
      collections: comparison.candidate.collections,
      identities: comparison.candidate.identities,
      references: comparison.candidate.references,
      preserved_ids: comparison.preserved_ids,
      added_ids: comparison.added_ids,
      removed_ids: comparison.removed_ids,
      diagnostics: comparison.diagnostics,
    },
    lifecycle_state: lifecycleState,
    lifecycle: [
      { state: 'draft', at: now, operation_id: operationId, ...(options.runId ? { run_id: options.runId } : {}) },
      ...(selected ? [{ state: 'current', at: now, operation_id: operationId, ...(options.runId ? { run_id: options.runId } : {}) }] : []),
      ...(comparison.status === 'corrupted' ? [{ state: 'corrupted', at: now, operation_id: operationId, ...(options.runId ? { run_id: options.runId } : {}) }] : []),
    ],
  };
  const priorDrafts = selected
    ? currentDrafts.map((draft) => (
        Number(draft.version) === selectedVersion
          ? appendLifecycle(draft, 'superseded', now, operationId)
          : draft
      ))
    : currentDrafts;
  const nextMeta = {
    ...current,
    phase: normalizedPhase,
    draft_integrity_version: DRAFT_INTEGRITY_VERSION,
    selected_version: selected ? version : selectedVersion,
    drafts: priorDrafts.concat(draftRecord),
    draft: selected ? { ...draftRecord, path: toRelativePosix(projectRoot, filePath) } : current.draft || null,
    approved: current.approved || null,
    last_operation: {
      operation_id: operationId,
      kind: 'save-candidate',
      version,
      selected,
      integrity_status: comparison.status,
      at: now,
      durability: process.platform === 'win32' ? 'best-effort' : 'fsync',
    },
  };

  writeFileImmutable(versionPath, finalContents);
  if (typeof options.faultInjector === 'function') options.faultInjector('after-candidate');
  if (selected) {
    commitDraftIntegrityProjection({
      projectRoot,
      phaseRoot: root,
      phase: normalizedPhase,
      selectedVersion: version,
      metadataBytes: Buffer.from(`${JSON.stringify(nextMeta, null, 2)}\n`, 'utf8'),
      draftBytes: finalContents,
      operationId,
      faultInjector: options.faultInjector,
    });
  } else {
    writeFileDurable(approvalMetaPath(projectRoot, normalizedPhase), `${JSON.stringify(nextMeta, null, 2)}\n`);
  }
  return {
    phase: normalizedPhase,
    kind,
    filePath,
    metaPath: approvalMetaPath(projectRoot, normalizedPhase),
    createdAt: now,
    version,
    versionPath,
    selected,
    lifecycleState,
    integrity: draftRecord.integrity,
  };
}

function appendLifecycle(draft, state, at, operationId, details = {}) {
  const lifecycle = Array.isArray(draft.lifecycle) ? draft.lifecycle : [];
  const last = lifecycle.at(-1);
  const detailKeys = ['run_id', 'actor_id', 'decision_id', 'decision_sha256', 'evidence_sha256', 'reason', 'verification'];
  const exactRepeat = detailKeys.every((key) => !details[key] || last?.[key] === details[key]);
  if (draft.lifecycle_state === state && last?.state === state
      && exactRepeat && !details.force) return draft;
  return {
    ...draft,
    lifecycle_state: state,
    lifecycle: lifecycle.concat({
      state,
      at,
      operation_id: operationId,
      ...(details.run_id ? { run_id: details.run_id } : {}),
      ...(details.actor_id ? { actor_id: details.actor_id } : {}),
      ...(details.decision_id ? { decision_id: details.decision_id } : {}),
      ...(details.decision_sha256 ? { decision_sha256: details.decision_sha256 } : {}),
      ...(details.evidence_sha256 ? { evidence_sha256: details.evidence_sha256 } : {}),
      ...(details.reason ? { reason: details.reason } : {}),
      ...(details.verification ? { verification: details.verification } : {}),
    }),
  };
}

function recoveryAuthorization(options, action) {
  const authorization = options.authorization;
  const actorId = String(authorization?.evidence?.actor_id || authorization?.actor_id || '').trim();
  if (authorization?.authorized !== true || !actorId) {
    const error = new Error(formatError(`POLICY_DENIED: ${action} requires verified authorization`));
    error.code = 'POLICY_DENIED';
    error.details = { action, authorized: false };
    throw error;
  }
  return { actorId, authorization };
}

function lockDate(value) {
  if (!value) return undefined;
  return value instanceof Date ? value : new Date(value);
}

function comparePlannerDraftVersions(projectRoot, phase, leftVersion, rightVersion, options = {}) {
  const normalizedPhase = normalizePhase(phase);
  return withPlannerApprovalLock(
    projectRoot,
    normalizedPhase,
    { command: `compare ${normalizedPhase} planner drafts`, now: lockDate(options.now) },
    () => {
      assertNoPendingDigestBoundApproval(projectRoot, normalizedPhase);
      assertNoPendingDraftProjection(projectRoot, normalizedPhase);
      const meta = readPhaseApproval(projectRoot, normalizedPhase).meta || {};
      const left = findDraftVersion(meta, leftVersion);
      const right = findDraftVersion(meta, rightVersion);
      if (!left || !right) {
        throw new Error(formatError(`missing ${normalizedPhase} draft version ${!left ? leftVersion : rightVersion}`));
      }
      const leftBound = assertDraftArtifactAndInput(projectRoot, normalizedPhase, left);
      const rightBound = assertDraftArtifactAndInput(projectRoot, normalizedPhase, right);
      if (options.runId) {
        assertDraftOwnedByRun(projectRoot, normalizedPhase, left, options.runId);
        assertDraftOwnedByRun(projectRoot, normalizedPhase, right, options.runId);
      }
      return {
        schema_version: DRAFT_INTEGRITY_VERSION,
        phase: normalizedPhase,
        left_version: Number(left.version),
        right_version: Number(right.version),
        left_artifact_sha256: leftBound.artifact.sha256,
        right_artifact_sha256: rightBound.artifact.sha256,
        left_input_sha256: leftBound.input.sha256,
        right_input_sha256: rightBound.input.sha256,
        same_input: leftBound.input.sha256 === rightBound.input.sha256,
        comparison: compareDraftStructure(
          leftBound.artifact.bytes.toString('utf8'),
          rightBound.artifact.bytes.toString('utf8'),
          { removals: options.removals || [] },
        ),
      };
    },
  );
}

function mutatePlannerDraftSelectionLocked(projectRoot, phase, version, operation, options = {}) {
  assertNoPendingDigestBoundApproval(projectRoot, phase);
  assertNoPendingDraftProjection(projectRoot, phase);
  const report = readPhaseApproval(projectRoot, phase);
  const current = report.meta || {};
  const target = findDraftVersion(current, version);
  if (!target) throw new Error(formatError(`missing ${phase} draft version ${version}`));
  const selectedVersion = latestDraftVersion(current);
  if (operation === 'reject' && Number(target.version) !== Number(selectedVersion)) {
    throw new Error(formatError(`${phase} draft version ${version} is not selected current and cannot be rejected`));
  }
  if (operation === 'select' && target.lifecycle_state === 'rejected') {
    throw new Error(formatError(`${phase} draft version ${version} is rejected; use explicit restore after validating its current input`));
  }
  if (target.integrity?.status === 'corrupted') {
    throw new Error(formatError(`${phase} draft version ${version} is corrupted and cannot be ${operation === 'reject' ? 'used' : 'selected'}`));
  }
  const { actorId } = recoveryAuthorization(options, `${operation} ${phase} planner draft`);
  const bound = assertDraftArtifactAndInput(projectRoot, phase, target);
  assertDraftOwnedByRun(projectRoot, phase, target, options.runId);
  const unsupported = target.integrity?.status === 'unsupported';
  if (unsupported && operation !== 'reject') {
    if (options.acknowledgeUnverified !== true || !String(options.reason || '').trim()) {
      throw new Error(formatError(`${phase} draft version ${version} has unsupported structure; selection requires acknowledgeUnverified and a reason`));
    }
  }
  const nowValue = options.now || new Date();
  const now = nowValue instanceof Date ? nowValue.toISOString() : new Date(nowValue).toISOString();
  const operationId = options.operationId || `draft-${operation}-${crypto.randomUUID()}`;
  const nextState = operation === 'reject' ? 'rejected' : 'current';
  const verification = unsupported ? 'unverified' : 'verified';
  const drafts = normalizeDrafts(current).map((draft) => {
    if (Number(draft.version) === Number(target.version)) {
      const next = appendLifecycle(draft, nextState, now, operationId, {
        actor_id: actorId,
        force: operation === 'restore',
        reason: String(options.reason || '').trim() || undefined,
        run_id: options.runId || draft.run_id || null,
        verification,
      });
      return {
        ...next,
        selection_verification: operation === 'reject'
          ? draft.selection_verification || verification
          : verification,
        ...(unsupported && operation !== 'reject' ? {
          acknowledgement: {
            actor_id: actorId,
            reason: String(options.reason).trim(),
            at: now,
            operation_id: operationId,
            verification: 'unverified',
          },
        } : {}),
      };
    }
    if (operation !== 'reject' && Number(draft.version) === Number(selectedVersion)) {
      return appendLifecycle(draft, 'superseded', now, operationId, {
        actor_id: actorId,
        run_id: options.runId || draft.run_id || null,
      });
    }
    return draft;
  });
  const selected = drafts.find((draft) => Number(draft.version) === Number(target.version));
  const nextMeta = {
    ...current,
    phase,
    draft_integrity_version: DRAFT_INTEGRITY_VERSION,
    selected_version: Number(target.version),
    drafts,
    draft: {
      ...selected,
      path: toRelativePosix(projectRoot, approvalDraftPath(projectRoot, phase)),
    },
    approved: current.approved || null,
    last_operation: {
      operation_id: operationId,
      kind: operation,
      version: Number(target.version),
      actor_id: actorId,
      run_id: options.runId || null,
      at: now,
      verification,
      history_preserved: true,
    },
  };
  commitDraftIntegrityProjection({
    projectRoot,
    phaseRoot: approvalRoot(projectRoot, phase),
    phase,
    selectedVersion: Number(target.version),
    metadataBytes: Buffer.from(`${JSON.stringify(nextMeta, null, 2)}\n`, 'utf8'),
    draftBytes: bound.artifact.bytes,
    operationId,
    faultInjector: options.faultInjector,
  });
  return {
    schema_version: DRAFT_INTEGRITY_VERSION,
    phase,
    operation,
    operation_id: operationId,
    selected_version: Number(target.version),
    lifecycle_state: nextState,
    verification,
    history_preserved: true,
  };
}

function mutatePlannerDraftSelection(projectRoot, phase, version, operation, options = {}) {
  const normalizedPhase = normalizePhase(phase);
  assertProjectWriterAllowed(projectRoot, { action: `${operation} ${normalizedPhase} planner draft` });
  const apply = () => withPlannerApprovalLock(
    projectRoot,
    normalizedPhase,
    { command: `${operation} ${normalizedPhase} planner draft`, now: lockDate(options.now) },
    () => {
      assertProjectWriterAllowed(projectRoot, { action: `${operation} ${normalizedPhase} planner draft` });
      return mutatePlannerDraftSelectionLocked(projectRoot, normalizedPhase, version, operation, options);
    },
  );
  if (!options.runId) return apply();
  const { withAiRunLock } = require('./ai/run-state');
  return withAiRunLock(
    projectRoot,
    options.runId,
    { command: `${operation} ${normalizedPhase} planner draft` },
    apply,
  );
}

function selectPlannerDraftVersion(projectRoot, phase, version, options = {}) {
  return mutatePlannerDraftSelection(projectRoot, phase, version, 'select', options);
}

function restorePlannerDraftVersion(projectRoot, phase, version, options = {}) {
  return mutatePlannerDraftSelection(projectRoot, phase, version, 'restore', options);
}

function rejectPlannerDraftVersion(projectRoot, phase, version, options = {}) {
  return mutatePlannerDraftSelection(projectRoot, phase, version, 'reject', options);
}

function projectPlannerDraftLifecycle(projectRoot, phase, version, state, options = {}) {
  const normalizedPhase = normalizePhase(phase);
  if (!['reviewed', 'approved-with-conditions'].includes(state)) {
    throw new Error(formatError(`unsupported external planner lifecycle projection '${state}'`));
  }
  const apply = () => withPlannerApprovalLock(
    projectRoot,
    normalizedPhase,
    { command: `project ${normalizedPhase} ${state}`, now: lockDate(options.now) },
    () => {
      assertNoPendingDigestBoundApproval(projectRoot, normalizedPhase);
      assertNoPendingDraftProjection(projectRoot, normalizedPhase);
      const current = readPhaseApproval(projectRoot, normalizedPhase).meta || {};
      const target = findDraftVersion(current, version);
      if (!target || Number(latestDraftVersion(current)) !== Number(version)) {
        throw approvalBindingError(`${state} projection must target the selected current ${normalizedPhase} draft`, {
          phase: normalizedPhase,
          version: Number(version) || null,
        });
      }
      const bound = assertSelectedDraftUsable(projectRoot, normalizedPhase, current);
      assertDraftArtifactOwnedByRun(projectRoot, normalizedPhase, target, options.runId);
      const nowValue = options.now || new Date();
      const now = nowValue instanceof Date ? nowValue.toISOString() : new Date(nowValue).toISOString();
      const operationId = options.operationId || `draft-${state}-${crypto.randomUUID()}`;
      const drafts = normalizeDrafts(current).map((draft) => (
        Number(draft.version) === Number(version)
          ? appendLifecycle(draft, state, now, operationId, {
              run_id: options.runId || draft.run_id || null,
              decision_id: options.decisionId || options.reviewId || null,
              decision_sha256: options.decisionSha256 || null,
              evidence_sha256: options.evidenceSha256 || null,
              verification: 'verified',
            })
          : draft
      ));
      const selected = drafts.find((draft) => Number(draft.version) === Number(version));
      const nextMeta = {
        ...current,
        drafts,
        draft: { ...selected, path: toRelativePosix(projectRoot, approvalDraftPath(projectRoot, normalizedPhase)) },
        last_operation: {
          operation_id: operationId,
          kind: `project-${state}`,
          version: Number(version),
          run_id: options.runId || null,
          evidence_id: options.decisionId || options.reviewId || null,
          evidence_sha256: options.decisionSha256 || options.evidenceSha256 || null,
          artifact_sha256: bound.artifact.sha256,
          input_sha256: bound.input.sha256,
          at: now,
          verification: 'verified',
        },
      };
      commitDraftIntegrityProjection({
        projectRoot,
        phaseRoot: approvalRoot(projectRoot, normalizedPhase),
        phase: normalizedPhase,
        selectedVersion: Number(version),
        metadataBytes: Buffer.from(`${JSON.stringify(nextMeta, null, 2)}\n`, 'utf8'),
        draftBytes: bound.artifact.bytes,
        operationId,
        faultInjector: options.faultInjector,
      });
      return nextMeta;
    },
  );
  if (options.runLocked === true || !options.runId) return apply();
  const { withAiRunLock } = require('./ai/run-state');
  return withAiRunLock(projectRoot, options.runId, { command: `project ${normalizedPhase} ${state}` }, apply);
}

function savePlannerDraft(projectRoot, phase, sourceFile, contents, options = {}) {
  assertProjectWriterAllowed(projectRoot, { action: `save ${phase} planner draft` });
  if (!options.runId && options.requireDigestBindings === true && normalizePhase(phase) === 'acceptance') {
    const { listAiRuns } = require('./ai/run-state');
    const activeRuns = listAiRuns(projectRoot).filter((run) => run.status !== 'closed');
    if (activeRuns.length > 0) {
      throw approvalBindingError('digest-bound acceptance draft save requires an explicit run id', {
        phase: 'acceptance',
        mismatch: 'run_id',
      });
    }
  }
  return withPlannerApprovalLock(
    projectRoot,
    phase,
    { command: `save ${phase} planner draft`, now: options.now },
    () => {
      assertProjectWriterAllowed(projectRoot, { action: `save ${phase} planner draft` });
      return writeApprovalArtifacts(projectRoot, phase, 'draft', sourceFile, contents, options);
    },
  );
}

function approvePlannerPhase(projectRoot, phase, sourceFile, contents, options = {}) {
  if (options.decision === 'approved-with-conditions') {
    throw new Error(formatError('approved-with-conditions must use the canonical run governance store and cannot create legacy approved.md'));
  }
  assertProjectWriterAllowed(projectRoot, { action: `approve ${phase} planner phase` });
  return withPlannerApprovalLock(
    projectRoot,
    phase,
    { command: `approve ${phase} planner phase`, now: options.now },
    () => {
      assertProjectWriterAllowed(projectRoot, { action: `approve ${phase} planner phase` });
      return writeApprovalArtifacts(projectRoot, phase, 'approved', sourceFile, contents, options);
    },
  );
}

function recoverDraftIntegrityCommit(projectRoot, phase, options = {}) {
  const normalizedPhase = normalizePhase(phase);
  assertProjectWriterAllowed(projectRoot, { action: `recover ${normalizedPhase} draft integrity commit` });
  return withPlannerApprovalLock(
    projectRoot,
    normalizedPhase,
    { command: `recover ${normalizedPhase} draft integrity commit`, now: options.now },
    () => {
      assertProjectWriterAllowed(projectRoot, { action: `recover ${normalizedPhase} draft integrity commit` });
      assertNoPendingDigestBoundApproval(projectRoot, normalizedPhase);
      return recoverDraftIntegrityProjection({
        projectRoot,
        phaseRoot: approvalRoot(projectRoot, normalizedPhase),
        phase: normalizedPhase,
      });
    },
  );
}

function resolveApprovedPlannerInput(projectRoot, phase, explicitInput) {
  const normalizedPhase = normalizePhase(phase);
  const dependencyPhase = APPROVAL_DEPENDENCIES[normalizedPhase];

  if (!dependencyPhase) {
    return {
      phase: normalizedPhase,
      inputPath: explicitInput || null,
      approval: null,
    };
  }

  const approval = readPhaseApproval(projectRoot, dependencyPhase);
  if (approval.status !== 'approved') {
    throw new Error(formatError(`ai plan phase '${normalizedPhase}' requires approved ${dependencyPhase} input; current status: ${approval.status}. Run \`npx create-quiver ai approve --phase ${dependencyPhase} --version <n>\`.`));
  }
  assertSelectedDraftUsable(projectRoot, dependencyPhase, approval.meta || {});

  const approvedPath = approval.approved?.path ? path.resolve(projectRoot, approval.approved.path) : '';
  const approvedSource = approval.meta?.approved?.source_file ? path.resolve(projectRoot, approval.meta.approved.source_file) : '';

  if (!explicitInput) {
    return {
      phase: normalizedPhase,
      inputPath: approval.approved.path,
      approval,
    };
  }

  const resolvedExplicit = path.resolve(projectRoot, explicitInput);
  const matchesApprovedArtifact = approvedPath && resolvedExplicit === approvedPath;
  const matchesApprovedSource = approvedSource && resolvedExplicit === approvedSource;

  if (!matchesApprovedArtifact && !matchesApprovedSource) {
    throw new Error(formatError(`ai plan phase '${normalizedPhase}' requires approved ${dependencyPhase} input; '${explicitInput}' is not the approved source.`));
  }

  return {
    phase: normalizedPhase,
    inputPath: approval.approved.path,
    approval,
  };
}

function summarizePlannerApproval(projectRoot, phase) {
  const report = readPhaseApproval(projectRoot, phase);
  const lines = [`Phase: ${report.phase}`, `Status: ${report.status}`];

  if (report.draft) {
    const version = report.meta?.draft?.version ? ` v${report.meta.draft.version}` : '';
    lines.push(`Draft${version}: ${report.draft.path}`);
  }
  const drafts = normalizeDrafts(report.meta);
  if (drafts.length > 0) {
    lines.push('Draft history:');
    for (const draft of drafts) {
      lines.push(`- v${draft.version}: ${draft.path}`);
    }
  }
  if (report.approved) {
    const version = report.meta?.approved?.version ? ` v${report.meta.approved.version}` : '';
    lines.push(`Approved${version}: ${report.approved.path}`);
  }
  if (report.meta?.approved?.source_file) {
    lines.push(`Source file: ${report.meta.approved.source_file}`);
  } else if (report.meta?.draft?.source_file) {
    lines.push(`Source file: ${report.meta.draft.source_file}`);
  }

  return `${lines.join('\n')}\n`;
}

module.exports = {
  APPROVAL_DEPENDENCIES,
  PLANNER_APPROVAL_PHASES,
  assertNoPendingDigestBoundApproval,
  approvalApprovedPath,
  approvalDraftPath,
  approvalDraftsDir,
  approvalDraftVersionPath,
  approvalMetaPath,
  approvePlannerPhase,
  commitPlannerApprovalProjection,
  findDraftVersion,
  latestDraftVersion,
  buildPlannerApprovalCandidates,
  comparePlannerDraftVersions,
  normalizePhase,
  readPhaseApproval,
  readProjectFileBytes,
  rejectPlannerDraftVersion,
  recoverDraftIntegrityCommit,
  renderApprovalStatus,
  resolveApprovedPlannerInput,
  restorePlannerDraftVersion,
  savePlannerDraft,
  selectPlannerDraftVersion,
  assertSelectedDraftUsable,
  preparePlannerApprovalProjection,
  projectPlannerDraftLifecycle,
  plannerApprovalLockName,
  sha256Bytes,
  summarizePlannerApproval,
  withPlannerApprovalLock,
};
