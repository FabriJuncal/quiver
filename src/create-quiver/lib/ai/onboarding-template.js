const fs = require('node:fs');
const path = require('node:path');

const { getPreparedContextDocPaths } = require('./context-packs');

const PROMPT_SOURCE = 'packaged planner onboarding template';
const PACKAGE_ROOT = path.resolve(__dirname, '../../../..');

const ONBOARDING_DOCS = Object.freeze([
  ['README.md', 'project entrypoint and human summary'],
  ['AGENTS.md', 'agent router and reading rules'],
  ['docs/INDEX.md', 'index-first navigation map'],
  ['docs/PROJECT_MAP.md', 'stack, commands, and structure facts'],
  ['docs/AI_CONTEXT.md', 'AI working contract'],
  ['docs/AI_ONBOARDING_PROMPT.md', 'project-specific onboarding contract'],
  ['docs/CONTEXTO.md', 'human-readable project context'],
  ['docs/WORKFLOW.md', 'WDD/SDD workflow rules'],
  ['docs/STATUS.md', 'current state and open risks'],
  ['docs/DECISIONS.md', 'durable decisions'],
]);

const OMITTED_BY_DEFAULT = Object.freeze([
  'Do not read all docs/ recursively by default.',
  'Do not read source trees until the selected docs identify relevant files.',
  'Do not read dependency folders, generated outputs, caches, secrets, or local AI state.',
  'Use .quiver/scans/PROJECT_SCAN.json only when docs/PROJECT_MAP.md is not enough.',
]);

const CONTEXT_PREP_SOURCE_DOCS = Object.freeze([
  ['README.md', 'project entrypoint and human summary'],
  ['AGENTS.md', 'agent router and reading rules'],
  ['README_FOR_AI.md', 'framework guidance source; not project debt when absent'],
  ['docs/INDEX.md', 'index-first navigation map'],
  ['docs/PROJECT_MAP.md', 'stack, commands, and structure facts'],
  ['docs/WORKFLOW.md', 'workflow rules and execution contract'],
  ['docs/AI_CONTEXT.md', 'agent-facing project context pack'],
  ['docs/AI_ONBOARDING_PROMPT.md', 'project-specific onboarding contract'],
  ['docs/CONTEXTO.md', 'human-readable project context'],
  ['docs/STATUS.md', 'current state and open risks'],
  ['docs/DECISIONS.md', 'durable decisions log'],
]);

function hasPath(projectRoot, relativePath) {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function toProjectSlug(projectName) {
  return String(projectName || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'quiver-project';
}

function readProjectName(projectRoot) {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (typeof packageJson.name === 'string' && packageJson.name.trim()) {
        return packageJson.name.trim();
      }
    } catch {
      // Best effort only. Fall back to the directory name when package.json is unreadable.
    }
  }

  return path.basename(projectRoot) || 'Quiver Project';
}

function renderTemplate(text, replacements) {
  return text
    .replace(/{{PROJECT_NAME}}/g, replacements.projectName)
    .replace(/{{PROJECT_SLUG}}/g, replacements.projectSlug)
    .replace(/\[project\]/g, replacements.projectSlug)
    .replace(/\[project-name\]/g, replacements.projectSlug)
    .replace(/\[project-slug\]/g, replacements.projectSlug)
    .replace(/{{FECHA}}/g, replacements.currentDate)
    .replace(/{{FECHA_PROXIMA}}/g, replacements.datePlus7 || replacements.currentDate)
    .replace(/{{FECHA_PROXIMA_MES}}/g, replacements.datePlus30 || replacements.currentDate)
    .replace(/{{FECHA_LAUNCH}}/g, replacements.datePlus35 || replacements.currentDate)
    .replace(/{{ESTADO}}/g, replacements.estado || 'En preparación')
    .replace(/{{FASE}}/g, replacements.fase || 'Fase 0')
    .replace(/{{X}}%/g, `${typeof replacements.progress === 'number' ? replacements.progress : 0}%`)
    .replace(/{{PACKAGE_MANAGER}}/g, replacements.packageManager || 'npm')
    .replace(/{{STACK_SUMMARY}}/g, replacements.stackSummary || 'unknown until analyze')
    .replace(/{{PRIMARY_INSTALL}}/g, replacements.primaryInstall || 'npm install')
    .replace(/{{PRIMARY_DEV}}/g, replacements.primaryDev || 'not defined')
    .replace(/{{PRIMARY_TEST}}/g, replacements.primaryTest || 'not defined')
    .replace(/{{ANALYZE_COMMAND}}/g, replacements.analyzeCommand || 'npx create-quiver analyze')
    .replace(/{{PLAN_COMMAND}}/g, replacements.planCommand || 'npx create-quiver plan')
    .replace(/{{GRAPH_COMMAND}}/g, replacements.graphCommand || 'npx create-quiver graph')
    .replace(/{{NEXT_COMMAND}}/g, replacements.nextCommand || 'npx create-quiver next')
    .replace(/{{DOCTOR_COMMAND}}/g, replacements.doctorCommand || 'npx create-quiver doctor')
    .replace(/{{START_SLICE_COMMAND}}/g, replacements.startSliceCommand || 'npx create-quiver start-slice <slice.json>')
    .replace(/{{CHECK_SLICE_COMMAND}}/g, replacements.checkSliceCommand || 'npx create-quiver check-slice <slice.json>')
    .replace(/{{CHECK_PR_COMMAND}}/g, replacements.checkPrCommand || 'npx create-quiver check-pr <slice.json>')
    .replace(/{{CLEANUP_SLICE_COMMAND}}/g, replacements.cleanupSliceCommand || 'npx create-quiver cleanup-slice <slice.json>')
    .replace(/{{CHECK_SCOPE_COMMAND}}/g, replacements.checkScopeCommand || 'npx create-quiver check-scope <slice.json>')
    .replace(/{{REFRESH_ACTIVE_SLICES_COMMAND}}/g, replacements.refreshActiveSlicesCommand || 'npx create-quiver refresh-active-slices');
}

function uniq(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean)));
}

function markPendingConfirmation(value) {
  const text = String(value || '').trim();
  if (!text || /^(TODO|Assumption|Pending confirmation):/i.test(text)) {
    return text;
  }

  return `Pending confirmation: ${text}`;
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function detectPackageManager(projectRoot) {
  if (hasPath(projectRoot, 'bun.lockb') || hasPath(projectRoot, 'bun.lock')) return 'bun';
  if (hasPath(projectRoot, 'pnpm-lock.yaml')) return 'pnpm';
  if (hasPath(projectRoot, 'yarn.lock')) return 'yarn';
  return 'npm';
}

function detectSourceDirectories(projectRoot) {
  const names = ['src', 'app', 'apps', 'packages', 'lib', 'server', 'client', 'web'];
  return names.filter((name) => {
    try {
      return fs.statSync(path.join(projectRoot, name)).isDirectory();
    } catch {
      return false;
    }
  });
}

function collectRootNames(projectRoot) {
  try {
    return fs.readdirSync(projectRoot, { withFileTypes: true })
      .filter((entry) => !entry.name.startsWith('.') && entry.name !== 'node_modules')
      .map((entry) => `${entry.name}${entry.isDirectory() ? '/' : ''}`)
      .slice(0, 20);
  } catch {
    return [];
  }
}

function detectStackSummary(packageJson, projectRoot) {
  const dependencies = {
    ...(packageJson?.dependencies || {}),
    ...(packageJson?.devDependencies || {}),
  };
  const signals = [];

  if (dependencies.next || hasPath(projectRoot, 'next.config.js') || hasPath(projectRoot, 'next.config.mjs')) signals.push('Next.js');
  if (dependencies.vite || hasPath(projectRoot, 'vite.config.js') || hasPath(projectRoot, 'vite.config.ts')) signals.push('Vite');
  if (dependencies.react) signals.push('React');
  if (dependencies.vue) signals.push('Vue');
  if (dependencies.angular || dependencies['@angular/core'] || hasPath(projectRoot, 'angular.json')) signals.push('Angular');
  if (dependencies.svelte || hasPath(projectRoot, 'svelte.config.js')) signals.push('Svelte');
  if (dependencies.express) signals.push('Express');
  if (hasPath(projectRoot, 'pyproject.toml') || hasPath(projectRoot, 'requirements.txt')) signals.push('Python');
  if (hasPath(projectRoot, 'go.mod')) signals.push('Go');

  return signals.length > 0 ? signals.join(', ') : 'Pending confirmation: no primary stack could be inferred from root signals.';
}

function collectProjectFacts(projectRoot) {
  const packageJson = readJsonIfExists(path.join(projectRoot, 'package.json'));
  const scripts = packageJson?.scripts && typeof packageJson.scripts === 'object' ? packageJson.scripts : {};
  const packageManager = packageJson?.packageManager
    ? String(packageJson.packageManager).split('@')[0]
    : detectPackageManager(projectRoot);

  return {
    packageJsonPresent: Boolean(packageJson),
    packageManager,
    stackSummary: detectStackSummary(packageJson, projectRoot),
    scripts,
    rootNames: collectRootNames(projectRoot),
    sourceDirectories: detectSourceDirectories(projectRoot),
    commands: {
      install: packageManager === 'pnpm' ? 'pnpm install' : packageManager === 'yarn' ? 'yarn install' : packageManager === 'bun' ? 'bun install' : 'npm install',
      dev: scripts.dev || scripts.start || 'Pending confirmation: no dev/start script detected.',
      build: scripts.build || 'Pending confirmation: no build script detected.',
      test: scripts.test || 'Pending confirmation: no test script detected.',
      lint: scripts.lint || 'Pending confirmation: no lint script detected.',
    },
  };
}

function readProjectMapField(projectRoot, label) {
  const filePath = path.join(projectRoot, 'docs', 'PROJECT_MAP.md');
  if (!fs.existsSync(filePath)) {
    return '';
  }

  const text = fs.readFileSync(filePath, 'utf8');
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(new RegExp(`^- ${escaped}:\\s*(.+)$`, 'mi'));
  return match ? match[1].trim() : '';
}

function collectContextContradictions(projectRoot, plan, facts) {
  const contradictions = [];
  const mappedName = readProjectMapField(projectRoot, 'Name');
  const mappedPackageManager = readProjectMapField(projectRoot, 'Package manager');

  if (mappedName && mappedName !== plan.projectName) {
    contradictions.push(`docs/PROJECT_MAP.md reports project name '${mappedName}', but package/root identity resolves to '${plan.projectName}'.`);
  }

  if (mappedPackageManager && mappedPackageManager !== facts.packageManager) {
    contradictions.push(`docs/PROJECT_MAP.md reports package manager '${mappedPackageManager}', but current root signals resolve to '${facts.packageManager}'.`);
  }

  return contradictions.map(markPendingConfirmation);
}

function formatDocStatusLines(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return ['- none'];
  }

  return items.map((item) => {
    const status = item.present ? 'present' : 'absent';
    const note = item.reason ? ` (${item.reason})` : '';
    return `- ${item.path}: ${status}${note}`;
  });
}

function formatSimpleBullets(items, emptyLabel = 'none') {
  if (!Array.isArray(items) || items.length === 0) {
    return [`- ${emptyLabel}`];
  }

  return items.map((item) => `- ${item}`);
}

function resolveProjectIdentity(projectRoot) {
  const projectName = readProjectName(projectRoot);
  return {
    projectName,
    projectSlug: toProjectSlug(projectName),
  };
}

function collectOnboardingContextPlan(projectRoot) {
  const docs = ONBOARDING_DOCS.map(([relativePath, reason]) => ({
    path: relativePath,
    reason,
    present: hasPath(projectRoot, relativePath),
  }));
  const selectedDocs = docs.filter((item) => item.present);
  const missingDocs = docs.filter((item) => !item.present);
  const assumptions = [];
  const risks = [];

  if (!hasPath(projectRoot, 'docs/INDEX.md')) {
    risks.push('docs/INDEX.md is missing, so the planner cannot use index-first navigation.');
  }

  if (!hasPath(projectRoot, 'docs/PROJECT_MAP.md')) {
    risks.push('docs/PROJECT_MAP.md is missing; run analyze before broad onboarding.');
  }

  if (!hasPath(projectRoot, 'docs/AI_ONBOARDING_PROMPT.md')) {
    risks.push('docs/AI_ONBOARDING_PROMPT.md is missing; project-specific onboarding may be incomplete.');
  }

  if (selectedDocs.length === 0) {
    assumptions.push('No onboarding docs were detected; use README.md or initialize Quiver first.');
  }

  return {
    promptSource: PROMPT_SOURCE,
    selectedDocs,
    missingDocs,
    omittedByDefault: OMITTED_BY_DEFAULT.slice(),
    assumptions,
    risks,
  };
}

function collectContextPreparationPlan(projectRoot) {
  const onboardingPlan = collectOnboardingContextPlan(projectRoot);
  const identity = resolveProjectIdentity(projectRoot);
  const facts = collectProjectFacts(projectRoot);
  const filesConsidered = CONTEXT_PREP_SOURCE_DOCS.map(([relativePath, reason]) => ({
    path: relativePath,
    reason,
    present: hasPath(projectRoot, relativePath),
  }));
  const assumptions = uniq([
    ...onboardingPlan.assumptions,
    !hasPath(projectRoot, 'README_FOR_AI.md')
      ? 'Assumption: README_FOR_AI.md is framework guidance only and is not counted as generated-project debt when absent.'
      : null,
  ]);
  const risks = uniq([
    ...onboardingPlan.risks.map(markPendingConfirmation),
    !hasPath(projectRoot, 'docs/PROJECT_MAP.md')
      ? 'Pending confirmation: docs/PROJECT_MAP.md is missing, so the draft must stay on documented facts only.'
      : null,
    !hasPath(projectRoot, 'docs/INDEX.md')
      ? 'Pending confirmation: docs/INDEX.md is missing, so navigation should stay conservative and index-first.'
      : null,
  ]);
  const plan = {
    ...onboardingPlan,
    ...identity,
    approvedDocPaths: getPreparedContextDocPaths(),
    filesConsidered,
    omittedPaths: onboardingPlan.omittedByDefault.slice(),
    assumptions,
    risks,
    facts,
  };

  return {
    ...plan,
    contradictions: collectContextContradictions(projectRoot, plan, facts),
  };
}

function buildContextPreparationNotes(plan) {
  const lines = [
    '## Context Preparation Notes',
    '- TODO: confirm any repo fact that is not supported by README.md, AGENTS.md, docs/INDEX.md, or docs/PROJECT_MAP.md.',
    '- Assumption: missing README_FOR_AI.md in a generated project is guidance-only and not project debt.',
    '- Pending confirmation: keep writes limited to docs/context files and never product code.',
    '',
    '### Files Considered',
    ...formatDocStatusLines(plan.filesConsidered),
    '',
    '### Assumptions',
    ...formatSimpleBullets(plan.assumptions, 'none'),
    '',
    '### Risks',
    ...formatSimpleBullets(plan.risks, 'none'),
    '',
    '### Contradictions',
    ...formatSimpleBullets(plan.contradictions, 'none'),
    '',
    '### Omitted Paths',
    ...formatSimpleBullets(plan.omittedPaths, 'none'),
  ];

  return `${lines.join('\n')}\n`;
}

function appendNotes(body, notes) {
  const trimmedBody = String(body || '').replace(/\s+$/g, '');
  const trimmedNotes = String(notes || '').trimEnd();
  return `${trimmedBody}\n\n${trimmedNotes}\n`;
}

function readTemplate(relativePath) {
  return fs.readFileSync(path.join(PACKAGE_ROOT, relativePath), 'utf8');
}

function renderProjectMapDraft(plan) {
  const facts = plan.facts;
  const lines = [
    '# Project Map',
    '',
    'This file was prepared by `npx create-quiver ai prepare-context`.',
    'Run `npx create-quiver analyze` to refresh it with a deeper repository scan.',
    '',
    '## Project',
    `- Name: ${plan.projectName}`,
    `- Slug: ${plan.projectSlug}`,
    `- Package manager: ${facts.packageManager}`,
    `- package.json present: ${facts.packageJsonPresent ? 'yes' : 'no'}`,
    `- Stack summary: ${facts.stackSummary}`,
    '',
    '## Commands',
    `- Install: ${facts.commands.install}`,
    `- Dev: ${facts.commands.dev}`,
    `- Build: ${facts.commands.build}`,
    `- Test: ${facts.commands.test}`,
    `- Lint: ${facts.commands.lint}`,
    '',
    '## Structure',
    `- Source directories: ${facts.sourceDirectories.length > 0 ? facts.sourceDirectories.join(', ') : 'Pending confirmation: no common source directory detected.'}`,
    `- Root entries: ${facts.rootNames.length > 0 ? facts.rootNames.join(', ') : 'Pending confirmation: root entries could not be listed.'}`,
    '',
    '## Assumptions',
    ...formatSimpleBullets(plan.assumptions, 'none'),
    '',
    '## Risks',
    ...formatSimpleBullets(plan.risks, 'none'),
    '',
    '## Contradictions',
    ...formatSimpleBullets(plan.contradictions, 'none'),
  ];

  return `${lines.join('\n')}\n`;
}

function renderArchitectureDraft(plan) {
  const facts = plan.facts;
  const lines = [
    `# ${plan.projectName} Architecture`,
    '',
    'This document captures only what Quiver can infer safely from repository structure and docs.',
    '',
    '## Current Understanding',
    `- Stack: ${facts.stackSummary}`,
    `- Source directories: ${facts.sourceDirectories.length > 0 ? facts.sourceDirectories.join(', ') : 'Pending confirmation: no common source directory detected.'}`,
    `- Package manager: ${facts.packageManager}`,
    '',
    '## Boundaries',
    '- TODO: confirm application boundaries with the team.',
    '- Pending confirmation: no architecture decision should be treated as approved unless it appears in `docs/DECISIONS.md` or an approved spec.',
    '',
    '## Commands That Shape Architecture',
    `- Build: ${facts.commands.build}`,
    `- Test: ${facts.commands.test}`,
    `- Lint: ${facts.commands.lint}`,
    '',
    '## Risks',
    ...formatSimpleBullets(plan.risks, 'none'),
    '',
    '## Contradictions',
    ...formatSimpleBullets(plan.contradictions, 'none'),
  ];

  return `${lines.join('\n')}\n`;
}

function buildContextPreparationDrafts(projectRoot) {
  const plan = collectContextPreparationPlan(projectRoot);
  const currentDate = new Date().toISOString().slice(0, 10);
  const replacements = {
    currentDate,
    projectName: plan.projectName,
    projectSlug: plan.projectSlug,
    estado: 'En preparación',
    fase: 'Fase 0',
    progress: 0,
    packageManager: plan.facts.packageManager,
    stackSummary: plan.facts.stackSummary,
    primaryInstall: plan.facts.commands.install,
    primaryDev: plan.facts.commands.dev,
    primaryTest: plan.facts.commands.test,
  };
  const notes = buildContextPreparationNotes(plan);
  const decisionSection = [
    '## Context Preparation Decisions',
    '| Date | Decision | Reason | Alternatives | Impact |',
    `| ${currentDate} | README_FOR_AI.md absence in generated projects is guidance-only, not project debt | Keeps prepare output aligned with generated repos. | Report it as debt | Dry-runs stay accurate and less noisy |`,
    `| ${currentDate} | ai prepare-context must remain docs-only | Keeps context prep from touching product code. | Broader write targets | Draft generation stays safe and reviewable |`,
  ].join('\n');
  const docs = [
    {
      path: 'docs/INDEX.md',
      content: appendNotes(renderTemplate(readTemplate('docs/INDEX.md.template'), replacements), notes),
    },
    {
      path: 'docs/PROJECT_MAP.md',
      content: appendNotes(renderProjectMapDraft(plan), notes),
    },
    {
      path: 'docs/AI_CONTEXT.md',
      content: appendNotes(renderTemplate(readTemplate('docs/AI_CONTEXT.md.template'), replacements), notes),
    },
    {
      path: 'docs/AI_ONBOARDING_PROMPT.md',
      content: appendNotes(renderTemplate(readTemplate('docs/AI_ONBOARDING_PROMPT.md.template'), replacements), notes),
    },
    {
      path: 'docs/CONTEXTO.md',
      content: appendNotes(renderTemplate(readTemplate('docs/CONTEXTO.md.template'), replacements), notes),
    },
    {
      path: 'docs/WORKFLOW.md',
      content: appendNotes(renderTemplate(readTemplate('docs/WORKFLOW.md.template'), replacements), notes),
    },
    {
      path: 'docs/ARCHITECTURE.md',
      content: appendNotes(renderArchitectureDraft(plan), notes),
    },
    {
      path: 'docs/STATUS.md',
      content: appendNotes(renderTemplate(readTemplate('docs/STATUS.md.template'), replacements), notes),
    },
    {
      path: 'docs/DECISIONS.md',
      content: appendNotes(renderTemplate(readTemplate('docs/DECISIONS.md.template'), replacements), decisionSection),
    },
  ];

  return {
    docs,
    plan,
  };
}

function formatDocBullets(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return ['- none'];
  }

  return items.map((item) => `- ${item.path}: ${item.reason}`);
}

function buildPlannerOnboardingPrompt({ pack, inputText, inputPath, repoRoot }) {
  const plan = collectOnboardingContextPlan(repoRoot);
  const sections = [
    pack.prompt,
    'Task: planner onboarding for this repository.',
    'Goal: understand the project context and prepare safe WDD/SDD work with the smallest useful context.',
    'Rules:',
    '- Start with README.md and AGENTS.md when present.',
    '- Then read docs/INDEX.md as the navigation map when present.',
    '- Use docs/INDEX.md to choose only the docs needed for the current task.',
    '- Do not read all docs/ recursively by default.',
    '- Do not modify product code.',
    '- Do not modify product code during onboarding.',
    '- Do not invent architecture, workflow, roles, domain rules, or conventions.',
    '- Report assumptions, risks, missing docs, and files read.',
    'Selected docs to inspect first:',
    ...formatDocBullets(plan.selectedDocs),
    'Documentation debt to report if relevant:',
    ...formatDocBullets(plan.missingDocs),
    'Omit by default:',
    ...plan.omittedByDefault.map((item) => `- ${item}`),
  ];

  if (inputPath) {
    sections.push(`Input file: ${inputPath}`);
  }

  if (inputText) {
    sections.push('Input:', inputText.trimEnd());
  }

  sections.push(
    'Expected output:',
    '- Files read.',
    '- Files created or modified.',
    '- Product code status.',
    '- Project context prepared.',
    '- WDD/SDD understanding based only on repo docs.',
    '- Assumptions.',
    '- Risks and blockers.',
    '- Next safe steps.',
  );

  return {
    plan,
    prompt: sections.join('\n\n'),
  };
}

module.exports = {
  CONTEXT_PREP_SOURCE_DOCS,
  OMITTED_BY_DEFAULT,
  ONBOARDING_DOCS,
  PROMPT_SOURCE,
  buildContextPreparationDrafts,
  buildContextPreparationPlan: collectContextPreparationPlan,
  buildPlannerOnboardingPrompt,
  collectOnboardingContextPlan,
  resolveProjectIdentity,
  renderTemplate,
};
