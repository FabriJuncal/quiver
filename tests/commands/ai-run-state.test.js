const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-run-cli-'));
  fs.writeFileSync(path.join(root, 'requirements.md'), '# Requirement\n');
  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function execAi(repoRoot, args = []) {
  return execFileSync(process.execPath, [BIN_PATH, 'ai', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

test('ai run create creates persistent run state and ai status can inspect it', () => {
  const repo = makeRepo();

  try {
    const created = execAi(repo.root, ['run', 'create', '--input', 'requirements.md', '--run', 'run-cli']);
    assert.match(created, /AI run status/);
    assert.match(created, /Run: run-cli/);
    assert.match(created, /Phase: created/);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver/runs/run-cli/state.json')), true);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver/runs/run-cli/approvals.json')), true);

    const status = execAi(repo.root, ['status']);
    assert.match(status, /Run: run-cli/);
    assert.match(status, /Next safe command: npx create-quiver ai plan --phase acceptance/);

    const resume = execAi(repo.root, ['resume']);
    assert.match(resume, /AI run resume/);
    assert.match(resume, /Current phase: created/);
  } finally {
    repo.cleanup();
  }
});

test('ai status reports no active run without creating files', () => {
  const repo = makeRepo();

  try {
    const output = execAi(repo.root, ['status']);
    assert.match(output, /Status: no active run/);
    assert.match(output, /ai run create --input <requirements.md>/);
    assert.equal(fs.existsSync(path.join(repo.root, '.quiver')), false);
  } finally {
    repo.cleanup();
  }
});
