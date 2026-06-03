const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function makeProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-slice-namespace-'));
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
    completed_at: '2026-06-02T00:00:00.000Z',
  };

  writeFile(path.join(specDir, 'SPEC.md'), '# Demo\n');
  writeFile(path.join(specDir, 'STATUS.md'), '# Status\n');
  writeFile(path.join(specDir, 'EVIDENCE_REPORT.md'), '# Evidence\n\n## slice-01-alpha\n\n- validated\n');
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

  return {
    root,
    slicePath: 'specs/demo/slices/slice-01-alpha/slice.json',
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function runCli(root, args) {
  return spawnSync(process.execPath, [BIN_PATH, ...args], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, QUIVER_LANG: 'en' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

test('slice namespace matches legacy check-slice behavior and keeps warning on stderr', () => {
  const project = makeProject();
  try {
    const canonical = runCli(project.root, ['slice', 'check', '--local', project.slicePath]);
    const legacy = runCli(project.root, ['check-slice', '--local', project.slicePath]);

    assert.equal(canonical.status, 0);
    assert.equal(legacy.status, 0);
    assert.equal(canonical.stderr, '');
    assert.match(legacy.stderr, /check-slice is a legacy alias; use npx create-quiver slice check/);
    assert.equal(legacy.stdout, canonical.stdout);
  } finally {
    project.cleanup();
  }
});

test('legacy slice warning is suppressed when json mode is requested', () => {
  const project = makeProject();
  try {
    const legacy = runCli(project.root, ['check-slice', '--local', '--json', project.slicePath]);

    assert.equal(legacy.status, 0);
    assert.equal(legacy.stderr, '');
    assert.match(legacy.stdout, /PASS: Local spec has SPEC\.md/);
  } finally {
    project.cleanup();
  }
});

test('slice namespace rejects unsupported subcommands before execution', () => {
  const project = makeProject();
  try {
    const result = runCli(project.root, ['slice', 'watch', project.slicePath]);

    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /unsupported slice subcommand: watch/);
    assert.match(result.stderr, /Supported tasks: start, check, pr, scope, cleanup, refresh-active/);
  } finally {
    project.cleanup();
  }
});
