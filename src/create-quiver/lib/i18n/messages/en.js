module.exports = {
  metadata: {
    language: 'en',
    catalogVersion: 1,
  },
  messages: {
    'cli.help': {
      headings: {
        usage: 'Usage:',
        commands: 'Commands:',
        options: 'Options:',
        examples: 'Examples:',
      },
      groupTitles: {},
      commandDescriptions: {},
      optionDescriptions: {},
    },
    'common.command.help': 'Run: npx create-quiver --help',
    'common.language.current': 'Language: {language}',
    'common.language.unsupported': 'Unsupported language "{language}". Run: npx create-quiver config language set en',
    'common.slice.count': {
      one: '{count} slice',
      other: '{count} slices',
    },
    'common.warning': 'Warning: {message}',
    'error.command.help': 'Run: npx create-quiver --help',
    'error.command.init_hint': 'If you meant to initialize a project, use: npx create-quiver init --name "{commandName}"',
    'error.command.unsupported': 'unsupported command: {commandName}',
    'error.command.update_hint': 'If this command exists in newer docs, update create-quiver and rerun the command.',
    'error.flag.invalid_value': 'invalid value for {flag}',
    'error.flag.missing_value': 'missing value for {flag}',
    'error.flag.unknown': 'unknown flag: {flag}',
    'warning.language.unsupported_source': 'unsupported language "{language}" from {source}; falling back to {fallback}. Supported languages: {supported}.',
  },
};
