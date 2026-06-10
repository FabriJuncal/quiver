const {
  ALLOWED_ANALYZE_DOC_UPDATE_PATHS,
  analyzeProjectSchema,
} = require('./analyze-project-schema');
const { extractBalancedJsonObject } = require('./context-proposal');

function formatError(message) {
  return `create-quiver: ${message}`;
}

class AnalyzeProjectAnalysisError extends Error {
  constructor(message, issues = []) {
    super(formatError(message));
    this.name = 'AnalyzeProjectAnalysisError';
    this.code = 'AI_ANALYZE_PROJECT_INVALID';
    this.issues = issues;
  }
}

function normalizeAnalysisShape(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }
  const normalized = { ...value };
  if (normalized.schemaVersion && !normalized.schema_version) {
    normalized.schema_version = normalized.schemaVersion;
    delete normalized.schemaVersion;
  }
  if (normalized.docUpdates && !normalized.doc_updates) {
    normalized.doc_updates = normalized.docUpdates;
    delete normalized.docUpdates;
  }
  return normalized;
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

function parseProviderAnalysisJson(text) {
  const input = String(text || '').trim();
  if (!input) {
    throw new AnalyzeProjectAnalysisError('provider analysis output is empty', [
      { path: null, issue: 'empty-output', message: 'The provider returned no analysis JSON.' },
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
  throw new AnalyzeProjectAnalysisError('provider analysis output is not valid JSON', [
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

function normalizeSelectedFileMap(options = {}) {
  const selectedFiles = Array.isArray(options.selectedFiles) ? options.selectedFiles : [];
  const promptFiles = Array.isArray(options.promptFiles) ? options.promptFiles : [];
  const fileMap = new Map();

  for (const file of selectedFiles) {
    fileMap.set(String(file.path || '').replace(/\\/g, '/'), {
      selected: true,
      truncated: false,
    });
  }
  for (const file of promptFiles) {
    const normalized = String(file.path || '').replace(/\\/g, '/');
    const current = fileMap.get(normalized) || { selected: false, truncated: false };
    fileMap.set(normalized, {
      ...current,
      truncated: file.truncated === true,
    });
  }

  return fileMap;
}

function validateEvidenceList({ evidence, confidence, location, target, fileMap, issues, warnings }) {
  const evidenceList = Array.isArray(evidence) ? evidence : [];
  const requiresEvidence = confidence && confidence !== 'unknown';

  if (requiresEvidence && evidenceList.length === 0) {
    issues.push({
      path: location,
      issue: 'missing-evidence',
      message: `${location} has confidence=${confidence} but no evidence paths.`,
    });
    return;
  }

  for (const evidencePath of evidenceList) {
    const normalized = String(evidencePath || '').replace(/\\/g, '/');
    const evidenceInfo = fileMap.get(normalized);
    if (!evidenceInfo || evidenceInfo.selected !== true) {
      issues.push({
        path: location,
        issue: 'evidence-not-selected',
        message: `evidence path is not in the selected sample: ${normalized}`,
      });
      continue;
    }

    if (confidence === 'confirmed' && evidenceInfo.truncated) {
      target.confidence = 'inferred';
      warnings.push({
        path: location,
        issue: 'confirmed-downgraded-truncated-evidence',
        message: `confirmed confidence downgraded to inferred because evidence file is truncated: ${normalized}`,
      });
    }
  }
}

function validateClaim(claim, location, context) {
  validateEvidenceList({
    evidence: claim.evidence,
    confidence: claim.confidence,
    location,
    target: claim,
    ...context,
  });
}

function validateFinding(finding, location, context) {
  if (!finding) {
    return;
  }
  validateEvidenceList({
    evidence: finding.evidence,
    confidence: finding.confidence,
    location,
    target: finding,
    ...context,
  });
}

function validateFindingArray(findings, location, context) {
  for (const [index, finding] of (Array.isArray(findings) ? findings : []).entries()) {
    validateFinding(finding, `${location}.${index}`, context);
  }
}

function validateClaimArray(claims, location, context) {
  for (const [index, claim] of (Array.isArray(claims) ? claims : []).entries()) {
    validateClaim(claim, `${location}.${index}`, context);
  }
}

function validateAnalysisEvidence(analysis, options = {}) {
  const fileMap = normalizeSelectedFileMap(options);
  const issues = [];
  const warnings = [];
  const context = { fileMap, issues, warnings };

  validateFinding(analysis.product.name, 'product.name', context);
  validateFinding(analysis.product.type, 'product.type', context);
  validateClaimArray(analysis.product.claims, 'product.claims', context);

  for (const key of ['roles', 'entities', 'actions', 'flows', 'incomplete_or_suspicious']) {
    validateFindingArray(analysis.domain[key], `domain.${key}`, context);
  }
  validateClaimArray(analysis.domain.claims, 'domain.claims', context);

  for (const key of ['frontend', 'backend', 'auth', 'persistence', 'integrations', 'state', 'api', 'testing', 'deploy', 'risks']) {
    validateFindingArray(analysis.architecture[key], `architecture.${key}`, context);
  }
  validateClaimArray(analysis.architecture.claims, 'architecture.claims', context);
  validateFindingArray(analysis.features, 'features', context);
  validateFindingArray(analysis.risks, 'risks', context);
  validateClaimArray(analysis.claims, 'claims', context);

  for (const [index, question] of analysis.questions.entries()) {
    validateEvidenceList({
      evidence: question.evidence,
      confidence: 'unknown',
      location: `questions.${index}`,
      target: question,
      ...context,
    });
  }

  for (const docPath of Object.keys(analysis.doc_updates || {})) {
    if (!ALLOWED_ANALYZE_DOC_UPDATE_PATHS.includes(docPath)) {
      issues.push({
        path: `doc_updates.${docPath}`,
        issue: 'unapproved-doc-update-path',
        message: `doc_updates path is not approved for analyze-project: ${docPath}`,
      });
    }
  }

  if (issues.length > 0) {
    throw new AnalyzeProjectAnalysisError('provider analysis JSON failed evidence validation', issues);
  }

  return {
    warnings,
    docUpdatePaths: Object.keys(analysis.doc_updates || {}),
  };
}

function normalizeAnalyzeProjectAnalysis(value, options = {}) {
  const parsed = analyzeProjectSchema.safeParse(normalizeAnalysisShape(value));
  if (!parsed.success) {
    throw new AnalyzeProjectAnalysisError('provider analysis JSON does not match the required schema', mapZodIssues(parsed.error));
  }
  const validation = validateAnalysisEvidence(parsed.data, options);
  return {
    analysis: parsed.data,
    warnings: validation.warnings,
    docUpdatePaths: validation.docUpdatePaths,
  };
}

function parseAnalyzeProjectOutput(text, options = {}) {
  const parsed = parseProviderAnalysisJson(text);
  const normalized = normalizeAnalyzeProjectAnalysis(parsed.value, options);
  return {
    ...normalized,
    parseSource: parsed.source,
  };
}

module.exports = {
  AnalyzeProjectAnalysisError,
  normalizeAnalyzeProjectAnalysis,
  parseAnalyzeProjectOutput,
  parseProviderAnalysisJson,
  validateAnalysisEvidence,
};
