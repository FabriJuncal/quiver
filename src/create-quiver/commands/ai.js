const fs = require('node:fs');
const path = require('node:path');

const { buildContextPackMetadata, normalizeRole } = require('../lib/ai/context-packs');
const { runExecuteSlice, runPromptSlice } = require('../lib/ai/executor');
const { runExecutePlan } = require('../lib/ai/execution-plan');
const { buildPrCreatePlan, formatPreflightReport, formatPrCreateReport, preflightGitHubPr, runGhPrCreate } = require('../lib/ai/github');
const { buildContextPreparationDrafts, buildPlannerOnboardingPrompt } = require('../lib/ai/onboarding-template');
const {
  PLAN_REVIEW_PROMPT_SOURCE,
  buildPlanReviewPrompt,
  resolveReviewedTechnicalPlanInput,
  resolveTechnicalPlanReviewInput,
  savePlanReview,
  summarizePlanReview,
} = require('../lib/ai/plan-review');
const { buildSpecGenerationManifest, describeSpecGeneration, generateSpecArtifacts } = require('../lib/ai/spec-generator');
const { buildProviderInvocation, runProvider } = require('../lib/ai/providers');
const {
  agentProfilesPath,
  getAgentProfile,
  listAgentProfiles,
  resolveProfileProvider,
  setAgentProfile,
} = require('../lib/agent-profiles');
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

function resolveProviderForProfile(repoRoot, role, provider, providerExplicit, fallbackProvider) {
  if (providerExplicit === true || (provider && providerExplicit !== false)) {
    return String(provider || fallbackProvider).trim().toLowerCase();
  }
  return resolveProfileProvider(repoRoot, role, fallbackProvider);
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
  const built = buildPlannerOnboardingPrompt({
    pack,
    inputText,
    inputPath: relativeInputPath,
    repoRoot,
  });

  return {
    pack,
    plan: built.plan,
    prompt: built.prompt,
  };
}

function formatDryRunReport({ task, provider, role, contextPack, phase, invocation, onboardingPlan }) {
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

  if (onboardingPlan) {
    lines.push(`Prompt source: ${onboardingPlan.promptSource}`);
    lines.push(`Selected docs: ${onboardingPlan.selectedDocs.length}`);
    lines.push(`Documentation debt: ${onboardingPlan.missingDocs.length}`);
  }

  return `${lines.join('\n')}\n`;
}

function formatPathList(items, emptyLabel = 'none') {
  if (!Array.isArray(items) || items.length === 0) {
    return [`- ${emptyLabel}`];
  }

  return items.map((item) => `- ${item}`);
}

function formatContextPreparationReport({ dryRun, plan, docs, writtenDocs }) {
  const lines = [
    dryRun ? 'AI prepare-context dry-run' : 'AI prepare-context completed',
    `Mode: ${dryRun ? 'dry-run' : 'live'}`,
    `Project: ${plan.projectName}`,
    `Project slug: ${plan.projectSlug}`,
    'Writes: docs-only',
    'Product code: untouched',
    `Proposed docs: ${docs.length > 0 ? docs.map((doc) => doc.path).join(', ') : 'none'}`,
  ];

  if (!dryRun) {
    lines.push(`Written docs: ${writtenDocs.length > 0 ? writtenDocs.join(', ') : 'none'}`);
  }

  lines.push(
    'Files considered:',
    ...plan.filesConsidered.map((item) => `- ${item.path}: ${item.present ? 'present' : 'absent'}${item.reason ? ` (${item.reason})` : ''}`),
    'Assumptions:',
    ...formatPathList(plan.assumptions),
    'Risks:',
    ...formatPathList(plan.risks),
    'Omitted paths:',
    ...formatPathList(plan.omittedPaths),
    'Uncertainty markers: TODO | Assumption | Pending confirmation',
  );

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

function writeDraftDocs(repoRoot, drafts) {
  const writtenDocs = [];
  for (const draft of drafts) {
    const destinationPath = path.join(repoRoot, draft.path);
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.writeFileSync(destinationPath, `${draft.content.replace(/\s+$/g, '')}\n`);
    writtenDocs.push(draft.path);
  }
  return writtenDocs;
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
  if (result.version) {
    lines.push(`Version: v${result.version}`);
  }

  return `${lines.join('\n')}\n`;
}

function formatApprovalDryRunResult({ phase, input, version }) {
  const lines = ['AI approval dry-run', `Phase: ${phase}`];
  if (version) {
    lines.push(`Version: v${version}`);
  }
  if (input) {
    lines.push(`Input file: ${input}`);
  }
  return `${lines.join('\n')}\n`;
}

function formatApprovalStatusReport(repoRoot) {
  const sections = ['AI approvals status'];
  for (const phase of PLANNER_APPROVAL_PHASES) {
    sections.push(summarizePlannerApproval(repoRoot, phase).trimEnd());
  }
  sections.push(summarizePlanReview(repoRoot).trimEnd());
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
  const role = normalizeRole(options.role || DEFAULT_ONBOARD_ROLE);
  const provider = resolveProviderForProfile(repoRoot, role, options.provider, options.providerExplicit, DEFAULT_ONBOARD_PROVIDER);
  const context = options.context || DEFAULT_ONBOARD_CONTEXT;
  const timeoutMs = normalizeTimeout(options.timeout);
  const inputText = readTextFile(options.input, repoRoot);
  const contextInfo = buildOnboardContext({ role, context, inputText, inputPath: options.input, repoRoot });
  const prompt = contextInfo.prompt;
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
      onboardingPlan: contextInfo.plan,
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
    onboardingPlan: contextInfo.plan,
    result,
  };
}

async function runPrepareContext(repoRoot, options = {}) {
  const draftPack = buildContextPreparationDrafts(repoRoot);
  const report = {
    task: 'prepare-context',
    dryRun: options.dryRun === true,
    docs: draftPack.docs.map((doc) => doc.path),
    plan: draftPack.plan,
  };

  if (options.dryRun) {
    process.stdout.write(formatContextPreparationReport({
      dryRun: true,
      docs: draftPack.docs,
      plan: draftPack.plan,
      writtenDocs: [],
    }));
    return report;
  }

  const writtenDocs = writeDraftDocs(repoRoot, draftPack.docs);
  process.stdout.write(formatContextPreparationReport({
    dryRun: false,
    docs: draftPack.docs,
    plan: draftPack.plan,
    writtenDocs,
  }));

  return {
    ...report,
    writtenDocs,
  };
}

async function runPlan(repoRoot, options = {}) {
  const phase = normalizePlannerPhase(options.phase || DEFAULT_PLAN_PHASE);
  const role = normalizeRole(options.role || DEFAULT_PLAN_ROLE);
  const provider = resolveProviderForProfile(repoRoot, role, options.provider, options.providerExplicit, DEFAULT_PLAN_PROVIDER);
  const context = options.context || DEFAULT_PLAN_CONTEXT;
  const timeoutMs = normalizeTimeout(options.timeout);
  let inputPath = options.input || '';

  if (phase === 'spec') {
    const resolved = resolveReviewedTechnicalPlanInput(repoRoot, inputPath || undefined);
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

async function runReviewPlan(repoRoot, options = {}) {
  const role = 'planner';
  const provider = resolveProviderForProfile(repoRoot, 'reviewer', options.provider, options.providerExplicit, DEFAULT_PLAN_PROVIDER);
  const context = options.context || DEFAULT_PLAN_CONTEXT;
  const timeoutMs = normalizeTimeout(options.timeout);
  const resolved = resolveTechnicalPlanReviewInput(repoRoot, options.input || undefined);
  const inputPath = resolved.inputPath;
  const inputText = readTextFile(inputPath, repoRoot);
  const pack = buildContextPackMetadata({
    role,
    packName: context,
    repoRoot,
  });
  const built = buildPlanReviewPrompt({
    pack,
    inputText,
    inputPath,
  });
  let invocation;

  try {
    invocation = buildProviderInvocation(provider, {
      prompt: built.prompt,
      cwd: repoRoot,
      timeoutMs,
    });
  } catch (error) {
    throw annotateProviderError(error, 'review-plan');
  }

  if (options.dryRun) {
    const report = {
      task: 'review-plan',
      provider,
      role: 'reviewer',
      contextPack: pack.packName,
      invocation,
      promptSource: built.promptSource,
      inputPath,
      inputKind: resolved.kind,
      inputVersion: resolved.version,
    };
    process.stdout.write(formatDryRunReport({
      task: 'review-plan',
      provider,
      role: 'reviewer',
      contextPack: pack.packName,
      phase: 'plan-review',
      invocation,
    }));
    process.stdout.write(`Prompt source: ${built.promptSource}\n`);
    process.stdout.write(`Input file: ${inputPath}\n`);
    process.stdout.write(`Input kind: ${resolved.kind}\n`);
    if (resolved.version) {
      process.stdout.write(`Input version: v${resolved.version}\n`);
    }
    return report;
  }

  let result;
  try {
    result = await (options.runProviderFn || runProvider)(provider, {
      prompt: built.prompt,
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
    throw annotateProviderError(error, 'review-plan');
  }

  writeProviderOutput(result);

  if (!result.ok) {
    throw annotateProviderError(result.error || new Error('provider run failed'), 'review-plan');
  }

  const saved = savePlanReview(repoRoot, {
    contents: [result.stdout, result.stderr].filter(Boolean).join(''),
    inputPath,
    inputKind: resolved.kind,
    inputVersion: resolved.version,
  });
  const relativePath = path.relative(repoRoot, saved.filePath).split(path.sep).join('/');
  process.stdout.write(`AI plan review saved\nArtifact: ${relativePath}\nPrompt source: ${PLAN_REVIEW_PROMPT_SOURCE}\n`);

  return {
    task: 'review-plan',
    provider,
    role: 'reviewer',
    contextPack: pack.packName,
    inputPath,
    inputKind: resolved.kind,
    inputVersion: resolved.version,
    filePath: relativePath,
    invocation,
    result,
  };
}

async function runApprove(repoRoot, options = {}) {
  const phase = normalizePlannerPhase(options.phase || DEFAULT_PLAN_PHASE);
  if (phase === 'spec') {
    throw new Error(formatError(`ai approve does not support phase '${phase}'`));
  }

  if (!options.input && !options.version) {
    throw new Error(formatError(`missing input file for ai approve phase '${phase}'`));
  }

  const inputText = options.version ? '' : readTextFile(options.input, repoRoot);

  if (options.dryRun) {
    process.stdout.write(formatApprovalDryRunResult({ phase, input: options.input, version: options.version }));
    return {
      task: 'approve',
      phase,
      input: options.input,
      version: options.version || null,
      dryRun: true,
    };
  }

  const result = approvePlannerPhase(repoRoot, phase, options.input || '', inputText, {
    version: options.version || undefined,
  });
  process.stdout.write(formatApprovalResult({
    ...result,
    sourceFile: options.input || `draft version ${options.version}`,
  }, repoRoot));

  return {
    task: 'approve',
    phase,
    input: options.input,
    filePath: path.relative(repoRoot, result.filePath).split(path.sep).join('/'),
    createdAt: result.createdAt,
    version: result.version || null,
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

function formatAgentProfile(profile) {
  const lines = [
    `Role: ${profile.role}`,
    `Provider: ${profile.provider}`,
    `Model: ${profile.model || '(not set)'}`,
    `Label: ${profile.label || '(not set)'}`,
    `Context: ${profile.context || '(not set)'}`,
    `Updated: ${profile.updated_at}`,
  ];
  return `${lines.join('\n')}\n`;
}

function formatAgentProfileList(profiles) {
  const lines = ['AI agent profiles'];
  for (const item of profiles) {
    if (!item.configured) {
      lines.push(`- ${item.role}: not configured`);
      continue;
    }
    const model = item.profile.model ? ` model=${item.profile.model}` : '';
    const label = item.profile.label ? ` label=${item.profile.label}` : '';
    lines.push(`- ${item.role}: provider=${item.profile.provider}${model}${label}`);
  }
  return `${lines.join('\n')}\n`;
}

function runAgent(repoRoot, options = {}) {
  const command = String(options.command || '').trim().toLowerCase();

  if (command === 'set') {
    if (!options.role) {
      throw new Error(formatError('missing agent role. Use: npx create-quiver ai agent set <planner|executor|reviewer|researcher> --provider <provider>'));
    }
    if (!options.provider) {
      throw new Error(formatError('ai agent set requires --provider. Supported providers: codex, claude, gemini.'));
    }
    const result = setAgentProfile(repoRoot, options.role, {
      context: options.context,
      label: options.label,
      model: options.model,
      provider: options.provider,
    });
    process.stdout.write('AI agent profile saved\n');
    process.stdout.write(formatAgentProfile(result.profile));
    process.stdout.write(`State: ${path.relative(repoRoot, result.filePath).split(path.sep).join('/')}\n`);
    return {
      task: 'agent',
      command,
      profile: result.profile,
      filePath: path.relative(repoRoot, result.filePath).split(path.sep).join('/'),
    };
  }

  if (command === 'show') {
    if (!options.role) {
      throw new Error(formatError('missing agent role. Use: npx create-quiver ai agent show <planner|executor|reviewer|researcher>'));
    }
    const profile = getAgentProfile(repoRoot, options.role);
    if (!profile) {
      throw new Error(formatError(`agent profile '${options.role}' is not configured. Run: npx create-quiver ai agent set ${options.role} --provider <provider> --model <label>`));
    }
    process.stdout.write(formatAgentProfile(profile));
    return {
      task: 'agent',
      command,
      profile,
    };
  }

  if (command === 'list' || command === 'ls' || command === '') {
    const profiles = listAgentProfiles(repoRoot);
    process.stdout.write(formatAgentProfileList(profiles));
    process.stdout.write(`State: ${path.relative(repoRoot, agentProfilesPath(repoRoot)).split(path.sep).join('/')}\n`);
    return {
      task: 'agent',
      command: 'list',
      profiles,
    };
  }

  throw new Error(formatError(`unsupported ai agent subcommand: ${command}. Supported tasks: set, list, show`));
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
  const dryRun = options.dryRun === true;
  const create = options.create === true;
  let preflight;

  try {
    preflight = await (options.preflightFn || preflightGitHubPr)(repoRoot, {
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
    throw annotateGitHubError(error, 'pr');
  }

  let plan;
  try {
    plan = buildPrCreatePlan(repoRoot, preflight, {
      baseBranch: options.baseBranch,
      ghCommand: options.ghCommand,
      input: options.input,
      prBodyPath: options.prBodyPath,
      title: options.title,
    });
  } catch (error) {
    throw annotateGitHubError(error, 'pr');
  }

  if (dryRun || !create) {
    process.stdout.write(formatPrCreateReport({ preflight, plan }, { dryRun, create }));
    return {
      task: 'pr',
      dryRun,
      create,
      preflight,
      plan,
    };
  }

  let result;
  try {
    result = runGhPrCreate(plan, {
      ghCreateRunner: options.ghCreateRunner,
    });
  } catch (error) {
    throw annotateGitHubError(error, 'pr');
  }

  process.stdout.write(formatPrCreateReport({ preflight, plan, result }, { dryRun: false, create: true }));
  return {
    task: 'pr',
    dryRun: false,
    create: true,
    preflight,
    plan,
    result,
  };
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
  runAgent,
  runDoctor,
  runExecutePlan,
  runExecuteSlice,
  runPromptSlice,
  runApprove,
  runApprovalStatus,
  runPrepareContext,
  runReviewPlan,
  runPr,
  runOnboard,
  runPlan,
  writeProviderOutput,
};
