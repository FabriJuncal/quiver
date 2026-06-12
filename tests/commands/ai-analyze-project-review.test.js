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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function makeRepo(structure = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-analyze-review-'));
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
      name: { name: 'Review Demo', confidence: 'confirmed', evidence: ['README.md'] },
      summary: 'Review demo.',
      claims: [],
    },
    domain: {
      roles: [],
      entities: [],
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
    claims: [],
    doc_updates: {
      'docs/CONTEXTO.md': '# Context\nProvider proposal.\n',
    },
  });
}

function invalidDocUpdateAnalysis() {
  const analysis = JSON.parse(validAnalysis());
  analysis.doc_updates = {
    'README.md': '# Unsafe target\n',
  };
  return JSON.stringify(analysis);
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

function assertAnalyzeProjectAuditRun(repoRoot) {
  const runsRoot = path.join(repoRoot, '.quiver', 'runs');
  assert.equal(fs.existsSync(runsRoot), true);
  const runIds = fs.readdirSync(runsRoot).filter((entry) => fs.statSync(path.join(runsRoot, entry)).isDirectory());
  assert.equal(runIds.length, 1);
  const runRoot = path.join(runsRoot, runIds[0]);
  assert.equal(fs.existsSync(path.join(runRoot, 'context', 'selected-context.json')), true);
  assert.equal(fs.existsSync(path.join(runRoot, 'raw')), true);
  assert.equal(fs.existsSync(path.join(runRoot, 'status.json')), true);
  return runRoot;
}

test('ai analyze-project --review writes approved docs with snapshot manifest', async () => {
  const repo = makeRepo({
    'README.md': '# Review Demo\n',
    'package.json': JSON.stringify({ name: 'review-demo' }, null, 2),
    'src/routes/users.ts': 'export const users = [];\n',
    'docs/CONTEXTO.md': '# Manual\n\nHuman text.\n',
  });
  const reviewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-review-edit-'));

  try {
    const { output, result } = await captureStdout(() => runAnalyzeProject(repo.root, {
      includeSource: true,
      review: true,
      reviewDir,
      provider: 'codex',
      providerExplicit: true,
      runProviderFn: async () => providerResult(validAnalysis(), { cwd: repo.root }),
      openEditorFn: (reviewPath) => {
        const proposal = JSON.parse(fs.readFileSync(reviewPath, 'utf8'));
        proposal.docs[0].content = '# Context\nEdited during review.\n';
        fs.writeFileSync(reviewPath, `${JSON.stringify(proposal, null, 2)}\n`);
        return { ok: true };
      },
      promptConfirm: async () => true,
      stdinIsTTY: true,
      stdoutIsTTY: true,
      stderrIsTTY: true,
      now: new Date('2026-06-10T12:00:00Z'),
    }));

    const context = fs.readFileSync(path.join(repo.root, 'docs/CONTEXTO.md'), 'utf8');
    const manifest = JSON.parse(fs.readFileSync(path.join(repo.root, result.snapshot.manifestPath), 'utf8'));

    assert.match(output, /AI analyze-project review write plan/);
    assert.match(output, /Dirty target docs: docs\/CONTEXTO\.md/);
    assert.match(output, /Final diff:/);
    assert.match(output, /Post-write validation: passed/);
    assert.deepEqual(result.written_docs, ['docs/CONTEXTO.md']);
    assert.equal(result.post_write_validation.ok, true);
    assert.ok(context.includes('Human text.'));
    assert.ok(context.includes('Edited during review.'));
    assert.equal(manifest.entries[0].path, 'docs/CONTEXTO.md');
    assert.equal(typeof manifest.entries[0].before_sha256, 'string');
    assert.equal(typeof manifest.entries[0].after_sha256, 'string');
    assert.ok(fs.existsSync(path.join(repo.root, result.snapshot.providerArtifactPath)));
    assert.ok(fs.existsSync(path.join(repo.root, result.run_status_path)));
    assert.ok(result.raw_provider_artifacts.every((artifactPath) => fs.existsSync(path.join(repo.root, artifactPath))));
    assert.equal(fs.readdirSync(path.join(repo.root, 'docs')).some((file) => file.includes('.quiver-tmp-')), false);
  } finally {
    fs.rmSync(reviewDir, { recursive: true, force: true });
    repo.cleanup();
  }
});

test('ai analyze-project review cancellation writes nothing', async () => {
  const repo = makeRepo({
    'README.md': '# Cancel\n',
    'package.json': JSON.stringify({ name: 'cancel-demo' }, null, 2),
    'src/routes/users.ts': 'export const users = [];\n',
  });

  try {
    await assert.rejects(
      captureStdout(() => runAnalyzeProject(repo.root, {
        includeSource: true,
        review: true,
        provider: 'codex',
        providerExplicit: true,
        runProviderFn: async () => providerResult(validAnalysis(), { cwd: repo.root }),
        openEditorFn: () => ({ ok: false, canceled: true, reason: 'review canceled' }),
      })),
      /review canceled/,
    );
    assert.equal(fs.existsSync(path.join(repo.root, 'docs')), false);
    assertAnalyzeProjectAuditRun(repo.root);
  } finally {
    repo.cleanup();
  }
});

test('ai analyze-project review confirmation decline writes nothing', async () => {
  const repo = makeRepo({
    'README.md': '# Decline\n',
    'package.json': JSON.stringify({ name: 'decline-demo' }, null, 2),
    'src/routes/users.ts': 'export const users = [];\n',
  });

  try {
    await assert.rejects(
      captureStdout(() => runAnalyzeProject(repo.root, {
        includeSource: true,
        review: true,
        provider: 'codex',
        providerExplicit: true,
        runProviderFn: async () => providerResult(validAnalysis(), { cwd: repo.root }),
        openEditorFn: () => ({ ok: true }),
        promptConfirm: async () => false,
        stdinIsTTY: true,
      })),
      /confirmation declined/,
    );
    assert.equal(fs.existsSync(path.join(repo.root, 'docs')), false);
    assertAnalyzeProjectAuditRun(repo.root);
  } finally {
    repo.cleanup();
  }
});

test('ai analyze-project --review rejects no-TTY review without writing', async () => {
  const repo = makeRepo({
    'README.md': '# No TTY\n',
    'package.json': JSON.stringify({ name: 'no-tty' }, null, 2),
    'src/routes/users.ts': 'export const users = [];\n',
  });

  try {
    await assert.rejects(
      captureStdout(() => runAnalyzeProject(repo.root, {
        includeSource: true,
        review: true,
        provider: 'codex',
        providerExplicit: true,
        stdinIsTTY: false,
        runProviderFn: async () => providerResult(validAnalysis(), { cwd: repo.root }),
      })),
      /requires an interactive terminal/,
    );
    assert.equal(fs.existsSync(path.join(repo.root, 'docs')), false);
    assertAnalyzeProjectAuditRun(repo.root);
  } finally {
    repo.cleanup();
  }
});

test('ai analyze-project --review rejects invalid edited proposal without writing', async () => {
  const repo = makeRepo({
    'README.md': '# Invalid Edit\n',
    'package.json': JSON.stringify({ name: 'invalid-edit' }, null, 2),
    'src/routes/users.ts': 'export const users = [];\n',
  });

  try {
    await assert.rejects(
      captureStdout(() => runAnalyzeProject(repo.root, {
        includeSource: true,
        review: true,
        provider: 'codex',
        providerExplicit: true,
        runProviderFn: async () => providerResult(validAnalysis(), { cwd: repo.root }),
        openEditorFn: (reviewPath) => {
          fs.writeFileSync(reviewPath, '{bad json');
          return { ok: true };
        },
      })),
      /edited analyze-project doc proposal is invalid after review/,
    );
    assert.equal(fs.existsSync(path.join(repo.root, 'docs')), false);
    assertAnalyzeProjectAuditRun(repo.root);
  } finally {
    repo.cleanup();
  }
});

test('ai analyze-project --apply-docs --yes writes valid docs with proposal and write manifests', async () => {
  const repo = makeRepo({
    'README.md': '# Apply Demo\n',
    'package.json': JSON.stringify({ name: 'apply-demo' }, null, 2),
    'src/routes/users.ts': 'export const users = [];\n',
  });

  try {
    const { output, result } = await captureStdout(() => runAnalyzeProject(repo.root, {
      applyDocs: true,
      force: true,
      includeSource: true,
      json: true,
      provider: 'codex',
      providerExplicit: true,
      runProviderFn: async () => providerResult(validAnalysis(), { cwd: repo.root }),
      now: new Date('2026-06-12T13:00:00Z'),
    }));

    const parsed = JSON.parse(output);
    const context = fs.readFileSync(path.join(repo.root, 'docs/CONTEXTO.md'), 'utf8');
    const writeManifest = readJson(path.join(repo.root, parsed.write_manifest.path));
    const proposalManifest = readJson(path.join(repo.root, parsed.proposal_artifacts.manifest));
    const status = readJson(path.join(repo.root, parsed.run_status_path));

    assert.equal(parsed.apply_docs, true);
    assert.equal(parsed.run_id, result.run_id);
    assert.deepEqual(parsed.written_docs, ['docs/CONTEXTO.md']);
    assert.equal(parsed.post_write_validation.ok, true);
    assert.equal(writeManifest.kind, 'quiver-analyze-project-doc-writes');
    assert.equal(writeManifest.actions[0].status, 'written');
    assert.equal(writeManifest.proposal_manifest, parsed.proposal_artifacts.manifest);
    assert.equal(proposalManifest.kind, 'quiver-analyze-project-doc-proposal');
    assert.equal(status.status, 'docs-applied');
    assert.equal(status.artifacts.write_manifest, parsed.write_manifest.path);
    assert.ok(fs.existsSync(path.join(repo.root, parsed.snapshot.manifestPath)));
    assert.ok(context.includes('Provider proposal.'));
    assert.ok(context.includes('<!-- quiver:analyze-project:start -->'));
  } finally {
    repo.cleanup();
  }
});

test('ai analyze-project --apply-docs --yes blocks dirty docs unless explicitly allowed', async () => {
  const repo = makeRepo({
    'README.md': '# Dirty Apply Demo\n',
    'package.json': JSON.stringify({ name: 'dirty-apply-demo' }, null, 2),
    'src/routes/users.ts': 'export const users = [];\n',
    'docs/CONTEXTO.md': '# Manual\n\nHuman text.\n',
  });

  try {
    await assert.rejects(
      captureStdout(() => runAnalyzeProject(repo.root, {
        applyDocs: true,
        force: true,
        includeSource: true,
        provider: 'codex',
        providerExplicit: true,
        runProviderFn: async () => providerResult(validAnalysis(), { cwd: repo.root }),
        now: new Date('2026-06-12T13:01:00Z'),
      })),
      /dirty-target-doc/,
    );

    const context = fs.readFileSync(path.join(repo.root, 'docs/CONTEXTO.md'), 'utf8');
    const status = readJson(path.join(repo.root, '.quiver/runs/run-2026-06-12t13-01-00z/status.json'));
    assert.equal(context, '# Manual\n\nHuman text.\n');
    assert.equal(status.status, 'apply-blocked');
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver/runs/run-2026-06-12t13-01-00z/proposal/manifest.json')), true);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver/runs/run-2026-06-12t13-01-00z/writes/analyze-project-doc-writes.json')), false);
  } finally {
    repo.cleanup();
  }
});

test('ai analyze-project --apply-docs --yes --allow-dirty-docs writes managed block into existing docs', async () => {
  const repo = makeRepo({
    'README.md': '# Dirty Allowed Demo\n',
    'package.json': JSON.stringify({ name: 'dirty-allowed-demo' }, null, 2),
    'src/routes/users.ts': 'export const users = [];\n',
    'docs/CONTEXTO.md': '# Manual\n\nHuman text.\n',
  });

  try {
    const { result } = await captureStdout(() => runAnalyzeProject(repo.root, {
      allowDirtyDocs: true,
      applyDocs: true,
      force: true,
      includeSource: true,
      provider: 'codex',
      providerExplicit: true,
      runProviderFn: async () => providerResult(validAnalysis(), { cwd: repo.root }),
      now: new Date('2026-06-12T13:02:00Z'),
    }));

    const context = fs.readFileSync(path.join(repo.root, 'docs/CONTEXTO.md'), 'utf8');
    const writeManifest = readJson(path.join(repo.root, result.write_manifest.path));
    assert.equal(result.post_write_validation.ok, true);
    assert.deepEqual(result.written_docs, ['docs/CONTEXTO.md']);
    assert.ok(context.includes('Human text.'));
    assert.ok(context.includes('Provider proposal.'));
    assert.equal(writeManifest.actions[0].dirty, true);
    assert.equal(writeManifest.actions[0].status, 'written');
  } finally {
    repo.cleanup();
  }
});

test('ai analyze-project --apply-docs --yes blocks invalid provider doc proposals without final docs', async () => {
  const repo = makeRepo({
    'README.md': '# Invalid Apply Demo\n',
    'package.json': JSON.stringify({ name: 'invalid-apply-demo' }, null, 2),
    'src/routes/users.ts': 'export const users = [];\n',
  });

  try {
    await assert.rejects(
      captureStdout(() => runAnalyzeProject(repo.root, {
        applyDocs: true,
        force: true,
        includeSource: true,
        provider: 'codex',
        providerExplicit: true,
        runProviderFn: async () => providerResult(invalidDocUpdateAnalysis(), { cwd: repo.root }),
        now: new Date('2026-06-12T13:03:00Z'),
      })),
      /unapproved-doc-update-path/,
    );
    assert.equal(fs.existsSync(path.join(repo.root, 'docs')), false);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver/runs/run-2026-06-12t13-03-00z/proposal')), false);
  } finally {
    repo.cleanup();
  }
});
