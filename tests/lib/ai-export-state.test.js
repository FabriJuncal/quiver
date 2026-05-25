const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  collectLifecycleExport,
  formatLifecycleExportMarkdown,
  formatLifecycleInspect,
  formatSlicesList,
  formatSpecsList,
  formatTraceReport,
} = require('../../src/create-quiver/lib/ai/export-state');
const { createAiRun, updateAiRunPhase } = require('../../src/create-quiver/lib/ai/run-state');
const { setAgentProfile } = require('../../src/create-quiver/lib/agent-profiles');

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-export-state-'));
  seedNewLayout(root);
  writeJson(root, 'specs/demo/slices/slice-00-foundation/slice.json', {
    slice_id: 'slice-00-foundation',
    title: 'Foundation',
    status: 'completed',
    files: ['specs/demo/**'],
  });
  writeJson(root, 'specs/demo/slices/slice-01-viewer/slice.json', {
    slice_id: 'slice-01-viewer',
    title: 'Viewer',
    status: 'planned',
    files: ['src/create-quiver/**', 'docs/**'],
    depends_on: ['slice-00-foundation'],
    parallel_safe: 'yes',
    allowed_write_paths: ['src/create-quiver/**'],
    expected_read_paths: ['docs/INDEX.md'],
    validation_hints: ['node --test tests/**/*.test.js'],
  });
  fs.writeFileSync(path.join(root, 'requirements.md'), '# Requirement\n');
  createAiRun(root, { input: 'requirements.md', runId: 'run-demo' });
  setAgentProfile(root, 'planner', { provider: 'codex', model: 'gpt-demo' });

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
  writeFile(root, 'docs/INDEX.md', '# Index\n');
  writeFile(root, 'specs/demo/SPEC.md', '# Demo Spec\n');
  writeFile(root, 'specs/demo/STATUS.md', '# Status\n');
  writeFile(root, 'specs/demo/pr.md', '# PR\n');
  writeJson(root, '.quiver/state.json', {
    initialized_version: '0.12.0',
    last_initialized_at: '2026-05-22T00:00:00.000Z',
  });
  writeJson(root, '.quiver/config.json', { layout_version: 1 });
  writeFile(root, '.quiver/.gitignore', 'cache/\nevidence/\nlocks/\nruns/\nworktrees/\n');
}

test('collectLifecycleExport exposes dashboard-friendly specs, slices, runs, and agents', () => {
  const repo = makeRepo();

  try {
    const report = collectLifecycleExport(repo.root);
    const slice = report.slices.find((item) => item.ref === 'demo/slice-01-viewer');

    assert.equal(report.schema_version, 2);
    assert.equal(report.source_metadata.resolver, 'project-state-resolver');
    assert.equal(report.source_metadata.include_completed, false);
    assert.equal(report.project.name, 'demo-project');
    assert.equal(report.summary.specs, 1);
    assert.equal(report.summary.slices, 1);
    assert.equal(report.summary.configured_agents, 1);
    assert.equal(report.summary.approvals, 3);
    assert.equal(Array.isArray(report.warnings), true);
    assert.equal(Array.isArray(report.approvals), true);
    assert.equal(Array.isArray(report.evidence), true);
    assert.equal(Array.isArray(report.next_steps), true);
    assert.equal(report.lifecycle.phase, 'created');
    assert.equal(report.aggregates.slices_by_status.planned, 1);
    assert.equal(report.runs[0].run_id, 'run-demo');
    assert.equal(report.runs[0].canonical_status, 'running');
    assert.deepEqual(slice.dependencies, ['demo/slice-00-foundation']);
    assert.equal(slice.canonical_status, 'planned');
    assert.deepEqual(slice.allowed_write_paths, ['src/create-quiver/**']);
    assert.equal(report.graph.ok, true);
    assert(report.dashboard.dependencies.some((edge) => edge.to === 'demo/slice-01-viewer'));
    assert.equal(report.migration.layout, 'new');
  } finally {
    repo.cleanup();
  }
});

test('lifecycle export formatters produce human-readable inspection and markdown', () => {
  const repo = makeRepo();

  try {
    const report = collectLifecycleExport(repo.root);

    assert.match(formatLifecycleInspect(report), /Quiver lifecycle inspect/);
    assert.match(formatSpecsList(report), /demo: planned/);
    assert.match(formatSlicesList(report), /demo\/slice-01-viewer: planned/);
    assert.match(formatTraceReport(report), /Quiver trace report/);
    assert.match(formatLifecycleExportMarkdown(report), /# Quiver Lifecycle Export/);
    assert.match(formatLifecycleExportMarkdown(report), /\| demo\/slice-01-viewer \| planned \|/);
  } finally {
    repo.cleanup();
  }
});

test('lifecycle inspect prefers existing spec commands over stale spec create guidance', () => {
  const repo = makeRepo();

  try {
    updateAiRunPhase(repo.root, 'run-demo', 'technical-plan-approved', {
      command: 'test',
    });

    const report = collectLifecycleExport(repo.root);
    const commands = report.next_steps.map((step) => step.command);
    const inspect = formatLifecycleInspect(report);

    assert(commands.some((command) => command === 'npx create-quiver spec validate specs/demo'));
    assert(commands.some((command) => command === 'npx create-quiver next --all-ready'));
    assert(commands.some((command) => command === 'npx create-quiver ai prompt-slice --slice specs/demo/slices/slice-01-viewer/slice.json'));
    assert(!commands.some((command) => command === 'npx create-quiver spec create --dry-run'));
    assert.match(inspect, /Active slice state/);
    assert.equal(typeof report.summary.active_slice_sources, 'number');
    assert.equal(report.active_slice.reconciliation.decision, 'preserve');
  } finally {
    repo.cleanup();
  }
});
