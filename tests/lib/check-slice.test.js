const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const test = require('node:test');

const { checkSliceReadiness } = require('../../src/create-quiver/lib/readiness');

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function writeText(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text);
}

function makeRepo(structure) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-check-slice-'));
  cp.execFileSync('git', ['init', '-q'], { cwd: root });
  cp.execFileSync('git', ['config', 'user.name', 'Quiver Test'], { cwd: root });
  cp.execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
  cp.execFileSync('git', ['checkout', '-b', 'feature/test-slice'], { cwd: root });

  for (const [relativePath, data] of Object.entries(structure)) {
    if (typeof data === 'string') {
      writeText(path.join(root, relativePath), data);
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

function makeProject(structure) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-check-slice-local-'));

  for (const [relativePath, data] of Object.entries(structure)) {
    if (typeof data === 'string') {
      writeText(path.join(root, relativePath), data);
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

function withRepoCwd(repoRoot, fn) {
  const previous = process.cwd();
  process.chdir(repoRoot);
  try {
    return fn();
  } finally {
    process.chdir(previous);
  }
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

function commitAll(repoRoot, message = 'seed') {
  cp.execFileSync('git', ['add', '.'], { cwd: repoRoot });
  cp.execFileSync('git', ['commit', '-m', message, '--quiet'], { cwd: repoRoot });
}

function completedSlice(ref, extra = {}) {
  const [, sliceId] = ref.split('/');
  return {
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
    files: extra.files || ['docs/example.md'],
    acceptance: extra.acceptance || [`Acceptance for ${ref}`],
    tests: extra.tests || [],
    status: 'completed',
    started_at: extra.started_at || '2026-04-23T00:00:00Z',
    completed_at: extra.completed_at || '2026-04-23T01:00:00Z',
    actual_hours: extra.actual_hours || 1,
    ...(extra.depends_on !== undefined ? { depends_on: extra.depends_on } : {}),
    ...(extra.parallel_safe !== undefined ? { parallel_safe: extra.parallel_safe } : {}),
    ...(extra.parallel_safe_reason !== undefined ? { parallel_safe_reason: extra.parallel_safe_reason } : {}),
  };
}

function readySlice(ref, extra = {}) {
  return {
    ...completedSlice(ref, extra),
    status: 'ready',
    started_at: undefined,
    completed_at: undefined,
    actual_hours: undefined,
  };
}

test('check-slice passes for a completed slice without optional dependency fields', () => {
  const repo = makeRepo({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/slices/slice-01-alpha/slice.json': completedSlice('spec-a/slice-01-alpha'),
  });

  try {
    assert.doesNotThrow(() => withRepoCwd(repo.root, () => checkSliceReadiness('specs/spec-a/slices/slice-01-alpha/slice.json', {
      gate: 'validation',
    })));
  } finally {
    repo.cleanup();
  }
});

test('check-slice --local validates structure without requiring remote or base branches', () => {
  const repo = makeRepo({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md': '# Execute\n',
    'specs/spec-a/slices/slice-01-alpha/CLOSURE_BRIEF.md': '# Close\n',
    'specs/spec-a/slices/slice-01-alpha/slice.json': readySlice('spec-a/slice-01-alpha'),
  });

  try {
    const output = withRepoCwd(repo.root, () => captureConsole(() => checkSliceReadiness('specs/spec-a/slices/slice-01-alpha/slice.json', {
      local: true,
    })));

    assert.match(output, /PASS: El slice local tiene EXECUTION_BRIEF\.md y CLOSURE_BRIEF\.md/);
    assert.match(output, /INFO: Modo local: se omite validacion de existencia del slice en origin\/develop o develop/);
    assert.match(output, /INFO: Modo local: se omite validacion de overlap/);
    assert.match(output, /PASS: Gate execution/);
  } finally {
    repo.cleanup();
  }
});

test('check-slice --local validates structure without requiring a Git repository', () => {
  const project = makeProject({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md': '# Execute\n',
    'specs/spec-a/slices/slice-01-alpha/CLOSURE_BRIEF.md': '# Close\n',
    'specs/spec-a/slices/slice-01-alpha/slice.json': readySlice('spec-a/slice-01-alpha'),
  });

  try {
    const output = withRepoCwd(project.root, () => captureConsole(() => checkSliceReadiness('specs/spec-a/slices/slice-01-alpha/slice.json', {
      local: true,
    })));

    assert.match(output, /PASS: El spec local tiene SPEC\.md, STATUS\.md y EVIDENCE_REPORT\.md/);
    assert.match(output, /PASS: El slice local tiene EXECUTION_BRIEF\.md y CLOSURE_BRIEF\.md/);
    assert.match(output, /PASS: Gate execution/);
  } finally {
    project.cleanup();
  }
});

test('check-slice --local accepts a completed slice-00 dependency declared as a bare slice id', () => {
  const project = makeProject({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/slices/slice-00-docs-foundation/EXECUTION_BRIEF.md': '# Execute\n',
    'specs/spec-a/slices/slice-00-docs-foundation/CLOSURE_BRIEF.md': '# Close\n',
    'specs/spec-a/slices/slice-00-docs-foundation/slice.json': completedSlice('spec-a/slice-00-docs-foundation', {
      files: ['specs/spec-a/SPEC.md'],
    }),
    'specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md': '# Execute\n',
    'specs/spec-a/slices/slice-01-alpha/CLOSURE_BRIEF.md': '# Close\n',
    'specs/spec-a/slices/slice-01-alpha/slice.json': readySlice('spec-a/slice-01-alpha', {
      depends_on: ['slice-00-docs-foundation'],
      files: ['src/alpha.js'],
    }),
  });

  try {
    assert.doesNotThrow(() => withRepoCwd(project.root, () => checkSliceReadiness('specs/spec-a/slices/slice-01-alpha/slice.json', {
      local: true,
    })));
  } finally {
    project.cleanup();
  }
});

test('check-slice default mode gives local/base guidance when no base exists', () => {
  const repo = makeRepo({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/slices/slice-01-alpha/slice.json': readySlice('spec-a/slice-01-alpha'),
  });

  try {
    assert.throws(
      () => withRepoCwd(repo.root, () => checkSliceReadiness('specs/spec-a/slices/slice-01-alpha/slice.json')),
      (error) => {
        const message = String(error.message || error);
        return message.includes('--local') && message.includes('--base <branch>') && message.includes("origin");
      },
    );
  } finally {
    repo.cleanup();
  }
});

test('check-slice supports an explicit local base branch', () => {
  const repo = makeRepo({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/slices/slice-01-alpha/slice.json': readySlice('spec-a/slice-01-alpha', {
      git: {
        branch_type: 'feature',
        base_branch: 'main',
        branch_slug: 'slice-01-alpha',
        branch_name: 'feature/QUIVER-01-slice-01-alpha',
      },
    }),
  });

  try {
    commitAll(repo.root);
    const output = withRepoCwd(repo.root, () => captureConsole(() => checkSliceReadiness('specs/spec-a/slices/slice-01-alpha/slice.json', {
      baseBranch: 'feature/test-slice',
    })));

    assert.match(output, /PASS: El slice ya existe en feature\/test-slice local/);
    assert.match(output, /PASS: Gate execution/);
  } finally {
    repo.cleanup();
  }
});

test('check-slice rejects missing depends_on targets', () => {
  const repo = makeRepo({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/slices/slice-01-alpha/slice.json': completedSlice('spec-a/slice-01-alpha', {
      depends_on: ['missing-spec/slice-99'],
    }),
  });

  try {
    assert.throws(
      () => withRepoCwd(repo.root, () => checkSliceReadiness('specs/spec-a/slices/slice-01-alpha/slice.json', { gate: 'validation' })),
      (error) => String(error.message || error).includes('missing-spec/slice-99'),
    );
  } finally {
    repo.cleanup();
  }
});

test('check-slice rejects cycles introduced by depends_on', () => {
  const repo = makeRepo({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/slices/slice-01-alpha/slice.json': completedSlice('spec-a/slice-01-alpha', {
      depends_on: ['spec-a/slice-02-beta'],
    }),
    'specs/spec-a/slices/slice-02-beta/slice.json': completedSlice('spec-a/slice-02-beta', {
      depends_on: ['spec-a/slice-01-alpha'],
    }),
  });

  try {
    assert.throws(
      () => withRepoCwd(repo.root, () => checkSliceReadiness('specs/spec-a/slices/slice-01-alpha/slice.json', { gate: 'validation' })),
      (error) => String(error.message || error).includes('ciclo') || String(error.message || error).includes('cycle'),
    );
  } finally {
    repo.cleanup();
  }
});

test('check-slice requires a parallel_safe_reason when parallel_safe is never', () => {
  const repo = makeRepo({
    'specs/spec-a/SPEC.md': '# spec-a\n',
    'specs/spec-a/STATUS.md': '# status\n',
    'specs/spec-a/EVIDENCE_REPORT.md': '# evidence\n',
    'specs/spec-a/slices/slice-01-alpha/slice.json': completedSlice('spec-a/slice-01-alpha', {
      parallel_safe: 'never',
    }),
  });

  try {
    assert.throws(
      () => withRepoCwd(repo.root, () => checkSliceReadiness('specs/spec-a/slices/slice-01-alpha/slice.json', { gate: 'validation' })),
      (error) => String(error.message || error).includes('parallel_safe_reason'),
    );

    writeJson(path.join(repo.root, 'specs/spec-a/slices/slice-01-alpha/slice.json'), completedSlice('spec-a/slice-01-alpha', {
      parallel_safe: 'never',
      parallel_safe_reason: 'Needs exclusive database migration window.',
    }));

    assert.doesNotThrow(() => withRepoCwd(repo.root, () => checkSliceReadiness('specs/spec-a/slices/slice-01-alpha/slice.json', {
      gate: 'validation',
    })));
  } finally {
    repo.cleanup();
  }
});
