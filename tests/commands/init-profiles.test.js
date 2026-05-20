const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const cliPath = path.resolve(__dirname, '../../bin/create-quiver.js');

function makeTmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-init-cli-test-'));
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

function runCli(args, options = {}) {
  return execFileSync(process.execPath, [cliPath, ...args], {
    cwd: options.cwd || path.resolve(__dirname, '../..'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

test('init --dry-run prints the planned layout and does not write files', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    const output = runCli(['init', '--name', 'Dry Project', '--dir', target, '--dry-run']);

    assert.match(output, /Init dry-run plan/);
    assert.match(output, /Project: Dry Project/);
    assert.match(output, /Entry point: explicit init command/);
    assert.match(output, /Profile: default/);
    assert.equal(fs.existsSync(target), false);
  } finally {
    cleanup();
  }
});

test('legacy --name alias supports dry-run without writing files', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    const output = runCli(['--name', 'Alias Project', '--dir', target, '--dry-run']);

    assert.match(output, /Init dry-run plan/);
    assert.match(output, /Project: Alias Project/);
    assert.match(output, /Entry point: compatibility alias/);
    assert.match(output, /compatibility alias path used/);
    assert.equal(fs.existsSync(target), false);
  } finally {
    cleanup();
  }
});

test('init --dry-run reports requested profiles and optional assets', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const minimalOutput = runCli(['init', '--name', 'Minimal Project', '--dir', path.join(dir, 'minimal'), '--minimal', '--dry-run']);
    const fullOutput = runCli(['init', '--name', 'Full Project', '--dir', path.join(dir, 'full'), '--full', '--dry-run']);
    const optionalOutput = runCli([
      'init',
      '--name',
      'Optional Project',
      '--dir',
      path.join(dir, 'optional'),
      '--legacy-scripts',
      '--include-templates',
      '--dry-run',
    ]);

    assert.match(minimalOutput, /Profile: minimal/);
    assert.match(fullOutput, /Profile: full/);
    assert.match(fullOutput, /docs-template/);
    assert.match(optionalOutput, /tools\/scripts\/start-slice\.sh/);
    assert.match(optionalOutput, /\.quiver\/templates\//);
  } finally {
    cleanup();
  }
});

test('init rejects incompatible profile flags before writing files', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    assert.throws(
      () => runCli(['init', '--name', 'Bad Project', '--dir', target, '--minimal', '--full', '--dry-run']),
      /--minimal and --full are mutually exclusive/,
    );
    assert.equal(fs.existsSync(target), false);
  } finally {
    cleanup();
  }
});

test('init command without dry-run still preserves the historical generated layout for this slice', () => {
  const { dir, cleanup } = makeTmpDir();
  const target = path.join(dir, 'target');
  try {
    runCli(['init', '--name', 'Real Project', '--dir', target, '--skip-install']);

    assert.equal(fs.existsSync(path.join(target, 'docs-template')), true);
    assert.equal(fs.existsSync(path.join(target, 'tools', 'scripts')), true);
    assert.equal(fs.existsSync(path.join(target, 'specs', 'real-project', 'slices', 'slice-template', 'slice.json')), true);
  } finally {
    cleanup();
  }
});
