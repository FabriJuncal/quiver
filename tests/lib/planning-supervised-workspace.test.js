const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { planDryRun } = require('../../src/create-quiver/lib/planning/dry-run');
const { reviewDevelopmentWorkspace } = require('../../src/create-quiver/lib/planning/supervised-workspace');
const example = require('../../examples/planning-dry-run/development-proposal.json');
const digest = (value) => `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
const approve = (review) => ({ approved: true, binding: review.binding, approval_id: 'host-test-approval' });
function fixture(content = 'const version = 1;\n') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-source-'));
  fs.mkdirSync(path.join(root, 'src'));
  fs.writeFileSync(path.join(root, 'src/example.js'), content);
  const request = JSON.parse(JSON.stringify(example));
  request.task.inputs[0].sha256 = digest(content);
  Object.assign(request.trusted_context.resources[0], { sha256: digest(content), size_bytes: Buffer.byteLength(content) });
  const bind = () => { request.proposal_input.expected_plan_binding = planDryRun(request.task, request.trusted_context).binding; };
  bind();
  return { root, request, bind, file: path.join(root, 'src/example.js'), cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}
function reject(fn, code) { assert.throws(fn, (error) => error.code === code); }

test('review is read-only; approval applies exact bytes to a private copy with verifiable evidence', () => {
  const x = fixture(); let result;
  try {
    const session = reviewDevelopmentWorkspace(x.root, x.request);
    assert.equal(fs.readFileSync(x.file, 'utf8'), 'const version = 1;\n');
    assert.deepEqual(session.review.scope.paths, ['src/example.js']);
    assert.ok(Object.isFrozen(session.review.files[0]));
    assert.equal(session.review.files[0].after_sha256, digest('const version = 2;\n'));
    result = session.execute(approve);
    assert.equal(fs.readFileSync(path.join(result.workspace, 'files/src/example.js'), 'utf8'), 'const version = 2;\n');
    assert.equal(fs.readFileSync(x.file, 'utf8'), 'const version = 1;\n');
    assert.equal(digest(fs.readFileSync(path.join(result.workspace, 'evidence.json'))), result.evidence_sha256);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(result.workspace, 'evidence.json'))), result.evidence);
    assert.equal(result.evidence.accepted, false);
    assert.equal(result.evidence.tests.status, 'not-performed');
    assert.equal(result.evidence.verification.status, 'not-performed');
    reject(() => session.execute(approve), 'SESSION_CONSUMED');
  } finally { if (result) fs.rmSync(result.workspace, { recursive: true, force: true }); x.cleanup(); }
});

for (const [name, authorize] of [
  ['missing host callback', undefined], ['deny', () => false], ['forged binding', () => ({ approved: true, binding: 'stale', approval_id: 'x' })],
  ['missing approval identity', (r) => ({ approved: true, binding: r.binding })],
  ['async callback is not synchronously authorized', async (r) => approve(r)],
]) test(name, () => {
  const x = fixture();
  try {
    const session = reviewDevelopmentWorkspace(x.root, x.request);
    reject(() => session.execute(authorize), name === 'missing host callback' ? 'HOST_AUTHORIZATION_REQUIRED' : 'AUTHORIZATION_DENIED');
    reject(() => session.execute(approve), 'SESSION_CONSUMED');
    assert.equal(fs.readFileSync(x.file, 'utf8'), 'const version = 1;\n');
  } finally { x.cleanup(); }
});

test('changed bytes during host approval reject before any output workspace is created', () => {
  const x = fixture();
  try {
    const session = reviewDevelopmentWorkspace(x.root, x.request);
    const before = fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith('quiver-supervised-')).sort();
    reject(() => session.execute((r) => { fs.writeFileSync(x.file, 'const version = 9;\n'); return approve(r); }), 'BASE_MISMATCH');
    assert.deepEqual(fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith('quiver-supervised-')).sort(), before);
  } finally { x.cleanup(); }
});

test('all non-target inputs are rechecked after approval', () => {
  const x = fixture();
  try {
    fs.writeFileSync(path.join(x.root, 'guide.md'), 'guide\n');
    x.request.task.inputs.push({ id: 'input-2', resource_id: 'resource-2', sha256: digest('guide\n') });
    x.request.task.actions[0].input_ids.push('input-2');
    x.request.trusted_context.resources.push({ resource_id: 'resource-2', path: 'guide.md', classification: 'ordinary', sha256: digest('guide\n'), size_bytes: 6 });
    x.request.trusted_context.permissions.grants.push({ capability: 'development.propose-change', resource_id: 'resource-2' });
    x.bind();
    const session = reviewDevelopmentWorkspace(x.root, x.request);
    reject(() => session.execute((r) => { fs.writeFileSync(path.join(x.root, 'guide.md'), 'other\n'); return approve(r); }), 'BASE_MISMATCH');
  } finally { x.cleanup(); }
});

for (const [name, mutate, code] of [
  ['stale hash', (x) => fs.writeFileSync(x.file, 'changed\n'), 'BASE_MISMATCH'],
  ['false size', (x) => { x.request.trusted_context.resources[0].size_bytes += 1; x.bind(); }, 'BASE_MISMATCH'],
  ['missing permission', (x) => { x.request.trusted_context.permissions.grants = []; x.bind(); }, 'PROPOSAL_NOT_PREPARED'],
  ['patch context mismatch', (x) => { x.request.proposal_input.patches[0].unified_diff = x.request.proposal_input.patches[0].unified_diff.replace('-const version = 1;', '-wrong'); }, 'PATCH_NOT_APPLICABLE'],
  ['out of bounds hunk', (x) => { x.request.proposal_input.patches[0].unified_diff = x.request.proposal_input.patches[0].unified_diff.replace('@@ -1 +1 @@', '@@ -8 +8 @@'); }, 'PATCH_NOT_APPLICABLE'],
  ['extra path in patch', (x) => { x.request.proposal_input.patches[0].unified_diff += '--- a/extra\n'; }, 'PROPOSAL_NOT_PREPARED'],
]) test(name, () => { const x = fixture(); try { mutate(x); reject(() => reviewDevelopmentWorkspace(x.root, x.request), code); } finally { x.cleanup(); } });

for (const content of ['const version = 1;\r\n', 'const version = 1;', Buffer.from([0xff, 10]), 'x\0\n']) test(`unsupported text ${digest(content)}`, () => {
  const x = fixture(content); try { reject(() => reviewDevelopmentWorkspace(x.root, x.request), 'UNSUPPORTED_TEXT'); } finally { x.cleanup(); }
});

test('hardlinks are rejected without privileges or skipped assertions', () => {
  const x = fixture();
  try { fs.linkSync(x.file, path.join(x.root, 'alias')); reject(() => reviewDevelopmentWorkspace(x.root, x.request), 'UNSAFE_FILE'); } finally { x.cleanup(); }
});

test('directory junction input escape is rejected (real link, no skip)', () => {
  const x = fixture(); const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-outside-'));
  try {
    fs.writeFileSync(path.join(outside, 'example.js'), 'const version = 1;\n');
    fs.renameSync(path.join(x.root, 'src'), path.join(x.root, 'original'));
    fs.symlinkSync(outside, path.join(x.root, 'src'), process.platform === 'win32' ? 'junction' : 'dir');
    reject(() => reviewDevelopmentWorkspace(x.root, x.request), 'UNSAFE_FILE');
  } finally { x.cleanup(); fs.rmSync(outside, { recursive: true, force: true }); }
});

test('request getters and proxies are rejected before callbacks', () => {
  let calls = 0;
  const request = { get task() { calls += 1; }, trusted_context: {}, proposal_input: {} };
  reject(() => reviewDevelopmentWorkspace(os.tmpdir(), request), 'INVALID_REQUEST');
  reject(() => reviewDevelopmentWorkspace(os.tmpdir(), new Proxy({}, { get() { calls += 1; } })), 'INVALID_REQUEST');
  assert.equal(calls, 0);
});

for (const suffix of ['', path.sep, `${path.sep}.`]) test(`root junction is rejected with suffix ${JSON.stringify(suffix)}`, () => {
  const x = fixture(); const holder = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-root-link-'));
  const link = path.join(holder, 'source');
  try {
    fs.symlinkSync(x.root, link, process.platform === 'win32' ? 'junction' : 'dir');
    reject(() => reviewDevelopmentWorkspace(`${link}${suffix}`, x.request), 'UNSAFE_ROOT');
  } finally { fs.rmSync(holder, { recursive: true, force: true }); x.cleanup(); }
});

test('caller mutation cannot alter the already reviewed snapshot', () => {
  const x = fixture(); let result;
  try {
    const session = reviewDevelopmentWorkspace(x.root, x.request);
    x.request.proposal_input.patches[0].unified_diff = 'hostile';
    result = session.execute(approve);
    assert.equal(fs.readFileSync(path.join(result.workspace, 'files/src/example.js'), 'utf8'), 'const version = 2;\n');
  } finally { if (result) fs.rmSync(result.workspace, { recursive: true, force: true }); x.cleanup(); }
});

test('multiple hunks preserve untouched lines and exact context', () => {
  const x = fixture('a\nb\nc\nd\ne\n'); let result;
  try {
    x.request.proposal_input.patches[0].unified_diff = '--- a/src/example.js\n+++ b/src/example.js\n@@ -1,2 +1,3 @@\n a\n-b\n+B\n+extra\n@@ -4,2 +5,1 @@\n-d\n e\n';
    result = reviewDevelopmentWorkspace(x.root, x.request).execute(approve);
    assert.equal(fs.readFileSync(path.join(result.workspace, 'files/src/example.js'), 'utf8'), 'a\nB\nextra\nc\ne\n');
  } finally { if (result) fs.rmSync(result.workspace, { recursive: true, force: true }); x.cleanup(); }
});

for (const [before, hunk, after] of [
  ['', '@@ -0,0 +1 @@\n+hello\n', 'hello\n'],
  ['hello\n', '@@ -1 +0,0 @@\n-hello\n', ''],
  ['hello\n', '@@ -1,0 +2 @@\n+world\n', 'hello\nworld\n'],
]) test(`exact boundary ${digest(hunk)}`, () => {
  const x = fixture(before); let result;
  try {
    x.request.proposal_input.patches[0].unified_diff = `--- a/src/example.js\n+++ b/src/example.js\n${hunk}`;
    result = reviewDevelopmentWorkspace(x.root, x.request).execute(approve);
    assert.equal(fs.readFileSync(path.join(result.workspace, 'files/src/example.js'), 'utf8'), after);
  } finally { if (result) fs.rmSync(result.workspace, { recursive: true, force: true }); x.cleanup(); }
});

test('approval binding cannot be reused for a different source root', () => {
  const a = fixture(); const b = fixture();
  try {
    const first = reviewDevelopmentWorkspace(a.root, a.request);
    const second = reviewDevelopmentWorkspace(b.root, b.request);
    assert.notEqual(first.review.binding, second.review.binding);
    reject(() => second.execute(() => approve(first.review)), 'AUTHORIZATION_DENIED');
  } finally { a.cleanup(); b.cleanup(); }
});

test('source roots containing the temp destination are rejected before writing', () => {
  const x = fixture();
  try { reject(() => reviewDevelopmentWorkspace(os.tmpdir(), x.request), 'TEMP_WITHIN_SOURCE'); } finally { x.cleanup(); }
});

test('proposed code is copied but never evaluated', () => {
  const x = fixture(); let result;
  try {
    x.request.proposal_input.patches[0].unified_diff = '--- a/src/example.js\n+++ b/src/example.js\n@@ -1 +1 @@\n-const version = 1;\n+throw new Error("must not run");\n';
    result = reviewDevelopmentWorkspace(x.root, x.request).execute(approve);
    assert.equal(result.evidence.tests.status, 'not-performed');
    assert.match(fs.readFileSync(path.join(result.workspace, 'files/src/example.js'), 'utf8'), /must not run/);
  } finally { if (result) fs.rmSync(result.workspace, { recursive: true, force: true }); x.cleanup(); }
});
