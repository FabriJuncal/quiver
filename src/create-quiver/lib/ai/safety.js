const path = require('node:path');

const SENSITIVE_SEGMENTS = [
  '.ssh',
  '.quiver',
  'node_modules',
  'dist',
  'build',
  'coverage',
  'out',
  'tmp',
  'temp',
  'cache',
  '.cache',
  '.turbo',
  '.next',
  '.nuxt',
  '.parcel-cache',
  '.pnpm-store',
  '.npm',
  '.yarn',
  'generated',
  'gen',
  'artifacts',
  'reports',
  'vendor',
  'target',
];

const SENSITIVE_BASENAMES = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.development.local',
  '.env.production',
  '.env.production.local',
  '.env.test',
  '.env.test.local',
  '.npmrc',
  '.yarnrc',
  '.yarnrc.yml',
  'id_rsa',
  'id_dsa',
  'id_ecdsa',
  'id_ed25519',
  'authorized_keys',
  'known_hosts',
];

const SENSITIVE_EXTENSIONS = [
  '.key',
  '.pem',
  '.crt',
  '.cer',
  '.p12',
  '.pfx',
  '.der',
];

function normalizeContextPath(filePath) {
  return String(filePath || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^file:\/+/i, '')
    .replace(/^([A-Za-z]):(?=\/)/, '$1:');
}

function getContextPathInfo(filePath) {
  const normalized = normalizeContextPath(filePath);
  const lower = normalized.toLowerCase();
  const segments = lower.split('/').filter(Boolean);
  const basename = segments[segments.length - 1] || '';
  return { normalized, lower, segments, basename };
}

function isSensitiveBasename(basename) {
  if (!basename) {
    return false;
  }

  if (SENSITIVE_BASENAMES.includes(basename)) {
    return true;
  }

  if (basename.startsWith('.env.')) {
    return true;
  }

  return SENSITIVE_EXTENSIONS.some((extension) => basename.endsWith(extension));
}

function getContextPathExclusionReason(filePath) {
  const { normalized, segments, basename } = getContextPathInfo(filePath);

  if (!normalized) {
    return 'empty-path';
  }

  if (normalized === '.quiver/scans/PROJECT_SCAN.json') {
    return null;
  }

  if (segments.some((segment) => SENSITIVE_SEGMENTS.includes(segment))) {
    const matchedSegment = segments.find((segment) => SENSITIVE_SEGMENTS.includes(segment));
    return `unsafe-segment:${matchedSegment}`;
  }

  if (segments.includes('.git')) {
    return 'git-metadata';
  }

  if (basename.startsWith('.env')) {
    return 'env-file';
  }

  if (isSensitiveBasename(basename)) {
    return `secret-file:${basename}`;
  }

  return null;
}

function shouldExcludeContextPath(filePath) {
  return getContextPathExclusionReason(filePath) !== null;
}

function filterContextPaths(paths) {
  const included = [];
  const excluded = [];

  for (const filePath of Array.isArray(paths) ? paths : []) {
    const reason = getContextPathExclusionReason(filePath);
    if (reason) {
      excluded.push({
        path: normalizeContextPath(filePath),
        reason,
      });
      continue;
    }

    included.push(normalizeContextPath(filePath));
  }

  return { included, excluded };
}

module.exports = {
  SENSITIVE_BASENAMES,
  SENSITIVE_EXTENSIONS,
  SENSITIVE_SEGMENTS,
  filterContextPaths,
  getContextPathExclusionReason,
  getContextPathInfo,
  normalizeContextPath,
  shouldExcludeContextPath,
};
