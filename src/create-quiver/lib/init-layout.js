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

const CORE_VISIBLE_DIRECTORIES = ['docs', 'docs/ai', '.quiver', '.quiver/scans'];
const MINIMAL_VISIBLE_FILES = [
  'README.md',
  'AGENTS.md',
  '.gitignore',
  'docs/AI_CONTEXT.md',
  'docs/AI_ONBOARDING_PROMPT.md',
  'docs/COMMANDS.md',
  'docs/WORKFLOW.md',
  'docs/ai/PRINCIPLES.md',
  'docs/ai/RULES.yaml',
  'package.json',
  '.quiver/state.json',
  '.quiver/config.json',
  '.quiver/.gitignore',
];

const DEFAULT_VISIBLE_EXTRAS = [
  'docs/CONTEXTO.md',
  'docs/DECISIONS.md',
  'docs/INDEX.md',
  'docs/STATUS.md',
  'docs/SUPPORT_MATRIX.md',
  'docs/TROUBLESHOOTING.md',
  'docs/TESTING_GUIDE_FOR_AI.md',
  'docs/GITFLOW_PR_GUIDE.md',
  'docs/ai/LESSONS.md',
];

const FULL_VISIBLE_EXTRAS = [
  'docs/SEARCH.md',
  'docs/MULTI_AGENT_WORKFLOW.md',
  'docs/MOCK_DATA_GUIDE.md',
  'docs/UI_STANDARDS.md',
  'docs/DOCUMENTATION_GUIDE.md',
  'docs/examples/plan.md',
  'docs/examples/graph.md',
  'docs/examples/next.md',
];

const LEGACY_SCRIPT_FILES = [
  'tools/scripts/start-slice.sh',
  'tools/scripts/refresh-active-slices.sh',
  'tools/scripts/check-slice-readiness.sh',
  'tools/scripts/check-pr-readiness.sh',
  'tools/scripts/cleanup-slice.sh',
  'tools/scripts/check-scope.sh',
  'tools/scripts/migrate-project.sh',
];

const FULL_DIRECTORIES = [
  'docs-template',
  'docs/examples',
  'tools/scripts',
];

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
    'evidence/',
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

function resolveInitVisibleFiles(profile, projectSlug) {
  if (profile === 'minimal') {
    return [...MINIMAL_VISIBLE_FILES];
  }

  if (profile === 'full') {
    return [
      ...MINIMAL_VISIBLE_FILES,
      ...DEFAULT_VISIBLE_EXTRAS,
      ...FULL_VISIBLE_EXTRAS,
      `specs/${projectSlug}/SPEC.md`,
      `specs/${projectSlug}/HANDOFF.md`,
      `specs/${projectSlug}/STATUS.md`,
      `specs/${projectSlug}/EVIDENCE_REPORT.md`,
      `specs/${projectSlug}/slices/slice-template/slice.json`,
      `specs/${projectSlug}/slices/slice-template/pr.md.template`,
    ];
  }

  return [...MINIMAL_VISIBLE_FILES, ...DEFAULT_VISIBLE_EXTRAS];
}

function resolveInitVisibleDirectories(profile, projectSlug) {
  const directories = [...CORE_VISIBLE_DIRECTORIES];

  if (profile === 'full') {
    directories.push(...FULL_DIRECTORIES);
    directories.push(`specs/${projectSlug}`);
    directories.push(`specs/${projectSlug}/slices`);
    directories.push(`specs/${projectSlug}/slices/slice-template`);
  }

  return directories;
}

function resolveInitPackageScripts(profile, options = {}) {
  const baseScripts = {
    'quiver:migrate': 'npx create-quiver migrate',
    'quiver:analyze': 'npx create-quiver analyze',
    'quiver:flow': 'npx create-quiver flow',
    'quiver:prepare': 'npx create-quiver prepare',
    'quiver:plan': 'npx create-quiver plan',
    'quiver:graph': 'npx create-quiver graph',
    'quiver:next': 'npx create-quiver next',
    'quiver:doctor': 'npx create-quiver doctor',
    'quiver:evidence': 'npx create-quiver evidence',
    'quiver:ai:agent': 'npx create-quiver ai agent',
    'quiver:ai:onboard': 'npx create-quiver ai onboard',
    'quiver:ai:plan': 'npx create-quiver ai plan',
    'quiver:ai:review-plan': 'npx create-quiver ai review-plan',
    'quiver:ai:approve': 'npx create-quiver ai approve',
    'quiver:ai:prompt-slice': 'npx create-quiver ai prompt-slice',
    'quiver:ai:execute-slice': 'npx create-quiver ai execute-slice',
    'quiver:ai:execute-plan': 'npx create-quiver ai execute-plan',
    'quiver:ai:pr': 'npx create-quiver ai pr',
    'quiver:ai:doctor': 'npx create-quiver ai doctor',
    'quiver:spec:create': 'npx create-quiver spec create',
    'quiver:spec:start': 'npx create-quiver spec start',
    'quiver:spec:status': 'npx create-quiver spec status',
    'quiver:spec:close': 'npx create-quiver spec close',
    'quiver:start-slice': 'npx create-quiver start-slice',
    'quiver:check-slice': 'npx create-quiver check-slice',
    'quiver:check-pr': 'npx create-quiver check-pr',
    'quiver:check-handoff': 'npx create-quiver check-handoff',
    'check-handoff': 'npx create-quiver check-handoff',
    'quiver:cleanup-slice': 'npx create-quiver cleanup-slice',
    'quiver:check-scope': 'npx create-quiver check-scope',
    'quiver:refresh-active-slices': 'npx create-quiver refresh-active-slices',
  };

  if (profile === 'full' || options.legacyScripts === true) {
    return {
      ...baseScripts,
      'check:slice': 'bash tools/scripts/check-slice-readiness.sh',
      'check:pr': 'bash tools/scripts/check-pr-readiness.sh',
      'start:slice': 'bash tools/scripts/start-slice.sh',
      'cleanup:slice': 'bash tools/scripts/cleanup-slice.sh',
      'check:scope': 'bash tools/scripts/check-scope.sh',
      'refresh:active-slices': 'bash tools/scripts/refresh-active-slices.sh',
      migrate: 'bash tools/scripts/migrate-project.sh',
    };
  }

  return baseScripts;
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

  const visibleDirectories = resolveInitVisibleDirectories(profile, projectSlug);
  const visibleFiles = resolveInitVisibleFiles(profile, projectSlug);

  for (const directory of visibleDirectories) {
    pushPlannedOperation(operations, projectRoot, directory, 'directory', 'create', 'core visible contract directory', profile, 'visible');
  }

  for (const file of visibleFiles) {
    const updateMode = file === 'package.json' || file === '.gitignore';
    pushPlannedOperation(
      operations,
      projectRoot,
      file,
      'file',
      updateMode ? 'update' : 'create',
      updateMode ? 'prepare project metadata or ignored paths' : 'core visible contract file',
      profile,
      'visible',
    );
  }

  if (profile === 'full') {
    for (const file of LEGACY_SCRIPT_FILES) {
      pushStaticOperation(operations, file, 'file', 'create', 'legacy Bash wrapper', profile, 'compatibility');
    }
  } else if (normalized.legacyScripts) {
    for (const file of LEGACY_SCRIPT_FILES) {
      pushStaticOperation(operations, file, 'file', 'create', 'legacy Bash wrapper', profile, 'compatibility');
    }
  }

  if (normalized.includeTemplates) {
    pushStaticOperation(operations, '.quiver/templates/', 'directory', 'create', 'export packaged templates into .quiver/templates', profile, 'internal');
  }

  const ignoredPaths = [];
  if (profile !== 'full') {
    ignoredPaths.push('docs-template/');
    if (!normalized.legacyScripts) {
      ignoredPaths.push('tools/scripts/');
    }
    ignoredPaths.push(`specs/${projectSlug}/`);
  }

  if (!normalized.includeTemplates) {
    ignoredPaths.push('.quiver/templates/');
  }

  if (profile !== 'full') {
    const visibleSet = new Set(visibleFiles);
    for (const file of resolveInitVisibleFiles('full', projectSlug)) {
      if (!visibleSet.has(file)) {
        ignoredPaths.push(file);
      }
    }
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
      ignore: [...new Set(ignoredPaths)].length,
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
  resolveInitPackageScripts,
  resolveInitVisibleDirectories,
  resolveInitVisibleFiles,
  quiverInternalPaths,
  resolveInitProfile,
  toProjectSlug,
};
