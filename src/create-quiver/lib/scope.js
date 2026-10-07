const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { normalizeContextPath } = require('./ai/safety');
const { checkScope } = require('./readiness');
const { validateProjectRelativePaths } = require('./paths');

class ScopeValidationError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ScopeValidationError';
    this.code = code;
    this.details = details;
  }
}

function formatError(message) {
  return `create-quiver: ${message}`;
}

function normalizeScopePath(filePath) {
  return normalizeContextPath(filePath);
}

function globToRegExp(pattern) {
  const source = String(pattern || '')
    .split('')
    .map((char, index, chars) => {
      if (char === '*') {
        return chars[index + 1] === '*' ? '\0' : '[^/]*';
      }
      if (char === '\0') {
        return '.*';
      }
      return /[\\^$+?.()|[\]{}]/.test(char) ? `\\${char}` : char;
    })
    .join('')
    .replace(/\0\[\^\/\]\*/g, '.*');

  return new RegExp(`^${source}$`);
}

function allowedPathMatches(filePath, allowedPath) {
  const file = normalizeScopePath(filePath);
  const allowed = normalizeScopePath(allowedPath);

  if (!file || !allowed) {
    return false;
  }

  if (file === allowed) {
    return true;
  }

  if (allowed.endsWith('/**')) {
    const prefix = allowed.slice(0, -3);
    return file === prefix || file.startsWith(`${prefix}/`);
  }

  if (allowed.includes('*')) {
    return globToRegExp(allowed).test(file);
  }

  return false;
}

function parseStatusPorcelain(text) {
  if (!text) {
    return [];
  }

  return String(text)
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith('?? ')) {
        return normalizeScopePath(line.slice(3));
      }

      const entry = (line[2] === ' ' ? line.slice(3) : line[1] === ' ' ? line.slice(2) : line.slice(3)).trim();
      if (!entry) {
        return '';
      }

      const renamedTarget = entry.includes(' -> ') ? entry.split(' -> ').pop() : entry;
      return normalizeScopePath(renamedTarget);
    })
    .filter(Boolean);
}

function readGitPaths(repoRoot, args) {
  // Preserve whitespace and NUL delimiters: runGit trims its output.
  const output = execFileSync('git', args, {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const text = output.toString('utf8');
  if (!Buffer.from(text, 'utf8').equals(output)) {
    throw new ScopeValidationError('SCOPE_SNAPSHOT_UNSUPPORTED_PATH',
      formatError('cannot snapshot a Git path that is not valid UTF-8'));
  }
  return text;
}

function fingerprintWorktreePath(repoRoot, file) {
  const segments = file.split('/');
  let absolute = repoRoot;
  for (let index = 0; index < segments.length; index += 1) {
    absolute = path.join(absolute, segments[index]);
    let stat;
    try {
      stat = fs.lstatSync(absolute);
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
        return 'missing';
      }
      throw error;
    }
    // Never follow a symlink, including one replacing a tracked parent directory.
    if (stat.isSymbolicLink()) {
      const target = fs.readlinkSync(absolute, { encoding: 'buffer' });
      return `symlink:${index}:${crypto.createHash('sha256').update(target).digest('hex')}`;
    }
    if (index < segments.length - 1 && stat.isDirectory()) {
      continue;
    }
    if (!stat.isFile()) {
      throw new ScopeValidationError('SCOPE_SNAPSHOT_UNSUPPORTED_FILE',
        formatError(`cannot snapshot non-regular worktree path: ${file}`));
    }
    const digest = crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
    return `file:${stat.mode & 0o777}:${digest}`;
  }
}

function captureWorktreeSnapshot(repoRoot, options = {}) {
  // Retain the injected status-only format used by callers without a real worktree.
  if (typeof options.rawStatus === 'string') {
    return { repoRoot, raw: options.rawStatus, files: parseStatusPorcelain(options.rawStatus) };
  }
  const raw = readGitPaths(repoRoot, ['status', '--porcelain=v1', '-z', '--untracked-files=all']);
  const entries = raw.split('\0');
  const files = [];
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (!entry) continue;
    files.push(entry.slice(3));
    if (/^[RC]|^.[RC]/.test(entry.slice(0, 2))) {
      // Porcelain -z emits destination first, then source; both belong to the change.
      files.push(entries[++index]);
    }
  }
  // Fingerprint only Git-reported changes. Comparing the union of both snapshots
  // also catches pre-existing dirty paths that disappear (deletion or restoration).
  // Clean files and clean submodules need no content reads.
  const paths = Array.from(new Set(files.filter(Boolean)));
  for (const file of paths) {
    // Scope matching normalizes user-declared patterns; reject Git names that
    // would alias a different path under those legacy normalization rules.
    if (normalizeScopePath(file) !== file) {
      throw new ScopeValidationError('SCOPE_SNAPSHOT_UNSUPPORTED_PATH',
        formatError(`cannot snapshot a path whose normalization changes its identity: ${JSON.stringify(file)}`));
    }
  }
  const indexEntries = Object.create(null);
  // Query only dirty paths, in bounded literal batches (filenames are not pathspecs).
  for (let offset = 0; offset < paths.length; offset += 128) {
    const entries = readGitPaths(repoRoot, [
      '--literal-pathspecs', 'ls-files', '--stage', '-z', '--', ...paths.slice(offset, offset + 128),
    ]);
    for (const entry of entries.split('\0').filter(Boolean)) {
      const separator = entry.indexOf('\t');
      const file = entry.slice(separator + 1);
      indexEntries[file] = `${indexEntries[file] || ''}${entry.slice(0, separator)};`;
    }
  }
  const fingerprints = Object.create(null);
  for (const file of paths) {
    fingerprints[file] = `${indexEntries[file] || ''}|${fingerprintWorktreePath(repoRoot, file)}`;
  }
  return { repoRoot, raw, files: paths, fingerprints };
}

function diffWorktreeSnapshots(beforeSnapshot, afterSnapshot) {
  const before = beforeSnapshot && beforeSnapshot.fingerprints;
  const after = afterSnapshot && afterSnapshot.fingerprints;
  if (before && after) {
    return Array.from(new Set([...Object.keys(before), ...Object.keys(after)]))
      .filter((file) => (before[file] || 'missing') !== (after[file] || 'missing'));
  }
  if (before || after) {
    throw new ScopeValidationError('SCOPE_SNAPSHOT_MISMATCH',
      formatError('cannot compare content-aware and status-only worktree snapshots'));
  }
  // Backward compatibility for callers that supply legacy status-only snapshots.
  const beforeFiles = new Set((beforeSnapshot && Array.isArray(beforeSnapshot.files) ? beforeSnapshot.files : []).map(normalizeScopePath));
  const seen = new Set();
  const changedFiles = [];
  for (const file of afterSnapshot && Array.isArray(afterSnapshot.files) ? afterSnapshot.files : []) {
    const normalized = normalizeScopePath(file);
    if (!normalized || beforeFiles.has(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    changedFiles.push(normalized);
  }
  return changedFiles;
}

function validateScopeSnapshot({ allowedFiles = [], beforeSnapshot, afterSnapshot, strict = true } = {}) {
  const normalizedAllowedFiles = Array.from(new Set(
    Array.isArray(allowedFiles)
      ? validateProjectRelativePaths(allowedFiles, 'allowed scope path').map(normalizeScopePath).filter(Boolean)
      : [],
  ));
  const changedFiles = diffWorktreeSnapshots(beforeSnapshot, afterSnapshot);
  const outOfScopeFiles = changedFiles.filter((file) => !normalizedAllowedFiles.some((allowedFile) => allowedPathMatches(file, allowedFile)));

  if (outOfScopeFiles.length === 0) {
    return {
      ok: true,
      changedFiles,
      outOfScopeFiles,
      allowedFiles: normalizedAllowedFiles,
      beforeSnapshot,
      afterSnapshot,
    };
  }

  const message = formatError(
    `scope violation detected: changed files outside declared slice scope: ${outOfScopeFiles.join(', ')}`,
  );
  const error = new ScopeValidationError('SCOPE_VIOLATION', message, {
    allowedFiles: normalizedAllowedFiles,
    beforeSnapshot,
    afterSnapshot,
    changedFiles,
    outOfScopeFiles,
  });

  if (strict) {
    throw error;
  }

  return {
    ok: false,
    changedFiles,
    outOfScopeFiles,
    allowedFiles: normalizedAllowedFiles,
    beforeSnapshot,
    afterSnapshot,
    error,
  };
}

module.exports = {
  ScopeValidationError,
  allowedPathMatches,
  captureWorktreeSnapshot,
  diffWorktreeSnapshots,
  checkScope,
  normalizeScopePath,
  parseStatusPorcelain,
  validateScopeSnapshot,
};
