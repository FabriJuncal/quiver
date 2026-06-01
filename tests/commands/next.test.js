const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const { collectNext, formatHumanNext, runNext } = require('../../src/create-quiver/commands/next');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function makeRepo(structure) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-next-'));
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

function snapshotFiles(root) {
  const files = [];
  const walk = (dirPath) => {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        files.push(path.relative(root, fullPath).split(path.sep).join('/'));
      }
    }
  };
  walk(root);
  return files.sort();
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
      base_branch: 'develop',
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

function nextFixture() {
  return makeRepo({
    'specs/spec-a/slices/slice-01-alpha/slice.json': slice('spec-a/slice-01-alpha', ['docs/a.md'], { estimated_hours: 2 }),
    'specs/spec-a/slices/slice-02-beta/slice.json': slice('spec-a/slice-02-beta', ['docs/b.md'], {
      estimated_hours: 3,
      dependencies: ['spec-a/slice-01-alpha'],
    }),
    'specs/spec-b/slices/slice-01-delta/slice.json': slice('spec-b/slice-01-delta', ['docs/c.md'], {
      estimated_hours: 4,
    }),
  });
}

function completedFixture() {
  return makeRepo({
    'specs/spec-a/slices/slice-00-foundation/slice.json': slice('spec-a/slice-00-foundation', ['docs/a.md'], {
      status: 'completed',
    }),
    'specs/spec-b/slices/slice-00-foundation/slice.json': slice('spec-b/slice-00-foundation', ['docs/b.md'], {
      status: 'completed',
    }),
  });
}

function execNext(repoRoot, args = [], env = {}) {
  return execFileSync('node', [BIN_PATH, 'next', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

test('collectNext returns the first ready slice and the ready set', () => {
  const repo = nextFixture();
  try {
    const report = collectNext(repo.root);
    assert.equal(report.next.ref, 'spec-a/slice-01-alpha');
    assert.deepEqual(
      report.all_ready.map((item) => item.ref).sort(),
      ['spec-a/slice-01-alpha', 'spec-b/slice-01-delta'].sort(),
    );
    assert.equal(report.next.slice_path, 'specs/spec-a/slices/slice-01-alpha/slice.json');
  } finally {
    repo.cleanup();
  }
});

test('next CLI emits parseable JSON', () => {
  const repo = nextFixture();
  try {
    const output = execNext(repo.root, ['--json']);
    const parsed = JSON.parse(output);
    assert.equal(parsed.next.ref, 'spec-a/slice-01-alpha');
    assert.ok(Array.isArray(parsed.all_ready));
    assert.equal(parsed.next.start_slice_command, 'npx create-quiver start-slice "specs/spec-a/slices/slice-01-alpha/slice.json"');
  } finally {
    repo.cleanup();
  }
});

test('next CLI prints the top ready slice and the copy-paste command', () => {
  const repo = nextFixture();
  try {
    const output = execNext(repo.root);
    assert.ok(output.includes('Next ready slice'));
    assert.ok(output.includes('spec-a/slice-01-alpha'));
    assert.ok(output.includes('npx create-quiver start-slice "specs/spec-a/slices/slice-01-alpha/slice.json"'));
    assert.ok(output.includes('Also ready: 1 more. Run: npx create-quiver next --all-ready'));
    assert.ok(!output.includes('spec-b/slice-01-delta\nStart:'));
  } finally {
    repo.cleanup();
  }
});

test('next CLI localizes human output while preserving start command', () => {
  const repo = nextFixture();
  try {
    const output = execNext(repo.root, ['--lang', 'es']);
    assert.ok(output.includes('Proximo slice listo'));
    assert.ok(output.includes('Slice: spec-a/slice-01-alpha'));
    assert.ok(output.includes('Titulo: slice-01-alpha'));
    assert.ok(output.includes('Estado: draft'));
    assert.ok(output.includes('Iniciar: npx create-quiver start-slice "specs/spec-a/slices/slice-01-alpha/slice.json"'));
    assert.ok(output.includes('Tambien listo: 1 mas. Ejecuta: npx create-quiver next --all-ready'));
  } finally {
    repo.cleanup();
  }
});

test('next CLI can list all ready slices', () => {
  const repo = nextFixture();
  try {
    const output = execNext(repo.root, ['--all-ready']);
    assert.ok(output.includes('Ready slices'));
    assert.ok(output.includes('[1] spec-a/slice-01-alpha'));
    assert.ok(output.includes('[2] spec-b/slice-01-delta'));
  } finally {
    repo.cleanup();
  }
});

test('next include-completed reports history without suggesting completed work', () => {
  const repo = completedFixture();
  try {
    const report = collectNext(repo.root, { includeCompleted: true, specSlug: 'spec-a' });
    const output = execNext(repo.root, ['--include-completed', '--spec', 'spec-a']);
    const json = JSON.parse(execNext(repo.root, ['--include-completed', '--spec', 'spec-a', '--json']));

    assert.equal(report.next, null);
    assert.deepEqual(report.history.map((item) => item.ref), ['spec-a/slice-00-foundation']);
    assert.ok(output.includes('No ready slices found.'));
    assert.ok(output.includes('Historical slices included by --include-completed'));
    assert.ok(output.includes('spec-a/slice-00-foundation'));
    assert.ok(!output.includes('spec-b/slice-00-foundation'));
    assert.equal(json.next, null);
    assert.equal(json.include_completed, true);
    assert.deepEqual(json.history.map((item) => item.ref), ['spec-a/slice-00-foundation']);
  } finally {
    repo.cleanup();
  }
});

test('next auto-start rejects non-TTY sessions and can start through an injected prompt', async () => {
  const repo = nextFixture();
  try {
    await assert.rejects(
      runNext(repo.root, { autoStart: true, isTTY: { stdin: false, stdout: true } }),
      /requires an interactive TTY/,
    );

    let started = null;
    const report = await runNext(repo.root, {
      autoStart: true,
      isTTY: { stdin: true, stdout: true },
      promptConfirm: async () => true,
      startSliceFn: async (slicePath, options) => {
        started = { slicePath, options };
      },
    });

    assert.equal(report.next.ref, 'spec-a/slice-01-alpha');
    assert.equal(started.slicePath, path.join(repo.root, 'specs/spec-a/slices/slice-01-alpha/slice.json'));
    assert.equal(started.options.allowDraft, true);
  } finally {
    repo.cleanup();
  }
});

test('next formatter keeps the ready slice command visible', () => {
  const repo = nextFixture();
  try {
    const report = collectNext(repo.root);
    const output = formatHumanNext(report);
    assert.ok(output.includes('Start: npx create-quiver start-slice "specs/spec-a/slices/slice-01-alpha/slice.json"'));
  } finally {
    repo.cleanup();
  }
});

test('next CLI is read-only unless auto-start is explicitly requested', () => {
  const repo = nextFixture();
  try {
    const before = snapshotFiles(repo.root);
    execNext(repo.root);
    execNext(repo.root, ['--json']);
    execNext(repo.root, ['--all-ready']);
    const after = snapshotFiles(repo.root);

    assert.deepEqual(after, before);
  } finally {
    repo.cleanup();
  }
});
