const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const { runPrepareContext } = require('../../src/create-quiver/commands/ai');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function makeRepo(structure = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-prepare-context-'));
  for (const [relativePath, contents] of Object.entries(structure)) {
    writeFile(path.join(root, relativePath), contents);
  }
  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function execPrepareContext(repoRoot, args = []) {
  return execFileSync(process.execPath, [BIN_PATH, 'ai', 'prepare-context', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function validProposal(overrides = {}) {
  return JSON.stringify({
    schema_version: 1,
    kind: 'quiver-context-proposal',
    summary: 'Planner proposal',
    assumptions: ['Planner saw enough docs to prepare context.'],
    risks: ['Architecture still needs confirmation.'],
    docs: [
      {
        path: 'docs/AI_CONTEXT.md',
        action: 'update',
        reason: 'Refresh AI context from planner output.',
        content: '# AI Context\n\nPlanner-generated context.\n',
      },
      {
        path: 'docs/STATUS.md',
        action: 'update',
        reason: 'Capture current status from planner output.',
        content: '# Status\n\nPlanner-generated status.\n',
      },
    ],
    omitted_paths: ['src/'],
    next_steps: ['Review docs before implementation.'],
    ...overrides,
  }, null, 2);
}

function providerResult(stdout, overrides = {}) {
  return {
    ok: true,
    dryRun: false,
    provider: 'codex',
    command: 'codex',
    args: ['exec'],
    cwd: '',
    timeoutMs: 1000,
    promptTransport: { mode: 'stdin' },
    exitCode: 0,
    stdout,
    stderr: '',
    error: null,
    preflight: { ok: true },
    ...overrides,
  };
}

test('ai prepare-context --with-planner --dry-run reports planner invocation without provider execution or writes', () => {
  const repo = makeRepo({
    'README.md': '# Demo\n',
    'package.json': JSON.stringify({ name: 'planner-demo' }, null, 2),
    'docs/PROJECT_MAP.md': '# Project Map\n',
  });

  try {
    const output = execPrepareContext(repo.root, ['--with-planner', '--dry-run', '--provider', 'codex']);

    assert.match(output, /AI prepare-context planner dry-run/);
    assert.match(output, /Planner: enabled/);
    assert.match(output, /Provider: codex/);
    assert.match(output, /Provider execution: skipped/);
    assert.match(output, /Writes: none/);
    assert.match(output, /Candidate docs: docs\/INDEX\.md, docs\/PROJECT_MAP\.md, docs\/AI_CONTEXT\.md/);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver')), false);
  } finally {
    repo.cleanup();
  }
});

test('ai prepare-context --with-planner --dry-run normalizes CLI display model aliases', () => {
  const repo = makeRepo({
    'README.md': '# Demo\n',
    'package.json': JSON.stringify({ name: 'planner-demo' }, null, 2),
  });

  try {
    const output = execPrepareContext(repo.root, ['--with-planner', '--dry-run', '--provider', 'codex', '--model', 'GPT 5.5']);

    assert.match(output, /Command: codex exec --model gpt-5\.5/);
    assert.match(output, /Model: gpt-5\.5/);
    assert.match(output, /model alias normalized from GPT 5\.5/);
  } finally {
    repo.cleanup();
  }
});

test('ai prepare-context blocks legacy profile display aliases before provider execution', async () => {
  const repo = makeRepo({
    'README.md': '# Demo\n',
    'package.json': JSON.stringify({ name: 'planner-demo' }, null, 2),
    '.quiver/agents/profiles.json': JSON.stringify({
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
    }, null, 2),
  });
  let providerCalled = false;

  try {
    await assert.rejects(
      runPrepareContext(repo.root, {
        withPlanner: true,
        runProviderFn: async () => {
          providerCalled = true;
          return providerResult(validProposal(), { cwd: repo.root });
        },
      }),
      /ai prepare-context failed: Model 'GPT 5\.5' is a display alias[\s\S]*gpt-5\.5/,
    );
    assert.equal(providerCalled, false);
  } finally {
    repo.cleanup();
  }
});

test('ai prepare-context --with-planner --print-prompt prints exact prompt without provider auth or writes', () => {
  const repo = makeRepo({
    'README.md': '# Demo\n',
    'package.json': JSON.stringify({ name: 'planner-prompt-demo' }, null, 2),
  });

  try {
    const output = execPrepareContext(repo.root, ['--with-planner', '--print-prompt', '--provider', 'gemini']);

    assert.match(output, /AI prepare-context prompt-only/);
    assert.match(output, /Provider: gemini/);
    assert.match(output, /Prompt source: quiver prepare-context planner proposal contract/);
    assert.match(output, /--- PROMPT START ---/);
    assert.match(output, /Task: planner-assisted Quiver context preparation/);
    assert.match(output, /Required JSON output shape:/);
    assert.match(output, /"kind": "quiver-context-proposal"/);
    assert.match(output, /--- PROMPT END ---/);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver')), false);
  } finally {
    repo.cleanup();
  }
});

test('planner prepare-context shows human TTY progress with selected profile name', async () => {
  const repo = makeRepo({
    'README.md': '# Demo\n',
    'package.json': JSON.stringify({ name: 'planner-progress-demo' }, null, 2),
  });
  const events = [];

  try {
    await runPrepareContext(repo.root, {
      withPlanner: true,
      provider: 'codex',
      providerExplicit: true,
      stdoutIsTTY: true,
      stdinIsTTY: true,
      stderrIsTTY: true,
      noColor: true,
      env: { LANG: 'en_US.UTF-8' },
      write: (text) => events.push(['write', text]),
      prompts: {
        spinner() {
          return {
            start(message) {
              events.push(['start', message]);
            },
            stop(message, code) {
              events.push(['stop', message, code]);
            },
          };
        },
      },
      runProviderFn: async () => providerResult(validProposal(), { cwd: repo.root }),
    });

    assert.deepEqual(events, [
      ['write', '◇ Running onboarding with codex\n'],
      ['write', '✓ Reading base docs\n'],
      ['write', '✓ Detecting structure\n'],
      ['write', '✓ Preparing prompt\n'],
      ['start', 'Running agent...'],
      ['stop', 'Agent finished', undefined],
    ]);
  } finally {
    repo.cleanup();
  }
});

test('planner prepare-context stops progress spinner on provider failure', async () => {
  const repo = makeRepo({
    'README.md': '# Demo\n',
  });
  const events = [];

  try {
    await assert.rejects(
      runPrepareContext(repo.root, {
        withPlanner: true,
        provider: 'codex',
        providerExplicit: true,
        stdoutIsTTY: true,
        stdinIsTTY: true,
        stderrIsTTY: true,
        noColor: true,
        env: { LANG: 'en_US.UTF-8' },
        write: (text) => events.push(['write', text]),
        prompts: {
          spinner() {
            return {
              start(message) {
                events.push(['start', message]);
              },
              stop(message, code) {
                events.push(['stop', message, code]);
              },
            };
          },
        },
        runProviderFn: async () => ({
          ok: false,
          dryRun: false,
          provider: 'codex',
          command: 'codex',
          args: ['exec'],
          cwd: repo.root,
          timeoutMs: 0,
          promptTransport: { mode: 'stdin' },
          exitCode: null,
          stdout: '',
          stderr: '',
          error: { code: 'MISSING_PROVIDER_CLI', message: 'missing codex cli' },
          preflight: null,
        }),
      }),
      /ai prepare-context failed: missing codex cli/,
    );

    assert.deepEqual(events.slice(0, 6), [
      ['write', '◇ Running onboarding with codex\n'],
      ['write', '✓ Reading base docs\n'],
      ['write', '✓ Detecting structure\n'],
      ['write', '✓ Preparing prompt\n'],
      ['start', 'Running agent...'],
      ['stop', 'Agent failed', 1],
    ]);
  } finally {
    repo.cleanup();
  }
});

test('planner prepare-context writes validated docs-only proposal and snapshots before writes', async () => {
  const repo = makeRepo({
    'README.md': '# Demo\n',
    'package.json': JSON.stringify({ name: 'planner-write-demo' }, null, 2),
    'src/app.js': 'module.exports = 1;\n',
  });

  try {
    let capturedPrompt = '';
    const beforeProductCode = fs.readFileSync(path.join(repo.root, 'src/app.js'), 'utf8');
    const result = await runPrepareContext(repo.root, {
      withPlanner: true,
      provider: 'codex',
      providerExplicit: true,
      runProviderFn: async (provider, options) => {
        capturedPrompt = options.prompt;
        assert.equal(provider, 'codex');
        return providerResult(validProposal(), { cwd: repo.root });
      },
    });

    assert.equal(result.mode, 'planner');
    assert.ok(capturedPrompt.includes('Only propose writes to the allowed docs paths listed below.'));
    assert.deepEqual(result.writtenDocs, ['docs/AI_CONTEXT.md', 'docs/STATUS.md']);
    assert.ok(result.snapshot);
    assert.equal(fs.readFileSync(path.join(repo.root, 'src/app.js'), 'utf8'), beforeProductCode);
    assert.match(fs.readFileSync(path.join(repo.root, 'docs/AI_CONTEXT.md'), 'utf8'), /Planner-generated context/);
    assert.match(fs.readFileSync(path.join(repo.root, 'docs/STATUS.md'), 'utf8'), /Planner-generated status/);
    assert.equal(fs.existsSync(path.join(repo.root, result.snapshot.manifestPath)), true);
  } finally {
    repo.cleanup();
  }
});

test('provider failure during planner prepare-context writes no docs', async () => {
  const repo = makeRepo({
    'README.md': '# Demo\n',
    'package.json': JSON.stringify({ name: 'planner-provider-fail' }, null, 2),
  });

  try {
    await assert.rejects(
      runPrepareContext(repo.root, {
        withPlanner: true,
        provider: 'codex',
        providerExplicit: true,
        runProviderFn: async () => providerResult('', {
          ok: false,
          exitCode: null,
          error: {
            code: 'MISSING_PROVIDER_CLI',
            message: 'Provider CLI is missing.',
          },
        }),
      }),
      (error) => error.message.includes('ai prepare-context failed')
        && error.message.includes('Provider CLI is missing.')
        && error.code === 'MISSING_PROVIDER_CLI',
    );

    assert.equal(fs.existsSync(path.join(repo.root, 'docs/AI_CONTEXT.md')), false);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver')), false);
  } finally {
    repo.cleanup();
  }
});

test('invalid planner output writes no docs', async () => {
  const repo = makeRepo({
    'README.md': '# Demo\n',
    'package.json': JSON.stringify({ name: 'planner-invalid-output' }, null, 2),
  });

  try {
    await assert.rejects(
      runPrepareContext(repo.root, {
        withPlanner: true,
        provider: 'codex',
        providerExplicit: true,
        runProviderFn: async () => providerResult('not json', { cwd: repo.root }),
      }),
      (error) => error.code === 'AI_CONTEXT_PROPOSAL_INVALID'
        && error.message.includes('planner proposal output is not valid JSON'),
    );

    assert.equal(fs.existsSync(path.join(repo.root, 'docs/AI_CONTEXT.md')), false);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver')), false);
  } finally {
    repo.cleanup();
  }
});

test('review cancellation leaves docs untouched', async () => {
  const repo = makeRepo({
    'README.md': '# Demo\n',
    'package.json': JSON.stringify({ name: 'planner-review-cancel' }, null, 2),
  });

  try {
    await assert.rejects(
      runPrepareContext(repo.root, {
        withPlanner: true,
        review: true,
        provider: 'codex',
        providerExplicit: true,
        runProviderFn: async () => providerResult(validProposal(), { cwd: repo.root }),
        openEditorFn: () => ({ ok: false, canceled: true, reason: 'review canceled' }),
      }),
      (error) => error.code === 'AI_CONTEXT_REVIEW_FAILED'
        && error.message.includes('review canceled')
        && error.message.includes('Review artifact:'),
    );

    assert.equal(fs.existsSync(path.join(repo.root, 'docs/AI_CONTEXT.md')), false);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver')), false);
  } finally {
    repo.cleanup();
  }
});

test('review flow revalidates edited proposal before writing docs', async () => {
  const repo = makeRepo({
    'README.md': '# Demo\n',
    'package.json': JSON.stringify({ name: 'planner-review-edit' }, null, 2),
  });
  const reviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-review-edit-'));

  try {
    const result = await runPrepareContext(repo.root, {
      withPlanner: true,
      review: true,
      reviewDir,
      provider: 'codex',
      providerExplicit: true,
      runProviderFn: async () => providerResult(validProposal(), { cwd: repo.root }),
      openEditorFn: (reviewPath) => {
        const proposal = JSON.parse(fs.readFileSync(reviewPath, 'utf8'));
        proposal.docs[0].content = '# AI Context\n\nEdited during review.\n';
        fs.writeFileSync(reviewPath, `${JSON.stringify(proposal, null, 2)}\n`);
        return { ok: true, canceled: false };
      },
    });

    assert.equal(result.reviewPath, path.join(reviewDir, 'context-proposal.json'));
    assert.match(fs.readFileSync(path.join(repo.root, 'docs/AI_CONTEXT.md'), 'utf8'), /Edited during review/);
  } finally {
    fs.rmSync(reviewDir, { recursive: true, force: true });
    repo.cleanup();
  }
});

test('interactive planner approval can decline without writes', async () => {
  const repo = makeRepo({
    'README.md': '# Demo\n',
    'package.json': JSON.stringify({ name: 'planner-interactive-decline' }, null, 2),
  });

  try {
    await assert.rejects(
      runPrepareContext(repo.root, {
        withPlanner: true,
        interactive: true,
        provider: 'codex',
        providerExplicit: true,
        runProviderFn: async () => providerResult(validProposal(), { cwd: repo.root }),
        promptConfirm: async () => false,
        stdinIsTTY: true,
        stdoutIsTTY: true,
        stderrIsTTY: true,
        write: () => {},
      }),
      /interactive approval declined/,
    );

    assert.equal(fs.existsSync(path.join(repo.root, 'docs/AI_CONTEXT.md')), false);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver')), false);
  } finally {
    repo.cleanup();
  }
});
