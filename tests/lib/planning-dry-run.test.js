const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const { planDryRun } = require('../../src/create-quiver/lib/planning/dry-run');

const fixtures = Object.fromEntries(['development', 'research'].map((domain) => [domain,
  JSON.parse(fs.readFileSync(path.join(__dirname, '../../examples/planning-dry-run', `${domain}.json`), 'utf8'))]));
const clone = (value) => JSON.parse(JSON.stringify(value));
const sample = (domain = 'development') => clone(fixtures[domain]);
const plan = (fixture) => planDryRun(fixture.task, fixture.trusted_context);
function assertNeverExecuted(result) {
  for (const item of [result, ...result.actions]) {
    assert.equal(item.execution_authorized, false);
    assert.equal(item.executed, false);
    assert.equal(item.accepted, false);
  }
  assert.equal(result.verification.status, 'not-performed');
  assert.ok(result.verification.criteria.every((criterion) => criterion.status === 'not-verified'));
}
function denied(fixture, reason) {
  const result = plan(fixture);
  assert.equal(result.status, 'denied');
  assert.ok(result.actions.some((action) => action.reasons.includes(reason)), JSON.stringify(result));
  assertNeverExecuted(result);
}

for (const domain of ['development', 'research']) {
  test(`${domain} creates a deterministic domain outline through the shared controller`, () => {
    const fixture = sample(domain);
    const result = plan(fixture);
    assert.equal(result.status, 'planned');
    assert.equal(result.adapter_id, `${domain}-planning-v1`);
    assert.equal(result.actions[0].decision, 'eligible');
    assert.equal(result.actions[0].outline.target_path, fixture.trusted_context.resources[0].path);
    assert.equal(result.actions[0].outline.sources[0].sha256, fixture.task.inputs[0].sha256);
    assert.equal(result.actions[0].outline.proposed_checks[0].evidence_kind, domain === 'development' ? 'test-evidence' : 'source-support');
    assert.match(result.binding, /^sha256:[a-f0-9]{64}$/);
    assert.notEqual(result.binding, result.actions[0].binding);
    assert.deepEqual(plan(fixture), result);
    assertNeverExecuted(result);
  });

  for (const phase of ['prepare', 'apply']) {
    test(`${domain} intermediate ${phase} remains gated without consuming approval`, () => {
      const fixture = sample(domain);
      const capability = domain === 'development' ? 'development.propose-change' : 'research.propose-report';
      fixture.task.actions[0].capability = capability;
      fixture.task.actions[0].phase = phase;
      fixture.trusted_context.allowed_capabilities = [capability];
      fixture.trusted_context.permissions.grants[0].capability = capability;
      const result = plan(fixture);
      assert.equal(result.actions[0].effective_risk, 'intermediate');
      assert.equal(result.actions[0].decision, phase === 'prepare' ? 'prepare-only' : 'approval-required');
      assert.deepEqual(result.actions[0].approval_requirement, { required: true, scope: 'before-apply', satisfied: false });
      assertNeverExecuted(result);
    });
  }

  for (const classification of ['shared', 'production', 'data', 'permissions', 'credentials', 'payments', 'deletion', 'core-architecture', 'external-commitment', 'unknown']) {
    test(`${domain} forged low claim cannot override ${classification} resource classification`, () => {
      const fixture = sample(domain);
      fixture.trusted_context.resources[0].classification = classification;
      const result = plan(fixture);
      const action = result.actions[0];
      assert.equal(action.effective_risk, classification === 'shared' ? 'intermediate' : classification === 'unknown' ? 'unknown' : 'critical');
      assert.equal(action.approval_requirement.required, true);
      assert.notEqual(action.decision, 'eligible');
      assert.equal(action.approval_requirement.satisfied, false);
      assertNeverExecuted(result);
    });
  }

  test(`${domain} permissions cover every source and action resource`, () => {
    const fixture = sample(domain);
    fixture.trusted_context.permissions.grants = [];
    denied(fixture, 'PERMISSION_MISSING');
    const missingSource = sample(domain);
    missingSource.trusted_context.resources.push({ ...missingSource.trusted_context.resources[0], resource_id: 'source-2' });
    missingSource.task.inputs[0].resource_id = 'source-2';
    denied(missingSource, 'PERMISSION_MISSING');
  });
}

const unknownTargets = [
  (x) => x.task, (x) => x.task.criteria[0], (x) => x.task.inputs[0],
  (x) => x.task.actions[0], (x) => x.task.budgets, (x) => x.trusted_context,
  (x) => x.trusted_context.resources[0], (x) => x.trusted_context.permissions,
  (x) => x.trusted_context.permissions.grants[0], (x) => x.trusted_context.budgets,
];
for (const [index, target] of unknownTargets.entries()) {
  test(`unknown field fails closed at contract object ${index}`, () => {
    const fixture = sample();
    target(fixture).execution_authorized = true;
    const result = plan(fixture);
    assert.equal(result.status, 'invalid');
    assert.equal(result.binding, null);
    assert.deepEqual(result.actions, []);
    assertNeverExecuted(result);
  });
}

for (const modify of [
  (x) => { delete x.trusted_context.permissions; },
  (x) => { x.task.actions[0].claimed_risk = 'safe'; },
  (x) => { x.trusted_context.resources[0].classification = 'safe'; },
  (x) => { x.task.schema_version = 2; },
  (x) => { x.task.revision = -1; },
  (x) => { x.task.domain = 'finance'; },
  (x) => { x.task.inputs[0].sha256 = 'unverified'; },
  (x) => { x.task.objective = ' '; },
  (x) => { x.task.actions = []; },
  (x) => { x.task.budgets.max_actions = 1.5; },
  (x) => { x.task.budgets.max_input_bytes = Number.MAX_SAFE_INTEGER + 1; },
]) {
  test(`malformed contract fails closed: ${modify}`, () => {
    const fixture = sample(); modify(fixture);
    assert.equal(plan(fixture).status, 'invalid');
    assertNeverExecuted(plan(fixture));
  });
}

for (const value of [undefined, null, () => {}, new Date(), NaN, Infinity, Object.create({ objective: 'inherited' })]) {
  test(`non-contract or non-JSON input fails closed: ${String(value)}`, () => {
    assert.equal(planDryRun(value, sample().trusted_context).status, 'invalid');
  });
}
test('accessors, toJSON, cycles, sparse arrays, and symbols are rejected without executing code', () => {
  let called = false;
  const fixture = sample();
  Object.defineProperty(fixture.task, 'objective', { enumerable: true, get() { called = true; throw Error('getter ran'); } });
  assert.equal(plan(fixture).status, 'invalid');
  assert.equal(called, false);
  for (const mutate of [
    (x) => { x.task.toJSON = () => { called = true; }; },
    (x) => { x.task.loop = x.task; },
    (x) => { x.task.actions.length = 4; },
    (x) => { x.task[Symbol('hidden')] = true; },
  ]) {
    const example = sample(); mutate(example); assert.equal(plan(example).status, 'invalid');
  }
  assert.equal(called, false);
});

for (const field of ['criteria', 'inputs', 'actions']) {
  test(`duplicate ${field} IDs fail closed`, () => {
    const fixture = sample(); fixture.task[field].push(clone(fixture.task[field][0]));
    assert.equal(plan(fixture).issues[0].code, 'DUPLICATE_ID');
  });
}
test('duplicate resources, capabilities, and grants fail closed', () => {
  for (const field of ['resources', 'allowed_capabilities']) {
    const fixture = sample(); fixture.trusted_context[field].push(clone(fixture.trusted_context[field][0]));
    assert.equal(plan(fixture).issues[0].code, 'DUPLICATE_ID');
  }
  const fixture = sample(); fixture.trusted_context.permissions.grants.push(clone(fixture.trusted_context.permissions.grants[0]));
  assert.equal(plan(fixture).issues[0].code, 'DUPLICATE_ID');
});
for (const field of ['input_ids', 'criterion_ids']) {
  test(`missing/duplicate ${field} fail closed`, () => {
    const fixture = sample(); fixture.task.actions[0][field] = ['missing'];
    assert.equal(plan(fixture).issues[0].code, 'INVALID_ACTION_REFERENCES');
    const duplicate = sample(); duplicate.task.actions[0][field].push(duplicate.task.actions[0][field][0]);
    assert.equal(plan(duplicate).issues[0].code, 'INVALID_ACTION_REFERENCES');
  });
}

for (const unsafe of ['../file', '/etc/passwd', 'C:/file', 'C:\\file', 'x/../file', './file', 'x//file', 'x\\file', 'file%2fsecret', 'x/*', 'x/ file', 'x/file.', 'x/con.txt', 'x\u0000file', '.env', '.ENV.local', '.git/config', '.quiver/scans/PROJECT_SCAN.json', 'node_modules/x', '.ssh/key', 'x/private.pem']) {
  test(`denies unsafe resource path ${JSON.stringify(unsafe)}`, () => {
    const fixture = sample(); fixture.trusted_context.resources[0].path = unsafe;
    denied(fixture, 'UNSAFE_RESOURCE_PATH');
    assert.equal(plan(fixture).actions[0].outline, null);
  });
}
for (const capability of ['execute.shell', 'research.compare', '__proto__', 'constructor', 'toString']) {
  test(`closed development registry denies ${capability} even when caller policy allows it`, () => {
    const fixture = sample(); fixture.task.actions[0].capability = capability;
    fixture.trusted_context.allowed_capabilities = [capability];
    fixture.trusted_context.permissions.grants[0].capability = capability;
    if (capability === '__proto__') assert.equal(plan(fixture).status, 'invalid');
    else denied(fixture, 'UNSUPPORTED_ACTION');
  });
}
test('unsupported or missing resource/capability never gets an implicit grant', () => {
  const fixture = sample(); fixture.trusted_context.resources = []; denied(fixture, 'RESOURCE_NOT_ALLOWED');
  const cap = sample(); cap.trusted_context.allowed_capabilities = []; denied(cap, 'CAPABILITY_NOT_ALLOWED');
});
for (const field of ['task_id', 'run_id', 'revision']) {
  test(`stale ${field} denies every action`, () => {
    const fixture = sample(); fixture.task[field] = field === 'revision' ? 2 : 'stale';
    denied(fixture, 'TASK_BINDING_MISMATCH');
  });
}
test('stale input hash denies planning eligibility', () => {
  const fixture = sample(); fixture.task.inputs[0].sha256 = `sha256:${'b'.repeat(64)}`;
  denied(fixture, 'INPUT_BINDING_MISMATCH');
});
for (const owner of ['task', 'trusted_context']) {
  for (const [field, reason] of [['max_actions', 'ACTION_BUDGET_EXCEEDED'], ['max_input_bytes', 'INPUT_BUDGET_EXCEEDED']]) {
    test(`${owner} ${field} is enforced before any eligibility`, () => {
      const fixture = sample(); fixture[owner].budgets[field] = 0; denied(fixture, reason);
    });
  }
}
test('aggregate repeated input usage and integer overflow cannot bypass budgets', () => {
  const fixture = sample();
  fixture.task.actions.push({ ...clone(fixture.task.actions[0]), action_id: 'action-2' });
  fixture.task.budgets.max_input_bytes = 1024;
  denied(fixture, 'INPUT_BUDGET_EXCEEDED');
  fixture.task.budgets.max_input_bytes = Number.MAX_SAFE_INTEGER;
  fixture.trusted_context.budgets.max_input_bytes = Number.MAX_SAFE_INTEGER;
  fixture.trusted_context.resources[0].size_bytes = Number.MAX_SAFE_INTEGER;
  denied(fixture, 'INPUT_BUDGET_EXCEEDED');
  assert.ok(plan(fixture).actions.every((action) => action.decision === 'denied'));
});

const protectedChanges = [
  (x) => { x.task.objective += ' changed'; },
  (x) => { x.task.criteria[0].text += ' changed'; },
  (x) => { x.task.task_id += '-changed'; },
  (x) => { x.task.run_id += '-changed'; },
  (x) => { x.task.revision += 1; },
  (x) => { x.task.inputs[0].sha256 = `sha256:${'b'.repeat(64)}`; },
  (x) => { x.task.actions[0].action_id += '-changed'; },
  (x) => { x.task.actions[0].phase = 'apply'; },
  (x) => { x.task.actions[0].claimed_risk = 'critical'; },
  (x) => { x.task.budgets.max_actions += 1; },
  (x) => { x.trusted_context.policy_id += '-changed'; },
  (x) => { x.trusted_context.policy_revision += 1; },
  (x) => { x.trusted_context.permissions.snapshot_id += '-changed'; },
  (x) => { x.trusted_context.permissions.revision += 1; },
  (x) => { x.trusted_context.permissions.grants = []; },
  (x) => { x.trusted_context.resources[0].classification = 'production'; },
  (x) => { x.trusted_context.resources[0].path = 'src/other.js'; },
  (x) => { x.trusted_context.resources[0].size_bytes += 1; },
  (x) => { x.trusted_context.budgets.max_input_bytes += 1; },
  (x) => { x.trusted_context.allowed_capabilities.push('unsupported.extra'); },
];
for (const mutate of protectedChanges) {
  test(`protected binding changes: ${mutate}`, () => {
    const fixture = sample(); const before = plan(fixture); mutate(fixture);
    const after = plan(fixture);
    assert.notEqual(after.binding, before.binding);
    if (after.actions.length) assert.notEqual(after.actions[0].binding, before.actions[0].binding);
    assertNeverExecuted(after);
  });
}
test('object-key order is canonical; array order and each action identity remain bound', () => {
  const reverse = (value) => Array.isArray(value) ? value.map(reverse) : value && typeof value === 'object'
    ? Object.fromEntries(Object.entries(value).reverse().map(([key, item]) => [key, reverse(item)])) : value;
  const fixture = sample();
  assert.equal(plan(fixture).binding, plan(reverse(fixture)).binding);
  fixture.task.actions.push({ ...clone(fixture.task.actions[0]), action_id: 'action-2' });
  const before = plan(fixture);
  assert.notEqual(before.actions[0].binding, before.actions[1].binding);
  fixture.task.actions.reverse();
  assert.notEqual(plan(fixture).binding, before.binding);
});
test('deep-frozen inputs are not mutated or aliased by results', () => {
  const freeze = (value) => { Object.freeze(value); for (const child of Object.values(value)) if (child && typeof child === 'object') freeze(child); return value; };
  const fixture = freeze(sample()); const before = clone(fixture); const result = plan(fixture);
  result.contract.criteria[0].text = 'changed'; result.actions[0].input_ids.push('changed');
  assert.deepEqual(fixture, before);
  assert.notDeepEqual(plan(fixture), result);
});

test('module import and both adapters use only pure dependencies with no application IO', () => {
  // Source loading is test setup. The isolated import/call cannot acquire fs,
  // network, process, timers, dynamic modules, providers, or stateful helpers.
  const source = fs.readFileSync(path.join(__dirname, '../../src/create-quiver/lib/planning/dry-run.js'), 'utf8');
  const safety = fs.readFileSync(path.join(__dirname, '../../src/create-quiver/lib/ai/safety.js'), 'utf8');
  const dependencies = { 'node:crypto': require('node:crypto'), 'node:util': require('node:util'), zod: require('zod'), 'node:path': require('node:path') };
  const calls = [];
  function load(code) {
    const sandbox = { module: { exports: {} }, Buffer, require(name) {
      calls.push(name);
      if (name === '../ai/safety') return load(safety).exports;
      assert.ok(Object.hasOwn(dependencies, name), `Forbidden dependency: ${name}`);
      return dependencies[name];
    } };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    return { exports: sandbox.module.exports, sandbox };
  }
  const isolated = load(source);
  for (const domain of ['development', 'research']) {
    isolated.sandbox.fixtureJson = JSON.stringify(fixtures[domain]);
    const result = vm.runInContext(`(() => {
      const fixture = JSON.parse(fixtureJson);
      return module.exports.planDryRun(fixture.task, fixture.trusted_context);
    })()`, isolated.sandbox);
    assert.equal(result.status, 'planned'); assertNeverExecuted(result);
  }
  assert.deepEqual(calls, ['node:crypto', 'node:util', 'zod', '../ai/safety', 'node:path']);
});

for (const claimedRisk of ['intermediate', 'critical', 'unknown']) {
  test(`claimed ${claimedRisk} can only elevate caution in both domains`, () => {
    for (const domain of ['development', 'research']) {
      const fixture = sample(domain); fixture.task.actions[0].claimed_risk = claimedRisk;
      const result = plan(fixture);
      assert.equal(result.actions[0].effective_risk, claimedRisk);
      assert.equal(result.actions[0].approval_requirement.required, true);
      assertNeverExecuted(result);
    }
  });
}

test('custom array prototypes, inherited indices, and proxies cannot execute callbacks', () => {
  let called = 0;
  const cases = [
    (x) => Object.setPrototypeOf(x.task.inputs, { map() { called += 1; return []; } }),
    (x) => { const item = x.task.inputs[0]; delete x.task.inputs[0]; x.task.inputs.placeholder = true;
      Object.setPrototypeOf(x.task.inputs, Object.defineProperty([], '0', { get() { called += 1; return item; } })); },
    (x) => Object.setPrototypeOf(x.task.inputs, null),
    (x) => { x.task = new Proxy(x.task, { getPrototypeOf() { called += 1; return Object.prototype; } }); },
    (x) => { const proxy = Proxy.revocable(x.task, {}); proxy.revoke(); x.task = proxy.proxy; },
    (x) => { delete x.task.inputs[0]; x.task.inputs['01'] = {}; },
  ];
  for (const mutate of cases) {
    const fixture = sample(); mutate(fixture);
    assert.equal(plan(fixture).status, 'invalid');
  }
  assert.equal(called, 0);
});
for (const [index, target] of unknownTargets.entries()) {
  test(`own JSON __proto__ key fails closed at object ${index}`, () => {
    const fixture = sample();
    Object.defineProperty(target(fixture), '__proto__', { value: 'evil', enumerable: true });
    assert.equal(plan(fixture).status, 'invalid');
  });
}
test('unreferenced declared sources and criteria fail closed', () => {
  for (const ref of ['missing', 'resource-1']) {
    const fixture = sample();
    fixture.task.inputs.push({ id: 'unused', resource_id: ref, sha256: `sha256:${'b'.repeat(64)}` });
    assert.equal(plan(fixture).issues[0].code, 'UNREFERENCED_TASK_INPUT_OR_CRITERION');
  }
  const fixture = sample(); fixture.task.criteria.push({ id: 'unused', text: 'No action covers this' });
  assert.equal(plan(fixture).status, 'invalid');
});

test('shared graphs and excessive traversal fail closed before expanding serialization', () => {
  const fixture = sample();
  let graph = { text: 'x'.repeat(1024) };
  for (let level = 0; level < 12; level += 1) graph = { left: graph, right: graph };
  fixture.task.extra = graph;
  assert.equal(plan(fixture).status, 'invalid');
  const large = sample();
  large.task.extra = Array.from({ length: 2000 }, () => 'x'.repeat(8000));
  assert.equal(plan(large).status, 'invalid');
  const nested = sample(); nested.task.criteria[0] = new Proxy(nested.task.criteria[0], {
    ownKeys() { throw Error('must not run'); },
  });
  assert.equal(plan(nested).status, 'invalid');
});
