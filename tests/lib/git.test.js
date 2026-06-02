const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const test = require('node:test');

const {
  buildBaseBranchCandidates,
  remoteHeadBranch,
  resolveBaseBranchName,
  resolveBaseRef,
  withWindowsLongPaths,
} = require('../../src/create-quiver/lib/git');

function git(cwd, args) {
  return cp.execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-git-policy-'));
  git(root, ['init', '-q']);
  git(root, ['config', 'user.email', 'test@example.com']);
  git(root, ['config', 'user.name', 'Test User']);
  fs.writeFileSync(path.join(root, 'README.md'), '# repo\n');
  git(root, ['add', '.']);
  git(root, ['commit', '-m', 'init', '--quiet']);
  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

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

test('base branch candidates keep explicit override before all defaults', () => {
  const repo = makeRepo();
  try {
    const candidates = buildBaseBranchCandidates(repo.root, {
      explicitBaseBranch: 'release/base',
      preferredBaseBranch: 'main',
    });

    assert.deepEqual(candidates.map((candidate) => candidate.branch), ['release/base']);
    assert.equal(candidates[0].source, '--base');
  } finally {
    repo.cleanup();
  }
});

test('base branch resolution uses remote HEAD when available', () => {
  const repo = makeRepo();
  try {
    git(repo.root, ['branch', '-M', 'trunk']);
    git(repo.root, ['update-ref', 'refs/remotes/origin/trunk', 'HEAD']);
    git(repo.root, ['symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/trunk']);

    assert.equal(remoteHeadBranch(repo.root), 'trunk');

    const resolution = resolveBaseRef(repo.root);
    assert.equal(resolution.baseBranch, 'trunk');
    assert.equal(resolution.baseRef, 'origin/trunk');
    assert.equal(resolution.source, 'remote HEAD');
    assert.equal(resolveBaseBranchName(repo.root), 'trunk');
  } finally {
    repo.cleanup();
  }
});

test('base branch resolution falls back to local main, master, then develop', () => {
  const repo = makeRepo();
  try {
    git(repo.root, ['branch', '-M', 'master']);
    assert.equal(resolveBaseRef(repo.root).baseBranch, 'master');

    git(repo.root, ['branch', 'develop']);
    assert.equal(resolveBaseRef(repo.root).baseBranch, 'master');

    git(repo.root, ['branch', 'main']);
    assert.equal(resolveBaseRef(repo.root).baseBranch, 'main');
  } finally {
    repo.cleanup();
  }
});
