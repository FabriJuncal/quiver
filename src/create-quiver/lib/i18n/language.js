const fs = require('fs');
const os = require('os');
const path = require('path');

const DEFAULT_LANGUAGE = 'en';
const SUPPORTED_LANGUAGES = Object.freeze(['en', 'es']);
const PROJECT_CONFIG_RELATIVE_PATH = path.join('.quiver', 'config.json');
const GLOBAL_CONFIG_RELATIVE_PATH = path.join('.quiver', 'config.json');

function isSupportedLanguage(language) {
  return SUPPORTED_LANGUAGES.includes(language);
}

function normalizeLanguage(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  const firstLanguage = raw.split(':').find((part) => part.trim()) || raw;
  const normalized = firstLanguage
    .trim()
    .replace(/_/g, '-')
    .split('.')[0]
    .split('@')[0]
    .toLowerCase();
  const primary = normalized.split('-')[0];

  return isSupportedLanguage(primary) ? primary : '';
}

function projectLanguageConfigPath(projectRoot) {
  return path.join(projectRoot, PROJECT_CONFIG_RELATIVE_PATH);
}

function globalLanguageConfigPath(homeDir = os.homedir()) {
  return path.join(homeDir, GLOBAL_CONFIG_RELATIVE_PATH);
}

function readJsonFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readLanguageConfig(filePath) {
  const config = readJsonFile(filePath);
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return {
      exists: Boolean(config),
      language: '',
      raw: config,
    };
  }

  return {
    exists: true,
    language: typeof config.language === 'string' ? config.language : '',
    raw: config,
  };
}

function assertWritableLanguage(language) {
  const normalized = normalizeLanguage(language);
  if (!normalized || normalized !== String(language || '').trim().toLowerCase()) {
    throw new Error(`unsupported language: ${language}. Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`);
  }
  return normalized;
}

function writeLanguageConfig(filePath, language) {
  const normalized = assertWritableLanguage(language);
  const current = readJsonFile(filePath);
  const base = current && typeof current === 'object' && !Array.isArray(current) ? current : {};
  const next = {
    ...base,
    language: normalized,
  };

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(next, null, 2)}\n`);
  return next;
}

function readProjectLanguageConfig(projectRoot) {
  return readLanguageConfig(projectLanguageConfigPath(projectRoot));
}

function writeProjectLanguageConfig(projectRoot, language) {
  return writeLanguageConfig(projectLanguageConfigPath(projectRoot), language);
}

function readGlobalLanguageConfig(homeDir = os.homedir()) {
  return readLanguageConfig(globalLanguageConfigPath(homeDir));
}

function writeGlobalLanguageConfig(language, homeDir = os.homedir()) {
  return writeLanguageConfig(globalLanguageConfigPath(homeDir), language);
}

function detectLocaleLanguage(options = {}) {
  const env = options.env || process.env;
  const intlLocale = Object.prototype.hasOwnProperty.call(options, 'intlLocale')
    ? options.intlLocale
    : Intl.DateTimeFormat().resolvedOptions().locale;
  const candidates = [
    ['locale:LC_ALL', env.LC_ALL],
    ['locale:LC_MESSAGES', env.LC_MESSAGES],
    ['locale:LANG', env.LANG],
  ];

  const languageValues = String(env.LANGUAGE || '')
    .split(':')
    .filter(Boolean)
    .map((value) => ['locale:LANGUAGE', value]);
  candidates.push(...languageValues);
  candidates.push(['locale:Intl', intlLocale]);

  for (const [source, value] of candidates) {
    const language = normalizeLanguage(value);
    if (language) {
      return {
        language,
        source,
        requestedLanguage: value,
      };
    }
  }

  return {
    language: '',
    source: '',
    requestedLanguage: '',
  };
}

function unsupportedLanguageWarning(source, requestedLanguage) {
  return {
    code: 'UNSUPPORTED_LANGUAGE',
    source,
    requestedLanguage: String(requestedLanguage || ''),
    fallbackLanguage: DEFAULT_LANGUAGE,
    supportedLanguages: [...SUPPORTED_LANGUAGES],
  };
}

function resolveProvidedLanguage(source, value) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const language = normalizeLanguage(value);
  if (language) {
    return {
      language,
      source,
      requestedLanguage: value,
      warnings: [],
    };
  }

  return {
    language: DEFAULT_LANGUAGE,
    source: 'fallback',
    requestedSource: source,
    requestedLanguage: value,
    warnings: [unsupportedLanguageWarning(source, value)],
  };
}

function resolveLanguage(options = {}) {
  const env = options.env || process.env;
  const projectRoot = options.projectRoot || process.cwd();
  const homeDir = typeof options.homeDir === 'string' && options.homeDir
    ? options.homeDir
    : os.homedir();

  const cli = resolveProvidedLanguage('--lang', options.cliLanguage);
  if (cli) return cli;

  const envLanguage = resolveProvidedLanguage('QUIVER_LANG', env.QUIVER_LANG);
  if (envLanguage) return envLanguage;

  const projectConfig = readProjectLanguageConfig(projectRoot);
  const projectLanguage = resolveProvidedLanguage(PROJECT_CONFIG_RELATIVE_PATH, projectConfig.language);
  if (projectLanguage) return projectLanguage;

  const globalConfig = readGlobalLanguageConfig(homeDir);
  const globalLanguage = resolveProvidedLanguage(`~/${GLOBAL_CONFIG_RELATIVE_PATH}`, globalConfig.language);
  if (globalLanguage) return globalLanguage;

  const locale = detectLocaleLanguage({
    env,
    intlLocale: options.intlLocale,
  });
  if (locale.language) {
    return {
      ...locale,
      warnings: [],
    };
  }

  return {
    language: DEFAULT_LANGUAGE,
    source: 'default',
    requestedLanguage: '',
    warnings: [],
  };
}

function extractCliLanguageFlag(argv) {
  const nextArgv = [];
  let language = '';

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--') {
      nextArgv.push(...argv.slice(index));
      break;
    }

    if (arg === '--lang') {
      const value = argv[index + 1];
      if (!value || String(value).startsWith('--')) {
        throw new Error('missing value for --lang');
      }
      language = value;
      index += 1;
      continue;
    }

    if (String(arg).startsWith('--lang=')) {
      const value = String(arg).slice('--lang='.length);
      if (!value) {
        throw new Error('missing value for --lang');
      }
      language = value;
      continue;
    }

    nextArgv.push(arg);
  }

  return {
    argv: nextArgv,
    language,
  };
}

function formatLanguageWarning(warning) {
  if (!warning || warning.code !== 'UNSUPPORTED_LANGUAGE') {
    return '';
  }

  return `create-quiver: unsupported language "${warning.requestedLanguage}" from ${warning.source}; falling back to ${warning.fallbackLanguage}. Supported languages: ${warning.supportedLanguages.join(', ')}.`;
}

module.exports = {
  DEFAULT_LANGUAGE,
  GLOBAL_CONFIG_RELATIVE_PATH,
  PROJECT_CONFIG_RELATIVE_PATH,
  SUPPORTED_LANGUAGES,
  detectLocaleLanguage,
  extractCliLanguageFlag,
  formatLanguageWarning,
  globalLanguageConfigPath,
  isSupportedLanguage,
  normalizeLanguage,
  projectLanguageConfigPath,
  readGlobalLanguageConfig,
  readLanguageConfig,
  readProjectLanguageConfig,
  resolveLanguage,
  writeGlobalLanguageConfig,
  writeLanguageConfig,
  writeProjectLanguageConfig,
};
