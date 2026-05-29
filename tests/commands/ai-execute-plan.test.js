const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const { runExecutePlan } = require('../../src/create-quiver/commands/ai');
const { acquireLock, releaseLock } = require('../../src/create-quiver/lib/locks');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

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

function slice(sliceId, files, extra = {}) {
  const data = {
    slice_id: sliceId,
    ticket: extra.ticket || 'QUIVER-01',
    type: extra.type || 'feature',
    title: extra.title || sliceId,
    git: {
      branch_type: 'feature',
      base_branch: 'main',
      branch_slug: sliceId,
      branch_name: `feature/QUIVER-01-${sliceId}`,
    },
    files,
    status: extra.status || 'draft',
    acceptance: [`Acceptance for ${sliceId}`],
    tests: [],
    ...(extra.depends_on !== undefined ? { depends_on: extra.depends_on } : {}),
  };

  if (extra.allowed_write_paths !== undefined) {
    data.allowed_write_paths = extra.allowed_write_paths;
  }

  return data;
}

function makeProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-execute-plan-'));
  writeJson(path.join(root, 'specs/demo/slices/slice-00-spec-foundation/slice.json'), slice('slice-00-spec-foundation', ['docs/foundation.md'], {
    status: 'completed',
    type: 'docs',
  }));
  writeJson(path.join(root, 'specs/demo/slices/slice-01-alpha/slice.json'), slice('slice-01-alpha', ['src/alpha.js'], {
    depends_on: [],
  }));
  writeJson(path.join(root, 'specs/demo/slices/slice-02-beta/slice.json'), slice('slice-02-beta', ['src/beta.js'], {
    depends_on: [],
  }));

  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function makeGitProject() {
  const project = makeProject();
  writeFile(path.join(project.root, 'src/alpha.js'), 'module.exports = "base-alpha";\n');
  writeFile(path.join(project.root, 'src/beta.js'), 'module.exports = "base-beta";\n');
  git(project.root, ['init']);
  git(project.root, ['config', 'user.email', 'test@example.com']);
  git(project.root, ['config', 'user.name', 'Test User']);
  git(project.root, ['checkout', '-b', 'feature/execute-plan']);
  git(project.root, ['add', '.']);
  git(project.root, ['commit', '-m', 'init']);
  return project;
}

test('ai execute-plan CLI dry-run prints commands without calling providers', () => {
  const project = makeProject();
  try {
    const output = execFileSync('node', [BIN_PATH, 'ai', 'execute-plan', '--dry-run', '--commit'], {
      cwd: project.root,
      encoding: 'utf8',
    });

    assert.ok(output.includes('AI execute-plan dry-run'));
    assert.ok(output.includes('Execution mode: auto'));
    assert.ok(output.includes('Wave 0: parallel-ready'));
    assert.ok(output.includes('npx create-quiver ai prompt-slice --slice "specs/demo/slices/slice-01-alpha/slice.json" --dry-run'));
    assert.ok(output.includes('npx create-quiver ai execute-slice --slice "specs/demo/slices/slice-01-alpha/slice.json" --provider codex --commit'));
  } finally {
    project.cleanup();
  }
});

test('ai execute-plan CLI dry-run supports manual mode', () => {
  const project = makeProject();
  try {
    const output = execFileSync('node', [BIN_PATH, 'ai', 'execute-plan', '--dry-run', '--mode', 'manual'], {
      cwd: project.root,
      encoding: 'utf8',
    });

    assert.ok(output.includes('Execution mode: manual'));
    assert.ok(output.includes('npx create-quiver ai prompt-slice --slice "specs/demo/slices/slice-01-alpha/slice.json" --dry-run'));
    assert.ok(!output.includes('npx create-quiver ai execute-slice --slice'));
  } finally {
    project.cleanup();
  }
});

test('ai execute-plan CLI dry-run renders Spanish wrappers while preserving commands', () => {
  const project = makeProject();
  try {
    const output = execFileSync('node', [BIN_PATH, '--lang', 'es', 'ai', 'execute-plan', '--dry-run', '--commit'], {
      cwd: project.root,
      encoding: 'utf8',
    });

    assert.ok(output.includes('Dry-run de AI execute-plan'));
    assert.ok(output.includes('Modo de ejecucion: auto'));
    assert.ok(output.includes('Commit despues de cada slice: activado'));
    assert.ok(output.includes('Wave 0: parallel-ready'));
    assert.ok(output.includes('Prompt: npx create-quiver ai prompt-slice --slice "specs/demo/slices/slice-01-alpha/slice.json" --dry-run'));
    assert.ok(output.includes('Ejecutar: npx create-quiver ai execute-slice --slice "specs/demo/slices/slice-01-alpha/slice.json" --provider codex --commit'));
  } finally {
    project.cleanup();
  }
});

test('ai execute-plan CLI JSON exposes downstream wave and scope metadata', () => {
  const project = makeProject();
  try {
    const output = execFileSync('node', [BIN_PATH, 'ai', 'execute-plan', '--json'], {
      cwd: project.root,
      encoding: 'utf8',
    });
    const parsed = JSON.parse(output);
    const alpha = parsed.ready_levels[0].slices.find((item) => item.slice_id === 'slice-01-alpha');

    assert.equal(parsed.summary.ready_levels, 1);
    assert.equal(parsed.ready_levels[0].parallel_ready, true);
    assert.deepEqual(alpha.files, ['src/alpha.js']);
    assert.ok(Array.isArray(alpha.allowed_write_paths));
    assert.ok(Array.isArray(parsed.integration_order));
  } finally {
    project.cleanup();
  }
});

test('runExecutePlan executes slices with commit enabled and stops on failure', async () => {
  const project = makeProject();
  const calls = [];
  try {
    await assert.rejects(
      runExecutePlan(project.root, {
        commit: true,
        execute: true,
        provider: 'codex',
        runExecuteSliceFn: async (repoRoot, options) => {
          calls.push(options);
          assert.equal(repoRoot, project.root);
          assert.equal(options.commit, true);
          if (options.slice.includes('slice-02-beta')) {
            const error = new Error('provider failed');
            error.code = 'PROVIDER_FAILED';
            throw error;
          }
          return { ok: true };
        },
      }),
      (error) => error.code === 'PROVIDER_FAILED'
        && error.message.includes('ai execute-plan stopped')
        && error.message.includes('demo/slice-02-beta'),
    );

    assert.deepEqual(calls.map((call) => call.slice), [
      'specs/demo/slices/slice-01-alpha/slice.json',
      'specs/demo/slices/slice-02-beta/slice.json',
    ]);
  } finally {
    project.cleanup();
  }
});

test('runExecutePlan requires --commit for real execution', async () => {
  const project = makeProject();
  try {
    await assert.rejects(
      runExecutePlan(project.root, {
        execute: true,
        runExecuteSliceFn: async () => {
          throw new Error('should not run');
        },
      }),
      /requires --commit/,
    );
  } finally {
    project.cleanup();
  }
});

test('runExecutePlan delegated mode uses temporary worktrees for parallel slices and integrates commits', async () => {
  const project = makeGitProject();
  const worktreesRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-execute-worktrees-'));
  const calls = [];
  try {
    const result = await runExecutePlan(project.root, {
      commit: true,
      execute: true,
      mode: 'delegated',
      provider: 'codex',
      runId: 'testrun',
      worktreesRoot,
      runExecuteSliceFn: async (worktreeRoot, options) => {
        calls.push({ options, worktreeRoot });
        const target = options.slice.includes('slice-01-alpha') ? 'src/alpha.js' : 'src/beta.js';
        writeFile(path.join(worktreeRoot, target), `module.exports = ${JSON.stringify(path.basename(target))};\n`);
        git(worktreeRoot, ['add', target]);
        git(worktreeRoot, ['commit', '-m', `feat: update ${path.basename(target)}`]);
        return {
          commitResult: {
            hash: git(worktreeRoot, ['rev-parse', '--short', 'HEAD']),
          },
        };
      },
    });

    assert.equal(result.results.length, 2);
    assert.ok(result.results.every((item) => item.mode === 'parallel-worktree'));
    assert.equal(calls.length, 2);
    assert.ok(calls.every((call) => call.worktreeRoot !== project.root));
    assert.notEqual(calls[0].worktreeRoot, calls[1].worktreeRoot);
    assert.equal(fs.readFileSync(path.join(project.root, 'src/alpha.js'), 'utf8'), 'module.exports = "alpha.js";\n');
    assert.equal(fs.readFileSync(path.join(project.root, 'src/beta.js'), 'utf8'), 'module.exports = "beta.js";\n');
    assert.equal(git(project.root, ['status', '--porcelain']), '');
    assert.equal(git(project.root, ['log', '--format=%s', '-2']), 'feat: update beta.js\nfeat: update alpha.js');
  } finally {
    project.cleanup();
    fs.rmSync(worktreesRoot, { recursive: true, force: true });
  }
});

test('runExecutePlan delegated mode rejects a concurrent run lock', async () => {
  const project = makeGitProject();
  let lock;
  try {
    lock = acquireLock(project.root, 'execute-plan-testrun', {
      command: 'other delegated run',
      now: new Date('2026-05-24T00:00:00.000Z'),
    });

    await assert.rejects(
      runExecutePlan(project.root, {
        commit: true,
        execute: true,
        mode: 'delegated',
        provider: 'codex',
        runId: 'testrun',
        runExecuteSliceFn: async () => {
          throw new Error('provider should not run');
        },
      }),
      (error) => String(error.message || error).includes('operation is locked')
        && String(error.message || error).includes('command=other delegated run'),
    );
  } finally {
    releaseLock(lock);
    project.cleanup();
  }
});
