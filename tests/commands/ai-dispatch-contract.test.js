const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeFile(root, relativePath, content = '') {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function writeJson(root, relativePath, data) {
  writeFile(root, relativePath, `${JSON.stringify(data, null, 2)}\n`);
}

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-dispatch-contract-'));
  writeFile(root, 'requirements.md', '# Requirement\n');
  writeFile(root, 'README.md', '# Dispatch Contract\n');
  writeFile(root, 'AGENTS.md', 'Purpose\n\n## Reading Budget\n## Reading Order\n## Output Policy\n## Slice Execution Rules\n## Links\n');
  writeFile(root, 'docs/AI_CONTEXT.md', '# AI Context\n');
  writeFile(root, 'docs/AI_ONBOARDING_PROMPT.md', '# Prompt\n');
  writeFile(root, 'docs/COMMANDS.md', '# Commands\n');
  writeFile(root, 'docs/WORKFLOW.md', '# Workflow\n');
  writeFile(root, 'specs/demo/SPEC.md', '# Demo Spec\n');
  writeFile(root, 'specs/demo/STATUS.md', '# Status\n');
  writeJson(root, '.quiver/state.json', {
    initialized_version: '0.15.4',
    last_initialized_at: '2026-05-31T00:00:00.000Z',
  });
  writeJson(root, '.quiver/config.json', { layout_version: 1 });
  writeFile(root, '.quiver/.gitignore', 'cache/\nevidence/\nlocks/\nruns/\nworktrees/\n');
  writeJson(root, 'specs/demo/slices/slice-00-foundation/slice.json', {
    slice_id: 'slice-00-foundation',
    title: 'Foundation',
    status: 'completed',
    files: ['specs/demo/**'],
  });
  writeJson(root, 'specs/demo/slices/slice-01-dispatch/slice.json', {
    slice_id: 'slice-01-dispatch',
    ticket: 'QUIVER-48-01',
    type: 'test',
    title: 'Dispatch',
    objective: 'Protect AI dispatch behavior.',
    status: 'planned',
    files: ['src/app.js'],
    acceptance: ['Dispatch behavior remains stable.'],
    tests: ['node --test tests/commands/ai-dispatch-contract.test.js'],
    depends_on: ['slice-00-foundation'],
  });
  writeFile(root, 'specs/demo/slices/slice-01-dispatch/EXECUTION_BRIEF.md', '# Execution Brief\n');
  writeFile(root, 'specs/demo/slices/slice-01-dispatch/CLOSURE_BRIEF.md', '# Closure Brief\n');
  writeFile(root, 'src/app.js', 'module.exports = 1;\n');
  return {
    root,
    slicePath: 'specs/demo/slices/slice-01-dispatch/slice.json',
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function runCli(root, args) {
  return spawnSync(process.execPath, [BIN_PATH, ...args], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, QUIVER_LANG: 'en' },
  });
}

function assertSuccess(result) {
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

test('ai help exposes representative dispatch surface before refactor', () => {
  const repo = makeRepo();

  try {
    const result = runCli(repo.root, ['--help']);
    assertSuccess(result);
    assert.equal(result.stderr, '');
    for (const command of [
      'ai lifecycle create',
      'ai run create',
      'ai status',
      'ai prepare-context',
      'ai agent set|list|show|doctor|repair',
      'ai models list',
      'ai plan',
      'ai approvals',
      'ai prompt-slice',
      'ai execute-plan',
      'ai inspect',
      'ai export',
      'ai specs list',
      'ai slices list',
      'ai active-slice status|reconcile',
      'ai trace report',
      'ai doctor',
      'ai pr',
    ]) {
      assert.match(result.stdout, new RegExp(command.replace(/[|]/g, '\\|')));
    }
  } finally {
    repo.cleanup();
  }
});

test('ai dispatch baseline covers one non-provider path per domain', () => {
  const repo = makeRepo();

  try {
    const lifecycle = runCli(repo.root, ['ai', 'run', 'create', '--input', 'requirements.md', '--run', 'dispatch-run']);
    assertSuccess(lifecycle);
    assert.equal(lifecycle.stderr, '');
    assert.match(lifecycle.stdout, /AI run status/);
    assert.match(lifecycle.stdout, /Run: dispatch-run/);

    const planner = runCli(repo.root, ['ai', 'plan', '--phase', 'acceptance', '--input', 'requirements.md', '--dry-run']);
    assertSuccess(planner);
    assert.equal(planner.stderr, '');
    assert.match(planner.stdout, /AI plan dry-run/);
    assert.match(planner.stdout, /Phase: acceptance/);

    const agents = runCli(repo.root, ['ai', 'models', 'list', '--json']);
    assertSuccess(agents);
    assert.equal(agents.stderr, '');
    assert.equal(JSON.parse(agents.stdout).catalogVersion, 1);

    const execution = runCli(repo.root, ['ai', 'prompt-slice', '--slice', repo.slicePath, '--dry-run']);
    assertSuccess(execution);
    assert.equal(execution.stderr, '');
    assert.match(execution.stdout, /Act as a WDD \+ SDD executor agent/);

    const inspection = runCli(repo.root, ['ai', 'export', '--format', 'json']);
    assertSuccess(inspection);
    assert.equal(inspection.stderr, '');
    assert.equal(JSON.parse(inspection.stdout).source_metadata.command, 'ai export');

    const diagnostics = runCli(repo.root, ['ai', 'trace', 'report']);
    assertSuccess(diagnostics);
    assert.equal(diagnostics.stderr, '');
    assert.match(diagnostics.stdout, /Quiver trace report/);
  } finally {
    repo.cleanup();
  }
});

test('ai compatibility aliases preserve stdout and warn on stderr only', () => {
  const repo = makeRepo();

  try {
    const approvals = runCli(repo.root, ['ai', 'approvals']);
    const approvalStatus = runCli(repo.root, ['ai', 'approval-status']);
    assertSuccess(approvals);
    assertSuccess(approvalStatus);
    assert.equal(approvals.stderr, '');
    assert.match(approvalStatus.stderr, /deprecated command: ai approval-status/);
    assert.match(approvalStatus.stderr, /Use: npx create-quiver ai approvals/);
    assert.equal(approvalStatus.stdout, approvals.stdout);

    const promptSlice = runCli(repo.root, ['ai', 'prompt-slice', '--slice', repo.slicePath, '--dry-run']);
    const executorPrompt = runCli(repo.root, ['ai', 'executor-prompt', '--slice', repo.slicePath, '--dry-run']);
    assertSuccess(promptSlice);
    assertSuccess(executorPrompt);
    assert.equal(promptSlice.stderr, '');
    assert.match(executorPrompt.stderr, /deprecated command: ai executor-prompt/);
    assert.match(executorPrompt.stderr, /Use: npx create-quiver ai prompt-slice/);
    assert.equal(executorPrompt.stdout, promptSlice.stdout);
  } finally {
    repo.cleanup();
  }
});

test('ai compatibility alias warnings are suppressed in machine mode', () => {
  const repo = makeRepo();

  try {
    const approvalStatus = runCli(repo.root, ['ai', 'approval-status', '--json']);
    assertSuccess(approvalStatus);
    assert.equal(approvalStatus.stderr, '');
    assert.doesNotMatch(approvalStatus.stdout, /deprecated command:/);

    const executorPrompt = runCli(repo.root, ['ai', 'executor-prompt', '--slice', repo.slicePath, '--dry-run', '--json']);
    assertSuccess(executorPrompt);
    assert.equal(executorPrompt.stderr, '');
    assert.doesNotMatch(executorPrompt.stdout, /deprecated command:/);
  } finally {
    repo.cleanup();
  }
});

test('ai JSON dispatch baseline keeps stdout parseable and errors on stderr', () => {
  const repo = makeRepo();

  try {
    const ok = runCli(repo.root, ['ai', 'export', '--format', 'json']);
    assertSuccess(ok);
    assert.equal(ok.stderr, '');
    assert.doesNotThrow(() => JSON.parse(ok.stdout));

    const failed = runCli(repo.root, ['ai', 'export', '--format', 'xml']);
    assert.notEqual(failed.status, 0);
    assert.equal(failed.stdout, '');
    assert.match(failed.stderr, /unsupported ai export format: xml/);
  } finally {
    repo.cleanup();
  }
});
