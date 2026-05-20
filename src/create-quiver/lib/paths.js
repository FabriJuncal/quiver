const path = require('path');

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

module.exports = {
  normalizeGitBashDrivePath,
  relativePosixPath,
  resolveTargetRoot,
  specRelativePathFromPath,
  toPosixPath,
};
