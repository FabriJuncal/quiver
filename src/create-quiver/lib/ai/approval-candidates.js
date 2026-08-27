const {
  buildPlannerApprovalCandidates,
  readProjectFileBytes,
} = require('../approvals');
const { redactSensitiveLocalValues, redactSensitiveValue } = require('./artifacts');
const { buildTechnicalPlanApprovalCandidates } = require('./plan-review');
const {
  APPROVAL_BINDING_MISMATCH,
  GovernanceError,
  REPRESENTATION_MISMATCH,
  canonicalSha256,
  computeApprovalDispositionDigest,
  computeApprovalProfileDigest,
  stableStringify,
} = require('./review-governance');
const { parseApprovedManifest } = require('./spec-generator');

function buildApprovalCandidateReport(projectRoot, phase) {
  return phase === 'technical-plan'
    ? buildTechnicalPlanApprovalCandidates(projectRoot)
    : buildPlannerApprovalCandidates(projectRoot, phase);
}

function formatReviewSummary(review) {
  if (!review || !review.recommendation) {
    return '';
  }

  const parts = [`review=${review.recommendation}`];
  if (review.blocking) {
    parts.push('blocking');
  }
  const counts = {
    required_fixes_count: Array.isArray(review.required_fixes) ? review.required_fixes.length : 0,
    optional_hardening_count: Array.isArray(review.optional_hardening) ? review.optional_hardening.length : 0,
    risks_count: Array.isArray(review.risks) ? review.risks.length : 0,
  };
  const mismatch = Object.entries(counts).find(([field, count]) => (
    typeof review[field] === 'number' && review[field] !== count
  ));
  if (mismatch) {
    throw new GovernanceError(
      REPRESENTATION_MISMATCH,
      'Plan-review summary counts do not match their canonical collections.',
      { mismatches: [mismatch[0]] },
    );
  }
  if (counts.required_fixes_count) {
    parts.push(`required fixes=${counts.required_fixes_count}`);
  }
  if (counts.optional_hardening_count) {
    parts.push(`optional=${counts.optional_hardening_count}`);
  }
  if (counts.risks_count) {
    parts.push(`risks=${counts.risks_count}`);
  }
  return parts.join(', ');
}

function approvalCriteria(projectRoot, phase, artifact) {
  const parsed = parseApprovedManifest(artifact.bytes.toString('utf8'), {
    fallbackTitle: phase,
  }).source;
  const source = parsed?.spec && typeof parsed.spec === 'object' ? parsed.spec : parsed;
  if (phase === 'acceptance') {
    return Array.isArray(source?.acceptance)
      ? [...source.acceptance]
      : [];
  }
  const slices = Array.isArray(source?.slices) ? source.slices : [];
  return slices.flatMap((slice) => (
    Array.isArray(slice?.acceptance)
      ? [...slice.acceptance]
      : []
  ));
}

function assertStoredDigest(label, expected, actual) {
  if (!expected || expected !== actual) {
    throw new GovernanceError(
      APPROVAL_BINDING_MISMATCH,
      `${label} digest is missing, stale, or has been tampered with.`,
      { mismatches: [label], expected: expected || null, actual },
    );
  }
}

function readBoundApprovalFile(projectRoot, value, label, mismatchField) {
  try {
    return readProjectFileBytes(projectRoot, value, label);
  } catch (error) {
    if (error instanceof GovernanceError) throw error;
    throw new GovernanceError(
      APPROVAL_BINDING_MISMATCH,
      `${label} is missing, invalid, or resolves outside the project.`,
      { mismatches: [mismatchField], cause: error.message },
    );
  }
}

function assertSafeApprovalBytes(projectRoot, file, mismatchField) {
  const text = file.bytes.toString('utf8');
  const exactUtf8 = Buffer.from(text, 'utf8').equals(file.bytes);
  const redactedText = exactUtf8 ? redactSensitiveLocalValues(text, { projectRoot }) : null;
  let structuredSafe = true;
  if (exactUtf8) {
    try {
      const parsed = JSON.parse(text);
      structuredSafe = stableStringify(parsed)
        === stableStringify(redactSensitiveValue(parsed, { projectRoot }));
    } catch {
      structuredSafe = true;
    }
  }
  if (!exactUtf8 || redactedText !== text || !structuredSafe) {
    throw new GovernanceError(
      APPROVAL_BINDING_MISMATCH,
      'Approval content cannot be represented safely without changing its exact bytes.',
      { mismatches: [mismatchField], path: file.path },
    );
  }
}

function buildDigestBoundApprovalBindings(projectRoot, options = {}) {
  const phase = options.phase;
  const report = buildApprovalCandidateReport(projectRoot, phase);
  const candidates = report.candidates.filter((item) => Number(item.version) === Number(options.version));
  if (candidates.length !== 1) {
    throw new GovernanceError(
      candidates.length === 0 ? 'GOVERNANCE_STATE_INVALID' : REPRESENTATION_MISMATCH,
      candidates.length === 0
        ? `Approval candidate v${options.version} is not the current approvable ${phase} artifact.`
        : `Approval candidate v${options.version} is represented ${candidates.length} times.`,
      {
        run_id: options.run?.run_id || null,
        phase,
        version: Number(options.version) || null,
        candidate_count: candidates.length,
      },
    );
  }
  const candidate = candidates[0];
  const artifact = readBoundApprovalFile(
    projectRoot,
    candidate.path,
    `${phase} approval artifact`,
    'artifact_path',
  );
  const draftInput = readBoundApprovalFile(
    projectRoot,
    candidate.input_path,
    `${phase} draft input`,
    'input_path',
  );
  const input = options.canonicalInputPath
    ? readBoundApprovalFile(
        projectRoot,
        options.canonicalInputPath,
        `${phase} canonical approval input`,
        'input_path',
      )
    : draftInput;
  assertStoredDigest('artifact_sha256', candidate.artifact_sha256, artifact.sha256);
  assertStoredDigest('input_sha256', candidate.input_sha256, draftInput.sha256);
  assertSafeApprovalBytes(projectRoot, artifact, 'artifact_sensitive_content');
  assertSafeApprovalBytes(projectRoot, input, 'input_sensitive_content');
  if (input.sha256 !== draftInput.sha256) {
    throw new GovernanceError(
      APPROVAL_BINDING_MISMATCH,
      'Canonical approval input does not match the planner draft input.',
      { mismatches: ['input_path', 'input_sha256'] },
    );
  }

  const state = options.governanceState || {
    reviews: [],
    findings: [],
    dispositions: [],
    conditioned_candidates: [],
  };
  const review = phase === 'technical-plan'
    ? state.reviews.find((item) => item.review_id === state.current_review_id) || null
    : null;
  if (phase === 'technical-plan' && !review) {
    throw new GovernanceError('GOVERNANCE_STATE_INVALID', 'Technical-plan approval requires a current canonical review.');
  }
  const conditionedCandidate = options.conditionedCandidate || null;
  const dispositionIds = conditionedCandidate ? [...conditionedCandidate.disposition_ids].sort() : [];
  const dispositions = dispositionIds.map((dispositionId) => (
    state.dispositions.find((item) => item.disposition_id === dispositionId)
  ));
  if (dispositions.some((disposition) => !disposition || disposition.state !== 'current')) {
    throw new GovernanceError(
      APPROVAL_BINDING_MISMATCH,
      'Conditioned approval dispositions are missing or no longer current.',
      { mismatches: ['disposition_ids'] },
    );
  }
  let reason = null;
  if (conditionedCandidate) {
    reason = readBoundApprovalFile(
      projectRoot,
      conditionedCandidate.reason_path,
      'conditioned approval reason',
      'reason_path',
    );
    assertStoredDigest('reason_sha256', conditionedCandidate.reason_sha256, reason.sha256);
  }
  const criteria = approvalCriteria(projectRoot, phase, artifact);
  const profile = options.runtime?.profile || {};
  const binding = options.run?.governance || options.runtime?.binding || {};
  const decision = conditionedCandidate ? 'approved-with-conditions' : 'approved';
  const authorization = options.authorization?.evidence || options.authorization;
  const result = {
    run_id: options.run.run_id,
    review_id: review?.review_id || null,
    phase,
    decision,
    candidate_id: conditionedCandidate?.candidate_id || null,
    evaluation_id: conditionedCandidate?.evaluation_id || null,
    version: Number(candidate.version),
    artifact_path: artifact.path,
    artifact_sha256: artifact.sha256,
    input_path: input.path,
    input_sha256: input.sha256,
    review_sha256: review ? canonicalSha256(review) : null,
    requested_profile: profile.requested_profile,
    effective_profile: profile.effective_profile,
    profile_sha256: computeApprovalProfileDigest(profile, binding),
    policy_version: profile.policy_version,
    policy_digest: profile.policy_digest,
    finding_count: Array.isArray(state.findings) ? state.findings.length : 0,
    criterion_count: criteria.length,
    disposition_ids: dispositionIds,
    disposition_sha256: computeApprovalDispositionDigest(dispositions),
    reason_path: reason?.path || null,
    reason_sha256: reason?.sha256 || null,
    actor_id: authorization?.actor_id || '',
    authorization,
    reviewer_recommendation: review?.provider_recommendation || null,
    reviewer_approved: conditionedCandidate ? false : null,
  };
  if (conditionedCandidate) {
    const expected = {
      run_id: conditionedCandidate.run_id,
      review_id: conditionedCandidate.review_id,
      decision: conditionedCandidate.decision,
      actor_id: conditionedCandidate.actor_id,
      authorization: conditionedCandidate.authorization,
      policy_version: conditionedCandidate.policy_version,
      policy_digest: conditionedCandidate.policy_digest,
      disposition_ids: [...conditionedCandidate.disposition_ids].sort(),
      reason_path: conditionedCandidate.reason_path,
      reason_sha256: conditionedCandidate.reason_sha256,
      reviewer_recommendation: conditionedCandidate.reviewer_recommendation,
      reviewer_approved: conditionedCandidate.reviewer_approved,
    };
    const actual = Object.fromEntries(Object.keys(expected).map((field) => [field, result[field]]));
    if (stableStringify(expected) !== stableStringify(actual)) {
      throw new GovernanceError(
        APPROVAL_BINDING_MISMATCH,
        'Conditioned approval candidate no longer matches the commit bindings.',
        { mismatches: Object.keys(expected).filter((field) => stableStringify(expected[field]) !== stableStringify(actual[field])) },
      );
    }
  }
  return { bindings: result, artifact, input, criteria, candidate, review, dispositions, reason };
}

function formatCandidateSummary(candidate) {
  if (!candidate) {
    return '';
  }

  const parts = [
    candidate.label,
    candidate.current ? 'current' : 'history',
    candidate.approvable ? 'approvable' : 'blocked',
    candidate.reason,
    formatReviewSummary(candidate.review),
  ].filter(Boolean);
  return parts.join(', ');
}

function approvalCandidateCommand(report, fallback = 'npx create-quiver ai approvals') {
  if (report?.recommended?.next_command) {
    return report.recommended.next_command;
  }
  if (report?.current?.next_command) {
    return report.current.next_command;
  }
  return report?.next_command || fallback;
}

function formatApprovalDecisionLines(report) {
  const lines = [];
  if (!report || !Array.isArray(report.candidates)) {
    return lines;
  }

  lines.push(`Candidates: ${report.candidates.length}`);
  if (report.latest_version) {
    lines.push(`Latest draft: v${report.latest_version}`);
  }
  if (report.current) {
    lines.push(`Current candidate: ${formatCandidateSummary(report.current)}`);
  }
  if (report.recommended) {
    lines.push(`Recommended approval: ${report.recommended.next_command}`);
  } else if (report.next_command) {
    lines.push(`Recommended next command: ${report.next_command}`);
  }
  if (report.review?.status) {
    lines.push(`Review status: ${report.review.status}`);
  }
  return lines;
}

module.exports = {
  approvalCandidateCommand,
  approvalCriteria,
  buildApprovalCandidateReport,
  buildDigestBoundApprovalBindings,
  formatApprovalDecisionLines,
  formatCandidateSummary,
  formatReviewSummary,
};
