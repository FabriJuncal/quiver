const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ANALYZE_PROJECT_PROPOSAL_MANIFEST_KIND,
  ANALYZE_PROJECT_WRITE_MANIFEST_KIND,
  buildAnalyzeProjectProposalArtifactPaths,
  normalizeAnalyzeProjectProposalManifest,
  normalizeAnalyzeProjectWriteManifest,
} = require('../../src/create-quiver/lib/ai/analyze-project-proposal');

test('analyze-project proposal artifact paths follow the v55 contract', () => {
  const paths = buildAnalyzeProjectProposalArtifactPaths('run-2026-06-12t12-00-00z');

  assert.equal(paths.root, '.quiver/runs/run-2026-06-12t12-00-00z/proposal');
  assert.equal(paths.proposal_json, '.quiver/runs/run-2026-06-12t12-00-00z/proposal/analyze-project-doc-proposal.json');
  assert.equal(paths.proposal_markdown, '.quiver/runs/run-2026-06-12t12-00-00z/proposal/analyze-project-doc-proposal.md');
  assert.equal(paths.proposal_diff, '.quiver/runs/run-2026-06-12t12-00-00z/proposal/analyze-project-doc-proposal.diff');
  assert.equal(paths.manifest, '.quiver/runs/run-2026-06-12t12-00-00z/proposal/manifest.json');
  assert.equal(paths.write_manifest, '.quiver/runs/run-2026-06-12t12-00-00z/writes/analyze-project-doc-writes.json');
});

test('proposal and write manifests validate strict safe paths', () => {
  const proposal = normalizeAnalyzeProjectProposalManifest({
    schema_version: 1,
    kind: ANALYZE_PROJECT_PROPOSAL_MANIFEST_KIND,
    run_id: 'run-1',
    created_at: '2026-06-12T12:00:00.000Z',
    language: 'es',
    provider: 'codex',
    proposal_json: '.quiver/runs/run-1/proposal/analyze-project-doc-proposal.json',
    proposal_markdown: '.quiver/runs/run-1/proposal/analyze-project-doc-proposal.md',
    proposal_diff: '.quiver/runs/run-1/proposal/analyze-project-doc-proposal.diff',
    selected_context_manifest: '.quiver/runs/run-1/context/selected-context.json',
    repair_manifest: null,
    doc_paths: ['docs/CONTEXTO.md'],
    doc_before_hashes: {
      'docs/CONTEXTO.md': 'abc123',
    },
    proposal_sha256: 'def456',
    events: [],
  });

  assert.equal(proposal.kind, ANALYZE_PROJECT_PROPOSAL_MANIFEST_KIND);
  assert.deepEqual(proposal.doc_paths, ['docs/CONTEXTO.md']);

  const write = normalizeAnalyzeProjectWriteManifest({
    schema_version: 1,
    kind: ANALYZE_PROJECT_WRITE_MANIFEST_KIND,
    run_id: 'run-1',
    created_at: '2026-06-12T12:01:00.000Z',
    proposal_manifest: '.quiver/runs/run-1/proposal/manifest.json',
    snapshot_root: '.quiver/runs/run-1/snapshots/20260612T120100Z',
    actions: [{
      path: 'docs/CONTEXTO.md',
      action: 'update',
      before_sha256: 'abc123',
      after_sha256: 'def456',
      snapshot_path: '.quiver/runs/run-1/snapshots/20260612T120100Z/docs/CONTEXTO.md',
      dirty: true,
      status: 'written',
    }],
    validation: {
      ok: true,
      strict: false,
      errors: [],
      warnings: [],
    },
    partial_write: false,
    events: [],
  });

  assert.equal(write.kind, ANALYZE_PROJECT_WRITE_MANIFEST_KIND);
  assert.equal(write.actions[0].path, 'docs/CONTEXTO.md');
});

test('proposal manifest rejects traversal and extra keys', () => {
  assert.throws(
    () => normalizeAnalyzeProjectProposalManifest({
      schema_version: 1,
      kind: ANALYZE_PROJECT_PROPOSAL_MANIFEST_KIND,
      run_id: 'run-1',
      created_at: '2026-06-12T12:00:00.000Z',
      language: 'en',
      provider: 'codex',
      proposal_json: '../proposal.json',
      proposal_markdown: '.quiver/runs/run-1/proposal/analyze-project-doc-proposal.md',
      proposal_diff: '.quiver/runs/run-1/proposal/analyze-project-doc-proposal.diff',
      selected_context_manifest: '.quiver/runs/run-1/context/selected-context.json',
      repair_manifest: null,
      doc_paths: [],
      doc_before_hashes: {},
      proposal_sha256: 'hash',
      events: [],
      extra: true,
    }),
    /proposal manifest does not match the required schema|not a safe project-relative path/,
  );
});
