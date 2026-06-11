const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { readAllSlices } = require('./slice-graph');
const { hasGeneratedProjectSpec, hasInitializedStateMetadata, readState } = require('./state');
const { worktreeList } = require('./git');
const {
  buildQuiverConfig,
  buildQuiverInternalGitignore,
  resolveInitPackageScripts,
} = require('./init-layout');

const NEW_LAYOUT_REQUIRED_PATHS = [
  'README.md',
  'AGENTS.md',
  'package.json',
  'docs/AI_CONTEXT.md',
  'docs/AI_ONBOARDING_PROMPT.md',
  'docs/COMMANDS.md',
  'docs/WORKFLOW.md',
  '.quiver/state.json',
  '.quiver/config.json',
  '.quiver/.gitignore',
];

const LEGACY_LAYOUT_PROBES = [
  'docs-template/',
  'tools/scripts/start-slice.sh',
  'tools/scripts/check-slice-readiness.sh',
  'tools/scripts/check-pr-readiness.sh',
  '.github/pull_request_template.md',
  'docs/PROJECT_SCAN.json',
];

const ROOT_GITIGNORE_DEFAULTS = [
  'node_modules/',
  '.DS_Store',
  'dist/',
  'coverage/',
];

const AGENTS_SECTION_DEFAULTS = [
  {
    label: 'Purpose',
    pattern: /^Purpose$/m,
    lines: [
      'Purpose',
      '',
      'This file routes AI agents in this repository. Read it before loading broader project context.',
    ],
  },
  {
    label: 'Reading Budget',
    pattern: /^## Reading Budget$/m,
    lines: [
      '## Reading Budget',
      '',
      '- Planning: load only the docs needed for the current requirement.',
      '- Execution: start from the active slice context before reading broad docs.',
      '- Debug: gather the smallest reproducible evidence before proposing fixes.',
    ],
  },
  {
    label: 'Reading Order',
    pattern: /^## Reading Order$/m,
    lines: [
      '## Reading Order',
      '',
      '1. README.md',
      '2. docs/AI_CONTEXT.md',
      '3. docs/PROJECT_MAP.md when architecture or structure facts are needed',
      '4. Active spec/slice docs only when working on an approved slice',
    ],
  },
  {
    label: 'Output Policy',
    pattern: /^## Output Policy$/m,
    lines: [
      '## Output Policy',
      '',
      '- Keep responses concise and actionable.',
      '- Cite files or commands when reporting evidence.',
      '- Do not claim unsupported project facts as confirmed.',
    ],
  },
  {
    label: 'Slice Execution Rules',
    pattern: /^## Slice Execution Rules$/m,
    lines: [
      '## Slice Execution Rules',
      '',
      '- Do not implement code before acceptance criteria and technical plan approval.',
      '- Execute one approved slice at a time.',
      '- Keep changes inside the slice scope unless the handoff explicitly allows expansion.',
    ],
  },
  {
    label: 'Links',
    pattern: /^## Links$/m,
    lines: [
      '## Links',
      '',
      '- AI Context: `./docs/AI_CONTEXT.md`',
      '- Project Map: `./docs/PROJECT_MAP.md`',
      '- Decisions: `./docs/DECISIONS.md`',
      '- Workflow: `./docs/WORKFLOW.md`',
    ],
  },
];

function readTextIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath, 'utf8');
}

function normalizeIgnorePattern(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return trimmed;
  }

  return trimmed.replace(/\/+$/g, '');
}

function missingLineDefaults(existingText, defaults) {
  const seen = new Set(
    String(existingText || '')
      .split(/\r?\n/)
      .map(normalizeIgnorePattern)
      .filter(Boolean),
  );

  return defaults.filter((line) => !seen.has(normalizeIgnorePattern(line)));
}

function appendMissingLines(filePath, lines) {
  const existingText = readTextIfExists(filePath) || '';
  const trimmed = existingText.replace(/\s+$/g, '');
  const prefix = trimmed.length > 0 ? `${trimmed}\n` : '';
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${prefix}${lines.join('\n')}\n`);
}

function countNonEmptyLines(text) {
  return String(text || '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .length;
}

function hasFrontMatter(text) {
  const value = String(text || '');
  if (!value.startsWith('---\n')) {
    return false;
  }

  return value.indexOf('\n---\n', 4) !== -1;
}

function normalizeRelativePath(root, absolutePath) {
  return path.relative(root, absolutePath).split(path.sep).join('/');
}

function hasPath(projectRoot, relativePath) {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function collectPresentPaths(projectRoot, relativePaths) {
  return relativePaths.filter((relativePath) => hasPath(projectRoot, relativePath));
}

function collectMissingPaths(projectRoot, relativePaths) {
  return relativePaths.filter((relativePath) => !hasPath(projectRoot, relativePath));
}

function collectAiMarkdownFiles(projectRoot) {
  const aiDir = path.join(projectRoot, 'docs', 'ai');
  if (!fs.existsSync(aiDir)) {
    return [];
  }

  const files = [];

  const walk = (dirPath) => {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  };

  walk(aiDir);

  return files;
}

function countDocsAiFrontMatterIssues(projectRoot) {
  const files = collectAiMarkdownFiles(projectRoot);
  const missing = [];

  for (const filePath of files) {
    const text = readTextIfExists(filePath);
    if (!text || !hasFrontMatter(text)) {
      missing.push(normalizeRelativePath(projectRoot, filePath));
    }
  }

  return missing;
}

function countAgentsSections(projectRoot) {
  const agentsPath = path.join(projectRoot, 'AGENTS.md');
  const text = readTextIfExists(agentsPath);
  if (!text) {
    return ['AGENTS.md'];
  }

  const missing = AGENTS_SECTION_DEFAULTS
    .filter((section) => !section.pattern.test(text))
    .map((section) => section.label);
  return missing;
}

function buildAgentsContractText(sectionLabels = null) {
  const labels = Array.isArray(sectionLabels) && sectionLabels.length > 0
    ? new Set(sectionLabels)
    : null;
  const selectedSections = AGENTS_SECTION_DEFAULTS.filter((section) => !labels || labels.has(section.label));
  const lines = labels ? [] : ['# AGENTS Router', ''];
  for (const [index, section] of selectedSections.entries()) {
    if (lines.length > 0 && lines[lines.length - 1] !== '') {
      lines.push('');
    }
    if (index > 0 && lines[lines.length - 1] !== '') {
      lines.push('');
    }
    lines.push(...section.lines);
  }
  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n')}\n`;
}

function countTieredPackSizeWarnings(projectRoot) {
  const warnings = [];

  const quickPath = path.join(projectRoot, 'docs', 'ai', 'QUICK.md');
  const quickText = readTextIfExists(quickPath);
  if (quickText && countNonEmptyLines(quickText) > 50) {
    warnings.push(`docs/ai/QUICK.md exceeds the 50 non-empty line budget (${countNonEmptyLines(quickText)})`);
  }

  const standardPath = path.join(projectRoot, 'docs', 'ai', 'STANDARD.md');
  const standardText = readTextIfExists(standardPath);
  if (standardText && countNonEmptyLines(standardText) > 300) {
    warnings.push(`docs/ai/STANDARD.md exceeds the 300 non-empty line budget (${countNonEmptyLines(standardText)})`);
  }

  return warnings;
}

function countActiveSliceOrphans(projectRoot) {
  const activeSlicePath = path.join(projectRoot, 'docs', 'ai', 'ACTIVE_SLICE.md');
  if (!fs.existsSync(activeSlicePath)) {
    return [];
  }

  const activeWorktrees = worktreeList(projectRoot).filter((entry) => {
    const worktreePath = entry.worktree || '';
    if (!worktreePath || worktreePath === projectRoot) {
      return false;
    }

    return fs.existsSync(path.join(worktreePath, 'WORKTREE_CONTEXT.md'));
  });

  if (activeWorktrees.length === 0) {
    return ['docs/ai/ACTIVE_SLICE.md exists without an active slice worktree'];
  }

  return [];
}

function countStackInfoLeaks(projectRoot) {
  const leakPatterns = [
    /Package manager:/i,
    /Detected package manager:/i,
    /Detected primary stack:/i,
    /Primary install:/i,
    /Primary test:/i,
    /Stack summary:/i,
  ];

  const generatedFiles = [];
  const docsDir = path.join(projectRoot, 'docs');

  if (fs.existsSync(docsDir)) {
    const walk = (dirPath) => {
      for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md') && path.relative(docsDir, fullPath) !== 'PROJECT_MAP.md') {
          generatedFiles.push(fullPath);
        }
      }
    };

    walk(docsDir);
  }

  const leaks = [];

  for (const filePath of generatedFiles) {
    const text = readTextIfExists(filePath);
    if (!text) {
      continue;
    }

    if (leakPatterns.some((pattern) => pattern.test(text))) {
      leaks.push(normalizeRelativePath(projectRoot, filePath));
    }
  }

  return leaks;
}

function collectGeneratedMarkdownFiles(projectRoot) {
  const files = [];
  const rootFiles = ['README.md', 'AGENTS.md'];

  for (const file of rootFiles) {
    const absolutePath = path.join(projectRoot, file);
    if (fs.existsSync(absolutePath)) {
      files.push(absolutePath);
    }
  }

  const docsDir = path.join(projectRoot, 'docs');
  if (!fs.existsSync(docsDir)) {
    return files;
  }

  const walk = (dirPath) => {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  };

  walk(docsDir);

  return files;
}

function isExternalLink(target) {
  return /^(?:[a-z][a-z0-9+.-]*:|#)/i.test(target);
}

function normalizeMarkdownLinkTarget(target) {
  return target
    .trim()
    .replace(/^<|>$/g, '')
    .split('#')[0]
    .trim();
}

function collectMissingMarkdownLinks(projectRoot) {
  const missing = [];
  const linkPattern = /!?\[[^\]]*]\(([^)]+)\)/g;

  for (const filePath of collectGeneratedMarkdownFiles(projectRoot)) {
    const text = readTextIfExists(filePath);
    if (!text) {
      continue;
    }

    let match;
    while ((match = linkPattern.exec(text)) !== null) {
      const target = normalizeMarkdownLinkTarget(match[1]);
      if (!target || isExternalLink(target)) {
        continue;
      }

      const resolved = path.resolve(path.dirname(filePath), target);
      const relativeToRoot = path.relative(projectRoot, resolved);
      if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
        continue;
      }

      if (!fs.existsSync(resolved)) {
        missing.push(`${normalizeRelativePath(projectRoot, filePath)} -> ${target}`);
      }
    }
  }

  return missing;
}

function collectLayoutReport(projectRoot) {
  const hasStateMetadata = hasInitializedStateMetadata(readState(projectRoot));
  const realSlices = readAllSlices(projectRoot);
  const specSlugs = Array.from(new Set(realSlices.map((slice) => slice.specSlug))).sort((left, right) => left.localeCompare(right));
  const exampleTarget = selectDoctorExampleTarget(realSlices, specSlugs);
  const newLayoutFiles = collectPresentPaths(projectRoot, NEW_LAYOUT_REQUIRED_PATHS);
  const missingNewLayoutFiles = collectMissingPaths(projectRoot, NEW_LAYOUT_REQUIRED_PATHS);
  const legacySignals = collectPresentPaths(projectRoot, LEGACY_LAYOUT_PROBES);
  const hasLegacyProjectSpec = hasGeneratedProjectSpec(projectRoot);

  if (hasLegacyProjectSpec) {
    legacySignals.push('specs/<project-slug>/SPEC.md');
  }

  const hasNewLayout = missingNewLayoutFiles.length === 0;
  const hasLegacyLayout = legacySignals.length > 0;

  let layout = 'incomplete';
  if (hasNewLayout && hasLegacyLayout) {
    layout = 'hybrid';
  } else if (hasNewLayout) {
    layout = 'new';
  } else if (hasLegacyLayout) {
    layout = 'legacy';
  }

  const recommendations = [];

  if (layout === 'new') {
    if (specSlugs.length === 0) {
      recommendations.push('No specs yet. That is valid after the AI-first init flow.');
    } else {
      recommendations.push(`Specs found: ${specSlugs.join(', ')}.`);
    }

    if (!hasPath(projectRoot, 'docs/PROJECT_MAP.md')) {
      recommendations.push('Run `npx create-quiver analyze` to generate docs/PROJECT_MAP.md when you want the visible project map.');
    }
  } else if (layout === 'legacy') {
    recommendations.push('Legacy layout detected. Run `npx create-quiver migrate` to add the modern .quiver/ contract and AI-first docs.');
  } else if (layout === 'hybrid') {
    recommendations.push('Hybrid layout detected. Keep the new .quiver/ contract as the source of truth and plan cleanup of legacy roots.');
    recommendations.push('Review any remaining docs-template/, tools/scripts/, or docs/PROJECT_SCAN.json paths and migrate them only if they are still needed.');
  } else {
    recommendations.push('Incomplete layout detected. Restore the missing AI-first contract files before relying on this project for onboarding.');
    if (missingNewLayoutFiles.length > 0) {
      recommendations.push(`Missing files: ${missingNewLayoutFiles.join(', ')}.`);
    }
    if (!hasStateMetadata && !hasLegacyLayout) {
      recommendations.push('Run `npx create-quiver --name "Project Name"` or `npx create-quiver init` to create the Quiver contract first.');
    }
  }

  if (exampleTarget.source === 'generic-multiple-specs') {
    recommendations.push('Multiple specs were found and no active slice is obvious. Doctor examples use placeholders so they do not point to the wrong spec.');
  } else if (exampleTarget.source === 'active-slice') {
    recommendations.push(`Doctor examples target the active slice candidate ${exampleTarget.specSlug}/${exampleTarget.sliceId} (${exampleTarget.status}).`);
  }

  return {
    exampleTarget,
    hasLegacyLayout,
    hasNewLayout,
    hasStateMetadata,
    layout,
    legacySignals,
    missingNewLayoutFiles,
    newLayoutFiles,
    recommendations,
    realSlices,
    specSlugs,
  };
}

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase().replace(/_/g, '-');
}

function statusRank(status) {
  const normalized = normalizeStatus(status);
  const ranks = new Map([
    ['in-progress', 0],
    ['review', 1],
    ['ready', 2],
    ['planned', 3],
    ['approved', 4],
    ['blocked', 5],
    ['draft', 6],
    ['completed', 99],
    ['done', 99],
  ]);

  return ranks.has(normalized) ? ranks.get(normalized) : 20;
}

function selectDoctorExampleTarget(realSlices, specSlugs) {
  if (!Array.isArray(specSlugs) || specSlugs.length === 0) {
    return {
      sliceId: '<slice-id>',
      source: 'no-specs',
      specSlug: '<spec-slug>',
      status: '',
    };
  }

  const rankedSlices = (Array.isArray(realSlices) ? realSlices : [])
    .filter((slice) => specSlugs.includes(slice.specSlug))
    .slice()
    .sort((left, right) => {
      const rankDelta = statusRank(left.status) - statusRank(right.status);
      if (rankDelta !== 0) {
        return rankDelta;
      }

      return left.ref.localeCompare(right.ref);
    });
  const activeSlice = rankedSlices.find((slice) => statusRank(slice.status) < 99);

  if (activeSlice) {
    return {
      sliceId: activeSlice.sliceId,
      source: 'active-slice',
      specSlug: activeSlice.specSlug,
      status: activeSlice.status || '',
    };
  }

  if (specSlugs.length === 1) {
    return {
      sliceId: '<slice-id>',
      source: 'single-spec',
      specSlug: specSlugs[0],
      status: '',
    };
  }

  return {
    sliceId: '<slice-id>',
    source: 'generic-multiple-specs',
    specSlug: '<spec-slug>',
    status: '',
  };
}

function buildDoctorFixPlan(projectRoot) {
  const fixes = [];
  const rootGitignorePath = path.join(projectRoot, '.gitignore');
  const rootGitignoreText = readTextIfExists(rootGitignorePath) || '';
  const missingRootGitignoreLines = missingLineDefaults(rootGitignoreText, ROOT_GITIGNORE_DEFAULTS);
  if (!fs.existsSync(rootGitignorePath)) {
    fixes.push({
      type: 'append-lines',
      path: '.gitignore',
      description: 'Create root .gitignore with safe Quiver defaults.',
      lines: ROOT_GITIGNORE_DEFAULTS,
    });
  } else if (missingRootGitignoreLines.length > 0) {
    fixes.push({
      type: 'append-lines',
      path: '.gitignore',
      description: `Merge missing root .gitignore defaults: ${missingRootGitignoreLines.join(', ')}.`,
      lines: missingRootGitignoreLines,
    });
  }

  const quiverGitignorePath = path.join(projectRoot, '.quiver', '.gitignore');
  const quiverGitignoreText = readTextIfExists(quiverGitignorePath) || '';
  const quiverDefaults = buildQuiverInternalGitignore().split(/\r?\n/).filter(Boolean);
  const missingQuiverLines = missingLineDefaults(quiverGitignoreText, quiverDefaults);
  if (!fs.existsSync(quiverGitignorePath)) {
    fixes.push({
      type: 'write-json-or-text',
      path: '.quiver/.gitignore',
      description: 'Create internal .quiver/.gitignore for local AI state.',
      content: buildQuiverInternalGitignore(),
    });
  } else if (missingQuiverLines.length > 0) {
    fixes.push({
      type: 'append-lines',
      path: '.quiver/.gitignore',
      description: `Merge missing .quiver/.gitignore defaults: ${missingQuiverLines.join(', ')}.`,
      lines: missingQuiverLines,
    });
  }

  const configPath = path.join(projectRoot, '.quiver', 'config.json');
  if (!fs.existsSync(configPath)) {
    fixes.push({
      type: 'write-json-or-text',
      path: '.quiver/config.json',
      description: 'Create missing Quiver config metadata.',
      content: `${JSON.stringify(buildQuiverConfig(), null, 2)}\n`,
    });
  }

  const agentsMissing = countAgentsSections(projectRoot);
  if (agentsMissing.includes('AGENTS.md')) {
    fixes.push({
      type: 'write-json-or-text',
      path: 'AGENTS.md',
      description: 'Create missing AGENTS.md AI routing contract.',
      content: buildAgentsContractText(),
    });
  } else if (agentsMissing.length > 0) {
    fixes.push({
      type: 'append-lines',
      path: 'AGENTS.md',
      description: `Append missing AGENTS.md contract sections: ${agentsMissing.join(', ')}.`,
      lines: buildAgentsContractText(agentsMissing).trimEnd().split('\n'),
    });
  }

  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const scripts = packageJson.scripts && typeof packageJson.scripts === 'object' ? packageJson.scripts : {};
    const expectedScripts = resolveInitPackageScripts('default');
    const missingScripts = Object.entries(expectedScripts)
      .filter(([name]) => (name.startsWith('quiver:') || name === 'check-handoff') && typeof scripts[name] !== 'string');

    if (missingScripts.length > 0) {
      fixes.push({
        type: 'merge-package-scripts',
        path: 'package.json',
        description: `Add missing package scripts: ${missingScripts.map(([name]) => name).join(', ')}.`,
        scripts: Object.fromEntries(missingScripts),
      });
    }
  }

  return fixes;
}

function applyDoctorFixPlan(projectRoot, fixes) {
  for (const fix of fixes) {
    const targetPath = path.join(projectRoot, fix.path);
    if (fix.type === 'append-lines') {
      appendMissingLines(targetPath, fix.lines);
      continue;
    }

    if (fix.type === 'write-json-or-text') {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, fix.content);
      continue;
    }

    if (fix.type === 'merge-package-scripts') {
      const packageJson = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
      packageJson.scripts = {
        ...(packageJson.scripts || {}),
        ...fix.scripts,
      };
      fs.writeFileSync(targetPath, `${JSON.stringify(packageJson, null, 2)}\n`);
    }
  }
}

function formatDoctorFixPlan(fixes, { dryRun = false } = {}) {
  const lines = [dryRun ? 'Quiver doctor fix dry-run' : 'Quiver doctor fix'];
  if (fixes.length === 0) {
    lines.push('- No safe fixes to apply.');
  } else {
    for (const fix of fixes) {
      lines.push(`- ${dryRun ? 'Would update' : 'Updated'} ${fix.path}: ${fix.description}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

function collectDoctorReport(projectRoot) {
  const layout = collectLayoutReport(projectRoot);
  const warnings = collectDoctorWarnings(projectRoot);

  return {
    ...layout,
    warnings,
  };
}

function runEnvironmentProbe(command, args = [], options = {}) {
  const runner = options.runner || spawnSync;
  return runner(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: options.timeout || 3000,
  });
}

function probeOk(command, args, options = {}) {
  const result = runEnvironmentProbe(command, args, options);
  if (result && result.error && result.error.code === 'ENOENT') {
    return {
      ok: false,
      reason: 'missing',
    };
  }
  return {
    ok: Boolean(result && result.status === 0),
    reason: result && result.error ? result.error.message : result && result.stderr ? String(result.stderr).trim() : '',
  };
}

function collectEnvironmentWarnings(projectRoot, options = {}) {
  const warnings = [];
  const cwd = projectRoot;

  const checks = [
    ['node', ['--version'], 'Node.js is required to run create-quiver. Install Node 20+ and retry.'],
    ['npm', ['--version'], 'npm is required for generated npm scripts and package smokes. Install npm or use a Node distribution that includes it.'],
    ['git', ['--version'], 'git is required for specs, slices, worktrees, commits, and PR flow. Install git and retry.'],
  ];

  for (const [command, args, message] of checks) {
    const check = probeOk(command, args, { ...options, cwd });
    if (!check.ok) {
      warnings.push(`${command} check failed: ${message}`);
    }
  }

  const ghCheck = probeOk('gh', ['--version'], { ...options, cwd });
  if (!ghCheck.ok) {
    warnings.push('gh check failed: GitHub CLI is required for `ai pr` and `ai doctor`. macOS: brew install gh. Linux: use your distro package manager. Windows: winget install GitHub.cli.');
  } else {
    const authCheck = probeOk('gh', ['auth', 'status'], { ...options, cwd });
    if (!authCheck.ok) {
      warnings.push('gh auth check failed: run `gh auth login` before using `ai pr --create`.');
    }
  }

  if (!process.env.SHELL && !process.env.ComSpec) {
    warnings.push('shell check failed: no SHELL or ComSpec environment variable was detected.');
  }

  if (projectRoot.includes(' ')) {
    warnings.push('path contains spaces: use quoted paths when copying manual commands.');
  }

  try {
    fs.accessSync(projectRoot, fs.constants.W_OK);
  } catch {
    warnings.push('permission check failed: current user cannot write to the project root.');
  }

  return warnings;
}

function collectDoctorWarnings(projectRoot) {
  const warnings = [];

  const agentsMissing = countAgentsSections(projectRoot);
  if (agentsMissing.length > 0) {
    if (agentsMissing.includes('AGENTS.md')) {
      warnings.push('missing AGENTS.md');
    } else {
      warnings.push(`AGENTS.md is missing required sections: ${agentsMissing.join(', ')}`);
    }
  }

  for (const issue of countTieredPackSizeWarnings(projectRoot)) {
    warnings.push(issue);
  }

  const frontMatterIssues = countDocsAiFrontMatterIssues(projectRoot);
  for (const issue of frontMatterIssues) {
    warnings.push(`${issue} is missing YAML front matter`);
  }

  for (const issue of countActiveSliceOrphans(projectRoot)) {
    warnings.push(issue);
  }

  const leakIssues = countStackInfoLeaks(projectRoot);
  if (leakIssues.length > 0) {
    warnings.push(`stack information appears outside docs/PROJECT_MAP.md: ${leakIssues.join(', ')}`);
  }

  const missingLinks = collectMissingMarkdownLinks(projectRoot);
  for (const issue of missingLinks) {
    warnings.push(`missing local docs link: ${issue}`);
  }

  for (const issue of collectEnvironmentWarnings(projectRoot)) {
    warnings.push(issue);
  }

  return warnings;
}

module.exports = {
  applyDoctorFixPlan,
  buildDoctorFixPlan,
  collectDoctorReport,
  collectEnvironmentWarnings,
  collectDoctorWarnings,
  collectLayoutReport,
  formatDoctorFixPlan,
  selectDoctorExampleTarget,
};
