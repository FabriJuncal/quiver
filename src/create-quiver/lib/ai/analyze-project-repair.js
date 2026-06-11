const fs = require('node:fs');
const path = require('node:path');

const {
  AnalyzeProjectAnalysisError,
  normalizeAnalyzeProjectAnalysis,
  parseProviderAnalysisJson,
} = require('./analyze-project-parser');
const {
  buildQuiverInternalGitignore,
  quiverInternalPaths,
} = require('../init-layout');

const REPAIR_MANIFEST_KIND = 'quiver-analyze-project-repair-manifest';
const SAFE_ADDITIONAL_PROPERTY_KEYS = ['claim', 'confidence', 'notes'];
const DEFAULT_REPAIR_LIMITS = {
  maxEntries: 80,
  maxPerPathFamily: 40,
};
const NAMED_FINDING_PATH_PATTERNS = [
  /^product\.(?:name|type)$/,
  /^domain\.(?:roles|entities|actions|flows|incomplete_or_suspicious)\.\d+$/,
  /^architecture\.(?:frontend|backend|auth|persistence|integrations|state|api|testing|deploy|risks)\.\d+$/,
  /^(?:features|risks)\.\d+$/,
];
const QUESTION_PATH_PATTERN = /^questions\.\d+$/;

function toPosix(filePath) {
  return String(filePath || '').replace(/\\/g, '/');
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeRunId(value, now = new Date()) {
  const raw = value || `run-${now.toISOString()
    .replace(/\.\d{3}Z$/, 'z')
    .replace(/[^0-9a-z]+/gi, '-')
    .toLowerCase()
    .replace(/^-+|-+$/g, '')}`;
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'run-analyze-project-repair';
}

function ensureQuiverRunsIgnored(repoRoot) {
  const internalPaths = quiverInternalPaths(repoRoot);
  if (!fs.existsSync(internalPaths.root)) {
    fs.mkdirSync(internalPaths.root, { recursive: true });
  }
  if (!fs.existsSync(internalPaths.gitignorePath)) {
    fs.writeFileSync(internalPaths.gitignorePath, buildQuiverInternalGitignore());
  }
}

function getValueAtPath(root, pathName) {
  if (!pathName) {
    return root;
  }
  const parts = String(pathName).split('.').filter(Boolean);
  let current = root;
  for (const part of parts) {
    if (current === null || typeof current !== 'object') {
      return undefined;
    }
    const key = /^\d+$/.test(part) ? Number(part) : part;
    current = current[key];
  }
  return current;
}

function extractUnrecognizedKeys(issue) {
  if (Array.isArray(issue?.keys)) {
    return issue.keys.map(String);
  }
  const message = String(issue?.message || '');
  return Array.from(message.matchAll(/"([^"]+)"/g)).map((match) => match[1]);
}

function normalizeIssuePath(issue) {
  return issue?.path ? String(issue.path) : '';
}

function isNamedFindingPath(pathName) {
  return NAMED_FINDING_PATH_PATTERNS.some((pattern) => pattern.test(String(pathName || '')));
}

function isQuestionPath(pathName) {
  return QUESTION_PATH_PATTERN.test(String(pathName || ''));
}

function isMissingNameIssue(issue) {
  const pathName = normalizeIssuePath(issue);
  return issue?.issue === 'invalid_type'
    && pathName.endsWith('.name')
    && /(?:expected string|required|received undefined)/i.test(String(issue?.message || ''));
}

function getParentPath(pathName) {
  return String(pathName || '').replace(/\.[^.]+$/, '');
}

function getPathFamily(pathName) {
  return String(pathName || 'analysis').replace(/\.\d+(?=\.|$)/g, '.*');
}

function resolveRepairLimits(options = {}) {
  const maxEntries = Number(options.maxEntries ?? DEFAULT_REPAIR_LIMITS.maxEntries);
  const maxPerPathFamily = Number(options.maxPerPathFamily ?? DEFAULT_REPAIR_LIMITS.maxPerPathFamily);
  return {
    maxEntries: Number.isFinite(maxEntries) && maxEntries > 0
      ? Math.floor(maxEntries)
      : DEFAULT_REPAIR_LIMITS.maxEntries,
    maxPerPathFamily: Number.isFinite(maxPerPathFamily) && maxPerPathFamily > 0
      ? Math.floor(maxPerPathFamily)
      : DEFAULT_REPAIR_LIMITS.maxPerPathFamily,
  };
}

function makeNotRepaired({ value, issues, reason }) {
  return {
    repaired: false,
    value,
    manifest: makeRepairManifest({
      status: 'not-repaired',
      issues,
      reason,
    }),
  };
}

function makeRepairManifest({ status, entries = [], issues = [], reason = '' } = {}) {
  return {
    schema_version: 1,
    kind: REPAIR_MANIFEST_KIND,
    status,
    strategy: 'path-aware-safe-schema-drift-repair',
    safe_keys: SAFE_ADDITIONAL_PROPERTY_KEYS,
    reason,
    entry_count: entries.length,
    entries,
    issue_count: issues.length,
    issues,
  };
}

function assertRepairBudget(entries, issues, value, limits) {
  if (entries.length > limits.maxEntries) {
    return makeNotRepaired({
      value,
      issues,
      reason: `repair budget exceeded: ${entries.length} entries exceeds max ${limits.maxEntries}`,
    });
  }

  const familyCounts = new Map();
  for (const entry of entries) {
    const family = getPathFamily(entry.path);
    familyCounts.set(family, (familyCounts.get(family) || 0) + 1);
    if (familyCounts.get(family) > limits.maxPerPathFamily) {
      return makeNotRepaired({
        value,
        issues,
        reason: `repair budget exceeded for ${family}: ${familyCounts.get(family)} entries exceeds max ${limits.maxPerPathFamily}`,
      });
    }
  }

  return null;
}

function repairAnalyzeProjectValue(value, issues = [], options = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return makeNotRepaired({
      value,
      issues,
      reason: 'analysis value is not an object',
    });
  }

  const issueList = Array.isArray(issues) ? issues : [];
  const repairIssues = issueList.filter((issue) => issue.issue === 'unrecognized_keys');
  const missingNameIssues = issueList.filter(isMissingNameIssue);
  const limits = resolveRepairLimits(options);

  if (repairIssues.length === 0) {
    return makeNotRepaired({
      value,
      issues,
      reason: 'no safe repairable schema drift issues were found',
    });
  }

  const keysByIssue = repairIssues.map((issue) => ({
    issue,
    keys: extractUnrecognizedKeys(issue),
  }));
  const allKeys = keysByIssue.flatMap((item) => item.keys);
  if (allKeys.length === 0 || !allKeys.every((key) => SAFE_ADDITIONAL_PROPERTY_KEYS.includes(key))) {
    return makeNotRepaired({
      value,
      issues,
      reason: 'additional-property keys are not in the safe repair allowlist',
    });
  }

  const repairedValue = cloneJson(value);
  const entries = [];
  const coveredIssueIndexes = new Set();
  const claimMappedPaths = new Set();
  const missingNamePaths = new Set(missingNameIssues.map((issue) => getParentPath(issue.path)));
  for (const { issue, keys } of keysByIssue) {
    const target = getValueAtPath(repairedValue, issue.path);
    if (!target || typeof target !== 'object' || Array.isArray(target)) {
      return makeNotRepaired({
        value,
        issues,
        reason: `repair target is not an object at ${issue.path || 'analysis'}`,
      });
    }

    for (const key of keys) {
      if (!Object.hasOwn(target, key)) {
        continue;
      }

      if (key === 'claim') {
        if (!isNamedFindingPath(issue.path)) {
          return makeNotRepaired({
            value,
            issues,
            reason: `claim can only be mapped to name on named finding paths, got ${issue.path || 'analysis'}`,
          });
        }
        if (Object.hasOwn(target, 'name')) {
          return makeNotRepaired({
            value,
            issues,
            reason: `claim cannot be mapped because name already exists at ${issue.path || 'analysis'}`,
          });
        }
        if (!missingNamePaths.has(issue.path)) {
          return makeNotRepaired({
            value,
            issues,
            reason: `claim cannot be mapped because schema did not report a missing name at ${issue.path || 'analysis'}`,
          });
        }
        const claim = String(target.claim || '').trim();
        if (!claim) {
          return makeNotRepaired({
            value,
            issues,
            reason: `claim cannot be mapped because it is empty at ${issue.path || 'analysis'}`,
          });
        }

        target.name = claim;
        delete target.claim;
        claimMappedPaths.add(issue.path);
        entries.push({
          path: issue.path || null,
          source_key: 'claim',
          target_key: 'name',
          action: 'mapped',
          reason: 'named-finding-name-missing-and-claim-is-safe-string',
        });
        continue;
      }

      if (key === 'confidence' && !isQuestionPath(issue.path)) {
        return makeNotRepaired({
          value,
          issues,
          reason: `confidence can only be removed from unsupported question paths, got ${issue.path || 'analysis'}`,
        });
      }

      delete target[key];
      entries.push({
        path: issue.path || null,
        key,
        action: 'removed',
        reason: key === 'confidence'
          ? 'unsupported-question-confidence-property'
          : 'unsupported-additional-property',
      });
    }
  }

  if (entries.length === 0) {
    return makeNotRepaired({
      value,
      issues,
      reason: 'no safe additional properties were present on target objects',
    });
  }

  for (const [index, issue] of issueList.entries()) {
    if (issue.issue === 'unrecognized_keys') {
      coveredIssueIndexes.add(index);
      continue;
    }
    if (isMissingNameIssue(issue) && claimMappedPaths.has(getParentPath(issue.path))) {
      coveredIssueIndexes.add(index);
    }
  }

  if (coveredIssueIndexes.size !== issueList.length) {
    return makeNotRepaired({
      value,
      issues,
      reason: 'one or more issues are not covered by safe schema drift repair rules',
    });
  }

  const budgetError = assertRepairBudget(entries, issues, value, limits);
  if (budgetError) {
    return budgetError;
  }

  return {
    repaired: true,
    value: repairedValue,
    manifest: makeRepairManifest({
      status: 'repaired',
      entries,
      issues,
      reason: 'applied only safe path-aware schema drift repairs',
    }),
  };
}

function parseAnalyzeProjectOutputWithRepair(text, options = {}) {
  const parsed = parseProviderAnalysisJson(text);
  try {
    const normalized = normalizeAnalyzeProjectAnalysis(parsed.value, options);
    return {
      ...normalized,
      parseSource: parsed.source,
      repaired: false,
      repairManifest: null,
    };
  } catch (error) {
    if (!(error instanceof AnalyzeProjectAnalysisError)) {
      throw error;
    }

    const repair = repairAnalyzeProjectValue(parsed.value, error.issues);
    if (!repair.repaired) {
      error.repair_manifest = repair.manifest;
      throw error;
    }

    try {
      const normalized = normalizeAnalyzeProjectAnalysis(repair.value, options);
      return {
        ...normalized,
        parseSource: parsed.source,
        repaired: true,
        repairManifest: repair.manifest,
      };
    } catch (repairError) {
      repairError.repair_manifest = repair.manifest;
      throw repairError;
    }
  }
}

function writeAnalyzeProjectRepairManifest(repoRoot, manifest, options = {}) {
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  const runId = normalizeRunId(options.runId, now);
  const internalPaths = quiverInternalPaths(repoRoot);
  const manifestPath = path.join(internalPaths.runsDir, runId, 'repair', 'analyze-project-repair.json');
  const value = {
    ...manifest,
    created_at: manifest?.created_at || now.toISOString(),
    run_id: runId,
  };

  ensureQuiverRunsIgnored(repoRoot);
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify(value, null, 2)}\n`);

  return {
    run_id: runId,
    path: toPosix(path.relative(repoRoot, manifestPath)),
    status: value.status,
    entry_count: value.entry_count,
  };
}

module.exports = {
  REPAIR_MANIFEST_KIND,
  SAFE_ADDITIONAL_PROPERTY_KEYS,
  parseAnalyzeProjectOutputWithRepair,
  repairAnalyzeProjectValue,
  writeAnalyzeProjectRepairManifest,
};
