const { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, normalizeLanguage } = require('./language');
const en = require('./messages/en');
const es = require('./messages/es');

const CATALOGS = Object.freeze({
  en,
  es,
});

function getCatalog(language = DEFAULT_LANGUAGE) {
  const normalized = normalizeLanguage(language) || DEFAULT_LANGUAGE;
  return CATALOGS[normalized] || CATALOGS[DEFAULT_LANGUAGE];
}

function listMessageKeys(catalog) {
  return Object.keys(catalog?.messages || {}).sort();
}

function validateCatalogCompleteness(catalogs = CATALOGS) {
  const baseKeys = listMessageKeys(catalogs[DEFAULT_LANGUAGE]);
  const missing = [];
  const extra = [];

  for (const language of SUPPORTED_LANGUAGES) {
    const keys = listMessageKeys(catalogs[language]);
    for (const key of baseKeys) {
      if (!keys.includes(key)) {
        missing.push(`${language}:${key}`);
      }
    }
    for (const key of keys) {
      if (!baseKeys.includes(key)) {
        extra.push(`${language}:${key}`);
      }
    }
  }

  return {
    ok: missing.length === 0 && extra.length === 0,
    missing,
    extra,
  };
}

function assertCatalogCompleteness(catalogs = CATALOGS) {
  const report = validateCatalogCompleteness(catalogs);
  if (!report.ok) {
    throw new Error([
      'i18n catalog completeness failed',
      ...report.missing.map((item) => `missing ${item}`),
      ...report.extra.map((item) => `extra ${item}`),
    ].join('\n'));
  }
  return report;
}

function sanitizeInterpolationValue(value) {
  if (value === null || typeof value === 'undefined') {
    return '';
  }

  return String(value)
    .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

function interpolate(template, params = {}) {
  return String(template).replace(/\{([a-zA-Z0-9_.-]+)\}/g, (match, name) => {
    if (!Object.prototype.hasOwnProperty.call(params, name)) {
      return `[missing:${name}]`;
    }
    return sanitizeInterpolationValue(params[name]);
  });
}

function selectPluralTemplate(message, params = {}) {
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    return message;
  }

  const count = Number(params.count);
  if (count === 1 && typeof message.one === 'string') {
    return message.one;
  }
  if (typeof message.other === 'string') {
    return message.other;
  }
  if (typeof message.one === 'string') {
    return message.one;
  }
  return '';
}

function resolveMessage(language, key) {
  const catalog = getCatalog(language);
  const message = catalog.messages[key];
  if (typeof message !== 'undefined') {
    return {
      message,
      language: catalog.metadata.language,
      fallback: false,
    };
  }

  const fallbackCatalog = getCatalog(DEFAULT_LANGUAGE);
  const fallbackMessage = fallbackCatalog.messages[key];
  if (typeof fallbackMessage !== 'undefined') {
    return {
      message: fallbackMessage,
      language: DEFAULT_LANGUAGE,
      fallback: true,
    };
  }

  return {
    message: `[missing:${key}]`,
    language: DEFAULT_LANGUAGE,
    fallback: true,
    missing: true,
  };
}

function translate(language, key, params = {}) {
  const resolved = resolveMessage(language, key);
  const template = selectPluralTemplate(resolved.message, params);
  return interpolate(template, params);
}

function createTranslator(language = DEFAULT_LANGUAGE) {
  return {
    language: getCatalog(language).metadata.language,
    t(key, params = {}) {
      return translate(language, key, params);
    },
  };
}

module.exports = {
  CATALOGS,
  assertCatalogCompleteness,
  createTranslator,
  getCatalog,
  interpolate,
  listMessageKeys,
  resolveMessage,
  sanitizeInterpolationValue,
  translate,
  validateCatalogCompleteness,
};
