const assert = require('node:assert/strict');
const test = require('node:test');

const {
  AnalyzeProjectAnalysisError,
  parseAnalyzeProjectOutput,
} = require('../../src/create-quiver/lib/ai/analyze-project-parser');

function validAnalysis(overrides = {}) {
  return {
    schema_version: 1,
    kind: 'quiver-project-analysis',
    product: {
      name: { name: 'Demo', confidence: 'confirmed', evidence: ['README.md'] },
      type: { name: 'Web app', confidence: 'inferred', evidence: ['package.json'] },
      summary: 'Demo app',
      claims: [],
    },
    domain: {
      roles: [],
      entities: [{ name: 'users', confidence: 'confirmed', evidence: ['src/routes/users.ts'] }],
      actions: [],
      flows: [],
      incomplete_or_suspicious: [],
      claims: [],
    },
    architecture: {
      frontend: [],
      backend: [{ name: 'routes', confidence: 'confirmed', evidence: ['src/routes/users.ts'] }],
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
    features: [{ name: 'User routes', confidence: 'confirmed', evidence: ['src/routes/users.ts'] }],
    risks: [],
    questions: [],
    claims: [{ claim: 'The app exposes user routes', confidence: 'confirmed', evidence: ['src/routes/users.ts'] }],
    doc_updates: {
      'docs/CONTEXTO.md': '# Context\n',
    },
    ...overrides,
  };
}

const parserOptions = {
  selectedFiles: [
    { path: 'README.md' },
    { path: 'package.json' },
    { path: 'src/routes/users.ts' },
  ],
  promptFiles: [
    { path: 'README.md', truncated: false },
    { path: 'package.json', truncated: false },
    { path: 'src/routes/users.ts', truncated: false },
  ],
};

test('parseAnalyzeProjectOutput accepts evidence-backed JSON analysis', () => {
  const result = parseAnalyzeProjectOutput(JSON.stringify(validAnalysis()), parserOptions);

  assert.equal(result.analysis.kind, 'quiver-project-analysis');
  assert.equal(result.parseSource, 'raw-json');
  assert.deepEqual(result.docUpdatePaths, ['docs/CONTEXTO.md']);
  assert.deepEqual(result.warnings, []);
});

test('parseAnalyzeProjectOutput rejects missing selected evidence paths', () => {
  assert.throws(
    () => parseAnalyzeProjectOutput(JSON.stringify(validAnalysis({
      claims: [{ claim: 'Invented evidence', confidence: 'confirmed', evidence: ['src/missing.ts'] }],
    })), parserOptions),
    (error) => {
      assert.ok(error instanceof AnalyzeProjectAnalysisError);
      assert.equal(error.issues[0].issue, 'evidence-not-selected');
      return true;
    },
  );
});

test('parseAnalyzeProjectOutput downgrades confirmed claims backed by truncated files', () => {
  const result = parseAnalyzeProjectOutput(JSON.stringify(validAnalysis()), {
    ...parserOptions,
    promptFiles: [
      { path: 'README.md', truncated: false },
      { path: 'package.json', truncated: false },
      { path: 'src/routes/users.ts', truncated: true },
    ],
  });

  assert.equal(result.analysis.domain.entities[0].confidence, 'inferred');
  assert.equal(result.analysis.claims[0].confidence, 'inferred');
  assert.ok(result.warnings.some((warning) => warning.issue === 'confirmed-downgraded-truncated-evidence'));
});

test('parseAnalyzeProjectOutput rejects unapproved doc update paths', () => {
  assert.throws(
    () => parseAnalyzeProjectOutput(JSON.stringify(validAnalysis({
      doc_updates: {
        'src/app.ts': 'bad',
      },
    })), parserOptions),
    /provider analysis JSON failed evidence validation/,
  );
});

test('parseAnalyzeProjectOutput rejects malformed provider output', () => {
  assert.throws(
    () => parseAnalyzeProjectOutput('not json', parserOptions),
    /provider analysis output is not valid JSON/,
  );
});
