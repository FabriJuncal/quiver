const fs = require('node:fs');
const path = require('node:path');

const { resolveProfileProvider } = require('../agent-profiles');
const { branchDelete, runGit, statusPorcelain, worktreeAdd, worktreePrune, worktreeRemove } = require('../git');
const { safeBranchName, worktreesRootForRepo } = require('../slice');
const { buildGraph, computeLevels, detectFileConflicts, isFoundationSliceId, readAllSlices, topoSort, SliceGraphError } = require('../slice-graph');
const { runExecuteSlice } = require('./executor');

const EXCLUDED_STATUSES = new Set(['completed', 'skipped', 'cancelled']);
const EXECUTION_MODES = new Set(['auto', 'manual', 'delegated']);

function formatError(message) {
  return `create-quiver: ${message}`;
}

function toRelativePath(repoRoot, filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join('/');
}

function normalizeExecutionMode(mode) {
  const value = String(mode || 'auto').trim().toLowerCase() || 'auto';
  if (!EXECUTION_MODES.has(value)) {
    throw new Error(formatError(`unsupported execution mode: ${mode}. Use auto, manual, or delegated.`));
  }
  return value;
}

function summarizeSlice(node, repoRoot) {
  return {
    ref: node.ref,
    spec_slug: node.specSlug,
    slice_id: node.sliceId,
    slice_path: node.slicePath ? toRelativePath(repoRoot, node.slicePath) : '',
    title: node.title || node.sliceId,
    status: node.status || 'draft',
    files: Array.isArray(node.files) ? node.files : [],
    expected_read_paths: Array.isArray(node.expected_read_paths) ? node.expected_read_paths : [],
    allowed_write_paths: Array.isArray(node.allowed_write_paths) ? node.allowed_write_paths : [],
    validation_hints: Array.isArray(node.validation_hints) ? node.validation_hints : [],
    depends_on: Array.isArray(node.depends_on) ? node.depends_on : [],
    parallel_safe: node.parallel_safe || null,
    parallel_safe_reason: node.parallel_safe_reason || null,
    branch_name: node.json?.git?.branch_name || '',
  };
}

function buildPendingGraph(graph, options = {}) {
  const specSlug = options.specSlug ? String(options.specSlug).trim() : '';
  const pendingNodes = graph.nodes.filter((node) => {
    if (specSlug && node.specSlug !== specSlug) {
      return false;
    }
    return !EXCLUDED_STATUSES.has(String(node.status || '').toLowerCase());
  });
  const pendingRefs = new Set(pendingNodes.map((node) => node.ref));
  const nodesBySpec = new Map();
  const foundationRefsBySpec = new Map();

  for (const node of pendingNodes) {
    if (!nodesBySpec.has(node.specSlug)) {
      nodesBySpec.set(node.specSlug, []);
    }
    nodesBySpec.get(node.specSlug).push(node);

    if (isFoundationSliceId(node.sliceId)) {
      if (!foundationRefsBySpec.has(node.specSlug)) {
        foundationRefsBySpec.set(node.specSlug, []);
      }
      foundationRefsBySpec.get(node.specSlug).push(node.ref);
    }
  }

  const edgeKey = (from, to) => `${from}::${to}`;
  const edges = [];
  const seenEdges = new Set();

  for (const edge of graph.edges) {
    if (!pendingRefs.has(edge.from) || !pendingRefs.has(edge.to)) {
      continue;
    }
    const key = edgeKey(edge.from, edge.to);
    if (seenEdges.has(key)) {
      continue;
    }
    seenEdges.add(key);
    edges.push({ from: edge.from, to: edge.to });
  }

  for (const [specSlug, specNodes] of nodesBySpec.entries()) {
    const foundationRefs = foundationRefsBySpec.get(specSlug) || [];
    if (foundationRefs.length === 0) {
      continue;
    }

    for (const node of specNodes) {
      if (isFoundationSliceId(node.sliceId)) {
        continue;
      }

      for (const foundationRef of foundationRefs) {
        const key = edgeKey(foundationRef, node.ref);
        if (seenEdges.has(key)) {
          continue;
        }
        seenEdges.add(key);
        edges.push({ from: foundationRef, to: node.ref, implicit: true, reason: 'slice-00 foundation barrier' });
      }
    }
  }

  return {
    nodes: pendingNodes,
    edges,
    foundationRefs: Array.from(foundationRefsBySpec.values()).flat().sort((left, right) => String(left).localeCompare(String(right))),
  };
}

function buildFallbackReason({ conflicts, unknownScopeSlices }) {
  if (unknownScopeSlices.length > 0) {
    return `Unknown file scope: ${unknownScopeSlices.join(', ')}`;
  }
  if (conflicts.length > 0) {
    return `File conflicts: ${conflicts.map((conflict) => conflict.slices.join(', ')).join('; ')}`;
  }
  return '';
}

function buildLevelStrategy(levelNodes, { parallelReady, conflicts, unknownScopeSlices }) {
  if (parallelReady) {
    return {
      mode: 'temporary-per-slice',
      temporary_worktrees: true,
      reason: 'Run each ready slice in its own temporary worktree, then integrate the commits in stable level order.',
    };
  }

  if (levelNodes.length > 1) {
    return {
      mode: 'sequential-fallback',
      temporary_worktrees: false,
      reason: buildFallbackReason({ conflicts, unknownScopeSlices }) || 'Run sequentially because this level is not parallel-ready.',
    };
  }

  return {
    mode: 'shared-worktree',
    temporary_worktrees: false,
    reason: 'A single ready slice can reuse the active worktree.',
  };
}

function buildExecutionGroups(slices, parallelReady, fallbackReason) {
  if (parallelReady) {
    return [{
      mode: 'parallel',
      reason: 'No file-scope conflicts detected.',
      slice_refs: slices.map((slice) => slice.ref),
    }];
  }

  return slices.map((slice) => ({
    mode: 'sequential',
    reason: fallbackReason || 'Sequential execution is the safe default.',
    slice_refs: [slice.ref],
  }));
}

function summarizeLevel(levelNodes, index, repoRoot) {
  const slices = levelNodes.map((node) => summarizeSlice(node, repoRoot));
  const sliceRefs = slices.map((slice) => slice.ref);
  const conflicts = detectFileConflicts(levelNodes).map((group) => ({
    files: group.files,
    slices: group.slices,
  }));
  const unknownScopeSlices = slices
    .filter((slice) => !Array.isArray(slice.files) || slice.files.length === 0)
    .map((slice) => slice.ref);
  const fallbackReason = buildFallbackReason({ conflicts, unknownScopeSlices });
  const parallelReady = levelNodes.length > 1 && conflicts.length === 0 && unknownScopeSlices.length === 0;

  return {
    index,
    slice_refs: sliceRefs,
    parallel_ready: parallelReady,
    requires_temporary_worktrees: parallelReady,
    worktree_strategy: buildLevelStrategy(levelNodes, { parallelReady, conflicts, unknownScopeSlices }),
    conflicts,
    unknown_scope_slices: unknownScopeSlices,
    fallback_reason: fallbackReason || null,
    execution_groups: buildExecutionGroups(slices, parallelReady, fallbackReason),
    slices,
  };
}

function collectExecutionPlan(repoRoot, options = {}) {
  try {
    const allSlices = readAllSlices(repoRoot);
    const graph = buildGraph(allSlices);
    topoSort(graph);

    const specSlug = options.specSlug ? String(options.specSlug).trim() : '';
    const pendingGraph = buildPendingGraph(graph, { specSlug });
    if (pendingGraph.nodes.length === 0) {
      return {
        root: repoRoot,
        summary: {
          total_slices: 0,
          ready_levels: 0,
          parallel_levels: 0,
          foundation_refs: [],
        },
        ready_levels: [],
        levels: [],
        execution_order: [],
        integration_order: [],
        sequential_order: [],
      };
    }

    const readyLevels = computeLevels(pendingGraph);
    const readyLevelReports = readyLevels.map((levelNodes, index) => summarizeLevel(levelNodes, index, repoRoot));
    const executionOrder = topoSort(pendingGraph).map((node) => node.ref);
    const integrationOrder = readyLevelReports.flatMap((level) => level.slice_refs);
    const foundationRefs = pendingGraph.foundationRefs;

    return {
      root: repoRoot,
      summary: {
        total_slices: pendingGraph.nodes.length,
        ready_levels: readyLevelReports.length,
        parallel_levels: readyLevelReports.filter((level) => level.parallel_ready).length,
        foundation_refs: foundationRefs,
      },
      ready_levels: readyLevelReports,
      levels: readyLevelReports,
      execution_order: executionOrder,
      integration_order: integrationOrder,
      sequential_order: executionOrder,
      options: {
        specSlug,
      },
    };
  } catch (error) {
    if (error instanceof SliceGraphError) {
      throw error;
    }
    throw new Error(formatError(`unable to build execution plan: ${error.message || error}`));
  }
}

function formatHumanExecutionPlan(report) {
  const lines = [
    'Execution plan',
    `Total slices: ${report.summary.total_slices}`,
    `Ready levels: ${report.summary.ready_levels}`,
    `Parallel levels: ${report.summary.parallel_levels}`,
    `Foundation refs: ${report.summary.foundation_refs.length > 0 ? report.summary.foundation_refs.join(', ') : '-'}`,
    '',
    'Sequential order',
  ];

  if (report.sequential_order.length === 0) {
    lines.push('- none');
  } else {
    for (const [index, ref] of report.sequential_order.entries()) {
      lines.push(`${index + 1}. ${ref}`);
    }
  }

  lines.push('', 'Ready levels');

  if (report.ready_levels.length === 0) {
    lines.push('- none');
    return `${lines.join('\n')}\n`;
  }

  for (const level of report.ready_levels) {
    const modeLabel = level.parallel_ready ? 'parallel-ready' : 'sequential';
    lines.push(`Wave ${level.index} (${modeLabel})`);
    lines.push(`Worktree strategy: ${level.worktree_strategy.mode}`);
    if (level.fallback_reason) {
      lines.push(`Fallback: ${level.fallback_reason}`);
    }

    for (const slice of level.slices) {
      lines.push(`- ${slice.ref} [${slice.status}]`);
      lines.push(`  parallel_safe: ${slice.parallel_safe || 'unspecified'}${slice.parallel_safe_reason ? ` (${slice.parallel_safe_reason})` : ''}`);
    }

    if (level.conflicts.length > 0) {
      lines.push('Conflicts:');
      for (const conflict of level.conflicts) {
        lines.push(`- ${conflict.slices.join(', ')} :: ${conflict.files.join(', ')}`);
      }
    }

    if (level.unknown_scope_slices.length > 0) {
      lines.push('Unknown scope:');
      for (const ref of level.unknown_scope_slices) {
        lines.push(`- ${ref}`);
      }
    }

    lines.push('');
  }

  lines.push('Integration order');
  for (const [index, ref] of report.integration_order.entries()) {
    lines.push(`${index + 1}. ${ref}`);
  }

  return `${lines.join('\n')}\n`;
}

function formatExecutePlanDryRun(report, options = {}) {
  const provider = options.resolvedProvider || options.provider || 'codex';
  const commitEnabled = options.commit === true;
  const executionMode = normalizeExecutionMode(options.mode || options.executionMode);
  const lines = [
    'AI execute-plan dry-run',
    `Execution mode: ${executionMode}`,
    `Provider: ${provider}`,
    `Commit after each slice: ${commitEnabled ? 'enabled' : 'disabled'}`,
    `Total slices: ${report.summary.total_slices}`,
    '',
    'Waves',
  ];

  const commandForSlice = (slice) => {
    const parts = [
      'npx create-quiver ai execute-slice',
      `--slice ${JSON.stringify(slice.slice_path)}`,
      `--provider ${provider}`,
    ];
    if (commitEnabled) {
      parts.push('--commit');
    }
    return parts.join(' ');
  };
  const promptCommandForSlice = (slice) => [
    'npx create-quiver ai prompt-slice',
    `--slice ${JSON.stringify(slice.slice_path)}`,
    '--dry-run',
  ].join(' ');

  for (const level of report.ready_levels) {
    lines.push(`Wave ${level.index}: ${level.parallel_ready ? 'parallel-ready' : 'sequential'}`);
    lines.push(`Workspace strategy: ${level.worktree_strategy.mode}`);
    if (level.fallback_reason) {
      lines.push(`Fallback: ${level.fallback_reason}`);
    }
    for (const group of level.execution_groups) {
      lines.push(`Group: ${group.mode}`);
      for (const ref of group.slice_refs) {
        const slice = level.slices.find((item) => item.ref === ref);
        lines.push(`- Prompt: ${promptCommandForSlice(slice)}`);
        if (executionMode !== 'manual') {
          lines.push(`  Execute: ${commandForSlice(slice)}`);
        }
      }
    }
  }

  return `${lines.join('\n')}\n`;
}

function buildRecoveryGuidance(ref, workspaces = []) {
  const lines = [
    'Recovery:',
    `- Retry slice: npx create-quiver ai prompt-slice --slice <slice.json> --dry-run, then rerun only ${ref}.`,
    '- Abort: inspect the active checkout and temporary worktrees before reverting, stashing, or removing anything.',
  ];

  if (workspaces.length > 0) {
    lines.push('- Temporary worktrees left for inspection:');
    for (const workspace of workspaces) {
      lines.push(`  - ${workspace.worktreePath}`);
    }
  }

  return lines.join('\n');
}

function appendRecovery(error, ref, workspaces = []) {
  const message = error && error.message ? error.message : String(error);
  if (message.includes('Recovery:')) {
    return error;
  }

  const wrapped = new Error(`${message}\n\n${buildRecoveryGuidance(ref, workspaces)}`);
  wrapped.cause = error;
  wrapped.code = error && error.code ? error.code : undefined;
  wrapped.details = error && error.details ? error.details : undefined;
  return wrapped;
}

function ensureCleanIntegrationWorktree(repoRoot) {
  const status = statusPorcelain(repoRoot);
  if (status !== '') {
    throw new Error(formatError(`delegated parallel execution requires a clean active worktree before integration. Dirty files: ${status.split('\n').join(', ')}`));
  }
}

function buildDelegatedRunId() {
  return new Date().toISOString().replace(/[^0-9A-Za-z]/g, '');
}

function buildDelegatedWorkspace(repoRoot, slice, runId, index, options = {}) {
  const safeRef = safeBranchName(slice.ref).slice(0, 80);
  const branchName = `quiver-exec-${runId}-${index + 1}-${safeRef}`;
  const worktreesRoot = options.worktreesRoot || path.join(worktreesRootForRepo(repoRoot, branchName), 'execute-plan');
  const worktreePath = path.join(worktreesRoot, runId, safeRef);

  return {
    branchName,
    ref: slice.ref,
    slice,
    worktreePath,
  };
}

function createDelegatedWorkspace(repoRoot, workspace, baseRef) {
  if (fs.existsSync(workspace.worktreePath)) {
    throw new Error(formatError(`temporary worktree path already exists: ${workspace.worktreePath}`));
  }

  fs.mkdirSync(path.dirname(workspace.worktreePath), { recursive: true });
  worktreeAdd(repoRoot, workspace.worktreePath, baseRef, { branch: workspace.branchName });
}

function cleanupDelegatedWorkspace(repoRoot, workspace) {
  try {
    worktreeRemove(repoRoot, workspace.worktreePath);
  } catch {
    // Keep cleanup best-effort after successful integration.
  }
  try {
    branchDelete(repoRoot, workspace.branchName, true);
  } catch {
    // The committed changes were already integrated; a leftover temp branch is non-blocking.
  }
}

async function runSequentialGroup(repoRoot, level, group, options = {}) {
  const runSlice = options.runExecuteSliceFn || runExecuteSlice;
  const results = [];

  for (const ref of group.slice_refs) {
    const slice = level.slices.find((item) => item.ref === ref);
    try {
      const result = await runSlice(repoRoot, {
        allowDirty: options.allowDirty === true,
        commit: true,
        context: options.context,
        dryRun: false,
        provider: options.provider,
        providerExplicit: options.providerExplicit,
        role: options.role,
        slice: slice.slice_path,
        timeout: options.timeout,
      });
      results.push({
        level: level.index,
        mode: 'sequential',
        ref,
        ok: true,
        result,
        workspace: repoRoot,
      });
    } catch (error) {
      throw appendRecovery(error, ref);
    }
  }

  return results;
}

async function runParallelGroupInWorktrees(repoRoot, level, group, options = {}) {
  ensureCleanIntegrationWorktree(repoRoot);

  const runSlice = options.runExecuteSliceFn || runExecuteSlice;
  const baseRef = runGit(['rev-parse', 'HEAD'], repoRoot);
  const runId = options.runId || buildDelegatedRunId();
  const slices = group.slice_refs.map((ref) => level.slices.find((item) => item.ref === ref));
  const workspaces = slices.map((slice, index) => buildDelegatedWorkspace(repoRoot, slice, runId, index, options));

  let runResults;
  try {
    worktreePrune(repoRoot);
    for (const workspace of workspaces) {
      createDelegatedWorkspace(repoRoot, workspace, baseRef);
    }

    runResults = await Promise.all(workspaces.map(async (workspace) => {
      const result = await runSlice(workspace.worktreePath, {
        allowDirty: false,
        commit: true,
        context: options.context,
        dryRun: false,
        provider: options.provider,
        providerExplicit: options.providerExplicit,
        role: options.role,
        slice: workspace.slice.slice_path,
        timeout: options.timeout,
      });
      const commit = runGit(['rev-parse', 'HEAD'], workspace.worktreePath);
      if (commit === baseRef) {
        throw new Error(formatError(`delegated slice ${workspace.ref} finished without creating a slice commit.`));
      }
      return {
        commit,
        level: level.index,
        mode: 'parallel-worktree',
        ok: true,
        ref: workspace.ref,
        result,
        workspace,
      };
    }));

    ensureCleanIntegrationWorktree(repoRoot);
    for (const item of runResults) {
      runGit(['cherry-pick', item.commit], repoRoot);
    }

    for (const workspace of workspaces) {
      cleanupDelegatedWorkspace(repoRoot, workspace);
    }
  } catch (error) {
    throw appendRecovery(error, group.slice_refs.join(', '), workspaces);
  }

  return runResults.map((item) => ({
    level: item.level,
    mode: item.mode,
    ref: item.ref,
    ok: item.ok,
    result: item.result,
    workspace: item.workspace.worktreePath,
    integratedCommit: item.commit,
  }));
}

async function runExecutePlan(repoRoot, options = {}) {
  const report = collectExecutionPlan(repoRoot, options);
  const execute = options.execute === true;
  const executionMode = normalizeExecutionMode(options.mode || options.executionMode);
  const provider = options.providerExplicit === true || (options.provider && options.providerExplicit !== false)
    ? options.provider
    : resolveProfileProvider(repoRoot, options.role || 'executor', 'codex');
  const resolvedOptions = {
    ...options,
    mode: executionMode,
    provider,
    resolvedProvider: provider,
  };

  if (options.json && !execute) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return { task: 'execute-plan', dryRun: true, report };
  }

  if (!execute || options.dryRun === true) {
    process.stdout.write(formatExecutePlanDryRun(report, resolvedOptions));
    return { task: 'execute-plan', dryRun: true, report };
  }

  if (executionMode === 'manual') {
    throw new Error(formatError('ai execute-plan --execute does not support --mode manual. Use the printed prompt-slice commands, or choose --mode delegated.'));
  }

  if (options.commit !== true) {
    throw new Error(formatError('ai execute-plan --execute requires --commit so each successful slice creates one commit.'));
  }

  const results = [];

  for (const level of report.ready_levels) {
    for (const group of level.execution_groups) {
      try {
        const groupResults = executionMode === 'delegated' && group.mode === 'parallel' && group.slice_refs.length > 1
          ? await runParallelGroupInWorktrees(repoRoot, level, group, resolvedOptions)
          : await runSequentialGroup(repoRoot, level, group, resolvedOptions);
        results.push(...groupResults);
      } catch (error) {
        const wrapped = new Error(formatError(`ai execute-plan stopped at wave ${level.index} group ${group.slice_refs.join(', ')}: ${error.message || error}`));
        wrapped.cause = error;
        wrapped.code = error.code || 'AI_EXECUTE_PLAN_FAILED';
        wrapped.details = { level: level.index, group, results };
        throw wrapped;
      }
    }
  }

  process.stdout.write(`AI execute-plan completed\nSlices executed: ${results.length}\n`);
  return { task: 'execute-plan', dryRun: false, report, results };
}

function runExecutionPlan(repoRoot, options = {}) {
  const report = collectExecutionPlan(repoRoot, options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return report;
  }

  process.stdout.write(formatHumanExecutionPlan(report, options));
  return report;
}

module.exports = {
  collectExecutionPlan,
  formatExecutePlanDryRun,
  formatHumanExecutionPlan,
  normalizeExecutionMode,
  runExecutePlan,
  runExecutionPlan,
};
