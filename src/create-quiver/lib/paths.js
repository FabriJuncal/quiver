const path = require('path');
const fs = require('fs');

function formatError(message) {
  return `create-quiver: ${message}`;
}

function resolveTargetRoot(cwd, targetDir, pathLib = path) {
  return pathLib.resolve(cwd, targetDir);
}

function normalizeGitBashDrivePath(filePath, pathLib = path) {
  const value = String(filePath || '');
  const normalized = value.replace(/\\/g, '/');
  const withoutNamespace = normalized.replace(/^\/\/\?\/([A-Za-z]:\/)/, '$1');
  const match = withoutNamespace.match(/^\/([A-Za-z])\/(.*)$/);
  if (!match) {
    if (withoutNamespace !== normalized && (pathLib === path.win32 || process.platform === 'win32')) {
      return withoutNamespace;
    }
    return value;
  }

  if (pathLib !== path.win32 && process.platform !== 'win32') {
    return value;
  }

  return `${match[1]}:/${match[2]}`;
}

function toPosixPath(filePath, pathLib = path) {
  return String(filePath).split(pathLib.sep).join('/').replace(/\\/g, '/');
}

function stripTrailingSlashes(filePath) {
  const value = String(filePath);
  if (value === '/') {
    return value;
  }
  if (/^[A-Za-z]:\/+$/.test(value)) {
    return value.slice(0, 3);
  }
  return value.replace(/\/+$/, '');
}

function relativePosixPath(root, absolutePath, pathLib = path) {
  const normalizedRoot = stripTrailingSlashes(toPosixPath(normalizeGitBashDrivePath(root, pathLib), pathLib));
  const normalizedAbsolute = stripTrailingSlashes(toPosixPath(normalizeGitBashDrivePath(absolutePath, pathLib), pathLib));
  const windowsPath = pathLib === path.win32 || process.platform === 'win32';
  const comparableRoot = windowsPath ? normalizedRoot.toLowerCase() : normalizedRoot;
  const comparableAbsolute = windowsPath ? normalizedAbsolute.toLowerCase() : normalizedAbsolute;

  if (comparableAbsolute === comparableRoot) {
    return '';
  }

  if (comparableAbsolute.startsWith(`${comparableRoot}/`)) {
    return normalizedAbsolute.slice(normalizedRoot.length + 1);
  }

  return toPosixPath(pathLib.relative(
    normalizeGitBashDrivePath(root, pathLib),
    normalizeGitBashDrivePath(absolutePath, pathLib),
  ), pathLib);
}

function specRelativePathFromPath(filePath, pathLib = path) {
  const normalized = toPosixPath(normalizeGitBashDrivePath(filePath, pathLib), pathLib);
  const parts = normalized.split('/').filter(Boolean);
  const specIndex = parts.findIndex((part) => part === 'specs' || part === 'specs-fix');

  if (specIndex === -1 || !parts[specIndex + 1]) {
    return '';
  }

  return parts.slice(specIndex).join('/');
}

function realpathOrResolve(filePath, pathLib = path) {
  try {
    return pathLib.resolve(fs.realpathSync(filePath));
  } catch {
    return pathLib.resolve(normalizeGitBashDrivePath(filePath, pathLib));
  }
}

function realpathCandidates(filePath, pathLib = path) {
  const normalized = normalizeGitBashDrivePath(filePath, pathLib);
  const candidates = [];

  const add = (candidate) => {
    if (!candidate) {
      return;
    }
    const resolved = pathLib.resolve(normalizeGitBashDrivePath(candidate, pathLib));
    if (!candidates.includes(resolved)) {
      candidates.push(resolved);
    }
  };

  try {
    add(fs.realpathSync(normalized));
  } catch {
    // Fall back below for paths that do not exist yet.
  }

  if (typeof fs.realpathSync.native === 'function') {
    try {
      add(fs.realpathSync.native(normalized));
    } catch {
      // Fall back below for paths that do not exist yet.
    }
  }

  if (candidates.length === 0) {
    add(normalized);
  }

  return candidates;
}

function isCandidateInsideRoot(rootPath, targetPath, pathLib = path) {
  const windowsPath = pathLib === path.win32 || process.platform === 'win32';
  const comparableRoot = windowsPath ? rootPath.toLowerCase() : rootPath;
  const comparableTarget = windowsPath ? targetPath.toLowerCase() : targetPath;

  if (comparableTarget === comparableRoot) {
    return true;
  }

  const relative = pathLib.relative(comparableRoot, comparableTarget);
  return Boolean(relative && !relative.startsWith('..') && !pathLib.isAbsolute(relative));
}

function isPathInsideRoot(root, target, pathLib = path) {
  const rootCandidates = realpathCandidates(root, pathLib);
  const targetCandidates = realpathCandidates(target, pathLib);

  return rootCandidates.some((rootPath) => targetCandidates.some((targetPath) => (
    isCandidateInsideRoot(rootPath, targetPath, pathLib)
  )));
}

function assertPathInsideRoot(root, target, label = 'path', pathLib = path) {
  if (!isPathInsideRoot(root, target, pathLib)) {
    throw new Error(formatError(`${label} must stay inside the project root: ${toPosixPath(target, pathLib)}`));
  }
}

function getProjectRelativePathIssue(filePath, pathLib = path) {
  const original = String(filePath || '').trim();
  if (!original) {
    return 'empty-path';
  }

  if (/^file:/i.test(original)) {
    return 'file-url';
  }

  const normalized = toPosixPath(normalizeGitBashDrivePath(original, pathLib), pathLib);
  if (normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized) || pathLib.isAbsolute(original)) {
    return 'absolute-path';
  }

  const segments = normalized.split('/').filter(Boolean);
  if (segments.some((segment) => segment === '..')) {
    return 'path-traversal';
  }

  return null;
}

function validateProjectRelativePath(filePath, fieldName = 'path', pathLib = path) {
  const issue = getProjectRelativePathIssue(filePath, pathLib);
  if (issue) {
    throw new Error(formatError(`${fieldName} must be a project-relative path without traversal (got ${String(filePath || '<empty>')}; issue=${issue}).`));
  }
  return toPosixPath(normalizeGitBashDrivePath(String(filePath).trim(), pathLib), pathLib);
}

function validateProjectRelativePaths(paths, fieldName = 'paths', pathLib = path) {
  return (Array.isArray(paths) ? paths : []).map((filePath) => validateProjectRelativePath(filePath, fieldName, pathLib));
}

module.exports = {
  assertPathInsideRoot,
  getProjectRelativePathIssue,
  isPathInsideRoot,
  normalizeGitBashDrivePath,
  relativePosixPath,
  resolveTargetRoot,
  specRelativePathFromPath,
  toPosixPath,
  validateProjectRelativePath,
  validateProjectRelativePaths,
};
