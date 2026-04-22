const path = require('path');

function resolveTargetRoot(cwd, targetDir, pathLib = path) {
  return pathLib.resolve(cwd, targetDir);
}

function toPosixPath(filePath, pathLib = path) {
  return filePath.split(pathLib.sep).join('/');
}

function relativePosixPath(root, absolutePath, pathLib = path) {
  return toPosixPath(pathLib.relative(root, absolutePath), pathLib);
}

module.exports = {
  relativePosixPath,
  resolveTargetRoot,
  toPosixPath,
};
