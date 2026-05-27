const { resolveUxMode } = require('./ux');

function formatError(message) {
  return `create-quiver: ${message}`;
}

function normalizeSelectorOptions(options = []) {
  return options.map((option) => {
    if (typeof option === 'string') {
      return {
        label: option,
        value: option,
        hint: '',
        default: false,
      };
    }
    return {
      label: String(option.label || option.name || option.id || option.value || ''),
      value: String(option.value || option.id || option.path || option.label || ''),
      hint: option.hint || option.description || '',
      default: option.default === true || option.recommended === true,
      raw: option.raw || option,
    };
  }).filter((option) => option.label && option.value);
}

function findOption(options, value) {
  const normalized = String(value || '').trim();
  if (!normalized) return null;
  return options.find((option) => option.value === normalized || option.label === normalized) || null;
}

function resolveDefaultOption(options, defaultValue) {
  return findOption(options, defaultValue) || options.find((option) => option.default) || (options.length === 1 ? options[0] : null);
}

async function loadClack(injected) {
  if (injected) return injected;
  return import('@clack/prompts');
}

async function selectOption(message, rawOptions, options = {}) {
  const normalizedOptions = normalizeSelectorOptions(rawOptions);
  if (normalizedOptions.length === 0) {
    throw new Error(formatError(`${options.name || 'selection'} has no available options.`));
  }

  const explicit = findOption(normalizedOptions, options.value);
  if (explicit) return explicit;
  if (options.value) {
    throw new Error(formatError(`${options.name || 'selection'} option '${options.value}' was not found.`));
  }

  const mode = resolveUxMode({
    interactive: options.interactive === true,
    json: options.json,
    noColor: options.noColor,
    stdinIsTTY: options.stdinIsTTY,
    stdoutIsTTY: options.stdoutIsTTY,
    stderrIsTTY: options.stderrIsTTY,
  }, options.env || process.env, {
    input: options.input || process.stdin,
    output: options.output || process.stdout,
    error: options.error || process.stderr,
  });

  if (mode.usePrompts) {
    if (typeof options.promptSelect === 'function') {
      const selected = await options.promptSelect(message, normalizedOptions);
      const match = findOption(normalizedOptions, selected);
      if (!match) {
        throw new Error(formatError(`${options.name || 'selection'} prompt returned unknown option '${selected}'.`));
      }
      return match;
    }
    const clack = await loadClack(options.prompts);
    const selected = await clack.select({
      message,
      options: normalizedOptions.map((option) => ({
        label: option.label,
        value: option.value,
        hint: option.hint || undefined,
      })),
      initialValue: resolveDefaultOption(normalizedOptions, options.defaultValue)?.value,
    });
    if (clack.isCancel && clack.isCancel(selected)) {
      throw new Error(formatError(`${options.name || 'selection'} was canceled.`));
    }
    return findOption(normalizedOptions, selected);
  }

  const fallback = resolveDefaultOption(normalizedOptions, options.defaultValue);
  if (fallback) return fallback;

  const flag = options.flag || '--value';
  const available = normalizedOptions.map((option) => option.value).join(', ');
  throw new Error(formatError([
    `${options.name || 'selection'} requires an explicit choice.`,
    `Available options: ${available}.`,
    `Use ${flag} <value> or rerun with --interactive.`,
  ].join('\n')));
}

module.exports = {
  normalizeSelectorOptions,
  selectOption,
};
