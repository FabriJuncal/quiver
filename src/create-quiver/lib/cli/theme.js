const QUIVER_COLORS = Object.freeze({
  sky: '#86C8F2',
  blue: '#6BADEB',
  periwinkle: '#7F9EE8',
  violet: '#9B82E6',
  magenta: '#D56AB0',
});

const STATUS_COLORS = Object.freeze({
  info: 'sky',
  command: 'blue',
  success: 'blue',
  planner: 'violet',
  review: 'magenta',
  warning: 'magenta',
  error: 'magenta',
  risk: 'magenta',
  muted: 'periwinkle',
});

function isTruthy(value) {
  return /^(1|true|yes|on)$/i.test(String(value || '').trim());
}

function isAsciiLocale(env = process.env) {
  const locale = `${env.LC_ALL || ''} ${env.LC_CTYPE || ''} ${env.LANG || ''}`;
  return /\bC\b|ASCII/i.test(locale);
}

function isDumbTerminal(env = process.env) {
  return String(env.TERM || '').toLowerCase() === 'dumb';
}

function shouldUseColor(options = {}, env = process.env, tty = {}) {
  if (options.json || options.noColor) return false;
  if (env.NO_COLOR || env.FORCE_COLOR === '0') return false;
  if (isDumbTerminal(env)) return false;
  if (isTruthy(env.CI)) return false;
  if (tty.stdout === false) return false;
  if (options.color === true) return true;
  return Boolean(tty.stdout);
}

function shouldUseUnicode(options = {}, env = process.env, tty = {}) {
  if (options.ascii || options.json) return false;
  if (isDumbTerminal(env) || isAsciiLocale(env)) return false;
  if (tty.stdout === false) return false;
  if (options.unicode === true) return true;
  return Boolean(tty.stdout);
}

function hexToRgb(hex) {
  const normalized = String(hex || '').replace(/^#/, '');
  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return null;
  }
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function colorize(value, colorName, theme) {
  const text = String(value ?? '');
  if (!theme?.useColor) return text;
  const rgb = hexToRgb(theme.colors[colorName] || colorName);
  if (!rgb) return text;
  return `\u001b[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m${text}\u001b[0m`;
}

function resolveTheme(options = {}, env = process.env, tty = {}) {
  const useColor = shouldUseColor(options, env, tty);
  const useUnicode = shouldUseUnicode(options, env, tty);
  const symbols = useUnicode
    ? { start: '◇', section: '◆', success: '✓', warning: '!', error: '✖', bullet: '•' }
    : { start: '*', section: '*', success: 'OK', warning: 'WARN', error: 'ERR', bullet: '-' };
  const theme = {
    colors: QUIVER_COLORS,
    statusColors: STATUS_COLORS,
    symbols,
    useColor,
    useUnicode,
  };

  return {
    ...theme,
    colorize: (value, colorName) => colorize(value, colorName, theme),
    status: (status, value) => colorize(value, STATUS_COLORS[status] || 'sky', theme),
  };
}

module.exports = {
  QUIVER_COLORS,
  STATUS_COLORS,
  colorize,
  isAsciiLocale,
  isDumbTerminal,
  isTruthy,
  resolveTheme,
  shouldUseColor,
  shouldUseUnicode,
};
