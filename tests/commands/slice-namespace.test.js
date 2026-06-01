const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function runRaw(args, options = {}) {
  return spawnSync(process.execPath, [BIN_PATH, '--lang', 'en', ...args], {
    cwd: options.cwd || path.resolve(__dirname, '../..'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function withoutDeprecation(stderr) {
  return String(stderr || '')
    .split('\n')
    .filter((line) => !line.includes('deprecated command:'))
    .join('\n')
    .trim();
}

function makeGitRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-slice-namespace-'));
  execFileSync('git', ['init'], { cwd: root, stdio: ['ignore', 'ignore', 'ignore'] });
  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

test('slice namespace routes missing-path commands through the legacy implementations', () => {
  const cases = [
    { canonical: ['slice', 'start', 'missing.json'], legacy: ['start-slice', 'missing.json'], legacyName: 'start-slice' },
    { canonical: ['slice', 'check', 'missing.json', '--local'], legacy: ['check-slice', 'missing.json', '--local'], legacyName: 'check-slice' },
    { canonical: ['slice', 'check-pr', 'missing.json'], legacy: ['check-pr', 'missing.json'], legacyName: 'check-pr' },
    { canonical: ['slice', 'scope', 'missing.json'], legacy: ['check-scope', 'missing.json'], legacyName: 'check-scope' },
    { canonical: ['slice', 'cleanup', 'missing.json'], legacy: ['cleanup-slice', 'missing.json'], legacyName: 'cleanup-slice' },
  ];

  for (const item of cases) {
    const canonical = runRaw(item.canonical);
    const legacy = runRaw(item.legacy);

    assert.notEqual(canonical.status, 0, item.canonical.join(' '));
    assert.notEqual(legacy.status, 0, item.legacy.join(' '));
    assert.equal(canonical.stdout, '');
    assert.equal(legacy.stdout, '');
    assert.equal(withoutDeprecation(legacy.stderr), canonical.stderr.trim());
    assert.match(legacy.stderr, new RegExp(`deprecated command: ${item.legacyName}`));
    assert.doesNotMatch(canonical.stderr, /deprecated command:/);
  }
});

test('slice refresh matches refresh-active-slices and keeps legacy warning on stderr', () => {
  const canonicalRepo = makeGitRepo();
  const legacyRepo = makeGitRepo();

  try {
    const canonical = runRaw(['slice', 'refresh'], { cwd: canonicalRepo.root });
    const legacy = runRaw(['refresh-active-slices'], { cwd: legacyRepo.root });

    assert.equal(canonical.status, 0);
    assert.equal(legacy.status, 0);
    assert.match(canonical.stdout, /Active slices refreshed: /);
    assert.match(legacy.stdout, /Active slices refreshed: /);
    assert.doesNotMatch(canonical.stderr, /deprecated command:/);
    assert.match(legacy.stderr, /deprecated command: refresh-active-slices/);
    assert.equal(fs.existsSync(path.join(canonicalRepo.root, 'ACTIVE_SLICES.md')), true);
    assert.equal(fs.existsSync(path.join(legacyRepo.root, 'ACTIVE_SLICES.md')), true);
  } finally {
    canonicalRepo.cleanup();
    legacyRepo.cleanup();
  }
});

test('legacy slice aliases do not emit deprecation warnings when json output is requested', () => {
  const result = runRaw(['check-slice', 'missing.json', '--local', '--json']);

  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, '');
  assert.doesNotMatch(result.stderr, /deprecated command:/);
  assert.match(result.stderr, /no existe el slice|slice .*missing\.json/);
});

test('slice namespace validates subcommands explicitly', () => {
  const missing = runRaw(['slice']);
  const unsupported = runRaw(['slice', 'unknown']);

  assert.notEqual(missing.status, 0);
  assert.notEqual(unsupported.status, 0);
  assert.match(missing.stderr, /missing slice subcommand/);
  assert.match(unsupported.stderr, /unsupported slice subcommand: unknown/);
});
