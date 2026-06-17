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
const CONTEXT_PREP_MANAGED_START = '<!-- quiver:context-prep:start -->';
const CONTEXT_PREP_MANAGED_END = '<!-- quiver:context-prep:end -->';

const CRITICAL_SCAFFOLD_PLACEHOLDER_PATTERNS = [
  /\[Uno o dos parrafos que expliquen el proyecto\.\]/i,
  /\[Frase principal del proyecto\]/i,
  /\[Describe el usuario principal\.\]/i,
  /\[Objetivo actual \d+\]/i,
  /\[Datos sensibles que nunca se guardan\]/i,
  /\[Datos que si se guardan\]/i,
  /\[Medida de seguridad importante\]/i,
  /\[One or two paragraphs? that explain the project\.\]/i,
  /\[Project tagline\]/i,
  /\[Describe the primary user\.\]/i,
  /\[Current goal \d+\]/i,
  /\[Sensitive data that is never stored\]/i,
  /\[Data that is stored\]/i,
  /\[Important security measure\]/i,
  /\[Short project summary\.\]/i,
  /\[Description\]/i,
  /\[TODO: confirm [^\]\n]+\]/i,
  /\[TODO: confirmar [^\]\n]+\]/i,
];

const SCAFFOLD_BOILERPLATE_PATTERNS = [
  /^purpose:\s*"Human-readable project overview"$/i,
  /^applies_when:\s*"onboarding, review"$/i,
  /^supersedes:\s*null$/i,
  /^El stack, package manager y comandos se generan en `docs\/PROJECT_MAP\.md` despues de ejecutar `analyze`\.$/i,
  /^The stack, package manager, and command surface are generated in `docs\/PROJECT_MAP\.md` after analysis\.$/i,
  /^If sos agente IA, lee `AI_CONTEXT\.md`\./i,
  /^Read `AI_CONTEXT\.md` first if you are an AI agent\./i,
  /^Use `npx create-quiver ai prepare-context --dry-run`/i,
  /^TODO: confirm any repo fact/i,
  /^Assumption: missing README_FOR_AI\.md/i,
  /^Pending confirmation:/i,
];

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

function normalizeNewlines(content) {
  return String(content || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function managedBlock(content) {
  return [
    ANALYZE_MANAGED_START,
    normalizeDocContent(content).trimEnd(),
    ANALYZE_MANAGED_END,
    '',
  ].join('\n');
}

function findManagedBlockRange(content, startMarker, endMarker) {
  const text = normalizeNewlines(content);
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker);
  if (start < 0 || end <= start) {
    return null;
  }
  return {
    start,
    end: end + endMarker.length,
    content: text.slice(start + startMarker.length, end),
  };
}

function removeManagedBlock(content, startMarker, endMarker) {
  const text = normalizeNewlines(content);
  const range = findManagedBlockRange(text, startMarker, endMarker);
  if (!range) {
    return {
      content: text,
      removed: false,
      block: '',
    };
  }
  return {
    content: `${text.slice(0, range.start)}${text.slice(range.end)}`.replace(/\n{3,}/g, '\n\n').trimEnd(),
    removed: true,
    block: range.content,
  };
}

function splitFrontmatter(content) {
  const text = normalizeNewlines(content);
  if (!text.startsWith('---\n')) {
    return {
      frontmatter: '',
      body: text,
      valid: false,
      present: false,
    };
  }
  const match = text.slice(4).match(/\n---\n/);
  if (!match || match.index === undefined) {
    return {
      frontmatter: '',
      body: text,
      valid: false,
      present: true,
    };
  }
  const endIndex = 4 + match.index + '\n---\n'.length;
  return {
    frontmatter: text.slice(0, endIndex),
    body: text.slice(endIndex),
    valid: true,
    present: true,
  };
}

function collectCriticalPlaceholders(content) {
  const findings = [];
  const text = normalizeNewlines(content);
  for (const pattern of CRITICAL_SCAFFOLD_PLACEHOLDER_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      findings.push(match[0]);
    }
  }
  return [...new Set(findings)].sort();
}

function isCriticalPlaceholderLine(line) {
  const trimmed = String(line || '').trim();
  return CRITICAL_SCAFFOLD_PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function isScaffoldBoilerplateLine(line) {
  const trimmed = String(line || '')
    .replace(/^[-*]\s+/, '')
    .replace(/^>\s*/, '')
    .trim();
  if (!trimmed) {
    return true;
  }
  if (/^#+\s+/.test(trimmed)) {
    return true;
  }
  if (/^last_updated:\s*"/i.test(trimmed) || /^token_cost:\s*\d+/i.test(trimmed)) {
    return true;
  }
  if (/^Files Considered$|^Assumptions$|^Risks$|^Contradictions$|^Omitted Paths$/i.test(trimmed.replace(/^#+\s*/, ''))) {
    return true;
  }
  return SCAFFOLD_BOILERPLATE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function significantHumanLines(content) {
  return normalizeNewlines(content)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length >= 12)
    .filter((line) => !isCriticalPlaceholderLine(line))
    .filter((line) => !isScaffoldBoilerplateLine(line));
}

function classifyAnalyzeProjectDoc(currentContent) {
  const current = normalizeNewlines(currentContent);
  const frontmatter = splitFrontmatter(current);
  const withoutAnalyze = removeManagedBlock(frontmatter.body, ANALYZE_MANAGED_START, ANALYZE_MANAGED_END);
  const withoutContextPrep = removeManagedBlock(withoutAnalyze.content, CONTEXT_PREP_MANAGED_START, CONTEXT_PREP_MANAGED_END);
  const visibleBody = withoutContextPrep.content.trim();
  const visiblePlaceholders = collectCriticalPlaceholders(visibleBody);
  const contextPrepPlaceholders = collectCriticalPlaceholders(withoutContextPrep.block);
  const humanLines = significantHumanLines(visibleBody);
  const contextPrepHumanLines = significantHumanLines(withoutContextPrep.block);
  const hasManagedOnly = !visibleBody && (withoutAnalyze.removed || withoutContextPrep.removed);

  let classification = 'unknown';
  if (!current.trim()) {
    classification = 'managed_only';
  } else if (hasManagedOnly) {
    classification = 'managed_only';
  } else if (visiblePlaceholders.length > 0 && humanLines.length === 0) {
    classification = 'scaffold';
  } else if (visiblePlaceholders.length > 0 && humanLines.length > 0) {
    classification = 'partial_scaffold';
  } else if (withoutAnalyze.removed || withoutContextPrep.removed) {
    classification = humanLines.length > 0 ? 'mixed' : 'managed_only';
  } else if (humanLines.length > 0) {
    classification = 'human_content';
  }

  return {
    classification,
    frontmatter,
    visible_body: visibleBody,
    has_analyze_project_block: withoutAnalyze.removed,
    has_context_prep_block: withoutContextPrep.removed,
    context_prep_is_scaffold: withoutContextPrep.removed && contextPrepHumanLines.length === 0 && contextPrepPlaceholders.length > 0,
    critical_placeholders: visiblePlaceholders,
    context_prep_placeholders: contextPrepPlaceholders,
    human_line_count: humanLines.length,
  };
}

function composeWithFrontmatter(frontmatter, body) {
  const prefix = frontmatter?.valid ? `${frontmatter.frontmatter.trimEnd()}\n\n` : '';
  return `${prefix}${normalizeDocContent(body)}`;
}

function visibleAnalyzeProjectContent(proposedContent) {
  return normalizeDocContent(proposedContent).trimEnd();
}

function buildPreservedContentSection(content) {
  const body = normalizeNewlines(content).trim();
  if (!body) {
    return '';
  }
  return `## Existing Content Preserved\n\n${body}`;
}

function normalizedMarkdownEquivalent(left, right) {
  return normalizeNewlines(left).trim() === normalizeNewlines(right).trim();
}

function mergeAnalyzeProjectDoc(currentContent, proposedContent) {
  const current = normalizeNewlines(currentContent);
  const proposedVisible = visibleAnalyzeProjectContent(proposedContent);
  const classification = classifyAnalyzeProjectDoc(current);
  const currentWithoutAnalyze = removeManagedBlock(classification.frontmatter.body, ANALYZE_MANAGED_START, ANALYZE_MANAGED_END);
  const currentWithoutContextPrep = removeManagedBlock(currentWithoutAnalyze.content, CONTEXT_PREP_MANAGED_START, CONTEXT_PREP_MANAGED_END);
  const bodyWithoutManaged = currentWithoutContextPrep.content.trim();
  const report = {
    classification: classification.classification,
    strategy: 'preserve-and-update-managed-block',
    scaffold_replaced: false,
    human_content_preserved: false,
    analyze_project_block_replaced: classification.has_analyze_project_block,
    context_prep_removed: false,
    critical_placeholders: classification.critical_placeholders,
    warnings: [],
  };

  let visibleBody;
  if (['scaffold', 'managed_only'].includes(classification.classification)) {
    visibleBody = proposedVisible;
    report.strategy = classification.classification === 'scaffold'
      ? 'replace-scaffold-primary-content'
      : 'replace-managed-only-content';
    report.scaffold_replaced = classification.classification === 'scaffold';
  } else if (['partial_scaffold', 'mixed'].includes(classification.classification)) {
    const cleaned = bodyWithoutManaged
      .split('\n')
      .filter((line) => !isCriticalPlaceholderLine(line))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    const preserved = normalizedMarkdownEquivalent(cleaned, proposedVisible)
      ? ''
      : buildPreservedContentSection(cleaned);
    visibleBody = preserved ? `${proposedVisible}\n\n${preserved}` : proposedVisible;
    report.strategy = 'replace-placeholders-preserve-human-content';
    report.scaffold_replaced = classification.critical_placeholders.length > 0;
    report.human_content_preserved = Boolean(preserved);
  } else {
    visibleBody = bodyWithoutManaged
      ? `${bodyWithoutManaged}\n\n${managedBlock(proposedContent).trimEnd()}`
      : managedBlock(proposedContent).trimEnd();
    report.human_content_preserved = bodyWithoutManaged.trim().length > 0;
    if (classification.classification === 'unknown') {
      report.warnings.push('document classification is unknown; preserved existing content and updated managed block only');
    }
    return {
      content: composeWithFrontmatter(classification.frontmatter, visibleBody),
      report,
    };
  }

  if (classification.has_context_prep_block && (classification.context_prep_is_scaffold || classification.context_prep_placeholders.length > 0)) {
    report.context_prep_removed = true;
  }

  return {
    content: composeWithFrontmatter(
      classification.frontmatter,
      `${visibleBody}\n\n${managedBlock(proposedContent).trimEnd()}`,
    ),
    report,
  };
}

function mergeManagedBlock(currentContent, proposedContent) {
  const current = normalizeNewlines(currentContent);
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

function redactSnapshotValue(value, repoRoot) {
  if (typeof value === 'string') {
    return redactSensitiveLocalValues(value, { projectRoot: repoRoot });
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactSnapshotValue(item, repoRoot));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, redactSnapshotValue(item, repoRoot)]),
    );
  }
  return value;
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
    const merged = doc.action === 'skip'
      ? { content: currentContent, report: { classification: 'skipped', strategy: 'skip' } }
      : mergeAnalyzeProjectDoc(currentContent, doc.content);
    const proposedContent = merged.content;
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
      merge_report: merged.report,
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
    ? redactSnapshotValue(options.providerArtifact, repoRoot)
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
  CONTEXT_PREP_MANAGED_END,
  CONTEXT_PREP_MANAGED_START,
  AnalyzeProjectDocsError,
  analyzeProjectDocProposalSchema,
  buildAnalyzeProjectDocProposal,
  buildAnalyzeProjectWritePlan,
  classifyAnalyzeProjectDoc,
  collectCriticalPlaceholders,
  createAnalyzeProjectSnapshot,
  formatAnalyzeProjectDiffPreview,
  mergeAnalyzeProjectDoc,
  mergeManagedBlock,
  normalizeAnalyzeProjectDocProposal,
  parseAnalyzeProjectDocProposal,
  writeAnalyzeProjectDocs,
};
