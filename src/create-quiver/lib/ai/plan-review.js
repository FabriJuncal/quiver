const fs = require('node:fs');
const path = require('node:path');

const { readPhaseApproval, resolveApprovedPlannerInput } = require('../approvals');
const { quiverInternalPaths } = require('../init-layout');

const PLAN_REVIEW_PROMPT_SOURCE = 'packaged production-readiness plan review template';
const PLAN_REVIEW_RECOMMENDATIONS = Object.freeze(['approve', 'approve-with-risk', 'revise']);

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

function buildPlanReviewPrompt({ pack, inputText, inputPath }) {
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
    'Required output contract: include a fenced json block with `{ "review": { "blocking": boolean, "approvalRecommendation": "approve|approve-with-risk|revise", "requiredFixes": [], "optionalHardening": [], "risks": [], "nextCommand": "" } }`.',
    'Use `approve` only when no required fixes remain. Use `approve-with-risk` when only optional hardening or accepted risks remain. Use `revise` when required fixes or blocking ambiguity remain.',
  ];

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
  derivePlanReviewResult,
  planReviewMetaPath,
  planReviewPath,
  readPlanReview,
  reviewBlocksApproval,
  resolveTechnicalPlanReviewInput,
  resolveReviewedTechnicalPlanInput,
  savePlanReview,
  summarizePlanReview,
};
