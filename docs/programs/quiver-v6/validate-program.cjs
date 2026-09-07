#!/usr/bin/env node
'use strict';

// Documentary validator, not a substitute for product tests or gate evidence.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'program.json'), 'utf8'));
const gates = JSON.parse(fs.readFileSync(path.join(__dirname, 'GATES.json'), 'utf8'));
const errors = [];
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
const check = (ok, message) => { if (!ok) errors.push(message); };
const sourceIds = new Set();
const ownedIds = new Set();
const allSlices = new Map();
const summaries = [];
const hashes = {};

for (const plan of manifest.plans) {
  check(exists(plan.plan_path), `${plan.id}: source plan missing`);
  check(exists(plan.requirement_path), `${plan.id}: requirement missing`);
  if (!exists(plan.plan_path) || !exists(plan.requirement_path)) continue;
  const reqText = read(plan.requirement_path);
  hashes[plan.requirement_path] = crypto.createHash('sha256').update(reqText).digest('hex');
  hashes[plan.plan_path] = crypto.createHash('sha256').update(read(plan.plan_path)).digest('hex');
  const rq = [...reqText.matchAll(/^#### (V\d+-RQ-\d+)\s+([\s\S]*?)(?=\n###|\n---|$)/gm)]
    .map((m) => ({ id: m[1], criterion: m[2].trim() }));
  check(rq.length === plan.required_rqs, `${plan.id}: requirement count changed`);
  for (const { id } of rq) {
    check(!sourceIds.has(id), `duplicate source requirement: ${id}`);
    sourceIds.add(id);
  }
  const specRoot = `specs/${plan.spec}`;
  for (const file of ['SPEC.md', 'STATUS.md', 'EXECUTION_PLAN.md', 'EVIDENCE_REPORT.md', 'pr.md', 'TRACEABILITY.json']) {
    check(exists(`${specRoot}/${file}`), `${plan.id}: missing ${file}`);
  }
  if (!exists(`${specRoot}/slices`) || !exists(`${specRoot}/TRACEABILITY.json`)) continue;
  const trace = JSON.parse(read(`${specRoot}/TRACEABILITY.json`));
  check(trace.plan === `${plan.artifact_id}@${plan.version}`, `${plan.id}: exact plan binding differs`);
  check(trace.requirements.length === rq.length, `${plan.id}: ownership count mismatch`);
  const sliceNames = fs.readdirSync(path.join(root, specRoot, 'slices')).sort();
  const local = new Set();
  for (const name of sliceNames) {
    const rel = `${specRoot}/slices/${name}/slice.json`;
    if (!exists(rel)) continue;
    const slice = JSON.parse(read(rel));
    check(slice.slice_id === name, `${rel}: slice id mismatch`);
    check(!local.has(name), `${plan.id}: duplicate slice ${name}`);
    local.add(name);
    check(slice.git.branch_name === plan.branch, `${rel}: branch differs from assigned spec branch`);
    check(slice.git.base_branch === plan.pr_base, `${rel}: base differs from PR dependency`);
    check(slice.git.branch_name === `${slice.git.branch_type}/${slice.ticket}-${slice.git.branch_slug}`,
      `${rel}: branch does not match the runtime type/ticket/slug derivation`);
    const dependencies = (slice.depends_on || []).map((dep) => dep.includes('/') ? dep : `${plan.spec}/${dep}`);
    allSlices.set(`${plan.spec}/${name}`, { dependencies, slice });
    for (const brief of ['EXECUTION_BRIEF.md', 'CLOSURE_BRIEF.md']) {
      check(exists(`${specRoot}/slices/${name}/${brief}`), `${name}: missing ${brief}`);
    }
  }
  check([...local].some((n) => n.startsWith('slice-00-')), `${plan.id}: missing foundation`);
  for (const row of trace.requirements) {
    const source = rq.find((r) => r.id === row.id);
    check(Boolean(source), `${plan.id}: unknown requirement ${row.id}`);
    check(!ownedIds.has(row.id), `${row.id}: duplicate primary owner`);
    ownedIds.add(row.id);
    check(source?.criterion === row.criterion, `${row.id}: criterion differs from pinned requirement`);
    check(local.has(row.primary_slice), `${row.id}: primary slice missing`);
    if (row.status === 'verified') {
      check(Array.isArray(row.test_evidence) && row.test_evidence.length > 0,
        `${row.id}: verified without evidence refs`);
      check(Boolean(row.commit), `${row.id}: verified without commit reference`);
    }
  }
  summaries.push({ plan: plan.id, spec: plan.spec, requirements: rq.length, slices: local.size });
}

function validateDag(nodes, label) {
  const visited = new Set();
  const visiting = new Set();
  const order = [];
  function visit(id, chain = []) {
    if (visiting.has(id)) { errors.push(`${label} cycle: ${[...chain, id].join(' -> ')}`); return; }
    if (visited.has(id)) return;
    const node = nodes.get(id);
    if (!node) { errors.push(`${label} unknown dependency: ${id}`); return; }
    visiting.add(id);
    for (const dep of node.dependencies || []) visit(dep, [...chain, id]);
    visiting.delete(id);
    visited.add(id);
    order.push(id);
  }
  for (const id of nodes.keys()) visit(id);
  return order;
}

const blockOrder = validateDag(new Map(manifest.nodes.map((node) => [node.id, node])), 'source');
const sliceOrder = validateDag(allSlices, 'slice');
// The owner requires every documentary foundation before ANY runtime slice.
// A foundation that waits for runtime would create a cycle across that barrier,
// even if the explicit dependency graph alone happens to be acyclic.
for (const [id, node] of allSlices) {
  if (!node.slice.slice_id.startsWith('slice-00-')) continue;
  for (const dependency of node.dependencies) {
    check(Boolean(allSlices.get(dependency)?.slice.slice_id.startsWith('slice-00-')),
      `${id}: foundation depends on runtime across the global review barrier: ${dependency}`);
  }
}
check(manifest.plans.length === 7, 'expected seven initiative plans');
check(sourceIds.size === 314, 'expected 314 unique source RQs');
check(ownedIds.size === sourceIds.size, 'missing primary requirement owners');
for (const id of sourceIds) check(ownedIds.has(id), `unowned requirement: ${id}`);
if (['ALL_PLANS_READY_FOR_INTEGRATION', 'ALL_PLANS_DONE'].includes(manifest.state)) {
  for (const gate of gates.gates) {
    check(gate.state === 'verified' && gate.evidence.length > 0, `global readiness with unverified gate: ${gate.id}`);
  }
  for (const plan of manifest.plans) {
    check(Boolean(plan.pr), `${plan.id}: global readiness without PR`);
    check(['READY_FOR_INTEGRATION', 'DONE'].includes(plan.state), `${plan.id}: not ready`);
  }
}
process.stdout.write(`${JSON.stringify({
  ok: errors.length === 0,
  purpose: 'documentary coverage and DAG only; no product acceptance assertion',
  baseline: manifest.baseline,
  plans: summaries,
  source_requirements: sourceIds.size,
  primary_owners: ownedIds.size,
  slices: allSlices.size,
  source_topological_order: blockOrder,
  slice_topological_order: sliceOrder,
  unverified_gates: gates.gates.filter((g) => g.state !== 'verified').map((g) => g.id),
  source_sha256: hashes,
  errors,
}, null, 2)}\n`);
process.exitCode = errors.length ? 1 : 0;
