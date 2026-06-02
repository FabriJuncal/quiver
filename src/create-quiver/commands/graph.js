const { filterSlicesForExecution, resolveProjectState } = require('../lib/project-state-resolver');
const { computeLevels, detectFileConflicts } = require('../lib/slice-graph');
const { renderDotGraph } = require('../lib/renderers/dot');
const { renderMermaidGraph } = require('../lib/renderers/mermaid');
const { renderTreeGraph, isUnicodeEnabled } = require('../lib/renderers/tree');
const { createTranslator } = require('../lib/i18n/catalog');

function toGraphNode(node) {
  return {
    ref: node.ref,
    spec_slug: node.specSlug,
    slice_id: node.sliceId,
    title: node.title || node.sliceId,
    hours: Number.isFinite(Number(node.json?.estimated_hours)) ? Number(node.json.estimated_hours) : 0,
    status: node.status || 'draft',
    canonical_status: node.canonical_status || 'planned',
    files: Array.isArray(node.files) ? node.files : [],
    depends_on: Array.isArray(node.depends_on) ? node.depends_on : [],
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
  const specSlug = options.specSlug ? String(options.specSlug).trim() : '';
  const state = resolveProjectState(repoRoot, { specSlug });
  const graph = state.graph;
  if (!specSlug) {
    computeLevels(graph);
  }
  const includeCompleted = options.includeCompleted === true;
  const executionRefs = new Set(filterSlicesForExecution(graph.nodes, { includeCompleted }).map((node) => node.ref));
  const pendingNodes = graph.nodes.filter((node) => {
    if (!executionRefs.has(node.ref)) {
      return false;
    }
    if (specSlug && node.specSlug !== specSlug) {
      return false;
    }
    return true;
  });
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
    include_completed: includeCompleted,
  };
}

function formatHumanGraph(report, options = {}) {
  const translator = createTranslator(options.language);
  const format = options.format || 'tree';
  if (format === 'tree' && typeof options.level === 'number' && (!Array.isArray(report.levels) || report.levels.length === 0)) {
    return `${translator.t('graph.empty.level', { level: options.level })}\n`;
  }
  const sharedOptions = {
    showConflicts: options.showConflicts === true,
    language: options.language,
    unicode: options.unicode === true || isUnicodeEnabled(options),
  };

  if (format === 'tree') {
    return renderTreeGraph(report, sharedOptions);
  }

  if (format === 'mermaid') {
    return renderMermaidGraph(report, sharedOptions);
  }

  if (format === 'dot') {
    return renderDotGraph(report, sharedOptions);
  }

  throw new Error(`create-quiver: ${translator.t('graph.error.unsupported_format', { format })}`);
}

function runGraph(repoRoot, options = {}) {
  const translator = createTranslator(options.language);
  if (options.format && !['tree', 'mermaid', 'dot'].includes(options.format)) {
    throw new Error(`create-quiver: ${translator.t('graph.error.unsupported_format', { format: options.format })}`);
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
