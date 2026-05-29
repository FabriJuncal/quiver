const fs = require('fs');
const path = require('path');

const {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  normalizeLanguage,
  resolveLanguage,
} = require('./language');

const MACHINE_TEMPLATE_PATHS = new Set([
  'package.template.json',
  'specs/[project-name]/slices/slice-template/slice.json',
]);

function toTemplatePath(relativePath) {
  const normalized = String(relativePath || '').replace(/\\/g, '/').replace(/^\.\//, '');
  if (!normalized || path.isAbsolute(normalized) || normalized.split('/').includes('..')) {
    throw new Error(`invalid template path: ${relativePath}`);
  }
  return normalized;
}

function isHumanTemplatePath(relativePath) {
  const normalized = toTemplatePath(relativePath);
  if (MACHINE_TEMPLATE_PATHS.has(normalized)) {
    return false;
  }
  return normalized.endsWith('.md.template') || normalized.endsWith('.md');
}

function localizedTemplateRelativePath(relativePath, language) {
  const normalized = toTemplatePath(relativePath);
  const resolvedLanguage = normalizeLanguage(language) || DEFAULT_LANGUAGE;
  if (resolvedLanguage === DEFAULT_LANGUAGE || !isHumanTemplatePath(normalized)) {
    return normalized;
  }

  if (normalized.endsWith('.template')) {
    const withoutTemplateSuffix = normalized.slice(0, -'.template'.length);
    return `${withoutTemplateSuffix}.${resolvedLanguage}.template`;
  }

  const extension = path.posix.extname(normalized);
  if (!extension) {
    return `${normalized}.${resolvedLanguage}`;
  }

  return `${normalized.slice(0, -extension.length)}.${resolvedLanguage}${extension}`;
}

function resolveTemplateLanguage(options = {}) {
  return resolveLanguage({
    cliLanguage: options.language || options.cliLanguage,
    env: options.env,
    homeDir: options.homeDir,
    intlLocale: options.intlLocale,
    projectRoot: options.projectRoot,
  });
}

function resolveLocalizedTemplatePath(templateRoot, relativePath, options = {}) {
  const normalized = toTemplatePath(relativePath);
  const templateLanguage = resolveTemplateLanguage(options);
  const requestedLanguage = templateLanguage.language || DEFAULT_LANGUAGE;
  const basePath = path.join(templateRoot, normalized);
  const human = isHumanTemplatePath(normalized);

  if (!human) {
    return {
      human: false,
      language: '',
      requestedLanguage,
      relativePath: normalized,
      templatePath: basePath,
      localizedRelativePath: normalized,
      fallback: false,
      reason: 'machine-artifact',
      languageSource: templateLanguage.source,
      warnings: templateLanguage.warnings || [],
    };
  }

  const localizedRelativePath = localizedTemplateRelativePath(normalized, requestedLanguage);
  const localizedPath = path.join(templateRoot, localizedRelativePath);
  if (localizedRelativePath !== normalized && fs.existsSync(localizedPath)) {
    return {
      human: true,
      language: requestedLanguage,
      requestedLanguage,
      relativePath: normalized,
      templatePath: localizedPath,
      localizedRelativePath,
      fallback: false,
      reason: 'localized-template',
      languageSource: templateLanguage.source,
      warnings: templateLanguage.warnings || [],
    };
  }

  if (fs.existsSync(basePath)) {
    return {
      human: true,
      language: DEFAULT_LANGUAGE,
      requestedLanguage,
      relativePath: normalized,
      templatePath: basePath,
      localizedRelativePath: normalized,
      fallback: requestedLanguage !== DEFAULT_LANGUAGE,
      reason: requestedLanguage === DEFAULT_LANGUAGE ? 'default-template' : 'missing-localized-template',
      languageSource: templateLanguage.source,
      warnings: templateLanguage.warnings || [],
    };
  }

  throw new Error(`create-quiver: missing template ${normalized} in ${templateRoot}`);
}

function collectLocalizedTemplateCoverage(templateRoot, relativePaths, options = {}) {
  const languages = Array.isArray(options.languages) && options.languages.length > 0
    ? options.languages.map((language) => normalizeLanguage(language)).filter(Boolean)
    : SUPPORTED_LANGUAGES;
  const missing = [];
  const checked = [];
  const skipped = [];

  for (const relativePath of relativePaths) {
    const normalized = toTemplatePath(relativePath);
    if (!isHumanTemplatePath(normalized)) {
      skipped.push({
        relativePath: normalized,
        reason: 'machine-artifact',
      });
      continue;
    }

    for (const language of languages) {
      if (language === DEFAULT_LANGUAGE) {
        continue;
      }
      const localizedRelativePath = localizedTemplateRelativePath(normalized, language);
      checked.push({
        language,
        relativePath: normalized,
        localizedRelativePath,
      });
      if (!fs.existsSync(path.join(templateRoot, localizedRelativePath))) {
        missing.push({
          language,
          relativePath: normalized,
          localizedRelativePath,
        });
      }
    }
  }

  return {
    ok: missing.length === 0,
    checked,
    missing,
    skipped,
  };
}

module.exports = {
  collectLocalizedTemplateCoverage,
  isHumanTemplatePath,
  localizedTemplateRelativePath,
  resolveLocalizedTemplatePath,
  resolveTemplateLanguage,
  toTemplatePath,
};
