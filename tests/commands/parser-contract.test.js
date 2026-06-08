const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const {
  SUPPORTED_AI_COMMANDS,
  SUPPORTED_COMMAND_MODES,
  SUPPORTED_CONFIG_LANGUAGE_COMMANDS,
  SUPPORTED_CONFIG_SECTIONS,
  SUPPORTED_DEMO_COMMANDS,
  SUPPORTED_SPEC_COMMANDS,
} = require('../../src/create-quiver/lib/cli/command-registry');
const { parseCliArgs } = require('../../src/create-quiver/lib/cli/parser');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');
const REPO_ROOT = path.resolve(__dirname, '../..');

function runCli(args) {
  return spawnSync(process.execPath, [BIN_PATH, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

test('parser adapter requires and delegates to legacy parser', () => {
  assert.throws(
    () => parseCliArgs(['version']),
    /parseCliArgs requires a legacyParseArgs adapter/,
  );

  const parsed = parseCliArgs(['version', '--json'], {
    language: 'es',
    legacyParseArgs(argv, options) {
      return {
        argv,
        language: options.language,
      };
    },
  });

  assert.deepEqual(parsed, {
    argv: ['version', '--json'],
    language: 'es',
  });
});

test('command registry reflects supported command surface with explicit changelog wrapper', () => {
  for (const command of ['init', 'version', 'changelog', 'slice', 'handoff', 'evidence', 'ai']) {
    assert.equal(SUPPORTED_COMMAND_MODES.has(command), true, command);
  }

  assert.equal(SUPPORTED_COMMAND_MODES.has('status'), false, 'status');

  assert.equal(SUPPORTED_AI_COMMANDS.has('status'), true);
  assert.equal(SUPPORTED_AI_COMMANDS.has('run'), true);
  assert.equal(SUPPORTED_SPEC_COMMANDS.has('status'), true);
  assert.equal(SUPPORTED_DEMO_COMMANDS.has('create'), true);
  assert.equal(SUPPORTED_CONFIG_SECTIONS.has('language'), true);
  assert.equal(SUPPORTED_CONFIG_LANGUAGE_COMMANDS.has('show'), true);
  assert.equal(SUPPORTED_CONFIG_LANGUAGE_COMMANDS.has('set'), true);
});

test('baseline parser contracts stay stable for high-risk entry points', () => {
  const help = runCli(['help']);
  assert.equal(help.status, 0);
  assert.match(help.stdout, /Usage:/);
  assert.match(help.stdout, /slice start\|check\|pr\|scope\|cleanup\|refresh-active/);
  assert.match(help.stdout, /handoff check\|new/);

  const versionJson = runCli(['version', '--json']);
  assert.equal(versionJson.status, 0);
  assert.equal(JSON.parse(versionJson.stdout).version_schema_version, 1);

  const unknown = runCli(['__unknown__']);
  assert.equal(unknown.status, 1);
  assert.equal(unknown.stdout, '');
  assert.match(unknown.stderr, /unsupported command: __unknown__/);

  const status = runCli(['status', '--json']);
  assert.equal(status.status, 1);
  assert.match(status.stderr, /unsupported command: status/);

  const changelog = runCli(['changelog']);
  assert.equal(changelog.status, 0);
  assert.equal(changelog.stderr, '');
  assert.match(changelog.stdout, /Quiver changelog/);

  const changelogJson = runCli(['changelog', '--json']);
  assert.equal(changelogJson.status, 0);
  assert.equal(changelogJson.stderr, '');
  const changelogPayload = JSON.parse(changelogJson.stdout);
  assert.equal(changelogPayload.schema_version, 1);
  assert.equal(typeof changelogPayload.source, 'string');
  assert.equal(typeof changelogPayload.missing, 'boolean');
  assert.equal(Array.isArray(changelogPayload.entries), true);
});
