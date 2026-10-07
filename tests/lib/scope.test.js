const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const test = require('node:test');

const {
  allowedPathMatches,
  checkScope,
  captureWorktreeSnapshot,
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

function withSnapshotRepo(fn) {
  const repo = makeGitRepo();
  try {
    writeFile(path.join(repo.root, 'tracked.txt'), 'base\n');
    writeFile(path.join(repo.root, 'nested/child.txt'), 'child\n');
    writeFile(path.join(repo.root, '.gitignore'), 'ignored/\n');
    commitAll(repo.root, 'seed snapshot files');
    fn(repo.root);
  } finally {
    repo.cleanup();
  }
}

const snapshotCases = [
  ['unchanged dirty tracked and untracked files', (root) => {
    writeFile(path.join(root, 'tracked.txt'), 'user\n');
    writeFile(path.join(root, 'new/note.txt'), 'user\n');
  }, () => {}, []],
  ['same-size dirty edit with restored timestamps', (root) => {
    writeFile(path.join(root, 'tracked.txt'), 'user\n');
  }, (root) => {
    const file = path.join(root, 'tracked.txt');
    const stat = fs.statSync(file);
    fs.writeFileSync(file, 'next\n');
    fs.utimesSync(file, stat.atime, stat.mtime);
  }, ['tracked.txt']],
  ['dirty tracked file restored to HEAD', (root) => {
    writeFile(path.join(root, 'tracked.txt'), 'user\n');
  }, (root) => writeFile(path.join(root, 'tracked.txt'), 'base\n'), ['tracked.txt']],
  ['dirty tracked file deleted', (root) => {
    writeFile(path.join(root, 'tracked.txt'), 'user\n');
  }, (root) => fs.unlinkSync(path.join(root, 'tracked.txt')), ['tracked.txt']],
  ['already-deleted tracked file recreated', (root) => {
    fs.unlinkSync(path.join(root, 'tracked.txt'));
  }, (root) => writeFile(path.join(root, 'tracked.txt'), 'base\n'), ['tracked.txt']],
  ['existing untracked file deleted', (root) => {
    writeFile(path.join(root, 'new/note.txt'), 'user\n');
  }, (root) => fs.unlinkSync(path.join(root, 'new/note.txt')), ['new/note.txt']],
  ['existing untracked directory child edited', (root) => {
    writeFile(path.join(root, 'new/note.txt'), 'user\n');
  }, (root) => writeFile(path.join(root, 'new/note.txt'), 'next\n'), ['new/note.txt']],
  ['new untracked directory child', () => {}, (root) => {
    writeFile(path.join(root, 'new/note.txt'), 'next\n');
  }, ['new/note.txt']],
  ['both endpoints of a staged rename', () => {}, (root) => {
    cp.execFileSync('git', ['mv', 'tracked.txt', 'renamed.txt'], { cwd: root });
  }, ['renamed.txt', 'tracked.txt']],
  ['staging a pre-existing worktree edit', (root) => {
    writeFile(path.join(root, 'tracked.txt'), 'user\n');
  }, (root) => cp.execFileSync('git', ['add', 'tracked.txt'], { cwd: root }), ['tracked.txt']],
  ['ignored files remain outside the Git snapshot', () => {}, (root) => {
    writeFile(path.join(root, 'ignored/cache.txt'), 'cache\n');
  }, []],
  ['untracked paths with quotes, Unicode and newlines', (root) => {
    writeFile(path.join(root, 'odd "ñ\nname.txt'), 'user\n');
  }, (root) => writeFile(path.join(root, 'odd "ñ\nname.txt'), 'next\n'), ['odd "ñ\nname.txt']],
];

for (const [name, prepare, mutate, expected] of snapshotCases) {
  test(`content-aware snapshots detect ${name}`, {
    skip: process.platform === 'win32' && name.includes('newlines') && 'Windows disallows these filename characters',
  }, () => withSnapshotRepo((root) => {
    prepare(root);
    const before = captureWorktreeSnapshot(root);
    mutate(root);
    const after = captureWorktreeSnapshot(root);
    assert.deepEqual(diffWorktreeSnapshots(before, after).sort(), expected.slice().sort());
  }));
}

test('content-aware snapshots detect permission changes on dirty files', {
  skip: process.platform === 'win32' && 'Windows does not support POSIX executable permissions',
}, () => withSnapshotRepo((root) => {
  const file = path.join(root, 'tracked.txt');
  writeFile(file, 'user\n');
  fs.chmodSync(file, 0o644);
  const before = captureWorktreeSnapshot(root);
  fs.chmodSync(file, 0o755);
  assert.deepEqual(diffWorktreeSnapshots(before, captureWorktreeSnapshot(root)), ['tracked.txt']);
}));

test('content-aware snapshots inspect symlink targets without following them', {
  skip: process.platform === 'win32' && 'Symlink creation may require Windows privileges',
}, () => withSnapshotRepo((root) => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-scope-target-'));
  try {
    writeFile(path.join(target, 'one'), 'outside\n');
    const link = path.join(root, 'link');
    fs.symlinkSync(path.join(target, 'one'), link);
    const before = captureWorktreeSnapshot(root);
    writeFile(path.join(target, 'one'), 'external edit\n');
    assert.deepEqual(diffWorktreeSnapshots(before, captureWorktreeSnapshot(root)), []);
    fs.unlinkSync(link);
    fs.symlinkSync(path.join(target, 'two'), link);
    assert.deepEqual(diffWorktreeSnapshots(before, captureWorktreeSnapshot(root)), ['link']);
    // Replacing a tracked parent with a symlink must not read the external child.
    const beforeParent = captureWorktreeSnapshot(root);
    fs.rmSync(path.join(root, 'nested'), { recursive: true });
    fs.symlinkSync(target, path.join(root, 'nested'));
    const afterParent = captureWorktreeSnapshot(root);
    assert.ok(diffWorktreeSnapshots(beforeParent, afterParent).includes('nested/child.txt'));
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
}));

test('content-aware snapshots fail closed when mixed with legacy snapshots', () => {
  assert.throws(() => diffWorktreeSnapshots({ files: [] }, { fingerprints: {} }),
    (error) => error.code === 'SCOPE_SNAPSHOT_MISMATCH');
});


test('clean worktrees, including tracked submodules, need no content fingerprints', () => withSnapshotRepo((root) => {
  const commit = cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const submodule = path.join(root, 'module');
  cp.execFileSync('git', ['-c', 'protocol.file.allow=always', 'clone', '-q', root, submodule]);
  cp.execFileSync('git', ['update-index', '--add', '--cacheinfo', `160000,${commit},module`], { cwd: root });
  cp.execFileSync('git', ['commit', '-qm', 'seed clean gitlink'], { cwd: root });
  const snapshot = captureWorktreeSnapshot(root);
  assert.deepEqual(snapshot.files, []);
  assert.deepEqual(Object.keys(snapshot.fingerprints), []);
}));

test('dirty submodule snapshots fail closed with an actionable unsupported-path error', () => withSnapshotRepo((root) => {
  const commit = cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const submodule = path.join(root, 'module');
  cp.execFileSync('git', ['-c', 'protocol.file.allow=always', 'clone', '-q', root, submodule]);
  cp.execFileSync('git', ['update-index', '--add', '--cacheinfo', `160000,${commit},module`], { cwd: root });
  cp.execFileSync('git', ['commit', '-qm', 'seed gitlink'], { cwd: root });
  writeFile(path.join(submodule, 'tracked.txt'), 'changed\n');
  assert.throws(() => captureWorktreeSnapshot(root),
    (error) => error.code === 'SCOPE_SNAPSHOT_UNSUPPORTED_FILE' && error.message.includes('module'));
}));


test('snapshots reject Git path names that would alias a declared allowed path', {
  skip: process.platform === 'win32' && 'These literal filenames are POSIX-specific',
}, () => {
  for (const name of [' allowed.txt ', 'dir\\allowed.txt']) {
    withSnapshotRepo((root) => {
      writeFile(path.join(root, name), 'before\n');
      assert.throws(() => captureWorktreeSnapshot(root),
        (error) => error.code === 'SCOPE_SNAPSHOT_UNSUPPORTED_PATH');
    });
  }
});

test('snapshots reject non-UTF-8 Git names instead of comparing lossy missing paths', {
  skip: process.platform === 'win32' && 'Arbitrary filename bytes are POSIX-specific',
}, () => withSnapshotRepo((root) => {
  const file = Buffer.concat([Buffer.from(`${root}/invalid-`), Buffer.from([0xff])]);
  fs.writeFileSync(file, 'before');
  assert.throws(() => captureWorktreeSnapshot(root),
    (error) => error.code === 'SCOPE_SNAPSHOT_UNSUPPORTED_PATH');
  fs.writeFileSync(file, 'after!');
  assert.throws(() => captureWorktreeSnapshot(root),
    (error) => error.code === 'SCOPE_SNAPSHOT_UNSUPPORTED_PATH');
}));

test('snapshots compare symlink target bytes without lossy decoding', {
  skip: process.platform === 'win32' && 'Arbitrary symlink target bytes are POSIX-specific',
}, () => withSnapshotRepo((root) => {
  const link = path.join(root, 'link');
  fs.symlinkSync(Buffer.from([0x61, 0xff]), link);
  const before = captureWorktreeSnapshot(root);
  fs.unlinkSync(link);
  fs.symlinkSync(Buffer.from([0x61, 0xfe]), link);
  assert.deepEqual(diffWorktreeSnapshots(before, captureWorktreeSnapshot(root)), ['link']);
}));
