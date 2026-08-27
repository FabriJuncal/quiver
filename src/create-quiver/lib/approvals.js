const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { redactSecrets, truncateText } = require('./evidence');
const { quiverInternalPaths } = require('./init-layout');
const { withLockSync } = require('./locks');

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
  return Array.isArray(meta?.drafts) ? meta.drafts.filter((item) => item && typeof item === 'object') : [];
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
  const draftVersion = Number(meta?.draft?.version || 0);
  if (Number.isInteger(draftVersion) && draftVersion > 0) {
    return draftVersion;
  }

  const versions = normalizeDrafts(meta)
    .map((item) => Number(item.version))
    .filter((value) => Number.isInteger(value) && value > 0);
  return versions.length > 0 ? Math.max(...versions) : null;
}

function readPhaseApproval(projectRoot, phase) {
  const normalizedPhase = normalizePhase(phase);
  const draftPath = approvalDraftPath(projectRoot, normalizedPhase);
  const approvedPath = approvalApprovedPath(projectRoot, normalizedPhase);
  const metaPath = approvalMetaPath(projectRoot, normalizedPhase);
  const capture = () => [metaPath, draftPath, approvedPath]
    .map((filePath) => (fs.existsSync(filePath) ? fs.readFileSync(filePath) : null));
  assertNoPendingDigestBoundApproval(projectRoot, normalizedPhase);
  const first = capture();
  assertNoPendingDigestBoundApproval(projectRoot, normalizedPhase);
  const second = capture();
  assertNoPendingDigestBoundApproval(projectRoot, normalizedPhase);
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
  const stale = Boolean(
    approvedSource
    && approvedSource.source_file
    && !fs.existsSync(path.resolve(projectRoot, approvedSource.source_file))
    && !approvedSource.source_file.startsWith('.quiver/approvals/'),
  ) || Boolean(
    draftSource?.created_at
    && approvedSource?.approved_at
    && new Date(draftSource.created_at).getTime() > new Date(approvedSource.approved_at).getTime(),
  ) || Boolean(
    draftSource?.version
    && approvedSource?.version
    && Number(draftSource.version) > Number(approvedSource.version),
  );

  let status = 'missing';
  if (approved) {
    status = stale ? 'stale' : 'approved';
  } else if (draft) {
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
  return safePreview(fs.readFileSync(resolved, 'utf8'));
}

function buildApprovalCandidate(projectRoot, phase, draft, latestVersion, report) {
  const version = Number(draft.version || 0) || null;
  const isLatest = Boolean(version && latestVersion && version === latestVersion);
  const artifactExists = Boolean(draft.path && fs.existsSync(path.resolve(projectRoot, draft.path)));
  const preview = readCandidatePreview(projectRoot, draft);
  const approvable = isLatest && artifactExists && (report.status === 'draft' || report.status === 'stale' || report.status === 'approved');
  const nextCommand = version
    ? `npx create-quiver ai approve --phase ${phase} --version ${version}`
    : `npx create-quiver ai approve --phase ${phase} --version <n>`;

  return {
    phase,
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
    current: isLatest,
    latest: isLatest,
    recommended: approvable,
    approvable,
    blocked: !approvable,
    status: approvable ? 'approvable' : isLatest ? 'blocked' : 'history',
    reason: approvable
      ? 'latest draft is eligible for approval'
      : isLatest
        ? 'latest draft artifact is missing or not eligible'
        : `not current; latest draft version is ${latestVersion || 'unknown'}`,
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
  const root = approvalRoot(projectRoot, normalizedPhase);
  ensureDir(root);
  if (!version) {
    throw new Error(formatError(`${normalizedPhase} approval requires a concrete draft version. Use --version <n>.`));
  }
  const nowValue = options.now || new Date();
  const now = nowValue instanceof Date ? nowValue.toISOString() : new Date(nowValue).toISOString();
  const current = readApprovalMeta(projectRoot, normalizedPhase) || {};
  const latestVersion = latestDraftVersion(current);
  const selectedDraft = findDraftVersion(current, version);
  if (!selectedDraft) {
    throw new Error(formatError(`missing ${normalizedPhase} draft version ${version}`));
  }
  if (options.allowHistorical !== true && latestVersion && Number(selectedDraft.version) !== latestVersion) {
    throw new Error(formatError(`${normalizedPhase} draft version ${version} is not current; latest draft version is ${latestVersion}. Approve the latest version or revise again.`));
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
  const filePath = approvalApprovedPath(projectRoot, normalizedPhase);
  const metaPath = approvalMetaPath(projectRoot, normalizedPhase);
  const nextMeta = {
    phase: normalizedPhase,
    drafts: normalizeDrafts(current),
    draft: current.draft || null,
    approved: {
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
    },
  };
  return {
    phase: normalizedPhase,
    kind: 'approved',
    version: Number(selectedDraft.version),
    createdAt: now,
    filePath,
    metaPath,
    artifact,
    input,
    selectedDraft,
    nextMeta,
    targets: [
      { path: filePath, contents: artifact.bytes },
      { path: metaPath, contents: Buffer.from(`${JSON.stringify(nextMeta, null, 2)}\n`, 'utf8') },
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
  const current = readApprovalMeta(projectRoot, normalizedPhase) || {};
  const nextMeta = {
    phase: normalizedPhase,
    drafts: normalizeDrafts(current),
    draft: current.draft || null,
    approved: current.approved || null,
  };
  const finalContents = Buffer.from(`${contents}`, 'utf8');
  const version = nextDraftVersion(current);
  const versionPath = approvalDraftVersionPath(projectRoot, normalizedPhase, version);
  const sourcePath = toRelativePosix(projectRoot, path.resolve(projectRoot, sourceFile));
  let inputBinding = { path: sourcePath, sha256: null };
  try {
    inputBinding = readProjectFileBytes(projectRoot, sourceFile, `${normalizedPhase} planner input`);
  } catch (error) {
    if (options.requireDigestBindings === true) throw error;
  }
  const draftRecord = {
    version,
    phase: normalizedPhase,
    source_file: sourcePath,
    input_path: inputBinding.path,
    input_sha256: inputBinding.sha256,
    path: toRelativePosix(projectRoot, versionPath),
    artifact_sha256: sha256Bytes(finalContents),
    created_at: now,
    raw_artifact_path: options.rawArtifactPath || null,
    output_source: options.outputSource || null,
    input_compaction: options.inputCompaction || null,
  };
  nextMeta.drafts = nextMeta.drafts.concat(draftRecord);
  nextMeta.draft = {
    ...draftRecord,
    path: toRelativePosix(projectRoot, filePath),
  };

  writeFileAtomic(versionPath, finalContents);
  writeFileAtomic(filePath, finalContents);
  writeFileAtomic(approvalMetaPath(projectRoot, normalizedPhase), `${JSON.stringify(nextMeta, null, 2)}\n`);
  return {
    phase: normalizedPhase,
    kind,
    filePath,
    metaPath: approvalMetaPath(projectRoot, normalizedPhase),
    createdAt: now,
    version,
  };
}

function savePlannerDraft(projectRoot, phase, sourceFile, contents, options = {}) {
  return withPlannerApprovalLock(
    projectRoot,
    phase,
    { command: `save ${phase} planner draft`, now: options.now },
    () => writeApprovalArtifacts(projectRoot, phase, 'draft', sourceFile, contents, options),
  );
}

function approvePlannerPhase(projectRoot, phase, sourceFile, contents, options = {}) {
  if (options.decision === 'approved-with-conditions') {
    throw new Error(formatError('approved-with-conditions must use the canonical run governance store and cannot create legacy approved.md'));
  }
  return withPlannerApprovalLock(
    projectRoot,
    phase,
    { command: `approve ${phase} planner phase`, now: options.now },
    () => writeApprovalArtifacts(projectRoot, phase, 'approved', sourceFile, contents, options),
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
  normalizePhase,
  readPhaseApproval,
  readProjectFileBytes,
  renderApprovalStatus,
  resolveApprovedPlannerInput,
  savePlannerDraft,
  preparePlannerApprovalProjection,
  plannerApprovalLockName,
  sha256Bytes,
  summarizePlannerApproval,
  withPlannerApprovalLock,
};
