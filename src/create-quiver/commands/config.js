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

function formatError(message) {
  return `create-quiver: ${message}`;
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

function validateLanguageForSet(language) {
  const normalized = normalizeLanguage(language);
  if (!normalized || normalized !== String(language || '').trim().toLowerCase()) {
    throw new Error(formatError(`unsupported language: ${language || '<missing>'}. Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}. Run: npx create-quiver config language set ${DEFAULT_LANGUAGE}`));
  }
  return normalized;
}

function runLanguageShow(repoRoot, options = {}) {
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
    'Quiver config language',
    `Language: ${resolution.language}`,
    `Source: ${resolution.source}`,
  ];
  for (const warning of warnings) {
    lines.push(formatLanguageWarning(warning));
  }
  process.stdout.write(`${lines.join('\n')}\n`);
}

function runLanguageSet(repoRoot, options = {}) {
  const language = validateLanguageForSet(options.value);
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
    'Quiver config language updated',
    `Scope: ${scope}`,
    `Path: ${displayPath}`,
    `Language: ${language}`,
  ].join('\n') + '\n');
}

function runConfig(repoRoot, options = {}) {
  if (options.section !== 'language') {
    throw new Error(formatError(`unsupported config section: ${options.section || '(missing)'}. Supported sections: language`));
  }

  if (options.command === 'show') {
    runLanguageShow(repoRoot, options);
    return;
  }

  if (options.command === 'set') {
    runLanguageSet(repoRoot, options);
    return;
  }

  throw new Error(formatError(`unsupported config language command: ${options.command || '(missing)'}. Supported commands: show, set`));
}

module.exports = {
  runConfig,
};
