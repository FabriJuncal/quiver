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

  return {
    ...onboardingPlan,
    ...identity,
    approvedDocPaths: getPreparedContextDocPaths(),
    filesConsidered,
    omittedPaths: onboardingPlan.omittedByDefault.slice(),
    assumptions,
    risks,
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
