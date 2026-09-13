const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createBrainStore, initializeBrainStore } = require(path.join(process.cwd(), 'src/create-quiver/lib/brain/store'));
const { createContextService } = require(path.join(process.cwd(), 'src/create-quiver/lib/brain/context'));
const { buildSelectedContextPackMetadata } = require(path.join(process.cwd(), 'src/create-quiver/lib/ai/context-packs'));

(async () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-a07-project-binding-'));
  try {
    const projectA = path.join(fixture, 'project-a');
    const projectB = path.join(fixture, 'project-b');
    for (const root of [projectA, projectB]) fs.mkdirSync(path.join(root, '.quiver'), { recursive: true });
    const uuidA = '123e4567-e89b-12d3-a456-426614174000';
    const uuidB = '123e4567-e89b-12d3-a456-426614174001';
    initializeBrainStore(projectA, { projectId: uuidA });
    initializeBrainStore(projectB, { projectId: uuidB });
    const requests = [];
    const options = {
      projectRoot: projectA,
      clock: () => new Date('2026-09-13T00:00:00.000Z'),
      actorResolver: async (request) => {
        requests.push(request);
        return {
          actor_id: 'actor:project-a-fixture', verified: true,
          project_id: request.project_id,
          grants: [{ action: 'brain.write' }, { action: 'brain.policy.write' }, { action: 'context.read' }],
          evidence_refs: [],
        };
      },
    };
    const store = createBrainStore(options);
    const added = await store.append({
      id: 'policy:project-a-only', type: 'constraint',
      payload: { instruction: 'This policy belongs only to project A.' },
      source_refs: [], authority_request: 'policy', evidence_refs: [],
    }, { operation_id: 'operation:project-a-policy', expected_revision: 0 });
    assert.equal(added.code, 'OK');
    const contextService = createContextService({ ...options, store });
    const response = await buildSelectedContextPackMetadata({
      contextService, projectRoot: projectB, role: 'executor',
      task: {
        id: 'task:cross-project', requirement_ids: [], module_paths: [],
        mandatory_refs: [store.readManifest().record_refs[0]], budget_bytes: 4096,
      },
    });
    console.log(JSON.stringify({
      code: response.code, status: response.status,
      trusted_record_ids: response.data?.pack?.trustedInstructions?.map((item) => item.ref.id) || [],
      authorized_project_ids: requests.map((request) => request.project_id),
      requested_pack_project_id: uuidB,
    }));
    if (process.argv.includes('--assert-blocked')) {
      assert.notEqual(response.code, 'OK');
      assert.equal(response.data, null);
    }
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
