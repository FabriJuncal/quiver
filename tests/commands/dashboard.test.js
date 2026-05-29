const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-dashboard-cli-'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-dashboard-home-'));
  seedLayout(root);
  seedSlices(root);
  return {
    home,
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
      fs.rmSync(home, { recursive: true, force: true });
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

function seedLayout(root) {
  writeJson(root, 'package.json', { name: 'dashboard-cli-project', scripts: {} });
  writeFile(root, 'README.md', '# Dashboard CLI Project\n');
  writeFile(root, 'AGENTS.md', 'Purpose\n\n## Reading Budget\n## Reading Order\n## Output Policy\n## Slice Execution Rules\n## Links\n');
  writeFile(root, 'docs/AI_CONTEXT.md', '# AI Context\n');
  writeFile(root, 'docs/AI_ONBOARDING_PROMPT.md', '# Prompt\n');
  writeFile(root, 'docs/COMMANDS.md', '# Commands\n');
  writeFile(root, 'docs/WORKFLOW.md', '# Workflow\n');
  writeFile(root, 'specs/demo/SPEC.md', '# Demo Spec\n');
  writeFile(root, 'specs/demo/STATUS.md', '# Status\n');
  writeFile(root, 'specs/other/SPEC.md', '# Other Spec\n');
  writeFile(root, 'specs/other/STATUS.md', '# Status\n');
  writeJson(root, '.quiver/state.json', {
    initialized_version: '0.15.2',
    last_initialized_at: '2026-05-28T00:00:00.000Z',
  });
  writeJson(root, '.quiver/config.json', { layout_version: 1 });
  writeFile(root, '.quiver/.gitignore', 'cache/\nevidence/\nlocks/\nruns/\nworktrees/\n');
}

function seedSlices(root) {
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
    files: ['src/dashboard.js'],
    depends_on: ['slice-00-foundation'],
  });
  writeJson(root, 'specs/other/slices/slice-01-other/slice.json', {
    slice_id: 'slice-01-other',
    title: 'Other',
    status: 'planned',
    files: ['src/other.js'],
  });
}

function cleanEnv(home, overrides = {}) {
  return {
    ...process.env,
    HOME: home,
    QUIVER_LANG: '',
    LANG: 'en_US.UTF-8',
    ...overrides,
  };
}

function execDashboard(repoRoot, args = [], env = {}) {
  return execFileSync(process.execPath, [BIN_PATH, 'dashboard', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function spawnDashboard(repoRoot, args = [], env = {}) {
  return spawnSync(process.execPath, [BIN_PATH, 'dashboard', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env,
  });
}

test('dashboard human output shows consolidated project status', () => {
  const repo = makeRepo();
  try {
    const output = execDashboard(repo.root, ['--spec', 'demo'], cleanEnv(repo.home));

    assert.match(output, /Quiver Dashboard/);
    assert.match(output, /Project: dashboard-cli-project/);
    assert.match(output, /Global: 1\/3 completed/);
    assert.match(output, /Visible: 0\/1 completed/);
    assert.match(output, /demo\/slice-01-dashboard/);
    assert.match(output, /npx create-quiver start-slice "specs\/demo\/slices\/slice-01-dashboard\/slice.json"/);
  } finally {
    repo.cleanup();
  }
});

test('dashboard JSON output is parseable and stable', () => {
  const repo = makeRepo();
  try {
    const output = execDashboard(repo.root, ['--json', '--spec', 'demo'], cleanEnv(repo.home));
    const report = JSON.parse(output);

    assert.equal(report.dashboard_schema_version, 1);
    assert.equal(report.source_metadata.command, 'dashboard');
    assert.equal(report.source_metadata.spec_filter, 'demo');
    assert.equal(report.global_progress.total, 3);
    assert.equal(report.visible_progress.total, 1);
    assert.deepEqual(report.slices.map((slice) => slice.ref), ['demo/slice-01-dashboard']);
    assert.equal(report.next_ready.ref, 'demo/slice-01-dashboard');
  } finally {
    repo.cleanup();
  }
});

test('dashboard human output renders Spanish with flag or project config', () => {
  const repo = makeRepo();
  try {
    const flagged = execDashboard(repo.root, ['--lang', 'es', '--spec', 'demo'], cleanEnv(repo.home));
    writeJson(repo.root, '.quiver/config.json', { layout_version: 1, language: 'es' });
    const configured = execDashboard(repo.root, ['--spec', 'demo'], cleanEnv(repo.home));

    assert.match(flagged, /Dashboard de Quiver/);
    assert.match(flagged, /Proyecto: dashboard-cli-project/);
    assert.match(flagged, /Proximo comando seguro:/);
    assert.match(flagged, /Global: 1\/3 completado/);
    assert.match(configured, /Dashboard de Quiver/);
    assert.match(configured, /Proximo slice listo:/);
    assert.doesNotMatch(configured, /Project:/);
  } finally {
    repo.cleanup();
  }
});

test('dashboard --include-completed changes only the visible slice set', () => {
  const repo = makeRepo();
  try {
    const report = JSON.parse(execDashboard(repo.root, ['--json', '--spec', 'demo', '--include-completed'], cleanEnv(repo.home)));

    assert.equal(report.global_progress.total, 3);
    assert.equal(report.visible_progress.total, 2);
    assert.deepEqual(report.slices.map((slice) => slice.ref), ['demo/slice-00-foundation', 'demo/slice-01-dashboard']);
  } finally {
    repo.cleanup();
  }
});

test('dashboard keeps JSON error payloads stable with Spanish language', () => {
  const repo = makeRepo();
  try {
    const result = spawnDashboard(repo.root, ['--json', '--lang', 'es', '--spec', 'missing'], cleanEnv(repo.home));
    const payload = JSON.parse(result.stdout);

    assert.notEqual(result.status, 0);
    assert.equal(result.stderr, '');
    assert.equal(payload.error.code, 'SPEC_NOT_FOUND');
    assert.match(payload.error.message, /Spec "missing" was not found/);
    assert.doesNotMatch(payload.error.message, /No se encontro/);
  } finally {
    repo.cleanup();
  }
});

test('dashboard missing spec keeps JSON stdout parseable on failure', () => {
  const repo = makeRepo();
  try {
    const result = spawnDashboard(repo.root, ['--json', '--spec', 'missing'], cleanEnv(repo.home));
    const payload = JSON.parse(result.stdout);

    assert.notEqual(result.status, 0);
    assert.equal(result.stderr, '');
    assert.equal(payload.dashboard_schema_version, 1);
    assert.equal(payload.error.code, 'SPEC_NOT_FOUND');
    assert.match(payload.error.next_command, /ai specs list/);
  } finally {
    repo.cleanup();
  }
});

test('dashboard localized details and section views preserve exact commands', () => {
  const repo = makeRepo();
  try {
    const details = execDashboard(repo.root, ['--details', '--lang', 'es', '--spec', 'demo'], cleanEnv(repo.home));
    const slices = execDashboard(repo.root, ['--section', 'slices', '--limit', '1', '--lang', 'es'], cleanEnv(repo.home));

    assert.match(details, /\nProgreso\n/);
    assert.match(details, /Iniciar: npx create-quiver start-slice "specs\/demo\/slices\/slice-01-dashboard\/slice.json"/);
    assert.match(slices, /\+ 1 mas\. Ejecuta: npx create-quiver dashboard --section slices/);
    assert.doesNotMatch(details, /Start:/);
  } finally {
    repo.cleanup();
  }
});

test('dashboard supports details, section, and limit human views', () => {
  const repo = makeRepo();
  try {
    const details = execDashboard(repo.root, ['--details', '--spec', 'demo'], cleanEnv(repo.home));
    const slices = execDashboard(repo.root, ['--section', 'slices', '--limit', '1'], cleanEnv(repo.home));

    assert.match(details, /\nSpecs\n/);
    assert.match(details, /\nSlices\n/);
    assert.match(slices, /^Slices/);
    assert.match(slices, /demo\/slice-01-dashboard/);
    assert.match(slices, /\+ 1 more\. Run: npx create-quiver dashboard --section slices/);
    assert.doesNotMatch(slices, /\nAgents\n/);
  } finally {
    repo.cleanup();
  }
});

test('dashboard rejects ambiguous and invalid human flags', () => {
  const repo = makeRepo();
  try {
    const detailsSection = spawnDashboard(repo.root, ['--details', '--section', 'specs'], cleanEnv(repo.home));
    const invalidLimit = spawnDashboard(repo.root, ['--limit', '0'], cleanEnv(repo.home));

    assert.notEqual(detailsSection.status, 0);
    assert.match(detailsSection.stderr, /cannot be combined/);
    assert.notEqual(invalidLimit.status, 0);
    assert.match(invalidLimit.stderr, /integer from 1 to 100/);
  } finally {
    repo.cleanup();
  }
});

test('dashboard human-only flags keep JSON failures parseable', () => {
  const repo = makeRepo();
  try {
    const result = spawnDashboard(repo.root, ['--json', '--section', 'specs'], cleanEnv(repo.home));
    const payload = JSON.parse(result.stdout);

    assert.notEqual(result.status, 0);
    assert.equal(result.stderr, '');
    assert.equal(payload.error.code, 'INVALID_DASHBOARD_OPTIONS');
    assert.match(payload.error.message, /dashboard --json cannot be combined/);
  } finally {
    repo.cleanup();
  }
});

test('dashboard-only flags fail clearly outside dashboard command', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-dashboard-plan-home-'));
  const result = spawnSync(process.execPath, [BIN_PATH, 'plan', '--section', 'specs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: cleanEnv(home),
  });

  try {
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /--section is only supported by dashboard/);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test('dashboard reports graph errors without crashing JSON output', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-dashboard-cycle-'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-dashboard-cycle-home-'));
  try {
    seedLayout(root);
    writeJson(root, 'specs/demo/slices/slice-01-a/slice.json', {
      slice_id: 'slice-01-a',
      title: 'A',
      status: 'planned',
      depends_on: ['slice-02-b'],
      files: ['src/a.js'],
    });
    writeJson(root, 'specs/demo/slices/slice-02-b/slice.json', {
      slice_id: 'slice-02-b',
      title: 'B',
      status: 'planned',
      depends_on: ['slice-01-a'],
      files: ['src/b.js'],
    });

    const result = spawnSync(process.execPath, [BIN_PATH, 'dashboard', '--json', '--spec', 'demo'], {
      cwd: root,
      encoding: 'utf8',
      env: cleanEnv(home),
    });
    const report = JSON.parse(result.stdout);

    assert.equal(result.status, 0);
    assert.equal(result.stderr, '');
    assert.equal(report.graph.ok, false);
    assert.equal(report.next_ready, null);
    assert.equal(report.warnings.some((warning) => warning.code === 'CYCLE_DETECTED'), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
  }
});
