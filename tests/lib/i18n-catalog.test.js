const assert = require('node:assert/strict');
const test = require('node:test');

const {
  CATALOGS,
  assertCatalogCompleteness,
  createTranslator,
  getCatalog,
  interpolate,
  resolveMessage,
  sanitizeInterpolationValue,
  translate,
  validateCatalogCompleteness,
} = require('../../src/create-quiver/lib/i18n/catalog');

test('catalogs expose supported languages and version metadata', () => {
  assert.equal(getCatalog('en').metadata.language, 'en');
  assert.equal(getCatalog('es').metadata.language, 'es');
  assert.equal(getCatalog('fr').metadata.language, 'en');
  assert.equal(getCatalog('en').metadata.catalogVersion, 1);
  assert.equal(getCatalog('es').metadata.catalogVersion, 1);
});

test('catalog completeness is enforced across en and es', () => {
  assert.deepEqual(assertCatalogCompleteness(), {
    ok: true,
    missing: [],
    extra: [],
  });

  const incomplete = {
    en: CATALOGS.en,
    es: {
      metadata: CATALOGS.es.metadata,
      messages: {
        'common.command.help': CATALOGS.es.messages['common.command.help'],
      },
    },
  };

  assert.equal(validateCatalogCompleteness(incomplete).ok, false);
  assert.throws(
    () => assertCatalogCompleteness(incomplete),
    /i18n catalog completeness failed/,
  );
});

test('translate supports interpolation and predictable missing params', () => {
  assert.equal(translate('en', 'common.language.current', { language: 'es' }), 'Language: es');
  assert.equal(translate('es', 'common.language.current', { language: 'en' }), 'Idioma: en');
  assert.equal(interpolate('Value: {value} / {missing}', { value: 'ok' }), 'Value: ok / [missing:missing]');
});

test('translate sanitizes unsafe interpolation values', () => {
  assert.equal(sanitizeInterpolationValue('\u001b[31mred\u001b[0m\nnext\tcol'), 'red\\nnext\\tcol');
  assert.equal(translate('en', 'common.warning', {
    message: '\u001b[31msecret\u001b[0m\nnext',
  }), 'Warning: secret\\nnext');
});

test('translate supports one and other plural forms', () => {
  assert.equal(translate('en', 'common.slice.count', { count: 1 }), '1 slice');
  assert.equal(translate('en', 'common.slice.count', { count: 2 }), '2 slices');
  assert.equal(translate('es', 'common.slice.count', { count: 1 }), '1 slice');
  assert.equal(translate('es', 'common.slice.count', { count: 3 }), '3 slices');
});

test('fallback to en is explicit and deterministic', () => {
  assert.equal(translate('fr', 'common.language.current', { language: 'es' }), 'Language: es');
  assert.deepEqual(resolveMessage('fr', 'common.language.current'), {
    message: 'Language: {language}',
    language: 'en',
    fallback: false,
  });

  assert.deepEqual(resolveMessage('es', 'missing.key'), {
    message: '[missing:missing.key]',
    language: 'en',
    fallback: true,
    missing: true,
  });
  assert.equal(translate('es', 'missing.key'), '[missing:missing.key]');
});

test('translator keeps command snippets and flags exact', () => {
  const en = createTranslator('en');
  const es = createTranslator('es');

  assert.equal(en.t('common.command.help'), 'Run: npx create-quiver --help');
  assert.equal(es.t('common.command.help'), 'Ejecuta: npx create-quiver --help');
  assert.match(es.t('common.language.unsupported', { language: 'fr' }), /npx create-quiver config language set en/);
});
