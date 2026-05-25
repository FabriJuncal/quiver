const fs = require('node:fs');
const path = require('node:path');

const { listAgentProfiles } = require('../agent-profiles');
const { PLANNER_APPROVAL_PHASES, readPhaseApproval } = require('../approvals');
const { collectLayoutReport } = require('../doctor');
const {
  collectActiveSliceState,
  filterSlicesForExecution,
  groupSlicesBySpec: groupResolvedSlicesBySpec,
  isBlockedStatus: isCanonicalBlockedStatus,
  isCompletedStatus: isCanonicalCompletedStatus,
  normalizeStatus,
  progressForSlice: resolveProgressForSlice,
  resolveProjectState,
  summarizeGraph: summarizeResolvedGraph,
  summarizeSliceProgress,
} = require('../project-state-resolver');
const { detectFileConflicts } = require('../slice-graph');
const { readPlanReview } = require('./plan-review');
const { listAiRuns, nextCommandForPhase } = require('./run-state');

const EXPORT_SCHEMA_VERSION = 2;

function toPosix(relativePath) {
  return String(relativePath || '').split(path.sep).join('/');
}

function relativePath(projectRoot, filePath) {
  return toPosix(path.relative(projectRoot, filePath));
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readPackageSummary(projectRoot) {
  const packageJson = readJsonIfExists(path.join(projectRoot, 'package.json'));

  return {
    name: packageJson?.name || path.basename(projectRoot) || 'project',
    package_manager: fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))
      ? 'pnpm'
      : fs.existsSync(path.join(projectRoot, 'yarn.lock'))
        ? 'yarn'
        : 'npm',
  };
}

function isCompletedStatus(status) {
  return isCanonicalCompletedStatus('slice', status);
}

function isBlockedStatus(slice) {
  return isCanonicalBlockedStatus('slice', slice?.canonical_status || slice?.status, slice);
}

function progressForSlice(slice) {
  return resolveProgressForSlice(slice);
}

function summarizeProgress(items) {
  return summarizeSliceProgress(items);
}

function statusForSpec(specSlices) {
  if (specSlices.length === 0) {
    return 'empty';
  }
  if (specSlices.some((slice) => isBlockedStatus(slice))) {
    return 'blocked';
  }
  if (specSlices.every((slice) => isCompletedStatus(slice.status))) {
    return 'done';
  }
  if (specSlices.some((slice) => progressForSlice(slice) > 0)) {
    return 'in-progress';
  }
  return 'planned';
}

function groupSlicesBySpec(slices) {
  return groupResolvedSlicesBySpec(slices);
}

function buildGraphSummary(slices) {
  return summarizeResolvedGraph(slices);
}

function filterGraphSummary(graph, selectedRefs) {
  if (!graph.ok) {
    return graph;
  }

  const levels = graph.levels
    .map((level) => ({
      original_level: level.level,
      slices: level.slices.filter((ref) => selectedRefs.has(ref)),
    }))
    .filter((level) => level.slices.length > 0)
    .map((level, index) => ({
      level: index,
      original_level: level.original_level,
      slices: level.slices,
    }));

  return {
    ...graph,
    edges: graph.edges.filter((edge) => selectedRefs.has(edge.to)),
    levels,
    conflicts: graph.conflicts
      .map((conflict) => ({
        files: conflict.files,
        slices: conflict.slices.filter((ref) => selectedRefs.has(ref)),
      }))
      .filter((conflict) => conflict.slices.length > 1),
  };
}

function normalizeSlice(projectRoot, slice, dependencyMap) {
  const dependencies = dependencyMap.get(slice.ref) || slice.depends_on || slice.dependencies || [];

  return {
    ref: slice.ref,
    id: slice.sliceId,
    title: slice.title,
    status: slice.status,
    canonical_status: slice.canonical_status || normalizeStatus('slice', slice.status, 'planned'),
    progress: progressForSlice(slice),
    spec_slug: slice.specSlug,
    spec_family: slice.specFamily,
    path: relativePath(projectRoot, slice.sliceDir),
    slice_json: toPosix(path.join(slice.specFamily, slice.specSlug, 'slices', path.basename(slice.sliceDir), 'slice.json')),
    dependencies,
    parallel_safe: slice.parallel_safe,
    parallel_safe_reason: slice.parallel_safe_reason,
    allowed_write_paths: slice.allowed_write_paths,
    expected_read_paths: slice.expected_read_paths,
    validation_hints: slice.validation_hints,
    files: slice.files,
    evidence: Array.isArray(slice.json?.evidence) ? slice.json.evidence : [],
    tests: Array.isArray(slice.json?.tests) ? slice.json.tests : [],
    blocked_reason: slice.json?.blocked_reason || null,
  };
}

function normalizeRuns(projectRoot) {
  return listAiRuns(projectRoot).map((run) => ({
    run_id: run.run_id,
    status: run.status,
    canonical_status: normalizeStatus('run', run.status, 'draft'),
    phase: run.phase,
    spec_slug: run.spec_slug || null,
    requirement_path: run.requirement?.path || null,
    approvals_path: run.approvals_path || null,
    state_path: toPosix(path.join('.quiver', 'runs', run.run_id, 'state.json')),
    next_command: nextCommandForPhase(run.phase),
    updated_at: run.updated_at || run.created_at || null,
  }));
}

function safeReadApproval(projectRoot, phase) {
  try {
    return readPhaseApproval(projectRoot, phase);
  } catch (error) {
    return {
      phase,
      status: 'invalid',
      draft: null,
      approved: null,
      meta: null,
      error: error.message,
    };
  }
}

function safeReadPlanReview(projectRoot) {
  try {
    return readPlanReview(projectRoot);
  } catch (error) {
    return {
      status: 'invalid',
      review: null,
      meta: null,
      error: error.message,
    };
  }
}

function normalizeApproval(projectRoot, phase, approval) {
  const drafts = Array.isArray(approval?.meta?.drafts) ? approval.meta.drafts : [];
  return {
    phase,
    status: approval?.status || 'missing',
    canonical_status: normalizeStatus('approval', approval?.status || 'missing', 'pending'),
    draft_path: approval?.draft?.path || null,
    approved_path: approval?.approved?.path || null,
    latest_draft_version: Number(approval?.meta?.draft?.version || 0) || null,
    approved_version: Number(approval?.meta?.approved?.version || 0) || null,
    draft_count: drafts.length,
    source_file: approval?.meta?.approved?.source_file || approval?.meta?.draft?.source_file || null,
    error: approval?.error || null,
  };
}

function normalizeApprovals(projectRoot) {
  const plannerApprovals = PLANNER_APPROVAL_PHASES.map((phase) => normalizeApproval(projectRoot, phase, safeReadApproval(projectRoot, phase)));
  const planReview = safeReadPlanReview(projectRoot);

  return plannerApprovals.concat({
    phase: 'plan-review',
    status: planReview.status || 'missing',
    canonical_status: normalizeStatus('approval', planReview.status || 'missing', 'pending'),
    draft_path: null,
    approved_path: planReview.review?.path || null,
    latest_draft_version: Number(planReview.meta?.source_version || 0) || null,
    approved_version: null,
    draft_count: 0,
    source_file: planReview.meta?.source_file || null,
    error: planReview.error || null,
  });
}

function normalizeAgents(projectRoot) {
  return listAgentProfiles(projectRoot).map((item) => ({
    role: item.role,
    status: 'idle',
    canonical_status: normalizeStatus('agent', 'idle', 'idle'),
    configured: item.configured,
    provider: item.profile?.provider || null,
    model: item.profile?.model || null,
    label: item.profile?.label || null,
    context: item.profile?.context || null,
    updated_at: item.profile?.updated_at || null,
  }));
}

function collectEvidenceEntries(slices) {
  return (Array.isArray(slices) ? slices : [])
    .flatMap((slice) => {
      const evidence = Array.isArray(slice.json?.evidence) ? slice.json.evidence : [];
      return evidence.map((item, index) => ({
        slice_ref: slice.ref,
        index,
        value: item,
      }));
    })
    .sort((left, right) => left.slice_ref.localeCompare(right.slice_ref) || left.index - right.index);
}

function countByStatus(items, statusKey = 'canonical_status') {
  return (Array.isArray(items) ? items : []).reduce((acc, item) => {
    const key = item?.[statusKey] || item?.status || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function collectWarnings({ graph, layout, specs, slices }) {
  const warnings = [];

  if (!graph.ok && graph.error?.message) {
    warnings.push({
      code: graph.error.code || 'GRAPH_ERROR',
      message: graph.error.message,
    });
  }

  if (layout.layout === 'legacy' || layout.layout === 'hybrid' || layout.layout === 'incomplete') {
    warnings.push({
      code: 'LAYOUT_REQUIRES_ATTENTION',
      message: layout.recommendations.join(' '),
    });
  }

  if (specs.length === 0) {
    warnings.push({
      code: 'NO_SPECS_FOUND',
      message: 'No specs were found for the selected export filters.',
    });
  }

  if (slices.length === 0) {
    warnings.push({
      code: 'NO_SLICES_FOUND',
      message: 'No slices were found for the selected export filters.',
    });
  }

  return warnings;
}

function collectNextSteps(data) {
  const activeRun = [...data.runs].reverse().find((run) => run.status !== 'closed');
  const commands = [];
  const firstSpec = data.specs[0] || null;
  const firstSlice = data.slices[0] || null;
  const activeRunWantsSpecCreate = Boolean(activeRun?.next_command && activeRun.next_command.includes('spec create'));

  if (activeRun && activeRunWantsSpecCreate && firstSpec) {
    commands.push({
      id: 'validate-existing-spec',
      command: `npx create-quiver spec validate ${firstSpec.path}`,
      reason: `A spec already exists while run ${activeRun.run_id} points to spec creation.`,
    });
    commands.push({
      id: 'find-ready-slice',
      command: 'npx create-quiver next --all-ready',
      reason: 'Find ready slices before creating another spec.',
    });
    if (firstSlice?.slice_json) {
      commands.push({
        id: 'prompt-existing-slice',
        command: `npx create-quiver ai prompt-slice --slice ${firstSlice.slice_json}`,
        reason: 'Prepare a minimal executor prompt for the existing spec.',
      });
    }
  } else {
    commands.push({
      id: activeRun ? 'continue-active-run' : 'create-ai-run',
      command: activeRun ? activeRun.next_command : 'npx create-quiver ai run create --input <requirements.md>',
      reason: activeRun ? `Continue AI run ${activeRun.run_id}.` : 'Start a new AI lifecycle run.',
    });
  }

  if (data.summary.slices > 0) {
    if (data.active_slice?.reconciliation?.decision && data.active_slice.reconciliation.decision !== 'preserve') {
      commands.push({
        id: 'reconcile-active-slice',
        command: 'npx create-quiver ai active-slice reconcile --dry-run',
        reason: 'Review active-slice state before assigning more execution work.',
      });
    }
    commands.push({
      id: 'inspect-slices',
      command: 'npx create-quiver ai slices list',
      reason: 'Inspect current slice state.',
    });
    commands.push({
      id: 'export-json',
      command: 'npx create-quiver ai export --format json',
      reason: 'Export machine-readable lifecycle state.',
    });
  } else {
    commands.push({
      id: 'draft-acceptance',
      command: 'npx create-quiver ai plan --phase acceptance --input <requirements.md> --dry-run',
      reason: 'Preview acceptance criteria generation.',
    });
  }

  if (data.migration.layout === 'legacy' || data.migration.layout === 'hybrid' || data.migration.layout === 'incomplete') {
    commands.push({
      id: 'preview-migration',
      command: 'npx create-quiver migrate --dry-run',
      reason: 'Preview migration to the current layout.',
    });
  }

  return commands;
}

function collectLifecycleExport(projectRoot, options = {}) {
  const state = resolveProjectState(projectRoot, {
    allowGraphErrors: true,
    specSlug: options.specSlug,
  });
  const allSlices = state.graph.nodes;
  const slices = filterSlicesForExecution(allSlices, {
    includeCompleted: options.includeCompleted === true,
  });
  const fullGraph = buildGraphSummary(state.graph);
  const selectedRefs = new Set(slices.map((slice) => slice.ref));
  const graph = filterGraphSummary(fullGraph, selectedRefs);
  if (graph.ok) {
    graph.conflicts = detectFileConflicts(slices).map((conflict) => ({
      files: conflict.files,
      slices: conflict.slices,
    }));
  }
  const dependencyMap = new Map(fullGraph.nodes.map((node) => [node.ref, node.depends_on || node.dependencies || []]));
  const normalizedSlices = slices.map((slice) => normalizeSlice(projectRoot, slice, dependencyMap));
  const specs = groupSlicesBySpec(slices).map((spec) => {
    const progress = summarizeProgress(spec.slices);
    const specPath = path.join(spec.specFamily, spec.specSlug);
    return {
      slug: spec.specSlug,
      family: spec.specFamily,
      path: specPath,
      spec_path: fs.existsSync(path.join(projectRoot, specPath, 'SPEC.md')) ? toPosix(path.join(specPath, 'SPEC.md')) : null,
      status_path: fs.existsSync(path.join(projectRoot, specPath, 'STATUS.md')) ? toPosix(path.join(specPath, 'STATUS.md')) : null,
      pr_path: fs.existsSync(path.join(projectRoot, specPath, 'pr.md')) ? toPosix(path.join(specPath, 'pr.md')) : null,
      status: spec.status || statusForSpec(spec.slices),
      canonical_status: spec.canonical_status || normalizeStatus('spec', spec.status || statusForSpec(spec.slices), 'planned'),
      progress,
      slices: spec.slices.map((slice) => slice.ref),
      blockers: spec.slices.filter((slice) => isBlockedStatus(slice)).map((slice) => ({
        ref: slice.ref,
        reason: slice.json?.blocked_reason || 'blocked',
      })),
    };
  });
  const layout = collectLayoutReport(projectRoot);
  const runs = normalizeRuns(projectRoot);
  const agents = normalizeAgents(projectRoot);
  const approvals = normalizeApprovals(projectRoot);
  const progress = summarizeProgress(slices);
  const evidence = collectEvidenceEntries(slices);
  const activeSlice = collectActiveSliceState(projectRoot, { slices: allSlices });
  const blockers = normalizedSlices
    .filter((slice) => slice.blocked_reason || String(slice.status).toLowerCase() === 'blocked')
    .map((slice) => ({ ref: slice.ref, reason: slice.blocked_reason || 'blocked' }));

  if (!graph.ok) {
    blockers.push({ ref: 'slice-graph', reason: graph.error.message });
  }
  if (layout.layout === 'legacy' || layout.layout === 'hybrid' || layout.layout === 'incomplete') {
    blockers.push({ ref: 'migration', reason: layout.recommendations.join(' ') });
  }
  if (activeSlice.reconciliation.decision === 'blocked') {
    blockers.push({ ref: 'active-slice', reason: activeSlice.reconciliation.reason });
  }

  const exportData = {
    schema_version: EXPORT_SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    source_metadata: {
      generator: 'create-quiver',
      command: 'ai export',
      resolver: 'project-state-resolver',
      project_root_name: path.basename(projectRoot),
      include_completed: options.includeCompleted === true,
      spec_filter: options.specSlug || null,
      families: Array.from(new Set(allSlices.map((slice) => slice.specFamily))).sort((left, right) => left.localeCompare(right)),
    },
    project: readPackageSummary(projectRoot),
    summary: {
      specs: specs.length,
      slices: progress.total,
      completed_slices: progress.completed,
      open_slices: progress.open,
      blocked_slices: progress.blocked,
      progress_percent: progress.percent,
      runs: runs.length,
      configured_agents: agents.filter((agent) => agent.configured).length,
      approvals: approvals.length,
      active_slice_sources: activeSlice.sources.length,
      warnings: 0,
    },
    agents,
    approvals,
    runs,
    specs,
    slices: normalizedSlices,
    graph: {
      ok: graph.ok,
      edges: graph.edges,
      levels: graph.levels,
      conflicts: graph.conflicts,
      error: graph.error,
    },
    migration: {
      layout: layout.layout,
      has_new_layout: layout.hasNewLayout,
      has_legacy_layout: layout.hasLegacyLayout,
      legacy_signals: layout.legacySignals,
      missing_new_layout_files: layout.missingNewLayoutFiles,
      recommendations: layout.recommendations,
      dry_run_command: 'npx create-quiver migrate --dry-run',
    },
    evidence,
    active_slice: activeSlice,
    warnings: [],
    blockers,
    next_steps: [],
    lifecycle: {
      phase: runs.length > 0 ? runs[runs.length - 1].phase : 'no-active-run',
      active_run_id: (runs.length > 0 ? [...runs].reverse().find((run) => run.status !== 'closed') : null)?.run_id || null,
      include_completed: options.includeCompleted === true,
      spec_filter: options.specSlug || null,
      levels: graph.levels,
    },
    aggregates: {
      specs_by_status: countByStatus(specs),
      slices_by_status: countByStatus(normalizedSlices),
      runs_by_status: countByStatus(runs),
      approvals_by_status: countByStatus(approvals),
      blockers: blockers.length,
      evidence: evidence.length,
      progress_percent: progress.percent,
    },
    dashboard: {
      progress,
      blockers,
      agents: agents.map((agent) => ({
        id: agent.role,
        role: agent.role,
        configured: agent.configured,
        provider: agent.provider,
      })),
      specs: specs.map((spec) => ({
        id: spec.slug,
        status: spec.status,
        progress: spec.progress.percent,
        slice_count: spec.progress.total,
        blockers: spec.blockers,
      })),
      slices: normalizedSlices.map((slice) => ({
        id: slice.ref,
        status: slice.status,
        progress: slice.progress,
        dependencies: slice.dependencies,
        blocker: slice.blocked_reason,
      })),
      dependencies: graph.edges,
      active_slice: activeSlice,
    },
  };

  exportData.warnings = collectWarnings({
    graph,
    layout,
    specs,
    slices: normalizedSlices,
  });
  exportData.summary.warnings = exportData.warnings.length;
  exportData.next_steps = collectNextSteps(exportData);
  exportData.lifecycle.next_commands = exportData.next_steps.map((step) => step.command);

  return exportData;
}

function formatLifecycleInspect(data) {
  const lines = [
    'Quiver lifecycle inspect',
    `Project: ${data.project.name}`,
    `Specs: ${data.summary.specs}`,
    `Slices: ${data.summary.slices} total, ${data.summary.open_slices} open, ${data.summary.blocked_slices} blocked, ${data.summary.progress_percent}% done`,
    `Runs: ${data.summary.runs}`,
    `Agents configured: ${data.summary.configured_agents}/${data.agents.length}`,
    `Layout: ${data.migration.layout}`,
    '',
    'Next safe commands',
  ];

  for (const step of data.next_steps || collectNextSteps(data)) {
    lines.push(`- ${step.command}`);
  }

  if (data.active_slice) {
    lines.push(
      '',
      'Active slice state',
      `- Sources: ${data.active_slice.sources.length}`,
      `- Reconciliation: ${data.active_slice.reconciliation.decision} (${data.active_slice.reconciliation.reason})`,
    );
  }

  if (data.dashboard.blockers.length > 0) {
    lines.push('', 'Blockers');
    for (const blocker of data.dashboard.blockers) {
      lines.push(`- ${blocker.ref}: ${blocker.reason}`);
    }
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}

function formatSpecsList(data) {
  const lines = ['Quiver specs list'];

  if (data.specs.length === 0) {
    lines.push('- No specs found. Next: npx create-quiver spec create --dry-run');
    lines.push('');
    return `${lines.join('\n')}\n`;
  }

  for (const spec of data.specs) {
    lines.push(`- ${spec.slug}: ${spec.status}, ${spec.progress.percent}% done, ${spec.progress.total} slices (${spec.path})`);
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}

function formatSlicesList(data) {
  const lines = ['Quiver slices list'];

  if (data.slices.length === 0) {
    lines.push('- No slices found. Next: npx create-quiver spec create --dry-run');
    lines.push('');
    return `${lines.join('\n')}\n`;
  }

  for (const slice of data.slices) {
    const deps = slice.dependencies.length > 0 ? ` deps=${slice.dependencies.join(',')}` : '';
    const blocked = slice.blocked_reason ? ` blocked=${slice.blocked_reason}` : '';
    lines.push(`- ${slice.ref}: ${slice.status}, ${slice.progress}% done${deps}${blocked}`);
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}

function formatTraceReport(data) {
  const lines = [
    'Quiver trace report',
    `Project: ${data.project.name}`,
    `Schema: ${data.schema_version}`,
    '',
    'Runs',
  ];

  if (data.runs.length === 0) {
    lines.push('- none');
  } else {
    for (const run of data.runs) {
      lines.push(`- ${run.run_id}: ${run.phase} (${run.status}) -> ${run.next_command}`);
    }
  }

  lines.push('', 'Execution waves');
  if (!data.graph.ok) {
    lines.push(`- graph error: ${data.graph.error.message}`);
  } else if (data.graph.levels.length === 0) {
    lines.push('- none');
  } else {
    for (const level of data.graph.levels) {
      lines.push(`- wave ${level.level}: ${level.slices.join(', ')}`);
    }
  }

  lines.push('', 'Migration');
  lines.push(`- layout: ${data.migration.layout}`);
  for (const recommendation of data.migration.recommendations) {
    lines.push(`- ${recommendation}`);
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}

function formatLifecycleExportMarkdown(data) {
  const lines = [
    '# Quiver Lifecycle Export',
    '',
    `- Project: ${data.project.name}`,
    `- Generated: ${data.generated_at}`,
    `- Schema version: ${data.schema_version}`,
    `- Specs: ${data.summary.specs}`,
    `- Slices: ${data.summary.slices} total, ${data.summary.completed_slices} completed, ${data.summary.open_slices} open`,
    `- Progress: ${data.summary.progress_percent}%`,
    `- Layout: ${data.migration.layout}`,
    '',
    '## Specs',
    '',
  ];

  if (data.specs.length === 0) {
    lines.push('No specs found.');
  } else {
    lines.push('| Spec | Status | Progress | Slices | Path |');
    lines.push('|---|---|---:|---:|---|');
    for (const spec of data.specs) {
      lines.push(`| ${spec.slug} | ${spec.status} | ${spec.progress.percent}% | ${spec.progress.total} | ${spec.path} |`);
    }
  }

  lines.push('', '## Slices', '');
  if (data.slices.length === 0) {
    lines.push('No slices found.');
  } else {
    lines.push('| Slice | Status | Progress | Dependencies | Write Scope |');
    lines.push('|---|---|---:|---|---|');
    for (const slice of data.slices) {
      lines.push(`| ${slice.ref} | ${slice.status} | ${slice.progress}% | ${slice.dependencies.join(', ') || '-'} | ${slice.allowed_write_paths.join(', ') || slice.files.join(', ') || '-'} |`);
    }
  }

  lines.push('', '## Agents', '');
  if (data.agents.length === 0) {
    lines.push('No agent roles available.');
  } else {
    lines.push('| Role | Configured | Provider | Model |');
    lines.push('|---|---|---|---|');
    for (const agent of data.agents) {
      lines.push(`| ${agent.role} | ${agent.configured ? 'yes' : 'no'} | ${agent.provider || '-'} | ${agent.model || '-'} |`);
    }
  }

  lines.push('', '## Runs', '');
  if (data.runs.length === 0) {
    lines.push('No AI runs found.');
  } else {
    lines.push('| Run | Phase | Status | Next Command |');
    lines.push('|---|---|---|---|');
    for (const run of data.runs) {
      lines.push(`| ${run.run_id} | ${run.phase} | ${run.status} | \`${run.next_command}\` |`);
    }
  }

  lines.push('', '## Migration', '');
  lines.push(`- Layout: ${data.migration.layout}`);
  for (const recommendation of data.migration.recommendations) {
    lines.push(`- ${recommendation}`);
  }
  lines.push(`- Dry-run: \`${data.migration.dry_run_command}\``);
  lines.push('');

  return `${lines.join('\n')}\n`;
}

module.exports = {
  EXPORT_SCHEMA_VERSION,
  collectLifecycleExport,
  formatLifecycleExportMarkdown,
  formatLifecycleInspect,
  formatSlicesList,
  formatSpecsList,
  formatTraceReport,
};
