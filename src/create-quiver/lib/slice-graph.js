/**
 * Slice graph library.
 *
 * API:
 * - readAllSlices(rootDir): collect every slice.json under specs/ and specs-fix/
 * - inferDependencies(slices): normalize declared deps and infer missing ones
 * - buildGraph(slices): build a node/edge graph with cycle discovery
 * - topoSort(graph): return slices in dependency order
 * - computeLevels(graph): group slices into parallel-ready levels
 * - detectFileConflicts(levelSlices): group same-level slices that overlap on files[]
 */
const fs = require('fs');
const path = require('path');
const { parseJsonWithComments } = require('./json');

class SliceGraphError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'SliceGraphError';
    this.code = code || 'SLICE_GRAPH_ERROR';
  }
}

function isPlaceholderSpecDir(name) {
  return name.startsWith('[') && name.endsWith(']');
}

function isPlaceholderSliceDir(name) {
  return name === 'slice-template' || name.startsWith('slice-template-');
}

function naturalNumberFromSliceId(sliceId) {
  const match = String(sliceId || '').match(/^slice-(\d+)/);
  return match ? Number.parseInt(match[1], 10) : Number.POSITIVE_INFINITY;
}

function isFoundationSliceId(sliceId) {
  return naturalNumberFromSliceId(sliceId) === 0;
}

function compareSliceRefs(a, b) {
  const left = String(a || '');
  const right = String(b || '');
  const leftSlash = left.indexOf('/');
  const rightSlash = right.indexOf('/');
  const leftSpec = leftSlash === -1 ? left : left.slice(0, leftSlash);
  const rightSpec = rightSlash === -1 ? right : right.slice(0, rightSlash);

  if (leftSpec !== rightSpec) {
    return leftSpec.localeCompare(rightSpec);
  }

  const leftSliceId = leftSlash === -1 ? '' : left.slice(leftSlash + 1);
  const rightSliceId = rightSlash === -1 ? '' : right.slice(rightSlash + 1);
  const leftNumber = naturalNumberFromSliceId(leftSliceId);
  const rightNumber = naturalNumberFromSliceId(rightSliceId);

  if (leftNumber !== rightNumber) {
    return leftNumber - rightNumber;
  }

  return leftSliceId.localeCompare(rightSliceId);
}

function sortFileList(files) {
  return Array.from(new Set((Array.isArray(files) ? files : []).map((file) => String(file)).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function resolveWriteScope(json) {
  const allowedWritePaths = sortFileList(json?.allowed_write_paths);
  if (allowedWritePaths.length > 0) {
    return allowedWritePaths;
  }

  return sortFileList(json?.files);
}

function normalizeDependencyRef(slice, dependency) {
  const dep = String(dependency || '').trim();
  if (!dep) {
    return null;
  }

  if (dep.includes('/')) {
    // Valid slice ref: the segment after the first slash must start with "slice-".
    // Entries like "docs/root-first-docs-flow" are legacy branch-name artifacts; drop silently.
    const afterSlash = dep.slice(dep.indexOf('/') + 1);
    if (!afterSlash.startsWith('slice-')) {
      return null;
    }
    return dep;
  }

  if (!slice || !slice.specSlug) {
    return dep;
  }

  // Legacy bare spec names (e.g. "quiver-v01") have no "slice-" prefix.
  // They are spec-level refs already completed; drop them silently.
  if (!dep.startsWith('slice-')) {
    return null;
  }

  return `${slice.specSlug}/${dep}`;
}

function readAllSlices(rootDir) {
  const roots = ['specs', 'specs-fix'];
  const slices = [];

  for (const rootName of roots) {
    const rootPath = path.join(rootDir, rootName);
    if (!fs.existsSync(rootPath)) {
      continue;
    }

    for (const specEntry of fs.readdirSync(rootPath, { withFileTypes: true })) {
      if (!specEntry.isDirectory() || isPlaceholderSpecDir(specEntry.name)) {
        continue;
      }

      const specSlug = specEntry.name;
      const slicesDir = path.join(rootPath, specSlug, 'slices');
      if (!fs.existsSync(slicesDir)) {
        continue;
      }

      for (const sliceEntry of fs.readdirSync(slicesDir, { withFileTypes: true })) {
        if (!sliceEntry.isDirectory() || isPlaceholderSliceDir(sliceEntry.name)) {
          continue;
        }

        const sliceDir = path.join(slicesDir, sliceEntry.name);
        const slicePath = path.join(sliceDir, 'slice.json');
        if (!fs.existsSync(slicePath)) {
          continue;
        }

        const json = parseJsonWithComments(fs.readFileSync(slicePath, 'utf8'));
        const sliceId = String(json.slice_id || sliceEntry.name).trim();
        const ref = `${specSlug}/${sliceId}`;
        slices.push({
          ref,
          specFamily: rootName,
          specSlug,
          sliceId,
          slicePath,
          sliceDir,
          files: resolveWriteScope(json),
          expected_read_paths: sortFileList(json.expected_read_paths),
          allowed_write_paths: sortFileList(json.allowed_write_paths),
          validation_hints: sortFileList(json.validation_hints),
          dependencies: Array.isArray(json.dependencies) ? json.dependencies.map((item) => String(item).trim()).filter(Boolean) : [],
          depends_on: Array.isArray(json.depends_on) ? json.depends_on.map((item) => String(item).trim()).filter(Boolean) : [],
          parallel_safe: typeof json.parallel_safe === 'string' ? json.parallel_safe : null,
          parallel_safe_reason: typeof json.parallel_safe_reason === 'string' ? json.parallel_safe_reason : null,
          status: typeof json.status === 'string' ? json.status : 'draft',
          ticket: typeof json.ticket === 'string' ? json.ticket : '',
          title: typeof json.title === 'string' ? json.title : sliceId,
          json,
        });
      }
    }
  }

  slices.sort((left, right) => compareSliceRefs(left.ref, right.ref));
  return slices;
}

function normalizeDeclaredDependencies(slice, raw) {
  return Array.isArray(raw) ? raw.map((dep) => normalizeDependencyRef(slice, dep)).filter(Boolean) : [];
}

function declaredDependenciesForSlice(slice) {
  if (slice?.json && Object.prototype.hasOwnProperty.call(slice.json, 'depends_on')) {
    return normalizeDeclaredDependencies(slice, slice.json.depends_on);
  }

  if (slice?.json && Object.prototype.hasOwnProperty.call(slice.json, 'dependencies')) {
    return normalizeDeclaredDependencies(slice, slice.json.dependencies);
  }

  return null;
}

function inferDependencies(slices) {
  const bySpec = new Map();
  const normalized = slices.map((slice) => ({
    ...slice,
    files: sortFileList(slice.files),
    depends_on: [],
  }));

  for (const slice of normalized) {
    const specKey = slice.specSlug || '';
    if (!bySpec.has(specKey)) {
      bySpec.set(specKey, []);
    }
    bySpec.get(specKey).push(slice);
  }

  for (const specSlices of bySpec.values()) {
    specSlices.sort((left, right) => naturalNumberFromSliceId(left.sliceId) - naturalNumberFromSliceId(right.sliceId) || left.sliceId.localeCompare(right.sliceId));
    const sliceByRef = new Map(specSlices.map((slice) => [slice.ref, slice]));

    for (const slice of specSlices) {
      const explicit = declaredDependenciesForSlice(slice);
      if (explicit !== null) {
        slice.depends_on = Array.from(new Set(explicit)).sort(compareSliceRefs);
        continue;
      }

      const deps = [];
      for (const candidate of specSlices) {
        if (candidate.ref === slice.ref) {
          continue;
        }
        if (naturalNumberFromSliceId(candidate.sliceId) >= naturalNumberFromSliceId(slice.sliceId)) {
          continue;
        }
        const overlap = candidate.files.filter((file) => slice.files.includes(file));
        if (overlap.length > 0) {
          deps.push(candidate.ref);
        }
      }

      slice.depends_on = Array.from(new Set(deps)).sort(compareSliceRefs);
    }

    for (const slice of specSlices) {
      slice.depends_on = slice.depends_on.filter((dep) => sliceByRef.has(dep) || dep.includes('/'));
    }
  }

  normalized.sort((left, right) => compareSliceRefs(left.ref, right.ref));
  return normalized;
}

function buildGraph(slices) {
  const normalized = inferDependencies(slices);
  const nodes = normalized.map((slice) => ({
    ...slice,
    depends_on: Array.from(new Set(slice.depends_on)).sort(compareSliceRefs),
  }));
  const nodeByRef = new Map(nodes.map((node) => [node.ref, node]));
  const edges = [];
  const missing = [];

  for (const node of nodes) {
    for (const dep of node.depends_on) {
      if (!nodeByRef.has(dep)) {
        missing.push({ from: node.ref, to: dep });
        continue;
      }
      edges.push({ from: dep, to: node.ref });
    }
  }

  if (missing.length > 0) {
    const details = missing.map((edge) => `${edge.from} -> ${edge.to}`).join(', ');
    throw new SliceGraphError(`Missing dependency reference(s): ${details}`, 'MISSING_DEPENDENCY');
  }

  return {
    nodes,
    edges: edges.sort((left, right) => compareSliceRefs(left.from, right.from) || compareSliceRefs(left.to, right.to)),
    cycles: findCycles(nodes, edges),
  };
}

function findCycles(nodes, edges) {
  const adjacency = new Map(nodes.map((node) => [node.ref, []]));
  for (const edge of edges) {
    adjacency.get(edge.from)?.push(edge.to);
  }

  const visiting = new Set();
  const visited = new Set();
  const stack = [];
  const cycles = [];
  const recorded = new Set();

  function visit(ref) {
    if (visited.has(ref)) {
      return;
    }

    if (visiting.has(ref)) {
      const start = stack.indexOf(ref);
      if (start !== -1) {
        const cycle = [...stack.slice(start), ref];
        const key = cycle.join('>');
        if (!recorded.has(key)) {
          recorded.add(key);
          cycles.push(cycle);
        }
      }
      return;
    }

    visiting.add(ref);
    stack.push(ref);

    for (const next of adjacency.get(ref) || []) {
      visit(next);
    }

    stack.pop();
    visiting.delete(ref);
    visited.add(ref);
  }

  for (const node of nodes) {
    visit(node.ref);
  }

  cycles.sort((left, right) => left.join('>').localeCompare(right.join('>')));
  return cycles;
}

function topoSort(graph) {
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph?.edges) ? graph.edges : [];
  const nodeByRef = new Map(nodes.map((node) => [node.ref, node]));
  const incoming = new Map(nodes.map((node) => [node.ref, 0]));
  const outgoing = new Map(nodes.map((node) => [node.ref, []]));

  for (const edge of edges) {
    if (!nodeByRef.has(edge.from) || !nodeByRef.has(edge.to)) {
      continue;
    }
    incoming.set(edge.to, (incoming.get(edge.to) || 0) + 1);
    outgoing.get(edge.from).push(edge.to);
  }

  const queue = nodes
    .filter((node) => (incoming.get(node.ref) || 0) === 0)
    .map((node) => node.ref)
    .sort(compareSliceRefs);

  const ordered = [];
  const nextQueue = queue.slice();

  while (nextQueue.length > 0) {
    const current = nextQueue.shift();
    ordered.push(nodeByRef.get(current));

    for (const neighbor of outgoing.get(current) || []) {
      incoming.set(neighbor, (incoming.get(neighbor) || 0) - 1);
      if (incoming.get(neighbor) === 0) {
        nextQueue.push(neighbor);
        nextQueue.sort(compareSliceRefs);
      }
    }
  }

  if (ordered.length !== nodes.length) {
    const cycles = Array.isArray(graph?.cycles) && graph.cycles.length > 0 ? graph.cycles : findCycles(nodes, edges);
    const cycle = cycles[0] || [];
    const message = cycle.length > 0
      ? `Slice graph contains a cycle: ${cycle.join(' -> ')}`
      : 'Slice graph contains a cycle.';
    throw new SliceGraphError(message, 'CYCLE_DETECTED');
  }

  return ordered;
}

function computeLevels(graph) {
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph?.edges) ? graph.edges : [];
  const nodeByRef = new Map(nodes.map((node) => [node.ref, node]));
  const incoming = new Map(nodes.map((node) => [node.ref, 0]));
  const outgoing = new Map(nodes.map((node) => [node.ref, []]));

  for (const edge of edges) {
    if (!nodeByRef.has(edge.from) || !nodeByRef.has(edge.to)) {
      continue;
    }
    incoming.set(edge.to, (incoming.get(edge.to) || 0) + 1);
    outgoing.get(edge.from).push(edge.to);
  }

  const remaining = new Set(nodes.map((node) => node.ref));
  const levels = [];

  while (remaining.size > 0) {
    const currentLevel = Array.from(remaining)
      .filter((ref) => (incoming.get(ref) || 0) === 0)
      .sort(compareSliceRefs);

    if (currentLevel.length === 0) {
      const cycles = Array.isArray(graph?.cycles) && graph.cycles.length > 0 ? graph.cycles : findCycles(nodes, edges);
      const cycle = cycles[0] || [];
      const message = cycle.length > 0
        ? `Slice graph contains a cycle: ${cycle.join(' -> ')}`
        : 'Slice graph contains a cycle.';
      throw new SliceGraphError(message, 'CYCLE_DETECTED');
    }

    levels.push(currentLevel.map((ref) => nodeByRef.get(ref)));

    for (const ref of currentLevel) {
      remaining.delete(ref);
      for (const neighbor of outgoing.get(ref) || []) {
        incoming.set(neighbor, (incoming.get(neighbor) || 0) - 1);
      }
    }
  }

  return levels;
}

function detectFileConflicts(slicesInLevel) {
  const slices = Array.isArray(slicesInLevel) ? slicesInLevel.map((slice) => ({
    ...slice,
    files: sortFileList(slice.files),
  })) : [];
  const visited = new Set();
  const groups = [];

  for (let index = 0; index < slices.length; index += 1) {
    const start = slices[index];
    if (visited.has(start.ref)) {
      continue;
    }

    const queue = [start];
    const component = [];
    visited.add(start.ref);

    while (queue.length > 0) {
      const current = queue.shift();
      component.push(current);

      for (const candidate of slices) {
        if (visited.has(candidate.ref) || candidate.ref === current.ref) {
          continue;
        }

        const overlap = current.files.filter((file) => candidate.files.includes(file));
        if (overlap.length > 0) {
          visited.add(candidate.ref);
          queue.push(candidate);
        }
      }
    }

    if (component.length > 1) {
      const files = Array.from(new Set(component.flatMap((slice) => slice.files))).sort((left, right) => left.localeCompare(right));
      groups.push({
        files,
        slices: component.map((slice) => slice.ref).sort(compareSliceRefs),
      });
    }
  }

  groups.sort((left, right) => left.slices.join('>').localeCompare(right.slices.join('>')));
  return groups;
}

module.exports = {
  SliceGraphError,
  buildGraph,
  computeLevels,
  detectFileConflicts,
  inferDependencies,
  isFoundationSliceId,
  normalizeDeclaredDependencies,
  normalizeDependencyRef,
  readAllSlices,
  naturalNumberFromSliceId,
  resolveWriteScope,
  topoSort,
};
