const { statusPorcelain } = require('./git');
const { normalizeContextPath } = require('./ai/safety');
const { checkScope } = require('./readiness');

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

function captureWorktreeSnapshot(repoRoot, options = {}) {
  const raw = typeof options.rawStatus === 'string' ? options.rawStatus : statusPorcelain(repoRoot);
  const files = parseStatusPorcelain(raw);

  return {
    repoRoot,
    raw,
    files,
  };
}

function diffWorktreeSnapshots(beforeSnapshot, afterSnapshot) {
  const beforeFiles = new Set((beforeSnapshot && Array.isArray(beforeSnapshot.files) ? beforeSnapshot.files : []).map(normalizeScopePath));
  const seen = new Set();
  const changedFiles = [];

  for (const file of afterSnapshot && Array.isArray(afterSnapshot.files) ? afterSnapshot.files : []) {
    const normalized = normalizeScopePath(file);
    if (!normalized || beforeFiles.has(normalized) || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    changedFiles.push(normalized);
  }

  return changedFiles;
}

function validateScopeSnapshot({ allowedFiles = [], beforeSnapshot, afterSnapshot, strict = true } = {}) {
  const normalizedAllowedFiles = new Set(
    Array.isArray(allowedFiles)
      ? allowedFiles.map(normalizeScopePath).filter(Boolean)
      : [],
  );
  const changedFiles = diffWorktreeSnapshots(beforeSnapshot, afterSnapshot);
  const outOfScopeFiles = changedFiles.filter((file) => !normalizedAllowedFiles.has(file));

  if (outOfScopeFiles.length === 0) {
    return {
      ok: true,
      changedFiles,
      outOfScopeFiles,
      allowedFiles: Array.from(normalizedAllowedFiles),
      beforeSnapshot,
      afterSnapshot,
    };
  }

  const message = formatError(
    `scope violation detected: changed files outside slice.json.files: ${outOfScopeFiles.join(', ')}`,
  );
  const error = new ScopeValidationError('SCOPE_VIOLATION', message, {
    allowedFiles: Array.from(normalizedAllowedFiles),
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
    allowedFiles: Array.from(normalizedAllowedFiles),
    beforeSnapshot,
    afterSnapshot,
    error,
  };
}

module.exports = {
  ScopeValidationError,
  captureWorktreeSnapshot,
  diffWorktreeSnapshots,
  checkScope,
  normalizeScopePath,
  parseStatusPorcelain,
  validateScopeSnapshot,
};
