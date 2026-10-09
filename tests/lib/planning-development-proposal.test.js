const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const { planDryRun, prepareDevelopmentProposal, PROPOSAL_REVISION } = require('../../src/create-quiver/lib/planning/dry-run');
const fixture = require('../../examples/planning-dry-run/development-proposal.json');
const clone = (value) => JSON.parse(JSON.stringify(value));
const sample = () => clone(fixture);
const prepare = (x) => prepareDevelopmentProposal(x.task, x.trusted_context, x.proposal_input);
const bind = (x) => { x.proposal_input.expected_plan_binding = planDryRun(x.task, x.trusted_context).binding; return x; };
const diff = (body, target = 'src/example.js') => `--- a/${target}\n+++ b/${target}\n${body}`;
function flags(result) {
  for (const item of [result, ...result.files]) {
    assert.equal(item.execution_authorized, false);
    assert.equal(item.executed, false);
    assert.equal(item.accepted, false);
    assert.equal(item.patch_applicability, 'not-checked');
    assert.equal(Object.hasOwn(item, 'after_sha256'), false);
  }
  assert.deepEqual(result.review, { required: true, scope: 'before-apply', satisfied: false });
  assert.equal(result.verification.status, 'not-performed');
  assert.ok(result.verification.criteria.every((c) => c.status === 'not-verified'));
  assert.ok(result.proposed_tests.every((t) => t.status === 'not-performed'));
  assert.ok(result.evidence_references.every((e) => e.status === 'not-verified'));
}
function rejected(x, expectedCode) {
  const result = prepare(x);
  assert.ok(['denied', 'invalid'].includes(result.status), JSON.stringify(result));
  if (expectedCode) assert.equal(result.issues[0].code, expectedCode);
  assert.deepEqual(result.files, []);
  assert.equal(result.scope, null);
  assert.equal(result.proposal_binding, null);
  flags(result);
  return result;
}
function targets(count) {
  const x = sample();
  x.task.inputs = []; x.task.actions = []; x.trusted_context.resources = []; x.trusted_context.permissions.grants = [];
  x.proposal_input.patches = []; x.proposal_input.proposed_tests = []; x.proposal_input.evidence_references = [];
  for (let n = 1; n <= count; n += 1) {
    const inputId = `input-${n}`; const actionId = `action-${n}`; const resourceId = `resource-${n}`;
    const target = `src/example-${n}.js`;
    x.task.inputs.push({ ...fixture.task.inputs[0], id: inputId, resource_id: resourceId });
    x.task.actions.push({ ...clone(fixture.task.actions[0]), action_id: actionId, resource_id: resourceId, input_ids: [inputId] });
    x.trusted_context.resources.push({ ...fixture.trusted_context.resources[0], resource_id: resourceId, path: target });
    x.trusted_context.permissions.grants.push({ capability: 'development.propose-change', resource_id: resourceId });
    x.proposal_input.patches.push({ action_id: actionId, unified_diff: diff('@@ -1 +1 @@\n-a\n+b\n', target) });
    x.proposal_input.proposed_tests.push({ test_id: `test-${n}`, action_id: actionId, criterion_ids: ['AC-01'], description: 'Probar el criterio' });
  }
  x.task.budgets = { max_actions: count, max_input_bytes: count * 1024 };
  x.trusted_context.budgets = clone(x.task.budgets);
  return bind(x);
}

test('valid proposal contains exact bound changes, sources and unperformed checks', () => {
  const x = sample(); const result = prepare(x); const planned = planDryRun(x.task, x.trusted_context);
  assert.equal(result.status, 'prepared'); flags(result);
  assert.equal(result.proposal_revision, PROPOSAL_REVISION);
  assert.equal(result.plan_binding, planned.binding);
  assert.equal(result.files[0].action_binding, planned.actions[0].binding);
  assert.equal(result.files[0].before_sha256, x.task.inputs[0].sha256);
  assert.equal(result.files[0].unified_diff, x.proposal_input.patches[0].unified_diff);
  assert.equal(result.files[0].patch_sha256, `sha256:${crypto.createHash('sha256').update(x.proposal_input.patches[0].unified_diff).digest('hex')}`);
  assert.deepEqual(result.scope, { action_ids: ['action-1'], resource_ids: ['resource-1'], paths: ['src/example.js'] });
  assert.deepEqual(result.files[0].inputs, planned.actions[0].outline.sources);
  assert.match(result.proposal_binding, /^sha256:[a-f0-9]{64}$/);
  assert.notEqual(result.proposal_binding, result.plan_binding);
  assert.deepEqual(prepare(x), result);
});
test('frozen inputs stay unchanged and output has no aliases to caller data', () => {
  function freeze(value) { Object.freeze(value); for (const child of Object.values(value)) if (child && typeof child === 'object') freeze(child); return value; }
  const x = freeze(sample()); const before = clone(x); const result = prepare(x);
  result.files[0].inputs[0].sha256 = 'changed'; result.proposed_tests[0].criterion_ids.push('changed');
  result.evidence_references[0].criterion_ids.push('changed'); result.task.task_id = 'changed';
  assert.deepEqual(x, before);
  assert.notDeepEqual(result, prepare(x));
});
for (const count of [1, 2, 10]) test(`exactly ${count} distinct targets can be prepared`, () => {
  const result = prepare(targets(count)); assert.equal(result.status, 'prepared'); assert.equal(result.files.length, count); flags(result);
});
test('eleven targets and zero patches fail closed', () => {
  rejected(targets(11), 'PROPOSAL_INVALID'); const x = sample(); x.proposal_input.patches = []; rejected(x, 'PROPOSAL_INVALID');
});
for (const [name, mutate, code] of [
  ['stale expected binding', (x) => { x.proposal_input.expected_plan_binding = `sha256:${'f'.repeat(64)}`; }, 'PLAN_BINDING_MISMATCH'],
  ['missing grant', (x) => { x.trusted_context.permissions.grants = []; }, 'PLAN_DENIED'],
  ['stale input hash', (x) => { x.task.inputs[0].sha256 = `sha256:${'b'.repeat(64)}`; }, 'PLAN_DENIED'],
  ['stale task identity', (x) => { x.task.run_id = 'other'; }, 'PLAN_DENIED'],
  ['action budget', (x) => { x.task.budgets.max_actions = 0; }, 'PLAN_DENIED'],
  ['trusted byte budget', (x) => { x.trusted_context.budgets.max_input_bytes = 0; }, 'PLAN_DENIED'],
  ['task schema', (x) => { x.task.untrusted_approval = true; }, 'PLAN_INVALID'],
]) test(`${name} cannot prepare`, () => { const x = sample(); mutate(x); rejected(x, code); });
for (const [name, mutate] of [
  ['research', (x) => { x.task.domain = 'research'; x.task.actions[0].capability = 'research.propose-report'; x.trusted_context.allowed_capabilities = ['research.propose-report']; x.trusted_context.permissions.grants[0].capability = 'research.propose-report'; }],
  ['inspection', (x) => { x.task.actions[0].capability = 'development.inspect'; x.trusted_context.allowed_capabilities = ['development.inspect']; x.trusted_context.permissions.grants[0].capability = 'development.inspect'; }],
  ['apply', (x) => { x.task.actions[0].phase = 'apply'; }],
  ['critical claim', (x) => { x.task.actions[0].claimed_risk = 'critical'; }],
  ['unknown claim', (x) => { x.task.actions[0].claimed_risk = 'unknown'; }],
  ...['production', 'data', 'permissions', 'credentials', 'payments', 'deletion', 'core-architecture', 'external-commitment', 'unknown'].map((classification) => [classification, (x) => { x.trusted_context.resources[0].classification = classification; }]),
]) test(`${name} recalculated decision cannot prepare`, () => { const x = sample(); mutate(x); rejected(bind(x), 'PLAN_NOT_PREPARABLE'); });
test('target must itself be a hash-bound input of its action', () => {
  const x = sample(); x.trusted_context.resources.push({ ...x.trusted_context.resources[0], resource_id: 'base', path: 'src/base.js' });
  x.task.inputs[0].resource_id = 'base'; x.trusted_context.permissions.grants.push({ capability: 'development.propose-change', resource_id: 'base' });
  rejected(bind(x), 'TARGET_INPUT_REQUIRED');
});
for (const [name, mutate] of [
  ['missing action', (x) => { x.proposal_input.patches.pop(); }],
  ['extra action', (x) => { x.proposal_input.patches.push({ action_id: 'extra', unified_diff: x.proposal_input.patches[0].unified_diff }); }],
  ['duplicate action', (x) => { x.proposal_input.patches[1].action_id = x.proposal_input.patches[0].action_id; }],
]) test(`patch coverage rejects ${name}`, () => { const x = targets(2); mutate(x); rejected(x, 'PATCH_COVERAGE_MISMATCH'); });
for (const alias of ['src/example-1.js', 'SRC/EXAMPLE-1.JS']) test(`duplicate target path ${alias} rejects atomically`, () => {
  const x = targets(2); x.trusted_context.resources[1].path = alias; rejected(bind(x), 'DUPLICATE_TARGET');
});
test('same resource cannot be proposed twice even through different actions', () => {
  const x = targets(2); x.task.actions[1].resource_id = 'resource-1';
  x.trusted_context.permissions.grants.push({ capability: 'development.propose-change', resource_id: 'unused' });
  rejected(bind(x), 'DUPLICATE_TARGET');
});

const validBodies = [
  '@@ -1 +1 @@\n-a\n+b\n',
  '@@ -1,2 +1,2 @@\n context\n-old\n+new\n',
  '@@ -0,0 +1,1 @@\n+prepend\n',
  '@@ -1,0 +2,1 @@\n+insert\n',
  '@@ -1,1 +0,0 @@\n-delete\n',
  '@@ -2,1 +1,0 @@\n-delete\n',
  '@@ -1,1 +1,2 @@\n-a\n+b\n+c\n@@ -4,1 +5,1 @@\n-d\n+e\n',
  '@@ -1,2 +1,1 @@\n-a\n-b\n+c\n@@ -5,1 +4,1 @@\n-d\n+e\n',
  '@@ -1,2 +1,2 @@\n--- a/pretend\n-+++ b/pretend\n+diff --git a/x b/x\n+@@ -500 +500 @@\n',
  '@@ -1 +1 @@\n-\n+\n',
  '@@ -1 +1 @@\n-árbol 🌳\n+árboles 🌲\n',
];
for (const [n, body] of validBodies.entries()) test(`strict modification format accepts supported hunk ${n}`, () => {
  const x = sample(); x.proposal_input.patches[0].unified_diff = diff(body);
  assert.equal(prepare(x).status, 'prepared');
});
test('optional exact diff --git header is accepted', () => {
  const x = sample(); x.proposal_input.patches[0].unified_diff = `diff --git a/src/example.js b/src/example.js\n${x.proposal_input.patches[0].unified_diff}`;
  assert.equal(prepare(x).status, 'prepared');
});
const badBodies = [
  '', '@@ -1 +1 @@\n-a\n', '@@ -1,2 +1 @@\n-a\n+b\n',
  '@@ -1 +1 @@\n-a\n+b\ntrailing\n', '@@ -1 +1 @@\n-a\n+b\n\n',
  '@@ -1 +1 @@\n same\n', '@@ -1,0 +1,0 @@\n', '@@ -0 +0 @@\n-a\n+b\n',
  '@@ -01 +1 @@\n-a\n+b\n', '@@ --1 +1 @@\n-a\n+b\n', '@@ -1.0 +1 @@\n-a\n+b\n',
  '@@ -1e2 +1 @@\n-a\n+b\n', '@@ -9007199254740992 +1 @@\n-a\n+b\n',
  '@@ -9007199254740991,3 +9007199254740991,3 @@\n-a\n+b\n',
  '@@ -1 +2 @@\n-a\n+b\n', '@@ -1 +1 @@ suffix\n-a\n+b\n',
  '@@ -1 +1 @@\n-a\n+b\n\\ No newline at end of file\n', '@@@ -1 +1 @@@\n-a\n+b\n',
  '@@ -1,1 +1,1 @@\n-a\n+b\n@@ -1,1 +1,1 @@\n-c\n+d\n',
  '@@ -1,2 +1,2 @@\n-a\n-b\n+c\n+d\n@@ -2,1 +2,1 @@\n-e\n+f\n',
  '@@ -3 +3 @@\n-a\n+b\n@@ -2 +2 @@\n-c\n+d\n',
  '@@ -1,1 +1,2 @@\n-a\n+b\n+c\n@@ -4,1 +4,1 @@\n-d\n+e\n',
  '@@ -1,0 +2,1 @@\n+x\n@@ -1,0 +3,1 @@\n+y\n',
  '@@ -1 +1 @@\n-a\n+b\n--- a/src/other.js\n+++ b/src/other.js\n@@ -1 +1 @@\n-x\n+y\n',
  '@@ -1 +1 @@\n?unknown\n-a\n+b\n', '@@ -1 +1 @@\n-a\n+b\u0000\n',
];
for (const [n, body] of badBodies.entries()) test(`strict parser rejects malformed or unsupported hunk ${n}`, () => {
  const x = sample(); x.proposal_input.patches[0].unified_diff = diff(body); rejected(x, 'UNIFIED_DIFF_INVALID');
});
for (const transform of [
  (s) => s.replace('--- a/src/example.js', '--- /dev/null'),
  (s) => s.replace('+++ b/src/example.js', '+++ /dev/null'),
  (s) => s.replace('+++ b/src/example.js', '+++ b/src/extra.js'),
  (s) => s.replace('--- a/src/example.js', '--- "a/src/example.js"'),
  (s) => s.replace('--- a/src/example.js', '--- a/src/example.js\tdate'),
  (s) => `diff --git a/src/other.js b/src/other.js\n${s}`,
  (s) => `index abcdef1..abcdef2 100644\n${s}`,
  (s) => `new file mode 100644\n${s}`,
  (s) => `deleted file mode 100644\n${s}`,
  (s) => `old mode 100644\nnew mode 100755\n${s}`,
  (s) => `rename from src/a\nrename to src/b\n${s}`,
  (s) => `copy from src/a\ncopy to src/b\n${s}`,
  (s) => `GIT binary patch\n${s}`,
  (s) => `Binary files a/src/example.js and b/src/example.js differ\n${s}`,
  (s) => s.replaceAll('\n', '\r\n'),
  (s) => s.slice(0, -1),
]) test(`unsupported patch envelope: ${transform}`, () => {
  const x = sample(); x.proposal_input.patches[0].unified_diff = transform(x.proposal_input.patches[0].unified_diff); rejected(x, 'UNIFIED_DIFF_INVALID');
});
for (const target of ['src/../other.js', '/src/example.js', 'src\\example.js', '.git/config', '.env', 'src/a b.js', 'src/á.js', 'src/"x".js', 'src/a%20b.js', 'src/con.js', 'src/a.js.', 'src/.quiver/a.js']) test(`unsafe or noncanonical target ${target}`, () => {
  const x = sample(); x.trusted_context.resources[0].path = target; x.proposal_input.patches[0].unified_diff = diff(validBodies[0], target); rejected(bind(x));
});

for (const [name, mutate, code] of [
  ['duplicate test ID', (x) => x.proposal_input.proposed_tests.push(clone(x.proposal_input.proposed_tests[0])), 'DUPLICATE_TEST_ID'],
  ['unknown test action', (x) => { x.proposal_input.proposed_tests[0].action_id = 'absent'; }, 'INVALID_TEST_REFERENCES'],
  ['unknown test criterion', (x) => { x.proposal_input.proposed_tests[0].criterion_ids = ['absent']; }, 'INVALID_TEST_REFERENCES'],
  ['duplicate test criterion', (x) => x.proposal_input.proposed_tests[0].criterion_ids.push('AC-01'), 'INVALID_TEST_REFERENCES'],
  ['duplicate evidence ID', (x) => x.proposal_input.evidence_references.push(clone(x.proposal_input.evidence_references[0])), 'DUPLICATE_EVIDENCE_ID'],
  ['unknown evidence source', (x) => { x.proposal_input.evidence_references[0].input_id = 'absent'; }, 'INVALID_EVIDENCE_REFERENCES'],
  ['unknown evidence criterion', (x) => { x.proposal_input.evidence_references[0].criterion_ids = ['absent']; }, 'INVALID_EVIDENCE_REFERENCES'],
  ['duplicate evidence criterion', (x) => x.proposal_input.evidence_references[0].criterion_ids.push('AC-01'), 'INVALID_EVIDENCE_REFERENCES'],
]) test(`reference validation rejects ${name}`, () => { const x = sample(); mutate(x); rejected(x, code); });
test('each criterion of each action needs a proposed test', () => {
  const x = targets(2); x.proposal_input.proposed_tests.pop(); rejected(x, 'TEST_COVERAGE_MISSING');
  const y = sample(); y.task.criteria.push({ id: 'AC-02', text: 'Otro criterio' }); y.task.actions[0].criterion_ids.push('AC-02'); rejected(bind(y), 'TEST_COVERAGE_MISSING');
});
test('test and evidence criteria cannot borrow another action association', () => {
  for (const collection of ['proposed_tests', 'evidence_references']) {
    const x = targets(2); x.task.criteria.push({ id: 'AC-02', text: 'Otra acción' });
    x.task.actions[1].criterion_ids = ['AC-02']; x.proposal_input.proposed_tests[1].criterion_ids = ['AC-02'];
    if (collection === 'proposed_tests') x.proposal_input.proposed_tests[0].criterion_ids = ['AC-02'];
    else x.proposal_input.evidence_references = [{ evidence_id: 'ref', input_id: 'input-1', criterion_ids: ['AC-02'] }];
    rejected(bind(x), collection === 'proposed_tests' ? 'INVALID_TEST_REFERENCES' : 'INVALID_EVIDENCE_REFERENCES');
  }
});
test('evidence is optional and its presence does not verify criteria', () => {
  const x = sample(); x.proposal_input.evidence_references = []; const result = prepare(x);
  assert.equal(result.status, 'prepared'); flags(result);
});
for (const [n, target] of [(x) => x.proposal_input, (x) => x.proposal_input.patches[0], (x) => x.proposal_input.proposed_tests[0], (x) => x.proposal_input.evidence_references[0]].entries()) test(`unknown or authority fields fail closed at proposal object ${n}`, () => {
  for (const key of ['approved', 'executed', 'accepted', 'plan', 'after_sha256', 'command', '__proto__']) {
    const x = sample(); Object.defineProperty(target(x), key, { value: true, enumerable: true }); rejected(x);
  }
});
test('hostile JSON is rejected before getters, hooks or proxy traps run', () => {
  let calls = 0;
  const mutations = [
    (x) => Object.defineProperty(x.proposal_input, 'patches', { enumerable: true, get() { calls += 1; throw Error('getter'); } }),
    (x) => { x.proposal_input.toJSON = () => { calls += 1; }; },
    (x) => { x.proposal_input = new Proxy(x.proposal_input, { ownKeys() { calls += 1; throw Error('proxy'); } }); },
    (x) => { const p = Proxy.revocable(x.proposal_input, {}); p.revoke(); x.proposal_input = p.proxy; },
    (x) => { x.proposal_input.patches[0] = new Proxy(x.proposal_input.patches[0], { getPrototypeOf() { calls += 1; throw Error('proxy'); } }); },
    (x) => { x.proposal_input.cycle = x.proposal_input; },
    (x) => { x.proposal_input.alias = x.proposal_input.patches; },
    (x) => { x.proposal_input.patches.length = 3; },
    (x) => { x.proposal_input[Symbol('hidden')] = true; },
    (x) => { Object.setPrototypeOf(x.proposal_input.patches, { map() { calls += 1; } }); },
    (x) => { x.proposal_input = Object.create(x.proposal_input); },
    (x) => { x.proposal_input.schema_version = NaN; },
    (x) => { x.proposal_input.schema_version = 1n; },
  ];
  for (const mutate of mutations) { const x = sample(); mutate(x); rejected(x, 'JSON_DATA_REQUIRED'); }
  assert.equal(calls, 0);
});
for (const argument of ['task', 'trusted_context', 'proposal_input']) test(`all three arguments reject hostile ${argument}`, () => {
  for (const value of [undefined, () => {}, new Date(), Infinity]) { const x = sample(); x[argument] = value; rejected(x, 'JSON_DATA_REQUIRED'); }
});
test('depth, graph size, traversal and oversized strings are bounded', () => {
  const x = sample(); let nested = {}; x.proposal_input.extra = nested;
  for (let n = 0; n < 22; n += 1) { nested.next = {}; nested = nested.next; } rejected(x, 'JSON_DATA_REQUIRED');
  const y = sample(); y.proposal_input.patches[0].unified_diff = 'a'.repeat(8001); rejected(y, 'JSON_DATA_REQUIRED');
  const z = sample(); z.proposal_input.extra = Array.from({ length: 2000 }, () => Array.from({ length: 11 }, () => null)); rejected(z, 'JSON_DATA_REQUIRED');
});
test('8000 UTF-16 units are allowed but aggregate UTF-8 patches are capped at 64 KiB', () => {
  const x = sample(); const prefix = diff('@@ -1 +1 @@\n-a\n+');
  x.proposal_input.patches[0].unified_diff = `${prefix}${'b'.repeat(8000 - prefix.length - 1)}\n`;
  assert.equal(prepare(x).status, 'prepared');
  const y = targets(10);
  for (const patch of y.proposal_input.patches) patch.unified_diff = patch.unified_diff.replace('+b\n', `+${'é'.repeat(4000)}\n`);
  rejected(y, 'PATCH_BUDGET_EXCEEDED');
});
test('three-argument canonical contract has an aggregate 1 MiB ceiling', () => {
  const x = sample();
  // Each individual argument stays below the preflight ceiling, but their sum does not.
  x.task.objective = 'a'.repeat(8000);
  x.task.criteria = Array.from({ length: 100 }, (_, n) => ({ id: `C${n}`, text: 'a'.repeat(7800) }));
  x.task.actions[0].criterion_ids = x.task.criteria.map((c) => c.id);
  x.proposal_input.proposed_tests = Array.from({ length: 50 }, (_, n) => ({ test_id: `T${n}`, action_id: 'action-1', criterion_ids: ['C0'], description: 'b'.repeat(6000) }));
  rejected(x, 'CONTRACT_TOO_LARGE');
});

for (const [name, mutate] of [
  ['task revision', (x) => { x.task.revision += 1; x.trusted_context.task_revision += 1; }],
  ['policy revision', (x) => { x.trusted_context.policy_revision += 1; }],
  ['permissions snapshot', (x) => { x.trusted_context.permissions.revision += 1; }],
  ['objective', (x) => { x.task.objective += '!'; }],
  ['resource hash', (x) => { x.task.inputs[0].sha256 = `sha256:${'b'.repeat(64)}`; x.trusted_context.resources[0].sha256 = x.task.inputs[0].sha256; }],
  ['resource size', (x) => { x.trusted_context.resources[0].size_bytes += 1; }],
  ['scope path', (x) => { x.trusted_context.resources[0].path = 'src/new.js'; x.proposal_input.patches[0].unified_diff = x.proposal_input.patches[0].unified_diff.replaceAll('src/example.js', 'src/new.js'); }],
  ['patch', (x) => { x.proposal_input.patches[0].unified_diff = x.proposal_input.patches[0].unified_diff.replace('version = 2', 'version = 3'); }],
  ['test description', (x) => { x.proposal_input.proposed_tests[0].description += '!'; }],
  ['evidence ID', (x) => { x.proposal_input.evidence_references[0].evidence_id += '-changed'; }],
  ['removed evidence', (x) => { x.proposal_input.evidence_references = []; }],
]) test(`proposal binding protects ${name}`, () => {
  const x = sample(); const before = prepare(x); mutate(x); const after = prepare(bind(x));
  assert.equal(after.status, 'prepared'); assert.notEqual(after.proposal_binding, before.proposal_binding); flags(after);
});
test('object key order is irrelevant; proposal array order is significant', () => {
  const reorder = (v) => Array.isArray(v) ? v.map(reorder) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).reverse().map((k) => [k, reorder(v[k])])) : v;
  const x = sample(); assert.deepEqual(prepare(reorder(x)), prepare(x));
  for (const collection of ['patches', 'proposed_tests', 'evidence_references']) {
    const y = targets(2);
    y.proposal_input.evidence_references = [1, 2].map((n) => ({ evidence_id: `E${n}`, input_id: `input-${n}`, criterion_ids: ['AC-01'] }));
    const before = prepare(y); y.proposal_input[collection].reverse();
    const after = prepare(y); assert.equal(after.status, 'prepared'); assert.notEqual(after.proposal_binding, before.proposal_binding);
  }
});
for (const [domain, expected] of [['development', 'sha256:68fa297dc642788b9453419dd8a282d39a1a5c1481a2fa155b052a4b61cae2da'], ['research', 'sha256:c80d2f8b62b95436593abb817b77007e242be2497f02a5a09fbbeee5ebf2207a']]) test(`legacy ${domain} binding remains exactly unchanged`, () => {
  const x = require(`../../examples/planning-dry-run/${domain}.json`); assert.equal(planDryRun(x.task, x.trusted_context).binding, expected);
});
test('isolated imports and both APIs can only use the existing pure dependencies', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../src/create-quiver/lib/planning/dry-run.js'), 'utf8');
  const safety = fs.readFileSync(path.join(__dirname, '../../src/create-quiver/lib/ai/safety.js'), 'utf8');
  const deps = { 'node:crypto': crypto, 'node:util': require('node:util'), zod: require('zod'), 'node:path': path };
  const calls = [];
  function load(code) {
    const sandbox = { module: { exports: {} }, Buffer, require(name) { calls.push(name); if (name === '../ai/safety') return load(safety).module.exports; assert.ok(Object.hasOwn(deps, name), `Forbidden dependency ${name}`); return deps[name]; } };
    vm.createContext(sandbox); vm.runInContext(code, sandbox); return sandbox;
  }
  const sandbox = load(source); sandbox.fixtureJson = JSON.stringify(fixture);
  const result = vm.runInContext('(() => { const x = JSON.parse(fixtureJson); return module.exports.prepareDevelopmentProposal(x.task, x.trusted_context, x.proposal_input); })()', sandbox);
  assert.equal(result.status, 'prepared'); flags(clone(result));
  const changed = load(source.replace("const PROPOSAL_REVISION = 'development-proposal-v1'", "const PROPOSAL_REVISION = 'development-proposal-v2'"));
  changed.fixtureJson = JSON.stringify(fixture);
  const v2 = vm.runInContext('(() => { const x = JSON.parse(fixtureJson); return module.exports.prepareDevelopmentProposal(x.task, x.trusted_context, x.proposal_input); })()', changed);
  assert.equal(v2.status, 'prepared'); assert.notEqual(v2.proposal_binding, result.proposal_binding); assert.equal(v2.plan_binding, result.plan_binding);
  assert.deepEqual(calls, [...Array(2)].flatMap(() => ['node:crypto', 'node:util', 'zod', '../ai/safety', 'node:path']));
});

for (const malformed of ['\ud800', '\udfff']) test('malformed UTF-16 patch content fails closed', () => {
  const x = sample(); x.proposal_input.patches[0].unified_diff = diff(`@@ -1 +1 @@\n-a\n+${malformed}\n`); rejected(x, 'UNIFIED_DIFF_INVALID');
});
