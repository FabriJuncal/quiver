const { buildGraph, computeLevels, detectFileConflicts, isFoundationSliceId, readAllSlices, topoSort, SliceGraphError } = require('../slice-graph');

const EXCLUDED_STATUSES = new Set(['completed', 'skipped', 'cancelled']);

function formatError(message) {
  return `create-quiver: ${message}`;
}

function summarizeSlice(node) {
  return {
    ref: node.ref,
    spec_slug: node.specSlug,
    slice_id: node.sliceId,
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

function buildLevelStrategy(levelNodes) {
  if (levelNodes.length > 1) {
    return {
      mode: 'temporary-per-slice',
      temporary_worktrees: true,
      reason: 'Run each ready slice in its own temporary worktree, then integrate the commits in stable level order.',
    };
  }

  return {
    mode: 'shared-worktree',
    temporary_worktrees: false,
    reason: 'A single ready slice can reuse the active worktree.',
  };
}

function summarizeLevel(levelNodes, index) {
  const slices = levelNodes.map(summarizeSlice);
  const sliceRefs = slices.map((slice) => slice.ref);
  const conflicts = detectFileConflicts(levelNodes).map((group) => ({
    files: group.files,
    slices: group.slices,
  }));

  return {
    index,
    slice_refs: sliceRefs,
    parallel_ready: levelNodes.length > 1,
    requires_temporary_worktrees: levelNodes.length > 1,
    worktree_strategy: buildLevelStrategy(levelNodes),
    conflicts,
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
    const readyLevelReports = readyLevels.map((levelNodes, index) => summarizeLevel(levelNodes, index));
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
    const modeLabel = level.parallel_ready ? 'parallel' : 'sequential';
    lines.push(`Level ${level.index} (${modeLabel})`);
    lines.push(`Worktree strategy: ${level.worktree_strategy.mode}`);

    for (const slice of level.slices) {
      lines.push(`- ${slice.ref} [${slice.status}]`);
    }

    if (level.conflicts.length > 0) {
      lines.push('Conflicts:');
      for (const conflict of level.conflicts) {
        lines.push(`- ${conflict.slices.join(', ')} :: ${conflict.files.join(', ')}`);
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
  formatHumanExecutionPlan,
  runExecutionPlan,
};
