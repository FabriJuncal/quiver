const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { z } = require('zod');

const {
  ALLOWED_ANALYZE_DOC_UPDATE_PATHS,
  MAX_ANALYZE_DOC_UPDATE_LENGTH,
} = require('./analyze-project-schema');
const { redactSensitiveLocalValues } = require('./artifacts');
const { validateProjectRelativePath } = require('../paths');

const ANALYZE_DOC_PROPOSAL_SCHEMA_VERSION = 1;
const ANALYZE_DOC_PROPOSAL_KIND = 'quiver-analyze-project-doc-proposal';
const ANALYZE_MANAGED_START = '<!-- quiver:analyze-project:start -->';
const ANALYZE_MANAGED_END = '<!-- quiver:analyze-project:end -->';

const docProposalEntrySchema = z.object({
  path: z.string().trim().min(1),
  action: z.enum(['create', 'update', 'skip']).default('update'),
  content: z.string().max(MAX_ANALYZE_DOC_UPDATE_LENGTH).default(''),
  reason: z.string().trim().max(2_000).default('AI analyze-project proposed this update.'),
}).strict();

const analyzeProjectDocProposalSchema = z.object({
  schema_version: z.literal(ANALYZE_DOC_PROPOSAL_SCHEMA_VERSION).default(ANALYZE_DOC_PROPOSAL_SCHEMA_VERSION),
  kind: z.literal(ANALYZE_DOC_PROPOSAL_KIND).default(ANALYZE_DOC_PROPOSAL_KIND),
  summary: z.string().trim().max(4_000).default(''),
  docs: z.array(docProposalEntrySchema).default([]),
}).strict();

function formatError(message) {
  return `create-quiver: ${message}`;
}

class AnalyzeProjectDocsError extends Error {
  constructor(message, issues = []) {
    super(formatError(message));
    this.name = 'AnalyzeProjectDocsError';
    this.code = 'AI_ANALYZE_PROJECT_DOCS_INVALID';
    this.issues = issues;
  }
}

function sha256(contents) {
  return crypto.createHash('sha256').update(String(contents || ''), 'utf8').digest('hex');
}

function buildDiffSnippet(filePath, currentContent, proposedContent) {
  const currentLines = String(currentContent || '').split('\n').slice(0, 6);
  const proposedLines = String(proposedContent || '').split('\n').slice(0, 6);
  const lines = [
    `--- ${filePath} (current)`,
    `+++ ${filePath} (proposed)`,
  ];
  for (const line of currentLines) {
    if (line) lines.push(`- ${line}`);
  }
  for (const line of proposedLines) {
    if (line) lines.push(`+ ${line}`);
  }
  return lines;
}

function normalizeDocContent(content) {
  return `${String(content || '').replace(/\s+$/g, '')}\n`;
}

function managedBlock(content) {
  return [
    ANALYZE_MANAGED_START,
    normalizeDocContent(content).trimEnd(),
    ANALYZE_MANAGED_END,
    '',
  ].join('\n');
}

function mergeManagedBlock(currentContent, proposedContent) {
  const current = String(currentContent || '');
  const block = managedBlock(proposedContent);
  const startIndex = current.indexOf(ANALYZE_MANAGED_START);
  const endIndex = current.indexOf(ANALYZE_MANAGED_END);

  if (startIndex >= 0 && endIndex > startIndex) {
    return `${current.slice(0, startIndex)}${block}${current.slice(endIndex + ANALYZE_MANAGED_END.length).replace(/^\s*\n?/, '')}`;
  }

  if (!current.trim()) {
    return block;
  }

  return `${current.replace(/\s+$/g, '')}\n\n${block}`;
}

function validateDocPath(docPath) {
  let normalized;
  try {
    normalized = validateProjectRelativePath(docPath, 'analyze-project doc update path');
  } catch (error) {
    return {
      ok: false,
      path: String(docPath || ''),
      issue: 'invalid-project-relative-path',
      message: error.message,
    };
  }

  if (!ALLOWED_ANALYZE_DOC_UPDATE_PATHS.includes(normalized)) {
    return {
      ok: false,
      path: normalized,
      issue: 'unapproved-doc-update-path',
      message: `analyze-project can only update approved Markdown docs: ${ALLOWED_ANALYZE_DOC_UPDATE_PATHS.join(', ')}`,
    };
  }

  if (!normalized.endsWith('.md')) {
    return {
      ok: false,
      path: normalized,
      issue: 'not-markdown',
      message: 'analyze-project doc updates must target Markdown files.',
    };
  }

  return { ok: true, path: normalized };
}

function mapZodIssues(error) {
  return error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join('.') : null,
    issue: issue.code,
    message: issue.message,
  }));
}

function normalizeAnalyzeProjectDocProposal(value) {
  const parsed = analyzeProjectDocProposalSchema.safeParse(value);
  if (!parsed.success) {
    throw new AnalyzeProjectDocsError('analyze-project doc proposal does not match the required schema', mapZodIssues(parsed.error));
  }

  const issues = [];
  const seen = new Set();
  const docs = [];

  for (const [index, doc] of parsed.data.docs.entries()) {
    const pathResult = validateDocPath(doc.path);
    if (!pathResult.ok) {
      issues.push({ index, ...pathResult });
      continue;
    }
    if (seen.has(pathResult.path)) {
      issues.push({
        index,
        path: pathResult.path,
        issue: 'duplicate-path',
        message: 'proposal contains multiple updates for the same doc path',
      });
      continue;
    }
    seen.add(pathResult.path);
    if (doc.action !== 'skip' && !doc.content.trim()) {
      issues.push({
        index,
        path: pathResult.path,
        issue: 'missing-content',
        message: 'create/update doc proposals require non-empty Markdown content',
      });
      continue;
    }
    docs.push({
      ...doc,
      path: pathResult.path,
    });
  }

  if (issues.length > 0) {
    throw new AnalyzeProjectDocsError('analyze-project doc proposal contains unsafe or ambiguous writes', issues);
  }

  return {
    schema_version: parsed.data.schema_version,
    kind: parsed.data.kind,
    summary: parsed.data.summary,
    docs,
  };
}

function parseAnalyzeProjectDocProposal(text) {
  let parsed;
  try {
    parsed = JSON.parse(String(text || ''));
  } catch (error) {
    throw new AnalyzeProjectDocsError('edited analyze-project doc proposal is not valid JSON', [
      { path: null, issue: 'malformed-json', message: error.message },
    ]);
  }
  return normalizeAnalyzeProjectDocProposal(parsed);
}

function fallbackDocUpdatesFromAnalysis(analysis) {
  const productName = analysis?.product?.name?.name || 'Unknown product';
  const features = (analysis?.features || []).map((feature) => `- ${feature.name} (${feature.confidence})`).join('\n') || '- Unknown';
  return {
    'docs/CONTEXTO.md': `# Context\n\nProduct: ${productName}\n\n## Features\n${features}\n`,
    'docs/AI_CONTEXT.md': `# AI Context\n\nProduct: ${productName}\n\nUse this context as inferred evidence, not as unverified fact.\n`,
    'docs/ARCHITECTURE.md': '# Architecture\n\nArchitecture details were not fully confirmed by the current analysis.\n',
  };
}

function buildAnalyzeProjectDocProposal(analysis, options = {}) {
  const docUpdates = analysis?.doc_updates && Object.keys(analysis.doc_updates).length > 0
    ? analysis.doc_updates
    : fallbackDocUpdatesFromAnalysis(analysis);
  const docs = Object.keys(docUpdates)
    .sort()
    .map((docPath) => ({
      path: docPath,
      action: 'update',
      content: docUpdates[docPath],
      reason: docPath === 'docs/PROJECT_MAP.md'
        ? 'AI content constrained to the Quiver analyze-project managed block.'
        : 'AI analyze-project proposed a managed documentation update.',
    }));

  return normalizeAnalyzeProjectDocProposal({
    schema_version: ANALYZE_DOC_PROPOSAL_SCHEMA_VERSION,
    kind: ANALYZE_DOC_PROPOSAL_KIND,
    summary: options.summary || 'Documentation updates proposed from validated analyze-project output.',
    docs,
  });
}

function buildAnalyzeProjectWritePlan(repoRoot, proposal) {
  return proposal.docs.map((doc) => {
    const destinationPath = path.join(repoRoot, doc.path);
    const exists = fs.existsSync(destinationPath);
    const currentContent = exists ? fs.readFileSync(destinationPath, 'utf8') : '';
    const proposedContent = doc.action === 'skip'
      ? currentContent
      : mergeManagedBlock(currentContent, doc.content);
    const changed = currentContent.replace(/\r\n/g, '\n') !== proposedContent.replace(/\r\n/g, '\n');
    const action = doc.action === 'skip' || !changed ? 'skip' : exists ? 'update' : 'create';

    return {
      path: doc.path,
      destinationPath,
      action,
      reason: action === 'skip' ? 'already up to date or skipped by proposal' : doc.reason,
      exists,
      dirty: exists && action === 'update' && currentContent.trim().length > 0,
      currentContent,
      proposedContent,
      before_sha256: exists ? sha256(currentContent) : null,
      after_sha256: action === 'skip' ? (exists ? sha256(currentContent) : null) : sha256(proposedContent),
      diff: buildDiffSnippet(doc.path, currentContent, proposedContent),
    };
  });
}

function createAnalyzeProjectSnapshot(repoRoot, run, writePlan, options = {}) {
  const now = options.now || new Date();
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const snapshotRoot = path.join(repoRoot, '.quiver', 'runs', run.run_id, 'snapshots', stamp);
  const rawRoot = path.join(repoRoot, '.quiver', 'runs', run.run_id, 'raw');
  const manifest = {
    schema_version: 1,
    kind: 'quiver-analyze-project-write-manifest',
    run_id: run.run_id,
    created_at: now.toISOString(),
    entries: [],
    restore_guidance: 'Copy a snapshot_path back to path to restore a previous file, or delete created files listed with existed=false.',
  };

  fs.mkdirSync(snapshotRoot, { recursive: true });
  fs.mkdirSync(rawRoot, { recursive: true });

  for (const item of writePlan) {
    if (item.action === 'skip') {
      continue;
    }
    const entry = {
      path: item.path,
      action: item.action,
      existed: item.exists,
      dirty: item.dirty,
      before_sha256: item.before_sha256,
      after_sha256: item.after_sha256,
      snapshot_path: null,
      restore_hint: item.exists ? `Copy snapshot_path back to ${item.path}.` : `Delete ${item.path} to undo this created file.`,
    };

    if (item.exists) {
      const snapshotPath = path.join(snapshotRoot, item.path);
      fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
      fs.copyFileSync(item.destinationPath, snapshotPath);
      entry.snapshot_path = path.relative(repoRoot, snapshotPath).split(path.sep).join('/');
    }
    manifest.entries.push(entry);
  }

  const providerArtifactPath = path.join(rawRoot, 'analyze-project-provider-artifact.json');
  const providerArtifact = options.providerArtifact
    ? JSON.parse(redactSensitiveLocalValues(JSON.stringify(options.providerArtifact), { projectRoot: repoRoot }))
    : null;
  fs.writeFileSync(providerArtifactPath, `${JSON.stringify(providerArtifact, null, 2)}\n`);

  const proposalPath = path.join(rawRoot, 'analyze-project-doc-proposal.json');
  fs.writeFileSync(proposalPath, `${JSON.stringify(options.proposal || null, null, 2)}\n`);

  const manifestPath = path.join(snapshotRoot, 'manifest.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  return {
    root: path.relative(repoRoot, snapshotRoot).split(path.sep).join('/'),
    manifestPath: path.relative(repoRoot, manifestPath).split(path.sep).join('/'),
    providerArtifactPath: path.relative(repoRoot, providerArtifactPath).split(path.sep).join('/'),
    proposalPath: path.relative(repoRoot, proposalPath).split(path.sep).join('/'),
    entries: manifest.entries,
  };
}

function writeAnalyzeProjectDocs(writePlan) {
  const writtenDocs = [];
  for (const item of writePlan) {
    if (item.action === 'skip') {
      continue;
    }
    fs.mkdirSync(path.dirname(item.destinationPath), { recursive: true });
    const tempPath = `${item.destinationPath}.quiver-tmp-${process.pid}-${Date.now()}`;
    fs.writeFileSync(tempPath, item.proposedContent);
    fs.renameSync(tempPath, item.destinationPath);
    writtenDocs.push(item.path);
  }
  return writtenDocs;
}

function formatAnalyzeProjectDiffPreview(writePlan) {
  const lines = [];
  for (const item of writePlan) {
    if (item.action === 'skip') {
      continue;
    }
    lines.push(...item.diff);
  }
  return lines.length > 0 ? lines : ['- no changes'];
}

module.exports = {
  ANALYZE_DOC_PROPOSAL_KIND,
  ANALYZE_DOC_PROPOSAL_SCHEMA_VERSION,
  ANALYZE_MANAGED_END,
  ANALYZE_MANAGED_START,
  AnalyzeProjectDocsError,
  analyzeProjectDocProposalSchema,
  buildAnalyzeProjectDocProposal,
  buildAnalyzeProjectWritePlan,
  createAnalyzeProjectSnapshot,
  formatAnalyzeProjectDiffPreview,
  mergeManagedBlock,
  normalizeAnalyzeProjectDocProposal,
  parseAnalyzeProjectDocProposal,
  writeAnalyzeProjectDocs,
};
