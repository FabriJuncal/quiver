const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { formatStatus, translatorForHuman } = require('../i18n/read-only-format');
const { quiverInternalPaths } = require('../init-layout');
const {
  assertNoPendingDigestBoundApproval,
  plannerApprovalLockName,
} = require('../approvals');
const { withLock, withLockSync } = require('../locks');
const { redactSensitiveLocalValues, redactSensitiveValue } = require('./artifacts');
const {
  GovernanceError,
  buildApprovalDecisionRecord,
  canonicalSha256,
  stableStringify,
  verifyApprovalDecisionRecord,
} = require('./review-governance');
const {
  authorizationEvidenceSchema,
  runGovernanceStateSchema,
} = require('./review-governance.schema');

const APPROVAL_COMMIT_SCHEMA_VERSION = 1;

const AI_RUN_PHASES = Object.freeze([
  'created',
  'onboarding-ready',
  'acceptance-draft',
  'acceptance-approved',
  'technical-plan-draft',
  'technical-plan-reviewed',
  'technical-plan-approved',
  'spec-generated',
  'execution-plan-generated',
  'slice-executing',
  'pr-ready',
  'closed',
]);

const PHASE_NEXT_COMMAND = Object.freeze({
  created: 'npx create-quiver ai plan --phase acceptance --input <requirements.md> --dry-run',
  'onboarding-ready': 'npx create-quiver ai plan --phase acceptance --input <requirements.md> --dry-run',
  'acceptance-draft': 'npx create-quiver ai approve --phase acceptance --version <n>',
  'acceptance-approved': 'npx create-quiver ai plan --phase technical-plan --dry-run',
  'technical-plan-draft': 'npx create-quiver ai review-plan --dry-run',
  'technical-plan-reviewed': 'npx create-quiver ai approve --phase technical-plan --version <n>',
  'technical-plan-approved': 'npx create-quiver spec create --dry-run',
  'spec-generated': 'npx create-quiver spec start specs/<spec-slug>',
  'execution-plan-generated': 'npx create-quiver ai execute-plan --dry-run --commit --mode manual',
  'slice-executing': 'npx create-quiver ai execute-plan --dry-run --commit --mode delegated',
  'pr-ready': 'npx create-quiver ai pr --dry-run --input specs/<spec-slug>/pr.md',
  closed: 'No next command: lifecycle run is closed.',
});

function formatError(message) {
  return `create-quiver: ${message}`;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function toRelativePosix(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function findSymlinkPathComponent(projectRoot, targetPath) {
  const root = path.resolve(projectRoot);
  let current = path.resolve(targetPath);
  while (current !== root) {
    try {
      if (fs.lstatSync(current).isSymbolicLink()) return current;
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

function normalizeRunId(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!normalized) {
    throw new Error(formatError('invalid run id'));
  }

  return normalized;
}

function createRunId(now = new Date()) {
  const stamp = now.toISOString()
    .replace(/\.\d{3}Z$/, 'z')
    .replace(/[^0-9a-z]+/gi, '-')
    .toLowerCase()
    .replace(/^-+|-+$/g, '');
  return `run-${stamp}`;
}

function runsDir(projectRoot) {
  return quiverInternalPaths(projectRoot).runsDir;
}

function locksDir(projectRoot) {
  return quiverInternalPaths(projectRoot).locksDir || path.join(quiverInternalPaths(projectRoot).root, 'locks');
}

function runDir(projectRoot, runId) {
  return path.join(runsDir(projectRoot), normalizeRunId(runId));
}

function runStatePath(projectRoot, runId) {
  return path.join(runDir(projectRoot, runId), 'state.json');
}

function runApprovalsPath(projectRoot, runId) {
  return path.join(runDir(projectRoot, runId), 'approvals.json');
}

function runGovernancePath(projectRoot, runId) {
  return path.join(runDir(projectRoot, runId), 'review-governance.json');
}

function runReviewBudgetDir(projectRoot, runId) {
  return path.join(runDir(projectRoot, runId), 'review-budget-events');
}

function runReviewCommitPath(projectRoot, runId) {
  return path.join(runDir(projectRoot, runId), 'review-commit-wal.json');
}

function runApprovalCommitPath(projectRoot, runId) {
  return path.join(runDir(projectRoot, runId), 'approval-commit-wal.json');
}

function runApprovalArtifactPath(projectRoot, runId, phase, version) {
  const normalizedPhase = String(phase || '').trim().toLowerCase();
  if (!['acceptance', 'technical-plan'].includes(normalizedPhase)) {
    throw new Error(formatError(`unsupported approval phase '${phase}'`));
  }
  const parsedVersion = Number(version);
  if (!Number.isInteger(parsedVersion) || parsedVersion <= 0) {
    throw new Error(formatError(`invalid approval artifact version '${version}'`));
  }
  return path.join(runDir(projectRoot, runId), 'approvals', normalizedPhase, `v${String(parsedVersion).padStart(3, '0')}.md`);
}

function runRequirementPath(projectRoot, runId) {
  return path.join(runDir(projectRoot, runId), 'requirement.md');
}

function assertKnownPhase(phase) {
  if (!AI_RUN_PHASES.includes(phase)) {
    throw new Error(formatError(`unsupported AI run phase '${phase}'`));
  }
}

function phaseRank(phase) {
  assertKnownPhase(phase);
  return AI_RUN_PHASES.indexOf(phase);
}

function nextCommandForPhase(phase, projectRoot = '') {
  assertKnownPhase(phase);
  if (projectRoot && phase === 'acceptance-draft') {
    try {
      const { buildApprovalCandidateReport } = require('./approval-candidates');
      const report = buildApprovalCandidateReport(projectRoot, 'acceptance');
      return report.recommended?.next_command || report.current?.next_command || PHASE_NEXT_COMMAND[phase];
    } catch {
      return PHASE_NEXT_COMMAND[phase];
    }
  }
  if (projectRoot && phase === 'technical-plan-reviewed') {
    try {
      const { buildApprovalCandidateReport } = require('./approval-candidates');
      const report = buildApprovalCandidateReport(projectRoot, 'technical-plan');
      return report.recommended?.next_command || report.current?.next_command || PHASE_NEXT_COMMAND[phase];
    } catch {
      return PHASE_NEXT_COMMAND[phase];
    }
  }
  return PHASE_NEXT_COMMAND[phase];
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readStableRunFile(projectRoot, runId, filePath, label) {
  const symlink = findSymlinkPathComponent(projectRoot, filePath);
  if (symlink) {
    throw new GovernanceError(
      'APPROVAL_BINDING_MISMATCH',
      `Canonical ${label} cannot use a symlinked run namespace.`,
      { run_id: runId, symlink: toRelativePosix(projectRoot, symlink) },
    );
  }
  const walPath = runApprovalCommitPath(projectRoot, runId);
  const assertReadable = () => {
    if (fs.existsSync(walPath)) {
      throw approvalCommitError(`Approval commit recovery is required before reading ${label}.`, {
        run_id: runId,
        wal_path: toRelativePosix(projectRoot, walPath),
      });
    }
  };
  const capture = () => (fs.existsSync(filePath) ? fs.readFileSync(filePath) : null);
  assertReadable();
  const first = capture();
  assertReadable();
  const second = capture();
  assertReadable();
  const stable = first === null
    ? second === null
    : second !== null && first.equals(second);
  if (!stable) {
    throw approvalCommitError(`${label} changed during an approval read.`, {
      run_id: runId,
      path: toRelativePosix(projectRoot, filePath),
    });
  }
  return first;
}

function fsyncDirectory(dirPath) {
  let handle;
  try {
    handle = fs.openSync(dirPath, 'r');
    fs.fsyncSync(handle);
  } catch (error) {
    const unsupported = ['EINVAL', 'ENOTSUP'].includes(error?.code)
      || (process.platform === 'win32' && error?.code === 'EPERM');
    if (!unsupported) throw error;
  } finally {
    if (typeof handle === 'number') fs.closeSync(handle);
  }
}

function writeFileAtomic(filePath, contents) {
  ensureDir(path.dirname(filePath));
  const tempPath = path.join(
    path.dirname(filePath),
    `.tmp-${path.basename(filePath)}-${process.pid}-${crypto.randomBytes(6).toString('hex')}`,
  );
  try {
    const handle = fs.openSync(tempPath, 'wx');
    try {
      fs.writeFileSync(handle, contents);
      fs.fsyncSync(handle);
    } finally {
      fs.closeSync(handle);
    }
    fs.renameSync(tempPath, filePath);
    fsyncDirectory(path.dirname(filePath));
  } catch (error) {
    if (fs.existsSync(tempPath)) fs.rmSync(tempPath);
    throw error;
  }
}

function writeJson(filePath, value) {
  writeFileAtomic(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function listAiRuns(projectRoot, options = {}) {
  const root = runsDir(projectRoot);
  if (!fs.existsSync(root)) {
    return [];
  }

  const entries = fs.readdirSync(root, { withFileTypes: true });
  const symlinkedNamespace = entries.find((entry) => entry.isSymbolicLink());
  if (symlinkedNamespace) {
    throw new GovernanceError(
      'APPROVAL_BINDING_MISMATCH',
      'AI run listing cannot use a symlinked run namespace.',
      {
        run_id: symlinkedNamespace.name,
        symlink: toRelativePosix(projectRoot, path.join(root, symlinkedNamespace.name)),
      },
    );
  }

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      try {
        return readAiRun(projectRoot, entry.name);
      } catch (error) {
        const isOtherRecovery = options.ignoreApprovalRecoveryForOtherRuns === true
          && error?.code === 'APPROVAL_RECOVERY_REQUIRED'
          && entry.name !== options.requiredRunId;
        if (isOtherRecovery) return null;
        throw error;
      }
    })
    .filter(Boolean)
    .sort((a, b) => String(a.updated_at || a.created_at).localeCompare(String(b.updated_at || b.created_at)));
}

function latestAiRun(projectRoot) {
  const runs = listAiRuns(projectRoot).filter((run) => run.status !== 'closed');
  return runs.length > 0 ? runs[runs.length - 1] : null;
}

function readAiRunRaw(projectRoot, runId) {
  const normalizedRunId = normalizeRunId(runId);
  const statePath = runStatePath(projectRoot, normalizedRunId);
  const symlink = findSymlinkPathComponent(projectRoot, statePath);
  if (symlink) {
    throw new GovernanceError(
      'APPROVAL_BINDING_MISMATCH',
      'Canonical run state cannot use a symlinked run namespace.',
      { run_id: normalizedRunId, symlink: toRelativePosix(projectRoot, symlink) },
    );
  }
  if (!fs.existsSync(statePath)) {
    return null;
  }
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  if (state?.run_id !== normalizedRunId) {
    throw new GovernanceError(
      'APPROVAL_BINDING_MISMATCH',
      'Canonical run state does not match its requested run namespace.',
      { run_id: normalizedRunId, actual_run_id: state?.run_id || null },
    );
  }
  return state;
}

function readAiRun(projectRoot, runId) {
  const normalizedRunId = normalizeRunId(runId);
  const bytes = readStableRunFile(
    projectRoot,
    normalizedRunId,
    runStatePath(projectRoot, normalizedRunId),
    'run state',
  );
  if (!bytes) return null;
  const state = JSON.parse(bytes.toString('utf8'));
  if (state?.run_id !== normalizedRunId) {
    throw new GovernanceError(
      'APPROVAL_BINDING_MISMATCH',
      'Canonical run state does not match its requested run namespace.',
      { run_id: normalizedRunId, actual_run_id: state?.run_id || null },
    );
  }
  return state;
}

function resolveAiRun(projectRoot, runId = '') {
  if (runId) {
    const run = readAiRun(projectRoot, runId);
    if (!run) {
      throw new Error(formatError(`missing AI run: ${runId}`));
    }
    return run;
  }

  const latest = latestAiRun(projectRoot);
  if (!latest) {
    return null;
  }
  return latest;
}

function resolveGovernedAiRun(projectRoot, runId = '') {
  if (runId) {
    const run = resolveAiRun(projectRoot, runId);
    if (run?.status === 'closed') {
      throw new Error(formatError(`AI_RUN_CLOSED: governed mutation cannot target closed run '${run.run_id}'`));
    }
    return run;
  }

  const activeRuns = listAiRuns(projectRoot).filter((run) => run.status !== 'closed');
  if (activeRuns.length === 0) {
    return null;
  }
  if (activeRuns.length > 1) {
    throw new Error(formatError('AI_RUN_REQUIRED: governed mutation requires --run <id> when more than one active run exists'));
  }
  return activeRuns[0];
}

function createAiRun(projectRoot, options = {}) {
  const sourceInput = options.input ? path.resolve(projectRoot, options.input) : '';
  if (sourceInput && !fs.existsSync(sourceInput)) {
    throw new Error(formatError(`missing run requirement input file: ${options.input}`));
  }

  const runId = normalizeRunId(options.runId || createRunId(options.now || new Date()));
  const targetDir = runDir(projectRoot, runId);
  const now = (options.now || new Date()).toISOString();

  if (fs.existsSync(runStatePath(projectRoot, runId))) {
    throw new Error(formatError(`AI run already exists: ${runId}`));
  }

  ensureDir(targetDir);

  const requirementTarget = runRequirementPath(projectRoot, runId);
  if (sourceInput) {
    fs.copyFileSync(sourceInput, requirementTarget);
  } else {
    fs.writeFileSync(requirementTarget, '');
  }

  const approvals = {
    schema_version: 1,
    run_id: runId,
    approvals: [],
  };

  const state = {
    schema_version: 1,
    run_id: runId,
    status: 'active',
    phase: options.phase || 'created',
    spec_slug: options.specSlug || null,
    created_at: now,
    updated_at: now,
    requirement: {
      source_file: sourceInput ? toRelativePosix(projectRoot, sourceInput) : null,
      path: toRelativePosix(projectRoot, requirementTarget),
    },
    approvals_path: toRelativePosix(projectRoot, runApprovalsPath(projectRoot, runId)),
    decisions_path: toRelativePosix(projectRoot, path.join(targetDir, 'decisions.md')),
    governance: options.governance || null,
    history: [
      {
        phase: options.phase || 'created',
        command: options.command || 'ai run create',
        at: now,
      },
    ],
  };

  assertKnownPhase(state.phase);
  writeJson(runApprovalsPath(projectRoot, runId), approvals);
  writeJson(runStatePath(projectRoot, runId), state);
  fs.writeFileSync(path.join(targetDir, 'decisions.md'), '# Decisions\n\n');
  return state;
}

function ensureAiRun(projectRoot, options = {}) {
  const existing = resolveAiRun(projectRoot, options.runId || '');
  if (existing) {
    return existing;
  }
  return createAiRun(projectRoot, options);
}

function updateAiRunPhase(projectRoot, runId, phase, options = {}) {
  assertKnownPhase(phase);
  const applyUpdate = () => {
    const current = resolveAiRun(projectRoot, runId);
    if (!current) {
      throw new Error(formatError('missing AI run to update'));
    }

    if (phase === 'closed' && current.governance) {
      if (fs.existsSync(runReviewCommitPath(projectRoot, current.run_id))) {
        const error = new Error(formatError(`REVIEW_COMMIT_RECOVERY_REQUIRED: run '${current.run_id}' has a prepared review commit that must be recovered before close`));
        error.code = 'REVIEW_COMMIT_RECOVERY_REQUIRED';
        throw error;
      }
      if (fs.existsSync(runApprovalCommitPath(projectRoot, current.run_id))) {
        const error = new Error(formatError(`APPROVAL_RECOVERY_REQUIRED: run '${current.run_id}' has a prepared approval commit that must be recovered before close`));
        error.code = 'APPROVAL_RECOVERY_REQUIRED';
        throw error;
      }
      const { assertNoPendingReviewBudgetReservations } = require('./review-budget');
      assertNoPendingReviewBudgetReservations(projectRoot, current.run_id);
    }

    const reviewRevision = options.reviewRevision === true
      && current.phase === 'technical-plan-reviewed'
      && phase === 'technical-plan-draft';
    if (phaseRank(phase) < phaseRank(current.phase) && !reviewRevision) {
      throw new Error(formatError(`cannot move AI run ${current.run_id} backwards from ${current.phase} to ${phase}`));
    }

    const now = (options.now || new Date()).toISOString();
    const next = {
      ...current,
      phase,
      status: phase === 'closed' ? 'closed' : 'active',
      spec_slug: options.specSlug || current.spec_slug || null,
      updated_at: now,
      history: (current.history || []).concat({
        phase,
        command: options.command || 'unknown',
        artifact: options.artifact || null,
        at: now,
      }),
    };

    writeJson(runStatePath(projectRoot, current.run_id), next);
    return next;
  };

  if (options.locked === true) {
    return applyUpdate();
  }
  const current = resolveAiRun(projectRoot, runId);
  return current?.governance
    ? withAiRunLock(projectRoot, runId, { command: options.command || `advance AI run to ${phase}`, now: options.now }, applyUpdate)
    : applyUpdate();
}

function recordAiRunApproval(projectRoot, runId, approval) {
  const run = resolveAiRun(projectRoot, runId);
  if (!run) {
    throw new Error(formatError('missing AI run for approval metadata'));
  }

  const filePath = runApprovalsPath(projectRoot, run.run_id);
  const current = readJsonIfExists(filePath) || { schema_version: 1, run_id: run.run_id, approvals: [] };
  const next = {
    ...current,
    approvals: (current.approvals || []).concat({
      ...approval,
      at: approval.at || new Date().toISOString(),
    }),
  };
  writeJson(filePath, next);
  return next;
}

function approvalCommitError(message, details = {}) {
  return new GovernanceError('APPROVAL_RECOVERY_REQUIRED', message, details);
}

function sha256Buffer(value) {
  return `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
}

function approvalBytesAreSafe(projectRoot, bytes, role = '') {
  const text = bytes.toString('utf8');
  if (!Buffer.from(text, 'utf8').equals(bytes)
      || redactSensitiveLocalValues(text, { projectRoot }) !== text) {
    return false;
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return true;
  }
  let candidate = parsed;
  if (role === 'governance') {
    const validated = runGovernanceStateSchema.safeParse(parsed);
    if (validated.success) {
      candidate = JSON.parse(JSON.stringify(validated.data));
      for (const collection of ['dispositions', 'conditioned_candidates', 'decisions']) {
        for (const [index, record] of (validated.data[collection] || []).entries()) {
          if (!record?.authorization) continue;
          const redactedAuthorization = redactSensitiveValue(record.authorization, { projectRoot });
          if (stableStringify(record.authorization) !== stableStringify(redactedAuthorization)) {
            return false;
          }
          delete candidate[collection][index].authorization;
        }
      }
    }
  } else if (role === 'run-approval'
      && parsed?.schema_version === 1
      && Array.isArray(parsed?.approvals)) {
    candidate = JSON.parse(JSON.stringify(parsed));
    for (const [index, approval] of parsed.approvals.entries()) {
      const authorization = approval?.governance?.authorization;
      if (!authorization) continue;
      const validated = authorizationEvidenceSchema.safeParse(authorization);
      if (!validated.success
          || stableStringify(authorization)
            !== stableStringify(redactSensitiveValue(authorization, { projectRoot }))) {
        return false;
      }
      delete candidate.approvals[index].governance.authorization;
    }
  }
  return stableStringify(candidate)
    === stableStringify(redactSensitiveValue(candidate, { projectRoot }));
}

function assertNoApprovalTargetSymlinks(projectRoot, target, relative) {
  const symlink = findSymlinkPathComponent(projectRoot, target);
  if (symlink) {
    throw approvalCommitError('Approval commit target namespace cannot contain symlinks.', {
      target: relative,
      symlink: toRelativePosix(projectRoot, symlink),
    });
  }
}

function approvalTargetPath(projectRoot, value) {
  const root = path.resolve(projectRoot);
  const target = path.resolve(root, String(value || ''));
  const relative = path.relative(root, target);
  if (!relative
      || relative === '..'
      || relative.startsWith(`..${path.sep}`)
      || path.isAbsolute(relative)
      || !relative.startsWith(`.quiver${path.sep}`)) {
    throw approvalCommitError('Approval commit target must be a project-local .quiver path.');
  }
  assertNoApprovalTargetSymlinks(root, target, relative.split(path.sep).join('/'));
  const realRoot = fs.realpathSync(root);
  let existingAncestor = target;
  while (!fs.existsSync(existingAncestor)) {
    const parent = path.dirname(existingAncestor);
    if (parent === existingAncestor) break;
    existingAncestor = parent;
  }
  const realAncestor = fs.realpathSync(existingAncestor);
  const realRelative = path.relative(realRoot, realAncestor);
  if (realRelative === '..'
      || realRelative.startsWith(`..${path.sep}`)
      || path.isAbsolute(realRelative)) {
    throw approvalCommitError('Approval commit target resolves outside the project root.', {
      target: relative.split(path.sep).join('/'),
    });
  }
  return { target, relative: relative.split(path.sep).join('/') };
}

function captureApprovalTarget(projectRoot, target) {
  const resolved = approvalTargetPath(projectRoot, target.path);
  const beforeExists = fs.existsSync(resolved.target);
  const beforeBytes = beforeExists ? fs.readFileSync(resolved.target) : null;
  const afterBytes = Buffer.isBuffer(target.contents)
    ? target.contents
    : Buffer.from(String(target.contents || ''), 'utf8');
  const unsafeSnapshot = beforeBytes && !approvalBytesAreSafe(projectRoot, beforeBytes, target.role)
    ? 'before'
    : !approvalBytesAreSafe(projectRoot, afterBytes, target.role)
      ? 'after'
      : null;
  if (unsafeSnapshot) {
    throw new GovernanceError(
      'APPROVAL_BINDING_MISMATCH',
      'Approval commit snapshot cannot be persisted safely without changing its exact bytes.',
      {
        mismatches: [`${target.role}_${unsafeSnapshot}_sensitive_content`],
        target: resolved.relative,
      },
    );
  }
  return {
    role: target.role,
    path: resolved.relative,
    fault_point: target.faultPoint || null,
    before_exists: beforeExists,
    before_sha256: beforeBytes ? sha256Buffer(beforeBytes) : null,
    before_base64: beforeBytes ? beforeBytes.toString('base64') : null,
    after_sha256: sha256Buffer(afterBytes),
    after_base64: afterBytes.toString('base64'),
  };
}

function approvalMarkerDigest(marker) {
  const input = JSON.parse(JSON.stringify(marker));
  delete input.marker_sha256;
  return canonicalSha256(input);
}

function expectedApprovalCommitTargets(projectRoot, runId, decision) {
  const expected = [
    {
      role: 'artifact',
      path: toRelativePosix(projectRoot, runApprovalArtifactPath(
        projectRoot,
        runId,
        decision.phase,
        decision.version,
      )),
      fault_point: 'after-artifact',
    },
    {
      role: 'governance',
      path: toRelativePosix(projectRoot, runGovernancePath(projectRoot, runId)),
      fault_point: 'after-governance',
    },
    {
      role: 'run-approval',
      path: toRelativePosix(projectRoot, runApprovalsPath(projectRoot, runId)),
      fault_point: 'after-run-approval',
    },
  ];
  if (decision.decision === 'approved') {
    const legacyRoot = path.join(quiverInternalPaths(projectRoot).root, 'approvals', decision.phase);
    expected.push(
      {
        role: 'legacy-approved',
        path: toRelativePosix(projectRoot, path.join(legacyRoot, 'approved.md')),
        fault_point: null,
      },
      {
        role: 'legacy-meta',
        path: toRelativePosix(projectRoot, path.join(legacyRoot, 'meta.json')),
        fault_point: 'after-legacy-projection',
      },
    );
  }
  expected.push({
    role: 'run-state',
    path: toRelativePosix(projectRoot, runStatePath(projectRoot, runId)),
    fault_point: 'after-phase',
  });
  return expected;
}

function assertApprovalCommitMarker(projectRoot, runId, marker) {
  const targets = Array.isArray(marker?.targets) ? marker.targets : [];
  let decision;
  try {
    decision = verifyApprovalDecisionRecord(marker?.decision);
  } catch (error) {
    throw approvalCommitError('Prepared approval commit has an invalid canonical decision.', {
      run_id: runId,
      cause: error.code || error.message,
    });
  }
  const expectedTargets = expectedApprovalCommitTargets(projectRoot, runId, decision);
  const targetsMatch = targets.length === expectedTargets.length
    && targets.every((target, index) => (
      target?.role === expectedTargets[index].role
      && target?.path === expectedTargets[index].path
      && target?.fault_point === expectedTargets[index].fault_point
    ));
  const invalid = marker?.schema_version !== APPROVAL_COMMIT_SCHEMA_VERSION
    || marker?.kind !== 'digest-bound-approval-commit'
    || marker?.run_id !== runId
    || decision.run_id !== runId
    || Number.isNaN(Date.parse(String(marker?.prepared_at || '')))
    || decision.artifact_path !== expectedTargets[0].path
    || !targetsMatch
    || new Set(targets.map((target) => target.path)).size !== targets.length
    || marker?.marker_sha256 !== approvalMarkerDigest(marker);
  if (invalid) {
    throw approvalCommitError('Prepared approval commit is corrupt or does not match its run.', {
      run_id: runId,
      wal_path: toRelativePosix(projectRoot, runApprovalCommitPath(projectRoot, runId)),
    });
  }
  for (const target of targets) {
    approvalTargetPath(projectRoot, target.path);
    const after = Buffer.from(String(target.after_base64 || ''), 'base64');
    const before = target.before_exists ? Buffer.from(String(target.before_base64 || ''), 'base64') : null;
    if (!target.role
        || sha256Buffer(after) !== target.after_sha256
        || (target.before_exists && (!before || sha256Buffer(before) !== target.before_sha256))
        || (!target.before_exists && (target.before_sha256 !== null || target.before_base64 !== null))) {
      throw approvalCommitError('Prepared approval commit target snapshot is invalid.', {
        run_id: runId,
        target: target.path || null,
      });
    }
    if (!approvalBytesAreSafe(projectRoot, after, target.role)
        || (before && !approvalBytesAreSafe(projectRoot, before, target.role))) {
      throw approvalCommitError('Prepared approval commit contains a non-redacted target snapshot.', {
        run_id: runId,
        target: target.path || null,
      });
    }
  }
  return { ...marker, decision };
}

function readApprovalCommitMarker(projectRoot, runId) {
  const filePath = runApprovalCommitPath(projectRoot, runId);
  if (!fs.existsSync(filePath)) return null;
  let marker;
  try {
    marker = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw approvalCommitError('Prepared approval commit is not valid JSON.', {
      run_id: runId,
      cause: error.message,
    });
  }
  return assertApprovalCommitMarker(projectRoot, normalizeRunId(runId), marker);
}

function removeDurable(filePath) {
  if (!fs.existsSync(filePath)) return;
  fs.rmSync(filePath);
  fsyncDirectory(path.dirname(filePath));
}

function rollbackApprovalCommitLocked(projectRoot, markerValue) {
  const marker = assertApprovalCommitMarker(projectRoot, markerValue.run_id, markerValue);
  for (const target of [...marker.targets].reverse()) {
    const resolved = approvalTargetPath(projectRoot, target.path).target;
    const exists = fs.existsSync(resolved);
    const currentDigest = exists ? sha256Buffer(fs.readFileSync(resolved)) : null;
    const matchesBefore = target.before_exists
      ? currentDigest === target.before_sha256
      : !exists;
    if (matchesBefore) continue;
    if (currentDigest !== target.after_sha256) {
      throw approvalCommitError('Approval rollback found a target that matches neither snapshot.', {
        run_id: marker.run_id,
        target: target.path,
        actual_sha256: currentDigest,
      });
    }
    if (target.before_exists) {
      writeFileAtomic(resolved, Buffer.from(target.before_base64, 'base64'));
    } else {
      removeDurable(resolved);
    }
  }
  removeDurable(runApprovalCommitPath(projectRoot, marker.run_id));
  return { recovered: true, runId: marker.run_id, decisionId: marker.decision.decision_id };
}

function recoverDigestBoundApprovalCommit(projectRoot, options = {}) {
  const run = readAiRunRaw(projectRoot, options.runId);
  if (!run) return { recovered: false, runId: null };
  const markerPath = runApprovalCommitPath(projectRoot, run.run_id);
  if (!fs.existsSync(markerPath)) return { recovered: false, runId: run.run_id };
  const recoverWithPlannerLock = () => {
    const marker = readApprovalCommitMarker(projectRoot, run.run_id);
    if (!marker) return { recovered: false, runId: run.run_id };
    return withLockSync(
      projectRoot,
      plannerApprovalLockName(marker.decision.phase),
      { command: 'recover digest-bound approval commit' },
      () => rollbackApprovalCommitLocked(projectRoot, marker),
    );
  };
  return options.locked === true
    ? recoverWithPlannerLock()
    : withAiRunLock(projectRoot, run.run_id, { command: 'recover digest-bound approval commit' }, recoverWithPlannerLock);
}

function nextApprovalDecisionId(decisions = []) {
  const used = new Set(decisions.map((decision) => decision.decision_id));
  let number = decisions.length + 1;
  let decisionId;
  do {
    decisionId = `A-${String(number).padStart(3, '0')}`;
    number += 1;
  } while (used.has(decisionId));
  return decisionId;
}

function readRunApprovalsStrict(projectRoot, runId) {
  const filePath = runApprovalsPath(projectRoot, runId);
  let value;
  try {
    value = readJsonIfExists(filePath) || { schema_version: 1, run_id: runId, approvals: [] };
  } catch (error) {
    throw approvalCommitError('Run approval projection is not valid JSON.', { run_id: runId, cause: error.message });
  }
  if (value.schema_version !== 1 || value.run_id !== runId || !Array.isArray(value.approvals)) {
    throw approvalCommitError('Run approval projection does not match its run.', { run_id: runId });
  }
  return value;
}

function buildRunPhaseState(current, phase, artifact, command, now) {
  assertKnownPhase(phase);
  if (current.status === 'closed' || phaseRank(phase) < phaseRank(current.phase)) {
    throw new GovernanceError('AI_RUN_PHASE_INVALID', `Approval cannot advance run '${current.run_id}' from '${current.phase}' to '${phase}'.`);
  }
  return {
    ...current,
    phase,
    status: 'active',
    updated_at: now,
    history: (current.history || []).concat({ phase, command, artifact, at: now }),
  };
}

async function commitDigestBoundApproval(projectRoot, options = {}) {
  if (typeof options.prepare !== 'function') {
    throw new Error(formatError('digest-bound approval commit requires a prepare callback'));
  }
  const runId = normalizeRunId(options.runId);
  return withAiRunLock(projectRoot, runId, { command: options.command || 'commit digest-bound approval' }, async () => {
    if (fs.existsSync(runApprovalCommitPath(projectRoot, runId))) {
      recoverDigestBoundApprovalCommit(projectRoot, { runId, locked: true });
    }
    const runBeforeLock = readAiRun(projectRoot, runId);
    const phaseHint = options.phase || 'technical-plan';
    return withLock(projectRoot, plannerApprovalLockName(phaseHint), {
      command: options.command || 'commit digest-bound approval',
      now: options.now,
    }, async () => {
      assertNoPendingDigestBoundApproval(projectRoot, phaseHint);
      const run = readAiRun(projectRoot, runId);
      if (!run || run.status === 'closed') {
        throw new GovernanceError('AI_RUN_CLOSED', `Governed approval cannot mutate closed or missing run '${runId}'.`);
      }
      if (runBeforeLock?.updated_at !== run.updated_at || runBeforeLock?.phase !== run.phase) {
        throw new GovernanceError('APPROVAL_BINDING_MISMATCH', 'Run state changed before the approval critical section.', {
          mismatches: ['run_state'],
        });
      }
      const previousGovernance = readRunGovernance(projectRoot, runId) || {
        schema_version: 1,
        run_id: runId,
        next_finding_number: 1,
        current_review_id: null,
        reviews: [],
        findings: [],
        dispositions: [],
        condition_evaluations: [],
        conditioned_candidates: [],
      };
      const prepared = await options.prepare({ run, governanceState: previousGovernance });
      const nowValue = options.now || new Date();
      const now = nowValue instanceof Date ? nowValue.toISOString() : new Date(nowValue).toISOString();
      const artifactPath = runApprovalArtifactPath(projectRoot, runId, prepared.bindings.phase, prepared.bindings.version);
      const artifactRelative = toRelativePosix(projectRoot, artifactPath);
      const decisions = previousGovernance.decisions || [];
      const record = buildApprovalDecisionRecord({
        schema_version: 1,
        decision_id: nextApprovalDecisionId(decisions),
        ...prepared.bindings,
        artifact_path: artifactRelative,
        publication_state: 'final',
        recorded_at: now,
      });
      const nextGovernance = runGovernanceStateSchema.parse({
        ...previousGovernance,
        decisions: decisions.concat(record),
        updated_at: now,
      });
      const currentApprovals = readRunApprovalsStrict(projectRoot, runId);
      const nextApprovals = {
        ...currentApprovals,
        approvals: currentApprovals.approvals.concat({
          schema_version: 1,
          run_id: runId,
          decision_id: record.decision_id,
          phase: record.phase,
          decision: record.decision,
          artifact: record.artifact_path,
          artifact_sha256: record.artifact_sha256,
          input_sha256: record.input_sha256,
          criterion_count: record.criterion_count,
          version: record.version,
          at: now,
        }),
      };
      const targetPhase = record.phase === 'acceptance' ? 'acceptance-approved' : 'technical-plan-approved';
      const nextRun = buildRunPhaseState(run, targetPhase, artifactRelative, options.command || 'ai approve', now);
      const legacyTargets = Array.isArray(prepared.legacyProjection?.targets)
        ? prepared.legacyProjection.targets.map((target, index, list) => ({
            role: index === list.length - 1 ? 'legacy-meta' : 'legacy-approved',
            path: target.path,
            contents: target.contents,
            faultPoint: index === list.length - 1 ? 'after-legacy-projection' : null,
          }))
        : [];
      const targets = [
        { role: 'artifact', path: artifactPath, contents: prepared.artifact.bytes, faultPoint: 'after-artifact' },
        {
          role: 'governance',
          path: runGovernancePath(projectRoot, runId),
          contents: `${JSON.stringify(nextGovernance, null, 2)}\n`,
          faultPoint: 'after-governance',
        },
        {
          role: 'run-approval',
          path: runApprovalsPath(projectRoot, runId),
          contents: `${JSON.stringify(nextApprovals, null, 2)}\n`,
          faultPoint: 'after-run-approval',
        },
        ...legacyTargets,
        {
          role: 'run-state',
          path: runStatePath(projectRoot, runId),
          contents: `${JSON.stringify(nextRun, null, 2)}\n`,
          faultPoint: 'after-phase',
        },
      ];
      const marker = {
        schema_version: APPROVAL_COMMIT_SCHEMA_VERSION,
        kind: 'digest-bound-approval-commit',
        run_id: runId,
        prepared_at: now,
        decision: record,
        targets: targets.map((target) => captureApprovalTarget(projectRoot, target)),
      };
      marker.marker_sha256 = approvalMarkerDigest(marker);
      const validatedMarker = assertApprovalCommitMarker(projectRoot, runId, marker);
      const walPath = runApprovalCommitPath(projectRoot, runId);
      writeFileAtomic(walPath, `${JSON.stringify(validatedMarker, null, 2)}\n`);
      try {
        if (typeof options.faultInjector === 'function') options.faultInjector('after-prepare');
        for (const target of validatedMarker.targets) {
          const resolved = approvalTargetPath(projectRoot, target.path).target;
          writeFileAtomic(resolved, Buffer.from(target.after_base64, 'base64'));
          if (target.fault_point && typeof options.faultInjector === 'function') {
            options.faultInjector(target.fault_point);
          }
        }
        if (typeof options.faultInjector === 'function') options.faultInjector('before-wal-cleanup');
        removeDurable(walPath);
      } catch (error) {
        try {
          rollbackApprovalCommitLocked(projectRoot, validatedMarker);
        } catch (rollbackError) {
          throw approvalCommitError('Approval commit failed and rollback could not be completed.', {
            run_id: runId,
            cause: error.message,
            rollback_cause: rollbackError.message,
          });
        }
        error.details = {
          ...(error.details || {}),
          final_decision_published: false,
          phase_advanced: false,
        };
        throw error;
      }
      return {
        task: 'approve',
        run: nextRun,
        decision: record,
        approvalProjection: nextApprovals,
        legacyProjection: prepared.legacyProjection || null,
      };
    });
  });
}

function readRunApprovalDecisions(projectRoot, runId) {
  const normalizedRunId = normalizeRunId(runId);
  if (fs.existsSync(runApprovalCommitPath(projectRoot, normalizedRunId))) {
    throw approvalCommitError('Approval commit recovery is required before reading decisions.', {
      run_id: normalizedRunId,
      wal_path: toRelativePosix(projectRoot, runApprovalCommitPath(projectRoot, normalizedRunId)),
    });
  }
  const state = readRunGovernance(projectRoot, normalizedRunId);
  return (state?.decisions || []).map(verifyApprovalDecisionRecord);
}

function readRunApprovalDecision(projectRoot, runId, phase) {
  const decisions = readRunApprovalDecisions(projectRoot, runId)
    .filter((decision) => decision.phase === phase);
  if (decisions.length === 0) {
    throw new GovernanceError('APPROVAL_NOT_FOUND', `No canonical ${phase} approval exists for run '${runId}'.`, {
      run_id: runId,
      phase,
    });
  }
  return decisions.at(-1);
}

function assertAiRunPhaseAllows(run, requiredPhase, commandName) {
  if (!run) {
    throw new Error(formatError(`cannot run ${commandName}: no AI run exists. Next: npx create-quiver ai run create --input <requirements.md>`));
  }
  assertKnownPhase(requiredPhase);

  if (phaseRank(run.phase) < phaseRank(requiredPhase)) {
    throw new Error(formatError(`cannot run ${commandName}: AI run ${run.run_id} is at phase '${run.phase}' and requires '${requiredPhase}'. Next: ${nextCommandForPhase(run.phase)}`));
  }

  return true;
}

function sanitizeLockPart(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'run';
}

function lockPath(projectRoot, runId, sliceId = '') {
  const normalizedRunId = normalizeRunId(runId);
  const name = sliceId
    ? `${sanitizeLockPart(normalizedRunId)}--${sanitizeLockPart(sliceId)}.lock`
    : `${sanitizeLockPart(normalizedRunId)}.lock`;
  return path.join(locksDir(projectRoot), name);
}

function readAiRunLock(projectRoot, runId, sliceId = '') {
  return readJsonIfExists(lockPath(projectRoot, runId, sliceId));
}

function readRunGovernance(projectRoot, runId) {
  const normalizedRunId = normalizeRunId(runId);
  const bytes = readStableRunFile(
    projectRoot,
    normalizedRunId,
    runGovernancePath(projectRoot, normalizedRunId),
    'governance state',
  );
  const state = bytes ? JSON.parse(bytes.toString('utf8')) : null;
  if (!state) return null;
  const parsed = runGovernanceStateSchema.safeParse(state);
  if (!parsed.success) {
    const error = new Error(formatError(`GOVERNANCE_STATE_INVALID: invalid canonical governance state for run '${normalizedRunId}'`));
    error.code = 'GOVERNANCE_STATE_INVALID';
    error.details = {
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    };
    throw error;
  }
  if (parsed.data.run_id !== normalizedRunId) {
    throw new GovernanceError(
      'APPROVAL_BINDING_MISMATCH',
      'Canonical governance state does not match its requested run namespace.',
      { run_id: normalizedRunId, actual_run_id: parsed.data.run_id },
    );
  }
  return parsed.data;
}

function writeRunGovernance(projectRoot, runId, governanceState) {
  const normalizedRunId = normalizeRunId(runId);
  if (!governanceState || typeof governanceState !== 'object' || Array.isArray(governanceState)) {
    throw new Error(formatError('invalid run governance state'));
  }
  if (governanceState.run_id !== normalizedRunId) {
    throw new Error(formatError(`run governance state belongs to '${governanceState.run_id || 'unknown'}', expected '${normalizedRunId}'`));
  }
  const parsed = runGovernanceStateSchema.safeParse(governanceState);
  if (!parsed.success) {
    const error = new Error(formatError(`GOVERNANCE_STATE_INVALID: refusing to write invalid canonical governance state for run '${normalizedRunId}'`));
    error.code = 'GOVERNANCE_STATE_INVALID';
    error.details = {
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    };
    throw error;
  }
  const filePath = runGovernancePath(projectRoot, normalizedRunId);
  writeJson(filePath, parsed.data);
  return filePath;
}

function acquireAiRunLock(projectRoot, runId, options = {}) {
  const filePath = lockPath(projectRoot, runId, options.sliceId || '');
  const payload = {
    schema_version: 1,
    run_id: normalizeRunId(runId),
    slice_id: options.sliceId || null,
    pid: process.pid,
    hostname: os.hostname(),
    nonce: crypto.randomBytes(16).toString('hex'),
    command: options.command || null,
    created_at: (options.now || new Date()).toISOString(),
  };
  ensureDir(path.dirname(filePath));

  try {
    fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, { flag: 'wx' });
  } catch (error) {
    if (error.code === 'EEXIST') {
      const existing = readAiRunLock(projectRoot, runId, options.sliceId || '');
      throw new Error(formatError(`AI run is locked: ${path.relative(projectRoot, filePath).split(path.sep).join('/')}\nLock owner: pid=${existing?.pid || 'unknown'} command=${existing?.command || 'unknown'} created_at=${existing?.created_at || 'unknown'}\nIf this process is gone, inspect the lock and remove it intentionally.`));
    }
    throw error;
  }

  return {
    filePath,
    lock: payload,
  };
}

function releaseAiRunLock(projectRoot, runId, options = {}) {
  const filePath = lockPath(projectRoot, runId, options.sliceId || '');
  const expectedNonce = options.handle?.lock?.nonce || options.nonce || '';
  if (expectedNonce) {
    const current = readAiRunLock(projectRoot, runId, options.sliceId || '');
    if (!current || current.nonce !== expectedNonce) {
      return filePath;
    }
  }
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath);
  }
  return filePath;
}

function withAiRunLock(projectRoot, runId, options = {}, callback) {
  if (typeof callback !== 'function') {
    throw new Error(formatError('withAiRunLock requires a callback'));
  }
  const handle = acquireAiRunLock(projectRoot, runId, options);
  try {
    const result = callback();
    if (result && typeof result.then === 'function') {
      return Promise.resolve(result).finally(() => {
        releaseAiRunLock(projectRoot, runId, { ...options, handle });
      });
    }
    releaseAiRunLock(projectRoot, runId, { ...options, handle });
    return result;
  } catch (error) {
    releaseAiRunLock(projectRoot, runId, { ...options, handle });
    throw error;
  }
}

function bindAiRunGovernance(projectRoot, runId, governance, options = {}) {
  const normalized = {
    requested_profile: String(governance?.requested_profile || '').trim(),
    effective_profile: String(governance?.effective_profile || '').trim(),
    policy_version: String(governance?.policy_version || '').trim(),
    policy_digest: String(governance?.policy_digest || '').trim(),
    requirement_categories: Array.isArray(governance?.requirement_categories)
      ? [...new Set(governance.requirement_categories.map((value) => String(value || '').trim()).filter(Boolean))].sort()
      : [],
  };
  if (!normalized.requested_profile || !normalized.effective_profile || !normalized.policy_version || !normalized.policy_digest) {
    throw new Error(formatError('invalid governed run profile binding'));
  }

  const applyBinding = () => {
    const current = resolveAiRun(projectRoot, runId);
    if (!current) {
      throw new Error(formatError('missing AI run for governance binding'));
    }
    if (current.status === 'closed') {
      throw new Error(formatError(`AI_RUN_CLOSED: governed mutation cannot target closed run '${current.run_id}'`));
    }
    if ((current.governance?.effective_profile === 'high-assurance'
        && normalized.effective_profile === 'fast-delivery')
      || (current.governance?.requested_profile === 'high-assurance'
        && normalized.requested_profile === 'fast-delivery')) {
      throw new Error(formatError('PROFILE_DOWNGRADE_FORBIDDEN: an active high-assurance run cannot be downgraded to fast-delivery'));
    }
    if (current.governance
        && (current.governance.policy_version !== normalized.policy_version
          || current.governance.policy_digest !== normalized.policy_digest)) {
      throw new Error(formatError('GOVERNANCE_POLICY_MISMATCH: an active governed run cannot change policy version or digest'));
    }

    const now = (options.now || new Date()).toISOString();
    const next = {
      ...current,
      governance: normalized,
      updated_at: now,
    };
    writeJson(runStatePath(projectRoot, current.run_id), next);
    return next;
  };

  return options.locked === true
    ? applyBinding()
    : withAiRunLock(projectRoot, runId, { command: options.command || 'bind AI run governance', now: options.now }, applyBinding);
}

function formatAiRunStatus(projectRoot, run, options = {}) {
  const translator = translatorForHuman(options);
  if (!run) {
    return [
      translator.t('ai.run.status.title'),
      `${translator.t('ai.run.status')}: ${translator.t('ai.run.status.no_active')}`,
      `${translator.t('ai.label.next_safe_command')}: npx create-quiver ai run create --input <requirements.md>`,
      '',
    ].join('\n');
  }

  const openRuns = listAiRuns(projectRoot, {
    ignoreApprovalRecoveryForOtherRuns: true,
    requiredRunId: run.run_id,
  }).filter((item) => item.status !== 'closed');
  const otherOpenRuns = openRuns.filter((item) => item.run_id !== run.run_id);
  const lines = [
    translator.t('ai.run.status.title'),
    `${translator.t('ai.run.run')}: ${run.run_id}`,
    `${translator.t('ai.run.status')}: ${formatStatus(run.status, translator)}`,
    `${translator.t('ai.run.phase')}: ${run.phase}`,
    `${translator.t('ai.run.spec')}: ${run.spec_slug || translator.t('ai.run.spec.not_generated')}`,
    `${translator.t('ai.run.requirement')}: ${run.requirement?.path || translator.t('ai.run.missing')}`,
    `${translator.t('ai.run.state')}: ${toRelativePosix(projectRoot, runStatePath(projectRoot, run.run_id))}`,
    `${translator.t('ai.run.approvals')}: ${run.approvals_path}`,
    `${translator.t('ai.run.open_runs')}: ${openRuns.length}`,
  ];

  if (otherOpenRuns.length > 0) {
    lines.push(`${translator.t('ai.run.other_open_runs')}:`);
    for (const item of otherOpenRuns) {
      lines.push(`- ${item.run_id}: ${item.phase} (${formatStatus(item.status, translator)}) -> ${nextCommandForPhase(item.phase, projectRoot)}`);
    }
  }

  lines.push(
    `${translator.t('ai.label.next_safe_command')}: ${nextCommandForPhase(run.phase, projectRoot)}`,
    '',
  );

  return lines.join('\n');
}

function formatAiRunResume(projectRoot, run, options = {}) {
  const translator = translatorForHuman(options);
  if (!run) {
    return [
      translator.t('ai.run.resume.title'),
      translator.t('ai.run.resume.no_active'),
      `${translator.t('ai.label.next_safe_command')}: npx create-quiver ai run create --input <requirements.md>`,
      '',
    ].join('\n');
  }

  return [
    translator.t('ai.run.resume.title'),
    `${translator.t('ai.run.run')}: ${run.run_id}`,
    `${translator.t('ai.run.current_phase')}: ${run.phase}`,
    `${translator.t('ai.label.next_safe_command')}: ${nextCommandForPhase(run.phase, projectRoot)}`,
    `${translator.t('ai.run.state')}: ${toRelativePosix(projectRoot, runStatePath(projectRoot, run.run_id))}`,
    '',
  ].join('\n');
}

module.exports = {
  AI_RUN_PHASES,
  acquireAiRunLock,
  assertAiRunPhaseAllows,
  bindAiRunGovernance,
  commitDigestBoundApproval,
  createAiRun,
  ensureAiRun,
  formatAiRunResume,
  formatAiRunStatus,
  latestAiRun,
  listAiRuns,
  nextCommandForPhase,
  readAiRun,
  readAiRunLock,
  readRunApprovalDecision,
  readRunApprovalDecisions,
  readRunGovernance,
  recordAiRunApproval,
  releaseAiRunLock,
  recoverDigestBoundApprovalCommit,
  resolveAiRun,
  resolveGovernedAiRun,
  runApprovalsPath,
  runDir,
  runGovernancePath,
  runApprovalArtifactPath,
  runApprovalCommitPath,
  runReviewCommitPath,
  runReviewBudgetDir,
  runRequirementPath,
  runStatePath,
  updateAiRunPhase,
  withAiRunLock,
  writeRunGovernance,
};
