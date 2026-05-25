const { filterContextPaths, shouldExcludeContextPath } = require('./safety');
const { buildRolePrompt } = require('./prompts');
const { readProjectScanArtifact } = require('../project-scan');

const ROLES = Object.freeze({
  PLANNER: 'planner',
  EXECUTOR: 'executor',
});

const CONTEXT_PACKS = Object.freeze({
  full: Object.freeze({
    name: 'full',
    description: 'Broad planner onboarding context.',
    role: ROLES.PLANNER,
    tokenBudgetHint: 14000,
    roleGuidance: 'Use broad onboarding context, project map, workflow docs, and relevant specs.',
  }),
  planning: Object.freeze({
    name: 'planning',
    description: 'Focused planner context for acceptance criteria and technical planning.',
    role: ROLES.PLANNER,
    tokenBudgetHint: 8000,
    roleGuidance: 'Use project map, workflow docs, and only the specs needed for the current planning step.',
  }),
  slice: Object.freeze({
    name: 'slice',
    description: 'Executor context for a single slice handoff.',
    role: ROLES.EXECUTOR,
    tokenBudgetHint: 3200,
    roleGuidance: 'Use the slice.json, EXECUTION_BRIEF, CLOSURE_BRIEF, allowed files, acceptance criteria, and validation commands only. Do not request the full spec unless the slice brief explicitly requires it.',
  }),
  minimal: Object.freeze({
    name: 'minimal',
    description: 'Smallest executor context for narrowly-scoped tasks.',
    role: ROLES.EXECUTOR,
    tokenBudgetHint: 1200,
    roleGuidance: 'Use the smallest safe set of slice details, avoid onboarding context, and avoid full-spec context by default.',
  }),
});

const DEFAULT_CONTEXT_PACK_BY_ROLE = Object.freeze({
  [ROLES.PLANNER]: 'planning',
  [ROLES.EXECUTOR]: 'slice',
});

const PACK_ORDER = ['full', 'planning', 'slice', 'minimal'];
const CONTEXT_PREPARED_DOC_PATHS = Object.freeze([
  'docs/INDEX.md',
  'docs/PROJECT_MAP.md',
  'docs/AI_CONTEXT.md',
  'docs/AI_ONBOARDING_PROMPT.md',
  'docs/CONTEXTO.md',
  'docs/WORKFLOW.md',
  'docs/ARCHITECTURE.md',
  'docs/STATUS.md',
  'docs/DECISIONS.md',
]);

function normalizeRole(role) {
  const value = String(role || '').trim().toLowerCase();
  if (value === ROLES.PLANNER || value === ROLES.EXECUTOR) {
    return value;
  }
  throw new Error(`create-quiver: unsupported role '${role}'. Expected planner or executor.`);
}

function normalizePackName(packName) {
  const value = String(packName || '').trim().toLowerCase();
  if (CONTEXT_PACKS[value]) {
    return value;
  }
  throw new Error(`create-quiver: unsupported context pack '${packName}'. Expected one of: ${PACK_ORDER.join(', ')}`);
}

function getDefaultContextPack(role) {
  const normalizedRole = normalizeRole(role);
  return DEFAULT_CONTEXT_PACK_BY_ROLE[normalizedRole];
}

function getPreparedContextDocPaths() {
  return CONTEXT_PREPARED_DOC_PATHS.slice();
}

function resolveContextPack({ role, packName } = {}) {
  const normalizedRole = normalizeRole(role);
  const defaultPack = getDefaultContextPack(normalizedRole);
  const resolvedPackName = packName ? normalizePackName(packName) : defaultPack;

  if (normalizedRole === ROLES.EXECUTOR && resolvedPackName === 'full') {
    throw new Error('create-quiver: executor context cannot use the full pack by default.');
  }

  const pack = CONTEXT_PACKS[resolvedPackName];
  if (pack.role !== normalizedRole && !(normalizedRole === ROLES.PLANNER && resolvedPackName === 'slice')) {
    throw new Error(`create-quiver: context pack '${resolvedPackName}' is not valid for role '${normalizedRole}'.`);
  }

  return {
    role: normalizedRole,
    packName: resolvedPackName,
    defaultPack,
    isDefault: resolvedPackName === defaultPack,
    tokenBudgetHint: pack.tokenBudgetHint,
    pack,
  };
}

function buildPackSelection({ role, packName, paths = [] } = {}) {
  const resolved = resolveContextPack({ role, packName });
  const { included, excluded } = filterContextPaths(paths);

  return {
    ...resolved,
    includedPaths: included,
    excludedPaths: excluded,
  };
}

function resolveScanArtifactMetadata(repoRoot) {
  if (!repoRoot) {
    return null;
  }

  const artifact = readProjectScanArtifact(repoRoot);
  if (!artifact) {
    return null;
  }

  return {
    path: artifact.relativePath,
    source: artifact.source,
  };
}

function buildContextPackMetadata(options = {}) {
  const selection = buildPackSelection(options);

  return {
    role: selection.role,
    packName: selection.packName,
    isDefault: selection.isDefault,
    tokenBudgetHint: selection.tokenBudgetHint,
    description: selection.pack.description,
    includedPaths: selection.includedPaths,
    excludedPaths: selection.excludedPaths,
    scanArtifact: resolveScanArtifactMetadata(options.repoRoot),
    prompt: buildRolePrompt(selection.role, selection.pack),
  };
}

function selectSafePaths(paths, options = {}) {
  const selection = buildPackSelection({ ...options, paths });
  return {
    included: selection.includedPaths,
    excluded: selection.excludedPaths,
  };
}

module.exports = {
  CONTEXT_PACKS,
  DEFAULT_CONTEXT_PACK_BY_ROLE,
  PACK_ORDER,
  ROLES,
  buildContextPackMetadata,
  buildPackSelection,
  getPreparedContextDocPaths,
  getDefaultContextPack,
  normalizePackName,
  normalizeRole,
  resolveScanArtifactMetadata,
  resolveContextPack,
  selectSafePaths,
  shouldExcludeContextPath,
};
