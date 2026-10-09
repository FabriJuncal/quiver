const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');
const { writeCliFixture, cliFixtureEnv } = require('../helpers/cli-fixtures');

test('CLI fixtures preserve literal arguments, status and stderr without a shell', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver cli fixture '));
  try {
    writeCliFixture(dir, 'gh', "console.log(JSON.stringify(process.argv.slice(2))); console.error('fixture error'); process.exit(7);");
    const script = `const r = require('node:child_process').spawnSync('gh', ['space value', '& echo unsafe', 'a"b'], { encoding: 'utf8', shell: false }); console.log(JSON.stringify({ status: r.status, stdout: r.stdout, stderr: r.stderr }));`;
    const result = JSON.parse(execFileSync(process.execPath, ['-e', script], {
      env: { ...process.env, ...cliFixtureEnv(dir) }, encoding: 'utf8',
    }));
    assert.equal(result.status, 7);
    assert.deepEqual(JSON.parse(result.stdout), ['space value', '& echo unsafe', 'a"b']);
    assert.equal(result.stderr.trim(), 'fixture error');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a missing CLI fixture fails closed without invoking a real provider', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-cli-missing-'));
  try {
    const script = "const r = require('node:child_process').spawnSync('codex', ['--version']); console.log(JSON.stringify({ status: r.status, code: r.error.code }));";
    const result = JSON.parse(execFileSync(process.execPath, ['-e', script], {
      env: { ...process.env, ...cliFixtureEnv(dir) }, encoding: 'utf8',
    }));
    assert.deepEqual(result, { status: null, code: 'ENOENT' });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
