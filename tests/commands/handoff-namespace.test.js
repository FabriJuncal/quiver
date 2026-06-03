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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-handoff-namespace-'));
  const briefPath = 'specs/demo/slices/slice-01-alpha/EXECUTION_BRIEF.md';
  writeFile(path.join(root, briefPath), [
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

  return {
    briefPath,
    root,
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

test('handoff namespace matches legacy check-handoff behavior and keeps warning on stderr', () => {
  const project = makeProject();
  try {
    const canonical = runCli(project.root, ['handoff', 'check', project.briefPath]);
    const legacy = runCli(project.root, ['check-handoff', project.briefPath]);

    assert.equal(canonical.status, 0);
    assert.equal(legacy.status, 0);
    assert.equal(canonical.stderr, '');
    assert.match(legacy.stderr, /check-handoff is a legacy alias; use npx create-quiver handoff check/);
    assert.equal(legacy.stdout, canonical.stdout);
  } finally {
    project.cleanup();
  }
});

test('handoff new namespace matches legacy new-handoff output and artifacts', () => {
  const canonicalProject = makeProject();
  const legacyProject = makeProject();
  try {
    const canonical = runCli(canonicalProject.root, ['handoff', 'new', 'demo-new']);
    const legacy = runCli(legacyProject.root, ['new-handoff', 'demo-new']);
    const handoffPath = path.join('specs', 'demo-new', 'HANDOFF.md');

    assert.equal(canonical.status, 0);
    assert.equal(legacy.status, 0);
    assert.equal(canonical.stderr, '');
    assert.match(legacy.stderr, /new-handoff is a legacy alias; use npx create-quiver handoff new/);
    assert.equal(legacy.stdout, canonical.stdout);
    assert.equal(
      fs.readFileSync(path.join(legacyProject.root, handoffPath), 'utf8'),
      fs.readFileSync(path.join(canonicalProject.root, handoffPath), 'utf8'),
    );
  } finally {
    canonicalProject.cleanup();
    legacyProject.cleanup();
  }
});

test('handoff namespace rejects unsupported subcommands before execution', () => {
  const project = makeProject();
  try {
    const result = runCli(project.root, ['handoff', 'open', project.briefPath]);

    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /unsupported handoff subcommand: open/);
    assert.match(result.stderr, /Supported tasks: check, new/);
  } finally {
    project.cleanup();
  }
});
