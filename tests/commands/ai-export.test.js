const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-export-cli-'));
  seedNewLayout(root);
  writeJson(root, 'specs/demo/slices/slice-00-foundation/slice.json', {
    slice_id: 'slice-00-foundation',
    title: 'Foundation',
    status: 'completed',
    files: ['specs/demo/**'],
  });
  writeJson(root, 'specs/demo/slices/slice-01-dashboard/slice.json', {
    slice_id: 'slice-01-dashboard',
    title: 'Dashboard',
    status: 'planned',
    files: ['src/**'],
    depends_on: ['slice-00-foundation'],
    blocked_reason: null,
  });
  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function writeFile(root, relativePath, content = '') {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function writeJson(root, relativePath, data) {
  writeFile(root, relativePath, `${JSON.stringify(data, null, 2)}\n`);
}

function seedNewLayout(root) {
  writeJson(root, 'package.json', { name: 'demo-project', scripts: {} });
  writeFile(root, 'README.md', '# Demo\n');
  writeFile(root, 'AGENTS.md', 'Purpose\n\n## Reading Budget\n## Reading Order\n## Output Policy\n## Slice Execution Rules\n## Links\n');
  writeFile(root, 'docs/AI_CONTEXT.md', '# AI Context\n');
  writeFile(root, 'docs/AI_ONBOARDING_PROMPT.md', '# Prompt\n');
  writeFile(root, 'docs/COMMANDS.md', '# Commands\n');
  writeFile(root, 'docs/WORKFLOW.md', '# Workflow\n');
  writeFile(root, 'specs/demo/SPEC.md', '# Demo Spec\n');
  writeFile(root, 'specs/demo/STATUS.md', '# Status\n');
  writeJson(root, '.quiver/state.json', {
    initialized_version: '0.12.0',
    last_initialized_at: '2026-05-22T00:00:00.000Z',
  });
  writeJson(root, '.quiver/config.json', { layout_version: 1 });
  writeFile(root, '.quiver/.gitignore', 'cache/\nevidence/\nlocks/\nruns/\nworktrees/\n');
}

function execAi(repoRoot, args = []) {
  return execFileSync(process.execPath, [BIN_PATH, 'ai', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function execCli(repoRoot, args = []) {
  return execFileSync(process.execPath, [BIN_PATH, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

test('ai inspect, export, specs, slices, and trace expose lifecycle state', () => {
  const repo = makeRepo();

  try {
    const inspect = execAi(repo.root, ['inspect']);
    assert.match(inspect, /Quiver lifecycle inspect/);
    assert.match(inspect, /npx create-quiver ai export --format json/);

    const json = JSON.parse(execAi(repo.root, ['export']));
    assert.equal(json.schema_version, 2);
    assert.equal(json.source_metadata.command, 'ai export');
    assert.equal(json.source_metadata.resolver, 'project-state-resolver');
    assert.equal(json.project.name, 'demo-project');
    assert.equal(json.slices[0].ref, 'demo/slice-01-dashboard');
    assert.equal(json.slices[0].canonical_status, 'planned');
    assert.equal(Array.isArray(json.approvals), true);
    assert.equal(Array.isArray(json.next_steps), true);
    assert.equal(Array.isArray(json.warnings), true);
    assert.equal(typeof json.aggregates, 'object');
    assert.equal(typeof json.lifecycle, 'object');
    assert.equal(Array.isArray(json.dashboard.dependencies), true);

    const explicitJson = JSON.parse(execAi(repo.root, ['export', '--format', 'json']));
    assert.equal(explicitJson.schema_version, 2);

    const withCompleted = JSON.parse(execAi(repo.root, ['export', '--format', 'json', '--include-completed']));
    assert.deepEqual(withCompleted.slices.map((slice) => slice.ref), ['demo/slice-00-foundation', 'demo/slice-01-dashboard']);

    const markdown = execAi(repo.root, ['export', '--format', 'markdown']);
    assert.match(markdown, /# Quiver Lifecycle Export/);
    assert.match(markdown, /demo\/slice-01-dashboard/);

    const specs = execAi(repo.root, ['specs', 'list']);
    assert.match(specs, /Quiver specs list/);
    assert.match(specs, /demo: planned/);

    const slices = JSON.parse(execAi(repo.root, ['slices', 'list', '--json']));
    assert.equal(slices.slices[0].ref, 'demo/slice-01-dashboard');

    const trace = execAi(repo.root, ['trace', 'report']);
    assert.match(trace, /Quiver trace report/);
    assert.match(trace, /Migration/);
  } finally {
    repo.cleanup();
  }
});

test('ai inspection commands render Spanish human output without localizing JSON', () => {
  const repo = makeRepo();

  try {
    const inspect = execCli(repo.root, ['--lang', 'es', 'ai', 'inspect']);
    assert.match(inspect, /Inspeccion del ciclo de vida de Quiver/);
    assert.match(inspect, /Proximos comandos seguros/);
    assert.match(inspect, /npx create-quiver ai export --format json/);

    const specs = execCli(repo.root, ['--lang', 'es', 'ai', 'specs', 'list']);
    assert.match(specs, /Lista de specs de Quiver/);
    assert.match(specs, /demo: planificado/);

    const slices = execCli(repo.root, ['--lang', 'es', 'ai', 'slices', 'list']);
    assert.match(slices, /Lista de slices de Quiver/);
    assert.match(slices, /demo\/slice-01-dashboard: planificado/);

    const trace = execCli(repo.root, ['--lang', 'es', 'ai', 'trace', 'report']);
    assert.match(trace, /Reporte de trazas de Quiver/);
    assert.match(trace, /Migracion/);

    const markdown = execCli(repo.root, ['--lang', 'es', 'ai', 'export', '--format', 'markdown']);
    assert.match(markdown, /# Exportacion del ciclo de vida de Quiver/);
    assert.match(markdown, /\| Spec \| Estado \| Progreso \| Slices \| Ruta \|/);
    assert.match(markdown, /demo\/slice-01-dashboard/);

    const json = JSON.parse(execCli(repo.root, ['--lang', 'es', 'ai', 'export', '--format', 'json']));
    assert.equal(json.source_metadata.command, 'ai export');
    assert.equal(json.slices[0].canonical_status, 'planned');
  } finally {
    repo.cleanup();
  }
});

test('ai export rejects unsupported formats with a clear error', () => {
  const repo = makeRepo();

  try {
    assert.throws(
      () => execAi(repo.root, ['export', '--format', 'xml']),
      /unsupported ai export format: xml/,
    );
    assert.throws(
      () => execCli(repo.root, ['--lang', 'es', 'ai', 'export', '--format', 'xml']),
      /formato ai export no soportado: xml/,
    );
  } finally {
    repo.cleanup();
  }
});

test('ai export JSON writes parseable JSON to stdout and diagnostics to stderr', () => {
  const repo = makeRepo();

  try {
    const result = spawnSync(process.execPath, [BIN_PATH, 'ai', 'export', '--format', 'json'], {
      cwd: repo.root,
      encoding: 'utf8',
    });

    assert.equal(result.status, 0);
    assert.equal(result.stderr, '');
    assert.doesNotThrow(() => JSON.parse(result.stdout));

    const failed = spawnSync(process.execPath, [BIN_PATH, 'ai', 'export', '--format', 'xml'], {
      cwd: repo.root,
      encoding: 'utf8',
    });

    assert.notEqual(failed.status, 0);
    assert.equal(failed.stdout, '');
    assert.match(failed.stderr, /unsupported ai export format: xml/);
  } finally {
    repo.cleanup();
  }
});

test('ai active-slice reconcile dry-run reports conflicts without writing files', () => {
  const repo = makeRepo();
  writeFile(repo.root, 'docs/ai/ACTIVE_SLICE.md', [
    '# Active Slice',
    '',
    '## Slice ID',
    'slice-01-dashboard',
    '',
    '## Title',
    'Dashboard',
    '',
  ].join('\n'));
  writeFile(repo.root, 'ACTIVE_SLICES.md', [
    '| Alias | Spec | Slice | Branch | Estado | Path |',
    '| --- | --- | --- | --- | --- | --- |',
    '| foundation | demo | slice-00-foundation | main | completed | /tmp/foundation |',
    '',
  ].join('\n'));

  try {
    const output = execAi(repo.root, ['active-slice', 'reconcile', '--dry-run']);

    assert.match(output, /AI active-slice reconciliation/);
    assert.match(output, /Mode: dry-run/);
    assert.match(output, /Decision: blocked/);
    assert.match(output, /Conflicting refs: demo\/slice-01-dashboard, demo\/slice-00-foundation|Conflicting refs: demo\/slice-00-foundation, demo\/slice-01-dashboard/);
    assert.match(output, /No files were changed/);
  } finally {
    repo.cleanup();
  }
});

test('ai active-slice reconcile requires dry-run before writes exist', () => {
  const repo = makeRepo();

  try {
    assert.throws(
      () => execAi(repo.root, ['active-slice', 'reconcile']),
      /ai active-slice reconcile is dry-run first/,
    );
    assert.throws(
      () => execCli(repo.root, ['--lang', 'es', 'ai', 'active-slice', 'reconcile']),
      /ai active-slice reconcile es dry-run-first/,
    );
  } finally {
    repo.cleanup();
  }
});
