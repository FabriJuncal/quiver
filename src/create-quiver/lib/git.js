const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const DEFAULT_BASE_BRANCH_CANDIDATES = ['main', 'master', 'develop'];

function runGit(args, cwd, options = {}) {
  return cp.execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim();
}

function tryGit(args, cwd, options = {}) {
  try {
    return runGit(args, cwd, options);
  } catch {
    return '';
  }
}

function withWindowsLongPaths(args, options = {}) {
  const platform = options.platform || process.platform;
  if (platform !== 'win32') {
    return args;
  }
  return ['-c', 'core.longpaths=true', ...args];
}

function hasRef(repoRoot, ref) {
  try {
    runGit(['show-ref', '--verify', '--quiet', ref], repoRoot);
    return true;
  } catch {
    return false;
  }
}

function hasLocalBranch(repoRoot, branchName) {
  return hasRef(repoRoot, `refs/heads/${branchName}`);
}

function hasRemoteBranch(repoRoot, branchName, remote = 'origin') {
  return hasRef(repoRoot, `refs/remotes/${remote}/${branchName}`);
}

function fetchBranch(repoRoot, branchName, remote = 'origin') {
  return runGit(['fetch', remote, `${branchName}:${branchName}`], repoRoot);
}

function fetchRemote(repoRoot, remote = 'origin', args = ['--prune']) {
  return runGit(['fetch', remote, ...args], repoRoot);
}

function worktreePrune(repoRoot) {
  tryGit(withWindowsLongPaths(['worktree', 'prune']), repoRoot);
}

function worktreeList(repoRoot) {
  const text = tryGit(withWindowsLongPaths(['worktree', 'list', '--porcelain']), repoRoot);
  const entries = [];
  const chunks = text.trim().split('\n\n').filter(Boolean);

  for (const chunk of chunks) {
    const entry = {};
    for (const line of chunk.split('\n')) {
      const idx = line.indexOf(' ');
      if (idx === -1) {
        continue;
      }
      entry[line.slice(0, idx)] = line.slice(idx + 1);
    }
    if (entry.worktree) {
      entries.push(entry);
    }
  }

  return entries;
}

function worktreeAdd(repoRoot, worktreePath, ref, options = {}) {
  const args = ['worktree', 'add'];
  if (options.branch) {
    args.push('-b', options.branch);
  }
  if (options.force) {
    args.push('--force');
  }
  args.push(worktreePath, ref);
  return runGit(withWindowsLongPaths(args, options), repoRoot);
}

function worktreeRemove(repoRoot, worktreePath, force = false) {
  const args = ['worktree', 'remove'];
  if (force) {
    args.push('--force');
  }
  args.push(worktreePath);
  return runGit(withWindowsLongPaths(args), repoRoot);
}

function branchDelete(repoRoot, branchName, force = false) {
  return runGit(['branch', force ? '-D' : '-d', branchName], repoRoot);
}

function currentBranch(repoRoot) {
  return tryGit(['branch', '--show-current'], repoRoot);
}

function statusPorcelain(repoRoot) {
  if (!repoRoot || !fs.existsSync(repoRoot)) {
    return '__MISSING_WORKTREE__';
  }
  return tryGit(['status', '--porcelain'], repoRoot);
}

function remoteList(repoRoot) {
  const output = tryGit(['remote'], repoRoot);
  return output ? output.split('\n').map((line) => line.trim()).filter(Boolean) : [];
}

function hasRemote(repoRoot, remoteName = 'origin') {
  return remoteList(repoRoot).includes(remoteName);
}

function normalizeBranchName(value) {
  return String(value || '').trim();
}

function remoteHeadBranch(repoRoot, remote = 'origin') {
  const value = tryGit(['symbolic-ref', '--quiet', '--short', `refs/remotes/${remote}/HEAD`], repoRoot);
  const prefix = `${remote}/`;
  return value.startsWith(prefix) ? value.slice(prefix.length) : '';
}

function uniqueBaseCandidates(candidates) {
  const seen = new Set();
  return candidates.filter((candidate) => {
    const branch = normalizeBranchName(candidate.branch);
    if (!branch || seen.has(branch)) {
      return false;
    }
    seen.add(branch);
    candidate.branch = branch;
    return true;
  });
}

function buildBaseBranchCandidates(repoRoot, options = {}) {
  const remote = options.remote || 'origin';
  const explicitBaseBranch = normalizeBranchName(options.explicitBaseBranch);
  const preferredBaseBranch = normalizeBranchName(options.preferredBaseBranch);
  const defaults = Array.isArray(options.defaultBranches) && options.defaultBranches.length > 0
    ? options.defaultBranches
    : DEFAULT_BASE_BRANCH_CANDIDATES;

  if (explicitBaseBranch) {
    return [{ branch: explicitBaseBranch, source: '--base', explicit: true }];
  }

  return uniqueBaseCandidates([
    preferredBaseBranch ? { branch: preferredBaseBranch, source: options.preferredSource || 'slice.git.base_branch', explicit: false } : null,
    { branch: remoteHeadBranch(repoRoot, remote), source: 'remote HEAD', explicit: false },
    ...defaults.map((branch) => ({ branch, source: 'fallback', explicit: false })),
  ].filter(Boolean));
}

function resolveBaseRef(repoRoot, options = {}) {
  const remote = options.remote || 'origin';
  const candidates = buildBaseBranchCandidates(repoRoot, options);

  for (const candidate of candidates) {
    if (remote && hasRemoteBranch(repoRoot, candidate.branch, remote)) {
      return {
        baseBranch: candidate.branch,
        baseRef: `${remote}/${candidate.branch}`,
        candidates,
        explicit: candidate.explicit,
        remote,
        source: candidate.source,
      };
    }
    if (hasLocalBranch(repoRoot, candidate.branch)) {
      return {
        baseBranch: candidate.branch,
        baseRef: candidate.branch,
        candidates,
        explicit: candidate.explicit,
        remote: '',
        source: candidate.source,
      };
    }
  }

  if (options.missingOk === true) {
    const first = candidates[0] || { branch: '', source: 'fallback', explicit: false };
    return {
      baseBranch: first.branch,
      baseRef: '',
      candidates,
      explicit: first.explicit,
      remote: '',
      source: first.source,
    };
  }

  throw new Error(`create-quiver: missing base branch. Tried: ${candidates.map((candidate) => candidate.branch).join(', ') || '(none)'}.`);
}

function resolveBaseBranchName(repoRoot, options = {}) {
  const resolution = resolveBaseRef(repoRoot, {
    ...options,
    missingOk: true,
  });
  return resolution.baseBranch || DEFAULT_BASE_BRANCH_CANDIDATES[0];
}

function isCleanWorktree(repoRoot) {
  return Boolean(repoRoot && fs.existsSync(repoRoot) && isGitWorktree(repoRoot) && statusPorcelain(repoRoot) === '');
}

function isGitWorktree(repoRoot) {
  return tryGit(['rev-parse', '--is-inside-work-tree'], repoRoot) === 'true';
}

function absoluteGitDir(repoRoot) {
  return tryGit(['rev-parse', '--absolute-git-dir'], repoRoot);
}

function gitCommonDir(repoRoot) {
  const value = tryGit(['rev-parse', '--git-common-dir'], repoRoot);
  if (!value) {
    return '';
  }
  return path.isAbsolute(value) ? path.resolve(value) : path.resolve(repoRoot, value);
}

function realpathOrResolve(value) {
  try {
    return fs.realpathSync(value);
  } catch {
    return path.resolve(value);
  }
}

function isLinkedWorktree(repoRoot) {
  const gitDir = absoluteGitDir(repoRoot);
  const commonDir = gitCommonDir(repoRoot);
  return Boolean(gitDir && commonDir && realpathOrResolve(gitDir) !== realpathOrResolve(commonDir));
}

function isDetachedHead(repoRoot) {
  return currentBranch(repoRoot) === '';
}

function revListCount(repoRoot, range) {
  const output = tryGit(['rev-list', '--count', range], repoRoot);
  return Number(output || '0');
}

function mergeBaseIsAncestor(repoRoot, maybeAncestor, ref) {
  try {
    runGit(['merge-base', '--is-ancestor', maybeAncestor, ref], repoRoot);
    return true;
  } catch {
    return false;
  }
}

function lsRemoteHeads(repoRoot, branchName, remote = 'origin') {
  try {
    runGit(['ls-remote', '--exit-code', '--heads', remote, branchName], repoRoot);
    return true;
  } catch {
    return false;
  }
}

function catFileExists(repoRoot, specRef) {
  try {
    runGit(['cat-file', '-e', specRef], repoRoot);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  branchDelete,
  buildBaseBranchCandidates,
  catFileExists,
  currentBranch,
  DEFAULT_BASE_BRANCH_CANDIDATES,
  fetchBranch,
  fetchRemote,
  hasLocalBranch,
  hasRemoteBranch,
  lsRemoteHeads,
  mergeBaseIsAncestor,
  hasRemote,
  absoluteGitDir,
  gitCommonDir,
  isCleanWorktree,
  isDetachedHead,
  isGitWorktree,
  isLinkedWorktree,
  revListCount,
  remoteHeadBranch,
  remoteList,
  resolveBaseBranchName,
  resolveBaseRef,
  runGit,
  statusPorcelain,
  tryGit,
  withWindowsLongPaths,
  worktreeAdd,
  worktreeList,
  worktreePrune,
  worktreeRemove,
};
