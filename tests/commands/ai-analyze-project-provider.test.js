const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { runAnalyzeProject } = require('../../src/create-quiver/commands/ai');

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function makeRepo(structure = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-analyze-provider-'));
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

function validAnalysis() {
  return JSON.stringify({
    schema_version: 1,
    kind: 'quiver-project-analysis',
    product: {
      name: { name: 'Provider Demo', confidence: 'confirmed', evidence: ['README.md'] },
      type: { name: 'API', confidence: 'inferred', evidence: ['src/routes/users.ts'] },
      summary: 'Provider-backed demo.',
      claims: [],
    },
    domain: {
      roles: [],
      entities: [{ name: 'users', confidence: 'confirmed', evidence: ['src/routes/users.ts'] }],
      actions: [],
      flows: [],
      incomplete_or_suspicious: [],
      claims: [],
    },
    architecture: {
      frontend: [],
      backend: [{ name: 'routes', confidence: 'confirmed', evidence: ['src/routes/users.ts'] }],
      auth: [],
      persistence: [],
      integrations: [],
      state: [],
      api: [],
      testing: [],
      deploy: [],
      risks: [],
      claims: [],
    },
    features: [{ name: 'User route', confidence: 'confirmed', evidence: ['src/routes/users.ts'] }],
    risks: [],
    questions: [],
    claims: [{ claim: 'Users are exposed by a route file', confidence: 'confirmed', evidence: ['src/routes/users.ts'] }],
    doc_updates: {
      'docs/CONTEXTO.md': '# Context\nProvider proposal.\n',
    },
  });
}

async function captureStdout(fn) {
  const original = process.stdout.write;
  let output = '';
  process.stdout.write = (chunk) => {
    output += String(chunk);
    return true;
  };
  try {
    const result = await fn();
    return { output, result };
  } finally {
    process.stdout.write = original;
  }
}

function createProgressRecorder() {
  const events = [];
  return {
    events,
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
  };
}

test('runAnalyzeProject executes provider after redacted privacy preflight and writes no files', async () => {
  const repo = makeRepo({
    'README.md': '# Provider Demo\n',
    'package.json': JSON.stringify({ name: 'provider-demo' }, null, 2),
    'src/routes/users.ts': 'const apiKey = "sk-12345678901234567890"; export const users = [];\n',
  });
  let providerCalled = false;

  try {
    const { output, result } = await captureStdout(() => runAnalyzeProject(repo.root, {
      includeSource: true,
      provider: 'codex',
      providerExplicit: true,
      runProviderFn: async (provider, options) => {
        providerCalled = true;
        assert.equal(provider, 'codex');
        assert.ok(options.prompt.includes('Return only one valid JSON object'));
        assert.equal(options.prompt.includes('sk-12345678901234567890'), false);
        assert.ok(options.prompt.includes('[REDACTED]'));
        return providerResult(validAnalysis(), { cwd: repo.root });
      },
    }));

    assert.equal(providerCalled, true);
    assert.match(output, /AI analyze-project provider analysis/);
    assert.equal(result.provider_execution, 'completed');
    assert.equal(result.privacy_preflight.ok, true);
    assert.equal(result.analysis.kind, 'quiver-project-analysis');
    assert.equal(result.provider_artifact.redacted, true);
    assert.equal(result.provider_artifact.persisted, false);
    assert.equal(result.provider_artifact.output.includes('sk-12345678901234567890'), false);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver')), false);
    assert.equal(fs.existsSync(path.join(repo.root, 'docs')), false);
  } finally {
    repo.cleanup();
  }
});

test('runAnalyzeProject shows human TTY progress during live provider execution', async () => {
  const repo = makeRepo({
    'README.md': '# Progress Demo\n',
    'package.json': JSON.stringify({ name: 'progress-demo' }, null, 2),
    'src/routes/users.ts': 'export const users = [];\n',
  });
  const progress = createProgressRecorder();

  try {
    await captureStdout(() => runAnalyzeProject(repo.root, {
      includeSource: true,
      provider: 'codex',
      providerExplicit: true,
      language: 'es',
      stdoutIsTTY: true,
      stdinIsTTY: true,
      stderrIsTTY: true,
      noColor: true,
      env: { LANG: 'es_AR.UTF-8' },
      write: progress.write,
      prompts: progress.prompts,
      runProviderFn: async () => providerResult(validAnalysis(), { cwd: repo.root }),
    }));

    assert.deepEqual(progress.events, [
      ['write', '◇ Analizando proyecto con codex\n'],
      ['write', '✓ Leyendo docs base\n'],
      ['write', '✓ Detectando estructura\n'],
      ['write', '✓ Preparando prompt\n'],
      ['start', 'Ejecutando agente...'],
      ['stop', 'Agente finalizado', undefined],
    ]);
  } finally {
    repo.cleanup();
  }
});

test('runAnalyzeProject --dry-run does not call provider', async () => {
  const repo = makeRepo({
    'README.md': '# Dry Run\n',
    'package.json': JSON.stringify({ name: 'dry-run' }, null, 2),
  });
  let providerCalled = false;

  try {
    await captureStdout(() => runAnalyzeProject(repo.root, {
      dryRun: true,
      runProviderFn: async () => {
        providerCalled = true;
        return providerResult(validAnalysis(), { cwd: repo.root });
      },
    }));

    assert.equal(providerCalled, false);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver')), false);
  } finally {
    repo.cleanup();
  }
});

test('runAnalyzeProject rejects invalid provider JSON without writing files', async () => {
  const repo = makeRepo({
    'README.md': '# Invalid Provider\n',
    'package.json': JSON.stringify({ name: 'invalid-provider' }, null, 2),
    'src/routes/users.ts': 'export const users = [];\n',
  });

  try {
    await assert.rejects(
      captureStdout(() => runAnalyzeProject(repo.root, {
        includeSource: true,
        provider: 'codex',
        providerExplicit: true,
        runProviderFn: async () => providerResult('not json', { cwd: repo.root }),
      })),
      /provider analysis output is not valid JSON/,
    );
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver')), false);
    assert.equal(fs.existsSync(path.join(repo.root, 'docs')), false);
  } finally {
    repo.cleanup();
  }
});

test('runAnalyzeProject reports provider schema issues with actionable detail', async () => {
  const repo = makeRepo({
    'README.md': '# Invalid Schema\n',
    'package.json': JSON.stringify({ name: 'invalid-schema' }, null, 2),
    'src/routes/users.ts': 'export const users = [];\n',
  });
  const invalidAnalysis = JSON.stringify({
    schema_version: 1,
    kind: 'quiver-project-analysis',
    product: {
      name: {
        name: 'Invalid Schema',
        confidence: 'certain',
        evidence: ['README.md'],
      },
    },
    domain: {},
    architecture: {},
    features: [],
    risks: [],
    questions: [],
    claims: [],
    doc_updates: {},
  });

  try {
    await assert.rejects(
      captureStdout(() => runAnalyzeProject(repo.root, {
        includeSource: true,
        provider: 'codex',
        providerExplicit: true,
        runProviderFn: async () => providerResult(invalidAnalysis, { cwd: repo.root }),
      })),
      (error) => {
        assert.equal(error.code, 'AI_ANALYZE_PROJECT_INVALID');
        assert.match(error.message, /provider analysis JSON does not match the required schema/);
        assert.match(error.message, /Issues:/);
        assert.match(error.message, /product\.name\.confidence/);
        assert.match(error.message, /Next safe step:/);
        assert.ok(Array.isArray(error.details));
        return true;
      },
    );
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver')), false);
    assert.equal(fs.existsSync(path.join(repo.root, 'docs')), false);
  } finally {
    repo.cleanup();
  }
});

test('runAnalyzeProject rejects provider failure without writing files', async () => {
  const repo = makeRepo({
    'README.md': '# Provider Failure\n',
    'package.json': JSON.stringify({ name: 'provider-failure' }, null, 2),
  });

  try {
    await assert.rejects(
      captureStdout(() => runAnalyzeProject(repo.root, {
        provider: 'codex',
        providerExplicit: true,
        runProviderFn: async () => ({
          ok: false,
          dryRun: false,
          provider: 'codex',
          command: 'codex',
          args: ['exec'],
          cwd: repo.root,
          timeoutMs: 1000,
          promptTransport: { mode: 'stdin' },
          exitCode: 1,
          stdout: '',
          stderr: 'failed',
          error: new Error('provider failed'),
          preflight: { ok: true },
        }),
      })),
      /ai analyze-project failed: provider failed/,
    );
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver')), false);
    assert.equal(fs.existsSync(path.join(repo.root, 'docs')), false);
  } finally {
    repo.cleanup();
  }
});
