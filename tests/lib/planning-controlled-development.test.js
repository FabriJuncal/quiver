const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { reviewDemo } = require('../../examples/development-verification/host.cjs');
const source = path.resolve(__dirname, '../../examples/development-verification/app/catalog.cjs');
const approve = (r) => ({ approved: true, binding: r.binding, approval_id: 'test-host-approval' });
const hash = (b) => 'sha256:' + crypto.createHash('sha256').update(b).digest('hex');

test('real red-green cycle, fixed regressions, exact evidence and untouched original', async () => {
  const original = fs.readFileSync(source);
  const session = reviewDemo();
  try {
    assert.equal(session.review.application.scope.paths.join(), 'catalog.cjs');
    assert.equal(session.review.application.files.length, 1);
    assert.ok(Object.isFrozen(session.review.commands.before.args));
    const result = await session.execute(approve);
    const e = result.evidence;
    assert.equal(e.status, 'passed');
    assert.equal(e.accepted, false);
    assert.equal(e.application.tests.status, 'not-performed');
    assert.equal(e.verification.status, 'passed-authored-demo');
    assert.deepEqual(e.runs.map((r) => r.exit_code), [1, 0]);
    assert.deepEqual(e.runs[0].results.filter((r) => !r.passed).map((r) => r.id), ['search-name', 'search-absent']);
    assert.ok(e.runs[1].results.every((r) => r.passed));
    assert.ok(e.verification.criteria.every((c) => c.status === 'passed'));
    for (const run of e.runs) {
      assert.ok(run.duration_ms >= 0);
      assert.ok(Date.parse(run.started_at));
      assert.equal(run.runtime.node, process.version);
      assert.equal(run.command.executable, process.execPath);
      assert.equal(run.command.shell, false);
      assert.deepEqual(Object.keys(run.environment), process.platform === 'win32' && process.env.SystemRoot ? ['SystemRoot'] : []);
    }
    assert.equal(hash(fs.readFileSync(result.evidence_path)), result.evidence_sha256);
    assert.deepEqual(JSON.parse(fs.readFileSync(result.evidence_path)), e);
    assert.deepEqual(fs.readFileSync(source), original);
    await assert.rejects(session.execute(approve), { code: 'SESSION_CONSUMED' });
  } finally { session.dispose(); }
});

test('incorrect authored patch really executes but fails search, preserving regressions', async () => {
  const session = reviewDemo({ variant: 'wrong' });
  try {
    const { evidence: e } = await session.execute(approve);
    assert.equal(e.application.executed, true);
    assert.equal(e.status, 'failed');
    assert.equal(e.accepted, false);
    assert.deepEqual(e.runs.map((r) => r.exit_code), [1, 1]);
    assert.equal(e.verification.criteria.find((c) => c.id === 'AC-search').status, 'failed');
    assert.equal(e.verification.criteria.find((c) => c.id === 'AC-regressions').status, 'passed');
  } finally { session.dispose(); }
});

for (const [name, callback, code] of [
  ['absent', undefined, 'HOST_AUTHORIZATION_REQUIRED'],
  ['denied', () => ({ approved: false }), 'AUTHORIZATION_DENIED'],
  ['stale', () => ({ approved: true, binding: 'stale', approval_id: 'x' }), 'AUTHORIZATION_DENIED'],
  ['async', async (r) => approve(r), 'AUTHORIZATION_DENIED'],
  ['identity missing', (r) => ({ approved: true, binding: r.binding }), 'AUTHORIZATION_DENIED'],
]) test('approval ' + name + ' cannot execute and consumes the session', async () => {
  const session = reviewDemo();
  try {
    await assert.rejects(session.execute(callback), { code });
    assert.equal(fs.existsSync(path.join(session.workspace, 'after.cjs')), false);
    await assert.rejects(session.execute(approve), { code: 'SESSION_CONSUMED' });
  } finally { session.dispose(); }
});

test('application-only approval cannot authorize tests', async () => {
  const session = reviewDemo();
  try {
    await assert.rejects(session.execute((r) => approve(r.application)), { code: 'AUTHORIZATION_DENIED' });
  } finally { session.dispose(); }
});

for (const filename of ['before.cjs', 'host-tests.cjs']) test('altered ' + filename + ' after review blocks all execution', async () => {
  const session = reviewDemo();
  try {
    const result = await session.execute((r) => {
      fs.appendFileSync(path.join(session.workspace, filename), '\n// changed\n');
      return approve(r);
    });
    assert.equal(result.evidence.status, 'blocked');
    assert.equal(result.evidence.error, 'DEMO_BYTES_CHANGED');
    assert.equal(result.evidence.runs.length, 0);
  } finally { session.dispose(); }
});

test('changed actual source after approval blocks application', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-demo-test-source-'));
  const file = path.join(root, 'catalog.cjs');
  fs.copyFileSync(source, file);
  const session = reviewDemo({ sourceRoot: root });
  try {
    const result = await session.execute((r) => { fs.appendFileSync(file, '\n// changed\n'); return approve(r); });
    assert.equal(result.evidence.status, 'blocked');
    assert.equal(result.evidence.source_modified, true);
    assert.equal(result.evidence.runs.length, 0);
  } finally {
    session.dispose();
    assert.equal(path.dirname(root), fs.realpathSync(os.tmpdir()));
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('timeout terminates real child and never verifies success', async () => {
  const session = reviewDemo({ timeoutMs: 1 });
  try {
    const result = await session.execute(approve);
    assert.equal(result.evidence.status, 'timed-out');
    assert.equal(result.evidence.runs.length, 1);
    assert.equal(result.evidence.runs[0].results.length, 0);
    assert.equal(result.evidence.verification.status, 'not-performed');
    assert.equal(result.evidence.accepted, false);
  } finally { session.dispose(); }
});

test('pre-cancellation never applies or spawns', async () => {
  const controller = new AbortController(); controller.abort();
  const session = reviewDemo();
  try {
    const { evidence } = await session.execute(approve, { signal: controller.signal });
    assert.equal(evidence.status, 'cancelled');
    assert.equal(evidence.runs.length, 0);
    assert.equal(evidence.application, undefined);
    assert.equal(evidence.accepted, false);
  } finally { session.dispose(); }
});

test('in-flight cancellation terminates child and prevents success', async () => {
  const controller = new AbortController();
  const session = reviewDemo();
  let timer;
  try {
    const pending = session.execute(approve, { signal: controller.signal });
    assert.throws(() => session.dispose(), { code: 'DEMO_RUNNING' });
    timer = setTimeout(() => controller.abort(), 1);
    const { evidence } = await pending;
    assert.equal(evidence.status, 'cancelled');
    assert.equal(evidence.runs.length, 1);
    assert.equal(evidence.accepted, false);
  } finally { clearTimeout(timer); session.dispose(); }
});

test('candidate changed while baseline child runs prevents second process', async () => {
  const session = reviewDemo();
  try {
    const pending = session.execute(approve);
    fs.appendFileSync(path.join(session.workspace, 'after.cjs'), '\n// altered\n');
    const { evidence } = await pending;
    assert.equal(evidence.status, 'blocked');
    assert.equal(evidence.error, 'DEMO_BYTES_CHANGED');
    assert.equal(evidence.runs.length, 1);
    assert.equal(evidence.accepted, false);
  } finally { session.dispose(); }
});

test('different patch and budget are bound to a separate exact review', async () => {
  const first = reviewDemo();
  const second = reviewDemo({ variant: 'wrong', timeoutMs: 1000 });
  try {
    assert.notEqual(first.review.application.files[0].patch_sha256, second.review.application.files[0].patch_sha256);
    assert.notEqual(first.review.candidate_sha256, second.review.candidate_sha256);
    assert.equal(second.review.limits.timeout_ms, 1000);
    assert.equal(first.review.tests.sha256, second.review.tests.sha256);
    await assert.rejects(second.execute(() => approve(first.review)), { code: 'AUTHORIZATION_DENIED' });
  } finally { first.dispose(); second.dispose(); }
});

for (const options of [{ variant: '../other' }, { timeoutMs: 0 }, { timeoutMs: 30001 }, { sourceRoot: '.' }]) {
  test('invalid host configuration fails: ' + JSON.stringify(options), () => assert.throws(() => reviewDemo(options)));
}
