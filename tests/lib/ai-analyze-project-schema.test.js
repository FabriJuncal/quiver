const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ALLOWED_ANALYZE_DOC_UPDATE_PATHS,
  ANALYZE_PROJECT_KIND,
  ANALYZE_PROJECT_SCHEMA_VERSION,
  analyzeProjectSchema,
} = require('../../src/create-quiver/lib/ai/analyze-project-schema');

function baseAnalysis(overrides = {}) {
  return {
    schema_version: ANALYZE_PROJECT_SCHEMA_VERSION,
    kind: ANALYZE_PROJECT_KIND,
    product: {
      name: { name: 'Demo', confidence: 'unknown', evidence: [] },
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
      'docs/CONTEXTO.md': '# Context\n',
    },
    ...overrides,
  };
}

test('analyze-project schema accepts the required top-level contract', () => {
  const parsed = analyzeProjectSchema.parse(baseAnalysis());

  assert.equal(parsed.schema_version, 1);
  assert.equal(parsed.kind, 'quiver-project-analysis');
  assert.ok(ALLOWED_ANALYZE_DOC_UPDATE_PATHS.includes('docs/ARCHITECTURE.md'));
});

test('analyze-project schema rejects invalid confidence levels and unknown top-level fields', () => {
  assert.equal(analyzeProjectSchema.safeParse(baseAnalysis({
    claims: [{ claim: 'Bad confidence', confidence: 'certain', evidence: ['README.md'] }],
  })).success, false);

  assert.equal(analyzeProjectSchema.safeParse(baseAnalysis({
    extra: true,
  })).success, false);
});

test('analyze-project schema allows unknown findings without evidence', () => {
  const parsed = analyzeProjectSchema.parse(baseAnalysis({
    product: {
      name: { name: 'Unknown', confidence: 'unknown', evidence: [] },
      summary: '',
      claims: [],
    },
  }));

  assert.equal(parsed.product.name.confidence, 'unknown');
  assert.deepEqual(parsed.product.name.evidence, []);
});
