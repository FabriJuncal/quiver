const fs = require('node:fs');
const path = require('node:path');
const { TextDecoder } = require('node:util');

const {
  containsSensitiveText,
  redactSensitiveLocalValues,
  redactSensitiveValue,
} = require('../lib/ai/artifacts');
const { resolveGitHubCliProviderSubject } = require('../lib/ai/providers');
const {
  DISPOSITION_DUPLICATE,
  DISPOSITION_STALE,
  DISPOSITION_UNRESOLVED,
  GovernanceError,
  TRANSFER_DISPOSITION_ACTIONS,
  authorizeGovernanceAction,
  buildCriterionBinding,
  canonicalSha256,
  computePolicyDigest,
  normalizeConditionDispositionInput,
  validateTransferDispositionSet,
  readGovernanceConfig,
} = require('../lib/ai/review-governance');
const { canonicalDispositionSchema, runGovernanceStateSchema } = require('../lib/ai/review-governance.schema');
const { assertNoPendingReviewBudgetReservations } = require('../lib/ai/review-budget');
const {
  readAiRun,
  readRunGovernance,
  resolveGovernedAiRun,
  runApprovalCommitPath,
  runReviewCommitPath,
  withAiRunLock,
  writeRunGovernance,
} = require('../lib/ai/run-state');
const { buildSpecGenerationManifest } = require('../lib/ai/spec-generator');
const { assertPathInsideRoot, validateProjectRelativePath } = require('../lib/paths');

const UNSAFE_CONTRACTUAL_DATA = 'UNSAFE_CONTRACTUAL_DATA';

function governanceFailure(code, message, details = {}) {
  throw new GovernanceError(code, message, details);
}

function redactionRootCandidates(roots = []) {
  const candidates = [];
  const add = (root) => {
    if (!root) return;
    const resolved = path.resolve(root);
    if (!candidates.includes(resolved)) candidates.push(resolved);
    try {
      const real = fs.realpathSync(resolved);
      if (!candidates.includes(real)) candidates.push(real);
    } catch {
      // The resolved spelling still protects diagnostics for a root that disappeared mid-command.
    }
  };
  roots.forEach(add);

  if (process.env.PWD) {
    try {
      const logicalRoot = path.resolve(process.env.PWD);
      const realLogicalRoot = fs.realpathSync(logicalRoot);
      if (candidates.some((candidate) => {
        try {
          return fs.realpathSync(candidate) === realLogicalRoot;
        } catch {
          return false;
        }
      })) add(logicalRoot);
    } catch {
      // Ignore stale or invalid inherited PWD values.
    }
  }
  return candidates;
}

function sanitizeFindingsError(error, roots = []) {
  const errorLike = error && typeof error === 'object' ? error : null;
  const source = error instanceof Error
    ? error
    : new Error(String(errorLike?.message || error || 'Finding disposition failed.'));
  if (errorLike && source !== errorLike) {
    for (const field of ['code', 'status', 'details']) {
      if (errorLike[field] !== undefined) source[field] = errorLike[field];
    }
  }
  const redactionRoots = redactionRootCandidates(roots);
  const contexts = redactionRoots.length > 0 ? redactionRoots : [null];
  let message = String(source.message || 'Finding disposition failed.');
  let details = source.details;

  for (const projectRoot of contexts) {
    const redactionOptions = projectRoot ? { projectRoot } : {};
    message = redactSensitiveLocalValues(message, redactionOptions);
    if (details !== undefined) {
      details = redactSensitiveValue(details, redactionOptions);
    }
  }

  source.message = message;
  if (source.details !== undefined) source.details = details;
  return source;
}

function resolveCanonicalRoot(projectRoot, options = {}) {
  const resolver = options.resolveCanonicalProjectRootFn
    || require('../lib/ai/spec-governance').resolveCanonicalProjectRoot;
  return resolver(path.resolve(projectRoot));
}

function readJsonFile(projectRoot, relativePath, label) {
  let normalized;
  try {
    normalized = validateProjectRelativePath(relativePath, label);
  } catch (error) {
    return governanceFailure(DISPOSITION_UNRESOLVED, error.message, { field: label });
  }
  const absolutePath = path.resolve(projectRoot, normalized);
  assertPathInsideRoot(projectRoot, absolutePath, label);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    return governanceFailure(DISPOSITION_UNRESOLVED, `${label} does not exist: ${normalized}`, {
      path: normalized,
    });
  }
  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    return governanceFailure(DISPOSITION_UNRESOLVED, `${label} is not valid JSON: ${normalized}`, {
      path: normalized,
      cause: error.message,
    });
  }
}

function redactionChanges(value, roots = []) {
  return [...new Set(roots.filter(Boolean).map((root) => path.resolve(root)))]
    .some((root) => redactSensitiveLocalValues(value, { projectRoot: root }) !== value);
}

function readExactSafeCriterion(projectRoot, relativePath, acceptanceRef, options = {}) {
  let sourcePath;
  try {
    sourcePath = validateProjectRelativePath(relativePath, 'criterion file');
  } catch (error) {
    return governanceFailure(DISPOSITION_UNRESOLVED, error.message, { field: 'criterion_file' });
  }
  const absolutePath = path.resolve(projectRoot, sourcePath);
  assertPathInsideRoot(projectRoot, absolutePath, 'criterion file');
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    return governanceFailure(DISPOSITION_UNRESOLVED, `Criterion file does not exist: ${sourcePath}`, {
      source_path: sourcePath,
    });
  }

  const bytes = fs.readFileSync(absolutePath);
  let content;
  try {
    content = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    return governanceFailure(
      UNSAFE_CONTRACTUAL_DATA,
      `Criterion file must contain valid UTF-8 bytes: ${sourcePath}`,
      { source_path: sourcePath },
    );
  }
  const redactionRoots = [projectRoot, ...(options.redactionRoots || [])];
  if (redactionChanges(sourcePath, redactionRoots) || redactionChanges(content, redactionRoots)
      || containsSensitiveText(sourcePath) || containsSensitiveText(content)) {
    return governanceFailure(
      UNSAFE_CONTRACTUAL_DATA,
      `Criterion file contains contractual data that cannot be persisted safely: ${sourcePath}`,
      { source_path: redactSensitiveLocalValues(sourcePath, { projectRoot }) },
    );
  }
  return buildCriterionBinding({
    acceptanceRef,
    content,
    sourceBytes: bytes,
    sourcePath,
  });
}

function assertSafeEvidenceObligations(projectRoot, obligations, findingId, options = {}) {
  if (!Array.isArray(obligations) || obligations.length === 0) {
    return governanceFailure(
      DISPOSITION_UNRESOLVED,
      `Finding '${findingId}' requires at least one explicit evidence obligation.`,
      { finding_id: findingId },
    );
  }
  const normalized = obligations.map((item) => String(item ?? '').trim());
  if (normalized.some((item) => !item) || new Set(normalized).size !== normalized.length) {
    return governanceFailure(
      DISPOSITION_UNRESOLVED,
      `Finding '${findingId}' evidence obligations must be non-empty and unique.`,
      { finding_id: findingId },
    );
  }
  const unsafe = normalized.find((item) => (
    containsSensitiveText(item)
    || redactionChanges(item, [projectRoot, ...(options.redactionRoots || [])])
  ));
  if (unsafe) {
    return governanceFailure(
      UNSAFE_CONTRACTUAL_DATA,
      `Finding '${findingId}' contains an evidence obligation that cannot be persisted safely.`,
      { finding_id: findingId },
    );
  }
  return normalized;
}

function inferTransferAction(target) {
  const normalized = String(target || '').trim();
  if (normalized === 'phase:spec' || /^spec:[^:]+$/.test(normalized)) return 'transfer-to-spec';
  if (normalized === 'phase:pr-review' || /^pr:[^:]+$/.test(normalized)) return 'transfer-to-pr';
  return 'transfer-to-slice';
}

function currentReviewForState(state) {
  return state?.reviews?.find((review) => review.review_id === state.current_review_id) || null;
}

function resolvePlanContext(projectRoot, state) {
  const review = currentReviewForState(state);
  const sourcePath = review?.source_file;
  if (!sourcePath) {
    return governanceFailure(DISPOSITION_UNRESOLVED, 'The current technical-plan review has no source artifact.');
  }
  let normalized;
  try {
    normalized = validateProjectRelativePath(sourcePath, 'technical-plan source');
  } catch (error) {
    return governanceFailure(DISPOSITION_UNRESOLVED, error.message, { source_file: sourcePath });
  }
  const absolutePath = path.resolve(projectRoot, normalized);
  assertPathInsideRoot(projectRoot, absolutePath, 'technical-plan source');
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    return governanceFailure(DISPOSITION_UNRESOLVED, `Technical-plan source does not exist: ${normalized}`, {
      source_file: normalized,
    });
  }
  let manifest;
  try {
    manifest = buildSpecGenerationManifest({
      inputPath: normalized,
      inputText: fs.readFileSync(absolutePath, 'utf8'),
      repoRoot: projectRoot,
    });
  } catch (error) {
    return governanceFailure(DISPOSITION_UNRESOLVED, 'Technical-plan slice targets cannot be resolved.', {
      source_file: normalized,
      cause: error.message,
    });
  }
  return {
    planManifest: manifest,
    sliceIds: manifest.slices.map((slice) => slice.slice_id),
  };
}

function assertCorrelatedTransferWindow(projectRoot, run, state) {
  if (!run || run.status === 'closed') {
    return governanceFailure('AI_RUN_CLOSED', 'Finding transfer requires one active governed run.');
  }
  if (run.phase !== 'technical-plan-reviewed') {
    return governanceFailure(
      'AI_RUN_PHASE_INVALID',
      `Finding transfer requires run phase 'technical-plan-reviewed', found '${run.phase || 'missing'}'.`,
      { run_id: run.run_id, expected_phase: 'technical-plan-reviewed', actual_phase: run.phase || null },
    );
  }
  if (!state || !state.current_review_id || !currentReviewForState(state)) {
    return governanceFailure('GOVERNANCE_STATE_INVALID', 'Finding transfer requires a current canonical review.');
  }
  if ((state.decisions || []).some((decision) => decision.phase === 'technical-plan')) {
    return governanceFailure(
      'FINAL_DECISION_IMMUTABLE',
      'Finding dispositions cannot change after a final technical-plan decision.',
      { run_id: run.run_id },
    );
  }
  if ((state.conditioned_candidates || []).some((candidate) => candidate.publication_state === 'candidate')) {
    return governanceFailure(
      'APPROVAL_CANDIDATE_PENDING',
      'Finding dispositions cannot change while a conditioned approval candidate is pending.',
      { run_id: run.run_id },
    );
  }
  for (const marker of [runReviewCommitPath(projectRoot, run.run_id), runApprovalCommitPath(projectRoot, run.run_id)]) {
    if (fs.existsSync(marker)) {
      return governanceFailure(
        'GOVERNANCE_RECOVERY_REQUIRED',
        `Governance recovery is required before finding transfer for run '${run.run_id}'.`,
        { run_id: run.run_id },
      );
    }
  }
  assertNoPendingReviewBudgetReservations(projectRoot, run.run_id);
}

function assertRunPolicyParity(run, review, governance) {
  const policyDigest = computePolicyDigest(governance);
  const mismatches = [];
  if (run.governance?.policy_version !== governance.policy.version) mismatches.push('run.policy_version');
  if (run.governance?.policy_digest !== policyDigest) mismatches.push('run.policy_digest');
  if (review.policy_version !== governance.policy.version) mismatches.push('review.policy_version');
  if (review.policy_digest !== policyDigest) mismatches.push('review.policy_digest');
  if (mismatches.length > 0) {
    return governanceFailure('GOVERNANCE_STATE_INVALID', 'Finding transfer policy binding is stale.', {
      run_id: run.run_id,
      mismatches,
    });
  }
  return policyDigest;
}

function resolveAcceptanceRef(finding, explicitRef, allowInference) {
  const acceptanceRef = String(explicitRef || '').trim();
  if (acceptanceRef) return acceptanceRef;
  if (allowInference && finding?.acceptance_refs?.length === 1) return finding.acceptance_refs[0];
  return governanceFailure(
    DISPOSITION_UNRESOLVED,
    `Finding '${finding?.finding_id || '<missing>'}' requires an explicit acceptance reference.`,
    { finding_id: finding?.finding_id || null },
  );
}

function rawIndividualInput(options = {}) {
  return [{
    finding_id: String(options.findingId || '').trim(),
    action: inferTransferAction(options.target),
    target: String(options.target || '').trim(),
    acceptance_ref: String(options.acceptanceRef || '').trim() || undefined,
    criterion_file: String(options.criterionFile || '').trim(),
    evidence_obligations: options.evidenceObligations || [],
    supersedes: String(options.supersedes || '').trim() || null,
  }];
}

function rawBatchInput(projectRoot, options = {}) {
  return readJsonFile(projectRoot, options.file, 'disposition file');
}

function normalizeRawProposals(sourceRoot, rawEntries, state, sliceIds, options = {}) {
  const findingsById = new Map((state.findings || []).map((finding) => [finding.finding_id, finding]));
  return rawEntries.map((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return governanceFailure(DISPOSITION_UNRESOLVED, 'Every finding disposition must be a JSON object.');
    }
    const supportedKeys = new Set([
      'acceptance_ref',
      'action',
      'criterion_binding',
      'criterion_file',
      'evidence_obligations',
      'finding_id',
      'supersedes',
      'target',
      'target_issue',
    ]);
    const unknownKeys = Object.keys(entry).filter((key) => !supportedKeys.has(key)).sort();
    if (unknownKeys.length > 0) {
      return governanceFailure(
        DISPOSITION_UNRESOLVED,
        `Finding disposition contains unsupported fields: ${unknownKeys.join(', ')}.`,
        { unknown_fields: unknownKeys },
      );
    }
    const findingId = String(entry.finding_id || '').trim();
    const finding = findingsById.get(findingId);
    if (!finding) {
      return governanceFailure(DISPOSITION_UNRESOLVED, `Unknown finding '${findingId || '<missing>'}'.`, {
        finding_id: findingId || null,
      });
    }
    const action = String(entry.action || '').trim();
    const batchActions = new Set([
      ...TRANSFER_DISPOSITION_ACTIONS,
      'create-follow-up',
      'optional',
      'revise-plan',
    ]);
    if (action === 'accept-risk') {
      return governanceFailure(
        'DISPOSITION_UNAUTHORIZED',
        `Finding '${findingId}' requires the separate accept-risk authorization workflow.`,
        { finding_id: findingId, action },
      );
    }
    if (!(options.batch === true ? batchActions.has(action) : TRANSFER_DISPOSITION_ACTIONS.includes(action))) {
      return governanceFailure(
        DISPOSITION_UNRESOLVED,
        `Finding '${findingId}' uses unsupported disposition action '${action || '<missing>'}'.`,
        { finding_id: findingId, action: action || null },
      );
    }
    let criterionBinding = null;
    if (TRANSFER_DISPOSITION_ACTIONS.includes(action)) {
      const acceptanceRef = resolveAcceptanceRef(
        finding,
        entry.acceptance_ref || entry.criterion_binding?.acceptance_ref,
        options.allowAcceptanceInference === true,
      );
      if (entry.criterion_binding && entry.criterion_file) {
        return governanceFailure(
          DISPOSITION_DUPLICATE,
          `Finding '${findingId}' declares both criterion_binding and criterion_file.`,
          { finding_id: findingId },
        );
      }
      if (entry.criterion_binding) {
        if (entry.criterion_binding.acceptance_ref !== acceptanceRef) {
          return governanceFailure(DISPOSITION_UNRESOLVED, `Finding '${findingId}' criterion references disagree.`, {
            finding_id: findingId,
          });
        }
        const sourceBinding = readExactSafeCriterion(
          sourceRoot,
          entry.criterion_binding.source_path,
          acceptanceRef,
          { redactionRoots: [options.canonicalRoot] },
        );
        if (canonicalSha256(sourceBinding) !== canonicalSha256(entry.criterion_binding)) {
          return governanceFailure(
            DISPOSITION_UNRESOLVED,
            `Finding '${findingId}' criterion binding does not match its exact source bytes.`,
            { finding_id: findingId, source_path: sourceBinding.source_path },
          );
        }
        criterionBinding = sourceBinding;
      } else if (entry.criterion_file) {
        criterionBinding = readExactSafeCriterion(sourceRoot, entry.criterion_file, acceptanceRef, {
          redactionRoots: [options.canonicalRoot],
        });
      } else {
        return governanceFailure(
          DISPOSITION_UNRESOLVED,
          `Finding '${findingId}' requires criterion_file or criterion_binding.`,
          { finding_id: findingId },
        );
      }
    } else if (entry.criterion_binding || entry.criterion_file || entry.acceptance_ref) {
      return governanceFailure(
        DISPOSITION_UNRESOLVED,
        `Finding '${findingId}' cannot attach a transfer criterion to action '${action}'.`,
        { finding_id: findingId },
      );
    }
    const targetIssue = String(entry.target_issue || '').trim();
    if (targetIssue && (
      containsSensitiveText(targetIssue)
      || redactionChanges(targetIssue, [sourceRoot, options.canonicalRoot])
    )) {
      return governanceFailure(
        UNSAFE_CONTRACTUAL_DATA,
        `Finding '${findingId}' target_issue cannot be persisted safely.`,
        { finding_id: findingId },
      );
    }
    return {
      finding_id: findingId,
      action,
      ...(String(entry.target || '').trim() ? { target: String(entry.target).trim() } : {}),
      ...(targetIssue ? { target_issue: targetIssue } : {}),
      evidence_obligations: assertSafeEvidenceObligations(
        sourceRoot,
        entry.evidence_obligations,
        findingId,
        { redactionRoots: [options.canonicalRoot] },
      ),
      ...(criterionBinding ? { criterion_binding: criterionBinding } : {}),
      supersedes: String(entry.supersedes || '').trim() || null,
    };
  });
}

function authorizeTransfer(run, governance, actor) {
  const result = authorizeGovernanceAction({
    governance,
    action: 'transfer-blocker',
    actor,
    profile: run.governance?.effective_profile,
    context: {
      run_creator: run.governance_actors?.run_creator || null,
      reviewer: run.governance_actors?.reviewer || null,
      executor: run.governance_actors?.executor || null,
    },
  });
  if (!result.authorized) {
    return governanceFailure(result.code || 'DISPOSITION_UNAUTHORIZED', result.message || 'Finding transfer is unauthorized.', {
      ...(result.details || {}),
      authorization_code: result.code || null,
    });
  }
  return result.evidence;
}

function prepareTransfer(projectRoot, runId, rawInput, actor, options = {}) {
  const run = readAiRun(projectRoot, runId);
  const state = readRunGovernance(projectRoot, runId);
  assertCorrelatedTransferWindow(projectRoot, run, state);
  const review = currentReviewForState(state);
  const governance = readGovernanceConfig(projectRoot);
  const policyDigest = assertRunPolicyParity(run, review, governance);
  const { planManifest, sliceIds } = resolvePlanContext(projectRoot, state);
  let rawEntries = rawInput;
  if (options.batch === true) {
    const envelope = normalizeConditionDispositionInput(rawInput, {
      schemaVersion: 1,
      runId: run.run_id,
      reviewId: review.review_id,
      policyVersion: governance.policy.version,
      policyDigest,
    });
    const mismatches = [
      ['schema_version', 1],
      ['run_id', run.run_id],
      ['review_id', review.review_id],
      ['policy_version', governance.policy.version],
      ['policy_digest', policyDigest],
    ].filter(([field, expected]) => envelope[field] !== expected).map(([field]) => field);
    if (mismatches.length > 0) {
      return governanceFailure(DISPOSITION_STALE, 'Batch disposition correlation is stale.', {
        run_id: run.run_id,
        mismatches,
      });
    }
    rawEntries = envelope.dispositions;
  }
  const normalizedInput = normalizeRawProposals(
    options.sourceRoot || projectRoot,
    rawEntries,
    state,
    sliceIds,
    { ...options, canonicalRoot: projectRoot },
  );
  const dispositions = validateTransferDispositionSet({
    dispositions: normalizedInput,
    findings: state.findings,
    governance,
    policyDigest,
    policyVersion: governance.policy.version,
    reviewId: review.review_id,
    runId: run.run_id,
    sliceIds,
  });
  const validateCriterionBindingAgainstPlan = options.validateCriterionBindingAgainstPlanFn
    || require('../lib/ai/spec-governance').validateCriterionBindingAgainstPlan;
  for (const disposition of dispositions) {
    if (!TRANSFER_DISPOSITION_ACTIONS.includes(disposition.action)) continue;
    const finding = state.findings.find((item) => item.finding_id === disposition.finding_id);
    validateCriterionBindingAgainstPlan(
      disposition.criterion_binding,
      finding,
      planManifest,
      projectRoot,
    );
  }
  const authorization = authorizeTransfer(run, governance, actor);
  return {
    authorization,
    dispositions,
    governance,
    planManifest,
    policyDigest,
    review,
    run,
    sliceIds,
    state,
  };
}

function nextDispositionId(dispositions) {
  const used = new Set(dispositions.map((item) => item.disposition_id));
  let number = 1;
  while (used.has(`D-${String(number).padStart(3, '0')}`)) number += 1;
  return `D-${String(number).padStart(3, '0')}`;
}

function stageTransfer(prepared, options = {}) {
  const state = JSON.parse(JSON.stringify(prepared.state));
  const nowValue = options.now || new Date();
  const recordedAt = nowValue instanceof Date ? nowValue.toISOString() : new Date(nowValue).toISOString();
  const created = [];
  for (const proposed of prepared.dispositions) {
    const currentIndex = state.dispositions.findIndex((item) => (
      item.finding_id === proposed.finding_id && item.state === 'current'
    ));
    const current = currentIndex === -1 ? null : state.dispositions[currentIndex];
    if (current && proposed.supersedes !== current.disposition_id) {
      return governanceFailure(
        proposed.supersedes ? DISPOSITION_STALE : DISPOSITION_DUPLICATE,
        `Finding '${proposed.finding_id}' already has current disposition '${current.disposition_id}'; replace it with --supersedes ${current.disposition_id}.`,
        { finding_id: proposed.finding_id, current_disposition_id: current.disposition_id },
      );
    }
    if (!current && proposed.supersedes) {
      return governanceFailure(
        DISPOSITION_STALE,
        `Finding '${proposed.finding_id}' has no current disposition '${proposed.supersedes}' to supersede.`,
        { finding_id: proposed.finding_id, supersedes: proposed.supersedes },
      );
    }
    if (current) state.dispositions[currentIndex] = { ...current, state: 'superseded' };
    const disposition = canonicalDispositionSchema.parse({
      schema_version: 1,
      disposition_id: nextDispositionId(state.dispositions),
      run_id: prepared.run.run_id,
      review_id: prepared.review.review_id,
      finding_id: proposed.finding_id,
      action: proposed.action,
      target: proposed.target,
      target_issue: proposed.target_issue,
      evidence_obligations: proposed.evidence_obligations,
      criterion_binding: proposed.criterion_binding,
      state: 'current',
      supersedes: proposed.supersedes,
      actor_id: prepared.authorization.actor_id,
      authorization: prepared.authorization,
      policy_version: prepared.governance.policy.version,
      policy_digest: prepared.policyDigest,
      recorded_at: recordedAt,
    });
    state.dispositions.push(disposition);
    created.push(disposition);
  }
  const nextState = runGovernanceStateSchema.parse({ ...state, updated_at: recordedAt });
  return { created, nextState };
}

function dispositionProjection(disposition) {
  return {
    disposition_id: disposition.disposition_id,
    finding_id: disposition.finding_id,
    action: disposition.action,
    target: disposition.target || null,
    target_issue: disposition.target_issue || null,
    criterion_binding: disposition.criterion_binding ? { ...disposition.criterion_binding } : null,
    evidence_obligations: disposition.evidence_obligations,
    supersedes: disposition.supersedes,
    state: disposition.state,
  };
}

function buildResult(prepared, staged, options = {}) {
  return {
    schema_version: 1,
    task: options.command === 'transfer' ? 'findings-transfer' : 'findings-disposition',
    ok: true,
    status: options.dryRun ? 'dry-run' : 'saved',
    dry_run: options.dryRun === true,
    run_id: prepared.run.run_id,
    review_id: prepared.review.review_id,
    policy_version: prepared.governance.policy.version,
    policy_digest: prepared.policyDigest,
    disposition_count: staged.created.length,
    dispositions: staged.created.map(dispositionProjection),
  };
}

function formatHumanResult(result) {
  const lines = [
    result.dry_run ? 'Finding disposition dry-run' : 'Finding dispositions saved',
    `Run: ${result.run_id}`,
    `Review: ${result.review_id}`,
    `Dispositions: ${result.disposition_count}`,
  ];
  for (const disposition of result.dispositions) {
    const destination = disposition.target || disposition.target_issue || disposition.action;
    lines.push(
      `- ${disposition.disposition_id}: ${disposition.finding_id} -> ${destination}`,
      `  evidence=${disposition.evidence_obligations.length}`,
    );
    if (disposition.criterion_binding) {
      lines.push(`  criterion=${disposition.criterion_binding.acceptance_ref} digest=${disposition.criterion_binding.criterion_sha256}`);
    }
  }
  if (result.dry_run) lines.push('No files were changed.');
  return `${lines.join('\n')}\n`;
}

async function runFindings(projectRoot, options = {}) {
  const invocationRoot = path.resolve(projectRoot);
  let canonicalRoot = null;
  try {
    if (!['transfer', 'disposition'].includes(options.command)) {
      return governanceFailure(DISPOSITION_UNRESOLVED, `Unsupported findings command '${options.command || '<missing>'}'.`);
    }
    canonicalRoot = resolveCanonicalRoot(invocationRoot, options);
    let governedRun;
    try {
      governedRun = resolveGovernedAiRun(canonicalRoot, options.runId || '');
    } catch (error) {
      const message = String(error?.message || error);
      const code = message.includes('AI_RUN_CLOSED')
        ? 'AI_RUN_CLOSED'
        : message.includes('AI_RUN_REQUIRED') || message.includes('missing AI run')
          ? 'AI_RUN_REQUIRED'
          : error?.code;
      if (!code) throw error;
      return governanceFailure(code, message.replace(/^create-quiver:\s*/, ''), error?.details || {});
    }
    if (!governedRun) {
      return governanceFailure('AI_RUN_REQUIRED', 'Finding disposition requires one active governed run.');
    }
    const rawEntries = options.command === 'transfer'
      ? rawIndividualInput(options)
      : rawBatchInput(invocationRoot, options);
    const actor = options.actor || await (options.resolveActorFn || resolveGitHubCliProviderSubject)({
      cwd: canonicalRoot,
      env: options.env,
      host: options.githubHost,
      runner: options.identityRunner,
    });
    const prepareOptions = {
      allowAcceptanceInference: options.command === 'transfer',
      batch: options.command === 'disposition',
      sourceRoot: invocationRoot,
      validateCriterionBindingAgainstPlanFn: options.validateCriterionBindingAgainstPlanFn,
    };
    const preflight = prepareTransfer(canonicalRoot, governedRun.run_id, rawEntries, actor, prepareOptions);
    const preflightDigest = canonicalSha256(preflight.dispositions);
    let prepared = preflight;
    let staged = stageTransfer(preflight, options);

    if (!options.dryRun) {
      ({ prepared, staged } = withAiRunLock(
        canonicalRoot,
        governedRun.run_id,
        { command: `findings ${options.command}` },
        () => {
          const locked = prepareTransfer(canonicalRoot, governedRun.run_id, rawEntries, actor, prepareOptions);
          if (canonicalSha256(locked.dispositions) !== preflightDigest) {
            return governanceFailure(
              DISPOSITION_STALE,
              'Finding disposition input or canonical state changed before the run lock was acquired.',
              { run_id: governedRun.run_id },
            );
          }
          const lockedStage = stageTransfer(locked, options);
          writeRunGovernance(canonicalRoot, governedRun.run_id, lockedStage.nextState);
          return { prepared: locked, staged: lockedStage };
        },
      ));
    }

    const result = buildResult(prepared, staged, options);
    const safeResult = redactSensitiveValue(result, { projectRoot: invocationRoot });
    process.stdout.write(options.json
      ? `${JSON.stringify(safeResult, null, 2)}\n`
      : formatHumanResult(safeResult));
    return safeResult;
  } catch (error) {
    throw sanitizeFindingsError(error, [invocationRoot, canonicalRoot]);
  }
}

module.exports = {
  UNSAFE_CONTRACTUAL_DATA,
  formatHumanResult,
  inferTransferAction,
  readExactSafeCriterion,
  runFindings,
};
