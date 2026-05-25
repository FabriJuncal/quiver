const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { quiverInternalPaths } = require('./init-layout');

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

function appendUniqueLine(filePath, line) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const lines = current.split(/\r?\n/);
  if (!lines.includes(line)) {
    const prefix = current.endsWith('\n') || current.length === 0 ? current : `${current}\n`;
    fs.writeFileSync(filePath, `${prefix}${line}\n`);
  }
}

function ensureQuiverStateIgnored(projectRoot) {
  try {
    const gitDir = execFileSync('git', ['rev-parse', '--absolute-git-dir'], {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (gitDir) {
      appendUniqueLine(path.join(gitDir, 'info', 'exclude'), '.quiver/');
    }
  } catch {
    // Non-git fixtures can still use filesystem locks.
  }
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
  lockPath,
  readLock,
  releaseLock,
  sanitizeLockName,
  withLock,
  withLockSync,
};
