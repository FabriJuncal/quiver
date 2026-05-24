const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const {
  buildPrCreatePlan,
  DEFAULT_GITFLOW_GUIDE_PATH,
  extractPrTitle,
  formatPreflightReport,
  formatPrCreateReport,
  preflightGitHubPr,
  resolvePrBodyPath,
  resolveConfiguredPath,
  runGhPrCreate,
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
        && error.message.includes('account')
        && error.message.includes('scopes')
        && error.message.includes('ssh -T <alias>')
        && error.message.includes('Next command: gh auth status')
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

test('preflightGitHubPr reports missing SSH host alias with platform guidance', () => {
  const repo = createRepo({
    [DEFAULT_GITFLOW_GUIDE_PATH]: '# GitFlow guide\n',
  });

  try {
    assert.throws(
      () => preflightGitHubPr(repo.root, {
        ghProbe: ghOk,
        ghAuthProbe: ghOk,
      }),
      (error) => error.code === 'MISSING_SSH_HOST_ALIAS'
        && error.message.includes('--ssh-host-alias')
        && error.message.includes('Impact:')
        && error.message.includes('Fix:')
        && error.message.includes('Next command:')
        && error.message.includes('macOS/Linux/Git Bash/WSL')
        && error.message.includes('Windows PowerShell'),
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
        sshHostAlias: 'github-work',
        identityFile: relativeIdentityFile,
      }),
      (error) => error.code === 'MISSING_IDENTITY_FILE'
        && error.message.includes(expectedIdentityPath)
        && error.message.includes('macOS/Linux')
        && error.message.includes('Windows PowerShell')
        && error.message.includes('Git Bash/WSL')
        && error.message.includes('--identity-file')
        && error.details.resolvedIdentityFile === expectedIdentityPath,
    );
  } finally {
    repo.cleanup();
  }
});

test('formatPreflightReport prints shell-specific path guidance for paths with spaces', () => {
  const repoRoot = path.join(os.tmpdir(), 'quiver path with spaces');
  const report = {
    ok: true,
    repoRoot,
    remote: 'origin',
    branchName: 'feature/demo',
    guidePath: path.join(repoRoot, 'docs/GITFLOW_PR_GUIDE.md'),
    sshHostAlias: 'github-work',
    identityFile: path.join(repoRoot, 'ssh/github work'),
  };

  const output = formatPreflightReport(report, { dryRun: true });

  assert.match(output, /Path guidance:/);
  assert.match(output, /macOS\/Linux/);
  assert.match(output, /Windows PowerShell/);
  assert.match(output, /Git Bash\/WSL/);
  assert.match(output, /--identity-file '.+github work'/);
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

test('resolvePrBodyPath finds a single generated pr.md and rejects ambiguous bodies', () => {
  const repo = createRepo({
    [DEFAULT_GITFLOW_GUIDE_PATH]: '# GitFlow guide\n',
    'specs/demo/pr.md': '## Title\nDemo PR\n',
  });

  try {
    assert.equal(resolvePrBodyPath(repo.root, ''), path.join(repo.root, 'specs/demo/pr.md'));
    writeFile(path.join(repo.root, 'specs/other/pr.md'), '## Title\nOther PR\n');

    assert.throws(
      () => resolvePrBodyPath(repo.root, ''),
      (error) => error.code === 'AMBIGUOUS_PR_BODY'
        && error.message.includes('specs/demo/pr.md')
        && error.message.includes('specs/other/pr.md'),
    );
  } finally {
    repo.cleanup();
  }
});

test('buildPrCreatePlan reads pr.md title and builds safe gh args', () => {
  const repo = createRepo({
    [DEFAULT_GITFLOW_GUIDE_PATH]: '# GitFlow guide\n',
    'specs/demo/pr.md': '## Title\nDemo PR\n\n## Summary\nBody\n',
  });

  try {
    const preflight = {
      ok: true,
      repoRoot: repo.root,
      remote: 'origin',
      branchName: 'feature/demo',
      guidePath: path.join(repo.root, DEFAULT_GITFLOW_GUIDE_PATH),
    };
    const plan = buildPrCreatePlan(repo.root, preflight, {
      baseBranch: 'main',
      input: 'specs/demo/pr.md',
    });

    assert.equal(plan.title, 'Demo PR');
    assert.equal(plan.baseBranch, 'main');
    assert.deepEqual(plan.args.slice(0, 6), ['pr', 'create', '--base', 'main', '--head', 'feature/demo']);
    assert.ok(plan.args.includes('--body-file'));
    assert.ok(plan.args.includes(path.join(repo.root, 'specs/demo/pr.md')));
  } finally {
    repo.cleanup();
  }
});

test('formatPrCreateReport prints shell-specific command examples for paths with spaces', () => {
  const repoRoot = path.join(os.tmpdir(), 'quiver repo with spaces');
  const preflight = {
    ok: true,
    repoRoot,
    remote: 'origin',
    branchName: 'feature/demo',
    guidePath: path.join(repoRoot, DEFAULT_GITFLOW_GUIDE_PATH),
    sshHostAlias: 'github-work',
    identityFile: path.join(repoRoot, 'ssh/github work'),
  };
  const plan = {
    args: ['pr', 'create', '--base', 'main', '--head', 'feature/demo', '--title', 'Demo PR', '--body-file', path.join(repoRoot, 'specs/demo/pr.md')],
    baseBranch: 'main',
    branchName: 'feature/demo',
    ghCommand: 'gh',
    prBodyPath: path.join(repoRoot, 'specs/demo/pr.md'),
    prBodyRelativePath: 'specs/demo/pr.md',
    remote: 'origin',
    repoRoot,
    title: 'Demo PR',
  };

  const output = formatPrCreateReport({ preflight, plan }, { dryRun: true });

  assert.match(output, /Shell-safe command examples:/);
  assert.match(output, /macOS\/Linux\/Git Bash\/WSL: gh pr create/);
  assert.match(output, /Windows PowerShell: gh pr create/);
  assert.match(output, /'Demo PR'/);
  assert.match(output, /'\/.+quiver repo with spaces\/specs\/demo\/pr\.md'/);
});

test('buildPrCreatePlan refuses PR creation while spec slices are open', () => {
  const repo = createRepo({
    [DEFAULT_GITFLOW_GUIDE_PATH]: '# GitFlow guide\n',
    'specs/demo/pr.md': '## Title\nDemo PR\n',
    'specs/demo/slices/slice-00-spec-foundation/slice.json': `${JSON.stringify({
      slice_id: 'slice-00-spec-foundation',
      status: 'completed',
    }, null, 2)}\n`,
    'specs/demo/slices/slice-01-work/slice.json': `${JSON.stringify({
      slice_id: 'slice-01-work',
      status: 'in-progress',
    }, null, 2)}\n`,
  });

  try {
    assert.throws(
      () => buildPrCreatePlan(repo.root, {
        branchName: 'feature/demo',
        remote: 'origin',
      }, {
        input: 'specs/demo/pr.md',
      }),
      (error) => error.code === 'OPEN_SLICES'
        && error.message.includes('Impact:')
        && error.message.includes('Fix:')
        && error.message.includes('Next command:')
        && error.message.includes('slice-01-work (in-progress)'),
    );
  } finally {
    repo.cleanup();
  }
});

test('runGhPrCreate reports gh pr create failures without merging', () => {
  const plan = {
    args: ['pr', 'create', '--base', 'main', '--head', 'feature/demo', '--title', 'Demo', '--body-file', 'pr.md'],
    ghCommand: 'gh',
    repoRoot: '/tmp/quiver-repo',
  };

  assert.throws(
    () => runGhPrCreate(plan, {
      ghCreateRunner() {
        return {
          status: 1,
          stdout: '',
          stderr: 'failed to create pr',
        };
      },
    }),
    (error) => error.code === 'GH_PR_CREATE_FAILED'
      && error.message.includes('gh pr create failed')
      && error.message.includes('failed to create pr'),
  );
});

test('extractPrTitle falls back predictably', () => {
  assert.equal(extractPrTitle('## Title\nMy PR\n', 'fallback'), 'My PR');
  assert.equal(extractPrTitle('# Heading PR\n', 'fallback'), 'Heading PR');
  assert.equal(extractPrTitle('No heading\n', 'fallback'), 'fallback');
});
