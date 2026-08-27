const fs = require('fs');
const path = require('path');
const { catFileExists, currentBranch, mergeBaseIsAncestor, resolveBaseRef, revListCount, runGit, statusPorcelain, worktreeList } = require('./git');
const { parseJsonWithComments } = require('./json');
const { createTranslator } = require('./i18n/catalog');
const { redactSensitiveValue } = require('./ai/artifacts');
const {
  renderGovernanceTraceability,
  renderPendingGovernanceBlock,
} = require('./ai/spec-templates');
const {
  APPROVAL_BINDING_MISMATCH,
  DISPOSITION_UNRESOLVED,
  GovernanceError,
  REPRESENTATION_MISMATCH,
} = require('./ai/review-governance');
const { buildGraph, normalizeDeclaredDependencies, readAllSlices, SliceGraphError, topoSort } = require('./slice-graph');
const { resolveSliceContext, toAlias, validateSliceMetaForStart } = require('./slice');
const { validateProjectRelativePaths } = require('./paths');

const GOVERNANCE_MANIFEST_NAME = 'GOVERNANCE_MANIFEST.json';
const GOVERNANCE_BLOCK_START = '<!-- quiver-governance:begin -->';
const GOVERNANCE_BLOCK_END = '<!-- quiver-governance:end -->';
const GOVERNANCE_BLOCK_HEADING = '## Pending governance findings';
const GOVERNANCE_TRACEABILITY_HEADING = '## Governance Traceability';

function ensureExists(filePath, message) {
  if (!fs.existsSync(filePath)) {
    throw new Error(message);
  }
}

function readinessTranslator(options = {}) {
  return createTranslator(options.language || 'es');
}

function readinessLog(options, message) {
  if (options.json !== true) {
    console.log(message);
  }
}

function governanceError(message, details = {}) {
  return new GovernanceError(
    REPRESENTATION_MISMATCH,
    `${REPRESENTATION_MISMATCH}: ${message}`,
    details,
  );
}

function requestedGovernanceRunId(options = {}) {
  return String(options.runId || '').trim();
}

function countLiteral(text, literal) {
  return String(text || '').split(literal).length - 1;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sortedUnique(values) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))].sort();
}

function sameStringList(left, right) {
  return JSON.stringify(sortedUnique(Array.isArray(left) ? left : []))
    === JSON.stringify(sortedUnique(Array.isArray(right) ? right : []));
}

function relativeDisplayPath(repoRoot, filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join('/');
}

function readOptionalText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function hasGovernanceBlock(filePath) {
  return readOptionalText(filePath).includes(GOVERNANCE_BLOCK_START);
}

function declaresGovernanceManifest(repoRoot, specRoot) {
  const slicesRoot = path.join(specRoot, 'slices');
  if (!fs.existsSync(slicesRoot) || !fs.statSync(slicesRoot).isDirectory()) {
    return false;
  }
  const expectedPath = relativeDisplayPath(
    repoRoot,
    path.join(specRoot, GOVERNANCE_MANIFEST_NAME),
  );
  return fs.readdirSync(slicesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .some((entry) => {
      const slicePath = path.join(slicesRoot, entry.name, 'slice.json');
      if (!fs.existsSync(slicePath)) return false;
      try {
        const sliceJson = parseJsonWithComments(fs.readFileSync(slicePath, 'utf8'));
        return Array.isArray(sliceJson.files) && sliceJson.files.includes(expectedPath);
      } catch {
        return false;
      }
    });
}

function hasGovernanceSignal(repoRoot, specRoot, options = {}) {
  if (fs.existsSync(path.join(specRoot, GOVERNANCE_MANIFEST_NAME))) {
    return true;
  }
  if (declaresGovernanceManifest(repoRoot, specRoot)) {
    return true;
  }
  if (options.sliceJson?.planning_governance) {
    return true;
  }
  const specText = readOptionalText(path.join(specRoot, 'SPEC.md'));
  if (/^## Governance Traceability\s*$/m.test(specText)) {
    return true;
  }
  return (options.artifactPaths || []).some((artifactPath) => hasGovernanceBlock(artifactPath));
}

function resolveSpecGovernanceApi(options = {}) {
  if (typeof options.verifyGovernanceManifestParityFn === 'function'
      && typeof options.governanceEntriesForTargetFn === 'function') {
    return {
      governanceEntriesForTarget: options.governanceEntriesForTargetFn,
      verifyGovernanceManifestParity: options.verifyGovernanceManifestParityFn,
    };
  }

  // Loaded lazily so legacy checks remain usable while the optional v58 projection is absent.
  const api = require('./ai/spec-governance');
  return {
    governanceEntriesForTarget: options.governanceEntriesForTargetFn || api.governanceEntriesForTarget,
    verifyGovernanceManifestParity: options.verifyGovernanceManifestParityFn || api.verifyGovernanceManifestParity,
  };
}

function entryFinding(entry) {
  return entry?.finding || entry || {};
}

function entryDisposition(entry) {
  return entry?.disposition || entry || {};
}

function entryFindingId(entry) {
  return String(entryFinding(entry).finding_id || entry?.finding_id || '').trim();
}

function entryIsPending(entry) {
  if (typeof entry?.pending === 'boolean') {
    return entry.pending;
  }
  if (typeof entry?.resolved === 'boolean') {
    return !entry.resolved;
  }
  return entryFinding(entry).state !== 'closed';
}

function entryIsAccepted(entry) {
  return entry?.accepted === true;
}

function assertGovernanceEntriesResolvedOrAccepted(entries, target) {
  const unresolvedIds = sortedUnique(entries
    .filter((entry) => entryIsPending(entry) && !entryIsAccepted(entry))
    .map(entryFindingId));
  if (unresolvedIds.length > 0) {
    throw new GovernanceError(
      DISPOSITION_UNRESOLVED,
      `${DISPOSITION_UNRESOLVED}: Governance target '${target}' has unresolved findings: ${unresolvedIds.join(', ')}.`,
      {
        issue: 'unresolved',
        target,
        finding_ids: unresolvedIds,
      },
    );
  }
}

function projectGovernanceEntries(entries) {
  return [...entries]
    .sort((left, right) => entryFindingId(left).localeCompare(entryFindingId(right)))
    .map((entry) => {
      const finding = entryFinding(entry);
      const disposition = entryDisposition(entry);
      const criterion = entry?.criterion_binding || disposition.criterion_binding || null;
      return {
        finding_id: entryFindingId(entry),
        disposition_id: disposition.disposition_id || null,
        action: disposition.action || null,
        target: entry?.target || disposition.target || null,
        acceptance_ref: criterion?.acceptance_ref || null,
        evidence_obligations: Array.isArray(disposition.evidence_obligations)
          ? [...disposition.evidence_obligations]
          : [],
        pending: entryIsPending(entry),
        accepted: entryIsAccepted(entry),
      };
    });
}

function buildGovernanceProjection(repoRoot, parity, target, entries) {
  const manifest = parity.manifest;
  const projected = projectGovernanceEntries(entries);
  return {
    enabled: true,
    status: 'verified',
    manifest: relativeDisplayPath(repoRoot, parity.manifestPath || path.join(parity.specRoot, GOVERNANCE_MANIFEST_NAME)),
    manifest_sha256: manifest.manifest_sha256,
    run_id: manifest.source?.run_id || null,
    decision_id: manifest.decision?.decision_id || null,
    target,
    finding_count: projected.length,
    pending_count: projected.filter((entry) => entry.pending).length,
    findings: projected,
  };
}

function assertRequestedGovernanceRun(parity, options = {}) {
  const requested = requestedGovernanceRunId(options);
  const actual = String(parity.manifest?.source?.run_id || '').trim();
  if (requested && requested !== actual) {
    throw new GovernanceError(
      APPROVAL_BINDING_MISMATCH,
      `${APPROVAL_BINDING_MISMATCH}: Governance manifest belongs to run '${actual || '<missing>'}', not requested run '${requested}'.`,
      {
        issue: 'stale',
        expected_run_id: requested,
        actual_run_id: actual || null,
      },
    );
  }
}

function normalizeMarkdownProjection(value) {
  return String(value || '').replace(/\r\n/g, '\n').trimEnd();
}

function assertCanonicalMarkdownProjection(actual, expected, details = {}) {
  if (normalizeMarkdownProjection(actual) === normalizeMarkdownProjection(expected)) {
    return;
  }
  throw governanceError(`Governance Markdown is not the canonical manifest projection in '${details.surface}'.`, {
    issue: 'representation-mismatch',
    ...details,
    mismatches: ['canonical_governance_markdown'],
  });
}

function extractGovernanceFindingIds(repoRoot, filePath, options = {}) {
  const text = readOptionalText(filePath);
  const startCount = countLiteral(text, GOVERNANCE_BLOCK_START);
  const endCount = countLiteral(text, GOVERNANCE_BLOCK_END);
  const expectedIds = sortedUnique(options.expectedIds || []);
  const surface = relativeDisplayPath(repoRoot, filePath);

  if (startCount === 0 && endCount === 0) {
    throw governanceError(`Governance projection is omitted from '${surface}'.`, {
      issue: 'omitted',
      surface,
      expected_finding_ids: expectedIds,
      actual_finding_ids: [],
    });
  }
  if (startCount !== 1 || endCount !== 1) {
    throw governanceError(`Governance markers are missing or duplicated in '${surface}'.`, {
      issue: 'orphaned',
      surface,
      start_marker_count: startCount,
      end_marker_count: endCount,
    });
  }

  const start = text.indexOf(GOVERNANCE_BLOCK_START) + GOVERNANCE_BLOCK_START.length;
  const end = text.indexOf(GOVERNANCE_BLOCK_END, start);
  if (end < start) {
    throw governanceError(`Governance markers are out of order in '${surface}'.`, {
      issue: 'orphaned',
      surface,
    });
  }

  const block = String(text.slice(start, end));
  if (countLiteral(block, GOVERNANCE_BLOCK_HEADING) !== 1) {
    throw governanceError(`Governance heading is missing or duplicated in '${surface}'.`, {
      issue: 'representation-mismatch',
      surface,
      expected_heading: GOVERNANCE_BLOCK_HEADING,
    });
  }

  const ids = block.split(/\r?\n/)
    .map((line) => line.match(/^\s*[-*]\s+`?(F-\d{3,})`?(?=\s|$)/)?.[1] || null)
    .filter(Boolean);
  const uniqueIds = sortedUnique(ids);
  const duplicateIds = uniqueIds.filter((findingId) => ids.filter((item) => item === findingId).length !== 1);
  const orderedExactly = JSON.stringify(ids) === JSON.stringify(expectedIds);
  if (duplicateIds.length > 0 || !sameStringList(uniqueIds, expectedIds) || !orderedExactly) {
    const expectedSet = new Set(expectedIds);
    const actualSet = new Set(uniqueIds);
    throw governanceError(`Governance finding references do not match the manifest in '${surface}'.`, {
      issue: duplicateIds.length > 0 ? 'duplicate' : 'representation-mismatch',
      surface,
      expected_finding_ids: expectedIds,
      actual_finding_ids: uniqueIds,
      omitted_finding_ids: expectedIds.filter((findingId) => !actualSet.has(findingId)),
      unknown_finding_ids: uniqueIds.filter((findingId) => !expectedSet.has(findingId)),
      duplicate_finding_ids: duplicateIds,
      order_mismatch: duplicateIds.length === 0 && sameStringList(uniqueIds, expectedIds) && !orderedExactly,
    });
  }
  const fullStart = text.indexOf(GOVERNANCE_BLOCK_START);
  const fullEnd = text.indexOf(GOVERNANCE_BLOCK_END, fullStart) + GOVERNANCE_BLOCK_END.length;
  const expectedEntries = Array.isArray(options.expectedEntries)
    ? [...options.expectedEntries].sort((left, right) => entryFindingId(left).localeCompare(entryFindingId(right)))
    : [];
  assertCanonicalMarkdownProjection(
    text.slice(fullStart, fullEnd),
    renderPendingGovernanceBlock(expectedEntries).join('\n'),
    {
      surface,
      expected_finding_ids: expectedIds,
      actual_finding_ids: uniqueIds,
    },
  );
  return uniqueIds;
}

function verifySpecGovernanceTraceability(repoRoot, parity) {
  const {
    GOVERNANCE_TRACEABILITY_MARKER_BEGIN_PREFIX,
    GOVERNANCE_TRACEABILITY_MARKER_END,
    governanceEntriesForTarget,
    governanceTraceabilityMarkerBegin,
  } = require('./ai/spec-governance');
  const specPath = path.join(parity.specRoot, 'SPEC.md');
  const text = readOptionalText(specPath);
  const surface = relativeDisplayPath(repoRoot, specPath);
  const expectedDigest = String(parity.manifest.manifest_sha256 || '').trim();
  const expectedStart = governanceTraceabilityMarkerBegin(expectedDigest);
  const beginPattern = new RegExp(`${escapeRegExp(GOVERNANCE_TRACEABILITY_MARKER_BEGIN_PREFIX)}([^>\\r\\n]+) -->`, 'g');
  const beginMatches = [...text.matchAll(beginPattern)];
  const endCount = countLiteral(text, GOVERNANCE_TRACEABILITY_MARKER_END);

  if (beginMatches.length === 0 && endCount === 0) {
    throw governanceError(`Governance traceability is omitted from '${surface}'.`, {
      issue: 'omitted',
      surface,
      expected_manifest_sha256: expectedDigest,
    });
  }
  if (beginMatches.length !== 1 || endCount !== 1) {
    throw governanceError(`Governance traceability markers are missing or duplicated in '${surface}'.`, {
      issue: 'orphaned',
      surface,
      begin_marker_count: beginMatches.length,
      end_marker_count: endCount,
    });
  }

  const actualStart = beginMatches[0][0];
  const actualDigest = String(beginMatches[0][1] || '').trim();
  if (actualStart !== expectedStart || actualDigest !== expectedDigest) {
    throw new GovernanceError(
      APPROVAL_BINDING_MISMATCH,
      `${APPROVAL_BINDING_MISMATCH}: Governance traceability digest in '${surface}' does not match the manifest.`,
      {
        issue: 'stale',
        surface,
        expected_manifest_sha256: expectedDigest,
        actual_manifest_sha256: actualDigest || null,
      },
    );
  }

  const start = text.indexOf(actualStart) + actualStart.length;
  const end = text.indexOf(GOVERNANCE_TRACEABILITY_MARKER_END, start);
  if (end < start) {
    throw governanceError(`Governance traceability markers are out of order in '${surface}'.`, {
      issue: 'orphaned',
      surface,
    });
  }
  const block = String(text.slice(start, end));
  if (countLiteral(block, GOVERNANCE_TRACEABILITY_HEADING) !== 1) {
    throw governanceError(`Governance traceability heading is missing or duplicated in '${surface}'.`, {
      issue: 'representation-mismatch',
      surface,
      expected_heading: GOVERNANCE_TRACEABILITY_HEADING,
    });
  }

  const expectedEntries = governanceEntriesForTarget(parity.manifest);
  const expectedIds = expectedEntries.map(entryFindingId);
  const actualIds = block.split(/\r?\n/)
    .map((line) => line.match(/^\s*\|\s*(F-\d{3,})\s*\|/)?.[1] || null)
    .filter(Boolean);
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
    const expectedSet = new Set(expectedIds);
    const actualSet = new Set(actualIds);
    throw governanceError(`Governance traceability rows do not match the manifest in '${surface}'.`, {
      issue: 'representation-mismatch',
      surface,
      expected_finding_ids: expectedIds,
      actual_finding_ids: actualIds,
      omitted_finding_ids: expectedIds.filter((findingId) => !actualSet.has(findingId)),
      unknown_finding_ids: actualIds.filter((findingId) => !expectedSet.has(findingId)),
      order_mismatch: sameStringList(actualIds, expectedIds),
    });
  }
  const fullStart = text.indexOf(actualStart);
  const fullEnd = text.indexOf(GOVERNANCE_TRACEABILITY_MARKER_END, fullStart)
    + GOVERNANCE_TRACEABILITY_MARKER_END.length;
  assertCanonicalMarkdownProjection(
    text.slice(fullStart, fullEnd),
    renderGovernanceTraceability(parity.manifest, expectedEntries).join('\n'),
    {
      surface,
      expected_finding_ids: expectedIds,
      actual_finding_ids: actualIds,
    },
  );
}

function validateSlicePlanningGovernance(repoRoot, slice, manifest, entries) {
  const expectedIds = sortedUnique(entries.map(entryFindingId));
  const planning = slice.json.planning_governance;
  if (!planning || typeof planning !== 'object' || Array.isArray(planning)) {
    throw governanceError(`Slice '${slice.sliceId}' omits its planning_governance projection.`, {
      issue: 'omitted',
      slice_id: slice.sliceId,
      expected_finding_ids: expectedIds,
    });
  }

  const actualIds = Array.isArray(planning.pending_finding_ids) ? planning.pending_finding_ids : [];
  const expectedTarget = { kind: 'slice', id: slice.sliceId };
  const valid = planning.schema_version === 1
    && planning.manifest === '../../GOVERNANCE_MANIFEST.json'
    && planning.manifest_sha256 === manifest.manifest_sha256
    && planning.target?.kind === expectedTarget.kind
    && planning.target?.id === expectedTarget.id
    && sameStringList(actualIds, expectedIds)
    && JSON.stringify(actualIds) === JSON.stringify(sortedUnique(actualIds));
  if (!valid) {
    const expectedSet = new Set(expectedIds);
    const actualSet = new Set(sortedUnique(actualIds));
    throw governanceError(`Slice '${slice.sliceId}' planning_governance does not match the manifest.`, {
      issue: 'representation-mismatch',
      slice_id: slice.sliceId,
      expected_manifest_sha256: manifest.manifest_sha256,
      actual_manifest_sha256: planning.manifest_sha256 || null,
      expected_target: expectedTarget,
      actual_target: planning.target || null,
      expected_finding_ids: expectedIds,
      actual_finding_ids: sortedUnique(actualIds),
      omitted_finding_ids: expectedIds.filter((findingId) => !actualSet.has(findingId)),
      unknown_finding_ids: sortedUnique(actualIds).filter((findingId) => !expectedSet.has(findingId)),
    });
  }
}

function formatGovernanceProjectionHuman(projection, options = {}) {
  if (!projection?.enabled) {
    return '';
  }
  const english = options.language === 'en';
  const target = projection.target?.id || projection.target?.kind || 'governed artifact';
  return english
    ? `PASS: Governance manifest verified for ${target}; ${projection.pending_count} pending finding(s).`
    : `PASS: Manifest de gobernanza verificado para ${target}; ${projection.pending_count} hallazgo(s) pendiente(s).`;
}

function verifySliceGovernanceReadiness(repoRoot, slice, options = {}) {
  const briefPaths = [
    path.join(path.dirname(slice.sliceAbs), 'EXECUTION_BRIEF.md'),
    path.join(path.dirname(slice.sliceAbs), 'CLOSURE_BRIEF.md'),
  ];
  const governed = hasGovernanceSignal(repoRoot, slice.specDirAbs, {
    artifactPaths: briefPaths,
    sliceJson: slice.json,
  });
  if (!governed && !requestedGovernanceRunId(options)) {
    return { enabled: false, status: 'legacy', target: { kind: 'slice', id: slice.sliceId }, findings: [] };
  }

  const api = resolveSpecGovernanceApi(options);
  const parity = api.verifyGovernanceManifestParity({
    repoRoot,
    specRoot: slice.specDirAbs,
  });
  assertRequestedGovernanceRun(parity, options);
  verifySpecGovernanceTraceability(repoRoot, parity);
  const targetId = `slice:${slice.sliceId}`;
  const entries = api.governanceEntriesForTarget(parity.manifest, targetId);
  assertGovernanceEntriesResolvedOrAccepted(entries, targetId);
  const expectedIds = sortedUnique(entries.map(entryFindingId));
  validateSlicePlanningGovernance(repoRoot, slice, parity.manifest, entries);
  for (const briefPath of briefPaths) {
    extractGovernanceFindingIds(repoRoot, briefPath, { expectedEntries: entries, expectedIds });
  }
  return buildGovernanceProjection(repoRoot, parity, { kind: 'slice', id: slice.sliceId }, entries);
}

function resolvePrGovernanceSurface(repoRoot, prPath) {
  const relative = relativeDisplayPath(repoRoot, path.resolve(prPath));
  const parts = relative.split('/');
  if (!['specs', 'specs-fix'].includes(parts[0])) {
    return null;
  }
  if (parts.length === 3 && parts[2] === 'pr.md') {
    return {
      kind: 'spec-pr',
      id: parts[1],
      specRoot: path.join(repoRoot, parts[0], parts[1]),
      target: null,
    };
  }
  if (parts.length === 5 && parts[2] === 'slices' && parts[4] === 'pr.md') {
    return {
      kind: 'slice-pr',
      id: parts[3],
      specRoot: path.join(repoRoot, parts[0], parts[1]),
      target: `slice:${parts[3]}`,
    };
  }
  return null;
}

function verifyPrGovernanceReadiness(repoRoot, prPath, options = {}) {
  const surface = resolvePrGovernanceSurface(repoRoot, prPath);
  if (!surface) {
    const requested = requestedGovernanceRunId(options);
    if (requested) {
      throw new GovernanceError(
        APPROVAL_BINDING_MISMATCH,
        `${APPROVAL_BINDING_MISMATCH}: Run '${requested}' requires a governed PR under specs/<slug>/pr.md or specs/<slug>/slices/<slice>/pr.md.`,
        {
          issue: 'unsupported-governance-surface',
          requested_run_id: requested,
          pr_path: relativeDisplayPath(repoRoot, path.resolve(prPath)),
        },
      );
    }
    return { enabled: false, status: 'legacy', target: null, findings: [] };
  }
  if (!hasGovernanceSignal(repoRoot, surface.specRoot, { artifactPaths: [prPath] })
      && !requestedGovernanceRunId(options)) {
    return { enabled: false, status: 'legacy', target: { kind: surface.kind, id: surface.id }, findings: [] };
  }

  const api = resolveSpecGovernanceApi(options);
  const parity = api.verifyGovernanceManifestParity({ repoRoot, specRoot: surface.specRoot });
  assertRequestedGovernanceRun(parity, options);
  verifySpecGovernanceTraceability(repoRoot, parity);
  const entries = api.governanceEntriesForTarget(parity.manifest, surface.target);
  if (surface.kind === 'slice-pr') {
    assertGovernanceEntriesResolvedOrAccepted(entries, surface.target);
  }
  const expectedIds = sortedUnique(entries.map(entryFindingId));
  extractGovernanceFindingIds(repoRoot, prPath, { expectedEntries: entries, expectedIds });

  if (surface.kind === 'spec-pr') {
    const prReviewEntries = api.governanceEntriesForTarget(parity.manifest, 'phase:pr-review');
    assertGovernanceEntriesResolvedOrAccepted(prReviewEntries, 'phase:pr-review');
  }

  return buildGovernanceProjection(repoRoot, parity, { kind: surface.kind, id: surface.id }, entries);
}

function emitReadinessReport(report, options = {}) {
  if (options.emitReport === false) {
    return;
  }
  if (options.json === true) {
    process.stdout.write(`${JSON.stringify(redactSensitiveValue(report, { projectRoot: process.cwd() }), null, 2)}\n`);
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

function collectOverlapWarnings(repoRoot, currentBranchName, currentFiles, baseRef) {
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

function validateLocalSliceArtifacts(repoRoot, slice, translator, options = {}) {
  const sliceDir = path.dirname(slice.sliceAbs);
  for (const file of ['EXECUTION_BRIEF.md', 'CLOSURE_BRIEF.md']) {
    ensureExists(path.join(sliceDir, file), `create-quiver: falta '${path.posix.join(path.dirname(slice.sliceRel), file)}'.`);
  }
  readinessLog(options, translator.t('readiness.local.briefs.pass'));

  if (!Array.isArray(slice.json.files) || slice.json.files.length === 0) {
    throw new Error(`create-quiver: ${translator.t('readiness.local.files.error.empty')}`);
  }

  const invalidFiles = slice.json.files.filter((file) => typeof file !== 'string' || file.trim().length === 0);
  if (invalidFiles.length > 0) {
    throw new Error(`create-quiver: ${translator.t('readiness.local.files.error.invalid')}`);
  }
  readinessLog(options, translator.t('readiness.local.files.pass'));

  validateSliceMetaForStart(slice);
  readinessLog(options, translator.t('readiness.local.git.pass'));

  validateProjectRelativePaths(slice.files, 'slice.json files/allowed_write_paths');
  validateProjectRelativePaths(slice.expectedReadPaths, 'slice.json expected_read_paths');
  readinessLog(options, translator.t('readiness.local.paths.pass'));
}

function baseRecoveryMessage(remote, baseBranch, translator) {
  return translator.t('readiness.base.recovery', { base: baseBranch, remote, remoteRef: `${remote}/${baseBranch}` });
}

function resolveReadinessBase(repoRoot, slice, options = {}) {
  return resolveBaseRef(repoRoot, {
    explicitBaseBranch: options.baseBranch,
    missingOk: true,
    preferredBaseBranch: slice.baseBranch,
    remote: options.remote || 'origin',
  });
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
  const base = resolveReadinessBase(repoRoot, slice, {
    baseBranch: options.baseBranch,
    remote,
  });

  if (base.baseRef && base.remote && catFileExists(repoRoot, `${base.baseRef}:${slice.sliceRel}`)) {
    readinessLog(options, translator.t('readiness.documented.remote.pass', { ref: base.baseRef }));
    return base.baseRef;
  }

  if (base.baseRef && !base.remote && catFileExists(repoRoot, `${base.baseRef}:${slice.sliceRel}`)) {
    readinessLog(options, translator.t('readiness.documented.local.pass', { branch: base.baseRef }));
    return base.baseRef;
  }

  if (!base.baseRef) {
    const guidance = baseRecoveryMessage(remote, base.baseBranch || base.candidates.map((candidate) => candidate.branch).join(', '), translator);
    if (gate === 'validation') {
      readinessLog(options, translator.t('readiness.warn', { message: guidance }));
      return null;
    }

    throw new Error(`create-quiver: ${guidance}`);
  }

  if (gate === 'validation') {
    readinessLog(options, translator.t('readiness.documented.missing_validation.warn', { ref: base.baseRef }));
    return base.baseRef;
  }

  throw new Error(`create-quiver: ${translator.t('readiness.documented.missing.error', { ref: base.baseRef })}`);
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

function localCheckSummary(translator, options = {}) {
  readinessLog(options, translator.t('readiness.local.summary.executed'));
  readinessLog(options, translator.t('readiness.local.summary.skipped'));
}

function checkSliceReadiness(sliceInput, options = {}) {
  const translator = readinessTranslator(options);
  const gate = options.gate || 'execution';
  const localMode = options.local === true;
  const strictOverlap = options.strictOverlap === true;
  const remote = options.remote || 'origin';
  const repoRoot = resolveReadinessRoot(localMode);
  const slice = resolveSliceContext(repoRoot, sliceInput);
  const base = resolveReadinessBase(repoRoot, slice, {
    baseBranch: options.baseBranch,
    remote,
  });
  const baseBranch = base.baseBranch || options.baseBranch || slice.baseBranch || 'main';

  for (const specFile of ['SPEC.md', 'STATUS.md', 'EVIDENCE_REPORT.md']) {
    ensureExists(path.join(repoRoot, slice.specDirRel, specFile), `create-quiver: falta '${slice.specDirRel}/${specFile}'.`);
  }
  readinessLog(options, translator.t('readiness.spec_docs.pass'));

  let baseRef = null;
  if (localMode) {
    validateLocalSliceArtifacts(repoRoot, slice, translator, options);
    readinessLog(options, translator.t('readiness.local.skip_base', { base: baseBranch, remoteRef: `${remote}/${baseBranch}` }));
    readinessLog(options, translator.t('readiness.local.skip_overlap'));
  } else {
    baseRef = validateSliceDocumentedOnBase(repoRoot, slice, {
      baseBranch,
      gate,
      json: options.json,
      language: options.language,
      remote,
    });
  }

  if (!localMode) {
    const overlapWarnings = collectOverlapWarnings(repoRoot, currentBranch(repoRoot), slice.files, baseRef || base.baseRef);
    if (overlapWarnings.length === 0) {
      readinessLog(options, translator.t('readiness.overlap.none.pass'));
    } else {
      for (const warning of overlapWarnings) {
        const [overlapBranch, overlapFiles] = warning.split('|');
        if (strictOverlap) {
          throw new Error(`create-quiver: ${translator.t('readiness.overlap.warning', { branch: overlapBranch, files: overlapFiles })}`);
        }
        readinessLog(options, translator.t('readiness.overlap.warn', { branch: overlapBranch, files: overlapFiles }));
      }
    }
  }

  validateDeclaredDependencyContract(repoRoot, slice);
  if (localMode) {
    localCheckSummary(translator, options);
  }
  const governance = verifySliceGovernanceReadiness(repoRoot, slice, options);
  if (governance.enabled && options.suppressGovernanceHuman !== true) {
    readinessLog(options, formatGovernanceProjectionHuman(governance, options));
  }

  switch (gate) {
    case 'ready':
      if (slice.status !== 'ready') {
        throw new Error(`create-quiver: ${translator.t('readiness.gate.ready.error_status', { status: slice.status })}`);
      }
      readinessLog(options, translator.t('readiness.gate.ready.pass'));
      break;
    case 'execution':
      if (slice.status === 'blocked') {
        throw new Error(`create-quiver: ${translator.t('readiness.gate.execution.error.blocked')}`);
      }
      if (slice.status === 'cancelled') {
        throw new Error(`create-quiver: ${translator.t('readiness.gate.execution.error.cancelled')}`);
      }
      if (slice.status === 'completed') {
        readinessLog(options, translator.t('readiness.gate.execution.warn.completed'));
      }
      if (slice.status === 'draft') {
        readinessLog(options, translator.t('readiness.gate.execution.warn.draft'));
      }
      readinessLog(options, translator.t('readiness.gate.execution.pass'));
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
      readinessLog(options, translator.t('readiness.gate.validation.pass'));
      break;
  }

  const report = {
    schema_version: 1,
    task: 'check-slice',
    ok: true,
    status: 'ready',
    gate,
    slice_id: slice.sliceId,
    spec_slug: slice.specSlug,
    governance,
  };
  emitReadinessReport(report, options);
  return report;
}

function checkPrReadiness(sliceInput, options = {}) {
  const translator = readinessTranslator(options);
  const repoRoot = runGit(['rev-parse', '--show-toplevel'], process.cwd());
  const slice = resolveSliceContext(repoRoot, sliceInput);
  const current = currentBranch(repoRoot);
  const prPath = path.join(path.dirname(slice.sliceAbs), 'pr.md');
  const remote = options.remote || 'origin';
  const base = resolveReadinessBase(repoRoot, slice, {
    baseBranch: options.baseBranch,
    remote,
  });

  if (!base.baseRef) {
    throw new Error(`create-quiver: ${baseRecoveryMessage(remote, base.baseBranch || base.candidates.map((candidate) => candidate.branch).join(', '), translator)}`);
  }

  checkSliceReadiness(slice.sliceRel, {
    baseBranch: base.baseBranch,
    emitReport: false,
    gate: 'validation',
    governanceEntriesForTargetFn: options.governanceEntriesForTargetFn,
    json: options.json,
    language: options.language,
    remote,
    runId: options.runId,
    suppressGovernanceHuman: true,
    verifyGovernanceManifestParityFn: options.verifyGovernanceManifestParityFn,
  });
  checkScope(slice.sliceRel, {
    baseBranch: base.baseBranch,
    json: options.json,
    language: options.language,
    remote,
    strict: true,
  });

  if (!slice.branchName) {
    throw new Error(`create-quiver: ${translator.t('readiness.pr.error.missing_branch')}`);
  }
  if (!fs.existsSync(prPath)) {
    throw new Error(`create-quiver: ${translator.t('readiness.pr.error.missing_pr')}`);
  }
  if (current !== slice.branchName) {
    throw new Error(`create-quiver: ${translator.t('readiness.pr.error.wrong_branch', { actual: current, expected: slice.branchName })}`);
  }
  readinessLog(options, translator.t('readiness.pr.branch.pass'));
  if (statusPorcelain(repoRoot) !== '') {
    throw new Error(`create-quiver: ${translator.t('readiness.pr.error.dirty')}`);
  }
  readinessLog(options, translator.t('readiness.pr.clean.pass'));

  const aheadCount = revListCount(repoRoot, `${base.baseRef}..HEAD`);
  if (aheadCount <= 0) {
    if (mergeBaseIsAncestor(repoRoot, 'HEAD', base.baseRef)) {
      throw new Error(`create-quiver: ${translator.t('readiness.pr.error.absorbed', { ref: base.baseRef })}`);
    }
    throw new Error(`create-quiver: ${translator.t('readiness.pr.error.no_commits', { ref: base.baseRef })}`);
  }
  readinessLog(options, translator.t('readiness.pr.commits.pass', { ref: base.baseRef }));

  const prText = fs.readFileSync(prPath, 'utf8');
  for (const heading of ['## Title', '## Summary', '## Scope', '## Files', '## How to Test (DETAILED - REQUIRED)', '## Evidence', '## Rollback', '## Risks / Notes']) {
    if (!prText.includes(heading)) {
      throw new Error(`create-quiver: ${translator.t('readiness.pr.error.missing_section', { heading })}`);
    }
  }
  readinessLog(options, translator.t('readiness.pr.sections.pass'));

  for (const subheading of ['### Required Environment', '### Worktree Access', '### Run the Project', '### Use Cases', '### Technical Verification']) {
    if (!prText.includes(subheading)) {
      throw new Error(`create-quiver: ${translator.t('readiness.pr.error.missing_subsection', { subheading })}`);
    }
  }
  readinessLog(options, translator.t('readiness.pr.how_to_test.pass'));

  if (!/#### Case [0-9]+:/.test(prText)) {
    throw new Error(`create-quiver: ${translator.t('readiness.pr.error.no_case')}`);
  }
  readinessLog(options, translator.t('readiness.pr.case.pass'));

  if (!/git revert /.test(prText)) {
    throw new Error(`create-quiver: ${translator.t('readiness.pr.error.rollback')}`);
  }
  readinessLog(options, translator.t('readiness.pr.rollback.pass'));

  if (/^\s*-\s*`manual review`$/mi.test(prText) || /^\s*-\s*`visual check`$/mi.test(prText) || /^\s*-\s*`screen test`$/mi.test(prText) || /^\s*-\s*`visual validation`$/mi.test(prText)) {
    throw new Error('create-quiver: How to Test cannot rely only on generic phrases.');
  }

  const governance = verifyPrGovernanceReadiness(repoRoot, prPath, options);
  if (governance.enabled) {
    readinessLog(options, formatGovernanceProjectionHuman(governance, options));
  }
  readinessLog(options, translator.t('readiness.pr.ready.pass', { slice: slice.sliceId }));

  const report = {
    schema_version: 1,
    task: 'check-pr',
    ok: true,
    status: 'ready',
    gate: 'pr',
    slice_id: slice.sliceId,
    spec_slug: slice.specSlug,
    governance,
  };
  emitReadinessReport(report, options);
  return report;
}

function checkScope(sliceInput, options = {}) {
  const translator = readinessTranslator(options);
  const strict = options.strict === true;
  const remote = options.remote || 'origin';
  const repoRoot = runGit(['rev-parse', '--show-toplevel'], process.cwd());
  const slice = resolveSliceContext(repoRoot, sliceInput);
  const declared = slice.files;
  validateProjectRelativePaths(declared, 'slice scope path');

  const base = resolveReadinessBase(repoRoot, slice, {
    baseBranch: options.baseBranch,
    remote,
  });

  let touchedRaw = '';
  if (base.baseRef) {
    touchedRaw = runGit(['diff', '--name-only', `${base.baseRef}...HEAD`], repoRoot);
    readinessLog(options, translator.t('readiness.scope.base.info', { ref: base.baseRef, source: base.source }));
  } else {
    readinessLog(options, translator.t('readiness.scope.base.warn', { branches: base.candidates.map((candidate) => candidate.branch).join(', ') }));
    return;
  }

  if (!touchedRaw) {
    readinessLog(options, translator.t('readiness.scope.empty.warn', { ref: base.baseRef }));
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
    readinessLog(options, translator.t('readiness.scope.pass'));
    return;
  }

  let violationCount = 0;
  for (const file of outOfScope) {
    violationCount += 1;
    if (strict) {
      throw new Error(`create-quiver: ${translator.t('readiness.scope.error.file', { file })}`);
    }
    readinessLog(options, translator.t('readiness.scope.warn.file', { file }));
  }

  if (violationCount > 0) {
    if (strict) {
      throw new Error(translator.t('readiness.scope.error.count', { count: violationCount }));
    }
    readinessLog(options, translator.t('readiness.scope.warn.count', { count: violationCount }));
  }
}

module.exports = {
  checkPrReadiness,
  checkScope,
  checkSliceReadiness,
  formatGovernanceProjectionHuman,
  verifyPrGovernanceReadiness,
  verifySliceGovernanceReadiness,
};
