const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  collectVersionReport,
  detectPackageManager,
  formatHumanVersionReport,
} = require('../../src/create-quiver/lib/version');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-version-'));
}

function stripAnsi(value) {
  return String(value).replace(/\u001b\[[0-9;]*m/g, '');
}

test('collectVersionReport works outside an initialized project', () => {
  const root = makeTempDir();
  try {
    const report = collectVersionReport(root, { cliVersion: '1.2.3', env: {} });

    assert.equal(report.version_schema_version, 1);
    assert.equal(report.cli.version, '1.2.3');
    assert.equal(report.project.name, null);
    assert.equal(report.project.path, null);
    assert.equal(report.project.quiver_initialized, false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('detectPackageManager uses package.json before lockfiles and env', () => {
  const root = makeTempDir();
  try {
    fs.writeFileSync(path.join(root, 'package.json'), `${JSON.stringify({
      name: 'version-project',
      packageManager: 'pnpm@9.0.0',
    }, null, 2)}\n`);
    fs.writeFileSync(path.join(root, 'package-lock.json'), '{}\n');

    assert.deepEqual(detectPackageManager(root, { npm_config_user_agent: 'yarn/1.22.0' }), {
      name: 'pnpm',
      version: '9.0.0',
      source: 'package.json',
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('formatHumanVersionReport is readable without color and fits the banner budget', () => {
  const root = makeTempDir();
  try {
    const report = collectVersionReport(root, { cliVersion: '1.2.3', env: {} });
    const output = formatHumanVersionReport(report, {
      env: {},
      noColor: true,
      stdoutIsTTY: true,
    });
    const plain = stripAnsi(output);
    const bannerLines = plain.split(/\r?\n/).slice(0, 5);

    assert.match(plain, /Quiver CLI: 1\.2\.3/);
    assert.match(plain, /Project: none/);
    assert.doesNotMatch(output, /\u001b\[/);
    assert.equal(bannerLines.every((line) => line.length <= 80), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('formatHumanVersionReport uses Quiver palette when color is enabled', () => {
  const root = makeTempDir();
  try {
    const report = collectVersionReport(root, { cliVersion: '1.2.3', env: {} });
    const output = formatHumanVersionReport(report, {
      env: {},
      stdoutIsTTY: true,
    });

    assert.match(output, /\u001b\[38;2;134;200;242m/);
    assert.match(output, /\u001b\[38;2;213;106;176m/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
