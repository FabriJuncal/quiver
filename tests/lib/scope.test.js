const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const test = require('node:test');

const {
  allowedPathMatches,
  checkScope,
  diffWorktreeSnapshots,
  parseStatusPorcelain,
  validateScopeSnapshot,
} = require('../../src/create-quiver/lib/scope');

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function makeGitRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-scope-'));
  cp.execFileSync('git', ['init', '-q'], { cwd: root });
  cp.execFileSync('git', ['config', 'user.name', 'Quiver Test'], { cwd: root });
  cp.execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
  cp.execFileSync('git', ['checkout', '-b', 'main'], { cwd: root });

  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function commitAll(root, message) {
  cp.execFileSync('git', ['add', '.'], { cwd: root });
  cp.execFileSync('git', ['commit', '-m', message, '--quiet'], { cwd: root });
}

function captureConsole(fn) {
  const originalLog = console.log;
  const lines = [];
  console.log = (...args) => lines.push(args.join(' '));
  try {
    fn();
  } finally {
    console.log = originalLog;
  }
  return lines.join('\n');
}

function seedScopeSlice(root, baseBranch = 'main') {
  writeFile(path.join(root, 'specs/spec-a/SPEC.md'), '# Spec\n');
  writeFile(path.join(root, 'specs/spec-a/STATUS.md'), '# Status\n');
  writeFile(path.join(root, 'specs/spec-a/EVIDENCE_REPORT.md'), '# Evidence\n');
  writeFile(path.join(root, 'specs/spec-a/slices/slice-01-alpha/slice.json'), `${JSON.stringify({
    slice_id: 'slice-01-alpha',
    ticket: 'QUIVER-01',
    type: 'feature',
    title: 'Alpha',
    objective: 'Change alpha.',
    git: {
      branch_type: 'feature',
      base_branch: baseBranch,
      branch_slug: 'slice-01-alpha',
      branch_name: 'feature/QUIVER-01-slice-01-alpha',
    },
    files: ['src/app.js'],
    acceptance: ['App changes are scoped.'],
    status: 'ready',
  }, null, 2)}\n`);
  writeFile(path.join(root, 'src/app.js'), 'module.exports = 1;\n');
}

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

test('validateScopeSnapshot supports exact paths and mixed exact plus glob scopes', () => {
  assert.equal(allowedPathMatches('src/app.js', 'src/app.js'), true);
  assert.equal(allowedPathMatches('src/app.test.js', 'src/app.js'), false);
  assert.equal(allowedPathMatches('src/features/demo/view.ts', 'src/features/**'), true);

  const result = validateScopeSnapshot({
    allowedFiles: ['src/app.js', 'tests/**'],
    beforeSnapshot: {
      files: [],
      raw: '',
      repoRoot: '/tmp/repo',
    },
    afterSnapshot: {
      files: ['src/app.js', 'tests/app.test.js'],
      raw: '',
      repoRoot: '/tmp/repo',
    },
    strict: true,
  });

  assert.equal(result.ok, true);
});

test('checkScope uses slice git.base_branch instead of hardcoded develop', () => {
  const repo = makeGitRepo();
  const previous = process.cwd();
  try {
    seedScopeSlice(repo.root, 'main');
    commitAll(repo.root, 'base');
    cp.execFileSync('git', ['checkout', '-b', 'feature/QUIVER-01-slice-01-alpha'], { cwd: repo.root });
    writeFile(path.join(repo.root, 'src/app.js'), 'module.exports = 2;\n');
    commitAll(repo.root, 'feature change');

    process.chdir(repo.root);
    const output = captureConsole(() => checkScope('specs/spec-a/slices/slice-01-alpha/slice.json', { strict: true }));

    assert.match(output, /INFO: check-scope base: main \(slice\.git\.base_branch\)/);
    assert.match(output, /PASS: Todos los archivos tocados estan dentro del scope/);
  } finally {
    process.chdir(previous);
    repo.cleanup();
  }
});

test('checkScope respects an explicit base branch before slice git.base_branch', () => {
  const repo = makeGitRepo();
  const previous = process.cwd();
  try {
    seedScopeSlice(repo.root, 'develop');
    commitAll(repo.root, 'base');
    cp.execFileSync('git', ['branch', 'release/base'], { cwd: repo.root });
    cp.execFileSync('git', ['checkout', '-b', 'feature/QUIVER-01-slice-01-alpha'], { cwd: repo.root });
    writeFile(path.join(repo.root, 'src/app.js'), 'module.exports = 2;\n');
    commitAll(repo.root, 'feature change');

    process.chdir(repo.root);
    const output = captureConsole(() => checkScope('specs/spec-a/slices/slice-01-alpha/slice.json', {
      baseBranch: 'release/base',
      strict: true,
    }));

    assert.match(output, /INFO: check-scope base: release\/base \(--base\)/);
    assert.doesNotMatch(output, /develop/);
    assert.match(output, /PASS: Todos los archivos tocados estan dentro del scope/);
  } finally {
    process.chdir(previous);
    repo.cleanup();
  }
});
