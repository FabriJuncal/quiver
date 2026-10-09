const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');
const { writeCliFixture, cliFixtureEnv } = require('../helpers/cli-fixtures');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeFile(root, relativePath, content = '') {
  const filePath = path.isAbsolute(relativePath) ? relativePath : path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function makeRepo(structure = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-prepare-'));
  for (const [relativePath, contents] of Object.entries(structure)) {
    writeFile(root, relativePath, contents);
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



function seedPrepareReadyRepo(root) {
  writeFile(root, 'README.md', '# Project\n');
  writeFile(root, 'README_FOR_AI.md', '# README for AI\n');
  writeFile(root, 'AGENTS.md', 'Purpose\n\n## Reading Budget\n## Reading Order\n## Output Policy\n## Slice Execution Rules\n## Links\n');
  writeFile(root, 'docs/AI_CONTEXT.md', '# AI Context\n');
  writeFile(root, 'docs/AI_ONBOARDING_PROMPT.md', '# Prompt\n');
  writeFile(root, 'docs/COMMANDS.md', '# Commands\n');
  writeFile(root, 'docs/WORKFLOW.md', '# Workflow\n');
  writeFile(root, 'package.json', JSON.stringify({ name: 'project' }, null, 2));
  writeFile(root, '.quiver/state.json', JSON.stringify({ initialized_version: '0.9.0' }, null, 2));
  writeFile(root, '.quiver/config.json', JSON.stringify({ layout_version: 1 }, null, 2));
  writeFile(root, '.quiver/.gitignore', 'cache/\nruns/\nworktrees/\n');
}

test('prepare dry-run reports checks and does not write files', () => {
  const repo = makeRepo();
  const binDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-prepare-bin-'));

  try {
    seedPrepareReadyRepo(repo.root);
    writeCliFixture(binDir, 'gh', `const args = process.argv.slice(2);
if (args[0] === '--version') { console.log('gh version 2.0.0'); process.exit(0); }
if (args[0] === 'auth' && args[1] === 'status') { console.log('Logged in to github.com as octocat'); process.exit(0); }
process.exit(1);`);
    writeCliFixture(binDir, 'codex', `console.log('codex 1.0.0');`);
    writeFile(repo.root, 'ssh/github-work', 'identity-file\n');

    const before = snapshotFiles(repo.root);
    const output = execFileSync(process.execPath, [BIN_PATH, 'prepare', '--dry-run', '--provider', 'codex', '--ssh-host-alias', 'github-work', '--identity-file', 'ssh/github-work'], {
      cwd: repo.root,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: binDir,
        ...cliFixtureEnv(binDir),
      },
    });
    const after = snapshotFiles(repo.root);

    assert.deepEqual(after, before);
    assert.ok(output.includes('Quiver prepare report'));
    assert.ok(output.includes('Mode: dry-run'));
    assert.ok(output.includes('Framework guidance: packaged README_FOR_AI.md template'));
    assert.ok(output.includes('Project docs copy: present'));
    assert.ok(output.includes('GitHub CLI:'));
    assert.ok(output.includes('Provider CLI (codex):'));
    assert.ok(output.includes('Onboarding context:'));
    assert.ok(output.includes('prompt source: packaged planner onboarding template'));
    assert.ok(output.includes('documentation debt:'));
    assert.ok(output.includes('omitted by default:'));
    assert.ok(output.includes('Next safe commands:'));
    assert.ok(output.includes('npx create-quiver ai prepare-context --dry-run'));
    assert.ok(output.includes('Dry-run note: this command does not write files.'));
  } finally {
    fs.rmSync(binDir, { recursive: true, force: true });
    repo.cleanup();
  }
});

test('prepare reports missing gh with cross-platform guidance', () => {
  const repo = makeRepo();
  const binDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-prepare-empty-path-'));
  try {
    seedPrepareReadyRepo(repo.root);
    const output = execFileSync(process.execPath, [BIN_PATH, 'prepare', '--dry-run'], {
      cwd: repo.root,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: binDir,
        ...cliFixtureEnv(binDir),
      },
    });

    assert.ok(output.includes('GitHub CLI:'));
    assert.ok(output.includes('missing'));
    assert.ok(output.includes('macOS: brew install gh'));
    assert.ok(output.includes('Linux:'));
    assert.ok(output.includes('Windows: winget install GitHub.cli'));
  } finally {
    fs.rmSync(binDir, { recursive: true, force: true });
    repo.cleanup();
  }
});

test('prepare reports a missing provider CLI with actionable guidance', () => {
  const repo = makeRepo();
  const binDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-prepare-gh-'));

  try {
    seedPrepareReadyRepo(repo.root);
    writeCliFixture(binDir, 'gh', `const args = process.argv.slice(2);
if (args[0] === '--version') { console.log('gh version 2.0.0'); process.exit(0); }
if (args[0] === 'auth' && args[1] === 'status') { console.log('Logged in to github.com as octocat'); process.exit(0); }
process.exit(1);`);

    const output = execFileSync(process.execPath, [BIN_PATH, 'prepare', '--dry-run', '--provider', 'codex'], {
      cwd: repo.root,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: binDir,
        ...cliFixtureEnv(binDir),
      },
    });

    assert.ok(output.includes('Provider CLI (codex):'));
    assert.ok(output.includes('Install the Codex CLI'));
    assert.ok(output.includes('Supported providers: codex, claude, gemini.'));
  } finally {
    fs.rmSync(binDir, { recursive: true, force: true });
    repo.cleanup();
  }
});

test('prepare reports SSH identity and auth recovery steps', () => {
  const repo = makeRepo();
  const binDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-prepare-ssh-'));

  try {
    seedPrepareReadyRepo(repo.root);
    writeCliFixture(binDir, 'gh', `const args = process.argv.slice(2);
if (args[0] === '--version') { console.log('gh version 2.0.0'); process.exit(0); }
if (args[0] === 'auth' && args[1] === 'status') { console.error('You are not logged into any GitHub hosts.'); process.exit(1); }
process.exit(1);`);

    const output = execFileSync(process.execPath, [BIN_PATH, 'prepare', '--dry-run', '--ssh-host-alias', 'github-work', '--identity-file', 'ssh/missing-key'], {
      cwd: repo.root,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: binDir,
        ...cliFixtureEnv(binDir),
      },
    });

    assert.ok(output.includes('identity file: missing'));
    assert.ok(output.includes('auth: missing'));
    assert.ok(output.includes('Fix the SSH identity file path'));
    assert.ok(output.includes('Run `gh auth login`'));
  } finally {
    fs.rmSync(binDir, { recursive: true, force: true });
    repo.cleanup();
  }
});

test('prepare success recommends the next safe command', () => {
  const repo = makeRepo();
  const binDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-prepare-success-'));

  try {
    seedPrepareReadyRepo(repo.root);
    writeCliFixture(binDir, 'gh', `const args = process.argv.slice(2);
if (args[0] === '--version') { console.log('gh version 2.0.0'); process.exit(0); }
if (args[0] === 'auth' && args[1] === 'status') { console.log('Logged in to github.com as octocat'); process.exit(0); }
process.exit(1);`);
    writeCliFixture(binDir, 'codex', `console.log('codex 1.0.0');`);
    writeFile(repo.root, 'ssh/github-work', 'identity-file\n');

    const output = execFileSync(process.execPath, [BIN_PATH, 'prepare', '--provider', 'codex', '--ssh-host-alias', 'github-work', '--identity-file', 'ssh/github-work'], {
      cwd: repo.root,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: binDir,
        ...cliFixtureEnv(binDir),
      },
    });

    assert.ok(output.includes('Next safe commands:'));
    assert.ok(output.includes('npx create-quiver doctor'));
    assert.ok(output.includes('npx create-quiver ai prepare-context --dry-run'));
    assert.ok(output.includes('auth: ok'));
    assert.ok(output.includes('available (codex)'));
  } finally {
    fs.rmSync(binDir, { recursive: true, force: true });
    repo.cleanup();
  }
});

test('prepare treats missing README_FOR_AI.md as framework guidance, not project debt', () => {
  const repo = makeRepo();
  const binDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-prepare-guidance-'));

  try {
    writeFile(repo.root, 'README.md', '# Project\n');
    writeFile(repo.root, 'AGENTS.md', 'Purpose\n\n## Reading Budget\n## Reading Order\n## Output Policy\n## Slice Execution Rules\n## Links\n');
    writeFile(repo.root, 'docs/AI_CONTEXT.md', '# AI Context\n');
    writeFile(repo.root, 'docs/AI_ONBOARDING_PROMPT.md', '# Prompt\n');
    writeFile(repo.root, 'docs/COMMANDS.md', '# Commands\n');
    writeFile(repo.root, 'docs/WORKFLOW.md', '# Workflow\n');
    writeFile(repo.root, 'package.json', JSON.stringify({ name: 'project' }, null, 2));

    writeCliFixture(binDir, 'gh', `const args = process.argv.slice(2);
if (args[0] === '--version') { console.log('gh version 2.0.0'); process.exit(0); }
if (args[0] === 'auth' && args[1] === 'status') { console.log('Logged in to github.com as octocat'); process.exit(0); }
process.exit(1);`);

    const output = execFileSync(process.execPath, [BIN_PATH, 'prepare', '--dry-run'], {
      cwd: repo.root,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: binDir,
        ...cliFixtureEnv(binDir),
      },
    });

    assert.ok(output.includes('Framework guidance: packaged README_FOR_AI.md template'));
    assert.ok(output.includes('Project docs copy: absent (not counted as debt)'));
    assert.ok(!output.includes('README_FOR_AI.md missing'));
  } finally {
    fs.rmSync(binDir, { recursive: true, force: true });
    repo.cleanup();
  }
});
