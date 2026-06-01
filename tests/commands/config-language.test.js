const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function makeProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-config-language-'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-config-home-'));
  return {
    root,
    home,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
      fs.rmSync(home, { recursive: true, force: true });
    },
  };
}

function cleanEnv(home, extra = {}) {
  return {
    PATH: process.env.PATH,
    HOME: home,
    USERPROFILE: home,
    LANG: 'C',
    LANGUAGE: '',
    LC_ALL: '',
    LC_MESSAGES: '',
    QUIVER_LANG: '',
    ...extra,
  };
}

function runCli(repoRoot, args, env = {}) {
  return execFileSync(process.execPath, [BIN_PATH, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

test('config language set writes project config and preserves existing keys', () => {
  const project = makeProject();
  try {
    const configPath = path.join(project.root, '.quiver', 'config.json');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, `${JSON.stringify({ project: 'demo' }, null, 2)}\n`);

    const output = runCli(project.root, ['config', 'language', 'set', 'es'], cleanEnv(project.home));
    const saved = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    assert.match(output, /Quiver config language updated/);
    assert.match(output, /Scope: project/);
    assert.match(output, /Path: \.quiver\/config\.json/);
    assert.match(output, /Language: es/);
    assert.deepEqual(saved, {
      project: 'demo',
      language: 'es',
    });
  } finally {
    project.cleanup();
  }
});

test('config language show reports effective project language in human and JSON modes', () => {
  const project = makeProject();
  try {
    runCli(project.root, ['config', 'language', 'set', 'es'], cleanEnv(project.home));

    const human = runCli(project.root, ['config', 'language', 'show'], cleanEnv(project.home));
    const json = JSON.parse(runCli(project.root, ['config', 'language', 'show', '--json'], cleanEnv(project.home)));

    assert.match(human, /Idioma de configuracion de Quiver/);
    assert.match(human, /Idioma: es/);
    assert.match(human, /Fuente: \.quiver\/config\.json/);
    assert.deepEqual(json, {
      schema_version: 1,
      language: 'es',
      source: '.quiver/config.json',
      requested_source: null,
      requested_language: 'es',
      warnings: [],
    });
  } finally {
    project.cleanup();
  }
});

test('config language errors localize in Spanish without changing JSON output', () => {
  const project = makeProject();
  try {
    assert.throws(
      () => runCli(project.root, ['--lang', 'es', 'config', 'language', 'set', 'fr'], cleanEnv(project.home)),
      /create-quiver: idioma no compatible: fr\. Idiomas soportados: en, es/,
    );

    const json = JSON.parse(runCli(project.root, ['--lang', 'es', 'config', 'language', 'show', '--json'], cleanEnv(project.home)));
    assert.equal(json.language, 'es');
    assert.equal(json.source, '--lang');
  } finally {
    project.cleanup();
  }
});

test('config language set --global writes user config without project config', () => {
  const project = makeProject();
  try {
    const output = runCli(project.root, ['config', 'language', 'set', 'en', '--global'], cleanEnv(project.home));
    const globalConfigPath = path.join(project.home, '.quiver', 'config.json');
    const saved = JSON.parse(fs.readFileSync(globalConfigPath, 'utf8'));
    const json = JSON.parse(runCli(project.root, ['config', 'language', 'show', '--json'], cleanEnv(project.home)));

    assert.match(output, /Scope: global/);
    assert.match(output, /Path: ~\/\.quiver\/config\.json/);
    assert.deepEqual(saved, { language: 'en' });
    assert.equal(json.language, 'en');
    assert.equal(json.source, '~/.quiver/config.json');
  } finally {
    project.cleanup();
  }
});

test('config language set --json emits stable machine output', () => {
  const project = makeProject();
  try {
    const json = JSON.parse(runCli(project.root, ['config', 'language', 'set', 'es', '--json'], cleanEnv(project.home)));

    assert.deepEqual(json, {
      schema_version: 1,
      action: 'set',
      scope: 'project',
      language: 'es',
      path: '.quiver/config.json',
    });
  } finally {
    project.cleanup();
  }
});

test('config language show respects overrides without polluting JSON', () => {
  const project = makeProject();
  try {
    runCli(project.root, ['config', 'language', 'set', 'en'], cleanEnv(project.home));

    const envJson = JSON.parse(runCli(project.root, ['config', 'language', 'show', '--json'], cleanEnv(project.home, {
      QUIVER_LANG: 'es',
    })));
    const flagJson = JSON.parse(runCli(project.root, ['--lang', 'es', 'config', 'language', 'show', '--json'], cleanEnv(project.home)));

    assert.equal(envJson.language, 'es');
    assert.equal(envJson.source, 'QUIVER_LANG');
    assert.equal(flagJson.language, 'es');
    assert.equal(flagJson.source, '--lang');
  } finally {
    project.cleanup();
  }
});

test('config language rejects invalid values and unsupported --global usage', () => {
  const project = makeProject();
  try {
    assert.throws(
      () => runCli(project.root, ['config', 'language', 'set', 'fr'], cleanEnv(project.home)),
      /create-quiver: unsupported language: fr\. Supported languages: en, es/,
    );
    assert.throws(
      () => runCli(project.root, ['config', 'language', 'show', '--global'], cleanEnv(project.home)),
      /create-quiver: --global is only supported by config language set/,
    );
    assert.throws(
      () => runCli(project.root, ['version', '--global'], cleanEnv(project.home)),
      /create-quiver: --global is only supported by config language set/,
    );
  } finally {
    project.cleanup();
  }
});
