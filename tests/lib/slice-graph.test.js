const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  buildGraph,
  computeLevels,
  detectFileConflicts,
  inferDependencies,
  isFoundationSliceId,
  readAllSlices,
  naturalNumberFromSliceId,
  topoSort,
  SliceGraphError,
} = require('../../src/create-quiver/lib/slice-graph');

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function makeRepo(structure) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-slice-graph-'));

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
    title: extra.title || ref,
    type: extra.type || 'feat',
    objective: extra.objective || `Objective for ${ref}`,
    description: extra.description || `Description for ${ref}`,
    git: extra.git || {
      branch_type: 'feature',
      base_branch: 'develop',
      branch_slug: sliceId,
      branch_name: `feature/QUIVER-01-${sliceId}`,
    },
    files,
    status: extra.status || 'draft',
    acceptance: extra.acceptance || [`Acceptance for ${ref}`],
    tests: extra.tests || [],
  };

  if (extra.dependencies !== undefined) {
    data.dependencies = extra.dependencies;
  }

  if (extra.depends_on !== undefined) {
    data.depends_on = extra.depends_on;
  }

  if (extra.expected_read_paths !== undefined) {
    data.expected_read_paths = extra.expected_read_paths;
  }

  if (extra.allowed_write_paths !== undefined) {
    data.allowed_write_paths = extra.allowed_write_paths;
  }

  if (extra.validation_hints !== undefined) {
    data.validation_hints = extra.validation_hints;
  }

  return data;
}

test('readAllSlices returns an empty array for an empty repo', () => {
  const repo = makeRepo({});
  try {
    assert.deepEqual(readAllSlices(repo.root), []);
  } finally {
    repo.cleanup();
  }
});

test('readAllSlices reads real slices from the current repo', () => {
  const slices = readAllSlices(process.cwd());
  assert.ok(slices.length > 0, 'expected a non-zero slice count from the repo');
  assert.ok(slices.every((sliceItem) => typeof sliceItem.ref === 'string' && sliceItem.ref.includes('/')));
});

test('inferDependencies honors explicit dependencies and heuristic overlap', () => {
  const repo = makeRepo({
    'specs/spec-a/slices/slice-01-alpha/slice.json': slice('spec-a/slice-01-alpha', ['docs/shared.md']),
    'specs/spec-a/slices/slice-02-beta/slice.json': slice('spec-a/slice-02-beta', ['docs/shared.md']),
    'specs/spec-a/slices/slice-03-gamma/slice.json': slice('spec-a/slice-03-gamma', ['docs/shared.md'], { depends_on: [] }),
    'specs/spec-b/slices/slice-01-cross/slice.json': slice('spec-b/slice-01-cross', ['docs/cross.md'], {
      dependencies: ['spec-a/slice-02-beta'],
    }),
  });

  try {
    const slices = readAllSlices(repo.root);
    const inferred = inferDependencies(slices);
    const byRef = new Map(inferred.map((sliceItem) => [sliceItem.ref, sliceItem]));

    assert.deepEqual(byRef.get('spec-a/slice-01-alpha').depends_on, []);
    assert.deepEqual(byRef.get('spec-a/slice-02-beta').depends_on, ['spec-a/slice-01-alpha']);
    assert.deepEqual(byRef.get('spec-a/slice-03-gamma').depends_on, []);
    assert.deepEqual(byRef.get('spec-b/slice-01-cross').depends_on, ['spec-a/slice-02-beta']);
  } finally {
    repo.cleanup();
  }
});

test('readAllSlices uses allowed_write_paths as write scope when present', () => {
  const repo = makeRepo({
    'specs/spec-a/slices/slice-01-alpha/slice.json': slice('spec-a/slice-01-alpha', [], {
      allowed_write_paths: ['src/shared.js'],
      expected_read_paths: ['docs/plan.md'],
      validation_hints: ['npm test'],
    }),
  });

  try {
    const slices = readAllSlices(repo.root);
    assert.deepEqual(slices[0].files, ['src/shared.js']);
    assert.deepEqual(slices[0].allowed_write_paths, ['src/shared.js']);
    assert.deepEqual(slices[0].expected_read_paths, ['docs/plan.md']);
    assert.deepEqual(slices[0].validation_hints, ['npm test']);
  } finally {
    repo.cleanup();
  }
});

test('buildGraph and topoSort preserve explicit cross-spec order', () => {
  const repo = makeRepo({
    'specs/spec-a/slices/slice-01-alpha/slice.json': slice('spec-a/slice-01-alpha', ['docs/a.md']),
    'specs/spec-a/slices/slice-02-beta/slice.json': slice('spec-a/slice-02-beta', ['docs/b.md']),
    'specs/spec-b/slices/slice-01-cross/slice.json': slice('spec-b/slice-01-cross', ['docs/c.md'], {
      dependencies: ['spec-a/slice-02-beta'],
    }),
  });

  try {
    const graph = buildGraph(readAllSlices(repo.root));
    const ordered = topoSort(graph).map((sliceItem) => sliceItem.ref);
    assert.deepEqual(ordered, ['spec-a/slice-01-alpha', 'spec-a/slice-02-beta', 'spec-b/slice-01-cross']);
    assert.equal(graph.edges.length, 1);
    assert.deepEqual(graph.cycles, []);
  } finally {
    repo.cleanup();
  }
});

test('topoSort throws a typed error with the full cycle path', () => {
  const repo = makeRepo({
    'specs/spec-a/slices/slice-01-alpha/slice.json': slice('spec-a/slice-01-alpha', ['docs/a.md'], {
      dependencies: ['spec-a/slice-02-beta'],
    }),
    'specs/spec-a/slices/slice-02-beta/slice.json': slice('spec-a/slice-02-beta', ['docs/b.md'], {
      dependencies: ['spec-a/slice-03-gamma'],
    }),
    'specs/spec-a/slices/slice-03-gamma/slice.json': slice('spec-a/slice-03-gamma', ['docs/c.md'], {
      dependencies: ['spec-a/slice-01-alpha'],
    }),
  });

  try {
    const graph = buildGraph(readAllSlices(repo.root));
    assert.throws(
      () => topoSort(graph),
      (error) => error instanceof SliceGraphError && error.code === 'CYCLE_DETECTED' && error.message.includes('spec-a/slice-01-alpha') && error.message.includes('spec-a/slice-02-beta') && error.message.includes('spec-a/slice-03-gamma'),
    );
  } finally {
    repo.cleanup();
  }
});

test('computeLevels puts disjoint slices in the same level and detects conflicts', () => {
  const repo = makeRepo({
    'specs/spec-a/slices/slice-01-alpha/slice.json': slice('spec-a/slice-01-alpha', ['docs/a.md']),
    'specs/spec-a/slices/slice-02-beta/slice.json': slice('spec-a/slice-02-beta', ['docs/b.md']),
    'specs/spec-a/slices/slice-03-gamma/slice.json': slice('spec-a/slice-03-gamma', ['docs/a.md'], {
      dependencies: ['spec-a/slice-01-alpha'],
    }),
  });

  try {
    const graph = buildGraph(readAllSlices(repo.root));
    const levels = computeLevels(graph).map((level) => level.map((sliceItem) => sliceItem.ref));
    assert.deepEqual(levels[0].sort(), ['spec-a/slice-01-alpha', 'spec-a/slice-02-beta'].sort());
    assert.deepEqual(levels[1], ['spec-a/slice-03-gamma']);

    const conflicts = detectFileConflicts(graph.nodes.filter((sliceItem) => levels[0].includes(sliceItem.ref)));
    assert.equal(conflicts.length, 0);

    const conflictGroups = detectFileConflicts([
      graph.nodes.find((sliceItem) => sliceItem.ref === 'spec-a/slice-01-alpha'),
      graph.nodes.find((sliceItem) => sliceItem.ref === 'spec-a/slice-02-beta'),
      graph.nodes.find((sliceItem) => sliceItem.ref === 'spec-a/slice-03-gamma'),
    ]);
    assert.equal(conflictGroups.length, 1);
    assert.deepEqual(conflictGroups[0].slices, ['spec-a/slice-01-alpha', 'spec-a/slice-03-gamma']);
    assert.deepEqual(conflictGroups[0].files, ['docs/a.md']);
  } finally {
    repo.cleanup();
  }
});

test('buildGraph drops legacy bare spec-name deps and produces zero edges', () => {
  const repo = makeRepo({
    'specs/spec-a/slices/slice-01-alpha/slice.json': slice('spec-a/slice-01-alpha', ['docs/a.md'], {
      dependencies: ['quiver-v01'],
    }),
  });
  try {
    const graph = buildGraph(readAllSlices(repo.root));
    assert.equal(graph.edges.length, 0, 'legacy bare spec dep must produce no edges');
    assert.deepEqual(graph.cycles, []);
  } finally {
    repo.cleanup();
  }
});

test('buildGraph drops slash deps whose second segment is not a slice-id (regression)', () => {
  const repo = makeRepo({
    'specs/spec-a/slices/slice-01-alpha/slice.json': slice('spec-a/slice-01-alpha', ['docs/a.md'], {
      dependencies: ['docs/root-first-docs-flow'],
    }),
  });
  try {
    const graph = buildGraph(readAllSlices(repo.root));
    assert.equal(graph.edges.length, 0, 'non-slice-id slash dep must produce no edges');
    assert.deepEqual(graph.cycles, []);
  } finally {
    repo.cleanup();
  }
});

test('buildGraph preserves depends_on with full spec/slice-id format (regression)', () => {
  const repo = makeRepo({
    'specs/spec-a/slices/slice-01-alpha/slice.json': slice('spec-a/slice-01-alpha', ['docs/a.md']),
    'specs/spec-b/slices/slice-01-cross/slice.json': slice('spec-b/slice-01-cross', ['docs/b.md'], {
      depends_on: ['spec-a/slice-01-alpha'],
    }),
  });
  try {
    const graph = buildGraph(readAllSlices(repo.root));
    assert.equal(graph.edges.length, 1);
    assert.deepEqual(graph.edges[0], { from: 'spec-a/slice-01-alpha', to: 'spec-b/slice-01-cross' });
  } finally {
    repo.cleanup();
  }
});

test('foundation slice helpers recognize slice-00 ids', () => {
  assert.equal(isFoundationSliceId('slice-00-spec-foundation'), true);
  assert.equal(isFoundationSliceId('slice-01-alpha'), false);
  assert.equal(naturalNumberFromSliceId('slice-00-spec-foundation'), 0);
  assert.equal(naturalNumberFromSliceId('slice-12-beta'), 12);
});
