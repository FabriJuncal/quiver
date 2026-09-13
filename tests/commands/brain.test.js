const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const packageJson = require('../../package.json');
const {
  EXIT_CODES,
  formatHumanResult,
  runBrain,
} = require('../../src/create-quiver/commands/brain');
const { buildDefaultGovernanceConfig } = require('../../src/create-quiver/lib/ai/review-governance');
const { brainPaths, initializeBrainStore } = require('../../src/create-quiver/lib/brain/store');
const { createTranslator } = require('../../src/create-quiver/lib/i18n/catalog');

const PROJECT_ID = '123e4567-e89b-12d3-a456-426614174000';
const NOW = '2026-09-06T12:00:00.000Z';

function makeProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-brain-command-test-'));
  fs.mkdirSync(path.join(root, '.quiver'), { recursive: true });
  initializeBrainStore(root, { projectId: PROJECT_ID, writerCheck: false });
  const actorResolver = async (request) => ({
    actor_id: 'actor:brain-cli',
    verified: true,
    project_id: request.project_id,
    grants: [
      { action: 'brain.read' }, { action: 'brain.write' }, { action: 'brain.export' },
      { action: 'brain.propose' }, { action: 'brain.delete' },
    ],
    evidence_refs: [],
  });
  return {
    root,
    actorResolver,
    defaults: { actorResolver, clock: () => new Date(NOW), emit: false, setExitCode: false },
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}

function inputRecord(id = 'record:cli') {
  return {
    id,
    type: 'assumption',
    payload: { text: 'CLI knowledge' },
    source_refs: [],
    authority_request: 'agent-assumption',
    supersedes: [],
    evidence_refs: [],
  };
}

function readTree(root) {
  const files = new Map();
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const target = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(target);
      else files.set(path.relative(root, target).split(path.sep).join('/'), fs.readFileSync(target));
    }
  };
  visit(root);
  return files;
}

test('brain add and export dry-runs validate fully without writing any bytes', async () => {
  const project = makeProject();
  try {
    const inputPath = path.join(project.root, 'record.json');
    fs.writeFileSync(inputPath, `${JSON.stringify(inputRecord(), null, 2)}\n`);
    const beforeAdd = readTree(project.root);
    const add = await runBrain(project.root, {
      ...project.defaults,
      command: 'add',
      dryRun: true,
      expectedRevision: 0,
      input: 'record.json',
      operationId: 'cli-add-preview',
    });
    assert.equal(add.code, 'OK');
    assert.equal(add.data.dry_run, true);
    assert.equal(add.data.would_revision, 1);
    assert.deepEqual(add.data.writes, []);
    const afterAdd = readTree(project.root);
    assert.deepEqual([...afterAdd.keys()], [...beforeAdd.keys()]);
    for (const [file, bytes] of beforeAdd) assert.deepEqual(bytes, afterAdd.get(file), file);

    const beforeExport = readTree(project.root);
    const exported = await runBrain(project.root, {
      ...project.defaults,
      command: 'export',
      destination: 'preview-vault',
      dryRun: true,
    });
    assert.equal(exported.code, 'OK');
    assert.equal(exported.data.dry_run, true);
    assert.deepEqual(exported.data.writes, []);
    assert.equal(fs.existsSync(path.join(project.root, 'preview-vault')), false);
    const afterExport = readTree(project.root);
    assert.deepEqual([...afterExport.keys()], [...beforeExport.keys()]);
    for (const [file, bytes] of beforeExport) assert.deepEqual(bytes, afterExport.get(file), file);
  } finally {
    project.cleanup();
  }
});

test('brain status, list, show, add, export, and delete return Result v1', async () => {
  const project = makeProject();
  try {
    fs.writeFileSync(path.join(project.root, 'record.json'), `${JSON.stringify(inputRecord(), null, 2)}\n`);
    const added = await runBrain(project.root, {
      ...project.defaults, command: 'add', input: 'record.json', operationId: 'cli-add', expectedRevision: 0,
    });
    assert.equal(added.schema_version, 1);
    assert.equal(added.code, 'OK');

    const status = await runBrain(project.root, { ...project.defaults, command: 'status' });
    assert.deepEqual(status.data.counts, { records: 1, proposals: 0, operations: 1 });
    assert.match(formatHumanResult(status, 'status', createTranslator('en')), /secrets and credential-bearing fields/);
    assert.match(formatHumanResult(status, 'status', createTranslator('en')), /brain delete first supports a no-write dry-run/);

    const listed = await runBrain(project.root, { ...project.defaults, command: 'list', validity: 'all' });
    assert.deepEqual(listed.data.records.map((item) => item.id), ['record:cli']);
    const shown = await runBrain(project.root, { ...project.defaults, command: 'show', id: 'record:cli' });
    assert.equal(shown.data.record.payload.text, 'CLI knowledge');
    assert.equal((await runBrain(project.root, { ...project.defaults, command: 'show', id: 'record:missing' })).code, 'REFERENCE_INVALID');

    const exported = await runBrain(project.root, { ...project.defaults, command: 'export', destination: 'cli-vault' });
    assert.equal(exported.code, 'OK');
    assert.equal(fs.existsSync(path.join(project.root, 'cli-vault', 'manifest.json')), true);
    const deletion = await runBrain(project.root, {
      ...project.defaults, command: 'delete', confirmDelete: PROJECT_ID, dryRun: true,
      operationId: 'cli-delete-preview', expectedRevision: 1,
    });
    assert.equal(deletion.code, 'OK');
    assert.equal(deletion.data.dry_run, true);
  } finally {
    project.cleanup();
  }
});

test('every Brain command fails closed without a trusted actor adapter', async () => {
  const project = makeProject();
  try {
    const before = readTree(project.root);
    const common = { emit: false, setExitCode: false };
    const cases = [
      { command: 'status' },
      { command: 'list' },
      { command: 'show', id: 'record:missing' },
      { command: 'add', record: inputRecord(), operationId: 'denied-add', expectedRevision: 0 },
      { command: 'export', destination: 'denied-export' },
      { command: 'delete', confirmDelete: PROJECT_ID, operationId: 'denied-delete', expectedRevision: 0 },
    ];
    for (const item of cases) {
      const response = await runBrain(project.root, { ...common, ...item });
      assert.equal(response.code, 'ACTOR_UNVERIFIED', item.command);
      assert.equal(EXIT_CODES[response.code], 3);
    }
    assert.equal(fs.existsSync(path.join(project.root, 'denied-export')), false);
    const after = readTree(project.root);
    assert.deepEqual([...after.keys()], [...before.keys()]);
    for (const [file, bytes] of before) assert.deepEqual(bytes, after.get(file), file);
  } finally {
    project.cleanup();
  }
});

test('CLI brain namespace emits canonical JSON and stable policy exit class', () => {
  const project = makeProject();
  try {
    const bin = path.resolve(__dirname, '../../bin/create-quiver.js');
    const invocation = spawnSync(process.execPath, [bin, 'brain', 'status', '--json'], {
      cwd: project.root,
      encoding: 'utf8',
      env: { ...process.env, LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8' },
    });
    assert.equal(invocation.status, 3);
    const response = JSON.parse(invocation.stdout);
    assert.equal(response.schema_version, 1);
    assert.equal(response.code, 'ACTOR_UNVERIFIED');
    assert.equal(response.status, 'blocked');

    const before = readTree(project.root);
    const missingInput = spawnSync(process.execPath, [bin, 'brain', 'add', '--json'], {
      cwd: project.root,
      encoding: 'utf8',
    });
    assert.equal(missingInput.status, 2);
    assert.equal(missingInput.stderr, '');
    assert.equal(JSON.parse(missingInput.stdout).code, 'VALIDATION_FAILED');

    const invalid = spawnSync(process.execPath, [bin, 'brain', 'delete', '--contract-version', '2', '--dry-run', '--json'], {
      cwd: project.root,
      encoding: 'utf8',
    });
    assert.equal(invalid.status, 2);
    assert.equal(invalid.stderr, '');
    const invalidResult = JSON.parse(invalid.stdout);
    assert.equal(invalidResult.schema_version, 1);
    assert.equal(invalidResult.code, 'VALIDATION_FAILED');
    assert.equal(fs.existsSync(brainPaths(project.root).root), true);
    const after = readTree(project.root);
    assert.deepEqual([...after.keys()], [...before.keys()]);
    for (const [file, bytes] of before) assert.deepEqual(bytes, after.get(file), file);
  } finally {
    project.cleanup();
  }
});

test('Brain writer compatibility failures stay inside Result v1 with capability exit class', () => {
  const project = makeProject();
  try {
    const governance = buildDefaultGovernanceConfig();
    governance.compatibility.writer_mode = 'read-only';
    fs.writeFileSync(path.join(project.root, '.quiver', 'config.json'), `${JSON.stringify({ governance }, null, 2)}\n`);
    fs.writeFileSync(path.join(project.root, '.quiver', 'state.json'), `${JSON.stringify({
      initialized_version: packageJson.version,
      last_initialized_at: NOW,
      quiver_version: packageJson.version,
    }, null, 2)}\n`);
    fs.writeFileSync(path.join(project.root, 'record.json'), `${JSON.stringify(inputRecord('record:read-only'), null, 2)}\n`);
    const before = readTree(project.root);
    const bin = path.resolve(__dirname, '../../bin/create-quiver.js');
    const invocation = spawnSync(process.execPath, [
      bin, 'brain', 'add', '--input', 'record.json', '--operation-id', 'read-only-add',
      '--expected-revision', '0', '--json',
    ], { cwd: project.root, encoding: 'utf8' });
    assert.equal(invocation.status, 4);
    assert.equal(invocation.stderr, '');
    const response = JSON.parse(invocation.stdout);
    assert.equal(response.schema_version, 1);
    assert.equal(response.status, 'blocked');
    assert.equal(response.code, 'GOVERNANCE_READ_ONLY');
    const after = readTree(project.root);
    assert.deepEqual([...after.keys()], [...before.keys()]);
    for (const [file, bytes] of before) assert.deepEqual(bytes, after.get(file), file);
  } finally {
    project.cleanup();
  }
});
