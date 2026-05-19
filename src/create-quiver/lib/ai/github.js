const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { currentBranch, hasRemote, isCleanWorktree } = require('../git');

const DEFAULT_GH_COMMAND = 'gh';
const DEFAULT_REMOTE = 'origin';
const DEFAULT_GITFLOW_GUIDE_PATH = 'docs/GITFLOW_PR_GUIDE.md';

class GitHubPreflightError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'GitHubPreflightError';
    this.code = code;
    this.details = details;
  }
}

function formatError(message) {
  return `create-quiver: ${message}`;
}

function normalizeOptionalPath(filePath) {
  const value = String(filePath || '').trim();
  if (!value) {
    return '';
  }

  if (value === '~') {
    return os.homedir();
  }

  if (value.startsWith('~/') || value.startsWith('~\\')) {
    return path.join(os.homedir(), value.slice(2));
  }

  return value;
}

function resolveConfiguredPath(repoRoot, filePath) {
  const normalized = normalizeOptionalPath(filePath);
  if (!normalized) {
    return '';
  }

  if (path.isAbsolute(normalized)) {
    return path.normalize(normalized);
  }

  return path.resolve(repoRoot, normalized);
}

function formatGhInstallGuidance() {
  return [
    'GitHub CLI is not installed.',
    'macOS: brew install gh',
    'Linux: follow https://github.com/cli/cli/blob/trunk/docs/install_linux.md or use your distro package manager',
    'Windows: winget install GitHub.cli',
  ].join('\n');
}

function createError(code, message, details = {}) {
  return new GitHubPreflightError(code, message, details);
}

function runCommand(command, args, options = {}) {
  const runner = options.runner || spawnSync;
  return runner(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function ensureGhInstalled(options = {}) {
  const command = options.ghCommand || DEFAULT_GH_COMMAND;
  const probeArgs = Array.isArray(options.ghProbeArgs) ? options.ghProbeArgs : ['--version'];
  const result = runCommand(command, probeArgs, {
    cwd: options.cwd,
    runner: options.ghProbe || spawnSync,
  });

  if (result && result.error && result.error.code === 'ENOENT') {
    throw createError('MISSING_GH_CLI', `${formatGhInstallGuidance()}\nRun gh auth login after installation.`, {
      command,
      probeArgs,
      errorCode: result.error.code,
    });
  }

  if (result && result.error) {
    throw createError('GH_CLI_UNAVAILABLE', formatError(`GitHub CLI could not be executed. Check '${command}' and then run gh auth login.`), {
      command,
      probeArgs,
      errorCode: result.error.code,
      errorMessage: result.error.message,
    });
  }

  if (!result || typeof result.status !== 'number' || result.status !== 0) {
    const stderr = result && typeof result.stderr === 'string' ? result.stderr.trim() : '';
    const stdout = result && typeof result.stdout === 'string' ? result.stdout.trim() : '';
    const details = [stderr, stdout].filter(Boolean).join('\n');
    throw createError(
      'GH_CLI_UNAVAILABLE',
      `${formatError(`GitHub CLI probe failed for '${command} ${probeArgs.join(' ')}'. Check your gh installation and then run gh auth login.`)}${details ? `\n${details}` : ''}`,
      {
        command,
        probeArgs,
        status: result && result.status,
        stderr,
        stdout,
      },
    );
  }

  return {
    command,
    probeArgs,
    stdout: result && typeof result.stdout === 'string' ? result.stdout : '',
    stderr: result && typeof result.stderr === 'string' ? result.stderr : '',
    status: result && typeof result.status === 'number' ? result.status : 0,
  };
}

function ensureGhAuthenticated(options = {}) {
  const command = options.ghCommand || DEFAULT_GH_COMMAND;
  const authArgs = Array.isArray(options.ghAuthArgs) ? options.ghAuthArgs : ['auth', 'status'];
  const result = runCommand(command, authArgs, {
    cwd: options.cwd,
    runner: options.ghAuthProbe || options.ghProbe || spawnSync,
  });

  if (result && result.error && result.error.code === 'ENOENT') {
    throw createError('MISSING_GH_CLI', `${formatGhInstallGuidance()}\nRun gh auth login after installation.`, {
      command,
      authArgs,
      errorCode: result.error.code,
    });
  }

  if (typeof result.status !== 'number' || result.status !== 0) {
    const stderr = typeof result.stderr === 'string' ? result.stderr.trim() : '';
    const stdout = typeof result.stdout === 'string' ? result.stdout.trim() : '';
    const details = [stderr, stdout].filter(Boolean).join('\n');
    throw createError(
      'GH_NOT_AUTHENTICATED',
      `${formatError('gh auth status failed. Run gh auth login and then re-run the preflight.')}${details ? `\n${details}` : ''}`,
      {
        command,
        authArgs,
        status: result.status,
        stderr,
        stdout,
      },
    );
  }

  return {
    command,
    authArgs,
    stdout: typeof result.stdout === 'string' ? result.stdout : '',
    stderr: typeof result.stderr === 'string' ? result.stderr : '',
    status: result.status,
  };
}

function ensureGitFlowGuide(repoRoot, guidePath) {
  const resolved = resolveConfiguredPath(repoRoot, guidePath || DEFAULT_GITFLOW_GUIDE_PATH);
  if (!resolved || !fs.existsSync(resolved)) {
    throw createError(
      'MISSING_GITFLOW_GUIDE',
      formatError(`missing GitFlow PR guide at ${resolved || guidePath || DEFAULT_GITFLOW_GUIDE_PATH}. Create docs/GITFLOW_PR_GUIDE.md before opening the PR.`),
      {
        guidePath: resolved || guidePath || DEFAULT_GITFLOW_GUIDE_PATH,
      },
    );
  }

  return resolved;
}

function ensureRemote(repoRoot, remoteName = DEFAULT_REMOTE) {
  if (!hasRemote(repoRoot, remoteName)) {
    throw createError(
      'MISSING_GIT_REMOTE',
      formatError(`missing Git remote '${remoteName}'. Configure a remote before preparing the PR.`),
      { remoteName },
    );
  }

  return remoteName;
}

function ensureWorktreeReady(repoRoot, options = {}) {
  const branchName = currentBranch(repoRoot);
  if (!branchName) {
    throw createError(
      'DETACHED_HEAD',
      formatError('current HEAD is detached. Check out the spec branch before preparing the PR.'),
      { repoRoot },
    );
  }

  const blockedBranches = Array.isArray(options.blockedBranches) && options.blockedBranches.length > 0
    ? options.blockedBranches
    : ['main', 'master', 'develop'];

  if (blockedBranches.includes(branchName)) {
    throw createError(
      'UNSAFE_PR_BRANCH',
      formatError(`current branch '${branchName}' is not a PR branch. Create or switch to the feature branch before continuing.`),
      { branchName, blockedBranches },
    );
  }

  if (!isCleanWorktree(repoRoot)) {
    throw createError(
      'DIRTY_WORKTREE',
      formatError(`worktree has uncommitted changes on branch '${branchName}'. Commit or stash them before preparing the PR.`),
      { branchName },
    );
  }

  return branchName;
}

function ensureIdentityFile(repoRoot, identityFile) {
  const normalized = String(identityFile || '').trim();
  if (!normalized) {
    return '';
  }

  const resolved = resolveConfiguredPath(repoRoot, normalized);
  if (!fs.existsSync(resolved)) {
    throw createError(
      'MISSING_IDENTITY_FILE',
      formatError(`missing SSH identity file at ${resolved}. Check the path you passed as identityFile.`),
      {
        identityFile: normalized,
        resolvedIdentityFile: resolved,
      },
    );
  }

  return resolved;
}

function buildPreflightReport(repoRoot, options = {}, checks = {}) {
  return {
    ok: true,
    repoRoot,
    remote: checks.remote || options.remote || DEFAULT_REMOTE,
    branchName: checks.branchName || '',
    guidePath: checks.guidePath || '',
    sshHostAlias: options.sshHostAlias || '',
    identityFile: checks.identityFile || '',
    gh: checks.gh || null,
    auth: checks.auth || null,
  };
}

function preflightGitHubPr(repoRoot, options = {}) {
  const gh = ensureGhInstalled(options);
  const auth = ensureGhAuthenticated(options);
  const guidePath = ensureGitFlowGuide(repoRoot, options.gitFlowGuidePath);
  const remote = ensureRemote(repoRoot, options.remote || DEFAULT_REMOTE);
  const branchName = ensureWorktreeReady(repoRoot, options);
  const identityFile = ensureIdentityFile(repoRoot, options.identityFile);

  return buildPreflightReport(repoRoot, options, {
    gh,
    auth,
    guidePath,
    remote,
    branchName,
    identityFile,
  });
}

function formatPreflightReport(report, options = {}) {
  const mode = options.mode || 'pr';
  const dryRun = options.dryRun === true;
  const lines = [
    `GitHub ${mode} ${dryRun ? 'dry-run' : 'preflight'}`,
    `Remote: ${report.remote}`,
    `Branch: ${report.branchName}`,
    `GitFlow guide: ${path.relative(report.repoRoot, report.guidePath).split(path.sep).join('/')}`,
  ];

  if (report.sshHostAlias) {
    lines.push(`SSH host alias: ${report.sshHostAlias}`);
  }

  if (report.identityFile) {
    lines.push(`Identity file: ${report.identityFile}`);
  }

  lines.push('Checks: gh, gh auth status, git remote, worktree branch, GitFlow guide, SSH identity file');

  if (dryRun) {
    lines.push('No PR will be created in dry-run mode.');
  } else {
    lines.push('PR creation is not performed in this slice.');
  }

  return `${lines.join('\n')}\n`;
}

module.exports = {
  DEFAULT_GH_COMMAND,
  DEFAULT_GITFLOW_GUIDE_PATH,
  DEFAULT_REMOTE,
  GitHubPreflightError,
  buildPreflightReport,
  ensureGhAuthenticated,
  ensureGhInstalled,
  ensureGitFlowGuide,
  ensureIdentityFile,
  ensureRemote,
  ensureWorktreeReady,
  formatGhInstallGuidance,
  formatPreflightReport,
  preflightGitHubPr,
  resolveConfiguredPath,
};
