const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const test = require('node:test');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');
const { resolveInteractiveAgentSetOptions } = require('../../src/create-quiver/commands/ai');

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

function runCliResult(repoRoot, args) {
  return spawnSync(process.execPath, [BIN_PATH, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function writeProfiles(repoRoot, state) {
  const filePath = path.join(repoRoot, '.quiver', 'agents', 'profiles.json');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(state, null, 2)}\n`);
  return filePath;
}

test('ai agent set, list, and show persist reusable profile settings', () => {
  const repo = makeRepo();

  try {
    const saved = runCli(repo.root, ['ai', 'agent', 'set', 'planner', '--provider', 'codex', '--model', 'gpt-5.5-xhigh', '--label', 'planner']);
    assert.match(saved, /AI agent profile saved/);
    assert.match(saved, /ID: planner/);
    assert.match(saved, /Role: planner/);
    assert.match(saved, /Provider: codex/);
    assert.match(saved, /Model: gpt-5\.5-xhigh/);
    assert.match(saved, /Display name: gpt-5\.5-xhigh/);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver', 'agents', 'profiles.json')), true);

    const list = runCli(repo.root, ['ai', 'agent', 'list']);
    assert.match(list, /planner: provider=codex model=gpt-5\.5-xhigh label=planner/);
    assert.match(list, /displayName=gpt-5\.5-xhigh/);
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

test('ai agent supports named planner profiles and default selection', () => {
  const repo = makeRepo();

  try {
    const gpt = runCli(repo.root, ['ai', 'agent', 'set', 'planner', '--id', 'gpt-55', '--provider', 'codex', '--model', 'gpt-5.5', '--display-name', 'GPT 5.5', '--default']);
    assert.match(gpt, /ID: gpt-55/);
    assert.match(gpt, /Display name: GPT 5\.5/);
    assert.match(gpt, /Default: yes/);

    const opus = runCli(repo.root, ['ai', 'agent', 'set', 'planner', '--id', 'opus-47', '--provider', 'claude', '--model', 'opus-4.7', '--display-name', 'OPUS 4.7']);
    assert.match(opus, /ID: opus-47/);
    assert.match(opus, /Default: no/);

    const list = runCli(repo.root, ['ai', 'agent', 'list']);
    assert.match(list, /planner: provider=codex model=gpt-5\.5 displayName=GPT 5\.5 options=2/);

    const show = runCli(repo.root, ['ai', 'agent', 'show', 'planner', '--id', 'opus-47']);
    assert.match(show, /Provider: claude/);
    assert.match(show, /Display name: OPUS 4\.7/);
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
        && error.stderr.includes('Next command: npx create-quiver ai agent set executor --provider <provider> --model <model-id>'),
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
    assert.match(output, /Model: opus/);
    assert.match(output, /Command: claude -p --model opus/);
  } finally {
    repo.cleanup();
  }
});

test('ai onboard can select a named planner profile for provider and model', () => {
  const repo = makeRepo();

  try {
    runCli(repo.root, ['ai', 'agent', 'set', 'planner', '--id', 'gpt-55', '--provider', 'codex', '--model', 'gpt-5.5', '--default']);
    runCli(repo.root, ['ai', 'agent', 'set', 'planner', '--id', 'opus-47', '--provider', 'claude', '--model', 'opus-4.7', '--display-name', 'OPUS 4.7']);
    const output = runCli(repo.root, ['ai', 'onboard', '--dry-run', '--planner', 'opus-47']);

    assert.match(output, /Provider: claude/);
    assert.match(output, /Model: claude-opus-4-7/);
    assert.match(output, /Command: claude -p --model claude-opus-4-7/);
  } finally {
    repo.cleanup();
  }
});

test('ai agent set requires provider and model when prompts are unavailable', () => {
  const repo = makeRepo();

  try {
    assert.throws(
      () => runCli(repo.root, ['ai', 'agent', 'set', 'planner', '--provider', 'codex']),
      (error) => error.stderr.includes('requires --provider and --model when prompts are not available')
        && error.stderr.includes('Next command: npx create-quiver ai agent set planner --provider codex --model gpt-5.5'),
    );
  } finally {
    repo.cleanup();
  }
});

test('ai agent interactive set resolves provider and catalog model selections', async () => {
  const repo = makeRepo();

  try {
    const resolved = await resolveInteractiveAgentSetOptions(repo.root, {
      role: 'planner',
      interactive: true,
      stdinIsTTY: true,
      stdoutIsTTY: true,
      preflightProvider: () => ({ ok: true }),
      promptSelect: async (message) => {
        if (message.includes('provider')) return 'codex';
        if (message.includes('modelo')) return 'gpt-5.5';
        throw new Error(`unexpected prompt: ${message}`);
      },
    });

    assert.equal(resolved.provider, 'codex');
    assert.equal(resolved.model, 'gpt-5.5');
    assert.equal(resolved.displayName, 'GPT 5.5');
  } finally {
    repo.cleanup();
  }
});

test('ai agent interactive set can create an additional named profile', async () => {
  const repo = makeRepo();

  try {
    runCli(repo.root, ['ai', 'agent', 'set', 'planner', '--provider', 'codex', '--model', 'gpt-5.5', '--default']);

    const resolved = await resolveInteractiveAgentSetOptions(repo.root, {
      role: 'planner',
      interactive: true,
      stdinIsTTY: true,
      stdoutIsTTY: true,
      preflightProvider: () => ({ ok: true }),
      write: () => {},
      promptSelect: async (message) => {
        if (message.includes('Ya existe')) return 'create-new';
        if (message.includes('provider')) return 'claude';
        if (message.includes('modelo')) return 'claude-opus-4-7';
        throw new Error(`unexpected prompt: ${message}`);
      },
      promptText: async () => 'opus-47',
    });

    assert.equal(resolved.id, 'opus-47');
    assert.equal(resolved.provider, 'claude');
    assert.equal(resolved.model, 'claude-opus-4-7');
    assert.equal(resolved.displayName, 'Claude Opus 4.7');
    assert.equal(resolved.defaultProfile, false);
  } finally {
    repo.cleanup();
  }
});

test('ai agent interactive set supports custom model id and display name', async () => {
  const repo = makeRepo();
  let textPromptCount = 0;

  try {
    const resolved = await resolveInteractiveAgentSetOptions(repo.root, {
      role: 'executor',
      interactive: true,
      stdinIsTTY: true,
      stdoutIsTTY: true,
      preflightProvider: () => ({ ok: true }),
      promptSelect: async (message) => {
        if (message.includes('provider')) return 'codex';
        if (message.includes('modelo')) return 'custom';
        throw new Error(`unexpected prompt: ${message}`);
      },
      promptText: async () => {
        textPromptCount += 1;
        return textPromptCount === 1 ? 'gpt-custom-executor' : 'Custom Executor';
      },
    });

    assert.equal(resolved.provider, 'codex');
    assert.equal(resolved.model, 'gpt-custom-executor');
    assert.equal(resolved.displayName, 'Custom Executor');
  } finally {
    repo.cleanup();
  }
});

test('ai agent doctor reports profile errors and warnings as JSON', () => {
  const repo = makeRepo();

  try {
    writeProfiles(repo.root, {
      version: 2,
      profiles: {},
      profile_sets: {
        planners: [
          {
            id: 'default',
            role: 'planner',
            provider: 'codex',
            model: 'GPT 5.5',
            default: true,
          },
          {
            id: 'custom',
            role: 'planner',
            provider: 'codex',
            model: 'local-planner',
            displayName: 'Local Planner',
          },
        ],
        executors: [
          {
            id: 'bad-provider',
            role: 'executor',
            provider: 'openai',
            model: 'gpt-5.5',
            default: true,
          },
        ],
      },
    });

    const result = runCliResult(repo.root, ['ai', 'agent', 'doctor', '--json']);
    assert.equal(result.status, 1);
    assert.equal(result.stderr, '');
    const report = JSON.parse(result.stdout);

    assert.equal(report.summary.profiles, 3);
    assert.equal(report.summary.errors, 1);
    assert.ok(report.summary.warnings >= 2);
    assert.ok(report.findings.some((finding) => finding.code === 'unsupported-provider' && finding.severity === 'error'));
    assert.ok(report.findings.some((finding) => finding.code === 'display-model-alias' && finding.severity === 'warning'));
    assert.ok(report.findings.some((finding) => finding.code === 'custom-model-unvalidated' && finding.severity === 'warning'));
  } finally {
    repo.cleanup();
  }
});

test('ai agent doctor human output uses checks and suggested fixes sections', () => {
  const repo = makeRepo();

  try {
    runCli(repo.root, ['ai', 'agent', 'set', 'planner', '--provider', 'codex', '--model', 'gpt-5.5']);
    const output = runCli(repo.root, ['ai', 'agent', 'doctor']);

    assert.match(output, /Quiver Agent Doctor/);
    assert.match(output, /Checks/);
    assert.match(output, /planner\/gpt-5-5: provider=codex model=gpt-5\.5 default/);
    assert.match(output, /Suggested fixes/);
  } finally {
    repo.cleanup();
  }
});

test('ai agent repair --dry-run previews alias normalization without writing', () => {
  const repo = makeRepo();

  try {
    const filePath = writeProfiles(repo.root, {
      version: 2,
      profiles: {},
      profile_sets: {
        planners: [
          {
            id: 'legacy',
            role: 'planner',
            provider: 'codex',
            model: 'GPT 5.5',
            default: true,
          },
        ],
      },
    });
    const before = fs.readFileSync(filePath, 'utf8');
    const output = runCli(repo.root, ['ai', 'agent', 'repair', '--dry-run']);
    const after = fs.readFileSync(filePath, 'utf8');

    assert.match(output, /AI agent profile repair dry-run/);
    assert.match(output, /Writes: none/);
    assert.match(output, /Before: model=GPT 5\.5 displayName=\(not set\)/);
    assert.match(output, /After: model=gpt-5\.5 displayName=GPT 5\.5/);
    assert.equal(after, before);
  } finally {
    repo.cleanup();
  }
});

test('ai agent repair without dry-run refuses to write', () => {
  const repo = makeRepo();

  try {
    assert.throws(
      () => runCli(repo.root, ['ai', 'agent', 'repair']),
      /ai agent repair only supports --dry-run/,
    );
  } finally {
    repo.cleanup();
  }
});
