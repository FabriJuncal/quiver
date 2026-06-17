const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  ANALYZE_MANAGED_END,
  ANALYZE_MANAGED_START,
} = require('../../src/create-quiver/lib/ai/analyze-project-docs');
const {
  validateAnalyzeProjectPostWrite,
} = require('../../src/create-quiver/lib/ai/analyze-project-validation');

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function makeRepo(structure = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-analyze-validation-'));
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

function managed(content) {
  return `${ANALYZE_MANAGED_START}\n${content.trimEnd()}\n${ANALYZE_MANAGED_END}\n`;
}

function baseReport(overrides = {}) {
  return {
    selected_files: [{ path: 'README.md' }],
    prompt: { files: [{ path: 'README.md', truncated: false }] },
    analysis: {
      schema_version: 1,
      kind: 'quiver-project-analysis',
      product: {
        name: { name: 'Validation Demo', confidence: 'confirmed', evidence: ['README.md'] },
        summary: '',
        claims: [],
      },
      domain: {
        roles: [],
        entities: [],
        actions: [],
        flows: [],
        incomplete_or_suspicious: [],
        claims: [],
      },
      architecture: {
        frontend: [],
        backend: [],
        auth: [],
        persistence: [],
        integrations: [],
        state: [],
        api: [],
        testing: [],
        deploy: [],
        risks: [],
        claims: [],
      },
      features: [],
      risks: [],
      questions: [],
      claims: [],
      doc_updates: {
        'docs/CONTEXTO.md': '# Context\nProduct: Validation Demo\n',
      },
    },
    doc_proposal: {
      schema_version: 1,
      kind: 'quiver-analyze-project-doc-proposal',
      summary: '',
      docs: [{ path: 'docs/CONTEXTO.md', action: 'update', content: '# Context\nProduct: Validation Demo\n', reason: 'test' }],
    },
    write_plan: [{ path: 'docs/CONTEXTO.md', action: 'update' }],
    written_docs: ['docs/CONTEXTO.md'],
    snapshot: { manifestPath: '.quiver/runs/run-test/snapshots/20260610T120000Z/manifest.json' },
    ...overrides,
  };
}

function writeManifest(repoRoot, paths = ['docs/CONTEXTO.md']) {
  writeFile(path.join(repoRoot, '.quiver/runs/run-test/snapshots/20260610T120000Z/manifest.json'), JSON.stringify({
    schema_version: 1,
    kind: 'quiver-analyze-project-write-manifest',
    entries: paths.map((docPath) => ({ path: docPath, action: 'update' })),
  }, null, 2));
}

test('post-write validation passes clean managed docs', () => {
  const repo = makeRepo({
    'README.md': '# Validation Demo\n',
    'docs/CONTEXTO.md': `# Human\n\n${managed('# Context\nProduct: Validation Demo\n')}`,
  });

  try {
    writeManifest(repo.root);
    const validation = validateAnalyzeProjectPostWrite(repo.root, baseReport());

    assert.equal(validation.ok, true);
    assert.deepEqual(validation.errors, []);
    assert.deepEqual(validation.warnings, []);
    assert.deepEqual(validation.checked_docs, ['docs/CONTEXTO.md']);
  } finally {
    repo.cleanup();
  }
});

test('post-write validation rejects critical placeholders in managed docs', () => {
  const repo = makeRepo({
    'README.md': '# Validation Demo\n',
    'docs/CONTEXTO.md': managed('# Context\nTODO: complete later\n'),
  });

  try {
    writeManifest(repo.root);
    const validation = validateAnalyzeProjectPostWrite(repo.root, baseReport());

    assert.equal(validation.ok, false);
    assert.equal(validation.errors[0].issue, 'placeholder-todo');
  } finally {
    repo.cleanup();
  }
});

test('post-write validation warns or fails strict when primary visible docs keep critical scaffold placeholders', () => {
  const repo = makeRepo({
    'README.md': '# Validation Demo\n',
    'docs/CONTEXTO.md': `# Contexto\n\n[Uno o dos parrafos que expliquen el proyecto.]\n\n${managed('# Context\nProduct: Validation Demo\n')}`,
  });

  try {
    writeManifest(repo.root);
    const warningValidation = validateAnalyzeProjectPostWrite(repo.root, baseReport());
    const strictValidation = validateAnalyzeProjectPostWrite(repo.root, baseReport(), { strict: true });

    assert.equal(warningValidation.ok, true);
    assert.ok(warningValidation.warnings.some((issue) => issue.issue === 'visible-critical-placeholder'));
    assert.equal(strictValidation.ok, false);
    assert.ok(strictValidation.errors.some((issue) => issue.issue === 'visible-critical-placeholder'));
  } finally {
    repo.cleanup();
  }
});

test('post-write validation reports PROJECT_MAP contradictions as warnings or strict errors', () => {
  const repo = makeRepo({
    'README.md': '# Validation Demo\n',
    'docs/PROJECT_MAP.md': managed('# Project Map\nStack: Next.js\nDatabase: Supabase\n'),
    'docs/CONTEXTO.md': managed('# Context\nStack: Rails\nDatabase: PostgreSQL\n'),
  });
  const report = baseReport({
    doc_proposal: {
      schema_version: 1,
      kind: 'quiver-analyze-project-doc-proposal',
      summary: '',
      docs: [
        { path: 'docs/CONTEXTO.md', action: 'update', content: '# Context\nStack: Rails\nDatabase: PostgreSQL\n', reason: 'test' },
        { path: 'docs/PROJECT_MAP.md', action: 'update', content: '# Project Map\nStack: Next.js\nDatabase: Supabase\n', reason: 'test' },
      ],
    },
    write_plan: [
      { path: 'docs/CONTEXTO.md', action: 'update' },
      { path: 'docs/PROJECT_MAP.md', action: 'update' },
    ],
    written_docs: ['docs/CONTEXTO.md', 'docs/PROJECT_MAP.md'],
    analysis: {
      ...baseReport().analysis,
      doc_updates: {
        'docs/CONTEXTO.md': '# Context\nStack: Rails\nDatabase: PostgreSQL\n',
        'docs/PROJECT_MAP.md': '# Project Map\nStack: Next.js\nDatabase: Supabase\n',
      },
    },
  });

  try {
    writeManifest(repo.root, ['docs/CONTEXTO.md', 'docs/PROJECT_MAP.md']);
    const warningValidation = validateAnalyzeProjectPostWrite(repo.root, report);
    const strictValidation = validateAnalyzeProjectPostWrite(repo.root, report, { strict: true });

    assert.equal(warningValidation.ok, true);
    assert.ok(warningValidation.warnings.some((issue) => issue.issue === 'deterministic-doc-conflict'));
    assert.equal(strictValidation.ok, false);
    assert.ok(strictValidation.errors.some((issue) => issue.issue === 'deterministic-doc-conflict'));
  } finally {
    repo.cleanup();
  }
});

test('post-write validation rechecks evidence paths against the selected sample', () => {
  const repo = makeRepo({
    'README.md': '# Validation Demo\n',
    'docs/CONTEXTO.md': managed('# Context\nProduct: Validation Demo\n'),
  });
  const report = baseReport({
    analysis: {
      ...baseReport().analysis,
      claims: [{ claim: 'Invented file', confidence: 'confirmed', evidence: ['src/missing.ts'] }],
    },
  });

  try {
    writeManifest(repo.root);
    const validation = validateAnalyzeProjectPostWrite(repo.root, report);

    assert.equal(validation.ok, false);
    assert.ok(validation.errors.some((issue) => issue.issue === 'evidence-not-selected'));
  } finally {
    repo.cleanup();
  }
});
