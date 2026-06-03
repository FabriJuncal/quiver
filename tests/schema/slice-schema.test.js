const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const {
  collectInvalidFixtures,
  collectRealSliceFixtures,
  loadSchema,
  runSliceSchemaCheck,
} = require('../../scripts/ci/check-slice-schema');

const repoRoot = path.resolve(__dirname, '..', '..');

test('slice schema is declared as JSON Schema Draft-07', () => {
  const schema = loadSchema(repoRoot);

  assert.equal(schema.$schema, 'http://json-schema.org/draft-07/schema#');
  assert.equal(schema.title, 'Quiver slice.json');
});

test('slice schema validates real runtime-valid fixtures and rejects invalid fixtures', () => {
  const fixtures = collectRealSliceFixtures(repoRoot);
  const invalidFixtures = collectInvalidFixtures(repoRoot);
  const report = runSliceSchemaCheck({ repoRoot });

  assert.ok(fixtures.valid.length > 250);
  assert.equal(invalidFixtures.length, 4);
  assert.equal(report.ok, true, [...report.failures, ...report.invalidPasses].join('\n'));
  assert.equal(report.validCount, fixtures.valid.length);
  assert.equal(report.invalidCount, invalidFixtures.length);
});
