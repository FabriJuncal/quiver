const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { canonicalDigest } = require('../../src/create-quiver/lib/brain/schema');
const {
  brainPaths,
  createBrainStore,
  initializeBrainStore,
  recoverBrainStore,
} = require('../../src/create-quiver/lib/brain/store');
const { createBrainVault } = require('../../src/create-quiver/lib/brain/vault');

const PROJECT_ID = '123e4567-e89b-12d3-a456-426614174000';
const NOW = '2026-09-06T12:00:00.000Z';

function makeProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-vault-test-'));
  fs.mkdirSync(path.join(root, '.quiver'), { recursive: true });
  initializeBrainStore(root, { projectId: PROJECT_ID, writerCheck: false });
  const actorResolver = async (request) => ({
    actor_id: 'actor:vault-test',
    verified: true,
    project_id: request.project_id,
    grants: [
      { action: 'brain.read' },
      { action: 'brain.write' },
      { action: 'brain.export' },
      { action: 'brain.propose' },
      { action: 'brain.delete' },
    ],
    evidence_refs: [],
  });
  const options = { projectRoot: root, actorResolver, clock: () => new Date(NOW) };
  const store = createBrainStore(options);
  const vault = createBrainVault({ ...options, store });
  return {
    root,
    store,
    vault,
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}

function record(id, payload = { text: `Knowledge ${id}` }, supersedes = []) {
  return {
    id,
    type: 'assumption',
    payload,
    source_refs: [],
    authority_request: 'agent-assumption',
    supersedes,
    evidence_refs: [],
  };
}

function readTree(root) {
  const result = new Map();
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(target);
      else result.set(path.relative(root, target).split(path.sep).join('/'), fs.readFileSync(target));
    }
  };
  visit(root);
  return result;
}

test('default export is deterministic, complete, portable, and keeps safe record links', async () => {
  const project = makeProject();
  try {
    assert.equal((await project.store.append(record('decision:old', { title: '../../escape.md', text: 'Old choice' }), {
      operation_id: 'append-old', expected_revision: 0,
    })).code, 'OK');
    assert.equal((await project.store.append(record('decision:new', { title: 'Current choice', text: 'New choice' }, ['decision:old']), {
      operation_id: 'append-new', expected_revision: 1,
    })).code, 'OK');

    const first = await project.vault.exportVault({ destination: 'vault-one' });
    const second = await project.vault.exportVault({ destination: 'vault-two' });
    assert.equal(first.code, 'OK');
    assert.equal(second.code, 'OK');
    assert.deepEqual(first.data.manifest, second.data.manifest);
    assert.equal(first.data.manifest.include_history, true);
    assert.deepEqual(first.data.manifest.omissions, []);
    assert.equal(first.data.manifest.records.length, 2);
    assert.equal(first.data.manifest.operations.length, 2);
    assert.equal(first.data.manifest.proposals.length, 0);

    const one = readTree(path.join(project.root, 'vault-one'));
    const two = readTree(path.join(project.root, 'vault-two'));
    assert.deepEqual([...one.keys()], [...two.keys()]);
    for (const [file, bytes] of one) assert.deepEqual(bytes, two.get(file), file);
    assert.ok(one.has('manifest.json'));
    assert.ok(one.has('canonical/manifest.json'));
    assert.equal([...one.keys()].filter((file) => file.startsWith('canonical/records/')).length, 2);
    assert.equal([...one.keys()].filter((file) => file.startsWith('canonical/operations/')).length, 2);
    assert.equal([...one.keys()].filter((file) => file.startsWith('records/')).length, 2);
    assert.equal(fs.existsSync(path.join(project.root, 'escape.md')), false);
    const current = [...one.entries()].find(([file, bytes]) => file.startsWith('records/') && bytes.includes('decision:new'));
    assert.match(current[1].toString('utf8'), /\[decision:old\]\(\.\/[0-9a-f-]+\.md\)/);
    assert.match(one.get('README.md').toString('utf8'), /does not require Obsidian/);
  } finally {
    project.cleanup();
  }
});

test('an edited Markdown vault imports only a non-effective proposal', async () => {
  const project = makeProject();
  try {
    assert.equal((await project.store.append(record('requirement:one'), {
      operation_id: 'append-one', expected_revision: 0,
    })).code, 'OK');
    const exported = await project.vault.exportVault({ destination: 'editable-vault' });
    assert.equal(exported.code, 'OK');
    const notePath = path.join(project.root, 'editable-vault', exported.data.manifest.records[0].path);
    const before = fs.readFileSync(notePath, 'utf8');
    fs.writeFileSync(notePath, before.replaceAll('Knowledge requirement:one', 'Proposed replacement'));

    const imported = await project.vault.importEditedVault({ source: 'editable-vault' }, {
      operation_id: 'import-edit', expected_revision: 1,
    });
    assert.equal(imported.code, 'OK');
    assert.equal(imported.data.status, 'proposed');
    assert.deepEqual(imported.data.diff.replaced, ['requirement:one']);
    const active = await project.store.query({ ids: ['requirement:one'] });
    assert.equal(active.data.records[0].payload.text, 'Knowledge requirement:one');
    const manifest = project.store.readManifest();
    assert.equal(manifest.record_refs.length, 1);
    assert.equal(manifest.proposal_refs.length, 1);
    const proposal = JSON.parse(fs.readFileSync(path.join(brainPaths(project.root).root, manifest.proposal_refs[0].path), 'utf8'));
    assert.equal(proposal.status, 'proposed');
    assert.equal(proposal.records[0].payload.text, 'Proposed replacement');
    assert.equal(proposal.provenance.actor_id, 'actor:vault-test');
  } finally {
    project.cleanup();
  }
});

test('proposal bodies cannot grant authority and require the explicit propose grant', async () => {
  const project = makeProject();
  try {
    const deniedStore = createBrainStore({
      projectRoot: project.root,
      clock: () => new Date(NOW),
      actorResolver: async (request) => ({
        actor_id: 'actor:under-granted', verified: true, project_id: request.project_id,
        grants: [{ action: 'brain.decision.write' }], evidence_refs: [],
      }),
    });
    const response = await deniedStore.importProposal({
      base_revision: 0,
      records: [{ ...record('decision:forged'), type: 'decision', authority_request: 'approved-decision' }],
      source_refs: [],
    }, { operation_id: 'forged-proposal', expected_revision: 0 });
    assert.equal(response.code, 'POLICY_DENIED');
    assert.equal(project.store.readManifest().proposal_refs.length, 0);
  } finally {
    project.cleanup();
  }
});

test('an interrupted proposal commit recovers without activating proposal records', async () => {
  const project = makeProject();
  try {
    const interrupted = createBrainStore({
      projectRoot: project.root,
      actorResolver: project.store ? async (request) => ({
        actor_id: 'actor:proposal-recovery', verified: true, project_id: request.project_id,
        grants: [{ action: 'brain.propose' }, { action: 'brain.read' }], evidence_refs: [],
      }) : null,
      clock: () => new Date(NOW),
      faultInjector: (point) => {
        if (point === 'after-proposal-journal') throw new Error('fixture interruption');
      },
    });
    const response = await interrupted.importProposal({
      base_revision: 0,
      records: [record('record:proposal-recovery')],
      source_refs: [],
    }, { operation_id: 'proposal-recovery', expected_revision: 0 });
    assert.equal(response.code, 'STORAGE_FAILED');
    assert.equal(fs.existsSync(brainPaths(project.root).journalPath), true);
    const recovered = recoverBrainStore(project.root);
    assert.equal(recovered.code, 'OK');
    assert.equal(recovered.data.recovered, true);
    const manifest = project.store.readManifest();
    assert.equal(manifest.revision, 1);
    assert.equal(manifest.proposal_refs.length, 1);
    assert.equal(manifest.record_refs.length, 0);
    assert.equal((await project.store.query({})).data.records.length, 0);
  } finally {
    project.cleanup();
  }
});

test('export validates secrets, destinations, references, and symlinks before writes', async () => {
  const project = makeProject();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-vault-outside-'));
  try {
    assert.equal((await project.store.append(record('record:safe'), {
      operation_id: 'append-safe', expected_revision: 0,
    })).code, 'OK');
    const paths = brainPaths(project.root);
    const manifest = project.store.readManifest();
    const recordPath = path.join(paths.root, manifest.record_refs[0].path);
    const stored = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
    stored.payload.text = 'api_key=fixture-secret-value';
    stored.digest = canonicalDigest(stored, 'digest');
    fs.writeFileSync(recordPath, `${JSON.stringify(stored, null, 2)}\n`);
    manifest.record_refs[0].digest = stored.digest;
    manifest.digest = canonicalDigest(manifest, 'digest');
    fs.writeFileSync(paths.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const secret = await project.vault.exportVault({ destination: 'secret-destination' });
    assert.equal(secret.code, 'SECRET_DETECTED');
    assert.equal(fs.existsSync(path.join(project.root, 'secret-destination')), false);

    fs.mkdirSync(path.join(project.root, 'occupied'));
    fs.writeFileSync(path.join(project.root, 'occupied', 'keep.txt'), 'keep');
    assert.equal((await project.vault.exportVault({ destination: 'occupied' })).code, 'UNSAFE_PATH');
    assert.equal(fs.readFileSync(path.join(project.root, 'occupied', 'keep.txt'), 'utf8'), 'keep');

    fs.symlinkSync(outside, path.join(project.root, 'linked-vault'));
    assert.equal((await project.vault.exportVault({ destination: 'linked-vault' })).code, 'UNSAFE_PATH');
    assert.deepEqual(fs.readdirSync(outside), []);
    assert.equal((await project.vault.exportVault({ destination: '.quiver/export' })).code, 'UNSAFE_PATH');
    assert.equal((await project.vault.exportVault({ destination: '.git/export' })).code, 'UNSAFE_PATH');
  } finally {
    project.cleanup();
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

test('export revalidates a destination changed to a symlink during authorization', async () => {
  const project = makeProject();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-vault-race-outside-'));
  try {
    const racingStore = createBrainStore({
      projectRoot: project.root,
      clock: () => new Date(NOW),
      actorResolver: async (request) => {
        if (request.action === 'brain.export' && !fs.existsSync(path.join(project.root, 'racing-vault'))) {
          fs.symlinkSync(outside, path.join(project.root, 'racing-vault'));
        }
        return {
          actor_id: 'actor:vault-race', verified: true, project_id: request.project_id,
          grants: [{ action: request.action }], evidence_refs: [],
        };
      },
    });
    const response = await createBrainVault({ projectRoot: project.root, store: racingStore })
      .exportVault({ destination: 'racing-vault' });
    assert.equal(response.code, 'UNSAFE_PATH');
    assert.deepEqual(fs.readdirSync(outside), []);
  } finally {
    project.cleanup();
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

test('export stays coherent when the Brain advances during authorization', async () => {
  const project = makeProject();
  try {
    let appended = false;
    const racingStore = createBrainStore({
      projectRoot: project.root,
      clock: () => new Date(NOW),
      actorResolver: async (request) => {
        if (request.action === 'brain.export' && !appended) {
          appended = true;
          const concurrent = await project.store.append(record('knowledge:concurrent'), {
            operation_id: 'append-concurrent', expected_revision: 0,
          });
          assert.equal(concurrent.code, 'OK');
        }
        return {
          actor_id: 'actor:vault-race', verified: true, project_id: request.project_id,
          grants: [{ action: request.action }], evidence_refs: [],
        };
      },
    });
    const response = await createBrainVault({ projectRoot: project.root, store: racingStore })
      .exportVault({ destination: 'coherent-vault' });
    assert.equal(response.code, 'OK');
    const canonical = JSON.parse(fs.readFileSync(path.join(project.root, 'coherent-vault', 'canonical/manifest.json'), 'utf8'));
    assert.equal(response.data.revision, 1);
    assert.equal(canonical.revision, response.data.revision);
    assert.deepEqual(response.data.manifest.records.map((item) => item.id), ['knowledge:concurrent']);
  } finally {
    project.cleanup();
  }
});

test('delete dry-run is byte-preserving and real delete quarantines only the Brain', async () => {
  const project = makeProject();
  try {
    fs.writeFileSync(path.join(project.root, 'keep.txt'), 'keep');
    assert.equal((await project.store.append(record('record:delete'), {
      operation_id: 'append-delete', expected_revision: 0,
    })).code, 'OK');
    assert.equal((await project.vault.exportVault({ destination: 'kept-export' })).code, 'OK');
    const before = readTree(project.root);
    const dryRun = await project.vault.deleteVault({
      confirm_delete: null,
      dry_run: true,
      operation_id: 'delete-dry-run',
      expected_revision: 1,
    });
    assert.equal(dryRun.code, 'OK');
    assert.ok(dryRun.data.files.includes('.quiver/brain/manifest.json'));
    const afterDryRun = readTree(project.root);
    assert.deepEqual([...afterDryRun.keys()], [...before.keys()]);
    for (const [file, bytes] of before) assert.deepEqual(bytes, afterDryRun.get(file), file);

    const mismatch = await project.vault.deleteVault({
      confirm_delete: '00000000-0000-4000-8000-000000000000',
      dry_run: false,
      operation_id: 'delete-mismatch',
      expected_revision: 1,
    });
    assert.equal(mismatch.code, 'POLICY_DENIED');
    assert.equal(fs.existsSync(brainPaths(project.root).root), true);

    const deleted = await project.vault.deleteVault({
      confirm_delete: PROJECT_ID,
      dry_run: false,
      operation_id: 'delete-confirmed',
      expected_revision: 1,
    });
    assert.equal(deleted.code, 'OK');
    assert.equal(deleted.data.active, false);
    assert.equal(fs.existsSync(brainPaths(project.root).root), false);
    assert.equal(fs.existsSync(path.join(project.root, deleted.data.quarantine_path)), true);
    assert.equal(fs.readFileSync(path.join(project.root, 'keep.txt'), 'utf8'), 'keep');
    assert.equal(fs.existsSync(path.join(project.root, 'kept-export', 'manifest.json')), true);
    const inactive = await project.store.query({});
    assert.equal(inactive.code, 'CAPABILITY_UNAVAILABLE');
    assert.equal(fs.existsSync(brainPaths(project.root).root), false);
  } finally {
    project.cleanup();
  }
});

test('complete snapshot is not constrained by the public query limit', async () => {
  const project = makeProject();
  try {
    const manifest = project.store.readManifest();
    const records = Array.from({ length: 1001 }, (_, index) => ({
      schema_version: 1,
      id: `record:${index}`,
      type: 'assumption',
      payload: { index },
      source_refs: [],
      created_at: NOW,
      authority: 'agent-assumption',
      validity: 'active',
      supersedes: [],
      claim: null,
      evidence_refs: [],
      approval_ref: null,
      provenance: {
        actor_id: 'actor:vault-test', actor_evidence_refs: [], authority_evidence_refs: [],
        approval_actor_id: null, approval_ref: null, knowledge_digest: 'a'.repeat(64),
      },
      digest: crypto.createHash('sha256').update(`record:${index}`).digest('hex'),
    }));
    const refs = records.map((item, index) => ({
      id: item.id,
      digest: item.digest,
      path: `records/00000000-0000-4000-8000-${String(index).padStart(12, '0')}.json`,
    }));
    fs.mkdirSync(brainPaths(project.root).recordsDir, { recursive: true });
    records.forEach((item, index) => fs.writeFileSync(
      path.join(brainPaths(project.root).root, refs[index].path), `${JSON.stringify(item, null, 2)}\n`,
    ));
    manifest.record_refs = refs;
    manifest.digest = canonicalDigest(manifest, 'digest');
    fs.writeFileSync(brainPaths(project.root).manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    const fakeStore = {
      completeAuthorizedSnapshot: async () => ({
        schema_version: 1, status: 'passed', code: 'OK', errors: [], evidence_status: 'verified',
        data: { manifest, records, proposals: [], operations: [], actor_id: 'actor:vault-test' },
      }),
    };
    const response = await createBrainVault({ projectRoot: project.root, store: fakeStore })
      .exportVault({ destination: 'large-vault' });
    assert.equal(response.code, 'OK');
    assert.equal(response.data.manifest.records.length, 1001);
    assert.equal(fs.readdirSync(path.join(project.root, 'large-vault', 'records')).length, 1001);
  } finally {
    project.cleanup();
  }
});
