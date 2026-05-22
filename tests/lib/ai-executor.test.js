const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const {
  buildExecuteSliceContext,
  buildManualExecutorPrompt,
  buildSliceCommitMessage,
  resolveSliceJsonPath,
  runExecuteSlice,
} = require('../../src/create-quiver/lib/ai/executor');

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

function createRepo(options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-executor-'));
  const sliceDir = path.join(root, 'specs/demo/slices/slice-01-demo');
  const allowedFile = 'src/app.js';
  const sliceJson = {
    slice_id: 'slice-01-demo',
    ticket: 'QUIVER-01',
    type: 'feature',
    title: 'Demo slice',
    objective: 'Implement demo behavior.',
    description: 'Demo executor fixture.',
    git: {
      branch_type: 'feature',
      base_branch: 'main',
      branch_slug: 'demo',
      branch_name: 'feature/QUIVER-01-demo',
    },
    files: options.files || [allowedFile],
    ...(options.allowedWritePaths ? { allowed_write_paths: options.allowedWritePaths } : {}),
    ...(options.expectedReadPaths ? { expected_read_paths: options.expectedReadPaths } : {}),
    ...(options.validationHints ? { validation_hints: options.validationHints } : {}),
    acceptance: ['Allowed file is changed.'],
    tests: ['node --test tests/demo.test.js'],
    status: 'draft',
  };

  writeFile(path.join(sliceDir, 'slice.json'), `${JSON.stringify(sliceJson, null, 2)}\n`);
  if (options.withBrief !== false) {
    writeFile(path.join(sliceDir, 'EXECUTION_BRIEF.md'), '# Execution Brief\n\nChange the allowed file only.\n');
  }
  if (options.withClosure !== false) {
    writeFile(path.join(sliceDir, 'CLOSURE_BRIEF.md'), '# Closure Brief\n\nUse the final report format.\n');
  }
  writeFile(path.join(root, 'specs/demo/SPEC.md'), '# Demo Spec\n\n## Objective\n\nImplement the demo feature.\n\n## Details\n\nFULL SPEC BODY SENTINEL SHOULD NOT APPEAR.\n');
  writeFile(path.join(root, allowedFile), 'module.exports = 1;\n');
  if (options.withValidation !== false) {
    writeFile(path.join(root, 'tests/demo.test.js'), "const test = require('node:test');\nconst assert = require('node:assert/strict');\ntest('demo', () => assert.equal(1, 1));\n");
  }
  writeFile(path.join(root, 'specs/demo/STATUS.md'), [
    '# Status - Demo',
    '',
    '**Current slice:** slice-01-demo planned',
    '',
    '| Slice | Status | Notes |',
    '|---|---|---|',
    '| slice-01-demo | Planned | Fixture. |',
    '',
  ].join('\n'));
  writeFile(path.join(root, 'specs/demo/EVIDENCE_REPORT.md'), '# Evidence Report - Demo\n');

  git(root, ['init']);
  git(root, ['config', 'user.email', 'test@example.com']);
  git(root, ['config', 'user.name', 'Test User']);
  git(root, ['checkout', '-b', options.branchName || 'feature/QUIVER-01-demo']);
  git(root, ['add', '.']);
  git(root, ['commit', '-m', 'init']);

  return {
    allowedFile,
    root,
    sliceDir,
    slicePath: path.join(sliceDir, 'slice.json'),
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

test('resolveSliceJsonPath accepts a slice directory and reports missing slice.json', () => {
  const repo = createRepo();
  try {
    assert.equal(resolveSliceJsonPath(repo.root, 'specs/demo/slices/slice-01-demo'), repo.slicePath);

    const missingDir = path.join(repo.root, 'specs/demo/slices/slice-02-missing');
    fs.mkdirSync(missingDir, { recursive: true });
    assert.throws(
      () => resolveSliceJsonPath(repo.root, 'specs/demo/slices/slice-02-missing'),
      /missing slice\.json/,
    );
  } finally {
    repo.cleanup();
  }
});

test('buildExecuteSliceContext uses executor slice context without onboarding content', () => {
  const repo = createRepo({
    expectedReadPaths: ['specs/demo/SPEC.md'],
    validationHints: ['Run the declared test command.'],
  });
  try {
    const context = buildExecuteSliceContext({
      repoRoot: repo.root,
      slicePath: repo.slicePath,
      role: 'executor',
      context: 'slice',
    });

    assert.equal(context.context.role, 'executor');
    assert.equal(context.context.packName, 'slice');
    assert.ok(context.prompt.includes('Allowed files:'));
    assert.ok(context.prompt.includes(repo.allowedFile));
    assert.ok(context.prompt.includes('Expected read paths:'));
    assert.ok(context.prompt.includes('specs/demo/SPEC.md'));
    assert.ok(context.prompt.includes('Validation hints:'));
    assert.ok(context.prompt.includes('Run the declared test command.'));
    assert.ok(context.prompt.includes('Execution brief:'));
    assert.ok(!context.prompt.includes('Broad planner onboarding context'));
    assert.ok(!context.prompt.includes('Context pack: full'));
  } finally {
    repo.cleanup();
  }
});

test('buildExecuteSliceContext prefers allowed_write_paths over legacy files', () => {
  const repo = createRepo({ allowedWritePaths: [repoAllowedWritePath()], files: ['legacy/file.js'] });
  try {
    const context = buildExecuteSliceContext({
      repoRoot: repo.root,
      slicePath: repo.slicePath,
      role: 'executor',
      context: 'slice',
    });

    assert.deepEqual(context.allowedFiles, [repoAllowedWritePath()]);
    assert.ok(context.prompt.includes(repoAllowedWritePath()));
    assert.ok(!context.prompt.includes('legacy/file.js'));
  } finally {
    repo.cleanup();
  }
});

function repoAllowedWritePath() {
  return 'src/app.js';
}

test('buildExecuteSliceContext fails when EXECUTION_BRIEF.md is missing', () => {
  const repo = createRepo({ withBrief: false });
  try {
    assert.throws(
      () => buildExecuteSliceContext({
        repoRoot: repo.root,
        slicePath: repo.slicePath,
        role: 'executor',
        context: 'slice',
      }),
      /missing required file: specs\/demo\/slices\/slice-01-demo\/EXECUTION_BRIEF\.md/,
    );
  } finally {
    repo.cleanup();
  }
});

test('buildManualExecutorPrompt uses minimal slice context and final report format', () => {
  const repo = createRepo();
  try {
    const built = buildManualExecutorPrompt({
      repoRoot: repo.root,
      slicePath: repo.slicePath,
    });

    assert.ok(built.prompt.includes('Act as a WDD + SDD executor agent.'));
    assert.ok(built.prompt.includes('Allowed files:'));
    assert.ok(built.prompt.includes(repo.allowedFile));
    assert.ok(built.prompt.includes('Required final report format:'));
    assert.ok(built.prompt.includes('## Cambios realizados'));
    assert.ok(built.prompt.includes('Execution brief content:'));
    assert.ok(built.prompt.includes('Closure brief content:'));
    assert.ok(built.prompt.includes('Title: Demo Spec'));
    assert.ok(!built.prompt.includes('FULL SPEC BODY SENTINEL'));
  } finally {
    repo.cleanup();
  }
});

test('buildManualExecutorPrompt fails when CLOSURE_BRIEF.md is missing', () => {
  const repo = createRepo({ withClosure: false });
  try {
    assert.throws(
      () => buildManualExecutorPrompt({
        repoRoot: repo.root,
        slicePath: repo.slicePath,
      }),
      /missing required file: specs\/demo\/slices\/slice-01-demo\/CLOSURE_BRIEF\.md/,
    );
  } finally {
    repo.cleanup();
  }
});

test('runExecuteSlice dry-run does not execute the provider', async () => {
  const repo = createRepo();
  try {
    const report = await runExecuteSlice(repo.root, {
      dryRun: true,
      provider: 'codex',
      slice: repo.slicePath,
      runProviderFn: async () => {
        throw new Error('provider should not run');
      },
    });

    assert.equal(report.task, 'execute-slice');
    assert.equal(report.role, 'executor');
    assert.equal(report.contextPack, 'slice');
    assert.equal(report.slice, 'slice-01-demo');
  } finally {
    repo.cleanup();
  }
});

test('runExecuteSlice fails clearly when the provider fails', async () => {
  const repo = createRepo();
  try {
    await assert.rejects(
      runExecuteSlice(repo.root, {
        provider: 'codex',
        slice: repo.slicePath,
        runProviderFn: async () => ({
          ok: false,
          stdout: '',
          stderr: '',
          error: {
            code: 'PROVIDER_FAILED',
            message: 'provider exploded',
          },
        }),
      }),
      (error) => error.code === 'PROVIDER_FAILED'
        && error.message.includes('provider exploded')
        && error.message.includes('Recovery:'),
    );
  } finally {
    repo.cleanup();
  }
});

test('runExecuteSlice does not close a slice when provider makes no changes', async () => {
  const repo = createRepo();
  try {
    await assert.rejects(
      runExecuteSlice(repo.root, {
        provider: 'codex',
        slice: repo.slicePath,
        runProviderFn: async () => ({ ok: true, stdout: '', stderr: '' }),
      }),
      (error) => error.code === 'NO_CHANGES_TO_CLOSE'
        && error.message.includes('slice closure was not updated')
        && error.message.includes('Recovery:'),
    );

    assert.equal(fs.existsSync(path.join(repo.root, 'specs/demo/COMMAND_LOG.md')), false);
  } finally {
    repo.cleanup();
  }
});

test('runExecuteSlice detects files outside slice scope after provider execution', async () => {
  const repo = createRepo();
  try {
    await assert.rejects(
      runExecuteSlice(repo.root, {
        commit: true,
        provider: 'codex',
        slice: repo.slicePath,
        runProviderFn: async () => {
          writeFile(path.join(repo.root, 'src/out-of-scope.js'), 'module.exports = 2;\n');
          return { ok: true, stdout: '', stderr: '' };
        },
      }),
      (error) => error.code === 'SCOPE_VIOLATION'
        && error.message.includes('src/out-of-scope.js')
        && error.message.includes('Recovery:')
        && error.details.outOfScopeFiles.includes('src/out-of-scope.js'),
    );
  } finally {
    repo.cleanup();
  }
});

test('runExecuteSlice passes scope validation for allowed files', async () => {
  const repo = createRepo();
  try {
    const result = await runExecuteSlice(repo.root, {
      provider: 'codex',
      slice: repo.slicePath,
      runProviderFn: async () => {
        writeFile(path.join(repo.root, repo.allowedFile), 'module.exports = 3;\n');
        return { ok: true, stdout: '', stderr: '' };
      },
    });

    assert.equal(result.scopeResult.ok, true);
    assert.ok(result.scopeResult.changedFiles.includes(repo.allowedFile));
    assert.ok(result.scopeResult.changedFiles.includes('specs/demo/slices/slice-01-demo/CLOSURE_BRIEF.md'));
    assert.ok(result.scopeResult.changedFiles.includes('specs/demo/EVIDENCE_REPORT.md'));
    assert.ok(result.scopeResult.changedFiles.includes('specs/demo/COMMAND_LOG.md'));
    assert.equal(result.commitResult, null);
    assert.equal(result.validationResults.length, 1);
  } finally {
    repo.cleanup();
  }
});

test('runExecuteSlice blocks execution from the wrong slice worktree branch', async () => {
  const repo = createRepo({ branchName: 'feature/wrong-worktree' });
  try {
    await assert.rejects(
      runExecuteSlice(repo.root, {
        provider: 'codex',
        slice: repo.slicePath,
        runProviderFn: async () => {
          writeFile(path.join(repo.root, repo.allowedFile), 'module.exports = 4;\n');
          return { ok: true, stdout: '', stderr: '' };
        },
      }),
      (error) => error.code === 'WRONG_WORKTREE'
        && error.message.includes('Current branch: feature/wrong-worktree')
        && error.message.includes('Expected: feature/QUIVER-01-demo')
        && error.message.includes('Recovery:'),
    );
  } finally {
    repo.cleanup();
  }
});

test('runExecuteSlice supports allowed_write_paths-only slice scope', async () => {
  const repo = createRepo({ allowedWritePaths: [repoAllowedWritePath()], files: [] });
  try {
    const result = await runExecuteSlice(repo.root, {
      provider: 'codex',
      slice: repo.slicePath,
      runProviderFn: async () => {
        writeFile(path.join(repo.root, repo.allowedFile), 'module.exports = 7;\n');
        return { ok: true, stdout: '', stderr: '' };
      },
    });

    assert.equal(result.scopeResult.ok, true);
    assert.ok(result.scopeResult.allowedFiles.includes(repo.allowedFile));
    assert.ok(result.scopeResult.changedFiles.includes(repo.allowedFile));
  } finally {
    repo.cleanup();
  }
});

test('runExecuteSlice updates closure, evidence, command log, and status with redacted logs', async () => {
  const repo = createRepo();
  try {
    const result = await runExecuteSlice(repo.root, {
      provider: 'codex',
      slice: repo.slicePath,
      runProviderFn: async () => {
        writeFile(path.join(repo.root, repo.allowedFile), 'module.exports = 8;\n');
        return {
          ok: true,
          stdout: 'token=abc123\nchanged file\n',
          stderr: 'password=secret-value\n',
        };
      },
      runValidationCommandFn: () => ({
        command: 'node --test tests/demo.test.js --token=abc123',
        exitCode: 0,
        ok: true,
        stdout: 'api_key=secret123\n',
        stderr: '',
      }),
    });

    const closure = fs.readFileSync(path.join(repo.sliceDir, 'CLOSURE_BRIEF.md'), 'utf8');
    const evidence = fs.readFileSync(path.join(repo.root, 'specs/demo/EVIDENCE_REPORT.md'), 'utf8');
    const commandLog = fs.readFileSync(path.join(repo.root, 'specs/demo/COMMAND_LOG.md'), 'utf8');
    const status = fs.readFileSync(path.join(repo.root, 'specs/demo/STATUS.md'), 'utf8');
    const sliceJson = JSON.parse(fs.readFileSync(repo.slicePath, 'utf8'));

    assert.ok(closure.includes('Validation Against Acceptance Criteria'));
    assert.ok(closure.includes(repo.allowedFile));
    assert.ok(evidence.includes('slice-01-demo - Execution Evidence'));
    assert.ok(evidence.includes('token=[REDACTED]'));
    assert.ok(evidence.includes('password=[REDACTED]'));
    assert.ok(!evidence.includes('abc123'));
    assert.ok(!evidence.includes('secret-value'));
    assert.ok(commandLog.includes('node --test tests/demo.test.js --token=[REDACTED]'));
    assert.ok(status.includes('| slice-01-demo | Completed | Fixture. |'));
    assert.equal(sliceJson.status, 'completed');
    assert.ok(sliceJson.completed_at);
    assert.equal(result.result.stdout.includes('abc123'), false);
    assert.ok(result.artifacts.files.includes('specs/demo/COMMAND_LOG.md'));
  } finally {
    repo.cleanup();
  }
});

test('runExecuteSlice blocks commit when validation fails', async () => {
  const repo = createRepo();
  try {
    const sliceJson = JSON.parse(fs.readFileSync(repo.slicePath, 'utf8'));
    sliceJson.tests = ['node -e "process.exit(1)"'];
    writeFile(repo.slicePath, `${JSON.stringify(sliceJson, null, 2)}\n`);
    git(repo.root, ['add', repo.slicePath]);
    git(repo.root, ['commit', '-m', 'make validation fail']);
    const beforeCount = Number(git(repo.root, ['rev-list', '--count', 'HEAD']));

    await assert.rejects(
      runExecuteSlice(repo.root, {
        commit: true,
        provider: 'codex',
        slice: repo.slicePath,
        runProviderFn: async () => {
          writeFile(path.join(repo.root, repo.allowedFile), 'module.exports = 5;\n');
          return { ok: true, stdout: '', stderr: '' };
        },
      }),
      (error) => error.code === 'VALIDATION_FAILED'
        && error.message.includes('validation command failed')
        && error.message.includes('Recovery:'),
    );

    assert.equal(Number(git(repo.root, ['rev-list', '--count', 'HEAD'])), beforeCount);
  } finally {
    repo.cleanup();
  }
});

test('runExecuteSlice creates one slice commit when commit is enabled', async () => {
  const repo = createRepo();
  try {
    const beforeCount = Number(git(repo.root, ['rev-list', '--count', 'HEAD']));
    const result = await runExecuteSlice(repo.root, {
      commit: true,
      provider: 'codex',
      slice: repo.slicePath,
      runProviderFn: async () => {
        writeFile(path.join(repo.root, repo.allowedFile), 'module.exports = 6;\n');
        return { ok: true, stdout: '', stderr: '' };
      },
    });

    assert.equal(Number(git(repo.root, ['rev-list', '--count', 'HEAD'])), beforeCount + 1);
    assert.equal(git(repo.root, ['status', '--porcelain']), '');
    assert.equal(result.commitResult.message, buildSliceCommitMessage({ json: { title: 'Demo slice', type: 'feature' }, ticket: 'QUIVER-01', sliceId: 'slice-01-demo' }));
    assert.match(git(repo.root, ['log', '-1', '--pretty=%s']), /^feat: QUIVER-01 Demo slice$/);
  } finally {
    repo.cleanup();
  }
});

test('runExecuteSlice requires a clean worktree before execution', async () => {
  const repo = createRepo();
  try {
    writeFile(path.join(repo.root, repo.allowedFile), 'module.exports = 4;\n');
    await assert.rejects(
      runExecuteSlice(repo.root, {
        provider: 'codex',
        slice: repo.slicePath,
        runProviderFn: async () => ({ ok: true, stdout: '', stderr: '' }),
      }),
      /requires a clean worktree/,
    );
  } finally {
    repo.cleanup();
  }
});

test('runExecuteSlice refuses commit mode with pre-existing dirty files even when allowDirty is set', async () => {
  const repo = createRepo();
  try {
    writeFile(path.join(repo.root, 'docs/unrelated.md'), 'clean\n');
    git(repo.root, ['add', 'docs/unrelated.md']);
    git(repo.root, ['commit', '-m', 'add unrelated doc']);
    writeFile(path.join(repo.root, 'docs/unrelated.md'), 'dirty\n');

    await assert.rejects(
      runExecuteSlice(repo.root, {
        allowDirty: true,
        commit: true,
        provider: 'codex',
        slice: repo.slicePath,
        runProviderFn: async () => {
          writeFile(path.join(repo.root, repo.allowedFile), 'module.exports = 9;\n');
          return { ok: true, stdout: '', stderr: '' };
        },
      }),
      (error) => error.message.includes('ai execute-slice --commit requires a clean worktree')
        && error.message.includes('docs/unrelated.md'),
    );
  } finally {
    repo.cleanup();
  }
});
