const fs = require('fs');
const path = require('path');

const {
  currentBranch,
  fetchRemote,
  hasLocalBranch,
  hasRemoteBranch,
  isCleanWorktree,
  lsRemoteHeads,
  mergeBaseIsAncestor,
  runGit,
  statusPorcelain,
  worktreeAdd,
  worktreeList,
  worktreePrune,
  worktreeRemove,
} = require('./git');
const { parseJsonWithComments } = require('./json');
const { safeBranchName, worktreesRootForRepo } = require('./slice');

function formatError(message) {
  return `create-quiver: ${message}`;
}

function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function findSpecDir(repoRoot, specInput) {
  const value = String(specInput || '').trim();
  if (!value || value === '.') {
    throw new Error(formatError('missing spec directory. Use: npx create-quiver spec status specs/<spec-slug>'));
  }

  const resolved = path.resolve(repoRoot, value);
  if (!fs.existsSync(path.join(resolved, 'SPEC.md'))) {
    throw new Error(formatError(`missing SPEC.md in ${toPosix(path.relative(repoRoot, resolved))}`));
  }

  return resolved;
}

function listSpecSlices(specDir) {
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
      return {
        id: json.slice_id || entry.name,
        path: slicePath,
        status: String(json.status || 'draft'),
        title: json.title || json.slice_id || entry.name,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.id.localeCompare(right.id));
}

function resolveSpecIdentity(repoRoot, specDir) {
  const relativeSpecDir = toPosix(path.relative(repoRoot, specDir));
  const specSlug = path.basename(specDir);
  const branchName = `feature/${specSlug}`;
  return {
    branchName,
    relativeSpecDir,
    specSlug,
    worktreePath: path.join(worktreesRootForRepo(repoRoot, branchName), safeBranchName(branchName)),
  };
}

function findExistingWorktree(repoRoot, branchName) {
  for (const entry of worktreeList(repoRoot)) {
    const branchRef = entry.branch || '';
    if (branchRef.replace('refs/heads/', '') === branchName) {
      return entry.worktree;
    }
  }
  return '';
}

function resolveBaseRef(repoRoot, preferred = '') {
  const candidates = [preferred, 'main', 'develop'].filter(Boolean);
  for (const candidate of candidates) {
    if (hasLocalBranch(repoRoot, candidate)) {
      return candidate;
    }
    if (hasRemoteBranch(repoRoot, candidate)) {
      return `origin/${candidate}`;
    }
    if (lsRemoteHeads(repoRoot, candidate)) {
      return `origin/${candidate}`;
    }
  }
  throw new Error(formatError('missing base branch. Expected local or remote main/develop.'));
}

function resolveMergedBaseRef(repoRoot, preferred = '', remote = 'origin') {
  const candidates = [preferred, 'main', 'develop'].filter(Boolean);
  for (const candidate of candidates) {
    if (hasRemoteBranch(repoRoot, candidate, remote)) {
      return {
        baseBranch: candidate,
        baseRef: `${remote}/${candidate}`,
        remote,
      };
    }
    if (hasLocalBranch(repoRoot, candidate)) {
      return {
        baseBranch: candidate,
        baseRef: candidate,
        remote: '',
      };
    }
  }
  throw new Error(formatError('missing merge base branch. Expected local or remote main/develop.'));
}

function buildSpecStatus(repoRoot, specInput) {
  const specDir = findSpecDir(repoRoot, specInput);
  const identity = resolveSpecIdentity(repoRoot, specDir);
  const slices = listSpecSlices(specDir);
  const slice00 = slices.find((slice) => slice.id.startsWith('slice-00')) || null;
  const pendingSlices = slices.filter((slice) => slice.status !== 'completed');
  const laterSlicesBlocked = !slice00 || slice00.status !== 'completed';
  const existingWorktree = findExistingWorktree(repoRoot, identity.branchName);
  const worktreeDirty = existingWorktree ? !isCleanWorktree(existingWorktree) : false;

  return {
    ...identity,
    existingWorktree,
    laterSlicesBlocked,
    pendingSlices,
    slice00,
    slices,
    specDir,
    worktreeDirty,
  };
}

function formatSpecStatus(status) {
  const lines = [
    'Spec worktree status',
    `Spec: ${status.relativeSpecDir}`,
    `Branch: ${status.branchName}`,
    `Worktree: ${status.existingWorktree || status.worktreePath}`,
    `Worktree dirty: ${status.worktreeDirty ? 'yes' : 'no'}`,
    `slice-00: ${status.slice00 ? status.slice00.status : 'missing'}`,
    `Later slices blocked: ${status.laterSlicesBlocked ? 'yes' : 'no'}`,
    'Pending slices:',
  ];

  if (status.pendingSlices.length === 0) {
    lines.push('- none');
  } else {
    for (const slice of status.pendingSlices) {
      lines.push(`- ${slice.id}: ${slice.status}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

function startSpecWorktree(repoRoot, specInput, options = {}) {
  const specDir = findSpecDir(repoRoot, specInput);
  const identity = resolveSpecIdentity(repoRoot, specDir);
  const existingWorktree = findExistingWorktree(repoRoot, identity.branchName);
  const slices = listSpecSlices(specDir);
  const slice00 = slices.find((slice) => slice.id.startsWith('slice-00')) || null;
  const baseRef = resolveBaseRef(repoRoot, options.baseBranch);

  if (existingWorktree) {
    if (!isCleanWorktree(existingWorktree)) {
      throw new Error(formatError(`existing spec worktree is dirty: ${existingWorktree}`));
    }
    return {
      ...identity,
      baseRef,
      reused: true,
      slice00,
      worktreePath: existingWorktree,
    };
  }

  if (fs.existsSync(identity.worktreePath)) {
    throw new Error(formatError(`worktree path already exists and is not registered for ${identity.branchName}: ${identity.worktreePath}`));
  }

  if (!isCleanWorktree(repoRoot)) {
    throw new Error(formatError('current checkout is not clean. Commit or stash before starting a spec worktree.'));
  }

  worktreePrune(repoRoot);
  fs.mkdirSync(path.dirname(identity.worktreePath), { recursive: true });

  if (hasLocalBranch(repoRoot, identity.branchName)) {
    worktreeAdd(repoRoot, identity.worktreePath, identity.branchName);
  } else {
    worktreeAdd(repoRoot, identity.worktreePath, baseRef, { branch: identity.branchName });
  }

  return {
    ...identity,
    baseRef,
    currentBranch: currentBranch(repoRoot),
    reused: false,
    slice00,
  };
}

function formatSpecStartResult(result) {
  return `${[
    'Spec worktree ready',
    `Branch: ${result.branchName}`,
    `Base: ${result.baseRef}`,
    `Worktree: ${result.worktreePath}`,
    `Reused: ${result.reused ? 'yes' : 'no'}`,
    `slice-00: ${result.slice00 ? result.slice00.status : 'missing'}`,
  ].join('\n')}\n`;
}

function closeSpecWorktree(repoRoot, specInput, options = {}) {
  const specDir = findSpecDir(repoRoot, specInput);
  const identity = resolveSpecIdentity(repoRoot, specDir);
  const existingWorktree = findExistingWorktree(repoRoot, identity.branchName);
  const discard = options.discard === true;
  const dryRun = options.dryRun === true;
  const force = options.force === true;
  const remote = options.remote || 'origin';
  const base = resolveMergedBaseRef(repoRoot, options.baseBranch, remote);

  if (!existingWorktree) {
    throw new Error(formatError(`missing spec worktree for branch ${identity.branchName}.`));
  }

  if (!discard && !isCleanWorktree(existingWorktree)) {
    throw new Error(formatError(`spec worktree is dirty: ${existingWorktree}. Commit or stash before closing, or pass --discard intentionally.`));
  }

  if (!discard) {
    const branch = currentBranch(repoRoot);
    if (branch !== base.baseBranch) {
      throw new Error(formatError(`spec close must run from ${base.baseBranch}. Current branch: ${branch || '(detached)'}.`));
    }
    if (statusPorcelain(repoRoot) !== '') {
      throw new Error(formatError('main checkout is dirty. Commit or stash before closing the spec worktree.'));
    }
    if (base.remote) {
      try {
        fetchRemote(repoRoot, base.remote, [base.baseBranch]);
      } catch {
        // Local-only test repos and offline environments can still validate against the current remote ref.
      }
    }
    if (hasLocalBranch(repoRoot, identity.branchName) && !mergeBaseIsAncestor(repoRoot, identity.branchName, base.baseRef)) {
      throw new Error(formatError(`spec branch ${identity.branchName} is not merged into ${base.baseRef}. Merge the PR before cleanup, or pass --discard intentionally.`));
    }
  }

  if (dryRun) {
    return {
      ...identity,
      baseBranch: base.baseBranch,
      baseRef: base.baseRef,
      discarded: discard,
      dryRun: true,
      pulled: false,
      remote: base.remote,
      removed: false,
      worktreePath: existingWorktree,
    };
  }

  worktreeRemove(repoRoot, existingWorktree, force || discard);
  if (!discard && base.remote) {
    runGit(['pull', '--ff-only', remote, base.baseBranch], repoRoot);
  }

  return {
    ...identity,
    baseBranch: base.baseBranch,
    baseRef: base.baseRef,
    discarded: discard,
    dryRun: false,
    pulled: !discard && Boolean(base.remote),
    remote: base.remote,
    removed: true,
    worktreePath: existingWorktree,
  };
}

function formatSpecCloseResult(result) {
  const lines = [
    result.dryRun ? 'Spec close dry-run' : 'Spec worktree closed',
    `Spec: ${result.relativeSpecDir}`,
    `Branch: ${result.branchName}`,
    `Base: ${result.baseRef}`,
    `Worktree: ${result.worktreePath}`,
    `Discard: ${result.discarded ? 'yes' : 'no'}`,
  ];

  if (result.dryRun) {
    lines.push(`Would remove worktree: ${result.worktreePath}`);
    if (!result.discarded && result.remote) {
      lines.push(`Would pull: git pull --ff-only ${result.remote} ${result.baseBranch}`);
    }
  } else {
    lines.push(`Removed worktree: ${result.removed ? 'yes' : 'no'}`);
    lines.push(`Pulled main checkout: ${result.pulled ? 'yes' : 'no'}`);
  }

  return `${lines.join('\n')}\n`;
}

function ensureSpecSliceZeroComplete(repoRoot, specInput) {
  const status = buildSpecStatus(repoRoot, specInput);
  if (!status.slice00) {
    throw new Error(formatError(`spec ${status.relativeSpecDir} requires slice-00 completed before starting later slices; slice-00 is missing.`));
  }
  if (status.slice00.status !== 'completed') {
    throw new Error(formatError(`spec ${status.relativeSpecDir} requires slice-00 completed before starting later slices; current status: ${status.slice00.status}.`));
  }
  return status.slice00;
}

module.exports = {
  buildSpecStatus,
  closeSpecWorktree,
  ensureSpecSliceZeroComplete,
  findSpecDir,
  findExistingWorktree,
  formatSpecCloseResult,
  formatSpecStartResult,
  formatSpecStatus,
  listSpecSlices,
  resolveBaseRef,
  resolveMergedBaseRef,
  resolveSpecIdentity,
  startSpecWorktree,
};
