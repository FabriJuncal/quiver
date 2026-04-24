const fs = require('fs');
const path = require('path');
const { relativePosixPath } = require('../lib/paths');
const { buildGraph, readAllSlices, topoSort } = require('../lib/slice-graph');

const EXCLUDED_STATUSES = new Set(['completed', 'skipped', 'cancelled']);

function toHourCount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function compareRefs(left, right) {
  return String(left || '').localeCompare(String(right || ''));
}

function sliceToPlanItem(repoRoot, slice, index, readySet) {
  return {
    index,
    ref: slice.ref,
    spec_family: slice.specFamily || '',
    spec_slug: slice.specSlug,
    slice_id: slice.sliceId,
    slice_path: relativePosixPath(repoRoot, slice.slicePath),
    ticket: slice.ticket || '',
    title: slice.title || slice.sliceId,
    status: slice.status || 'draft',
    hours: toHourCount(slice.json?.estimated_hours),
    files: Array.isArray(slice.files) ? slice.files : [],
    depends_on: Array.isArray(slice.depends_on) ? slice.depends_on : [],
    ready: readySet.has(slice.ref),
  };
}

function buildSubgraph(graph, refs) {
  const refSet = new Set(refs);
  return {
    nodes: graph.nodes.filter((node) => refSet.has(node.ref)),
    edges: graph.edges.filter((edge) => refSet.has(edge.from) && refSet.has(edge.to)),
    cycles: graph.cycles.filter((cycle) => cycle.every((ref) => refSet.has(ref))),
  };
}

function buildReadySet(graph, pendingRefs) {
  const pendingSet = new Set(pendingRefs);
  const incomingCounts = new Map(pendingRefs.map((ref) => [ref, 0]));

  for (const edge of graph.edges) {
    if (!pendingSet.has(edge.from) || !pendingSet.has(edge.to)) {
      continue;
    }
    incomingCounts.set(edge.to, (incomingCounts.get(edge.to) || 0) + 1);
  }

  return new Set(Array.from(incomingCounts.entries()).filter(([, count]) => count === 0).map(([ref]) => ref));
}

function buildCriticalPath(graph, refs) {
  if (refs.length === 0) {
    return [];
  }

  const subgraph = buildSubgraph(graph, refs);
  const ordered = topoSort(subgraph);
  const incoming = new Map(ordered.map((node) => [node.ref, []]));

  for (const edge of subgraph.edges) {
    if (!incoming.has(edge.to)) {
      continue;
    }
    incoming.get(edge.to).push(edge.from);
  }

  const best = new Map();

  for (const node of ordered) {
    const hours = toHourCount(node.json?.estimated_hours);
    const predecessors = incoming.get(node.ref) || [];
    let candidate = {
      hours,
      path: [node.ref],
    };

    for (const pred of predecessors) {
      const prev = best.get(pred);
      if (!prev) {
        continue;
      }
      const nextCandidate = {
        hours: prev.hours + hours,
        path: [...prev.path, node.ref],
      };
      const pathLabel = nextCandidate.path.join('>');
      const bestLabel = candidate.path.join('>');
      if (nextCandidate.hours > candidate.hours || (nextCandidate.hours === candidate.hours && compareRefs(pathLabel, bestLabel) < 0)) {
        candidate = nextCandidate;
      }
    }

    best.set(node.ref, candidate);
  }

  let winner = null;
  for (const node of ordered) {
    const candidate = best.get(node.ref);
    if (!candidate) {
      continue;
    }
    if (!winner || candidate.hours > winner.hours || (candidate.hours === winner.hours && compareRefs(candidate.path.join('>'), winner.path.join('>')) < 0)) {
      winner = candidate;
    }
  }

  return winner ? winner.path : [];
}

function collectPlan(repoRoot, options = {}) {
  const allSlices = readAllSlices(repoRoot);
  const graph = buildGraph(allSlices);
  const topo = topoSort(graph);
  const excluded = EXCLUDED_STATUSES;
  const specSlug = options.specSlug ? String(options.specSlug).trim() : '';

  const pendingRefs = new Set(
    graph.nodes
      .filter((node) => !excluded.has(String(node.status || '').toLowerCase()))
      .map((node) => node.ref),
  );

  const readyRefs = buildReadySet(graph, Array.from(pendingRefs));

  const selectedNodes = topo.filter((node) => {
    if (!pendingRefs.has(node.ref)) {
      return false;
    }
    if (specSlug && node.specSlug !== specSlug) {
      return false;
    }
    return true;
  });

  const readyNodes = selectedNodes.filter((node) => readyRefs.has(node.ref));
  const targetNodes = options.onlyReady ? readyNodes : selectedNodes;
  const criticalPath = buildCriticalPath(graph, targetNodes.map((node) => node.ref));
  const totalHours = targetNodes.reduce((sum, node) => sum + toHourCount(node.json?.estimated_hours), 0);
  const plan = targetNodes.map((node, index) => sliceToPlanItem(repoRoot, node, index + 1, readyRefs));

  return {
    critical_path: criticalPath,
    plan,
    total_hours: totalHours,
  };
}

function formatHumanPlan(report, options = {}) {
  const unicode = Boolean(options.unicode) || /UTF-8/i.test(process.env.LANG || '');
  const title = options.onlyReady ? 'Ready slices' : 'Quiver plan';
  const pathSeparator = unicode ? ' → ' : ' -> ';
  const lines = [title, `Total hours: ${report.total_hours}`, `Critical path: ${report.critical_path.length > 0 ? report.critical_path.join(pathSeparator) : '-'}`, ''];

  if (report.plan.length === 0) {
    lines.push('No pending slices found.');
    return `${lines.join('\n')}\n`;
  }

  const rows = report.plan.map((item) => [
    `[${item.index}]`,
    item.ticket || '-',
    item.ref,
    item.title,
    `${item.hours}`,
    item.status,
  ]);

  const widths = rows[0].map((_, colIndex) => Math.max(
    rows.reduce((max, row) => Math.max(max, row[colIndex].length), 0),
    ['[N]', 'TICKET', 'SPEC/SLICE', 'TITLE', 'HOURS', 'STATUS'][colIndex].length,
  ));

  lines.push(['[N]', 'TICKET', 'SPEC/SLICE', 'TITLE', 'HOURS', 'STATUS'].map((label, index) => label.padEnd(widths[index])).join('  '));
  lines.push(widths.map((width) => '-'.repeat(width)).join('  '));

  for (const row of rows) {
    lines.push(row.map((value, index) => value.padEnd(widths[index])).join('  '));
  }

  return `${lines.join('\n')}\n`;
}

function runPlan(repoRoot, options = {}) {
  const report = collectPlan(repoRoot, options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return report;
  }

  process.stdout.write(formatHumanPlan(report, options));
  return report;
}

module.exports = {
  collectPlan,
  formatHumanPlan,
  runPlan,
};
