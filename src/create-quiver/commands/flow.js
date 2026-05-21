const fs = require('fs');
const path = require('path');

const { hasQuiverInitializationEvidence, readState } = require('../lib/state');

function exists(projectRoot, relativePath) {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function listSpecSlugs(projectRoot) {
  const specsDir = path.join(projectRoot, 'specs');
  if (!fs.existsSync(specsDir)) {
    return [];
  }

  return fs.readdirSync(specsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => name !== '[project-name]' && !name.startsWith('quiver-'))
    .filter((name) => exists(projectRoot, path.posix.join('specs', name, 'SPEC.md')))
    .sort((left, right) => left.localeCompare(right));
}

function detectFlowState(projectRoot) {
  const initialized = hasQuiverInitializationEvidence(projectRoot);
  const state = readState(projectRoot);
  const hasProjectMap = exists(projectRoot, 'docs/PROJECT_MAP.md');
  const hasAiContext = exists(projectRoot, 'docs/AI_CONTEXT.md');
  const hasOnboardingPrompt = exists(projectRoot, 'docs/AI_ONBOARDING_PROMPT.md');
  const specSlugs = listSpecSlugs(projectRoot);

  if (!initialized) {
    return {
      stage: 'not-initialized',
      label: 'not initialized',
      blockers: ['Quiver has not been initialized in this project.'],
      nextCommand: 'npx create-quiver init --name "Project Name"',
      suggestedCommands: [
        'npx create-quiver init --name "Project Name"',
        'npx create-quiver analyze',
        'npx create-quiver doctor',
      ],
      facts: {
        initialized,
        hasProjectMap,
        hasAiContext,
        hasOnboardingPrompt,
        specSlugs,
        quiverVersion: state?.quiver_version || null,
      },
    };
  }

  if (!hasProjectMap || !hasAiContext || !hasOnboardingPrompt) {
    const missingDocs = [
      ['docs/PROJECT_MAP.md', hasProjectMap],
      ['docs/AI_CONTEXT.md', hasAiContext],
      ['docs/AI_ONBOARDING_PROMPT.md', hasOnboardingPrompt],
    ].filter(([, present]) => !present).map(([file]) => file);

    return {
      stage: 'context-needed',
      label: 'context needs refresh',
      blockers: missingDocs.map((file) => `Missing ${file}.`),
      nextCommand: 'npx create-quiver analyze',
      suggestedCommands: [
        'npx create-quiver analyze',
        'npx create-quiver doctor',
        'npx create-quiver ai onboard --dry-run',
      ],
      facts: {
        initialized,
        hasProjectMap,
        hasAiContext,
        hasOnboardingPrompt,
        specSlugs,
        quiverVersion: state?.quiver_version || null,
      },
    };
  }

  if (specSlugs.length === 0) {
    return {
      stage: 'planning-ready',
      label: 'ready for planner onboarding',
      blockers: [],
      nextCommand: 'npx create-quiver ai onboard --dry-run',
      suggestedCommands: [
        'npx create-quiver ai onboard --dry-run',
        'npx create-quiver ai plan --phase acceptance --input requirements.md --dry-run',
        'npx create-quiver ai approve --phase acceptance --input acceptance-approved.md',
      ],
      facts: {
        initialized,
        hasProjectMap,
        hasAiContext,
        hasOnboardingPrompt,
        specSlugs,
        quiverVersion: state?.quiver_version || null,
      },
    };
  }

  return {
    stage: 'slices-ready',
    label: 'ready for slice planning',
    blockers: [],
    nextCommand: 'npx create-quiver next',
    suggestedCommands: [
      'npx create-quiver plan',
      'npx create-quiver graph',
      'npx create-quiver next',
    ],
    facts: {
      initialized,
      hasProjectMap,
      hasAiContext,
      hasOnboardingPrompt,
      specSlugs,
      quiverVersion: state?.quiver_version || null,
    },
  };
}

function formatFlowReport(report) {
  const lines = [
    'Quiver guided flow',
    '',
    'Command path:',
    '- Bootstrap and remote use: npx create-quiver <command>',
    '- Short alias after local install: quiver <command>',
    '- Generated npm script: npm run quiver:flow',
    '',
    `Stage: ${report.label}`,
    `Next safe command: ${report.nextCommand}`,
  ];

  if (report.blockers.length > 0) {
    lines.push('', 'Blockers:');
    for (const blocker of report.blockers) {
      lines.push(`- ${blocker}`);
    }
  }

  lines.push('', 'Suggested sequence:');
  for (const command of report.suggestedCommands) {
    lines.push(`- ${command}`);
  }

  if (report.facts.specSlugs.length > 0) {
    lines.push('', `Specs found: ${report.facts.specSlugs.join(', ')}`);
  }

  lines.push('', 'Safety: this command is read-only and does not call AI providers.');

  return `${lines.join('\n')}\n`;
}

async function runFlow(repoRoot, options = {}) {
  const report = detectFlowState(repoRoot);

  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return report;
  }

  process.stdout.write(formatFlowReport(report));
  return report;
}

module.exports = {
  detectFlowState,
  formatFlowReport,
  runFlow,
};
