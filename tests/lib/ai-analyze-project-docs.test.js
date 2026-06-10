const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  ANALYZE_MANAGED_END,
  ANALYZE_MANAGED_START,
  buildAnalyzeProjectDocProposal,
  buildAnalyzeProjectWritePlan,
  createAnalyzeProjectSnapshot,
  mergeManagedBlock,
  normalizeAnalyzeProjectDocProposal,
  writeAnalyzeProjectDocs,
} = require('../../src/create-quiver/lib/ai/analyze-project-docs');

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function makeRepo(structure = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-analyze-docs-'));
  for (const [relativePath, contents] of Object.entries(structure)) {
    writeFile(path.join(root, relativePath), contents);
  }
  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function analysisWithDocUpdates(docUpdates = {}) {
  return {
    product: {
      name: { name: 'Docs Demo', confidence: 'confirmed', evidence: ['README.md'] },
    },
    features: [],
    doc_updates: docUpdates,
  };
}

test('mergeManagedBlock preserves human content and replaces prior analyze-project block', () => {
  const first = mergeManagedBlock('# Manual\n\nKeep me.\n', '# AI\nFirst\n');
  const second = mergeManagedBlock(first, '# AI\nSecond\n');

  assert.ok(second.includes('# Manual'));
  assert.ok(second.includes('Keep me.'));
  assert.ok(second.includes(ANALYZE_MANAGED_START));
  assert.ok(second.includes(ANALYZE_MANAGED_END));
  assert.ok(second.includes('Second'));
  assert.equal(second.includes('First'), false);
});

test('doc proposal validation allows only approved Markdown docs', () => {
  assert.throws(
    () => normalizeAnalyzeProjectDocProposal({
      schema_version: 1,
      kind: 'quiver-analyze-project-doc-proposal',
      summary: '',
      docs: [{ path: 'src/app.ts', content: 'bad' }],
    }),
    /analyze-project doc proposal contains unsafe or ambiguous writes/,
  );

  const proposal = normalizeAnalyzeProjectDocProposal({
    schema_version: 1,
    kind: 'quiver-analyze-project-doc-proposal',
    summary: '',
    docs: [{ path: 'docs/ARCHITECTURE.md', content: '# Architecture\n' }],
  });
  assert.equal(proposal.docs[0].path, 'docs/ARCHITECTURE.md');
});

test('write plan preserves human content and snapshot manifest records hashes', () => {
  const repo = makeRepo({
    'docs/CONTEXTO.md': '# Manual Context\n\nHuman paragraph.\n',
  });

  try {
    const proposal = buildAnalyzeProjectDocProposal(analysisWithDocUpdates({
      'docs/CONTEXTO.md': '# Context\n\nAI proposal.\n',
    }));
    const writePlan = buildAnalyzeProjectWritePlan(repo.root, proposal);

    assert.equal(writePlan[0].action, 'update');
    assert.equal(writePlan[0].dirty, true);
    assert.ok(writePlan[0].proposedContent.includes('Human paragraph.'));
    assert.ok(writePlan[0].proposedContent.includes('AI proposal.'));

    const snapshot = createAnalyzeProjectSnapshot(repo.root, { run_id: 'run-test' }, writePlan, {
      providerArtifact: { output: 'token=abc123' },
      proposal,
      now: new Date('2026-06-10T12:00:00Z'),
    });
    const written = writeAnalyzeProjectDocs(writePlan);
    const manifest = JSON.parse(fs.readFileSync(path.join(repo.root, snapshot.manifestPath), 'utf8'));

    assert.deepEqual(written, ['docs/CONTEXTO.md']);
    assert.equal(manifest.entries[0].path, 'docs/CONTEXTO.md');
    assert.equal(typeof manifest.entries[0].before_sha256, 'string');
    assert.equal(typeof manifest.entries[0].after_sha256, 'string');
    assert.notEqual(manifest.entries[0].before_sha256, manifest.entries[0].after_sha256);
    assert.ok(fs.existsSync(path.join(repo.root, manifest.entries[0].snapshot_path)));
    assert.ok(fs.readFileSync(path.join(repo.root, 'docs/CONTEXTO.md'), 'utf8').includes(ANALYZE_MANAGED_START));
  } finally {
    repo.cleanup();
  }
});
