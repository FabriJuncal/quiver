const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  ANALYZE_MANAGED_END,
  ANALYZE_MANAGED_START,
  CONTEXT_PREP_MANAGED_END,
  CONTEXT_PREP_MANAGED_START,
  buildAnalyzeProjectDocProposal,
  buildAnalyzeProjectWritePlan,
  classifyAnalyzeProjectDoc,
  collectCriticalPlaceholders,
  createAnalyzeProjectSnapshot,
  mergeAnalyzeProjectDoc,
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

test('collectCriticalPlaceholders detects Quiver scaffold placeholders in English and Spanish', () => {
  const findings = collectCriticalPlaceholders([
    '[Uno o dos parrafos que expliquen el proyecto.]',
    '[Project tagline]',
    '[Describe the primary user.]',
    '[TODO: confirmar contexto antes de ampliar alcance]',
  ].join('\n'));

  assert.ok(findings.includes('[Uno o dos parrafos que expliquen el proyecto.]'));
  assert.ok(findings.includes('[Project tagline]'));
  assert.ok(findings.includes('[Describe the primary user.]'));
  assert.ok(findings.includes('[TODO: confirmar contexto antes de ampliar alcance]'));
});

test('classifyAnalyzeProjectDoc detects scaffold and human content conservatively', () => {
  const scaffold = classifyAnalyzeProjectDoc('# Contexto\n\n[Uno o dos parrafos que expliquen el proyecto.]\n');
  const human = classifyAnalyzeProjectDoc('# Contexto\n\nEste proyecto gestiona inventario real para usuarios autenticados.\n');

  assert.equal(scaffold.classification, 'scaffold');
  assert.equal(scaffold.critical_placeholders.length, 1);
  assert.equal(human.classification, 'human_content');
  assert.equal(human.human_line_count, 1);
});

test('mergeAnalyzeProjectDoc replaces Spanish Quiver scaffold primary content', () => {
  const current = [
    '---',
    'purpose: "Human-readable project overview"',
    'last_updated: "2026-06-17"',
    '---',
    '',
    '# Contexto de NIKA_ERP',
    '',
    '## Que es NIKA_ERP?',
    '',
    '[Uno o dos parrafos que expliquen el proyecto.]',
    '',
    '## Usuario objetivo',
    '',
    '[Describe el usuario principal.]',
    '',
  ].join('\n');
  const proposed = '# Contexto de StockFlow\n\nStockFlow gestiona inventario, ventas, compras y proveedores.\n';
  const merged = mergeAnalyzeProjectDoc(current, proposed);

  assert.equal(merged.report.classification, 'scaffold');
  assert.equal(merged.report.strategy, 'replace-scaffold-primary-content');
  assert.equal(merged.report.scaffold_replaced, true);
  assert.ok(merged.content.startsWith('---\npurpose:'));
  assert.ok(merged.content.includes('StockFlow gestiona inventario'));
  assert.equal(merged.content.includes('[Uno o dos parrafos'), false);
  assert.equal(merged.content.includes('[Describe el usuario principal.'), false);
  assert.equal((merged.content.match(/quiver:analyze-project:start/g) || []).length, 1);
});

test('mergeAnalyzeProjectDoc preserves completed human sections in partial scaffold', () => {
  const current = [
    '# Contexto de NIKA_ERP',
    '',
    '## Que es NIKA_ERP?',
    '',
    '[Uno o dos parrafos que expliquen el proyecto.]',
    '',
    '## Usuario objetivo',
    '',
    'Administradores de stock que registran operaciones diarias.',
    '',
  ].join('\n');
  const proposed = '# Contexto de StockFlow\n\nStockFlow centraliza operaciones de inventario.\n';
  const merged = mergeAnalyzeProjectDoc(current, proposed);

  assert.equal(merged.report.classification, 'partial_scaffold');
  assert.equal(merged.report.human_content_preserved, true);
  assert.ok(merged.content.includes('StockFlow centraliza operaciones de inventario.'));
  assert.ok(merged.content.includes('Administradores de stock que registran operaciones diarias.'));
  assert.equal(merged.content.includes('[Uno o dos parrafos'), false);
});

test('mergeAnalyzeProjectDoc preserves human docs and replaces existing analyze-project block', () => {
  const current = [
    '# Manual',
    '',
    'Este texto humano debe conservarse.',
    '',
    ANALYZE_MANAGED_START,
    '# Old',
    'old generated content',
    ANALYZE_MANAGED_END,
    '',
  ].join('\n');
  const proposed = '# New\n\nnew generated content\n';
  const merged = mergeAnalyzeProjectDoc(current, proposed);

  assert.equal(merged.report.classification, 'mixed');
  assert.equal(merged.report.analyze_project_block_replaced, true);
  assert.ok(merged.content.includes('Este texto humano debe conservarse.'));
  assert.ok(merged.content.includes('new generated content'));
  assert.equal(merged.content.includes('old generated content'), false);
  assert.equal((merged.content.match(/quiver:analyze-project:start/g) || []).length, 1);
});

test('mergeAnalyzeProjectDoc removes scaffold context-prep block when applying analyze-project content', () => {
  const current = [
    '# Contexto',
    '',
    '[Uno o dos parrafos que expliquen el proyecto.]',
    '',
    CONTEXT_PREP_MANAGED_START,
    '# stockflow Context',
    '',
    '[One or two paragraphs that explain the project.]',
    '',
    '## Context Preparation Notes',
    '- TODO: confirm any repo fact.',
    CONTEXT_PREP_MANAGED_END,
    '',
  ].join('\n');
  const proposed = '# Contexto de StockFlow\n\nStockFlow gestiona inventario.\n';
  const merged = mergeAnalyzeProjectDoc(current, proposed);

  assert.equal(merged.report.context_prep_removed, true);
  assert.equal(merged.content.includes(CONTEXT_PREP_MANAGED_START), false);
  assert.equal(merged.content.includes('# stockflow Context'), false);
  assert.ok(merged.content.includes('StockFlow gestiona inventario.'));
});

test('mergeAnalyzeProjectDoc is idempotent for the same proposal', () => {
  const current = '# Contexto\n\n[Uno o dos parrafos que expliquen el proyecto.]\n';
  const proposed = '# Contexto de StockFlow\n\nStockFlow gestiona inventario.\n';
  const first = mergeAnalyzeProjectDoc(current, proposed).content;
  const second = mergeAnalyzeProjectDoc(first, proposed).content;

  assert.equal(second, first);
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
    assert.equal(writePlan[0].merge_report.classification, 'human_content');
    assert.equal(writePlan[0].merge_report.human_content_preserved, true);

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
