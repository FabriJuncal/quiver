const fs = require('node:fs');
const path = require('node:path');

const { buildContextPackMetadata, normalizeRole } = require('../lib/ai/context-packs');
const { runExecuteSlice } = require('../lib/ai/executor');
const { formatPreflightReport, preflightGitHubPr } = require('../lib/ai/github');
const { buildSpecGenerationManifest, describeSpecGeneration, generateSpecArtifacts } = require('../lib/ai/spec-generator');
const { buildProviderInvocation, runProvider } = require('../lib/ai/providers');
const {
  PLANNER_APPROVAL_PHASES,
  approvePlannerPhase,
  resolveApprovedPlannerInput,
  savePlannerDraft,
  summarizePlannerApproval,
} = require('../lib/approvals');
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

function readTextFileOrEmpty(filePath, repoRoot) {
  if (!filePath) {
    return '';
  }

  return readTextFile(filePath, repoRoot);
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
    repoRoot,
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

  if (pack.scanArtifact) {
    sections.push(`Project scan artifact: ${pack.scanArtifact.path} (${pack.scanArtifact.source})`);
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
    repoRoot,
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

  if (pack.scanArtifact) {
    sections.push(`Project scan artifact: ${pack.scanArtifact.path} (${pack.scanArtifact.source})`);
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

function formatSpecDryRunReport({ manifest, repoRoot }) {
  const preview = describeSpecGeneration(manifest, repoRoot);
  const relativeSpecDir = path.relative(repoRoot, preview.specDir).split(path.sep).join('/');
  const lines = [
    'AI plan dry-run',
    'Phase: spec',
    `Spec slug: ${manifest.slug}`,
    `Title: ${manifest.title}`,
    `Input file: ${manifest.sourcePath}`,
    `Target: ${relativeSpecDir}`,
    `Planned files: ${preview.files.length}`,
  ];

  for (const file of preview.files) {
    lines.push(`- ${file}`);
  }

  return `${lines.join('\n')}\n`;
}

function formatSpecGenerationResult(result, repoRoot) {
  const relativeSpecDir = path.relative(repoRoot, result.specDir).split(path.sep).join('/');
  const lines = [
    'AI plan spec generation completed',
    `Spec slug: ${result.manifest.slug}`,
    `Target: ${relativeSpecDir}`,
    `Files written: ${result.files.length}`,
  ];

  for (const filePath of result.files) {
    lines.push(`- ${path.relative(repoRoot, filePath).split(path.sep).join('/')}`);
  }

  return `${lines.join('\n')}\n`;
}

function formatApprovalResult(result, repoRoot) {
  const relativePath = path.relative(repoRoot, result.filePath).split(path.sep).join('/');
  const lines = [
    'AI approval saved',
    `Phase: ${result.phase}`,
    `Status: approved`,
    `Artifact: ${relativePath}`,
    `Source file: ${result.sourceFile}`,
    `Timestamp: ${result.createdAt}`,
  ];

  return `${lines.join('\n')}\n`;
}

function formatApprovalDryRunResult({ phase, input }) {
  return `AI approval dry-run\nPhase: ${phase}\nInput file: ${input}\n`;
}

function formatApprovalStatusReport(repoRoot) {
  const sections = ['AI approvals status'];
  for (const phase of PLANNER_APPROVAL_PHASES) {
    sections.push(summarizePlannerApproval(repoRoot, phase).trimEnd());
  }
  return `${sections.join('\n\n')}\n`;
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

function annotateGitHubError(error, scope) {
  const message = error && error.message ? error.message : String(error);
  const wrapped = new Error(formatError(`ai ${scope} failed: ${message}`));
  wrapped.cause = error;
  wrapped.code = error && error.code ? error.code : 'AI_GITHUB_PR_ERROR';
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
  let inputPath = options.input || '';

  if (phase === 'spec') {
    const resolved = resolveApprovedPlannerInput(repoRoot, phase, inputPath || undefined);
    inputPath = resolved.inputPath;
    const inputText = readTextFileOrEmpty(inputPath, repoRoot);
    const manifest = buildSpecGenerationManifest({
      inputPath,
      inputText,
      repoRoot,
      specSlug: options.specSlug,
    });

    if (options.dryRun) {
      const report = {
        task: 'plan',
        phase,
        manifest,
      };
      process.stdout.write(formatSpecDryRunReport({ manifest, repoRoot }));
      return report;
    }

    const result = generateSpecArtifacts(repoRoot, {
      input: inputPath,
      specSlug: options.specSlug,
    });
    process.stdout.write(formatSpecGenerationResult(result, repoRoot));

    return {
      task: 'plan',
      phase,
      specSlug: result.manifest.slug,
      specDir: path.relative(repoRoot, result.specDir).split(path.sep).join('/'),
      files: result.files.map((filePath) => path.relative(repoRoot, filePath).split(path.sep).join('/')),
      manifest: result.manifest,
    };
  }

  assertPlannerPhaseReady(phase);

  if (phase === 'technical-plan') {
    const resolved = resolveApprovedPlannerInput(repoRoot, phase, inputPath || undefined);
    inputPath = resolved.inputPath;
  }

  if (!inputPath) {
    throw new Error(formatError(`missing input file for ai plan phase '${phase}'`));
  }

  const inputText = readTextFile(inputPath, repoRoot);
  const contextInfo = buildPlanContext({
    role,
    context,
    phase,
    inputText,
    inputPath,
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

  savePlannerDraft(repoRoot, phase, inputPath, [result.stdout, result.stderr].filter(Boolean).join(''));

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

async function runApprove(repoRoot, options = {}) {
  const phase = normalizePlannerPhase(options.phase || DEFAULT_PLAN_PHASE);
  if (phase === 'spec') {
    throw new Error(formatError(`ai approve does not support phase '${phase}'`));
  }

  if (!options.input) {
    throw new Error(formatError(`missing input file for ai approve phase '${phase}'`));
  }

  const inputText = readTextFile(options.input, repoRoot);

  if (options.dryRun) {
    process.stdout.write(formatApprovalDryRunResult({ phase, input: options.input }));
    return {
      task: 'approve',
      phase,
      input: options.input,
      dryRun: true,
    };
  }

  const result = approvePlannerPhase(repoRoot, phase, options.input, inputText);
  process.stdout.write(formatApprovalResult({
    ...result,
    sourceFile: options.input,
  }, repoRoot));

  return {
    task: 'approve',
    phase,
    input: options.input,
    filePath: path.relative(repoRoot, result.filePath).split(path.sep).join('/'),
    createdAt: result.createdAt,
  };
}

async function runApprovalStatus(repoRoot) {
  const report = formatApprovalStatusReport(repoRoot);
  process.stdout.write(report);
  return {
    task: 'approval-status',
    report,
  };
}

async function runGitHubTask(repoRoot, options = {}, mode = 'pr') {
  const dryRun = options.dryRun === true;
  let report;

  try {
    report = await (options.preflightFn || preflightGitHubPr)(repoRoot, {
      remote: options.remote,
      sshHostAlias: options.sshHostAlias,
      identityFile: options.identityFile,
      gitFlowGuidePath: options.gitFlowGuidePath,
      ghCommand: options.ghCommand,
      ghProbe: options.ghProbe,
      ghAuthProbe: options.ghAuthProbe,
      ghProbeArgs: options.ghProbeArgs,
      ghAuthArgs: options.ghAuthArgs,
      blockedBranches: options.blockedBranches,
    });
  } catch (error) {
    throw annotateGitHubError(error, mode);
  }

  process.stdout.write(formatPreflightReport(report, { mode, dryRun }));

  return {
    task: mode,
    dryRun,
    preflight: report,
  };
}

async function runPr(repoRoot, options = {}) {
  return runGitHubTask(repoRoot, options, 'pr');
}

async function runDoctor(repoRoot, options = {}) {
  return runGitHubTask(repoRoot, options, 'doctor');
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
  formatSpecGenerationResult,
  formatSpecDryRunReport,
  normalizeTimeout,
  readTextFile,
  runDoctor,
  runExecuteSlice,
  runApprove,
  runApprovalStatus,
  runPr,
  runOnboard,
  runPlan,
  writeProviderOutput,
};
