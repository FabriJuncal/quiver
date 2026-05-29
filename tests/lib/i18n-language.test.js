const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  DEFAULT_LANGUAGE,
  extractCliLanguageFlag,
  formatLanguageWarning,
  globalLanguageConfigPath,
  normalizeLanguage,
  projectLanguageConfigPath,
  resolveLanguage,
  writeGlobalLanguageConfig,
  writeProjectLanguageConfig,
} = require('../../src/create-quiver/lib/i18n/language');

function makeProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-i18n-language-'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-i18n-home-'));
  return {
    root,
    home,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
      fs.rmSync(home, { recursive: true, force: true });
    },
  };
}

test('normalizes supported language and locale values', () => {
  assert.equal(normalizeLanguage('en'), 'en');
  assert.equal(normalizeLanguage('es'), 'es');
  assert.equal(normalizeLanguage('es_AR'), 'es');
  assert.equal(normalizeLanguage('es-AR'), 'es');
  assert.equal(normalizeLanguage('en_US.UTF-8'), 'en');
  assert.equal(normalizeLanguage('en-US'), 'en');
  assert.equal(normalizeLanguage('C.UTF-8'), '');
  assert.equal(normalizeLanguage('fr'), '');
});

test('resolves language by approved precedence order', () => {
  const project = makeProject();
  try {
    writeProjectLanguageConfig(project.root, 'en');
    writeGlobalLanguageConfig('es', project.home);

    assert.deepEqual(resolveLanguage({
      cliLanguage: 'es',
      env: { QUIVER_LANG: 'en', LANG: 'en_US.UTF-8' },
      projectRoot: project.root,
      homeDir: project.home,
      intlLocale: 'en-US',
    }).language, 'es');

    assert.equal(resolveLanguage({
      env: { QUIVER_LANG: 'es', LANG: 'en_US.UTF-8' },
      projectRoot: project.root,
      homeDir: project.home,
      intlLocale: 'en-US',
    }).source, 'QUIVER_LANG');

    assert.deepEqual(resolveLanguage({
      env: { LANG: 'es_AR.UTF-8' },
      projectRoot: project.root,
      homeDir: project.home,
      intlLocale: 'es-AR',
    }), {
      language: 'en',
      source: '.quiver/config.json',
      requestedLanguage: 'en',
      warnings: [],
    });
  } finally {
    project.cleanup();
  }
});

test('uses global config when project config is missing', () => {
  const project = makeProject();
  try {
    writeGlobalLanguageConfig('es', project.home);

    const resolved = resolveLanguage({
      env: {},
      projectRoot: project.root,
      homeDir: project.home,
      intlLocale: 'en-US',
    });

    assert.equal(resolved.language, 'es');
    assert.equal(resolved.source, '~/.quiver/config.json');
    assert.equal(globalLanguageConfigPath(project.home), path.join(project.home, '.quiver', 'config.json'));
  } finally {
    project.cleanup();
  }
});

test('uses locale detection before default fallback', () => {
  const project = makeProject();
  try {
    assert.deepEqual(resolveLanguage({
      env: {
        LC_ALL: 'C.UTF-8',
        LC_MESSAGES: 'en_US.UTF-8',
        LANG: 'es_AR.UTF-8',
      },
      projectRoot: project.root,
      homeDir: project.home,
      intlLocale: 'es-AR',
    }), {
      language: 'en',
      source: 'locale:LC_MESSAGES',
      requestedLanguage: 'en_US.UTF-8',
      warnings: [],
    });

    assert.equal(resolveLanguage({
      env: { LANGUAGE: 'fr:es_AR', LANG: 'C.UTF-8' },
      projectRoot: project.root,
      homeDir: project.home,
      intlLocale: 'en-US',
    }).language, 'es');

    assert.equal(resolveLanguage({
      env: {},
      projectRoot: project.root,
      homeDir: project.home,
      intlLocale: 'C',
    }).language, DEFAULT_LANGUAGE);
  } finally {
    project.cleanup();
  }
});

test('unsupported explicit language falls back to en with actionable warning', () => {
  const project = makeProject();
  try {
    writeProjectLanguageConfig(project.root, 'es');

    const resolved = resolveLanguage({
      cliLanguage: 'fr',
      env: { QUIVER_LANG: 'es' },
      projectRoot: project.root,
      homeDir: project.home,
      intlLocale: 'es-AR',
    });

    assert.equal(resolved.language, 'en');
    assert.equal(resolved.source, 'fallback');
    assert.equal(resolved.requestedSource, '--lang');
    assert.equal(resolved.warnings[0].code, 'UNSUPPORTED_LANGUAGE');
    assert.match(formatLanguageWarning(resolved.warnings[0]), /unsupported language "fr" from --lang/);
  } finally {
    project.cleanup();
  }
});

test('language config writes preserve existing keys and reject unsupported persisted values', () => {
  const project = makeProject();
  try {
    const configPath = projectLanguageConfigPath(project.root);
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, `${JSON.stringify({ project: 'demo', feature: true }, null, 2)}\n`);

    writeProjectLanguageConfig(project.root, 'es');
    assert.deepEqual(JSON.parse(fs.readFileSync(configPath, 'utf8')), {
      project: 'demo',
      feature: true,
      language: 'es',
    });

    assert.throws(
      () => writeProjectLanguageConfig(project.root, 'es-AR'),
      /unsupported language: es-AR/,
    );
  } finally {
    project.cleanup();
  }
});

test('extracts global --lang before or after command names', () => {
  assert.deepEqual(extractCliLanguageFlag(['--lang', 'es', 'version', '--json']), {
    argv: ['version', '--json'],
    language: 'es',
  });
  assert.deepEqual(extractCliLanguageFlag(['version', '--json', '--lang=en']), {
    argv: ['version', '--json'],
    language: 'en',
  });
  assert.deepEqual(extractCliLanguageFlag(['evidence', 'run', '--', 'node', 'script.js', '--lang', 'es']), {
    argv: ['evidence', 'run', '--', 'node', 'script.js', '--lang', 'es'],
    language: '',
  });
  assert.throws(
    () => extractCliLanguageFlag(['--lang', '--json']),
    /missing value for --lang/,
  );
});
