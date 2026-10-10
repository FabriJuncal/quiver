// Authored demo host, NOT a general project-code executor.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { performance } = require('node:perf_hooks');
const { planDryRun } = require('../../src/create-quiver/lib/planning/dry-run');
const { reviewDevelopmentWorkspace } = require('../../src/create-quiver/lib/planning/supervised-workspace');

const HASHES = Object.freeze({
  original: '53bb860614f41981c168eb400fc5cd9508ceab9ea4ee25aea04515100fe2331f',
  search: '5c1f9df81e4577db5356c11cac701379f98ca5369caff9801ac47d25b49fc5bb',
  wrong: 'e50906f3068d3e6dcb1bf36f22d2047ba7336165de61d0a3fd17890bd4a9ad01',
  tests: '95875e02e753b4be4b28c3ede17afb181bb1df881f617e13521565146ceed3a6',
});
const IDS = ['regression-list', 'regression-by-id', 'regression-copy', 'search-name', 'search-absent', 'search-empty'];
const hash = (bytes) => 'sha256:' + crypto.createHash('sha256').update(bytes).digest('hex');
const fail = (code) => { throw Object.assign(new Error(code), { code }); };
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
function readFile(filename, expected) {
  const stat = fs.lstatSync(filename);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.size > 65536) fail('UNSAFE_DEMO_FILE');
  const bytes = fs.readFileSync(filename);
  if (hash(bytes) !== expected) fail('DEMO_BYTES_CHANGED');
  return bytes;
}
function requestFor(before, after) {
  const sha256 = hash(before);
  const oldLines = before.toString().trimEnd().split('\n');
  const newLines = after.toString().trimEnd().split('\n');
  const diff = ['--- a/catalog.cjs', '+++ b/catalog.cjs',
    '@@ -1,' + oldLines.length + ' +1,' + newLines.length + ' @@',
    ...oldLines.map((line) => '-' + line), ...newLines.map((line) => '+' + line), ''].join('\n');
  const task = {
    schema_version: 1, task_id: 'controlled-catalog', run_id: 'catalog-search', revision: 1,
    domain: 'development', objective: 'Add name search to the authored catalog example',
    criteria: [{ id: 'AC-search', text: 'Name substring search ignores case and surrounding spaces; empty returns all; missing returns none' },
      { id: 'AC-regressions', text: 'Listing, ID lookup and defensive copies remain correct' }],
    inputs: [{ id: 'input-app', resource_id: 'app', sha256 }],
    actions: [{ action_id: 'change-app', capability: 'development.propose-change', resource_id: 'app',
      input_ids: ['input-app'], criterion_ids: ['AC-search', 'AC-regressions'], phase: 'prepare', claimed_risk: 'low' }],
    budgets: { max_actions: 1, max_input_bytes: 2048 },
  };
  const trusted_context = {
    schema_version: 1, policy_id: 'authored-demo-only', policy_revision: 1,
    task_id: task.task_id, run_id: task.run_id, task_revision: 1,
    resources: [{ resource_id: 'app', path: 'catalog.cjs', classification: 'ordinary', sha256, size_bytes: before.length }],
    allowed_capabilities: ['development.propose-change'],
    permissions: { snapshot_id: 'demo-host', revision: 1, grants: [{ capability: 'development.propose-change', resource_id: 'app' }] },
    budgets: { max_actions: 1, max_input_bytes: 2048 },
  };
  return { task, trusted_context, proposal_input: {
    schema_version: 1, expected_plan_binding: planDryRun(task, trusted_context).binding,
    patches: [{ action_id: 'change-app', unified_diff: diff }],
    proposed_tests: [{ test_id: 'host-fixed-tests', action_id: 'change-app',
      criterion_ids: ['AC-search', 'AC-regressions'], description: 'Host-owned fixed catalog assertions; not a shell command' }],
    evidence_references: [],
  } };
}

async function runFixed(command, env, timeoutMs, signal) {
  const started = performance.now();
  const base = { command, environment: env, runtime: { node: process.version, platform: process.platform, arch: process.arch },
    started_at: new Date().toISOString(), timeout_ms: timeoutMs };
  if (signal?.aborted) return { ...base, status: 'cancelled', exit_code: null, signal: null, duration_ms: 0, results: [] };
  return new Promise((resolve) => {
    let child; let timer; let status; let bytes = 0; let stdout = ''; let stderr = ''; let finished = false;
    const stop = (reason) => {
      if (finished || status) return;
      status = reason;
      if (child) child.kill('SIGKILL');
    };
    const abort = () => stop('cancelled');
    const finish = (code, exitSignal, error) => {
      if (finished) return;
      finished = true; clearTimeout(timer); signal?.removeEventListener('abort', abort);
      let results = [];
      if (!status && !error && exitSignal === null && (code === 0 || code === 1)) {
        try {
          const parsed = JSON.parse(stdout);
          if (Object.keys(parsed).join() !== 'results' || !Array.isArray(parsed.results) || parsed.results.length !== IDS.length
            || parsed.results.some((item, i) => Object.keys(item).sort().join() !== 'id,passed'
              || item.id !== IDS[i] || typeof item.passed !== 'boolean')) throw new Error('invalid');
          results = parsed.results;
          if ((results.every((r) => r.passed) ? 0 : 1) !== code) throw new Error('inconsistent');
          status = code === 0 ? 'passed' : 'failed';
        } catch { status = 'invalid-result'; results = []; }
      }
      resolve({ ...base, status: status || 'process-error', exit_code: code ?? null, signal: exitSignal ?? null,
        error: error?.code || null, duration_ms: performance.now() - started, results, stdout, stderr });
    };
    try {
      child = spawn(command.executable, command.args, { cwd: command.cwd, shell: false, env,
        windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      for (const [stream, key] of [[child.stdout, 'stdout'], [child.stderr, 'stderr']]) {
        stream.on('data', (chunk) => {
          bytes += chunk.length;
          if (bytes > 65536) { stop('output-limit'); return; }
          if (key === 'stdout') stdout += chunk.toString('utf8'); else stderr += chunk.toString('utf8');
        });
      }
      child.once('error', (error) => finish(null, null, error));
      child.once('close', (code, exitSignal) => finish(code, exitSignal));
      signal?.addEventListener('abort', abort, { once: true });
      if (signal?.aborted) abort();
      timer = setTimeout(() => stop('timed-out'), timeoutMs);
    } catch (error) { finish(null, null, error); }
  });
}

function reviewDemo({ variant = 'search', timeoutMs = 5000, sourceRoot = path.join(__dirname, 'app') } = {}) {
  if (!['search', 'wrong'].includes(variant)) fail('UNKNOWN_DEMO_VARIANT');
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) fail('INVALID_TIMEOUT');
  if (typeof sourceRoot !== 'string' || !path.isAbsolute(sourceRoot)) fail('ABSOLUTE_ROOT_REQUIRED');
  const source = path.join(sourceRoot, 'catalog.cjs');
  const before = readFile(source, 'sha256:' + HASHES.original);
  const after = readFile(path.join(__dirname, 'fixtures', variant + '.cjs'), 'sha256:' + HASHES[variant]);
  const tests = readFile(path.join(__dirname, 'host-tests.cjs'), 'sha256:' + HASHES.tests);
  const request = requestFor(before, after);
  const application = reviewDevelopmentWorkspace(sourceRoot, request);
  const tempRoot = fs.realpathSync(os.tmpdir());
  const stage = fs.mkdtempSync(path.join(tempRoot, 'quiver-controlled-demo-'));
  fs.chmodSync(stage, 0o700);
  const owned = [{ path: stage, ino: fs.statSync(stage).ino }];
  const baselinePath = path.join(stage, 'before.cjs');
  const candidatePath = path.join(stage, 'after.cjs');
  const testPath = path.join(stage, 'host-tests.cjs');
  fs.writeFileSync(baselinePath, before, { flag: 'wx' });
  fs.writeFileSync(testPath, tests, { flag: 'wx' });
  // No inherited NODE_OPTIONS, tokens, HOME, PATH or provider credentials.
  const environment = process.platform === 'win32' && process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {};
  const command = (target) => ({ executable: process.execPath, args: [testPath, target], cwd: stage, shell: false });
  const manifest = {
    revision: 'controlled-development-demo-v1', variant, application: application.review,
    source: path.resolve(source), source_sha256: hash(before), candidate_sha256: hash(after),
    tests: { sha256: hash(tests), ids: IDS, criterion_ids: { 'AC-search': IDS.slice(3), 'AC-regressions': IDS.slice(0, 3) } },
    commands: { before: command(baselinePath), after: command(candidatePath) },
    environment, runtime: { node: process.version, platform: process.platform, arch: process.arch },
    limits: { timeout_ms: timeoutMs, max_output_bytes: 65536 }, accepted: false,
  };
  const review = freeze({ ...manifest, binding: hash(JSON.stringify(manifest)) });
  let consumed = false;
  let running = false;
  const check = (candidate = false) => {
    readFile(source, review.source_sha256);
    readFile(baselinePath, review.source_sha256);
    readFile(testPath, review.tests.sha256);
    if (candidate) readFile(candidatePath, review.candidate_sha256);
  };
  return Object.freeze({
    review, workspace: stage,
    async execute(authorize, { signal } = {}) {
      if (consumed) fail('SESSION_CONSUMED');
      consumed = true;
      if (signal !== undefined && !(signal instanceof AbortSignal)) fail('INVALID_SIGNAL');
      if (typeof authorize !== 'function') fail('HOST_AUTHORIZATION_REQUIRED');
      const approval = authorize(review);
      if (!approval || approval.approved !== true || approval.binding !== review.binding
        || typeof approval.approval_id !== 'string' || !/^[A-Za-z0-9._:-]{1,128}$/.test(approval.approval_id)) fail('AUTHORIZATION_DENIED');
      running = true;
      const evidence = { schema_version: 1, binding: review.binding, approval_id: approval.approval_id,
        review, status: 'blocked', accepted: false, verification: { status: 'not-performed' }, runs: [], source_modified: false };
      try {
        check();
        if (signal?.aborted) { evidence.status = 'cancelled'; return persist(); }
        const applied = application.execute((r) => ({ approved: true, binding: r.binding, approval_id: approval.approval_id }));
        owned.push({ path: applied.workspace, ino: fs.statSync(applied.workspace).ino });
        evidence.application = { ...applied.evidence, evidence_sha256: applied.evidence_sha256 };
        const output = readFile(path.join(applied.workspace, 'files/catalog.cjs'), review.candidate_sha256);
        fs.writeFileSync(candidatePath, output, { flag: 'wx' });
        check(true);
        const beforeRun = await runFixed(review.commands.before, environment, timeoutMs, signal);
        evidence.runs.push(beforeRun);
        check(true);
        const expectedBefore = beforeRun.status === 'failed' && beforeRun.exit_code === 1
          && beforeRun.results.every((r) => r.passed === !['search-name', 'search-absent'].includes(r.id));
        if (!expectedBefore) { evidence.status = beforeRun.status === 'passed' ? 'baseline-not-red' : beforeRun.status; return persist(); }
        const afterRun = await runFixed(review.commands.after, environment, timeoutMs, signal);
        evidence.runs.push(afterRun);
        check(true);
        evidence.status = afterRun.status;
        evidence.verification = {
          status: afterRun.status === 'passed' ? 'passed-authored-demo' : 'not-verified',
          criteria: Object.entries(review.tests.criterion_ids).map(([id, ids]) => ({
            id, status: ['passed', 'failed'].includes(afterRun.status)
              ? (ids.every((testId) => afterRun.results.find((r) => r.id === testId)?.passed) ? 'passed' : 'failed')
              : 'not-verified',
          })),
        };
        return persist();
      } catch (error) {
        evidence.status = 'blocked'; evidence.error = error.code || 'DEMO_ERROR';
        try { readFile(source, review.source_sha256); } catch { evidence.source_modified = true; }
        return persist();
      } finally { running = false; }
      function persist() {
        const bytes = JSON.stringify(evidence, null, 2) + '\n';
        const filename = path.join(stage, 'verification.json');
        fs.writeFileSync(filename, bytes, { flag: 'wx', mode: 0o600 });
        return { evidence, evidence_path: filename, evidence_sha256: hash(bytes), workspace: stage };
      }
    },
    dispose() {
      if (running) fail('DEMO_RUNNING');
      consumed = true;
      for (const entry of owned) {
        if (!fs.existsSync(entry.path)) continue;
        if (path.dirname(entry.path) !== tempRoot || !/^quiver-(controlled-demo|supervised)-/.test(path.basename(entry.path))
          || fs.lstatSync(entry.path).isSymbolicLink() || fs.statSync(entry.path).ino !== entry.ino) fail('UNSAFE_CLEANUP');
        fs.rmSync(entry.path, { recursive: true, force: true });
      }
    },
  });
}
module.exports = { reviewDemo };
