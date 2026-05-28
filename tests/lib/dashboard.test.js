const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  DashboardError,
  collectDashboardReport,
  formatHumanDashboard,
  normalizeDashboardOptions,
} = require('../../src/create-quiver/lib/dashboard');

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-dashboard-lib-'));
  seedLayout(root);
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

function seedLayout(root) {
  writeJson(root, 'package.json', { name: 'dashboard-project', scripts: {} });
  writeFile(root, 'README.md', '# Dashboard Project\n');
  writeFile(root, 'AGENTS.md', 'Purpose\n\n## Reading Budget\n## Reading Order\n## Output Policy\n## Slice Execution Rules\n## Links\n');
  writeFile(root, 'docs/AI_CONTEXT.md', '# AI Context\n');
  writeFile(root, 'docs/AI_ONBOARDING_PROMPT.md', '# Prompt\n');
  writeFile(root, 'docs/COMMANDS.md', '# Commands\n');
  writeFile(root, 'docs/WORKFLOW.md', '# Workflow\n');
  writeFile(root, 'specs/demo/SPEC.md', '# Demo Spec\n');
  writeFile(root, 'specs/demo/STATUS.md', '# Status\n');
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
    evidence: ['SECRET_TOKEN=do-not-leak'],
  });
  writeJson(root, 'specs/demo/slices/slice-01-dashboard/slice.json', {
    slice_id: 'slice-01-dashboard',
    title: 'Dashboard',
    status: 'planned',
    files: ['src/create-quiver/lib/dashboard.js'],
    depends_on: ['slice-00-foundation'],
  });
}

function stripAnsi(value) {
  return String(value).replace(/\u001b\[[0-9;]*m/g, '');
}

test('collectDashboardReport separates global progress from visible filtered progress', () => {
  const repo = makeRepo();
  try {
    seedSlices(repo.root);

    const report = collectDashboardReport(repo.root, { specSlug: 'demo' });

    assert.equal(report.dashboard_schema_version, 1);
    assert.equal(report.global_progress.total, 2);
    assert.equal(report.global_progress.completed, 1);
    assert.equal(report.visible_progress.total, 1);
    assert.equal(report.visible_progress.completed, 0);
    assert.deepEqual(report.slices.map((slice) => slice.ref), ['demo/slice-01-dashboard']);
    assert.equal(report.next_ready.ref, 'demo/slice-01-dashboard');
    assert.equal(report.next_ready.start_slice_command, 'npx create-quiver start-slice "specs/demo/slices/slice-01-dashboard/slice.json"');
  } finally {
    repo.cleanup();
  }
});

test('collectDashboardReport includes completed slices only when requested and never leaks evidence values', () => {
  const repo = makeRepo();
  try {
    seedSlices(repo.root);

    const report = collectDashboardReport(repo.root, {
      includeCompleted: true,
      specSlug: 'demo',
    });
    const serialized = JSON.stringify(report);

    assert.deepEqual(report.slices.map((slice) => slice.ref), ['demo/slice-00-foundation', 'demo/slice-01-dashboard']);
    assert.equal(report.evidence.count, 1);
    assert.deepEqual(report.evidence.slice_refs, ['demo/slice-00-foundation']);
    assert.equal(serialized.includes('SECRET_TOKEN'), false);
    assert.equal(serialized.includes('do-not-leak'), false);
  } finally {
    repo.cleanup();
  }
});

test('collectDashboardReport handles zero-slice specs', () => {
  const repo = makeRepo();
  try {
    const report = collectDashboardReport(repo.root, { specSlug: 'demo' });

    assert.equal(report.specs[0].slug, 'demo');
    assert.equal(report.visible_progress.total, 0);
    assert.equal(report.next_ready, null);
    assert.equal(report.warnings.some((warning) => warning.code === 'NO_VISIBLE_SLICES'), true);
  } finally {
    repo.cleanup();
  }
});

test('collectDashboardReport reports graph errors without throwing', () => {
  const repo = makeRepo();
  try {
    writeJson(repo.root, 'specs/demo/slices/slice-01-a/slice.json', {
      slice_id: 'slice-01-a',
      title: 'A',
      status: 'planned',
      depends_on: ['slice-02-b'],
      files: ['src/a.js'],
    });
    writeJson(repo.root, 'specs/demo/slices/slice-02-b/slice.json', {
      slice_id: 'slice-02-b',
      title: 'B',
      status: 'planned',
      depends_on: ['slice-01-a'],
      files: ['src/b.js'],
    });

    const report = collectDashboardReport(repo.root, { specSlug: 'demo' });

    assert.equal(report.graph.ok, false);
    assert.equal(report.next_ready, null);
    assert.equal(report.blockers.some((blocker) => blocker.ref === 'slice-graph'), true);
    assert.equal(report.warnings.some((warning) => warning.code === 'CYCLE_DETECTED'), true);
  } finally {
    repo.cleanup();
  }
});

test('collectDashboardReport rejects an explicit unknown spec', () => {
  const repo = makeRepo();
  try {
    assert.throws(
      () => collectDashboardReport(repo.root, { specSlug: 'missing' }),
      (error) => {
        assert.equal(error instanceof DashboardError, true);
        assert.equal(error.code, 'SPEC_NOT_FOUND');
        return true;
      },
    );
  } finally {
    repo.cleanup();
  }
});

test('formatHumanDashboard exposes the core dashboard sections', () => {
  const repo = makeRepo();
  try {
    seedSlices(repo.root);
    const output = formatHumanDashboard(collectDashboardReport(repo.root, { specSlug: 'demo' }));

    assert.match(output, /Quiver Dashboard/);
    assert.match(output, /Progress/);
    assert.match(output, /Next ready slice/);
    assert.match(output, /npx create-quiver start-slice/);
    assert.match(output, /Next safe command/);
  } finally {
    repo.cleanup();
  }
});

test('formatHumanDashboard keeps large default output compact and actionable', () => {
  const repo = makeRepo();
  try {
    seedSlices(repo.root);
    const report = collectDashboardReport(repo.root, { specSlug: 'demo' });
    report.blockers = Array.from({ length: 5 }, (_, index) => ({
      ref: `blocker-${index + 1}`,
      reason: `A long blocker reason that should be shortened for compact dashboard output ${index + 1}`.repeat(2),
    }));
    report.warnings = Array.from({ length: 5 }, (_, index) => ({
      code: `WARN_${index + 1}`,
      message: `A long warning message that should not force horizontal scrolling ${index + 1}`.repeat(2),
    }));
    report.summary.blockers = report.blockers.length;
    report.summary.warnings = report.warnings.length;

    const output = stripAnsi(formatHumanDashboard(report));
    const nonEmptyLines = output.split(/\r?\n/).filter((line) => line.trim()).length;

    assert.ok(nonEmptyLines <= 28, `expected <= 28 non-empty lines, got ${nonEmptyLines}\n${output}`);
    assert.match(output, /Next safe command:/);
    assert.match(output, /\+ 3 more\. Run: npx create-quiver dashboard --spec demo --section blockers/);
    assert.match(output, /\.\.\./);
  } finally {
    repo.cleanup();
  }
});

test('formatHumanDashboard supports details and section views', () => {
  const repo = makeRepo();
  try {
    seedSlices(repo.root);
    const report = collectDashboardReport(repo.root, { specSlug: 'demo' });
    const details = formatHumanDashboard(report, { details: true });
    const slices = formatHumanDashboard(report, { section: 'slices', limit: 1 });

    assert.match(details, /^Quiver Dashboard/);
    assert.match(details, /\nSpecs\n/);
    assert.match(details, /\nNext safe commands\n/);
    assert.match(slices, /^Slices/);
    assert.match(slices, /demo\/slice-01-dashboard/);
    assert.doesNotMatch(slices, /\nAgents\n/);
  } finally {
    repo.cleanup();
  }
});

test('normalizeDashboardOptions rejects ambiguous or invalid human flags', () => {
  assert.throws(
    () => normalizeDashboardOptions({ details: true, section: 'specs' }),
    /cannot be combined/,
  );
  assert.throws(
    () => normalizeDashboardOptions({ section: 'missing' }),
    /Supported sections:/,
  );
  assert.throws(
    () => normalizeDashboardOptions({ limit: '0' }),
    /integer from 1 to 100/,
  );
  assert.throws(
    () => normalizeDashboardOptions({ json: true, section: 'specs' }),
    /dashboard --json cannot be combined/,
  );
});
