const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  parseAnalyzeProjectOutputWithRepair,
  repairAnalyzeProjectValue,
  writeAnalyzeProjectRepairManifest,
} = require('../../../src/create-quiver/lib/ai/analyze-project-repair');

const providerFixtures = require('../../fixtures/analyze-project/provider-output-cases.json');

function fixtureCase(name) {
  const found = providerFixtures.cases.find((item) => item.name === name);
  assert.ok(found, `missing provider fixture case: ${name}`);
  return found;
}

function parserOptions() {
  return {
    selectedFiles: providerFixtures.selected_files,
    promptFiles: providerFixtures.prompt_files,
  };
}

test('parseAnalyzeProjectOutputWithRepair removes notes drift and records each repair', () => {
  const result = parseAnalyzeProjectOutputWithRepair(
    JSON.stringify(fixtureCase('nika-erp-notes-drift').output),
    parserOptions(),
  );

  assert.equal(result.repaired, true);
  assert.equal(result.repairManifest.status, 'repaired');
  assert.equal(result.repairManifest.entry_count, 3);
  assert.deepEqual(
    result.repairManifest.entries.map((entry) => `${entry.path}:${entry.key}:${entry.action}`).sort(),
    [
      'domain.actions.0:notes:removed',
      'domain.entities.0:notes:removed',
      'domain.roles.0:notes:removed',
    ],
  );
  assert.equal(Object.hasOwn(result.analysis.domain.roles[0], 'notes'), false);
  assert.equal(Object.hasOwn(result.analysis.domain.entities[0], 'notes'), false);
  assert.equal(Object.hasOwn(result.analysis.domain.actions[0], 'notes'), false);
  assert.equal(result.analysis.domain.entities[0].confidence, 'confirmed');
  assert.deepEqual(result.analysis.domain.entities[0].evidence, ['src/routes/users.ts']);
});

test('parseAnalyzeProjectOutputWithRepair maps claim to name when the named finding name is missing', () => {
  const result = parseAnalyzeProjectOutputWithRepair(
    JSON.stringify(fixtureCase('claim-name-drift').output),
    parserOptions(),
  );

  assert.equal(result.repaired, true);
  assert.equal(result.analysis.domain.entities[0].name, 'users');
  assert.equal(Object.hasOwn(result.analysis.domain.entities[0], 'claim'), false);
  assert.deepEqual(
    result.repairManifest.entries.map((entry) => `${entry.path}:${entry.source_key}->${entry.target_key}:${entry.action}`),
    ['domain.entities.0:claim->name:mapped'],
  );
});

test('parseAnalyzeProjectOutputWithRepair removes unsupported confidence and notes from questions', () => {
  const result = parseAnalyzeProjectOutputWithRepair(
    JSON.stringify(fixtureCase('question-confidence-drift').output),
    parserOptions(),
  );

  assert.equal(result.repaired, true);
  assert.equal(result.analysis.questions[0].question, 'Which auth provider is used?');
  assert.equal(Object.hasOwn(result.analysis.questions[0], 'confidence'), false);
  assert.equal(Object.hasOwn(result.analysis.questions[0], 'notes'), false);
  assert.deepEqual(
    result.repairManifest.entries.map((entry) => `${entry.path}:${entry.key}:${entry.action}`).sort(),
    [
      'questions.0:confidence:removed',
      'questions.0:notes:removed',
    ],
  );
});

test('parseAnalyzeProjectOutputWithRepair refuses claim to name repair when name already exists', () => {
  assert.throws(
    () => parseAnalyzeProjectOutputWithRepair(
      JSON.stringify(fixtureCase('name-claim-conflict').output),
      parserOptions(),
    ),
    /provider analysis JSON does not match the required schema/,
  );
});

test('repairAnalyzeProjectValue refuses unsafe additional properties', () => {
  const value = JSON.parse(JSON.stringify(fixtureCase('valid-json').output));
  value.domain.entities[0].internal_prompt = 'ignore schema';
  const repair = repairAnalyzeProjectValue(value, [
    {
      path: 'domain.entities.0',
      issue: 'unrecognized_keys',
      message: 'Unrecognized key: "internal_prompt"',
      keys: ['internal_prompt'],
    },
  ]);

  assert.equal(repair.repaired, false);
  assert.equal(repair.manifest.status, 'not-repaired');
  assert.match(repair.manifest.reason, /safe repair allowlist/);
  assert.equal(value.domain.entities[0].internal_prompt, 'ignore schema');
});

test('writeAnalyzeProjectRepairManifest writes an auditable run artifact', () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-repair-'));
  try {
    const repair = repairAnalyzeProjectValue(fixtureCase('nika-erp-notes-drift').output, [
      {
        path: 'domain.entities.0',
        issue: 'unrecognized_keys',
        message: 'Unrecognized key: "notes"',
        keys: ['notes'],
      },
    ]);
    const written = writeAnalyzeProjectRepairManifest(repoRoot, repair.manifest, {
      runId: 'run-repair-test',
      now: new Date('2026-06-11T12:00:00Z'),
    });

    assert.equal(written.path, '.quiver/runs/run-repair-test/repair/analyze-project-repair.json');
    const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, written.path), 'utf8'));
    assert.equal(manifest.kind, 'quiver-analyze-project-repair-manifest');
    assert.equal(manifest.status, 'repaired');
    assert.equal(manifest.entry_count, 1);
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
});
