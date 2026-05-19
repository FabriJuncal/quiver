const fs = require('node:fs');
const path = require('node:path');

const { buildContextPackMetadata, normalizeRole } = require('../lib/ai/context-packs');
const { buildProviderInvocation, runProvider } = require('../lib/ai/providers');
const { assertPlannerPhaseReady, getPlannerPhaseDetails, normalizePlannerPhase, PlannerPhaseError } = require('../lib/ai/phase-gates');

const DEFAULT_ONBOARD_PROVIDER = 'codex';
const DEFAULT_ONBOARD_ROLE = 'planner';
const DEFAULT_ONBOARD_CONTEXT = 'full';
const DEFAULT_PLAN_PROVIDER = 'codex';
const DEFAULT_PLAN_ROLE = 'planner';
const DEFAULT_PLAN_CONTEXT = 'planning';
const DEFAULT_PLAN_PHASE = 'acceptance';

function formatError(message) {
  return `create-quiver: ${message}`;
}

function readTextFile(filePath, repoRoot) {
  if (!filePath) {
    return '';
  }

  const resolved = path.resolve(repoRoot, filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(formatError(`missing input file: ${filePath}`));
  }

  return fs.readFileSync(resolved, 'utf8');
}

function normalizeTimeout(timeoutMs) {
  if (timeoutMs === undefined || timeoutMs === null || timeoutMs === '') {
    return undefined;
  }

  const parsed = Number(timeoutMs);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(formatError(`invalid timeout value: ${timeoutMs}`));
  }

  return parsed;
}

function buildPlanContext({ role, context, phase, inputText, inputPath, repoRoot }) {
  const phaseDetails = getPlannerPhaseDetails(phase);
  const pack = buildContextPackMetadata({
    role,
    packName: context || phaseDetails.contextPack,
  });
  const relativeInputPath = inputPath ? path.relative(repoRoot, path.resolve(repoRoot, inputPath)).split(path.sep).join('/') : '';
  const sections = [
    pack.prompt,
    `Phase: ${phaseDetails.phase}`,
    phaseDetails.phase === 'acceptance'
      ? 'Task: produce acceptance criteria only. Do not create files or modify product code.'
      : 'Task: produce a technical plan only. Do not create files or modify product code.',
  ];

  if (relativeInputPath) {
    sections.push(`Input file: ${relativeInputPath}`);
  }

  if (inputText) {
    sections.push('Input:', inputText.trimEnd());
  }

  return {
    pack,
    prompt: sections.join('\n\n'),
    phaseDetails,
  };
}

function buildOnboardContext({ role, context, inputText, inputPath, repoRoot }) {
  const pack = buildContextPackMetadata({
    role,
    packName: context || DEFAULT_ONBOARD_CONTEXT,
  });
  const relativeInputPath = inputPath ? path.relative(repoRoot, path.resolve(repoRoot, inputPath)).split(path.sep).join('/') : '';
  const sections = [
    pack.prompt,
    'Task: onboard the project context for planning.',
    'Read Quiver context, the WDD/SDD workflow, the project scan/map, assumptions, risks, and relevant docs.',
    'Do not modify product code.',
  ];

  if (relativeInputPath) {
    sections.push(`Input file: ${relativeInputPath}`);
  }

  if (inputText) {
    sections.push('Input:', inputText.trimEnd());
  }

  return {
    pack,
    prompt: sections.join('\n\n'),
  };
}

function formatDryRunReport({ task, provider, role, contextPack, phase, invocation }) {
  const lines = [
    `AI ${task} dry-run`,
    `Provider: ${provider}`,
    `Role: ${role}`,
    `Context pack: ${contextPack}`,
  ];

  if (phase) {
    lines.push(`Phase: ${phase}`);
  }

  lines.push(`Command: ${invocation.command} ${invocation.args.join(' ')}`);
  lines.push(`Timeout: ${invocation.timeoutMs}ms`);
  lines.push(`Prompt transport: ${invocation.promptTransport.mode}`);
  lines.push(`Prompt length: ${invocation.promptLength} bytes`);

  return `${lines.join('\n')}\n`;
}

function writeProviderOutput(result) {
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
}

function annotateProviderError(error, scope, phase) {
  const phaseLabel = phase ? ` phase '${phase}'` : '';
  const message = error && error.message ? error.message : String(error);
  const wrapped = new Error(formatError(`ai ${scope}${phaseLabel} failed: ${message}`));
  wrapped.cause = error;
  wrapped.code = error && error.code ? error.code : 'AI_PROVIDER_ERROR';
  wrapped.details = error && error.details ? error.details : undefined;
  return wrapped;
}

async function runOnboard(repoRoot, options = {}) {
  const provider = String(options.provider || DEFAULT_ONBOARD_PROVIDER).trim().toLowerCase();
  const role = normalizeRole(options.role || DEFAULT_ONBOARD_ROLE);
  const context = options.context || DEFAULT_ONBOARD_CONTEXT;
  const timeoutMs = normalizeTimeout(options.timeout);
  const inputText = readTextFile(options.input, repoRoot);
  const prompt = buildOnboardContext({ role, context, inputText, inputPath: options.input, repoRoot }).prompt;
  let invocation;

  try {
    invocation = buildProviderInvocation(provider, {
      prompt,
      cwd: repoRoot,
      timeoutMs,
    });
  } catch (error) {
    throw annotateProviderError(error, 'onboard');
  }

  if (options.dryRun) {
    const report = {
      task: 'onboard',
      provider,
      role,
      contextPack: context,
      invocation,
    };
    process.stdout.write(formatDryRunReport(report));
    return report;
  }

  let result;
  try {
    result = await (options.runProviderFn || runProvider)(provider, {
      prompt,
      cwd: repoRoot,
      timeoutMs,
      dryRun: false,
      probe: options.probe,
      spawn: options.spawn,
      tempRoot: options.tempRoot,
      tempFileName: options.tempFileName,
      tempFilePrefix: options.tempFilePrefix,
    });
  } catch (error) {
    throw annotateProviderError(error, 'onboard');
  }

  writeProviderOutput(result);

  if (!result.ok) {
    throw annotateProviderError(result.error || new Error('provider run failed'), 'onboard');
  }

  return {
    task: 'onboard',
    provider,
    role,
    contextPack: context,
    invocation,
    result,
  };
}

async function runPlan(repoRoot, options = {}) {
  const phase = normalizePlannerPhase(options.phase || DEFAULT_PLAN_PHASE);
  const role = normalizeRole(options.role || DEFAULT_PLAN_ROLE);
  const provider = String(options.provider || DEFAULT_PLAN_PROVIDER).trim().toLowerCase();
  const context = options.context || DEFAULT_PLAN_CONTEXT;
  const timeoutMs = normalizeTimeout(options.timeout);

  assertPlannerPhaseReady(phase);

  if (!options.input) {
    throw new Error(formatError(`missing input file for ai plan phase '${phase}'`));
  }

  const inputText = readTextFile(options.input, repoRoot);
  const contextInfo = buildPlanContext({
    role,
    context,
    phase,
    inputText,
    inputPath: options.input,
    repoRoot,
  });
  const prompt = contextInfo.prompt;
  let invocation;

  try {
    invocation = buildProviderInvocation(provider, {
      prompt,
      cwd: repoRoot,
      timeoutMs,
    });
  } catch (error) {
    throw annotateProviderError(error, 'plan', phase);
  }

  if (options.dryRun) {
    const report = {
      task: 'plan',
      provider,
      role,
      contextPack: contextInfo.pack.packName,
      phase,
      invocation,
    };
    process.stdout.write(formatDryRunReport(report));
    return report;
  }

  let result;
  try {
    result = await (options.runProviderFn || runProvider)(provider, {
      prompt,
      cwd: repoRoot,
      timeoutMs,
      dryRun: false,
      probe: options.probe,
      spawn: options.spawn,
      tempRoot: options.tempRoot,
      tempFileName: options.tempFileName,
      tempFilePrefix: options.tempFilePrefix,
    });
  } catch (error) {
    throw annotateProviderError(error, 'plan', phase);
  }

  writeProviderOutput(result);

  if (!result.ok) {
    throw annotateProviderError(result.error || new Error('provider run failed'), 'plan', phase);
  }

  return {
    task: 'plan',
    provider,
    role,
    contextPack: contextInfo.pack.packName,
    phase,
    invocation,
    result,
  };
}

module.exports = {
  DEFAULT_ONBOARD_CONTEXT,
  DEFAULT_ONBOARD_PROVIDER,
  DEFAULT_ONBOARD_ROLE,
  DEFAULT_PLAN_CONTEXT,
  DEFAULT_PLAN_PHASE,
  DEFAULT_PLAN_PROVIDER,
  DEFAULT_PLAN_ROLE,
  PlannerPhaseError,
  annotateProviderError,
  buildOnboardContext,
  buildPlanContext,
  formatDryRunReport,
  normalizeTimeout,
  readTextFile,
  runOnboard,
  runPlan,
  writeProviderOutput,
};
