const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const { collectGraph } = require('../../src/create-quiver/commands/graph');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function makeRepo(structure) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-graph-'));
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

function graphFixture() {
  return makeRepo({
    'specs/spec-a/slices/slice-01-alpha/slice.json': slice('spec-a/slice-01-alpha', ['docs/shared.md'], { estimated_hours: 2 }),
    'specs/spec-b/slices/slice-01-beta/slice.json': slice('spec-b/slice-01-beta', ['docs/shared.md'], { estimated_hours: 3 }),
    'specs/spec-c/slices/slice-01-gamma/slice.json': slice('spec-c/slice-01-gamma', ['docs/unique.md'], {
      estimated_hours: 4,
      dependencies: ['spec-a/slice-01-alpha'],
    }),
    'specs/spec-d/slices/slice-01-done/slice.json': slice('spec-d/slice-01-done', ['docs/done.md'], {
      status: 'completed',
      estimated_hours: 1,
    }),
  });
}

function execGraph(repoRoot, args = [], env = {}) {
  return execFileSync('node', [BIN_PATH, 'graph', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

test('collectGraph returns pending levels and conflicts', () => {
  const repo = graphFixture();
  try {
    const report = collectGraph(repo.root);
    assert.equal(report.levels.length, 2);
    assert.deepEqual(report.levels[0].map((node) => node.ref).sort(), ['spec-a/slice-01-alpha', 'spec-b/slice-01-beta'].sort());
    assert.deepEqual(report.levels[1].map((node) => node.ref), ['spec-c/slice-01-gamma']);
    assert.equal(report.conflicts.length, 1);
    assert.deepEqual(report.conflicts[0].files, ['docs/shared.md']);
  } finally {
    repo.cleanup();
  }
});

test('graph CLI renders an ASCII tree by default', () => {
  const repo = graphFixture();
  try {
    const output = execGraph(repo.root, [], { LANG: 'C', LC_ALL: 'C', LC_CTYPE: 'C' });
    assert.ok(output.includes('Quiver graph'));
    assert.ok(output.includes('Level 0 (2 slices'));
    assert.ok(output.includes('+--'));
  } finally {
    repo.cleanup();
  }
});

test('graph CLI can show conflicts and filter a single level', () => {
  const repo = graphFixture();
  try {
    const output = execGraph(repo.root, ['--show-conflicts', '--level', '0']);
    assert.ok(output.includes('docs/shared.md'));
    assert.ok(output.includes('spec-a/slice-01-alpha'));
    assert.ok(!output.includes('spec-c/slice-01-gamma'));
  } finally {
    repo.cleanup();
  }
});

test('graph CLI emits valid JSON', () => {
  const repo = graphFixture();
  try {
    const output = execGraph(repo.root, ['--json']);
    const parsed = JSON.parse(output);
    assert.ok(Array.isArray(parsed.levels));
    assert.ok(Array.isArray(parsed.conflicts));
  } finally {
    repo.cleanup();
  }
});

test('graph CLI prefers Unicode when requested', () => {
  const repo = graphFixture();
  try {
    const output = execGraph(repo.root, ['--unicode'], { LANG: 'en_US.UTF-8' });
    assert.ok(output.includes('├─') || output.includes('└─'));
  } finally {
    repo.cleanup();
  }
});

test('graph CLI renders Mermaid and DOT formats', () => {
  const repo = graphFixture();
  try {
    const mermaid = execGraph(repo.root, ['--format', 'mermaid', '--show-conflicts']);
    const dot = execGraph(repo.root, ['--format', 'dot', '--show-conflicts']);

    assert.ok(mermaid.startsWith('```mermaid\nflowchart TD\n'));
    assert.ok(mermaid.includes('docs/shared.md'));
    assert.ok(dot.startsWith('digraph QuiverGraph {'));
    assert.ok(dot.includes('rankdir=TB;'));
  } finally {
    repo.cleanup();
  }
});
