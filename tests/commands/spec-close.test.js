const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

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

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-spec-close-'));
  git(root, ['init', '-q']);
  git(root, ['config', 'user.email', 'test@example.com']);
  git(root, ['config', 'user.name', 'Test User']);
  git(root, ['checkout', '-b', 'main']);
  writeFile(path.join(root, 'specs/example-spec/SPEC.md'), '# Example\n');
  writeFile(path.join(root, 'specs/example-spec/slices/slice-00-spec-foundation/slice.json'), `${JSON.stringify({
    slice_id: 'slice-00-spec-foundation',
    ticket: 'QUIVER-22-00',
    title: 'Spec foundation',
    status: 'completed',
  }, null, 2)}\n`);
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
        // ignore cleanup failures in temp repos
      }
      fs.rmSync(root, { recursive: true, force: true });
      fs.rmSync(path.join(path.dirname(root), '.worktrees', path.basename(root)), { recursive: true, force: true });
    },
  };
}

function execCli(repoRoot, args) {
  return execFileSync(process.execPath, [BIN_PATH, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function startSpec(repoRoot) {
  const output = execCli(repoRoot, ['spec', 'start', 'specs/example-spec']);
  const line = output.split('\n').find((item) => item.startsWith('Worktree: '));
  return line.slice('Worktree: '.length);
}

function commitInWorktree(worktreePath) {
  writeFile(path.join(worktreePath, 'src/app.js'), 'module.exports = 1;\n');
  git(worktreePath, ['add', '.']);
  git(worktreePath, ['commit', '-m', 'feature work']);
}

test('spec close blocks when spec branch is not merged', () => {
  const repo = makeRepo();
  try {
    const worktreePath = startSpec(repo.root);
    commitInWorktree(worktreePath);

    assert.throws(
      () => execCli(repo.root, ['spec', 'close', 'specs/example-spec']),
      (error) => error.stderr.includes('is not merged'),
    );
    assert.equal(fs.existsSync(worktreePath), true);
  } finally {
    repo.cleanup();
  }
});

test('spec close blocks dirty spec worktrees by default', () => {
  const repo = makeRepo();
  try {
    const worktreePath = startSpec(repo.root);
    writeFile(path.join(worktreePath, 'dirty.txt'), 'dirty\n');

    assert.throws(
      () => execCli(repo.root, ['spec', 'close', 'specs/example-spec']),
      (error) => error.stderr.includes('spec worktree is dirty'),
    );
    assert.equal(fs.existsSync(worktreePath), true);
  } finally {
    repo.cleanup();
  }
});

test('spec close dry-run keeps merged clean worktree in place', () => {
  const repo = makeRepo();
  try {
    const worktreePath = startSpec(repo.root);
    commitInWorktree(worktreePath);
    git(repo.root, ['merge', '--no-ff', 'feature/example-spec', '-m', 'merge spec']);

    const output = execCli(repo.root, ['spec', 'close', 'specs/example-spec', '--dry-run']);

    assert.ok(output.includes('Spec close dry-run'));
    assert.ok(output.includes('Would remove worktree'));
    assert.equal(fs.existsSync(worktreePath), true);
  } finally {
    repo.cleanup();
  }
});

test('spec close removes a merged clean spec worktree', () => {
  const repo = makeRepo();
  try {
    const worktreePath = startSpec(repo.root);
    commitInWorktree(worktreePath);
    git(repo.root, ['merge', '--no-ff', 'feature/example-spec', '-m', 'merge spec']);

    const output = execCli(repo.root, ['spec', 'close', 'specs/example-spec']);

    assert.ok(output.includes('Spec worktree closed'));
    assert.ok(output.includes('Removed worktree: yes'));
    assert.equal(fs.existsSync(worktreePath), false);
  } finally {
    repo.cleanup();
  }
});
