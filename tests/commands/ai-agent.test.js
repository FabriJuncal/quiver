const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-agent-'));
  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function runCli(repoRoot, args) {
  return execFileSync(process.execPath, [BIN_PATH, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

test('ai agent set, list, and show persist reusable profile settings', () => {
  const repo = makeRepo();

  try {
    const saved = runCli(repo.root, ['ai', 'agent', 'set', 'planner', '--provider', 'codex', '--model', 'gpt-5.5-xhigh', '--label', 'planner']);
    assert.match(saved, /AI agent profile saved/);
    assert.match(saved, /Role: planner/);
    assert.match(saved, /Provider: codex/);
    assert.match(saved, /Model: gpt-5\.5-xhigh/);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver', 'agents', 'profiles.json')), true);

    const list = runCli(repo.root, ['ai', 'agent', 'list']);
    assert.match(list, /planner: provider=codex model=gpt-5\.5-xhigh label=planner/);
    assert.match(list, /executor: not configured/);
    assert.match(list, /doctor: not configured/);
    assert.doesNotMatch(list, /researcher/);

    const show = runCli(repo.root, ['ai', 'agent', 'show', 'planner']);
    assert.match(show, /Role: planner/);
    assert.match(show, /Provider: codex/);
  } finally {
    repo.cleanup();
  }
});

test('ai agent set --dry-run previews the profile without writing state', () => {
  const repo = makeRepo();

  try {
    const output = runCli(repo.root, ['ai', 'agent', 'set', 'planner', '--provider', 'codex', '--model', 'gpt-5.5-xhigh', '--label', 'planner', '--dry-run']);

    assert.match(output, /AI agent profile dry-run/);
    assert.match(output, /Writes: none/);
    assert.match(output, /Would create: \.quiver\/agents\/profiles\.json/);
    assert.match(output, /Role: planner/);
    assert.match(output, /Provider: codex/);
    assert.match(output, /Model: gpt-5\.5-xhigh/);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver', 'agents', 'profiles.json')), false);
  } finally {
    repo.cleanup();
  }
});

test('ai agent supports doctor profiles and rejects researcher profiles', () => {
  const repo = makeRepo();

  try {
    const saved = runCli(repo.root, ['ai', 'agent', 'set', 'doctor', '--provider', 'gemini', '--model', 'diagnostic']);
    assert.match(saved, /Role: doctor/);
    assert.match(saved, /Provider: gemini/);

    const show = runCli(repo.root, ['ai', 'agent', 'show', 'doctor']);
    assert.match(show, /Model: diagnostic/);

    assert.throws(
      () => runCli(repo.root, ['ai', 'agent', 'set', 'researcher', '--provider', 'codex']),
      /unsupported agent profile role 'researcher'.*planner, executor, reviewer, doctor/,
    );
  } finally {
    repo.cleanup();
  }
});

test('ai agent rejects unsupported providers with guidance', () => {
  const repo = makeRepo();

  try {
    assert.throws(
      () => runCli(repo.root, ['ai', 'agent', 'set', 'planner', '--provider', 'openai', '--model', 'gpt']),
      /Unsupported provider 'openai'. Supported providers: codex, claude, gemini\./,
    );
  } finally {
    repo.cleanup();
  }
});

test('ai agent show reports missing profile with actionable guidance', () => {
  const repo = makeRepo();

  try {
    assert.throws(
      () => runCli(repo.root, ['ai', 'agent', 'show', 'executor']),
      (error) => error.stderr.includes("agent profile 'executor' is not configured")
        && error.stderr.includes('Impact:')
        && error.stderr.includes('Fix:')
        && error.stderr.includes('Next command: npx create-quiver ai agent set executor --provider <provider> --model <label>'),
    );
  } finally {
    repo.cleanup();
  }
});

test('ai onboard uses planner profile provider when provider is not explicit', () => {
  const repo = makeRepo();

  try {
    runCli(repo.root, ['ai', 'agent', 'set', 'planner', '--provider', 'claude', '--model', 'opus']);
    const output = runCli(repo.root, ['ai', 'onboard', '--dry-run']);

    assert.match(output, /Provider: claude/);
    assert.match(output, /Role: planner/);
  } finally {
    repo.cleanup();
  }
});
