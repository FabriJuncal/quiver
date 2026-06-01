const LEGACY_SLICE_COMMANDS = new Map([
  ['start-slice', { canonical: 'slice start', mode: 'start-slice' }],
  ['check-slice', { canonical: 'slice check', mode: 'check-slice' }],
  ['check-pr', { canonical: 'slice check-pr', mode: 'check-pr' }],
  ['check-scope', { canonical: 'slice scope', mode: 'check-scope' }],
  ['cleanup-slice', { canonical: 'slice cleanup', mode: 'cleanup-slice' }],
  ['refresh-active-slices', { canonical: 'slice refresh', mode: 'refresh-active-slices' }],
]);

const SLICE_COMMAND_MODE = new Map([
  ['start', 'start-slice'],
  ['check', 'check-slice'],
  ['check-pr', 'check-pr'],
  ['scope', 'check-scope'],
  ['cleanup', 'cleanup-slice'],
  ['refresh', 'refresh-active-slices'],
]);

const SUPPORTED_SLICE_COMMANDS = new Set(SLICE_COMMAND_MODE.keys());

module.exports = {
  LEGACY_SLICE_COMMANDS,
  SLICE_COMMAND_MODE,
  SUPPORTED_SLICE_COMMANDS,
};
