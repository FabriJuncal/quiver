const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { readProjectFileBytes, sha256Bytes } = require('../approvals');
const { redactSensitiveLocalValues, redactSensitiveValue } = require('./artifacts');
const {
  APPROVAL_BINDING_MISMATCH,
  DISPOSITION_UNRESOLVED,
  GovernanceError,
  REPRESENTATION_MISMATCH,
  assertApprovalBindingParity,
  authorizeGovernanceAction,
  canonicalSha256,
  computeApprovalDispositionDigest,
  computeApprovalProfileDigest,
  normalizeTransferTarget,
  readGovernanceConfig,
  resolveEffectiveProfile,
  stableStringify,
} = require('./review-governance');
const {
  listAiRuns,
  readAiRun,
  readRunApprovalDecisions,
  readRunGovernance,
  runApprovalArtifactPath,
  runApprovalsPath,
  runGovernancePath,
} = require('./run-state');

const GOVERNANCE_MANIFEST_FILENAME = 'GOVERNANCE_MANIFEST.json';
const GOVERNANCE_MANIFEST_KIND = 'quiver-planning-governance';
const GOVERNANCE_MANIFEST_SCHEMA_VERSION = 1;
const GOVERNANCE_MARKER_BEGIN = '<!-- quiver-governance:begin -->';
const GOVERNANCE_MARKER_END = '<!-- quiver-governance:end -->';
const GOVERNANCE_TRACEABILITY_MARKER_BEGIN_PREFIX = '<!-- quiver-governance-traceability:begin ';
const GOVERNANCE_TRACEABILITY_MARKER_END = '<!-- quiver-governance-traceability:end -->';
const SHA256_DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/;
const TRANSFER_ACTIONS = new Set(['transfer-to-spec', 'transfer-to-slice', 'transfer-to-pr']);

function governanceError(code, message, details = {}) {
  return new GovernanceError(code, message, details);
}

function toRelativePosix(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeApprovedCriterionSemantic(value) {
  return String(value ?? '').trim();
}

function governanceTraceabilityMarkerBegin(manifestSha256) {
  if (!SHA256_DIGEST_PATTERN.test(String(manifestSha256 || ''))) {
    throw governanceError(REPRESENTATION_MISMATCH, 'Governance traceability marker requires a canonical manifest digest.', {
      mismatches: ['manifest_sha256'],
    });
  }
  return `${GOVERNANCE_TRACEABILITY_MARKER_BEGIN_PREFIX}${manifestSha256} -->`;
}

function resolveCanonicalProjectRoot(repoRoot) {
  const resolvedRoot = fs.realpathSync(path.resolve(repoRoot));
  const dotGit = path.join(resolvedRoot, '.git');
  if (!fs.existsSync(dotGit) || fs.statSync(dotGit).isDirectory()) {
    return resolvedRoot;
  }

  let commonDir;
  try {
    commonDir = execFileSync(
      'git',
      ['rev-parse', '--path-format=absolute', '--git-common-dir'],
      { cwd: resolvedRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
  } catch (error) {
    throw governanceError(
      APPROVAL_BINDING_MISMATCH,
      'Canonical governance parity cannot resolve the primary checkout from this linked worktree.',
      { repo_root: resolvedRoot, cause: error.message },
    );
  }

  const absoluteCommonDir = path.isAbsolute(commonDir)
    ? commonDir
    : path.resolve(resolvedRoot, commonDir);
  const realCommonDir = fs.realpathSync(absoluteCommonDir);
  if (path.basename(realCommonDir) !== '.git') {
    throw governanceError(
      APPROVAL_BINDING_MISMATCH,
      'Canonical governance parity requires a non-bare primary checkout.',
      { git_common_dir: realCommonDir },
    );
  }
  const primaryRoot = path.dirname(realCommonDir);
  if (!fs.existsSync(primaryRoot) || !fs.statSync(primaryRoot).isDirectory()) {
    throw governanceError(
      APPROVAL_BINDING_MISMATCH,
      'Canonical governance parity cannot access the primary checkout.',
      { primary_root: primaryRoot },
    );
  }
  return fs.realpathSync(primaryRoot);
}

function resolveInspectionRun(canonicalRoot, runId = '') {
  if (runId) {
    const run = readAiRun(canonicalRoot, runId);
    if (!run) {
      throw governanceError('AI_RUN_REQUIRED', `AI run '${runId}' does not exist in the primary checkout.`, {
        run_id: runId,
      });
    }
    return run;
  }

  const active = listAiRuns(canonicalRoot).filter((run) => run.status !== 'closed');
  if (active.length !== 1) {
    throw governanceError(
      active.length === 0 ? 'AI_RUN_REQUIRED' : 'AI_RUN_AMBIGUOUS',
      active.length === 0
        ? 'Spec creation requires --run <id> because there is no active canonical run.'
        : `Spec creation requires --run <id> because ${active.length} canonical runs are active.`,
      { active_run_ids: active.map((run) => run.run_id) },
    );
  }
  return active[0];
}

function readBindingFile(canonicalRoot, value, label, mismatchField) {
  try {
    return readProjectFileBytes(canonicalRoot, value, label);
  } catch (error) {
    if (error instanceof GovernanceError) throw error;
    throw governanceError(
      APPROVAL_BINDING_MISMATCH,
      `${label} is missing, invalid, or resolves outside the primary checkout.`,
      { mismatches: [mismatchField], cause: error.message },
    );
  }
}

function assertSafeExactValue(value, canonicalRoot, mismatchField) {
  const redacted = redactSensitiveValue(value, { projectRoot: canonicalRoot });
  if (stableStringify(value) !== stableStringify(redacted)) {
    throw governanceError(
      DISPOSITION_UNRESOLVED,
      'Governance data cannot be projected safely without changing its contractual value.',
      { mismatches: [mismatchField] },
    );
  }
}

function assertSafeExactText(text, canonicalRoot, mismatchField, code = DISPOSITION_UNRESOLVED) {
  if (redactSensitiveLocalValues(text, { projectRoot: canonicalRoot }) !== text) {
    throw governanceError(
      code,
      'Governance text cannot be projected safely without changing its contractual value.',
      { mismatches: [mismatchField] },
    );
  }
}

function canonicalFindingCountAt(governanceState, recordedAt) {
  const cutoff = Date.parse(String(recordedAt || ''));
  return (governanceState.findings || []).filter((finding) => {
    const created = (finding.lifecycle || []).find((event) => (
      event.event === 'created' || event.event === 'created-as-supersession'
    ));
    if (!created) return true;
    const createdAt = Date.parse(String(created.at || ''));
    return Number.isNaN(cutoff) || Number.isNaN(createdAt) || createdAt <= cutoff;
  }).length;
}

function resolveApprovalRuntime(canonicalRoot, run) {
  const governance = readGovernanceConfig(canonicalRoot, { allowMissing: true });
  if (!governance) {
    throw governanceError('GOVERNANCE_CONFIG_MISSING', 'Canonical spec approval verification requires governance configuration.', {
      run_id: run.run_id,
    });
  }
  const requirementCategories = [...new Set(
    (governance.requirement_categories || [])
      .map((value) => String(value || '').trim())
      .filter(Boolean),
  )].sort();
  const profile = resolveEffectiveProfile({
    governance,
    cliProfile: run.governance?.requested_profile || undefined,
    requirementCategories,
    activeRunProfile: run.governance || null,
  });
  const binding = {
    requested_profile: profile.requested_profile,
    effective_profile: profile.effective_profile,
    policy_version: profile.policy_version,
    policy_digest: profile.policy_digest,
    requirement_categories: requirementCategories,
  };
  const mismatches = Object.keys(binding).filter((field) => (
    stableStringify(run.governance?.[field]) !== stableStringify(binding[field])
  ));
  if (mismatches.length > 0) {
    throw governanceError(APPROVAL_BINDING_MISMATCH, 'Current governance policy differs from the run-scoped approval binding.', {
      run_id: run.run_id,
      mismatches: mismatches.map((field) => `governance.${field}`),
    });
  }
  return { governance, profile, binding };
}

function approvalActorFromEvidence(evidence = {}) {
  const providerSubject = evidence.provider_subject || null;
  return {
    actor_id: evidence.provider_actor_id || evidence.actor_id,
    provider: providerSubject ? 'github-cli' : 'local',
    provider_subject: providerSubject,
    roles: [],
    verified: providerSubject ? evidence.verified === true : false,
  };
}

function assertApprovalProjection(canonicalRoot, run, decision) {
  const expectedPath = toRelativePosix(canonicalRoot, runApprovalsPath(canonicalRoot, run.run_id));
  if (run.approvals_path !== expectedPath) {
    throw governanceError(APPROVAL_BINDING_MISMATCH, 'Run approval projection path is stale.', {
      mismatches: ['run.approvals_path'],
    });
  }
  const source = readBindingFile(canonicalRoot, expectedPath, 'Run approval projection', 'approvals.json');
  let projection;
  try {
    projection = JSON.parse(source.bytes.toString('utf8'));
  } catch (error) {
    throw governanceError(APPROVAL_BINDING_MISMATCH, 'Run approval projection is not valid JSON.', {
      mismatches: ['approvals.json'],
      cause: error.message,
    });
  }
  const matches = Array.isArray(projection?.approvals)
    ? projection.approvals.filter((item) => item?.decision_id === decision.decision_id)
    : [];
  if (projection?.schema_version !== 1 || projection?.run_id !== run.run_id || matches.length !== 1) {
    throw governanceError(REPRESENTATION_MISMATCH, 'Run approval projection must represent the final decision exactly once.', {
      mismatches: ['approvals.json', 'decision_id'],
    });
  }
  const expected = {
    schema_version: 1,
    run_id: decision.run_id,
    decision_id: decision.decision_id,
    phase: decision.phase,
    decision: decision.decision,
    artifact: decision.artifact_path,
    artifact_sha256: decision.artifact_sha256,
    input_sha256: decision.input_sha256,
    criterion_count: decision.criterion_count,
    version: decision.version,
    at: decision.recorded_at,
  };
  const mismatches = Object.keys(expected)
    .filter((field) => stableStringify(matches[0]?.[field]) !== stableStringify(expected[field]));
  if (mismatches.length > 0) {
    throw governanceError(
      mismatches.includes('criterion_count') ? REPRESENTATION_MISMATCH : APPROVAL_BINDING_MISMATCH,
      'Run approval projection differs from the final canonical decision.',
      { mismatches },
    );
  }
}

function assertApprovalHistory(run, decision) {
  const matches = (run.history || []).filter((event) => (
    event?.phase === 'technical-plan-approved'
    && event?.artifact === decision.artifact_path
    && event?.at === decision.recorded_at
  ));
  if (matches.length !== 1) {
    throw governanceError(APPROVAL_BINDING_MISMATCH, 'Run history does not contain exactly one final technical-plan transition.', {
      mismatches: ['run.history'],
    });
  }
}

function resolveVerifiedSpecGovernance(repoRoot, options = {}) {
  const canonicalRoot = resolveCanonicalProjectRoot(repoRoot);
  const run = resolveInspectionRun(canonicalRoot, options.runId);
  const governanceState = readRunGovernance(canonicalRoot, run.run_id);
  if (!governanceState) {
    throw governanceError(APPROVAL_BINDING_MISMATCH, 'Canonical run governance state is missing.', {
      mismatches: ['review-governance.json'],
    });
  }

  const allDecisions = readRunApprovalDecisions(canonicalRoot, run.run_id);
  const decisions = allDecisions.filter((item) => item.phase === 'technical-plan');
  if (decisions.length !== 1) {
    throw governanceError(
      decisions.length === 0 ? 'APPROVAL_NOT_FOUND' : REPRESENTATION_MISMATCH,
      decisions.length === 0
        ? `No final technical-plan decision exists for run '${run.run_id}'.`
        : `Run '${run.run_id}' contains ${decisions.length} technical-plan decisions.`,
      { run_id: run.run_id, decision_count: decisions.length },
    );
  }
  const decision = decisions[0];
  if (decision.publication_state !== 'final'
      || !['approved', 'approved-with-conditions'].includes(decision.decision)) {
    throw governanceError('APPROVAL_NOT_FOUND', 'Spec creation requires a final approved technical-plan decision.', {
      run_id: run.run_id,
      decision: decision.decision,
      publication_state: decision.publication_state,
    });
  }
  const runtime = resolveApprovalRuntime(canonicalRoot, run);

  const expectedArtifactPath = toRelativePosix(
    canonicalRoot,
    runApprovalArtifactPath(canonicalRoot, run.run_id, 'technical-plan', decision.version),
  );
  const artifact = readBindingFile(
    canonicalRoot,
    expectedArtifactPath,
    'Final technical-plan artifact',
    'artifact_path',
  );
  if (decision.artifact_path !== artifact.path || decision.artifact_sha256 !== artifact.sha256) {
    throw governanceError(APPROVAL_BINDING_MISMATCH, 'Final technical-plan artifact binding is stale or has been tampered with.', {
      mismatches: ['artifact_path', 'artifact_sha256'],
    });
  }
  const artifactText = artifact.bytes.toString('utf8');
  if (!Buffer.from(artifactText, 'utf8').equals(artifact.bytes)) {
    throw governanceError(APPROVAL_BINDING_MISMATCH, 'Final technical-plan artifact is not exact UTF-8.', {
      mismatches: ['artifact_sensitive_content'],
    });
  }
  assertSafeExactText(artifactText, canonicalRoot, 'artifact_sensitive_content', APPROVAL_BINDING_MISMATCH);

  const input = readBindingFile(canonicalRoot, decision.input_path, 'Final technical-plan input', 'input_path');
  if (decision.input_sha256 !== input.sha256) {
    throw governanceError(APPROVAL_BINDING_MISMATCH, 'Final technical-plan input digest is stale or has been tampered with.', {
      mismatches: ['input_sha256'],
    });
  }
  const inputText = input.bytes.toString('utf8');
  if (!Buffer.from(inputText, 'utf8').equals(input.bytes)) {
    throw governanceError(APPROVAL_BINDING_MISMATCH, 'Final technical-plan input is not exact UTF-8.', {
      mismatches: ['input_sensitive_content'],
    });
  }
  assertSafeExactText(inputText, canonicalRoot, 'input_sensitive_content', APPROVAL_BINDING_MISMATCH);

  const acceptanceDecisions = allDecisions.filter((item) => item.phase === 'acceptance');
  if (acceptanceDecisions.length !== 1) {
    throw governanceError(REPRESENTATION_MISMATCH, 'Technical-plan approval requires exactly one canonical acceptance decision.', {
      mismatches: ['acceptance_decision'],
      count: acceptanceDecisions.length,
    });
  }
  const acceptanceDecision = acceptanceDecisions[0];
  const expectedAcceptancePath = toRelativePosix(
    canonicalRoot,
    runApprovalArtifactPath(canonicalRoot, run.run_id, 'acceptance', acceptanceDecision.version),
  );
  if (acceptanceDecision.artifact_path !== expectedAcceptancePath
      || decision.input_path !== acceptanceDecision.artifact_path
      || decision.input_sha256 !== acceptanceDecision.artifact_sha256) {
    throw governanceError(APPROVAL_BINDING_MISMATCH, 'Technical-plan approval input does not match the canonical acceptance decision.', {
      mismatches: ['acceptance_decision', 'input_path', 'input_sha256'],
    });
  }

  const reviews = (governanceState.reviews || []).filter((item) => item.review_id === decision.review_id);
  if (reviews.length !== 1 || governanceState.current_review_id !== decision.review_id) {
    throw governanceError(REPRESENTATION_MISMATCH, 'Final technical-plan review must resolve exactly once as the current review.', {
      mismatches: ['review_id'],
    });
  }
  if (canonicalSha256(reviews[0]) !== decision.review_sha256) {
    throw governanceError(APPROVAL_BINDING_MISMATCH, 'Final technical-plan review digest is stale or has been tampered with.', {
      mismatches: ['review_sha256'],
    });
  }
  if (decision.finding_count !== canonicalFindingCountAt(governanceState, decision.recorded_at)) {
    throw governanceError(REPRESENTATION_MISMATCH, 'Final decision finding count differs from canonical findings.', {
      mismatches: ['finding_count'],
    });
  }

  const dispositionIds = [...(decision.disposition_ids || [])].sort();
  const dispositions = dispositionIds.map((dispositionId) => {
    const matches = (governanceState.dispositions || []).filter((item) => (
      item.disposition_id === dispositionId && item.state === 'current'
    ));
    if (matches.length !== 1) {
      throw governanceError(REPRESENTATION_MISMATCH, 'Every bound disposition must resolve exactly once as current.', {
        disposition_id: dispositionId,
        count: matches.length,
      });
    }
    return matches[0];
  });
  if (computeApprovalDispositionDigest(dispositions) !== decision.disposition_sha256) {
    throw governanceError(APPROVAL_BINDING_MISMATCH, 'Final disposition digest is stale or has been tampered with.', {
      mismatches: ['disposition_sha256'],
    });
  }

  let conditionedCandidate = null;
  let reason = null;
  if (decision.decision === 'approved') {
    if (decision.candidate_id !== null || decision.evaluation_id !== null || dispositionIds.length !== 0) {
      throw governanceError(REPRESENTATION_MISMATCH, 'Unconditional approval cannot carry conditioned bindings.', {
        mismatches: ['candidate_id', 'evaluation_id', 'disposition_ids'],
      });
    }
  } else {
    const candidates = (governanceState.conditioned_candidates || [])
      .filter((item) => item.candidate_id === decision.candidate_id);
    const evaluations = (governanceState.condition_evaluations || [])
      .filter((item) => item.evaluation_id === decision.evaluation_id);
    if (candidates.length !== 1 || evaluations.length !== 1) {
      throw governanceError(REPRESENTATION_MISMATCH, 'Conditioned approval candidate and eligibility evaluation must resolve exactly once.', {
        mismatches: ['candidate_id', 'evaluation_id'],
      });
    }
    const candidate = candidates[0];
    const evaluation = evaluations[0];
    if (candidate.decision !== 'approved-with-conditions'
        || evaluation.result?.eligible !== true
        || evaluation.result?.status !== 'ELIGIBLE'
        || evaluation.result?.code !== 'ELIGIBLE_WITH_CONDITIONS'
        || candidate.evaluation_id !== decision.evaluation_id
        || candidate.run_id !== decision.run_id
        || candidate.review_id !== decision.review_id
        || candidate.reason_path !== decision.reason_path
        || candidate.reason_sha256 !== decision.reason_sha256
        || evaluation.run_id !== decision.run_id
        || evaluation.review_id !== decision.review_id
        || evaluation.reason_path !== decision.reason_path
        || evaluation.reason_sha256 !== decision.reason_sha256
        || stableStringify([...candidate.disposition_ids].sort()) !== stableStringify(dispositionIds)
        || stableStringify([...evaluation.disposition_ids].sort()) !== stableStringify(dispositionIds)) {
      throw governanceError(APPROVAL_BINDING_MISMATCH, 'Conditioned approval is no longer bound to an eligible canonical candidate.', {
        mismatches: ['candidate_id', 'evaluation_id', 'disposition_ids'],
      });
    }
    conditionedCandidate = candidate;
    reason = readBindingFile(canonicalRoot, decision.reason_path, 'Conditioned approval reason', 'reason_path');
    if (reason.sha256 !== decision.reason_sha256) {
      throw governanceError(APPROVAL_BINDING_MISMATCH, 'Conditioned approval reason digest is stale or has been tampered with.', {
        mismatches: ['reason_sha256'],
      });
    }
  }

  const authorization = authorizeGovernanceAction({
    governance: runtime.governance,
    action: conditionedCandidate ? 'approve-with-conditions' : 'approve',
    actor: approvalActorFromEvidence(decision.authorization),
    profile: runtime.profile.effective_profile,
    context: {
      run_creator: run.governance_actors?.run_creator || null,
      reviewer: run.governance_actors?.reviewer || null,
      executor: run.governance_actors?.executor || null,
    },
  });
  if (!authorization.authorized) {
    throw governanceError(
      authorization.code || 'AUTHORIZATION_DENIED',
      authorization.message || 'Canonical approval authorization is no longer valid.',
      authorization.evidence || {},
    );
  }
  assertApprovalBindingParity(decision, {
    run_id: run.run_id,
    review_id: reviews[0].review_id,
    phase: 'technical-plan',
    decision: conditionedCandidate ? conditionedCandidate.decision : 'approved',
    candidate_id: conditionedCandidate?.candidate_id || null,
    evaluation_id: conditionedCandidate?.evaluation_id || null,
    version: decision.version,
    artifact_path: artifact.path,
    artifact_sha256: artifact.sha256,
    input_path: input.path,
    input_sha256: input.sha256,
    review_sha256: canonicalSha256(reviews[0]),
    requested_profile: runtime.profile.requested_profile,
    effective_profile: runtime.profile.effective_profile,
    profile_sha256: computeApprovalProfileDigest(runtime.profile, run.governance || runtime.binding),
    policy_version: runtime.profile.policy_version,
    policy_digest: runtime.profile.policy_digest,
    finding_count: canonicalFindingCountAt(governanceState, decision.recorded_at),
    // buildPlanningGovernanceManifest verifies the parsed representation count.
    criterion_count: decision.criterion_count,
    disposition_ids: dispositionIds,
    disposition_sha256: computeApprovalDispositionDigest(dispositions),
    reason_path: reason?.path || null,
    reason_sha256: reason?.sha256 || null,
    actor_id: authorization.evidence.actor_id,
    authorization: authorization.evidence,
    reviewer_recommendation: reviews[0].provider_recommendation,
    reviewer_approved: conditionedCandidate ? false : null,
  });

  assertApprovalProjection(canonicalRoot, run, decision);
  assertApprovalHistory(run, decision);
  return {
    canonicalRoot,
    run,
    governanceState,
    decision,
    dispositions,
    artifact,
    inputPath: artifact.path,
    inputText: artifactText,
  };
}

function approvedCriteria(planManifest) {
  return planManifest.slices.slice(1).flatMap((slice) => (
    (slice.acceptance || []).map((content) => ({
      slice_id: slice.slice_id,
      content,
    }))
  ));
}

function referenceAppearsInCriterion(content, acceptanceRef) {
  const escaped = String(acceptanceRef).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^A-Za-z0-9._:-])${escaped}(?=$|[^A-Za-z0-9._:-])`, 'u').test(String(content));
}

function validateCriterionBindingAgainstPlan(binding, finding, planManifest, canonicalRoot) {
  if (!binding || typeof binding !== 'object') {
    throw governanceError(DISPOSITION_UNRESOLVED, 'Transferred disposition is missing its criterion binding.', {
      finding_id: finding.finding_id,
    });
  }
  if (!finding.acceptance_refs.includes(binding.acceptance_ref)) {
    throw governanceError(DISPOSITION_UNRESOLVED, 'Criterion binding references an acceptance criterion unknown to the finding.', {
      finding_id: finding.finding_id,
      acceptance_ref: binding.acceptance_ref,
    });
  }
  if (binding.criterion_sha256 !== sha256Bytes(Buffer.from(binding.content, 'utf8'))) {
    throw governanceError(APPROVAL_BINDING_MISMATCH, 'Criterion binding digest is stale or has been tampered with.', {
      finding_id: finding.finding_id,
      mismatches: ['criterion_binding.criterion_sha256'],
    });
  }
  assertSafeExactText(binding.content, canonicalRoot, 'criterion_binding.content');
  assertSafeExactValue(binding, canonicalRoot, 'criterion_binding');
  const semanticContent = normalizeApprovedCriterionSemantic(binding.content);
  const matches = approvedCriteria(planManifest).filter((criterion) => (
    normalizeApprovedCriterionSemantic(criterion.content) === semanticContent
    && referenceAppearsInCriterion(
      normalizeApprovedCriterionSemantic(criterion.content),
      binding.acceptance_ref,
    )
  ));
  if (matches.length !== 1) {
    throw governanceError(
      matches.length === 0 ? DISPOSITION_UNRESOLVED : REPRESENTATION_MISMATCH,
      matches.length === 0
        ? 'Criterion binding does not resolve to an approved technical-plan criterion.'
        : 'Criterion binding resolves to more than one approved technical-plan criterion.',
      { finding_id: finding.finding_id, acceptance_ref: binding.acceptance_ref, count: matches.length },
    );
  }
  return clone(binding);
}

function normalizeDispositionTarget(disposition, sliceIds) {
  if (!TRANSFER_ACTIONS.has(disposition.action)) return null;
  if (typeof normalizeTransferTarget !== 'function') {
    throw governanceError('GOVERNANCE_STATE_INVALID', 'Transfer target normalizer is unavailable.');
  }
  return normalizeTransferTarget(disposition.target, {
    action: disposition.action,
    sliceIds,
  });
}

function projectDecision(decision) {
  return {
    decision_id: decision.decision_id,
    decision_sha256: decision.decision_sha256,
    run_id: decision.run_id,
    review_id: decision.review_id,
    phase: decision.phase,
    decision: decision.decision,
    publication_state: decision.publication_state,
    candidate_id: decision.candidate_id,
    evaluation_id: decision.evaluation_id,
    version: decision.version,
    artifact_path: decision.artifact_path,
    artifact_sha256: decision.artifact_sha256,
    input_path: decision.input_path,
    input_sha256: decision.input_sha256,
    review_sha256: decision.review_sha256,
    finding_count: decision.finding_count,
    criterion_count: decision.criterion_count,
    disposition_ids: [...decision.disposition_ids],
    disposition_sha256: decision.disposition_sha256,
    reason_path: decision.reason_path,
    reason_sha256: decision.reason_sha256,
    reviewer_recommendation: decision.reviewer_recommendation,
    reviewer_approved: decision.reviewer_approved,
    recorded_at: decision.recorded_at,
  };
}

function projectDisposition(disposition, target, criterionBinding) {
  const projected = {
    schema_version: disposition.schema_version,
    disposition_id: disposition.disposition_id,
    run_id: disposition.run_id,
    review_id: disposition.review_id,
    finding_id: disposition.finding_id,
    action: disposition.action,
    evidence_obligations: [...disposition.evidence_obligations],
    state: disposition.state,
    supersedes: disposition.supersedes,
    actor_id: disposition.actor_id,
    policy_version: disposition.policy_version,
    policy_digest: disposition.policy_digest,
    recorded_at: disposition.recorded_at,
  };
  if (target) projected.target = target;
  if (disposition.target_issue) projected.target_issue = disposition.target_issue;
  if (criterionBinding) projected.criterion_binding = criterionBinding;
  return projected;
}

function buildPlanningGovernanceManifest(options = {}) {
  const {
    canonicalRoot,
    governanceState,
    decision,
    planManifest,
  } = options;
  if (!canonicalRoot || !governanceState || !decision || !planManifest) {
    throw governanceError('GOVERNANCE_STATE_INVALID', 'Governance manifest preflight requires canonical state, final decision, and generated plan manifest.');
  }
  const criteria = approvedCriteria(planManifest);
  if (criteria.length !== decision.criterion_count) {
    throw governanceError(REPRESENTATION_MISMATCH, 'Approved criterion count differs from the technical-plan representation.', {
      mismatches: ['criterion_count'],
      expected: decision.criterion_count,
      actual: criteria.length,
    });
  }
  const sliceIds = planManifest.slices.map((slice) => slice.slice_id);
  const dispositionIds = [...decision.disposition_ids].sort();
  const projectedFindings = [];
  const projectedDispositions = [];
  const seenFindingIds = new Set();

  for (const dispositionId of dispositionIds) {
    const dispositionMatches = (governanceState.dispositions || []).filter((item) => (
      item.disposition_id === dispositionId && item.state === 'current'
    ));
    if (dispositionMatches.length !== 1) {
      throw governanceError(REPRESENTATION_MISMATCH, 'Bound disposition must resolve exactly once.', {
        disposition_id: dispositionId,
        count: dispositionMatches.length,
      });
    }
    const disposition = dispositionMatches[0];
    const findingMatches = (governanceState.findings || []).filter((item) => item.finding_id === disposition.finding_id);
    if (findingMatches.length !== 1 || seenFindingIds.has(disposition.finding_id)) {
      throw governanceError(REPRESENTATION_MISMATCH, 'Every bound disposition must join to exactly one unique canonical finding.', {
        finding_id: disposition.finding_id,
        count: findingMatches.length,
      });
    }
    const finding = findingMatches[0];
    const target = normalizeDispositionTarget(disposition, sliceIds);
    const criterionBinding = TRANSFER_ACTIONS.has(disposition.action)
      ? validateCriterionBindingAgainstPlan(
        disposition.criterion_binding,
        finding,
        planManifest,
        canonicalRoot,
      )
      : disposition.criterion_binding ? clone(disposition.criterion_binding) : null;
    if (!Array.isArray(disposition.evidence_obligations)
        || disposition.evidence_obligations.length === 0
        || new Set(disposition.evidence_obligations).size !== disposition.evidence_obligations.length) {
      throw governanceError(DISPOSITION_UNRESOLVED, 'Every bound disposition requires unique explicit evidence obligations.', {
        disposition_id: disposition.disposition_id,
      });
    }
    const findingProjection = clone(finding);
    const dispositionProjection = projectDisposition(disposition, target, criterionBinding);
    assertSafeExactValue(findingProjection, canonicalRoot, `finding:${finding.finding_id}`);
    assertSafeExactValue(dispositionProjection, canonicalRoot, `disposition:${disposition.disposition_id}`);
    projectedFindings.push(findingProjection);
    projectedDispositions.push(dispositionProjection);
    seenFindingIds.add(disposition.finding_id);
  }

  projectedFindings.sort((left, right) => left.finding_id.localeCompare(right.finding_id));
  projectedDispositions.sort((left, right) => left.disposition_id.localeCompare(right.disposition_id));
  const manifest = {
    schema_version: GOVERNANCE_MANIFEST_SCHEMA_VERSION,
    kind: GOVERNANCE_MANIFEST_KIND,
    source: {
      run_id: governanceState.run_id,
      path: toRelativePosix(canonicalRoot, runGovernancePath(canonicalRoot, governanceState.run_id)),
      sha256: canonicalSha256(governanceState),
    },
    decision: projectDecision(decision),
    findings: projectedFindings,
    dispositions: projectedDispositions,
  };
  assertSafeExactValue(manifest, canonicalRoot, 'governance_manifest');
  return {
    ...manifest,
    manifest_sha256: canonicalSha256(manifest),
  };
}

function assertGovernanceManifestShape(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)
      || manifest.schema_version !== GOVERNANCE_MANIFEST_SCHEMA_VERSION
      || manifest.kind !== GOVERNANCE_MANIFEST_KIND
      || !String(manifest.source?.run_id || '').trim()
      || !String(manifest.source?.path || '').trim()
      || !SHA256_DIGEST_PATTERN.test(manifest.source?.sha256 || '')
      || !String(manifest.decision?.decision_id || '').trim()
      || !SHA256_DIGEST_PATTERN.test(manifest.decision?.decision_sha256 || '')
      || manifest.decision?.phase !== 'technical-plan'
      || manifest.decision?.publication_state !== 'final'
      || !['approved', 'approved-with-conditions'].includes(manifest.decision?.decision)
      || !Array.isArray(manifest.decision?.disposition_ids)
      || !Array.isArray(manifest.findings) || !Array.isArray(manifest.dispositions)) {
    throw governanceError(REPRESENTATION_MISMATCH, 'Governance manifest does not satisfy the planning-governance contract.', {
      mismatches: ['GOVERNANCE_MANIFEST.json'],
    });
  }
  const digestInput = clone(manifest);
  delete digestInput.manifest_sha256;
  const actualDigest = canonicalSha256(digestInput);
  if (manifest.manifest_sha256 !== actualDigest) {
    throw governanceError(APPROVAL_BINDING_MISMATCH, 'Governance manifest self-digest is stale or has been tampered with.', {
      mismatches: ['manifest_sha256'],
      expected: manifest.manifest_sha256 || null,
      actual: actualDigest,
    });
  }
  const findingIds = manifest.findings.map((finding) => finding?.finding_id);
  const dispositionIds = manifest.dispositions.map((disposition) => disposition?.disposition_id);
  const boundDispositionIds = [...manifest.decision.disposition_ids].sort();
  if (findingIds.some((id) => !id) || new Set(findingIds).size !== findingIds.length
      || dispositionIds.some((id) => !id) || new Set(dispositionIds).size !== dispositionIds.length
      || manifest.findings.length !== manifest.dispositions.length
      || stableStringify([...dispositionIds].sort()) !== stableStringify(boundDispositionIds)) {
    throw governanceError(REPRESENTATION_MISMATCH, 'Governance manifest contains missing or duplicate canonical identities.', {
      mismatches: ['findings', 'dispositions'],
    });
  }
  return manifest;
}

function resolveManifestLocation(specRootOrPath) {
  if (!String(specRootOrPath || '').trim()) {
    throw governanceError(REPRESENTATION_MISMATCH, 'Governance manifest verification requires a spec root.', {
      mismatches: ['specRoot'],
    });
  }
  const resolved = path.resolve(specRootOrPath);
  return path.basename(resolved) === GOVERNANCE_MANIFEST_FILENAME
    ? { manifestPath: resolved, specRoot: path.dirname(resolved) }
    : { manifestPath: path.join(resolved, GOVERNANCE_MANIFEST_FILENAME), specRoot: resolved };
}

function readGovernanceManifest(specRootOrPath) {
  const { manifestPath, specRoot } = resolveManifestLocation(specRootOrPath);
  if (!fs.existsSync(manifestPath) || !fs.statSync(manifestPath).isFile()) {
    throw governanceError(REPRESENTATION_MISMATCH, `Missing ${GOVERNANCE_MANIFEST_FILENAME}.`, {
      mismatches: [GOVERNANCE_MANIFEST_FILENAME],
    });
  }
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw governanceError(REPRESENTATION_MISMATCH, `${GOVERNANCE_MANIFEST_FILENAME} is not valid JSON.`, {
      mismatches: [GOVERNANCE_MANIFEST_FILENAME],
      cause: error.message,
    });
  }
  assertGovernanceManifestShape(manifest);
  return { manifest, manifestPath, specRoot };
}

function governanceEntriesForTarget(manifest, target) {
  assertGovernanceManifestShape(manifest);
  const dispositionsByFinding = new Map();
  for (const disposition of manifest.dispositions) {
    if (dispositionsByFinding.has(disposition.finding_id)) {
      throw governanceError(REPRESENTATION_MISMATCH, 'A governance finding has more than one projected disposition.', {
        finding_id: disposition.finding_id,
      });
    }
    dispositionsByFinding.set(disposition.finding_id, disposition);
  }
  const entries = manifest.findings.map((finding) => {
    const disposition = dispositionsByFinding.get(finding.finding_id);
    if (!disposition) {
      throw governanceError(REPRESENTATION_MISMATCH, 'A governance finding is orphaned from its disposition.', {
        finding_id: finding.finding_id,
      });
    }
    return {
      finding,
      disposition,
      target: disposition.target || disposition.target_issue || null,
      criterion_binding: disposition.criterion_binding || null,
      pending: finding.state !== 'closed',
      resolved: finding.state === 'closed',
      accepted: manifest.decision.decision === 'approved-with-conditions'
        && disposition.state === 'current'
        && manifest.decision.disposition_ids.includes(disposition.disposition_id),
    };
  });
  const findingIds = new Set(manifest.findings.map((finding) => finding.finding_id));
  const orphan = manifest.dispositions.find((disposition) => !findingIds.has(disposition.finding_id));
  if (orphan) {
    throw governanceError(REPRESENTATION_MISMATCH, 'A projected disposition references an unknown governance finding.', {
      disposition_id: orphan.disposition_id,
      finding_id: orphan.finding_id,
    });
  }
  return entries
    .filter((entry) => target == null || entry.disposition.target === target)
    .sort((left, right) => left.finding.finding_id.localeCompare(right.finding.finding_id));
}

function verifyGovernanceManifestParity(options = {}) {
  const { manifest, manifestPath, specRoot } = options.manifest
    ? { manifest: assertGovernanceManifestShape(options.manifest), ...resolveManifestLocation(options.specRoot) }
    : readGovernanceManifest(options.specRoot);
  const canonicalRoot = resolveCanonicalProjectRoot(options.repoRoot || specRoot);
  const governanceState = readRunGovernance(canonicalRoot, manifest.source.run_id);
  if (!governanceState) {
    throw governanceError(APPROVAL_BINDING_MISMATCH, 'Canonical governance state is unavailable for manifest parity.', {
      mismatches: ['source.run_id'],
    });
  }
  if (manifest.source.path !== toRelativePosix(canonicalRoot, runGovernancePath(canonicalRoot, manifest.source.run_id))
      || manifest.source.sha256 !== canonicalSha256(governanceState)) {
    throw governanceError(APPROVAL_BINDING_MISMATCH, 'Governance manifest source binding is stale or has been tampered with.', {
      mismatches: ['source.path', 'source.sha256'],
    });
  }
  const decisions = readRunApprovalDecisions(canonicalRoot, manifest.source.run_id)
    .filter((decision) => decision.phase === 'technical-plan');
  if (decisions.length !== 1) {
    throw governanceError(REPRESENTATION_MISMATCH, 'Governance manifest decision must resolve exactly once in canonical state.', {
      mismatches: ['decision.decision_id'],
      count: decisions.length,
    });
  }
  const decision = decisions[0];
  if (decision.decision_id !== manifest.decision.decision_id
      || decision.decision_sha256 !== manifest.decision.decision_sha256) {
    throw governanceError(APPROVAL_BINDING_MISMATCH, 'Governance manifest final-decision binding is stale or has been tampered with.', {
      mismatches: ['decision.decision_id', 'decision.decision_sha256'],
    });
  }
  const artifact = readBindingFile(canonicalRoot, decision.artifact_path, 'Final technical-plan artifact', 'artifact_path');
  if (artifact.sha256 !== decision.artifact_sha256) {
    throw governanceError(APPROVAL_BINDING_MISMATCH, 'Final technical-plan artifact digest is stale or has been tampered with.', {
      mismatches: ['decision.artifact_sha256'],
    });
  }
  // Lazy loading avoids a module cycle during spec generation while preserving one plan parser.
  const { buildSpecGenerationManifest } = require('./spec-generator');
  const planManifest = buildSpecGenerationManifest({
    inputText: artifact.bytes.toString('utf8'),
    inputPath: artifact.path,
    repoRoot: canonicalRoot,
  });
  const expected = buildPlanningGovernanceManifest({
    canonicalRoot,
    governanceState,
    decision,
    planManifest,
  });
  if (stableStringify(expected) !== stableStringify(manifest)) {
    const expectedFindingIds = expected.findings.map((finding) => finding.finding_id);
    const actualFindingIds = manifest.findings.map((finding) => finding.finding_id);
    const expectedDispositionIds = expected.dispositions.map((item) => item.disposition_id);
    const actualDispositionIds = manifest.dispositions.map((item) => item.disposition_id);
    const representationMismatch = stableStringify(expectedFindingIds) !== stableStringify(actualFindingIds)
      || stableStringify(expectedDispositionIds) !== stableStringify(actualDispositionIds);
    throw governanceError(
      representationMismatch ? REPRESENTATION_MISMATCH : APPROVAL_BINDING_MISMATCH,
      'Governance manifest does not match its canonical source projection.',
      { mismatches: representationMismatch ? ['findings', 'dispositions'] : ['manifest_projection'] },
    );
  }
  return {
    manifest,
    canonicalRoot,
    manifestPath,
    specRoot,
    governanceState,
    decision,
  };
}

module.exports = {
  GOVERNANCE_MANIFEST_FILENAME,
  GOVERNANCE_MANIFEST_KIND,
  GOVERNANCE_MANIFEST_SCHEMA_VERSION,
  GOVERNANCE_MARKER_BEGIN,
  GOVERNANCE_MARKER_END,
  GOVERNANCE_TRACEABILITY_MARKER_BEGIN_PREFIX,
  GOVERNANCE_TRACEABILITY_MARKER_END,
  assertGovernanceManifestShape,
  buildPlanningGovernanceManifest,
  governanceTraceabilityMarkerBegin,
  governanceEntriesForTarget,
  normalizeApprovedCriterionSemantic,
  readGovernanceManifest,
  resolveCanonicalProjectRoot,
  resolveVerifiedSpecGovernance,
  validateCriterionBindingAgainstPlan,
  verifyGovernanceManifestParity,
};
