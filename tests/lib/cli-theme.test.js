const assert = require('node:assert/strict');
const test = require('node:test');

const {
  QUIVER_COLORS,
  resolveTheme,
  shouldUseColor,
  shouldUseUnicode,
} = require('../../src/create-quiver/lib/cli/theme');

test('Quiver theme exposes the approved brand color tokens', () => {
  assert.deepEqual(QUIVER_COLORS, {
    sky: '#86C8F2',
    blue: '#6BADEB',
    periwinkle: '#7F9EE8',
    violet: '#9B82E6',
    magenta: '#D56AB0',
  });
});

test('color output is disabled for machine and unsupported modes', () => {
  assert.equal(shouldUseColor({ json: true }, {}, { stdout: true }), false);
  assert.equal(shouldUseColor({ noColor: true }, {}, { stdout: true }), false);
  assert.equal(shouldUseColor({}, { NO_COLOR: '1' }, { stdout: true }), false);
  assert.equal(shouldUseColor({}, { FORCE_COLOR: '0' }, { stdout: true }), false);
  assert.equal(shouldUseColor({}, { CI: 'true' }, { stdout: true }), false);
  assert.equal(shouldUseColor({}, { TERM: 'dumb' }, { stdout: true }), false);
  assert.equal(shouldUseColor({}, {}, { stdout: false }), false);
});

test('color output uses ANSI truecolor only for human TTY mode', () => {
  const theme = resolveTheme({}, {}, { stdout: true });
  const output = theme.status('planner', 'Planner mode');

  assert.match(output, /\u001b\[38;2;155;130;230mPlanner mode\u001b\[0m/);
});

test('theme falls back to plain ASCII when unicode is unavailable', () => {
  assert.equal(shouldUseUnicode({}, { LANG: 'C' }, { stdout: true }), false);
  assert.equal(shouldUseUnicode({}, { TERM: 'dumb' }, { stdout: true }), false);
  assert.equal(shouldUseUnicode({}, {}, { stdout: false }), false);

  const theme = resolveTheme({}, { LANG: 'C' }, { stdout: true });
  assert.equal(theme.symbols.success, 'OK');
  assert.equal(theme.symbols.error, 'ERR');
  assert.equal(theme.symbols.section, '*');
});

test('theme keeps text readable when color is disabled', () => {
  const theme = resolveTheme({ noColor: true }, {}, { stdout: true });

  assert.equal(theme.status('risk', 'Blocked'), 'Blocked');
  assert.equal(theme.colorize('Review', 'magenta'), 'Review');
});
