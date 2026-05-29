const { createTranslator } = require('./catalog');

function translatorForHuman(options = {}) {
  return createTranslator(options.language);
}

function formatStatus(status, translator = createTranslator()) {
  const key = `status.${String(status || '').replace(/-/g, '_')}`;
  const translated = translator.t(key);
  return translated.startsWith('[missing:') ? String(status || '') : translated;
}

function formatWarningPrefix(message, translator = createTranslator()) {
  const text = String(message || '');
  const match = text.match(/^Warning: (.+)$/);
  if (!match) {
    return text;
  }
  return translator.t('common.warning', { message: match[1] });
}

module.exports = {
  formatStatus,
  formatWarningPrefix,
  translatorForHuman,
};
