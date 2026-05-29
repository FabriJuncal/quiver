const fs = require('fs');
const path = require('path');

const {
  currentBranch,
  fetchRemote,
  hasLocalBranch,
  hasRemoteBranch,
  isGitWorktree,
  isLinkedWorktree,
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
const { acquireLock, releaseLock, withLockSync } = require('./locks');
const { createTranslator } = require('./i18n/catalog');
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

function sameRealPath(left, right) {
  try {
    return fs.realpathSync(left) === fs.realpathSync(right);
  } catch {
    return path.resolve(left) === path.resolve(right);
  }
}

function recoveryForMissingWorktree(branchName, worktreePath) {
  return [
    `registered spec worktree is missing or stale for ${branchName}: ${worktreePath}`,
    'Recovery:',
    '- Run `git worktree prune` from the main checkout, then retry `npx create-quiver spec start specs/<spec-slug>`.',
    '- If the directory was moved manually, restore it or remove the stale git worktree registration intentionally.',
    '- Do not create a nested replacement worktree from inside another worktree.',
  ].join('\n');
}

function recoveryForNestedWorktree(branchName, existingWorktree = '') {
  return [
    `refusing to create a spec worktree from inside a linked worktree for ${branchName}.`,
    'Recovery:',
    existingWorktree
      ? `- Use the existing spec worktree: ${existingWorktree}`
      : '- Return to the main checkout and rerun the command.',
    '- This prevents nested .worktrees paths and conflicting persistent spec worktrees.',
  ].join('\n');
}

function assertExistingWorktreeUsable(branchName, worktreePath) {
  if (!worktreePath) {
    return;
  }
  if (!fs.existsSync(worktreePath) || !isGitWorktree(worktreePath)) {
    throw new Error(formatError(recoveryForMissingWorktree(branchName, worktreePath)));
  }
  if (!isCleanWorktree(worktreePath)) {
    throw new Error(formatError(`existing spec worktree is dirty: ${worktreePath}\nRecovery:\n- Commit or stash changes inside the spec worktree.\n- Then rerun the command.`));
  }
}

function parseDirtyStatusFiles(rawStatus) {
  return String(rawStatus || '')
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith('?? ')) {
        return line.slice(3).trim();
      }
      const entry = (line[2] === ' ' ? line.slice(3) : line[1] === ' ' ? line.slice(2) : line.slice(3)).trim();
      return entry.includes(' -> ') ? entry.split(' -> ').pop().trim() : entry;
    })
    .filter(Boolean);
}

function formatDirtyCheckoutRecovery(repoRoot) {
  const files = parseDirtyStatusFiles(statusPorcelain(repoRoot));
  const lines = [
    'current checkout is not clean. Starting a spec worktree needs a clean main checkout.',
  ];

  if (files.length > 0) {
    lines.push('Dirty files:');
    for (const file of files.slice(0, 20)) {
      lines.push(`- ${file}`);
    }
    if (files.length > 20) {
      lines.push(`- ...and ${files.length - 20} more`);
    }
  }

  lines.push(
    'Safe options:',
    '- Commit the current changes if they belong to the active slice.',
    '- Stash changes manually after reviewing them.',
    '- Move this work to a separate worktree before starting the spec.',
    '- Abort and rerun from a clean checkout.',
  );

  return lines.filter((line) => line !== '').join('\n');
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
  const expectedPathExists = fs.existsSync(identity.worktreePath);
  const expectedPathUnregistered = Boolean(!existingWorktree && expectedPathExists);
  const worktreeMissing = Boolean(existingWorktree && (!fs.existsSync(existingWorktree) || !isGitWorktree(existingWorktree)))
    || expectedPathUnregistered;
  const worktreeDirty = existingWorktree && !worktreeMissing ? !isCleanWorktree(existingWorktree) : false;

  return {
    ...identity,
    existingWorktree,
    laterSlicesBlocked,
    pendingSlices,
    slice00,
    slices,
    specDir,
    worktreeDirty,
    worktreeExpectedPathUnregistered: expectedPathUnregistered,
    worktreeMissing,
  };
}

function formatSpecStatus(status, options = {}) {
  const translator = createTranslator(options.language);
  const lines = [
    translator.t('spec_status.title'),
    translator.t('spec_status.spec', { path: status.relativeSpecDir }),
    translator.t('spec_status.branch', { branch: status.branchName }),
    translator.t('spec_status.worktree', { path: status.existingWorktree || status.worktreePath }),
    translator.t('spec_status.worktree_missing_stale', { value: status.worktreeMissing ? translator.t('common.yes') : translator.t('common.no') }),
    translator.t('spec_status.worktree_registered', { value: status.existingWorktree ? translator.t('common.yes') : translator.t('common.no') }),
    status.worktreeExpectedPathUnregistered ? translator.t('spec_status.worktree_note_unregistered') : '',
    translator.t('spec_status.worktree_dirty', { value: status.worktreeDirty ? translator.t('common.yes') : translator.t('common.no') }),
    `slice-00: ${status.slice00 ? status.slice00.status : 'missing'}`,
    translator.t('spec_status.later_slices_blocked', { value: status.laterSlicesBlocked ? translator.t('common.yes') : translator.t('common.no') }),
    translator.t('spec_status.pending_slices'),
  ];

  if (status.pendingSlices.length === 0) {
    lines.push(`- ${translator.t('common.none')}`);
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
  const slices = listSpecSlices(specDir);
  const slice00 = slices.find((slice) => slice.id.startsWith('slice-00')) || null;
  const baseRef = resolveBaseRef(repoRoot, options.baseBranch);

  const run = () => {
    const existingWorktree = findExistingWorktree(repoRoot, identity.branchName);
    const currentIsLinkedWorktree = isLinkedWorktree(repoRoot);

    if (existingWorktree) {
      assertExistingWorktreeUsable(identity.branchName, existingWorktree);
      if (currentIsLinkedWorktree && !sameRealPath(repoRoot, existingWorktree)) {
        throw new Error(formatError(recoveryForNestedWorktree(identity.branchName, existingWorktree)));
      }
      return {
        ...identity,
        baseRef,
        dryRun: options.dryRun === true,
        reused: true,
        slice00,
        worktreePath: existingWorktree,
      };
    }

    if (currentIsLinkedWorktree) {
      throw new Error(formatError(recoveryForNestedWorktree(identity.branchName)));
    }

    if (fs.existsSync(identity.worktreePath)) {
      throw new Error(formatError(`worktree path already exists and is not registered for ${identity.branchName}: ${identity.worktreePath}\nRecovery:\n- Inspect the path and move or remove it intentionally before rerunning.\n- Run \`git worktree list\` to verify registered worktrees.`));
    }

    if (!isCleanWorktree(repoRoot)) {
      throw new Error(formatError(formatDirtyCheckoutRecovery(repoRoot)));
    }

    if (options.dryRun === true) {
      return {
        ...identity,
        baseRef,
        currentBranch: currentBranch(repoRoot),
        dryRun: true,
        reused: false,
        slice00,
      };
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
      dryRun: false,
      reused: false,
      slice00,
    };
  };

  if (options.dryRun === true) {
    return run();
  }

  return withLockSync(repoRoot, `spec-worktree-${identity.specSlug}`, {
    command: 'spec start',
    metadata: {
      branch: identity.branchName,
      spec: identity.relativeSpecDir,
    },
  }, run);
}

function formatSpecStartResult(result, options = {}) {
  const translator = createTranslator(options.language);
  return `${[
    result.dryRun ? translator.t('spec_start.title.dry_run') : translator.t('spec_start.title.ready'),
    translator.t('spec_start.branch', { branch: result.branchName }),
    translator.t('spec_start.base', { base: result.baseRef }),
    translator.t('spec_start.worktree', { path: result.worktreePath }),
    translator.t('spec_start.reused', { value: result.reused ? translator.t('common.yes') : translator.t('common.no') }),
    `slice-00: ${result.slice00 ? result.slice00.status : 'missing'}`,
    result.dryRun && !result.reused ? translator.t('spec_start.would_create_worktree', { path: result.worktreePath }) : '',
  ].filter(Boolean).join('\n')}\n`;
}

function closeSpecWorktree(repoRoot, specInput, options = {}) {
  const specDir = findSpecDir(repoRoot, specInput);
  const identity = resolveSpecIdentity(repoRoot, specDir);
  const lock = options.dryRun === true ? null : acquireLock(repoRoot, `spec-worktree-${identity.specSlug}`, {
    command: 'spec close',
    metadata: {
      branch: identity.branchName,
      spec: identity.relativeSpecDir,
    },
  });
  try {
  const existingWorktree = findExistingWorktree(repoRoot, identity.branchName);
  const discard = options.discard === true;
  const dryRun = options.dryRun === true;
  const force = options.force === true;
  const remote = options.remote || 'origin';
  const base = resolveMergedBaseRef(repoRoot, options.baseBranch, remote);

  if (!existingWorktree) {
    throw new Error(formatError(`missing spec worktree for branch ${identity.branchName}.`));
  }

  if (!fs.existsSync(existingWorktree) || !isGitWorktree(existingWorktree)) {
    throw new Error(formatError(recoveryForMissingWorktree(identity.branchName, existingWorktree)));
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
  } finally {
    releaseLock(lock);
  }
}

function formatSpecCloseResult(result, options = {}) {
  const translator = createTranslator(options.language);
  const lines = [
    result.dryRun ? translator.t('spec_close.title.dry_run') : translator.t('spec_close.title.closed'),
    translator.t('spec_close.spec', { path: result.relativeSpecDir }),
    translator.t('spec_close.branch', { branch: result.branchName }),
    translator.t('spec_close.base', { base: result.baseRef }),
    translator.t('spec_close.worktree', { path: result.worktreePath }),
    translator.t('spec_close.discard', { value: result.discarded ? translator.t('common.yes') : translator.t('common.no') }),
  ];

  if (result.dryRun) {
    lines.push(translator.t('spec_close.would_remove_worktree', { path: result.worktreePath }));
    if (!result.discarded && result.remote) {
      lines.push(translator.t('spec_close.would_pull', { command: `git pull --ff-only ${result.remote} ${result.baseBranch}` }));
    }
  } else {
    lines.push(translator.t('spec_close.removed_worktree', { value: result.removed ? translator.t('common.yes') : translator.t('common.no') }));
    lines.push(translator.t('spec_close.pulled_main_checkout', { value: result.pulled ? translator.t('common.yes') : translator.t('common.no') }));
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
