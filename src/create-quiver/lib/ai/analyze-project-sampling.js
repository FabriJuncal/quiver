const path = require('node:path');

const DEFAULT_MAX_FILES = 80;
const DEFAULT_MAX_BYTES = 300000;

const SOURCE_EXTENSIONS = new Set([
  '.c',
  '.cc',
  '.clj',
  '.cljs',
  '.cpp',
  '.cs',
  '.css',
  '.dart',
  '.elm',
  '.ex',
  '.exs',
  '.go',
  '.graphql',
  '.h',
  '.hpp',
  '.html',
  '.java',
  '.js',
  '.jsx',
  '.kt',
  '.kts',
  '.lua',
  '.mjs',
  '.php',
  '.py',
  '.rb',
  '.rs',
  '.scala',
  '.scss',
  '.sol',
  '.sql',
  '.svelte',
  '.swift',
  '.ts',
  '.tsx',
  '.vue',
]);

const CONFIG_BASENAMES = new Set([
  'angular.json',
  'astro.config.mjs',
  'bun.lockb',
  'Cargo.toml',
  'composer.json',
  'deno.json',
  'docker-compose.yml',
  'Dockerfile',
  'drizzle.config.ts',
  'eslint.config.js',
  'Gemfile',
  'go.mod',
  'jest.config.js',
  'mix.exs',
  'next.config.js',
  'next.config.mjs',
  'next.config.ts',
  'package.json',
  'pnpm-workspace.yaml',
  'pom.xml',
  'postcss.config.js',
  'pyproject.toml',
  'requirements.txt',
  'rollup.config.js',
  'tailwind.config.js',
  'tailwind.config.ts',
  'tsconfig.json',
  'turbo.json',
  'vite.config.js',
  'vite.config.ts',
  'vitest.config.js',
  'vitest.config.ts',
]);

const LOCKFILE_BASENAMES = new Set([
  'bun.lockb',
  'Cargo.lock',
  'composer.lock',
  'Gemfile.lock',
  'go.sum',
  'package-lock.json',
  'pnpm-lock.yaml',
  'poetry.lock',
  'yarn.lock',
]);

const DOC_BASENAMES = new Set([
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'README.md',
  'readme.md',
]);

function toPosix(filePath) {
  return String(filePath || '').replace(/\\/g, '/');
}

function normalizePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function basename(filePath) {
  return path.posix.basename(toPosix(filePath));
}

function dirname(filePath) {
  return path.posix.dirname(toPosix(filePath));
}

function hasPathSegment(filePath, segments) {
  const lowerSegments = toPosix(filePath).toLowerCase().split('/').filter(Boolean);
  return lowerSegments.some((segment) => segments.includes(segment));
}

function matchesTestPath(filePath) {
  const normalized = toPosix(filePath).toLowerCase();
  const base = path.posix.basename(normalized);
  return (
    normalized.includes('/__tests__/') ||
    normalized.includes('/tests/') ||
    normalized.includes('/test/') ||
    normalized.includes('/specs/') ||
    base.includes('.test.') ||
    base.includes('.spec.')
  );
}

function matchesDbPath(filePath) {
  const normalized = toPosix(filePath).toLowerCase();
  return (
    hasPathSegment(normalized, ['db', 'database', 'migrations', 'prisma', 'supabase', 'drizzle']) ||
    normalized.includes('schema.') ||
    normalized.includes('/schema/')
  );
}

function matchesBackendPath(filePath) {
  return hasPathSegment(filePath, [
    'api',
    'controller',
    'controllers',
    'handler',
    'handlers',
    'middleware',
    'model',
    'models',
    'route',
    'routes',
    'server',
    'service',
    'services',
  ]);
}

function matchesFrontendPath(filePath) {
  return hasPathSegment(filePath, [
    'app',
    'components',
    'hooks',
    'layouts',
    'pages',
    'screens',
    'ui',
    'views',
  ]);
}

function matchesSourcePath(filePath) {
  const normalized = toPosix(filePath).toLowerCase();
  return (
    hasPathSegment(normalized, ['src', 'app', 'pages', 'lib', 'components', 'server', 'client']) ||
    matchesBackendPath(normalized) ||
    matchesFrontendPath(normalized)
  );
}

function matchesEntrypoint(filePath) {
  const normalized = toPosix(filePath).toLowerCase();
  const base = basename(normalized);
  return (
    /^main\.[a-z0-9]+$/.test(base) ||
    /^index\.[a-z0-9]+$/.test(base) ||
    /^server\.[a-z0-9]+$/.test(base) ||
    /^app\.[a-z0-9]+$/.test(base) ||
    /^page\.[a-z0-9]+$/.test(base) ||
    /^route\.[a-z0-9]+$/.test(base) ||
    /^layout\.[a-z0-9]+$/.test(base) ||
    normalized.endsWith('/pages/_app.tsx') ||
    normalized.endsWith('/pages/_document.tsx')
  );
}

function classifyProjectFile(filePath) {
  const normalized = toPosix(filePath);
  const lower = normalized.toLowerCase();
  const base = basename(normalized);
  const baseLower = base.toLowerCase();
  const ext = path.posix.extname(lower);
  const signals = [];
  let score = 0;

  if (CONFIG_BASENAMES.has(base) || CONFIG_BASENAMES.has(baseLower)) {
    signals.push('config');
    score += 95;
  }

  if (LOCKFILE_BASENAMES.has(base) || LOCKFILE_BASENAMES.has(baseLower)) {
    signals.push('lockfile');
    score += 20;
  }

  if (DOC_BASENAMES.has(base) || normalized.startsWith('docs/')) {
    signals.push('docs');
    score += 45;
  }

  if (matchesEntrypoint(normalized)) {
    signals.push('entrypoint');
    score += 45;
  }

  if (matchesTestPath(normalized)) {
    signals.push('tests');
    score += 35;
  }

  if (matchesDbPath(normalized)) {
    signals.push('db');
    score += 70;
  }

  if (matchesBackendPath(normalized)) {
    signals.push('backend');
    score += 55;
  }

  if (matchesFrontendPath(normalized)) {
    signals.push('frontend');
    score += 50;
  }

  if (SOURCE_EXTENSIONS.has(ext) && (matchesSourcePath(normalized) || matchesEntrypoint(normalized))) {
    signals.push('source');
    score += 40;
  }

  if (lower.includes('/types/') || baseLower.includes('types.')) {
    signals.push('types');
    score += 25;
  }

  if (lower.includes('/context/') || lower.includes('/contexts/')) {
    signals.push('state');
    score += 25;
  }

  return {
    path: normalized,
    score,
    signals: [...new Set(signals)],
  };
}

function isAllowedByOptions(classification, options) {
  const signals = classification.signals;
  if (signals.includes('config') || signals.includes('docs') || signals.includes('lockfile')) {
    return { allowed: true, reason: '' };
  }

  if (signals.includes('tests') && options.includeTests !== true) {
    return { allowed: false, reason: 'option:tests-disabled' };
  }

  if (signals.includes('db') && options.includeDb !== true) {
    return { allowed: false, reason: 'option:db-disabled' };
  }

  if (
    (signals.includes('source') ||
      signals.includes('frontend') ||
      signals.includes('backend') ||
      signals.includes('entrypoint') ||
      signals.includes('types') ||
      signals.includes('state')) &&
    options.includeSource !== true
  ) {
    return { allowed: false, reason: 'option:source-disabled' };
  }

  if (classification.score <= 0) {
    return { allowed: false, reason: 'sampling:low-signal' };
  }

  return { allowed: true, reason: '' };
}

function summarizeByReason(items) {
  const summary = {};
  for (const item of Array.isArray(items) ? items : []) {
    const reason = item.reason || 'unknown';
    summary[reason] = (summary[reason] || 0) + 1;
  }
  return Object.keys(summary)
    .sort()
    .reduce((acc, key) => {
      acc[key] = summary[key];
      return acc;
    }, {});
}

function sampleProjectFiles(files, options = {}) {
  const maxFiles = normalizePositiveInteger(options.maxFiles, DEFAULT_MAX_FILES);
  const maxBytes = normalizePositiveInteger(options.maxBytes, DEFAULT_MAX_BYTES);
  const normalizedOptions = {
    includeDb: options.includeDb === true,
    includeSource: options.includeSource === true,
    includeTests: options.includeTests === true,
    maxBytes,
    maxFiles,
  };
  const eligible = [];
  const omitted = [];

  for (const file of Array.isArray(files) ? files : []) {
    const classification = classifyProjectFile(file.path);
    const allowed = isAllowedByOptions(classification, normalizedOptions);
    const item = {
      path: classification.path,
      bytes: file.bytes || 0,
      score: classification.score,
      signals: classification.signals,
    };

    if (!allowed.allowed) {
      omitted.push({ ...item, reason: allowed.reason });
      continue;
    }

    eligible.push(item);
  }

  eligible.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.path.localeCompare(b.path);
  });

  const selectedFiles = [];
  let selectedBytes = 0;

  for (const file of eligible) {
    if (selectedFiles.length >= maxFiles) {
      omitted.push({ ...file, reason: 'budget:max-files' });
      continue;
    }

    if (selectedBytes + file.bytes > maxBytes && selectedFiles.length > 0) {
      omitted.push({ ...file, reason: 'budget:max-bytes' });
      continue;
    }

    if (file.bytes > maxBytes && selectedFiles.length === 0) {
      omitted.push({ ...file, reason: 'budget:file-too-large' });
      continue;
    }

    selectedFiles.push(file);
    selectedBytes += file.bytes;
  }

  omitted.sort((a, b) => a.path.localeCompare(b.path));

  return {
    options: normalizedOptions,
    selectedFiles,
    omittedFiles: omitted,
    omittedSummary: summarizeByReason(omitted),
    budgets: {
      max_files: maxFiles,
      max_bytes: maxBytes,
      selected_files: selectedFiles.length,
      selected_bytes: selectedBytes,
      omitted_files: omitted.length,
      omitted_by_budget: omitted.filter((item) => String(item.reason || '').startsWith('budget:')).length,
    },
  };
}

module.exports = {
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_FILES,
  classifyProjectFile,
  sampleProjectFiles,
  summarizeByReason,
};
