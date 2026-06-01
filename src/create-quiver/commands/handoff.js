const LEGACY_HANDOFF_COMMANDS = new Map([
  ['check-handoff', { canonical: 'handoff check', mode: 'check-handoff' }],
  ['new-handoff', { canonical: 'handoff create', mode: 'new-handoff' }],
]);

const HANDOFF_COMMAND_MODE = new Map([
  ['check', 'check-handoff'],
  ['create', 'new-handoff'],
]);

const SUPPORTED_HANDOFF_COMMANDS = new Set(HANDOFF_COMMAND_MODE.keys());

module.exports = {
  HANDOFF_COMMAND_MODE,
  LEGACY_HANDOFF_COMMANDS,
  SUPPORTED_HANDOFF_COMMANDS,
};
