const fs = require('node:fs');
const path = require('node:path');

const { buildContextPackMetadata, normalizeRole } = require('./context-packs');
const { buildProviderInvocation, runProvider } = require('./providers');
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
    '- Do not commit automatically.',
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

function formatExecuteSliceDryRunReport({ provider, role, contextPack, slice, briefPath, invocation, validationCommands, allowedFiles }) {
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
    'Allowed files:',
    ...formatList(allowedFiles),
    'Validation commands:',
    ...formatList(validationCommands),
  ];

  return `${lines.join('\n')}\n`;
}

function formatExecuteSliceResult({ slice, changedFiles, scopeResult }) {
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

async function runExecuteSlice(repoRoot, options = {}) {
  const provider = String(options.provider || DEFAULT_EXECUTE_PROVIDER).trim().toLowerCase();
  const role = normalizeRole(options.role || DEFAULT_EXECUTE_ROLE);
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
    }));
    return report;
  }

  const beforeSnapshot = captureWorktreeSnapshot(repoRoot);
  if (beforeSnapshot.files.length > 0 && options.allowDirty !== true) {
    throw new Error(formatError(`ai execute-slice requires a clean worktree before running. Commit or stash first: ${beforeSnapshot.files.join(', ')}`));
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
    throw annotateProviderError(error, 'execute-slice');
  }

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (!result.ok) {
    throw annotateProviderError(result.error || new Error('provider run failed'), 'execute-slice');
  }

  const afterSnapshot = captureWorktreeSnapshot(repoRoot);
  const scopeResult = validateScopeSnapshot({
    allowedFiles: executorContext.allowedFiles,
    beforeSnapshot,
    afterSnapshot,
    strict: true,
  });

  process.stdout.write(formatExecuteSliceResult({
    slice: executorContext.slice,
    changedFiles: scopeResult.changedFiles,
    scopeResult,
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
    afterSnapshot,
    scopeResult,
  };
}

module.exports = {
  DEFAULT_EXECUTE_CONTEXT,
  DEFAULT_EXECUTE_PROVIDER,
  DEFAULT_EXECUTE_ROLE,
  annotateProviderError,
  buildExecuteSliceContext,
  canonicalizeRepoRoot,
  formatExecuteSliceDryRunReport,
  formatExecuteSliceResult,
  normalizeTimeout,
  readTextFile,
  resolveSliceJsonPath,
  runExecuteSlice,
};
