const assert = require('node:assert/strict');
const test = require('node:test');

const { withWindowsLongPaths } = require('../../src/create-quiver/lib/git');

test('withWindowsLongPaths enables core.longpaths on Windows git commands', () => {
  assert.deepEqual(
    withWindowsLongPaths(['worktree', 'add', 'C:\\tmp\\wt', 'develop'], { platform: 'win32' }),
    ['-c', 'core.longpaths=true', 'worktree', 'add', 'C:\\tmp\\wt', 'develop'],
  );
});

test('withWindowsLongPaths leaves non-Windows git commands unchanged', () => {
  const args = ['worktree', 'add', '/tmp/wt', 'develop'];
  assert.equal(withWindowsLongPaths(args, { platform: 'darwin' }), args);
});
