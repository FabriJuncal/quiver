const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const { collectPlan, formatHumanPlan } = require('../../src/create-quiver/commands/plan');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function makeRepo(structure) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-plan-'));
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
  };

  if (extra.dependencies !== undefined) {
    data.dependencies = extra.dependencies;
  }

  if (extra.depends_on !== undefined) {
    data.depends_on = extra.depends_on;
  }

  return data;
}

function planFixture() {
  return makeRepo({
    'specs/spec-a/slices/slice-01-alpha/slice.json': slice('spec-a/slice-01-alpha', ['docs/a.md'], { estimated_hours: 2, ticket: 'QUIVER-101' }),
    'specs/spec-a/slices/slice-02-beta/slice.json': slice('spec-a/slice-02-beta', ['docs/b.md'], {
      estimated_hours: 3,
      dependencies: ['spec-a/slice-01-alpha'],
    }),
    'specs/spec-b/slices/slice-01-delta/slice.json': slice('spec-b/slice-01-delta', ['docs/c.md'], {
      estimated_hours: 4,
    }),
    'specs/spec-c/slices/slice-01-epsilon/slice.json': slice('spec-c/slice-01-epsilon', ['docs/d.md'], {
      estimated_hours: 1,
      dependencies: ['spec-a/slice-02-beta'],
    }),
    'specs/spec-a/slices/slice-00-foundation/slice.json': slice('spec-a/slice-00-foundation', ['docs/spec.md'], {
      estimated_hours: 1,
      status: 'completed',
      ticket: 'QUIVER-100',
    }),
  });
}

function execPlan(repoRoot, args = [], env = {}) {
  return execFileSync('node', [BIN_PATH, 'plan', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

test('collectPlan returns pending slices, critical path, and total hours', () => {
  const repo = planFixture();
  try {
    const report = collectPlan(repo.root);
    assert.equal(report.total_hours, 10);
    assert.deepEqual(report.critical_path, ['spec-a/slice-01-alpha', 'spec-a/slice-02-beta', 'spec-c/slice-01-epsilon']);
    assert.equal(report.plan[0].slice_path, 'specs/spec-a/slices/slice-01-alpha/slice.json');
    assert.equal(report.plan[0].ticket, 'QUIVER-101');
    assert.deepEqual(
      report.plan.map((item) => item.ref).sort(),
      ['spec-a/slice-01-alpha', 'spec-a/slice-02-beta', 'spec-b/slice-01-delta', 'spec-c/slice-01-epsilon'].sort(),
    );
  } finally {
    repo.cleanup();
  }
});

test('plan can include completed slices for history without changing defaults', () => {
  const repo = planFixture();
  try {
    const defaultReport = collectPlan(repo.root, { specSlug: 'spec-a' });
    const historyReport = collectPlan(repo.root, { includeCompleted: true, specSlug: 'spec-a' });
    const output = execPlan(repo.root, ['--include-completed', '--spec', 'spec-a']);

    assert.ok(!defaultReport.plan.some((item) => item.ref === 'spec-a/slice-00-foundation'));
    assert.ok(historyReport.plan.some((item) => item.ref === 'spec-a/slice-00-foundation' && item.status === 'completed'));
    assert.ok(output.includes('Quiver plan (including completed)'));
    assert.ok(output.includes('QUIVER-100'));
    assert.ok(output.includes('spec-a/slice-00-foundation'));
  } finally {
    repo.cleanup();
  }
});

test('collectPlan respects --only-ready and --spec filtering', () => {
  const repo = planFixture();
  try {
    const ready = collectPlan(repo.root, { onlyReady: true });
    assert.deepEqual(
      ready.plan.map((item) => item.ref).sort(),
      ['spec-a/slice-01-alpha', 'spec-b/slice-01-delta'].sort(),
    );

    const specOnly = collectPlan(repo.root, { specSlug: 'spec-a' });
    assert.deepEqual(specOnly.plan.map((item) => item.ref), ['spec-a/slice-01-alpha', 'spec-a/slice-02-beta']);
    assert.deepEqual(specOnly.critical_path, ['spec-a/slice-01-alpha', 'spec-a/slice-02-beta']);
    assert.equal(specOnly.total_hours, 5);
  } finally {
    repo.cleanup();
  }
});

test('plan CLI emits parseable JSON', () => {
  const repo = planFixture();
  try {
    const output = execPlan(repo.root, ['--json', '--spec', 'spec-a']);
    const parsed = JSON.parse(output);
    assert.ok(Array.isArray(parsed.plan));
    assert.equal(parsed.include_completed, false);
    assert.equal(parsed.total_hours, 5);
    assert.deepEqual(parsed.critical_path, ['spec-a/slice-01-alpha', 'spec-a/slice-02-beta']);
    assert.equal(parsed.plan[0].slice_path, 'specs/spec-a/slices/slice-01-alpha/slice.json');
  } finally {
    repo.cleanup();
  }
});

test('plan CLI stays ASCII by default and can opt into Unicode', () => {
  const repo = planFixture();
  try {
    const ascii = execPlan(repo.root, [], { CI: 'true', TERM: 'dumb', NO_COLOR: '1', LANG: 'C', LC_ALL: 'C' });
    assert.ok(!/[\u001b\u009b][[()\]#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PR-TZcf-nq-uy=><]/.test(ascii));
    assert.ok(ascii.includes('Critical path: spec-a/slice-01-alpha -> spec-a/slice-02-beta -> spec-c/slice-01-epsilon'));

    const unicode = execPlan(repo.root, ['--unicode'], { LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8' });
    assert.ok(unicode.includes('Critical path: spec-a/slice-01-alpha → spec-a/slice-02-beta → spec-c/slice-01-epsilon'));
  } finally {
    repo.cleanup();
  }
});

test('plan CLI fails on cycles with the cycle path in the error', () => {
  const repo = makeRepo({
    'specs/spec-a/slices/slice-01-alpha/slice.json': slice('spec-a/slice-01-alpha', ['docs/a.md'], {
      dependencies: ['spec-a/slice-02-beta'],
    }),
    'specs/spec-a/slices/slice-02-beta/slice.json': slice('spec-a/slice-02-beta', ['docs/b.md'], {
      dependencies: ['spec-a/slice-01-alpha'],
    }),
  });

  try {
    assert.throws(
      () => execPlan(repo.root),
      (error) => {
        assert.ok(error.stderr.includes('Slice graph contains a cycle'));
        assert.ok(error.stderr.includes('spec-a/slice-01-alpha'));
        assert.ok(error.stderr.includes('spec-a/slice-02-beta'));
        return true;
      },
    );
  } finally {
    repo.cleanup();
  }
});
