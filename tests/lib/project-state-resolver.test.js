const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { collectPlan } = require('../../src/create-quiver/commands/plan');
const { collectLifecycleExport } = require('../../src/create-quiver/lib/ai/export-state');
const {
  CANONICAL_STATUSES,
  filterSlicesForExecution,
  normalizeStatus,
  resolveProjectState,
} = require('../../src/create-quiver/lib/project-state-resolver');

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function writeFile(filePath, content = '') {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function makeRepo(structure = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-state-resolver-'));
  for (const [relativePath, data] of Object.entries(structure)) {
    const filePath = path.join(root, relativePath);
    if (typeof data === 'string') {
      writeFile(filePath, data);
    } else {
      writeJson(filePath, data);
    }
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
  return {
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
}

function seedLayout(root) {
  writeJson(path.join(root, 'package.json'), { name: 'resolver-demo', scripts: {} });
  writeFile(path.join(root, 'README.md'), '# Resolver Demo\n');
  writeFile(path.join(root, 'AGENTS.md'), 'Purpose\n\n## Reading Budget\n## Reading Order\n## Output Policy\n## Slice Execution Rules\n## Links\n');
  writeFile(path.join(root, 'docs/AI_CONTEXT.md'), '# AI Context\n');
  writeFile(path.join(root, 'docs/AI_ONBOARDING_PROMPT.md'), '# Prompt\n');
  writeFile(path.join(root, 'docs/COMMANDS.md'), '# Commands\n');
  writeFile(path.join(root, 'docs/WORKFLOW.md'), '# Workflow\n');
  writeFile(path.join(root, 'docs/INDEX.md'), '# Index\n');
  writeFile(path.join(root, 'specs/demo/SPEC.md'), '# Demo Spec\n');
  writeFile(path.join(root, 'specs/demo/STATUS.md'), '# Status\n');
  writeJson(path.join(root, '.quiver/state.json'), {
    initialized_version: '0.12.1',
    last_initialized_at: '2026-05-24T00:00:00.000Z',
  });
  writeJson(path.join(root, '.quiver/config.json'), { layout_version: 1 });
  writeFile(path.join(root, '.quiver/.gitignore'), 'cache/\nevidence/\nlocks/\nruns/\nworktrees/\n');
}

test('normalizes statuses through the canonical catalogs', () => {
  assert.deepEqual(CANONICAL_STATUSES.slice, ['planned', 'ready', 'in-progress', 'blocked', 'review', 'completed', 'skipped']);
  assert.equal(normalizeStatus('slice', 'draft'), 'planned');
  assert.equal(normalizeStatus('slice', 'done'), 'completed');
  assert.equal(normalizeStatus('slice', 'cancelled'), 'skipped');
  assert.equal(normalizeStatus('spec', 'closed'), 'done');
  assert.equal(normalizeStatus('run', 'active'), 'running');
  assert.equal(normalizeStatus('approval', 'stale'), 'pending');
  assert.equal(normalizeStatus('agent', 'waiting_approval'), 'waiting-approval');
});

test('resolver keeps scoped reads away from unrelated invalid historical specs', () => {
  const repo = makeRepo({
    'specs/demo/slices/slice-01-demo/slice.json': slice('demo/slice-01-demo', ['src/demo.js']),
    'specs/old-history/slices/slice-01-bad/slice.json': '{ invalid json',
  });

  try {
    const scoped = resolveProjectState(repo.root, { specSlug: 'demo' });
    assert.deepEqual(scoped.graph.nodes.map((item) => item.ref), ['demo/slice-01-demo']);
    assert.throws(() => resolveProjectState(repo.root), /Expected property name|Unexpected token|Unexpected identifier/);
  } finally {
    repo.cleanup();
  }
});

test('plan and AI export consume the same resolver state for completed slices', () => {
  const repo = makeRepo();
  seedLayout(repo.root);
  writeJson(path.join(repo.root, 'specs/demo/slices/slice-00-foundation/slice.json'), slice('demo/slice-00-foundation', ['specs/demo/**'], {
    status: 'completed',
    depends_on: [],
  }));
  writeJson(path.join(repo.root, 'specs/demo/slices/slice-01-work/slice.json'), slice('demo/slice-01-work', ['src/work.js'], {
    status: 'planned',
    depends_on: ['slice-00-foundation'],
  }));

  try {
    const state = resolveProjectState(repo.root, { specSlug: 'demo' });
    const executableRefs = filterSlicesForExecution(state.graph.nodes).map((item) => item.ref);
    const historicalRefs = filterSlicesForExecution(state.graph.nodes, { includeCompleted: true }).map((item) => item.ref);
    const plan = collectPlan(repo.root, { includeCompleted: true, specSlug: 'demo' });
    const exported = collectLifecycleExport(repo.root, { includeCompleted: true });

    assert.deepEqual(executableRefs, ['demo/slice-01-work']);
    assert.deepEqual(historicalRefs, ['demo/slice-00-foundation', 'demo/slice-01-work']);
    assert.deepEqual(plan.plan.map((item) => item.ref), historicalRefs);
    assert.deepEqual(exported.slices.map((item) => item.ref), historicalRefs);
    assert.equal(exported.slices.find((item) => item.ref === 'demo/slice-00-foundation').canonical_status, 'completed');
  } finally {
    repo.cleanup();
  }
});

