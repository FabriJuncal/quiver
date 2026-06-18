const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { runAnalyzeProject } = require('../../src/create-quiver/commands/ai');
const { parseAnalyzeProjectOutput } = require('../../src/create-quiver/lib/ai/analyze-project-parser');
const {
  normalizeAnalyzeProjectProposalManifest,
} = require('../../src/create-quiver/lib/ai/analyze-project-proposal');

const providerFixtures = require('../fixtures/analyze-project/provider-output-cases.json');

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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fixtureCase(name) {
  const found = providerFixtures.cases.find((item) => item.name === name);
  assert.ok(found, `missing provider fixture case: ${name}`);
  return found;
}

function fixtureOutput(item) {
  const fixture = typeof item === 'string' ? fixtureCase(item) : item;
  if (fixture.output_ref) {
    return fixtureOutput(fixture.output_ref);
  }
  if (Object.hasOwn(fixture, 'output_text')) {
    return fixture.output_text;
  }

  const json = JSON.stringify(fixture.output);
  if (fixture.wrapper === 'fenced-json') {
    return `\`\`\`json\n${json}\n\`\`\`\n`;
  }
  return `${fixture.prefix || ''}${json}${fixture.suffix || ''}`;
}

function providerFixtureParserOptions() {
  return {
    selectedFiles: providerFixtures.selected_files,
    promptFiles: providerFixtures.prompt_files,
  };
}

function makeProviderFixtureRepo() {
  return makeRepo({
    'README.md': '# Provider Fixture\n',
    'package.json': JSON.stringify({ name: 'provider-fixture' }, null, 2),
    'src/routes/users.ts': 'export const users = [];\n',
  });
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

function assertValidationManifest(repoRoot, error) {
  assert.ok(error.validation_manifest, 'expected validation manifest metadata');
  assert.match(error.validation_manifest.path, /^\.quiver\/runs\/run-[^/]+\/validation\/analyze-project-validation\.json$/);
  const manifestPath = path.join(repoRoot, error.validation_manifest.path);
  assert.equal(fs.existsSync(manifestPath), true);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.kind, 'quiver-analyze-project-validation-manifest');
  assert.equal(manifest.status, 'invalid');
  assert.equal(manifest.issue_count, error.issues.length);
  const normalizeIssue = (issue) => ({
    path: issue.path,
    issue: issue.issue,
    message: issue.message,
    ...(Array.isArray(issue.keys) ? { keys: issue.keys } : {}),
  });
  assert.deepEqual(manifest.issues.map(normalizeIssue), error.issues.map(normalizeIssue));
  assert.ok(Array.isArray(manifest.groups));
  assert.ok(manifest.groups.length > 0);
  return manifest;
}

function assertSelectedContextManifest(repoRoot, manifestRef) {
  const relativePath = typeof manifestRef === 'string' ? manifestRef : manifestRef?.path;
  assert.match(relativePath || '', /^\.quiver\/runs\/run-[^/]+\/context\/selected-context\.json$/);
  const manifestPath = path.join(repoRoot, relativePath);
  assert.equal(fs.existsSync(manifestPath), true);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.kind, 'quiver-analyze-project-selected-context-manifest');
  assert.equal(manifest.safety_boundary.repository_content_is_untrusted, true);
  assert.equal(manifest.safety_boundary.file_contents_are_data_not_instructions, true);
  assert.equal(manifest.safety_boundary.content_redacted_before_provider, true);
  assert.ok(Array.isArray(manifest.selected_files));
  assert.ok(manifest.selected_files.some((file) => file.path === 'README.md'));
  assert.equal(JSON.stringify(manifest).includes('sk-12345678901234567890'), false);
  assert.equal(JSON.stringify(manifest).includes('fixture-secret-token'), false);
  return manifest;
}

function assertRepairManifest(repoRoot, manifestRef) {
  assert.ok(manifestRef, 'expected repair manifest metadata');
  assert.match(manifestRef.path || '', /^\.quiver\/runs\/run-[^/]+\/repair\/analyze-project-repair\.json$/);
  const manifestPath = path.join(repoRoot, manifestRef.path);
  assert.equal(fs.existsSync(manifestPath), true);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.kind, 'quiver-analyze-project-repair-manifest');
  assert.equal(manifest.status, manifestRef.status);
  assert.equal(manifest.entry_count, manifestRef.entry_count);
  return manifest;
}

function assertRetryManifest(repoRoot, manifestRef) {
  assert.ok(manifestRef, 'expected retry manifest metadata');
  assert.match(manifestRef.path || '', /^\.quiver\/runs\/run-[^/]+\/retry\/analyze-project-retry\.json$/);
  const manifestPath = path.join(repoRoot, manifestRef.path);
  assert.equal(fs.existsSync(manifestPath), true);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.kind, 'quiver-analyze-project-retry-manifest');
  assert.equal(manifest.retry_count, manifestRef.retry_count);
  assert.equal(manifest.max_retries, manifestRef.max_retries);
  assert.equal(manifest.final_status, manifestRef.final_status);
  assert.ok(Array.isArray(manifest.attempts));
  return manifest;
}

function assertNoProposalArtifacts(repoRoot) {
  const runsRoot = path.join(repoRoot, '.quiver', 'runs');
  if (!fs.existsSync(runsRoot)) {
    return;
  }
  for (const runId of fs.readdirSync(runsRoot)) {
    assert.equal(fs.existsSync(path.join(runsRoot, runId, 'proposal')), false, `unexpected proposal artifacts in ${runId}`);
  }
}

function assertSavedProposalArtifacts(repoRoot, result) {
  assert.ok(result.proposal_artifacts, 'expected proposal artifacts in result');
  const artifacts = result.proposal_artifacts;
  const proposalPath = path.join(repoRoot, artifacts.proposal_json);
  const summaryPath = path.join(repoRoot, artifacts.proposal_markdown);
  const diffPath = path.join(repoRoot, artifacts.proposal_diff);
  const manifestPath = path.join(repoRoot, artifacts.manifest);

  assert.equal(fs.existsSync(proposalPath), true);
  assert.equal(fs.existsSync(summaryPath), true);
  assert.equal(fs.existsSync(diffPath), true);
  assert.equal(fs.existsSync(manifestPath), true);

  const proposal = readJson(proposalPath);
  assert.equal(proposal.kind, 'quiver-analyze-project-doc-proposal');
  assert.ok(proposal.docs.some((doc) => doc.path === 'docs/CONTEXTO.md'));
  assert.match(fs.readFileSync(summaryPath, 'utf8'), /docs\/CONTEXTO\.md/);
  assert.doesNotMatch(fs.readFileSync(summaryPath, 'utf8'), /Provider proposal/);
  assert.match(fs.readFileSync(diffPath, 'utf8'), /Provider proposal/);

  const manifest = normalizeAnalyzeProjectProposalManifest(readJson(manifestPath));
  assert.equal(manifest.run_id, result.run_id);
  assert.equal(manifest.provider, 'codex');
  assert.ok(manifest.doc_paths.includes('docs/CONTEXTO.md'));
  assert.ok(manifest.merge_plan.some((item) => item.path === 'docs/CONTEXTO.md'));
  assert.ok(manifest.merge_plan.every((item) => item.merge_report?.strategy));
  assert.equal(manifest.proposal_sha256, artifacts.proposal_sha256);
  return manifest;
}

function assertOnlySelectedContextAudit(repoRoot) {
  const runsRoot = path.join(repoRoot, '.quiver', 'runs');
  assert.equal(fs.existsSync(runsRoot), true);
  const manifestPaths = [];
  for (const runId of fs.readdirSync(runsRoot)) {
    const manifestPath = path.join(runsRoot, runId, 'context', 'selected-context.json');
    if (fs.existsSync(manifestPath)) {
      manifestPaths.push(path.join('.quiver', 'runs', runId, 'context', 'selected-context.json').split(path.sep).join('/'));
    }
  }
  assert.equal(manifestPaths.length, 1);
  return assertSelectedContextManifest(repoRoot, manifestPaths[0]);
}

test('runAnalyzeProject executes provider and applies validated docs by default', async () => {
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
        assert.ok(options.prompt.includes('Compact structural map JSON:'));
        assert.equal(options.prompt.includes('sk-12345678901234567890'), false);
        assert.ok(options.prompt.includes('[REDACTED]'));
        return providerResult(validAnalysis(), { cwd: repo.root });
      },
    }));

    assert.equal(providerCalled, true);
    assert.match(output, /AI analyze-project docs applied/);
    assert.equal(result.provider_execution, 'completed');
    assert.equal(result.apply_docs, true);
    assert.equal(result.privacy_preflight.ok, true);
    assert.equal(result.analysis.kind, 'quiver-project-analysis');
    assert.equal(result.provider_artifact.redacted, true);
    assert.equal(result.provider_artifact.persisted, false);
    assert.equal(result.provider_artifact.output.includes('sk-12345678901234567890'), false);
    assertSelectedContextManifest(repo.root, result.selected_context_manifest);
    assert.ok(result.raw_provider_artifacts.every((artifactPath) => fs.existsSync(path.join(repo.root, artifactPath))));
    assert.equal(fs.existsSync(path.join(repo.root, result.run_status_path)), true);
    assert.deepEqual(result.written_docs, ['docs/CONTEXTO.md']);
    assert.equal(result.post_write_validation.ok, true);
    assert.equal(result.interactive_action, 'auto-apply');
    assert.ok(result.write_plan.every((item) => item.merge_report?.strategy));
    assert.equal(fs.existsSync(path.join(repo.root, result.proposal_artifacts.manifest)), true);
    assert.equal(fs.existsSync(path.join(repo.root, result.write_manifest.path)), true);
    assert.equal(fs.existsSync(path.join(repo.root, result.snapshot.manifestPath)), true);
    const context = fs.readFileSync(path.join(repo.root, 'docs/CONTEXTO.md'), 'utf8');
    assert.ok(context.includes('Provider proposal.'));
    assert.ok(context.includes('<!-- quiver:analyze-project:start -->'));
    const status = readJson(path.join(repo.root, result.run_status_path));
    assert.equal(status.status, 'docs-applied');
    assert.equal(status.artifacts.write_manifest, result.write_manifest.path);
  } finally {
    repo.cleanup();
  }
});

test('runAnalyzeProject default auto-apply preserves existing docs with managed block', async () => {
  const repo = makeRepo({
    'README.md': '# Provider Existing Docs Demo\n',
    'package.json': JSON.stringify({ name: 'provider-existing-docs-demo' }, null, 2),
    'src/routes/users.ts': 'export const users = [];\n',
    'docs/CONTEXTO.md': '# Manual Context\n\nHuman-written context stays here.\n',
  });

  try {
    const { result } = await captureStdout(() => runAnalyzeProject(repo.root, {
      includeSource: true,
      provider: 'codex',
      providerExplicit: true,
      runProviderFn: async () => providerResult(validAnalysis(), { cwd: repo.root }),
      now: new Date('2026-06-12T12:34:50.000Z'),
    }));

    const context = fs.readFileSync(path.join(repo.root, 'docs/CONTEXTO.md'), 'utf8');
    assert.equal(result.apply_docs, true);
    assert.equal(result.interactive_action, 'auto-apply');
    assert.ok(context.includes('# Manual Context'));
    assert.ok(context.includes('Human-written context stays here.'));
    assert.ok(context.includes('Provider proposal.'));
    assert.ok(context.includes('<!-- quiver:analyze-project:start -->'));
    const writeManifest = readJson(path.join(repo.root, result.write_manifest.path));
    assert.equal(writeManifest.actions[0].status, 'written');
    assert.equal(writeManifest.actions[0].merge_report.strategy, 'preserve-and-update-managed-block');
  } finally {
    repo.cleanup();
  }
});

test('runAnalyzeProject --save-proposal persists proposal artifacts without writing final docs', async () => {
  const repo = makeRepo({
    'README.md': '# Save Proposal Demo\n',
    'package.json': JSON.stringify({ name: 'save-proposal-demo' }, null, 2),
    'src/routes/users.ts': 'export const users = [];\n',
  });

  try {
    const { output, result } = await captureStdout(() => runAnalyzeProject(repo.root, {
      includeSource: true,
      saveProposal: true,
      provider: 'codex',
      providerExplicit: true,
      now: new Date('2026-06-12T12:34:56.000Z'),
      runProviderFn: async () => providerResult(validAnalysis(), { cwd: repo.root }),
    }));

    assert.match(output, /AI analyze-project proposal saved/);
    assert.equal(result.save_proposal, true);
    assert.equal(result.writes.length, 0);
    assert.equal(result.run_id, 'run-2026-06-12t12-34-56z');
    const manifest = assertSavedProposalArtifacts(repo.root, result);
    assert.equal(manifest.selected_context_manifest, '.quiver/runs/run-2026-06-12t12-34-56z/context/selected-context.json');
    assert.equal(fs.existsSync(path.join(repo.root, 'docs', 'CONTEXTO.md')), false);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver', 'runs', result.run_id, 'snapshots')), false);

    const status = readJson(path.join(repo.root, result.run_status_path));
    assert.equal(status.status, 'proposal-saved');
    assert.equal(status.artifacts.proposal_manifest, result.proposal_artifacts.manifest);
  } finally {
    repo.cleanup();
  }
});

test('runAnalyzeProject --save-proposal --json emits clean parseable proposal result', async () => {
  const repo = makeRepo({
    'README.md': '# Save Proposal JSON Demo\n',
    'package.json': JSON.stringify({ name: 'save-proposal-json-demo' }, null, 2),
    'src/routes/users.ts': 'export const users = [];\n',
  });

  try {
    const { output, result } = await captureStdout(() => runAnalyzeProject(repo.root, {
      includeSource: true,
      saveProposal: true,
      json: true,
      provider: 'codex',
      providerExplicit: true,
      now: new Date('2026-06-12T12:35:00.000Z'),
      runProviderFn: async () => providerResult(validAnalysis(), { cwd: repo.root }),
    }));

    const parsed = JSON.parse(output);
    assert.equal(parsed.save_proposal, true);
    assert.equal(parsed.run_id, result.run_id);
    assert.equal(parsed.proposal_artifacts.manifest, result.proposal_artifacts.manifest);
    assert.ok(parsed.write_plan.every((item) => item.merge_report?.strategy));
    assertSavedProposalArtifacts(repo.root, parsed);
    assert.equal(fs.existsSync(path.join(repo.root, 'docs', 'CONTEXTO.md')), false);
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
      ['write', '✓ Seleccionando muestra\n'],
      ['write', '✓ Preparando prompt\n'],
      ['start', 'Ejecutando agente...'],
      ['stop', 'Agente finalizado', undefined],
      ['write', '✓ Escribiendo artifacts\n'],
      ['write', '✓ Validando schema\n'],
    ]);
  } finally {
    repo.cleanup();
  }
});

test('runAnalyzeProject shows linear progress without TTY during live provider execution', async () => {
  const repo = makeRepo({
    'README.md': '# Linear Progress Demo\n',
    'package.json': JSON.stringify({ name: 'linear-progress-demo' }, null, 2),
    'src/routes/users.ts': 'export const users = [];\n',
  });

  try {
    const { output } = await captureStdout(() => runAnalyzeProject(repo.root, {
      includeSource: true,
      provider: 'codex',
      providerExplicit: true,
      stdoutIsTTY: false,
      stdinIsTTY: false,
      stderrIsTTY: false,
      runProviderFn: async () => providerResult(validAnalysis(), { cwd: repo.root }),
    }));

    assert.match(output, /Analyzing project with codex/);
    assert.match(output, /Reading base docs/);
    assert.match(output, /Detecting structure/);
    assert.match(output, /Selecting sample/);
    assert.match(output, /Preparing prompt/);
    assert.match(output, /Running agent\.\.\./);
    assert.match(output, /Writing artifacts/);
    assert.match(output, /Validating schema/);
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

test('runAnalyzeProject rejects invalid provider JSON without writing final docs', async () => {
  const repo = makeRepo({
    'README.md': '# Invalid Provider\n',
    'package.json': JSON.stringify({ name: 'invalid-provider' }, null, 2),
    'src/routes/users.ts': 'export const users = [];\n',
  });

  try {
    let capturedError;
    await assert.rejects(
      captureStdout(() => runAnalyzeProject(repo.root, {
        includeSource: true,
        provider: 'codex',
        providerExplicit: true,
        runProviderFn: async () => providerResult('not json', { cwd: repo.root }),
      })),
      (error) => {
        capturedError = error;
        assert.match(error.message, /provider analysis output is not valid JSON/);
        return true;
      },
    );
    const validationManifest = assertValidationManifest(repo.root, capturedError);
    assertSelectedContextManifest(repo.root, `.quiver/runs/${validationManifest.run_id}/context/selected-context.json`);
    assert.equal(fs.existsSync(path.join(repo.root, 'docs')), false);
  } finally {
    repo.cleanup();
  }
});

test('runAnalyzeProject enriches evidence-not-selected failures with Spanish recovery guidance', async () => {
  const repo = makeRepo({
    'README.md': '# Recovery Demo\n',
    'package.json': JSON.stringify({ name: 'recovery-demo' }, null, 2),
    '.env.example': 'NEXT_PUBLIC_URL=https://example.com\n',
    'app/test/page.tsx': 'export default function TestPage() { return null }\n',
    'src/routes/users.ts': 'export const users = [];\n',
  });
  const invalidEvidenceAnalysis = JSON.stringify({
    schema_version: 1,
    kind: 'quiver-project-analysis',
    product: {
      name: { name: 'Recovery Demo', confidence: 'confirmed', evidence: ['README.md'] },
      type: { name: 'Web app', confidence: 'inferred', evidence: ['package.json'] },
      summary: 'Recovery demo.',
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
      backend: [],
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
    features: [],
    risks: [
      { name: 'Env example needs review', confidence: 'inferred', evidence: ['.env.example'] },
    ],
    questions: [
      { question: 'Is the test page intentional?', reason: 'Provider cited a test route.', evidence: ['app/test/page.tsx'] },
    ],
    claims: [],
    doc_updates: {
      'docs/CONTEXTO.md': '# Context\n',
    },
  });

  try {
    let capturedError;
    await assert.rejects(
      captureStdout(() => runAnalyzeProject(repo.root, {
        deep: true,
        language: 'es',
        maxAnalyzeProjectRetries: 0,
        model: 'gpt-5.5',
        provider: 'codex',
        providerExplicit: true,
        runProviderFn: async () => providerResult(invalidEvidenceAnalysis, { cwd: repo.root }),
      })),
      (error) => {
        capturedError = error;
        assert.equal(error.code, 'AI_ANALYZE_PROJECT_INVALID');
        assert.match(error.message, /Solucion recomendada/);
        assert.match(error.message, /Comando recomendado:/);
        assert.match(error.message, /--include-tests/);
        assert.match(error.message, /--provider codex --model gpt-5\.5 --lang es/);
        assert.ok(error.recovery);
        return true;
      },
    );

    assert.equal(capturedError.recovery.available, true);
    assert.equal(capturedError.recovery.classification.summary.metadata_only, 1);
    assert.equal(capturedError.recovery.classification.summary.safe_to_include, 1);
    const validationManifest = assertValidationManifest(repo.root, capturedError);
    assert.equal(validationManifest.recovery.available, true);
    assert.equal(validationManifest.recovery.command.includes('--include-tests'), true);
    assert.equal(validationManifest.recovery.classification.summary.metadata_only, 1);
    assert.equal(fs.existsSync(path.join(repo.root, 'docs')), false);
  } finally {
    repo.cleanup();
  }
});

test('runAnalyzeProject --json prints parseable recovery payload on evidence validation failure', async () => {
  const repo = makeRepo({
    'README.md': '# Recovery JSON Demo\n',
    'package.json': JSON.stringify({ name: 'recovery-json-demo' }, null, 2),
    'src/routes/users.ts': 'export const users = [];\n',
    'src/__tests__/users.test.ts': 'test("users", () => {});\n',
  });
  const invalidEvidenceAnalysis = JSON.stringify({
    schema_version: 1,
    kind: 'quiver-project-analysis',
    product: {
      name: { name: 'Recovery JSON Demo', confidence: 'confirmed', evidence: ['README.md'] },
      type: { name: 'Web app', confidence: 'inferred', evidence: ['package.json'] },
      summary: 'Recovery JSON demo.',
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
      backend: [],
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
    features: [
      { name: 'User tests', confidence: 'inferred', evidence: ['src/__tests__/users.test.ts'] },
    ],
    risks: [],
    questions: [],
    claims: [],
    doc_updates: {
      'docs/CONTEXTO.md': '# Context\n',
    },
  });

  try {
    let capturedError;
    let output = '';
    const original = process.stdout.write;
    process.stdout.write = (chunk) => {
      output += String(chunk);
      return true;
    };
    try {
      await assert.rejects(
        runAnalyzeProject(repo.root, {
          deep: true,
          json: true,
          maxAnalyzeProjectRetries: 0,
          model: 'gpt-5.5',
          provider: 'codex',
          providerExplicit: true,
          runProviderFn: async () => providerResult(invalidEvidenceAnalysis, { cwd: repo.root }),
        }),
        (error) => {
          capturedError = error;
          assert.equal(error.code, 'AI_ANALYZE_PROJECT_INVALID');
          return true;
        },
      );
    } finally {
      process.stdout.write = original;
    }
    const payload = JSON.parse(output);
    assert.equal(payload.kind, 'quiver-analyze-project-error');
    assert.equal(payload.ok, false);
    assert.equal(payload.recovery.available, true);
    assert.equal(payload.recovery.command.includes('--include-tests'), true);
    assert.equal(payload.manifests.validation.path, capturedError.validation_manifest.path);
  } finally {
    repo.cleanup();
  }
});

test('runAnalyzeProject --save-proposal rejects invalid final JSON without usable proposal artifacts', async () => {
  const repo = makeRepo({
    'README.md': '# Invalid Save Proposal\n',
    'package.json': JSON.stringify({ name: 'invalid-save-proposal' }, null, 2),
    'src/routes/users.ts': 'export const users = [];\n',
  });

  try {
    await assert.rejects(
      captureStdout(() => runAnalyzeProject(repo.root, {
        includeSource: true,
        saveProposal: true,
        provider: 'codex',
        providerExplicit: true,
        now: new Date('2026-06-12T12:36:00.000Z'),
        runProviderFn: async () => providerResult('not json', { cwd: repo.root }),
      })),
      /provider analysis output is not valid JSON/,
    );
    assertNoProposalArtifacts(repo.root);
    assert.equal(fs.existsSync(path.join(repo.root, 'docs')), false);
  } finally {
    repo.cleanup();
  }
});

test('runAnalyzeProject repairs nika-erp notes drift fixture and applies final docs', async () => {
  const repo = makeProviderFixtureRepo();

  try {
    const { result } = await captureStdout(() => runAnalyzeProject(repo.root, {
      includeSource: true,
      provider: 'codex',
      providerExplicit: true,
      runProviderFn: async () => providerResult(fixtureOutput('nika-erp-notes-drift'), { cwd: repo.root }),
    }));

    assert.equal(result.provider_execution, 'completed');
    assert.equal(result.analysis_validation.repaired, true);
    assert.equal(Object.hasOwn(result.analysis.domain.roles[0], 'notes'), false);
    assert.equal(Object.hasOwn(result.analysis.domain.entities[0], 'notes'), false);
    assert.equal(Object.hasOwn(result.analysis.domain.actions[0], 'notes'), false);
    const repair = assertRepairManifest(repo.root, result.analysis_validation.repair_manifest);
    assert.equal(repair.entry_count, 3);
    assert.deepEqual(
      repair.entries.map((entry) => `${entry.path}:${entry.key}:${entry.action}`).sort(),
      [
        'domain.actions.0:notes:removed',
        'domain.entities.0:notes:removed',
        'domain.roles.0:notes:removed',
      ],
    );
    assertSelectedContextManifest(repo.root, result.selected_context_manifest);
    assert.equal(result.apply_docs, true);
    assert.equal(result.post_write_validation.ok, true);
    assert.equal(fs.existsSync(path.join(repo.root, 'docs', 'CONTEXTO.md')), true);
  } finally {
    repo.cleanup();
  }
});

test('runAnalyzeProject nika-erp style fixture replaces visible scaffold and reports name conflicts', async () => {
  const repo = makeRepo({
    'README.md': '# StockFlow\n\nInventory management app.\n',
    'package.json': JSON.stringify({ name: 'stockflow' }, null, 2),
    'app/layout.tsx': 'export const metadata = { title: "StockFlow" };\n',
    'src/context/ProductContext.tsx': 'export const ProductContext = null;\n',
    'docs/CONTEXTO.md': [
      '---',
      'purpose: "Human-readable project overview"',
      'last_updated: "2026-06-17"',
      '---',
      '',
      '# Contexto de NIKA_ERP',
      '',
      '## Que es NIKA_ERP?',
      '',
      '[Uno o dos parrafos que expliquen el proyecto.]',
      '',
      '## Propuesta de valor',
      '',
      '> "[Frase principal del proyecto]"',
      '',
      '<!-- quiver:context-prep:start -->',
      '# stockflow Context',
      '',
      '[One or two paragraphs that explain the project.]',
      '',
      '## Context Preparation Notes',
      '- TODO: confirm any repo fact.',
      '<!-- quiver:context-prep:end -->',
      '',
    ].join('\n'),
    'docs/PROJECT_MAP.md': [
      '# Project Map',
      '',
      '<!-- quiver:analyze-project:start -->',
      '# Project Map',
      'Product: NIKA_ERP',
      'Stack: Next.js',
      '<!-- quiver:analyze-project:end -->',
      '',
    ].join('\n'),
  });
  const analysis = {
    schema_version: 1,
    kind: 'quiver-project-analysis',
    product: {
      name: { name: 'StockFlow', confidence: 'confirmed', evidence: ['app/layout.tsx', 'package.json'] },
      type: { name: 'Inventory web app', confidence: 'inferred', evidence: ['README.md', 'src/context/ProductContext.tsx'] },
      summary: 'StockFlow manages products, purchases, sales, suppliers, movements, and inventory reporting.',
      claims: [],
    },
    domain: {
      roles: [{ name: 'authenticated inventory user', confidence: 'inferred', evidence: ['src/context/ProductContext.tsx'] }],
      entities: [{ name: 'products', confidence: 'confirmed', evidence: ['src/context/ProductContext.tsx'] }],
      actions: [{ name: 'manage inventory', confidence: 'inferred', evidence: ['README.md'] }],
      flows: [],
      incomplete_or_suspicious: [],
      claims: [],
    },
    architecture: {
      frontend: [{ name: 'Next.js app router', confidence: 'confirmed', evidence: ['app/layout.tsx'] }],
      backend: [],
      auth: [],
      persistence: [],
      integrations: [],
      state: [{ name: 'ProductContext', confidence: 'confirmed', evidence: ['src/context/ProductContext.tsx'] }],
      api: [],
      testing: [],
      deploy: [],
      risks: [{ claim: 'Project naming conflicts between NIKA_ERP, stockflow, and StockFlow require confirmation.', confidence: 'confirmed', evidence: ['docs/CONTEXTO.md', 'package.json', 'app/layout.tsx'] }],
      claims: [],
    },
    features: [{ name: 'Inventory management', confidence: 'inferred', evidence: ['README.md', 'src/context/ProductContext.tsx'] }],
    risks: [{ claim: 'Name conflict needs human confirmation.', confidence: 'confirmed', evidence: ['docs/CONTEXTO.md', 'package.json', 'app/layout.tsx'] }],
    questions: [],
    claims: [],
    doc_updates: {
      'docs/CONTEXTO.md': [
        '# Contexto de StockFlow',
        '',
        'Product: StockFlow',
        '',
        'StockFlow gestiona productos, compras, ventas, proveedores, movimientos y reportes de inventario.',
        '',
        '## Riesgos',
        '',
        '- Confirmar nombre canonico entre NIKA_ERP, stockflow y StockFlow.',
        '',
      ].join('\n'),
      'docs/PROJECT_MAP.md': [
        '# Project Map',
        '',
        'Product: NIKA_ERP',
        'Stack: Next.js',
        '',
      ].join('\n'),
      'docs/ARCHITECTURE.md': '# Architecture\n\nFrontend: Next.js app router.\nState: ProductContext.\n',
    },
  };

  try {
    const { output, result } = await captureStdout(() => runAnalyzeProject(repo.root, {
      includeSource: true,
      includeDb: true,
      provider: 'codex',
      providerExplicit: true,
      runProviderFn: async () => providerResult(JSON.stringify(analysis), { cwd: repo.root }),
    }));

    const context = fs.readFileSync(path.join(repo.root, 'docs/CONTEXTO.md'), 'utf8');
    assert.equal(result.apply_docs, true);
    assert.equal(result.post_write_validation.ok, true);
    assert.ok(result.post_write_validation.warnings.some((issue) => issue.issue === 'deterministic-doc-conflict'));
    assert.match(output, /Merge decisions:/);
    assert.match(output, /replace-scaffold-primary-content/);
    assert.match(output, /context-prep removed/);
    assert.match(output, /deterministic-doc-conflict/);
    assert.match(context, /StockFlow gestiona productos/);
    assert.doesNotMatch(context, /\[Uno o dos parrafos/);
    assert.doesNotMatch(context, /\[One or two paragraphs/);
    assert.doesNotMatch(context, /quiver:context-prep:start/);
    assert.equal(fs.existsSync(path.join(repo.root, 'docs/ARCHITECTURE.md')), true);
  } finally {
    repo.cleanup();
  }
});

test('runAnalyzeProject repairs claim-name and question confidence drift fixtures and applies final docs', async () => {
  for (const [fixtureName, expectedEntry] of [
    ['claim-name-drift', 'domain.entities.0:claim:name:mapped'],
    ['question-confidence-drift', 'questions.0:confidence::removed'],
  ]) {
    const repo = makeProviderFixtureRepo();

    try {
      const { result } = await captureStdout(() => runAnalyzeProject(repo.root, {
        includeSource: true,
        provider: 'codex',
        providerExplicit: true,
        runProviderFn: async () => providerResult(fixtureOutput(fixtureName), { cwd: repo.root }),
      }));

      assert.equal(result.provider_execution, 'completed');
      assert.equal(result.analysis_validation.repaired, true);
      const repair = assertRepairManifest(repo.root, result.analysis_validation.repair_manifest);
      const entries = repair.entries.map((entry) => [
        entry.path,
        entry.key || entry.source_key,
        entry.target_key || '',
        entry.action,
      ].join(':'));
      assert.ok(entries.includes(expectedEntry), `expected repair entry ${expectedEntry}`);
      assertSelectedContextManifest(repo.root, result.selected_context_manifest);
      assert.equal(result.apply_docs, true);
      assert.equal(result.post_write_validation.ok, true);
      assert.equal(fs.existsSync(path.join(repo.root, 'docs', 'CONTEXTO.md')), true);
    } finally {
      repo.cleanup();
    }
  }
});

for (const [name, parseSource] of [
  ['fenced-json', 'fenced-json'],
  ['surrounding-text', 'embedded-json'],
]) {
  test(`runAnalyzeProject accepts ${name} provider fixture output and applies final docs`, async () => {
    const repo = makeProviderFixtureRepo();

    try {
      const { result } = await captureStdout(() => runAnalyzeProject(repo.root, {
        includeSource: true,
        provider: 'codex',
        providerExplicit: true,
        runProviderFn: async () => providerResult(fixtureOutput(name), { cwd: repo.root }),
      }));

      assert.equal(result.provider_execution, 'completed');
      assert.equal(result.analysis.kind, 'quiver-project-analysis');
      assert.equal(result.analysis_validation.parse_source, parseSource);
      assertSelectedContextManifest(repo.root, result.selected_context_manifest);
      assert.equal(result.apply_docs, true);
      assert.equal(result.post_write_validation.ok, true);
      assert.equal(fs.existsSync(path.join(repo.root, 'docs', 'CONTEXTO.md')), true);
    } finally {
      repo.cleanup();
    }
  });
}

for (const [name, expectedMessage] of [
  ['truncated-json', /provider analysis output is not valid JSON/],
  ['missing-required-fields', /domain\.entities\.0\.name/],
  ['invalid-confidence', /product\.name\.confidence/],
]) {
  test(`runAnalyzeProject rejects ${name} provider fixture without writing final docs`, async () => {
    const repo = makeProviderFixtureRepo();

    try {
      let capturedError;
      await assert.rejects(
        captureStdout(() => runAnalyzeProject(repo.root, {
          includeSource: true,
          provider: 'codex',
          providerExplicit: true,
          runProviderFn: async () => providerResult(fixtureOutput(name), { cwd: repo.root }),
        })),
        (error) => {
          capturedError = error;
          assert.equal(error.code, 'AI_ANALYZE_PROJECT_INVALID');
          assert.match(error.message, expectedMessage);
          return true;
        },
      );
      const validationManifest = assertValidationManifest(repo.root, capturedError);
      assertSelectedContextManifest(repo.root, `.quiver/runs/${validationManifest.run_id}/context/selected-context.json`);
      assert.equal(fs.existsSync(path.join(repo.root, 'docs')), false);
    } finally {
      repo.cleanup();
    }
  });
}

test('runAnalyzeProject redacts secret-like provider output fixture before artifact exposure', async () => {
  const repo = makeProviderFixtureRepo();

  try {
    const { result } = await captureStdout(() => runAnalyzeProject(repo.root, {
      includeSource: true,
      provider: 'codex',
      providerExplicit: true,
      runProviderFn: async () => providerResult(fixtureOutput('secret-like-output'), { cwd: repo.root }),
    }));

    assert.equal(result.provider_execution, 'completed');
    assert.equal(result.analysis.kind, 'quiver-project-analysis');
    assert.equal(result.provider_artifact.redacted, true);
    assert.equal(result.provider_artifact.output.includes('fixture-secret-token'), false);
    assert.match(result.provider_artifact.output, /\[REDACTED\]/);
    assertSelectedContextManifest(repo.root, result.selected_context_manifest);
    assert.equal(result.apply_docs, true);
    assert.equal(result.post_write_validation.ok, true);
    assert.equal(fs.existsSync(path.join(repo.root, 'docs', 'CONTEXTO.md')), true);
  } finally {
    repo.cleanup();
  }
});

test('provider retry fixtures define recoverable and exhausted attempt sequences', () => {
  const retrySuccess = fixtureCase('retry-success');
  const retryExhausted = fixtureCase('retry-exhausted');

  assert.equal(retrySuccess.attempts.length, 2);
  assert.equal(retryExhausted.attempts.length, 2);

  assert.throws(
    () => parseAnalyzeProjectOutput(fixtureOutput(retrySuccess.attempts[0]), providerFixtureParserOptions()),
    /provider analysis JSON does not match the required schema/,
  );
  assert.doesNotThrow(
    () => parseAnalyzeProjectOutput(fixtureOutput(retrySuccess.attempts[1]), providerFixtureParserOptions()),
  );

  for (const attempt of retryExhausted.attempts) {
    assert.throws(
      () => parseAnalyzeProjectOutput(fixtureOutput(attempt), providerFixtureParserOptions()),
      /provider analysis JSON does not match the required schema/,
    );
  }
});

test('runAnalyzeProject retries retryable schema drift once and succeeds', async () => {
  const repo = makeProviderFixtureRepo();
  const retrySuccess = fixtureCase('retry-success');
  const prompts = [];

  try {
    const { result } = await captureStdout(() => runAnalyzeProject(repo.root, {
      includeSource: true,
      provider: 'codex',
      providerExplicit: true,
      runProviderFn: async (provider, options) => {
        prompts.push(options.prompt);
        return providerResult(fixtureOutput(retrySuccess.attempts[prompts.length - 1]), { cwd: repo.root });
      },
    }));

    assert.equal(result.provider_execution, 'completed');
    assert.equal(result.analysis_validation.retry_count, 1);
    assert.equal(result.provider_attempts.length, 2);
    assert.equal(prompts.length, 2);
    assert.match(prompts[1], /Schema feedback:/);
    assert.doesNotMatch(prompts[1], /Selected file contents:/);
    const retry = assertRetryManifest(repo.root, result.analysis_validation.retry_manifest);
    assert.equal(retry.final_status, 'valid');
    assert.equal(retry.attempts[0].status, 'invalid');
    assert.equal(retry.attempts[1].status, 'valid');
    assert.equal(result.apply_docs, true);
    assert.equal(result.post_write_validation.ok, true);
    assert.equal(fs.existsSync(path.join(repo.root, 'docs', 'CONTEXTO.md')), true);
  } finally {
    repo.cleanup();
  }
});

test('runAnalyzeProject fails safely after default retry exhaustion', async () => {
  const repo = makeProviderFixtureRepo();
  const retryExhausted = fixtureCase('retry-exhausted');
  let calls = 0;

  try {
    let capturedError;
    await assert.rejects(
      captureStdout(() => runAnalyzeProject(repo.root, {
        includeSource: true,
        provider: 'codex',
        providerExplicit: true,
        runProviderFn: async () => {
          const attempt = retryExhausted.attempts[Math.min(calls, retryExhausted.attempts.length - 1)];
          calls += 1;
          return providerResult(fixtureOutput(attempt), { cwd: repo.root });
        },
      })),
      (error) => {
        capturedError = error;
        assert.equal(error.code, 'AI_ANALYZE_PROJECT_INVALID');
        assert.match(error.message, /Retry manifest: \.quiver\/runs\/run-/);
        assert.match(error.message, /Validation manifest: \.quiver\/runs\/run-/);
        return true;
      },
    );

    assert.equal(calls, 2);
    const retry = assertRetryManifest(repo.root, capturedError.retry_manifest);
    assert.equal(retry.final_status, 'invalid');
    assert.equal(retry.retry_count, 1);
    assert.equal(retry.max_retries, 1);
    assertValidationManifest(repo.root, capturedError);
    assert.equal(fs.existsSync(path.join(repo.root, 'docs')), false);
  } finally {
    repo.cleanup();
  }
});

test('runAnalyzeProject caps retries at two even when configured higher', async () => {
  const repo = makeProviderFixtureRepo();
  let calls = 0;

  try {
    let capturedError;
    await assert.rejects(
      captureStdout(() => runAnalyzeProject(repo.root, {
        includeSource: true,
        provider: 'codex',
        providerExplicit: true,
        maxAnalyzeProjectRetries: 99,
        runProviderFn: async () => {
          calls += 1;
          return providerResult(fixtureOutput('invalid-confidence'), { cwd: repo.root });
        },
      })),
      (error) => {
        capturedError = error;
        assert.equal(error.code, 'AI_ANALYZE_PROJECT_INVALID');
        return true;
      },
    );

    assert.equal(calls, 3);
    const retry = assertRetryManifest(repo.root, capturedError.retry_manifest);
    assert.equal(retry.max_retries, 2);
    assert.equal(retry.retry_count, 2);
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
    let capturedError;
    await assert.rejects(
      captureStdout(() => runAnalyzeProject(repo.root, {
        includeSource: true,
        provider: 'codex',
        providerExplicit: true,
        runProviderFn: async () => providerResult(invalidAnalysis, { cwd: repo.root }),
      })),
      (error) => {
        capturedError = error;
        assert.equal(error.code, 'AI_ANALYZE_PROJECT_INVALID');
        assert.match(error.message, /provider analysis JSON does not match the required schema/);
        assert.match(error.message, /Issues:/);
        assert.match(error.message, /product\.name\.confidence/);
        assert.match(error.message, /Cause:/);
        assert.match(error.message, /Validation manifest: \.quiver\/runs\/run-/);
        assert.match(error.message, /Next safe step:/);
        assert.ok(Array.isArray(error.details));
        return true;
      },
    );
    const validationManifest = assertValidationManifest(repo.root, capturedError);
    assertSelectedContextManifest(repo.root, `.quiver/runs/${validationManifest.run_id}/context/selected-context.json`);
    assert.equal(fs.existsSync(path.join(repo.root, 'docs')), false);
  } finally {
    repo.cleanup();
  }
});

test('runAnalyzeProject rejects provider failure without writing final docs', async () => {
  const repo = makeRepo({
    'README.md': '# Provider Failure\n',
    'package.json': JSON.stringify({ name: 'provider-failure' }, null, 2),
  });

  try {
    let output = '';
    await assert.rejects(
      () => runAnalyzeProject(repo.root, {
        provider: 'codex',
        providerExplicit: true,
        write: (text) => {
          output += String(text);
        },
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
      }),
      /ai analyze-project failed: provider failed/,
    );
    assert.match(output, /Agent failed/);
    const contextManifest = assertOnlySelectedContextAudit(repo.root);
    const runRoot = path.join(repo.root, '.quiver', 'runs', contextManifest.run_id);
    const rawDir = path.join(runRoot, 'raw');
    assert.equal(fs.existsSync(rawDir), true);
    assert.equal(fs.readdirSync(rawDir).length, 1);
    const status = JSON.parse(fs.readFileSync(path.join(runRoot, 'status.json'), 'utf8'));
    assert.equal(status.status, 'failed');
    assert.equal(status.artifacts.raw_provider.length, 1);
    assert.equal(fs.existsSync(path.join(repo.root, 'docs')), false);
  } finally {
    repo.cleanup();
  }
});
