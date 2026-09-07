const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { acquireLock, releaseLock } = require('../../src/create-quiver/lib/locks');
const { buildDefaultGovernanceConfig } = require('../../src/create-quiver/lib/ai/review-governance');
const packageJson = require('../../package.json');
const {
  assertSupportedLocalDecisionBinding,
  knowledgeDigest,
} = require('../../src/create-quiver/lib/brain/authority');
const { canonicalDigest, RECORD_TYPES } = require('../../src/create-quiver/lib/brain/schema');
const {
  brainPaths,
  createBrainStore,
  initializeBrainStore,
} = require('../../src/create-quiver/lib/brain/store');

const PROJECT_ID = '123e4567-e89b-12d3-a456-426614174000';
const NOW = '2026-09-06T12:00:00.000Z';

function makeProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-brain-test-'));
  fs.mkdirSync(path.join(root, '.quiver'), { recursive: true });
  return { root, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

function grantsFor(authority = 'agent-assumption') {
  const grants = [{ action: 'brain.write' }, { action: 'brain.read' }];
  const authorityGrant = {
    policy: 'brain.policy.write',
    'approved-decision': 'brain.decision.write',
    requirement: 'brain.requirement.write',
    'authorized-input': 'brain.input.write',
  }[authority];
  if (authorityGrant) grants.push({ action: authorityGrant });
  return grants;
}

function trustedResolver(extraGrants = []) {
  return async (request) => ({
    actor_id: 'actor:fixture-writer',
    verified: true,
    project_id: request.project_id,
    grants: [...grantsFor(), ...extraGrants],
    evidence_refs: [],
  });
}

function makeStore(root, options = {}) {
  return createBrainStore({
    projectRoot: root,
    actorResolver: options.actorResolver || trustedResolver(options.extraGrants),
    evidenceResolver: options.evidenceResolver,
    clock: () => new Date(NOW),
    faultInjector: options.faultInjector,
  });
}

function assumption(id, options = {}) {
  return {
    id,
    type: options.type || 'assumption',
    payload: options.payload || { text: `Knowledge ${id}` },
    source_refs: options.source_refs || [],
    authority_request: options.authority || 'agent-assumption',
    ...(options.supersedes ? { supersedes: options.supersedes } : {}),
    evidence_refs: options.evidence_refs || [],
    ...(options.approval_ref ? { approval_ref: options.approval_ref } : {}),
  };
}

function ref(id, uri) {
  return { id, digest: crypto.createHash('sha256').update(id).digest('hex'), uri };
}

function cloudFixture(recordBase, stateRef) {
  const subjectRef = recordBase.source_refs[0];
  const policyRef = recordBase.source_refs[1];
  const actorEvidence = ref('actor-evidence', 'https://cloud.example/evidence/actor');
  const decisionEvidence = ref('decision-evidence', 'https://cloud.example/evidence/decision');
  const receiptBase = {
    schema_version: 1,
    type: 'cloud-decision-receipt',
    id: 'receipt:1',
    organization_id: 'organization:1',
    project_id: PROJECT_ID,
    decision_ref: ref('decision:1', 'https://cloud.example/decisions/1'),
    subject: { ref: subjectRef, version: 1 },
    knowledge_digest: knowledgeDigest(recordBase),
    action: 'brain.decision.write',
    actor: { actor_id: 'actor:original-decider', evidence_refs: [actorEvidence] },
    policy: { ref: policyRef, rule: 'allow-approved-knowledge' },
    resolution: 'allowed',
    resolved_at: '2026-09-06T11:00:00.000Z',
    expires_at: null,
    evidence_refs: [actorEvidence, decisionEvidence],
  };
  const receipt = { ...receiptBase, digest: canonicalDigest(receiptBase) };
  const approvalRef = { id: receipt.id, digest: receipt.digest, uri: 'https://cloud.example/receipts/1' };
  const resolver = async (request) => ({
    schema_version: 1,
    status: 'passed',
    code: 'OK',
    data: {
      receipt,
      source_revision: 7,
      checked_at: NOW,
      state: stateRef.value,
    },
    errors: [],
    evidence_status: 'verified',
  });
  return { approvalRef, receipt, resolver };
}

test('empty Brain initialization is stable and idempotent', () => {
  const project = makeProject();
  try {
    const first = initializeBrainStore(project.root, { projectId: PROJECT_ID });
    const before = fs.readFileSync(brainPaths(project.root).manifestPath, 'utf8');
    const second = initializeBrainStore(project.root);
    assert.equal(first.created, true);
    assert.equal(second.created, false);
    assert.equal(second.manifest.project_id, PROJECT_ID);
    assert.equal(second.manifest.revision, 0);
    assert.deepEqual(second.manifest.record_refs, []);
    assert.equal(fs.readFileSync(brainPaths(project.root).manifestPath, 'utf8'), before);
  } finally {
    project.cleanup();
  }
});

test('protected operations do not lazily recreate an absent Brain', async () => {
  const project = makeProject();
  try {
    const before = fs.readdirSync(path.join(project.root, '.quiver'));
    const store = makeStore(project.root);
    assert.equal((await store.query({})).code, 'CAPABILITY_UNAVAILABLE');
    assert.equal((await store.append(assumption('record:absent'), {
      operation_id: 'operation:absent',
      expected_revision: 0,
    })).code, 'CAPABILITY_UNAVAILABLE');
    assert.deepEqual(fs.readdirSync(path.join(project.root, '.quiver')), before);
  } finally {
    project.cleanup();
  }
});

test('append supports every typed record and derives immutable metadata', async () => {
  const project = makeProject();
  try {
    initializeBrainStore(project.root, { projectId: PROJECT_ID });
    const store = makeStore(project.root);
    let revision = 0;
    for (const [index, type] of RECORD_TYPES.entries()) {
      const evidencePath = path.join(project.root, `evidence-${index}.txt`);
      fs.writeFileSync(evidencePath, `fixture evidence ${index}\n`);
      const evidenceRef = {
        id: `evidence:${index}`,
        digest: crypto.createHash('sha256').update(fs.readFileSync(evidencePath)).digest('hex'),
        path: path.basename(evidencePath),
      };
      const claim = { subject: evidenceRef.id, predicate: 'sha256', value: evidenceRef.digest };
      const record = assumption(`record:${index}`, {
        type,
        payload: type === 'verified-fact' ? { claim } : undefined,
        source_refs: type === 'verified-fact' ? [evidenceRef] : [],
        evidence_refs: type === 'verified-fact' ? [evidenceRef] : [],
      });
      if (type === 'verified-fact') record.claim = claim;
      const appended = await store.append(record, { operation_id: `operation:${index}`, expected_revision: revision });
      assert.equal(appended.code, 'OK');
      assert.equal(appended.data.record.type, type);
      assert.equal(appended.data.record.created_at, NOW);
      assert.equal(appended.data.record.provenance.actor_id, 'actor:fixture-writer');
      revision += 1;
    }
    const listed = await store.query({ validity: 'all' });
    assert.equal(listed.data.records.length, RECORD_TYPES.length);
    assert.equal(listed.data.revision, RECORD_TYPES.length);
  } finally {
    project.cleanup();
  }
});

test('supersession preserves history, derives active validity, and enforces authority precedence', async () => {
  const project = makeProject();
  try {
    initializeBrainStore(project.root, { projectId: PROJECT_ID });
    const resolver = trustedResolver([{ action: 'brain.requirement.write' }]);
    const store = makeStore(project.root, { actorResolver: resolver });
    const first = await store.append(assumption('requirement:old', { authority: 'requirement' }), { operation_id: 'op:old', expected_revision: 0 });
    assert.equal(first.code, 'OK');
    const oldPath = brainPaths(project.root).root + `/${store.readManifest().record_refs[0].path}`;
    const oldBytes = fs.readFileSync(oldPath);
    const weak = await store.append(assumption('assumption:weak', { supersedes: ['requirement:old'] }), { operation_id: 'op:weak', expected_revision: 1 });
    assert.equal(weak.code, 'POLICY_DENIED');
    const next = await store.append(assumption('requirement:new', { authority: 'requirement', supersedes: ['requirement:old'] }), { operation_id: 'op:new', expected_revision: 1 });
    assert.equal(next.code, 'OK');
    assert.deepEqual(fs.readFileSync(oldPath), oldBytes);
    const active = await store.query({});
    assert.deepEqual(active.data.records.map((record) => record.id), ['requirement:new']);
    const history = await store.query({ validity: 'all' });
    assert.deepEqual(history.data.records.map((record) => [record.id, record.validity]), [
      ['requirement:old', 'superseded'],
      ['requirement:new', 'active'],
    ]);
  } finally {
    project.cleanup();
  }
});

test('CAS and idempotency replay are enforced in the normative order', async () => {
  const project = makeProject();
  try {
    initializeBrainStore(project.root, { projectId: PROJECT_ID });
    const store = makeStore(project.root);
    const input = assumption('record:one');
    assert.equal((await store.append(input, { operation_id: 'operation:one', expected_revision: 9 })).code, 'REVISION_CONFLICT');
    const committed = await store.append(input, { operation_id: 'operation:one', expected_revision: 0 });
    assert.equal(committed.code, 'OK');
    const replayed = await store.append(input, { operation_id: 'operation:one', expected_revision: 999 });
    assert.equal(replayed.code, 'OK');
    assert.equal(replayed.data.replayed, true);
    assert.equal(store.readManifest().record_refs.length, 1);
    const conflict = await store.append(assumption('record:different'), { operation_id: 'operation:one', expected_revision: 1 });
    assert.equal(conflict.code, 'IDEMPOTENCY_CONFLICT');
  } finally {
    project.cleanup();
  }
});

test('unverified, foreign, and under-granted actors fail before canonical writes', async () => {
  const project = makeProject();
  try {
    initializeBrainStore(project.root, { projectId: PROJECT_ID });
    const paths = brainPaths(project.root);
    const cases = [
      createBrainStore({ projectRoot: project.root }),
      makeStore(project.root, { actorResolver: async () => ({ actor_id: 'actor:x', verified: false, project_id: PROJECT_ID, grants: [{ action: 'brain.write' }], evidence_refs: [] }) }),
      makeStore(project.root, { actorResolver: async () => ({ actor_id: 'actor:x', verified: true, project_id: 'foreign:project', grants: [{ action: 'brain.write' }], evidence_refs: [] }) }),
      makeStore(project.root, { actorResolver: async () => ({ actor_id: 'actor:x', verified: true, project_id: PROJECT_ID, grants: [{ action: '*' }], evidence_refs: [] }) }),
    ];
    for (const [index, store] of cases.entries()) {
      const response = await store.append(assumption(`record:denied:${index}`), { operation_id: `operation:denied:${index}`, expected_revision: 0 });
      assert.ok(['ACTOR_UNVERIFIED', 'POLICY_DENIED'].includes(response.code));
    }
    assert.equal(fs.readdirSync(paths.recordsDir).length, 0);
    assert.equal(fs.existsSync(paths.journalPath), false);
  } finally {
    project.cleanup();
  }
});

test('secret, operational-state, unsafe-path, and unverifiable-fact inputs never persist', async () => {
  const project = makeProject();
  try {
    initializeBrainStore(project.root, { projectId: PROJECT_ID });
    const store = makeStore(project.root);
    const cases = [
      [assumption('secret:text', { payload: { text: 'api_key=fixture-secret-value' } }), 'SECRET_DETECTED'],
      [assumption('secret:field', { payload: { credentials: { user: 'fixture' } } }), 'SECRET_DETECTED'],
      [assumption('runtime:lease', { payload: { lease_id: 'lease-1' } }), 'VALIDATION_FAILED'],
      [{ ...assumption('unsafe:path'), source_refs: [{ id: 'source:1', digest: 'a'.repeat(64), path: '../outside.txt' }] }, 'UNSAFE_PATH'],
      [assumption('fact:no-evidence', { type: 'verified-fact' }), 'POLICY_DENIED'],
    ];
    for (const [index, [input, code]] of cases.entries()) {
      const response = await store.append(input, { operation_id: `unsafe:${index}`, expected_revision: 0 });
      assert.equal(response.code, code);
    }
    const paths = brainPaths(project.root);
    assert.equal(fs.readdirSync(paths.recordsDir).length, 0);
    assert.equal(fs.existsSync(paths.journalPath), false);
  } finally {
    project.cleanup();
  }
});

test('a valid digest for unrelated bytes cannot elevate an arbitrary verified fact', async () => {
  const project = makeProject();
  try {
    initializeBrainStore(project.root, { projectId: PROJECT_ID });
    const evidencePath = path.join(project.root, 'unrelated.json');
    fs.writeFileSync(evidencePath, `${JSON.stringify({ schema_version: 1, claims: [{ subject: 'other', predicate: 'status', value: 'unknown' }] })}\n`);
    const evidenceRef = {
      id: 'evidence:unrelated',
      digest: crypto.createHash('sha256').update(fs.readFileSync(evidencePath)).digest('hex'),
      path: 'unrelated.json',
    };
    const claim = { subject: 'customer:1', predicate: 'approved', value: true };
    const response = await makeStore(project.root).append({
      ...assumption('fact:unrelated', {
        type: 'verified-fact',
        payload: { claim },
        source_refs: [evidenceRef],
        evidence_refs: [evidenceRef],
      }),
      claim,
    }, { operation_id: 'operation:unrelated-fact', expected_revision: 0 });
    assert.equal(response.code, 'POLICY_DENIED');
    assert.equal(fs.readdirSync(brainPaths(project.root).recordsDir).length, 0);

    const selfAuthoredPath = path.join(project.root, 'self-authored-claim.json');
    fs.writeFileSync(selfAuthoredPath, `${JSON.stringify({ schema_version: 1, claims: [claim] })}\n`);
    const selfAuthoredRef = {
      id: 'evidence:self-authored',
      digest: crypto.createHash('sha256').update(fs.readFileSync(selfAuthoredPath)).digest('hex'),
      path: 'self-authored-claim.json',
    };
    const selfAuthored = await makeStore(project.root).append({
      ...assumption('fact:self-authored', {
        type: 'verified-fact',
        payload: { claim },
        source_refs: [selfAuthoredRef],
        evidence_refs: [selfAuthoredRef],
      }),
      claim,
    }, { operation_id: 'operation:self-authored-fact', expected_revision: 0 });
    assert.equal(selfAuthored.code, 'POLICY_DENIED');
    assert.equal(fs.readdirSync(brainPaths(project.root).recordsDir).length, 0);
  } finally {
    project.cleanup();
  }
});

test('the supported local v58 decision representation binds the exact approved artifact', () => {
  const approvalRef = {
    id: 'decision:technical-plan:1',
    digest: 'a'.repeat(64),
    path: '.quiver/runs/run-1/approvals/technical-plan/v001.md',
  };
  const supported = {
    type: 'decision',
    payload: { approved_artifact_ref: approvalRef },
    claim: {
      subject: approvalRef.id,
      predicate: 'approved-artifact',
      value: approvalRef,
    },
    source_refs: [approvalRef],
  };
  assert.doesNotThrow(() => assertSupportedLocalDecisionBinding(supported, approvalRef));
  assert.throws(
    () => assertSupportedLocalDecisionBinding({
      ...supported,
      payload: { claim: 'customer approved an unrelated release' },
    }, approvalRef),
    (error) => error.code === 'POLICY_DENIED',
  );
});

test('writer mutex returns a lock conflict without changing the store', async () => {
  const project = makeProject();
  try {
    initializeBrainStore(project.root, { projectId: PROJECT_ID });
    const lock = acquireLock(project.root, 'brain', { command: 'fixture owner' });
    try {
      const response = await makeStore(project.root).append(assumption('record:locked'), { operation_id: 'operation:locked', expected_revision: 0 });
      assert.equal(response.code, 'LOCK_CONFLICT');
    } finally {
      releaseLock(lock);
    }
    assert.equal(makeStore(project.root).readManifest().revision, 0);
  } finally {
    project.cleanup();
  }
});

test('concurrent appends either serialize or return an explicit lock conflict', async () => {
  const project = makeProject();
  try {
    initializeBrainStore(project.root, { projectId: PROJECT_ID });
    let releaseFirst;
    const firstAuthorized = new Promise((resolve) => { releaseFirst = resolve; });
    let firstResolution;
    const firstInsideResolver = new Promise((resolve) => { firstResolution = resolve; });
    const first = makeStore(project.root, {
      actorResolver: async (request) => {
        firstResolution();
        await firstAuthorized;
        return trustedResolver()(request);
      },
    }).append(assumption('record:concurrent:first'), {
      operation_id: 'operation:concurrent:first',
      expected_revision: 0,
    });
    await firstInsideResolver;
    const second = await makeStore(project.root).append(assumption('record:concurrent:second'), {
      operation_id: 'operation:concurrent:second',
      expected_revision: 0,
    });
    releaseFirst();
    const firstResult = await first;
    assert.equal(firstResult.code, 'OK');
    assert.equal(second.code, 'LOCK_CONFLICT');
    assert.deepEqual(makeStore(project.root).readManifest().record_refs.map((item) => item.id), [
      'record:concurrent:first',
    ]);
  } finally {
    project.cleanup();
  }
});

test('read-only v58 compatibility blocks every Brain writer before mutation', async () => {
  const project = makeProject();
  try {
    initializeBrainStore(project.root, { projectId: PROJECT_ID });
    const paths = brainPaths(project.root);
    const governance = buildDefaultGovernanceConfig();
    governance.compatibility.writer_mode = 'read-only';
    fs.writeFileSync(path.join(project.root, '.quiver', 'config.json'), `${JSON.stringify({ governance }, null, 2)}\n`);
    fs.writeFileSync(path.join(project.root, '.quiver', 'state.json'), `${JSON.stringify({
      initialized_version: packageJson.version,
      last_initialized_at: NOW,
      quiver_version: packageJson.version,
    }, null, 2)}\n`);
    const before = fs.readFileSync(paths.manifestPath);
    const appended = await makeStore(project.root).append(assumption('record:read-only'), {
      operation_id: 'operation:read-only',
      expected_revision: 0,
    });
    assert.equal(appended.code, 'GOVERNANCE_READ_ONLY');
    assert.equal(makeStore(project.root).rebuildIndex().code, 'GOVERNANCE_READ_ONLY');
    assert.equal((await makeStore(project.root).recover()).code, 'GOVERNANCE_READ_ONLY');
    assert.deepEqual(fs.readFileSync(paths.manifestPath), before);
    assert.deepEqual(fs.readdirSync(paths.recordsDir), []);
    assert.deepEqual(fs.readdirSync(paths.operationsDir), []);
    assert.equal(fs.existsSync(paths.journalPath), false);
  } finally {
    project.cleanup();
  }
});

test('symlinked canonical record or operation directories cannot write outside the project', async (t) => {
  for (const directoryName of ['records', 'operations']) {
    const project = makeProject();
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-brain-outside-'));
    try {
      initializeBrainStore(project.root, { projectId: PROJECT_ID });
      const paths = brainPaths(project.root);
      const target = directoryName === 'records' ? paths.recordsDir : paths.operationsDir;
      fs.rmSync(target, { recursive: true });
      try {
        fs.symlinkSync(outside, target, 'dir');
      } catch (error) {
        if (['EACCES', 'EPERM', 'ENOTSUP'].includes(error.code)) {
          t.skip(`symlinks are not supported in this environment: ${error.code}`);
          return;
        }
        throw error;
      }
      const manifestBefore = fs.readFileSync(paths.manifestPath);
      const response = await makeStore(project.root).append(
        assumption(`record:symlink:${directoryName}`),
        { operation_id: `operation:symlink:${directoryName}`, expected_revision: 0 },
      );
      assert.equal(response.code, 'UNSAFE_PATH');
      assert.deepEqual(fs.readdirSync(outside), []);
      assert.deepEqual(fs.readFileSync(paths.manifestPath), manifestBefore);
      assert.equal(fs.existsSync(paths.journalPath), false);
    } finally {
      project.cleanup();
      fs.rmSync(outside, { recursive: true, force: true });
    }
  }
});

test('a symlinked manifest target is rejected before any Brain mutation', async (t) => {
  const project = makeProject();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-brain-manifest-outside-'));
  try {
    initializeBrainStore(project.root, { projectId: PROJECT_ID });
    const paths = brainPaths(project.root);
    const outsideManifest = path.join(outside, 'manifest.json');
    fs.copyFileSync(paths.manifestPath, outsideManifest);
    fs.rmSync(paths.manifestPath);
    try {
      fs.symlinkSync(outsideManifest, paths.manifestPath, 'file');
    } catch (error) {
      if (['EACCES', 'EPERM', 'ENOTSUP'].includes(error.code)) {
        t.skip(`symlinks are not supported in this environment: ${error.code}`);
        return;
      }
      throw error;
    }
    const outsideBefore = fs.readFileSync(outsideManifest);
    const response = await makeStore(project.root).append(assumption('record:manifest-link'), { operation_id: 'operation:manifest-link', expected_revision: 0 });
    assert.equal(response.code, 'UNSAFE_PATH');
    assert.deepEqual(fs.readFileSync(outsideManifest), outsideBefore);
    assert.deepEqual(fs.readdirSync(brainPaths(project.root).recordsDir), []);
    assert.deepEqual(fs.readdirSync(brainPaths(project.root).operationsDir), []);
    assert.equal(fs.existsSync(paths.journalPath), false);
  } finally {
    project.cleanup();
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

test('stale or corrupt index rebuilds only from the canonical manifest', async () => {
  const project = makeProject();
  try {
    initializeBrainStore(project.root, { projectId: PROJECT_ID });
    const store = makeStore(project.root);
    await store.append(assumption('record:index'), { operation_id: 'operation:index', expected_revision: 0 });
    fs.writeFileSync(brainPaths(project.root).indexPath, '{"records":[{"authority":"policy"}]}\n');
    const rebuilt = store.rebuildIndex();
    assert.equal(rebuilt.code, 'OK');
    assert.deepEqual(rebuilt.data.index.records.map((record) => record.authority), ['agent-assumption']);
  } finally {
    project.cleanup();
  }
});

test('validated journal recovery rolls forward an interrupted manifest commit', async () => {
  const project = makeProject();
  try {
    initializeBrainStore(project.root, { projectId: PROJECT_ID });
    const store = makeStore(project.root, { faultInjector: (point) => {
      if (point === 'after-journal') throw new Error('fixture crash');
    } });
    const interrupted = await store.append(assumption('record:recovered'), { operation_id: 'operation:recovered', expected_revision: 0 });
    assert.equal(interrupted.code, 'STORAGE_FAILED');
    assert.equal(fs.existsSync(brainPaths(project.root).journalPath), true);
    assert.equal((await store.query({})).code, 'RECOVERY_REQUIRED');
    const recovered = await store.recover();
    assert.equal(recovered.code, 'OK');
    assert.equal(recovered.data.revision, 1);
    assert.equal(fs.existsSync(brainPaths(project.root).journalPath), false);
    assert.deepEqual((await store.query({})).data.records.map((record) => record.id), ['record:recovered']);
  } finally {
    project.cleanup();
  }
});

test('Cloud receipt fixture binds exact knowledge and preserves original decision provenance', async () => {
  const project = makeProject();
  try {
    initializeBrainStore(project.root, { projectId: PROJECT_ID });
    const state = { value: 'current' };
    const recordBase = assumption('decision:cloud', {
      type: 'decision',
      authority: 'approved-decision',
      source_refs: [
        ref('subject:1', 'https://cloud.example/subjects/1'),
        ref('policy:1', 'https://cloud.example/policies/1'),
      ],
    });
    const fixture = cloudFixture(recordBase, state);
    const input = { ...recordBase, approval_ref: fixture.approvalRef };
    const store = makeStore(project.root, {
      actorResolver: trustedResolver([{ action: 'brain.decision.write' }]),
      evidenceResolver: fixture.resolver,
    });
    const appended = await store.append(input, { operation_id: 'operation:cloud', expected_revision: 0 });
    assert.equal(appended.code, 'OK');
    assert.equal(appended.data.record.provenance.actor_id, 'actor:fixture-writer');
    assert.equal(appended.data.record.provenance.approval_actor_id, 'actor:original-decider');
    assert.deepEqual(appended.data.record.approval_ref, fixture.approvalRef);
    const replayed = await store.append(input, { operation_id: 'operation:cloud', expected_revision: 999 });
    assert.equal(replayed.code, 'OK');
    assert.equal(replayed.data.replayed, true);
    assert.equal(store.readManifest().record_refs.length, 1);

    state.value = 'revoked';
    const revokedReplay = await store.append(input, { operation_id: 'operation:cloud', expected_revision: 1 });
    assert.equal(revokedReplay.code, 'POLICY_DENIED');
    const active = await store.query({});
    assert.deepEqual(active.data.records, []);
    const history = await store.query({ validity: 'all' });
    assert.equal(history.data.records[0].validity, 'unknown');
    assert.equal(history.data.records[0].authority_check.state, 'revoked');
    assert.equal(store.readManifest().record_refs.length, 1);
  } finally {
    project.cleanup();
  }
});

test('Cloud receipt mismatch, unavailable source, and noncurrent state block before writes', async () => {
  const project = makeProject();
  try {
    initializeBrainStore(project.root, { projectId: PROJECT_ID });
    const recordBase = assumption('decision:blocked', {
      type: 'decision',
      authority: 'approved-decision',
      source_refs: [
        ref('subject:2', 'https://cloud.example/subjects/2'),
        ref('policy:2', 'https://cloud.example/policies/2'),
      ],
    });
    const currentFixture = cloudFixture(recordBase, { value: 'current' });
    const missingResolver = await makeStore(project.root, {
      actorResolver: trustedResolver([{ action: 'brain.decision.write' }]),
    }).append({ ...recordBase, approval_ref: currentFixture.approvalRef }, {
      operation_id: 'cloud:missing-resolver',
      expected_revision: 0,
    });
    assert.equal(missingResolver.code, 'POLICY_DENIED');

    function reissueReceipt(changes) {
      const receiptBase = { ...currentFixture.receipt, ...changes };
      delete receiptBase.digest;
      const receipt = { ...receiptBase, digest: canonicalDigest(receiptBase) };
      const approvalRef = {
        id: receipt.id,
        digest: receipt.digest,
        uri: currentFixture.approvalRef.uri,
      };
      const resolver = async () => ({
        schema_version: 1,
        status: 'passed',
        code: 'OK',
        data: {
          receipt,
          source_revision: 8,
          checked_at: NOW,
          state: 'current',
        },
        errors: [],
        evidence_status: 'verified',
      });
      return { approvalRef, resolver };
    }

    const foreign = reissueReceipt({ project_id: 'foreign:project' });
    const foreignScope = await makeStore(project.root, {
      actorResolver: trustedResolver([{ action: 'brain.decision.write' }]),
      evidenceResolver: foreign.resolver,
    }).append({ ...recordBase, approval_ref: foreign.approvalRef }, {
      operation_id: 'cloud:foreign-scope',
      expected_revision: 0,
    });
    assert.equal(foreignScope.code, 'POLICY_DENIED');

    const forgedActorEvidence = ref('actor-evidence:forged', 'https://cloud.example/evidence/forged');
    const forged = reissueReceipt({
      actor: {
        ...currentFixture.receipt.actor,
        evidence_refs: [forgedActorEvidence],
      },
    });
    const forgedActor = await makeStore(project.root, {
      actorResolver: trustedResolver([{ action: 'brain.decision.write' }]),
      evidenceResolver: forged.resolver,
    }).append({ ...recordBase, approval_ref: forged.approvalRef }, {
      operation_id: 'cloud:forged-actor',
      expected_revision: 0,
    });
    assert.equal(forgedActor.code, 'POLICY_DENIED');

    for (const [index, stateValue] of ['rejected', 'revoked', 'expired', 'stale', 'unknown'].entries()) {
      const state = { value: stateValue };
      const fixture = cloudFixture(recordBase, state);
      const store = makeStore(project.root, {
        actorResolver: trustedResolver([{ action: 'brain.decision.write' }]),
        evidenceResolver: fixture.resolver,
      });
      const response = await store.append({ ...recordBase, approval_ref: fixture.approvalRef }, { operation_id: `cloud:blocked:${index}`, expected_revision: 0 });
      assert.equal(response.code, 'POLICY_DENIED');
    }
    const fixture = cloudFixture(recordBase, { value: 'current' });
    const changed = { ...recordBase, payload: { text: 'Changed after approval' }, approval_ref: fixture.approvalRef };
    const mismatched = await makeStore(project.root, {
      actorResolver: trustedResolver([{ action: 'brain.decision.write' }]),
      evidenceResolver: fixture.resolver,
    }).append(changed, { operation_id: 'cloud:mismatch', expected_revision: 0 });
    assert.equal(mismatched.code, 'POLICY_DENIED');
    assert.equal(fs.readdirSync(brainPaths(project.root).recordsDir).length, 0);
  } finally {
    project.cleanup();
  }
});
