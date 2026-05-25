const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function makeProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-spec-validate-'));
  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function execCli(root, args) {
  return execFileSync(process.execPath, [BIN_PATH, ...args], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function seedValidSpec(root, overrides = {}) {
  const specDir = path.join(root, 'specs/demo');
  const sliceDir = path.join(specDir, 'slices/slice-01-alpha');
  const sliceJson = {
    slice_id: 'slice-01-alpha',
    ticket: 'QUIVER-01',
    type: 'feature',
    title: 'Alpha',
    objective: 'Build alpha.',
    git: {
      branch_type: 'feature',
      base_branch: 'main',
      branch_slug: 'slice-01-alpha',
      branch_name: 'feature/QUIVER-01-slice-01-alpha',
    },
    files: ['src/alpha.js'],
    acceptance: ['Alpha works.'],
    status: 'completed',
    completed_at: '2026-05-24T00:00:00.000Z',
    ...overrides,
  };

  writeFile(path.join(specDir, 'SPEC.md'), '# Demo\n');
  writeFile(path.join(specDir, 'STATUS.md'), '# Status\n\n| Slice | Status |\n|---|---|\n| slice-01 | completed |\n');
  writeFile(path.join(specDir, 'EVIDENCE_REPORT.md'), '# Evidence\n\n## slice-01\n\n- validated\n');
  writeFile(path.join(sliceDir, 'slice.json'), `${JSON.stringify(sliceJson, null, 2)}\n`);
  writeFile(path.join(sliceDir, 'EXECUTION_BRIEF.md'), [
    '# EXECUTION BRIEF',
    '',
    '## Context',
    'Context.',
    '## Objective',
    'Objective.',
    '## Acceptance Criteria',
    '- Alpha works.',
    '## Completion Checklist',
    '- [ ] Done.',
    '',
  ].join('\n'));
  writeFile(path.join(sliceDir, 'CLOSURE_BRIEF.md'), [
    '# CLOSURE BRIEF',
    '',
    '## Summary',
    'Done.',
    '## Validation',
    '- Passed.',
    '',
  ].join('\n'));
}

test('spec validate checks a complete spec package', () => {
  const project = makeProject();
  try {
    seedValidSpec(project.root);

    const output = execCli(project.root, ['spec', 'validate', 'specs/demo']);

    assert.match(output, /Quiver spec validation/);
    assert.match(output, /Spec: specs\/demo/);
    assert.match(output, /Slices: 1/);
    assert.match(output, /PASS: spec validation passed/);
  } finally {
    project.cleanup();
  }
});

test('spec validate fails on unsafe paths and incomplete briefs', () => {
  const project = makeProject();
  try {
    seedValidSpec(project.root, {
      files: ['../outside.js'],
    });
    fs.rmSync(path.join(project.root, 'specs/demo/slices/slice-01-alpha/CLOSURE_BRIEF.md'));

    assert.throws(
      () => execCli(project.root, ['spec', 'validate', 'specs/demo']),
      (error) => {
        const output = `${error.stdout || ''}${error.stderr || ''}`;
        assert.match(output, /FAIL: spec validation failed/);
        assert.match(output, /project-relative path without traversal/);
        assert.match(output, /missing closure brief file/);
        assert.match(output, /spec validate failed/);
        return true;
      },
    );
  } finally {
    project.cleanup();
  }
});

test('spec validate strict mode promotes status and evidence warnings', () => {
  const project = makeProject();
  try {
    seedValidSpec(project.root);
    writeFile(path.join(project.root, 'specs/demo/STATUS.md'), '# Status\n');
    writeFile(path.join(project.root, 'specs/demo/EVIDENCE_REPORT.md'), '# Evidence\n');

    assert.throws(
      () => execCli(project.root, ['spec', 'validate', 'specs/demo', '--strict']),
      (error) => {
        const output = `${error.stdout || ''}${error.stderr || ''}`;
        assert.match(output, /strict warning: STATUS\.md does not reference slice-01-alpha/);
        assert.match(output, /strict warning: EVIDENCE_REPORT\.md does not reference completed slice slice-01-alpha/);
        return true;
      },
    );
  } finally {
    project.cleanup();
  }
});
