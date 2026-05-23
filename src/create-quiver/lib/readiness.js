const fs = require('fs');
const path = require('path');
const { catFileExists, currentBranch, hasLocalBranch, hasRemoteBranch, mergeBaseIsAncestor, revListCount, runGit, statusPorcelain, worktreeList } = require('./git');
const { parseJsonWithComments } = require('./json');
const { buildGraph, normalizeDeclaredDependencies, readAllSlices, SliceGraphError, topoSort } = require('./slice-graph');
const { resolveSliceContext, toAlias } = require('./slice');

function ensureExists(filePath, message) {
  if (!fs.existsSync(filePath)) {
    throw new Error(message);
  }
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

function validateLocalSliceArtifacts(repoRoot, slice) {
  const sliceDir = path.dirname(slice.sliceAbs);
  for (const file of ['EXECUTION_BRIEF.md', 'CLOSURE_BRIEF.md']) {
    ensureExists(path.join(sliceDir, file), `create-quiver: falta '${path.posix.join(path.dirname(slice.sliceRel), file)}'.`);
  }
  console.log('PASS: El slice local tiene EXECUTION_BRIEF.md y CLOSURE_BRIEF.md.');

  if (!Array.isArray(slice.json.files) || slice.json.files.length === 0) {
    throw new Error('create-quiver: slice.json debe declarar al menos un archivo en files para validacion local.');
  }

  const invalidFiles = slice.json.files.filter((file) => typeof file !== 'string' || file.trim().length === 0);
  if (invalidFiles.length > 0) {
    throw new Error('create-quiver: slice.json.files contiene entradas invalidas.');
  }
  console.log('PASS: slice.json declara archivos de alcance.');
}

function baseRecoveryMessage(remote, baseBranch) {
  return `No se encontro la base '${baseBranch}' como rama local ni como '${remote}/${baseBranch}'. Para validacion estructural usa --local; para validacion contra otra base usa --base <branch>; o configura/fetchea el remoto '${remote}'.`;
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
  const gate = options.gate || 'execution';
  const remote = options.remote || 'origin';
  const baseBranch = options.baseBranch || slice.baseBranch || 'develop';
  const remoteRef = `${remote}/${baseBranch}`;
  const hasRemoteBase = hasRemoteBranch(repoRoot, baseBranch, remote);
  const hasLocalBase = hasLocalBranch(repoRoot, baseBranch);

  if (hasRemoteBase && catFileExists(repoRoot, `${remoteRef}:${slice.sliceRel}`)) {
    console.log(`PASS: El slice ya existe en ${remoteRef} (PR base documental mergeado).`);
    return remoteRef;
  }

  if (hasLocalBase && catFileExists(repoRoot, `${baseBranch}:${slice.sliceRel}`)) {
    console.log(`PASS: El slice ya existe en ${baseBranch} local (modo sin remote).`);
    return baseBranch;
  }

  if (!hasRemoteBase && !hasLocalBase) {
    const guidance = baseRecoveryMessage(remote, baseBranch);
    if (gate === 'validation') {
      console.log(`WARN: ${guidance}`);
      return null;
    }

    throw new Error(`create-quiver: ${guidance}`);
  }

  const expectedBase = hasRemoteBase ? remoteRef : baseBranch;
  if (gate === 'validation') {
    console.log(`WARN: El slice no existe todavia en ${expectedBase}. El PR base documental sigue pendiente de merge. Podes abrir el PR del slice igual si el humano mergea en orden.`);
    return expectedBase;
  }

  throw new Error(`create-quiver: el slice no existe en ${expectedBase}. Mergea primero el PR base documental o usa --local para validar solo estructura local.`);
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

function checkSliceReadiness(sliceInput, options = {}) {
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
  console.log('PASS: El spec local tiene SPEC.md, STATUS.md y EVIDENCE_REPORT.md.');

  let baseRef = null;
  if (localMode) {
    validateLocalSliceArtifacts(repoRoot, slice);
    console.log(`INFO: Modo local: se omite validacion de existencia del slice en ${remote}/${baseBranch} o ${baseBranch}.`);
    console.log('INFO: Modo local: se omite validacion de overlap contra worktrees activos basada en rama remota/base.');
  } else {
    baseRef = validateSliceDocumentedOnBase(repoRoot, slice, {
      baseBranch,
      gate,
      remote,
    });
  }

  if (!localMode) {
    const overlapWarnings = collectOverlapWarnings(repoRoot, currentBranch(repoRoot), slice.files, baseRef || `${remote}/${baseBranch}`);
    if (overlapWarnings.length === 0) {
      console.log('PASS: No se detecto overlap con worktrees activos.');
    } else {
      for (const warning of overlapWarnings) {
        const [overlapBranch, overlapFiles] = warning.split('|');
        if (strictOverlap) {
          throw new Error(`create-quiver: Overlap con worktree activo '${overlapBranch}': ${overlapFiles}`);
        }
        console.log(`WARN: Overlap con worktree activo '${overlapBranch}': ${overlapFiles}`);
      }
    }
  }

  validateDeclaredDependencyContract(repoRoot, slice);

  switch (gate) {
    case 'ready':
      if (slice.status !== 'ready') {
        throw new Error(`create-quiver: Gate ready: slice.json debe estar en status=ready. Estado actual: ${slice.status}. Completa la especificacion en el Track 1 antes de pasar a ejecucion.`);
      }
      console.log('PASS: Gate ready: el slice esta marcado como ready para ejecucion.');
      break;
    case 'execution':
      if (slice.status === 'blocked') {
        throw new Error('create-quiver: El slice esta bloqueado (status=blocked). Resolve el bloqueante antes de ejecutar.');
      }
      if (slice.status === 'cancelled') {
        throw new Error('create-quiver: El slice esta cancelado (status=cancelled).');
      }
      if (slice.status === 'completed') {
        console.log('WARN: El slice ya figura como completed. Revisa si realmente corresponde reejecutarlo.');
      }
      if (slice.status === 'draft') {
        console.log("WARN: El slice esta en estado 'draft'. Considera marcarlo como 'ready' antes de ejecutar.");
      }
      console.log('PASS: Gate execution: metadata y precondiciones minimas OK.');
      break;
    case 'validation':
      if (slice.status !== 'completed') {
        throw new Error('create-quiver: Para gate validation, slice.json debe estar en status=completed.');
      }
      if (!slice.json.completed_at) {
        throw new Error('create-quiver: Para gate validation, slice.json debe tener completed_at.');
      }
      if (!slice.json.started_at) {
        throw new Error('create-quiver: Para gate validation, slice.json debe tener started_at.');
      }
      if (!slice.json.actual_hours || Number(slice.json.actual_hours) <= 0) {
        throw new Error('create-quiver: Para gate validation, slice.json debe tener actual_hours > 0.');
      }
      console.log('PASS: Gate validation: slice marcado como completado y con trazabilidad minima.');
      break;
  }
}

function checkPrReadiness(sliceInput) {
  const repoRoot = runGit(['rev-parse', '--show-toplevel'], process.cwd());
  const scriptDir = path.dirname(__filename);
  const slice = resolveSliceContext(repoRoot, sliceInput);
  const current = currentBranch(repoRoot);
  const prPath = path.join(path.dirname(slice.sliceAbs), 'pr.md');

  checkSliceReadiness(slice.sliceRel, { gate: 'validation' });
  checkScope(slice.sliceRel, { strict: true });

  if (!slice.branchName) {
    throw new Error('create-quiver: Falta git.branch_name en el slice.');
  }
  if (!fs.existsSync(prPath)) {
    throw new Error('create-quiver: Falta pr.md junto al slice.');
  }
  if (current !== slice.branchName) {
    throw new Error(`create-quiver: Debes ejecutar este check desde la rama del slice. Actual: ${current} Esperada: ${slice.branchName}`);
  }
  console.log('PASS: La rama actual coincide con la rama declarada por el slice.');
  if (statusPorcelain(repoRoot) !== '') {
    throw new Error('create-quiver: El worktree no esta limpio. Cerra la implementacion antes de abrir el PR.');
  }
  console.log('PASS: El worktree esta limpio.');

  const aheadCount = revListCount(repoRoot, 'origin/develop..HEAD');
  if (aheadCount <= 0) {
    if (mergeBaseIsAncestor(repoRoot, 'HEAD', 'origin/develop')) {
      throw new Error('create-quiver: La rama ya fue absorbida por origin/develop. Este gate aplica antes del merge.');
    }
    throw new Error('create-quiver: La rama no tiene commits propios respecto de origin/develop.');
  }
  console.log('PASS: La rama tiene commits propios contra origin/develop.');

  const prText = fs.readFileSync(prPath, 'utf8');
  for (const heading of ['## Title', '## Summary', '## Scope', '## Files', '## How to Test (DETAILED - REQUIRED)', '## Evidence', '## Rollback', '## Risks / Notes']) {
    if (!prText.includes(heading)) {
      throw new Error(`create-quiver: Falta la seccion obligatoria '${heading}' en pr.md.`);
    }
  }
  console.log('PASS: pr.md contiene las secciones obligatorias.');

  for (const subheading of ['### Required Environment', '### Worktree Access', '### Run the Project', '### Use Cases', '### Technical Verification']) {
    if (!prText.includes(subheading)) {
      throw new Error(`create-quiver: Falta la subseccion '${subheading}' dentro de How to Test.`);
    }
  }
  console.log('PASS: How to Test incluye entorno, acceso al worktree, arranque, casos de uso y verificación técnica.');

  if (!/#### Case [0-9]+:/.test(prText)) {
    throw new Error('create-quiver: How to Test debe tener al menos un caso de uso documentado (#### Case 1: ...).');
  }
  console.log('PASS: Al menos un caso de uso documentado.');

  if (!/git revert /.test(prText)) {
    throw new Error('create-quiver: Rollback debe incluir al menos un comando git revert.');
  }
  console.log('PASS: Rollback incluye comando git revert.');

  if (/^\s*-\s*`manual review`$/mi.test(prText) || /^\s*-\s*`visual check`$/mi.test(prText) || /^\s*-\s*`screen test`$/mi.test(prText) || /^\s*-\s*`visual validation`$/mi.test(prText)) {
    throw new Error('create-quiver: How to Test cannot rely only on generic phrases.');
  }

  console.log(`PASS: Gate PR listo para '${slice.sliceId}'.`);
}

function checkScope(sliceInput, options = {}) {
  const strict = options.strict === true;
  const repoRoot = runGit(['rev-parse', '--show-toplevel'], process.cwd());
  const slice = resolveSliceContext(repoRoot, sliceInput);
  const declared = slice.files;

  let touchedRaw = '';
  if (hasRemoteBranch(repoRoot, 'develop')) {
    touchedRaw = runGit(['diff', '--name-only', 'origin/develop...HEAD'], repoRoot);
  } else if (hasLocalBranch(repoRoot, 'develop')) {
    touchedRaw = runGit(['diff', '--name-only', 'develop...HEAD'], repoRoot);
  } else {
    console.log('WARN: No se encontro rama origin/develop ni develop. Saltando check de scope.');
    return;
  }

  if (!touchedRaw) {
    console.log('WARN: No se encontraron archivos modificados respecto de develop.');
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
    console.log('PASS: Todos los archivos tocados estan dentro del scope declarado en slice.json.');
    return;
  }

  let violationCount = 0;
  for (const file of outOfScope) {
    violationCount += 1;
    if (strict) {
      throw new Error(`create-quiver: Archivo fuera del scope: ${file}`);
    }
    console.log(`WARN: Archivo fuera del scope: ${file}`);
  }

  if (violationCount > 0) {
    if (strict) {
      throw new Error(`${violationCount} archivo(s) fuera del scope declarado. Actualiza slice.json.files o revierte los cambios fuera de alcance.`);
    }
    console.log(`WARN: ${violationCount} archivo(s) fuera del scope declarado. Considera actualizar slice.json.files o revertir los cambios no previstos.`);
  }
}

module.exports = {
  checkPrReadiness,
  checkScope,
  checkSliceReadiness,
};
