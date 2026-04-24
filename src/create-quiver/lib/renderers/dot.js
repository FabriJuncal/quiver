function escapeDotLabel(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, '\\n');
}

function toConflictMap(conflicts) {
  const map = new Map();

  for (const conflict of Array.isArray(conflicts) ? conflicts : []) {
    for (const ref of Array.isArray(conflict.slices) ? conflict.slices : []) {
      map.set(ref, {
        files: Array.isArray(conflict.files) ? conflict.files : [],
        slices: Array.isArray(conflict.slices) ? conflict.slices : [],
      });
    }
  }

  return map;
}

function flattenVisibleNodes(report) {
  const nodes = [];

  for (const level of Array.isArray(report.levels) ? report.levels : []) {
    for (const node of Array.isArray(level) ? level : []) {
      nodes.push(node);
    }
  }

  nodes.sort((left, right) => String(left.ref || '').localeCompare(String(right.ref || '')));
  return nodes;
}

function buildNodeIds(nodes) {
  const used = new Set();
  const ids = new Map();

  for (const node of nodes) {
    const base = `n_${String(node.ref || '').replace(/[^a-zA-Z0-9_]/g, '_') || 'slice'}`;
    let candidate = base;
    let suffix = 2;

    while (used.has(candidate)) {
      candidate = `${base}_${suffix}`;
      suffix += 1;
    }

    used.add(candidate);
    ids.set(node.ref, candidate);
  }

  return ids;
}

function buildLabel(node, conflict, options = {}) {
  const parts = [];
  const conflictPrefix = conflict ? (options.unicode ? '⚠ ' : '! ') : '';
  parts.push(`${conflictPrefix}${node.ref}`);

  if (node.title && node.title !== node.slice_id && node.title !== node.ref) {
    parts.push(node.title);
  }

  if (typeof node.hours === 'number') {
    parts.push(`${node.hours}h`);
  }

  if (node.status) {
    parts.push(`[${node.status}]`);
  }

  if (options.showConflicts && conflict && Array.isArray(conflict.files) && conflict.files.length > 0) {
    parts.push(`Files: ${conflict.files.join(', ')}`);
  }

  return escapeDotLabel(parts.join('\n'));
}

function renderDotGraph(report, options = {}) {
  const nodes = flattenVisibleNodes(report);
  if (nodes.length === 0) {
    return 'digraph QuiverGraph {\n  // No pending slices found.\n}\n';
  }

  const nodeIds = buildNodeIds(nodes);
  const nodeRefs = new Set(nodes.map((node) => node.ref));
  const conflictMap = toConflictMap(report.conflicts);
  const lines = [
    'digraph QuiverGraph {',
    '  rankdir=TB;',
    '  node [shape=box, style="rounded,filled", fillcolor="#f8f9fa", color="#495057", fontname="Helvetica"];',
    '  edge [color="#6c757d"];',
  ];

  for (const node of nodes) {
    const conflict = conflictMap.get(node.ref);
    const id = nodeIds.get(node.ref);
    const label = buildLabel(node, conflict, options);
    const attrs = [`label="${label}"`];

    if (conflict) {
      attrs.push(`fillcolor="${options.showConflicts ? '#fff3cd' : '#f8f9fa'}"`);
      attrs.push(`color="${options.showConflicts ? '#d39e00' : '#495057'}"`);
    }

    lines.push(`  ${id} [${attrs.join(', ')}];`);
  }

  for (const node of nodes) {
    const targetId = nodeIds.get(node.ref);
    const deps = Array.isArray(node.depends_on) ? node.depends_on : [];
    for (const dep of deps) {
      if (!nodeRefs.has(dep)) {
        continue;
      }
      const sourceId = nodeIds.get(dep);
      lines.push(`  ${sourceId} -> ${targetId};`);
    }
  }

  lines.push('}');
  return `${lines.join('\n')}\n`;
}

module.exports = {
  renderDotGraph,
};
