const { z } = require('zod');

const { validateProjectRelativePath } = require('../paths');

const ANALYZE_PROJECT_PROPOSAL_MANIFEST_SCHEMA_VERSION = 1;
const ANALYZE_PROJECT_PROPOSAL_MANIFEST_KIND = 'quiver-analyze-project-doc-proposal';
const ANALYZE_PROJECT_WRITE_MANIFEST_SCHEMA_VERSION = 1;
const ANALYZE_PROJECT_WRITE_MANIFEST_KIND = 'quiver-analyze-project-doc-writes';

const PROPOSAL_ARTIFACT_FILENAMES = Object.freeze({
  json: 'analyze-project-doc-proposal.json',
  markdown: 'analyze-project-doc-proposal.md',
  diff: 'analyze-project-doc-proposal.diff',
  manifest: 'manifest.json',
});

function formatError(message) {
  return `create-quiver: ${message}`;
}

class AnalyzeProjectProposalContractError extends Error {
  constructor(message, issues = []) {
    super(formatError(message));
    this.name = 'AnalyzeProjectProposalContractError';
    this.code = 'AI_ANALYZE_PROJECT_PROPOSAL_CONTRACT_INVALID';
    this.issues = issues;
  }
}

function normalizeArtifactPath(value, fieldName = 'artifact path') {
  try {
    return validateProjectRelativePath(value, fieldName);
  } catch (error) {
    throw new AnalyzeProjectProposalContractError(`${fieldName} is not a safe project-relative path`, [
      { path: fieldName, issue: 'invalid-project-relative-path', message: error.message },
    ]);
  }
}

function relativePathSchema(fieldName) {
  return z.string().trim().min(1).transform((value) => normalizeArtifactPath(value, fieldName));
}

const proposalManifestSchema = z.object({
  schema_version: z.literal(ANALYZE_PROJECT_PROPOSAL_MANIFEST_SCHEMA_VERSION),
  kind: z.literal(ANALYZE_PROJECT_PROPOSAL_MANIFEST_KIND),
  run_id: z.string().trim().min(1),
  created_at: z.string().trim().min(1),
  language: z.enum(['en', 'es']),
  provider: z.string().trim().min(1).nullable(),
  proposal_json: relativePathSchema('proposal_json'),
  proposal_markdown: relativePathSchema('proposal_markdown'),
  proposal_diff: relativePathSchema('proposal_diff'),
  selected_context_manifest: relativePathSchema('selected_context_manifest'),
  repair_manifest: relativePathSchema('repair_manifest').nullable(),
  doc_paths: z.array(relativePathSchema('doc_paths')).default([]),
  doc_before_hashes: z.record(z.string().trim().min(1), z.string().trim().min(1).nullable()).default({}),
  proposal_sha256: z.string().trim().min(1),
  events: z.array(z.record(z.string(), z.unknown())).default([]),
}).strict();

const writeManifestActionSchema = z.object({
  path: relativePathSchema('actions.path'),
  action: z.enum(['create', 'update', 'skip']),
  before_sha256: z.string().trim().min(1).nullable(),
  after_sha256: z.string().trim().min(1).nullable(),
  snapshot_path: relativePathSchema('actions.snapshot_path').nullable(),
  dirty: z.boolean().default(false),
  status: z.enum(['planned', 'written', 'skipped', 'failed']).default('planned'),
}).strict();

const writeManifestSchema = z.object({
  schema_version: z.literal(ANALYZE_PROJECT_WRITE_MANIFEST_SCHEMA_VERSION),
  kind: z.literal(ANALYZE_PROJECT_WRITE_MANIFEST_KIND),
  run_id: z.string().trim().min(1),
  created_at: z.string().trim().min(1),
  proposal_manifest: relativePathSchema('proposal_manifest'),
  snapshot_root: relativePathSchema('snapshot_root').nullable(),
  actions: z.array(writeManifestActionSchema).default([]),
  validation: z.object({
    ok: z.boolean(),
    strict: z.boolean().default(false),
    errors: z.array(z.record(z.string(), z.unknown())).default([]),
    warnings: z.array(z.record(z.string(), z.unknown())).default([]),
  }).strict(),
  partial_write: z.boolean().default(false),
  events: z.array(z.record(z.string(), z.unknown())).default([]),
}).strict();

function mapZodIssues(error) {
  return error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join('.') : null,
    issue: issue.code,
    message: issue.message,
  }));
}

function normalizeAnalyzeProjectProposalManifest(value) {
  const parsed = proposalManifestSchema.safeParse(value);
  if (!parsed.success) {
    throw new AnalyzeProjectProposalContractError('analyze-project proposal manifest does not match the required schema', mapZodIssues(parsed.error));
  }
  return parsed.data;
}

function normalizeAnalyzeProjectWriteManifest(value) {
  const parsed = writeManifestSchema.safeParse(value);
  if (!parsed.success) {
    throw new AnalyzeProjectProposalContractError('analyze-project write manifest does not match the required schema', mapZodIssues(parsed.error));
  }
  return parsed.data;
}

function buildAnalyzeProjectProposalArtifactPaths(runId) {
  const safeRunId = String(runId || '').trim();
  if (!safeRunId) {
    throw new AnalyzeProjectProposalContractError('analyze-project proposal artifact paths require a run id', [
      { path: 'run_id', issue: 'missing-run-id', message: 'run_id is required' },
    ]);
  }

  const root = `.quiver/runs/${safeRunId}/proposal`;
  return {
    root,
    proposal_json: `${root}/${PROPOSAL_ARTIFACT_FILENAMES.json}`,
    proposal_markdown: `${root}/${PROPOSAL_ARTIFACT_FILENAMES.markdown}`,
    proposal_diff: `${root}/${PROPOSAL_ARTIFACT_FILENAMES.diff}`,
    manifest: `${root}/${PROPOSAL_ARTIFACT_FILENAMES.manifest}`,
    write_manifest: `.quiver/runs/${safeRunId}/writes/analyze-project-doc-writes.json`,
  };
}

module.exports = {
  ANALYZE_PROJECT_PROPOSAL_MANIFEST_KIND,
  ANALYZE_PROJECT_PROPOSAL_MANIFEST_SCHEMA_VERSION,
  ANALYZE_PROJECT_WRITE_MANIFEST_KIND,
  ANALYZE_PROJECT_WRITE_MANIFEST_SCHEMA_VERSION,
  AnalyzeProjectProposalContractError,
  PROPOSAL_ARTIFACT_FILENAMES,
  buildAnalyzeProjectProposalArtifactPaths,
  normalizeAnalyzeProjectProposalManifest,
  normalizeAnalyzeProjectWriteManifest,
  proposalManifestSchema,
  writeManifestSchema,
};
