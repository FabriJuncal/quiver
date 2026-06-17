const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  ANALYZE_PROJECT_PROPOSAL_MANIFEST_KIND,
  ANALYZE_PROJECT_WRITE_MANIFEST_KIND,
  buildAnalyzeProjectProposalArtifactPaths,
  readAnalyzeProjectSavedProposal,
  normalizeAnalyzeProjectProposalManifest,
  normalizeAnalyzeProjectProposalRunId,
  normalizeAnalyzeProjectWriteManifest,
  writeAnalyzeProjectProposalArtifacts,
  writeAnalyzeProjectWriteManifest,
} = require('../../src/create-quiver/lib/ai/analyze-project-proposal');

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-proposal-artifacts-'));
  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

test('analyze-project proposal artifact paths follow the v55 contract', () => {
  const paths = buildAnalyzeProjectProposalArtifactPaths('run-2026-06-12t12-00-00z');

  assert.equal(paths.root, '.quiver/runs/run-2026-06-12t12-00-00z/proposal');
  assert.equal(paths.proposal_json, '.quiver/runs/run-2026-06-12t12-00-00z/proposal/analyze-project-doc-proposal.json');
  assert.equal(paths.proposal_markdown, '.quiver/runs/run-2026-06-12t12-00-00z/proposal/analyze-project-doc-proposal.md');
  assert.equal(paths.proposal_diff, '.quiver/runs/run-2026-06-12t12-00-00z/proposal/analyze-project-doc-proposal.diff');
  assert.equal(paths.manifest, '.quiver/runs/run-2026-06-12t12-00-00z/proposal/manifest.json');
  assert.equal(paths.write_manifest, '.quiver/runs/run-2026-06-12t12-00-00z/writes/analyze-project-doc-writes.json');
});

test('analyze-project proposal run ids reject unsafe path segments', () => {
  assert.equal(normalizeAnalyzeProjectProposalRunId('run-123'), 'run-123');
  assert.throws(() => normalizeAnalyzeProjectProposalRunId('../run-123'), /run id is not safe/);
  assert.throws(() => normalizeAnalyzeProjectProposalRunId('run/123'), /run id is not safe/);
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
    merge_plan: [{
      path: 'docs/CONTEXTO.md',
      action: 'update',
      dirty: true,
      merge_report: { classification: 'human_content', strategy: 'preserve-and-update-managed-block' },
    }],
    proposal_sha256: 'def456',
    events: [],
  });

  assert.equal(proposal.kind, ANALYZE_PROJECT_PROPOSAL_MANIFEST_KIND);
  assert.deepEqual(proposal.doc_paths, ['docs/CONTEXTO.md']);
  assert.equal(proposal.merge_plan[0].merge_report.classification, 'human_content');

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
      merge_report: { classification: 'human_content', strategy: 'preserve-and-update-managed-block' },
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
  assert.equal(write.actions[0].merge_report.classification, 'human_content');
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

test('writeAnalyzeProjectProposalArtifacts writes normalized proposal, compact summary, full diff, and manifest', () => {
  const repo = makeRepo();
  const proposal = {
    schema_version: 1,
    kind: 'quiver-analyze-project-doc-proposal',
    summary: 'Docs proposed from analysis.',
    docs: [{
      path: 'docs/CONTEXTO.md',
      action: 'update',
      content: '# Context\nSecret-free proposed context.\n',
      reason: 'AI analyze-project proposed a managed documentation update.',
    }],
  };
  const writePlan = [{
    path: 'docs/CONTEXTO.md',
    action: 'create',
    dirty: false,
    before_sha256: null,
    after_sha256: 'after-hash',
    reason: 'AI analyze-project proposed a managed documentation update.',
    currentContent: '',
    proposedContent: '<!-- quiver:analyze-project:start -->\n# Context\nSecret-free proposed context.\n<!-- quiver:analyze-project:end -->\n',
    merge_report: {
      classification: 'managed_only',
      strategy: 'replace-managed-only-content',
      warnings: [],
    },
  }];

  try {
    const artifacts = writeAnalyzeProjectProposalArtifacts(repo.root, {
      runId: 'run-2026-06-12t12-00-00z',
      now: new Date('2026-06-12T12:00:00.000Z'),
      provider: 'codex',
      language: 'es',
      proposal,
      writePlan,
      selectedContextManifest: {
        path: '.quiver/runs/run-2026-06-12t12-00-00z/context/selected-context.json',
      },
      repairManifest: null,
    });

    const proposalPath = path.join(repo.root, artifacts.proposal_json);
    const summaryPath = path.join(repo.root, artifacts.proposal_markdown);
    const diffPath = path.join(repo.root, artifacts.proposal_diff);
    const manifestPath = path.join(repo.root, artifacts.manifest);

    assert.deepEqual(readJson(proposalPath), proposal);
    assert.match(fs.readFileSync(summaryPath, 'utf8'), /docs\/CONTEXTO\.md: create/);
    assert.doesNotMatch(fs.readFileSync(summaryPath, 'utf8'), /Secret-free proposed context/);
    assert.match(fs.readFileSync(diffPath, 'utf8'), /Secret-free proposed context/);

    const manifest = normalizeAnalyzeProjectProposalManifest(readJson(manifestPath));
    assert.equal(manifest.kind, ANALYZE_PROJECT_PROPOSAL_MANIFEST_KIND);
    assert.equal(manifest.language, 'es');
    assert.deepEqual(manifest.doc_paths, ['docs/CONTEXTO.md']);
    assert.equal(manifest.doc_before_hashes['docs/CONTEXTO.md'], null);
    assert.equal(manifest.merge_plan[0].merge_report.strategy, 'replace-managed-only-content');
    assert.equal(manifest.proposal_sha256, artifacts.proposal_sha256);
    assert.equal(manifest.events[0].type, 'proposal-saved');
  } finally {
    repo.cleanup();
  }
});

test('readAnalyzeProjectSavedProposal validates saved artifacts and detects manual proposal edits', () => {
  const repo = makeRepo();
  const proposal = {
    schema_version: 1,
    kind: 'quiver-analyze-project-doc-proposal',
    summary: 'Docs proposed from analysis.',
    docs: [{
      path: 'docs/CONTEXTO.md',
      action: 'update',
      content: '# Context\nOriginal proposal.\n',
      reason: 'AI analyze-project proposed a managed documentation update.',
    }],
  };
  const writePlan = [{
    path: 'docs/CONTEXTO.md',
    action: 'create',
    dirty: false,
    before_sha256: null,
    after_sha256: 'after-hash',
    reason: 'AI analyze-project proposed a managed documentation update.',
    currentContent: '',
    proposedContent: '<!-- quiver:analyze-project:start -->\n# Context\nOriginal proposal.\n<!-- quiver:analyze-project:end -->\n',
  }];

  try {
    const artifacts = writeAnalyzeProjectProposalArtifacts(repo.root, {
      runId: 'run-saved-proposal',
      now: new Date('2026-06-12T12:20:00.000Z'),
      provider: 'codex',
      language: 'en',
      proposal,
      writePlan,
      selectedContextManifest: '.quiver/runs/run-saved-proposal/context/selected-context.json',
      repairManifest: null,
    });

    const loaded = readAnalyzeProjectSavedProposal(repo.root, 'run-saved-proposal');
    assert.equal(loaded.run_id, 'run-saved-proposal');
    assert.equal(loaded.proposal_edited, false);
    assert.equal(loaded.manifest.proposal_json, artifacts.proposal_json);
    assert.deepEqual(loaded.proposal.docs.map((doc) => doc.path), ['docs/CONTEXTO.md']);

    const edited = readJson(path.join(repo.root, artifacts.proposal_json));
    edited.docs[0].content = '# Context\nEdited proposal.\n';
    fs.writeFileSync(path.join(repo.root, artifacts.proposal_json), `${JSON.stringify(edited, null, 2)}\n`);

    const editedLoaded = readAnalyzeProjectSavedProposal(repo.root, 'run-saved-proposal');
    assert.equal(editedLoaded.proposal_edited, true);
    assert.equal(editedLoaded.proposal.docs[0].content, '# Context\nEdited proposal.\n');
  } finally {
    repo.cleanup();
  }
});

test('writeAnalyzeProjectWriteManifest writes final normalized apply manifest', () => {
  const repo = makeRepo();

  try {
    const written = writeAnalyzeProjectWriteManifest(repo.root, {
      runId: 'run-2026-06-12t12-10-00z',
      now: new Date('2026-06-12T12:10:00.000Z'),
      proposalManifest: '.quiver/runs/run-2026-06-12t12-10-00z/proposal/manifest.json',
      snapshot: {
        root: '.quiver/runs/run-2026-06-12t12-10-00z/snapshots/20260612T121000Z',
        entries: [{
          path: 'docs/CONTEXTO.md',
          snapshot_path: '.quiver/runs/run-2026-06-12t12-10-00z/snapshots/20260612T121000Z/docs/CONTEXTO.md',
        }],
      },
      writePlan: [{
        path: 'docs/CONTEXTO.md',
        action: 'update',
        dirty: true,
        before_sha256: 'before-hash',
        after_sha256: 'after-hash',
        merge_report: {
          classification: 'human_content',
          strategy: 'preserve-and-update-managed-block',
          warnings: [],
        },
      }],
      writtenDocs: ['docs/CONTEXTO.md'],
      validation: {
        ok: true,
        strict: false,
        errors: [],
        warnings: [],
      },
      status: 'completed',
      events: [{ type: 'write-completed' }],
    });

    const manifest = normalizeAnalyzeProjectWriteManifest(readJson(path.join(repo.root, written.path)));
    assert.equal(manifest.kind, ANALYZE_PROJECT_WRITE_MANIFEST_KIND);
    assert.equal(manifest.proposal_manifest, '.quiver/runs/run-2026-06-12t12-10-00z/proposal/manifest.json');
    assert.equal(manifest.snapshot_root, '.quiver/runs/run-2026-06-12t12-10-00z/snapshots/20260612T121000Z');
    assert.equal(manifest.actions[0].status, 'written');
    assert.equal(manifest.actions[0].snapshot_path, '.quiver/runs/run-2026-06-12t12-10-00z/snapshots/20260612T121000Z/docs/CONTEXTO.md');
    assert.equal(manifest.actions[0].merge_report.strategy, 'preserve-and-update-managed-block');
    assert.equal(manifest.validation.ok, true);
    assert.equal(manifest.partial_write, false);
  } finally {
    repo.cleanup();
  }
});
