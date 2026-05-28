const fs = require('fs');
const path = require('path');

const { readPhaseApproval } = require('../lib/approvals');
const { approvalCandidateCommand, buildApprovalCandidateReport, formatCandidateSummary } = require('../lib/ai/approval-candidates');
const { readPlanReview } = require('../lib/ai/plan-review');
const { listAgentProfiles } = require('../lib/agent-profiles');
const { readProjectScanStatus } = require('../lib/project-scan');
const { buildGraph, naturalNumberFromSliceId, readAllSlices } = require('../lib/slice-graph');
const { hasQuiverInitializationEvidence, readState } = require('../lib/state');

function exists(projectRoot, relativePath) {
  return fs.existsSync(path.join(projectRoot, relativePath));
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
  const packageManagerField = readJsonIfExists(path.join(projectRoot, 'package.json'))?.packageManager;
  if (typeof packageManagerField === 'string' && packageManagerField.trim()) {
    return packageManagerField.split('@')[0];
  }

  const signals = [
    ['bun', 'bun.lockb'],
    ['bun', 'bun.lock'],
    ['pnpm', 'pnpm-lock.yaml'],
    ['yarn', 'yarn.lock'],
    ['npm', 'package-lock.json'],
  ];

  for (const [manager, filename] of signals) {
    if (exists(projectRoot, filename)) {
      return manager;
    }
  }

  return 'npm';
}

function formatRunScriptCommand(packageManager, scriptName) {
  const manager = ['npm', 'pnpm', 'yarn', 'bun'].includes(packageManager) ? packageManager : 'npm';
  return `${manager} run ${scriptName}`;
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

function safeReadApproval(projectRoot, phase) {
  try {
    return readPhaseApproval(projectRoot, phase);
  } catch (error) {
    return {
      phase,
      status: 'invalid',
      error: error.message,
    };
  }
}

function safeReadPlanReview(projectRoot) {
  try {
    return readPlanReview(projectRoot);
  } catch (error) {
    return {
      status: 'invalid',
      error: error.message,
    };
  }
}

function safeBuildApprovalCandidateReport(projectRoot, phase) {
  try {
    return buildApprovalCandidateReport(projectRoot, phase);
  } catch (error) {
    return {
      phase,
      approval_status: 'invalid',
      latest_version: null,
      current: null,
      recommended: null,
      candidates: [],
      history: [],
      approved: null,
      next_command: 'npx create-quiver ai approvals',
      error: error.message,
    };
  }
}

function summarizeDocs(projectRoot) {
  const docs = {
    hasProjectMap: exists(projectRoot, 'docs/PROJECT_MAP.md'),
    hasAiContext: exists(projectRoot, 'docs/AI_CONTEXT.md'),
    hasOnboardingPrompt: exists(projectRoot, 'docs/AI_ONBOARDING_PROMPT.md'),
    scanStatus: readProjectScanStatus(projectRoot),
  };
  const missing = [
    ['docs/PROJECT_MAP.md', docs.hasProjectMap],
    ['docs/AI_CONTEXT.md', docs.hasAiContext],
    ['docs/AI_ONBOARDING_PROMPT.md', docs.hasOnboardingPrompt],
  ].filter(([, present]) => !present).map(([file]) => file);

  return {
    ...docs,
    missing,
    ready: missing.length === 0,
  };
}

function summarizeAgentProfiles(projectRoot) {
  const profiles = listAgentProfiles(projectRoot);
  return {
    configured: profiles.filter((item) => item.configured).map((item) => item.role),
    missingCore: profiles
      .filter((item) => ['planner', 'executor'].includes(item.role) && !item.configured)
      .map((item) => item.role),
  };
}

function buildFacts({ initialized, docs, approvals, planReview, agents, packageManager, specSlugs, state, slices = null }) {
  return {
    initialized,
    hasProjectMap: docs.hasProjectMap,
    hasAiContext: docs.hasAiContext,
    hasOnboardingPrompt: docs.hasOnboardingPrompt,
    approvals: {
      acceptance: approvals.acceptance.status,
      technicalPlan: approvals.technicalPlan.status,
      planReview: planReview.status,
    },
    agents,
    specSlugs,
    slices,
    contextSource: docs.scanStatus,
    packageManager,
    flowScriptCommand: formatRunScriptCommand(packageManager, 'quiver:flow'),
    quiverVersion: state?.quiver_version || null,
  };
}

function firstSpecPath(specSlugs) {
  return `specs/${specSlugs[0]}`;
}

function formatSliceCommand(slice) {
  return `npx create-quiver ai execute-slice --slice ${path.relative(slice.repoRoot, slice.slicePath).split(path.sep).join('/')} --dry-run --commit`;
}

function summarizeSlices(projectRoot, specSlugs) {
  if (specSlugs.length === 0) {
    return {
      allCompleted: false,
      blockers: [],
      completedCount: 0,
      graphError: null,
      pendingCount: 0,
      ready: [],
      slice00: null,
      totalCount: 0,
    };
  }

  let allSlices = [];
  try {
    allSlices = readAllSlices(projectRoot)
      .filter((slice) => specSlugs.includes(slice.specSlug))
      .map((slice) => ({ ...slice, repoRoot: projectRoot }));
  } catch (error) {
    return {
      allCompleted: false,
      blockers: [`Could not read slices: ${error.message}`],
      completedCount: 0,
      graphError: error.message,
      pendingCount: 0,
      ready: [],
      slice00: null,
      totalCount: 0,
    };
  }

  if (allSlices.length === 0) {
    return {
      allCompleted: false,
      blockers: ['No slice.json files found for the detected specs.'],
      completedCount: 0,
      graphError: null,
      pendingCount: 0,
      ready: [],
      slice00: null,
      totalCount: 0,
    };
  }

  let graph;
  try {
    graph = buildGraph(allSlices);
  } catch (error) {
    return {
      allCompleted: false,
      blockers: [`Slice graph is not ready: ${error.message}`],
      completedCount: allSlices.filter((slice) => slice.status === 'completed').length,
      graphError: error.message,
      pendingCount: allSlices.filter((slice) => slice.status !== 'completed').length,
      ready: [],
      slice00: allSlices.find((slice) => naturalNumberFromSliceId(slice.sliceId) === 0) || null,
      totalCount: allSlices.length,
    };
  }

  const nodes = graph.nodes.map((slice) => ({ ...slice, repoRoot: projectRoot }));
  const completedRefs = new Set(nodes.filter((slice) => slice.status === 'completed').map((slice) => slice.ref));
  const pending = nodes.filter((slice) => slice.status !== 'completed');
  const slice00 = nodes.find((slice) => naturalNumberFromSliceId(slice.sliceId) === 0) || null;
  let ready = pending.filter((slice) => slice.depends_on.every((dep) => completedRefs.has(dep)));

  if (slice00 && slice00.status !== 'completed') {
    ready = ready.filter((slice) => slice.ref === slice00.ref);
  }

  return {
    allCompleted: pending.length === 0,
    blockers: [],
    completedCount: completedRefs.size,
    graphError: null,
    pendingCount: pending.length,
    ready,
    slice00,
    totalCount: nodes.length,
  };
}

function baseReport({ stage, label, blockers = [], nextCommand, suggestedCommands, facts }) {
  return {
    stage,
    label,
    blockers,
    nextCommand,
    suggestedCommands,
    facts,
  };
}

function detectFlowState(projectRoot) {
  const initialized = hasQuiverInitializationEvidence(projectRoot);
  const state = readState(projectRoot);
  const docs = summarizeDocs(projectRoot);
  const approvals = {
    acceptance: safeReadApproval(projectRoot, 'acceptance'),
    technicalPlan: safeReadApproval(projectRoot, 'technical-plan'),
  };
  const approvalCandidates = {
    acceptance: safeBuildApprovalCandidateReport(projectRoot, 'acceptance'),
    technicalPlan: safeBuildApprovalCandidateReport(projectRoot, 'technical-plan'),
  };
  const planReview = safeReadPlanReview(projectRoot);
  const agents = summarizeAgentProfiles(projectRoot);
  const packageManager = detectPackageManager(projectRoot);
  const specSlugs = listSpecSlugs(projectRoot);
  const facts = buildFacts({ initialized, docs, approvals, planReview, agents, packageManager, specSlugs, state });
  const acceptanceApprovalCommand = approvalCandidateCommand(
    approvalCandidates.acceptance,
    'npx create-quiver ai approve --phase acceptance --version <n>',
  );
  const technicalPlanApprovalCommand = approvalCandidateCommand(
    approvalCandidates.technicalPlan,
    'npx create-quiver ai approve --phase technical-plan --version <n>',
  );

  if (!initialized) {
    return baseReport({
      stage: 'not-initialized',
      label: 'not initialized',
      blockers: ['Quiver has not been initialized in this project.'],
      nextCommand: 'npx create-quiver init --name "Project Name"',
      suggestedCommands: [
        'npx create-quiver init --name "Project Name"',
        'npx create-quiver analyze',
        'npx create-quiver doctor',
      ],
      facts,
    });
  }

  if (!docs.ready) {
    return baseReport({
      stage: 'context-needed',
      label: 'context needs refresh',
      blockers: docs.missing.map((file) => `Missing ${file}.`),
      nextCommand: 'npx create-quiver analyze',
      suggestedCommands: [
        'npx create-quiver prepare --dry-run',
        'npx create-quiver analyze',
        'npx create-quiver doctor',
      ],
      facts,
    });
  }

  const invalidApprovals = Object.values(approvals).filter((approval) => approval.status === 'invalid');
  if (invalidApprovals.length > 0) {
    return baseReport({
      stage: 'approval-state-invalid',
      label: 'approval state needs repair',
      blockers: invalidApprovals.map((approval) => approval.error),
      nextCommand: 'npx create-quiver ai approvals',
      suggestedCommands: [
        'npx create-quiver ai approvals',
        'npx create-quiver doctor',
      ],
      facts,
    });
  }

  if (planReview.status === 'invalid') {
    return baseReport({
      stage: 'plan-review-state-invalid',
      label: 'plan review state needs repair',
      blockers: [planReview.error],
      nextCommand: 'npx create-quiver ai approvals',
      suggestedCommands: [
        'npx create-quiver ai approvals',
        'npx create-quiver doctor',
      ],
      facts,
    });
  }

  if (approvals.acceptance.status === 'missing' && approvals.technicalPlan.status === 'missing' && specSlugs.length === 0 && agents.missingCore.length > 0) {
    const role = agents.missingCore[0];
    return baseReport({
      stage: 'agent-profiles-needed',
      label: 'agent profiles need setup',
      blockers: [`Missing ${agents.missingCore.join(' and ')} agent profile${agents.missingCore.length > 1 ? 's' : ''}.`],
      nextCommand: `npx create-quiver ai agent set ${role} --provider codex --model gpt-5.5`,
      suggestedCommands: [
        'npx create-quiver ai agent list',
        `npx create-quiver ai agent set ${role} --provider codex --model gpt-5.5`,
      ],
      facts,
    });
  }

  if (approvals.acceptance.status === 'draft') {
    return baseReport({
      stage: 'criteria-draft',
      label: 'acceptance criteria need approval',
      blockers: ['Acceptance criteria draft exists but is not approved.', formatCandidateSummary(approvalCandidates.acceptance.current)].filter(Boolean),
      nextCommand: acceptanceApprovalCommand,
      suggestedCommands: [
        'npx create-quiver ai approvals',
        'npx create-quiver ai revise --phase acceptance --input feedback.md --dry-run',
        acceptanceApprovalCommand,
      ],
      facts,
    });
  }

  if (approvals.acceptance.status === 'stale') {
    return baseReport({
      stage: 'criteria-stale',
      label: 'acceptance criteria approval is stale',
      blockers: ['Acceptance criteria changed after approval.', formatCandidateSummary(approvalCandidates.acceptance.current)].filter(Boolean),
      nextCommand: acceptanceApprovalCommand,
      suggestedCommands: [
        'npx create-quiver ai approvals',
        'npx create-quiver ai revise --phase acceptance --input feedback.md --dry-run',
        acceptanceApprovalCommand,
      ],
      facts,
    });
  }

  if (approvals.acceptance.status !== 'approved') {
    return baseReport({
      stage: 'planning-ready',
      label: 'ready for acceptance criteria',
      blockers: [],
      nextCommand: 'npx create-quiver ai onboard --dry-run',
      suggestedCommands: [
        'npx create-quiver ai onboard --dry-run',
        'npx create-quiver ai plan --phase acceptance --input requirements.md --dry-run',
      ],
      facts,
    });
  }

  if (approvals.technicalPlan.status === 'draft') {
    if (planReview.status !== 'unapproved') {
      return baseReport({
        stage: 'technical-plan-review-needed',
        label: 'technical plan needs production review',
        blockers: ['Technical plan draft exists but has not been reviewed for production readiness.'],
        nextCommand: 'npx create-quiver ai review-plan --dry-run',
        suggestedCommands: [
          'npx create-quiver ai approvals',
          'npx create-quiver ai review-plan --dry-run',
          'npx create-quiver ai review-plan',
        ],
        facts,
      });
    }

    if (!approvalCandidates.technicalPlan.current?.approvable) {
      return baseReport({
        stage: 'technical-plan-review-blocked',
        label: 'technical plan review requires revision',
        blockers: ['Technical plan review blocks approval.', formatCandidateSummary(approvalCandidates.technicalPlan.current)].filter(Boolean),
        nextCommand: approvalCandidates.technicalPlan.current?.next_command || 'npx create-quiver ai revise --phase technical-plan --input <feedback.md> --dry-run',
        suggestedCommands: [
          'npx create-quiver ai approvals',
          approvalCandidates.technicalPlan.current?.next_command || 'npx create-quiver ai revise --phase technical-plan --input <feedback.md> --dry-run',
          'npx create-quiver ai review-plan --dry-run',
        ],
        facts,
      });
    }

    return baseReport({
      stage: 'technical-plan-draft',
      label: 'technical plan needs approval',
      blockers: ['Technical plan draft was reviewed but is not approved.', formatCandidateSummary(approvalCandidates.technicalPlan.current)].filter(Boolean),
      nextCommand: technicalPlanApprovalCommand,
      suggestedCommands: [
        'npx create-quiver ai approvals',
        technicalPlanApprovalCommand,
      ],
      facts,
    });
  }

  if (approvals.technicalPlan.status === 'stale') {
    if (planReview.status !== 'unapproved') {
      return baseReport({
        stage: 'technical-plan-review-needed',
        label: 'technical plan needs production review',
        blockers: ['Technical plan changed after approval and needs a fresh production review.'],
        nextCommand: 'npx create-quiver ai review-plan --dry-run',
        suggestedCommands: [
          'npx create-quiver ai approvals',
          'npx create-quiver ai review-plan --dry-run',
          'npx create-quiver ai review-plan',
        ],
        facts,
      });
    }

    if (!approvalCandidates.technicalPlan.current?.approvable) {
      return baseReport({
        stage: 'technical-plan-review-blocked',
        label: 'technical plan review requires revision',
        blockers: ['Technical plan changed after approval and latest review blocks approval.', formatCandidateSummary(approvalCandidates.technicalPlan.current)].filter(Boolean),
        nextCommand: approvalCandidates.technicalPlan.current?.next_command || 'npx create-quiver ai revise --phase technical-plan --input <feedback.md> --dry-run',
        suggestedCommands: [
          'npx create-quiver ai approvals',
          approvalCandidates.technicalPlan.current?.next_command || 'npx create-quiver ai revise --phase technical-plan --input <feedback.md> --dry-run',
          'npx create-quiver ai review-plan --dry-run',
        ],
        facts,
      });
    }

    return baseReport({
      stage: 'technical-plan-stale',
      label: 'technical plan approval is stale',
      blockers: ['Technical plan changed after approval and the latest draft was reviewed.', formatCandidateSummary(approvalCandidates.technicalPlan.current)].filter(Boolean),
      nextCommand: technicalPlanApprovalCommand,
      suggestedCommands: [
        'npx create-quiver ai approvals',
        technicalPlanApprovalCommand,
      ],
      facts,
    });
  }

  if (approvals.technicalPlan.status !== 'approved') {
    return baseReport({
      stage: 'technical-plan-ready',
      label: 'ready for technical plan',
      blockers: [],
      nextCommand: 'npx create-quiver ai plan --phase technical-plan --dry-run',
      suggestedCommands: [
        'npx create-quiver ai plan --phase technical-plan --dry-run',
        'npx create-quiver ai review-plan --dry-run',
      ],
      facts,
    });
  }

  if (specSlugs.length === 0 && planReview.status !== 'reviewed') {
    return baseReport({
      stage: 'technical-plan-review-needed',
      label: 'technical plan needs production review',
      blockers: [`Plan review status is ${planReview.status}.`],
      nextCommand: 'npx create-quiver ai review-plan --dry-run',
      suggestedCommands: [
        'npx create-quiver ai review-plan --dry-run',
        'npx create-quiver ai review-plan',
      ],
      facts,
    });
  }

  if (specSlugs.length === 0) {
    return baseReport({
      stage: 'spec-ready',
      label: 'ready for spec generation',
      blockers: [],
      nextCommand: 'npx create-quiver spec create --dry-run',
      suggestedCommands: [
        'npx create-quiver spec create --dry-run',
        'npx create-quiver spec create',
        'npx create-quiver spec start specs/<spec-slug>',
      ],
      facts,
    });
  }

  const slices = summarizeSlices(projectRoot, specSlugs);
  const sliceFacts = buildFacts({ initialized, docs, approvals, planReview, agents, packageManager, specSlugs, state, slices: {
    completed: slices.completedCount,
    pending: slices.pendingCount,
    ready: slices.ready.map((slice) => slice.ref),
    total: slices.totalCount,
  } });

  if (slices.blockers.length > 0) {
    return baseReport({
      stage: 'slice-state-blocked',
      label: 'slice state has blockers',
      blockers: slices.blockers,
      nextCommand: `npx create-quiver spec status ${firstSpecPath(specSlugs)}`,
      suggestedCommands: [
        `npx create-quiver spec status ${firstSpecPath(specSlugs)}`,
        'npx create-quiver plan',
      ],
      facts: sliceFacts,
    });
  }

  if (slices.allCompleted) {
    return baseReport({
      stage: 'pr-ready',
      label: 'ready for PR preparation',
      blockers: [],
      nextCommand: `npx create-quiver ai pr --dry-run --input ${firstSpecPath(specSlugs)}/pr.md`,
      suggestedCommands: [
        `npx create-quiver ai pr --dry-run --input ${firstSpecPath(specSlugs)}/pr.md`,
        `npx create-quiver spec status ${firstSpecPath(specSlugs)}`,
      ],
      facts: sliceFacts,
    });
  }

  const nextSlice = slices.ready[0] || null;
  if (nextSlice && slices.slice00 && slices.slice00.status !== 'completed') {
    return baseReport({
      stage: 'slice-00-ready',
      label: 'slice-00 must be executed first',
      blockers: ['Later slices are blocked until slice-00 is completed and committed.'],
      nextCommand: formatSliceCommand(nextSlice),
      suggestedCommands: [
        `npx create-quiver spec status ${firstSpecPath(specSlugs)}`,
        formatSliceCommand(nextSlice),
      ],
      facts: sliceFacts,
    });
  }

  if (nextSlice) {
    return baseReport({
      stage: 'slice-execution-ready',
      label: 'ready for slice execution',
      blockers: [],
      nextCommand: formatSliceCommand(nextSlice),
      suggestedCommands: [
        'npx create-quiver plan',
        'npx create-quiver next',
        formatSliceCommand(nextSlice),
      ],
      facts: sliceFacts,
    });
  }

  return baseReport({
    stage: 'slices-ready',
    label: 'slice planning needs review',
    blockers: ['No ready slice was found. Review dependencies and statuses.'],
    nextCommand: 'npx create-quiver plan',
    suggestedCommands: [
      'npx create-quiver plan',
      'npx create-quiver graph',
      'npx create-quiver next',
    ],
    facts: sliceFacts,
  });
}

function formatFlowReport(report) {
  const lines = [
    'Quiver guided flow',
    '',
    'Command path:',
    '- Bootstrap and remote use: npx create-quiver <command>',
    '- Short alias after local install: quiver <command>',
    `- Generated project script: ${report.facts.flowScriptCommand}`,
    '',
    `Package manager: ${report.facts.packageManager}`,
    `Stage: ${report.label}`,
    `Next safe command: ${report.nextCommand}`,
    `Context source: ${report.facts.contextSource.summary}`,
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
