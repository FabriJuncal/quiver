const assert = require('node:assert/strict');
const test = require('node:test');

const {
  assertPackageSafety,
  collectPackageSafetyViolations,
  normalizeTarballPath,
  stripPackagePrefix,
} = require('../../src/create-quiver/lib/package-safety');

test('normalizeTarballPath and stripPackagePrefix support tarball entries', () => {
  assert.equal(normalizeTarballPath('package\\.env.local'), 'package/.env.local');
  assert.equal(stripPackagePrefix('package/.env.local'), '.env.local');
  assert.equal(stripPackagePrefix('src/create-quiver/index.js'), 'src/create-quiver/index.js');
});

test('collectPackageSafetyViolations flags sensitive local files in package tarball paths', () => {
  const violations = collectPackageSafetyViolations([
    'package/.env.production.local',
    'package/.npmrc',
    'package/.npm/_authToken',
    'package/.claude/state.json',
    'package/.codex/cache.json',
    'package/.quiver/runs/run-123/raw/provider-output.json',
    'package/.quiver/session.json',
    'package/.worktrees/active/index.json',
    'package/WORKTREE_CONTEXT.md',
    'package/quiver-spec-viewer/package.json',
  ]);

  assert.deepEqual(violations, [
    { code: 'env-file', path: 'package/.env.production.local' },
    { code: 'npm-credentials', path: 'package/.npmrc' },
    { code: 'npm-credentials', path: 'package/.npm/_authToken' },
    { code: 'ai-tool-state', path: 'package/.claude/state.json' },
    { code: 'ai-tool-state', path: 'package/.codex/cache.json' },
    { code: 'ai-raw-artifact', path: 'package/.quiver/runs/run-123/raw/provider-output.json' },
    { code: 'ai-tool-state', path: 'package/.quiver/session.json' },
    { code: 'worktree-state', path: 'package/.worktrees/active/index.json' },
    { code: 'worktree-context', path: 'package/WORKTREE_CONTEXT.md' },
    { code: 'demo-output', path: 'package/quiver-spec-viewer/package.json' },
  ]);
});

test('assertPackageSafety passes safe tarball paths', () => {
  const result = assertPackageSafety([
    'package/package.json',
    'package/bin/create-quiver.js',
    'package/src/create-quiver/lib/package-safety.js',
    'package/docs/README.md',
  ]);

  assert.equal(result.ok, true);
  assert.deepEqual(result.violations, []);
});

test('assertPackageSafety fails with a clear code when unsafe tarball paths are present', () => {
  assert.throws(
    () => assertPackageSafety(['package/.env', 'package/.npmrc']),
    (error) => {
      assert.equal(error.code, 'PACKAGE_SAFETY_FAILED');
      assert.equal(error.violations.length, 2);
      assert.match(error.message, /PACKAGE_SAFETY_FAILED/);
      assert.match(error.message, /package\/\.env \[env-file\]/);
      assert.match(error.message, /package\/\.npmrc \[npm-credentials\]/);
      return true;
    },
  );
});
