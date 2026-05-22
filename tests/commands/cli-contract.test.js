const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const packageJson = require('../../package.json');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function runCli(args) {
  return execFileSync(process.execPath, [BIN_PATH, ...args], {
    cwd: path.resolve(__dirname, '../..'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

test('top-level --version prints the installed package version', () => {
  assert.equal(runCli(['--version']).trim(), packageJson.version);
});

test('top-level -V prints the installed package version', () => {
  assert.equal(runCli(['-V']).trim(), packageJson.version);
});

test('ai approve --version remains a draft-version option', () => {
  assert.throws(
    () => runCli(['ai', 'approve', '--phase', 'technical-plan', '--version']),
    /create-quiver: missing value for --version/,
  );
});

test('unsupported commands still fail with actionable guidance', () => {
  assert.throws(
    () => runCli(['future-command']),
    (error) => {
      const output = `${error.stdout || ''}${error.stderr || ''}`;
      assert.match(output, /create-quiver: unsupported command: future-command/);
      assert.match(output, /Run: npx create-quiver --help/);
      assert.match(output, /npx create-quiver init --name "future-command"/);
      assert.match(output, /update create-quiver/);
      return true;
    },
  );
});
