function parseCliArgs(argv, options = {}) {
  const legacyParseArgs = options.legacyParseArgs;
  if (typeof legacyParseArgs !== 'function') {
    throw new TypeError('parseCliArgs requires a legacyParseArgs adapter during v49 migration');
  }

  return legacyParseArgs(argv, {
    language: options.language,
  });
}

module.exports = {
  parseCliArgs,
};
