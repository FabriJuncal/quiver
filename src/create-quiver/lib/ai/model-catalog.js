const { assertSupportedProvider } = require('./providers');

const MODEL_CATALOG_VERSION = 1;
const MODEL_CATALOG_LAST_UPDATED = '2026-05-27';

const MODEL_CATALOG = Object.freeze({
  catalogVersion: MODEL_CATALOG_VERSION,
  lastUpdated: MODEL_CATALOG_LAST_UPDATED,
  providers: Object.freeze({
    codex: Object.freeze({
      id: 'codex',
      displayName: 'Codex',
      models: Object.freeze([
        knownModel('gpt-5.5', 'GPT 5.5', {
          aliases: ['GPT 5.5', 'gpt 5.5', 'Gpt-5.5'],
          recommendedFor: ['planner', 'reviewer'],
          costTier: 'high',
          qualityTier: 'premium',
          stability: 'stable',
          notes: 'Recommended for planning, specs, architecture, and high-risk reviews.',
        }),
        knownModel('gpt-5.4', 'GPT 5.4', {
          aliases: ['GPT 5.4', 'gpt 5.4'],
          recommendedFor: ['planner', 'reviewer'],
          costTier: 'medium',
          qualityTier: 'high',
          stability: 'stable',
          notes: 'Balanced planner or reviewer model.',
        }),
        knownModel('gpt-5.4-mini', 'GPT 5.4 mini', {
          aliases: ['GPT 5.4 mini', 'gpt 5.4 mini', 'gpt-5.4 mini'],
          recommendedFor: ['executor', 'doctor'],
          costTier: 'low',
          qualityTier: 'standard',
          stability: 'stable',
          notes: 'Recommended for lower-cost execution, diagnostics, and sub-agent work.',
        }),
        knownModel('gpt-5.3-codex', 'GPT 5.3 Codex', {
          aliases: ['GPT 5.3 Codex', 'gpt 5.3 codex'],
          recommendedFor: ['executor'],
          costTier: 'medium',
          qualityTier: 'high',
          stability: 'stable',
          notes: 'Recommended for more complex coding slices.',
        }),
        knownModel('gpt-5.3-codex-spark', 'GPT 5.3 Codex Spark', {
          aliases: ['GPT 5.3 Codex Spark', 'gpt 5.3 codex spark'],
          recommendedFor: ['executor'],
          costTier: 'medium',
          qualityTier: 'high',
          stability: 'preview',
          notes: 'Preview or limited model for quick code iteration.',
        }),
      ]),
    }),
    claude: Object.freeze({
      id: 'claude',
      displayName: 'Claude',
      models: Object.freeze([
        knownModel('opus', 'Claude Opus', {
          aliases: ['Claude Opus', 'opus'],
          recommendedFor: ['planner', 'reviewer'],
          costTier: 'high',
          qualityTier: 'premium',
          stability: 'stable',
          notes: 'Recommended for complex planning and architectural decisions.',
        }),
        knownModel('sonnet', 'Claude Sonnet', {
          aliases: ['Claude Sonnet', 'sonnet'],
          recommendedFor: ['executor', 'reviewer'],
          costTier: 'medium',
          qualityTier: 'high',
          stability: 'stable',
          notes: 'Balanced execution and review model.',
        }),
        knownModel('haiku', 'Claude Haiku', {
          aliases: ['Claude Haiku', 'haiku'],
          recommendedFor: ['doctor'],
          costTier: 'low',
          qualityTier: 'standard',
          stability: 'stable',
          notes: 'Recommended for diagnostics and simple tasks.',
        }),
        knownModel('claude-opus-4-7', 'Claude Opus 4.7', {
          aliases: ['OPUS 4.7', 'Claude Opus 4.7', 'opus 4.7'],
          recommendedFor: ['planner', 'reviewer'],
          costTier: 'high',
          qualityTier: 'premium',
          stability: 'known',
          notes: 'Version-pinned known catalog choice for planning.',
        }),
        knownModel('claude-sonnet-4-6', 'Claude Sonnet 4.6', {
          aliases: ['Claude Sonnet 4.6', 'sonnet 4.6'],
          recommendedFor: ['executor', 'reviewer'],
          costTier: 'medium',
          qualityTier: 'high',
          stability: 'known',
          notes: 'Version-pinned known catalog choice for execution and review.',
        }),
        knownModel('claude-haiku-4-5', 'Claude Haiku 4.5', {
          aliases: ['Claude Haiku 4.5', 'haiku 4.5'],
          recommendedFor: ['doctor'],
          costTier: 'low',
          qualityTier: 'standard',
          stability: 'known',
          notes: 'Version-pinned known catalog choice for low-cost diagnostics.',
        }),
      ]),
    }),
    gemini: Object.freeze({
      id: 'gemini',
      displayName: 'Gemini',
      models: Object.freeze([
        knownModel('gemini-3.1-pro-preview', 'Gemini 3.1 Pro Preview', {
          aliases: ['Gemini 3.1 Pro Preview', 'gemini 3.1 pro preview'],
          recommendedFor: ['planner', 'reviewer'],
          costTier: 'high',
          qualityTier: 'premium',
          stability: 'preview',
          notes: 'Known catalog choice for complex planning and review.',
        }),
        knownModel('gemini-3.5-flash', 'Gemini 3.5 Flash', {
          aliases: ['Gemini 3.5 Flash', 'gemini 3.5 flash'],
          recommendedFor: ['executor'],
          costTier: 'medium',
          qualityTier: 'high',
          stability: 'stable',
          notes: 'Known catalog choice for balanced execution.',
        }),
        knownModel('gemini-3.1-flash-lite', 'Gemini 3.1 Flash-Lite', {
          aliases: ['Gemini 3.1 Flash Lite', 'Gemini 3.1 Flash-Lite', 'gemini 3.1 flash lite'],
          recommendedFor: ['doctor'],
          costTier: 'low',
          qualityTier: 'standard',
          stability: 'stable',
          notes: 'Known catalog choice for low-cost diagnostics and mechanical tasks.',
        }),
        knownModel('gemini-3.1-pro-preview-customtools', 'Gemini 3.1 Pro Custom Tools', {
          aliases: ['Gemini 3.1 Pro Custom Tools', 'gemini 3.1 pro preview custom tools'],
          recommendedFor: ['planner', 'reviewer'],
          costTier: 'high',
          qualityTier: 'premium',
          stability: 'preview',
          notes: 'Known catalog choice for advanced tool-oriented workflows.',
        }),
      ]),
    }),
  }),
});

function knownModel(id, displayName, options = {}) {
  return Object.freeze({
    id,
    displayName,
    aliases: Object.freeze(Array.from(new Set([id, displayName].concat(options.aliases || [])))),
    recommendedFor: Object.freeze((options.recommendedFor || []).slice()),
    costTier: options.costTier || 'unknown',
    qualityTier: options.qualityTier || 'unknown',
    stability: options.stability || 'known',
    notes: options.notes || '',
    modelSource: 'catalog',
  });
}

function customModel(providerId, modelId = '') {
  const id = String(modelId || '').trim();
  return {
    id: id || 'custom',
    displayName: id || 'Custom',
    aliases: id ? [id] : ['custom'],
    recommendedFor: [],
    costTier: 'unknown',
    qualityTier: 'unknown',
    stability: 'custom',
    notes: 'Custom model id. Quiver cannot guarantee account availability without a live validation.',
    modelSource: 'custom',
    custom: true,
    provider: providerId ? assertSupportedProvider(providerId) : '',
  };
}

function getModelCatalog() {
  return MODEL_CATALOG;
}

function listCatalogProviders() {
  return Object.values(MODEL_CATALOG.providers).map((provider) => ({
    id: provider.id,
    displayName: provider.displayName,
    modelCount: provider.models.length,
  }));
}

function getProviderModelCatalog(providerId) {
  const provider = assertSupportedProvider(providerId);
  return MODEL_CATALOG.providers[provider];
}

function getKnownModelsForProvider(providerId, options = {}) {
  const provider = getProviderModelCatalog(providerId);
  const role = String(options.role || '').trim().toLowerCase();
  const includeCustom = options.includeCustom !== false;
  const models = provider.models.slice();
  const sorted = role
    ? models.sort((left, right) => roleScore(right, role) - roleScore(left, role))
    : models;

  if (!includeCustom) {
    return sorted;
  }

  return sorted.concat(customModel(provider.id));
}

function roleScore(model, role) {
  const roles = Array.isArray(model.recommendedFor) ? model.recommendedFor : [];
  const index = roles.indexOf(role);
  if (index === -1) return 0;
  return 100 - index;
}

function normalizeModelAliasKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function resolveModelFromEntries(providerId, modelValue, entries) {
  const provider = assertSupportedProvider(providerId);
  const input = String(modelValue || '').trim();
  const inputKey = normalizeModelAliasKey(input);
  if (!inputKey) {
    return {
      provider,
      input,
      matched: false,
      ambiguous: false,
      model: null,
      matches: [],
      reason: 'empty model',
    };
  }

  const matches = [];
  for (const model of entries || []) {
    const aliases = Array.isArray(model.aliases) ? model.aliases : [model.id, model.displayName];
    if (aliases.some((alias) => normalizeModelAliasKey(alias) === inputKey)) {
      matches.push(model);
    }
  }

  if (matches.length === 1) {
    const model = matches[0];
    return {
      provider,
      input,
      matched: true,
      ambiguous: false,
      model,
      matches,
      technicalModel: model.id,
      displayName: model.displayName,
      modelSource: model.modelSource || 'catalog',
      reason: 'known model alias matched',
    };
  }

  if (matches.length > 1) {
    return {
      provider,
      input,
      matched: false,
      ambiguous: true,
      model: null,
      matches,
      reason: 'ambiguous model alias',
    };
  }

  return {
    provider,
    input,
    matched: false,
    ambiguous: false,
    model: customModel(provider, input),
    matches: [],
    technicalModel: input,
    displayName: input,
    modelSource: 'custom',
    reason: 'custom model',
  };
}

function resolveKnownModel(providerId, modelValue) {
  const provider = getProviderModelCatalog(providerId);
  return resolveModelFromEntries(provider.id, modelValue, provider.models);
}

function normalizeModelSelection(providerId, modelValue, options = {}) {
  const resolution = resolveKnownModel(providerId, modelValue);
  const fallbackDisplayName = String(options.displayName || '').trim();

  if (resolution.ambiguous) {
    return {
      ...resolution,
      model: String(modelValue || '').trim(),
      displayName: fallbackDisplayName || String(modelValue || '').trim(),
      validationStatus: options.validationStatus || 'not-tested',
    };
  }

  return {
    ...resolution,
    model: resolution.technicalModel || String(modelValue || '').trim(),
    displayName: fallbackDisplayName || resolution.displayName || String(modelValue || '').trim(),
    validationStatus: options.validationStatus || 'not-tested',
  };
}

module.exports = {
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
};
