const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const packageJson = require('../../package.json');
const { resolveInitPackageScripts } = require('../../src/create-quiver/lib/init-layout');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeFile(root, relativePath, content) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function makeRepo(structure = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-flow-'));
  for (const [relativePath, content] of Object.entries(structure)) {
    writeFile(root, relativePath, content);
  }

  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function snapshotFiles(root) {
  const files = [];

  const walk = (dirPath) => {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        files.push(path.relative(root, fullPath).split(path.sep).join('/'));
      }
    }
  };

  walk(root);
  return files.sort();
}

function runFlow(repoRoot, args = []) {
  return execFileSync(process.execPath, [BIN_PATH, 'flow', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

test('package exposes quiver as an alias to the create-quiver binary', () => {
  assert.equal(packageJson.bin['create-quiver'], 'bin/create-quiver.js');
  assert.equal(packageJson.bin.quiver, 'bin/create-quiver.js');
});

test('generated package scripts include the flow entrypoint', () => {
  const scripts = resolveInitPackageScripts('default');
  assert.equal(scripts['quiver:flow'], 'npx create-quiver flow');
});

test('flow command is read-only and guides uninitialized projects to init', () => {
  const repo = makeRepo({
    'README.md': '# Existing project\n',
  });

  try {
    const before = snapshotFiles(repo.root);
    const output = runFlow(repo.root);
    const after = snapshotFiles(repo.root);

    assert.deepEqual(after, before);
    assert.match(output, /Quiver guided flow/);
    assert.match(output, /Stage: not initialized/);
    assert.match(output, /Next safe command: npx create-quiver init --name "Project Name"/);
    assert.match(output, /Safety: this command is read-only and does not call AI providers\./);
  } finally {
    repo.cleanup();
  }
});

test('flow command reports planning readiness when context docs exist', () => {
  const repo = makeRepo({
    '.quiver/state.json': JSON.stringify({
      initialized_version: '0.10.0',
      last_initialized_at: '2026-05-21T00:00:00.000Z',
      quiver_version: '0.10.0',
    }, null, 2),
    'docs/PROJECT_MAP.md': '# Project Map\n',
    'docs/AI_CONTEXT.md': '# AI Context\n',
    'docs/AI_ONBOARDING_PROMPT.md': '# Prompt\n',
  });

  try {
    const output = runFlow(repo.root);

    assert.match(output, /Stage: ready for planner onboarding/);
    assert.match(output, /Next safe command: npx create-quiver ai onboard --dry-run/);
  } finally {
    repo.cleanup();
  }
});

test('flow command supports machine-readable output', () => {
  const repo = makeRepo({});

  try {
    const output = runFlow(repo.root, ['--json']);
    const parsed = JSON.parse(output);

    assert.equal(parsed.stage, 'not-initialized');
    assert.equal(parsed.nextCommand, 'npx create-quiver init --name "Project Name"');
  } finally {
    repo.cleanup();
  }
});
