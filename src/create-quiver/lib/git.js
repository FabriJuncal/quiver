const cp = require('child_process');

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
  tryGit(['worktree', 'prune'], repoRoot);
}

function worktreeList(repoRoot) {
  const text = tryGit(['worktree', 'list', '--porcelain'], repoRoot);
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
  return runGit(args, repoRoot);
}

function worktreeRemove(repoRoot, worktreePath, force = false) {
  const args = ['worktree', 'remove'];
  if (force) {
    args.push('--force');
  }
  args.push(worktreePath);
  return runGit(args, repoRoot);
}

function branchDelete(repoRoot, branchName, force = false) {
  return runGit(['branch', force ? '-D' : '-d', branchName], repoRoot);
}

function currentBranch(repoRoot) {
  return tryGit(['branch', '--show-current'], repoRoot);
}

function statusPorcelain(repoRoot) {
  return tryGit(['status', '--porcelain'], repoRoot);
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
  catFileExists,
  currentBranch,
  fetchBranch,
  fetchRemote,
  hasLocalBranch,
  hasRemoteBranch,
  lsRemoteHeads,
  mergeBaseIsAncestor,
  revListCount,
  runGit,
  statusPorcelain,
  tryGit,
  worktreeAdd,
  worktreeList,
  worktreePrune,
  worktreeRemove,
};
