const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  buildInitLayout,
  formatInitLayoutPlan,
  normalizeInitLayoutOptions,
  resolveInitPackageScripts,
  resolveInitProfile,
} = require('../../src/create-quiver/lib/init-layout');

function makeTmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-init-layout-test-'));
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

test('resolveInitProfile selects default, minimal, and full profiles', () => {
  assert.equal(resolveInitProfile(normalizeInitLayoutOptions({})), 'default');
  assert.equal(resolveInitProfile(normalizeInitLayoutOptions({ minimal: true })), 'minimal');
  assert.equal(resolveInitProfile(normalizeInitLayoutOptions({ full: true })), 'full');
});

test('normalizeInitLayoutOptions rejects mutually exclusive profiles', () => {
  assert.throws(
    () => normalizeInitLayoutOptions({ minimal: true, full: true }),
    /--minimal and --full are mutually exclusive/,
  );
});

test('buildInitLayout creates a default AI-first plan without legacy visible roots', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const plan = buildInitLayout(dir, { projectName: 'Mi Proyecto' });
    const createPaths = plan.operations.filter((operation) => operation.action === 'create').map((operation) => operation.path);

    assert.equal(plan.profile, 'default');
    assert.equal(plan.projectSlug, 'mi-proyecto');
    assert(createPaths.includes('README.md'));
    assert(createPaths.includes('AGENTS.md'));
    assert(createPaths.includes('.gitignore'));
    assert(createPaths.includes('.quiver/state.json'));
    assert(createPaths.includes('.quiver/config.json'));
    assert(createPaths.includes('.quiver/.gitignore'));
    assert(!createPaths.includes('docs-template'));
    assert(!createPaths.includes('tools/scripts'));
    assert(!createPaths.includes('specs/mi-proyecto'));
    assert(plan.ignoredPaths.includes('docs-template/'));
    assert(plan.ignoredPaths.includes('tools/scripts/'));
    assert(plan.ignoredPaths.includes('specs/mi-proyecto/'));
  } finally {
    cleanup();
  }
});

test('buildInitLayout reports preserved files instead of overwriting them', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    fs.writeFileSync(path.join(dir, 'README.md'), '# Existing\n');
    fs.writeFileSync(path.join(dir, '.gitignore'), 'custom.log\n');
    const plan = buildInitLayout(dir, { projectName: 'Existing Project' });
    const readmeOperation = plan.operations.find((operation) => operation.path === 'README.md');
    const gitignoreOperation = plan.operations.find((operation) => operation.path === '.gitignore');

    assert.equal(readmeOperation.action, 'preserve');
    assert.equal(readmeOperation.exists, true);
    assert.equal(gitignoreOperation.action, 'update');
    assert.equal(gitignoreOperation.exists, true);
  } finally {
    cleanup();
  }
});

test('buildInitLayout includes compatibility assets for full profile', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const plan = buildInitLayout(dir, { full: true, projectName: 'Full Project' });
    const createPaths = plan.operations.filter((operation) => operation.action === 'create').map((operation) => operation.path);

    assert.equal(plan.profile, 'full');
    assert(createPaths.includes('docs-template'));
    assert(createPaths.includes('tools/scripts'));
    assert(createPaths.includes('specs/full-project/slices/slice-template'));
    assert(createPaths.includes('specs/full-project/SPEC.md'));
  } finally {
    cleanup();
  }
});

test('buildInitLayout includes optional legacy scripts and template export only when requested', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const plan = buildInitLayout(dir, {
      includeTemplates: true,
      legacyScripts: true,
      projectName: 'Optional Project',
    });
    const createPaths = plan.operations.filter((operation) => operation.action === 'create').map((operation) => operation.path);

    assert(createPaths.includes('tools/scripts/start-slice.sh'));
    assert(createPaths.includes('tools/scripts/migrate-project.sh'));
    assert(createPaths.includes('.quiver/templates/'));
    assert(!plan.ignoredPaths.includes('.quiver/templates/'));
  } finally {
    cleanup();
  }
});

test('formatInitLayoutPlan prints core dry-run sections', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const output = formatInitLayoutPlan(buildInitLayout(dir, {
      compatibilityAlias: true,
      dryRun: true,
      projectName: 'Dry Run Project',
    }));

    assert.match(output, /Init dry-run plan/);
    assert.match(output, /Project: Dry Run Project/);
    assert.match(output, /Entry point: compatibility alias/);
    assert.match(output, /Files and directories to create/);
    assert.match(output, /Files to preserve/);
    assert.match(output, /Paths intentionally ignored by this profile/);
    assert.match(output, /dry-run prints the planned layout only/);
  } finally {
    cleanup();
  }
});

test('default generated package scripts target supported CLI commands', () => {
  const scripts = resolveInitPackageScripts('default');
  const supportedCommands = new Set([
    'ai',
    'analyze',
    'check-handoff',
    'check-pr',
    'check-scope',
    'check-slice',
    'cleanup-slice',
    'doctor',
    'evidence',
    'flow',
    'graph',
    'migrate',
    'next',
    'plan',
    'prepare',
    'refresh-active-slices',
    'spec',
    'start-slice',
  ]);
  const supportedAiCommands = new Set([
    'agent',
    'approve',
    'doctor',
    'execute-plan',
    'execute-slice',
    'export',
    'inspect',
    'onboard',
    'plan',
    'prepare-context',
    'pr',
    'prompt-slice',
    'review-plan',
    'revise',
    'resume',
    'run',
    'slices',
    'specs',
    'status',
    'trace',
  ]);
  const supportedSpecCommands = new Set(['close', 'create', 'start', 'status']);

  for (const [scriptName, command] of Object.entries(scripts)) {
    if (!command.startsWith('npx create-quiver ')) {
      continue;
    }

    const [, commandName, subcommand] = command.match(/^npx create-quiver\s+(\S+)(?:\s+(\S+))?/) || [];
    assert.ok(supportedCommands.has(commandName), `${scriptName} points to unsupported command: ${command}`);

    if (commandName === 'ai') {
      assert.ok(supportedAiCommands.has(subcommand), `${scriptName} points to unsupported ai command: ${command}`);
    }

    if (commandName === 'spec') {
      assert.ok(supportedSpecCommands.has(subcommand), `${scriptName} points to unsupported spec command: ${command}`);
    }
  }
});
