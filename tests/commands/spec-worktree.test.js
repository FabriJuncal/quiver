const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const {
  safeBranchName,
  worktreesRootForRepo,
} = require('../../src/create-quiver/lib/slice');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function git(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function makeRepo(structure = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-spec-worktree-'));
  git(root, ['init', '-q']);
  git(root, ['config', 'user.email', 'test@example.com']);
  git(root, ['config', 'user.name', 'Test User']);
  git(root, ['checkout', '-b', 'main']);

  for (const [relativePath, contents] of Object.entries(structure)) {
    writeFile(path.join(root, relativePath), contents);
  }

  git(root, ['add', '.']);
  git(root, ['commit', '-m', 'init']);

  return {
    root,
    cleanup() {
      try {
        for (const block of git(root, ['worktree', 'list', '--porcelain']).split('\n\n').filter(Boolean)) {
          const line = block.split('\n').find((item) => item.startsWith('worktree '));
          const worktreePath = line ? line.slice('worktree '.length) : '';
          if (worktreePath && worktreePath !== root) {
            execFileSync('git', ['-C', root, 'worktree', 'remove', '--force', worktreePath], { stdio: 'ignore' });
          }
        }
      } catch {
        // ignore cleanup failures in test temp dirs
      }
      fs.rmSync(root, { recursive: true, force: true });
      fs.rmSync(path.join(path.dirname(root), '.worktrees', path.basename(root)), { recursive: true, force: true });
    },
  };
}

function sliceJson(sliceId, status) {
  return `${JSON.stringify({
    slice_id: sliceId,
    ticket: 'QUIVER-22',
    title: sliceId,
    status,
  }, null, 2)}\n`;
}

function execCli(repoRoot, args) {
  return execFileSync(process.execPath, [BIN_PATH, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

test('spec status shows slice-00 status and pending slices', () => {
  const repo = makeRepo({
    'specs/example-spec/SPEC.md': '# Example\n',
    'specs/example-spec/slices/slice-00-spec-foundation/slice.json': sliceJson('slice-00-spec-foundation', 'completed'),
    'specs/example-spec/slices/slice-01-feature/slice.json': sliceJson('slice-01-feature', 'draft'),
  });

  try {
    const output = execCli(repo.root, ['spec', 'status', 'specs/example-spec']);

    assert.ok(output.includes('Spec worktree status'));
    assert.ok(output.includes('Spec: specs/example-spec'));
    assert.ok(output.includes('Branch: feature/example-spec'));
    assert.ok(output.includes('slice-00: completed'));
    assert.ok(output.includes('Later slices blocked: no'));
    assert.ok(output.includes('- slice-01-feature: draft'));
  } finally {
    repo.cleanup();
  }
});

test('spec status blocks later slices until slice-00 is completed', () => {
  const repo = makeRepo({
    'specs/example-spec/SPEC.md': '# Example\n',
    'specs/example-spec/slices/slice-00-spec-foundation/slice.json': sliceJson('slice-00-spec-foundation', 'ready'),
    'specs/example-spec/slices/slice-01-feature/slice.json': sliceJson('slice-01-feature', 'draft'),
  });

  try {
    const output = execCli(repo.root, ['spec', 'status', 'specs/example-spec']);

    assert.ok(output.includes('slice-00: ready'));
    assert.ok(output.includes('Later slices blocked: yes'));
  } finally {
    repo.cleanup();
  }
});

test('spec status reports an expected worktree path that exists but is not registered as stale', () => {
  const repo = makeRepo({
    'specs/example-spec/SPEC.md': '# Example\n',
    'specs/example-spec/slices/slice-00-spec-foundation/slice.json': sliceJson('slice-00-spec-foundation', 'completed'),
  });

  try {
    const branchName = 'feature/example-spec';
    const expectedWorktree = path.join(worktreesRootForRepo(repo.root, branchName), safeBranchName(branchName));
    fs.mkdirSync(expectedWorktree, { recursive: true });
    writeFile(path.join(expectedWorktree, 'README.md'), '# unregistered path\n');

    const output = execCli(repo.root, ['spec', 'status', 'specs/example-spec']);

    assert.ok(output.includes('Worktree missing/stale: yes'));
    assert.ok(output.includes('Worktree registered: no'));
    assert.ok(output.includes('expected path exists but is not registered in git worktree list'));
  } finally {
    repo.cleanup();
  }
});

test('spec start creates and then reuses a dedicated worktree from main', () => {
  const repo = makeRepo({
    'specs/example-spec/SPEC.md': '# Example\n',
    'specs/example-spec/slices/slice-00-spec-foundation/slice.json': sliceJson('slice-00-spec-foundation', 'completed'),
  });

  try {
    const output = execCli(repo.root, ['spec', 'start', 'specs/example-spec']);
    assert.ok(output.includes('Spec worktree ready'));
    assert.ok(output.includes('Branch: feature/example-spec'));
    assert.ok(output.includes('Base: main'));
    assert.ok(output.includes('Reused: no'));

    const reused = execCli(repo.root, ['spec', 'start', 'specs/example-spec']);
    assert.ok(reused.includes('Reused: yes'));
  } finally {
    repo.cleanup();
  }
});

test('spec start refuses a dirty checkout', () => {
  const repo = makeRepo({
    'specs/example-spec/SPEC.md': '# Example\n',
    'specs/example-spec/slices/slice-00-spec-foundation/slice.json': sliceJson('slice-00-spec-foundation', 'completed'),
  });

  try {
    writeFile(path.join(repo.root, 'dirty.txt'), 'dirty\n');

    assert.throws(
      () => execCli(repo.root, ['spec', 'start', 'specs/example-spec', '--dry-run']),
      (error) => error.stderr.includes('current checkout is not clean')
        && error.stderr.includes('Dirty files:')
        && error.stderr.includes('dirty.txt')
        && error.stderr.includes('Safe options:')
        && error.stderr.includes('Commit the current changes'),
    );
  } finally {
    repo.cleanup();
  }
});
