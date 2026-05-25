const fs = require('node:fs');
const path = require('node:path');

const { redactSecrets } = require('../lib/evidence');
const { formatActionableError } = require('../lib/actionable-error');
const {
  assertProviderPromptWithinLimit,
  compactRevisionInput,
  extractCleanProviderOutput,
  writeRawProviderArtifact,
} = require('../lib/ai/artifacts');
const { buildContextPackMetadata, normalizeRole } = require('../lib/ai/context-packs');
const { runExecuteSlice, runPromptSlice } = require('../lib/ai/executor');
const { runExecutePlan } = require('../lib/ai/execution-plan');
const { buildPrCreatePlan, formatPreflightReport, formatPrCreateReport, preflightGitHubPr, runGhPrCreate } = require('../lib/ai/github');
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
  buildAgentProfileState,
  getAgentProfile,
  listAgentProfiles,
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
const { assertPlannerPhaseReady, getPlannerPhaseDetails, normalizePlannerPhase, PlannerPhaseError } = require('../lib/ai/phase-gates');

const DEFAULT_ONBOARD_PROVIDER = 'codex';
const DEFAULT_ONBOARD_ROLE = 'planner';
const DEFAULT_ONBOARD_CONTEXT = 'full';
const DEFAULT_PLAN_PROVIDER = 'codex';
const DEFAULT_PLAN_ROLE = 'planner';
const DEFAULT_PLAN_CONTEXT = 'planning';
const DEFAULT_PLAN_PHASE = 'acceptance';
const CONTEXT_PREP_START = '<!-- quiver:context-prep:start -->';
const CONTEXT_PREP_END = '<!-- quiver:context-prep:end -->';

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

function formatPromptOnlyReport({ task, provider, role, contextPack, phase, invocation, prompt, onboardingPlan, promptSource, inputPath, inputKind, inputVersion }) {
  const lines = [
    `AI ${task} prompt-only`,
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

  if (promptSource) {
    lines.push(`Prompt source: ${promptSource}`);
  }

  if (inputPath) {
    lines.push(`Input file: ${inputPath}`);
  }

  if (inputKind) {
    lines.push(`Input kind: ${inputKind}`);
  }

  if (inputVersion) {
    lines.push(`Input version: v${inputVersion}`);
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

function formatContextPreparationReport({ dryRun, plan, writePlan, writtenDocs, snapshot, completed = false }) {
  const lines = [
    dryRun ? 'AI prepare-context dry-run' : completed ? 'AI prepare-context completed' : 'AI prepare-context write plan',
    `Mode: ${dryRun ? 'dry-run' : 'live'}`,
    `Project: ${plan.projectName}`,
    `Project slug: ${plan.projectSlug}`,
    'Writes: docs-only',
    'Product code: untouched',
    `Proposed docs: ${writePlan.length > 0 ? writePlan.map((item) => item.path).join(', ') : 'none'}`,
  ];

  if (!dryRun) {
    lines.push(`${completed ? 'Written docs' : 'Planned writes'}: ${writtenDocs.length > 0 ? writtenDocs.join(', ') : 'none'}`);
    if (snapshot) {
      lines.push(`Snapshot: ${snapshot.root}`);
    }
  }

  if (completed) {
    return `${lines.join('\n')}\n`;
  }

  lines.push(
    'Proposed changes:',
    ...writePlan.map((item) => `- ${item.path}: ${item.action}${item.reason ? ` (${item.reason})` : ''}`),
    'Diff preview:',
    ...formatDiffPreview(writePlan),
    'Files considered:',
    ...plan.filesConsidered.map((item) => `- ${item.path}: ${item.present ? 'present' : 'absent'}${item.reason ? ` (${item.reason})` : ''}`),
    'Assumptions:',
    ...formatPathList(plan.assumptions),
    'Risks:',
    ...formatPathList(plan.risks),
    'Contradictions:',
    ...formatPathList(plan.contradictions),
    'Omitted paths:',
    ...formatPathList(plan.omittedPaths),
    'Uncertainty markers: TODO | Assumption | Pending confirmation',
  );

  return `${lines.join('\n')}\n`;
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

function formatRepairPlanResult(result, repoRoot) {
  const relativePath = path.relative(repoRoot, result.filePath).split(path.sep).join('/');
  return [
    'AI technical-plan repair draft saved',
    `Draft: ${relativePath}`,
    `Version: v${result.version}`,
    `Source approved artifact: ${result.sourcePath}`,
    'Original approved artifact: preserved',
    'Next safe commands:',
    '- npx create-quiver ai review-plan --dry-run',
    '- npx create-quiver ai review-plan',
    `- npx create-quiver ai approve --phase technical-plan --version ${result.version}`,
  ].join('\n').concat('\n');
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

function formatRunScopedApprovals(repoRoot, runApprovalRows) {
  const runs = listAiRuns(repoRoot);
  const activeRun = resolveAiRun(repoRoot, '');
  const lines = [
    'Run-scoped approvals',
    `Active run: ${activeRun ? activeRun.run_id : '(none)'}`,
  ];

  if (runs.length === 0) {
    lines.push('- no AI runs found');
    return `${lines.join('\n')}\n`;
  }

  for (const run of runs.slice().reverse()) {
    const relation = activeRun && run.run_id === activeRun.run_id
      ? 'active'
      : run.status === 'closed'
        ? 'historical'
        : 'other-open';
    const approvals = runApprovalRows.filter((row) => row.run.run_id === run.run_id);
    lines.push(`Run: ${run.run_id} (${relation}, phase: ${run.phase}, status: ${run.status})`);
    if (approvals.length === 0) {
      lines.push('- no run-scoped approvals');
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
  const runApprovalRows = collectRunApprovalRows(repoRoot);
  const sections = ['AI approvals status', formatRunScopedApprovals(repoRoot, runApprovalRows).trimEnd(), 'Global planner approvals'];
  for (const phase of PLANNER_APPROVAL_PHASES) {
    const summary = summarizePlannerApproval(repoRoot, phase).trimEnd();
    const relation = classifyGlobalApprovalRelation(readPhaseApproval(repoRoot, phase), runApprovalRows);
    sections.push(`${summary}\nRun relation: ${relation}`);
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

  if (options.printPrompt) {
    const report = {
      task: 'onboard',
      provider,
      role,
      contextPack: context,
      invocation,
      onboardingPlan: contextInfo.plan,
      prompt,
    };
    process.stdout.write(formatPromptOnlyReport(report));
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
    result,
  };
}

async function runPrepareContext(repoRoot, options = {}) {
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
  }));

  return {
    ...report,
    runId: lifecycleRun.run_id,
    snapshot,
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
      process.stdout.write('AI plan prompt-only\nPhase: spec\nNo provider prompt is used for spec generation; showing the local generation plan instead.\n');
      process.stdout.write(formatSpecDryRunReport({ manifest, repoRoot }));
      return report;
    }

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

  let inputText = '';

  if (options.revise === true) {
    if (!inputPath) {
      throw new Error(formatError(`missing feedback input file for ai revise phase '${phase}'`));
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

  if (options.printPrompt) {
    const report = {
      task: 'plan',
      provider,
      role,
      contextPack: contextInfo.pack.packName,
      phase,
      invocation,
      prompt,
    };
    process.stdout.write(formatPromptOnlyReport(report));
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

  if (!result.ok) {
    writeProviderOutput(result);
    throw annotateProviderError(result.error || new Error('provider run failed'), 'plan', phase);
  }

  const lifecycleRun = ensureAiRun(repoRoot, {
    command: `ai plan --phase ${phase}`,
    input: inputPath,
    runId: options.runId,
  });
  const clean = extractCleanProviderOutput(result, { prompt, projectRoot: repoRoot });
  writeCleanProviderOutput(clean);
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
  const draft = savePlannerDraft(repoRoot, phase, inputPath, clean.cleanOutput, {
    rawArtifactPath: rawArtifact.path,
    outputSource: clean.source,
    inputCompaction,
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
  assertProviderPromptWithinLimit(built.prompt, options);
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
    };
    process.stdout.write(formatPromptOnlyReport(report));
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

async function runRepairPlan(repoRoot, options = {}) {
  const role = normalizeRole(options.role || DEFAULT_PLAN_ROLE);
  const provider = resolveProviderForProfile(repoRoot, role, options.provider, options.providerExplicit, DEFAULT_PLAN_PROVIDER);
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
    });
  } catch (error) {
    throw annotateProviderError(error, 'repair-plan');
  }

  if (options.dryRun) {
    const report = {
      task: 'repair-plan',
      provider,
      role,
      contextPack: built.pack.packName,
      phase: 'technical-plan',
      invocation,
    };
    process.stdout.write(formatDryRunReport(report));
    process.stdout.write(`Source approved artifact: ${source.path}\n`);
    process.stdout.write(`Validation failure: ${source.validationError}\n`);
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
    };
    process.stdout.write(formatPromptOnlyReport(report));
    return report;
  }

  let providerResult;
  try {
    providerResult = await (options.runProviderFn || runProvider)(provider, {
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
  }, repoRoot));

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
  const phase = normalizePlannerPhase(options.phase || DEFAULT_PLAN_PHASE);
  if (phase === 'spec') {
    throw new Error(formatError(`ai revise does not support phase '${phase}'`));
  }

  const approval = readPhaseApproval(repoRoot, phase);
  if (approval.status !== 'draft' && approval.status !== 'stale') {
    throw new Error(formatError(`ai revise --phase ${phase} requires an existing draft; current status is ${approval.status}. Run \`npx create-quiver ai plan --phase ${phase} --input <file>\` first.`));
  }

  return runPlan(repoRoot, {
    ...options,
    phase,
    revise: true,
  });
}

async function runApprove(repoRoot, options = {}) {
  const phase = normalizePlannerPhase(options.phase || DEFAULT_PLAN_PHASE);
  if (phase === 'spec') {
    throw new Error(formatError(`ai approve does not support phase '${phase}'`));
  }

  if (!options.version) {
    throw new Error(formatError(`ai approve --phase ${phase} requires --version <n>. Review drafts with \`npx create-quiver ai approvals\`.`));
  }

  if (options.input) {
    throw new Error(formatError(`ai approve --phase ${phase} approves saved draft versions only. Use \`npx create-quiver ai revise --phase ${phase} --input ${options.input}\` to create a new draft first.`));
  }

  if (phase === 'technical-plan') {
    const review = readPlanReview(repoRoot);
    if (review.status !== 'unapproved' && review.status !== 'reviewed') {
      throw new Error(formatError(`ai approve --phase technical-plan requires a production review for the current draft; current review status is ${review.status}. Run \`npx create-quiver ai review-plan\`.`));
    }
    assertTechnicalPlanDraftHasSpecContract(repoRoot, options.version);
  }

  const inputText = '';

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
  const lifecycleRun = ensureAiRun(repoRoot, {
    command: `ai approve --phase ${phase}`,
    input: options.input || result.filePath,
    runId: options.runId,
  });
  recordAiRunApproval(repoRoot, lifecycleRun.run_id, {
    artifact: path.relative(repoRoot, result.filePath).split(path.sep).join('/'),
    phase,
    source_file: options.input || `draft version ${options.version}`,
    version: result.version || null,
  });
  updateAiRunPhase(repoRoot, lifecycleRun.run_id, phase === 'acceptance' ? 'acceptance-approved' : 'technical-plan-approved', {
    artifact: path.relative(repoRoot, result.filePath).split(path.sep).join('/'),
    command: `ai approve --phase ${phase}`,
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

function runLifecycleStatus(repoRoot, options = {}) {
  const run = resolveAiRun(repoRoot, options.runId || '');
  const report = formatAiRunStatus(repoRoot, run);
  process.stdout.write(report);
  return {
    task: 'status',
    run,
    report,
  };
}

function runLifecycleResume(repoRoot, options = {}) {
  const run = resolveAiRun(repoRoot, options.runId || '');
  const report = formatAiRunResume(repoRoot, run);
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
  process.stdout.write(formatLifecycleInspect(report));
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
    process.stdout.write(formatLifecycleExportMarkdown(report));
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
    process.stdout.write(formatSpecsList(report));
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
    process.stdout.write(formatSlicesList(report));
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
  process.stdout.write(formatTraceReport(report));
  return {
    task: 'trace',
    report,
  };
}

function runLifecycleRun(repoRoot, options = {}) {
  const command = String(options.command || '').trim().toLowerCase();
  if (command !== 'create' && command !== 'close') {
    throw new Error(formatError(`unsupported ai run subcommand: ${command}. Supported tasks: create, close`));
  }
  if (command === 'create' && !options.input) {
    throw new Error(formatError('ai run create requires --input <requirements.md>'));
  }
  if (command === 'close') {
    const current = resolveAiRun(repoRoot, options.runId || '');
    if (!current) {
      throw new Error(formatError('ai run close requires an active run or --run <id>'));
    }
    const run = updateAiRunPhase(repoRoot, current.run_id, 'closed', {
      command: 'ai run close',
    });
    const report = `AI run closed\n${formatAiRunStatus(repoRoot, run)}`;
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
  const report = formatAiRunStatus(repoRoot, run);
  process.stdout.write(report);
  return {
    task: 'run',
    command,
    run,
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

function formatAgentProfileDryRun(repoRoot, result) {
  const relativePath = path.relative(repoRoot, result.filePath).split(path.sep).join('/');
  const verb = result.action === 'update' ? 'update' : 'create';
  return [
    'AI agent profile dry-run',
    '- Writes: none',
    `- Would ${verb}: ${relativePath}`,
    '',
    formatAgentProfile(result.profile).trimEnd(),
    '',
    'No secrets or provider credentials are stored in agent profiles.',
    '',
  ].join('\n');
}

function runAgent(repoRoot, options = {}) {
  const command = String(options.command || '').trim().toLowerCase();

  if (command === 'set') {
    if (!options.role) {
      throw new Error(formatError('missing agent role. Use: npx create-quiver ai agent set <planner|executor|reviewer|doctor> --provider <provider>'));
    }
    if (!options.provider) {
      throw new Error(formatError('ai agent set requires --provider. Supported providers: codex, claude, gemini.'));
    }
    if (options.dryRun) {
      const preview = buildAgentProfileState(repoRoot, options.role, {
        context: options.context,
        label: options.label,
        model: options.model,
        provider: options.provider,
      });
      process.stdout.write(formatAgentProfileDryRun(repoRoot, preview));
      return {
        task: 'agent',
        command,
        dryRun: true,
        profile: preview.profile,
        filePath: path.relative(repoRoot, preview.filePath).split(path.sep).join('/'),
      };
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
      throw new Error(formatError('missing agent role. Use: npx create-quiver ai agent show <planner|executor|reviewer|doctor>'));
    }
    const profile = getAgentProfile(repoRoot, options.role);
    if (!profile) {
      throw new Error(formatActionableError({
        failure: `agent profile '${options.role}' is not configured.`,
        impact: 'Quiver will fall back to default provider behavior and may use the wrong model/cost profile.',
        fix: `Configure the ${options.role} profile with a supported provider and optional model label.`,
        nextCommand: `npx create-quiver ai agent set ${options.role} --provider <provider> --model <label>`,
      }));
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
  runLifecycleResume,
  runLifecycleRun,
  runLifecycleStatus,
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
