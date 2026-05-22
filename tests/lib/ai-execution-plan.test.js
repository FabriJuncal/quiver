const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { collectExecutionPlan, formatExecutePlanDryRun, formatHumanExecutionPlan } = require('../../src/create-quiver/lib/ai/execution-plan');

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function makeRepo(structure) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-execution-plan-'));

  for (const [relativePath, data] of Object.entries(structure)) {
    writeJson(path.join(root, relativePath), data);
  }

  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function slice(ref, files, extra = {}) {
  const [, sliceId] = ref.split('/');
  const data = {
    slice_id: sliceId,
    ticket: extra.ticket || 'QUIVER-01',
    title: extra.title || sliceId,
    type: extra.type || 'feat',
    objective: extra.objective || `Objective for ${ref}`,
    description: extra.description || `Description for ${ref}`,
    git: extra.git || {
      branch_type: 'feature',
      base_branch: 'main',
      branch_slug: sliceId,
      branch_name: `feature/QUIVER-01-${sliceId}`,
    },
    files,
    status: extra.status || 'draft',
    acceptance: extra.acceptance || [`Acceptance for ${ref}`],
    tests: extra.tests || [],
    estimated_hours: extra.estimated_hours ?? 1,
    ...(extra.depends_on !== undefined ? { depends_on: extra.depends_on } : {}),
    ...(extra.dependencies !== undefined ? { dependencies: extra.dependencies } : {}),
  };

  if (extra.allowed_write_paths !== undefined) {
    data.allowed_write_paths = extra.allowed_write_paths;
  }

  return data;
}

function planFixture() {
  return makeRepo({
    'specs/spec-a/slices/slice-00-spec-foundation/slice.json': slice('spec-a/slice-00-spec-foundation', ['docs/spec-a-foundation.md'], {
      status: 'ready',
      type: 'docs',
      estimated_hours: 1,
    }),
    'specs/spec-a/slices/slice-01-alpha/slice.json': slice('spec-a/slice-01-alpha', ['docs/spec-a-alpha.md'], {
      estimated_hours: 2,
    }),
    'specs/spec-a/slices/slice-02-beta/slice.json': slice('spec-a/slice-02-beta', ['docs/spec-a-beta.md'], {
      estimated_hours: 3,
      dependencies: ['spec-a/slice-01-alpha'],
    }),
    'specs/spec-b/slices/slice-00-spec-foundation/slice.json': slice('spec-b/slice-00-spec-foundation', ['docs/spec-b-foundation.md'], {
      status: 'ready',
      type: 'docs',
      estimated_hours: 1,
    }),
    'specs/spec-b/slices/slice-01-delta/slice.json': slice('spec-b/slice-01-delta', ['docs/spec-b-delta.md'], {
      estimated_hours: 4,
    }),
  });
}

test('collectExecutionPlan groups slice-00 first and parallel slices by ready level', () => {
  const repo = planFixture();
  try {
    const report = collectExecutionPlan(repo.root);
    const level0Refs = report.ready_levels[0].slice_refs;
    const level1Refs = report.ready_levels[1].slice_refs;

    assert.deepEqual(level0Refs.sort(), ['spec-a/slice-00-spec-foundation', 'spec-b/slice-00-spec-foundation'].sort());
    assert.ok(level0Refs.every((ref) => ref.includes('slice-00-spec-foundation')));
    assert.deepEqual(level1Refs.sort(), ['spec-a/slice-01-alpha', 'spec-b/slice-01-delta'].sort());
    assert.equal(report.ready_levels[1].parallel_ready, true);
    assert.equal(report.ready_levels[1].requires_temporary_worktrees, true);
    assert.equal(report.ready_levels[1].worktree_strategy.mode, 'temporary-per-slice');
    assert.deepEqual(report.ready_levels[1].execution_groups, [{
      mode: 'parallel',
      reason: 'No file-scope conflicts detected.',
      slice_refs: ['spec-a/slice-01-alpha', 'spec-b/slice-01-delta'],
    }]);
    assert.deepEqual(report.integration_order, [
      'spec-a/slice-00-spec-foundation',
      'spec-b/slice-00-spec-foundation',
      'spec-a/slice-01-alpha',
      'spec-b/slice-01-delta',
      'spec-a/slice-02-beta',
    ]);
    assert.deepEqual(report.execution_order, report.sequential_order);
  } finally {
    repo.cleanup();
  }
});

test('collectExecutionPlan falls back to sequential mode when same-level files overlap', () => {
  const repo = makeRepo({
    'specs/spec-a/slices/slice-00-spec-foundation/slice.json': slice('spec-a/slice-00-spec-foundation', ['docs/foundation.md'], {
      status: 'completed',
      type: 'docs',
    }),
    'specs/spec-a/slices/slice-01-alpha/slice.json': slice('spec-a/slice-01-alpha', ['src/shared.js'], {
      depends_on: [],
    }),
    'specs/spec-a/slices/slice-02-beta/slice.json': slice('spec-a/slice-02-beta', ['src/shared.js'], {
      depends_on: [],
    }),
  });

  try {
    const report = collectExecutionPlan(repo.root);
    const level = report.ready_levels[0];

    assert.equal(level.parallel_ready, false);
    assert.equal(level.worktree_strategy.mode, 'sequential-fallback');
    assert.ok(level.fallback_reason.includes('File conflicts'));
    assert.deepEqual(level.execution_groups.map((group) => group.mode), ['sequential', 'sequential']);
  } finally {
    repo.cleanup();
  }
});

test('collectExecutionPlan detects conflicts from allowed_write_paths even when files is empty', () => {
  const repo = makeRepo({
    'specs/spec-a/slices/slice-00-spec-foundation/slice.json': slice('spec-a/slice-00-spec-foundation', ['docs/foundation.md'], {
      status: 'completed',
      type: 'docs',
    }),
    'specs/spec-a/slices/slice-01-alpha/slice.json': slice('spec-a/slice-01-alpha', [], {
      allowed_write_paths: ['src/shared.js'],
      depends_on: [],
    }),
    'specs/spec-a/slices/slice-02-beta/slice.json': slice('spec-a/slice-02-beta', [], {
      allowed_write_paths: ['src/shared.js'],
      depends_on: [],
    }),
  });

  try {
    const report = collectExecutionPlan(repo.root);
    const level = report.ready_levels[0];

    assert.equal(level.parallel_ready, false);
    assert.equal(level.worktree_strategy.mode, 'sequential-fallback');
    assert.ok(level.fallback_reason.includes('File conflicts'));
    assert.deepEqual(level.conflicts[0].files, ['src/shared.js']);
    assert.deepEqual(level.unknown_scope_slices, []);
  } finally {
    repo.cleanup();
  }
});

test('collectExecutionPlan falls back to sequential mode when file scope is unknown', () => {
  const repo = makeRepo({
    'specs/spec-a/slices/slice-00-spec-foundation/slice.json': slice('spec-a/slice-00-spec-foundation', ['docs/foundation.md'], {
      status: 'completed',
      type: 'docs',
    }),
    'specs/spec-a/slices/slice-01-alpha/slice.json': slice('spec-a/slice-01-alpha', []),
    'specs/spec-a/slices/slice-02-beta/slice.json': slice('spec-a/slice-02-beta', ['src/beta.js']),
  });

  try {
    const report = collectExecutionPlan(repo.root);
    const level = report.ready_levels[0];

    assert.equal(level.parallel_ready, false);
    assert.ok(level.fallback_reason.includes('Unknown file scope'));
    assert.deepEqual(level.unknown_scope_slices, ['spec-a/slice-01-alpha']);
  } finally {
    repo.cleanup();
  }
});

test('formatHumanExecutionPlan includes worktree guidance and level ordering', () => {
  const repo = planFixture();
  try {
    const report = collectExecutionPlan(repo.root);
    const output = formatHumanExecutionPlan(report);
    assert.ok(output.includes('Execution plan'));
    assert.ok(output.includes('Worktree strategy: temporary-per-slice'));
    assert.ok(output.includes('spec-a/slice-00-spec-foundation'));
    assert.ok(output.includes('Integration order'));
    assert.ok(output.includes('Wave 0'));
  } finally {
    repo.cleanup();
  }
});

test('formatExecutePlanDryRun prints commands without executing providers', () => {
  const repo = planFixture();
  try {
    const report = collectExecutionPlan(repo.root);
    const output = formatExecutePlanDryRun(report, {
      commit: true,
      provider: 'codex',
    });

    assert.ok(output.includes('AI execute-plan dry-run'));
    assert.ok(output.includes('Execution mode: auto'));
    assert.ok(output.includes('Commit after each slice: enabled'));
    assert.ok(output.includes('Wave 1: parallel-ready'));
    assert.ok(output.includes('npx create-quiver ai prompt-slice --slice "specs/spec-a/slices/slice-01-alpha/slice.json" --dry-run'));
    assert.ok(output.includes('npx create-quiver ai execute-slice --slice "specs/spec-a/slices/slice-01-alpha/slice.json" --provider codex --commit'));
  } finally {
    repo.cleanup();
  }
});

test('formatExecutePlanDryRun manual mode prints prompts without execute commands', () => {
  const repo = planFixture();
  try {
    const report = collectExecutionPlan(repo.root);
    const output = formatExecutePlanDryRun(report, {
      mode: 'manual',
      provider: 'codex',
    });

    assert.ok(output.includes('Execution mode: manual'));
    assert.ok(output.includes('npx create-quiver ai prompt-slice --slice "specs/spec-a/slices/slice-01-alpha/slice.json" --dry-run'));
    assert.ok(!output.includes('npx create-quiver ai execute-slice --slice'));
  } finally {
    repo.cleanup();
  }
});

test('collectExecutionPlan fails on missing dependencies with a clear diagnostic', () => {
  const repo = makeRepo({
    'specs/spec-a/slices/slice-00-spec-foundation/slice.json': slice('spec-a/slice-00-spec-foundation', ['docs/foundation.md'], {
      status: 'ready',
      type: 'docs',
    }),
    'specs/spec-a/slices/slice-01-alpha/slice.json': slice('spec-a/slice-01-alpha', ['docs/alpha.md'], {
      dependencies: ['spec-a/slice-99-missing'],
    }),
  });

  try {
    assert.throws(
      () => collectExecutionPlan(repo.root),
      (error) => error.code === 'MISSING_DEPENDENCY' && error.message.includes('Missing dependency reference') && error.message.includes('spec-a/slice-01-alpha -> spec-a/slice-99-missing'),
    );
  } finally {
    repo.cleanup();
  }
});

test('collectExecutionPlan fails on dependency cycles with a clear diagnostic', () => {
  const repo = makeRepo({
    'specs/spec-a/slices/slice-00-spec-foundation/slice.json': slice('spec-a/slice-00-spec-foundation', ['docs/foundation.md'], {
      status: 'ready',
      type: 'docs',
    }),
    'specs/spec-a/slices/slice-01-alpha/slice.json': slice('spec-a/slice-01-alpha', ['docs/alpha.md'], {
      dependencies: ['spec-a/slice-02-beta'],
    }),
    'specs/spec-a/slices/slice-02-beta/slice.json': slice('spec-a/slice-02-beta', ['docs/beta.md'], {
      dependencies: ['spec-a/slice-01-alpha'],
    }),
  });

  try {
    assert.throws(
      () => collectExecutionPlan(repo.root),
      (error) => error.code === 'CYCLE_DETECTED' && error.message.includes('spec-a/slice-01-alpha') && error.message.includes('spec-a/slice-02-beta'),
    );
  } finally {
    repo.cleanup();
  }
});
