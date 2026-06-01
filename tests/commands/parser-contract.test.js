const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const packageJson = require('../../package.json');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');
const REPO_ROOT = path.resolve(__dirname, '../..');

function runCli(args, options = {}) {
  return spawnSync(process.execPath, [BIN_PATH, ...args], {
    cwd: options.cwd || REPO_ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...(options.env || {}),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function makeTmpDir(prefix = 'quiver-parser-contract-') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

test('root version flags remain semver-only and bypass command parsing', () => {
  for (const flag of ['--version', '-V']) {
    const result = runCli([flag]);

    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), packageJson.version);
    assert.equal(result.stderr, '');
  }
});

test('global language flag works before, after, and inline without changing JSON stdout', () => {
  const cases = [
    ['--lang', 'es', 'version', '--json'],
    ['version', '--json', '--lang', 'es'],
    ['--lang=es', 'version', '--json'],
  ];

  for (const args of cases) {
    const result = runCli(args);
    const parsed = JSON.parse(result.stdout);

    assert.equal(result.status, 0, args.join(' '));
    assert.equal(result.stderr, '');
    assert.equal(parsed.version_schema_version, 1);
    assert.equal(parsed.cli.version, packageJson.version);
  }
});

test('early parser errors keep JSON stdout empty and localize after --lang extraction', () => {
  const result = runCli(['--lang', 'es', '--unknown-flag', '--json']);

  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /create-quiver: flag no compatible: --unknown-flag/);
});

test('missing values are rejected before command execution', () => {
  const cases = [
    { args: ['ai', 'approve', '--phase', 'technical-plan', '--version'], pattern: /missing value for --version/ },
    { args: ['graph', '--level', 'abc'], pattern: /invalid value for --level/ },
    { args: ['ai', 'execute-plan', '--mode'], pattern: /missing value for --mode/ },
    { args: ['evidence', 'run', '--max-output', '0', '--', process.execPath, '-e', ''], pattern: /invalid value for --max-output/ },
  ];

  for (const item of cases) {
    const result = runCli(item.args);

    assert.notEqual(result.status, 0, item.args.join(' '));
    assert.equal(result.stdout, '');
    assert.match(result.stderr, item.pattern);
  }
});

test('positional validation rejects documented no-positional forms', () => {
  const cases = [
    { args: ['plan', 'unexpected'], pattern: /plan does not accept positional arguments/ },
    { args: ['flow', 'unexpected'], pattern: /flow does not accept positional arguments/ },
    { args: ['version', 'unexpected'], pattern: /version does not accept positional arguments/ },
    { args: ['dashboard', 'unexpected'], pattern: /dashboard does not accept positional arguments/ },
    { args: ['spec', 'create', 'unexpected'], pattern: /spec create does not accept positional arguments/ },
    { args: ['evidence', 'run', 'npm', 'test'], pattern: /evidence run does not accept positional arguments before --/ },
    { args: ['ai', 'plan', 'extra'], pattern: /ai does not accept extra positional arguments/ },
  ];

  for (const item of cases) {
    const result = runCli(item.args);

    assert.notEqual(result.status, 0, item.args.join(' '));
    assert.equal(result.stdout, '');
    assert.match(result.stderr, item.pattern);
  }
});

test('-- separator passes command flags through evidence run', () => {
  const tmp = makeTmpDir();
  try {
    const result = runCli([
      'evidence',
      'run',
      '--output',
      'separator.md',
      '--',
      process.execPath,
      '-e',
      'console.log(process.argv.slice(1).join("|"))',
      '--',
      '--not-a-quiver-flag',
      'value',
    ], { cwd: tmp.root });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Quiver evidence recorded/);

    const evidence = fs.readFileSync(path.join(tmp.root, 'separator.md'), 'utf8');
    assert.match(evidence, /--not-a-quiver-flag\|value/);
  } finally {
    tmp.cleanup();
  }
});

test('deprecated aliases warn on stderr without contaminating stdout contract', () => {
  const cases = [
    { args: ['check-slice', 'missing.json', '--local'], warning: /deprecated command: check-slice/ },
    { args: ['check-handoff', 'missing.md'], warning: /deprecated command: check-handoff/ },
    { args: ['ai', 'approval-status'], warning: /deprecated command: ai approval-status/ },
    { args: ['ai', 'executor-prompt', '--slice', 'missing.json'], warning: /deprecated command: ai executor-prompt/ },
  ];

  for (const item of cases) {
    const result = runCli(item.args);

    assert.match(result.stderr, item.warning, item.args.join(' '));
    assert.doesNotMatch(result.stdout, /deprecated command:/);
  }
});

test('json mode suppresses legacy deprecation warnings', () => {
  const result = runCli(['check-slice', 'missing.json', '--local', '--json']);

  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, '');
  assert.doesNotMatch(result.stderr, /deprecated command:/);
});

test('compatibility aliases route without deprecation where currently documented', () => {
  const lifecycle = runCli(['ai', 'run', 'create', '--input', 'missing.md']);
  assert.doesNotMatch(lifecycle.stderr, /deprecated command:/);

  const demo = runCli(['demo', 'spec-viewer', '--dry-run']);
  assert.equal(demo.status, 0);
  assert.doesNotMatch(demo.stderr, /deprecated command:/);
  assert.match(demo.stdout, /spec-viewer|Spec Viewer/i);
});

test('collection commands preserve current default list-like parser behavior', () => {
  const models = runCli(['ai', 'models', '--json']);

  assert.equal(models.status, 0);
  assert.equal(models.stderr, '');
  assert.equal(JSON.parse(models.stdout).catalogVersion, 1);
});

test('registered parser ambiguities are pinned before migration', () => {
  const doctorProfileCollision = runCli(['ai', 'agent', 'set', 'doctor', '--provider', 'codex', '--model', 'gpt-5.5', '--doctor', 'profile-a', '--dry-run']);
  assert.notEqual(doctorProfileCollision.status, 0);
  assert.doesNotMatch(doctorProfileCollision.stderr, /ai agent set/);

  const statusWithIgnoredPositional = runCli(['status', 'ignored-target', '--json']);
  assert.equal(statusWithIgnoredPositional.status, 0);
  assert.equal(JSON.parse(statusWithIgnoredPositional.stdout).schema_version, 1);
});

test('command-scoped flags reject unsupported global-looking usage', () => {
  const globalOutsideConfig = runCli(['version', '--global']);
  assert.notEqual(globalOutsideConfig.status, 0);
  assert.equal(globalOutsideConfig.stdout, '');
  assert.match(globalOutsideConfig.stderr, /--global is only supported by config language set/);

  const dashboardFlagOutsideDashboard = runCli(['version', '--section', 'slices']);
  assert.notEqual(dashboardFlagOutsideDashboard.status, 0);
  assert.equal(dashboardFlagOutsideDashboard.stdout, '');
  assert.match(dashboardFlagOutsideDashboard.stderr, /--section is only supported by dashboard/);
});
