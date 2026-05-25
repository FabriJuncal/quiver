const path = require('path');

const {
  SliceGraphError,
  buildGraph,
  computeLevels,
  detectFileConflicts,
  inferDependencies,
  readAllSlices,
  readSlicesForSpec,
  topoSort,
} = require('./slice-graph');
const {
  CANONICAL_STATUSES,
  isBlockedStatus,
  isCompletedStatus,
  normalizeStatus,
} = require('./statuses');

const DEFAULT_SLICE_STATUS = 'planned';
const DEFAULT_SPEC_STATUS = 'planned';
const DEFAULT_RUN_STATUS = 'draft';
const DEFAULT_AGENT_STATUS = 'idle';

const CLOSED_SLICE_STATUSES = new Set(['completed', 'skipped']);
const HISTORY_CLOSED_SLICE_STATUSES = new Set(['skipped']);

function toPosix(relativePath) {
  return String(relativePath || '').split(path.sep).join('/');
}

function compareRefs(left, right) {
  return String(left || '').localeCompare(String(right || ''));
}

function normalizeSliceRecord(slice) {
  const rawStatus = String(slice?.status || slice?.json?.status || 'draft').trim() || 'draft';
  const canonicalStatus = normalizeStatus('slice', rawStatus, DEFAULT_SLICE_STATUS);

  return {
    ...slice,
    raw_status: rawStatus,
    canonical_status: canonicalStatus,
    status: rawStatus,
  };
}

function readResolverSlices(projectRoot, specSlug = '') {
  const targetSpec = String(specSlug || '').trim();
  const slices = targetSpec ? readSlicesForSpec(projectRoot, targetSpec) : readAllSlices(projectRoot);
  return slices.map(normalizeSliceRecord);
}

function safeBuildGraph(slices, allowGraphErrors) {
  try {
    const graph = buildGraph(slices);
    return {
      ok: true,
      nodes: graph.nodes.map(normalizeSliceRecord),
      edges: graph.edges,
      cycles: graph.cycles,
      error: null,
    };
  } catch (error) {
    if (!allowGraphErrors || !(error instanceof SliceGraphError)) {
      throw error;
    }

    return {
      ok: false,
      nodes: inferDependencies(slices).map(normalizeSliceRecord),
      edges: [],
      cycles: [],
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
}

function resolveProjectState(projectRoot, options = {}) {
  const specSlug = options.specSlug ? String(options.specSlug).trim() : '';
  const rawSlices = readResolverSlices(projectRoot, specSlug);
  const graph = safeBuildGraph(rawSlices, options.allowGraphErrors === true);
  const orderedSlices = graph.ok ? topoSort(graph).map(normalizeSliceRecord) : graph.nodes.slice().sort((left, right) => compareRefs(left.ref, right.ref));

  return {
    graph,
    orderedSlices,
    projectRoot,
    rawSlices,
    specSlug,
    specs: groupSlicesBySpec(graph.nodes),
  };
}

function filterSlicesForExecution(slices, options = {}) {
  const includeCompleted = options.includeCompleted === true;
  const excluded = includeCompleted ? HISTORY_CLOSED_SLICE_STATUSES : CLOSED_SLICE_STATUSES;

  return (Array.isArray(slices) ? slices : [])
    .filter((slice) => !excluded.has(normalizeStatus('slice', slice?.canonical_status || slice?.status, DEFAULT_SLICE_STATUS)))
    .sort((left, right) => compareRefs(left.ref, right.ref));
}

function progressForSlice(slice) {
  const explicit = Number(slice?.json?.progress);
  if (Number.isFinite(explicit)) {
    return Math.max(0, Math.min(100, explicit));
  }

  const status = normalizeStatus('slice', slice?.canonical_status || slice?.status, DEFAULT_SLICE_STATUS);
  if (status === 'completed') {
    return 100;
  }
  if (status === 'in-progress' || status === 'review') {
    return 50;
  }
  return 0;
}

function summarizeSliceProgress(items) {
  const slices = Array.isArray(items) ? items : [];
  const total = slices.length;
  const completed = slices.filter((item) => isCompletedStatus('slice', item.canonical_status || item.status)).length;
  const blocked = slices.filter((item) => isBlockedStatus('slice', item.canonical_status || item.status, item)).length;
  const open = Math.max(0, total - completed);
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return {
    total,
    completed,
    open,
    blocked,
    percent,
  };
}

function statusForSpec(specSlices) {
  const slices = Array.isArray(specSlices) ? specSlices : [];
  if (slices.length === 0) {
    return 'draft';
  }
  if (slices.some((slice) => isBlockedStatus('slice', slice.canonical_status || slice.status, slice))) {
    return 'blocked';
  }
  if (slices.every((slice) => isCompletedStatus('slice', slice.canonical_status || slice.status))) {
    return 'done';
  }
  if (slices.some((slice) => progressForSlice(slice) > 0)) {
    return 'in-progress';
  }
  return DEFAULT_SPEC_STATUS;
}

function groupSlicesBySpec(slices) {
  const groups = new Map();

  for (const slice of Array.isArray(slices) ? slices : []) {
    const key = `${slice.specFamily || 'specs'}/${slice.specSlug || ''}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(slice);
  }

  return Array.from(groups.entries())
    .map(([key, specSlices]) => {
      const [specFamily, specSlug] = key.split('/');
      const ordered = specSlices.slice().sort((left, right) => compareRefs(left.ref, right.ref));
      const status = statusForSpec(ordered);
      return {
        canonical_status: normalizeStatus('spec', status, DEFAULT_SPEC_STATUS),
        specFamily,
        specSlug,
        status,
        slices: ordered,
      };
    })
    .sort((left, right) => left.specSlug.localeCompare(right.specSlug));
}

function summarizeGraph(graph) {
  if (!graph?.ok) {
    return {
      ok: false,
      edges: [],
      levels: [],
      conflicts: [],
      error: graph?.error || null,
      nodes: Array.isArray(graph?.nodes) ? graph.nodes : [],
    };
  }

  const levels = computeLevels(graph).map((level, index) => ({
    level: index,
    slices: level.map((slice) => slice.ref),
  }));

  return {
    ok: true,
    edges: graph.edges.map((edge) => ({ from: edge.from, to: edge.to })),
    levels,
    conflicts: detectFileConflicts(graph.nodes).map((conflict) => ({
      files: conflict.files,
      slices: conflict.slices,
    })),
    error: null,
    nodes: graph.nodes,
  };
}

function relativeProjectPath(projectRoot, filePath) {
  return toPosix(path.relative(projectRoot, filePath));
}

module.exports = {
  CANONICAL_STATUSES,
  DEFAULT_AGENT_STATUS,
  DEFAULT_RUN_STATUS,
  DEFAULT_SLICE_STATUS,
  DEFAULT_SPEC_STATUS,
  filterSlicesForExecution,
  groupSlicesBySpec,
  isBlockedStatus,
  isCompletedStatus,
  normalizeStatus,
  progressForSlice,
  relativeProjectPath,
  resolveProjectState,
  summarizeGraph,
  summarizeSliceProgress,
  toPosix,
};

