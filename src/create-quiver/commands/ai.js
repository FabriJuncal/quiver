const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { redactSecrets } = require('../lib/evidence');
const { formatActionableError } = require('../lib/actionable-error');
const {
  assertProviderPromptWithinLimit,
  byteLength,
  compactRevisionInput,
  extractCleanProviderOutput,
  redactSensitiveLocalValues,
  writeRawProviderArtifact,
} = require('../lib/ai/artifacts');
const { buildContextPackMetadata, normalizeRole } = require('../lib/ai/context-packs');
const { parseContextProposalOutput } = require('../lib/ai/context-proposal');
const { discoverProjectFiles } = require('../lib/ai/analyze-project-discovery');
const {
  buildAnalyzeProjectDocProposal,
  buildAnalyzeProjectWritePlan,
  createAnalyzeProjectSnapshot,
  formatAnalyzeProjectDiffPreview,
  writeAnalyzeProjectDocs,
} = require('../lib/ai/analyze-project-docs');
const { parseAnalyzeProjectOutput } = require('../lib/ai/analyze-project-parser');
const { buildAnalyzeProjectPrompt } = require('../lib/ai/analyze-project-prompts');
const {
  confirmAnalyzeProjectWrites,
  reviewAnalyzeProjectDocProposal,
} = require('../lib/ai/analyze-project-review');
const {
  DEFAULT_MAX_BYTES: DEFAULT_ANALYZE_MAX_BYTES,
  DEFAULT_MAX_FILES: DEFAULT_ANALYZE_MAX_FILES,
  sampleProjectFiles,
} = require('../lib/ai/analyze-project-sampling');
const { validateAnalyzeProjectPostWrite } = require('../lib/ai/analyze-project-validation');
const { openEditor } = require('../lib/cli/editor');
const { selectOption, promptText } = require('../lib/cli/selectors');
const { createUx } = require('../lib/cli/ux');
const { createTranslator } = require('../lib/i18n/catalog');
const { runExecuteSlice, runPromptSlice } = require('../lib/ai/executor');
const { runExecutePlan } = require('../lib/ai/execution-plan');
const { buildPrCreatePlan, formatPreflightReport, formatPrCreateReport, preflightGitHubPr, runGhPrCreate } = require('../lib/ai/github');
const {
  MODEL_CATALOG_LAST_UPDATED,
  MODEL_CATALOG_VERSION,
  getKnownModelsForProvider,
  listCatalogProviders,
} = require('../lib/ai/model-catalog');
const { buildContextPreparationDrafts, buildPlannerOnboardingPrompt } = require('../lib/ai/onboarding-template');
const {
  collectLifecycleExport,
  formatLifecycleExportMarkdown,
  formatLifecycleInspect,
  formatSlicesList,
  formatSpecsList,
  formatTraceReport,
} = require('../lib/ai/export-state');
const {
  PLAN_REVIEW_PROMPT_SOURCE,
  buildPlanReviewPrompt,
  readPlanReview,
  reviewBlocksApproval,
  resolveReviewedTechnicalPlanInput,
  resolveTechnicalPlanReviewInput,
  savePlanReview,
  summarizePlanReview,
} = require('../lib/ai/plan-review');
const {
  buildSpecGenerationManifest,
  describeSpecGeneration,
  generateSpecArtifacts,
  validateTechnicalPlanSpecContract,
} = require('../lib/ai/spec-generator');
const { buildProviderInvocation, runProvider } = require('../lib/ai/providers');
const { preflightProvider } = require('../lib/ai/preflight');
const {
  createAiRun,
  ensureAiRun,
  formatAiRunResume,
  formatAiRunStatus,
  listAiRuns,
  recordAiRunApproval,
  resolveAiRun,
  updateAiRunPhase,
} = require('../lib/ai/run-state');
const {
  agentProfilesPath,
  buildAgentProfileDoctorReport,
  buildAgentProfileRepairPlan,
  buildAgentProfileState,
  getAgentProfile,
  getAgentProfileById,
  getAgentProfilesForRole,
  listAgentProfiles,
  normalizeAgentProfileRole,
  resolveAgentProfileDisplayName,
  resolveProfileProvider,
  setAgentProfile,
} = require('../lib/agent-profiles');
const {
  PLANNER_APPROVAL_PHASES,
  approvePlannerPhase,
  findDraftVersion,
  latestDraftVersion,
  readPhaseApproval,
  resolveApprovedPlannerInput,
  savePlannerDraft,
  summarizePlannerApproval,
} = require('../lib/approvals');
const {
  buildApprovalCandidateReport,
  formatApprovalDecisionLines,
} = require('../lib/ai/approval-candidates');
const { assertPlannerPhaseReady, getPlannerPhaseDetails, normalizePlannerPhase, PlannerPhaseError } = require('../lib/ai/phase-gates');
const { formatStatus, translatorForHuman } = require('../lib/i18n/read-only-format');
const { collectActiveSliceState, resolveProjectState } = require('../lib/project-state-resolver');

const DEFAULT_ONBOARD_PROVIDER = 'codex';
const DEFAULT_ONBOARD_ROLE = 'planner';
const DEFAULT_ONBOARD_CONTEXT = 'full';
const DEFAULT_PLAN_PROVIDER = 'codex';
const DEFAULT_PLAN_ROLE = 'planner';
const DEFAULT_PLAN_CONTEXT = 'planning';
const DEFAULT_PLAN_PHASE = 'acceptance';
const CONTEXT_PREP_START = '<!-- quiver:context-prep:start -->';
const CONTEXT_PREP_END = '<!-- quiver:context-prep:end -->';
const ANALYZE_PROJECT_KIND = 'quiver-project-analysis-plan';

function formatError(message) {
  return `create-quiver: ${message}`;
}

function normalizeAnalyzeBudget(value, fallback, flagName) {
  if (typeof value === 'undefined' || value === null || value === '') {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(formatError(`invalid value for ${flagName}`));
  }
  return parsed;
}

function mergeReasonSummaries(...summaries) {
  const merged = {};
  for (const summary of summaries) {
    for (const [reason, count] of Object.entries(summary || {})) {
      merged[reason] = (merged[reason] || 0) + count;
    }
  }
  return Object.keys(merged)
    .sort()
    .reduce((acc, reason) => {
      acc[reason] = merged[reason];
      return acc;
    }, {});
}

function limitList(items, maxItems = 30) {
  const list = Array.isArray(items) ? items : [];
  return {
    items: list.slice(0, maxItems),
    hidden: Math.max(0, list.length - maxItems),
  };
}

function formatAnalyzeProjectIssues(issues = [], maxIssues = 8) {
  const list = Array.isArray(issues) ? issues : [];
  const visible = list.slice(0, maxIssues);
  const lines = visible.map((issue) => {
    const location = issue.path || 'analysis';
    const code = issue.issue || 'invalid';
    const message = issue.message || 'Invalid provider analysis output.';
    return `- ${location}: ${code} - ${message}`;
  });
  const hidden = list.length - visible.length;
  if (hidden > 0) {
    lines.push(`- ... ${hidden} more issue${hidden === 1 ? '' : 's'}`);
  }
  return lines;
}

function enhanceAnalyzeProjectAnalysisError(error) {
  if (!error || error.code !== 'AI_ANALYZE_PROJECT_INVALID') {
    return error;
  }

  const issueLines = formatAnalyzeProjectIssues(error.issues);
  if (issueLines.length === 0) {
    return error;
  }

  const wrapped = new Error([
    error.message,
    'Issues:',
    ...issueLines,
    'Next safe step: inspect the selected evidence with `npx create-quiver ai analyze-project --deep --dry-run --json`, then rerun live. If provider drift repeats, reduce --max-files or --max-bytes.',
  ].join('\n'));
  wrapped.name = error.name;
  wrapped.code = error.code;
  wrapped.cause = error;
  wrapped.issues = error.issues;
  wrapped.details = error.issues;
  return wrapped;
}

function formatAnalyzeProjectFileLine(file) {
  const details = [];
  if (Array.isArray(file.signals) && file.signals.length > 0) {
    details.push(file.signals.join(', '));
  }
  if (typeof file.bytes === 'number') {
    details.push(`${file.bytes} bytes`);
  }
  if (file.reason) {
    details.push(file.reason);
  }
  return `- ${file.path}${details.length > 0 ? ` (${details.join('; ')})` : ''}`;
}

function formatAnalyzeProjectReport(report) {
  const selected = limitList(report.selected_files, 80);
  const omitted = limitList(report.omitted_files, 30);
  const safety = limitList(report.safety_exclusions, 30);
  const workspaces = limitList(report.roots.workspaces, 20);
  const lines = [
    'AI analyze-project read-only analysis',
    `Mode: ${report.mode}`,
    `Dry-run: ${report.dry_run ? 'yes' : 'no'} (dry-run never writes)`,
    `Provider execution: ${report.provider_execution}`,
    `Writes: ${report.writes.length === 0 ? 'none' : report.writes.join(', ')}`,
    `Project: ${report.project.name}`,
    `Scope: ${report.options.scope}`,
    `Budgets: ${report.budgets.selected_files}/${report.budgets.max_files} files, ${report.budgets.selected_bytes}/${report.budgets.max_bytes} bytes`,
    `Selected files: ${report.selected_files.length}`,
    `Omitted files: ${report.omitted_files.length}`,
    `Safety exclusions: ${report.safety_exclusions.length}`,
    '',
    'Workspace roots:',
  ];

  for (const workspace of workspaces.items) {
    lines.push(`- ${workspace.path} (${workspace.name}; ${workspace.source})`);
  }
  if (workspaces.hidden > 0) {
    lines.push(`- ... ${workspaces.hidden} more`);
  }

  lines.push('', `Detected stack: ${report.detected.stack.length > 0 ? report.detected.stack.join(', ') : 'unknown'}`);
  lines.push(`Source roots: ${report.detected.source_roots.length > 0 ? report.detected.source_roots.join(', ') : 'none'}`);
  lines.push(`Entrypoints: ${report.detected.entrypoints.length > 0 ? report.detected.entrypoints.join(', ') : 'none'}`);
  lines.push(`Configs: ${report.detected.configs.length > 0 ? report.detected.configs.join(', ') : 'none'}`);

  lines.push('', 'Selected files:');
  for (const file of selected.items) {
    lines.push(formatAnalyzeProjectFileLine(file));
  }
  if (selected.hidden > 0) {
    lines.push(`- ... ${selected.hidden} more`);
  }
  if (selected.items.length === 0) {
    lines.push('- none');
  }

  lines.push('', 'Omitted files:');
  for (const file of omitted.items) {
    lines.push(formatAnalyzeProjectFileLine(file));
  }
  if (omitted.hidden > 0) {
    lines.push(`- ... ${omitted.hidden} more`);
  }
  if (omitted.items.length === 0) {
    lines.push('- none');
  }

  lines.push('', 'Safety exclusions:');
  for (const file of safety.items) {
    lines.push(`- ${file.path} (${file.reason})`);
  }
  if (safety.hidden > 0) {
    lines.push(`- ... ${safety.hidden} more`);
  }
  if (safety.items.length === 0) {
    lines.push('- none');
  }

  lines.push('', 'Next commands:');
  for (const command of report.next_commands) {
    lines.push(`- ${command}`);
  }

  return `${lines.join('\n')}\n`;
}

function buildAnalyzeProjectReport(repoRoot, options = {}) {
  const deep = options.deep === true;
  const includeSource = options.includeSource === true || deep;
  const includeDb = options.includeDb === true || deep;
  const includeTests = options.includeTests === true;
  const maxFiles = normalizeAnalyzeBudget(options.maxFiles, DEFAULT_ANALYZE_MAX_FILES, '--max-files');
  const maxBytes = normalizeAnalyzeBudget(options.maxBytes, DEFAULT_ANALYZE_MAX_BYTES, '--max-bytes');
  const discovery = discoverProjectFiles(repoRoot, { scope: options.scope || '' });
  const sample = sampleProjectFiles(discovery.files, {
    includeDb,
    includeSource,
    includeTests,
    maxBytes,
    maxFiles,
  });
  const omittedFiles = [
    ...sample.omittedFiles,
    ...discovery.skippedFiles.map((file) => ({
      path: file.path,
      reason: file.reason,
    })),
  ].sort((a, b) => a.path.localeCompare(b.path));
  const omittedSummary = mergeReasonSummaries(
    sample.omittedSummary,
    discovery.skippedSummary,
  );

  return {
    schema_version: 1,
    kind: ANALYZE_PROJECT_KIND,
    command: 'ai analyze-project',
    mode: 'read-only',
    dry_run: options.dryRun === true,
    read_only: true,
    provider_execution: 'skipped',
    writes: [],
    project: discovery.project,
    options: {
      deep,
      scope: discovery.roots.analysis_root,
      max_files: maxFiles,
      max_bytes: maxBytes,
      include_source: includeSource,
      include_tests: includeTests,
      include_db: includeDb,
    },
    roots: discovery.roots,
    detected: discovery.detected,
    budgets: sample.budgets,
    selected_files: sample.selectedFiles,
    omitted_files: omittedFiles,
    omitted_summary: omittedSummary,
    safety_exclusions: discovery.safetyExclusions,
    safety_summary: discovery.safetySummary,
    next_commands: [
      'npx create-quiver ai analyze-project --deep --dry-run --json',
      'npx create-quiver ai analyze-project --deep --review',
    ],
  };
}

function limitProviderArtifactText(text, maxBytes = 12_000) {
  let value = String(text || '');
  const redacted = value;
  if (byteLength(redacted) <= maxBytes) {
    return {
      text: redacted,
      truncated: false,
      bytes: byteLength(redacted),
    };
  }

  value = redacted;
  while (byteLength(value) > maxBytes && value.length > 0) {
    value = value.slice(0, Math.max(0, value.length - Math.ceil((byteLength(value) - maxBytes) / 2) - 16));
  }

  return {
    text: `${value.trimEnd()}\n[TRUNCATED BY QUIVER]\n`,
    truncated: true,
    bytes: byteLength(redacted),
  };
}

function buildAnalyzeProjectProviderArtifact(result, clean, repoRoot, options = {}) {
  const rawOutput = clean?.cleanOutput || result?.stdout || result?.stderr || '';
  const redactedOutput = redactSensitiveLocalValues(rawOutput, { projectRoot: repoRoot });
  const limited = limitProviderArtifactText(redactedOutput, options.maxBytes || 12_000);
  return {
    schema_version: 1,
    kind: 'quiver-analyze-project-provider-artifact',
    persisted: false,
    redacted: true,
    size_limited: true,
    provider: result?.provider || null,
    command: result?.command || null,
    exit_code: typeof result?.exitCode === 'number' ? result.exitCode : null,
    output_source: clean?.source || 'unknown',
    output_bytes: limited.bytes,
    output_truncated: limited.truncated,
    output: limited.text,
  };
}

function formatAnalyzeProjectLiveReport(report) {
  const warningCount = report.analysis_validation?.warnings?.length || 0;
  const docUpdatePaths = report.analysis_validation?.doc_update_paths || [];
  const lines = [
    'AI analyze-project provider analysis',
    `Mode: ${report.mode}`,
    `Provider: ${report.provider}`,
    `Provider execution: ${report.provider_execution}`,
    `Writes: ${report.writes.length === 0 ? 'none' : report.writes.join(', ')}`,
    `Privacy preflight: ${report.privacy_preflight.ok ? 'passed' : 'failed'}`,
    `Prompt bytes: ${report.prompt.bytes}/${report.prompt.max_provider_prompt_bytes}`,
    `Selected files: ${report.selected_files.length}`,
    `Omitted files: ${report.omitted_files.length}`,
    `Safety exclusions: ${report.safety_exclusions.length}`,
    `Analysis validation: passed (${warningCount} warning${warningCount === 1 ? '' : 's'})`,
    `Doc update proposals: ${docUpdatePaths.length > 0 ? docUpdatePaths.join(', ') : 'none'}`,
  ];

  if (warningCount > 0) {
    lines.push('', 'Warnings:');
    for (const warning of report.analysis_validation.warnings.slice(0, 20)) {
      lines.push(`- ${warning.path}: ${warning.issue}`);
    }
  }

  lines.push('', 'Next commands:');
  lines.push('- npx create-quiver ai analyze-project --deep --review');
  lines.push('- npx create-quiver ai analyze-project --deep --json');

  return `${lines.join('\n')}\n`;
}

function formatAnalyzeProjectPostWriteValidation(validation) {
  if (!validation) {
    return [];
  }
  const warningCount = validation.warnings?.length || 0;
  const errorCount = validation.errors?.length || 0;
  const lines = [
    `Post-write validation: ${validation.ok ? 'passed' : 'failed'} (${errorCount} error${errorCount === 1 ? '' : 's'}, ${warningCount} warning${warningCount === 1 ? '' : 's'})`,
  ];
  for (const issue of [...(validation.errors || []), ...(validation.warnings || [])].slice(0, 20)) {
    lines.push(`- ${issue.path || 'analysis'}: ${issue.issue} - ${issue.message}`);
  }
  return lines;
}

function formatAnalyzeProjectReviewPlan({ writePlan, reviewPath, snapshot, writtenDocs, completed = false, validation = null } = {}) {
  const changed = (writePlan || []).filter((item) => item.action !== 'skip');
  const dirty = changed.filter((item) => item.dirty);
  const lines = [
    completed ? 'AI analyze-project docs written' : 'AI analyze-project review write plan',
    `Review artifact: ${reviewPath || 'none'}`,
    `Writes: ${changed.length > 0 ? changed.map((item) => item.path).join(', ') : 'none'}`,
    `Dirty target docs: ${dirty.length > 0 ? dirty.map((item) => item.path).join(', ') : 'none'}`,
  ];

  if (snapshot) {
    lines.push(`Snapshot: ${snapshot.root}`);
    lines.push(`Manifest: ${snapshot.manifestPath}`);
  }
  if (completed) {
    lines.push(`Written docs: ${writtenDocs && writtenDocs.length > 0 ? writtenDocs.join(', ') : 'none'}`);
    lines.push(...formatAnalyzeProjectPostWriteValidation(validation));
    return `${lines.join('\n')}\n`;
  }

  lines.push('', 'Proposed changes:');
  for (const item of writePlan || []) {
    lines.push(`- ${item.path}: ${item.action}${item.reason ? ` (${item.reason})` : ''}`);
  }
  lines.push('', 'Final diff:');
  lines.push(...formatAnalyzeProjectDiffPreview(writePlan || []));
  lines.push('', 'Confirmation required before writing.');

  return `${lines.join('\n')}\n`;
}

function formatLocalizedActionableError({ failure, impact, fix, nextCommand } = {}, options = {}) {
  const translator = createTranslator(options.language);
  const lines = [`create-quiver: ${String(failure || 'operation failed').trim()}`];

  if (impact) {
    lines.push(`${translator.t('ai.actionable.impact')}: ${String(impact).trim()}`);
  }
  if (fix) {
    lines.push(`${translator.t('ai.actionable.fix')}: ${String(fix).trim()}`);
  }
  if (nextCommand) {
    lines.push(`${translator.t('ai.actionable.next_command')}: ${String(nextCommand).trim()}`);
  }

  return lines.join('\n');
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

function profileOptionForRole(options, role) {
  const normalized = normalizeAgentProfileRole(role);
  if (normalized === 'planner') {
    return options.plannerProfile || options.profileId || '';
  }
  if (normalized === 'executor') {
    return options.executorProfile || options.profileId || '';
  }
  if (normalized === 'reviewer') {
    return options.reviewerProfile || options.profileId || '';
  }
  if (normalized === 'doctor') {
    return options.doctorProfile || options.profileId || '';
  }
  return options.profileId || '';
}

function resolveRuntimeAgentProfile(repoRoot, role, options = {}, fallbackProvider = DEFAULT_PLAN_PROVIDER) {
  const normalizedRole = normalizeAgentProfileRole(role);
  const explicitProvider = options.providerExplicit === true || (options.provider && options.providerExplicit !== false);
  const explicitModel = String(options.model || '').trim();

  if (explicitProvider) {
    const provider = String(options.provider || fallbackProvider).trim().toLowerCase();
    return {
      role: normalizedRole,
      profile: null,
      profileId: '',
      displayName: provider,
      provider,
      model: explicitModel,
    };
  }

  const profileId = profileOptionForRole(options, normalizedRole);
  const profile = profileId
    ? getAgentProfileById(repoRoot, normalizedRole, profileId)
    : getAgentProfile(repoRoot, normalizedRole);
  const provider = profile?.provider || resolveProfileProvider(repoRoot, normalizedRole, fallbackProvider);

  return {
    role: normalizedRole,
    profile,
    profileId: profile?.id || profileId || '',
    displayName: profile ? resolveAgentProfileDisplayName(profile) : provider,
    provider,
    model: explicitModel || profile?.model || '',
  };
}

function runtimeModelExecutionOptions(runtimeProfile, options = {}) {
  return {
    model: runtimeProfile.model,
    blockModelAlias: Boolean(runtimeProfile.profile && !String(options.model || '').trim()),
  };
}

function createCommandUx(options = {}) {
  if (options.ux) {
    return options.ux;
  }

  return createUx({
    env: options.env || process.env,
    input: options.inputStream,
    output: options.outputStream,
    error: options.errorStream,
    interactive: options.interactive,
    json: options.json,
    noColor: options.noColor,
    prompts: options.prompts,
    spinner: options.spinner,
    stdinIsTTY: options.stdinIsTTY,
    stdoutIsTTY: options.stdoutIsTTY,
    stderrIsTTY: options.stderrIsTTY,
    write: options.write,
  });
}

function shouldShowHumanProgress(ux, options = {}) {
  return options.progress !== false
    && options.dryRun !== true
    && options.printPrompt !== true
    && ux?.mode?.decoration === true;
}

function plannerProgressTitle(action, runtimeProfile, options = {}) {
  const translator = createTranslator(options.language);
  return translator.t('ai.planner.progress.title', {
    action,
    profile: runtimeProfile.displayName || runtimeProfile.model || runtimeProfile.provider,
  });
}

function writeProgressChecks(ux, enabled, title, checks = []) {
  if (!enabled) {
    return;
  }
  ux.heading(title);
  for (const check of checks) {
    ux.check(check);
  }
}

async function runProviderWithProgress({ ux, enabled, message = 'Running agent...', successMessage = 'Agent finished', failureMessage = 'Agent failed', run }) {
  async function runAndFailOnProviderResult() {
    const result = await run();
    if (result && result.ok === false) {
      const error = new Error(result.error?.message || 'provider run failed');
      error.code = result.error?.code || 'AI_PROVIDER_RUN_FAILED';
      error.providerResult = result;
      throw error;
    }
    return result;
  }

  if (!enabled) {
    return run();
  }

  return ux.withSpinner(message, runAndFailOnProviderResult, {
    successMessage,
    failureMessage,
  });
}

function buildPlanContext({ role, context, phase, inputText, inputPath, repoRoot, revise = false }) {
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
    revise
      ? 'Task: revise the current draft and produce a new version only. Do not advance phase, approve, create specs, or modify product code.'
      : phaseDetails.phase === 'acceptance'
      ? 'Task: produce acceptance criteria only. Do not create files or modify product code.'
      : 'Task: produce a technical plan only. Do not create files or modify product code.',
  ];

  if (phaseDetails.phase === 'technical-plan') {
    sections.push(
      'Required output contract: include a fenced json block with `{ "spec": { "slices": [...] } }` so Quiver can create specs after review and approval.',
      'Each `spec.slices[]` item must include at least `slice_id`, `title`, `objective`, and `files`.',
    );
  }

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

function formatDryRunReport({ task, provider, role, contextPack, phase, invocation, onboardingPlan, language = 'en' }) {
  const translator = createTranslator(language);
  const modelStatus = invocation.modelSelection?.supported
    ? translator.t('ai_task.model_supported')
    : translator.t('ai_task.model_unsupported');
  const lines = [
    translator.t('ai_task.title.dry_run', { task }),
    translator.t('ai_task.provider', { provider }),
    translator.t('ai_task.role', { role }),
    translator.t('ai_task.context_pack', { context: contextPack }),
  ];

  if (phase) {
    lines.push(translator.t('ai_task.phase', { phase }));
  }

  lines.push(translator.t('ai_task.command', { command: `${invocation.command} ${invocation.args.join(' ')}`.trim() }));
  lines.push(translator.t('ai_task.timeout', { timeout: invocation.timeoutMs }));
  lines.push(translator.t('ai_task.prompt_transport', { mode: invocation.promptTransport.mode }));
  lines.push(translator.t('ai_task.prompt_length', { bytes: invocation.promptLength }));
  if (invocation.modelSelection && invocation.modelSelection.model) {
    lines.push(translator.t('ai_task.model', { model: invocation.modelSelection.model }));
    lines.push(translator.t('ai_task.model_support', { status: modelStatus, reason: invocation.modelSelection.reason }));
  }

  if (onboardingPlan) {
    lines.push(translator.t('ai_task.prompt_source', { source: onboardingPlan.promptSource }));
    lines.push(translator.t('ai_task.selected_docs', { count: onboardingPlan.selectedDocs.length }));
    lines.push(translator.t('ai_task.documentation_debt', { count: onboardingPlan.missingDocs.length }));
  }

  return `${lines.join('\n')}\n`;
}

function formatPromptOnlyReport({ task, provider, role, contextPack, phase, invocation, prompt, onboardingPlan, promptSource, inputPath, inputKind, inputVersion, language = 'en' }) {
  const translator = createTranslator(language);
  const modelStatus = invocation.modelSelection?.supported
    ? translator.t('ai_task.model_supported')
    : translator.t('ai_task.model_unsupported');
  const lines = [
    translator.t('ai_task.title.prompt_only', { task }),
    translator.t('ai_task.provider', { provider }),
    translator.t('ai_task.role', { role }),
    translator.t('ai_task.context_pack', { context: contextPack }),
  ];

  if (phase) {
    lines.push(translator.t('ai_task.phase', { phase }));
  }

  lines.push(translator.t('ai_task.command', { command: `${invocation.command} ${invocation.args.join(' ')}`.trim() }));
  lines.push(translator.t('ai_task.timeout', { timeout: invocation.timeoutMs }));
  lines.push(translator.t('ai_task.prompt_transport', { mode: invocation.promptTransport.mode }));
  lines.push(translator.t('ai_task.prompt_length', { bytes: invocation.promptLength }));
  if (invocation.modelSelection && invocation.modelSelection.model) {
    lines.push(translator.t('ai_task.model', { model: invocation.modelSelection.model }));
    lines.push(translator.t('ai_task.model_support', { status: modelStatus, reason: invocation.modelSelection.reason }));
  }

  if (onboardingPlan) {
    lines.push(translator.t('ai_task.prompt_source', { source: onboardingPlan.promptSource }));
    lines.push(translator.t('ai_task.selected_docs', { count: onboardingPlan.selectedDocs.length }));
    lines.push(translator.t('ai_task.documentation_debt', { count: onboardingPlan.missingDocs.length }));
  }

  if (promptSource) {
    lines.push(translator.t('ai_task.prompt_source', { source: promptSource }));
  }

  if (inputPath) {
    lines.push(translator.t('ai_task.input_file', { path: inputPath }));
  }

  if (inputKind) {
    lines.push(translator.t('ai_task.input_kind', { kind: inputKind }));
  }

  if (inputVersion) {
    lines.push(translator.t('ai_task.input_version', { version: inputVersion }));
  }

  lines.push('--- PROMPT START ---');
  lines.push(String(prompt || '').trimEnd());
  lines.push('--- PROMPT END ---');

  return `${lines.join('\n')}\n`;
}

function formatPathList(items, emptyLabel = 'none') {
  if (!Array.isArray(items) || items.length === 0) {
    return [`- ${emptyLabel}`];
  }

  return items.map((item) => `- ${item}`);
}

function formatContextPreparationReport({ dryRun, plan, writePlan, writtenDocs, snapshot, completed = false, language = 'en' }) {
  const translator = createTranslator(language);
  const lines = [
    dryRun ? translator.t('prepare_context.title.dry_run') : completed ? translator.t('prepare_context.title.completed') : translator.t('prepare_context.title.write_plan'),
    translator.t('prepare_context.mode', { mode: dryRun ? 'dry-run' : 'live' }),
    translator.t('prepare_context.project', { project: plan.projectName }),
    translator.t('prepare_context.project_slug', { slug: plan.projectSlug }),
    translator.t('prepare_context.writes_docs_only'),
    translator.t('prepare_context.product_code_untouched'),
    translator.t('prepare_context.proposed_docs', { docs: writePlan.length > 0 ? writePlan.map((item) => item.path).join(', ') : translator.t('common.none') }),
  ];

  if (!dryRun) {
    lines.push(translator.t(completed ? 'prepare_context.written_docs' : 'prepare_context.planned_writes', { docs: writtenDocs.length > 0 ? writtenDocs.join(', ') : translator.t('common.none') }));
    if (snapshot) {
      lines.push(translator.t('prepare_context.snapshot', { path: snapshot.root }));
    }
  }

  if (completed) {
    return `${lines.join('\n')}\n`;
  }

  lines.push(
    translator.t('prepare_context.proposed_changes'),
    ...writePlan.map((item) => `- ${item.path}: ${item.action}${item.reason ? ` (${item.reason})` : ''}`),
    translator.t('prepare_context.diff_preview'),
    ...formatDiffPreview(writePlan),
    translator.t('prepare_context.files_considered'),
    ...plan.filesConsidered.map((item) => `- ${item.path}: ${item.present ? translator.t('prepare_context.present') : translator.t('prepare_context.absent')}${item.reason ? ` (${item.reason})` : ''}`),
    translator.t('prepare_context.assumptions'),
    ...formatPathList(plan.assumptions, translator.t('common.none')),
    translator.t('prepare_context.risks'),
    ...formatPathList(plan.risks, translator.t('common.none')),
    translator.t('prepare_context.contradictions'),
    ...formatPathList(plan.contradictions, translator.t('common.none')),
    translator.t('prepare_context.omitted_paths'),
    ...formatPathList(plan.omittedPaths, translator.t('common.none')),
    translator.t('prepare_context.uncertainty_markers'),
  );

  return `${lines.join('\n')}\n`;
}

function truncatePromptSection(text, maxChars = 1200) {
  const value = String(text || '').trimEnd();
  if (value.length <= maxChars) {
    return value;
  }
  return `${value.slice(0, maxChars).trimEnd()}\n[... truncated ${value.length - maxChars} chars ...]`;
}

function buildPrepareContextPlannerPrompt({ pack, draftPack }) {
  const plan = draftPack.plan;
  const allowedPaths = draftPack.docs.map((doc) => doc.path);
  const sections = [
    pack.prompt,
    'Task: planner-assisted Quiver context preparation.',
    'Goal: improve the docs-only onboarding context for future AI work while preserving WDD + SDD safety.',
    'Rules:',
    '- Return only valid JSON. Do not include Markdown outside the JSON object.',
    '- Do not modify product code, UI code, tests, migrations, dependencies, lockfiles, build files, runtime config, generated files, or paths outside the repo.',
    '- Only propose writes to the allowed docs paths listed below.',
    '- If information is ambiguous, document assumptions and risks instead of inventing facts.',
    '- Keep human-authored content safe; Quiver will merge proposals through managed context blocks.',
    '',
    'Allowed docs-only output paths:',
    ...allowedPaths.map((item) => `- ${item}`),
    '',
    'Project context:',
    `- Project: ${plan.projectName}`,
    `- Project slug: ${plan.projectSlug}`,
    `- Package manager: ${plan.facts.packageManager}`,
    `- Stack summary: ${plan.facts.stackSummary}`,
    '',
    'Files considered by deterministic prepare-context:',
    ...plan.filesConsidered.map((item) => `- ${item.path}: ${item.present ? 'present' : 'absent'}${item.reason ? ` (${item.reason})` : ''}`),
    '',
    'Known assumptions:',
    ...formatPathList(plan.assumptions),
    '',
    'Known risks:',
    ...formatPathList(plan.risks),
    '',
    'Known contradictions:',
    ...formatPathList(plan.contradictions),
    '',
    'Deterministic candidate docs:',
    ...draftPack.docs.flatMap((doc) => [
      `### ${doc.path}`,
      truncatePromptSection(doc.content),
    ]),
    '',
    'Required JSON output shape:',
    JSON.stringify({
      schema_version: 1,
      kind: 'quiver-context-proposal',
      summary: 'short summary',
      assumptions: ['assumption to confirm'],
      risks: ['risk to track'],
      docs: [
        {
          path: 'docs/AI_CONTEXT.md',
          action: 'update',
          reason: 'why this doc should change',
          content: '# AI Context\\n\\nFull proposed content or managed section content.\\n',
          assumptions: [],
          risks: [],
        },
      ],
      omitted_paths: ['paths intentionally omitted'],
      next_steps: ['safe next step'],
    }, null, 2),
  ];

  return {
    allowedPaths,
    plan,
    prompt: sections.join('\n'),
    promptSource: 'quiver prepare-context planner proposal contract',
  };
}

function formatPrepareContextPlannerDryRunReport({ provider, role, context, invocation, promptInfo, review, interactive, language = 'en' }) {
  const translator = createTranslator(language);
  const plan = promptInfo.plan;
  const lines = [
    translator.t('prepare_context_planner.title.dry_run'),
    translator.t('prepare_context.mode', { mode: 'dry-run' }),
    translator.t('prepare_context_planner.enabled'),
    `Provider: ${provider}`,
    `Role: ${role}`,
    `Context pack: ${context}`,
    `Command: ${invocation.command} ${invocation.args.join(' ')}`.trim(),
    `Prompt bytes: ${invocation.promptLength}`,
    invocation.modelSelection && invocation.modelSelection.model
      ? `Model: ${invocation.modelSelection.model}`
      : '',
    invocation.modelSelection && invocation.modelSelection.model
      ? `Model support: ${invocation.modelSelection.supported ? 'supported' : 'unsupported'} (${invocation.modelSelection.reason})`
      : '',
    translator.t('prepare_context.prompt_source', { source: promptInfo.promptSource }),
    translator.t('prepare_context_planner.review_requested', { value: review ? translator.t('common.yes') : translator.t('common.no') }),
    translator.t('prepare_context_planner.interactive_requested', { value: interactive ? translator.t('common.yes') : translator.t('common.no') }),
    translator.t('prepare_context_planner.provider_execution_skipped'),
    translator.t('prepare_context.writes_none'),
    translator.t('prepare_context.product_code_untouched'),
    translator.t('prepare_context_planner.candidate_docs', { docs: promptInfo.allowedPaths.join(', ') }),
    translator.t('prepare_context.files_considered'),
    ...plan.filesConsidered.map((item) => `- ${item.path}: ${item.present ? translator.t('prepare_context.present') : translator.t('prepare_context.absent')}`),
    translator.t('prepare_context_planner.allowed_docs_only_paths'),
    ...promptInfo.allowedPaths.map((item) => `- ${item}`),
    translator.t('prepare_context_planner.next_safe_commands'),
    '- npx create-quiver ai prepare-context --with-planner --print-prompt',
    '- npx create-quiver ai prepare-context --with-planner --dry-run --review',
    '- npx create-quiver ai prepare-context --with-planner',
  ];

  return `${lines.filter(Boolean).join('\n')}\n`;
}

function serializeProposalForReview(proposal) {
  return {
    schema_version: proposal.schemaVersion,
    kind: proposal.kind,
    summary: proposal.summary,
    assumptions: proposal.assumptions,
    risks: proposal.risks,
    docs: proposal.docs.map((doc) => ({
      path: doc.path,
      action: doc.action,
      reason: doc.reason,
      content: doc.content,
      assumptions: doc.assumptions,
      risks: doc.risks,
    })),
    omitted_paths: proposal.omittedPaths,
    next_steps: proposal.nextSteps,
  };
}

function createProposalReviewFile(proposal, options = {}) {
  const reviewDir = options.reviewDir || fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-context-review-'));
  const reviewPath = path.join(reviewDir, 'context-proposal.json');
  fs.mkdirSync(reviewDir, { recursive: true });
  fs.writeFileSync(reviewPath, `${JSON.stringify(serializeProposalForReview(proposal), null, 2)}\n`);
  return reviewPath;
}

function makeReviewError(message, reviewPath, cause) {
  const error = new Error(formatError(`${message}\nReview artifact: ${reviewPath}\nNext safe step: edit the artifact into valid proposal JSON or rerun with --with-planner --dry-run.`));
  error.code = cause?.code || 'AI_CONTEXT_REVIEW_FAILED';
  error.cause = cause;
  error.reviewPath = reviewPath;
  return error;
}

function createReviewTextFile(contents, options = {}) {
  const reviewDir = options.reviewDir || fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-review-'));
  const filename = options.reviewFileName || 'review.md';
  const reviewPath = path.join(reviewDir, filename);
  fs.mkdirSync(reviewDir, { recursive: true });
  fs.writeFileSync(reviewPath, String(contents || ''));
  return reviewPath;
}

async function reviewTextWithEditor(repoRoot, contents, options = {}) {
  const reviewPath = createReviewTextFile(contents, options);
  const hasEditorRunner = typeof options.openEditorFn === 'function';
  const canOpenEditor = hasEditorRunner || options.stdinIsTTY === true || (options.stdinIsTTY !== false && Boolean(process.stdin.isTTY));

  if (!canOpenEditor) {
    throw makeReviewError(`${options.reviewLabel || 'review'} requires an interactive terminal or an injected editor runner.`, reviewPath);
  }

  const editorResult = hasEditorRunner
    ? options.openEditorFn(reviewPath, { cwd: repoRoot, env: options.env || process.env })
    : openEditor(reviewPath, { cwd: repoRoot, env: options.env || process.env });

  if (!editorResult || editorResult.ok !== true) {
    throw makeReviewError(editorResult?.reason || `${options.reviewLabel || 'review'} was canceled.`, reviewPath);
  }

  return {
    reviewPath,
    text: fs.readFileSync(reviewPath, 'utf8'),
  };
}

async function confirmInteractiveAction(message, options = {}) {
  if (options.interactive !== true) {
    return;
  }

  const ux = options.ux || createUx({
    interactive: true,
    promptConfirm: options.promptConfirm,
    stdinIsTTY: options.stdinIsTTY,
    stdoutIsTTY: options.stdoutIsTTY,
    stderrIsTTY: options.stderrIsTTY,
    write: options.write,
  });
  const confirmed = await ux.promptConfirm(message, {
    initialValue: false,
  });

  if (!confirmed) {
    const error = new Error(formatError('interactive approval declined. No files were written.'));
    error.code = 'AI_INTERACTIVE_APPROVAL_DECLINED';
    throw error;
  }
}

async function reviewPlannerContextProposal(repoRoot, proposal, options = {}) {
  const reviewPath = createProposalReviewFile(proposal, options);
  const hasEditorRunner = typeof options.openEditorFn === 'function';
  const canOpenEditor = hasEditorRunner || options.stdinIsTTY === true || (options.stdinIsTTY !== false && Boolean(process.stdin.isTTY));

  if (!canOpenEditor) {
    throw makeReviewError('ai prepare-context review requires an interactive terminal or an injected editor runner.', reviewPath);
  }

  const editorResult = hasEditorRunner
    ? options.openEditorFn(reviewPath, { cwd: repoRoot, env: options.env || process.env })
    : openEditor(reviewPath, { cwd: repoRoot, env: options.env || process.env });

  if (!editorResult || editorResult.ok !== true) {
    throw makeReviewError(editorResult?.reason || 'ai prepare-context review was canceled before applying docs.', reviewPath);
  }

  try {
    return {
      proposal: parseContextProposalOutput(fs.readFileSync(reviewPath, 'utf8')),
      reviewPath,
    };
  } catch (error) {
    throw makeReviewError('edited planner proposal is invalid after review.', reviewPath, error);
  }
}

async function confirmPlannerContextWrites(writePlan, options = {}) {
  const changed = writePlan.filter((item) => item.action !== 'skip').length;
  await confirmInteractiveAction(`Apply ${changed} docs-only context update${changed === 1 ? '' : 's'}?`, options);
}

function buildPlannerContextWritePlan(repoRoot, proposal) {
  const reasonByPath = new Map(proposal.docs.map((doc) => [doc.path, doc.reason]));
  const draftDocs = proposal.docs
    .filter((doc) => doc.action !== 'skip')
    .map((doc) => ({
      path: doc.path,
      content: doc.content,
    }));

  return buildContextWritePlan(repoRoot, draftDocs).map((item) => ({
    ...item,
    reason: item.action === 'skip' ? item.reason : reasonByPath.get(item.path) || item.reason,
  }));
}

function writeProviderOutput(result) {
  if (result.stdout) {
    process.stdout.write(redactSecrets(result.stdout));
  }
  if (result.stderr) {
    process.stderr.write(redactSecrets(result.stderr));
  }
}

function writeCleanProviderOutput(clean) {
  const output = String(clean?.cleanOutput || '');
  if (!output) {
    return;
  }
  process.stdout.write(output.endsWith('\n') ? output : `${output}\n`);
}

function normalizeText(value) {
  return String(value || '').replace(/\r\n/g, '\n');
}

function buildRevisionInput({ phase, feedbackPath, feedbackText, repoRoot, compactionOptions = {} }) {
  const current = readPhaseApproval(repoRoot, phase);
  if (!current.draft) {
    throw new Error(formatError(`ai revise --phase ${phase} requires an existing draft; current status is ${current.status}. Run \`npx create-quiver ai plan --phase ${phase} --input <file>\` first.`));
  }

  const sections = [];

  if (phase === 'technical-plan') {
    const acceptance = resolveApprovedPlannerInput(repoRoot, phase, undefined);
    const acceptanceText = readTextFile(acceptance.inputPath, repoRoot);
    sections.push(`Approved acceptance input (${acceptance.inputPath}):`, acceptanceText.trimEnd());
  }

  sections.push(
    `Current ${phase} draft (${current.draft.path}):`,
    current.draft.contents.trimEnd(),
    `Human feedback (${feedbackPath}):`,
    feedbackText.trimEnd(),
  );

  return compactRevisionInput(sections.join('\n\n'), compactionOptions);
}

function buildManagedContextBlock(content) {
  return `${CONTEXT_PREP_START}\n${String(content || '').trimEnd()}\n${CONTEXT_PREP_END}\n`;
}

function mergeContextDraft(existingContent, draftContent) {
  const existing = normalizeText(existingContent);
  const block = buildManagedContextBlock(draftContent);
  const startIndex = existing.indexOf(CONTEXT_PREP_START);
  const endIndex = existing.indexOf(CONTEXT_PREP_END);

  if (startIndex >= 0 && endIndex > startIndex) {
    const before = existing.slice(0, startIndex).trimEnd();
    const after = existing.slice(endIndex + CONTEXT_PREP_END.length).trimStart();
    return `${before}\n\n${block}${after ? `\n${after}` : ''}`;
  }

  return `${existing.trimEnd()}\n\n${block}`;
}

function firstChangedLineIndex(beforeLines, afterLines) {
  const max = Math.max(beforeLines.length, afterLines.length);
  for (let index = 0; index < max; index += 1) {
    if (beforeLines[index] !== afterLines[index]) {
      return index;
    }
  }
  return -1;
}

function buildDiffSnippet(pathLabel, beforeContent, afterContent, maxLines = 10) {
  const beforeLines = normalizeText(beforeContent).split('\n');
  const afterLines = normalizeText(afterContent).split('\n');
  const changedAt = firstChangedLineIndex(beforeLines, afterLines);

  if (changedAt === -1) {
    return [`diff -- ${pathLabel}`, '  no changes'];
  }

  const start = Math.max(0, changedAt - 2);
  const beforeSnippet = beforeLines.slice(start, start + maxLines);
  const afterSnippet = afterLines.slice(start, start + maxLines);
  const lines = [
    `--- ${pathLabel} (current)`,
    `+++ ${pathLabel} (proposed)`,
  ];

  for (const line of beforeSnippet) {
    if (line) {
      lines.push(`- ${line}`);
    }
  }

  for (const line of afterSnippet) {
    if (line) {
      lines.push(`+ ${line}`);
    }
  }

  return lines;
}

function buildContextWritePlan(repoRoot, drafts) {
  return drafts.map((draft) => {
    const destinationPath = path.join(repoRoot, draft.path);
    const exists = fs.existsSync(destinationPath);
    const currentContent = exists ? fs.readFileSync(destinationPath, 'utf8') : '';
    const proposedContent = exists
      ? mergeContextDraft(currentContent, draft.content)
      : `${String(draft.content || '').replace(/\s+$/g, '')}\n`;
    const changed = normalizeText(currentContent) !== normalizeText(proposedContent);

    return {
      path: draft.path,
      destinationPath,
      action: changed ? (exists ? 'update' : 'create') : 'skip',
      reason: changed ? (exists ? 'human content preserved; Quiver block appended or refreshed' : 'missing approved context doc') : 'already up to date',
      exists,
      currentContent,
      proposedContent,
      diff: buildDiffSnippet(draft.path, currentContent, proposedContent),
    };
  });
}

function formatDiffPreview(writePlan) {
  const lines = [];
  for (const item of writePlan) {
    if (item.action === 'skip') {
      continue;
    }
    lines.push(...item.diff);
  }
  return lines.length > 0 ? lines : ['- no changes'];
}

function createContextSnapshots(repoRoot, run, writePlan, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const snapshotRoot = path.join(repoRoot, '.quiver', 'runs', run.run_id, 'snapshots', stamp);
  const manifest = {
    schema_version: 1,
    run_id: run.run_id,
    created_at: now.toISOString(),
    entries: [],
  };

  fs.mkdirSync(snapshotRoot, { recursive: true });

  for (const item of writePlan) {
    if (item.action === 'skip') {
      continue;
    }
    const entry = {
      path: item.path,
      action: item.action,
      existed: item.exists,
      snapshot_path: null,
    };

    if (item.exists) {
      const snapshotPath = path.join(snapshotRoot, item.path);
      fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
      fs.copyFileSync(item.destinationPath, snapshotPath);
      entry.snapshot_path = path.relative(repoRoot, snapshotPath).split(path.sep).join('/');
    }

    manifest.entries.push(entry);
  }

  const manifestPath = path.join(snapshotRoot, 'manifest.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  return {
    root: path.relative(repoRoot, snapshotRoot).split(path.sep).join('/'),
    manifestPath: path.relative(repoRoot, manifestPath).split(path.sep).join('/'),
    entries: manifest.entries,
  };
}

function writeDraftDocs(writePlan) {
  const writtenDocs = [];
  for (const item of writePlan) {
    if (item.action === 'skip') {
      continue;
    }
    fs.mkdirSync(path.dirname(item.destinationPath), { recursive: true });
    fs.writeFileSync(item.destinationPath, item.proposedContent);
    writtenDocs.push(item.path);
  }
  return writtenDocs;
}

function formatSpecDryRunReport({ manifest, repoRoot, language }) {
  const translator = createTranslator(language);
  const preview = describeSpecGeneration(manifest, repoRoot);
  const relativeSpecDir = path.relative(repoRoot, preview.specDir).split(path.sep).join('/');
  const lines = [
    translator.t('ai.plan.spec.dry_run.title'),
    translator.t('ai_task.phase', { phase: 'spec' }),
    translator.t('ai.plan.spec.slug', { slug: manifest.slug }),
    translator.t('ai.plan.spec.title', { title: manifest.title }),
    translator.t('ai_task.input_file', { path: manifest.sourcePath }),
    translator.t('ai.plan.spec.target', { target: relativeSpecDir }),
    translator.t('ai.plan.spec.planned_files', { count: preview.files.length }),
  ];

  for (const file of preview.files) {
    lines.push(`- ${file}`);
  }

  return `${lines.join('\n')}\n`;
}

function formatSpecGenerationResult(result, repoRoot, options = {}) {
  const translator = createTranslator(options.language);
  const relativeSpecDir = path.relative(repoRoot, result.specDir).split(path.sep).join('/');
  const lines = [
    translator.t('ai.plan.spec.completed'),
    translator.t('ai.plan.spec.slug', { slug: result.manifest.slug }),
    translator.t('ai.plan.spec.target', { target: relativeSpecDir }),
    translator.t('ai.plan.spec.files_written', { count: result.files.length }),
  ];

  for (const filePath of result.files) {
    lines.push(`- ${path.relative(repoRoot, filePath).split(path.sep).join('/')}`);
  }

  return `${lines.join('\n')}\n`;
}

function formatApprovalResult(result, repoRoot, options = {}) {
  const translator = createTranslator(options.language);
  const relativePath = path.relative(repoRoot, result.filePath).split(path.sep).join('/');
  const lines = [
    translator.t('ai.approve.saved'),
    translator.t('ai_task.phase', { phase: result.phase }),
    `${translator.t('ai.table.status')}: ${translator.t('ai.approve.status.approved')}`,
    `${translator.t('ai.approve.artifact')}: ${relativePath}`,
    `${translator.t('ai.approvals.source_file')}: ${result.sourceFile}`,
    `${translator.t('ai.approve.timestamp')}: ${result.createdAt}`,
  ];
  if (result.version) {
    lines.push(`${translator.t('ai.approve.version')}: v${result.version}`);
  }

  return `${lines.join('\n')}\n`;
}

function formatApprovalDryRunResult({ phase, input, version, language }) {
  const translator = createTranslator(language);
  const lines = [translator.t('ai.approve.dry_run.title'), translator.t('ai_task.phase', { phase })];
  if (version) {
    lines.push(`${translator.t('ai.approve.version')}: v${version}`);
  }
  if (input) {
    lines.push(translator.t('ai_task.input_file', { path: input }));
  }
  return `${lines.join('\n')}\n`;
}

function stripCreateQuiverPrefix(message) {
  return String(message || '').replace(/^create-quiver:\s*/, '');
}

function readCurrentDraftForApproval(repoRoot, phase, version) {
  const approval = readPhaseApproval(repoRoot, phase);
  const selectedDraft = findDraftVersion(approval.meta, version);
  if (!selectedDraft) {
    throw new Error(formatError(`missing ${phase} draft version ${version}`));
  }
  const latestVersion = latestDraftVersion(approval.meta);
  if (latestVersion && Number(selectedDraft.version) !== latestVersion) {
    throw new Error(formatError(`${phase} draft version ${version} is not current; latest draft version is ${latestVersion}. Approve the latest version or revise again.`));
  }
  const draftPath = path.resolve(repoRoot, selectedDraft.path);
  if (!fs.existsSync(draftPath)) {
    throw new Error(formatError(`missing ${phase} draft artifact: ${selectedDraft.path}`));
  }
  return {
    approval,
    contents: fs.readFileSync(draftPath, 'utf8'),
    draft: selectedDraft,
    path: selectedDraft.path,
  };
}

function assertTechnicalPlanDraftHasSpecContract(repoRoot, version) {
  const draft = readCurrentDraftForApproval(repoRoot, 'technical-plan', version);
  try {
    validateTechnicalPlanSpecContract(repoRoot, {
      inputPath: draft.path,
      inputText: draft.contents,
    });
  } catch (error) {
    throw new Error(formatError([
      `technical-plan draft v${version} cannot be approved because it cannot create specs.`,
      stripCreateQuiverPrefix(error.message || error),
      'Required contract: include a structured JSON block with `spec.slices[]` before approval.',
      'Next safe command: npx create-quiver ai revise --phase technical-plan --input <feedback.md> --dry-run',
    ].join('\n')));
  }
  return draft;
}

function resolveApprovedTechnicalPlanForRepair(repoRoot, explicitInput = '') {
  const approval = readPhaseApproval(repoRoot, 'technical-plan');
  if (!approval.approved?.path) {
    throw new Error(formatError('ai repair-plan requires an approved technical-plan artifact. Run `npx create-quiver ai approvals` to inspect planner state.'));
  }

  const approvedPath = approval.approved.path;
  if (explicitInput) {
    const explicit = path.resolve(repoRoot, explicitInput);
    const approved = path.resolve(repoRoot, approvedPath);
    if (explicit !== approved) {
      throw new Error(formatError(`ai repair-plan input must match the approved technical-plan artifact: ${approvedPath}`));
    }
  }

  const contents = readTextFile(approvedPath, repoRoot);
  try {
    validateTechnicalPlanSpecContract(repoRoot, {
      inputPath: approvedPath,
      inputText: contents,
    });
  } catch (error) {
    return {
      approval,
      contents,
      path: approvedPath,
      validationError: stripCreateQuiverPrefix(error.message || error),
    };
  }

  throw new Error(formatError('approved technical-plan already includes a valid structured `spec.slices[]` contract. No repair draft is needed.'));
}

function buildRepairPlanContext({ context, inputText, inputPath, repoRoot, role, validationError }) {
  const pack = buildContextPackMetadata({
    role,
    packName: context,
    repoRoot,
  });
  const prompt = [
    pack.prompt,
    'Phase: technical-plan',
    'Task: repair the approved technical plan into a new draft only. Do not approve it, create specs, modify product code, or expand scope.',
    'Preserve the approved intent, scope, risks, and decisions.',
    'Add the required Quiver structured JSON contract in a fenced json block.',
    'The JSON must include `{ "spec": { "slug": "...", "title": "...", "objective": "...", "slices": [...] } }`.',
    'Each item in `spec.slices[]` must include at least `slice_id`, `title`, `objective`, and `files`.',
    `Validation failure to repair: ${validationError}`,
    `Approved technical-plan artifact: ${inputPath}`,
    'Approved technical-plan contents:',
    inputText.trimEnd(),
  ].join('\n\n');

  return {
    pack,
    prompt,
  };
}

function formatRepairPlanResult(result, repoRoot, options = {}) {
  const translator = createTranslator(options.language);
  const relativePath = path.relative(repoRoot, result.filePath).split(path.sep).join('/');
  return [
    translator.t('ai.repair_plan.saved'),
    `${translator.t('ai.approvals.draft')}: ${relativePath}`,
    `${translator.t('ai.approve.version')}: v${result.version}`,
    `${translator.t('ai.repair_plan.source_approved_artifact')}: ${result.sourcePath}`,
    translator.t('ai.repair_plan.original_preserved'),
    `${translator.t('ai.label.next_safe_commands')}:`,
    '- npx create-quiver ai review-plan --dry-run',
    '- npx create-quiver ai review-plan',
    `- npx create-quiver ai approve --phase technical-plan --version ${result.version}`,
  ].join('\n').concat('\n');
}

function formatActiveSliceReconciliationReport(report, options = {}) {
  const lines = [
    'AI active-slice reconciliation',
    `Mode: ${options.dryRun ? 'dry-run' : 'read-only'}`,
    `Decision: ${report.reconciliation.decision}`,
    `Reason: ${report.reconciliation.reason}`,
    '',
    'Supported sources:',
  ];

  for (const source of report.supported_sources) {
    lines.push(`- ${source.path}: ${source.exists ? 'exists' : 'missing'}`);
  }

  lines.push('', 'Detected sources:');
  if (report.sources.length === 0) {
    lines.push('- none');
  } else {
    for (const source of report.sources) {
      const ref = source.ref || '(unresolved)';
      const status = source.status ? ` status=${source.status}` : '';
      const issue = source.issue ? ` issue=${source.issue}` : '';
      lines.push(`- ${source.source_id}: ${ref}${status}${issue}`);
    }
  }

  lines.push('', 'Planned changes:');
  if (report.reconciliation.planned_changes.length === 0) {
    lines.push('- none');
  } else {
    for (const change of report.reconciliation.planned_changes) {
      lines.push(`- ${change}`);
    }
  }

  lines.push('', 'Risks:');
  if (report.reconciliation.risks.length === 0) {
    lines.push('- none');
  } else {
    for (const risk of report.reconciliation.risks) {
      lines.push(`- ${risk}`);
    }
  }

  lines.push('', options.dryRun ? 'No files were changed.' : 'This command is read-only; use start-slice or cleanup-slice for intentional writes.');
  return `${lines.join('\n')}\n`;
}

function readRunApprovals(repoRoot, run) {
  if (!run?.approvals_path) {
    return [];
  }
  const filePath = path.resolve(repoRoot, run.approvals_path);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(parsed.approvals) ? parsed.approvals : [];
  } catch {
    return [];
  }
}

function collectRunApprovalRows(repoRoot) {
  const activeRun = resolveAiRun(repoRoot, '');
  return listAiRuns(repoRoot)
    .flatMap((run) => readRunApprovals(repoRoot, run).map((approval) => ({
      run,
      approval,
      relation: activeRun && run.run_id === activeRun.run_id
        ? 'active'
        : run.status === 'closed'
          ? 'historical'
          : 'other-open',
    })));
}

function approvalArtifactForRelation(report) {
  return report?.approved?.path || report?.draft?.path || '';
}

function classifyGlobalApprovalRelation(report, runApprovalRows) {
  const artifact = approvalArtifactForRelation(report);
  if (!artifact || report.status === 'missing') {
    return 'none';
  }
  const matches = runApprovalRows.filter((row) => row.approval?.artifact === artifact);
  if (matches.some((row) => row.relation === 'active')) {
    return 'active';
  }
  if (matches.length > 0) {
    return 'historical';
  }
  return 'orphaned';
}

function formatRunScopedApprovals(repoRoot, runApprovalRows, options = {}) {
  const translator = translatorForHuman(options);
  const runs = listAiRuns(repoRoot);
  const activeRun = resolveAiRun(repoRoot, '');
  const lines = [
    translator.t('ai.approvals.run_scoped'),
    `${translator.t('ai.approvals.active_run')}: ${activeRun ? activeRun.run_id : translator.t('ai.approvals.none_value')}`,
  ];

  if (runs.length === 0) {
    lines.push(`- ${translator.t('ai.approvals.no_ai_runs')}`);
    return `${lines.join('\n')}\n`;
  }

  for (const run of runs.slice().reverse()) {
    const relation = activeRun && run.run_id === activeRun.run_id
      ? 'active'
      : run.status === 'closed'
        ? 'historical'
        : 'other-open';
    const approvals = runApprovalRows.filter((row) => row.run.run_id === run.run_id);
    lines.push(`${translator.t('ai.run.run')}: ${run.run_id} (${translator.t(`ai.approvals.relation.${relation}`)}, ${translator.t('ai.run.phase').toLowerCase()}: ${run.phase}, ${translator.t('ai.run.status').toLowerCase()}: ${formatStatus(run.status, translator)})`);
    if (approvals.length === 0) {
      lines.push(`- ${translator.t('ai.approvals.no_run_scoped')}`);
      continue;
    }
    for (const row of approvals) {
      const version = row.approval.version ? ` v${row.approval.version}` : '';
      lines.push(`- ${row.approval.phase || 'unknown'}${version}: ${row.approval.artifact || '(missing artifact)'}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

function formatApprovalStatusReport(repoRoot) {
  return formatApprovalStatusReportWithOptions(repoRoot);
}

function localizeApprovalSummary(text, translator) {
  if (translator.language === 'en') {
    return text;
  }

  return String(text || '')
    .split('\n')
    .map((line) => {
      let match = line.match(/^Phase: (.+)$/);
      if (match) return `${translator.t('ai.run.phase')}: ${match[1]}`;
      match = line.match(/^Status: (.+)$/);
      if (match) return `${translator.t('ai.run.status')}: ${formatStatus(match[1], translator)}`;
      match = line.match(/^Draft( v\d+)?: (.+)$/);
      if (match) return `${translator.t('ai.approvals.draft')}${match[1] || ''}: ${match[2]}`;
      if (line === 'Draft history:') return `${translator.t('ai.approvals.draft_history')}:`;
      match = line.match(/^Approved( v\d+)?: (.+)$/);
      if (match) return `${translator.t('ai.approvals.approved')}${match[1] || ''}: ${match[2]}`;
      match = line.match(/^Source file: (.+)$/);
      if (match) return `${translator.t('ai.approvals.source_file')}: ${match[1]}`;
      match = line.match(/^Review: (.+)$/);
      if (match) return `${translator.t('ai.approvals.review')}: ${match[1]}`;
      match = line.match(/^Approval recommendation: (.+)$/);
      if (match) return `${translator.t('ai.approvals.approval_recommendation')}: ${match[1]}`;
      match = line.match(/^Blocking: (yes|no)$/);
      if (match) return `${translator.t('ai.approvals.blocking')}: ${translator.t(match[1] === 'yes' ? 'common.yes' : 'common.no')}`;
      match = line.match(/^Required fixes: (.+)$/);
      if (match) return `${translator.t('ai.approvals.required_fixes')}: ${match[1]}`;
      match = line.match(/^Optional hardening: (.+)$/);
      if (match) return `${translator.t('ai.approvals.optional_hardening')}: ${match[1]}`;
      match = line.match(/^Next command: (.+)$/);
      if (match) return `${translator.t('ai.approvals.next_command')}: ${match[1]}`;
      return line;
    })
    .join('\n');
}

function localizeApprovalDecisionLine(line, translator) {
  if (translator.language === 'en') {
    return line;
  }
  return String(line || '')
    .replace(/^Candidates:/, translator.t('ai.approvals.candidates') + ':')
    .replace(/^Latest draft:/, translator.t('ai.approvals.latest_draft') + ':')
    .replace(/^Current candidate:/, translator.t('ai.approvals.current_candidate') + ':')
    .replace(/^Recommended approval:/, translator.t('ai.approvals.recommended_approval') + ':')
    .replace(/^Recommended next command:/, translator.t('ai.approvals.recommended_next_command') + ':')
    .replace(/^Review status:/, translator.t('ai.approvals.review_status') + ':');
}

function formatApprovalStatusReportWithOptions(repoRoot, options = {}) {
  const translator = translatorForHuman(options);
  const runApprovalRows = collectRunApprovalRows(repoRoot);
  const sections = [
    translator.t('ai.approvals.title'),
    formatRunScopedApprovals(repoRoot, runApprovalRows, options).trimEnd(),
    translator.t('ai.approvals.global_planner'),
  ];
  for (const phase of PLANNER_APPROVAL_PHASES) {
    const summary = localizeApprovalSummary(summarizePlannerApproval(repoRoot, phase).trimEnd(), translator);
    const relation = classifyGlobalApprovalRelation(readPhaseApproval(repoRoot, phase), runApprovalRows);
    const candidates = buildApprovalCandidateReport(repoRoot, phase);
    const decisionLines = formatApprovalDecisionLines(candidates)
      .map((line) => `- ${localizeApprovalDecisionLine(line, translator)}`)
      .join('\n');
    sections.push(`${summary}\n${translator.t('ai.approvals.run_relation')}: ${translator.t(`ai.approvals.relation.${relation}`)}${decisionLines ? `\n${translator.t('ai.approvals.approval_candidates')}:\n${decisionLines}` : ''}`);
  }
  sections.push(localizeApprovalSummary(summarizePlanReview(repoRoot).trimEnd(), translator));
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
  const runtimeProfile = resolveRuntimeAgentProfile(repoRoot, role, options, DEFAULT_ONBOARD_PROVIDER);
  const provider = runtimeProfile.provider;
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
        ...runtimeModelExecutionOptions(runtimeProfile, options),
      enforceModelSelection: false,
    });
  } catch (error) {
    if (error.providerResult) {
      result = error.providerResult;
    } else {
      throw annotateProviderError(error, 'onboard');
    }
  }

  if (options.dryRun) {
    const report = {
      task: 'onboard',
      provider,
      role,
      contextPack: context,
      invocation,
      language: options.language,
      onboardingPlan: contextInfo.plan,
      profile: runtimeProfile,
    };
    process.stdout.write(formatDryRunReport(report));
    return report;
  }

  if (options.printPrompt) {
    const report = {
      task: 'onboard',
      provider,
      role,
      contextPack: context,
      invocation,
      language: options.language,
      onboardingPlan: contextInfo.plan,
      prompt,
      profile: runtimeProfile,
    };
    process.stdout.write(formatPromptOnlyReport(report));
    return report;
  }

  const ux = createCommandUx(options);
  const showProgress = shouldShowHumanProgress(ux, options);
  const progressTranslator = createTranslator(options.language);
  writeProgressChecks(
    ux,
    showProgress,
    plannerProgressTitle(progressTranslator.t('ai.planner.progress.onboarding'), runtimeProfile, options),
    [
      progressTranslator.t('ai.planner.progress.reading_base_docs'),
      progressTranslator.t('ai.planner.progress.detecting_structure'),
      progressTranslator.t('ai.planner.progress.preparing_prompt'),
    ],
  );

  let result;
  try {
    result = await runProviderWithProgress({
      ux,
      enabled: showProgress,
      message: progressTranslator.t('ai.planner.progress.running_agent'),
      successMessage: progressTranslator.t('ai.planner.progress.agent_finished'),
      failureMessage: progressTranslator.t('ai.planner.progress.agent_failed'),
      run: () => (options.runProviderFn || runProvider)(provider, {
        prompt,
        cwd: repoRoot,
        timeoutMs,
        dryRun: false,
        probe: options.probe,
        spawn: options.spawn,
        tempRoot: options.tempRoot,
        tempFileName: options.tempFileName,
        tempFilePrefix: options.tempFilePrefix,
        ...runtimeModelExecutionOptions(runtimeProfile, options),
        enforceModelSelection: Boolean(runtimeProfile.model),
      }),
    });
  } catch (error) {
    throw annotateProviderError(error, 'onboard');
  }

  if (!result.ok) {
    writeProviderOutput(result);
    throw annotateProviderError(result.error || new Error('provider run failed'), 'onboard');
  }

  const clean = extractCleanProviderOutput(result, { prompt, projectRoot: repoRoot });
  writeCleanProviderOutput(clean);

  return {
    task: 'onboard',
    provider,
    role,
    contextPack: context,
    invocation,
    onboardingPlan: contextInfo.plan,
    profile: runtimeProfile,
    result,
  };
}

async function runPrepareContext(repoRoot, options = {}) {
  if (options.withPlanner === true) {
    return runPrepareContextWithPlanner(repoRoot, options);
  }

  const draftPack = buildContextPreparationDrafts(repoRoot);
  const writePlan = buildContextWritePlan(repoRoot, draftPack.docs);
  const report = {
    task: 'prepare-context',
    dryRun: options.dryRun === true,
    docs: draftPack.docs.map((doc) => doc.path),
    plan: draftPack.plan,
    writePlan: writePlan.map((item) => ({
      path: item.path,
      action: item.action,
      reason: item.reason,
    })),
  };

  if (options.dryRun) {
    process.stdout.write(formatContextPreparationReport({
      dryRun: true,
      plan: draftPack.plan,
      writePlan,
      writtenDocs: [],
      language: options.language,
    }));
    return report;
  }

  const lifecycleRun = ensureAiRun(repoRoot, {
    command: 'ai prepare-context',
    input: options.input || '',
    runId: options.runId,
    phase: 'created',
  });
  const snapshot = createContextSnapshots(repoRoot, lifecycleRun, writePlan, options.now || new Date());
  const plannedDocs = writePlan.filter((item) => item.action !== 'skip').map((item) => item.path);
  process.stdout.write(formatContextPreparationReport({
    dryRun: false,
    plan: draftPack.plan,
    writePlan,
    writtenDocs: plannedDocs,
    snapshot,
    language: options.language,
  }));
  const writtenDocs = writeDraftDocs(writePlan);
  updateAiRunPhase(repoRoot, lifecycleRun.run_id, 'onboarding-ready', {
    artifact: snapshot.manifestPath,
    command: 'ai prepare-context',
  });
  process.stdout.write(formatContextPreparationReport({
    dryRun: false,
    plan: draftPack.plan,
    writePlan,
    writtenDocs,
    snapshot,
    completed: true,
    language: options.language,
  }));

  return {
    ...report,
    runId: lifecycleRun.run_id,
    snapshot,
    writtenDocs,
  };
}

async function runAnalyzeProject(repoRoot, options = {}) {
  const report = buildAnalyzeProjectReport(repoRoot, options);
  if (options.dryRun === true) {
    if (options.json === true) {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      return report;
    }
    process.stdout.write(formatAnalyzeProjectReport(report));
    return report;
  }

  const role = normalizeRole(options.role || DEFAULT_PLAN_ROLE);
  const runtimeProfile = resolveRuntimeAgentProfile(repoRoot, role, options, DEFAULT_PLAN_PROVIDER);
  const provider = runtimeProfile.provider;
  const timeoutMs = normalizeTimeout(options.timeout);
  const ux = createCommandUx(options);
  const showProgress = shouldShowHumanProgress(ux, options);
  const progressTranslator = createTranslator(options.language);
  const promptPackage = buildAnalyzeProjectPrompt({
    analysisPlan: report,
    repoRoot,
    maxFileBytes: options.maxPromptFileBytes,
    maxTotalFileBytes: options.maxPromptTotalBytes,
  });
  const prompt = promptPackage.prompt;
  const promptLimit = assertProviderPromptWithinLimit(prompt, options.promptLimitOptions || {});
  const privacyPreflight = promptPackage.privacyPreflight;

  writeProgressChecks(
    ux,
    showProgress,
    plannerProgressTitle(progressTranslator.t('ai.planner.progress.analyze_project'), runtimeProfile, options),
    [
      progressTranslator.t('ai.planner.progress.reading_base_docs'),
      progressTranslator.t('ai.planner.progress.detecting_structure'),
      progressTranslator.t('ai.planner.progress.preparing_prompt'),
    ],
  );

  if (!privacyPreflight.ok) {
    const error = new Error(formatError('ai analyze-project privacy preflight failed; provider execution was blocked before sending repository content.'));
    error.code = 'AI_ANALYZE_PROJECT_PRIVACY_PREFLIGHT_FAILED';
    error.details = privacyPreflight;
    throw error;
  }

  let invocation;
  try {
    invocation = buildProviderInvocation(provider, {
      prompt,
      cwd: repoRoot,
      timeoutMs,
      ...runtimeModelExecutionOptions(runtimeProfile, options),
      enforceModelSelection: false,
    });
  } catch (error) {
    throw annotateProviderError(error, 'analyze-project');
  }

  if (options.printPrompt) {
    process.stdout.write(prompt.endsWith('\n') ? prompt : `${prompt}\n`);
    return {
      ...report,
      provider,
      role,
      invocation,
      privacy_preflight: privacyPreflight,
      prompt: {
        bytes: promptLimit.bytes,
        max_provider_prompt_bytes: promptLimit.maxProviderPromptBytes,
        files: promptPackage.files,
      },
    };
  }

  let result;
  try {
    result = await runProviderWithProgress({
      ux,
      enabled: showProgress,
      message: progressTranslator.t('ai.planner.progress.running_agent'),
      successMessage: progressTranslator.t('ai.planner.progress.agent_finished'),
      failureMessage: progressTranslator.t('ai.planner.progress.agent_failed'),
      run: () => (options.runProviderFn || runProvider)(provider, {
        prompt,
        cwd: repoRoot,
        timeoutMs,
        dryRun: false,
        probe: options.probe,
        spawn: options.spawn,
        tempRoot: options.tempRoot,
        tempFileName: options.tempFileName,
        tempFilePrefix: options.tempFilePrefix,
        ...runtimeModelExecutionOptions(runtimeProfile, options),
        enforceModelSelection: false,
      }),
    });
  } catch (error) {
    throw annotateProviderError(error, 'analyze-project');
  }

  if (!result.ok) {
    throw annotateProviderError(result.error || new Error('provider run failed'), 'analyze-project');
  }

  const clean = extractCleanProviderOutput(result, { prompt, projectRoot: repoRoot });
  let parsed;
  try {
    parsed = parseAnalyzeProjectOutput(clean.cleanOutput, {
      selectedFiles: report.selected_files,
      promptFiles: promptPackage.files,
    });
  } catch (error) {
    throw enhanceAnalyzeProjectAnalysisError(error);
  }
  const completedReport = {
    ...report,
    provider,
    role,
    provider_execution: 'completed',
    invocation,
    privacy_preflight: privacyPreflight,
    prompt: {
      bytes: promptLimit.bytes,
      max_provider_prompt_bytes: promptLimit.maxProviderPromptBytes,
      files: promptPackage.files,
    },
    analysis: parsed.analysis,
    analysis_validation: {
      parse_source: parsed.parseSource,
      warnings: parsed.warnings,
      doc_update_paths: parsed.docUpdatePaths,
    },
    provider_artifact: buildAnalyzeProjectProviderArtifact(result, clean, repoRoot),
  };

  if (options.review === true) {
    const initialProposal = buildAnalyzeProjectDocProposal(parsed.analysis);
    const reviewed = await reviewAnalyzeProjectDocProposal(repoRoot, initialProposal, options);
    const writePlan = buildAnalyzeProjectWritePlan(repoRoot, reviewed.proposal);
    process.stdout.write(formatAnalyzeProjectReviewPlan({
      writePlan,
      reviewPath: reviewed.reviewPath,
    }));
    await confirmAnalyzeProjectWrites(writePlan, options);
    const lifecycleRun = ensureAiRun(repoRoot, {
      command: 'ai analyze-project',
      input: reviewed.reviewPath,
      runId: options.runId,
      phase: 'created',
    });
    const snapshot = createAnalyzeProjectSnapshot(repoRoot, lifecycleRun, writePlan, {
      providerArtifact: completedReport.provider_artifact,
      proposal: reviewed.proposal,
      now: options.now || new Date(),
    });
    const writtenDocs = writeAnalyzeProjectDocs(writePlan);
    let writeReport = {
      ...completedReport,
      review: true,
      review_path: reviewed.reviewPath,
      doc_proposal: reviewed.proposal,
      write_plan: writePlan.map((item) => ({
        path: item.path,
        action: item.action,
        dirty: item.dirty,
        before_sha256: item.before_sha256,
        after_sha256: item.after_sha256,
        reason: item.reason,
      })),
      snapshot,
      written_docs: writtenDocs,
      run_id: lifecycleRun.run_id,
    };
    const postWriteValidation = validateAnalyzeProjectPostWrite(repoRoot, writeReport, {
      strict: options.strict === true,
    });
    writeReport = {
      ...writeReport,
      post_write_validation: postWriteValidation,
    };

    if (options.json === true) {
      process.stdout.write(`${JSON.stringify(writeReport, null, 2)}\n`);
      if (!postWriteValidation.ok) {
        const error = new Error(formatError('ai analyze-project post-write validation failed.'));
        error.code = 'AI_ANALYZE_PROJECT_POST_WRITE_VALIDATION_FAILED';
        error.validation = postWriteValidation;
        throw error;
      }
      return writeReport;
    }

    process.stdout.write(formatAnalyzeProjectReviewPlan({
      writePlan,
      reviewPath: reviewed.reviewPath,
      snapshot,
      writtenDocs,
      validation: postWriteValidation,
      completed: true,
    }));
    if (!postWriteValidation.ok) {
      const error = new Error(formatError('ai analyze-project post-write validation failed.'));
      error.code = 'AI_ANALYZE_PROJECT_POST_WRITE_VALIDATION_FAILED';
      error.validation = postWriteValidation;
      throw error;
    }
    return writeReport;
  }

  if (options.json === true) {
    process.stdout.write(`${JSON.stringify(completedReport, null, 2)}\n`);
    return completedReport;
  }

  process.stdout.write(formatAnalyzeProjectLiveReport(completedReport));
  return completedReport;
}

async function runPrepareContextWithPlanner(repoRoot, options = {}) {
  const role = normalizeRole(options.role || DEFAULT_PLAN_ROLE);
  const runtimeProfile = resolveRuntimeAgentProfile(repoRoot, role, options, DEFAULT_PLAN_PROVIDER);
  const provider = runtimeProfile.provider;
  const context = options.context || DEFAULT_PLAN_CONTEXT;
  const timeoutMs = normalizeTimeout(options.timeout);
  const draftPack = buildContextPreparationDrafts(repoRoot);
  const pack = buildContextPackMetadata({
    role,
    packName: context,
    repoRoot,
  });
  const promptInfo = buildPrepareContextPlannerPrompt({ pack, draftPack });
  const prompt = promptInfo.prompt;
  assertProviderPromptWithinLimit(prompt, options.promptLimitOptions || {});
  let invocation;

  try {
    invocation = buildProviderInvocation(provider, {
      prompt,
      cwd: repoRoot,
      timeoutMs,
        ...runtimeModelExecutionOptions(runtimeProfile, options),
      enforceModelSelection: false,
    });
  } catch (error) {
    if (error.providerResult) {
      result = error.providerResult;
    } else {
      throw annotateProviderError(error, 'prepare-context');
    }
  }

  if (options.dryRun) {
    const report = {
      task: 'prepare-context',
      mode: 'planner',
      dryRun: true,
      provider,
      role,
      contextPack: context,
      invocation,
      candidateDocs: promptInfo.allowedPaths,
      plan: draftPack.plan,
      profile: runtimeProfile,
    };
    process.stdout.write(formatPrepareContextPlannerDryRunReport({
      provider,
      role,
      context,
      invocation,
      promptInfo,
      review: options.review === true,
      interactive: options.interactive === true,
      language: options.language,
    }));
    return report;
  }

  if (options.printPrompt) {
    const report = {
      task: 'prepare-context',
      provider,
      role,
      contextPack: context,
      invocation,
      prompt,
      promptSource: promptInfo.promptSource,
      profile: runtimeProfile,
    };
    process.stdout.write(formatPromptOnlyReport(report));
    return report;
  }

  const ux = createCommandUx(options);
  const showProgress = shouldShowHumanProgress(ux, options);
  const progressTranslator = createTranslator(options.language);
  writeProgressChecks(
    ux,
    showProgress,
    plannerProgressTitle(progressTranslator.t('ai.planner.progress.onboarding'), runtimeProfile, options),
    [
      progressTranslator.t('ai.planner.progress.reading_base_docs'),
      progressTranslator.t('ai.planner.progress.detecting_structure'),
      progressTranslator.t('ai.planner.progress.preparing_prompt'),
    ],
  );

  let result;
  try {
    result = await runProviderWithProgress({
      ux,
      enabled: showProgress,
      message: progressTranslator.t('ai.planner.progress.running_agent'),
      successMessage: progressTranslator.t('ai.planner.progress.agent_finished'),
      failureMessage: progressTranslator.t('ai.planner.progress.agent_failed'),
      run: () => (options.runProviderFn || runProvider)(provider, {
        prompt,
        cwd: repoRoot,
        timeoutMs,
        dryRun: false,
        probe: options.probe,
        spawn: options.spawn,
        tempRoot: options.tempRoot,
        tempFileName: options.tempFileName,
        tempFilePrefix: options.tempFilePrefix,
        ...runtimeModelExecutionOptions(runtimeProfile, options),
        enforceModelSelection: Boolean(runtimeProfile.model),
      }),
    });
  } catch (error) {
    throw annotateProviderError(error, 'prepare-context');
  }

  if (!result.ok) {
    writeProviderOutput(result);
    throw annotateProviderError(result.error || new Error('provider run failed'), 'prepare-context');
  }

  const clean = extractCleanProviderOutput(result, { prompt, projectRoot: repoRoot });
  let proposal = parseContextProposalOutput(clean.cleanOutput);
  let reviewPath = '';

  if (options.review === true) {
    const reviewed = await reviewPlannerContextProposal(repoRoot, proposal, options);
    proposal = reviewed.proposal;
    reviewPath = reviewed.reviewPath;
  }

  const writePlan = buildPlannerContextWritePlan(repoRoot, proposal);
  await confirmPlannerContextWrites(writePlan, options);

  const lifecycleRun = ensureAiRun(repoRoot, {
    command: 'ai prepare-context --with-planner',
    input: options.input || '',
    runId: options.runId,
    phase: 'created',
  });
  const snapshot = createContextSnapshots(repoRoot, lifecycleRun, writePlan, options.now || new Date());
  const plannedDocs = writePlan.filter((item) => item.action !== 'skip').map((item) => item.path);

  process.stdout.write(formatContextPreparationReport({
    dryRun: false,
    plan: draftPack.plan,
    writePlan,
    writtenDocs: plannedDocs,
    snapshot,
    language: options.language,
  }));

  const writtenDocs = writeDraftDocs(writePlan);
  updateAiRunPhase(repoRoot, lifecycleRun.run_id, 'onboarding-ready', {
    artifact: snapshot.manifestPath,
    command: 'ai prepare-context --with-planner',
  });
  process.stdout.write(formatContextPreparationReport({
    dryRun: false,
    plan: draftPack.plan,
    writePlan,
    writtenDocs,
    snapshot,
    completed: true,
    language: options.language,
  }));

  return {
    task: 'prepare-context',
    mode: 'planner',
    dryRun: false,
    provider,
    role,
    contextPack: context,
    invocation,
    proposal,
    reviewPath,
    runId: lifecycleRun.run_id,
    snapshot,
    writtenDocs,
  };
}

async function runPlan(repoRoot, options = {}) {
  const phase = normalizePlannerPhase(options.phase || DEFAULT_PLAN_PHASE);
  const role = normalizeRole(options.role || DEFAULT_PLAN_ROLE);
  const runtimeProfile = resolveRuntimeAgentProfile(repoRoot, role, options, DEFAULT_PLAN_PROVIDER);
  const provider = runtimeProfile.provider;
  const context = options.context || DEFAULT_PLAN_CONTEXT;
  const timeoutMs = normalizeTimeout(options.timeout);
  let inputPath = options.input || '';
  let inputCompaction = null;

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

    if (options.printPrompt) {
      const report = {
        task: 'plan',
        phase,
        manifest,
      };
      const translator = createTranslator(options.language);
      process.stdout.write(`${translator.t('ai_task.title.prompt_only', { task: 'plan' })}\n${translator.t('ai_task.phase', { phase: 'spec' })}\n${translator.t('ai.plan.spec.prompt_only_no_provider')}\n`);
      process.stdout.write(formatSpecDryRunReport({ manifest, repoRoot, language: options.language }));
      return report;
    }

    if (options.dryRun) {
      const report = {
        task: 'plan',
        phase,
        manifest,
      };
      process.stdout.write(formatSpecDryRunReport({ manifest, repoRoot, language: options.language }));
      return report;
    }

    const result = generateSpecArtifacts(repoRoot, {
      input: inputPath,
      specSlug: options.specSlug,
    });
    process.stdout.write(formatSpecGenerationResult(result, repoRoot, options));

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

  let inputText = '';

  if (options.revise === true) {
    if (!inputPath) {
      throw new Error(formatError(`missing feedback input file for ai revise phase '${phase}'. Use: npx create-quiver ai revise --phase ${phase} --input <feedback.md> --dry-run`));
    }
    const feedbackText = readTextFile(inputPath, repoRoot);
    const revisionInput = buildRevisionInput({
      phase,
      feedbackPath: inputPath,
      feedbackText,
      repoRoot,
      compactionOptions: options,
    });
    inputText = revisionInput.text;
    inputCompaction = revisionInput.compaction;
  } else if (phase === 'technical-plan') {
    const resolved = resolveApprovedPlannerInput(repoRoot, phase, inputPath || undefined);
    inputPath = resolved.inputPath;
  }

  if (!inputPath) {
    throw new Error(formatError(`missing input file for ai plan phase '${phase}'`));
  }

  if (!inputText) {
    inputText = readTextFile(inputPath, repoRoot);
  }
  const contextInfo = buildPlanContext({
    role,
    context,
    phase,
    inputText,
    inputPath,
    repoRoot,
    revise: options.revise === true,
  });
  const prompt = contextInfo.prompt;
  assertProviderPromptWithinLimit(prompt, options);
  let invocation;

  try {
    invocation = buildProviderInvocation(provider, {
      prompt,
      cwd: repoRoot,
      timeoutMs,
        ...runtimeModelExecutionOptions(runtimeProfile, options),
      enforceModelSelection: false,
    });
  } catch (error) {
    if (error.providerResult) {
      result = error.providerResult;
    } else {
      throw annotateProviderError(error, 'plan', phase);
    }
  }

  if (options.dryRun) {
    const report = {
      task: 'plan',
      provider,
      role,
      contextPack: contextInfo.pack.packName,
      phase,
      invocation,
      profile: runtimeProfile,
    };
    process.stdout.write(formatDryRunReport({ ...report, language: options.language }));
    if (options.withPlanner === true) {
      process.stdout.write(`${createTranslator(options.language).t('ai.plan.with_planner_already_active')}\n`);
    }
    if (options.review === true) {
      process.stdout.write(`${createTranslator(options.language).t('ai.plan.review_requested')}\n`);
    }
    if (options.interactive === true) {
      process.stdout.write(`${createTranslator(options.language).t('ai.plan.interactive_requested')}\n`);
    }
    return report;
  }

  if (options.printPrompt) {
    const report = {
      task: 'plan',
      provider,
      role,
      contextPack: contextInfo.pack.packName,
      phase,
      invocation,
      prompt,
      profile: runtimeProfile,
    };
    process.stdout.write(formatPromptOnlyReport({ ...report, language: options.language }));
    return report;
  }

  const ux = createCommandUx(options);
  const showProgress = shouldShowHumanProgress(ux, options);
  writeProgressChecks(
    ux,
    showProgress,
    plannerProgressTitle(createTranslator(options.language).t('ai.planner.progress.plan', { phase }), runtimeProfile, options),
    [
      createTranslator(options.language).t('ai.planner.progress.reading_input'),
      createTranslator(options.language).t('ai.planner.progress.preparing_context'),
      createTranslator(options.language).t('ai.planner.progress.preparing_prompt'),
    ],
  );

  let result;
  try {
    result = await runProviderWithProgress({
      ux,
      enabled: showProgress,
      run: () => (options.runProviderFn || runProvider)(provider, {
        prompt,
        cwd: repoRoot,
        timeoutMs,
        dryRun: false,
        probe: options.probe,
        spawn: options.spawn,
        tempRoot: options.tempRoot,
        tempFileName: options.tempFileName,
        tempFilePrefix: options.tempFilePrefix,
        ...runtimeModelExecutionOptions(runtimeProfile, options),
        enforceModelSelection: Boolean(runtimeProfile.model),
      }),
    });
  } catch (error) {
    throw annotateProviderError(error, 'plan', phase);
  }

  if (!result.ok) {
    writeProviderOutput(result);
    throw annotateProviderError(result.error || new Error('provider run failed'), 'plan', phase);
  }

  const clean = extractCleanProviderOutput(result, { prompt, projectRoot: repoRoot });
  let cleanOutput = clean.cleanOutput;
  let reviewPath = '';

  if (options.review === true) {
    const reviewed = await reviewTextWithEditor(repoRoot, cleanOutput, {
      ...options,
      reviewFileName: `ai-plan-${phase}-draft.md`,
      reviewLabel: `ai plan --phase ${phase} review`,
    });
    cleanOutput = reviewed.text;
    reviewPath = reviewed.reviewPath;
  }

  await confirmInteractiveAction(`Save ${phase} planner draft?`, options);
  const lifecycleRun = ensureAiRun(repoRoot, {
    command: `ai plan --phase ${phase}`,
    input: inputPath,
    runId: options.runId,
  });
  writeCleanProviderOutput({ cleanOutput });
  const rawArtifact = writeRawProviderArtifact(repoRoot, lifecycleRun.run_id, `ai-plan-${phase}`, result, {
    metadata: {
      phase,
      input_path: inputPath,
      prompt_bytes: invocation.promptLength,
      clean_output_source: clean.source,
      stripped_prompt_echo: clean.strippedPromptEcho,
      input_compaction: inputCompaction,
    },
  });
  const draft = savePlannerDraft(repoRoot, phase, inputPath, cleanOutput, {
    rawArtifactPath: rawArtifact.path,
    outputSource: clean.source,
    inputCompaction,
    reviewPath,
  });
  updateAiRunPhase(repoRoot, lifecycleRun.run_id, phase === 'acceptance' ? 'acceptance-draft' : 'technical-plan-draft', {
    artifact: path.relative(repoRoot, draft.filePath).split(path.sep).join('/'),
    command: `ai plan --phase ${phase}`,
  });

  return {
    task: 'plan',
    provider,
    role,
    contextPack: contextInfo.pack.packName,
    phase,
    invocation,
    result,
    reviewPath,
  };
}

async function runReviewPlan(repoRoot, options = {}) {
  const role = 'planner';
  const runtimeProfile = resolveRuntimeAgentProfile(repoRoot, 'reviewer', options, DEFAULT_PLAN_PROVIDER);
  const provider = runtimeProfile.provider;
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
  assertProviderPromptWithinLimit(built.prompt, options);
  let invocation;

  try {
    invocation = buildProviderInvocation(provider, {
      prompt: built.prompt,
      cwd: repoRoot,
      timeoutMs,
        ...runtimeModelExecutionOptions(runtimeProfile, options),
      enforceModelSelection: false,
    });
  } catch (error) {
    if (error.providerResult) {
      result = error.providerResult;
    } else {
      throw annotateProviderError(error, 'review-plan');
    }
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
      profile: runtimeProfile,
    };
    process.stdout.write(formatDryRunReport({
      task: 'review-plan',
      provider,
      role: 'reviewer',
      contextPack: pack.packName,
      phase: 'plan-review',
      invocation,
      language: options.language,
    }));
    const translator = createTranslator(options.language);
    process.stdout.write(`${translator.t('ai_task.prompt_source', { source: built.promptSource })}\n`);
    process.stdout.write(`${translator.t('ai_task.input_file', { path: inputPath })}\n`);
    process.stdout.write(`${translator.t('ai_task.input_kind', { kind: resolved.kind })}\n`);
    if (resolved.version) {
      process.stdout.write(`${translator.t('ai_task.input_version', { version: resolved.version })}\n`);
    }
    return report;
  }

  if (options.printPrompt) {
    const report = {
      task: 'review-plan',
      provider,
      role: 'reviewer',
      contextPack: pack.packName,
      phase: 'plan-review',
      invocation,
      prompt: built.prompt,
      promptSource: built.promptSource,
      inputPath,
      inputKind: resolved.kind,
      inputVersion: resolved.version,
      profile: runtimeProfile,
    };
    process.stdout.write(formatPromptOnlyReport({ ...report, language: options.language }));
    return report;
  }

  const ux = createCommandUx(options);
  const showProgress = shouldShowHumanProgress(ux, options);
  writeProgressChecks(
    ux,
    showProgress,
    plannerProgressTitle(createTranslator(options.language).t('ai.planner.progress.review_plan'), runtimeProfile, options),
    [
      createTranslator(options.language).t('ai.planner.progress.reading_technical_plan'),
      createTranslator(options.language).t('ai.planner.progress.preparing_context'),
      createTranslator(options.language).t('ai.planner.progress.preparing_prompt'),
    ],
  );

  let result;
  try {
    result = await runProviderWithProgress({
      ux,
      enabled: showProgress,
      run: () => (options.runProviderFn || runProvider)(provider, {
        prompt: built.prompt,
        cwd: repoRoot,
        timeoutMs,
        dryRun: false,
        probe: options.probe,
        spawn: options.spawn,
        tempRoot: options.tempRoot,
        tempFileName: options.tempFileName,
        tempFilePrefix: options.tempFilePrefix,
        ...runtimeModelExecutionOptions(runtimeProfile, options),
        enforceModelSelection: Boolean(runtimeProfile.model),
      }),
    });
  } catch (error) {
    throw annotateProviderError(error, 'review-plan');
  }

  if (!result.ok) {
    writeProviderOutput(result);
    throw annotateProviderError(result.error || new Error('provider run failed'), 'review-plan');
  }

  const lifecycleRun = ensureAiRun(repoRoot, {
    command: 'ai review-plan',
    input: inputPath,
    runId: options.runId,
    phase: 'technical-plan-reviewed',
  });
  const clean = extractCleanProviderOutput(result, { prompt: built.prompt, projectRoot: repoRoot });
  const rawArtifact = writeRawProviderArtifact(repoRoot, lifecycleRun.run_id, 'ai-review-plan', result, {
    metadata: {
      phase: 'plan-review',
      input_path: inputPath,
      input_kind: resolved.kind,
      input_version: resolved.version || null,
      prompt_bytes: invocation.promptLength,
      clean_output_source: clean.source,
      stripped_prompt_echo: clean.strippedPromptEcho,
    },
  });
  writeCleanProviderOutput(clean);
  const saved = savePlanReview(repoRoot, {
    contents: clean.cleanOutput,
    inputPath,
    inputKind: resolved.kind,
    inputVersion: resolved.version,
    outputSource: clean.source,
    rawArtifactPath: rawArtifact.path,
  });
  const relativePath = path.relative(repoRoot, saved.filePath).split(path.sep).join('/');
  const summary = localizeApprovalSummary(summarizePlanReview(repoRoot), createTranslator(options.language)).trimEnd();
  const translator = createTranslator(options.language);
  process.stdout.write(`${translator.t('ai.review_plan.saved')}\n${translator.t('ai.approve.artifact')}: ${relativePath}\n${translator.t('ai_task.prompt_source', { source: PLAN_REVIEW_PROMPT_SOURCE })}\n${summary}\n`);

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

async function runRepairPlan(repoRoot, options = {}) {
  const role = normalizeRole(options.role || DEFAULT_PLAN_ROLE);
  const runtimeProfile = resolveRuntimeAgentProfile(repoRoot, role, options, DEFAULT_PLAN_PROVIDER);
  const provider = runtimeProfile.provider;
  const context = options.context || DEFAULT_PLAN_CONTEXT;
  const timeoutMs = normalizeTimeout(options.timeout);
  const source = resolveApprovedTechnicalPlanForRepair(repoRoot, options.input || '');
  const built = buildRepairPlanContext({
    context,
    inputText: source.contents,
    inputPath: source.path,
    repoRoot,
    role,
    validationError: source.validationError,
  });
  assertProviderPromptWithinLimit(built.prompt, options);
  let invocation;

  try {
    invocation = buildProviderInvocation(provider, {
      prompt: built.prompt,
      cwd: repoRoot,
      timeoutMs,
        ...runtimeModelExecutionOptions(runtimeProfile, options),
      enforceModelSelection: false,
    });
  } catch (error) {
    if (error.providerResult) {
      providerResult = error.providerResult;
    } else {
      throw annotateProviderError(error, 'repair-plan');
    }
  }

  if (options.dryRun) {
    const report = {
      task: 'repair-plan',
      provider,
      role,
      contextPack: built.pack.packName,
      phase: 'technical-plan',
      invocation,
      profile: runtimeProfile,
    };
    process.stdout.write(formatDryRunReport({ ...report, language: options.language }));
    const translator = createTranslator(options.language);
    process.stdout.write(`${translator.t('ai.repair_plan.source_approved_artifact')}: ${source.path}\n`);
    process.stdout.write(`${translator.t('ai.repair_plan.validation_failure')}: ${source.validationError}\n`);
    return report;
  }

  if (options.printPrompt) {
    const report = {
      task: 'repair-plan',
      provider,
      role,
      contextPack: built.pack.packName,
      phase: 'technical-plan',
      invocation,
      prompt: built.prompt,
      inputPath: source.path,
      inputKind: 'approved',
      inputVersion: source.approval.meta?.approved?.version || null,
      profile: runtimeProfile,
    };
    process.stdout.write(formatPromptOnlyReport({ ...report, language: options.language }));
    return report;
  }

  const ux = createCommandUx(options);
  const showProgress = shouldShowHumanProgress(ux, options);
  writeProgressChecks(
    ux,
    showProgress,
    plannerProgressTitle(createTranslator(options.language).t('ai.planner.progress.repair_plan'), runtimeProfile, options),
    [
      createTranslator(options.language).t('ai.planner.progress.reading_approved_plan'),
      createTranslator(options.language).t('ai.planner.progress.preparing_context'),
      createTranslator(options.language).t('ai.planner.progress.preparing_prompt'),
    ],
  );

  let providerResult;
  try {
    const progressTranslator = createTranslator(options.language);
    providerResult = await runProviderWithProgress({
      ux,
      enabled: showProgress,
      message: progressTranslator.t('ai.planner.progress.running_agent'),
      successMessage: progressTranslator.t('ai.planner.progress.agent_finished'),
      failureMessage: progressTranslator.t('ai.planner.progress.agent_failed'),
      run: () => (options.runProviderFn || runProvider)(provider, {
        prompt: built.prompt,
        cwd: repoRoot,
        timeoutMs,
        dryRun: false,
        probe: options.probe,
        spawn: options.spawn,
        tempRoot: options.tempRoot,
        tempFileName: options.tempFileName,
        tempFilePrefix: options.tempFilePrefix,
        ...runtimeModelExecutionOptions(runtimeProfile, options),
        enforceModelSelection: Boolean(runtimeProfile.model),
      }),
    });
  } catch (error) {
    throw annotateProviderError(error, 'repair-plan');
  }

  if (!providerResult.ok) {
    writeProviderOutput(providerResult);
    throw annotateProviderError(providerResult.error || new Error('provider run failed'), 'repair-plan');
  }

  const lifecycleRun = ensureAiRun(repoRoot, {
    command: 'ai repair-plan',
    input: source.path,
    runId: options.runId,
  });
  const clean = extractCleanProviderOutput(providerResult, { prompt: built.prompt, projectRoot: repoRoot });
  const rawArtifact = writeRawProviderArtifact(repoRoot, lifecycleRun.run_id, 'ai-repair-plan', providerResult, {
    metadata: {
      phase: 'technical-plan-repair',
      input_path: source.path,
      prompt_bytes: invocation.promptLength,
      clean_output_source: clean.source,
      stripped_prompt_echo: clean.strippedPromptEcho,
      validation_failure: source.validationError,
    },
  });

  try {
    validateTechnicalPlanSpecContract(repoRoot, {
      inputPath: source.path,
      inputText: clean.cleanOutput,
    });
  } catch (error) {
    throw new Error(formatError([
      'ai repair-plan provider output is still missing the required structured `spec.slices[]` contract.',
      stripCreateQuiverPrefix(error.message || error),
      `Raw provider artifact: ${rawArtifact.path}`,
      'No technical-plan draft was written.',
    ].join('\n')));
  }

  writeCleanProviderOutput(clean);
  const draft = savePlannerDraft(repoRoot, 'technical-plan', source.path, clean.cleanOutput, {
    rawArtifactPath: rawArtifact.path,
    outputSource: clean.source,
  });
  updateAiRunPhase(repoRoot, lifecycleRun.run_id, 'technical-plan-draft', {
    artifact: path.relative(repoRoot, draft.filePath).split(path.sep).join('/'),
    command: 'ai repair-plan',
  });
  process.stdout.write(formatRepairPlanResult({
    ...draft,
    sourcePath: source.path,
  }, repoRoot, options));

  return {
    task: 'repair-plan',
    provider,
    role,
    contextPack: built.pack.packName,
    phase: 'technical-plan',
    inputPath: source.path,
    filePath: path.relative(repoRoot, draft.filePath).split(path.sep).join('/'),
    version: draft.version || null,
    invocation,
    result: providerResult,
  };
}

async function runRevise(repoRoot, options = {}) {
  const translator = createTranslator(options.language);
  const phase = normalizePlannerPhase(options.phase || DEFAULT_PLAN_PHASE);
  if (phase === 'spec') {
    throw new Error(formatError(translator.t('ai.revise.error.unsupported_phase', { phase })));
  }

  const approval = readPhaseApproval(repoRoot, phase);
  if (approval.status !== 'draft' && approval.status !== 'stale') {
    throw new Error(formatError(translator.t('ai.revise.error.requires_draft', {
      phase,
      status: approval.status,
    })));
  }

  return runPlan(repoRoot, {
    ...options,
    phase,
    revise: true,
  });
}

function formatApprovalCandidateHint(candidate, options = {}) {
  const translator = createTranslator(options.language);
  const parts = [];
  if (candidate.current) {
    parts.push(translator.t('ai.approvals.current_candidate').toLowerCase());
  }
  if (candidate.created_at) {
    parts.push(candidate.created_at);
  }
  if (candidate.review?.recommendation) {
    parts.push(`review=${candidate.review.recommendation}`);
  }
  if (candidate.review?.required_fixes_count) {
    parts.push(`${translator.t('ai.approvals.required_fixes').toLowerCase()}=${candidate.review.required_fixes_count}`);
  }
  if (candidate.review?.optional_hardening_count) {
    parts.push(`${translator.t('ai.approvals.optional_hardening').toLowerCase()}=${candidate.review.optional_hardening_count}`);
  }
  if (candidate.review?.risks_count) {
    parts.push(`risks=${candidate.review.risks_count}`);
  }
  parts.push(candidate.reason);
  return parts.filter(Boolean).join(', ');
}

function approvalSelectionOptions(report, options = {}) {
  const translator = createTranslator(options.language);
  return report.candidates.map((candidate) => ({
    label: `${candidate.label}${candidate.recommended ? ` (${translator.t('ai.approvals.recommended_approval').toLowerCase()})` : candidate.current ? ` (${translator.t('ai.approvals.current_candidate').toLowerCase()})` : ` (${translator.t('ai.approvals.draft_history').toLowerCase()})`}`,
    value: String(candidate.version || ''),
    hint: formatApprovalCandidateHint(candidate, options),
    default: candidate.recommended === true,
    raw: candidate,
  }));
}

async function resolveApprovalVersion(repoRoot, phase, options = {}) {
  const translator = createTranslator(options.language);
  if (options.version) {
    return options.version;
  }

  const canPrompt = isInteractiveAgentPromptAvailable(options);
  const shouldPrompt = options.interactive === true || canPrompt;
  const report = buildApprovalCandidateReport(repoRoot, phase);

  if (!shouldPrompt || !canPrompt) {
    const recommended = report.recommended?.version || report.latest_version || '<n>';
    throw new Error(formatLocalizedActionableError({
      failure: translator.t('ai.approve.error.no_prompt.failure', { phase }),
      impact: translator.t('ai.approve.error.no_prompt.impact'),
      fix: translator.t('ai.approve.error.no_prompt.fix'),
      nextCommand: `npx create-quiver ai approve --phase ${phase} --version ${recommended}`,
    }, options));
  }

  if (report.candidates.length === 0) {
    throw new Error(formatLocalizedActionableError({
      failure: translator.t('ai.approve.error.no_drafts.failure', { phase }),
      impact: translator.t('ai.approve.error.no_drafts.impact'),
      fix: translator.t('ai.approve.error.no_drafts.fix', { phase }),
      nextCommand: `npx create-quiver ai plan --phase ${phase}${phase === 'acceptance' ? ' --input <requirements.md>' : ''} --dry-run`,
    }, options));
  }

  const selected = await selectOption(translator.t('ai.approve.prompt.version', { phase }), approvalSelectionOptions(report, options), {
    env: options.env,
    error: options.error,
    input: options.input,
    interactive: true,
    noColor: options.noColor,
    output: options.output,
    prompts: options.prompts,
    promptSelect: options.promptSelect,
    stdinIsTTY: options.stdinIsTTY,
    stdoutIsTTY: options.stdoutIsTTY,
    stderrIsTTY: options.stderrIsTTY,
    defaultValue: report.recommended?.version ? String(report.recommended.version) : undefined,
    flag: '--version',
    name: `${phase} approval version`,
  });

  const candidate = selected.raw;
  if (!candidate?.approvable) {
    throw new Error(formatLocalizedActionableError({
      failure: translator.t('ai.approve.error.not_approvable.failure', { phase, label: selected.label }),
      impact: candidate?.review?.blocking
        ? translator.t('ai.approve.error.not_approvable.impact_blocked')
        : translator.t('ai.approve.error.not_approvable.impact'),
      fix: candidate?.reason || translator.t('ai.approve.error.not_approvable.fix'),
      nextCommand: candidate?.next_command || `npx create-quiver ai approvals`,
    }, options));
  }

  return selected.value;
}

async function runApprove(repoRoot, options = {}) {
  const translator = createTranslator(options.language);
  const phase = normalizePlannerPhase(options.phase || DEFAULT_PLAN_PHASE);
  if (phase === 'spec') {
    throw new Error(formatError(translator.t('ai.approve.error.unsupported_phase', { phase })));
  }

  if (options.input) {
    throw new Error(formatError(translator.t('ai.approve.error.input_not_supported', { phase, input: options.input })));
  }

  const version = await resolveApprovalVersion(repoRoot, phase, options);

  if (phase === 'technical-plan') {
    const review = readPlanReview(repoRoot);
    if (review.status !== 'unapproved' && review.status !== 'reviewed') {
      throw new Error(formatError(translator.t('ai.approve.error.review_required', { status: review.status })));
    }
    if (reviewBlocksApproval(review)) {
      const result = review.meta.review_result;
      const requiredFixes = Array.isArray(result.required_fixes) ? result.required_fixes.length : 0;
      throw new Error(formatError(translator.t('ai.approve.error.review_blocked', {
        recommendation: result.approval_recommendation,
        fixes: requiredFixes,
        command: result.next_command,
      })));
    }
    assertTechnicalPlanDraftHasSpecContract(repoRoot, version);
  }

  const inputText = '';

  if (options.dryRun) {
    process.stdout.write(formatApprovalDryRunResult({ phase, input: options.input, version, language: options.language }));
    return {
      task: 'approve',
      phase,
      input: options.input,
      version: version || null,
      dryRun: true,
    };
  }

  const result = approvePlannerPhase(repoRoot, phase, options.input || '', inputText, {
    version: version || undefined,
  });
  const lifecycleRun = ensureAiRun(repoRoot, {
    command: `ai approve --phase ${phase}`,
    input: options.input || result.filePath,
    runId: options.runId,
  });
  recordAiRunApproval(repoRoot, lifecycleRun.run_id, {
    artifact: path.relative(repoRoot, result.filePath).split(path.sep).join('/'),
    phase,
    source_file: options.input || `draft version ${version}`,
    version: result.version || null,
  });
  updateAiRunPhase(repoRoot, lifecycleRun.run_id, phase === 'acceptance' ? 'acceptance-approved' : 'technical-plan-approved', {
    artifact: path.relative(repoRoot, result.filePath).split(path.sep).join('/'),
    command: `ai approve --phase ${phase}`,
  });
  process.stdout.write(formatApprovalResult({
    ...result,
    sourceFile: options.input || `draft version ${version}`,
  }, repoRoot, options));

  return {
    task: 'approve',
    phase,
    input: options.input,
    filePath: path.relative(repoRoot, result.filePath).split(path.sep).join('/'),
    createdAt: result.createdAt,
    version: result.version || null,
  };
}

async function runApprovalStatus(repoRoot, options = {}) {
  const report = formatApprovalStatusReportWithOptions(repoRoot, options);
  process.stdout.write(report);
  return {
    task: 'approval-status',
    report,
  };
}

function runLifecycleStatus(repoRoot, options = {}) {
  const run = resolveAiRun(repoRoot, options.runId || '');
  const report = formatAiRunStatus(repoRoot, run, options);
  process.stdout.write(report);
  return {
    task: 'status',
    run,
    report,
  };
}

function runLifecycleResume(repoRoot, options = {}) {
  const run = resolveAiRun(repoRoot, options.runId || '');
  const report = formatAiRunResume(repoRoot, run, options);
  process.stdout.write(report);
  return {
    task: 'resume',
    run,
    report,
  };
}

function runInspect(repoRoot, options = {}) {
  const report = collectLifecycleExport(repoRoot, {
    includeCompleted: options.includeCompleted === true,
  });
  process.stdout.write(formatLifecycleInspect(report, options));
  return {
    task: 'inspect',
    report,
  };
}

function runExport(repoRoot, options = {}) {
  const report = collectLifecycleExport(repoRoot, {
    includeCompleted: options.includeCompleted === true,
  });
  const format = String(options.format || 'json').trim().toLowerCase();

  if (format === 'json') {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return {
      task: 'export',
      format,
      report,
    };
  }

  if (format === 'markdown' || format === 'md') {
    process.stdout.write(formatLifecycleExportMarkdown(report, options));
    return {
      task: 'export',
      format: 'markdown',
      report,
    };
  }

  throw new Error(formatError(`unsupported ai export format: ${format}. Supported formats: json, markdown`));
}

function runSpecsList(repoRoot, options = {}) {
  const report = collectLifecycleExport(repoRoot, {
    includeCompleted: options.includeCompleted === true,
  });
  if (options.json === true) {
    process.stdout.write(`${JSON.stringify({ specs: report.specs }, null, 2)}\n`);
  } else {
    process.stdout.write(formatSpecsList(report, options));
  }
  return {
    task: 'specs',
    specs: report.specs,
  };
}

function runSlicesList(repoRoot, options = {}) {
  const report = collectLifecycleExport(repoRoot, {
    includeCompleted: options.includeCompleted === true,
  });
  if (options.json === true) {
    process.stdout.write(`${JSON.stringify({ slices: report.slices }, null, 2)}\n`);
  } else {
    process.stdout.write(formatSlicesList(report, options));
  }
  return {
    task: 'slices',
    slices: report.slices,
  };
}

function runTraceReport(repoRoot, options = {}) {
  const report = collectLifecycleExport(repoRoot, {
    includeCompleted: options.includeCompleted === true,
  });
  process.stdout.write(formatTraceReport(report, options));
  return {
    task: 'trace',
    report,
  };
}

function runActiveSlice(repoRoot, options = {}) {
  const command = String(options.command || 'status').trim().toLowerCase();
  if (command !== 'status' && command !== 'reconcile') {
    throw new Error(formatError(`unsupported ai active-slice subcommand: ${command}. Supported tasks: status, reconcile`));
  }
  if (command === 'reconcile' && options.dryRun !== true) {
    throw new Error(formatError('ai active-slice reconcile is dry-run first. Run `npx create-quiver ai active-slice reconcile --dry-run`.'));
  }

  const state = resolveProjectState(repoRoot, { allowGraphErrors: true });
  const report = collectActiveSliceState(repoRoot, { slices: state.graph.nodes });
  process.stdout.write(formatActiveSliceReconciliationReport(report, {
    dryRun: options.dryRun === true,
  }));
  return {
    task: 'active-slice',
    command,
    dryRun: options.dryRun === true,
    report,
  };
}

function runLifecycleRun(repoRoot, options = {}) {
  const translator = createTranslator(options.language);
  const command = String(options.command || '').trim().toLowerCase();
  if (command !== 'create' && command !== 'close') {
    throw new Error(formatError(translator.t('ai.run.error.unsupported_subcommand', { command })));
  }
  if (command === 'create' && !options.input) {
    throw new Error(formatError(translator.t('ai.run.error.create_requires_input')));
  }
  if (command === 'close') {
    const current = resolveAiRun(repoRoot, options.runId || '');
    if (!current) {
      throw new Error(formatError(translator.t('ai.run.error.close_requires_run')));
    }
    const run = updateAiRunPhase(repoRoot, current.run_id, 'closed', {
      command: 'ai run close',
    });
    const report = `${translator.t('ai.run.closed.title')}\n${formatAiRunStatus(repoRoot, run, options)}`;
    process.stdout.write(report);
    return {
      task: 'run',
      command,
      run,
      report,
    };
  }
  const run = createAiRun(repoRoot, {
    command: 'ai run create',
    input: options.input,
    runId: options.runId,
    specSlug: options.specSlug,
  });
  const report = formatAiRunStatus(repoRoot, run, options);
  process.stdout.write(report);
  return {
    task: 'run',
    command,
    run,
    report,
  };
}

function isInteractiveAgentPromptAvailable(options = {}) {
  const stdinIsTTY = options.stdinIsTTY ?? Boolean((options.input || process.stdin).isTTY);
  const stdoutIsTTY = options.stdoutIsTTY ?? Boolean((options.output || process.stdout).isTTY);
  const ci = String((options.env || process.env).CI || '').trim().toLowerCase();
  return stdinIsTTY && stdoutIsTTY && ci !== '1' && ci !== 'true';
}

function providerInstallStatus(repoRoot, providerId, options = {}) {
  const probe = options.preflightProvider || preflightProvider;
  try {
    probe(providerId, {
      cwd: repoRoot,
      probe: options.providerProbe,
      probeArgs: options.providerProbeArgs,
    });
    return 'installed';
  } catch (error) {
    if (error && error.code === 'MISSING_PROVIDER_CLI') {
      return 'not_installed';
    }
    return 'not_verified';
  }
}

function buildAgentProviderChoices(repoRoot, options = {}) {
  const translator = createTranslator(options.language);
  return listCatalogProviders().map((provider) => {
    const status = providerInstallStatus(repoRoot, provider.id, options);
    return {
      label: provider.displayName,
      value: provider.id,
      hint: translator.t('ai.agent.choice.provider_hint', {
        count: provider.modelCount,
        status: translator.t(`ai.agent.install_status.${status}`),
      }),
      raw: {
        ...provider,
        installStatus: status,
      },
    };
  });
}

function buildAgentModelChoices(provider, role, options = {}) {
  const translator = createTranslator(options.language);
  return getKnownModelsForProvider(provider, { role }).map((model) => {
    const recommended = model.recommendedFor.includes(role)
      ? translator.t('ai.agent.choice.model_recommended')
      : translator.t('ai.agent.choice.model_available');
    const tier = [model.costTier, model.qualityTier, model.stability].filter(Boolean).join('/');
    return {
      label: model.id === 'custom' ? translator.t('ai.agent.choice.model_custom') : model.displayName,
      value: model.id,
      hint: [recommended, tier].filter(Boolean).join(', '),
      default: model.recommendedFor.includes(role),
      raw: model,
    };
  });
}

async function resolveInteractiveAgentSetOptions(repoRoot, options = {}) {
  const translator = createTranslator(options.language);
  const role = normalizeAgentProfileRole(options.role);
  const hasProvider = Boolean(String(options.provider || '').trim());
  const hasModel = Boolean(String(options.model || '').trim());
  if (hasProvider && hasModel) {
    return {
      ...options,
      role,
    };
  }

  const canPrompt = isInteractiveAgentPromptAvailable(options);
  const shouldPrompt = options.interactive === true || canPrompt;
  if (!shouldPrompt || !canPrompt) {
    throw new Error(formatLocalizedActionableError({
      failure: translator.t('ai.agent.error.no_prompt.failure', { role }),
      impact: translator.t('ai.agent.error.no_prompt.impact'),
      fix: translator.t('ai.agent.error.no_prompt.fix'),
      nextCommand: `npx create-quiver ai agent set ${role} --provider codex --model gpt-5.5`,
    }, options));
  }

  const promptOptions = {
    env: options.env,
    error: options.error,
    input: options.input,
    interactive: true,
    noColor: options.noColor,
    output: options.output,
    prompts: options.prompts,
    promptSelect: options.promptSelect,
    promptText: options.promptText,
    stdinIsTTY: options.stdinIsTTY,
    stdoutIsTTY: options.stdoutIsTTY,
    stderrIsTTY: options.stderrIsTTY,
    write: options.write,
  };

  const existingProfiles = getAgentProfilesForRole(repoRoot, role);
  let next = { ...options, role };
  if (existingProfiles.length > 0 && !options.id && !options.defaultProfile) {
    const ux = createCommandUx(promptOptions);
    ux.summary(existingProfiles.map((profile) => ({
      label: profile.id,
      value: `${profile.provider} ${profile.model || translator.t('ai.agent.value.no_model')}${profile.default ? ` ${translator.t('ai.agent.value.default')}` : ''}`,
    })), {
      title: translator.t('ai.agent.prompt.existing_title', { role }),
    });

    const action = await selectOption(translator.t('ai.agent.prompt.existing_action', { role }), [
      { label: translator.t('ai.agent.prompt.action.update_current.label'), value: 'update-current', hint: translator.t('ai.agent.prompt.action.update_current.hint'), default: true },
      { label: translator.t('ai.agent.prompt.action.create_new.label'), value: 'create-new', hint: translator.t('ai.agent.prompt.action.create_new.hint') },
      { label: translator.t('ai.agent.prompt.action.change_default.label'), value: 'change-default', hint: translator.t('ai.agent.prompt.action.change_default.hint') },
      { label: translator.t('ai.agent.prompt.action.cancel.label'), value: 'cancel', hint: translator.t('ai.agent.prompt.action.cancel.hint') },
    ], {
      ...promptOptions,
      name: 'agent profile action',
      flag: '--id',
    });

    if (action.value === 'cancel') {
      throw new Error(formatError(translator.t('ai.agent.error.canceled')));
    }

    if (action.value === 'change-default') {
      const profile = await selectOption(translator.t('ai.agent.prompt.default_profile', { role }), existingProfiles.map((item) => ({
        label: resolveAgentProfileDisplayName(item),
        value: item.id,
        hint: `${item.provider} ${item.model || translator.t('ai.agent.value.no_model')}`,
        default: item.default === true,
        raw: item,
      })), {
        ...promptOptions,
        name: 'agent profile default',
        flag: '--id',
      });
      return {
        ...next,
        id: profile.raw.id,
        provider: profile.raw.provider,
        model: profile.raw.model,
        displayName: profile.raw.displayName,
        label: profile.raw.label,
        context: profile.raw.context,
        defaultProfile: true,
      };
    }

    if (action.value === 'update-current') {
      const current = existingProfiles.find((profile) => profile.default) || existingProfiles[0];
      next = {
        ...next,
        id: current.id,
        context: next.context || current.context,
        label: next.label || current.label,
      };
    }

    if (action.value === 'create-new') {
      const id = await promptText(translator.t('ai.agent.prompt.new_id', { role }), {
        ...promptOptions,
        name: 'agent profile id',
        flag: '--id',
        placeholder: `${role}-gpt-55`,
      });
      next.id = id;
      next.defaultProfile = options.defaultProfile === true;
    }
  }

  if (!next.provider) {
    const selectedProvider = await selectOption(translator.t('ai.agent.prompt.provider', { role }), buildAgentProviderChoices(repoRoot, options), {
      ...promptOptions,
      name: 'agent provider',
      flag: '--provider',
    });
    next.provider = selectedProvider.value;
  }

  if (!next.model) {
    const selectedModel = await selectOption(translator.t('ai.agent.prompt.model', { role }), buildAgentModelChoices(next.provider, role, options), {
      ...promptOptions,
      name: 'agent model',
      flag: '--model',
    });
    if (selectedModel.value === 'custom') {
      const model = await promptText(translator.t('ai.agent.prompt.custom_model', { provider: next.provider }), {
        ...promptOptions,
        name: 'agent model',
        flag: '--model',
        placeholder: `${next.provider}-model-id`,
      });
      const displayName = await promptText(translator.t('ai.agent.prompt.custom_model_display'), {
        ...promptOptions,
        name: 'agent model display name',
        flag: '--display-name',
        initialValue: model,
        required: false,
      });
      next.model = model;
      next.displayName = next.displayName || displayName || model;
    } else {
      next.model = selectedModel.value;
      next.displayName = next.displayName || selectedModel.raw.displayName;
    }
  }

  return {
    ...next,
    interactiveResolved: true,
  };
}

function formatAgentProfile(profile, options = {}) {
  const translator = createTranslator(options.language);
  const lines = [
    `${translator.t('ai.agent.field.id')}: ${profile.id || translator.t('ai.agent.value.default')}`,
    `${translator.t('ai.agent.field.role')}: ${profile.role}`,
    `${translator.t('ai.agent.field.provider')}: ${profile.provider}`,
    `${translator.t('ai.agent.field.model')}: ${profile.model || translator.t('ai.agent.value.not_set')}`,
    `${translator.t('ai.agent.field.label')}: ${profile.label || translator.t('ai.agent.value.not_set')}`,
    `${translator.t('ai.agent.field.display_name')}: ${resolveAgentProfileDisplayName(profile) || translator.t('ai.agent.value.not_set')}`,
    `${translator.t('ai.agent.field.default')}: ${profile.default === true ? translator.t('ai.agent.value.yes') : translator.t('ai.agent.value.no')}`,
    `${translator.t('ai.agent.field.context')}: ${profile.context || translator.t('ai.agent.value.not_set')}`,
    `${translator.t('ai.agent.field.updated')}: ${profile.updated_at}`,
  ];
  return `${lines.join('\n')}\n`;
}

function formatAgentProfileList(profiles, options = {}) {
  const translator = createTranslator(options.language);
  const lines = [translator.t('ai.agent.list.title')];
  for (const item of profiles) {
    if (!item.configured) {
      lines.push(`- ${item.role}: ${translator.t('ai.agent.list.not_configured')}`);
      continue;
    }
    const model = item.profile.model ? ` model=${item.profile.model}` : '';
    const label = item.profile.label ? ` label=${item.profile.label}` : '';
    const displayName = resolveAgentProfileDisplayName(item.profile);
    const alternatives = item.profiles.length > 1 ? ` ${translator.t('ai.agent.list.options')}=${item.profiles.length}` : '';
    lines.push(`- ${item.role}: provider=${item.profile.provider}${model}${label} ${translator.t('ai.agent.list.display_name')}=${displayName}${alternatives}`);
  }
  return `${lines.join('\n')}\n`;
}

function formatAgentProfileDryRun(repoRoot, result, options = {}) {
  const translator = createTranslator(options.language);
  const relativePath = path.relative(repoRoot, result.filePath).split(path.sep).join('/');
  const verb = result.action === 'update'
    ? translator.t('ai.agent.dry_run.verb_update')
    : translator.t('ai.agent.dry_run.verb_create');
  return [
    translator.t('ai.agent.dry_run.title'),
    `- ${translator.t('ai.agent.dry_run.writes')}: ${translator.t('ai.agent.value.none')}`,
    `- ${translator.t('ai.agent.dry_run.would', { verb, path: relativePath })}`,
    '',
    formatAgentProfile(result.profile, options).trimEnd(),
    '',
    translator.t('ai.agent.dry_run.no_secrets'),
    '',
  ].join('\n');
}

function agentDoctorSymbol(status) {
  if (status === 'error') return 'x';
  if (status === 'warning') return '!';
  return 'OK';
}

function formatAgentDoctorReport(report, options = {}) {
  const translator = createTranslator(options.language);
  const lines = [
    translator.t('ai.agent.doctor.title'),
    '',
    translator.t('ai.agent.doctor.checks'),
  ];

  if (report.checks.length === 0) {
    lines.push(`  ! ${translator.t('ai.agent.doctor.no_profiles')}`);
  }

  for (const check of report.checks) {
    const target = `${check.role}/${check.id}`;
    const model = check.model || translator.t('ai.agent.value.no_model');
    const provider = check.provider || translator.t('ai.agent.value.no_provider');
    const defaultText = check.default ? ` ${translator.t('ai.agent.value.default')}` : '';
    lines.push(`  ${agentDoctorSymbol(check.status)} ${target}: provider=${provider} model=${model}${defaultText}`);
    for (const finding of check.findings.filter((item) => item.severity !== 'info')) {
      lines.push(`    - ${finding.severity}: ${finding.message}`);
    }
  }

  lines.push('', translator.t('ai.agent.doctor.suggested_fixes'));
  if (report.suggestedFixes.length === 0) {
    lines.push(`  OK ${translator.t('ai.agent.doctor.no_fixes')}`);
  } else {
    for (const fix of report.suggestedFixes) {
      lines.push(`  - ${fix}`);
    }
  }
  lines.push('');
  lines.push(`${translator.t('ai.agent.doctor.summary')}: profiles=${report.summary.profiles} errors=${report.summary.errors} warnings=${report.summary.warnings} info=${report.summary.info}`);
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function formatAgentRepairPlan(plan, options = {}) {
  const translator = createTranslator(options.language);
  const lines = [
    translator.t('ai.agent.repair.title'),
    `- ${translator.t('ai.agent.dry_run.writes')}: ${translator.t('ai.agent.value.none')}`,
    '',
    translator.t('ai.agent.repair.proposed_changes'),
  ];

  if (plan.changes.length === 0) {
    lines.push(`  OK ${translator.t('ai.agent.repair.no_repairs')}`);
  }

  for (const change of plan.changes) {
    lines.push(`  - ${change.role}/${change.profileId}: ${change.reason}`);
    lines.push(`    ${translator.t('ai.agent.repair.before')}: model=${change.before.model || translator.t('ai.agent.value.not_set')} displayName=${change.before.displayName || translator.t('ai.agent.value.not_set')}`);
    lines.push(`    ${translator.t('ai.agent.repair.after')}: model=${change.after.model || translator.t('ai.agent.value.not_set')} displayName=${change.after.displayName || translator.t('ai.agent.value.not_set')}`);
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}

function buildModelsListReport(options = {}) {
  const translator = createTranslator(options.language);
  const providerFilter = String(options.provider || '').trim().toLowerCase();
  const providers = providerFilter
    ? [listCatalogProviders().find((provider) => provider.id === providerFilter)].filter(Boolean)
    : listCatalogProviders();

  if (providerFilter && providers.length === 0) {
    throw new Error(formatError(translator.t('ai.models.error.unsupported_provider_filter', {
      provider: options.provider,
      providers: listCatalogProviders().map((provider) => provider.id).join(', '),
    })));
  }

  return {
    catalogVersion: MODEL_CATALOG_VERSION,
    lastUpdated: MODEL_CATALOG_LAST_UPDATED,
    note: 'Models are known by Quiver. This does not guarantee provider account access.',
    providers: providers.map((provider) => ({
      id: provider.id,
      displayName: provider.displayName,
      models: getKnownModelsForProvider(provider.id).map((model) => ({
        id: model.id,
        displayName: model.displayName,
        recommendedFor: model.recommendedFor,
        costTier: model.costTier,
        qualityTier: model.qualityTier,
        stability: model.stability,
        custom: model.custom === true,
      })),
    })),
  };
}

function formatModelsListReport(report, options = {}) {
  const translator = createTranslator(options.language);
  const lines = [
    translator.t('ai.models.title'),
    `${translator.t('ai.models.catalog_version')}: ${report.catalogVersion}`,
    `${translator.t('ai.models.last_updated')}: ${report.lastUpdated}`,
    `${translator.t('ai.models.note')}`,
    '',
  ];

  for (const provider of report.providers) {
    lines.push(`${provider.displayName} (${provider.id})`);
    for (const model of provider.models) {
      const roles = model.recommendedFor.length > 0 ? model.recommendedFor.join(', ') : translator.t('ai.models.roles.custom_manual');
      lines.push(`  - ${model.id} (${model.displayName})`);
      lines.push(`    ${translator.t('ai.models.roles')}: ${roles}`);
      lines.push(`    cost=${model.costTier} quality=${model.qualityTier} stability=${model.stability}`);
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function runModelsList(options = {}) {
  const report = buildModelsListReport({
    language: options.language,
    provider: options.provider,
  });
  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(formatModelsListReport(report, options));
  }
  return {
    task: 'models',
    command: 'list',
    report,
  };
}

async function runAgent(repoRoot, options = {}) {
  const translator = createTranslator(options.language);
  const command = String(options.command || '').trim().toLowerCase();

  if (command === 'set') {
    if (!options.role) {
      throw new Error(formatError(translator.t('ai.agent.error.missing_set_role')));
    }
    const profileOptions = await resolveInteractiveAgentSetOptions(repoRoot, options);
    if (options.dryRun) {
      const preview = buildAgentProfileState(repoRoot, profileOptions.role, {
        context: profileOptions.context,
        default: profileOptions.defaultProfile,
        displayName: profileOptions.displayName,
        id: profileOptions.id,
        label: profileOptions.label,
        model: profileOptions.model,
        provider: profileOptions.provider,
      });
      process.stdout.write(formatAgentProfileDryRun(repoRoot, preview, options));
      return {
        task: 'agent',
        command,
        dryRun: true,
        profile: preview.profile,
        filePath: path.relative(repoRoot, preview.filePath).split(path.sep).join('/'),
      };
    }
    if (profileOptions.interactiveResolved === true) {
      const preview = buildAgentProfileState(repoRoot, profileOptions.role, {
        context: profileOptions.context,
        default: profileOptions.defaultProfile,
        displayName: profileOptions.displayName,
        id: profileOptions.id,
        label: profileOptions.label,
        model: profileOptions.model,
        provider: profileOptions.provider,
      });
      const ux = createCommandUx(profileOptions);
      ux.summary([
        { label: translator.t('ai.agent.field.role'), value: preview.profile.role },
        { label: translator.t('ai.agent.field.provider'), value: preview.profile.provider },
        { label: translator.t('ai.agent.field.model'), value: preview.profile.model || translator.t('ai.agent.value.not_set') },
        { label: translator.t('ai.agent.field.display_name'), value: resolveAgentProfileDisplayName(preview.profile) || translator.t('ai.agent.value.not_set') },
        { label: translator.t('ai.agent.field.default'), value: preview.profile.default === true ? translator.t('ai.agent.value.yes') : translator.t('ai.agent.value.no') },
      ], {
        title: translator.t('ai.agent.profile_to_save.title'),
      });
    }
    const result = setAgentProfile(repoRoot, profileOptions.role, {
      context: profileOptions.context,
      default: profileOptions.defaultProfile,
      displayName: profileOptions.displayName,
      id: profileOptions.id,
      label: profileOptions.label,
      model: profileOptions.model,
      provider: profileOptions.provider,
    });
    process.stdout.write(`${translator.t('ai.agent.saved.title')}\n`);
    process.stdout.write(formatAgentProfile(result.profile, options));
    process.stdout.write(`${translator.t('ai.agent.field.state')}: ${path.relative(repoRoot, result.filePath).split(path.sep).join('/')}\n`);
    return {
      task: 'agent',
      command,
      profile: result.profile,
      filePath: path.relative(repoRoot, result.filePath).split(path.sep).join('/'),
    };
  }

  if (command === 'show') {
    if (!options.role) {
      throw new Error(formatError(translator.t('ai.agent.error.missing_show_role')));
    }
    const profile = options.id
      ? getAgentProfileById(repoRoot, options.role, options.id)
      : getAgentProfile(repoRoot, options.role);
    if (!profile) {
      throw new Error(formatLocalizedActionableError({
        failure: options.id
          ? translator.t('ai.agent.error.missing_profile_id.failure', { role: options.role, id: options.id })
          : translator.t('ai.agent.error.missing_profile.failure', { role: options.role }),
        impact: translator.t('ai.agent.error.missing_profile.impact'),
        fix: translator.t('ai.agent.error.missing_profile.fix', { role: options.role }),
        nextCommand: `npx create-quiver ai agent set ${options.role} --provider <provider> --model <model-id>`,
      }, options));
    }
    process.stdout.write(formatAgentProfile(profile, options));
    return {
      task: 'agent',
      command,
      profile,
    };
  }

  if (command === 'list' || command === 'ls' || command === '') {
    const profiles = listAgentProfiles(repoRoot);
    process.stdout.write(formatAgentProfileList(profiles, options));
    process.stdout.write(`${translator.t('ai.agent.field.state')}: ${path.relative(repoRoot, agentProfilesPath(repoRoot)).split(path.sep).join('/')}\n`);
    return {
      task: 'agent',
      command: 'list',
      profiles,
    };
  }

  if (command === 'doctor') {
    const report = buildAgentProfileDoctorReport(repoRoot);
    if (options.json) {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    } else {
      process.stdout.write(formatAgentDoctorReport(report, options));
    }
    if (report.summary.errors > 0) {
      process.exitCode = 1;
    }
    return {
      task: 'agent',
      command,
      report,
    };
  }

  if (command === 'repair') {
    if (options.dryRun !== true) {
      throw new Error(formatError(translator.t('ai.agent.error.repair_requires_dry_run')));
    }
    const plan = buildAgentProfileRepairPlan(repoRoot, {
      includeState: options.json === true,
    });
    if (options.json) {
      process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
    } else {
      process.stdout.write(formatAgentRepairPlan(plan, options));
    }
    return {
      task: 'agent',
      command,
      dryRun: true,
      plan,
    };
  }

  throw new Error(formatError(translator.t('ai.agent.error.unsupported_subcommand', { command })));
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

  process.stdout.write(formatPreflightReport(report, { mode, dryRun, language: options.language }));

  return {
    task: mode,
    dryRun,
    preflight: report,
  };
}

async function runPr(repoRoot, options = {}) {
  const dryRun = options.dryRun === true;
  const create = options.create === true;
  const translator = createTranslator(options.language);
  const ux = createCommandUx(options);
  const showProgress = create && !dryRun && shouldShowHumanProgress(ux, options);
  if (showProgress) {
    ux.heading(translator.t('ai.github.progress.heading'));
  }
  let preflight;

  try {
    preflight = await runProviderWithProgress({
      ux,
      enabled: showProgress,
      message: translator.t('ai.github.progress.preflight.running'),
      successMessage: translator.t('ai.github.progress.preflight.done'),
      failureMessage: translator.t('ai.github.progress.preflight.failed'),
      run: () => (options.preflightFn || preflightGitHubPr)(repoRoot, {
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
      }),
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
    if (showProgress) {
      ux.check(translator.t('ai.github.progress.body_ready'));
    }
  } catch (error) {
    throw annotateGitHubError(error, 'pr');
  }

  if (options.review === true) {
    const hasEditorRunner = typeof options.openEditorFn === 'function';
    const canOpenEditor = hasEditorRunner || options.stdinIsTTY === true || (options.stdinIsTTY !== false && Boolean(process.stdin.isTTY));
    if (!canOpenEditor) {
      throw annotateGitHubError(makeReviewError('ai pr --review requires an interactive terminal or an injected editor runner.', plan.prBodyPath), 'pr');
    }
    const editorResult = hasEditorRunner
      ? options.openEditorFn(plan.prBodyPath, { cwd: repoRoot, env: options.env || process.env })
      : openEditor(plan.prBodyPath, { cwd: repoRoot, env: options.env || process.env });
    if (!editorResult || editorResult.ok !== true) {
      throw annotateGitHubError(makeReviewError(editorResult?.reason || 'ai pr review was canceled.', plan.prBodyPath), 'pr');
    }
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
  }

  if (dryRun || !create) {
    process.stdout.write(formatPrCreateReport({ preflight, plan }, { dryRun, create, language: options.language }));
    return {
      task: 'pr',
      dryRun,
      create,
      preflight,
      plan,
    };
  }

  await confirmInteractiveAction(`Create GitHub PR '${plan.title}'?`, options);

  let result;
  try {
    result = await runProviderWithProgress({
      ux,
      enabled: showProgress,
      message: translator.t('ai.github.progress.create.running'),
      successMessage: translator.t('ai.github.progress.create.done'),
      failureMessage: translator.t('ai.github.progress.create.failed'),
      run: () => runGhPrCreate(plan, {
        ghCreateRunner: options.ghCreateRunner,
      }),
    });
  } catch (error) {
    throw annotateGitHubError(error, 'pr');
  }

  process.stdout.write(formatPrCreateReport({ preflight, plan, result }, { dryRun: false, create: true, language: options.language }));
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
  resolveInteractiveAgentSetOptions,
  runAgent,
  runActiveSlice,
  runAnalyzeProject,
  runDoctor,
  runExecutePlan,
  runExecuteSlice,
  runLifecycleResume,
  runLifecycleRun,
  runLifecycleStatus,
  runModelsList,
  runExport,
  runInspect,
  runPromptSlice,
  runApprove,
  runApprovalStatus,
  runPrepareContext,
  runRepairPlan,
  runReviewPlan,
  runRevise,
  runPr,
  runSlicesList,
  runSpecsList,
  runTraceReport,
  runOnboard,
  runPlan,
  writeProviderOutput,
};
