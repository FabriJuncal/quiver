const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const {
  DEFAULT_GITFLOW_GUIDE_PATH,
  preflightGitHubPr,
  resolveConfiguredPath,
} = require('../../src/create-quiver/lib/ai/github');

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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-ai-github-'));
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

function ghOk() {
  return { status: 0, stdout: 'gh version 2.0.0', stderr: '' };
}

test('preflightGitHubPr reports a missing gh with cross-platform install guidance', () => {
  const repo = createRepo();
  try {
    assert.throws(
      () => preflightGitHubPr(repo.root, {
        ghProbe() {
          const error = new Error('gh not found');
          error.code = 'ENOENT';
          return { error };
        },
      }),
      (error) => error.code === 'MISSING_GH_CLI'
        && error.message.includes('macOS: brew install gh')
        && error.message.includes('Linux:')
        && error.message.includes('Windows: winget install GitHub.cli'),
    );
  } finally {
    repo.cleanup();
  }
});

test('preflightGitHubPr stops when the gh probe exits non-zero', () => {
  const repo = createRepo();
  try {
    assert.throws(
      () => preflightGitHubPr(repo.root, {
        ghProbe() {
          return {
            status: 1,
            stdout: '',
            stderr: 'gh failed to start',
          };
        },
      }),
      (error) => error.code === 'GH_CLI_UNAVAILABLE'
        && error.message.includes('GitHub CLI probe failed')
        && error.message.includes('gh failed to start'),
    );
  } finally {
    repo.cleanup();
  }
});

test('preflightGitHubPr reports an unauthenticated gh with gh auth login guidance', () => {
  const repo = createRepo();
  try {
    assert.throws(
      () => preflightGitHubPr(repo.root, {
        ghProbe: ghOk,
        ghAuthProbe() {
          return {
            status: 1,
            stdout: '',
            stderr: 'You are not logged into any GitHub hosts.',
          };
        },
      }),
      (error) => error.code === 'GH_NOT_AUTHENTICATED'
        && error.message.includes('gh auth login')
        && error.message.includes('You are not logged into any GitHub hosts.'),
    );
  } finally {
    repo.cleanup();
  }
});

test('preflightGitHubPr stops when the GitFlow guide is missing', () => {
  const repo = createRepo();
  try {
    assert.throws(
      () => preflightGitHubPr(repo.root, {
        ghProbe: ghOk,
        ghAuthProbe: ghOk,
      }),
      (error) => error.code === 'MISSING_GITFLOW_GUIDE'
        && error.message.includes(DEFAULT_GITFLOW_GUIDE_PATH)
        && error.details.guidePath.endsWith(DEFAULT_GITFLOW_GUIDE_PATH),
    );
  } finally {
    repo.cleanup();
  }
});

test('preflightGitHubPr reports the reviewed identity file path when it is missing', () => {
  const repo = createRepo({
    [DEFAULT_GITFLOW_GUIDE_PATH]: '# GitFlow guide\n',
  });

  try {
    const relativeIdentityFile = 'ssh/github-work';
    const expectedIdentityPath = path.resolve(repo.root, relativeIdentityFile);

    assert.throws(
      () => preflightGitHubPr(repo.root, {
        ghProbe: ghOk,
        ghAuthProbe: ghOk,
        identityFile: relativeIdentityFile,
      }),
      (error) => error.code === 'MISSING_IDENTITY_FILE'
        && error.message.includes(expectedIdentityPath)
        && error.details.resolvedIdentityFile === expectedIdentityPath,
    );
  } finally {
    repo.cleanup();
  }
});

test('preflightGitHubPr keeps sshHostAlias and identityFile as separate inputs', () => {
  const repo = createRepo({
    [DEFAULT_GITFLOW_GUIDE_PATH]: '# GitFlow guide\n',
    'ssh/github-work': 'identity-file\n',
  });

  try {
    const result = preflightGitHubPr(repo.root, {
      ghProbe: ghOk,
      ghAuthProbe: ghOk,
      sshHostAlias: 'github-work',
      identityFile: 'ssh/github-work',
    });

    assert.equal(result.ok, true);
    assert.equal(result.sshHostAlias, 'github-work');
    assert.ok(result.identityFile.endsWith('ssh/github-work'));
    assert.ok(result.guidePath.endsWith(DEFAULT_GITFLOW_GUIDE_PATH));
  } finally {
    repo.cleanup();
  }
});
