const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { formatStatus, translatorForHuman } = require('../i18n/read-only-format');
const { quiverInternalPaths } = require('../init-layout');
const { runGovernanceStateSchema } = require('./review-governance.schema');

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

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  const tempPath = path.join(
    path.dirname(filePath),
    `.tmp-${path.basename(filePath)}-${process.pid}-${crypto.randomBytes(6).toString('hex')}`,
  );
  try {
    fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    if (fs.existsSync(tempPath)) fs.rmSync(tempPath);
    throw error;
  }
}

function listAiRuns(projectRoot) {
  const root = runsDir(projectRoot);
  if (!fs.existsSync(root)) {
    return [];
  }

  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readAiRun(projectRoot, entry.name))
    .filter(Boolean)
    .sort((a, b) => String(a.updated_at || a.created_at).localeCompare(String(b.updated_at || b.created_at)));
}

function latestAiRun(projectRoot) {
  const runs = listAiRuns(projectRoot).filter((run) => run.status !== 'closed');
  return runs.length > 0 ? runs[runs.length - 1] : null;
}

function readAiRun(projectRoot, runId) {
  const statePath = runStatePath(projectRoot, runId);
  if (!fs.existsSync(statePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(statePath, 'utf8'));
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
  const state = readJsonIfExists(runGovernancePath(projectRoot, runId));
  if (!state) return null;
  const parsed = runGovernanceStateSchema.safeParse(state);
  if (!parsed.success) {
    const error = new Error(formatError(`GOVERNANCE_STATE_INVALID: invalid canonical governance state for run '${runId}'`));
    error.code = 'GOVERNANCE_STATE_INVALID';
    error.details = {
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    };
    throw error;
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

  const openRuns = listAiRuns(projectRoot).filter((item) => item.status !== 'closed');
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
  createAiRun,
  ensureAiRun,
  formatAiRunResume,
  formatAiRunStatus,
  latestAiRun,
  listAiRuns,
  nextCommandForPhase,
  readAiRun,
  readAiRunLock,
  readRunGovernance,
  recordAiRunApproval,
  releaseAiRunLock,
  resolveAiRun,
  resolveGovernedAiRun,
  runApprovalsPath,
  runDir,
  runGovernancePath,
  runReviewCommitPath,
  runReviewBudgetDir,
  runStatePath,
  updateAiRunPhase,
  withAiRunLock,
  writeRunGovernance,
};
