const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DRAFT_LIFECYCLE_STATES,
  analyzeDraftStructure,
  compareDraftStructure,
} = require('../../src/create-quiver/lib/ai/draft-integrity');

test('draft lifecycle vocabulary is explicit and bounded', () => {
  assert.deepEqual(DRAFT_LIFECYCLE_STATES, [
    'draft',
    'current',
    'reviewed',
    'approved',
    'approved-with-conditions',
    'rejected',
    'superseded',
    'corrupted',
  ]);
});

test('markdown extraction recognizes requirement, acceptance, slice, and fenced JSON identities', () => {
  const analysis = analyzeDraftStructure([
    '# Contract V59-RQ-01',
    '- AC-01 preserves history.',
    '- Implement slice-01-draft-integrity.',
    '```json',
    JSON.stringify({ requirements: [{ id: 'RQ-010' }] }),
    '```',
  ].join('\n'));

  assert.equal(analysis.supported, true);
  assert.deepEqual(analysis.identities.requirements, ['RQ-010', 'V59-RQ-01']);
  assert.deepEqual(analysis.identities.acceptance_criteria, ['AC-01']);
  assert.deepEqual(analysis.identities.slices, ['slice-01-draft-integrity']);
  assert.deepEqual(analysis.diagnostics, []);
});

test('structured extraction supports exact collections, references, and v58 acceptance arrays', () => {
  const analysis = analyzeDraftStructure(JSON.stringify({
    spec: {
      requirements: [{ id: 'RQ-010' }],
      acceptance: ['AC-01 remains compatible'],
      slices: [{
        slice_id: 'slice-01-core',
        acceptance: ['AC-02 is nested'],
        requirement_ids: ['RQ-010'],
      }],
    },
  }));

  assert.equal(analysis.supported, true);
  assert.deepEqual(analysis.collections, ['acceptance_criteria', 'requirements', 'slices']);
  assert.deepEqual(analysis.identities.acceptance_criteria, ['AC-01', 'AC-02']);
  assert.deepEqual(analysis.references, ['requirements:RQ-010']);
  assert.deepEqual(analysis.diagnostics, []);
});

test('preservation compares structural identity rather than word count', () => {
  const previous = '# Long explanation\n\nV59-RQ-01 has many words about behavior.\n\nAC-01 has even more explanatory prose.\n';
  const candidate = 'V59-RQ-01\nAC-01\nAC-02\n';
  const result = compareDraftStructure(previous, candidate);

  assert.equal(result.status, 'preserved');
  assert.deepEqual(result.preserved_ids, ['acceptance_criteria:AC-01', 'requirements:V59-RQ-01']);
  assert.deepEqual(result.added_ids, ['acceptance_criteria:AC-02']);
  assert.deepEqual(result.removed_ids, []);
});

test('missing identity and required collection are diagnosed as corruption', () => {
  const previous = JSON.stringify({
    requirements: [{ id: 'RQ-010' }],
    acceptance_criteria: [{ id: 'AC-01' }],
  });
  const candidate = JSON.stringify({
    requirements: [{ id: 'RQ-010' }],
  });
  const result = compareDraftStructure(previous, candidate);

  assert.equal(result.status, 'corrupted');
  assert.ok(result.diagnostics.some((item) => item.code === 'REQUIRED_COLLECTION_REMOVED'));
  assert.ok(result.diagnostics.some((item) => item.code === 'IDENTITY_REMOVED' && item.id === 'AC-01'));
});

test('explicit deletion is accepted only when the exact identity and references are removed', () => {
  const previous = JSON.stringify({
    requirements: [{ id: 'RQ-010' }, { id: 'RQ-011' }],
    references: ['RQ-010', 'RQ-011'],
  });
  const candidate = JSON.stringify({
    requirements: [{ id: 'RQ-010' }],
    references: ['RQ-010'],
  });
  const result = compareDraftStructure(previous, candidate, {
    removals: [{ collection: 'requirements', id: 'RQ-011' }],
  });

  assert.equal(result.status, 'preserved');
  assert.deepEqual(result.removed_ids, ['requirements:RQ-011']);
  assert.deepEqual(result.diagnostics, []);

  const dangling = compareDraftStructure(previous, JSON.stringify({
    requirements: [{ id: 'RQ-010' }],
    references: ['RQ-010', 'RQ-011'],
  }), {
    removals: [{ collection: 'requirements', id: 'RQ-011' }],
  });
  assert.equal(dangling.status, 'corrupted');
  assert.ok(dangling.diagnostics.some((item) => item.code === 'REFERENCE_BROKEN'));
});

test('duplicates, broken references, malformed structured content, and free text fail closed', () => {
  const duplicate = analyzeDraftStructure(JSON.stringify({
    slices: [{ slice_id: 'slice-01-core' }, { slice_id: 'slice-01-core' }],
  }));
  assert.ok(duplicate.diagnostics.some((item) => item.code === 'IDENTITY_DUPLICATE'));

  const markdownDuplicate = analyzeDraftStructure('AC-01 first\nAC-01 repeated\n');
  assert.ok(markdownDuplicate.diagnostics.some((item) => item.code === 'IDENTITY_DUPLICATE'));

  const crossFormatDuplicate = analyzeDraftStructure([
    '```json',
    '{"acceptance_criteria":[{"id":"AC-01"}]}',
    '```',
    'AC-01 repeated outside the structured block',
  ].join('\n'));
  assert.ok(crossFormatDuplicate.diagnostics.some((item) => item.code === 'IDENTITY_DUPLICATE'));

  const broken = analyzeDraftStructure(JSON.stringify({
    requirements: [{ id: 'RQ-010' }],
    references: ['RQ-011'],
  }));
  assert.ok(broken.diagnostics.some((item) => item.code === 'REFERENCE_BROKEN'));

  const malformed = compareDraftStructure(null, '```json\n{"requirements":[\n```');
  assert.equal(malformed.status, 'corrupted');
  assert.ok(malformed.diagnostics.some((item) => item.code === 'STRUCTURED_JSON_INVALID'));

  const malformedDocument = compareDraftStructure(null, '{"requirements":[{"id":"RQ-010"}');
  assert.equal(malformedDocument.status, 'corrupted');
  assert.ok(malformedDocument.diagnostics.some((item) => item.code === 'STRUCTURED_JSON_INVALID'));

  const unsupported = compareDraftStructure(null, 'ordinary prose with no structural identity');
  assert.equal(unsupported.status, 'unsupported');
  assert.deepEqual(unsupported.diagnostics, [{ code: 'STRUCTURE_UNSUPPORTED' }]);
});
