const fs = require('node:fs');
const path = require('node:path');

const { collectLifecycleExport } = require('./ai/export-state');
const {
  collectActiveSliceState,
  filterSlicesForExecution,
  groupSlicesBySpec,
  isBlockedStatus,
  isCompletedStatus,
  normalizeStatus,
  progressForSlice,
  resolveProjectState,
  summarizeGraph,
} = require('./project-state-resolver');
const { relativePosixPath } = require('./paths');

const DASHBOARD_SCHEMA_VERSION = 1;
const SPEC_FAMILIES = Object.freeze(['specs', 'specs-fix']);
const DEFAULT_DASHBOARD_LIMIT = 2;
const MAX_DASHBOARD_LIMIT = 100;
const SUPPORTED_DASHBOARD_SECTIONS = Object.freeze([
  'overview',
  'specs',
  'slices',
  'blockers',
  'warnings',
  'agents',
  'approvals',
  'runs',
  'active-slice',
  'next-steps',
]);

class DashboardError extends Error {
  constructor(code, message, nextCommand = 'npx create-quiver dashboard') {
    super(message);
    this.name = 'DashboardError';
    this.code = code;
    this.nextCommand = nextCommand;
  }
}

function compareRefs(left, right) {
  return String(left || '').localeCompare(String(right || ''));
}

function toPosix(filePath) {
  return String(filePath || '').split(path.sep).join('/');
}

function isPlaceholderSpecDir(name) {
  return String(name || '').startsWith('[') && String(name || '').endsWith(']');
}

function listSpecDirectories(projectRoot) {
  const specs = [];

  for (const family of SPEC_FAMILIES) {
    const familyPath = path.join(projectRoot, family);
    if (!fs.existsSync(familyPath)) {
      continue;
    }

    for (const entry of fs.readdirSync(familyPath, { withFileTypes: true })) {
      if (!entry.isDirectory() || isPlaceholderSpecDir(entry.name)) {
        continue;
      }
      const specRoot = path.join(familyPath, entry.name);
      const hasSpecSignals = fs.existsSync(path.join(specRoot, 'SPEC.md'))
        || fs.existsSync(path.join(specRoot, 'STATUS.md'))
        || fs.existsSync(path.join(specRoot, 'slices'));
      if (!hasSpecSignals) {
        continue;
      }
      specs.push({
        family,
        path: toPosix(path.join(family, entry.name)),
        slug: entry.name,
        spec_path: fs.existsSync(path.join(specRoot, 'SPEC.md')) ? toPosix(path.join(family, entry.name, 'SPEC.md')) : null,
        status_path: fs.existsSync(path.join(specRoot, 'STATUS.md')) ? toPosix(path.join(family, entry.name, 'STATUS.md')) : null,
      });
    }
  }

  return specs.sort((left, right) => left.slug.localeCompare(right.slug) || left.family.localeCompare(right.family));
}

function sliceStatus(slice) {
  return normalizeStatus('slice', slice?.canonical_status || slice?.status, 'planned');
}

function isClosedSlice(slice) {
  const status = sliceStatus(slice);
  return status === 'completed' || status === 'skipped';
}

function summarizeProgress(slices) {
  const items = Array.isArray(slices) ? slices : [];
  const total = items.length;
  const completed = items.filter((slice) => isCompletedStatus('slice', sliceStatus(slice))).length;
  const skipped = items.filter((slice) => sliceStatus(slice) === 'skipped').length;
  const blocked = items.filter((slice) => isBlockedStatus('slice', sliceStatus(slice), slice)).length;
  const open = Math.max(0, total - completed - skipped);
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return {
    total,
    completed,
    skipped,
    open,
    blocked,
    percent,
  };
}

function normalizeSlice(projectRoot, slice) {
  const sliceJsonPath = relativePosixPath(projectRoot, slice.slicePath);
  const status = sliceStatus(slice);
  return {
    ref: slice.ref,
    id: slice.sliceId,
    title: slice.title || slice.sliceId,
    status: slice.status || status,
    canonical_status: status,
    progress: progressForSlice(slice),
    spec_slug: slice.specSlug,
    spec_family: slice.specFamily,
    path: relativePosixPath(projectRoot, slice.sliceDir),
    slice_json: sliceJsonPath,
    depends_on: Array.isArray(slice.depends_on) ? slice.depends_on : [],
    blocked_reason: slice.json?.blocked_reason || null,
    files_count: Array.isArray(slice.files) ? slice.files.length : 0,
    start_slice_command: status === 'blocked' || isClosedSlice(slice) ? null : `npx create-quiver start-slice "${sliceJsonPath}"`,
  };
}

function normalizeSpec(spec, projectRoot) {
  const progress = summarizeProgress(spec.slices);
  const specPath = toPosix(path.join(spec.specFamily, spec.specSlug));
  return {
    slug: spec.specSlug,
    family: spec.specFamily,
    path: specPath,
    spec_path: fs.existsSync(path.join(projectRoot, specPath, 'SPEC.md')) ? toPosix(path.join(specPath, 'SPEC.md')) : null,
    status_path: fs.existsSync(path.join(projectRoot, specPath, 'STATUS.md')) ? toPosix(path.join(specPath, 'STATUS.md')) : null,
    status: spec.status,
    canonical_status: normalizeStatus('spec', spec.canonical_status || spec.status, 'planned'),
    progress,
    slices: spec.slices.map((slice) => slice.ref).sort(compareRefs),
  };
}

function mergeSpecDirectories(specs, directories) {
  const byKey = new Map(specs.map((spec) => [`${spec.family}/${spec.slug}`, spec]));

  for (const directory of directories) {
    const key = `${directory.family}/${directory.slug}`;
    if (byKey.has(key)) {
      continue;
    }
    byKey.set(key, {
      slug: directory.slug,
      family: directory.family,
      path: directory.path,
      spec_path: directory.spec_path,
      status_path: directory.status_path,
      status: 'draft',
      canonical_status: 'draft',
      progress: summarizeProgress([]),
      slices: [],
    });
  }

  return Array.from(byKey.values()).sort((left, right) => left.slug.localeCompare(right.slug) || left.family.localeCompare(right.family));
}

function compactAgents(agents) {
  return (Array.isArray(agents) ? agents : []).map((agent) => ({
    role: agent.role,
    configured: Boolean(agent.configured),
    provider: agent.provider || null,
    model: agent.model || null,
    status: agent.status || 'idle',
    canonical_status: agent.canonical_status || 'idle',
  }));
}

function compactApprovals(approvals) {
  return (Array.isArray(approvals) ? approvals : []).map((approval) => ({
    phase: approval.phase,
    status: approval.status,
    canonical_status: approval.canonical_status,
    latest_draft_version: approval.latest_draft_version || null,
    approved_version: approval.approved_version || null,
    error: approval.error || null,
  }));
}

function compactRuns(runs) {
  return (Array.isArray(runs) ? runs : []).map((run) => ({
    run_id: run.run_id,
    phase: run.phase,
    status: run.status,
    canonical_status: run.canonical_status,
    spec_slug: run.spec_slug || null,
    next_command: run.next_command || null,
    updated_at: run.updated_at || null,
  }));
}

function collectEvidenceSummary(slices) {
  const refs = [];
  let count = 0;

  for (const slice of Array.isArray(slices) ? slices : []) {
    const evidence = Array.isArray(slice.json?.evidence) ? slice.json.evidence : [];
    if (evidence.length === 0) {
      continue;
    }
    count += evidence.length;
    refs.push(slice.ref);
  }

  return {
    count,
    slice_refs: Array.from(new Set(refs)).sort(compareRefs),
  };
}

function filterGraphForRefs(graph, selectedRefs) {
  if (!graph?.ok) {
    return graph;
  }

  const refs = selectedRefs instanceof Set ? selectedRefs : new Set(selectedRefs);
  return {
    ...graph,
    edges: graph.edges.filter((edge) => refs.has(edge.from) && refs.has(edge.to)),
    levels: graph.levels
      .map((level) => ({
        level: level.level,
        slices: level.slices.filter((ref) => refs.has(ref)),
      }))
      .filter((level) => level.slices.length > 0)
      .map((level, index) => ({
        ...level,
        level: index,
      })),
    conflicts: graph.conflicts
      .map((conflict) => ({
        files: conflict.files,
        slices: conflict.slices.filter((ref) => refs.has(ref)),
      }))
      .filter((conflict) => conflict.slices.length > 1),
  };
}

function buildReadyRefs(graph, pendingSlices) {
  if (!graph?.ok) {
    return new Set();
  }

  const pendingRefs = new Set((Array.isArray(pendingSlices) ? pendingSlices : []).map((slice) => slice.ref));
  const incomingCounts = new Map(Array.from(pendingRefs).map((ref) => [ref, 0]));

  for (const edge of graph.edges || []) {
    if (!pendingRefs.has(edge.from) || !pendingRefs.has(edge.to)) {
      continue;
    }
    incomingCounts.set(edge.to, (incomingCounts.get(edge.to) || 0) + 1);
  }

  return new Set(Array.from(incomingCounts.entries())
    .filter(([, count]) => count === 0)
    .map(([ref]) => ref));
}

function selectNextReady({ graph, pendingSlices, visibleSlices, projectRoot }) {
  const readyRefs = buildReadyRefs(graph, pendingSlices);
  const next = (Array.isArray(visibleSlices) ? visibleSlices : [])
    .filter((slice) => readyRefs.has(slice.ref))
    .filter((slice) => !isBlockedStatus('slice', sliceStatus(slice), slice))
    .filter((slice) => !isClosedSlice(slice))
    .sort((left, right) => compareRefs(left.ref, right.ref))[0] || null;

  return next ? normalizeSlice(projectRoot, next) : null;
}

function normalizeWarning(code, message) {
  return { code, message };
}

function collectWarnings({ graphSummary, layout, specDirs, specSlug, visibleSlices }) {
  const warnings = [];

  if (!graphSummary.ok && graphSummary.error?.message) {
    warnings.push(normalizeWarning(graphSummary.error.code || 'GRAPH_ERROR', graphSummary.error.message));
  }

  if (layout.layout === 'legacy' || layout.layout === 'hybrid' || layout.layout === 'incomplete') {
    warnings.push(normalizeWarning('LAYOUT_REQUIRES_ATTENTION', layout.recommendations.join(' ')));
  }

  if (specDirs.length === 0) {
    warnings.push(normalizeWarning('NO_SPECS_FOUND', 'No specs were found in specs/ or specs-fix/.'));
  }

  if (visibleSlices.length === 0) {
    warnings.push(normalizeWarning(
      'NO_VISIBLE_SLICES',
      specSlug
        ? `No visible slices were found for spec '${specSlug}' with the current filters.`
        : 'No visible slices were found with the current filters.',
    ));
  }

  return warnings;
}

function collectBlockers({ graphSummary, layout, activeSlice, visibleSlices }) {
  const blockers = [];

  for (const slice of visibleSlices) {
    if (isBlockedStatus('slice', sliceStatus(slice), slice)) {
      blockers.push({
        ref: slice.ref,
        reason: slice.json?.blocked_reason || 'blocked',
      });
    }
  }

  if (!graphSummary.ok && graphSummary.error?.message) {
    blockers.push({ ref: 'slice-graph', reason: graphSummary.error.message });
  }

  if (layout.layout === 'legacy' || layout.layout === 'hybrid' || layout.layout === 'incomplete') {
    blockers.push({ ref: 'migration', reason: layout.recommendations.join(' ') });
  }

  if (activeSlice?.reconciliation?.decision === 'blocked') {
    blockers.push({ ref: 'active-slice', reason: activeSlice.reconciliation.reason });
  }

  return blockers;
}

function collectNextSteps({ graphSummary, nextReady, selectedSpec, specSlug, visibleSlices }) {
  const steps = [];

  if (!graphSummary.ok) {
    steps.push({
      id: 'inspect-graph',
      command: specSlug ? `npx create-quiver graph --spec ${specSlug}` : 'npx create-quiver graph',
      reason: 'Inspect slice dependency issues before executing slices.',
    });
    return steps;
  }

  if (nextReady) {
    steps.push({
      id: 'start-next-ready-slice',
      command: nextReady.start_slice_command,
      reason: `Start ${nextReady.ref}.`,
    });
  }

  if (selectedSpec?.path) {
    steps.push({
      id: 'validate-spec',
      command: `npx create-quiver spec validate ${selectedSpec.path}`,
      reason: 'Validate the spec package before execution or PR work.',
    });
  }

  if (!nextReady && visibleSlices.length === 0 && specSlug) {
    steps.push({
      id: 'include-completed-history',
      command: `npx create-quiver dashboard --spec ${specSlug} --include-completed`,
      reason: 'Show completed history for this spec.',
    });
  }

  if (!nextReady && !selectedSpec) {
    steps.push({
      id: 'draft-acceptance',
      command: 'npx create-quiver ai plan --phase acceptance --input <requirements.md> --dry-run',
      reason: 'Start the WDD + SDD planning flow before creating specs.',
    });
  }

  return steps;
}

function buildErrorPayload(error) {
  const isDashboardError = error instanceof DashboardError;
  return {
    dashboard_schema_version: DASHBOARD_SCHEMA_VERSION,
    error: {
      code: isDashboardError ? error.code : 'DASHBOARD_ERROR',
      message: error.message,
      next_command: isDashboardError ? error.nextCommand : 'npx create-quiver dashboard',
    },
  };
}

function collectDashboardReport(projectRoot, options = {}) {
  const specSlug = options.specSlug ? String(options.specSlug).trim() : '';
  const includeCompleted = options.includeCompleted === true;
  const specDirs = listSpecDirectories(projectRoot);
  const selectedSpecDir = specSlug ? specDirs.find((spec) => spec.slug === specSlug) : null;

  if (specSlug && !selectedSpecDir) {
    throw new DashboardError(
      'SPEC_NOT_FOUND',
      `Spec '${specSlug}' was not found in specs/ or specs-fix/.`,
      'npx create-quiver ai specs list',
    );
  }

  const exportData = collectLifecycleExport(projectRoot, { includeCompleted: true });
  const globalState = resolveProjectState(projectRoot, { allowGraphErrors: true });
  const visibleState = resolveProjectState(projectRoot, {
    allowGraphErrors: true,
    specSlug,
  });
  const globalSlices = globalState.graph.nodes;
  const baseVisibleSlices = specSlug
    ? visibleState.graph.nodes.filter((slice) => slice.specSlug === specSlug)
    : visibleState.graph.nodes;
  const visibleSlices = filterSlicesForExecution(baseVisibleSlices, { includeCompleted });
  const pendingGraphSlices = filterSlicesForExecution(visibleState.graph.nodes, { includeCompleted: false });
  const graphSummary = summarizeGraph(visibleState.graph);
  const visibleRefs = new Set(visibleSlices.map((slice) => slice.ref));
  const selectedGraph = filterGraphForRefs(graphSummary, visibleRefs);
  const globalSpecs = mergeSpecDirectories(
    groupSlicesBySpec(globalSlices).map((spec) => normalizeSpec(spec, projectRoot)),
    specDirs,
  );
  const selectedSpec = specSlug
    ? globalSpecs.find((spec) => spec.slug === specSlug) || {
        ...selectedSpecDir,
        status: 'draft',
        canonical_status: 'draft',
        progress: summarizeProgress([]),
        slices: [],
      }
    : null;
  const visibleSpecs = specSlug
    ? (selectedSpec ? [selectedSpec] : [])
    : globalSpecs;
  const activeSlice = collectActiveSliceState(projectRoot, { slices: globalSlices });
  const nextReady = selectNextReady({
    graph: visibleState.graph,
    pendingSlices: pendingGraphSlices,
    projectRoot,
    visibleSlices,
  });
  const warnings = collectWarnings({
    graphSummary,
    layout: exportData.migration,
    specDirs,
    specSlug,
    visibleSlices,
  });
  const blockers = collectBlockers({
    activeSlice,
    graphSummary,
    layout: exportData.migration,
    visibleSlices,
  });
  const nextSteps = collectNextSteps({
    graphSummary,
    nextReady,
    selectedSpec,
    specSlug,
    visibleSlices,
  });
  const agents = compactAgents(exportData.agents);
  const approvals = compactApprovals(exportData.approvals);
  const runs = compactRuns(exportData.runs);

  return {
    dashboard_schema_version: DASHBOARD_SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    source_metadata: {
      generator: 'create-quiver',
      command: 'dashboard',
      resolver: 'project-state-resolver',
      include_completed: includeCompleted,
      spec_filter: specSlug || null,
    },
    project: exportData.project,
    summary: {
      specs: globalSpecs.length,
      visible_specs: visibleSpecs.length,
      slices: globalSlices.length,
      visible_slices: visibleSlices.length,
      runs: runs.length,
      configured_agents: agents.filter((agent) => agent.configured).length,
      agents: agents.length,
      warnings: warnings.length,
      blockers: blockers.length,
      layout: exportData.migration.layout,
    },
    global_progress: summarizeProgress(globalSlices),
    visible_progress: summarizeProgress(visibleSlices),
    specs: visibleSpecs,
    slices: visibleSlices.map((slice) => normalizeSlice(projectRoot, slice)),
    next_ready: nextReady,
    blockers,
    warnings,
    graph: {
      ok: selectedGraph.ok,
      edges: selectedGraph.ok ? selectedGraph.edges : [],
      levels: selectedGraph.ok ? selectedGraph.levels : [],
      conflicts: selectedGraph.ok ? selectedGraph.conflicts : [],
      error: selectedGraph.ok ? null : selectedGraph.error,
    },
    agents,
    approvals,
    runs,
    active_slice: {
      supported_sources: activeSlice.supported_sources,
      sources_count: activeSlice.sources.length,
      reconciliation: activeSlice.reconciliation,
    },
    evidence: collectEvidenceSummary(visibleSlices),
    next_steps: nextSteps,
  };
}

function formatProgress(progress) {
  return `${progress.completed}/${progress.total} completed, ${progress.open} open, ${progress.blocked} blocked, ${progress.percent}%`;
}

function dashboardOptionError(message, nextCommand = 'npx create-quiver dashboard --help') {
  return new DashboardError('INVALID_DASHBOARD_OPTIONS', message, nextCommand);
}

function parseDashboardLimit(rawLimit, errors) {
  if (rawLimit === null || typeof rawLimit === 'undefined' || rawLimit === '') {
    return DEFAULT_DASHBOARD_LIMIT;
  }

  const value = String(rawLimit).trim();
  if (!/^[1-9]\d*$/.test(value)) {
    errors.push('invalid value for --limit: expected an integer from 1 to 100');
    return DEFAULT_DASHBOARD_LIMIT;
  }

  const parsed = Number.parseInt(value, 10);
  if (parsed > MAX_DASHBOARD_LIMIT) {
    errors.push('invalid value for --limit: expected an integer from 1 to 100');
    return DEFAULT_DASHBOARD_LIMIT;
  }

  return parsed;
}

function normalizeDashboardOptions(options = {}) {
  const errors = Array.isArray(options.optionErrors) ? [...options.optionErrors] : [];
  const details = options.details === true;
  const section = String(options.section || '').trim();
  const hasLimit = options.limit !== null && typeof options.limit !== 'undefined';
  const limit = parseDashboardLimit(options.limit, errors);

  if (section && !SUPPORTED_DASHBOARD_SECTIONS.includes(section)) {
    errors.push(`unsupported dashboard section: ${section}. Supported sections: ${SUPPORTED_DASHBOARD_SECTIONS.join(', ')}`);
  }

  if (details && section) {
    errors.push('dashboard --details cannot be combined with --section <name>');
  }

  if (options.json && (details || section || hasLimit || errors.length > 0)) {
    errors.push('dashboard --json cannot be combined with human-only flags: --details, --section, --limit');
  }

  if (errors.length > 0) {
    throw dashboardOptionError(errors.join(' '));
  }

  return {
    details,
    limit,
    section,
  };
}

function truncateText(value, maxLength = 96) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function dashboardCommand(report, suffix = '') {
  const parts = ['npx create-quiver dashboard'];
  if (report.source_metadata.spec_filter) {
    parts.push('--spec', report.source_metadata.spec_filter);
  }
  if (report.source_metadata.include_completed) {
    parts.push('--include-completed');
  }
  if (suffix) {
    parts.push(suffix);
  }
  return parts.join(' ');
}

function truncationLine(report, section, hidden) {
  return `- + ${hidden} more. Run: ${dashboardCommand(report, `--section ${section}`)}`;
}

function pushLimitedList(lines, report, section, items, limit, formatter) {
  if (!items.length) {
    lines.push('- none');
    return;
  }

  for (const item of items.slice(0, limit)) {
    lines.push(`- ${formatter(item)}`);
  }

  const hidden = items.length - limit;
  if (hidden > 0) {
    lines.push(truncationLine(report, section, hidden));
  }
}

function formatSpecLine(spec) {
  return `${spec.slug}: ${spec.status}, ${spec.progress.percent}% (${spec.progress.completed}/${spec.progress.total})`;
}

function formatSliceLine(slice) {
  const blocked = slice.blocked_reason ? ` blocked=${truncateText(slice.blocked_reason, 48)}` : '';
  return `${slice.ref}: ${slice.status}, ${slice.progress}%${blocked}`;
}

function formatAgentLine(agent) {
  return `${agent.role}: ${agent.configured ? agent.provider || 'configured' : 'missing'}`;
}

function formatApprovalLine(approval) {
  const version = approval.approved_version ? ` approved=v${approval.approved_version}` : '';
  return `${approval.phase}: ${approval.status}${version}`;
}

function formatRunLine(run) {
  return `${run.run_id}: ${run.phase} (${run.status})`;
}

function pushSignalSection(lines, report, title, section, items, limit, formatter) {
  lines.push(`${title}: ${items.length === 0 ? 'none' : ''}`.trimEnd());
  if (items.length > 0) {
    pushLimitedList(lines, report, section, items, limit, formatter);
  }
}

function formatCompactDashboard(report, options) {
  const nextCommand = report.next_steps[0]?.command || 'none';
  const state = report.blockers.length > 0
    ? 'blocked'
    : report.warnings.length > 0
      ? 'warning'
      : report.next_ready
        ? 'ready'
        : 'idle';
  const lines = [
    'Quiver Dashboard',
    `Project: ${truncateText(report.project.name, 42)} | Layout: ${report.summary.layout} | Filter: ${report.source_metadata.spec_filter || 'all specs'}`,
    `State: ${state}`,
    `Next safe command: ${nextCommand}`,
    `Progress: Global: ${formatProgress(report.global_progress)} | Visible: ${formatProgress(report.visible_progress)}`,
    `Counts: specs ${report.summary.specs} (${report.summary.visible_specs} visible), slices ${report.summary.slices} (${report.summary.visible_slices} visible), agents ${report.summary.configured_agents}/${report.summary.agents}, runs ${report.summary.runs}`,
    `Next ready slice: ${report.next_ready ? `${report.next_ready.ref} - ${truncateText(report.next_ready.title, 48)}` : 'none'}`,
  ];

  pushSignalSection(lines, report, 'Blockers', 'blockers', report.blockers, options.limit, (blocker) => `${blocker.ref}: ${truncateText(blocker.reason, 70)}`);
  pushSignalSection(lines, report, 'Warnings', 'warnings', report.warnings, options.limit, (warning) => `${warning.code}: ${truncateText(warning.message, 70)}`);

  lines.push(`Active slice: ${report.active_slice.reconciliation.decision} (${truncateText(report.active_slice.reconciliation.reason, 60)})`);
  lines.push(`Inspect: ${dashboardCommand(report, '--details')}`);
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function formatDashboardOverview(report) {
  const lines = [
    'Dashboard Overview',
    `Project: ${report.project.name}`,
    `Layout: ${report.summary.layout}`,
    `Filter: ${report.source_metadata.spec_filter || 'all specs'}`,
    `Completed hidden: ${report.source_metadata.include_completed ? 'no' : 'yes'}`,
    `Global progress: ${formatProgress(report.global_progress)}`,
    `Visible progress: ${formatProgress(report.visible_progress)}`,
    `Specs: ${report.summary.specs} (${report.summary.visible_specs} visible)`,
    `Slices: ${report.summary.slices} (${report.summary.visible_slices} visible)`,
    `Blockers: ${report.summary.blockers}`,
    `Warnings: ${report.summary.warnings}`,
    `Runs: ${report.summary.runs}`,
    '',
  ];

  return `${lines.join('\n')}\n`;
}

function formatDashboardSection(report, options) {
  const lines = [];
  const limit = options.limit;

  if (options.section === 'overview') {
    return formatDashboardOverview(report);
  }

  if (options.section === 'specs') {
    lines.push('Specs');
    pushLimitedList(lines, report, 'specs', report.specs, limit, formatSpecLine);
  }

  if (options.section === 'slices') {
    lines.push('Slices');
    pushLimitedList(lines, report, 'slices', report.slices, limit, formatSliceLine);
  }

  if (options.section === 'blockers') {
    lines.push('Blockers');
    pushLimitedList(lines, report, 'blockers', report.blockers, limit, (blocker) => `${blocker.ref}: ${blocker.reason}`);
  }

  if (options.section === 'warnings') {
    lines.push('Warnings');
    pushLimitedList(lines, report, 'warnings', report.warnings, limit, (warning) => `${warning.code}: ${warning.message}`);
  }

  if (options.section === 'agents') {
    lines.push('Agents');
    pushLimitedList(lines, report, 'agents', report.agents, limit, formatAgentLine);
  }

  if (options.section === 'approvals') {
    lines.push('Approvals');
    pushLimitedList(lines, report, 'approvals', report.approvals, limit, formatApprovalLine);
  }

  if (options.section === 'runs') {
    lines.push('Runs');
    pushLimitedList(lines, report, 'runs', report.runs, limit, formatRunLine);
  }

  if (options.section === 'active-slice') {
    lines.push(
      'Active slice',
      `- Sources: ${report.active_slice.sources_count}`,
      `- Reconciliation: ${report.active_slice.reconciliation.decision} (${report.active_slice.reconciliation.reason})`,
    );
  }

  if (options.section === 'next-steps') {
    lines.push('Next safe commands');
    pushLimitedList(lines, report, 'next-steps', report.next_steps, limit, (step) => step.command);
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}

function formatDashboardDetails(report) {
  const lines = [
    'Quiver Dashboard',
    `Project: ${report.project.name}`,
    `Layout: ${report.summary.layout}`,
    `Filter: ${report.source_metadata.spec_filter || 'all specs'}`,
    `Completed hidden: ${report.source_metadata.include_completed ? 'no' : 'yes'}`,
    '',
    'Progress',
    `- Global: ${formatProgress(report.global_progress)}`,
    `- Visible: ${formatProgress(report.visible_progress)}`,
    '',
    'Next ready slice',
  ];

  if (report.next_ready) {
    lines.push(`- ${report.next_ready.ref}: ${report.next_ready.title}`);
    lines.push(`- Start: ${report.next_ready.start_slice_command}`);
  } else {
    lines.push('- none');
  }

  lines.push('', 'Specs');
  if (report.specs.length === 0) {
    lines.push('- none');
  } else {
    for (const spec of report.specs) {
      lines.push(`- ${formatSpecLine(spec)}`);
    }
  }

  lines.push('', 'Slices');
  if (report.slices.length === 0) {
    lines.push('- none');
  } else {
    for (const slice of report.slices) {
      lines.push(`- ${formatSliceLine(slice)}`);
    }
  }

  lines.push('', 'Blockers');
  if (report.blockers.length === 0) {
    lines.push('- none');
  } else {
    for (const blocker of report.blockers) {
      lines.push(`- ${blocker.ref}: ${blocker.reason}`);
    }
  }

  lines.push('', 'Warnings');
  if (report.warnings.length === 0) {
    lines.push('- none');
  } else {
    for (const warning of report.warnings) {
      lines.push(`- ${warning.code}: ${warning.message}`);
    }
  }

  lines.push('', 'Agents');
  if (report.agents.length === 0) {
    lines.push('- none');
  } else {
    for (const agent of report.agents) {
      lines.push(`- ${formatAgentLine(agent)}`);
    }
  }

  lines.push('', 'Approvals');
  if (report.approvals.length === 0) {
    lines.push('- none');
  } else {
    for (const approval of report.approvals) {
      lines.push(`- ${formatApprovalLine(approval)}`);
    }
  }

  lines.push('', 'Runs');
  if (report.runs.length === 0) {
    lines.push('- none');
  } else {
    for (const run of report.runs) {
      lines.push(`- ${formatRunLine(run)}`);
    }
  }

  lines.push(
    '',
    'Active slice',
    `- Sources: ${report.active_slice.sources_count}`,
    `- Reconciliation: ${report.active_slice.reconciliation.decision} (${report.active_slice.reconciliation.reason})`,
    '',
    'Next safe commands',
  );

  if (report.next_steps.length === 0) {
    lines.push('- none');
  } else {
    for (const step of report.next_steps) {
      lines.push(`- ${step.command}`);
    }
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}

function formatHumanDashboard(report, options = {}) {
  const normalized = normalizeDashboardOptions({ ...options, json: false });
  if (normalized.details) {
    return formatDashboardDetails(report);
  }
  if (normalized.section) {
    return formatDashboardSection(report, normalized);
  }
  return formatCompactDashboard(report, normalized);
}

module.exports = {
  DASHBOARD_SCHEMA_VERSION,
  DEFAULT_DASHBOARD_LIMIT,
  DashboardError,
  SUPPORTED_DASHBOARD_SECTIONS,
  buildErrorPayload,
  collectDashboardReport,
  formatHumanDashboard,
  normalizeDashboardOptions,
};
