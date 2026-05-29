const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const packageJson = require('../../package.json');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function makeRepo(language = '') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-version-cli-'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-version-home-'));
  fs.writeFileSync(path.join(root, 'package.json'), `${JSON.stringify({
    name: 'version-cli-project',
    packageManager: 'pnpm@9.0.0',
  }, null, 2)}\n`);
  fs.mkdirSync(path.join(root, '.quiver'), { recursive: true });
  fs.writeFileSync(path.join(root, '.quiver', 'state.json'), `${JSON.stringify({
    initialized_version: '0.15.2',
  }, null, 2)}\n`);
  fs.writeFileSync(path.join(root, '.quiver', 'config.json'), `${JSON.stringify({
    layout_version: 1,
    ...(language ? { language } : {}),
  }, null, 2)}\n`);

  return {
    home,
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
      fs.rmSync(home, { recursive: true, force: true });
    },
  };
}

function runCli(repo, args, env = {}) {
  return execFileSync(process.execPath, [BIN_PATH, ...args], {
    cwd: repo.root,
    encoding: 'utf8',
    env: {
      ...process.env,
      HOME: repo.home,
      QUIVER_LANG: '',
      LANG: 'en_US.UTF-8',
      ...env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

test('version command renders English and Spanish human labels', () => {
  const repo = makeRepo();
  try {
    const english = runCli(repo, ['version', '--no-color'], { QUIVER_LANG: 'en' });
    const spanish = runCli(repo, ['version', '--no-color', '--lang', 'es']);

    assert.match(english, /Quiver CLI: /);
    assert.match(english, /Package manager: pnpm@9\.0\.0/);
    assert.match(english, /Project: version-cli-project \(Quiver project\)/);
    assert.match(spanish, /CLI de Quiver: /);
    assert.match(spanish, /Administrador de paquetes: pnpm@9\.0\.0/);
    assert.match(spanish, /Proyecto: version-cli-project \(proyecto Quiver\)/);
    assert.doesNotMatch(spanish, /Package manager:/);
  } finally {
    repo.cleanup();
  }
});

test('version command uses configured project language without --lang', () => {
  const repo = makeRepo('es');
  try {
    const output = runCli(repo, ['version', '--no-color'], { QUIVER_LANG: '' });

    assert.match(output, /CLI de Quiver: /);
    assert.match(output, /Administrador de paquetes: pnpm@9\.0\.0/);
    assert.doesNotMatch(output, /Package manager:/);
  } finally {
    repo.cleanup();
  }
});

test('version JSON and top-level semver output remain stable with language overrides', () => {
  const repo = makeRepo('es');
  try {
    const report = JSON.parse(runCli(repo, ['--lang', 'es', 'version', '--json']));
    const semver = runCli(repo, ['--lang', 'es', '--version']).trim();

    assert.equal(report.version_schema_version, 1);
    assert.equal(report.cli.version, packageJson.version);
    assert.equal(report.package_manager.name, 'pnpm');
    assert.equal(semver, packageJson.version);
  } finally {
    repo.cleanup();
  }
});
