const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const packageJson = require('../../package.json');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function runCli(args) {
  return spawnSync(process.execPath, [BIN_PATH, ...args], {
    cwd: path.resolve(__dirname, '../..'),
    encoding: 'utf8',
    env: { ...process.env, QUIVER_LANG: 'en' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

test('help documents canonical slice and handoff namespaces plus legacy aliases', () => {
  const result = runCli(['--help', '--no-color']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /slice start\|check\|pr\|scope\|cleanup\|refresh-active\s+Canonical namespace/);
  assert.match(result.stdout, /handoff check\|new\s+Canonical namespace/);
  assert.match(result.stdout, /start-slice\s+Start work on one slice/);
  assert.match(result.stdout, /check-handoff\s+Validate a transfer handoff/);
});

test('root package exposes PowerShell-safe quiver workflow scripts and preserves Bash legacy scripts', () => {
  const scripts = packageJson.scripts || {};

  assert.equal(scripts['quiver:start-slice'], 'node bin/create-quiver.js slice start');
  assert.equal(scripts['quiver:check-slice'], 'node bin/create-quiver.js slice check');
  assert.equal(scripts['quiver:check-pr'], 'node bin/create-quiver.js slice pr');
  assert.equal(scripts['quiver:check-scope'], 'node bin/create-quiver.js slice scope');
  assert.equal(scripts['quiver:cleanup-slice'], 'node bin/create-quiver.js slice cleanup');
  assert.equal(scripts['quiver:refresh-active-slices'], 'node bin/create-quiver.js slice refresh-active');
  assert.equal(scripts['quiver:check-handoff'], 'node bin/create-quiver.js handoff check');
  assert.equal(scripts['quiver:new-handoff'], 'node bin/create-quiver.js handoff new');

  for (const scriptName of [
    'quiver:start-slice',
    'quiver:check-slice',
    'quiver:check-pr',
    'quiver:check-scope',
    'quiver:cleanup-slice',
    'quiver:refresh-active-slices',
    'quiver:check-handoff',
    'quiver:new-handoff',
  ]) {
    assert.doesNotMatch(scripts[scriptName], /\bbash\b/, `${scriptName} must not require Bash`);
  }

  assert.match(scripts['start:slice'], /^bash /);
  assert.match(scripts['check:slice'], /^bash /);
  assert.match(scripts['cleanup:slice'], /^bash /);
});
