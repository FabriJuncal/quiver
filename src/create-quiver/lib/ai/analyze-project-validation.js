const fs = require('node:fs');
const path = require('node:path');

const {
  ANALYZE_MANAGED_END,
  ANALYZE_MANAGED_START,
  normalizeAnalyzeProjectDocProposal,
} = require('./analyze-project-docs');
const { normalizeAnalyzeProjectAnalysis } = require('./analyze-project-parser');

const VALIDATION_KIND = 'quiver-analyze-project-post-write-validation';

const PLACEHOLDER_PATTERNS = [
  { issue: 'placeholder-todo', pattern: /\bTODO\b/i },
  { issue: 'placeholder-fixme', pattern: /\bFIXME\b/i },
  { issue: 'placeholder-tbd', pattern: /\bTBD\b/i },
  { issue: 'placeholder-template-token', pattern: /\{\{[^}\n]+\}\}/ },
  { issue: 'placeholder-bracket-token', pattern: /\[(?:TODO|TBD|PLACEHOLDER|REPLACE|INSERT)[^\]\n]*\]/i },
  { issue: 'placeholder-angle-token', pattern: /<(?:TODO|TBD|PLACEHOLDER|REPLACE|INSERT)[^>\n]*>/i },
  { issue: 'placeholder-unfinished', pattern: /to be completed after implementation/i },
];

const FACT_KEY_ALIASES = new Map([
  ['app', 'product'],
  ['application', 'product'],
  ['auth', 'auth'],
  ['authentication', 'auth'],
  ['backend', 'backend'],
  ['database', 'database'],
  ['db', 'database'],
  ['frontend', 'frontend'],
  ['framework', 'framework'],
  ['package manager', 'package_manager'],
  ['package_manager', 'package_manager'],
  ['persistence', 'database'],
  ['product', 'product'],
  ['stack', 'stack'],
]);

function toPosix(filePath) {
  return String(filePath || '').replace(/\\/g, '/');
}

function makeIssue(pathName, issue, message, extra = {}) {
  return {
    path: pathName || null,
    issue,
    message,
    ...extra,
  };
}

function extractManagedBlock(content) {
  const text = String(content || '');
  const start = text.indexOf(ANALYZE_MANAGED_START);
  const end = text.indexOf(ANALYZE_MANAGED_END);
  if (start < 0 || end <= start) {
    return {
      ok: false,
      content: '',
      issue: start < 0 && end < 0 ? 'managed-block-missing' : 'managed-block-unbalanced',
    };
  }
  return {
    ok: true,
    content: text.slice(start + ANALYZE_MANAGED_START.length, end),
    issue: '',
  };
}

function readRelativeFile(repoRoot, relativePath) {
  const normalized = toPosix(relativePath);
  const absolute = path.resolve(repoRoot, normalized);
  const repo = path.resolve(repoRoot);
  const relative = path.relative(repo, absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return {
      ok: false,
      path: normalized,
      content: '',
      issue: 'path-outside-repo',
      message: `path is outside repository: ${normalized}`,
    };
  }
  if (!fs.existsSync(absolute)) {
    return {
      ok: false,
      path: normalized,
      content: '',
      issue: 'missing-written-doc',
      message: `written doc is missing: ${normalized}`,
    };
  }
  return {
    ok: true,
    path: normalized,
    content: fs.readFileSync(absolute, 'utf8'),
  };
}

function collectChangedDocPaths(report) {
  const fromWritten = Array.isArray(report?.written_docs) ? report.written_docs : [];
  const fromPlan = Array.isArray(report?.write_plan)
    ? report.write_plan.filter((item) => item.action && item.action !== 'skip').map((item) => item.path)
    : [];
  return [...new Set([...fromWritten, ...fromPlan].map(toPosix).filter(Boolean))].sort();
}

function addSchemaValidation(report, errors) {
  try {
    normalizeAnalyzeProjectAnalysis(report.analysis, {
      selectedFiles: report.selected_files || [],
      promptFiles: report.prompt?.files || [],
    });
  } catch (error) {
    for (const issue of error.issues || []) {
      errors.push(makeIssue(issue.path, issue.issue || 'analysis-schema-invalid', issue.message || error.message));
    }
  }

  try {
    normalizeAnalyzeProjectDocProposal(report.doc_proposal);
  } catch (error) {
    for (const issue of error.issues || []) {
      errors.push(makeIssue(issue.path || issue.pathName, issue.issue || 'doc-proposal-schema-invalid', issue.message || error.message));
    }
  }
}

function addManifestValidation(repoRoot, report, errors) {
  if (!report?.snapshot?.manifestPath) {
    errors.push(makeIssue('snapshot.manifestPath', 'snapshot-manifest-missing', 'snapshot manifest path is missing from write report.'));
    return;
  }

  const manifest = readRelativeFile(repoRoot, report.snapshot.manifestPath);
  if (!manifest.ok) {
    errors.push(makeIssue(manifest.path, manifest.issue, manifest.message));
    return;
  }

  try {
    const parsed = JSON.parse(manifest.content);
    const expectedPaths = collectChangedDocPaths(report);
    const manifestPaths = new Set((parsed.entries || []).map((entry) => toPosix(entry.path)));
    for (const expectedPath of expectedPaths) {
      if (!manifestPaths.has(expectedPath)) {
        errors.push(makeIssue(expectedPath, 'snapshot-manifest-entry-missing', `snapshot manifest does not contain an entry for ${expectedPath}.`));
      }
    }
  } catch (error) {
    errors.push(makeIssue(report.snapshot.manifestPath, 'snapshot-manifest-invalid-json', error.message));
  }
}

function addPlaceholderValidation(docPath, managedContent, errors) {
  for (const { issue, pattern } of PLACEHOLDER_PATTERNS) {
    if (pattern.test(managedContent)) {
      errors.push(makeIssue(docPath, issue, `critical placeholder remains in generated managed block: ${issue}`));
    }
  }
}

function normalizeFactValue(value) {
  return String(value || '')
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.;,]+$/g, '')
    .toLowerCase();
}

function isUnknownFactValue(value) {
  const normalized = normalizeFactValue(value);
  return !normalized
    || normalized === 'unknown'
    || normalized === 'none'
    || normalized === 'n/a'
    || normalized === 'needs confirmation'
    || normalized === 'needs_confirmation'
    || normalized === 'to confirm'
    || normalized === 'not confirmed';
}

function extractFactEntries(docPath, managedContent) {
  const facts = new Map();
  const lines = String(managedContent || '').split(/\r?\n/);

  for (const [index, rawLine] of lines.entries()) {
    const line = rawLine
      .replace(/^#+\s*/, '')
      .replace(/^[-*]\s*/, '')
      .trim();
    const match = line.match(/^([A-Za-z _-]{2,32})\s*:\s*(.+)$/);
    if (!match) {
      continue;
    }

    const rawKey = match[1].trim().toLowerCase().replace(/[-\s]+/g, ' ');
    const key = FACT_KEY_ALIASES.get(rawKey);
    if (!key) {
      continue;
    }

    const value = match[2].trim();
    if (isUnknownFactValue(value)) {
      continue;
    }

    if (!facts.has(key)) {
      facts.set(key, []);
    }
    facts.get(key).push({
      path: docPath,
      line: index + 1,
      value,
      normalized: normalizeFactValue(value),
    });
  }

  return facts;
}

function addFactConflicts(docsByPath, warnings, errors, options = {}) {
  const projectMap = docsByPath.get('docs/PROJECT_MAP.md');
  if (!projectMap?.managedBlock?.ok) {
    return;
  }

  const projectFacts = extractFactEntries('docs/PROJECT_MAP.md', projectMap.managedBlock.content);
  const contextPaths = ['docs/CONTEXTO.md', 'docs/AI_CONTEXT.md'];

  for (const contextPath of contextPaths) {
    const contextDoc = docsByPath.get(contextPath);
    if (!contextDoc?.managedBlock?.ok) {
      continue;
    }
    const contextFacts = extractFactEntries(contextPath, contextDoc.managedBlock.content);
    for (const [key, entries] of contextFacts.entries()) {
      const mapEntries = projectFacts.get(key) || [];
      for (const contextEntry of entries) {
        for (const mapEntry of mapEntries) {
          if (contextEntry.normalized === mapEntry.normalized) {
            continue;
          }
          const issue = makeIssue(contextPath, 'deterministic-doc-conflict', `${contextPath} says ${key}=${contextEntry.value}, but docs/PROJECT_MAP.md says ${key}=${mapEntry.value}.`, {
            key,
            project_map_value: mapEntry.value,
            context_value: contextEntry.value,
          });
          if (options.strict === true) {
            errors.push(issue);
          } else {
            warnings.push(issue);
          }
        }
      }
    }
  }
}

function validateAnalyzeProjectPostWrite(repoRoot, report, options = {}) {
  const errors = [];
  const warnings = [];
  const checkedDocs = [];
  const docsByPath = new Map();

  addSchemaValidation(report || {}, errors);
  addManifestValidation(repoRoot, report || {}, errors);

  for (const docPath of collectChangedDocPaths(report || {})) {
    const file = readRelativeFile(repoRoot, docPath);
    checkedDocs.push(docPath);
    if (!file.ok) {
      errors.push(makeIssue(file.path, file.issue, file.message));
      continue;
    }

    const managedBlock = extractManagedBlock(file.content);
    docsByPath.set(docPath, {
      content: file.content,
      managedBlock,
    });
    if (!managedBlock.ok) {
      errors.push(makeIssue(docPath, managedBlock.issue, `Quiver managed block is missing or unbalanced in ${docPath}.`));
      continue;
    }
    addPlaceholderValidation(docPath, managedBlock.content, errors);
  }

  addFactConflicts(docsByPath, warnings, errors, { strict: options.strict === true });

  return {
    schema_version: 1,
    kind: VALIDATION_KIND,
    strict: options.strict === true,
    ok: errors.length === 0,
    checked_docs: checkedDocs,
    errors,
    warnings,
  };
}

module.exports = {
  VALIDATION_KIND,
  extractFactEntries,
  extractManagedBlock,
  validateAnalyzeProjectPostWrite,
};
