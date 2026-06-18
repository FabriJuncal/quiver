const fs = require('node:fs');
const path = require('node:path');

const {
  getContextPathExclusionReason,
  normalizeContextPath,
} = require('./safety');
const { getProjectRelativePathIssue } = require('../paths');

const RECOVERY_SCHEMA_VERSION = 1;
const DEFAULT_RECOVERY_MAX_FILES_CAP = 300;
const DEFAULT_RECOVERY_MAX_BYTES_CAP = 1_500_000;
const RECOVERY_BYTE_ROUNDING = 50_000;
const RECOVERY_MIN_BYTE_MARGIN = 50_000;
const RECOVERY_FILE_MARGIN = 20;

const RECOVERY_CLASSIFICATION = Object.freeze({
  GENERATED_OR_DEPENDENCY: 'generated_or_dependency',
  METADATA_ONLY: 'metadata_only',
  MISSING_FILE: 'missing_file',
  OUTSIDE_SCOPE: 'outside_scope',
  SAFE_TO_INCLUDE: 'safe_to_include',
  SECURITY_EXCLUDED: 'security_excluded',
  UNKNOWN: 'unknown',
});

const RECOVERY_REASON = Object.freeze({
  BUDGET_LIMITED: 'budget_limited',
  GENERATED_OR_DEPENDENCY: 'generated_or_dependency',
  METADATA_ONLY: 'metadata_only',
  MISSING_FILE: 'missing_file',
  NOT_DISCOVERED: 'not_discovered',
  OUTSIDE_SCOPE: 'outside_scope',
  SECURITY_EXCLUDED: 'security_excluded',
  UNKNOWN: 'unknown',
});

const BINARY_EXTENSIONS = new Set([
  '.7z',
  '.avif',
  '.bmp',
  '.class',
  '.dll',
  '.dmg',
  '.doc',
  '.docx',
  '.eot',
  '.exe',
  '.gif',
  '.gz',
  '.ico',
  '.jar',
  '.jpeg',
  '.jpg',
  '.lockb',
  '.mov',
  '.mp3',
  '.mp4',
  '.otf',
  '.pdf',
  '.png',
  '.so',
  '.tar',
  '.ttf',
  '.wasm',
  '.webm',
  '.webp',
  '.woff',
  '.woff2',
  '.zip',
]);

const GENERATED_OR_DEPENDENCY_REASONS = new Set([
  'unsafe-segment:.cache',
  'unsafe-segment:.next',
  'unsafe-segment:.nuxt',
  'unsafe-segment:.npm',
  'unsafe-segment:.parcel-cache',
  'unsafe-segment:.pnpm-store',
  'unsafe-segment:.turbo',
  'unsafe-segment:.yarn',
  'unsafe-segment:artifacts',
  'unsafe-segment:build',
  'unsafe-segment:coverage',
  'unsafe-segment:dist',
  'unsafe-segment:gen',
  'unsafe-segment:generated',
  'unsafe-segment:node_modules',
  'unsafe-segment:out',
  'unsafe-segment:reports',
  'unsafe-segment:target',
  'unsafe-segment:vendor',
]);

const METADATA_ONLY_BASENAME_PATTERNS = [
  /^\.env\.example$/i,
  /^\.env\.sample$/i,
  /^\.env\.template$/i,
  /^\.env\.dist$/i,
  /^\.env\.defaults?$/i,
  /^\.env\.[a-z0-9_-]+\.example$/i,
  /^\.env\.[a-z0-9_-]+\.sample$/i,
  /^\.env\.[a-z0-9_-]+\.template$/i,
  /^\.env\.[a-z0-9_-]+\.dist$/i,
];

function toPosix(filePath) {
  return String(filePath || '').replace(/\\/g, '/');
}

function normalizeRelativeEvidencePath(evidencePath) {
  const raw = String(evidencePath || '');
  const pathIssue = getProjectRelativePathIssue(raw);
  if (pathIssue) {
    return {
      ok: false,
      input_path: raw,
      path: normalizeContextPath(raw),
      classification: pathIssue === 'empty-path' ? RECOVERY_CLASSIFICATION.UNKNOWN : RECOVERY_CLASSIFICATION.OUTSIDE_SCOPE,
      reason: pathIssue === 'empty-path' ? 'empty-path' : RECOVERY_REASON.OUTSIDE_SCOPE,
      path_issue: pathIssue,
    };
  }

  const normalized = normalizeContextPath(raw);
  if (!normalized) {
    return {
      ok: false,
      input_path: raw,
      path: '',
      classification: RECOVERY_CLASSIFICATION.UNKNOWN,
      reason: 'empty-path',
    };
  }
  if (normalized.includes('\0')) {
    return {
      ok: false,
      input_path: raw,
      path: normalized,
      classification: RECOVERY_CLASSIFICATION.SECURITY_EXCLUDED,
      reason: 'invalid-null-byte',
    };
  }
  if (path.posix.isAbsolute(normalized) || /^[A-Za-z]:\//.test(normalized)) {
    return {
      ok: false,
      input_path: raw,
      path: normalized,
      classification: RECOVERY_CLASSIFICATION.OUTSIDE_SCOPE,
      reason: RECOVERY_REASON.OUTSIDE_SCOPE,
      path_issue: 'absolute-path',
    };
  }

  const clean = path.posix.normalize(normalized);
  if (clean === '.' || clean === '..' || clean.startsWith('../')) {
    return {
      ok: false,
      input_path: raw,
      path: clean,
      classification: RECOVERY_CLASSIFICATION.OUTSIDE_SCOPE,
      reason: RECOVERY_REASON.OUTSIDE_SCOPE,
      path_issue: 'path-traversal',
    };
  }

  return {
    ok: true,
    input_path: raw,
    path: clean,
    path_issue: null,
  };
}

function isInsideRepo(repoRoot, relativePath) {
  const repo = path.resolve(repoRoot);
  const absolutePath = path.resolve(repo, relativePath);
  const relative = path.relative(repo, absolutePath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function basename(filePath) {
  return path.posix.basename(toPosix(filePath));
}

function isMetadataOnlyPath(filePath) {
  const base = basename(filePath);
  return METADATA_ONLY_BASENAME_PATTERNS.some((pattern) => pattern.test(base));
}

function mapSafetyReasonToClassification(reason, filePath) {
  if (isMetadataOnlyPath(filePath)) {
    return {
      classification: RECOVERY_CLASSIFICATION.METADATA_ONLY,
      reason: RECOVERY_REASON.METADATA_ONLY,
      safe_to_include: false,
      content_allowed: false,
      metadata_only: true,
    };
  }

  if (GENERATED_OR_DEPENDENCY_REASONS.has(reason)) {
    return {
      classification: RECOVERY_CLASSIFICATION.GENERATED_OR_DEPENDENCY,
      reason: RECOVERY_REASON.GENERATED_OR_DEPENDENCY,
      safe_to_include: false,
      content_allowed: false,
      metadata_only: false,
    };
  }

  return {
    classification: RECOVERY_CLASSIFICATION.SECURITY_EXCLUDED,
    reason: RECOVERY_REASON.SECURITY_EXCLUDED,
    safe_to_include: false,
    content_allowed: false,
    metadata_only: false,
  };
}

function hasBinaryExtension(filePath) {
  return BINARY_EXTENSIONS.has(path.posix.extname(toPosix(filePath)).toLowerCase());
}

function appearsBinaryFile(absolutePath) {
  if (hasBinaryExtension(absolutePath)) {
    return true;
  }

  let descriptor;
  try {
    descriptor = fs.openSync(absolutePath, 'r');
    const buffer = Buffer.alloc(1024);
    const bytesRead = fs.readSync(descriptor, buffer, 0, buffer.length, 0);
    for (let index = 0; index < bytesRead; index += 1) {
      if (buffer[index] === 0) {
        return true;
      }
    }
    return false;
  } catch (_) {
    return true;
  } finally {
    if (typeof descriptor === 'number') {
      fs.closeSync(descriptor);
    }
  }
}

function makeFileMap(items) {
  const map = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    const normalized = toPosix(item.path || '');
    if (!normalized) {
      continue;
    }
    map.set(normalized, item);
  }
  return map;
}

function omittedReasonToRecoveryReason(reason) {
  const value = String(reason || '');
  if (value.startsWith('budget:')) {
    return RECOVERY_REASON.BUDGET_LIMITED;
  }
  if (value === 'sampling:lockfile-metadata') {
    return RECOVERY_REASON.METADATA_ONLY;
  }
  return value || RECOVERY_REASON.UNKNOWN;
}

function classifyKnownOmission(omitted) {
  const recoveryReason = omittedReasonToRecoveryReason(omitted.reason);
  if (omitted.reason === 'binary-file') {
    return {
      classification: RECOVERY_CLASSIFICATION.GENERATED_OR_DEPENDENCY,
      reason: RECOVERY_REASON.GENERATED_OR_DEPENDENCY,
      safe_to_include: false,
      content_allowed: false,
      metadata_only: false,
    };
  }
  if (omitted.reason === 'symlink' || omitted.reason === 'not-regular-file') {
    return {
      classification: RECOVERY_CLASSIFICATION.SECURITY_EXCLUDED,
      reason: RECOVERY_REASON.SECURITY_EXCLUDED,
      safe_to_include: false,
      content_allowed: false,
      metadata_only: false,
    };
  }
  if (recoveryReason === RECOVERY_REASON.METADATA_ONLY) {
    return {
      classification: RECOVERY_CLASSIFICATION.METADATA_ONLY,
      reason: RECOVERY_REASON.METADATA_ONLY,
      safe_to_include: false,
      content_allowed: false,
      metadata_only: true,
    };
  }

  return {
    classification: RECOVERY_CLASSIFICATION.SAFE_TO_INCLUDE,
    reason: recoveryReason,
    safe_to_include: true,
    content_allowed: true,
    metadata_only: false,
  };
}

function classifySkippedFile(skipped) {
  if (skipped.reason === 'binary-file') {
    return {
      classification: RECOVERY_CLASSIFICATION.GENERATED_OR_DEPENDENCY,
      reason: RECOVERY_REASON.GENERATED_OR_DEPENDENCY,
      safe_to_include: false,
      content_allowed: false,
      metadata_only: false,
    };
  }

  return {
    classification: RECOVERY_CLASSIFICATION.SECURITY_EXCLUDED,
    reason: RECOVERY_REASON.SECURITY_EXCLUDED,
    safe_to_include: false,
    content_allowed: false,
    metadata_only: false,
  };
}

function baseRecoveryEntry(evidencePath, options = {}) {
  return {
    path: evidencePath.path,
    input_path: evidencePath.input_path,
    issue_paths: Array.isArray(options.issuePaths) ? [...new Set(options.issuePaths)].sort() : [],
    classification: RECOVERY_CLASSIFICATION.UNKNOWN,
    reason: RECOVERY_REASON.UNKNOWN,
    safe_to_include: false,
    content_allowed: false,
    metadata_only: false,
    bytes: 0,
    effective_prompt_bytes: 0,
    selected: false,
    omitted_reason: null,
    source: 'unknown',
    safety_reason: null,
  };
}

function classifyEvidencePath(repoRoot, evidencePath, options = {}) {
  const normalized = normalizeRelativeEvidencePath(evidencePath);
  if (!normalized.ok) {
    return {
      ...baseRecoveryEntry(normalized, options),
      classification: normalized.classification,
      reason: normalized.reason,
      source: 'path-validation',
      path_issue: normalized.path_issue || null,
    };
  }

  const entry = baseRecoveryEntry(normalized, options);
  const repo = path.resolve(repoRoot || process.cwd());
  if (!isInsideRepo(repo, normalized.path)) {
    return {
      ...entry,
      classification: RECOVERY_CLASSIFICATION.OUTSIDE_SCOPE,
      reason: RECOVERY_REASON.OUTSIDE_SCOPE,
      source: 'path-validation',
    };
  }

  const selectedMap = makeFileMap(options.selectedFiles);
  const omittedMap = makeFileMap(options.omittedFiles);
  const skippedMap = makeFileMap(options.skippedFiles);
  const safetyMap = makeFileMap(options.safetyExclusions);
  const selected = selectedMap.get(normalized.path);
  const omitted = omittedMap.get(normalized.path);
  const skipped = skippedMap.get(normalized.path);
  const safety = safetyMap.get(normalized.path);

  if (selected) {
    return {
      ...entry,
      classification: RECOVERY_CLASSIFICATION.SAFE_TO_INCLUDE,
      reason: 'already_selected',
      safe_to_include: true,
      content_allowed: true,
      bytes: selected.bytes || 0,
      effective_prompt_bytes: selected.bytes || 0,
      selected: true,
      source: 'selected-files',
    };
  }

  if (safety) {
    return {
      ...entry,
      ...mapSafetyReasonToClassification(safety.reason, normalized.path),
      safety_reason: safety.reason || null,
      source: 'safety-exclusions',
    };
  }

  const exclusionReason = getContextPathExclusionReason(normalized.path);
  if (exclusionReason) {
    return {
      ...entry,
      ...mapSafetyReasonToClassification(exclusionReason, normalized.path),
      safety_reason: exclusionReason,
      source: 'safety-policy',
    };
  }

  if (omitted) {
    const known = classifyKnownOmission(omitted);
    return {
      ...entry,
      ...known,
      bytes: omitted.bytes || 0,
      effective_prompt_bytes: known.safe_to_include ? (omitted.bytes || 0) : 0,
      omitted_reason: omitted.reason || null,
      source: 'omitted-files',
    };
  }

  if (skipped) {
    return {
      ...entry,
      ...classifySkippedFile(skipped),
      source: 'skipped-files',
    };
  }

  const absolutePath = path.resolve(repo, normalized.path);
  if (!fs.existsSync(absolutePath)) {
    return {
      ...entry,
      classification: RECOVERY_CLASSIFICATION.MISSING_FILE,
      reason: RECOVERY_REASON.MISSING_FILE,
      source: 'filesystem',
    };
  }

  let stat;
  try {
    stat = fs.statSync(absolutePath);
  } catch (_) {
    return {
      ...entry,
      classification: RECOVERY_CLASSIFICATION.UNKNOWN,
      reason: RECOVERY_REASON.UNKNOWN,
      source: 'filesystem',
    };
  }

  if (!stat.isFile()) {
    return {
      ...entry,
      classification: RECOVERY_CLASSIFICATION.OUTSIDE_SCOPE,
      reason: RECOVERY_REASON.OUTSIDE_SCOPE,
      source: 'filesystem',
    };
  }

  if (appearsBinaryFile(absolutePath)) {
    return {
      ...entry,
      classification: RECOVERY_CLASSIFICATION.GENERATED_OR_DEPENDENCY,
      reason: RECOVERY_REASON.GENERATED_OR_DEPENDENCY,
      bytes: stat.size,
      source: 'filesystem',
    };
  }

  return {
    ...entry,
    classification: RECOVERY_CLASSIFICATION.SAFE_TO_INCLUDE,
    reason: RECOVERY_REASON.NOT_DISCOVERED,
    safe_to_include: true,
    content_allowed: true,
    bytes: stat.size,
    effective_prompt_bytes: stat.size,
    source: 'filesystem',
  };
}

function extractEvidencePathFromIssue(issue) {
  if (!issue || typeof issue !== 'object') {
    return '';
  }
  if (typeof issue.evidence_path === 'string') {
    return issue.evidence_path;
  }
  const message = String(issue.message || '');
  const match = message.match(/evidence path is not in the selected sample:\s*(.+)$/i);
  return match ? match[1].trim() : '';
}

function summarizeClassifications(classifications) {
  const summary = {};
  for (const item of classifications) {
    summary[item.classification] = (summary[item.classification] || 0) + 1;
  }
  return Object.keys(summary)
    .sort()
    .reduce((acc, key) => {
      acc[key] = summary[key];
      return acc;
    }, {});
}

function normalizePositiveInteger(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function roundUpToBlock(value, blockSize) {
  const normalizedValue = Math.max(0, Number(value) || 0);
  const normalizedBlock = Math.max(1, Number(blockSize) || 1);
  return Math.ceil(normalizedValue / normalizedBlock) * normalizedBlock;
}

function classifyRecommendedFlag(item, options = {}) {
  const omittedReason = String(item.omitted_reason || '');
  if (omittedReason === 'option:tests-disabled' && options.includeTests !== true) {
    return '--include-tests';
  }
  if (omittedReason === 'option:db-disabled' && options.includeDb !== true) {
    return '--include-db';
  }
  if (omittedReason === 'option:source-disabled' && options.includeSource !== true && options.deep !== true) {
    return '--include-source';
  }
  return '';
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function calculateRecoveryBudget(classificationResult, options = {}) {
  const classifications = Array.isArray(classificationResult?.classifications)
    ? classificationResult.classifications
    : Array.isArray(classificationResult)
      ? classificationResult
      : [];
  const budgets = options.budgets || {};
  const caps = {
    maxFiles: normalizePositiveInteger(options.caps?.maxFiles, DEFAULT_RECOVERY_MAX_FILES_CAP),
    maxBytes: normalizePositiveInteger(options.caps?.maxBytes, DEFAULT_RECOVERY_MAX_BYTES_CAP),
  };
  const currentMaxFiles = normalizePositiveInteger(
    budgets.max_files ?? budgets.maxFiles ?? options.maxFiles,
    0,
  );
  const currentMaxBytes = normalizePositiveInteger(
    budgets.max_bytes ?? budgets.maxBytes ?? options.maxBytes,
    0,
  );
  const currentSelectedFiles = normalizePositiveInteger(
    budgets.selected_files ?? budgets.selectedFiles,
    0,
  );
  const currentSelectedBytes = normalizePositiveInteger(
    budgets.selected_bytes ?? budgets.selectedBytes,
    0,
  );
  const safeMissing = classifications.filter((item) => item.safe_to_include === true && item.selected !== true);
  const safeMissingBytes = safeMissing.reduce((sum, item) => (
    sum + normalizePositiveInteger(item.effective_prompt_bytes || item.bytes, 0)
  ), 0);
  const safeMissingFiles = safeMissing.length;
  const safetyMarginBytes = safeMissingBytes > 0
    ? Math.max(RECOVERY_MIN_BYTE_MARGIN, Math.ceil(safeMissingBytes * 0.25))
    : 0;
  const calculatedMaxBytes = safeMissingBytes > 0
    ? roundUpToBlock(currentSelectedBytes + safeMissingBytes + safetyMarginBytes, RECOVERY_BYTE_ROUNDING)
    : currentMaxBytes;
  const calculatedMaxFiles = safeMissingFiles > 0
    ? currentSelectedFiles + safeMissingFiles + RECOVERY_FILE_MARGIN
    : currentMaxFiles;
  const recommendedMaxFiles = Math.max(currentMaxFiles, calculatedMaxFiles);
  const recommendedMaxBytes = Math.max(currentMaxBytes, calculatedMaxBytes);
  const recommendedFlags = uniqueSorted(safeMissing.map((item) => classifyRecommendedFlag(item, options)));
  const exceedsCaps = recommendedMaxFiles > caps.maxFiles || recommendedMaxBytes > caps.maxBytes;

  return {
    current_max_files: currentMaxFiles,
    current_max_bytes: currentMaxBytes,
    current_selected_files: currentSelectedFiles,
    current_selected_bytes: currentSelectedBytes,
    safe_missing_files: safeMissingFiles,
    safe_missing_bytes: safeMissingBytes,
    safety_margin_bytes: safetyMarginBytes,
    recommended_max_files: recommendedMaxFiles,
    recommended_max_bytes: recommendedMaxBytes,
    recommended_flags: recommendedFlags,
    caps,
    exceeds_caps: exceedsCaps,
    recommendation_type: exceedsCaps
      ? 'scope_required'
      : safeMissingFiles > 0 || recommendedFlags.length > 0
        ? 'increase_budget'
        : 'inspect_context',
  };
}

function shellToken(value) {
  const raw = String(value || '');
  if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(raw)) {
    return raw;
  }
  return `'${raw.replace(/'/g, "'\\''")}'`;
}

function appendBooleanFlag(tokens, flag, enabled) {
  if (enabled === true) {
    tokens.push(flag);
  }
}

function appendValueFlag(tokens, flag, value) {
  if (value !== undefined && value !== null && String(value).trim() !== '') {
    tokens.push(flag, shellToken(value));
  }
}

function buildAnalyzeProjectRecoveryCommand(recommendation, options = {}) {
  if (
    !recommendation ||
    recommendation.recommendation_type === 'scope_required' ||
    recommendation.recommendation_type === 'inspect_context'
  ) {
    return '';
  }

  const commandPrefix = Array.isArray(options.commandPrefix) && options.commandPrefix.length > 0
    ? options.commandPrefix
    : ['npx', '--yes', 'create-quiver@latest'];
  const tokens = [...commandPrefix.map(shellToken), 'ai', 'analyze-project'];
  appendBooleanFlag(tokens, '--deep', options.deep === true);
  appendValueFlag(tokens, '--max-files', recommendation.recommended_max_files);
  appendValueFlag(tokens, '--max-bytes', recommendation.recommended_max_bytes);

  for (const flag of recommendation.recommended_flags || []) {
    tokens.push(flag);
  }

  appendBooleanFlag(tokens, '--include-tests', options.includeTests === true && !(recommendation.recommended_flags || []).includes('--include-tests'));
  appendBooleanFlag(tokens, '--include-db', options.includeDb === true && !(recommendation.recommended_flags || []).includes('--include-db'));
  appendBooleanFlag(tokens, '--include-source', options.includeSource === true && options.deep !== true && !(recommendation.recommended_flags || []).includes('--include-source'));
  appendValueFlag(tokens, '--scope', options.scope);
  appendValueFlag(tokens, '--provider', options.provider);
  appendValueFlag(tokens, '--model', options.model);
  appendValueFlag(tokens, '--lang', options.lang);
  appendBooleanFlag(tokens, '--strict', options.strict === true);

  return tokens.join(' ');
}

function buildEvidenceRecoveryPayload(classificationResult, options = {}) {
  const budget = calculateRecoveryBudget(classificationResult, options);
  const command = buildAnalyzeProjectRecoveryCommand(budget, options);
  const available = budget.recommendation_type !== 'inspect_context' && budget.exceeds_caps !== true && Boolean(command);
  return {
    schema_version: RECOVERY_SCHEMA_VERSION,
    available,
    reason: 'evidence_not_selected',
    recommendation_type: budget.recommendation_type,
    command,
    budget,
    evidence_summary: classificationResult?.summary || summarizeClassifications(classificationResult?.classifications || []),
    warnings: budget.exceeds_caps
      ? ['recommended context budget exceeds configured recovery caps; reduce scope before rerunning']
      : [],
  };
}

function classifyEvidenceRecoveryIssues(repoRoot, issues = [], options = {}) {
  const byEvidencePath = new Map();
  for (const issue of Array.isArray(issues) ? issues : []) {
    if ((issue.issue || issue.code) !== 'evidence-not-selected') {
      continue;
    }
    const evidencePath = extractEvidencePathFromIssue(issue);
    if (!evidencePath) {
      continue;
    }
    const normalized = normalizeRelativeEvidencePath(evidencePath);
    const key = normalized.path || evidencePath;
    if (!byEvidencePath.has(key)) {
      byEvidencePath.set(key, {
        evidencePath,
        issuePaths: [],
      });
    }
    const current = byEvidencePath.get(key);
    if (issue.path) {
      current.issuePaths.push(issue.path);
    }
  }

  const classifications = Array.from(byEvidencePath.values())
    .sort((a, b) => a.evidencePath.localeCompare(b.evidencePath))
    .map((item) => classifyEvidencePath(repoRoot, item.evidencePath, {
      ...options,
      issuePaths: item.issuePaths,
    }));

  return {
    schema_version: RECOVERY_SCHEMA_VERSION,
    kind: 'quiver-analyze-project-evidence-recovery-classification',
    reason: 'evidence_not_selected',
    classifications,
    summary: summarizeClassifications(classifications),
  };
}

module.exports = {
  DEFAULT_RECOVERY_MAX_BYTES_CAP,
  DEFAULT_RECOVERY_MAX_FILES_CAP,
  RECOVERY_CLASSIFICATION,
  RECOVERY_REASON,
  RECOVERY_SCHEMA_VERSION,
  buildAnalyzeProjectRecoveryCommand,
  buildEvidenceRecoveryPayload,
  calculateRecoveryBudget,
  classifyEvidencePath,
  classifyEvidenceRecoveryIssues,
  extractEvidencePathFromIssue,
  isMetadataOnlyPath,
  normalizeRelativeEvidencePath,
  summarizeClassifications,
};
