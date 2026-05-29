const fs = require('fs');
const path = require('path');
const { branchDelete, catFileExists, currentBranch, fetchBranch, fetchRemote, hasLocalBranch, hasRemoteBranch, isGitWorktree, isLinkedWorktree, lsRemoteHeads, mergeBaseIsAncestor, revListCount, runGit, statusPorcelain, worktreeAdd, worktreeList, worktreePrune, worktreeRemove } = require('./git');
const { parseJsonWithComments } = require('./json');
const { createTranslator } = require('./i18n/catalog');
const { writeFrontMatter } = require('./init-docs');
const { withLockSync } = require('./locks');
const { relativePosixPath, resolveTargetRoot } = require('./paths');
const { ensureSpecSliceZeroComplete } = require('./spec-worktrees');
const { activeSlicePath, renderActiveSlice, resolveSliceContext, safeBranchName, toAlias, validateSliceMetaForStart, worktreesRootForRepo } = require('./slice');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function lifecycleTranslator(options = {}) {
  return createTranslator(options.language || 'es');
}

function estimateTokenCost(text) {
  return Math.max(1, Math.ceil(Buffer.byteLength(text, 'utf8') / 4));
}

function appendUniqueLine(filePath, line) {
  ensureDir(path.dirname(filePath));
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '');
  }
  const existing = fs.readFileSync(filePath, 'utf8');
  const normalized = existing.endsWith('\n') || existing.length === 0 ? existing : `${existing}\n`;
  if (!normalized.split('\n').includes(line)) {
    fs.writeFileSync(filePath, `${normalized}${line}\n`);
  }
}

function ensureLocalExclude(workdir, pattern) {
  const gitDir = runGit(['rev-parse', '--absolute-git-dir'], workdir);
  appendUniqueLine(path.join(gitDir, 'info', 'exclude'), pattern);
}

function writeWorktreeContext(targetWorktree, slice, branchName) {
  if (targetWorktree !== slice.repoRoot) {
    ensureLocalExclude(targetWorktree, 'WORKTREE_CONTEXT.md');
  }

  const lines = [
    '# Worktree Context',
    '',
    '> Archivo generado localmente por `tools/scripts/start-slice.sh`.',
    '> No se trackea en git.',
    '',
    `**Alias:** ${toAlias(slice.ticket)}`,
    `**Spec:** ${slice.specSlug}`,
    `**Spec family:** ${slice.specFamily}`,
    `**Slice:** ${slice.sliceId}`,
    `**Ticket:** ${slice.ticket}`,
    `**Branch:** ${branchName}`,
    `**Worktree:** ${targetWorktree}`,
    `**Status:** ${slice.status}`,
    '',
    '## Title',
    '',
    slice.json.title || slice.sliceId,
    '',
    '## Objective',
    '',
    slice.json.objective || 'Sin objetivo declarado.',
    '',
    '## Routes',
    '',
    Array.isArray(slice.json.ui_scope?.routes) && slice.json.ui_scope.routes.length > 0 ? slice.json.ui_scope.routes.map((item) => `- ${item}`).join('\n') : '- n/a',
    '',
    '## Components',
    '',
    Array.isArray(slice.json.ui_scope?.components) && slice.json.ui_scope.components.length > 0 ? slice.json.ui_scope.components.map((item) => `- ${item}`).join('\n') : '- n/a',
    '',
    '## Allowed Files',
    '',
    Array.isArray(slice.files) && slice.files.length > 0 ? slice.files.map((item) => `- ${item}`).join('\n') : '- n/a',
    '',
    '## Active Slice Brief',
    '',
    `- ${relativePosixPath(slice.repoRoot, activeSlicePath(slice.repoRoot))}`,
    '',
    '## Constraints',
    '',
    Array.isArray(slice.json.not_included) && slice.json.not_included.length > 0 ? slice.json.not_included.map((item) => `- ${item}`).join('\n') : '- n/a',
    '',
    '## Expected Validation',
    '',
    Array.isArray(slice.acceptance) && slice.acceptance.length > 0 ? slice.acceptance.map((item) => `- ${item}`).join('\n') : '- n/a',
    '',
  ];

  fs.writeFileSync(path.join(targetWorktree, 'WORKTREE_CONTEXT.md'), `${lines.join('\n')}\n`);
}

function writeActiveSlice(repoRoot, slice) {
  const activePath = activeSlicePath(repoRoot);
  ensureLocalExclude(repoRoot, 'docs/ai/ACTIVE_SLICE.md');

  const existed = fs.existsSync(activePath);
  fs.mkdirSync(path.dirname(activePath), { recursive: true });
  const body = renderActiveSlice(slice);
  fs.writeFileSync(activePath, body);
  writeFrontMatter(activePath, {
    purpose: 'Active slice execution brief',
    applies_when: 'implementation',
    token_cost: estimateTokenCost(body),
    last_updated: new Date().toISOString().slice(0, 10),
    supersedes: null,
  });
  return existed ? { path: activePath, replaced: true } : { path: activePath, replaced: false };
}

function removeActiveSlice(repoRoot) {
  const activePath = activeSlicePath(repoRoot);
  if (fs.existsSync(activePath)) {
    fs.rmSync(activePath);
    return true;
  }
  return false;
}

function refreshActiveSlicesBoard(repoRoot) {
  const outputPath = path.join(repoRoot, 'ACTIVE_SLICES.md');
  const gitDir = runGit(['rev-parse', '--absolute-git-dir'], repoRoot);
  appendUniqueLine(path.join(gitDir, 'info', 'exclude'), 'ACTIVE_SLICES.md');

  const sliceMap = new Map();
  const walk = (rootDir) => {
    if (!fs.existsSync(rootDir)) {
      return;
    }
    for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
      const fullPath = path.join(rootDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (entry.isFile() && entry.name === 'slice.json' && fullPath.includes(`${path.sep}slices${path.sep}`)) {
        const json = parseJsonWithComments(fs.readFileSync(fullPath, 'utf8'));
        const relPath = path.relative(repoRoot, fullPath);
        const parts = relPath.split(path.sep);
        const specFamily = parts[0];
        const specSlug = parts[1];
        const branchName = json.git?.branch_name;
        if (!branchName) {
          continue;
        }
        sliceMap.set(branchName, {
          specFamily,
          specSlug,
          relPath,
          sliceId: json.slice_id || path.basename(path.dirname(fullPath)),
          title: json.title || json.slice_id || path.basename(path.dirname(fullPath)),
          ticket: json.ticket || '',
          status: json.status || 'pending',
        });
      }
    }
  };

  walk(path.join(repoRoot, 'specs'));
  walk(path.join(repoRoot, 'specs-fix'));

  const worktrees = worktreeList(repoRoot);
  const primary = [];
  const active = [];
  const frozen = [];
  const auxiliary = [];

  const toAliasLocal = (ticket) => toAlias(ticket);

  for (const entry of worktrees) {
    const worktreePath = entry.worktree;
    const branchRef = entry.branch || '';
    const branchName = branchRef.replace('refs/heads/', '');
    if (worktreePath === repoRoot) {
      primary.push({ branch: branchName || '(detached)', path: worktreePath });
      continue;
    }
    const slice = sliceMap.get(branchName);
    if (!slice) {
      auxiliary.push({ branch: branchName || '(detached)', path: worktreePath });
      continue;
    }
    let liveStatus = slice.status;
    const liveSlicePath = path.join(worktreePath, slice.relPath);
    if (fs.existsSync(liveSlicePath)) {
      try {
        const liveJson = parseJsonWithComments(fs.readFileSync(liveSlicePath, 'utf8'));
        liveStatus = liveJson.status || liveStatus;
      } catch {
        // ignore
      }
    }
    const row = {
      alias: toAliasLocal(slice.ticket),
      spec: slice.specSlug,
      slice: slice.sliceId,
      branch: branchName,
      path: worktreePath,
      status: liveStatus,
      title: slice.title,
    };
    if (slice.sliceId.startsWith('slice-00')) {
      frozen.push(row);
    } else {
      active.push(row);
    }
  }

  active.sort((a, b) => a.alias.localeCompare(b.alias));
  frozen.sort((a, b) => a.alias.localeCompare(b.alias));
  auxiliary.sort((a, b) => a.branch.localeCompare(b.branch));

  const lines = [
    '# Active Slices',
    '',
    '> Archivo local generado por `tools/scripts/refresh-active-slices.sh`.',
    '> No se trackea en git.',
    '',
    `**Actualizado:** ${new Date().toISOString()}`,
    '',
    '## Convencion',
    '',
    '- `Alias`: identificador corto para hablar del slice sin ambiguedad',
    '- `Spec`: directorio del spec',
    '- `slice-00`: baseline congelado, solo referencia',
    '- `slice-01+`: implementacion o revalidacion',
    '',
    '## Checkout Principal',
    '',
    '| Branch | Path |',
    '|--------|------|',
  ];

  for (const row of primary) {
    lines.push(`| ${row.branch.replace(/\|/g, '\\|')} | ${row.path.replace(/\|/g, '\\|')} |`);
  }

  lines.push('', '## Implementacion Activa', '', '| Alias | Spec | Slice | Branch | Estado | Path |', '|-------|------|-------|--------|--------|------|');
  if (active.length === 0) {
    lines.push('| - | - | - | - | - | - |');
  } else {
    for (const row of active) {
      lines.push(`| ${row.alias.replace(/\|/g, '\\|')} | ${row.spec.replace(/\|/g, '\\|')} | ${row.slice.replace(/\|/g, '\\|')} | ${row.branch.replace(/\|/g, '\\|')} | ${row.status.replace(/\|/g, '\\|')} | ${row.path.replace(/\|/g, '\\|')} |`);
    }
  }

  lines.push('', '## Baselines Congelados', '', '| Alias | Spec | Slice | Branch | Estado | Path |', '|-------|------|-------|--------|--------|------|');
  if (frozen.length === 0) {
    lines.push('| - | - | - | - | - | - |');
  } else {
    for (const row of frozen) {
      lines.push(`| ${row.alias.replace(/\|/g, '\\|')} | ${row.spec.replace(/\|/g, '\\|')} | ${row.slice.replace(/\|/g, '\\|')} | ${row.branch.replace(/\|/g, '\\|')} | congelado | ${row.path.replace(/\|/g, '\\|')} |`);
    }
  }

  lines.push('', '## Worktrees Auxiliares', '', '| Branch | Path |', '|--------|------|');
  if (auxiliary.length === 0) {
    lines.push('| - | - |');
  } else {
    for (const row of auxiliary) {
      lines.push(`| ${row.branch.replace(/\|/g, '\\|')} | ${row.path.replace(/\|/g, '\\|')} |`);
    }
  }

  lines.push('', '## Recomendacion Operativa', '', '- En VS Code, dejar visibles solo `develop` y la tabla de `Implementacion Activa`.', '- Tratar la tabla de `Baselines Congelados` como solo lectura.', '- Cerrar visualmente los `Worktrees Auxiliares` salvo cuando estes trabajando ese PR o esa tarea de proceso.');
  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`);
  return outputPath;
}

function resolveBaseRef(repoRoot, baseBranch) {
  if (hasLocalBranch(repoRoot, baseBranch)) {
    return baseBranch;
  }
  if (hasRemoteBranch(repoRoot, baseBranch)) {
    return `origin/${baseBranch}`;
  }
  if (lsRemoteHeads(repoRoot, baseBranch)) {
    try {
      fetchBranch(repoRoot, baseBranch);
      return `origin/${baseBranch}`;
    } catch {
      throw new Error(`create-quiver: origin existe pero no se pudo actualizar '${baseBranch}'. Revisa conectividad o crea la rama local '${baseBranch}' antes de correr start-slice.`);
    }
  }
  throw new Error(`create-quiver: no se encontró '${baseBranch}' como rama local ni como ref remota 'origin/${baseBranch}'. Crea la rama base localmente o configura origin antes de correr start-slice.`);
}

function findExistingWorktreeForBranch(repoRoot, branchName) {
  for (const entry of worktreeList(repoRoot)) {
    const branchRef = entry.branch || '';
    const currentBranch = branchRef.replace('refs/heads/', '');
    if (currentBranch === branchName) {
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

function formatMissingSliceWorktree(branchName, worktreePath) {
  return [
    `create-quiver: registered slice worktree is missing or stale for ${branchName}: ${worktreePath}`,
    'Recovery:',
    '- Run `git worktree prune` from the main checkout, then retry the slice command.',
    '- If the directory was moved manually, restore it or remove the stale git worktree registration intentionally.',
    '- Do not create a nested replacement worktree from inside another worktree.',
  ].join('\n');
}

function formatNestedSliceWorktree(branchName, existingWorktreePath = '') {
  return [
    `create-quiver: refusing to create a slice worktree from inside a linked worktree for ${branchName}.`,
    'Recovery:',
    existingWorktreePath
      ? `- Use the existing worktree: ${existingWorktreePath}`
      : '- Return to the main checkout and rerun the command.',
    '- This prevents nested .worktrees paths and conflicting slice worktrees.',
  ].join('\n');
}

function startSlice(sliceInput, options = {}) {
  const translator = lifecycleTranslator(options);
  const allowDraft = options.allowDraft === true || process.env.ALLOW_DRAFT_SLICE === '1';
  const repoRoot = runGit(['rev-parse', '--show-toplevel'], process.cwd());
  const slice = resolveSliceContext(repoRoot, sliceInput);
  slice.repoRoot = repoRoot;

  if (!slice.isBaseline) {
    ensureSpecSliceZeroComplete(repoRoot, slice.specDirAbs);
  }

  validateSliceMetaForStart(slice);

  if (slice.status === 'blocked') {
    throw new Error(`create-quiver: ${translator.t('lifecycle.start.error.blocked')}`);
  }
  if (slice.status === 'cancelled') {
    throw new Error(`create-quiver: ${translator.t('lifecycle.start.error.cancelled')}`);
  }
  if (slice.status === 'completed') {
    console.log(translator.t('lifecycle.start.warn.completed'));
  }
  if (slice.status === 'draft' && !allowDraft) {
    throw new Error(`create-quiver: ${translator.t('lifecycle.start.error.draft')}`);
  }
  if (slice.status === 'draft') {
    console.log(translator.t('lifecycle.start.warn.draft'));
  }

  return withLockSync(repoRoot, `slice-worktree-${slice.branchName}`, {
    command: 'start-slice',
    metadata: {
      branch: slice.branchName,
      slice: slice.sliceRel,
    },
  }, () => {
  const worktreesRoot = worktreesRootForRepo(repoRoot, slice.branchName);
  const worktreePath = path.join(worktreesRoot, safeBranchName(slice.branchName));
  const existingWorktreePath = findExistingWorktreeForBranch(repoRoot, slice.branchName);

  if (existingWorktreePath && (!fs.existsSync(existingWorktreePath) || !isGitWorktree(existingWorktreePath))) {
    throw new Error(formatMissingSliceWorktree(slice.branchName, existingWorktreePath));
  }

  if (existingWorktreePath) {
    if (isLinkedWorktree(repoRoot) && !sameRealPath(repoRoot, existingWorktreePath)) {
      throw new Error(formatNestedSliceWorktree(slice.branchName, existingWorktreePath));
    }
    writeWorktreeContext(existingWorktreePath, slice, slice.branchName);
    const activeSlice = writeActiveSlice(repoRoot, slice);
    if (activeSlice.replaced) {
      console.log(translator.t('lifecycle.active_slice.replaced'));
    } else {
      console.log(translator.t('lifecycle.active_slice.wrote'));
    }
    refreshActiveSlicesBoard(repoRoot);
    console.log(translator.t('lifecycle.start.existing_worktree'));
    console.log(translator.t('lifecycle.label.alias', { value: toAlias(slice.ticket) }));
    console.log(translator.t('lifecycle.label.spec', { value: slice.specSlug }));
    console.log(translator.t('lifecycle.label.slice', { value: slice.sliceId }));
    console.log(translator.t('lifecycle.label.ticket', { value: slice.ticket }));
    console.log(translator.t('lifecycle.label.branch', { value: slice.branchName }));
    console.log(translator.t('lifecycle.label.base', { value: slice.baseBranch }));
    console.log(translator.t('lifecycle.label.worktree', { value: existingWorktreePath }));
    return { worktreePath: existingWorktreePath, reused: true };
  }

  if (isLinkedWorktree(repoRoot)) {
    throw new Error(formatNestedSliceWorktree(slice.branchName));
  }

  worktreePrune(repoRoot);

  if (fs.existsSync(worktreePath) && !fs.existsSync(path.join(worktreePath, '.git'))) {
    throw new Error(`create-quiver: la ruta '${worktreePath}' ya existe y no parece un worktree git.`);
  }

  ensureDir(worktreesRoot);
  try {
    fetchRemote(repoRoot, 'origin', ['--prune']);
  } catch {
    // ignore network issues in smoke environments
  }

  if (hasLocalBranch(repoRoot, slice.branchName)) {
    worktreeAdd(repoRoot, worktreePath, slice.branchName);
  } else if (lsRemoteHeads(repoRoot, slice.branchName)) {
    try {
      fetchBranch(repoRoot, slice.branchName);
    } catch {
      // ignore and let worktree add try the remote ref path
    }
    worktreeAdd(repoRoot, worktreePath, slice.branchName);
  } else {
    const baseRef = resolveBaseRef(repoRoot, slice.baseBranch);
    worktreeAdd(repoRoot, worktreePath, baseRef, { branch: slice.branchName });
  }

  writeWorktreeContext(worktreePath, slice, slice.branchName);
  const activeSlice = writeActiveSlice(repoRoot, slice);
  if (activeSlice.replaced) {
    console.log(translator.t('lifecycle.active_slice.replaced'));
  } else {
    console.log(translator.t('lifecycle.active_slice.wrote'));
  }
  refreshActiveSlicesBoard(repoRoot);

  console.log(translator.t('lifecycle.start.ready'));
  console.log(translator.t('lifecycle.label.alias', { value: toAlias(slice.ticket) }));
  console.log(translator.t('lifecycle.label.spec', { value: slice.specSlug }));
  console.log(translator.t('lifecycle.label.slice', { value: slice.sliceId }));
  console.log(translator.t('lifecycle.label.ticket', { value: slice.ticket }));
  console.log(translator.t('lifecycle.label.branch_type', { value: slice.branchType }));
  console.log(translator.t('lifecycle.label.base', { value: slice.baseBranch }));
  console.log(translator.t('lifecycle.label.slug', { value: slice.branchSlug }));
  console.log(translator.t('lifecycle.label.branch', { value: slice.branchName }));
  console.log(translator.t('lifecycle.label.worktree', { value: worktreePath }));
  console.log(translator.t('lifecycle.label.context', { value: `${worktreePath}/WORKTREE_CONTEXT.md` }));
  return { worktreePath, reused: false };
  });
}

function cleanupSlice(sliceInput, options = {}) {
  const closeBaseline = options.closeBaseline === true;
  const discard = options.discard === true;
  const forceDelete = options.force === true;
  const dryRun = options.dryRun === true;
  const repoRoot = resolveTargetRoot(process.cwd(), '.');
  const slice = resolveSliceContext(repoRoot, sliceInput);
  const worktreesRoot = worktreesRootForRepo(repoRoot, slice.branchName);
  const worktreePath = path.join(worktreesRoot, safeBranchName(slice.branchName));

  if (slice.isBaseline && !closeBaseline) {
    console.log(`INFO: '${slice.sliceId}' es baseline. El worktree queda congelado por default.`);
    console.log('INFO: Usa --close-baseline solo cuando la primera ola del spec ya este estable o mergeada.');
    return;
  }

  if (!discard) {
    const branch = currentBranch(repoRoot);
    if (branch !== 'develop') {
      throw new Error(`create-quiver: el cleanup normal debe correrse desde develop. Rama actual: ${branch}`);
    }
    if (statusPorcelain(repoRoot) !== '') {
      throw new Error('create-quiver: el checkout actual no esta limpio. Limpialo antes del cleanup.');
    }

    try {
      fetchRemote(repoRoot, 'origin', ['develop']);
    } catch {
      // ignore
    }

    const localDevelopSha = runGit(['rev-parse', 'HEAD'], repoRoot);
    const remoteDevelopSha = runGit(['rev-parse', 'origin/develop'], repoRoot);
    if (localDevelopSha !== remoteDevelopSha) {
      throw new Error('create-quiver: develop local no esta actualizado. Ejecuta git pull --ff-only antes del cleanup.');
    }

    if (hasLocalBranch(repoRoot, slice.branchName)) {
      if (!mergeBaseIsAncestor(repoRoot, slice.branchName, 'origin/develop')) {
        throw new Error(`create-quiver: la rama '${slice.branchName}' no esta mergeada en origin/develop. Usa --discard si el slice se descarta.`);
      }
    }
  }

  const worktreeExists = fs.existsSync(worktreePath);
  const branchExists = hasLocalBranch(repoRoot, slice.branchName);
  if (!worktreeExists && !branchExists) {
    throw new Error(`create-quiver: no existe worktree ni rama local para '${slice.sliceId}'.`);
  }

  const removeWorktree = () => worktreeRemove(repoRoot, worktreePath, forceDelete || discard);
  const removeBranch = () => branchDelete(repoRoot, slice.branchName, forceDelete || discard);

  if (dryRun) {
    console.log(`DRY RUN: slice=${slice.sliceId} branch=${slice.branchName}`);
    if (worktreeExists) {
      console.log(`DRY RUN: git worktree remove ${forceDelete || discard ? '--force ' : ''}${worktreePath}`);
    }
    if (branchExists) {
      console.log(`DRY RUN: git branch ${forceDelete || discard ? '-D' : '-d'} ${slice.branchName}`);
    }
    return;
  }

  if (worktreeExists) {
    removeWorktree();
    console.log(`PASS: Worktree eliminado: ${worktreePath}`);
  }
  if (branchExists) {
    removeBranch();
    console.log(`PASS: Rama local eliminada: ${slice.branchName}`);
  }

  if (removeActiveSlice(repoRoot)) {
    console.log('PASS: ACTIVE_SLICE.md eliminado');
  }

  refreshActiveSlicesBoard(repoRoot);
  console.log(`PASS: Cleanup finalizado para '${slice.sliceId}'.`);
}

module.exports = {
  cleanupSlice,
  refreshActiveSlicesBoard,
  startSlice,
};
