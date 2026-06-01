const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeFile(root, relativePath, content) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function makeRepo(structure = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-status-'));
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

function runStatus(repoRoot, args = []) {
  return execFileSync(process.execPath, [BIN_PATH, 'status', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

test('status is read-only and shows the next safe command', () => {
  const repo = makeRepo({
    'README.md': '# Existing project\n',
  });

  try {
    const before = snapshotFiles(repo.root);
    const output = runStatus(repo.root);
    const after = snapshotFiles(repo.root);

    assert.deepEqual(after, before);
    assert.match(output, /Quiver status/);
    assert.match(output, /State: not initialized/);
    assert.match(output, /Next safe command: npx create-quiver init --name "Project Name"/);
    assert.match(output, /Read-only: no files, providers, worktrees, or prompts were started\./);
  } finally {
    repo.cleanup();
  }
});

test('status --json emits parseable schema v1 JSON without human prose', () => {
  const repo = makeRepo({
    'README.md': '# Existing project\n',
  });

  try {
    const output = runStatus(repo.root, ['--json']);
    const parsed = JSON.parse(output);

    assert.equal(parsed.schema_version, 1);
    assert.equal(parsed.state, 'not-initialized');
    assert.equal(parsed.source, 'flow');
    assert.equal(parsed.next_command, 'npx create-quiver init --name "Project Name"');
    assert.equal(output.includes('Quiver status'), false);
  } finally {
    repo.cleanup();
  }
});

test('status localizes human labels while preserving commands', () => {
  const repo = makeRepo({
    'README.md': '# Existing project\n',
  });

  try {
    const output = runStatus(repo.root, ['--lang', 'es']);

    assert.match(output, /Estado de Quiver/);
    assert.match(output, /Estado: sin inicializar/);
    assert.match(output, /Siguiente comando seguro: npx create-quiver init --name "Project Name"/);
    assert.match(output, /Solo lectura: no se iniciaron archivos, providers, worktrees ni prompts\./);
  } finally {
    repo.cleanup();
  }
});
