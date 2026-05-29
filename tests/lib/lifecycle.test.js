const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const test = require('node:test');

const { buildSpecStatus, ensureSpecSliceZeroComplete, startSpecWorktree } = require('../../src/create-quiver/lib/spec-worktrees');
const { startSlice } = require('../../src/create-quiver/lib/lifecycle');
const { acquireLock, releaseLock } = require('../../src/create-quiver/lib/locks');

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function writeText(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text);
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

function makeRepo(branchName) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-spec-worktree-'));
  cp.execFileSync('git', ['init', '-q'], { cwd: root });
  cp.execFileSync('git', ['config', 'user.name', 'Quiver Test'], { cwd: root });
  cp.execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root });

  const specDir = path.join(root, 'specs', 'quiver-v22-guided-ai-workflow');
  writeText(path.join(specDir, 'SPEC.md'), '# Spec\n');
  writeText(path.join(specDir, 'STATUS.md'), '# Status\n');
  writeText(path.join(specDir, 'EVIDENCE_REPORT.md'), '# Evidence\n');
  writeText(path.join(specDir, 'EXECUTION_PLAN.md'), '# Plan\n');
  writeText(path.join(specDir, 'pr.md'), '# PR\n');
  writeJson(path.join(specDir, 'slices', 'slice-00-spec-foundation', 'slice.json'), {
    slice_id: 'slice-00-spec-foundation',
    ticket: 'QUIVER-22-00',
    title: 'Spec foundation',
    git: {
      branch_type: 'feature',
      base_branch: branchName,
      branch_slug: 'guided-ai-workflow-spec-foundation',
      branch_name: 'feature/QUIVER-22-00-guided-ai-workflow-spec-foundation',
    },
    status: 'completed',
  });
  writeJson(path.join(specDir, 'slices', 'slice-05-spec-worktree-lifecycle', 'slice.json'), {
    slice_id: 'slice-05-spec-worktree-lifecycle',
    ticket: 'QUIVER-22-05',
    title: 'Spec worktree lifecycle',
    git: {
      branch_type: 'feature',
      base_branch: branchName,
      branch_slug: 'spec-worktree-lifecycle',
      branch_name: 'feature/QUIVER-22-05-spec-worktree-lifecycle',
    },
    status: 'draft',
  });
  writeText(path.join(root, 'README.md'), '# Repo\n');

  cp.execFileSync('git', ['add', '.'], { cwd: root });
  cp.execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: root });
  cp.execFileSync('git', ['branch', '-M', branchName], { cwd: root });

  return {
    root,
    specDir,
    cleanup() {
      try {
        for (const block of cp.execFileSync('git', ['-C', root, 'worktree', 'list', '--porcelain'], { encoding: 'utf8' }).split('\n\n').filter(Boolean)) {
          const line = block.split('\n').find((item) => item.startsWith('worktree '));
          const worktreePath = line ? line.slice('worktree '.length) : '';
          if (worktreePath && worktreePath !== root) {
            cp.execFileSync('git', ['-C', root, 'worktree', 'remove', '--force', worktreePath], { stdio: 'ignore' });
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

test('startSpecWorktree creates and reuses a spec worktree on main', () => {
  const repo = makeRepo('main');
  try {
    const created = startSpecWorktree(repo.root, 'specs/quiver-v22-guided-ai-workflow');
    assert.equal(created.reused, false);
    assert.equal(created.baseRef, 'main');
    assert.equal(fs.existsSync(created.worktreePath), true);

    const reused = startSpecWorktree(repo.root, 'specs/quiver-v22-guided-ai-workflow');
    assert.equal(reused.reused, true);
    assert.equal(fs.realpathSync(reused.worktreePath), fs.realpathSync(created.worktreePath));
  } finally {
    repo.cleanup();
  }
});

test('startSpecWorktree dry-run reports planned worktree without creating it', () => {
  const repo = makeRepo('main');
  try {
    const planned = startSpecWorktree(repo.root, 'specs/quiver-v22-guided-ai-workflow', { dryRun: true });
    assert.equal(planned.dryRun, true);
    assert.equal(planned.reused, false);
    assert.equal(planned.baseRef, 'main');
    assert.equal(fs.existsSync(planned.worktreePath), false);
  } finally {
    repo.cleanup();
  }
});

test('startSpecWorktree supports develop as the base branch', () => {
  const repo = makeRepo('develop');
  try {
    const created = startSpecWorktree(repo.root, 'specs/quiver-v22-guided-ai-workflow');
    assert.equal(created.baseRef, 'develop');
    assert.equal(fs.existsSync(created.worktreePath), true);
  } finally {
    repo.cleanup();
  }
});

test('startSpecWorktree refuses to reuse a dirty existing worktree', () => {
  const repo = makeRepo('main');
  try {
    const created = startSpecWorktree(repo.root, 'specs/quiver-v22-guided-ai-workflow');
    fs.appendFileSync(path.join(created.worktreePath, 'README.md'), '\ndirty\n');

    assert.throws(
      () => startSpecWorktree(repo.root, 'specs/quiver-v22-guided-ai-workflow'),
      (error) => String(error.message || error).includes('existing spec worktree is dirty'),
    );
  } finally {
    repo.cleanup();
  }
});

test('startSpecWorktree reports a stale registered worktree with recovery steps', () => {
  const repo = makeRepo('main');
  try {
    const created = startSpecWorktree(repo.root, 'specs/quiver-v22-guided-ai-workflow');
    fs.rmSync(created.worktreePath, { recursive: true, force: true });

    assert.throws(
      () => startSpecWorktree(repo.root, 'specs/quiver-v22-guided-ai-workflow'),
      (error) => String(error.message || error).includes('missing or stale')
        && String(error.message || error).includes('git worktree prune')
        && String(error.message || error).includes('Do not create a nested replacement worktree'),
    );
  } finally {
    repo.cleanup();
  }
});

test('startSpecWorktree rejects concurrent spec operations with a lock', () => {
  const repo = makeRepo('main');
  let lock;
  try {
    lock = acquireLock(repo.root, 'spec-worktree-quiver-v22-guided-ai-workflow', {
      command: 'test spec operation',
      now: new Date('2026-05-24T00:00:00.000Z'),
    });

    assert.throws(
      () => startSpecWorktree(repo.root, 'specs/quiver-v22-guided-ai-workflow'),
      (error) => String(error.message || error).includes('operation is locked')
        && String(error.message || error).includes('command=test spec operation'),
    );
  } finally {
    releaseLock(lock);
    repo.cleanup();
  }
});

test('startSlice refuses to create nested worktrees from an existing worktree', () => {
  const repo = makeRepo('main');
  const previous = process.cwd();
  try {
    const specWorktree = startSpecWorktree(repo.root, 'specs/quiver-v22-guided-ai-workflow');
    process.chdir(specWorktree.worktreePath);

    assert.throws(
      () => startSlice('specs/quiver-v22-guided-ai-workflow/slices/slice-05-spec-worktree-lifecycle/slice.json', { allowDraft: true }),
      (error) => String(error.message || error).includes('refusing to create a slice worktree from inside a linked worktree')
        && String(error.message || error).includes('prevents nested .worktrees paths'),
    );
  } finally {
    process.chdir(previous);
    repo.cleanup();
  }
});

test('startSlice renders English lifecycle output when requested', () => {
  const repo = makeRepo('main');
  const previous = process.cwd();
  try {
    process.chdir(repo.root);
    const output = captureConsole(() => startSlice('specs/quiver-v22-guided-ai-workflow/slices/slice-05-spec-worktree-lifecycle/slice.json', {
      allowDraft: true,
      language: 'en',
    }));

    assert.match(output, /WARN: intentional bootstrap for a draft slice/);
    assert.match(output, /Wrote docs\/ai\/ACTIVE_SLICE\.md/);
    assert.match(output, /Slice ready to work/);
    assert.match(output, /Branch: feature\/QUIVER-22-05-spec-worktree-lifecycle/);
    assert.match(output, /Context: .*WORKTREE_CONTEXT\.md/);
  } finally {
    process.chdir(previous);
    repo.cleanup();
  }
});

test('describeSpecState reports slice-00 status and pending slices', () => {
  const repo = makeRepo('main');
  try {
    const report = buildSpecStatus(repo.root, 'specs/quiver-v22-guided-ai-workflow');
    assert.equal(report.branchName, 'feature/quiver-v22-guided-ai-workflow');
    assert.equal(report.slice00.status, 'completed');
    assert.equal(report.pendingSlices.some((slice) => slice.id === 'slice-05-spec-worktree-lifecycle'), true);
  } finally {
    repo.cleanup();
  }
});

test('ensureSpecSliceZeroComplete blocks later slices when slice-00 is incomplete', () => {
  const repo = makeRepo('main');
  try {
    writeJson(path.join(repo.specDir, 'slices', 'slice-00-spec-foundation', 'slice.json'), {
      slice_id: 'slice-00-spec-foundation',
      ticket: 'QUIVER-22-00',
      title: 'Spec foundation',
      git: {
        branch_type: 'feature',
        base_branch: 'main',
        branch_slug: 'guided-ai-workflow-spec-foundation',
        branch_name: 'feature/QUIVER-22-00-guided-ai-workflow-spec-foundation',
      },
      status: 'draft',
    });

    assert.throws(
      () => ensureSpecSliceZeroComplete(repo.root, 'specs/quiver-v22-guided-ai-workflow'),
      (error) => String(error.message || error).includes('slice-00 completed'),
    );
  } finally {
    repo.cleanup();
  }
});

test('startSlice blocks later slices until slice-00 is completed', () => {
  const repo = makeRepo('main');
  try {
    writeJson(path.join(repo.specDir, 'slices', 'slice-05-spec-worktree-lifecycle', 'slice.json'), {
      slice_id: 'slice-05-spec-worktree-lifecycle',
      ticket: 'QUIVER-22-05',
      title: 'Spec worktree lifecycle',
      git: {
        branch_type: 'feature',
        base_branch: 'main',
        branch_slug: 'spec-worktree-lifecycle',
        branch_name: 'feature/QUIVER-22-05-spec-worktree-lifecycle',
      },
      status: 'ready',
    });
    writeJson(path.join(repo.specDir, 'slices', 'slice-00-spec-foundation', 'slice.json'), {
      slice_id: 'slice-00-spec-foundation',
      ticket: 'QUIVER-22-00',
      title: 'Spec foundation',
      git: {
        branch_type: 'feature',
        base_branch: 'main',
        branch_slug: 'guided-ai-workflow-spec-foundation',
        branch_name: 'feature/QUIVER-22-00-guided-ai-workflow-spec-foundation',
      },
      status: 'draft',
    });

    cp.execFileSync('git', ['add', '.'], { cwd: repo.root });
    cp.execFileSync('git', ['commit', '-q', '-m', 'update slice zero'], { cwd: repo.root });

    assert.throws(
      () => {
        const previous = process.cwd();
        process.chdir(repo.root);
        try {
          startSlice('specs/quiver-v22-guided-ai-workflow/slices/slice-05-spec-worktree-lifecycle/slice.json', { allowDraft: true });
        } finally {
          process.chdir(previous);
        }
      },
      (error) => String(error.message || error).includes('slice-00 completed'),
    );
  } finally {
    repo.cleanup();
  }
});
