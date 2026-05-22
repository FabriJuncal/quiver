const assert = require('node:assert/strict');
const test = require('node:test');

const {
  allowedPathMatches,
  diffWorktreeSnapshots,
  parseStatusPorcelain,
  validateScopeSnapshot,
} = require('../../src/create-quiver/lib/scope');

test('parseStatusPorcelain normalizes modified, added, untracked, and renamed paths', () => {
  const files = parseStatusPorcelain([
    ' M src/app.js',
    'A  src/new.js',
    '?? tests/new.test.js',
    'R  src/old.js -> src/renamed.js',
  ].join('\n'));

  assert.deepEqual(files, [
    'src/app.js',
    'src/new.js',
    'tests/new.test.js',
    'src/renamed.js',
  ]);
});

test('validateScopeSnapshot reports only files changed after the before snapshot', () => {
  const beforeSnapshot = {
    files: ['src/pre-existing.js'],
    raw: '',
    repoRoot: '/tmp/repo',
  };
  const afterSnapshot = {
    files: ['src/pre-existing.js', 'src/app.js', 'docs/out.md'],
    raw: '',
    repoRoot: '/tmp/repo',
  };

  assert.deepEqual(diffWorktreeSnapshots(beforeSnapshot, afterSnapshot), ['src/app.js', 'docs/out.md']);

  assert.throws(
    () => validateScopeSnapshot({
      allowedFiles: ['src/app.js'],
      beforeSnapshot,
      afterSnapshot,
      strict: true,
    }),
    (error) => error.code === 'SCOPE_VIOLATION'
      && error.details.outOfScopeFiles.includes('docs/out.md')
      && !error.details.outOfScopeFiles.includes('src/pre-existing.js'),
  );
});

test('validateScopeSnapshot supports simple glob write scopes', () => {
  assert.equal(allowedPathMatches('src/create-quiver/lib/executor.js', 'src/create-quiver/**'), true);
  assert.equal(allowedPathMatches('src/create-quiver/lib/executor.js', 'src/create-quiver/*.js'), false);
  assert.equal(allowedPathMatches('src/create-quiver/index.js', 'src/create-quiver/*.js'), true);

  const result = validateScopeSnapshot({
    allowedFiles: ['src/create-quiver/**', 'tests/**/*.test.js'],
    beforeSnapshot: {
      files: [],
      raw: '',
      repoRoot: '/tmp/repo',
    },
    afterSnapshot: {
      files: ['src/create-quiver/lib/ai/executor.js', 'tests/lib/ai-executor.test.js'],
      raw: '',
      repoRoot: '/tmp/repo',
    },
    strict: true,
  });

  assert.equal(result.ok, true);
});
