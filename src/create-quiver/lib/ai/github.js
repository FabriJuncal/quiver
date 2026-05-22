const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { currentBranch, hasRemote, isCleanWorktree } = require('../git');
const { parseJsonWithComments } = require('../json');

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

function ensureSshHostAlias(sshHostAlias) {
  const value = String(sshHostAlias || '').trim();
  if (!value) {
    throw createError(
      'MISSING_SSH_HOST_ALIAS',
      [
        formatError('missing SSH host alias. Pass --ssh-host-alias <alias> before opening the PR.'),
        'macOS/Linux: add a Host entry in ~/.ssh/config, for example `Host github-work`.',
        'Windows: add the Host entry in %USERPROFILE%\\.ssh\\config.',
        'Validate it with `ssh -T <alias>` before retrying.',
      ].join('\n'),
    );
  }
  return value;
}

function prBodySpecDir(repoRoot, prBodyPath) {
  const relative = path.relative(repoRoot, prBodyPath).split(path.sep).join('/');
  const parts = relative.split('/');
  if (parts[0] !== 'specs' || parts.length !== 3 || parts[2] !== 'pr.md') {
    return '';
  }
  return path.join(repoRoot, parts[0], parts[1]);
}

function listOpenSlicesForSpec(specDir) {
  const slicesDir = path.join(specDir, 'slices');
  if (!fs.existsSync(slicesDir)) {
    return [];
  }

  return fs.readdirSync(slicesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const slicePath = path.join(slicesDir, entry.name, 'slice.json');
      if (!fs.existsSync(slicePath)) {
        return null;
      }
      const json = parseJsonWithComments(fs.readFileSync(slicePath, 'utf8'));
      const status = String(json.status || 'draft').trim() || 'draft';
      return {
        id: json.slice_id || entry.name,
        status,
      };
    })
    .filter(Boolean)
    .filter((slice) => slice.status !== 'completed')
    .sort((left, right) => left.id.localeCompare(right.id));
}

function ensureNoOpenSlicesForPrBody(repoRoot, prBodyPath) {
  const specDir = prBodySpecDir(repoRoot, prBodyPath);
  if (!specDir) {
    return [];
  }

  const openSlices = listOpenSlicesForSpec(specDir);
  if (openSlices.length > 0) {
    throw createError(
      'OPEN_SLICES',
      formatError(`cannot create PR while spec slices are still open: ${openSlices.map((slice) => `${slice.id} (${slice.status})`).join(', ')}.`),
      {
        openSlices,
        specDir,
      },
    );
  }

  return openSlices;
}

function findPrBodyCandidates(repoRoot) {
  const candidates = [];
  const rootPr = path.join(repoRoot, 'pr.md');
  if (fs.existsSync(rootPr)) {
    candidates.push(rootPr);
  }

  const specsDir = path.join(repoRoot, 'specs');
  if (fs.existsSync(specsDir)) {
    for (const entry of fs.readdirSync(specsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const candidate = path.join(specsDir, entry.name, 'pr.md');
      if (fs.existsSync(candidate)) {
        candidates.push(candidate);
      }
    }
  }

  return candidates.sort((left, right) => left.localeCompare(right));
}

function resolvePrBodyPath(repoRoot, prBodyPath) {
  const configured = String(prBodyPath || '').trim();
  if (configured) {
    const resolved = resolveConfiguredPath(repoRoot, configured);
    if (!fs.existsSync(resolved)) {
      throw createError('MISSING_PR_BODY', formatError(`missing PR body file at ${resolved}. Pass --input specs/<spec-slug>/pr.md or generate pr.md first.`), {
        prBodyPath: configured,
        resolvedPrBodyPath: resolved,
      });
    }
    return resolved;
  }

  const candidates = findPrBodyCandidates(repoRoot);
  if (candidates.length === 1) {
    return candidates[0];
  }
  if (candidates.length === 0) {
    throw createError('MISSING_PR_BODY', formatError('missing PR body file. Pass --input specs/<spec-slug>/pr.md or generate pr.md first.'), {
      candidates,
    });
  }

  throw createError('AMBIGUOUS_PR_BODY', formatError(`multiple pr.md files found: ${candidates.map((item) => path.relative(repoRoot, item).split(path.sep).join('/')).join(', ')}. Pass --input with the intended PR body.`), {
    candidates,
  });
}

function readPrBody(repoRoot, prBodyPath) {
  const resolved = resolvePrBodyPath(repoRoot, prBodyPath);
  const body = fs.readFileSync(resolved, 'utf8');
  if (!body.trim()) {
    throw createError('EMPTY_PR_BODY', formatError(`PR body file is empty: ${path.relative(repoRoot, resolved).split(path.sep).join('/')}`), {
      prBodyPath: resolved,
    });
  }
  return {
    body,
    path: resolved,
  };
}

function extractPrTitle(prBody, fallbackTitle) {
  const lines = String(prBody || '').split(/\r?\n/);
  const titleIndex = lines.findIndex((line) => /^##\s+Title\s*$/i.test(line.trim()));
  if (titleIndex !== -1) {
    for (const line of lines.slice(titleIndex + 1)) {
      const value = line.trim().replace(/^#+\s*/, '');
      if (value) {
        return value;
      }
    }
  }

  const firstHeading = lines.find((line) => /^#\s+\S/.test(line.trim()));
  if (firstHeading) {
    return firstHeading.trim().replace(/^#\s+/, '');
  }

  return fallbackTitle || 'Quiver PR';
}

function buildPrCreateArgs(plan) {
  const args = [
    'pr',
    'create',
    '--base',
    plan.baseBranch,
    '--head',
    plan.branchName,
    '--title',
    plan.title,
    '--body-file',
    plan.prBodyPath,
  ];
  return args;
}

function buildPrCreatePlan(repoRoot, preflightReport, options = {}) {
  const prBody = readPrBody(repoRoot, options.prBodyPath || options.input);
  ensureNoOpenSlicesForPrBody(repoRoot, prBody.path);
  const baseBranch = String(options.baseBranch || 'main').trim() || 'main';
  const title = String(options.title || '').trim() || extractPrTitle(prBody.body, preflightReport.branchName);
  const plan = {
    baseBranch,
    branchName: preflightReport.branchName,
    ghCommand: options.ghCommand || DEFAULT_GH_COMMAND,
    prBodyPath: prBody.path,
    prBodyRelativePath: path.relative(repoRoot, prBody.path).split(path.sep).join('/'),
    remote: preflightReport.remote,
    repoRoot,
    title,
  };
  plan.args = buildPrCreateArgs(plan);
  return plan;
}

function runGhPrCreate(plan, options = {}) {
  const result = runCommand(plan.ghCommand, plan.args, {
    cwd: plan.repoRoot,
    runner: options.runner || options.ghCreateRunner || spawnSync,
  });

  if (result && result.error) {
    throw createError('GH_PR_CREATE_FAILED', formatError(`gh pr create could not be executed. ${result.error.message}`), {
      args: plan.args,
      errorCode: result.error.code,
      errorMessage: result.error.message,
    });
  }

  if (!result || typeof result.status !== 'number' || result.status !== 0) {
    const stderr = result && typeof result.stderr === 'string' ? result.stderr.trim() : '';
    const stdout = result && typeof result.stdout === 'string' ? result.stdout.trim() : '';
    throw createError('GH_PR_CREATE_FAILED', `${formatError('gh pr create failed.')}${[stderr, stdout].filter(Boolean).length > 0 ? `\n${[stderr, stdout].filter(Boolean).join('\n')}` : ''}`, {
      args: plan.args,
      status: result && result.status,
      stderr,
      stdout,
    });
  }

  return {
    status: result.status,
    stdout: typeof result.stdout === 'string' ? result.stdout : '',
    stderr: typeof result.stderr === 'string' ? result.stderr : '',
  };
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
  const sshHostAlias = ensureSshHostAlias(options.sshHostAlias);
  const identityFile = ensureIdentityFile(repoRoot, options.identityFile);

  return buildPreflightReport(repoRoot, options, {
    gh,
    auth,
    guidePath,
    remote,
    branchName,
    sshHostAlias,
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

function quoteCommandArg(arg) {
  const value = String(arg);
  return /^[A-Za-z0-9_./:=@-]+$/.test(value) ? value : JSON.stringify(value);
}

function formatPrCreateReport({ preflight, plan, result }, options = {}) {
  const dryRun = options.dryRun === true;
  const create = options.create === true;
  const lines = [
    `GitHub pr ${dryRun ? 'dry-run' : create ? 'created' : 'preflight'}`,
    `Remote: ${preflight.remote}`,
    `Branch: ${preflight.branchName}`,
    `Base: ${plan.baseBranch}`,
    `PR body: ${plan.prBodyRelativePath}`,
    `Title: ${plan.title}`,
    `Command: ${plan.ghCommand} ${plan.args.map(quoteCommandArg).join(' ')}`,
  ];

  if (preflight.sshHostAlias) {
    lines.push(`SSH host alias: ${preflight.sshHostAlias}`);
  }

  if (preflight.identityFile) {
    lines.push(`Identity file: ${preflight.identityFile}`);
  }

  if (dryRun) {
    lines.push('No PR will be created in dry-run mode.');
  } else if (!create) {
    lines.push('No PR was created. Re-run with --create after reviewing the plan.');
  } else if (result && result.stdout) {
    lines.push(result.stdout.trimEnd());
  }

  return `${lines.join('\n')}\n`;
}

module.exports = {
  DEFAULT_GH_COMMAND,
  DEFAULT_GITFLOW_GUIDE_PATH,
  DEFAULT_REMOTE,
  GitHubPreflightError,
  buildPrCreateArgs,
  buildPrCreatePlan,
  buildPreflightReport,
  extractPrTitle,
  ensureGhAuthenticated,
  ensureGhInstalled,
  ensureGitFlowGuide,
  ensureIdentityFile,
  ensureNoOpenSlicesForPrBody,
  ensureRemote,
  ensureSshHostAlias,
  ensureWorktreeReady,
  findPrBodyCandidates,
  formatGhInstallGuidance,
  formatPreflightReport,
  formatPrCreateReport,
  preflightGitHubPr,
  readPrBody,
  resolveConfiguredPath,
  resolvePrBodyPath,
  runGhPrCreate,
};
