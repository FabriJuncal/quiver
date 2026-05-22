const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { quiverInternalPaths } = require('../init-layout');

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

function nextCommandForPhase(phase) {
  assertKnownPhase(phase);
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
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
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
  const current = resolveAiRun(projectRoot, runId);
  if (!current) {
    throw new Error(formatError('missing AI run to update'));
  }

  if (phaseRank(phase) < phaseRank(current.phase)) {
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
  const name = sliceId
    ? `${sanitizeLockPart(runId)}--${sanitizeLockPart(sliceId)}.lock`
    : `${sanitizeLockPart(runId)}.lock`;
  return path.join(locksDir(projectRoot), name);
}

function readAiRunLock(projectRoot, runId, sliceId = '') {
  return readJsonIfExists(lockPath(projectRoot, runId, sliceId));
}

function acquireAiRunLock(projectRoot, runId, options = {}) {
  const filePath = lockPath(projectRoot, runId, options.sliceId || '');
  const payload = {
    schema_version: 1,
    run_id: normalizeRunId(runId),
    slice_id: options.sliceId || null,
    pid: process.pid,
    hostname: os.hostname(),
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
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath);
  }
  return filePath;
}

function formatAiRunStatus(projectRoot, run) {
  if (!run) {
    return [
      'AI run status',
      'Status: no active run',
      'Next safe command: npx create-quiver ai run create --input <requirements.md>',
      '',
    ].join('\n');
  }

  return [
    'AI run status',
    `Run: ${run.run_id}`,
    `Status: ${run.status}`,
    `Phase: ${run.phase}`,
    `Spec: ${run.spec_slug || '(not generated)'}`,
    `Requirement: ${run.requirement?.path || '(missing)'}`,
    `State: ${toRelativePosix(projectRoot, runStatePath(projectRoot, run.run_id))}`,
    `Approvals: ${run.approvals_path}`,
    `Next safe command: ${nextCommandForPhase(run.phase)}`,
    '',
  ].join('\n');
}

function formatAiRunResume(projectRoot, run) {
  if (!run) {
    return [
      'AI run resume',
      'No active run found.',
      'Next safe command: npx create-quiver ai run create --input <requirements.md>',
      '',
    ].join('\n');
  }

  return [
    'AI run resume',
    `Run: ${run.run_id}`,
    `Current phase: ${run.phase}`,
    `Next safe command: ${nextCommandForPhase(run.phase)}`,
    `State: ${toRelativePosix(projectRoot, runStatePath(projectRoot, run.run_id))}`,
    '',
  ].join('\n');
}

module.exports = {
  AI_RUN_PHASES,
  acquireAiRunLock,
  assertAiRunPhaseAllows,
  createAiRun,
  ensureAiRun,
  formatAiRunResume,
  formatAiRunStatus,
  latestAiRun,
  listAiRuns,
  nextCommandForPhase,
  readAiRun,
  readAiRunLock,
  recordAiRunApproval,
  releaseAiRunLock,
  resolveAiRun,
  runApprovalsPath,
  runDir,
  runStatePath,
  updateAiRunPhase,
};
