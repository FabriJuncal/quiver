const UX_FLAG_OPTIONS = Object.freeze({
  withPlanner: '--with-planner',
  interactive: '--interactive',
  review: '--review',
});

const UX_FLAG_MATRIX = Object.freeze({
  init: Object.freeze({
    withPlanner: false,
    interactive: true,
    review: false,
    note: 'guided project onboarding choices',
  }),
  'ai prepare-context': Object.freeze({
    withPlanner: true,
    interactive: true,
    review: true,
    note: 'planner-assisted docs-only context preparation',
  }),
  'ai plan': Object.freeze({
    withPlanner: true,
    interactive: true,
    review: true,
    note: 'planner draft generation and human approval workflow',
  }),
  'spec create': Object.freeze({
    withPlanner: true,
    interactive: true,
    review: true,
    note: 'spec generation from approved planner output',
  }),
  'ai pr': Object.freeze({
    withPlanner: false,
    interactive: true,
    review: true,
    note: 'PR body review and interactive PR inputs',
  }),
  'ai execute-slice': Object.freeze({
    withPlanner: false,
    interactive: true,
    review: false,
    note: 'executor profile and ready-slice selection',
  }),
  'ai execute-plan': Object.freeze({
    withPlanner: false,
    interactive: true,
    review: false,
    note: 'execution strategy confirmation and future selectors',
  }),
  dashboard: Object.freeze({
    withPlanner: false,
    interactive: false,
    review: false,
    note: 'read-only consolidated project status',
  }),
});

function formatError(message) {
  return `create-quiver: ${message}`;
}

function normalizeCommandKey(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function resolveUxCommandKey(args = {}) {
  if (args.mode === 'ai') {
    const command = args.aiCommand || '';
    if (command === 'specs' || command === 'slices' || command === 'trace' || command === 'active-slice') {
      return normalizeCommandKey(`ai ${command} ${args.aiSecondaryCommand || ''}`);
    }
    if (command === 'agent') {
      return normalizeCommandKey(`ai ${command} ${args.aiAgentCommand || ''}`);
    }
    if (command === 'run') {
      return normalizeCommandKey(`ai ${command} ${args.aiRunCommand || ''}`);
    }
    return normalizeCommandKey(`ai ${command}`);
  }

  if (args.mode === 'spec') {
    return normalizeCommandKey(`spec ${args.specCommand || ''}`);
  }

  if (args.mode === 'demo') {
    return normalizeCommandKey(`demo ${args.demoCommand || ''} ${args.demoName || ''}`);
  }

  if (args.mode === 'evidence') {
    return normalizeCommandKey(`evidence ${args.evidenceCommand || ''}`);
  }

  return normalizeCommandKey(args.mode);
}

function getUxFlagSupport(commandKey) {
  return UX_FLAG_MATRIX[normalizeCommandKey(commandKey)] || Object.freeze({
    withPlanner: false,
    interactive: false,
    review: false,
    note: 'no UX flag support',
  });
}

function getRequestedUxFlags(args = {}) {
  return Object.keys(UX_FLAG_OPTIONS).filter((key) => args[key] === true);
}

function supportedFlagList(support) {
  return Object.entries(UX_FLAG_OPTIONS)
    .filter(([key]) => support[key] === true)
    .map(([, flag]) => flag);
}

function explainAlternative(flag) {
  if (flag === 'withPlanner') {
    return 'Use a planner-capable command such as: npx create-quiver ai prepare-context --with-planner --dry-run';
  }
  if (flag === 'interactive') {
    return 'Use explicit non-interactive flags for automation, or run a command that documents --interactive support.';
  }
  if (flag === 'review') {
    return 'Use a command with persistent AI-generated output, then rerun with --review after inspecting the dry-run.';
  }
  return 'Run: npx create-quiver --help';
}

function buildUnsupportedFlagError(commandKey, flag, support) {
  const flagName = UX_FLAG_OPTIONS[flag];
  const supported = supportedFlagList(support);
  const supportedText = supported.length > 0 ? supported.join(', ') : 'none';

  return new Error(formatError([
    `UX flag ${flagName} is not supported by '${commandKey}'.`,
    `Supported UX flags for '${commandKey}': ${supportedText}.`,
    explainAlternative(flag),
  ].join('\n')));
}

function validateUxFlagCombinations(args = {}, commandKey = resolveUxCommandKey(args)) {
  if (args.json && args.interactive) {
    throw new Error(formatError(`incompatible UX flags for '${commandKey}': --json cannot be combined with --interactive because JSON output must stay machine-readable.`));
  }
  if (args.json && args.review) {
    throw new Error(formatError(`incompatible UX flags for '${commandKey}': --json cannot be combined with --review because editor review is a human-only flow.`));
  }
}

function validateUxFlags(args = {}) {
  const commandKey = resolveUxCommandKey(args);
  validateUxFlagCombinations(args, commandKey);

  const support = getUxFlagSupport(commandKey);
  for (const flag of getRequestedUxFlags(args)) {
    if (support[flag] !== true) {
      throw buildUnsupportedFlagError(commandKey, flag, support);
    }
  }

  return {
    commandKey,
    requested: getRequestedUxFlags(args).map((flag) => UX_FLAG_OPTIONS[flag]),
    supported: supportedFlagList(support),
  };
}

module.exports = {
  UX_FLAG_MATRIX,
  UX_FLAG_OPTIONS,
  getRequestedUxFlags,
  getUxFlagSupport,
  resolveUxCommandKey,
  validateUxFlagCombinations,
  validateUxFlags,
};
