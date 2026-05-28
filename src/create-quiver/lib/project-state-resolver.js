const fs = require('fs');
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
  let graph = safeBuildGraph(rawSlices, options.allowGraphErrors === true);
  let orderedSlices;

  try {
    orderedSlices = graph.ok ? topoSort(graph).map(normalizeSliceRecord) : graph.nodes.slice().sort((left, right) => compareRefs(left.ref, right.ref));
  } catch (error) {
    if (!options.allowGraphErrors || !(error instanceof SliceGraphError)) {
      throw error;
    }

    graph = {
      ok: false,
      nodes: inferDependencies(rawSlices).map(normalizeSliceRecord),
      edges: [],
      cycles: Array.isArray(graph.cycles) ? graph.cycles : [],
      error: {
        code: error.code,
        message: error.message,
      },
    };
    orderedSlices = graph.nodes.slice().sort((left, right) => compareRefs(left.ref, right.ref));
  }

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

function readMarkdownSectionValue(text, heading) {
  const lines = String(text || '').split(/\r?\n/);
  const normalizedHeading = String(heading || '').trim().toLowerCase();
  let capture = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const match = line.match(/^##\s+(.+)$/);
    if (match) {
      capture = match[1].trim().toLowerCase() === normalizedHeading;
      continue;
    }
    if (capture && line && !line.startsWith('---')) {
      return line.replace(/^[-*]\s+/, '').trim();
    }
  }

  return '';
}

function buildSliceLookup(slices) {
  const byRef = new Map();
  const bySliceId = new Map();

  for (const slice of Array.isArray(slices) ? slices : []) {
    if (slice.ref) {
      byRef.set(slice.ref, slice);
    }
    const sliceId = slice.sliceId || slice.json?.slice_id || '';
    if (!sliceId) {
      continue;
    }
    if (!bySliceId.has(sliceId)) {
      bySliceId.set(sliceId, []);
    }
    bySliceId.get(sliceId).push(slice);
  }

  return { byRef, bySliceId };
}

function normalizeActiveSliceSource(source, lookup) {
  const ref = source.ref || (source.spec_slug && source.slice_id ? `${source.spec_slug}/${source.slice_id}` : '');
  let resolved = ref ? lookup.byRef.get(ref) : null;
  let issue = '';

  if (!resolved && source.slice_id && !source.spec_slug) {
    const matches = lookup.bySliceId.get(source.slice_id) || [];
    if (matches.length === 1) {
      resolved = matches[0];
    } else if (matches.length > 1) {
      issue = `ambiguous slice id '${source.slice_id}' appears in multiple specs`;
    }
  }

  if (!resolved && !issue) {
    issue = source.slice_id ? `slice '${source.slice_id}' was not found` : 'active slice source did not declare a slice id';
  }

  return {
    ...source,
    ref: resolved?.ref || ref || null,
    spec_slug: source.spec_slug || resolved?.specSlug || null,
    slice_id: source.slice_id || resolved?.sliceId || null,
    status: resolved?.status || source.status || null,
    canonical_status: resolved ? normalizeStatus('slice', resolved.canonical_status || resolved.status, DEFAULT_SLICE_STATUS) : null,
    title: resolved?.title || source.title || null,
    valid: Boolean(resolved),
    issue: resolved ? null : issue,
  };
}

function parseActiveSliceDoc(projectRoot, lookup) {
  const relativePath = 'docs/ai/ACTIVE_SLICE.md';
  const filePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const text = fs.readFileSync(filePath, 'utf8');
  return [normalizeActiveSliceSource({
    kind: 'active-doc',
    path: relativePath,
    source_id: relativePath,
    slice_id: readMarkdownSectionValue(text, 'Slice ID'),
    title: readMarkdownSectionValue(text, 'Title'),
  }, lookup)];
}

function isMarkdownSeparatorCell(value) {
  return /^:?-{3,}:?$/.test(String(value || '').trim());
}

function parseActiveSlicesBoard(projectRoot, lookup) {
  const relativePath = 'ACTIVE_SLICES.md';
  const filePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const sources = [];
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line.startsWith('|') || !line.endsWith('|')) {
      continue;
    }
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells.length < 6 || cells[1] === 'Spec' || cells.every(isMarkdownSeparatorCell)) {
      continue;
    }
    const specSlug = cells[1];
    const sliceId = cells[2];
    if (!specSlug || !sliceId || specSlug === '-' || sliceId === '-') {
      continue;
    }
    sources.push(normalizeActiveSliceSource({
      branch: cells[3] || null,
      kind: 'active-board',
      path: relativePath,
      row: index + 1,
      source_id: `${relativePath}:${index + 1}`,
      spec_slug: specSlug,
      slice_id: sliceId,
      status: cells[4] || null,
      worktree_path: cells[5] || null,
    }, lookup));
  }

  return sources;
}

function buildActiveSliceReconciliation(sources) {
  const activeSources = Array.isArray(sources) ? sources : [];
  const existingRefs = Array.from(new Set(activeSources.filter((source) => source.valid && source.ref).map((source) => source.ref)));
  const invalidSources = activeSources.filter((source) => !source.valid);
  const hasActiveDoc = activeSources.some((source) => source.kind === 'active-doc');
  const hasBoard = activeSources.some((source) => source.kind === 'active-board');
  const planned_changes = [];
  const risks = [];
  let decision = 'preserve';
  let reason = 'No active-slice source needs changes.';

  if (activeSources.length === 0) {
    reason = 'No active-slice source exists.';
  } else if (invalidSources.length > 0) {
    decision = 'blocked';
    reason = 'One or more active-slice sources reference missing or ambiguous slices.';
    risks.push(...invalidSources.map((source) => `${source.source_id}: ${source.issue}`));
  } else if (existingRefs.length > 1) {
    decision = 'blocked';
    reason = 'Active-slice sources disagree about the active slice.';
    risks.push(`Conflicting refs: ${existingRefs.join(', ')}`);
  } else {
    const active = activeSources.find((source) => source.ref === existingRefs[0]) || activeSources[0];
    if (active && isCompletedStatus('slice', active.canonical_status || active.status)) {
      decision = 'close';
      reason = 'The active slice is already completed and local active-state files should be closed intentionally.';
      planned_changes.push('remove docs/ai/ACTIVE_SLICE.md if it exists');
      planned_changes.push('refresh ACTIVE_SLICES.md from current worktrees');
    } else if (!hasActiveDoc && hasBoard) {
      decision = 'replace';
      reason = 'ACTIVE_SLICES.md reports an active slice but docs/ai/ACTIVE_SLICE.md is missing.';
      planned_changes.push(`recreate docs/ai/ACTIVE_SLICE.md from ${active?.ref || 'the board source'}`);
    }
  }

  return {
    decision,
    planned_changes,
    possible_decisions: ['preserve', 'close', 'replace', 'blocked'],
    reason,
    risks,
  };
}

function collectActiveSliceState(projectRoot, options = {}) {
  const slices = Array.isArray(options.slices) ? options.slices : readResolverSlices(projectRoot, options.specSlug || '');
  const lookup = buildSliceLookup(slices);
  const sources = [
    ...parseActiveSliceDoc(projectRoot, lookup),
    ...parseActiveSlicesBoard(projectRoot, lookup),
  ];

  return {
    supported_sources: [
      { path: 'docs/ai/ACTIVE_SLICE.md', kind: 'active-doc', exists: fs.existsSync(path.join(projectRoot, 'docs', 'ai', 'ACTIVE_SLICE.md')) },
      { path: 'ACTIVE_SLICES.md', kind: 'active-board', exists: fs.existsSync(path.join(projectRoot, 'ACTIVE_SLICES.md')) },
    ],
    sources,
    reconciliation: buildActiveSliceReconciliation(sources),
  };
}

module.exports = {
  CANONICAL_STATUSES,
  DEFAULT_AGENT_STATUS,
  DEFAULT_RUN_STATUS,
  DEFAULT_SLICE_STATUS,
  DEFAULT_SPEC_STATUS,
  collectActiveSliceState,
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
