const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeFile(root, relativePath, text) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text);
}

function makeProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-handoff-namespace-'));
  writeFile(root, 'specs/spec-a/HANDOFF.md', [
    '# Handoff',
    '',
    '## Background',
    'Context.',
    '## What you will change',
    'Changes.',
    '## Validation checklist',
    '- [ ] Test.',
    '## Out of scope',
    'Nothing else.',
    '## Expected deliverable',
    'A patch.',
    '## Constraints',
    'Stay scoped.',
    '',
  ].join('\n'));
  writeFile(root, 'specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md', [
    '# EXECUTION BRIEF - slice-01-alpha',
    '',
    '## Context',
    'Context.',
    '## Objective',
    'Objective.',
    '## Acceptance Criteria',
    '- Criteria.',
    '## Completion Checklist',
    '- [ ] Done.',
    '',
  ].join('\n'));

  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function runRaw(root, args) {
  return spawnSync(process.execPath, [BIN_PATH, '--lang', 'en', ...args], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function withoutDeprecation(stderr) {
  return String(stderr || '')
    .split('\n')
    .filter((line) => !line.includes('deprecated command:'))
    .join('\n')
    .trim();
}

test('handoff check matches check-handoff for spec and slice brief paths', () => {
  const project = makeProject();
  try {
    for (const target of [
      'specs/spec-a/HANDOFF.md',
      'specs/spec-a/slices/slice-01-alpha/EXECUTION_BRIEF.md',
    ]) {
      const canonical = runRaw(project.root, ['handoff', 'check', target]);
      const legacy = runRaw(project.root, ['check-handoff', target]);

      assert.equal(canonical.status, 0);
      assert.equal(legacy.status, 0);
      assert.equal(canonical.stdout, legacy.stdout);
      assert.equal(canonical.stderr, '');
      assert.match(legacy.stderr, /deprecated command: check-handoff/);
    }
  } finally {
    project.cleanup();
  }
});

test('handoff create matches new-handoff and preserves legacy stderr-only warning', () => {
  const canonical = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-handoff-create-canonical-'));
  const legacy = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-handoff-create-legacy-'));

  try {
    const canonicalResult = runRaw(canonical, ['handoff', 'create', 'spec-a']);
    const legacyResult = runRaw(legacy, ['new-handoff', 'spec-a']);

    assert.equal(canonicalResult.status, 0);
    assert.equal(legacyResult.status, 0);
    assert.match(canonicalResult.stdout, /PASS: Handoff scaffolded at specs\/spec-a\/HANDOFF\.md/);
    assert.equal(canonicalResult.stdout, legacyResult.stdout);
    assert.equal(canonicalResult.stderr, '');
    assert.match(legacyResult.stderr, /deprecated command: new-handoff/);
    assert.equal(fs.existsSync(path.join(canonical, 'specs/spec-a/HANDOFF.md')), true);
    assert.equal(fs.existsSync(path.join(legacy, 'specs/spec-a/HANDOFF.md')), true);
  } finally {
    fs.rmSync(canonical, { recursive: true, force: true });
    fs.rmSync(legacy, { recursive: true, force: true });
  }
});

test('handoff namespace validates subcommands explicitly', () => {
  const project = makeProject();
  try {
    const missing = runRaw(project.root, ['handoff']);
    const unsupported = runRaw(project.root, ['handoff', 'unknown']);

    assert.notEqual(missing.status, 0);
    assert.notEqual(unsupported.status, 0);
    assert.match(missing.stderr, /missing handoff subcommand/);
    assert.match(unsupported.stderr, /unsupported handoff subcommand: unknown/);
  } finally {
    project.cleanup();
  }
});

test('legacy handoff alias warning does not contaminate stdout on failure', () => {
  const project = makeProject();
  try {
    const canonical = runRaw(project.root, ['handoff', 'check']);
    const legacy = runRaw(project.root, ['check-handoff']);

    assert.notEqual(canonical.status, 0);
    assert.notEqual(legacy.status, 0);
    assert.equal(canonical.stdout, '');
    assert.equal(legacy.stdout, '');
    assert.equal(withoutDeprecation(legacy.stderr), canonical.stderr.trim());
    assert.match(legacy.stderr, /deprecated command: check-handoff/);
  } finally {
    project.cleanup();
  }
});
