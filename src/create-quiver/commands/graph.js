const { buildGraph, computeLevels, detectFileConflicts, readAllSlices } = require('../lib/slice-graph');
const { renderTreeGraph, isUnicodeEnabled } = require('../lib/renderers/tree');

const EXCLUDED_STATUSES = new Set(['completed', 'skipped', 'cancelled']);

function toGraphNode(node) {
  return {
    ref: node.ref,
    spec_slug: node.specSlug,
    slice_id: node.sliceId,
    title: node.title || node.sliceId,
    hours: Number.isFinite(Number(node.json?.estimated_hours)) ? Number(node.json.estimated_hours) : 0,
    status: node.status || 'draft',
    files: Array.isArray(node.files) ? node.files : [],
  };
}

function buildConflictPayload(levelIndex, groups) {
  return groups.map((group) => ({
    level: levelIndex,
    files: group.files,
    slices: group.slices,
  }));
}

function collectGraph(repoRoot, options = {}) {
  const graph = buildGraph(readAllSlices(repoRoot));
  computeLevels(graph);
  const pendingNodes = graph.nodes.filter((node) => !EXCLUDED_STATUSES.has(String(node.status || '').toLowerCase()));
  const pendingNodeRefs = new Set(pendingNodes.map((node) => node.ref));
  const pendingEdges = graph.edges.filter((edge) => pendingNodeRefs.has(edge.from) && pendingNodeRefs.has(edge.to));
  const levels = pendingNodes.length > 0 ? computeLevels({ nodes: pendingNodes, edges: pendingEdges, cycles: [] }) : [];
  const levelEntries = levels.map((level, levelIndex) => {
    const conflictGroups = detectFileConflicts(level);

    return {
      index: levelIndex,
      slices: level.map(toGraphNode),
      conflicts: buildConflictPayload(levelIndex, conflictGroups),
    };
  });

  const filteredLevels = typeof options.level === 'number'
    ? levelEntries.filter((entry) => entry.index === options.level)
    : levelEntries;

  return {
    levels: filteredLevels.map((entry) => entry.slices),
    conflicts: filteredLevels.flatMap((entry) => entry.conflicts),
  };
}

function formatHumanGraph(report, options = {}) {
  return renderTreeGraph(report, {
    showConflicts: options.showConflicts === true,
    unicode: options.unicode === true || isUnicodeEnabled(options),
  });
}

function runGraph(repoRoot, options = {}) {
  if (options.format && options.format !== 'tree') {
    throw new Error(`create-quiver: unsupported graph format: ${options.format}`);
  }

  const report = collectGraph(repoRoot, options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return report;
  }

  process.stdout.write(formatHumanGraph(report, options));
  return report;
}

module.exports = {
  collectGraph,
  formatHumanGraph,
  runGraph,
};
