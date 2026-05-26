const fs = require('node:fs');
const path = require('node:path');

const { redactSensitiveLocalValues } = require('./artifacts');
const { getPreparedContextDocPaths } = require('./context-packs');
const { contextProposalSchema } = require('./context-proposal.schema');
const { quiverInternalPaths } = require('../init-layout');
const {
  getProjectRelativePathIssue,
  validateProjectRelativePath,
} = require('../paths');

const INVALID_PROPOSAL_ARTIFACT_SCHEMA_VERSION = 1;

function formatError(message) {
  return `create-quiver: ${message}`;
}

class ContextProposalError extends Error {
  constructor(message, issues = []) {
    super(formatError(message));
    this.name = 'ContextProposalError';
    this.code = 'AI_CONTEXT_PROPOSAL_INVALID';
    this.issues = issues;
    this.safeNextSteps = [
      'Run deterministic prepare-context without --with-planner if you need the safest fallback.',
      'Rerun with --with-planner --print-prompt and ask the planner to return only valid JSON.',
      'Review the blocked paths and keep proposal writes limited to approved docs-only context files.',
    ];
  }
}

function normalizeProposalShape(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  const proposal = { ...value };
  if (!proposal.docs && Array.isArray(proposal.files)) {
    proposal.docs = proposal.files;
    delete proposal.files;
  }
  if (proposal.schemaVersion && !proposal.schema_version) {
    proposal.schema_version = proposal.schemaVersion;
    delete proposal.schemaVersion;
  }
  if (proposal.nextSteps && !proposal.next_steps) {
    proposal.next_steps = proposal.nextSteps;
    delete proposal.nextSteps;
  }
  if (proposal.omittedPaths && !proposal.omitted_paths) {
    proposal.omitted_paths = proposal.omittedPaths;
    delete proposal.omittedPaths;
  }

  return proposal;
}

function getAllowedContextProposalPaths() {
  return getPreparedContextDocPaths();
}

function classifyDisallowedContextPath(relativePath) {
  const normalized = String(relativePath || '').replace(/\\/g, '/').toLowerCase();

  if (/^(src|app|apps|packages|lib|server|client|web)\//.test(normalized)) {
    return 'product-code';
  }
  if (/^(package(?:-lock)?|npm-shrinkwrap)\.json$/.test(normalized)
    || /^pnpm-lock\.yaml$/.test(normalized)
    || /^yarn\.lock$/.test(normalized)
    || /^bun\.lockb?$/.test(normalized)) {
    return 'dependency-or-lockfile';
  }
  if (/^(vite|next|webpack|rollup|tsconfig|jsconfig|babel|postcss|tailwind|eslint|prettier|turbo|vercel|netlify|dockerfile|compose)(\.|$)/i.test(normalized)) {
    return 'build-or-runtime-config';
  }
  if (/^(dist|build|coverage|out|generated|gen|artifacts|reports)\//.test(normalized)) {
    return 'generated-output';
  }
  if (/^\.quiver\//.test(normalized)) {
    return 'quiver-internal-state';
  }
  if (!normalized.startsWith('docs/')) {
    return 'not-a-context-doc';
  }
  return 'unapproved-context-doc';
}

function validateContextProposalPath(filePath, options = {}) {
  const issue = getProjectRelativePathIssue(filePath, options.pathLib);
  if (issue) {
    return {
      ok: false,
      path: String(filePath || ''),
      issue,
      message: `path must be project-relative and stay inside the repository (issue=${issue})`,
    };
  }

  let normalized;
  try {
    normalized = validateProjectRelativePath(filePath, 'planner proposal path', options.pathLib);
  } catch (error) {
    return {
      ok: false,
      path: String(filePath || ''),
      issue: 'invalid-project-relative-path',
      message: error.message,
    };
  }

  const allowed = new Set(options.allowedPaths || getAllowedContextProposalPaths());
  if (!allowed.has(normalized)) {
    const issueName = classifyDisallowedContextPath(normalized);
    return {
      ok: false,
      path: normalized,
      issue: issueName,
      message: `path is not approved for planner context writes (${issueName}). Allowed paths: ${Array.from(allowed).join(', ')}`,
    };
  }

  return {
    ok: true,
    path: normalized,
  };
}

function extractBalancedJsonObject(text) {
  const input = String(text || '');
  const start = input.indexOf('{');
  if (start === -1) {
    return null;
  }

  let depth = 0;
  let quote = null;
  let escaping = false;

  for (let index = start; index < input.length; index += 1) {
    const char = input[index];

    if (escaping) {
      escaping = false;
      continue;
    }
    if (char === '\\') {
      escaping = true;
      continue;
    }
    if (quote) {
      if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '{') {
      depth += 1;
    }
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return input.slice(start, index + 1);
      }
    }
  }

  return null;
}

function parseJsonCandidate(jsonText, source) {
  try {
    return {
      ok: true,
      source,
      value: JSON.parse(jsonText),
    };
  } catch (error) {
    return {
      ok: false,
      source,
      error,
    };
  }
}

function parsePlannerProposalJson(text) {
  const input = String(text || '').trim();
  if (!input) {
    throw new ContextProposalError('planner proposal output is empty', [
      { path: null, issue: 'empty-output', message: 'The planner returned no proposal JSON.' },
    ]);
  }

  const direct = parseJsonCandidate(input, 'raw-json');
  if (direct.ok) {
    return direct;
  }

  const fencedMatches = Array.from(input.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi));
  const parseFailures = [direct];
  for (const match of fencedMatches) {
    const parsed = parseJsonCandidate(match[1].trim(), 'fenced-json');
    if (parsed.ok) {
      return parsed;
    }
    parseFailures.push(parsed);
  }

  const balanced = extractBalancedJsonObject(input);
  if (balanced) {
    const parsed = parseJsonCandidate(balanced, 'embedded-json');
    if (parsed.ok) {
      return parsed;
    }
    parseFailures.push(parsed);
  }

  const firstError = parseFailures.find((item) => item.error)?.error;
  throw new ContextProposalError('planner proposal output is not valid JSON', [
    {
      path: null,
      issue: 'malformed-json',
      message: firstError ? firstError.message : 'No JSON object or fenced JSON block could be parsed.',
    },
  ]);
}

function mapZodIssues(error) {
  return error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join('.') : null,
    issue: issue.code,
    message: issue.message,
  }));
}

function normalizeStrings(values) {
  return Array.from(new Set((Array.isArray(values) ? values : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)));
}

function normalizeContextProposal(value, options = {}) {
  const proposal = normalizeProposalShape(value);
  const parsed = contextProposalSchema.safeParse(proposal);
  if (!parsed.success) {
    throw new ContextProposalError('planner context proposal does not match the required schema', mapZodIssues(parsed.error));
  }

  const issues = [];
  const seenPaths = new Set();
  const docs = [];

  for (const [index, doc] of parsed.data.docs.entries()) {
    const pathResult = validateContextProposalPath(doc.path, options);
    if (!pathResult.ok) {
      issues.push({
        index,
        path: pathResult.path,
        issue: pathResult.issue,
        message: pathResult.message,
      });
      continue;
    }

    if (seenPaths.has(pathResult.path)) {
      issues.push({
        index,
        path: pathResult.path,
        issue: 'duplicate-path',
        message: 'planner proposal contains multiple updates for the same context doc path',
      });
      continue;
    }
    seenPaths.add(pathResult.path);

    if (doc.action !== 'skip' && !doc.content.trim()) {
      issues.push({
        index,
        path: pathResult.path,
        issue: 'missing-content',
        message: 'create/update proposal entries require non-empty content',
      });
      continue;
    }

    docs.push({
      path: pathResult.path,
      action: doc.action,
      content: doc.content,
      reason: doc.reason,
      assumptions: normalizeStrings(doc.assumptions),
      risks: normalizeStrings(doc.risks),
      source: 'planner-proposal',
    });
  }

  if (issues.length > 0) {
    throw new ContextProposalError('planner context proposal contains unsafe or ambiguous writes', issues);
  }

  return {
    schemaVersion: parsed.data.schema_version,
    kind: parsed.data.kind,
    summary: parsed.data.summary,
    assumptions: normalizeStrings(parsed.data.assumptions),
    risks: normalizeStrings(parsed.data.risks),
    omittedPaths: normalizeStrings(parsed.data.omitted_paths),
    nextSteps: normalizeStrings(parsed.data.next_steps),
    docs,
    writePlan: docs
      .filter((doc) => doc.action !== 'skip')
      .map((doc) => ({
        path: doc.path,
        content: doc.content,
        reason: doc.reason,
        source: doc.source,
      })),
  };
}

function parseContextProposalOutput(text, options = {}) {
  const parsed = parsePlannerProposalJson(text);
  return {
    ...normalizeContextProposal(parsed.value, options),
    parseSource: parsed.source,
  };
}

function safeArtifactName(now = new Date()) {
  return `${now.toISOString()
    .replace(/\.\d{3}Z$/, 'z')
    .replace(/[^0-9a-z]+/gi, '-')
    .toLowerCase()
    .replace(/^-+|-+$/g, '')}-invalid-context-proposal.json`;
}

function writeInvalidContextProposalArtifact(projectRoot, runId, rawOutput, error, options = {}) {
  if (!projectRoot) {
    throw new Error(formatError('missing project root for invalid context proposal artifact'));
  }
  if (!runId) {
    throw new Error(formatError('missing AI run id for invalid context proposal artifact'));
  }

  const now = options.now || new Date();
  const artifactDir = path.join(quiverInternalPaths(projectRoot).runsDir, String(runId), 'raw');
  const filePath = path.join(artifactDir, safeArtifactName(now));
  const artifact = {
    schema_version: INVALID_PROPOSAL_ARTIFACT_SCHEMA_VERSION,
    kind: 'invalid-context-proposal',
    created_at: now.toISOString(),
    ok: false,
    error: {
      code: error?.code || 'AI_CONTEXT_PROPOSAL_INVALID',
      message: error?.message || String(error || 'unknown error'),
      issues: Array.isArray(error?.issues) ? error.issues : [],
      safe_next_steps: Array.isArray(error?.safeNextSteps) ? error.safeNextSteps : [],
    },
    raw_output: redactSensitiveLocalValues(rawOutput, { projectRoot }),
  };

  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(artifact, null, 2)}\n`);

  return {
    filePath,
    path: path.relative(projectRoot, filePath).split(path.sep).join('/'),
    artifact,
  };
}

module.exports = {
  INVALID_PROPOSAL_ARTIFACT_SCHEMA_VERSION,
  ContextProposalError,
  classifyDisallowedContextPath,
  extractBalancedJsonObject,
  getAllowedContextProposalPaths,
  normalizeContextProposal,
  parseContextProposalOutput,
  parsePlannerProposalJson,
  validateContextProposalPath,
  writeInvalidContextProposalArtifact,
};
