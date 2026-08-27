const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { buildPlannerApprovalCandidates, readPhaseApproval, resolveApprovedPlannerInput } = require('../approvals');
const { quiverInternalPaths } = require('../init-layout');
const { redactSensitiveValue } = require('./artifacts');
const {
  assertReviewBudgetHistoryVerified,
  assertReviewBudgetReservationLocked,
  finalizeReviewBudget,
  readReviewBudget,
  readReviewBudgetEvents,
  reduceReviewBudgetEvents,
  sha256Digest,
} = require('./review-budget');
const {
  GovernanceError,
  PROVIDER_OUTPUT_INVALID,
  assertProviderReviewAggregates,
  computePolicyDigest,
  parseProviderReview,
  projectPhaseAwareReview,
  readGovernanceConfig,
  reconcileFindings,
  stableStringify,
} = require('./review-governance');
const { runGovernanceStateSchema } = require('./review-governance.schema');
const {
  readAiRun,
  readRunGovernance,
  runReviewCommitPath,
  updateAiRunPhase,
  withAiRunLock,
  writeRunGovernance,
} = require('./run-state');

const PLAN_REVIEW_PROMPT_SOURCE = 'packaged production-readiness plan review template';
const PLAN_REVIEW_RECOMMENDATIONS = Object.freeze(['approve', 'approve-with-risk', 'revise']);
const REVIEW_COMMIT_SCHEMA_VERSION = 1;

function formatError(message) {
  return `create-quiver: ${message}`;
}

function toRelativePosix(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function planReviewRoot(projectRoot) {
  return path.join(quiverInternalPaths(projectRoot).root, 'approvals', 'plan-review');
}

function planReviewPath(projectRoot) {
  return path.join(planReviewRoot(projectRoot), 'review.md');
}

function planReviewMetaPath(projectRoot) {
  return path.join(planReviewRoot(projectRoot), 'meta.json');
}

function reviewCommitError(message, details = {}) {
  return new GovernanceError('REVIEW_COMMIT_RECOVERY_REQUIRED', message, details);
}

function writeFileAtomic(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = path.join(
    path.dirname(filePath),
    `.tmp-${path.basename(filePath)}-${process.pid}-${crypto.randomBytes(6).toString('hex')}`,
  );
  try {
    fs.writeFileSync(tempPath, contents, { flag: 'wx' });
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    if (fs.existsSync(tempPath)) fs.rmSync(tempPath);
    throw error;
  }
}

function governanceStateDigest(value) {
  return sha256Digest(stableStringify(value || null));
}

function omitCanonicalAuthorizationEvidence(state) {
  if (!state) return state;
  const copy = JSON.parse(JSON.stringify(state));
  for (const collection of ['dispositions', 'conditioned_candidates', 'decisions']) {
    for (const record of copy[collection] || []) {
      delete record.authorization;
    }
  }
  return copy;
}

function assertCanonicalAuthorizationEvidenceSafe(projectRoot, state, label) {
  if (!state) return;
  const unsafe = [];
  for (const collection of ['dispositions', 'conditioned_candidates', 'decisions']) {
    for (const [index, record] of (state[collection] || []).entries()) {
      if (!record?.authorization) continue;
      const redacted = redactSensitiveValue(record.authorization, { projectRoot });
      if (stableStringify(record.authorization) !== stableStringify(redacted)) {
        unsafe.push(`${label}.${collection}.${index}.authorization`);
      }
    }
  }
  if (unsafe.length > 0) {
    throw reviewCommitError('Prepared governed review commit contains non-redacted authorization evidence.', {
      changed_sections: unsafe,
    });
  }
}

function assertReviewCommitMarker(projectRoot, runId, marker) {
  const reservation = marker?.reservation;
  const expectedArtifactPath = toRelativePosix(projectRoot, planReviewPath(projectRoot));
  const previous = marker?.previous_governance_state || null;
  const next = marker?.next_governance_state;
  const previousReviews = Array.isArray(previous?.reviews) ? previous.reviews : [];
  const nextReviews = Array.isArray(next?.reviews) ? next.reviews : [];
  const previousGovernanceValidation = previous === null
    ? { success: true }
    : runGovernanceStateSchema.safeParse(previous);
  const nextGovernanceValidation = runGovernanceStateSchema.safeParse(next);
  const appendedReview = nextReviews.at(-1);
  const findingsById = new Map((next?.findings || []).map((finding) => [finding.finding_id, finding]));
  const expectedReviewContents = next && appendedReview
    ? redactSensitiveValue(renderGovernedPlanReview(next, appendedReview, findingsById), { projectRoot })
    : null;
  const expectedMeta = appendedReview ? {
    schema_version: 2,
    governed: true,
    phase: 'plan-review',
    run_id: runId,
    review_id: appendedReview.review_id,
    source_file: appendedReview.source_file,
    source_kind: appendedReview.source_kind,
    source_version: appendedReview.source_version,
    path: expectedArtifactPath,
    raw_artifact_path: appendedReview.raw_artifact_path,
    output_source: appendedReview.output_source,
    requested_profile: appendedReview.requested_profile,
    effective_profile: appendedReview.effective_profile,
    policy_version: appendedReview.policy_version,
    policy_digest: appendedReview.policy_digest,
    review_result: {
      schema_version: 2,
      ...appendedReview.projection,
      next_command: recommendedNextCommand(appendedReview.projection.approval_recommendation, appendedReview.source_version),
      risks: appendedReview.projection.later_phase_transfers,
      findings: (next.findings || []).filter((finding) => finding.state === 'open'),
      source: 'governed-canonical',
    },
    reviewed_at: appendedReview.reviewed_at,
  } : null;
  const invalid = marker?.schema_version !== REVIEW_COMMIT_SCHEMA_VERSION
    || marker?.kind !== 'governed-plan-review-commit'
    || marker?.run_id !== runId
    || !/^BR-\d{6,}$/.test(String(reservation?.reservation_id || ''))
    || !Number.isInteger(reservation?.attempt)
    || reservation.attempt < 1
    || !/^sha256:[a-f0-9]{64}$/.test(String(reservation?.request_envelope_digest || ''))
    || !/^R-\d{3,}$/.test(String(marker?.review_id || ''))
    || marker?.target_phase !== 'technical-plan-reviewed'
    || marker?.artifact_path !== expectedArtifactPath
    || !marker?.profile
    || !/^sha256:[a-f0-9]{64}$/.test(String(marker?.policy_digest || ''))
    || marker.profile.policy_digest !== marker.policy_digest
    || Number.isNaN(Date.parse(String(marker?.prepared_at || '')))
    || marker.previous_governance_sha256 !== governanceStateDigest(previous)
    || marker.next_governance_sha256 !== governanceStateDigest(next)
    || marker.review_contents_sha256 !== sha256Digest(String(marker?.review_contents || ''))
    || marker.meta_sha256 !== sha256Digest(stableStringify(marker?.meta || null))
    || (previous && previous.run_id !== runId)
    || next?.run_id !== runId
    || next?.current_review_id !== marker.review_id
    || nextReviews.length !== previousReviews.length + 1
    || stableStringify(nextReviews.slice(0, -1)) !== stableStringify(previousReviews)
    || appendedReview?.review_id !== marker.review_id
    || appendedReview?.run_id !== runId
    || marker?.meta?.run_id !== runId
    || marker?.meta?.review_id !== marker.review_id
    || marker?.meta?.path !== expectedArtifactPath
    || stableStringify(marker?.meta || null) !== stableStringify(expectedMeta)
    || typeof marker?.review_contents !== 'string'
    || !marker.review_contents.trim()
    || marker.review_contents !== expectedReviewContents
    || previousGovernanceValidation.success !== true
    || nextGovernanceValidation.success !== true;

  if (invalid) {
    throw reviewCommitError('Prepared governed review commit is corrupt or does not match its run.', {
      run_id: runId,
      wal_path: toRelativePosix(projectRoot, runReviewCommitPath(projectRoot, runId)),
    });
  }
  assertCanonicalAuthorizationEvidenceSafe(projectRoot, previous, 'previous_governance_state');
  assertCanonicalAuthorizationEvidenceSafe(projectRoot, next, 'next_governance_state');
  const redactionCandidate = {
    ...marker,
    previous_governance_state: omitCanonicalAuthorizationEvidence(previous),
    next_governance_state: omitCanonicalAuthorizationEvidence(next),
  };
  const redacted = redactSensitiveValue(redactionCandidate, { projectRoot });
  if (stableStringify(redactionCandidate) !== stableStringify(redacted)) {
    throw reviewCommitError('Prepared governed review commit contains non-redacted values.', {
      run_id: runId,
      changed_sections: Object.keys(redactionCandidate).filter((key) => (
        stableStringify(redactionCandidate[key]) !== stableStringify(redacted[key])
      )),
    });
  }
  return marker;
}

function readReviewCommitMarker(projectRoot, runId) {
  const filePath = runReviewCommitPath(projectRoot, runId);
  if (!fs.existsSync(filePath)) return null;
  let marker;
  try {
    marker = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw reviewCommitError('Prepared governed review commit is not valid JSON.', {
      run_id: runId,
      cause: error.message,
    });
  }
  return assertReviewCommitMarker(projectRoot, runId, marker);
}

function writeReviewCommitMarker(projectRoot, runId, marker) {
  const filePath = runReviewCommitPath(projectRoot, runId);
  if (fs.existsSync(filePath)) {
    throw reviewCommitError(`Run '${runId}' already has a prepared review commit.`);
  }
  const validated = assertReviewCommitMarker(projectRoot, runId, marker);
  writeFileAtomic(filePath, `${JSON.stringify(validated, null, 2)}\n`);
  return filePath;
}

function invokeReviewCommitFault(options, point) {
  if (typeof options.faultInjector === 'function') options.faultInjector(point);
}

function applyGovernedReviewCommitLocked(projectRoot, markerValue, options = {}) {
  const marker = assertReviewCommitMarker(projectRoot, markerValue.run_id, markerValue);
  const run = readAiRun(projectRoot, marker.run_id);
  if (!run || run.status === 'closed') {
    throw reviewCommitError(`Prepared review commit cannot target closed or missing run '${marker.run_id}'.`);
  }
  const governance = readGovernanceConfig(projectRoot);
  if (computePolicyDigest(governance) !== marker.policy_digest) {
    throw reviewCommitError('Active governance policy does not match the prepared review commit.', {
      run_id: marker.run_id,
      expected_policy_digest: marker.policy_digest,
      actual_policy_digest: computePolicyDigest(governance),
    });
  }

  const currentGovernance = readRunGovernance(projectRoot, marker.run_id);
  const currentDigest = governanceStateDigest(currentGovernance);
  if (currentDigest !== marker.previous_governance_sha256
    && currentDigest !== marker.next_governance_sha256) {
    throw reviewCommitError('Canonical governance state diverged from the prepared review commit.', {
      run_id: marker.run_id,
      expected_previous_sha256: marker.previous_governance_sha256,
      expected_next_sha256: marker.next_governance_sha256,
      actual_sha256: currentDigest,
    });
  }

  const reduced = reduceReviewBudgetEvents(readReviewBudgetEvents(projectRoot, marker.run_id));
  const reservationState = reduced.reservations.find((state) => (
    state.reservation.reservation_id === marker.reservation.reservation_id
  ));
  if (!reservationState
    || reservationState.attempt !== marker.reservation.attempt
    || reservationState.reservation.request_envelope_digest !== marker.reservation.request_envelope_digest
    || !['reserved', 'valid'].includes(reservationState.status)
    || (reservationState.status === 'valid' && reservationState.outcome?.review_id !== marker.review_id)) {
    throw reviewCommitError('Prepared review commit no longer matches a finalizable budget reservation.', {
      run_id: marker.run_id,
      reservation_id: marker.reservation.reservation_id,
      reservation_status: reservationState?.status || 'missing',
    });
  }

  if (currentDigest === marker.previous_governance_sha256) {
    writeRunGovernance(projectRoot, marker.run_id, marker.next_governance_state);
  }
  invokeReviewCommitFault(options, 'after-canonical');

  let budget;
  if (reservationState.status === 'reserved') {
    budget = finalizeReviewBudget(projectRoot, {
      runId: marker.run_id,
      governance,
      profile: marker.profile,
      reservationId: marker.reservation.reservation_id,
      attempt: marker.reservation.attempt,
      requestEnvelopeDigest: marker.reservation.request_envelope_digest,
      outcome: 'valid',
      receivedPayload: true,
      reviewId: marker.review_id,
      locked: true,
      prevalidated: true,
      now: marker.prepared_at,
    }).budget;
  } else {
    budget = readReviewBudget(projectRoot, marker.run_id, {
      governance,
      profile: marker.profile,
    }).projection;
  }
  invokeReviewCommitFault(options, 'after-outcome');

  writeFileAtomic(planReviewPath(projectRoot), marker.review_contents);
  invokeReviewCommitFault(options, 'after-review');
  writeFileAtomic(planReviewMetaPath(projectRoot), `${JSON.stringify(marker.meta, null, 2)}\n`);
  invokeReviewCommitFault(options, 'after-meta');

  const currentRun = readAiRun(projectRoot, marker.run_id);
  if (currentRun.phase !== marker.target_phase) {
    if (currentRun.phase !== 'technical-plan-draft') {
      throw reviewCommitError('Prepared review commit cannot advance from the current run phase.', {
        run_id: marker.run_id,
        expected_phase: 'technical-plan-draft',
        actual_phase: currentRun.phase,
      });
    }
    updateAiRunPhase(projectRoot, marker.run_id, marker.target_phase, {
      artifact: marker.artifact_path,
      command: 'ai review-plan',
      locked: true,
      now: new Date(marker.prepared_at),
    });
  }
  invokeReviewCommitFault(options, 'after-phase');

  const committedGovernance = readRunGovernance(projectRoot, marker.run_id);
  const committedEvents = readReviewBudgetEvents(projectRoot, marker.run_id);
  assertReviewBudgetHistoryVerified(projectRoot, marker.run_id, committedEvents, {
    governanceState: committedGovernance,
  });
  if (governanceStateDigest(committedGovernance) !== marker.next_governance_sha256
    || fs.readFileSync(planReviewPath(projectRoot), 'utf8') !== marker.review_contents
    || sha256Digest(stableStringify(JSON.parse(fs.readFileSync(planReviewMetaPath(projectRoot), 'utf8')))) !== marker.meta_sha256
    || readAiRun(projectRoot, marker.run_id)?.phase !== marker.target_phase) {
    throw reviewCommitError('Prepared review commit could not be verified after application.', {
      run_id: marker.run_id,
      reservation_id: marker.reservation.reservation_id,
    });
  }

  const walPath = runReviewCommitPath(projectRoot, marker.run_id);
  if (fs.existsSync(walPath)) fs.rmSync(walPath);
  return {
    recovered: options.recovery === true,
    runId: marker.run_id,
    reviewId: marker.review_id,
    budget,
    filePath: planReviewPath(projectRoot),
    metaPath: planReviewMetaPath(projectRoot),
  };
}

function recoverGovernedPlanReviewCommit(projectRoot, options = {}) {
  const run = readAiRun(projectRoot, options.runId);
  if (!run) return { recovered: false, runId: null };
  const walPath = runReviewCommitPath(projectRoot, run.run_id);
  if (!fs.existsSync(walPath)) return { recovered: false, runId: run.run_id };
  const apply = () => {
    const marker = readReviewCommitMarker(projectRoot, run.run_id);
    if (!marker) return { recovered: false, runId: run.run_id };
    return applyGovernedReviewCommitLocked(projectRoot, marker, { recovery: true });
  };
  if (options.locked === true) return apply();
  return withAiRunLock(projectRoot, run.run_id, { command: 'recover governed plan review commit' }, apply);
}

function readPlanReviewMeta(projectRoot) {
  const filePath = planReviewMetaPath(projectRoot);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(formatError(`invalid plan-review metadata at ${toRelativePosix(projectRoot, filePath)}: ${error.message}`));
  }
}

function normalizeDrafts(meta) {
  return Array.isArray(meta?.drafts) ? meta.drafts.filter((item) => item && typeof item === 'object') : [];
}

function resolvePath(projectRoot, relativePath) {
  return path.resolve(projectRoot, relativePath || '');
}

function samePath(projectRoot, left, right) {
  return Boolean(left && right && resolvePath(projectRoot, left) === resolvePath(projectRoot, right));
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(/\r?\n/).map((item) => item.replace(/^[-*]\s+/, '').trim()).filter(Boolean);
  }
  return [];
}

function normalizeRecommendation(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/[_\s]+/g, '-');
  if (PLAN_REVIEW_RECOMMENDATIONS.includes(normalized)) {
    return normalized;
  }
  if (normalized === 'approved' || normalized === 'approvable') {
    return 'approve';
  }
  if (normalized === 'approved-with-risk' || normalized === 'approvable-with-risk' || normalized === 'approve-with-risks') {
    return 'approve-with-risk';
  }
  if (normalized === 'changes-required' || normalized === 'requires-revision' || normalized === 'needs-revision') {
    return 'revise';
  }
  return '';
}

function recommendedNextCommand(recommendation, sourceVersion) {
  if (recommendation === 'revise') {
    return 'npx create-quiver ai revise --phase technical-plan --input <feedback.md> --dry-run';
  }
  return `npx create-quiver ai approve --phase technical-plan --version ${sourceVersion || '<n>'}`;
}

function parseJsonObject(value) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function extractStructuredReview(text) {
  const raw = String(text || '').trim();
  if (!raw) {
    return null;
  }

  const direct = parseJsonObject(raw);
  if (direct) {
    return direct;
  }

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (!fenced) {
    return null;
  }
  return parseJsonObject(fenced[1].trim());
}

function normalizeStructuredReview(parsed, sourceVersion) {
  const review = parsed?.review || parsed?.plan_review || parsed;
  const requiredFixes = normalizeList(review.required_fixes || review.requiredFixes || review.blocking_issues || review.blockingIssues);
  const optionalHardening = normalizeList(review.optional_hardening || review.optionalHardening || review.non_blocking_issues || review.nonBlockingIssues);
  const risks = normalizeList(review.risks || review.remaining_risks || review.remainingRisks);
  let approvalRecommendation = normalizeRecommendation(review.approval_recommendation || review.approvalRecommendation || review.recommendation);
  const blocking = review.blocking === true || review.has_blockers === true || review.hasBlockers === true || requiredFixes.length > 0;

  if (!approvalRecommendation) {
    approvalRecommendation = blocking ? 'revise' : optionalHardening.length > 0 || risks.length > 0 ? 'approve-with-risk' : 'approve';
  }

  const normalizedBlocking = blocking || approvalRecommendation === 'revise';

  return {
    schema_version: 1,
    approval_recommendation: approvalRecommendation,
    blocking: normalizedBlocking,
    next_command: String(review.next_command || review.nextCommand || '').trim() || recommendedNextCommand(approvalRecommendation, sourceVersion),
    optional_hardening: optionalHardening,
    required_fixes: requiredFixes,
    risks,
    source: 'structured',
  };
}

function classifyReviewText(text) {
  const value = String(text || '').toLowerCase();
  if (/\b(revise|revision|required fix|required fixes|blocking|blocker|not approvable|not ready)\b/.test(value)) {
    return 'revise';
  }
  if (/\b(approve with risk|approvable with risk|non-blocking|optional hardening|p1|p2|risk)\b/.test(value)) {
    return 'approve-with-risk';
  }
  if (/\b(approve|approved|approvable|no blockers|no blocking|production ready)\b/.test(value)) {
    return 'approve';
  }
  return 'approve-with-risk';
}

function derivePlanReviewResult(contents, options = {}) {
  const structured = extractStructuredReview(contents);
  if (structured) {
    return normalizeStructuredReview(structured, options.inputVersion);
  }

  const approvalRecommendation = classifyReviewText(contents);
  const fallbackNote = approvalRecommendation === 'approve-with-risk'
    ? ['Review output did not include structured metadata; treat approval as risky and inspect the human review text before approving.']
    : [];
  const requiredFixes = approvalRecommendation === 'revise'
    ? ['Review output indicates the technical plan must be revised before approval.']
    : [];

  return {
    schema_version: 1,
    approval_recommendation: approvalRecommendation,
    blocking: approvalRecommendation === 'revise',
    next_command: recommendedNextCommand(approvalRecommendation, options.inputVersion),
    optional_hardening: fallbackNote,
    required_fixes: requiredFixes,
    risks: [],
    source: 'heuristic',
  };
}

function reviewBlocksApproval(review) {
  const result = review?.meta?.review_result || review?.review_result || null;
  if (!result) {
    return false;
  }
  return result.blocking === true || result.approval_recommendation === 'revise';
}

function normalizeReviewDecision(review) {
  const result = review?.meta?.review_result || null;
  const requiredFixes = normalizeList(result?.required_fixes);
  const optionalHardening = normalizeList(result?.optional_hardening);
  const risks = normalizeList(result?.risks);
  const blocking = reviewBlocksApproval(review);
  const recommendation = result?.approval_recommendation || (review.status === 'missing' || review.status === 'stale' ? 'review-required' : 'approve-with-risk');
  const nextCommand = result?.next_command || (review.status === 'unapproved' || review.status === 'reviewed'
    ? 'npx create-quiver ai approve --phase technical-plan --version <n>'
    : 'npx create-quiver ai review-plan --dry-run');

  return {
    status: review.status,
    recommendation,
    blocking: blocking || review.status === 'missing' || review.status === 'stale',
    required_fixes: requiredFixes,
    optional_hardening: optionalHardening,
    risks,
    required_fixes_count: requiredFixes.length,
    optional_hardening_count: optionalHardening.length,
    risks_count: risks.length,
    source_file: review.meta?.source_file || '',
    source_kind: review.meta?.source_kind || null,
    source_version: review.meta?.source_version || null,
    reviewed_at: review.meta?.reviewed_at || '',
    next_command: nextCommand,
  };
}

function buildTechnicalPlanApprovalCandidates(projectRoot) {
  const base = buildPlannerApprovalCandidates(projectRoot, 'technical-plan');
  const review = readPlanReview(projectRoot);
  const reviewDecision = normalizeReviewDecision(review);
  const reviewReady = (review.status === 'unapproved' || review.status === 'reviewed') && reviewDecision.blocking !== true;
  const candidates = base.candidates.map((candidate) => {
    const matchesReviewVersion = !reviewDecision.source_version
      || !candidate.version
      || Number(reviewDecision.source_version) === Number(candidate.version);
    const approvable = candidate.approvable === true && reviewReady && matchesReviewVersion;
    const reason = approvable
      ? `latest draft has plan-review recommendation ${reviewDecision.recommendation}`
      : review.status === 'missing'
        ? 'technical-plan requires production review before approval'
        : review.status === 'stale'
          ? 'technical-plan review is stale'
          : reviewDecision.blocking
            ? `plan-review blocks approval with recommendation ${reviewDecision.recommendation}`
            : matchesReviewVersion
              ? candidate.reason
              : `plan-review targets v${reviewDecision.source_version}; candidate is v${candidate.version}`;

    return {
      ...candidate,
      approvable,
      recommended: candidate.current === true && approvable,
      blocked: !approvable,
      status: approvable ? 'approvable' : candidate.current ? 'blocked' : 'history',
      reason,
      recommended_action: approvable ? 'approve' : reviewDecision.blocking || review.status === 'missing' || review.status === 'stale' ? 'review-or-revise' : 'inspect',
      next_command: approvable ? candidate.next_command : reviewDecision.next_command,
      review: reviewDecision,
    };
  });

  return {
    ...base,
    candidates,
    current: candidates.find((candidate) => candidate.current) || null,
    recommended: candidates.find((candidate) => candidate.recommended) || null,
    history: candidates.filter((candidate) => !candidate.current),
    review: reviewDecision,
    next_command: candidates.find((candidate) => candidate.recommended)?.next_command || reviewDecision.next_command,
  };
}

function latestTechnicalPlanDraft(approval) {
  const version = Number(approval.meta?.draft?.version || 0);
  if (!version) {
    return null;
  }
  return normalizeDrafts(approval.meta).find((item) => Number(item.version) === version) || null;
}

function reviewMatchesTarget(projectRoot, review, target) {
  if (review.version && target.version) {
    return review.version === target.version;
  }

  if (!review.source) {
    return false;
  }

  return samePath(projectRoot, review.source, target.source)
    || samePath(projectRoot, review.source, target.artifact);
}

function resolveTechnicalPlanReviewInput(projectRoot, explicitInput) {
  const approval = readPhaseApproval(projectRoot, 'technical-plan');
  const latestDraft = latestTechnicalPlanDraft(approval);
  const candidates = [];

  if (latestDraft?.path) {
    candidates.push({
      kind: 'draft',
      version: Number(latestDraft.version),
      inputPath: latestDraft.path,
      approval,
    });
  } else if (approval.draft?.path) {
    candidates.push({
      kind: 'draft',
      version: Number(approval.meta?.draft?.version || 0) || null,
      inputPath: approval.draft.path,
      approval,
    });
  }

  if (approval.approved?.path) {
    candidates.push({
      kind: 'approved',
      version: Number(approval.meta?.approved?.version || 0) || null,
      inputPath: approval.approved.path,
      approval,
    });
  }

  if (candidates.length === 0) {
    throw new Error(formatError("ai review-plan requires a generated technical-plan draft. Run `npx create-quiver ai plan --phase technical-plan`."));
  }

  if (!explicitInput) {
    return candidates[0];
  }

  const approvedSource = approval.meta?.approved?.source_file || '';
  const draftSource = approval.meta?.draft?.source_file || '';
  const matched = candidates.find((candidate) => samePath(projectRoot, explicitInput, candidate.inputPath))
    || candidates.find((candidate) => candidate.kind === 'approved' && samePath(projectRoot, explicitInput, approvedSource))
    || candidates.find((candidate) => candidate.kind === 'draft' && samePath(projectRoot, explicitInput, draftSource));

  if (!matched) {
    throw new Error(formatError(`ai review-plan input '${explicitInput}' must match the latest technical-plan draft or approved artifact.`));
  }

  return matched;
}

function readPlanReview(projectRoot) {
  const reviewPath = planReviewPath(projectRoot);
  const meta = readPlanReviewMeta(projectRoot);
  if (!meta && !fs.existsSync(reviewPath)) {
    return {
      status: 'missing',
      review: null,
      meta: null,
    };
  }

  const technicalPlan = readPhaseApproval(projectRoot, 'technical-plan');
  const reviewedAt = meta?.reviewed_at ? new Date(meta.reviewed_at).getTime() : 0;
  const approvedAt = technicalPlan.meta?.approved?.approved_at ? new Date(technicalPlan.meta.approved.approved_at).getTime() : 0;
  const reviewedVersion = Number(meta?.source_version || 0) || null;
  const approvedVersion = Number(technicalPlan.meta?.approved?.version || 0) || null;
  const reviewedSource = meta?.source_file || '';
  const approvedSource = technicalPlan.meta?.approved?.source_file || '';
  const approvedArtifact = technicalPlan.approved?.path || '';
  const reviewIdentity = {
    source: reviewedSource,
    version: reviewedVersion,
  };
  let status = 'unapproved';

  if (technicalPlan.status === 'approved') {
    const matchesApproved = reviewMatchesTarget(projectRoot, reviewIdentity, {
      artifact: approvedArtifact,
      source: approvedSource,
      version: approvedVersion,
    });
    const staleByTime = !reviewedVersion && !matchesApproved && approvedAt > 0 && reviewedAt > 0 && approvedAt > reviewedAt;
    status = matchesApproved && !staleByTime ? 'reviewed' : 'stale';
  } else if (technicalPlan.status === 'draft' || technicalPlan.status === 'stale') {
    const latestDraft = latestTechnicalPlanDraft(technicalPlan);
    const matchesLatestDraft = reviewMatchesTarget(projectRoot, reviewIdentity, {
      artifact: latestDraft?.path || technicalPlan.draft?.path || '',
      source: technicalPlan.meta?.draft?.source_file || '',
      version: Number(latestDraft?.version || technicalPlan.meta?.draft?.version || 0) || null,
    });
    status = matchesLatestDraft ? 'unapproved' : 'stale';
  }

  return {
    status,
    review: fs.existsSync(reviewPath)
      ? {
          path: toRelativePosix(projectRoot, reviewPath),
          contents: fs.readFileSync(reviewPath, 'utf8'),
        }
      : null,
    meta,
  };
}

function savePlanReview(projectRoot, options = {}) {
  if (options.governance && options.runId) {
    return saveGovernedPlanReview(projectRoot, options);
  }

  const root = planReviewRoot(projectRoot);
  fs.mkdirSync(root, { recursive: true });
  const reviewPath = planReviewPath(projectRoot);
  const now = new Date().toISOString();
  const contents = String(options.contents || '');
  const inputPath = options.inputPath || '';
  const reviewResult = derivePlanReviewResult(contents, {
    inputVersion: options.inputVersion,
  });

  fs.writeFileSync(reviewPath, contents);
  const meta = {
    phase: 'plan-review',
    source_file: inputPath,
    source_kind: options.inputKind || null,
    source_version: options.inputVersion || null,
    path: toRelativePosix(projectRoot, reviewPath),
    raw_artifact_path: options.rawArtifactPath || null,
    output_source: options.outputSource || null,
    review_result: reviewResult,
    reviewed_at: now,
  };
  fs.writeFileSync(planReviewMetaPath(projectRoot), `${JSON.stringify(meta, null, 2)}\n`);

  return {
    filePath: reviewPath,
    metaPath: planReviewMetaPath(projectRoot),
    reviewedAt: now,
  };
}

function nextReviewId(state) {
  const used = new Set((state.reviews || []).map((review) => review.review_id));
  let number = (state.reviews || []).length + 1;
  let reviewId;
  do {
    reviewId = `R-${String(number).padStart(3, '0')}`;
    number += 1;
  } while (used.has(reviewId));
  return reviewId;
}

function canonicalProjectionSummary(projection) {
  const toIds = (items) => (items || []).map((item) => item.finding_id || item.id).filter(Boolean);
  return {
    blocking: projection.blocking,
    approval_recommendation: projection.approval_recommendation,
    required_fixes: [...projection.required_fixes],
    plan_required_fixes: [...projection.plan_required_fixes],
    slice_required_fixes: [...projection.slice_required_fixes],
    pr_required_fixes: [...projection.pr_required_fixes],
    follow_ups: [...projection.follow_ups],
    optional_hardening: [...projection.optional_hardening],
    current_blockers: toIds(projection.current_blockers),
    later_phase_transfers: toIds(projection.later_phase_transfers),
  };
}

function renderGovernedPlanReview(state, review, findingsById) {
  const projection = review.projection;
  const lines = [
    '# Plan review',
    '',
    `Review: ${review.review_id}`,
    `Run: ${state.run_id}`,
    `Profile: ${review.effective_profile}`,
    `Policy: ${review.policy_version} (${review.policy_digest})`,
    `Approval recommendation: ${projection.approval_recommendation}`,
    `Blocking: ${projection.blocking ? 'yes' : 'no'}`,
    '',
  ];
  const sections = [
    ['Current blockers', projection.current_blockers],
    ['Later-phase transfers', projection.later_phase_transfers],
    ['Follow-ups', projection.follow_ups],
    ['Optional hardening', projection.optional_hardening],
  ];
  for (const [title, ids] of sections) {
    lines.push(`## ${title}`, '');
    if (!ids || ids.length === 0) {
      lines.push('- None', '');
      continue;
    }
    for (const findingId of ids) {
      const finding = findingsById.get(findingId);
      lines.push(`- ${findingId}: ${finding?.title || 'Finding'} (${finding?.severity || 'unknown'}, ${finding?.phase_owner || 'unknown'})`);
    }
    lines.push('');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

function saveGovernedPlanReview(projectRoot, options = {}) {
  const runId = String(options.runId || '').trim();
  const governance = options.governance;
  const profile = options.profile || {};
  const policyDigest = profile.policy_digest || computePolicyDigest(governance);
  const parsed = parseProviderReview(String(options.contents || ''), {
    governance,
    currentPhase: 'technical-plan',
    effectiveProfile: profile.effective_profile,
  });
  const redactedParsed = redactSensitiveValue(parsed, { projectRoot });
  if (stableStringify(parsed) !== stableStringify(redactedParsed)) {
    throw new GovernanceError(
      PROVIDER_OUTPUT_INVALID,
      'Provider review contains sensitive values in contractual fields; retained raw evidence is non-contractual.',
    );
  }
  const validated = parseProviderReview(JSON.stringify(redactedParsed), {
    governance,
    currentPhase: 'technical-plan',
    effectiveProfile: profile.effective_profile,
  });

  return withAiRunLock(projectRoot, runId, { command: 'ai review-plan governance commit' }, () => {
    const run = readAiRun(projectRoot, runId);
    if (run?.status === 'closed') {
      throw new GovernanceError(
        'AI_RUN_CLOSED',
        `Governed review cannot mutate closed run '${runId}'.`,
        { run_id: runId },
      );
    }
    if (!['technical-plan-draft', 'technical-plan-reviewed'].includes(run?.phase)) {
      throw new GovernanceError(
        'AI_RUN_PHASE_INVALID',
        `Governed review cannot mutate run '${runId}' from phase '${run?.phase || 'missing'}'.`,
        { run_id: runId, phase: run?.phase || null },
      );
    }
    const expectedBinding = {
      requested_profile: profile.requested_profile || governance.requested_profile,
      effective_profile: profile.effective_profile || governance.requested_profile,
      policy_version: profile.policy_version || governance.policy.version,
      policy_digest: policyDigest,
    };
    if (!run?.governance) {
      throw new GovernanceError(
        'GOVERNANCE_STATE_INVALID',
        `Governed review run '${runId}' has no profile binding.`,
      );
    }
    if ((run.governance.effective_profile === 'high-assurance'
        && expectedBinding.effective_profile === 'fast-delivery')
      || (run.governance.requested_profile === 'high-assurance'
        && expectedBinding.requested_profile === 'fast-delivery')) {
      throw new GovernanceError(
        'PROFILE_DOWNGRADE_FORBIDDEN',
        'An active high-assurance run cannot publish a fast-delivery review.',
      );
    }
    const mismatchedBinding = Object.entries(expectedBinding)
      .find(([key, value]) => run.governance[key] !== value);
    if (mismatchedBinding) {
      const [field, expected] = mismatchedBinding;
      throw new GovernanceError(
        'GOVERNANCE_STATE_INVALID',
        `Governed review ${field} does not match the active run binding.`,
        { field, expected, actual: run.governance[field] },
      );
    }

    const previousGovernanceState = readRunGovernance(projectRoot, runId);
    const current = previousGovernanceState || {
      schema_version: 1,
      run_id: runId,
      next_finding_number: 1,
      current_review_id: null,
      reviews: [],
      findings: [],
      dispositions: [],
      condition_evaluations: [],
      conditioned_candidates: [],
    };
    if (current.run_id !== runId) {
      throw new Error(formatError(`governance state run mismatch: expected ${runId}`));
    }
    const foreignReview = (Array.isArray(current.reviews) ? current.reviews : [])
      .find((review) => review?.run_id !== runId);
    if (foreignReview) {
      throw new GovernanceError(
        'GOVERNANCE_STATE_INVALID',
        `Canonical review '${foreignReview.review_id || 'unknown'}' belongs to a different run.`,
      );
    }
    const budgetReservation = options.reviewBudgetReservation;
    if (!budgetReservation) {
      throw new GovernanceError(
        'REVIEW_BUDGET_RESERVATION_REQUIRED',
        `Governed review '${runId}' requires a budget reservation before provider output can be committed.`,
      );
    }
    assertReviewBudgetReservationLocked(projectRoot, {
      runId,
      governance,
      profile,
      reservationId: budgetReservation.reservation_id,
      attempt: budgetReservation.attempt,
      requestEnvelopeDigest: budgetReservation.request_envelope_digest,
      requestEnvelope: options.reviewBudgetRequestEnvelope,
      requireCurrent: true,
    });

    const reviewId = nextReviewId(current);
    const reconciled = reconcileFindings({
      runId,
      reviewId,
      incomingFindings: validated.review.findings,
      existingFindings: current.findings,
      nextFindingNumber: current.next_finding_number,
      now: options.now || new Date(),
    });
    const openFindings = reconciled.findings.filter((finding) => finding.state === 'open');
    const projection = canonicalProjectionSummary(projectPhaseAwareReview(openFindings, {
      governance,
      currentPhase: 'technical-plan',
      effectiveProfile: profile.effective_profile,
    }));
    const canonicalIdByProviderId = new Map(validated.review.findings.map((finding, index) => [
      finding.id,
      reconciled.reconciledFindings[index]?.finding_id || null,
    ]));
    assertProviderReviewAggregates(validated.review, projection, {
      mapFindingId: (findingId) => canonicalIdByProviderId.get(findingId) || null,
    });
    const nowValue = options.now || new Date();
    const now = nowValue instanceof Date ? nowValue.toISOString() : new Date(nowValue).toISOString();
    const review = {
      schema_version: 1,
      review_id: reviewId,
      run_id: runId,
      source_file: options.inputPath || '',
      source_kind: options.inputKind || null,
      source_version: options.inputVersion || null,
      raw_artifact_path: options.rawArtifactPath || null,
      output_source: options.outputSource || null,
      provider_finding_ids: validated.review.findings.map((finding) => finding.id),
      finding_ids: reconciled.reconciledFindings.map((finding) => finding.finding_id),
      requested_profile: profile.requested_profile || governance.requested_profile,
      effective_profile: profile.effective_profile || governance.requested_profile,
      policy_version: profile.policy_version || governance.policy.version,
      policy_digest: policyDigest,
      provider_recommendation: validated.review.recommendation,
      provider_blocking: validated.review.blocking,
      projection,
      reviewed_at: now,
    };
    const nextState = {
      ...current,
      next_finding_number: reconciled.nextFindingNumber,
      current_review_id: reviewId,
      findings: reconciled.findings,
      reviews: (current.reviews || []).concat(review),
      updated_at: now,
    };
    const findingsById = new Map(nextState.findings.map((finding) => [finding.finding_id, finding]));
    const rendered = redactSensitiveValue(renderGovernedPlanReview(nextState, review, findingsById), { projectRoot });
    const root = planReviewRoot(projectRoot);
    fs.mkdirSync(root, { recursive: true });
    const reviewPath = planReviewPath(projectRoot);
    const meta = {
      schema_version: 2,
      governed: true,
      phase: 'plan-review',
      run_id: runId,
      review_id: reviewId,
      source_file: options.inputPath || '',
      source_kind: options.inputKind || null,
      source_version: options.inputVersion || null,
      path: toRelativePosix(projectRoot, reviewPath),
      raw_artifact_path: options.rawArtifactPath || null,
      output_source: options.outputSource || null,
      requested_profile: review.requested_profile,
      effective_profile: review.effective_profile,
      policy_version: review.policy_version,
      policy_digest: review.policy_digest,
      review_result: {
        schema_version: 2,
        ...projection,
        next_command: recommendedNextCommand(projection.approval_recommendation, options.inputVersion),
        risks: projection.later_phase_transfers,
        findings: openFindings,
        source: 'governed-canonical',
      },
      reviewed_at: now,
    };

    const redactedMeta = redactSensitiveValue(meta, { projectRoot });
    const marker = {
      schema_version: REVIEW_COMMIT_SCHEMA_VERSION,
      kind: 'governed-plan-review-commit',
      run_id: runId,
      prepared_at: now,
      reservation: {
        reservation_id: budgetReservation.reservation_id,
        attempt: budgetReservation.attempt,
        request_envelope_digest: budgetReservation.request_envelope_digest,
      },
      review_id: reviewId,
      target_phase: 'technical-plan-reviewed',
      artifact_path: toRelativePosix(projectRoot, reviewPath),
      policy_digest: policyDigest,
      profile: JSON.parse(stableStringify(profile)),
      previous_governance_state: previousGovernanceState,
      previous_governance_sha256: governanceStateDigest(previousGovernanceState),
      next_governance_state: nextState,
      next_governance_sha256: governanceStateDigest(nextState),
      review_contents: rendered,
      review_contents_sha256: sha256Digest(rendered),
      meta: redactedMeta,
      meta_sha256: sha256Digest(stableStringify(redactedMeta)),
    };
    writeReviewCommitMarker(projectRoot, runId, marker);
    invokeReviewCommitFault({ faultInjector: options.commitFaultInjector }, 'after-wal');
    const committed = applyGovernedReviewCommitLocked(projectRoot, marker, {
      faultInjector: options.commitFaultInjector,
    });
    return {
      filePath: reviewPath,
      metaPath: planReviewMetaPath(projectRoot),
      governancePath: toRelativePosix(projectRoot, path.join(quiverInternalPaths(projectRoot).runsDir, runId, 'review-governance.json')),
      reviewedAt: now,
      reviewId,
      projection,
      budget: committed.budget,
    };
  });
}

function assertPlanReviewed(projectRoot) {
  const review = readPlanReview(projectRoot);
  if (review.status !== 'reviewed') {
    const nextCommand = review.status === 'unapproved'
      ? 'npx create-quiver ai approve --phase technical-plan --version <n>'
      : 'npx create-quiver ai review-plan --dry-run';
    const followUp = review.status === 'unapproved'
      ? ''
      : ' Preview the review first, then run `npx create-quiver ai review-plan` to persist it.';
    throw new Error(formatError(`ai plan phase 'spec' requires a reviewed and approved technical-plan input; current review status: ${review.status}. Run \`${nextCommand}\`.${followUp}`));
  }
  if (reviewBlocksApproval(review)) {
    const result = review.meta.review_result;
    throw new Error(formatError(`ai plan phase 'spec' requires an approvable production review; current approval recommendation is ${result.approval_recommendation}. Run \`${result.next_command || recommendedNextCommand('revise')}\`.`));
  }
  return review;
}

function resolveReviewedTechnicalPlanInput(projectRoot, explicitInput) {
  const resolved = resolveApprovedPlannerInput(projectRoot, 'spec', explicitInput);
  const review = assertPlanReviewed(projectRoot);
  return {
    ...resolved,
    review,
  };
}

function buildCanonicalFindingReviewContext(findings = []) {
  return findings.map((finding) => ({
    finding_id: finding.finding_id,
    state: finding.state,
    origin_fingerprint: finding.origin_fingerprint,
    title: finding.title,
    summary: finding.summary,
    severity: finding.severity,
    category: finding.category,
    phase_owner: finding.phase_owner,
    phase_blocking: finding.phase_blocking,
    blocking_justification: finding.blocking_justification || null,
    acceptance_refs: finding.acceptance_refs,
    evidence: finding.evidence,
    recommended_disposition: finding.recommended_disposition,
    confidence: finding.confidence,
    supersedes: finding.supersedes || null,
  }));
}

function buildPlanReviewPrompt({
  pack,
  inputText,
  inputPath,
  governed = false,
  governance = null,
  governanceProfile = null,
  canonicalFindings = [],
  reviewIntent = null,
}) {
  const sections = [
    pack.prompt,
    'Task: review the technical plan as if it will be implemented and tested in production.',
    'Do not question the approved scope.',
    'Do not implement code, create specs, or modify files.',
    'Focus on avoiding partial fixes.',
    'Report:',
    '- fragile assumptions',
    '- uncovered cases',
    '- ambiguous criteria',
    '- validation gaps',
    '- operational risks',
    '- recommended fixes to the plan',
    'If ambiguity is not blocking, state the safest assumption and continue.',
  ];

  if (governed) {
    const phaseRule = governance?.policy?.review_policy?.['technical-plan'] || {};
    const blockingCategories = Array.isArray(phaseRule.blocking_categories)
      ? phaseRule.blocking_categories
      : [];
    const nonBlockingCategories = Array.isArray(phaseRule.non_blocking_categories)
      ? phaseRule.non_blocking_categories
      : [];
    sections.push(
      'Return exactly one JSON object (directly or in one fenced json block) with schema_version 2, kind "quiver-plan-review", and a strict review object.',
      'Each review.findings item must include: id, title, summary, severity, category, phase_owner, phase_blocking, evidence, acceptance_refs, recommended_disposition, and confidence. Add blocking_justification whenever phase_blocking is true. canonical_id and supersedes are optional canonical references supplied by Quiver context; provider ids are never canonical.',
      'The review object must include recommendation, blocking, findings, plan_required_fixes, slice_required_fixes, pr_required_fixes, follow_ups, and optional_hardening. Aggregate arrays reference finding ids from this payload and must exactly match the phase-aware finding projection.',
      'Valid severities: critical, high, medium, low, info. Valid categories: security, data-integrity, rollout, architecture, business-rule, implementation-detail, testing, evidence, operations, tooling, follow-up, optional-hardening. Valid phases: requirement, acceptance, technical-plan, spec, slice, pr-review, release, follow-up.',
      'Valid recommended dispositions: revise-requirement, revise-acceptance, revise-plan, transfer-to-spec, transfer-to-slice, transfer-to-pr, create-follow-up, accept-risk, optional.',
      `Effective governance: profile ${governanceProfile?.effective_profile || 'unknown'}, policy ${governanceProfile?.policy_version || governance?.policy?.version || 'unknown'}, digest ${governanceProfile?.policy_digest || 'unknown'}.`,
      `For technical-plan, blocking categories are: ${blockingCategories.join(', ') || '(none)'}. Non-blocking categories are: ${nonBlockingCategories.join(', ') || '(none)'}.`,
      'A technical-plan blocker must have phase_owner "technical-plan", phase_blocking true, and a category listed by the effective blocking policy above. Provider recommendation and blocking aggregates are advisory and must agree with those canonical fields.',
      'Re-emit every unresolved canonical finding that still applies. Use canonical_id for an existing finding, including a closed finding that reappears. Omission never closes a finding and an aggregate that omits retained canonical state is invalid. Use supersedes only for a material identity change and keep the prior finding explicit.',
      'Canonical finding context for this run:',
      JSON.stringify(redactSensitiveValue(buildCanonicalFindingReviewContext(canonicalFindings)), null, 2),
    );
    if (reviewIntent) {
      const scopeInstruction = reviewIntent.event_class === 'targeted'
        ? 'Limit new analysis to the declared finding IDs and sections. Re-emit unresolved canonical findings as required by the output contract, but do not expand the requested review scope.'
        : 'Review the complete replacement candidate. This is a full review, not a targeted amendment.';
      sections.push(
        'Immutable review scope intent:',
        JSON.stringify(redactSensitiveValue(reviewIntent), null, 2),
        scopeInstruction,
      );
    }
  } else {
    sections.push(
      'Required output contract: include a fenced json block with `{ "review": { "blocking": boolean, "approvalRecommendation": "approve|approve-with-risk|revise", "requiredFixes": [], "optionalHardening": [], "risks": [], "nextCommand": "" } }`.',
      'Use `approve` only when no required fixes remain. Use `approve-with-risk` when only optional hardening or accepted risks remain. Use `revise` when required fixes or blocking ambiguity remain.',
    );
  }

  if (inputPath) {
    sections.push(`Input file: ${inputPath}`);
  }

  if (inputText) {
    sections.push('Technical plan:', inputText.trimEnd());
  }

  return {
    promptSource: PLAN_REVIEW_PROMPT_SOURCE,
    prompt: sections.join('\n\n'),
  };
}

function summarizePlanReview(projectRoot) {
  const review = readPlanReview(projectRoot);
  const result = review.meta?.review_result || null;
  const lines = [
    'Phase: plan-review',
    `Status: ${review.status}`,
  ];
  if (review.review?.path) {
    lines.push(`Review: ${review.review.path}`);
  }
  if (review.meta?.source_file) {
    lines.push(`Source file: ${review.meta.source_file}`);
  }
  if (result) {
    const requiredFixes = normalizeList(result.required_fixes);
    const optionalHardening = normalizeList(result.optional_hardening);
    lines.push(`Approval recommendation: ${result.approval_recommendation}`);
    lines.push(`Blocking: ${result.blocking ? 'yes' : 'no'}`);
    lines.push(`Required fixes: ${requiredFixes.length}`);
    lines.push(`Optional hardening: ${optionalHardening.length}`);
    lines.push(`Next command: ${result.next_command}`);
  }
  return `${lines.join('\n')}\n`;
}

module.exports = {
  PLAN_REVIEW_PROMPT_SOURCE,
  PLAN_REVIEW_RECOMMENDATIONS,
  assertPlanReviewed,
  buildPlanReviewPrompt,
  buildTechnicalPlanApprovalCandidates,
  derivePlanReviewResult,
  planReviewMetaPath,
  planReviewPath,
  readPlanReview,
  recoverGovernedPlanReviewCommit,
  reviewBlocksApproval,
  resolveTechnicalPlanReviewInput,
  resolveReviewedTechnicalPlanInput,
  savePlanReview,
  saveGovernedPlanReview,
  summarizePlanReview,
};
