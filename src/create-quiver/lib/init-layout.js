const fs = require('fs');
const path = require('path');

function formatError(message) {
  return `create-quiver: ${message}`;
}

function toProjectSlug(projectName) {
  return projectName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'quiver-project';
}

function toRelativePath(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function quiverInternalPaths(projectRoot) {
  const root = path.join(projectRoot, '.quiver');

  return {
    root,
    cacheDir: path.join(root, 'cache'),
    configPath: path.join(root, 'config.json'),
    gitignorePath: path.join(root, '.gitignore'),
    runsDir: path.join(root, 'runs'),
    scansDir: path.join(root, 'scans'),
    statePath: path.join(root, 'state.json'),
    templatesDir: path.join(root, 'templates'),
    worktreesDir: path.join(root, 'worktrees'),
  };
}

function buildQuiverInternalGitignore() {
  return [
    'cache/',
    'runs/',
    'worktrees/',
    '',
  ].join('\n');
}

function buildQuiverConfig(options = {}) {
  return {
    layout_version: options.layoutVersion || 1,
    internal_root: '.quiver',
    scan_path: '.quiver/scans/PROJECT_SCAN.json',
    project_map_path: 'docs/PROJECT_MAP.md',
    templates_path: '.quiver/templates',
  };
}

function normalizeInitLayoutOptions(options = {}) {
  const minimal = options.minimal === true;
  const full = options.full === true;

  if (minimal && full) {
    throw new Error(formatError('init: --minimal and --full are mutually exclusive'));
  }

  return {
    compatibilityAlias: options.compatibilityAlias === true,
    dryRun: options.dryRun === true,
    full,
    includeTemplates: options.includeTemplates === true,
    legacyScripts: options.legacyScripts === true,
    minimal,
    skipInstall: options.skipInstall === true,
  };
}

function resolveInitProfile(normalizedOptions) {
  if (normalizedOptions.full) {
    return 'full';
  }

  if (normalizedOptions.minimal) {
    return 'minimal';
  }

  return 'default';
}

function pushPlannedOperation(operations, targetRoot, relativePath, kind, action, reason, profile, category) {
  const absolutePath = path.join(targetRoot, relativePath);
  const exists = fs.existsSync(absolutePath);
  const effectiveAction = exists
    ? (action === 'update' ? 'update' : 'preserve')
    : 'create';

  operations.push({
    action: effectiveAction,
    category,
    kind,
    path: toRelativePath(relativePath),
    reason,
    exists,
    profile,
  });
}

function pushStaticOperation(operations, relativePath, kind, action, reason, profile, category) {
  operations.push({
    action,
    category,
    kind,
    path: toRelativePath(relativePath),
    reason,
    exists: false,
    profile,
  });
}

function buildInitLayout(projectRoot, options = {}) {
  const normalized = normalizeInitLayoutOptions(options);
  const profile = resolveInitProfile(normalized);
  const projectName = options.projectName || path.basename(projectRoot) || 'Quiver Project';
  const projectSlug = toProjectSlug(projectName);
  const operations = [];
  const risks = [];

  const visibleDirectories = ['docs', 'docs/ai', '.quiver', '.quiver/scans'];
  const visibleFiles = [
    'README.md',
    'AGENTS.md',
    'docs/AI_CONTEXT.md',
    'docs/AI_ONBOARDING_PROMPT.md',
    'package.json',
    '.quiver/state.json',
    '.quiver/config.json',
    '.quiver/.gitignore',
  ];

  const defaultDocs = [
    'docs/COMMANDS.md',
    'docs/WORKFLOW.md',
    'docs/GITFLOW_PR_GUIDE.md',
  ];

  const fullDirectories = [
    'docs-template',
    'tools/scripts',
    `specs/${projectSlug}`,
    `specs/${projectSlug}/slices`,
    `specs/${projectSlug}/slices/slice-template`,
  ];

  const fullFiles = [
    'docs/STATUS.md',
    'docs/DECISIONS.md',
    'docs/INDEX.md',
    'docs/CONTEXTO.md',
    'docs/SUPPORT_MATRIX.md',
    'docs/TROUBLESHOOTING.md',
    'docs/TESTING_GUIDE_FOR_AI.md',
    'docs/SEARCH.md',
    'docs/ai/PRINCIPLES.md',
    'docs/ai/RULES.yaml',
    'docs/ai/LESSONS.md',
    `specs/${projectSlug}/SPEC.md`,
    `specs/${projectSlug}/HANDOFF.md`,
    `specs/${projectSlug}/STATUS.md`,
    `specs/${projectSlug}/EVIDENCE_REPORT.md`,
    `specs/${projectSlug}/slices/slice-template/slice.json`,
    `specs/${projectSlug}/slices/slice-template/pr.md.template`,
  ];

  const legacyScriptFiles = [
    'tools/scripts/start-slice.sh',
    'tools/scripts/refresh-active-slices.sh',
    'tools/scripts/check-slice-readiness.sh',
    'tools/scripts/check-pr-readiness.sh',
    'tools/scripts/cleanup-slice.sh',
    'tools/scripts/check-scope.sh',
    'tools/scripts/migrate-project.sh',
  ];

  const templateExportFiles = [
    '.quiver/templates/',
  ];

  for (const directory of visibleDirectories) {
    pushPlannedOperation(operations, projectRoot, directory, 'directory', 'create', 'core visible contract directory', profile, 'visible');
  }

  for (const file of visibleFiles) {
    pushPlannedOperation(operations, projectRoot, file, 'file', file === 'package.json' ? 'update' : 'create', file === 'package.json' ? 'prepare package metadata and scripts' : 'core visible contract file', profile, 'visible');
  }

  for (const file of defaultDocs) {
    pushPlannedOperation(operations, projectRoot, file, 'file', 'create', 'default onboarding and workflow guidance', profile, 'visible');
  }

  if (profile === 'full') {
    for (const directory of fullDirectories) {
      pushStaticOperation(operations, directory, 'directory', 'create', 'compatibility-heavy full profile directory', profile, 'compatibility');
    }

    for (const file of fullFiles) {
      pushStaticOperation(operations, file, 'file', 'create', 'compatibility-heavy full profile file', profile, 'compatibility');
    }
  }

  if (normalized.legacyScripts) {
    for (const file of legacyScriptFiles) {
      pushStaticOperation(operations, file, 'file', 'create', 'legacy Bash wrapper', profile, 'compatibility');
    }
  }

  if (normalized.includeTemplates) {
    for (const file of templateExportFiles) {
      pushStaticOperation(operations, file, 'directory', 'create', 'export packaged templates into .quiver/templates', profile, 'internal');
    }
  }

  const ignoredPaths = [];
  if (profile !== 'full') {
    ignoredPaths.push('docs-template/');
    ignoredPaths.push('tools/scripts/');
    ignoredPaths.push(`specs/${projectSlug}/`);
  }

  if (!normalized.includeTemplates) {
    ignoredPaths.push('.quiver/templates/');
  }

  if (profile !== 'full') {
    ignoredPaths.push('docs/STATUS.md');
    ignoredPaths.push('docs/DECISIONS.md');
    ignoredPaths.push('docs/INDEX.md');
    ignoredPaths.push('docs/CONTEXTO.md');
    ignoredPaths.push('docs/SUPPORT_MATRIX.md');
    ignoredPaths.push('docs/TROUBLESHOOTING.md');
    ignoredPaths.push('docs/TESTING_GUIDE_FOR_AI.md');
    ignoredPaths.push('docs/SEARCH.md');
    ignoredPaths.push('docs/ai/PRINCIPLES.md');
    ignoredPaths.push('docs/ai/RULES.yaml');
    ignoredPaths.push('docs/ai/LESSONS.md');
  }

  if (normalized.compatibilityAlias) {
    risks.push('compatibility alias path used: npx create-quiver --name');
  }

  if (normalized.dryRun) {
    risks.push('dry-run prints the planned layout only; the write path remains unchanged in this slice');
  }

  const counts = operations.reduce((acc, operation) => {
    acc[operation.action] = (acc[operation.action] || 0) + 1;
    return acc;
  }, {});

  return {
    profile,
    projectName,
    projectSlug,
    targetRoot: path.resolve(projectRoot),
    flags: normalized,
    operations,
    ignoredPaths: [...new Set(ignoredPaths)],
    risks,
    summary: {
      create: counts.create || 0,
      preserve: counts.preserve || 0,
      update: counts.update || 0,
      ignore: ignoredPaths.length,
    },
  };
}

function formatInitLayoutPlan(plan) {
  const lines = [];
  const entryPoint = plan.flags.compatibilityAlias ? 'compatibility alias (--name)' : 'explicit init command';

  lines.push('Init dry-run plan');
  lines.push(`- Project: ${plan.projectName}`);
  lines.push(`- Slug: ${plan.projectSlug}`);
  lines.push(`- Target: ${plan.targetRoot}`);
  lines.push(`- Profile: ${plan.profile}`);
  lines.push(`- Entry point: ${entryPoint}`);
  lines.push(`- Planned create: ${plan.summary.create}`);
  lines.push(`- Planned update: ${plan.summary.update}`);
  lines.push(`- Planned preserve: ${plan.summary.preserve}`);
  lines.push(`- Planned ignore: ${plan.summary.ignore}`);
  lines.push('');

  const grouped = new Map([
    ['create', []],
    ['update', []],
    ['preserve', []],
    ['ignore', plan.ignoredPaths.map((relativePath) => ({ path: relativePath }))],
  ]);

  for (const operation of plan.operations) {
    if (operation.action === 'create' || operation.action === 'update' || operation.action === 'preserve') {
      grouped.get(operation.action).push(operation);
    }
  }

  lines.push('Files and directories to create');
  if (grouped.get('create').length > 0) {
    for (const operation of grouped.get('create')) {
      lines.push(`- ${operation.path}`);
    }
  } else {
    lines.push('- none');
  }

  lines.push('');
  lines.push('Files to update');
  if (grouped.get('update').length > 0) {
    for (const operation of grouped.get('update')) {
      lines.push(`- ${operation.path}`);
    }
  } else {
    lines.push('- none');
  }

  lines.push('');
  lines.push('Files to preserve');
  if (grouped.get('preserve').length > 0) {
    for (const operation of grouped.get('preserve')) {
      lines.push(`- ${operation.path}`);
    }
  } else {
    lines.push('- none');
  }

  lines.push('');
  lines.push('Paths intentionally ignored by this profile');
  if (grouped.get('ignore').length > 0) {
    for (const operation of grouped.get('ignore')) {
      lines.push(`- ${operation.path}`);
    }
  } else {
    lines.push('- none');
  }

  lines.push('');
  lines.push('Risks');
  if (plan.risks.length > 0) {
    for (const risk of plan.risks) {
      lines.push(`- ${risk}`);
    }
  } else {
    lines.push('- none');
  }

  lines.push('');
  return lines.join('\n');
}

module.exports = {
  buildQuiverConfig,
  buildQuiverInternalGitignore,
  buildInitLayout,
  formatInitLayoutPlan,
  normalizeInitLayoutOptions,
  quiverInternalPaths,
  resolveInitProfile,
  toProjectSlug,
};
