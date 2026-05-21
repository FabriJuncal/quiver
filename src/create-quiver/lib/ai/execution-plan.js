const path = require('node:path');

const { resolveProfileProvider } = require('../agent-profiles');
const { buildGraph, computeLevels, detectFileConflicts, isFoundationSliceId, readAllSlices, topoSort, SliceGraphError } = require('../slice-graph');
const { runExecuteSlice } = require('./executor');

const EXCLUDED_STATUSES = new Set(['completed', 'skipped', 'cancelled']);

function formatError(message) {
  return `create-quiver: ${message}`;
}

function toRelativePath(repoRoot, filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join('/');
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
    lines.push(`Level ${level.index} (${modeLabel})`);
    lines.push(`Worktree strategy: ${level.worktree_strategy.mode}`);
    if (level.fallback_reason) {
      lines.push(`Fallback: ${level.fallback_reason}`);
    }

    for (const slice of level.slices) {
      lines.push(`- ${slice.ref} [${slice.status}]`);
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
  const lines = [
    'AI execute-plan dry-run',
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

  for (const level of report.ready_levels) {
    lines.push(`Wave ${level.index}: ${level.parallel_ready ? 'parallel-ready' : 'sequential'}`);
    if (level.fallback_reason) {
      lines.push(`Fallback: ${level.fallback_reason}`);
    }
    for (const group of level.execution_groups) {
      lines.push(`Group: ${group.mode}`);
      for (const ref of group.slice_refs) {
        const slice = level.slices.find((item) => item.ref === ref);
        lines.push(`- ${commandForSlice(slice)}`);
      }
    }
  }

  return `${lines.join('\n')}\n`;
}

async function runExecutePlan(repoRoot, options = {}) {
  const report = collectExecutionPlan(repoRoot, options);
  const execute = options.execute === true;
  const provider = options.providerExplicit === true || (options.provider && options.providerExplicit !== false)
    ? options.provider
    : resolveProfileProvider(repoRoot, options.role || 'executor', 'codex');
  const resolvedOptions = {
    ...options,
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

  if (options.commit !== true) {
    throw new Error(formatError('ai execute-plan --execute requires --commit so each successful slice creates one commit.'));
  }

  const runSlice = options.runExecuteSliceFn || runExecuteSlice;
  const results = [];

  for (const level of report.ready_levels) {
    for (const group of level.execution_groups) {
      for (const ref of group.slice_refs) {
        const slice = level.slices.find((item) => item.ref === ref);
        try {
          const result = await runSlice(repoRoot, {
            allowDirty: options.allowDirty === true,
            commit: true,
            context: options.context,
            dryRun: false,
            provider,
            providerExplicit: options.providerExplicit,
            role: options.role,
            slice: slice.slice_path,
            timeout: options.timeout,
          });
          results.push({ level: level.index, ref, ok: true, result });
        } catch (error) {
          const wrapped = new Error(formatError(`ai execute-plan stopped at wave ${level.index} slice ${ref}: ${error.message || error}`));
          wrapped.cause = error;
          wrapped.code = error.code || 'AI_EXECUTE_PLAN_FAILED';
          wrapped.details = { level: level.index, ref, results };
          throw wrapped;
        }
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
  runExecutePlan,
  runExecutionPlan,
};
