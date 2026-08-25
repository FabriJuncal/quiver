const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { quiverInternalPaths } = require('./init-layout');

const QUIVER_RUNTIME_GIT_EXCLUDE_PATTERNS = Object.freeze([
  '.quiver/cache/',
  '.quiver/evidence/',
  '.quiver/locks/',
  '.quiver/runs/',
  '.quiver/worktrees/',
]);

function formatError(message) {
  return `create-quiver: ${message}`;
}

function toRelativePosix(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function sanitizeLockName(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'operation';
}

function lockPath(projectRoot, lockName) {
  return path.join(quiverInternalPaths(projectRoot).locksDir, `${sanitizeLockName(lockName)}.lock`);
}

function readLock(projectRoot, lockName) {
  const filePath = lockPath(projectRoot, lockName);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {
      schema_version: 1,
      lock_name: sanitizeLockName(lockName),
      command: 'unknown',
      created_at: 'unknown',
      pid: 'unknown',
    };
  }
}

function resolveGitCommonDir(projectRoot) {
  try {
    const gitCommonDir = execFileSync('git', ['rev-parse', '--git-common-dir'], {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return gitCommonDir
      ? path.resolve(projectRoot, gitCommonDir)
      : '';
  } catch {
    return '';
  }
}

function inspectQuiverStateIgnore(projectRoot) {
  const gitCommonDir = resolveGitCommonDir(projectRoot);
  if (!gitCommonDir) {
    return {
      available: false,
      blanket: false,
      filePath: '',
      missingRuntimePatterns: [...QUIVER_RUNTIME_GIT_EXCLUDE_PATTERNS],
    };
  }

  const filePath = path.join(gitCommonDir, 'info', 'exclude');
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const normalizedLines = current.split(/\r?\n/).map((line) => line.trim());

  return {
    available: true,
    blanket: normalizedLines.includes('.quiver/'),
    filePath,
    missingRuntimePatterns: QUIVER_RUNTIME_GIT_EXCLUDE_PATTERNS
      .filter((pattern) => !normalizedLines.includes(pattern)),
  };
}

function ensureQuiverStateIgnored(projectRoot) {
  const inspection = inspectQuiverStateIgnore(projectRoot);
  if (!inspection.available) {
    // Non-git fixtures can still use filesystem locks.
    return {
      ...inspection,
      added: [],
      changed: false,
      removedBlanket: false,
    };
  }

  const current = fs.existsSync(inspection.filePath)
    ? fs.readFileSync(inspection.filePath, 'utf8')
    : '';
  const retainedLines = current
    .split(/\r?\n/)
    .filter((line, index, lines) => line.length > 0 || index < lines.length - 1)
    .filter((line) => line.trim() !== '.quiver/');
  const normalized = new Set(retainedLines.map((line) => line.trim()).filter(Boolean));
  const added = [];

  for (const pattern of QUIVER_RUNTIME_GIT_EXCLUDE_PATTERNS) {
    if (!normalized.has(pattern)) {
      retainedLines.push(pattern);
      normalized.add(pattern);
      added.push(pattern);
    }
  }

  const changed = inspection.blanket || added.length > 0;
  if (changed) {
    fs.mkdirSync(path.dirname(inspection.filePath), { recursive: true });
    fs.writeFileSync(inspection.filePath, `${retainedLines.join('\n').replace(/\s+$/g, '')}\n`);
  }

  return {
    ...inspection,
    added,
    changed,
    removedBlanket: inspection.blanket,
  };
}

function acquireLock(projectRoot, lockName, options = {}) {
  const filePath = lockPath(projectRoot, lockName);
  const payload = {
    schema_version: 1,
    lock_name: sanitizeLockName(lockName),
    pid: process.pid,
    hostname: os.hostname(),
    command: options.command || 'unknown',
    created_at: (options.now || new Date()).toISOString(),
    metadata: options.metadata || {},
  };

  ensureQuiverStateIgnored(projectRoot);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  try {
    fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, { flag: 'wx' });
  } catch (error) {
    if (error.code === 'EEXIST') {
      const existing = readLock(projectRoot, lockName);
      throw new Error(formatError(`operation is locked: ${toRelativePosix(projectRoot, filePath)}\nLock owner: pid=${existing?.pid || 'unknown'} command=${existing?.command || 'unknown'} created_at=${existing?.created_at || 'unknown'}\nIf this process is gone, inspect the lock and remove it intentionally.`));
    }
    throw error;
  }

  return {
    filePath,
    lock: payload,
    lockName: sanitizeLockName(lockName),
  };
}

function releaseLock(handle) {
  if (handle?.filePath && fs.existsSync(handle.filePath)) {
    fs.rmSync(handle.filePath);
  }
}

function withLockSync(projectRoot, lockName, options, callback) {
  const handle = acquireLock(projectRoot, lockName, options);
  try {
    return callback(handle);
  } finally {
    releaseLock(handle);
  }
}

async function withLock(projectRoot, lockName, options, callback) {
  const handle = acquireLock(projectRoot, lockName, options);
  try {
    return await callback(handle);
  } finally {
    releaseLock(handle);
  }
}

module.exports = {
  acquireLock,
  ensureQuiverStateIgnored,
  inspectQuiverStateIgnore,
  lockPath,
  readLock,
  releaseLock,
  sanitizeLockName,
  withLock,
  withLockSync,
};
