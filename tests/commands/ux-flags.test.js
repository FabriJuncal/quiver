const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const {
  getUxFlagSupport,
  resolveUxCommandKey,
  validateUxFlags,
} = require('../../src/create-quiver/lib/cli/ux-flags');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function runCli(args) {
  return spawnSync(process.execPath, [BIN_PATH, ...args], {
    cwd: path.resolve(__dirname, '../..'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

test('UX flag matrix documents supported commands', () => {
  assert.deepEqual(getUxFlagSupport('ai prepare-context'), {
    withPlanner: true,
    interactive: true,
    review: true,
    note: 'planner-assisted docs-only context preparation',
  });
  assert.deepEqual(getUxFlagSupport('ai pr'), {
    withPlanner: false,
    interactive: true,
    review: true,
    note: 'PR body review and interactive PR inputs',
  });
  assert.deepEqual(getUxFlagSupport('flow'), {
    withPlanner: false,
    interactive: false,
    review: false,
    note: 'no UX flag support',
  });
});

test('resolveUxCommandKey handles top-level, ai, and spec commands', () => {
  assert.equal(resolveUxCommandKey({ mode: 'flow' }), 'flow');
  assert.equal(resolveUxCommandKey({ mode: 'ai', aiCommand: 'inspect' }), 'ai inspect');
  assert.equal(resolveUxCommandKey({ mode: 'ai', aiCommand: 'specs', aiSecondaryCommand: 'list' }), 'ai specs list');
  assert.equal(resolveUxCommandKey({ mode: 'spec', specCommand: 'create' }), 'spec create');
});

test('supported UX flags validate for planner-capable and PR commands', () => {
  assert.deepEqual(validateUxFlags({
    mode: 'ai',
    aiCommand: 'prepare-context',
    withPlanner: true,
    interactive: true,
    review: true,
  }), {
    commandKey: 'ai prepare-context',
    requested: ['--with-planner', '--interactive', '--review'],
    supported: ['--with-planner', '--interactive', '--review'],
  });

  assert.deepEqual(validateUxFlags({
    mode: 'ai',
    aiCommand: 'pr',
    interactive: true,
    review: true,
  }), {
    commandKey: 'ai pr',
    requested: ['--interactive', '--review'],
    supported: ['--interactive', '--review'],
  });
});

test('unsupported UX flags fail with actionable guidance before command execution', () => {
  const result = runCli(['flow', '--interactive']);

  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /UX flag --interactive is not supported by 'flow'/);
  assert.match(result.stderr, /Supported UX flags for 'flow': none/);
  assert.match(result.stderr, /Use explicit non-interactive flags/);
});

test('ai pr rejects --with-planner while keeping review flags available', () => {
  const result = runCli(['ai', 'pr', '--with-planner', '--dry-run']);

  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /UX flag --with-planner is not supported by 'ai pr'/);
  assert.match(result.stderr, /Supported UX flags for 'ai pr': --interactive, --review/);
  assert.match(result.stderr, /ai prepare-context --with-planner --dry-run/);
});

test('JSON mode rejects interactive and review flows without partial JSON stdout', () => {
  const interactive = runCli(['ai', 'export', '--json', '--interactive']);
  assert.notEqual(interactive.status, 0);
  assert.equal(interactive.stdout, '');
  assert.match(interactive.stderr, /--json cannot be combined with --interactive/);

  const review = runCli(['spec', 'create', '--json', '--review', '--dry-run']);
  assert.notEqual(review.status, 0);
  assert.equal(review.stdout, '');
  assert.match(review.stderr, /--json cannot be combined with --review/);
});

test('read-only ai inspect rejects UX flags early', () => {
  const result = runCli(['ai', 'inspect', '--review']);

  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /UX flag --review is not supported by 'ai inspect'/);
});

test('existing JSON command output stays parseable when no UX flags are requested', () => {
  const result = runCli(['plan', '--json']);

  assert.equal(result.status, 0);
  assert.doesNotThrow(() => JSON.parse(result.stdout));
  assert.equal(result.stderr, '');
});
