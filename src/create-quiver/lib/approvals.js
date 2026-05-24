const fs = require('node:fs');
const path = require('node:path');

const { quiverInternalPaths } = require('./init-layout');

const PLANNER_APPROVAL_PHASES = Object.freeze(['acceptance', 'technical-plan']);
const APPROVAL_DEPENDENCIES = Object.freeze({
  acceptance: null,
  'technical-plan': 'acceptance',
  spec: 'technical-plan',
});

function formatError(message) {
  return `create-quiver: ${message}`;
}

function normalizePhase(phase) {
  const normalized = String(phase || '').trim().toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(APPROVAL_DEPENDENCIES, normalized)) {
    throw new Error(formatError(`unsupported approval phase '${phase}'`));
  }
  return normalized;
}

function approvalRoot(projectRoot, phase) {
  return path.join(quiverInternalPaths(projectRoot).root, 'approvals', normalizePhase(phase));
}

function approvalDraftPath(projectRoot, phase) {
  return path.join(approvalRoot(projectRoot, phase), 'draft.md');
}

function approvalDraftsDir(projectRoot, phase) {
  return path.join(approvalRoot(projectRoot, phase), 'drafts');
}

function approvalDraftVersionPath(projectRoot, phase, version) {
  const padded = String(version).padStart(3, '0');
  return path.join(approvalDraftsDir(projectRoot, phase), `${padded}.md`);
}

function approvalApprovedPath(projectRoot, phase) {
  return path.join(approvalRoot(projectRoot, phase), 'approved.md');
}

function approvalMetaPath(projectRoot, phase) {
  return path.join(approvalRoot(projectRoot, phase), 'meta.json');
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function toRelativePosix(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function readTextFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(formatError(`missing approval input file: ${filePath}`));
  }

  return fs.readFileSync(filePath, 'utf8');
}

function readApprovalMeta(projectRoot, phase) {
  const metaPath = approvalMetaPath(projectRoot, phase);
  if (!fs.existsSync(metaPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  } catch (error) {
    throw new Error(formatError(`invalid approval metadata at ${toRelativePosix(projectRoot, metaPath)}: ${error.message}`));
  }
}

function normalizeDrafts(meta) {
  return Array.isArray(meta?.drafts) ? meta.drafts.filter((item) => item && typeof item === 'object') : [];
}

function nextDraftVersion(meta) {
  const versions = normalizeDrafts(meta)
    .map((item) => Number(item.version))
    .filter((value) => Number.isInteger(value) && value > 0);
  return versions.length > 0 ? Math.max(...versions) + 1 : 1;
}

function findDraftVersion(meta, version) {
  const parsed = Number(version);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(formatError(`invalid draft version: ${version}`));
  }
  return normalizeDrafts(meta).find((item) => Number(item.version) === parsed) || null;
}

function latestDraftVersion(meta) {
  const draftVersion = Number(meta?.draft?.version || 0);
  if (Number.isInteger(draftVersion) && draftVersion > 0) {
    return draftVersion;
  }

  const versions = normalizeDrafts(meta)
    .map((item) => Number(item.version))
    .filter((value) => Number.isInteger(value) && value > 0);
  return versions.length > 0 ? Math.max(...versions) : null;
}

function readPhaseApproval(projectRoot, phase) {
  const normalizedPhase = normalizePhase(phase);
  const draftPath = approvalDraftPath(projectRoot, normalizedPhase);
  const approvedPath = approvalApprovedPath(projectRoot, normalizedPhase);
  const meta = readApprovalMeta(projectRoot, normalizedPhase);

  if (!meta && !fs.existsSync(draftPath) && !fs.existsSync(approvedPath)) {
    return {
      phase: normalizedPhase,
      status: 'missing',
      draft: null,
      approved: null,
      meta: null,
    };
  }

  const draft = fs.existsSync(draftPath)
    ? {
        path: toRelativePosix(projectRoot, draftPath),
        contents: fs.readFileSync(draftPath, 'utf8'),
      }
    : null;
  const approved = fs.existsSync(approvedPath)
    ? {
        path: toRelativePosix(projectRoot, approvedPath),
        contents: fs.readFileSync(approvedPath, 'utf8'),
      }
    : null;

  const approvedSource = meta?.approved || null;
  const draftSource = meta?.draft || null;
  const stale = Boolean(
    approvedSource
    && approvedSource.source_file
    && !fs.existsSync(path.resolve(projectRoot, approvedSource.source_file))
    && !approvedSource.source_file.startsWith('.quiver/approvals/'),
  ) || Boolean(
    draftSource?.created_at
    && approvedSource?.approved_at
    && new Date(draftSource.created_at).getTime() > new Date(approvedSource.approved_at).getTime(),
  ) || Boolean(
    draftSource?.version
    && approvedSource?.version
    && Number(draftSource.version) > Number(approvedSource.version),
  );

  let status = 'missing';
  if (approved) {
    status = stale ? 'stale' : 'approved';
  } else if (draft) {
    status = 'draft';
  }

  return {
    phase: normalizedPhase,
    status,
    draft,
    approved,
    meta,
  };
}

function renderApprovalStatus(report) {
  if (!report || report.status === 'missing') {
    return `missing ${report ? report.phase : 'approval'} approval`;
  }

  if (report.status === 'draft') {
    return `draft ready for ${report.phase}`;
  }

  if (report.status === 'stale') {
    return `stale ${report.phase} approval`;
  }

  return `approved ${report.phase}`;
}

function writeApprovalArtifacts(projectRoot, phase, kind, sourceFile, contents, options = {}) {
  const normalizedPhase = normalizePhase(phase);
  const root = approvalRoot(projectRoot, normalizedPhase);
  ensureDir(root);

  const filePath = kind === 'approved'
    ? approvalApprovedPath(projectRoot, normalizedPhase)
    : approvalDraftPath(projectRoot, normalizedPhase);
  const now = new Date().toISOString();
  const current = readApprovalMeta(projectRoot, normalizedPhase) || {};
  const nextMeta = {
    phase: normalizedPhase,
    drafts: normalizeDrafts(current),
    draft: current.draft || null,
    approved: current.approved || null,
  };
  let finalContents = `${contents}`;
  let version = null;
  let rawArtifactPath = options.rawArtifactPath || null;
  let outputSource = options.outputSource || null;
  let inputCompaction = options.inputCompaction || null;

  if (kind === 'approved' && !options.version) {
    throw new Error(formatError(`${normalizedPhase} approval requires a concrete draft version. Use --version <n>.`));
  }

  if (kind === 'approved' && options.version) {
    const latestVersion = latestDraftVersion(current);
    const selectedDraft = findDraftVersion(current, options.version);
    if (!selectedDraft) {
      throw new Error(formatError(`missing ${normalizedPhase} draft version ${options.version}`));
    }
    if (latestVersion && Number(selectedDraft.version) !== latestVersion) {
      throw new Error(formatError(`${normalizedPhase} draft version ${options.version} is not current; latest draft version is ${latestVersion}. Approve the latest version or revise again.`));
    }
    const draftPath = path.resolve(projectRoot, selectedDraft.path);
    if (!fs.existsSync(draftPath)) {
      throw new Error(formatError(`missing ${normalizedPhase} draft artifact: ${selectedDraft.path}`));
    }
    finalContents = fs.readFileSync(draftPath, 'utf8');
    sourceFile = selectedDraft.path;
    version = Number(selectedDraft.version);
    rawArtifactPath = rawArtifactPath || selectedDraft.raw_artifact_path || null;
    outputSource = outputSource || selectedDraft.output_source || null;
    inputCompaction = inputCompaction || selectedDraft.input_compaction || null;
  }

  if (kind === 'draft') {
    version = nextDraftVersion(current);
    const versionPath = approvalDraftVersionPath(projectRoot, normalizedPhase, version);
    ensureDir(path.dirname(versionPath));
    fs.writeFileSync(versionPath, finalContents);

    nextMeta.drafts = nextMeta.drafts.concat({
      version,
      phase: normalizedPhase,
      source_file: toRelativePosix(projectRoot, path.resolve(projectRoot, sourceFile)),
      path: toRelativePosix(projectRoot, versionPath),
      created_at: now,
      raw_artifact_path: rawArtifactPath,
      output_source: outputSource,
      input_compaction: inputCompaction,
    });
  }

  fs.writeFileSync(filePath, finalContents);

  nextMeta[kind] = {
    phase: normalizedPhase,
    source_file: toRelativePosix(projectRoot, path.resolve(projectRoot, sourceFile)),
    path: toRelativePosix(projectRoot, filePath),
    version,
    created_at: now,
    raw_artifact_path: rawArtifactPath,
    output_source: outputSource,
    input_compaction: inputCompaction,
    ...(kind === 'approved' ? { approved_at: now } : {}),
  };

  if (kind === 'draft' && nextMeta.approved && nextMeta.approved.approved_at) {
    nextMeta.approved = {
      ...nextMeta.approved,
    };
  }

  fs.writeFileSync(approvalMetaPath(projectRoot, normalizedPhase), `${JSON.stringify(nextMeta, null, 2)}\n`);

  return {
    phase: normalizedPhase,
    kind,
    filePath,
    metaPath: approvalMetaPath(projectRoot, normalizedPhase),
    createdAt: now,
    version,
  };
}

function savePlannerDraft(projectRoot, phase, sourceFile, contents, options = {}) {
  return writeApprovalArtifacts(projectRoot, phase, 'draft', sourceFile, contents, options);
}

function approvePlannerPhase(projectRoot, phase, sourceFile, contents, options = {}) {
  return writeApprovalArtifacts(projectRoot, phase, 'approved', sourceFile, contents, options);
}

function resolveApprovedPlannerInput(projectRoot, phase, explicitInput) {
  const normalizedPhase = normalizePhase(phase);
  const dependencyPhase = APPROVAL_DEPENDENCIES[normalizedPhase];

  if (!dependencyPhase) {
    return {
      phase: normalizedPhase,
      inputPath: explicitInput || null,
      approval: null,
    };
  }

  const approval = readPhaseApproval(projectRoot, dependencyPhase);
  if (approval.status !== 'approved') {
    throw new Error(formatError(`ai plan phase '${normalizedPhase}' requires approved ${dependencyPhase} input; current status: ${approval.status}. Run \`npx create-quiver ai approve --phase ${dependencyPhase} --version <n>\`.`));
  }

  const approvedPath = approval.approved?.path ? path.resolve(projectRoot, approval.approved.path) : '';
  const approvedSource = approval.meta?.approved?.source_file ? path.resolve(projectRoot, approval.meta.approved.source_file) : '';

  if (!explicitInput) {
    return {
      phase: normalizedPhase,
      inputPath: approval.approved.path,
      approval,
    };
  }

  const resolvedExplicit = path.resolve(projectRoot, explicitInput);
  const matchesApprovedArtifact = approvedPath && resolvedExplicit === approvedPath;
  const matchesApprovedSource = approvedSource && resolvedExplicit === approvedSource;

  if (!matchesApprovedArtifact && !matchesApprovedSource) {
    throw new Error(formatError(`ai plan phase '${normalizedPhase}' requires approved ${dependencyPhase} input; '${explicitInput}' is not the approved source.`));
  }

  return {
    phase: normalizedPhase,
    inputPath: approval.approved.path,
    approval,
  };
}

function summarizePlannerApproval(projectRoot, phase) {
  const report = readPhaseApproval(projectRoot, phase);
  const lines = [`Phase: ${report.phase}`, `Status: ${report.status}`];

  if (report.draft) {
    const version = report.meta?.draft?.version ? ` v${report.meta.draft.version}` : '';
    lines.push(`Draft${version}: ${report.draft.path}`);
  }
  const drafts = normalizeDrafts(report.meta);
  if (drafts.length > 0) {
    lines.push('Draft history:');
    for (const draft of drafts) {
      lines.push(`- v${draft.version}: ${draft.path}`);
    }
  }
  if (report.approved) {
    const version = report.meta?.approved?.version ? ` v${report.meta.approved.version}` : '';
    lines.push(`Approved${version}: ${report.approved.path}`);
  }
  if (report.meta?.approved?.source_file) {
    lines.push(`Source file: ${report.meta.approved.source_file}`);
  } else if (report.meta?.draft?.source_file) {
    lines.push(`Source file: ${report.meta.draft.source_file}`);
  }

  return `${lines.join('\n')}\n`;
}

module.exports = {
  APPROVAL_DEPENDENCIES,
  PLANNER_APPROVAL_PHASES,
  approvalApprovedPath,
  approvalDraftPath,
  approvalDraftsDir,
  approvalDraftVersionPath,
  approvalMetaPath,
  approvePlannerPhase,
  findDraftVersion,
  latestDraftVersion,
  normalizePhase,
  readPhaseApproval,
  renderApprovalStatus,
  resolveApprovedPlannerInput,
  savePlannerDraft,
  summarizePlannerApproval,
};
