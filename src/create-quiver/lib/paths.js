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

function relativePosixPath(root, absolutePath, pathLib = path) {
  return toPosixPath(pathLib.relative(
    normalizeGitBashDrivePath(root, pathLib),
    normalizeGitBashDrivePath(absolutePath, pathLib),
  ), pathLib);
}

module.exports = {
  normalizeGitBashDrivePath,
  relativePosixPath,
  resolveTargetRoot,
  toPosixPath,
};
