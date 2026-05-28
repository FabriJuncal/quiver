const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  getProjectRelativePathIssue,
  isPathInsideRoot,
  normalizeGitBashDrivePath,
  relativePosixPath,
  specRelativePathFromPath,
  toPosixPath,
  validateProjectRelativePath,
} = require('../../src/create-quiver/lib/paths');

test('toPosixPath normalizes explicit Windows separators', () => {
  assert.equal(toPosixPath(String.raw`specs\demo\slices\slice.json`, path.posix), 'specs/demo/slices/slice.json');
});

test('relativePosixPath handles Git Bash drive paths on Windows', () => {
  const root = '/d/a/quiver/quiver';
  const slice = String.raw`D:\a\quiver\quiver\specs\demo\slices\slice.json`;

  assert.equal(relativePosixPath(root, slice, path.win32), 'specs/demo/slices/slice.json');
});

test('relativePosixPath handles extended Windows path prefixes', () => {
  const root = String.raw`\\?\D:\a\quiver\quiver`;
  const slice = String.raw`D:\a\quiver\quiver\specs\demo\slices\slice.json`;

  assert.equal(relativePosixPath(root, slice, path.win32), 'specs/demo/slices/slice.json');
});

test('isPathInsideRoot accepts equivalent Windows realpath aliases', () => {
  const originalRealpath = fs.realpathSync;
  const originalNativeRealpath = fs.realpathSync.native;
  fs.realpathSync = (filePath) => path.win32.resolve(String(filePath));
  fs.realpathSync.native = (filePath) => path.win32.resolve(String(filePath).replace('RUNNER~1', 'runneradmin'));

  try {
    const root = String.raw`C:\Users\runneradmin\AppData\Local\Temp\quiver-smoke\repo`;
    const slice = String.raw`C:\Users\RUNNER~1\AppData\Local\Temp\quiver-smoke\repo\specs\demo\slices\slice.json`;

    assert.equal(isPathInsideRoot(root, slice, path.win32), true);
  } finally {
    fs.realpathSync = originalRealpath;
    fs.realpathSync.native = originalNativeRealpath;
  }
});

test('isPathInsideRoot rejects targets that realpath outside the root', () => {
  const originalRealpath = fs.realpathSync;
  const originalNativeRealpath = fs.realpathSync.native;
  fs.realpathSync = (filePath) => {
    const value = path.win32.resolve(String(filePath));
    if (value.endsWith(String.raw`repo\specs\demo\slices\slice.json`)) {
      return String.raw`C:\outside\slice.json`;
    }
    return value;
  };
  fs.realpathSync.native = fs.realpathSync;

  try {
    const root = String.raw`C:\repo`;
    const slice = String.raw`C:\repo\specs\demo\slices\slice.json`;

    assert.equal(isPathInsideRoot(root, slice, path.win32), false);
  } finally {
    fs.realpathSync = originalRealpath;
    fs.realpathSync.native = originalNativeRealpath;
  }
});

test('normalizeGitBashDrivePath leaves non-Windows path libs untouched', () => {
  const normalized = normalizeGitBashDrivePath('/d/a/quiver/quiver', path.posix);
  const expected = process.platform === 'win32' ? 'd:/a/quiver/quiver' : '/d/a/quiver/quiver';

  assert.equal(normalized, expected);
});

test('specRelativePathFromPath extracts specs paths from absolute Windows paths', () => {
  const absolutePath = String.raw`D:\a\_temp\repo\specs\demo\slices\slice-01\slice.json`;

  assert.equal(specRelativePathFromPath(absolutePath, path.win32), 'specs/demo/slices/slice-01/slice.json');
});

test('specRelativePathFromPath extracts specs-fix paths from Git Bash paths', () => {
  const absolutePath = '/d/a/_temp/repo/specs-fix/demo/slices/slice-01/slice.json';

  assert.equal(specRelativePathFromPath(absolutePath, path.win32), 'specs-fix/demo/slices/slice-01/slice.json');
});

test('specRelativePathFromPath returns empty string when no spec family exists', () => {
  assert.equal(specRelativePathFromPath('/d/a/_temp/repo/docs/slice.json', path.win32), '');
});

test('validateProjectRelativePath rejects absolute and traversal paths', () => {
  assert.equal(validateProjectRelativePath('src/app.js'), 'src/app.js');
  assert.equal(validateProjectRelativePath(String.raw`src\app.js`, 'field'), 'src/app.js');
  assert.equal(getProjectRelativePathIssue('../secret.txt'), 'path-traversal');
  assert.equal(getProjectRelativePathIssue('specs/demo/../../secret.txt'), 'path-traversal');
  assert.equal(getProjectRelativePathIssue('/tmp/secret.txt'), 'absolute-path');
  assert.equal(getProjectRelativePathIssue(String.raw`C:\repo\secret.txt`, path.win32), 'absolute-path');
  assert.equal(getProjectRelativePathIssue('file:///tmp/secret.txt'), 'file-url');

  assert.throws(
    () => validateProjectRelativePath('../secret.txt', 'slice path'),
    /slice path must be a project-relative path without traversal/,
  );
});
