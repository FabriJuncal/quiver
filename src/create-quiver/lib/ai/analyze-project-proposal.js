const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { z } = require('zod');

const { parseAnalyzeProjectDocProposal } = require('./analyze-project-docs');
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

function toPosix(filePath) {
  return String(filePath || '').replace(/\\/g, '/');
}

function toRelativePosix(root, filePath) {
  return toPosix(path.relative(root, filePath));
}

function sha256(contents) {
  return crypto.createHash('sha256').update(String(contents || ''), 'utf8').digest('hex');
}

function normalizeAnalyzeProjectProposalRunId(value) {
  const runId = String(value || '').trim();
  if (!runId) {
    throw new AnalyzeProjectProposalContractError('analyze-project proposal run id is required', [
      { path: 'run_id', issue: 'missing-run-id', message: 'run_id is required' },
    ]);
  }
  if (runId === '.' || runId === '..' || runId.includes('/') || runId.includes('\\') || runId.includes('\0')) {
    throw new AnalyzeProjectProposalContractError('analyze-project proposal run id is not safe', [
      { path: 'run_id', issue: 'unsafe-run-id', message: 'run_id must be a single path segment' },
    ]);
  }
  if (!/^[A-Za-z0-9._-]+$/.test(runId)) {
    throw new AnalyzeProjectProposalContractError('analyze-project proposal run id is not safe', [
      { path: 'run_id', issue: 'unsafe-run-id', message: 'run_id can contain only letters, numbers, dots, underscores, and hyphens' },
    ]);
  }
  return runId;
}

function writeJsonFile(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeTextFile(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, String(value || ''));
}

function readJsonFile(filePath, description) {
  if (!fs.existsSync(filePath)) {
    throw new AnalyzeProjectProposalContractError(`missing analyze-project ${description}`, [
      { path: toPosix(filePath), issue: 'missing-artifact', message: `${description} does not exist` },
    ]);
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new AnalyzeProjectProposalContractError(`invalid analyze-project ${description}`, [
      { path: toPosix(filePath), issue: 'malformed-json', message: error.message },
    ]);
  }
}

function artifactPathFromRef(ref) {
  if (typeof ref === 'string') {
    return normalizeArtifactPath(ref, 'artifact ref');
  }
  if (ref && typeof ref.path === 'string') {
    return normalizeArtifactPath(ref.path, 'artifact ref');
  }
  return null;
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
  const safeRunId = normalizeAnalyzeProjectProposalRunId(runId);

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

function assertSavedProposalManifestMatchesRun(manifest, paths, runId) {
  const issues = [];
  if (manifest.run_id !== runId) {
    issues.push({
      path: 'manifest.run_id',
      issue: 'run-id-mismatch',
      message: `manifest run_id must match requested run id (${runId})`,
    });
  }
  for (const [field, expected] of Object.entries({
    proposal_json: paths.proposal_json,
    proposal_markdown: paths.proposal_markdown,
    proposal_diff: paths.proposal_diff,
  })) {
    if (manifest[field] !== expected) {
      issues.push({
        path: `manifest.${field}`,
        issue: 'artifact-path-mismatch',
        message: `${field} must match ${expected}`,
      });
    }
  }
  if (issues.length > 0) {
    throw new AnalyzeProjectProposalContractError('saved analyze-project proposal manifest does not match the requested run', issues);
  }
}

function assertSavedProposalArtifactsExist(repoRoot, manifest) {
  const issues = [];
  for (const [field, relativePath] of Object.entries({
    proposal_json: manifest.proposal_json,
    proposal_markdown: manifest.proposal_markdown,
    proposal_diff: manifest.proposal_diff,
  })) {
    if (!fs.existsSync(path.join(repoRoot, relativePath))) {
      issues.push({
        path: field,
        issue: 'missing-artifact',
        message: `${relativePath} does not exist`,
      });
    }
  }
  if (issues.length > 0) {
    throw new AnalyzeProjectProposalContractError('saved analyze-project proposal is missing required artifacts', issues);
  }
}

function assertSavedProposalDocPathsMatchManifest(proposal, manifest) {
  const proposalPaths = (proposal.docs || []).map((doc) => doc.path).sort();
  const manifestPaths = [...(manifest.doc_paths || [])].sort();
  if (JSON.stringify(proposalPaths) === JSON.stringify(manifestPaths)) {
    return;
  }
  throw new AnalyzeProjectProposalContractError('saved analyze-project proposal docs do not match the proposal manifest', [
    {
      path: 'doc_paths',
      issue: 'doc-paths-mismatch',
      message: 'manual proposal edits may change content, but target doc paths must match the saved manifest',
      expected: manifestPaths,
      actual: proposalPaths,
    },
  ]);
}

function readAnalyzeProjectSavedProposal(repoRoot, runId) {
  const resolvedRunId = normalizeAnalyzeProjectProposalRunId(runId);
  const paths = buildAnalyzeProjectProposalArtifactPaths(resolvedRunId);
  const manifestPath = path.join(repoRoot, paths.manifest);
  const manifest = normalizeAnalyzeProjectProposalManifest(readJsonFile(manifestPath, 'proposal manifest'));
  assertSavedProposalManifestMatchesRun(manifest, paths, resolvedRunId);
  assertSavedProposalArtifactsExist(repoRoot, manifest);

  const proposalPath = path.join(repoRoot, manifest.proposal_json);
  let proposal;
  try {
    proposal = parseAnalyzeProjectDocProposal(fs.readFileSync(proposalPath, 'utf8'));
  } catch (error) {
    throw new AnalyzeProjectProposalContractError('saved analyze-project proposal JSON is invalid', error.issues || [{
      path: manifest.proposal_json,
      issue: error.code || 'invalid-proposal',
      message: error.message,
    }]);
  }
  assertSavedProposalDocPathsMatchManifest(proposal, manifest);

  const proposalJson = `${JSON.stringify(proposal, null, 2)}\n`;
  const proposalHash = sha256(proposalJson);
  const proposalEdited = proposalHash !== manifest.proposal_sha256;

  return {
    run_id: resolvedRunId,
    proposal,
    proposal_sha256: proposalHash,
    proposal_edited: proposalEdited,
    manifest,
    artifacts: {
      root: paths.root,
      proposal_json: manifest.proposal_json,
      proposal_markdown: manifest.proposal_markdown,
      proposal_diff: manifest.proposal_diff,
      manifest: paths.manifest,
      proposal_sha256: proposalHash,
      doc_paths: manifest.doc_paths,
      changed_docs: manifest.doc_paths,
      manifest_data: manifest,
      files: [
        manifest.proposal_json,
        manifest.proposal_markdown,
        manifest.proposal_diff,
        paths.manifest,
      ],
    },
  };
}

function findLatestAnalyzeProjectSavedProposalRun(repoRoot) {
  const runsRoot = path.join(repoRoot, '.quiver', 'runs');
  if (!fs.existsSync(runsRoot)) {
    return null;
  }

  const candidates = [];
  for (const entry of fs.readdirSync(runsRoot)) {
    let runId;
    try {
      runId = normalizeAnalyzeProjectProposalRunId(entry);
    } catch {
      continue;
    }
    const manifestPath = path.join(runsRoot, runId, 'proposal', PROPOSAL_ARTIFACT_FILENAMES.manifest);
    if (!fs.existsSync(manifestPath)) {
      continue;
    }
    let timestamp = 0;
    try {
      const manifest = normalizeAnalyzeProjectProposalManifest(readJsonFile(manifestPath, 'proposal manifest'));
      timestamp = Date.parse(manifest.created_at) || fs.statSync(manifestPath).mtimeMs;
    } catch {
      timestamp = fs.statSync(manifestPath).mtimeMs;
    }
    candidates.push({ runId, timestamp });
  }

  candidates.sort((a, b) => {
    if (b.timestamp !== a.timestamp) {
      return b.timestamp - a.timestamp;
    }
    return b.runId.localeCompare(a.runId);
  });

  return candidates[0]?.runId || null;
}

function formatAnalyzeProjectFullDiff(writePlan = []) {
  const lines = [];
  for (const item of writePlan) {
    if (item.action === 'skip') {
      continue;
    }
    lines.push(`--- ${item.path} (current)`);
    lines.push(`+++ ${item.path} (proposed)`);
    const currentLines = String(item.currentContent || '').split('\n');
    const proposedLines = String(item.proposedContent || '').split('\n');
    for (const line of currentLines) {
      lines.push(`- ${line}`);
    }
    for (const line of proposedLines) {
      lines.push(`+ ${line}`);
    }
  }
  return `${(lines.length > 0 ? lines : ['- no changes']).join('\n')}\n`;
}

function formatAnalyzeProjectProposalSummary({ runId, provider, proposal, writePlan, artifacts } = {}) {
  const changed = (writePlan || []).filter((item) => item.action !== 'skip');
  const dirty = changed.filter((item) => item.dirty);
  const docs = Array.isArray(proposal?.docs) ? proposal.docs : [];
  const lines = [
    '# Analyze Project Documentation Proposal',
    '',
    `Run: ${runId}`,
    `Provider: ${provider || 'unknown'}`,
    `Proposed docs: ${docs.length}`,
    `Docs with changes: ${changed.length}`,
    `Dirty existing docs: ${dirty.length}`,
    '',
    '## Files',
  ];

  for (const item of writePlan || []) {
    lines.push(`- ${item.path}: ${item.action}${item.dirty ? ' (dirty existing doc)' : ''}`);
  }
  if (!Array.isArray(writePlan) || writePlan.length === 0) {
    lines.push('- none');
  }

  lines.push('', '## Artifacts');
  lines.push(`- Proposal JSON: ${artifacts.proposal_json}`);
  lines.push(`- Diff: ${artifacts.proposal_diff}`);
  lines.push(`- Manifest: ${artifacts.manifest}`);
  lines.push('', 'This summary intentionally omits full proposed document contents. Use the JSON or diff artifact for details.');

  return `${lines.join('\n')}\n`;
}

function writeAnalyzeProjectProposalArtifacts(repoRoot, options = {}) {
  const runId = String(options.runId || '').trim();
  if (!runId) {
    throw new AnalyzeProjectProposalContractError('analyze-project proposal artifacts require a run id', [
      { path: 'run_id', issue: 'missing-run-id', message: 'run_id is required' },
    ]);
  }

  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  const provider = options.provider ? String(options.provider) : null;
  const language = options.language === 'es' ? 'es' : 'en';
  const proposal = options.proposal || { schema_version: 1, kind: 'quiver-analyze-project-doc-proposal', summary: '', docs: [] };
  const writePlan = Array.isArray(options.writePlan) ? options.writePlan : [];
  const paths = buildAnalyzeProjectProposalArtifactPaths(runId);
  const proposalJson = `${JSON.stringify(proposal, null, 2)}\n`;
  const proposalHash = sha256(proposalJson);
  const docBeforeHashes = {};

  for (const item of writePlan) {
    docBeforeHashes[item.path] = item.before_sha256 || null;
  }

  const selectedContextPath = artifactPathFromRef(options.selectedContextManifest)
    || `.quiver/runs/${runId}/context/selected-context.json`;
  const repairPath = artifactPathFromRef(options.repairManifest);
  const manifest = normalizeAnalyzeProjectProposalManifest({
    schema_version: ANALYZE_PROJECT_PROPOSAL_MANIFEST_SCHEMA_VERSION,
    kind: ANALYZE_PROJECT_PROPOSAL_MANIFEST_KIND,
    run_id: runId,
    created_at: now.toISOString(),
    language,
    provider,
    proposal_json: paths.proposal_json,
    proposal_markdown: paths.proposal_markdown,
    proposal_diff: paths.proposal_diff,
    selected_context_manifest: selectedContextPath,
    repair_manifest: repairPath,
    doc_paths: writePlan.map((item) => item.path),
    doc_before_hashes: docBeforeHashes,
    proposal_sha256: proposalHash,
    events: [
      {
        type: 'proposal-saved',
        at: now.toISOString(),
        doc_count: writePlan.length,
        changed_count: writePlan.filter((item) => item.action !== 'skip').length,
      },
      ...(Array.isArray(options.events) ? options.events : []),
    ],
  });

  const absolutePaths = {
    proposalJson: path.join(repoRoot, paths.proposal_json),
    proposalMarkdown: path.join(repoRoot, paths.proposal_markdown),
    proposalDiff: path.join(repoRoot, paths.proposal_diff),
    manifest: path.join(repoRoot, paths.manifest),
  };
  const diff = formatAnalyzeProjectFullDiff(writePlan);
  const summary = formatAnalyzeProjectProposalSummary({
    runId,
    provider,
    proposal,
    writePlan,
    artifacts: paths,
  });

  writeTextFile(absolutePaths.proposalJson, proposalJson);
  writeTextFile(absolutePaths.proposalMarkdown, summary);
  writeTextFile(absolutePaths.proposalDiff, diff);
  writeJsonFile(absolutePaths.manifest, manifest);

  return {
    root: paths.root,
    proposal_json: paths.proposal_json,
    proposal_markdown: paths.proposal_markdown,
    proposal_diff: paths.proposal_diff,
    manifest: paths.manifest,
    proposal_sha256: proposalHash,
    doc_paths: manifest.doc_paths,
    changed_docs: writePlan.filter((item) => item.action !== 'skip').map((item) => item.path),
    manifest_data: manifest,
    files: [
      paths.proposal_json,
      paths.proposal_markdown,
      paths.proposal_diff,
      paths.manifest,
    ],
    absolute_files: Object.values(absolutePaths).map((filePath) => toRelativePosix(repoRoot, filePath)),
  };
}

function writeAnalyzeProjectWriteManifest(repoRoot, options = {}) {
  const runId = String(options.runId || '').trim();
  if (!runId) {
    throw new AnalyzeProjectProposalContractError('analyze-project write manifest requires a run id', [
      { path: 'run_id', issue: 'missing-run-id', message: 'run_id is required' },
    ]);
  }

  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  const paths = buildAnalyzeProjectProposalArtifactPaths(runId);
  const writePlan = Array.isArray(options.writePlan) ? options.writePlan : [];
  const writtenDocs = new Set(Array.isArray(options.writtenDocs) ? options.writtenDocs : []);
  const snapshotEntries = new Map(
    (options.snapshot?.entries || []).map((entry) => [entry.path, entry]),
  );
  const actionStatus = options.status || 'planned';
  const actions = writePlan.map((item) => {
    const snapshotEntry = snapshotEntries.get(item.path);
    let status = item.action === 'skip' ? 'skipped' : actionStatus;
    if (actionStatus === 'completed') {
      status = item.action === 'skip' ? 'skipped' : writtenDocs.has(item.path) ? 'written' : 'failed';
    }

    return {
      path: item.path,
      action: item.action,
      before_sha256: item.before_sha256 || null,
      after_sha256: item.after_sha256 || null,
      snapshot_path: snapshotEntry?.snapshot_path || null,
      dirty: item.dirty === true,
      status,
    };
  });
  const validation = options.validation || {
    ok: false,
    strict: options.strict === true,
    errors: [],
    warnings: [],
  };
  const manifest = normalizeAnalyzeProjectWriteManifest({
    schema_version: ANALYZE_PROJECT_WRITE_MANIFEST_SCHEMA_VERSION,
    kind: ANALYZE_PROJECT_WRITE_MANIFEST_KIND,
    run_id: runId,
    created_at: now.toISOString(),
    proposal_manifest: options.proposalManifest || paths.manifest,
    snapshot_root: options.snapshot?.root || null,
    actions,
    validation: {
      ok: validation.ok === true,
      strict: validation.strict === true,
      errors: Array.isArray(validation.errors) ? validation.errors : [],
      warnings: Array.isArray(validation.warnings) ? validation.warnings : [],
    },
    partial_write: options.partialWrite === true,
    events: Array.isArray(options.events) ? options.events : [],
  });

  const manifestPath = path.join(repoRoot, paths.write_manifest);
  writeJsonFile(manifestPath, manifest);

  return {
    path: paths.write_manifest,
    root: path.dirname(paths.write_manifest).split(path.sep).join('/'),
    manifest_data: manifest,
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
  findLatestAnalyzeProjectSavedProposalRun,
  formatAnalyzeProjectFullDiff,
  formatAnalyzeProjectProposalSummary,
  normalizeAnalyzeProjectProposalRunId,
  normalizeAnalyzeProjectProposalManifest,
  normalizeAnalyzeProjectWriteManifest,
  proposalManifestSchema,
  readAnalyzeProjectSavedProposal,
  writeAnalyzeProjectProposalArtifacts,
  writeAnalyzeProjectWriteManifest,
  writeManifestSchema,
};
