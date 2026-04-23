const fs = require('fs');
const path = require('path');
const { resolveTargetRoot, toPosixPath } = require('./paths');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function canonicalizePath(dirPath) {
  try {
    return fs.realpathSync(dirPath);
  } catch {
    return path.resolve(dirPath);
  }
}

function toAlias(ticket) {
  const parts = String(ticket || '').split('-').filter(Boolean);
  const prefix = (parts[0] || 'GEN').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const suffix = (parts[parts.length - 1] || '00').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const short = prefix.length <= 3 ? prefix : prefix.slice(0, 3);
  return `${short || 'GEN'}-${suffix || '00'}`;
}

function resolveSlicePath(sliceInput) {
  if (!fs.existsSync(sliceInput)) {
    throw new Error(`create-quiver: no existe el slice '${sliceInput}'.`);
  }

  return canonicalizePath(sliceInput);
}

function readSliceMeta(slicePath) {
  const json = readJson(slicePath);
  const ticket = typeof json.ticket === 'string' ? json.ticket.trim() : '';
  const git = json.git ?? {};
  const branchType = typeof git.branch_type === 'string' ? git.branch_type.trim() : '';
  const baseBranch = typeof git.base_branch === 'string' ? git.base_branch.trim() : '';
  const branchSlug = typeof git.branch_slug === 'string' ? git.branch_slug.trim() : '';
  const branchName = typeof git.branch_name === 'string' ? git.branch_name.trim() : '';
  const sliceId = typeof json.slice_id === 'string' ? json.slice_id.trim() : '';
  const status = String(json.status || 'draft').trim() || 'draft';

  return {
    acceptance: Array.isArray(json.acceptance) ? json.acceptance : [],
    baseBranch,
    branchName,
    branchSlug,
    branchType,
    files: Array.isArray(json.files) ? json.files : [],
    git,
    isBaseline: sliceId.startsWith('slice-00'),
    json,
    sliceId,
    slicePath,
    specFamily: null,
    specSlug: null,
    status,
    tests: Array.isArray(json.tests) ? json.tests : [],
    ticket,
  };
}

function validateSliceMetaForStart(slice) {
  if (!slice.sliceId) {
    throw new Error('create-quiver: falta "slice_id" en el slice.');
  }
  if (!slice.ticket) {
    throw new Error('create-quiver: falta "ticket" en el slice.');
  }
  if (!slice.branchType || !slice.baseBranch || !slice.branchSlug || !slice.branchName) {
    throw new Error('create-quiver: el bloque "git" debe incluir "branch_type", "base_branch", "branch_slug" y "branch_name".');
  }

  const expectedBaseByType = {
    feature: 'develop',
    bugfix: 'develop',
    hotfix: 'main',
  };

  if (!expectedBaseByType[slice.branchType]) {
    throw new Error(`create-quiver: git.branch_type invalido: "${slice.branchType}". Usa "feature", "bugfix" o "hotfix".`);
  }

  const expectedBaseBranch = expectedBaseByType[slice.branchType];
  if (slice.baseBranch !== expectedBaseBranch) {
    throw new Error(`create-quiver: git.base_branch invalido para ${slice.branchType}. Esperado: "${expectedBaseBranch}".`);
  }

  const expectedBranchName = `${slice.branchType}/${slice.ticket}-${slice.branchSlug}`;
  if (slice.branchName !== expectedBranchName) {
    throw new Error(`create-quiver: git.branch_name invalido. Esperado: "${expectedBranchName}".`);
  }
}

function resolveSliceContext(repoRoot, slicePath) {
  const absSlicePath = resolveSlicePath(slicePath);
  const relSlicePath = toPosixPath(path.relative(repoRoot, absSlicePath));
  const parts = relSlicePath.split('/');

  if (parts[0] !== 'specs' && parts[0] !== 'specs-fix') {
    throw new Error('create-quiver: el slice debe vivir dentro de specs/ o specs-fix/.');
  }

  const specFamily = parts[0];
  const specSlug = parts[1];
  const specDirRel = `${specFamily}/${specSlug}`;
  const specDirAbs = path.join(repoRoot, specDirRel);
  const slice = readSliceMeta(absSlicePath);
  slice.specFamily = specFamily;
  slice.specSlug = specSlug;
  slice.specDirRel = specDirRel;
  slice.specDirAbs = specDirAbs;
  slice.sliceRel = relSlicePath;
  slice.sliceAbs = absSlicePath;
  slice.prPath = path.join(path.dirname(absSlicePath), 'pr.md');
  return slice;
}

function activeSlicePath(repoRoot) {
  return path.join(repoRoot, 'docs', 'ai', 'ACTIVE_SLICE.md');
}

function renderActiveSlice(slice) {
  const lines = [
    '# Active Slice',
    '',
    '## Slice ID',
    '',
    slice.sliceId || 'slice-unknown',
    '',
    '## Title',
    '',
    slice.json.title || slice.sliceId || 'Untitled slice',
    '',
    '## Objective',
    '',
    slice.json.objective || 'Sin objetivo declarado.',
    '',
    '## allowed_files',
  ];

  if (Array.isArray(slice.files) && slice.files.length > 0) {
    for (const file of slice.files) {
      lines.push(`- ${file}`);
    }
  } else {
    lines.push('- n/a');
  }

  lines.push('', '## Validation Commands');
  if (Array.isArray(slice.tests) && slice.tests.length > 0) {
    for (const command of slice.tests) {
      lines.push(`- ${command}`);
    }
  } else {
    lines.push('- n/a');
  }

  lines.push('', '## Definition of Done');
  if (Array.isArray(slice.acceptance) && slice.acceptance.length > 0) {
    for (const item of slice.acceptance) {
      lines.push(`- ${item}`);
    }
  } else {
    lines.push('- n/a');
  }

  lines.push('', '## Prohibition', '', 'Do not edit any file outside allowed_files.', '');

  return `${lines.join('\n')}\n`;
}

function worktreesRootForRepo(repoRoot, branchName) {
  const repoName = path.basename(repoRoot);
  const repoParent = path.dirname(repoRoot);
  return process.env.SLICE_WORKTREES_DIR || path.join(repoParent, '.worktrees', repoName);
}

function safeBranchName(branchName) {
  return String(branchName || '').replace(/[^A-Za-z0-9._-]/g, '-');
}

module.exports = {
  canonicalizePath,
  readSliceMeta,
  resolveSliceContext,
  safeBranchName,
  activeSlicePath,
  renderActiveSlice,
  toAlias,
  validateSliceMetaForStart,
  worktreesRootForRepo,
};
