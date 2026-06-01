const path = require('path');

const {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  formatLanguageWarning,
  globalLanguageConfigPath,
  normalizeLanguage,
  projectLanguageConfigPath,
  writeGlobalLanguageConfig,
  writeProjectLanguageConfig,
} = require('../lib/i18n/language');
const { createTranslator } = require('../lib/i18n/catalog');

function formatError(translator, key, params = {}) {
  return `create-quiver: ${translator.t(key, params)}`;
}

function toJsonWarning(warning) {
  return {
    code: warning.code,
    source: warning.source,
    requested_language: warning.requestedLanguage,
    fallback_language: warning.fallbackLanguage,
    supported_languages: warning.supportedLanguages,
  };
}

function formatProjectRelativePath(repoRoot, filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join('/') || '.';
}

function validateLanguageForSet(language, translator) {
  const normalized = normalizeLanguage(language);
  if (!normalized || normalized !== String(language || '').trim().toLowerCase()) {
    throw new Error(formatError(translator, 'config.error.unsupported_language', {
      fallback: DEFAULT_LANGUAGE,
      language: language || '<missing>',
      supported: SUPPORTED_LANGUAGES.join(', '),
    }));
  }
  return normalized;
}

function runLanguageShow(repoRoot, options = {}) {
  const translator = createTranslator(options.language);
  const resolution = options.languageResolution || {
    language: DEFAULT_LANGUAGE,
    source: 'default',
    warnings: [],
  };
  const warnings = resolution.warnings || [];

  if (options.json) {
    process.stdout.write(`${JSON.stringify({
      schema_version: 1,
      language: resolution.language,
      source: resolution.source,
      requested_source: resolution.requestedSource || null,
      requested_language: resolution.requestedLanguage || null,
      warnings: warnings.map(toJsonWarning),
    }, null, 2)}\n`);
    return;
  }

  const lines = [
    translator.t('config.output.show_title'),
    translator.t('config.output.language', { language: resolution.language }),
    translator.t('config.output.source', { source: resolution.source }),
  ];
  for (const warning of warnings) {
    lines.push(formatLanguageWarning(warning));
  }
  process.stdout.write(`${lines.join('\n')}\n`);
}

function runLanguageSet(repoRoot, options = {}) {
  const translator = createTranslator(options.language);
  const language = validateLanguageForSet(options.value, translator);
  const global = options.global === true;
  const configPath = global ? globalLanguageConfigPath() : projectLanguageConfigPath(repoRoot);

  if (global) {
    writeGlobalLanguageConfig(language);
  } else {
    writeProjectLanguageConfig(repoRoot, language);
  }

  const displayPath = global ? '~/.quiver/config.json' : formatProjectRelativePath(repoRoot, configPath);
  const scope = global ? 'global' : 'project';

  if (options.json) {
    process.stdout.write(`${JSON.stringify({
      schema_version: 1,
      action: 'set',
      scope,
      language,
      path: displayPath,
    }, null, 2)}\n`);
    return;
  }

  process.stdout.write([
    translator.t('config.output.updated_title'),
    translator.t('config.output.scope', { scope }),
    translator.t('config.output.path', { path: displayPath }),
    translator.t('config.output.language', { language }),
  ].join('\n') + '\n');
}

function runConfig(repoRoot, options = {}) {
  const translator = createTranslator(options.language);
  if (options.section !== 'language') {
    throw new Error(formatError(translator, 'config.error.unsupported_section', {
      section: options.section || '(missing)',
    }));
  }

  if (options.command === 'show') {
    runLanguageShow(repoRoot, options);
    return;
  }

  if (options.command === 'set') {
    runLanguageSet(repoRoot, options);
    return;
  }

  throw new Error(formatError(translator, 'config.error.unsupported_language_command', {
    command: options.command || '(missing)',
  }));
}

module.exports = {
  runConfig,
};
