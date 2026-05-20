const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const test = require('node:test');

const { runDoctor, runPr } = require('../../src/create-quiver/commands/ai');
const { DEFAULT_GITFLOW_GUIDE_PATH } = require('../../src/create-quiver/lib/ai/github');

const BIN_PATH = path.resolve(__dirname, '../../bin/create-quiver.js');

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function git(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function createRepo(structure = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-pr-'));
  git(root, ['init']);
  git(root, ['config', 'user.email', 'test@example.com']);
  git(root, ['config', 'user.name', 'Test User']);
  git(root, ['checkout', '-b', 'feature/ai-pr-preflight']);
  git(root, ['remote', 'add', 'origin', 'git@github.com:example/quiver.git']);

  writeFile(path.join(root, 'README.md'), '# repo\n');

  for (const [relativePath, contents] of Object.entries(structure)) {
    writeFile(path.join(root, relativePath), contents);
  }

  git(root, ['add', '.']);
  git(root, ['commit', '-m', 'init']);

  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function createFakeGh(binDir) {
  const scriptPath = path.join(binDir, 'gh');
  writeFile(scriptPath, `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === '--version') {
  process.stdout.write('gh version 2.0.0\\n');
  process.exit(0);
}
if (args[0] === 'auth' && args[1] === 'status') {
  process.stdout.write('Logged in to github.com as octocat\\n');
  process.exit(0);
}
process.stderr.write('unexpected gh args: ' + args.join(' ') + '\\n');
process.exit(1);
`);
  fs.chmodSync(scriptPath, 0o755);
  return scriptPath;
}

test('ai pr dry-run forwards git and ssh options to the GitHub preflight', async () => {
  let captured = null;

  const result = await runPr('/tmp/quiver-repo', {
    dryRun: true,
    remote: 'upstream',
    sshHostAlias: 'github-work',
    identityFile: 'ssh/github-work',
    preflightFn: async (repoRoot, options) => {
      captured = { repoRoot, options };
      return {
        ok: true,
        repoRoot,
        remote: options.remote,
        branchName: 'feature/ai-pr-preflight',
        guidePath: `${repoRoot}/docs/GITFLOW_PR_GUIDE.md`,
        sshHostAlias: options.sshHostAlias,
        identityFile: `${repoRoot}/${options.identityFile}`,
      };
    },
  });

  assert.equal(result.task, 'pr');
  assert.equal(result.dryRun, true);
  assert.equal(result.preflight.remote, 'upstream');
  assert.equal(result.preflight.sshHostAlias, 'github-work');
  assert.ok(result.preflight.identityFile.endsWith('ssh/github-work'));
  assert.equal(captured.repoRoot, '/tmp/quiver-repo');
  assert.equal(captured.options.remote, 'upstream');
  assert.equal(captured.options.sshHostAlias, 'github-work');
  assert.equal(captured.options.identityFile, 'ssh/github-work');
});

test('ai doctor annotates GitHub preflight failures', async () => {
  await assert.rejects(
    runDoctor('/tmp/quiver-repo', {
      preflightFn: async () => {
        const error = new Error('missing GitHub CLI');
        error.code = 'MISSING_GH_CLI';
        error.details = { command: 'gh' };
        throw error;
      },
    }),
    (error) => error.message.includes('ai doctor failed')
      && error.message.includes('missing GitHub CLI')
      && error.code === 'MISSING_GH_CLI',
  );
});

test('ai pr CLI dry-run wires through the new router and avoids opening a PR', () => {
  const repo = createRepo({
    [DEFAULT_GITFLOW_GUIDE_PATH]: '# GitFlow guide\n',
    'ssh/github-work': 'identity-file\n',
  });
  const binDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-gh-'));

  try {
    createFakeGh(binDir);
    const output = execFileSync('node', [BIN_PATH, 'ai', 'pr', '--dry-run', '--ssh-host-alias', 'github-work', '--identity-file', 'ssh/github-work'], {
      cwd: repo.root,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${binDir}${path.delimiter}${process.env.PATH}`,
      },
    });

    assert.ok(output.includes('GitHub pr dry-run'));
    assert.ok(output.includes('SSH host alias: github-work'));
    assert.ok(output.includes('No PR will be created in dry-run mode.'));
  } finally {
    fs.rmSync(binDir, { recursive: true, force: true });
    repo.cleanup();
  }
});
