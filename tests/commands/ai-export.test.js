const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
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

test('ai inspect, export, specs, slices, and trace expose lifecycle state', () => {
  const repo = makeRepo();

  try {
    const inspect = execAi(repo.root, ['inspect']);
    assert.match(inspect, /Quiver lifecycle inspect/);
    assert.match(inspect, /npx create-quiver ai export --format json/);

    const json = JSON.parse(execAi(repo.root, ['export']));
    assert.equal(json.schema_version, 1);
    assert.equal(json.project.name, 'demo-project');
    assert.equal(json.slices[0].ref, 'demo/slice-01-dashboard');
    assert.equal(Array.isArray(json.dashboard.dependencies), true);

    const explicitJson = JSON.parse(execAi(repo.root, ['export', '--format', 'json']));
    assert.equal(explicitJson.schema_version, 1);

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

test('ai export rejects unsupported formats with a clear error', () => {
  const repo = makeRepo();

  try {
    assert.throws(
      () => execAi(repo.root, ['export', '--format', 'xml']),
      /unsupported ai export format: xml/,
    );
  } finally {
    repo.cleanup();
  }
});
