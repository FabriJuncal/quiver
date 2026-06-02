const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
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
    if (typeof data === 'string') {
      fs.mkdirSync(path.dirname(path.join(root, relativePath)), { recursive: true });
      fs.writeFileSync(path.join(root, relativePath), data);
    } else {
      writeJson(path.join(root, relativePath), data);
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

function spawnGraph(repoRoot, args = [], env = {}) {
  return spawnSync(process.execPath, [BIN_PATH, 'graph', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
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

test('graph can include completed slices and filter by spec', () => {
  const repo = graphFixture();
  try {
    const defaultReport = collectGraph(repo.root);
    const historyReport = collectGraph(repo.root, { includeCompleted: true });
    const specReport = collectGraph(repo.root, { includeCompleted: true, specSlug: 'spec-d' });
    const cliOutput = execGraph(repo.root, ['--include-completed', '--spec', 'spec-d']);

    assert.ok(!defaultReport.levels.flat().some((item) => item.ref === 'spec-d/slice-01-done'));
    assert.ok(historyReport.levels.flat().some((item) => item.ref === 'spec-d/slice-01-done'));
    assert.deepEqual(specReport.levels.flat().map((item) => item.ref), ['spec-d/slice-01-done']);
    assert.ok(cliOutput.includes('spec-d/slice-01-done'));
    assert.ok(!cliOutput.includes('spec-a/slice-01-alpha'));
  } finally {
    repo.cleanup();
  }
});

test('scoped graph does not parse unrelated historical slice artifacts', () => {
  const repo = makeRepo({
    'specs/spec-a/slices/slice-01-alpha/slice.json': slice('spec-a/slice-01-alpha', ['docs/a.md']),
    'specs/huge-history/slices/slice-01-bad/slice.json': '{ this is not valid json',
  });

  try {
    const report = collectGraph(repo.root, { specSlug: 'spec-a' });
    assert.deepEqual(report.levels.flat().map((item) => item.ref), ['spec-a/slice-01-alpha']);
    assert.throws(() => collectGraph(repo.root));
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

test('graph CLI localizes tree output without changing refs', () => {
  const repo = graphFixture();
  try {
    const output = execGraph(repo.root, ['--lang', 'es'], { LANG: 'C', LC_ALL: 'C', LC_CTYPE: 'C' });
    assert.ok(output.includes('Grafo de Quiver'));
    assert.ok(output.includes('Nivel 0 (2 slices, 1 lote)'));
    assert.ok(output.includes('spec-a/slice-01-alpha'));
    assert.ok(output.includes('[draft]'));
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

test('graph unsupported format error localizes and keeps JSON stdout clean', () => {
  const repo = graphFixture();
  try {
    const result = spawnGraph(repo.root, ['--lang', 'es', '--json', '--format', 'yaml']);

    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /create-quiver: formato de graph no compatible: yaml/);
  } finally {
    repo.cleanup();
  }
});
