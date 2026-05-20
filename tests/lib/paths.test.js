const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const {
  normalizeGitBashDrivePath,
  relativePosixPath,
  toPosixPath,
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

test('normalizeGitBashDrivePath leaves non-Windows path libs untouched', () => {
  const normalized = normalizeGitBashDrivePath('/d/a/quiver/quiver', path.posix);
  const expected = process.platform === 'win32' ? 'd:/a/quiver/quiver' : '/d/a/quiver/quiver';

  assert.equal(normalized, expected);
});
