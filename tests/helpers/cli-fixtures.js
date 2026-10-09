const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

// Preloaded only in a fixture CLI subprocess. Keep the real CLI/router and real
// subprocess I/O, but run test-owned JavaScript instead of shell-only fake bins.
// Missing fixtures fail closed, never falling through to an installed provider.
const fixtureNames = new Set(['gh', 'codex']);
if (process.env.QUIVER_TEST_CLI_FIXTURES) {
  const spawnSync = cp.spawnSync;
  cp.spawnSync = function fixtureSpawn(command, args, options) {
    if (!fixtureNames.has(command)) return spawnSync(command, args, options);
    const script = path.join(process.env.QUIVER_TEST_CLI_FIXTURES, `${command}.cjs`);
    if (!fs.existsSync(script)) {
      const error = Object.assign(new Error(`Missing test fixture: ${command}`), { code: 'ENOENT' });
      return { error, status: null, signal: null, stdout: '', stderr: '', output: [null, '', ''] };
    }
    return spawnSync(process.execPath, [script, ...args], options);
  };
}

function writeCliFixture(directory, command, source) {
  if (!fixtureNames.has(command)) throw new Error(`Unsupported fixture: ${command}`);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, `${command}.cjs`), source);
}

function cliFixtureEnv(directory) {
  const preload = JSON.stringify(__filename.split(path.sep).join('/'));
  return {
    QUIVER_TEST_CLI_FIXTURES: directory,
    NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --require ${preload}`.trim(),
  };
}

module.exports = { writeCliFixture, cliFixtureEnv };
