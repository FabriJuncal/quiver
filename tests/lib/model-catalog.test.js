const assert = require('node:assert/strict');
const test = require('node:test');

const {
  MODEL_CATALOG_LAST_UPDATED,
  MODEL_CATALOG_VERSION,
  customModel,
  getKnownModelsForProvider,
  getModelCatalog,
  getProviderModelCatalog,
  listCatalogProviders,
  normalizeModelAliasKey,
  normalizeModelSelection,
  resolveKnownModel,
  resolveModelFromEntries,
} = require('../../src/create-quiver/lib/ai/model-catalog');

test('model catalog exposes versioned providers and required model entries', () => {
  const catalog = getModelCatalog();

  assert.equal(catalog.catalogVersion, MODEL_CATALOG_VERSION);
  assert.equal(catalog.lastUpdated, MODEL_CATALOG_LAST_UPDATED);
  assert.deepEqual(listCatalogProviders().map((provider) => provider.id), ['codex', 'claude', 'gemini']);

  assert.ok(getProviderModelCatalog('codex').models.some((model) => model.id === 'gpt-5.5'));
  assert.ok(getProviderModelCatalog('codex').models.some((model) => model.id === 'gpt-5.4-mini'));
  assert.ok(getProviderModelCatalog('claude').models.some((model) => model.id === 'opus'));
  assert.ok(getProviderModelCatalog('claude').models.some((model) => model.id === 'claude-sonnet-4-6'));
  assert.ok(getProviderModelCatalog('gemini').models.some((model) => model.id === 'gemini-3.5-flash'));
  assert.ok(getProviderModelCatalog('gemini').models.some((model) => model.id === 'gemini-3.1-pro-preview-customtools'));
});

test('model aliases are case-insensitive and tolerant of spaces and dashes', () => {
  assert.equal(normalizeModelAliasKey('GPT 5.5'), normalizeModelAliasKey('gpt-5.5'));
  assert.equal(normalizeModelAliasKey('gpt 5.5'), normalizeModelAliasKey('Gpt-5.5'));

  for (const value of ['GPT 5.5', 'gpt 5.5', 'Gpt-5.5', 'gpt-5.5']) {
    const resolution = resolveKnownModel('codex', value);
    assert.equal(resolution.matched, true);
    assert.equal(resolution.technicalModel, 'gpt-5.5');
    assert.equal(resolution.displayName, 'GPT 5.5');
  }
});

test('model catalog sorts known models by requested role and includes custom choice', () => {
  const executorModels = getKnownModelsForProvider('codex', { role: 'executor' });

  assert.equal(executorModels[0].recommendedFor.includes('executor'), true);
  assert.equal(executorModels.at(-1).id, 'custom');
  assert.equal(executorModels.at(-1).custom, true);
});

test('custom model resolution remains allowed but marked as custom', () => {
  const resolution = normalizeModelSelection('codex', 'experimental-model');

  assert.equal(resolution.matched, false);
  assert.equal(resolution.model, 'experimental-model');
  assert.equal(resolution.displayName, 'experimental-model');
  assert.equal(resolution.modelSource, 'custom');
  assert.equal(resolution.validationStatus, 'not-tested');

  assert.equal(customModel('codex', 'manual-id').id, 'manual-id');
});

test('ambiguous aliases are reported without selecting a model', () => {
  const resolution = resolveModelFromEntries('codex', 'duplicate', [
    {
      id: 'first',
      displayName: 'First',
      aliases: ['duplicate'],
      modelSource: 'catalog',
    },
    {
      id: 'second',
      displayName: 'Second',
      aliases: ['duplicate'],
      modelSource: 'catalog',
    },
  ]);

  assert.equal(resolution.matched, false);
  assert.equal(resolution.ambiguous, true);
  assert.equal(resolution.matches.length, 2);
  assert.equal(resolution.model, null);
});
