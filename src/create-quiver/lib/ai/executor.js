const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

const { buildContextPackMetadata, normalizeRole } = require('./context-packs');
const { buildProviderInvocation, runProvider } = require('./providers');
const { resolveProfileProvider } = require('../agent-profiles');
const { runGit } = require('../git');
const { captureWorktreeSnapshot, validateScopeSnapshot } = require('../scope');
const { resolveSliceContext } = require('../slice');

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
  const allowedFiles = Array.isArray(slice.files) ? slice.files.map((file) => String(file)) : [];
  const acceptance = Array.isArray(slice.acceptance) ? slice.acceptance.map((item) => String(item)) : [];
  const validationCommands = Array.isArray(slice.tests) ? slice.tests.map((item) => String(item)) : [];
  const mustItems = Array.isArray(slice.json.must) ? slice.json.must.map((item) => String(item)) : [];
  const excludedItems = Array.isArray(slice.json.not_included) ? slice.json.not_included.map((item) => String(item)) : [];

  const sections = [
    pack.prompt,
    'Task: execute the slice directly in the repository using only the handoff below.',
    `Slice: ${slice.sliceId}`,
    `Spec: ${slice.specSlug}`,
    `Slice file: ${relativeSlicePath}`,
    `Execution brief: ${relativeBriefPath}`,
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
    prompt: sections.join('\n\n'),
    slice,
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
    'Allowed files:',
    ...formatList(allowedFiles),
    'Validation commands:',
    ...formatList(validationCommands),
  ];

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
      command,
      ok: true,
      stdout,
      stderr: '',
      exitCode: 0,
    };
  } catch (error) {
    return {
      command,
      ok: false,
      stdout: error.stdout ? String(error.stdout) : '',
      stderr: error.stderr ? String(error.stderr) : '',
      exitCode: Number.isInteger(error.status) ? error.status : 1,
      error,
    };
  }
}

function runValidationCommands(repoRoot, commands, runner = runValidationCommand) {
  const results = [];
  for (const command of commands) {
    const result = runner(command, repoRoot);
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

async function runExecuteSlice(repoRoot, options = {}) {
  const role = normalizeRole(options.role || DEFAULT_EXECUTE_ROLE);
  const provider = options.providerExplicit === true || (options.provider && options.providerExplicit !== false)
    ? String(options.provider || DEFAULT_EXECUTE_PROVIDER).trim().toLowerCase()
    : resolveProfileProvider(repoRoot, role, DEFAULT_EXECUTE_PROVIDER);
  const context = options.context || DEFAULT_EXECUTE_CONTEXT;
  const timeoutMs = normalizeTimeout(options.timeout);

  if (!options.slice) {
    throw new Error(formatError('missing required --slice path for ai execute-slice'));
  }

  const executorContext = buildExecuteSliceContext({
    repoRoot,
    slicePath: options.slice,
    role,
    context,
  });

  const prompt = executorContext.prompt;
  let invocation;

  try {
    invocation = buildProviderInvocation(provider, {
      prompt,
      cwd: repoRoot,
      timeoutMs,
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

  const beforeSnapshot = captureWorktreeSnapshot(repoRoot);
  if (beforeSnapshot.files.length > 0 && options.allowDirty !== true) {
    throw appendRecovery(new Error(formatError(`ai execute-slice requires a clean worktree before running. Commit or stash first: ${beforeSnapshot.files.join(', ')}`)), executorContext.slice);
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
    throw appendRecovery(annotateProviderError(error, 'execute-slice'), executorContext.slice);
  }

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (!result.ok) {
    throw appendRecovery(annotateProviderError(result.error || new Error('provider run failed'), 'execute-slice'), executorContext.slice);
  }

  const afterSnapshot = captureWorktreeSnapshot(repoRoot);
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

  let validationResults = [];
  try {
    validationResults = runValidationCommands(
      repoRoot,
      executorContext.validationCommands,
      options.runValidationCommandFn,
    );
  } catch (error) {
    throw appendRecovery(error, executorContext.slice);
  }

  const finalSnapshot = captureWorktreeSnapshot(repoRoot);
  let finalScopeResult;
  try {
    finalScopeResult = validateScopeSnapshot({
      allowedFiles: executorContext.allowedFiles,
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
      commitResult = commitSliceChanges(repoRoot, executorContext.slice, finalScopeResult.changedFiles, {
        message: options.commitMessage,
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
    slice: executorContext.slice.sliceId,
    specSlug: executorContext.slice.specSlug,
    invocation,
    result,
    beforeSnapshot,
    afterSnapshot: finalSnapshot,
    scopeResult: finalScopeResult,
    validationResults,
    commitResult,
  };
}

module.exports = {
  DEFAULT_EXECUTE_CONTEXT,
  DEFAULT_EXECUTE_PROVIDER,
  DEFAULT_EXECUTE_ROLE,
  annotateProviderError,
  appendRecovery,
  buildExecuteSliceContext,
  buildRecoveryGuidance,
  buildSliceCommitMessage,
  canonicalizeRepoRoot,
  commitSliceChanges,
  formatExecuteSliceDryRunReport,
  formatExecuteSliceResult,
  runValidationCommand,
  runValidationCommands,
  normalizeTimeout,
  readTextFile,
  resolveSliceJsonPath,
  runExecuteSlice,
};
