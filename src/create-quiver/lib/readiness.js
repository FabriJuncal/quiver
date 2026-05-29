const fs = require('fs');
const path = require('path');
const { catFileExists, currentBranch, hasLocalBranch, hasRemoteBranch, mergeBaseIsAncestor, revListCount, runGit, statusPorcelain, worktreeList } = require('./git');
const { parseJsonWithComments } = require('./json');
const { createTranslator } = require('./i18n/catalog');
const { buildGraph, normalizeDeclaredDependencies, readAllSlices, SliceGraphError, topoSort } = require('./slice-graph');
const { resolveSliceContext, toAlias, validateSliceMetaForStart } = require('./slice');
const { validateProjectRelativePaths } = require('./paths');

function ensureExists(filePath, message) {
  if (!fs.existsSync(filePath)) {
    throw new Error(message);
  }
}

function readinessTranslator(options = {}) {
  return createTranslator(options.language || 'es');
}

function walkSlices(rootDir, acc, repoRoot) {
  if (!fs.existsSync(rootDir)) {
    return;
  }

  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      walkSlices(fullPath, acc, repoRoot);
      continue;
    }

    if (entry.isFile() && entry.name === 'slice.json' && fullPath.includes(`${path.sep}slices${path.sep}`)) {
      const json = parseJsonWithComments(fs.readFileSync(fullPath, 'utf8'));
      const branchName = json.git?.branch_name;
      if (!branchName) {
        continue;
      }
      acc.set(branchName, {
        sliceId: json.slice_id || '',
        files: Array.isArray(json.files) ? json.files : [],
      });
    }
  }
}

function parseWorktrees(text) {
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
    entries.push(entry);
  }

  return entries;
}

function collectOverlapWarnings(repoRoot, currentBranchName, currentFiles, baseRef = 'origin/develop') {
  const sliceMap = new Map();
  walkSlices(path.join(repoRoot, 'specs'), sliceMap, repoRoot);
  walkSlices(path.join(repoRoot, 'specs-fix'), sliceMap, repoRoot);

  const worktrees = parseWorktrees(runGit(['worktree', 'list', '--porcelain'], repoRoot));
  const warnings = [];

  for (const entry of worktrees) {
    const worktreePath = entry.worktree;
    const branchRef = entry.branch || '';
    const branchName = branchRef.replace('refs/heads/', '');

    if (!branchName || branchName === currentBranchName || worktreePath === repoRoot) {
      continue;
    }

    const meta = sliceMap.get(branchName);
    if (!meta || meta.sliceId.startsWith('slice-00')) {
      continue;
    }

    const dirty = statusPorcelain(worktreePath) !== '';
    const aheadCount = revListCount(worktreePath, `${baseRef}..HEAD`);
    const active = dirty || aheadCount > 0;

    if (!active) {
      continue;
    }

    const overlap = currentFiles.filter((item) => meta.files.includes(item));
    if (overlap.length > 0) {
      warnings.push(`${branchName}|${overlap.join(', ')}`);
    }
  }

  return warnings;
}

function validateLocalSliceArtifacts(repoRoot, slice, translator) {
  const sliceDir = path.dirname(slice.sliceAbs);
  for (const file of ['EXECUTION_BRIEF.md', 'CLOSURE_BRIEF.md']) {
    ensureExists(path.join(sliceDir, file), `create-quiver: falta '${path.posix.join(path.dirname(slice.sliceRel), file)}'.`);
  }
  console.log(translator.t('readiness.local.briefs.pass'));

  if (!Array.isArray(slice.json.files) || slice.json.files.length === 0) {
    throw new Error(`create-quiver: ${translator.t('readiness.local.files.error.empty')}`);
  }

  const invalidFiles = slice.json.files.filter((file) => typeof file !== 'string' || file.trim().length === 0);
  if (invalidFiles.length > 0) {
    throw new Error(`create-quiver: ${translator.t('readiness.local.files.error.invalid')}`);
  }
  console.log(translator.t('readiness.local.files.pass'));

  validateSliceMetaForStart(slice);
  console.log(translator.t('readiness.local.git.pass'));

  validateProjectRelativePaths(slice.files, 'slice.json files/allowed_write_paths');
  validateProjectRelativePaths(slice.expectedReadPaths, 'slice.json expected_read_paths');
  console.log(translator.t('readiness.local.paths.pass'));
}

function baseRecoveryMessage(remote, baseBranch, translator) {
  return translator.t('readiness.base.recovery', { base: baseBranch, remote, remoteRef: `${remote}/${baseBranch}` });
}

function resolveReadinessRoot(localMode) {
  try {
    return runGit(['rev-parse', '--show-toplevel'], process.cwd());
  } catch (error) {
    if (localMode) {
      return process.cwd();
    }
    throw error;
  }
}

function validateSliceDocumentedOnBase(repoRoot, slice, options = {}) {
  const translator = readinessTranslator(options);
  const gate = options.gate || 'execution';
  const remote = options.remote || 'origin';
  const baseBranch = options.baseBranch || slice.baseBranch || 'develop';
  const remoteRef = `${remote}/${baseBranch}`;
  const hasRemoteBase = hasRemoteBranch(repoRoot, baseBranch, remote);
  const hasLocalBase = hasLocalBranch(repoRoot, baseBranch);

  if (hasRemoteBase && catFileExists(repoRoot, `${remoteRef}:${slice.sliceRel}`)) {
    console.log(translator.t('readiness.documented.remote.pass', { ref: remoteRef }));
    return remoteRef;
  }

  if (hasLocalBase && catFileExists(repoRoot, `${baseBranch}:${slice.sliceRel}`)) {
    console.log(translator.t('readiness.documented.local.pass', { branch: baseBranch }));
    return baseBranch;
  }

  if (!hasRemoteBase && !hasLocalBase) {
    const guidance = baseRecoveryMessage(remote, baseBranch, translator);
    if (gate === 'validation') {
      console.log(translator.t('readiness.warn', { message: guidance }));
      return null;
    }

    throw new Error(`create-quiver: ${guidance}`);
  }

  const expectedBase = hasRemoteBase ? remoteRef : baseBranch;
  if (gate === 'validation') {
    console.log(translator.t('readiness.documented.missing_validation.warn', { ref: expectedBase }));
    return expectedBase;
  }

  throw new Error(`create-quiver: ${translator.t('readiness.documented.missing.error', { ref: expectedBase })}`);
}

function validateDeclaredDependencyContract(repoRoot, slice) {
  const declaredDependsOn = Array.isArray(slice.json.depends_on) ? slice.json.depends_on : null;
  const declaredParallelSafe = typeof slice.json.parallel_safe === 'string' ? slice.json.parallel_safe.trim() : '';
  const hasDependsOn = declaredDependsOn !== null;
  const hasParallelSafe = declaredParallelSafe.length > 0;

  if (!hasDependsOn && !hasParallelSafe) {
    return;
  }

  const graph = buildGraph(readAllSlices(repoRoot));
  const currentRef = `${slice.specSlug}/${slice.sliceId}`;
  const currentNode = graph.nodes.find((node) => node.ref === currentRef);

  if (!currentNode) {
    throw new Error(`create-quiver: No se encontro el slice actual en el grafo: ${currentRef}`);
  }

  if (hasDependsOn) {
    const declared = declaredDependsOn.map((dep) => String(dep).trim()).filter(Boolean);
    if (declared.length !== new Set(declared).size) {
      throw new Error(`create-quiver: depends_on contiene referencias duplicadas en ${currentRef}.`);
    }

    const normalizedDeclared = normalizeDeclaredDependencies(currentNode, declared);
    if (normalizedDeclared.length !== new Set(normalizedDeclared).size) {
      throw new Error(`create-quiver: depends_on contiene referencias duplicadas en ${currentRef}.`);
    }
    const currentSet = new Set(currentNode.depends_on || []);
    for (const dep of normalizedDeclared) {
      if (!currentSet.has(dep)) {
        throw new Error(`create-quiver: depends_on apunta a una referencia inexistente o invalida: ${dep}`);
      }
    }
  }

  if (declaredParallelSafe === 'never') {
    const reason = typeof slice.json.parallel_safe_reason === 'string' ? slice.json.parallel_safe_reason.trim() : '';
    if (!reason) {
      throw new Error('create-quiver: parallel_safe="never" requiere parallel_safe_reason.');
    }
  }

  try {
    // If the graph contains a cycle, topoSort will surface the path.
    topoSort(graph);
  } catch (error) {
    if (error instanceof SliceGraphError && error.code === 'CYCLE_DETECTED') {
      throw new Error(`create-quiver: El slice declarado introduce un ciclo: ${error.message}`);
    }
    throw error;
  }
}

function localCheckSummary(translator) {
  console.log(translator.t('readiness.local.summary.executed'));
  console.log(translator.t('readiness.local.summary.skipped'));
}

function checkSliceReadiness(sliceInput, options = {}) {
  const translator = readinessTranslator(options);
  const gate = options.gate || 'execution';
  const localMode = options.local === true;
  const strictOverlap = options.strictOverlap === true;
  const remote = options.remote || 'origin';
  const repoRoot = resolveReadinessRoot(localMode);
  const slice = resolveSliceContext(repoRoot, sliceInput);
  const baseBranch = options.baseBranch || slice.baseBranch || 'develop';

  for (const specFile of ['SPEC.md', 'STATUS.md', 'EVIDENCE_REPORT.md']) {
    ensureExists(path.join(repoRoot, slice.specDirRel, specFile), `create-quiver: falta '${slice.specDirRel}/${specFile}'.`);
  }
  console.log(translator.t('readiness.spec_docs.pass'));

  let baseRef = null;
  if (localMode) {
    validateLocalSliceArtifacts(repoRoot, slice, translator);
    console.log(translator.t('readiness.local.skip_base', { base: baseBranch, remoteRef: `${remote}/${baseBranch}` }));
    console.log(translator.t('readiness.local.skip_overlap'));
  } else {
    baseRef = validateSliceDocumentedOnBase(repoRoot, slice, {
      baseBranch,
      gate,
      language: options.language,
      remote,
    });
  }

  if (!localMode) {
    const overlapWarnings = collectOverlapWarnings(repoRoot, currentBranch(repoRoot), slice.files, baseRef || `${remote}/${baseBranch}`);
    if (overlapWarnings.length === 0) {
      console.log(translator.t('readiness.overlap.none.pass'));
    } else {
      for (const warning of overlapWarnings) {
        const [overlapBranch, overlapFiles] = warning.split('|');
        if (strictOverlap) {
          throw new Error(`create-quiver: ${translator.t('readiness.overlap.warning', { branch: overlapBranch, files: overlapFiles })}`);
        }
        console.log(translator.t('readiness.overlap.warn', { branch: overlapBranch, files: overlapFiles }));
      }
    }
  }

  validateDeclaredDependencyContract(repoRoot, slice);
  if (localMode) {
    localCheckSummary(translator);
  }

  switch (gate) {
    case 'ready':
      if (slice.status !== 'ready') {
        throw new Error(`create-quiver: ${translator.t('readiness.gate.ready.error_status', { status: slice.status })}`);
      }
      console.log(translator.t('readiness.gate.ready.pass'));
      break;
    case 'execution':
      if (slice.status === 'blocked') {
        throw new Error(`create-quiver: ${translator.t('readiness.gate.execution.error.blocked')}`);
      }
      if (slice.status === 'cancelled') {
        throw new Error(`create-quiver: ${translator.t('readiness.gate.execution.error.cancelled')}`);
      }
      if (slice.status === 'completed') {
        console.log(translator.t('readiness.gate.execution.warn.completed'));
      }
      if (slice.status === 'draft') {
        console.log(translator.t('readiness.gate.execution.warn.draft'));
      }
      console.log(translator.t('readiness.gate.execution.pass'));
      break;
    case 'validation':
      if (slice.status !== 'completed') {
        throw new Error(`create-quiver: ${translator.t('readiness.gate.validation.error_status')}`);
      }
      if (!slice.json.completed_at) {
        throw new Error(`create-quiver: ${translator.t('readiness.gate.validation.error_completed_at')}`);
      }
      if (!slice.json.started_at) {
        throw new Error(`create-quiver: ${translator.t('readiness.gate.validation.error_started_at')}`);
      }
      if (!slice.json.actual_hours || Number(slice.json.actual_hours) <= 0) {
        throw new Error(`create-quiver: ${translator.t('readiness.gate.validation.error_actual_hours')}`);
      }
      console.log(translator.t('readiness.gate.validation.pass'));
      break;
  }
}

function checkPrReadiness(sliceInput, options = {}) {
  const translator = readinessTranslator(options);
  const repoRoot = runGit(['rev-parse', '--show-toplevel'], process.cwd());
  const scriptDir = path.dirname(__filename);
  const slice = resolveSliceContext(repoRoot, sliceInput);
  const current = currentBranch(repoRoot);
  const prPath = path.join(path.dirname(slice.sliceAbs), 'pr.md');

  checkSliceReadiness(slice.sliceRel, { gate: 'validation', language: options.language });
  checkScope(slice.sliceRel, { language: options.language, strict: true });

  if (!slice.branchName) {
    throw new Error(`create-quiver: ${translator.t('readiness.pr.error.missing_branch')}`);
  }
  if (!fs.existsSync(prPath)) {
    throw new Error(`create-quiver: ${translator.t('readiness.pr.error.missing_pr')}`);
  }
  if (current !== slice.branchName) {
    throw new Error(`create-quiver: ${translator.t('readiness.pr.error.wrong_branch', { actual: current, expected: slice.branchName })}`);
  }
  console.log(translator.t('readiness.pr.branch.pass'));
  if (statusPorcelain(repoRoot) !== '') {
    throw new Error(`create-quiver: ${translator.t('readiness.pr.error.dirty')}`);
  }
  console.log(translator.t('readiness.pr.clean.pass'));

  const aheadCount = revListCount(repoRoot, 'origin/develop..HEAD');
  if (aheadCount <= 0) {
    if (mergeBaseIsAncestor(repoRoot, 'HEAD', 'origin/develop')) {
      throw new Error(`create-quiver: ${translator.t('readiness.pr.error.absorbed')}`);
    }
    throw new Error(`create-quiver: ${translator.t('readiness.pr.error.no_commits')}`);
  }
  console.log(translator.t('readiness.pr.commits.pass'));

  const prText = fs.readFileSync(prPath, 'utf8');
  for (const heading of ['## Title', '## Summary', '## Scope', '## Files', '## How to Test (DETAILED - REQUIRED)', '## Evidence', '## Rollback', '## Risks / Notes']) {
    if (!prText.includes(heading)) {
      throw new Error(`create-quiver: ${translator.t('readiness.pr.error.missing_section', { heading })}`);
    }
  }
  console.log(translator.t('readiness.pr.sections.pass'));

  for (const subheading of ['### Required Environment', '### Worktree Access', '### Run the Project', '### Use Cases', '### Technical Verification']) {
    if (!prText.includes(subheading)) {
      throw new Error(`create-quiver: ${translator.t('readiness.pr.error.missing_subsection', { subheading })}`);
    }
  }
  console.log(translator.t('readiness.pr.how_to_test.pass'));

  if (!/#### Case [0-9]+:/.test(prText)) {
    throw new Error(`create-quiver: ${translator.t('readiness.pr.error.no_case')}`);
  }
  console.log(translator.t('readiness.pr.case.pass'));

  if (!/git revert /.test(prText)) {
    throw new Error(`create-quiver: ${translator.t('readiness.pr.error.rollback')}`);
  }
  console.log(translator.t('readiness.pr.rollback.pass'));

  if (/^\s*-\s*`manual review`$/mi.test(prText) || /^\s*-\s*`visual check`$/mi.test(prText) || /^\s*-\s*`screen test`$/mi.test(prText) || /^\s*-\s*`visual validation`$/mi.test(prText)) {
    throw new Error('create-quiver: How to Test cannot rely only on generic phrases.');
  }

  console.log(translator.t('readiness.pr.ready.pass', { slice: slice.sliceId }));
}

function checkScope(sliceInput, options = {}) {
  const translator = readinessTranslator(options);
  const strict = options.strict === true;
  const remote = options.remote || 'origin';
  const repoRoot = runGit(['rev-parse', '--show-toplevel'], process.cwd());
  const slice = resolveSliceContext(repoRoot, sliceInput);
  const declared = slice.files;
  validateProjectRelativePaths(declared, 'slice scope path');

  const explicitBaseBranch = typeof options.baseBranch === 'string' ? options.baseBranch.trim() : '';
  const candidateBaseBranches = Array.from(new Set([
    explicitBaseBranch,
    slice.baseBranch,
    'main',
    'develop',
    'master',
  ].filter(Boolean)));

  let baseRef = '';
  let baseSource = '';
  for (const candidate of candidateBaseBranches) {
    if (hasRemoteBranch(repoRoot, candidate, remote)) {
      baseRef = `${remote}/${candidate}`;
      baseSource = explicitBaseBranch === candidate ? '--base' : candidate === slice.baseBranch ? 'slice.git.base_branch' : 'fallback';
      break;
    }
    if (hasLocalBranch(repoRoot, candidate)) {
      baseRef = candidate;
      baseSource = explicitBaseBranch === candidate ? '--base' : candidate === slice.baseBranch ? 'slice.git.base_branch' : 'fallback';
      break;
    }
  }

  let touchedRaw = '';
  if (baseRef) {
    touchedRaw = runGit(['diff', '--name-only', `${baseRef}...HEAD`], repoRoot);
    console.log(translator.t('readiness.scope.base.info', { ref: baseRef, source: baseSource }));
  } else {
    console.log(translator.t('readiness.scope.base.warn', { branches: candidateBaseBranches.join(', ') }));
    return;
  }

  if (!touchedRaw) {
    console.log(translator.t('readiness.scope.empty.warn', { ref: baseRef }));
    return;
  }

  const touched = touchedRaw.trim().split('\n').filter(Boolean);
  const autoAllowed = [
    /^specs\//,
    /^docs\//,
    /^\.worktrees\//,
    /WORKTREE_CONTEXT\.md$/,
    /EVIDENCE_REPORT\.md$/,
    /STATUS\.md$/,
    /SPEC\.md$/,
    /\/pr\.md$/,
    /\/slice\.json$/,
  ];

  const outOfScope = touched.filter((file) => {
    if (declared.includes(file)) return false;
    if (autoAllowed.some((re) => re.test(file))) return false;
    return true;
  });

  if (outOfScope.length === 0) {
    console.log(translator.t('readiness.scope.pass'));
    return;
  }

  let violationCount = 0;
  for (const file of outOfScope) {
    violationCount += 1;
    if (strict) {
      throw new Error(`create-quiver: ${translator.t('readiness.scope.error.file', { file })}`);
    }
    console.log(translator.t('readiness.scope.warn.file', { file }));
  }

  if (violationCount > 0) {
    if (strict) {
      throw new Error(translator.t('readiness.scope.error.count', { count: violationCount }));
    }
    console.log(translator.t('readiness.scope.warn.count', { count: violationCount }));
  }
}

module.exports = {
  checkPrReadiness,
  checkScope,
  checkSliceReadiness,
};
