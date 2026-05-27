const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

const { buildContextPackMetadata, normalizeRole } = require('./context-packs');
const { buildProviderInvocation, runProvider } = require('./providers');
const {
  getAgentProfile,
  getAgentProfileById,
  getAgentProfilesForRole,
  resolveAgentProfileDisplayName,
  resolveProfileProvider,
} = require('../agent-profiles');
const { selectOption } = require('../cli/selectors');
const { createUx } = require('../cli/ux');
const { currentBranch, runGit } = require('../git');
const { redactSecrets, truncateText } = require('../evidence');
const { captureWorktreeSnapshot, validateScopeSnapshot } = require('../scope');
const { resolveSliceContext } = require('../slice');
const { buildGraph, readAllSlices, topoSort } = require('../slice-graph');
const { validateProjectRelativePaths } = require('../paths');

const DEFAULT_EXECUTE_PROVIDER = 'codex';
const DEFAULT_EXECUTE_ROLE = 'executor';
const DEFAULT_EXECUTE_CONTEXT = 'slice';

function formatError(message) {
  return `create-quiver: ${message}`;
}

function canonicalizeRepoRoot(repoRoot) {
  try {
    return fs.realpathSync(repoRoot);
  } catch {
    return path.resolve(repoRoot);
  }
}

function readTextFile(filePath, repoRoot) {
  const resolved = path.resolve(repoRoot, filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(formatError(`missing required file: ${path.relative(repoRoot, resolved).split(path.sep).join('/')}`));
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

function resolveExecutorRuntimeProfile(repoRoot, role, options = {}) {
  const explicitProvider = options.providerExplicit === true || (options.provider && options.providerExplicit !== false);
  const explicitModel = String(options.model || '').trim();

  if (explicitProvider) {
    const provider = String(options.provider || DEFAULT_EXECUTE_PROVIDER).trim().toLowerCase();
    return {
      provider,
      model: explicitModel,
      displayName: explicitModel || provider,
      profile: null,
    };
  }

  const profile = options.executorProfile
    ? getAgentProfileById(repoRoot, role, options.executorProfile)
    : getAgentProfile(repoRoot, role);
  const provider = profile?.provider || resolveProfileProvider(repoRoot, role, DEFAULT_EXECUTE_PROVIDER);
  const model = explicitModel || profile?.model || '';

  return {
    provider,
    model,
    displayName: profile ? resolveAgentProfileDisplayName(profile) : (model || provider),
    profile,
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

function selectorOptions(options = {}) {
  return {
    defaultValue: options.defaultValue,
    env: options.env || process.env,
    flag: options.flag,
    interactive: options.interactive,
    promptSelect: options.promptSelect,
    prompts: options.prompts,
    stdinIsTTY: options.stdinIsTTY,
    stdoutIsTTY: options.stdoutIsTTY,
    stderrIsTTY: options.stderrIsTTY,
  };
}

async function resolveInteractiveExecutorProfile(repoRoot, role, options = {}) {
  if (options.providerExplicit === true || options.provider || options.executorProfile || options.interactive !== true) {
    return options.executorProfile || '';
  }

  const profiles = getAgentProfilesForRole(repoRoot, role);
  if (profiles.length <= 1) {
    return options.executorProfile || '';
  }

  const selected = await selectOption(
    '¿Qué Executor querés usar?',
    profiles.map((profile) => ({
      label: resolveAgentProfileDisplayName(profile),
      value: profile.id,
      hint: `${profile.provider}${profile.model ? ` / ${profile.model}` : ''}`,
    })),
    selectorOptions({
      ...options,
      defaultValue: profiles.find((profile) => profile.default)?.id || profiles[0].id,
      flag: '--executor',
    }),
  );

  return selected.value;
}

function isCompletedStatus(status) {
  return ['completed', 'done', 'skipped', 'cancelled'].includes(String(status || '').trim().toLowerCase());
}

function readySliceOptions(repoRoot) {
  const allSlices = readAllSlices(repoRoot);
  const graph = buildGraph(allSlices);
  topoSort(graph);
  const pending = graph.nodes.filter((node) => !isCompletedStatus(node.status));
  const pendingRefs = new Set(pending.map((node) => node.ref));
  const completedRefs = new Set(graph.nodes.filter((node) => isCompletedStatus(node.status)).map((node) => node.ref));
  const pendingFoundationBySpec = new Set(pending
    .filter((node) => node.sliceId === 'slice-00' || String(node.sliceId || '').startsWith('slice-00-'))
    .map((node) => node.specSlug));
  const incomingByRef = new Map();

  for (const edge of graph.edges) {
    if (!incomingByRef.has(edge.to)) {
      incomingByRef.set(edge.to, []);
    }
    incomingByRef.get(edge.to).push(edge.from);
  }

  return pending
    .filter((node) => {
      if (pendingFoundationBySpec.has(node.specSlug) && !(node.sliceId === 'slice-00' || String(node.sliceId || '').startsWith('slice-00-'))) {
        return false;
      }
      const incoming = incomingByRef.get(node.ref) || [];
      return incoming.every((depRef) => completedRefs.has(depRef) || !pendingRefs.has(depRef));
    })
    .sort((left, right) => String(left.ref).localeCompare(String(right.ref)))
    .map((node) => ({
      label: `${node.ref} [${node.status || 'draft'}]`,
      value: toRelativePath(repoRoot, node.slicePath),
      hint: node.title || node.sliceId,
    }));
}

async function resolveInteractiveSliceInput(repoRoot, options = {}) {
  if (options.slice) {
    return options.slice;
  }

  if (options.interactive !== true) {
    throw new Error(formatError('missing required --slice path for ai execute-slice'));
  }

  const optionsForSlices = readySliceOptions(repoRoot);
  if (optionsForSlices.length === 0) {
    throw new Error(formatError('no ready slices found for interactive execution. Run `npx create-quiver ai execute-plan --dry-run` to inspect dependencies and blockers.'));
  }

  const selected = await selectOption(
    '¿Qué slice querés ejecutar?',
    optionsForSlices,
    selectorOptions({
      ...options,
      defaultValue: optionsForSlices.length === 1 ? optionsForSlices[0].value : undefined,
      flag: '--slice',
    }),
  );
  return selected.value;
}

function shouldShowHumanProgress(ux, options = {}) {
  return options.progress !== false
    && options.dryRun !== true
    && ux?.mode?.decoration === true;
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

async function runWithProgress({ ux, enabled, message, successMessage, failureMessage, run }) {
  if (!enabled) {
    return run();
  }

  return ux.withSpinner(message, run, {
    successMessage,
    failureMessage,
  });
}

async function runProviderWithProgress({ ux, enabled, run }) {
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

  return runWithProgress({
    ux,
    enabled,
    message: 'Ejecutando agente...',
    successMessage: 'Agente finalizado',
    failureMessage: 'Fallo ejecutando agente',
    run: runAndFailOnProviderResult,
  });
}

function toRelativePath(repoRoot, absolutePath) {
  return path.relative(repoRoot, absolutePath).split(path.sep).join('/');
}

function resolveSliceJsonPath(repoRoot, sliceInput) {
  const value = String(sliceInput || '').trim();
  if (!value) {
    throw new Error(formatError('missing required --slice path for ai execute-slice'));
  }

  const resolved = path.resolve(repoRoot, value);
  const slicePath = fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()
    ? path.join(resolved, 'slice.json')
    : resolved;

  if (!fs.existsSync(slicePath)) {
    throw new Error(formatError(`missing slice.json at ${toRelativePath(repoRoot, slicePath)}`));
  }

  return slicePath;
}

function formatList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return ['- n/a'];
  }

  return items.map((item) => `- ${item}`);
}

function uniqueList(items) {
  return Array.from(new Set((Array.isArray(items) ? items : []).map((item) => String(item)).filter(Boolean)));
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractMarkdownHeading(text) {
  const match = String(text || '').match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

function extractMarkdownSection(text, headings) {
  const lines = String(text || '').split(/\r?\n/);
  const normalized = new Set(headings.map((heading) => String(heading).trim().toLowerCase()));
  const section = [];
  let capture = false;

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      const key = heading[1].trim().toLowerCase();
      if (normalized.has(key)) {
        capture = true;
        continue;
      }
      if (capture) {
        break;
      }
    }

    if (capture) {
      section.push(line);
    }
  }

  return section.join('\n').trim();
}

function buildSpecExcerpt(repoRoot, slice) {
  const specPath = path.join(slice.specDirAbs, 'SPEC.md');
  if (!fs.existsSync(specPath)) {
    return {
      path: toRelativePath(repoRoot, specPath),
      lines: ['- n/a'],
    };
  }

  const text = fs.readFileSync(specPath, 'utf8');
  const title = extractMarkdownHeading(text);
  const objective = extractMarkdownSection(text, ['Objective', 'Objetivo']);
  const lines = [];

  if (title) {
    lines.push(`- Title: ${title}`);
  }
  if (objective) {
    lines.push(`- Objective: ${objective.replace(/\s+/g, ' ').slice(0, 500)}`);
  }
  if (lines.length === 0) {
    lines.push('- SPEC.md exists, but no short title/objective excerpt was found.');
  }

  return {
    path: toRelativePath(repoRoot, specPath),
    lines,
  };
}

function buildManualExecutorPrompt({ repoRoot, slicePath, role, context, tokenLimit } = {}) {
  const executorContext = buildExecuteSliceContext({
    repoRoot,
    slicePath,
    role: role || DEFAULT_EXECUTE_ROLE,
    context: context || DEFAULT_EXECUTE_CONTEXT,
  });
  const canonicalRepoRoot = canonicalizeRepoRoot(repoRoot);
  const closurePath = path.join(path.dirname(executorContext.slice.sliceAbs), 'CLOSURE_BRIEF.md');
  const closureText = readTextFile(closurePath, canonicalRepoRoot);
  const relativeClosurePath = toRelativePath(canonicalRepoRoot, closurePath);
  const specExcerpt = buildSpecExcerpt(canonicalRepoRoot, executorContext.slice);
  const slice = executorContext.slice;
  const objective = String(slice.json.objective || slice.json.description || slice.sliceId).trim();
  const restrictions = [
    'Do not read the whole repo.',
    'Do not modify files outside the allowed files.',
    'Before editing, list the files you will read and the files you expect to modify.',
    'Do not add unrequested features.',
    'Do not refactor architecture unless the slice explicitly requires it.',
    'If another file is needed, justify why before reading it.',
    'If blocked, stop and report the blocker before improvising.',
  ];
  const outputFormat = [
    '## Cambios realizados',
    '## Archivos modificados',
    '## Comandos ejecutados',
    '## Validaciones',
    '## Riesgos pendientes',
    '## Proximo paso recomendado',
  ];
  const promptLines = [
    'Act as a WDD + SDD executor agent.',
    '',
    'MODE: controlled SLICE execution.',
    '',
    'Slice objective:',
    objective || 'n/a',
    '',
    'Minimal context:',
    `- Spec: ${slice.specSlug}`,
    `- Slice: ${slice.sliceId}`,
    `- Slice file: ${slice.sliceRel}`,
    `- Execution brief: ${executorContext.briefPath}`,
    `- Closure brief: ${relativeClosurePath}`,
    '',
    'Relevant SPEC excerpts:',
    `- Source: ${specExcerpt.path}`,
    ...specExcerpt.lines,
    '',
    'Expected read paths:',
    ...formatList(executorContext.expectedReadPaths),
    '',
    'Allowed files:',
    ...formatList(executorContext.allowedFiles),
    '',
    'Restrictions:',
    ...formatList(restrictions),
    '',
    'Acceptance criteria:',
    ...formatList(slice.acceptance),
    '',
    'Validation commands:',
    ...formatList(executorContext.validationCommands),
    '',
    'Validation hints:',
    ...formatList(executorContext.validationHints),
    '',
    'Exact deliverable expected:',
    '- Implement only this slice.',
    '- Keep the change inside the allowed files.',
    '- Leave evidence in the final report.',
    '',
    'Required final report format:',
    ...outputFormat.map((line) => `- ${line}`),
    '',
    `Suggested token limit: ${Number(tokenLimit) > 0 ? Number(tokenLimit) : 3000}`,
    '',
    'Execution brief content:',
    executorContext.briefText.trimEnd(),
    '',
    'Closure brief content:',
    closureText.trimEnd(),
  ];

  return {
    allowedFiles: executorContext.allowedFiles,
    closurePath: relativeClosurePath,
    prompt: `${promptLines.join('\n')}\n`,
    slice,
    specExcerpt,
    validationCommands: executorContext.validationCommands,
  };
}

function runPromptSlice(repoRoot, options = {}) {
  if (!options.slice) {
    throw new Error(formatError('missing required --slice path for ai prompt-slice'));
  }

  const built = buildManualExecutorPrompt({
    repoRoot,
    slicePath: options.slice,
    tokenLimit: options.tokenLimit,
  });
  process.stdout.write(built.prompt);

  return {
    task: 'prompt-slice',
    slice: built.slice.sliceId,
    specSlug: built.slice.specSlug,
    prompt: built.prompt,
  };
}

function buildRecoveryGuidance(slice) {
  const sliceRef = slice && slice.sliceRel ? slice.sliceRel : '<slice.json>';
  return [
    'Recovery:',
    `- Retry: npx create-quiver ai execute-slice --slice ${sliceRef}`,
    '- Abort: inspect the local changes, then manually revert or stash anything you do not want to keep.',
    '- Commit: rerun with --commit only after provider, scope, and validation pass.',
  ].join('\n');
}

function appendRecovery(error, slice) {
  if (!error || !error.message || error.message.includes('Recovery:')) {
    return error;
  }

  const wrapped = new Error(`${error.message}\n\n${buildRecoveryGuidance(slice)}`);
  wrapped.cause = error;
  wrapped.code = error.code;
  wrapped.details = error.details;
  return wrapped;
}

function buildExecuteSliceContext({ repoRoot, slicePath, role, context }) {
  const canonicalRepoRoot = canonicalizeRepoRoot(repoRoot);
  const resolvedRole = normalizeRole(role || DEFAULT_EXECUTE_ROLE);
  if (resolvedRole !== DEFAULT_EXECUTE_ROLE) {
    throw new Error(formatError('ai execute-slice requires role executor'));
  }

  const resolvedSlicePath = resolveSliceJsonPath(canonicalRepoRoot, slicePath);
  const slice = resolveSliceContext(canonicalRepoRoot, resolvedSlicePath);
  const briefPath = path.join(path.dirname(slice.sliceAbs), 'EXECUTION_BRIEF.md');
  const briefText = readTextFile(briefPath, canonicalRepoRoot);
  const pack = buildContextPackMetadata({
    role: resolvedRole,
    packName: context || DEFAULT_EXECUTE_CONTEXT,
    repoRoot: canonicalRepoRoot,
  });
  const relativeSlicePath = toRelativePath(canonicalRepoRoot, slice.sliceAbs);
  const relativeBriefPath = toRelativePath(canonicalRepoRoot, briefPath);
  const allowedFiles = validateProjectRelativePaths(Array.isArray(slice.files) ? slice.files.map((file) => String(file)) : [], 'slice write scope');
  const expectedReadPaths = validateProjectRelativePaths(Array.isArray(slice.expectedReadPaths) ? slice.expectedReadPaths.map((file) => String(file)) : [], 'slice read scope');
  const acceptance = Array.isArray(slice.acceptance) ? slice.acceptance.map((item) => String(item)) : [];
  const validationCommands = Array.isArray(slice.tests) ? slice.tests.map((item) => String(item)) : [];
  const validationHints = Array.isArray(slice.validationHints) ? slice.validationHints.map((item) => String(item)) : [];
  const mustItems = Array.isArray(slice.json.must) ? slice.json.must.map((item) => String(item)) : [];
  const excludedItems = Array.isArray(slice.json.not_included) ? slice.json.not_included.map((item) => String(item)) : [];

  const sections = [
    pack.prompt,
    'Task: execute the slice directly in the repository using only the handoff below.',
    `Slice: ${slice.sliceId}`,
    `Spec: ${slice.specSlug}`,
    `Slice file: ${relativeSlicePath}`,
    `Execution brief: ${relativeBriefPath}`,
    'Expected read paths:',
    ...formatList(expectedReadPaths),
    'Allowed files:',
    ...formatList(allowedFiles),
    'Acceptance criteria:',
    ...formatList(acceptance),
    'Validation commands:',
    ...formatList(validationCommands),
  ];

  if (mustItems.length > 0) {
    sections.push('Must:', ...formatList(mustItems));
  }

  if (excludedItems.length > 0) {
    sections.push('Not included:', ...formatList(excludedItems));
  }

  if (validationHints.length > 0) {
    sections.push('Validation hints:', ...formatList(validationHints));
  }

  sections.push(
    'Constraints:',
    '- Do not commit manually. Quiver can create the slice commit after scope and validation pass when the user enables --commit.',
    '- Do not fix scope violations automatically.',
    '- Do not run multiple executors concurrently.',
    '- Stay inside the allowed files declared by slice.json.',
    'Execution brief:',
    briefText.trimEnd(),
  );

  return {
    allowedFiles,
    briefPath: relativeBriefPath,
    briefText,
    context: pack,
    expectedReadPaths,
    prompt: sections.join('\n\n'),
    slice,
    validationHints,
    validationCommands,
  };
}

function formatExecuteSliceDryRunReport({ provider, role, contextPack, slice, briefPath, invocation, validationCommands, allowedFiles, commitEnabled }) {
  const lines = [
    'AI execute-slice dry-run',
    `Provider: ${provider}`,
    `Role: ${role}`,
    `Context pack: ${contextPack}`,
    `Slice: ${slice.sliceId}`,
    `Spec: ${slice.specSlug}`,
    `Execution brief: ${briefPath}`,
    `Command: ${invocation.command} ${invocation.args.join(' ')}`,
    `Timeout: ${invocation.timeoutMs}ms`,
    `Prompt transport: ${invocation.promptTransport.mode}`,
    `Prompt length: ${invocation.promptLength} bytes`,
    `Commit after validation: ${commitEnabled ? 'enabled' : 'disabled'}`,
  ];
  if (invocation.modelSelection && invocation.modelSelection.model) {
    lines.push(`Model: ${invocation.modelSelection.model}`);
    lines.push(`Model support: ${invocation.modelSelection.supported ? 'supported' : 'unsupported'} (${invocation.modelSelection.reason})`);
  }
  lines.push(
    'Allowed files:',
    ...formatList(allowedFiles),
    'Validation commands:',
    ...formatList(validationCommands),
  );

  return `${lines.join('\n')}\n`;
}

function formatExecuteSliceResult({ slice, changedFiles, scopeResult, validationResults, commitResult, commitEnabled }) {
  const lines = [
    'AI execute-slice completed',
    `Slice: ${slice.sliceId}`,
    `Spec: ${slice.specSlug}`,
    `Changed files: ${changedFiles.length}`,
  ];

  for (const file of changedFiles) {
    lines.push(`- ${file}`);
  }

  lines.push(`Scope validation: ${scopeResult.ok ? 'passed' : 'failed'}`);
  if (!Array.isArray(validationResults) || validationResults.length === 0) {
    lines.push('Validation commands: skipped (none declared)');
  } else {
    lines.push(`Validation commands: passed (${validationResults.length})`);
  }
  if (commitResult) {
    lines.push(`Commit: created ${commitResult.hash}`);
    lines.push(`Commit message: ${commitResult.message}`);
  } else {
    lines.push(`Commit: ${commitEnabled ? 'not created' : 'skipped'}`);
  }

  return `${lines.join('\n')}\n`;
}

function annotateProviderError(error, scope) {
  const message = error && error.message ? error.message : String(error);
  const wrapped = new Error(formatError(`ai ${scope} failed: ${message}`));
  wrapped.cause = error;
  wrapped.code = error && error.code ? error.code : 'AI_PROVIDER_ERROR';
  wrapped.details = error && error.details ? error.details : undefined;
  return wrapped;
}

function runValidationCommand(command, repoRoot) {
  try {
    const stdout = cp.execSync(command, {
      cwd: repoRoot,
      encoding: 'utf8',
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return {
      command: redactSecrets(command),
      ok: true,
      stdout: redactSecrets(stdout),
      stderr: '',
      exitCode: 0,
    };
  } catch (error) {
    return {
      command: redactSecrets(command),
      ok: false,
      stdout: redactSecrets(error.stdout ? String(error.stdout) : ''),
      stderr: redactSecrets(error.stderr ? String(error.stderr) : ''),
      exitCode: Number.isInteger(error.status) ? error.status : 1,
      error,
    };
  }
}

function runValidationCommands(repoRoot, commands, runner = runValidationCommand) {
  const results = [];
  for (const command of commands) {
    const rawResult = runner(command, repoRoot);
    const result = {
      ...rawResult,
      command: redactSecrets(rawResult.command || command),
      stderr: redactSecrets(rawResult.stderr || ''),
      stdout: redactSecrets(rawResult.stdout || ''),
    };
    results.push(result);
    if (!result.ok) {
      const details = [
        formatError(`validation command failed: ${command}`),
        `Exit code: ${result.exitCode}`,
      ];
      if (result.stderr) {
        details.push(`stderr:\n${result.stderr.trimEnd()}`);
      }
      if (result.stdout) {
        details.push(`stdout:\n${result.stdout.trimEnd()}`);
      }
      const error = new Error(details.join('\n'));
      error.code = 'VALIDATION_FAILED';
      error.details = { command, result, results };
      throw error;
    }
  }
  return results;
}

function commitTypeForSlice(slice) {
  const type = String(slice.json.type || slice.json.git?.branch_type || '').trim().toLowerCase();
  if (type === 'bugfix' || type === 'hotfix' || type === 'fix') {
    return 'fix';
  }
  if (type === 'docs' || type === 'documentation') {
    return 'docs';
  }
  if (type === 'test' || type === 'tests') {
    return 'test';
  }
  if (type === 'chore') {
    return 'chore';
  }
  return 'feat';
}

function buildSliceCommitMessage(slice) {
  const title = String(slice.json.title || slice.sliceId || 'slice').trim();
  const ticket = String(slice.ticket || '').trim();
  const subject = ticket ? `${ticket} ${title}` : title;
  return `${commitTypeForSlice(slice)}: ${subject}`;
}

function commitSliceChanges(repoRoot, slice, changedFiles, options = {}) {
  if (!Array.isArray(changedFiles) || changedFiles.length === 0) {
    const error = new Error(formatError('commit requested but provider produced no changed files.'));
    error.code = 'NO_CHANGES_TO_COMMIT';
    throw error;
  }

  const message = options.message || buildSliceCommitMessage(slice);
  runGit(['add', '--', ...changedFiles], repoRoot);
  runGit(['commit', '-m', message], repoRoot);

  return {
    files: changedFiles,
    hash: runGit(['rev-parse', '--short', 'HEAD'], repoRoot),
    message,
  };
}

function assertCorrectSliceWorktree(repoRoot, slice, options = {}) {
  if (options.skipWorktreeBranchCheck === true) {
    return null;
  }

  const expectedBranch = String(slice.branchName || slice.json.git?.branch_name || '').trim();
  if (!expectedBranch) {
    return null;
  }

  const actualBranch = currentBranch(repoRoot);
  if (actualBranch !== expectedBranch) {
    const error = new Error(formatError(`ai execute-slice must run from the slice worktree branch. Current branch: ${actualBranch || '(detached or unavailable)'}. Expected: ${expectedBranch}.`));
    error.code = 'WRONG_WORKTREE';
    error.details = {
      actualBranch,
      expectedBranch,
      slice: slice.sliceRel,
    };
    throw error;
  }

  return {
    actualBranch,
    expectedBranch,
  };
}

function sliceLifecycleArtifactPaths(repoRoot, slice) {
  const closureAbs = path.join(path.dirname(slice.sliceAbs), 'CLOSURE_BRIEF.md');
  return {
    closure: toRelativePath(repoRoot, closureAbs),
    commandLog: toRelativePath(repoRoot, path.join(slice.specDirAbs, 'COMMAND_LOG.md')),
    evidence: toRelativePath(repoRoot, path.join(slice.specDirAbs, 'EVIDENCE_REPORT.md')),
    sliceJson: toRelativePath(repoRoot, slice.sliceAbs),
    status: toRelativePath(repoRoot, path.join(slice.specDirAbs, 'STATUS.md')),
  };
}

function renderClosureBrief({ slice, changedFiles, validationResults, completedAt }) {
  const criteria = Array.isArray(slice.acceptance) ? slice.acceptance : [];
  const validationLines = Array.isArray(validationResults) && validationResults.length > 0
    ? validationResults.map((result) => `- [x] \`${result.command}\` exited ${result.exitCode}`)
    : ['- [x] No validation commands declared.'];

  return `${[
    `# CLOSURE BRIEF - ${slice.sliceId}: ${slice.json.title || slice.sliceId}`,
    '',
    '## Summary of Work',
    '',
    `Executed controlled slice closure at ${completedAt}. Quiver validated scope, validation commands, and lifecycle evidence for this slice.`,
    '',
    '## Validation Against Acceptance Criteria',
    '',
    ...(criteria.length > 0 ? criteria.map((item) => `- [x] ${item}`) : ['- [x] Slice execution completed with scope validation.']),
    '',
    '## Relevant Changes',
    '',
    ...formatList(changedFiles),
    '',
    '## Validation Commands',
    '',
    ...validationLines,
    '',
    '## Pending',
    '',
    'None recorded by Quiver.',
    '',
    '## Remaining Risks',
    '',
    'None recorded by Quiver.',
    '',
    '## Future Recommendations',
    '',
    'Review the evidence report and commit diff before opening the PR.',
    '',
  ].join('\n')}\n`;
}

function appendSection(filePath, fallbackTitle, section) {
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8').trimEnd() : fallbackTitle;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${current}\n\n${section.trimEnd()}\n`);
}

function updateStatusMarkdown(filePath, slice, completedAt) {
  const fallback = `# Status - ${slice.specSlug}\n`;
  let text = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : fallback;
  const rowRegex = new RegExp(`(\\|\\s*${escapeRegex(slice.sliceId)}\\s*\\|\\s*)[^|\\n]+(\\|[^\\n]*\\|)`);
  if (rowRegex.test(text)) {
    text = text.replace(rowRegex, '$1Completed $2');
  }
  text = text.replace(/\*\*Current slice:\*\*\s*[^\n]*/i, `**Current slice:** ${slice.sliceId} completed`);
  if (!text.endsWith('\n')) {
    text += '\n';
  }
  const section = [
    '',
    `## Execution Update - ${slice.sliceId}`,
    '',
    `- Status: Completed`,
    `- Completed at: ${completedAt}`,
    `- Source: \`npx create-quiver ai execute-slice --slice ${slice.sliceRel}\``,
  ].join('\n');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${text}${section}\n`);
}

function updateSliceJson(filePath, completedAt) {
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  json.status = 'completed';
  json.completed_at = completedAt;
  fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`);
}

function writeExecutionArtifacts(repoRoot, executorContext, details) {
  const { slice } = executorContext;
  const completedAt = details.completedAt || new Date().toISOString();
  const artifacts = sliceLifecycleArtifactPaths(repoRoot, slice);
  const changedFiles = uniqueList(details.changedFiles);
  const closurePath = path.join(repoRoot, artifacts.closure);
  const evidencePath = path.join(repoRoot, artifacts.evidence);
  const commandLogPath = path.join(repoRoot, artifacts.commandLog);
  const statusPath = path.join(repoRoot, artifacts.status);
  const validationResults = Array.isArray(details.validationResults) ? details.validationResults : [];
  const providerStdout = truncateText(redactSecrets(details.providerOutput?.stdout || ''), 1200).text;
  const providerStderr = truncateText(redactSecrets(details.providerOutput?.stderr || ''), 1200).text;

  fs.mkdirSync(path.dirname(closurePath), { recursive: true });
  fs.writeFileSync(closurePath, renderClosureBrief({
    slice,
    changedFiles,
    validationResults,
    completedAt,
  }));

  const validationLines = validationResults.length > 0
    ? validationResults.map((result) => `- \`${result.command}\` -> exit ${result.exitCode}`)
    : ['- No validation commands declared.'];
  appendSection(evidencePath, `# Evidence Report - ${slice.specSlug}`, [
    `## ${slice.sliceId} - Execution Evidence`,
    '',
    `- Completed at: ${completedAt}`,
    `- Changed files: ${changedFiles.length}`,
    ...changedFiles.map((file) => `  - \`${file}\``),
    `- Scope validation: passed`,
    `- Provider stdout redacted: ${providerStdout ? 'yes' : 'n/a'}`,
    `- Provider stderr redacted: ${providerStderr ? 'yes' : 'n/a'}`,
    '',
    '### Validation',
    '',
    ...validationLines,
    '',
    '### Provider Output',
    '',
    '```text',
    providerStdout || 'n/a',
    providerStderr ? `\n${providerStderr}` : '',
    '```',
  ].join('\n'));

  const commandLogRows = [
    `| ${completedAt} | ${slice.sliceId} | \`npx create-quiver ai execute-slice --slice ${slice.sliceRel}\` | passed |`,
    ...validationResults.map((result) => `| ${completedAt} | ${slice.sliceId} | \`${result.command}\` | exit ${result.exitCode} |`),
  ];
  const commandLogHeader = [
    '# Command Log',
    '',
    '| Timestamp | Slice | Command | Result |',
    '|---|---|---|---|',
  ].join('\n');
  const currentCommandLog = fs.existsSync(commandLogPath) ? fs.readFileSync(commandLogPath, 'utf8').trimEnd() : commandLogHeader;
  fs.mkdirSync(path.dirname(commandLogPath), { recursive: true });
  fs.writeFileSync(commandLogPath, `${currentCommandLog}\n${commandLogRows.join('\n')}\n`);

  updateStatusMarkdown(statusPath, slice, completedAt);
  updateSliceJson(path.join(repoRoot, artifacts.sliceJson), completedAt);

  return {
    completedAt,
    files: Object.values(artifacts),
  };
}

async function runExecuteSlice(repoRoot, options = {}) {
  const canonicalRepoRoot = canonicalizeRepoRoot(repoRoot);
  const role = normalizeRole(options.role || DEFAULT_EXECUTE_ROLE);
  const selectedSlice = await resolveInteractiveSliceInput(canonicalRepoRoot, options);
  const selectedExecutorProfile = await resolveInteractiveExecutorProfile(canonicalRepoRoot, role, options);
  const resolvedOptions = {
    ...options,
    executorProfile: selectedExecutorProfile || options.executorProfile,
    slice: selectedSlice,
  };
  const runtimeProfile = resolveExecutorRuntimeProfile(canonicalRepoRoot, role, resolvedOptions);
  const provider = runtimeProfile.provider;
  const context = options.context || DEFAULT_EXECUTE_CONTEXT;
  const timeoutMs = normalizeTimeout(options.timeout);

  const executorContext = buildExecuteSliceContext({
    repoRoot: canonicalRepoRoot,
    slicePath: resolvedOptions.slice,
    role,
    context,
  });

  const prompt = executorContext.prompt;
  let invocation;

  try {
    invocation = buildProviderInvocation(provider, {
      prompt,
      cwd: canonicalRepoRoot,
      timeoutMs,
      ...runtimeModelExecutionOptions(runtimeProfile, options),
      enforceModelSelection: false,
    });
  } catch (error) {
    throw annotateProviderError(error, 'execute-slice');
  }

  if (options.dryRun) {
    const report = {
      task: 'execute-slice',
      provider,
      role,
      contextPack: executorContext.context.packName,
      slice: executorContext.slice.sliceId,
      invocation,
      briefPath: executorContext.briefPath,
      allowedFiles: executorContext.allowedFiles,
      validationCommands: executorContext.validationCommands,
      commitEnabled: options.commit === true,
      profile: runtimeProfile,
    };
    process.stdout.write(formatExecuteSliceDryRunReport({
      provider,
      role,
      contextPack: executorContext.context.packName,
      slice: executorContext.slice,
      briefPath: executorContext.briefPath,
      invocation,
      validationCommands: executorContext.validationCommands,
      allowedFiles: executorContext.allowedFiles,
      commitEnabled: options.commit === true,
    }));
    return report;
  }

  try {
    assertCorrectSliceWorktree(canonicalRepoRoot, executorContext.slice, options);
  } catch (error) {
    throw appendRecovery(error, executorContext.slice);
  }

  const beforeSnapshot = captureWorktreeSnapshot(canonicalRepoRoot);
  if (beforeSnapshot.files.length > 0 && options.commit === true) {
    throw appendRecovery(new Error(formatError(`ai execute-slice --commit requires a clean worktree before running. Commit or stash first: ${beforeSnapshot.files.join(', ')}`)), executorContext.slice);
  }
  if (beforeSnapshot.files.length > 0 && options.allowDirty !== true) {
    throw appendRecovery(new Error(formatError(`ai execute-slice requires a clean worktree before running. Commit or stash first: ${beforeSnapshot.files.join(', ')}`)), executorContext.slice);
  }

  const ux = createCommandUx(options);
  const showProgress = shouldShowHumanProgress(ux, options);
  writeProgressChecks(
    ux,
    showProgress,
    `Ejecutando slice con ${runtimeProfile.displayName}`,
    ['Leyendo slice', 'Validando worktree', 'Preparando prompt'],
  );

  let result;
  try {
    result = await runProviderWithProgress({
      ux,
      enabled: showProgress,
      run: () => (options.runProviderFn || runProvider)(provider, {
        prompt,
        cwd: canonicalRepoRoot,
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
    if (error.providerResult) {
      result = error.providerResult;
    } else {
      throw appendRecovery(annotateProviderError(error, 'execute-slice'), executorContext.slice);
    }
  }

  if (result.stdout) {
    process.stdout.write(redactSecrets(result.stdout));
  }
  if (result.stderr) {
    process.stderr.write(redactSecrets(result.stderr));
  }

  if (!result.ok) {
    throw appendRecovery(annotateProviderError(result.error || new Error('provider run failed'), 'execute-slice'), executorContext.slice);
  }

  const providerOutput = {
    stdout: redactSecrets(result.stdout || ''),
    stderr: redactSecrets(result.stderr || ''),
  };
  const sanitizedResult = {
    ...result,
    stdout: providerOutput.stdout,
    stderr: providerOutput.stderr,
  };

  const afterSnapshot = captureWorktreeSnapshot(canonicalRepoRoot);
  let scopeResult;
  try {
    scopeResult = validateScopeSnapshot({
      allowedFiles: executorContext.allowedFiles,
      beforeSnapshot,
      afterSnapshot,
      strict: true,
    });
  } catch (error) {
    throw appendRecovery(error, executorContext.slice);
  }
  if (scopeResult.changedFiles.length === 0) {
    const error = new Error(formatError('provider produced no changed files; slice closure was not updated.'));
    error.code = 'NO_CHANGES_TO_CLOSE';
    throw appendRecovery(error, executorContext.slice);
  }

  let validationResults = [];
  try {
    validationResults = await runWithProgress({
      ux,
      enabled: showProgress && executorContext.validationCommands.length > 0,
      message: 'Ejecutando validaciones...',
      successMessage: 'Validaciones completadas',
      failureMessage: 'Fallaron las validaciones',
      run: () => runValidationCommands(
        canonicalRepoRoot,
        executorContext.validationCommands,
        options.runValidationCommandFn,
      ),
    });
  } catch (error) {
    throw appendRecovery(error, executorContext.slice);
  }

  const artifacts = writeExecutionArtifacts(canonicalRepoRoot, executorContext, {
    changedFiles: scopeResult.changedFiles,
    completedAt: new Date().toISOString(),
    providerOutput,
    validationResults,
  });

  const finalSnapshot = captureWorktreeSnapshot(canonicalRepoRoot);
  let finalScopeResult;
  try {
    finalScopeResult = validateScopeSnapshot({
      allowedFiles: uniqueList([...executorContext.allowedFiles, ...artifacts.files]),
      beforeSnapshot,
      afterSnapshot: finalSnapshot,
      strict: true,
    });
  } catch (error) {
    throw appendRecovery(error, executorContext.slice);
  }

  let commitResult = null;
  if (options.commit === true) {
    try {
      commitResult = await runWithProgress({
        ux,
        enabled: showProgress,
        message: 'Creando commit del slice...',
        successMessage: 'Commit del slice creado',
        failureMessage: 'Fallo creando commit del slice',
        run: () => commitSliceChanges(canonicalRepoRoot, executorContext.slice, finalScopeResult.changedFiles, {
          message: options.commitMessage,
        }),
      });
    } catch (error) {
      throw appendRecovery(error, executorContext.slice);
    }
  }

  process.stdout.write(formatExecuteSliceResult({
    slice: executorContext.slice,
    changedFiles: finalScopeResult.changedFiles,
    scopeResult: finalScopeResult,
    validationResults,
    commitResult,
    commitEnabled: options.commit === true,
  }));

  return {
    task: 'execute-slice',
    provider,
    role,
    contextPack: executorContext.context.packName,
    profile: runtimeProfile,
    slice: executorContext.slice.sliceId,
    specSlug: executorContext.slice.specSlug,
    invocation,
    result: sanitizedResult,
    beforeSnapshot,
    afterSnapshot: finalSnapshot,
    scopeResult: finalScopeResult,
    validationResults,
    commitResult,
    artifacts,
  };
}

module.exports = {
  DEFAULT_EXECUTE_CONTEXT,
  DEFAULT_EXECUTE_PROVIDER,
  DEFAULT_EXECUTE_ROLE,
  annotateProviderError,
  appendRecovery,
  buildExecuteSliceContext,
  buildManualExecutorPrompt,
  buildRecoveryGuidance,
  buildSliceCommitMessage,
  canonicalizeRepoRoot,
  commitSliceChanges,
  formatExecuteSliceDryRunReport,
  formatExecuteSliceResult,
  assertCorrectSliceWorktree,
  writeExecutionArtifacts,
  runValidationCommand,
  runValidationCommands,
  normalizeTimeout,
  readTextFile,
  resolveSliceJsonPath,
  runExecuteSlice,
  runPromptSlice,
};
