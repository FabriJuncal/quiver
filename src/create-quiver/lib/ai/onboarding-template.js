const fs = require('node:fs');
const path = require('node:path');

const PROMPT_SOURCE = 'packaged planner onboarding template';

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

function hasPath(projectRoot, relativePath) {
  return fs.existsSync(path.join(projectRoot, relativePath));
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
  OMITTED_BY_DEFAULT,
  ONBOARDING_DOCS,
  PROMPT_SOURCE,
  buildPlannerOnboardingPrompt,
  collectOnboardingContextPlan,
};
