const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const { runOnboard, runPrepareContext } = require('../../src/create-quiver/commands/ai');
const { buildContextPreparationDrafts } = require('../../src/create-quiver/lib/ai/onboarding-template');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function makeRepo(structure) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-onboard-'));
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

function execAi(repoRoot, args = [], env = {}) {
  return execFileSync('node', [BIN_PATH, 'ai', 'onboard', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

function execAiTask(repoRoot, task, args = [], env = {}) {
  return execFileSync('node', [BIN_PATH, 'ai', task, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

test('ai onboard CLI dry-run prints provider, role, context pack, and invocation plan', () => {
  const repo = makeRepo({
    'docs/onboarding-notes.md': '# onboarding notes\nRead-only planning only.',
  });
  try {
    const output = execAi(repo.root, [
      '--provider',
      'claude',
      '--role',
      'planner',
      '--context',
      'full',
      '--input',
      'docs/onboarding-notes.md',
      '--timeout',
      '120',
      '--dry-run',
    ]);
    assert.ok(output.includes('AI onboard dry-run'));
    assert.ok(output.includes('Provider: claude'));
    assert.ok(output.includes('Role: planner'));
    assert.ok(output.includes('Context pack: full'));
    assert.ok(output.includes('Command: claude -p'));
    assert.ok(output.includes('Timeout: 120ms'));
    assert.ok(output.includes('Prompt transport: stdin'));
    assert.ok(output.includes('Prompt source: packaged planner onboarding template'));
    assert.ok(output.includes('Selected docs:'));
    assert.ok(output.includes('Documentation debt:'));
  } finally {
    repo.cleanup();
  }
});

test('ai onboard CLI dry-run supports Spanish human output without translating commands', () => {
  const repo = makeRepo({
    'docs/onboarding-notes.md': '# onboarding notes\nRead-only planning only.',
  });
  try {
    const output = execFileSync('node', [
      BIN_PATH,
      '--lang',
      'es',
      'ai',
      'onboard',
      '--provider',
      'claude',
      '--role',
      'planner',
      '--context',
      'full',
      '--input',
      'docs/onboarding-notes.md',
      '--timeout',
      '120',
      '--dry-run',
    ], {
      cwd: repo.root,
      encoding: 'utf8',
      env: process.env,
    });

    assert.ok(output.includes('Dry-run de IA onboard'));
    assert.ok(output.includes('Provider: claude'));
    assert.ok(output.includes('Rol: planner'));
    assert.ok(output.includes('Pack de contexto: full'));
    assert.ok(output.includes('Comando: claude -p'));
    assert.ok(output.includes('Timeout: 120ms'));
    assert.ok(output.includes('Fuente del prompt: packaged planner onboarding template'));
    assert.ok(output.includes('Docs seleccionados:'));
    assert.ok(output.includes('Deuda documental:'));
  } finally {
    repo.cleanup();
  }
});

test('ai onboard CLI dry-run reads the configured project language by default', () => {
  const repo = makeRepo({
    '.quiver/config.json': `${JSON.stringify({ language: 'es' }, null, 2)}\n`,
    'docs/onboarding-notes.md': '# onboarding notes\nRead-only planning only.',
  });
  try {
    const output = execAi(repo.root, [
      '--provider',
      'claude',
      '--role',
      'planner',
      '--context',
      'full',
      '--input',
      'docs/onboarding-notes.md',
      '--dry-run',
    ]);

    assert.ok(output.includes('Dry-run de IA onboard'));
    assert.ok(output.includes('Rol: planner'));
    assert.ok(output.includes('Comando: claude -p'));
  } finally {
    repo.cleanup();
  }
});

test('ai onboard print-prompt prints the exact prompt without invoking provider auth', () => {
  const repo = makeRepo({
    'docs/onboarding-notes.md': '# onboarding notes\nRead-only planning only.',
  });
  try {
    const output = execAi(repo.root, [
      '--provider',
      'gemini',
      '--role',
      'planner',
      '--context',
      'full',
      '--input',
      'docs/onboarding-notes.md',
      '--print-prompt',
    ]);

    assert.ok(output.includes('AI onboard prompt-only'));
    assert.ok(output.includes('Provider: gemini'));
    assert.ok(output.includes('--- PROMPT START ---'));
    assert.ok(output.includes('Read-only planning only.'));
    assert.ok(output.includes('Do not modify product code.'));
    assert.ok(output.includes('--- PROMPT END ---'));
  } finally {
    repo.cleanup();
  }
});

test('ai onboard forwards custom provider, role, context, input, and timeout to the provider runner', async () => {
  const repo = makeRepo({
    'docs/onboarding-notes.md': '# onboarding notes\nKeep the repo in read-only mode.',
  });

  try {
    let captured = null;
    const result = await runOnboard(repo.root, {
      provider: 'claude',
      role: 'planner',
      context: 'full',
      input: 'docs/onboarding-notes.md',
      timeout: 4321,
      runProviderFn: async (provider, options) => {
        captured = { provider, options };
        return {
          ok: true,
          dryRun: false,
          provider,
          command: 'claude',
          args: ['-p'],
          cwd: repo.root,
          timeoutMs: 4321,
          promptTransport: { mode: 'stdin' },
          exitCode: 0,
          stdout: 'onboard output\n',
          stderr: '',
          error: null,
          preflight: { ok: true },
        };
      },
    });

    assert.equal(result.provider, 'claude');
    assert.equal(captured.provider, 'claude');
    assert.equal(captured.options.cwd, repo.root);
    assert.equal(captured.options.timeoutMs, 4321);
    assert.ok(captured.options.prompt.includes('onboarding notes'));
    assert.ok(captured.options.prompt.includes('Do not modify product code.'));
    assert.ok(captured.options.prompt.includes('Context pack: full'));
    assert.ok(captured.options.prompt.includes('Then read docs/INDEX.md as the navigation map when present.'));
    assert.ok(captured.options.prompt.includes('Do not read all docs/ recursively by default.'));
    assert.ok(captured.options.prompt.includes('Documentation debt to report if relevant:'));
  } finally {
    repo.cleanup();
  }
});

test('ai onboard surfaces provider failures with actionable context', async () => {
  const repo = makeRepo({});
  try {
    await assert.rejects(
      runOnboard(repo.root, {
        provider: 'codex',
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
          error: {
            code: 'MISSING_PROVIDER_CLI',
            message: "Provider CLI 'codex' is not available. Install the Codex CLI and make sure it is available on PATH.",
          },
          preflight: null,
        }),
      }),
      (error) => error.message.includes('ai onboard failed')
        && error.message.includes('Install the Codex CLI')
        && error.code === 'MISSING_PROVIDER_CLI',
    );
  } finally {
    repo.cleanup();
  }
});

test('ai prepare-context dry-run prints proposed docs, assumptions, risks, and omitted paths', () => {
  const repo = makeRepo({
    README: '',
    'README.md': '# Demo\n',
    'package.json': JSON.stringify({ name: 'demo-project' }, null, 2),
    'docs/PROJECT_MAP.md': '# Project Map\n',
    'docs/INDEX.md': '# Index\n',
    'docs/WORKFLOW.md': '# Workflow\n',
  });

  try {
    const output = execAiTask(repo.root, 'prepare-context', ['--dry-run']);
    assert.ok(output.includes('AI prepare-context dry-run'));
    assert.ok(output.includes('Mode: dry-run'));
    assert.ok(output.includes('Writes: docs-only'));
    assert.ok(output.includes('Proposed docs: docs/INDEX.md, docs/PROJECT_MAP.md, docs/AI_CONTEXT.md, docs/AI_ONBOARDING_PROMPT.md, docs/CONTEXTO.md, docs/WORKFLOW.md, docs/ARCHITECTURE.md, docs/STATUS.md, docs/DECISIONS.md'));
    assert.ok(output.includes('Proposed changes:'));
    assert.ok(output.includes('Diff preview:'));
    assert.ok(output.includes('+++ docs/AI_CONTEXT.md (proposed)'));
    assert.ok(output.includes('Files considered:'));
    assert.ok(output.includes('README_FOR_AI.md'));
    assert.ok(output.includes('Assumptions:'));
    assert.ok(output.includes('Risks:'));
    assert.ok(output.includes('Contradictions:'));
    assert.ok(output.includes('Omitted paths:'));
    assert.ok(output.includes('Uncertainty markers: TODO | Assumption | Pending confirmation'));
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver')), false);
  } finally {
    repo.cleanup();
  }
});

test('ai prepare-context dry-run supports Spanish human output without translating paths', () => {
  const repo = makeRepo({
    README: '',
    'README.md': '# Demo\n',
    'package.json': JSON.stringify({ name: 'demo-project' }, null, 2),
    'docs/PROJECT_MAP.md': '# Project Map\n',
    'docs/INDEX.md': '# Index\n',
    'docs/WORKFLOW.md': '# Workflow\n',
  });

  try {
    const output = execFileSync('node', [BIN_PATH, '--lang', 'es', 'ai', 'prepare-context', '--dry-run'], {
      cwd: repo.root,
      encoding: 'utf8',
      env: process.env,
    });

    assert.ok(output.includes('Dry-run de AI prepare-context'));
    assert.ok(output.includes('Modo: dry-run'));
    assert.ok(output.includes('Escrituras: solo docs'));
    assert.ok(output.includes('Docs propuestos: docs/INDEX.md, docs/PROJECT_MAP.md'));
    assert.ok(output.includes('Cambios propuestos:'));
    assert.ok(output.includes('Archivos considerados:'));
    assert.ok(output.includes('README_FOR_AI.md'));
    assert.ok(output.includes('Supuestos:'));
    assert.ok(output.includes('Riesgos:'));
    assert.ok(output.includes('Rutas omitidas:'));
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver')), false);
  } finally {
    repo.cleanup();
  }
});

test('ai prepare-context planner dry-run supports Spanish wrapper output without translating commands', () => {
  const repo = makeRepo({
    'README.md': '# Demo\n',
    'package.json': JSON.stringify({ name: 'demo-project' }, null, 2),
    'docs/PROJECT_MAP.md': '# Project Map\n',
    'docs/INDEX.md': '# Index\n',
  });

  try {
    const output = execFileSync('node', [BIN_PATH, '--lang', 'es', 'ai', 'prepare-context', '--with-planner', '--dry-run'], {
      cwd: repo.root,
      encoding: 'utf8',
      env: process.env,
    });

    assert.ok(output.includes('Dry-run de AI prepare-context con planner'));
    assert.ok(output.includes('Planner: habilitado'));
    assert.ok(output.includes('Ejecucion del provider: omitida'));
    assert.ok(output.includes('Escrituras: ninguna'));
    assert.ok(output.includes('Proximos comandos seguros:'));
    assert.ok(output.includes('npx create-quiver ai prepare-context --with-planner --print-prompt'));
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver')), false);
  } finally {
    repo.cleanup();
  }
});

test('ai prepare-context writes docs-only drafts and keeps product code untouched', async () => {
  const repo = makeRepo({
    'README.md': '# Demo\n',
    'package.json': JSON.stringify({ name: 'demo-project' }, null, 2),
    'src/app.js': 'module.exports = 1;\n',
  });

  try {
    const before = fs.readFileSync(path.join(repo.root, 'src/app.js'), 'utf8');
    const result = await runPrepareContext(repo.root, {});

    assert.equal(result.task, 'prepare-context');
    assert.deepEqual(result.writtenDocs, [
      'docs/INDEX.md',
      'docs/PROJECT_MAP.md',
      'docs/AI_CONTEXT.md',
      'docs/AI_ONBOARDING_PROMPT.md',
      'docs/CONTEXTO.md',
      'docs/WORKFLOW.md',
      'docs/ARCHITECTURE.md',
      'docs/STATUS.md',
      'docs/DECISIONS.md',
    ]);
    assert.ok(result.runId);
    assert.ok(result.snapshot);
    assert.equal(fs.readFileSync(path.join(repo.root, 'src/app.js'), 'utf8'), before);
    assert.ok(fs.existsSync(path.join(repo.root, 'docs', 'INDEX.md')));
    assert.ok(fs.existsSync(path.join(repo.root, 'docs', 'PROJECT_MAP.md')));
    assert.ok(fs.existsSync(path.join(repo.root, 'docs', 'AI_CONTEXT.md')));
    assert.ok(fs.existsSync(path.join(repo.root, 'docs', 'ARCHITECTURE.md')));
    assert.ok(fs.existsSync(path.join(repo.root, 'docs', 'DECISIONS.md')));
    assert.ok(fs.existsSync(path.join(repo.root, result.snapshot.manifestPath)));
    const decisions = fs.readFileSync(path.join(repo.root, 'docs', 'DECISIONS.md'), 'utf8');
    assert.ok(decisions.includes('Context Preparation Decisions'));
    assert.ok(decisions.includes('README_FOR_AI.md absence in generated projects is guidance-only, not project debt'));
  } finally {
    repo.cleanup();
  }
});

test('ai prepare-context preserves human-authored docs and snapshots before updating', async () => {
  const repo = makeRepo({
    'README.md': '# Demo\n',
    'package.json': JSON.stringify({ name: 'demo-project' }, null, 2),
    'docs/CONTEXTO.md': '# Manual Context\n\nThis paragraph was written by a human.\n',
  });

  try {
    const result = await runPrepareContext(repo.root, {
      now: new Date('2026-05-22T12:00:00.000Z'),
    });
    const contexto = fs.readFileSync(path.join(repo.root, 'docs', 'CONTEXTO.md'), 'utf8');
    const snapshotPath = result.snapshot.entries.find((entry) => entry.path === 'docs/CONTEXTO.md').snapshot_path;
    const snapshot = fs.readFileSync(path.join(repo.root, snapshotPath), 'utf8');

    assert.ok(contexto.includes('This paragraph was written by a human.'));
    assert.ok(contexto.includes('<!-- quiver:context-prep:start -->'));
    assert.ok(contexto.includes('<!-- quiver:context-prep:end -->'));
    assert.equal(snapshot, '# Manual Context\n\nThis paragraph was written by a human.\n');
  } finally {
    repo.cleanup();
  }
});

test('ai prepare-context reports contradictions between project map and current root signals', () => {
  const repo = makeRepo({
    'README.md': '# Demo\n',
    'package.json': JSON.stringify({ name: 'demo-project' }, null, 2),
    'docs/PROJECT_MAP.md': '# Project Map\n\n## Project\n- Name: other-project\n- Package manager: pnpm\n',
    'package-lock.json': '{}\n',
  });

  try {
    const output = execAiTask(repo.root, 'prepare-context', ['--dry-run']);
    assert.ok(output.includes('Contradictions:'));
    assert.ok(output.includes("docs/PROJECT_MAP.md reports project name 'other-project'"));
    assert.ok(output.includes("docs/PROJECT_MAP.md reports package manager 'pnpm'"));
    assert.equal(fs.readFileSync(path.join(repo.root, 'docs', 'PROJECT_MAP.md'), 'utf8').includes('quiver:context-prep:start'), false);
  } finally {
    repo.cleanup();
  }
});

test('ai prepare-context uses root evidence for known facts and keeps unknowns marked as pending', () => {
  const repo = makeRepo({
    'README.md': '# React Vite Demo\n',
    'package.json': JSON.stringify({
      name: 'react-vite-demo',
      dependencies: {
        react: '^19.0.0',
      },
      devDependencies: {
        vite: '^7.0.0',
        typescript: '^5.0.0',
      },
      scripts: {
        dev: 'vite',
        build: 'vite build',
      },
    }, null, 2),
    'vite.config.ts': 'export default {};\n',
    'src/App.tsx': 'export function App() { return null; }\n',
    'docs/PROJECT_MAP.md': '# Project Map\n\n## Project\n- Name: react-vite-demo\n- Package manager: npm\n',
    'docs/INDEX.md': '# Index\n',
  });

  try {
    const draftPack = buildContextPreparationDrafts(repo.root);
    const projectMap = draftPack.docs.find((doc) => doc.path === 'docs/PROJECT_MAP.md').content;
    const architecture = draftPack.docs.find((doc) => doc.path === 'docs/ARCHITECTURE.md').content;

    assert.match(projectMap, /- Stack summary: Vite, React/);
    assert.match(projectMap, /- Dev: vite/);
    assert.match(projectMap, /- Build: vite build/);
    assert.match(architecture, /- Stack: Vite, React/);
    assert.doesNotMatch(projectMap, /Pending confirmation: no primary stack could be inferred/);
    assert.match(architecture, /TODO: confirm application boundaries with the team/);
  } finally {
    repo.cleanup();
  }
});
