const fs = require('node:fs');
const path = require('node:path');

const { listAgentProfiles } = require('../agent-profiles');
const { collectLayoutReport } = require('../doctor');
const {
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
const { listAiRuns, nextCommandForPhase } = require('./run-state');

const EXPORT_SCHEMA_VERSION = 1;

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
  const progress = summarizeProgress(slices);
  const blockers = normalizedSlices
    .filter((slice) => slice.blocked_reason || String(slice.status).toLowerCase() === 'blocked')
    .map((slice) => ({ ref: slice.ref, reason: slice.blocked_reason || 'blocked' }));

  if (!graph.ok) {
    blockers.push({ ref: 'slice-graph', reason: graph.error.message });
  }
  if (layout.layout === 'legacy' || layout.layout === 'hybrid' || layout.layout === 'incomplete') {
    blockers.push({ ref: 'migration', reason: layout.recommendations.join(' ') });
  }

  return {
    schema_version: EXPORT_SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
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
    },
    agents,
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
    },
  };
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

  const activeRun = [...data.runs].reverse().find((run) => run.status !== 'closed');
  lines.push(`- ${activeRun ? activeRun.next_command : 'npx create-quiver ai run create --input <requirements.md>'}`);

  if (data.summary.slices > 0) {
    lines.push('- npx create-quiver ai slices list');
    lines.push('- npx create-quiver ai export --format json');
  } else {
    lines.push('- npx create-quiver ai plan --phase acceptance --input <requirements.md> --dry-run');
  }

  if (data.migration.layout === 'legacy' || data.migration.layout === 'hybrid' || data.migration.layout === 'incomplete') {
    lines.push('- npx create-quiver migrate --dry-run');
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
