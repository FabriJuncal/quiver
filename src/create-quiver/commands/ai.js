const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { redactSecrets } = require('../lib/evidence');
const { formatActionableError } = require('../lib/actionable-error');
const {
  assertProviderPromptWithinLimit,
  byteLength,
  compactRevisionInput,
  containsSensitiveText,
  extractCleanProviderOutput,
  redactSensitiveLocalValues,
  writeRawProviderArtifact,
} = require('../lib/ai/artifacts');
const { buildContextPackMetadata, normalizeRole } = require('../lib/ai/context-packs');
const { parseContextProposalOutput } = require('../lib/ai/context-proposal');
const { discoverProjectFiles } = require('../lib/ai/analyze-project-discovery');
const {
  buildAnalyzeProjectDocProposal,
  buildAnalyzeProjectWritePlan,
  createAnalyzeProjectSnapshot,
  formatAnalyzeProjectDiffPreview,
  writeAnalyzeProjectDocs,
} = require('../lib/ai/analyze-project-docs');
const {
  buildAnalyzeProjectPrompt,
  buildAnalyzeProjectRetryPrompt,
  buildSelectedContextManifest,
  writeSelectedContextManifest,
} = require('../lib/ai/analyze-project-prompts');
const {
  parseAnalyzeProjectOutputWithRepair,
  writeAnalyzeProjectRepairManifest,
} = require('../lib/ai/analyze-project-repair');
const {
  buildEvidenceRecoveryPayload,
  classifyEvidenceRecoveryIssues,
} = require('../lib/ai/analyze-project-recovery');
const {
  confirmAnalyzeProjectWrites,
  reviewAnalyzeProjectDocProposal,
} = require('../lib/ai/analyze-project-review');
const {
  findLatestAnalyzeProjectSavedProposalRun,
  readAnalyzeProjectSavedProposal,
  writeAnalyzeProjectProposalArtifacts,
} = require('../lib/ai/analyze-project-proposal');
const {
  applyAnalyzeProjectDocProposal,
} = require('../lib/ai/analyze-project-apply');
const {
  canUseAnalyzeProjectInteractiveSelector,
  runAnalyzeProjectInteractiveApplySelector,
} = require('../lib/ai/analyze-project-interactive');
const {
  DEFAULT_MAX_BYTES: DEFAULT_ANALYZE_MAX_BYTES,
  DEFAULT_MAX_FILES: DEFAULT_ANALYZE_MAX_FILES,
  sampleProjectFiles,
} = require('../lib/ai/analyze-project-sampling');
const {
  groupAnalyzeProjectIssues,
  validateAnalyzeProjectPostWrite,
  writeAnalyzeProjectRetryManifest,
  writeAnalyzeProjectValidationManifest,
} = require('../lib/ai/analyze-project-validation');
const { openEditor } = require('../lib/cli/editor');
const { selectOption, promptText } = require('../lib/cli/selectors');
const { createUx } = require('../lib/cli/ux');
const { createTranslator } = require('../lib/i18n/catalog');
const { runExecuteSlice, runPromptSlice } = require('../lib/ai/executor');
const { runExecutePlan } = require('../lib/ai/execution-plan');
const { buildPrCreatePlan, formatPreflightReport, formatPrCreateReport, preflightGitHubPr, runGhPrCreate } = require('../lib/ai/github');
const {
  MODEL_CATALOG_LAST_UPDATED,
  MODEL_CATALOG_VERSION,
  getKnownModelsForProvider,
  listCatalogProviders,
} = require('../lib/ai/model-catalog');
const { buildContextPreparationDrafts, buildPlannerOnboardingPrompt } = require('../lib/ai/onboarding-template');
const {
  collectLifecycleExport,
  formatLifecycleExportMarkdown,
  formatLifecycleInspect,
  formatSlicesList,
  formatSpecsList,
  formatTraceReport,
} = require('../lib/ai/export-state');
const {
  PLAN_REVIEW_PROMPT_SOURCE,
  buildPlanReviewPrompt,
  readPlanReview,
  recoverGovernedPlanReviewCommit,
  reviewBlocksApproval,
  resolveReviewedTechnicalPlanInput,
  resolveTechnicalPlanReviewInput,
  savePlanReview,
  summarizePlanReview,
} = require('../lib/ai/plan-review');
const {
  GovernanceError,
  PROVIDER_OUTPUT_INVALID,
  assertApprovalBindingParity,
  authorizeGovernanceAction,
  buildConditionedDecisionProjection,
  computeApprovalDispositionDigest,
  computeApprovalProfileDigest,
  canonicalSha256,
  evaluateConditionEligibility,
  hasGovernanceConfig,
  readGovernanceConfig,
  resolveEffectiveProfile,
  stableStringify,
  verifyApprovalDecisionRecord,
} = require('../lib/ai/review-governance');
const {
  assertNoPendingReviewBudgetReservations,
  assertReviewBudgetHistoryVerified,
  classifyReviewIntent,
  extendReviewBudget,
  finalizeReviewBudget,
  formatReviewBudget,
  readReviewBudgetEvents,
  reserveReviewBudget,
  sha256Digest,
} = require('../lib/ai/review-budget');
const {
  buildSpecGenerationManifest,
  describeSpecGeneration,
  generateSpecArtifacts,
  validateTechnicalPlanSpecContract,
} = require('../lib/ai/spec-generator');
const {
  buildProviderInvocation,
  getProviderDefinition,
  resolveGitHubCliProviderSubject,
  runProvider,
} = require('../lib/ai/providers');
const {
  createAiRun,
  bindAiRunGovernance,
  commitDigestBoundApproval,
  ensureAiRun,
  formatAiRunResume,
  formatAiRunStatus,
  listAiRuns,
  readAiRun,
  readRunApprovalDecision,
  readRunApprovalDecisions,
  readRunGovernance,
  recordAiRunApproval,
  recoverDigestBoundApprovalCommit,
  resolveAiRun,
  resolveGovernedAiRun,
  runApprovalsPath,
  runReviewCommitPath,
  runApprovalArtifactPath,
  runApprovalCommitPath,
  runRequirementPath,
  updateAiRunPhase,
  withAiRunLock,
  writeRunGovernance,
} = require('../lib/ai/run-state');
const {
  canonicalDispositionSchema,
  conditionedDecisionCandidateSchema,
  conditionDispositionEnvelopeSchema,
  conditionEvaluationSchema,
} = require('../lib/ai/review-governance.schema');
const {
  agentProfilesPath,
  buildAgentProfileDoctorReport,
  buildAgentProfileRepairPlan,
  buildAgentProfileState,
  getAgentProfile,
  getAgentProfileById,
  getAgentProfilesForRole,
  listAgentProfiles,
  normalizeAgentProfileRole,
  resolveAgentProfileDisplayName,
  resolveProfileProvider,
  setAgentProfile,
} = require('../lib/agent-profiles');
const {
  PLANNER_APPROVAL_PHASES,
  approvePlannerPhase,
  findDraftVersion,
  latestDraftVersion,
  preparePlannerApprovalProjection,
  readPhaseApproval,
  readProjectFileBytes,
  resolveApprovedPlannerInput,
  savePlannerDraft,
  summarizePlannerApproval,
} = require('../lib/approvals');
const {
  buildApprovalCandidateReport,
  buildDigestBoundApprovalBindings,
  approvalCriteria,
  formatApprovalDecisionLines,
} = require('../lib/ai/approval-candidates');
const { assertPlannerPhaseReady, getPlannerPhaseDetails, normalizePlannerPhase, PlannerPhaseError } = require('../lib/ai/phase-gates');
const { formatStatus, translatorForHuman } = require('../lib/i18n/read-only-format');
const { collectActiveSliceState, resolveProjectState } = require('../lib/project-state-resolver');
const { assertPathInsideRoot, validateProjectRelativePath } = require('../lib/paths');

const DEFAULT_ONBOARD_PROVIDER = 'codex';
const DEFAULT_ONBOARD_ROLE = 'planner';
const DEFAULT_ONBOARD_CONTEXT = 'full';
const DEFAULT_PLAN_PROVIDER = 'codex';
const DEFAULT_PLAN_ROLE = 'planner';
const DEFAULT_PLAN_CONTEXT = 'planning';
const DEFAULT_PLAN_PHASE = 'acceptance';
const CONTEXT_PREP_START = '<!-- quiver:context-prep:start -->';
const CONTEXT_PREP_END = '<!-- quiver:context-prep:end -->';
const ANALYZE_PROJECT_KIND = 'quiver-project-analysis-plan';

function formatError(message) {
  return `create-quiver: ${message}`;
}

function governanceIsEnabled(repoRoot, options = {}, activeRun = null) {
  return Boolean(options.governanceProfile)
    || hasGovernanceConfig(repoRoot)
    || Boolean(activeRun?.governance);
}

function resolveGovernanceRuntime(repoRoot, options = {}, activeRun = null) {
  if (!governanceIsEnabled(repoRoot, options, activeRun)) {
    return null;
  }
  const configuredGovernance = readGovernanceConfig(repoRoot, { allowMissing: true });
  if (!configuredGovernance) {
    throw new GovernanceError(
      'GOVERNANCE_CONFIG_MISSING',
      activeRun?.run_id
        ? `Governance config is required to continue governed run '${activeRun.run_id}'.`
        : 'Governance config is required before starting a governed run.',
      { run_id: activeRun?.run_id || null },
    );
  }
  const governance = configuredGovernance;
  const requirementCategories = Array.isArray(governance.requirement_categories)
    ? [...new Set(governance.requirement_categories
      .map((value) => String(value || '').trim())
      .filter(Boolean))].sort()
    : [];
  const profile = resolveEffectiveProfile({
    governance,
    cliProfile: options.governanceProfile || activeRun?.governance?.requested_profile || undefined,
    requirementCategories,
    activeRunProfile: activeRun?.governance || null,
  });
  if (activeRun?.governance
      && (activeRun.governance.policy_version !== profile.policy_version
        || activeRun.governance.policy_digest !== profile.policy_digest)) {
    throw new GovernanceError(
      'GOVERNANCE_POLICY_MISMATCH',
      `Governance policy changed after run '${activeRun.run_id}' was bound.`,
      {
        run_id: activeRun.run_id,
        expected_policy_version: activeRun.governance.policy_version,
        expected_policy_digest: activeRun.governance.policy_digest,
        actual_policy_version: profile.policy_version,
        actual_policy_digest: profile.policy_digest,
      },
    );
  }
  return {
    governance,
    profile,
    binding: {
      requested_profile: profile.requested_profile,
      effective_profile: profile.effective_profile,
      policy_version: profile.policy_version,
      policy_digest: profile.policy_digest,
      requirement_categories: requirementCategories,
    },
  };
}

function prepareGovernedRun(repoRoot, options = {}) {
  const explicitRun = options.runId ? readAiRun(repoRoot, options.runId) : null;
  if (!governanceIsEnabled(repoRoot, options, explicitRun)) {
    return null;
  }
  if (explicitRun?.status === 'closed') {
    resolveGovernedAiRun(repoRoot, options.runId);
  }
  const activeRun = options.runId ? explicitRun : resolveGovernedAiRun(repoRoot);
  const runtime = resolveGovernanceRuntime(repoRoot, options, activeRun);
  if (activeRun && options.artifactPhase) {
    assertGovernedRunOwnsArtifact(repoRoot, activeRun, options.artifactPhase, options.artifact);
  }
  if (!activeRun && options.artifactPhase) {
    throw new GovernanceError(
      'AI_RUN_REQUIRED',
      'Governed plan review requires an existing run that owns the current versioned technical-plan draft.',
      { artifact: normalizeRunArtifactPath(repoRoot, options.artifact) || null },
    );
  }
  if (options.readOnly === true) {
    return { ...runtime, run: activeRun };
  }
  const run = activeRun || createAiRun(repoRoot, {
    command: options.command,
    input: options.input,
    runId: options.runId,
    phase: options.phase,
    governance: runtime.binding,
  });
  const bindingMatches = activeRun && Object.entries(runtime.binding)
    .every(([key, value]) => JSON.stringify(activeRun.governance?.[key]) === JSON.stringify(value));
  const bound = activeRun && !bindingMatches
    ? bindAiRunGovernance(repoRoot, run.run_id, runtime.binding, { command: options.command })
    : run;
  return { ...runtime, run: bound };
}

function governanceFailure(result) {
  const code = result?.code || 'AUTHORIZATION_DENIED';
  const message = result?.message || 'Governance authorization denied.';
  return new GovernanceError(code, `${code}: ${message}`, result?.evidence || {});
}

function sha256Bytes(value) {
  return `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
}

function readBoundedProjectFile(repoRoot, value, label) {
  if (!value) {
    return { ok: false, issue: 'missing', path: null, bytes: null };
  }
  try {
    const relativePath = validateProjectRelativePath(value, label);
    if (containsSensitiveText(relativePath)) {
      return { ok: false, issue: 'sensitive-path', path: null, bytes: null };
    }
    const filePath = path.resolve(repoRoot, relativePath);
    if (!fs.existsSync(filePath)) {
      return { ok: false, issue: 'missing', path: relativePath, bytes: null };
    }
    assertPathInsideRoot(repoRoot, filePath, label);
    if (!fs.statSync(filePath).isFile()) {
      return { ok: false, issue: 'not-a-file', path: relativePath, bytes: null };
    }
    const canonicalPath = path.relative(path.resolve(repoRoot), filePath).split(path.sep).join('/');
    return {
      ok: true,
      issue: null,
      path: canonicalPath,
      bytes: fs.readFileSync(filePath),
    };
  } catch (error) {
    return {
      ok: false,
      issue: 'invalid-path',
      path: null,
      bytes: null,
      error: error.message,
    };
  }
}

function parseConditionDispositionFile(repoRoot, value, correlation) {
  const source = readBoundedProjectFile(repoRoot, value, 'conditions file');
  if (!source.ok) {
    return {
      envelope: {
        schema_version: 1,
        run_id: correlation.runId,
        review_id: correlation.reviewId,
        policy_version: correlation.policyVersion,
        policy_digest: correlation.policyDigest,
        dispositions: [],
      },
      invalid: Boolean(value),
      issue: source.issue,
      path: source.path,
    };
  }
  try {
    const parsedJson = JSON.parse(source.bytes.toString('utf8'));
    if (containsSensitiveText(stableStringify(parsedJson))) {
      return {
        envelope: {
          schema_version: 1,
          run_id: correlation.runId,
          review_id: correlation.reviewId,
          policy_version: correlation.policyVersion,
          policy_digest: correlation.policyDigest,
          dispositions: [],
        },
        invalid: true,
        issue: 'sensitive-content',
        path: source.path,
      };
    }
    const parsed = conditionDispositionEnvelopeSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return {
        envelope: {
          schema_version: 1,
          run_id: correlation.runId,
          review_id: correlation.reviewId,
          policy_version: correlation.policyVersion,
          policy_digest: correlation.policyDigest,
          dispositions: [],
        },
        invalid: true,
        issue: 'invalid-envelope',
        path: source.path,
      };
    }
    return {
      envelope: parsed.data,
      invalid: false,
      issue: null,
      path: source.path,
    };
  } catch {
    return {
      envelope: {
        schema_version: 1,
        run_id: correlation.runId,
        review_id: correlation.reviewId,
        policy_version: correlation.policyVersion,
        policy_digest: correlation.policyDigest,
        dispositions: [],
      },
      invalid: true,
      issue: 'invalid-json',
      path: source.path,
    };
  }
}

function readConditionReason(repoRoot, value) {
  const source = readBoundedProjectFile(repoRoot, value, 'reason file');
  if (!source.ok || source.bytes.length === 0 || !source.bytes.toString('utf8').trim()) {
    return {
      valid: false,
      issue: source.issue || 'empty',
      path: source.path,
      sha256: null,
    };
  }
  return {
    valid: true,
    issue: null,
    path: source.path,
    sha256: sha256Bytes(source.bytes),
  };
}

function nextCanonicalRecordId(records, field, prefix) {
  const used = new Set((records || []).map((record) => record?.[field]).filter(Boolean));
  let number = records.length + 1;
  let candidate;
  do {
    candidate = `${prefix}-${String(number).padStart(3, '0')}`;
    number += 1;
  } while (used.has(candidate));
  return candidate;
}

function canonicalizeConditionDispositions(state, envelope, authorization, now) {
  let dispositions = (state.dispositions || []).map((disposition) => ({ ...disposition }));
  const added = [];
  for (const proposal of envelope.dispositions) {
    if (proposal.supersedes) {
      dispositions = dispositions.map((disposition) => (
        disposition.disposition_id === proposal.supersedes
          ? { ...disposition, state: 'superseded' }
          : disposition
      ));
    }
    const canonical = canonicalDispositionSchema.parse({
      schema_version: 1,
      disposition_id: nextCanonicalRecordId(dispositions, 'disposition_id', 'D'),
      run_id: envelope.run_id,
      review_id: envelope.review_id,
      finding_id: proposal.finding_id,
      action: proposal.action,
      ...(proposal.target ? { target: proposal.target } : {}),
      ...(proposal.target_issue ? { target_issue: proposal.target_issue } : {}),
      evidence_obligations: [...proposal.evidence_obligations],
      state: 'current',
      supersedes: proposal.supersedes || null,
      actor_id: authorization.evidence.actor_id,
      authorization: authorization.evidence,
      policy_version: envelope.policy_version,
      policy_digest: envelope.policy_digest,
      recorded_at: now,
    });
    dispositions.push(canonical);
    added.push(canonical);
  }
  return { dispositions, added };
}

function throwConditionEligibilityFailure(result, inputIssue = null) {
  const normalizedResult = inputIssue && ![
    'PROTECTED_CRITICAL_REQUIRES_BREAK_GLASS',
    'DISPOSITION_STALE',
    'DISPOSITION_DUPLICATE',
    'DISPOSITION_MISSING',
    'DISPOSITION_UNAUTHORIZED',
    'NON_TRANSFERABLE_BLOCKER',
    'CURRENT_PHASE_REVISION_REQUIRED',
  ].includes(result.code)
    ? { ...result, eligible: false, status: 'INELIGIBLE', code: 'DISPOSITION_UNRESOLVED' }
    : result;
  const errorCode = normalizedResult.status === 'BREAK_GLASS_REQUIRED'
    ? 'BREAK_GLASS_REQUIRED'
    : normalizedResult.code;
  throw new GovernanceError(
    errorCode,
    `Conditioned approval candidate is not eligible: ${normalizedResult.code}.`,
    {
      eligibility: normalizedResult,
      ...(inputIssue ? { input_issue: inputIssue } : {}),
      final_decision_published: false,
      phase_advanced: false,
    },
  );
}

function formatConditionedCandidateResult(result, options = {}) {
  const lines = [
    options.dryRun ? 'AI approved-with-conditions candidate dry-run' : 'AI approved-with-conditions candidate saved',
    `Decision: ${result.decision}`,
    `Publication state: ${result.publication_state}`,
    `Eligibility: ${result.eligibility.code}`,
    `Run: ${result.run_id}`,
    `Review: ${result.review_id}`,
    `Reviewer recommendation: ${result.reviewer_recommendation}`,
    `Reviewer approved: ${result.reviewer_approved ? 'yes' : 'no'}`,
    `Conditions: ${result.disposition_ids.length}`,
    `Reason: ${result.reason_path}`,
    'Final decision published: no',
    'Phase advanced: no',
    'Legacy approved.md written: no',
  ];
  if (options.dryRun) lines.push('No files were changed.');
  return `${lines.join('\n')}\n`;
}

function assertGovernedPlanReviewCorrelation(repoRoot, review, run, runtime) {
  const state = readRunGovernance(repoRoot, run.run_id);
  const currentReview = state?.reviews?.find((item) => item.review_id === state.current_review_id) || null;
  const expected = {
    run_id: run.run_id,
    review_id: state?.current_review_id || null,
    requested_profile: run.governance?.requested_profile || null,
    effective_profile: run.governance?.effective_profile || null,
    policy_version: run.governance?.policy_version || null,
    policy_digest: run.governance?.policy_digest || null,
  };
  const runtimeBinding = runtime?.binding || {};
  const mismatches = [];

  if (review?.meta?.governed !== true || !state || !currentReview || !expected.review_id) {
    mismatches.push('current_governed_review');
  }
  for (const [field, value] of Object.entries(expected)) {
    if (review?.meta?.[field] !== value) mismatches.push(`meta.${field}`);
    if (currentReview?.[field] !== value) mismatches.push(`canonical.${field}`);
    if (field !== 'run_id' && field !== 'review_id' && runtimeBinding[field] !== value) {
      mismatches.push(`runtime.${field}`);
    }
  }
  if (review?.meta?.source_file !== currentReview?.source_file
      || review?.meta?.source_kind !== currentReview?.source_kind
      || review?.meta?.source_version !== currentReview?.source_version) {
    mismatches.push('source_identity');
  }
  if (currentReview) {
    const projection = currentReview.projection;
    const expectedReviewResult = {
      schema_version: 2,
      ...projection,
      next_command: projection.approval_recommendation === 'revise'
        ? 'npx create-quiver ai revise --phase technical-plan --input <feedback.md> --dry-run'
        : `npx create-quiver ai approve --phase technical-plan --version ${currentReview.source_version || '<n>'}`,
      risks: projection.later_phase_transfers,
      findings: (state.findings || []).filter((finding) => finding.state === 'open'),
      source: 'governed-canonical',
    };
    if (stableStringify(review?.meta?.review_result) !== stableStringify(expectedReviewResult)) {
      mismatches.push('review_result_projection');
    }
  }

  if (mismatches.length > 0) {
    throw new GovernanceError(
      'GOVERNANCE_STATE_INVALID',
      `The current plan review is not correlated with governed run '${run.run_id}'.`,
      { run_id: run.run_id, mismatches: [...new Set(mismatches)] },
    );
  }
  return currentReview;
}

function normalizeRunArtifactPath(repoRoot, value) {
  if (!value) return '';
  const resolved = path.isAbsolute(value) ? value : path.resolve(repoRoot, value);
  return path.relative(repoRoot, resolved).split(path.sep).join('/');
}

function assertGovernedRunOwnsArtifact(repoRoot, run, phase, artifactPath) {
  const expectedArtifact = normalizeRunArtifactPath(repoRoot, artifactPath);
  const matchingHistory = [...(run.history || [])].reverse().find((event) => (
    event?.phase === phase
    && normalizeRunArtifactPath(repoRoot, event.artifact) === expectedArtifact
  ));
  if (!expectedArtifact || !matchingHistory) {
    throw new GovernanceError(
      'GOVERNANCE_STATE_INVALID',
      `Artifact '${expectedArtifact || '(missing)'}' is not owned by governed run '${run.run_id}' at phase '${phase}'.`,
      { run_id: run.run_id, phase, artifact: expectedArtifact || null },
    );
  }
}

function assertGovernedApprovalCandidateCorrelation(repoRoot, run, phase, version, review = null) {
  const report = buildApprovalCandidateReport(repoRoot, phase);
  const candidates = report.candidates.filter((item) => Number(item.version) === Number(version));
  if (candidates.length !== 1) {
    throw new GovernanceError(
      candidates.length === 0 ? 'GOVERNANCE_STATE_INVALID' : 'REPRESENTATION_MISMATCH',
      candidates.length === 0
        ? `Approval candidate v${version} is not available for governed run '${run.run_id}'.`
        : `Approval candidate v${version} is represented ${candidates.length} times.`,
      { run_id: run.run_id, phase, version: Number(version) || null, candidate_count: candidates.length },
    );
  }
  const candidate = candidates[0];
  assertGovernedRunOwnsArtifact(repoRoot, run, `${phase}-draft`, candidate.path);
  const latestDraftEvent = [...(run.history || [])].reverse().find((event) => (
    event?.phase === `${phase}-draft`
  ));
  if (!latestDraftEvent
      || normalizeRunArtifactPath(repoRoot, latestDraftEvent.artifact)
        !== normalizeRunArtifactPath(repoRoot, candidate.path)) {
    throw new GovernanceError(
      'APPROVAL_BINDING_MISMATCH',
      `Approval candidate v${candidate.version} is not the latest ${phase} draft owned by run '${run.run_id}'.`,
      {
        run_id: run.run_id,
        phase,
        version: candidate.version,
        mismatches: ['latest_run_draft'],
      },
    );
  }
  if (phase === 'technical-plan'
      && (Number(review?.meta?.source_version) !== Number(candidate.version)
        || normalizeRunArtifactPath(repoRoot, review?.meta?.source_file)
          !== normalizeRunArtifactPath(repoRoot, candidate.path))) {
    throw new GovernanceError(
      'GOVERNANCE_STATE_INVALID',
      `The governed plan review does not target technical-plan candidate v${candidate.version}.`,
      { run_id: run.run_id, version: candidate.version },
    );
  }
}

function normalizeAnalyzeBudget(value, fallback, flagName) {
  if (typeof value === 'undefined' || value === null || value === '') {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(formatError(`invalid value for ${flagName}`));
  }
  return parsed;
}

function mergeReasonSummaries(...summaries) {
  const merged = {};
  for (const summary of summaries) {
    for (const [reason, count] of Object.entries(summary || {})) {
      merged[reason] = (merged[reason] || 0) + count;
    }
  }
  return Object.keys(merged)
    .sort()
    .reduce((acc, reason) => {
      acc[reason] = merged[reason];
      return acc;
    }, {});
}

function limitList(items, maxItems = 30) {
  const list = Array.isArray(items) ? items : [];
  return {
    items: list.slice(0, maxItems),
    hidden: Math.max(0, list.length - maxItems),
  };
}

function formatAnalyzeProjectIssues(issues = [], maxIssues = 8) {
  const groups = groupAnalyzeProjectIssues(issues, { maxExamplesPerGroup: 1 });
  const visible = groups.slice(0, maxIssues);
  const lines = visible.map((group) => {
    const example = group.examples[0];
    const exampleText = example
      ? ` Example: ${example.path || 'analysis'} - ${example.message}`
      : '';
    return `- ${group.path_family}: ${group.type} (${group.count} issue${group.count === 1 ? '' : 's'}). Cause: ${group.cause_hint}${exampleText}`;
  });
  const hidden = groups.length - visible.length;
  if (hidden > 0) {
    lines.push(`- ... ${hidden} more issue group${hidden === 1 ? '' : 's'}`);
  }
  return lines;
}

function formatAnalyzeProjectRecoveryLines(recovery, translator = createTranslator('en')) {
  if (!recovery || recovery.reason !== 'evidence_not_selected') {
    return [];
  }

  const lines = [
    '',
    translator.t('analyze_project.recovery.title'),
  ];

  if (recovery.command) {
    lines.push(
      translator.t('analyze_project.recovery.reason'),
      translator.t('analyze_project.recovery.recommended_command'),
      recovery.command,
    );
  } else {
    lines.push(translator.t('analyze_project.recovery.safe_fallback'));
  }

  if (recovery.budget) {
    lines.push(translator.t('analyze_project.recovery.budget', {
      files: recovery.budget.recommended_max_files || 0,
      bytes: recovery.budget.recommended_max_bytes || 0,
    }));
  }

  for (const warning of recovery.warnings || []) {
    lines.push(`${translator.t('analyze_project.recovery.warning')}: ${warning}`);
  }

  return lines;
}

function enhanceAnalyzeProjectAnalysisError(error, options = {}) {
  if (!error || error.code !== 'AI_ANALYZE_PROJECT_INVALID') {
    return error;
  }

  const issueLines = formatAnalyzeProjectIssues(error.issues);
  if (issueLines.length === 0) {
    return error;
  }

  const wrapped = new Error([
    error.message,
    ...formatAnalyzeProjectRecoveryLines(options.recovery, options.translator),
    'Issues:',
    ...issueLines,
    options.repairManifest?.path ? `Repair manifest: ${options.repairManifest.path}` : '',
    options.retryManifest?.path ? `Retry manifest: ${options.retryManifest.path}` : '',
    options.validationManifest?.path ? `Validation manifest: ${options.validationManifest.path}` : '',
    'Next safe step: inspect the selected evidence with `npx create-quiver ai analyze-project --deep --dry-run --json`, then rerun live. If provider drift repeats, reduce --max-files or --max-bytes.',
  ].filter(Boolean).join('\n'));
  wrapped.name = error.name;
  wrapped.code = error.code;
  wrapped.cause = error;
  wrapped.issues = error.issues;
  wrapped.details = error.issues;
  wrapped.repair_manifest = options.repairManifest || null;
  wrapped.retry_manifest = options.retryManifest || null;
  wrapped.validation_manifest = options.validationManifest || null;
  wrapped.recovery = options.recovery || null;
  return wrapped;
}

function buildAnalyzeProjectEvidenceRecovery(repoRoot, error, report, options = {}) {
  const issues = Array.isArray(error?.issues) ? error.issues : [];
  if (!issues.some((issue) => (issue.issue || issue.code) === 'evidence-not-selected')) {
    return null;
  }

  const classification = classifyEvidenceRecoveryIssues(repoRoot, issues, {
    selectedFiles: report.selected_files || [],
    omittedFiles: report.omitted_files || [],
    safetyExclusions: report.safety_exclusions || [],
  });
  const payload = buildEvidenceRecoveryPayload(classification, {
    budgets: report.budgets || {},
    deep: report.options?.deep === true || options.deep === true,
    includeDb: report.options?.include_db === true,
    includeSource: report.options?.include_source === true,
    includeTests: report.options?.include_tests === true,
    lang: options.language,
    model: options.model,
    provider: options.provider,
    scope: options.scope,
    strict: options.strict === true,
  });

  return {
    ...payload,
    classification,
  };
}

function formatAnalyzeProjectFileLine(file) {
  const details = [];
  if (Array.isArray(file.signals) && file.signals.length > 0) {
    details.push(file.signals.join(', '));
  }
  if (typeof file.bytes === 'number') {
    details.push(`${file.bytes} bytes`);
  }
  if (file.reason) {
    details.push(file.reason);
  }
  return `- ${file.path}${details.length > 0 ? ` (${details.join('; ')})` : ''}`;
}

function formatAnalyzeProjectReport(report) {
  const selected = limitList(report.selected_files, 80);
  const omitted = limitList(report.omitted_files, 30);
  const safety = limitList(report.safety_exclusions, 30);
  const workspaces = limitList(report.roots.workspaces, 20);
  const lines = [
    'AI analyze-project read-only analysis',
    `Mode: ${report.mode}`,
    `Dry-run: ${report.dry_run ? 'yes' : 'no'} (dry-run never writes)`,
    `Provider execution: ${report.provider_execution}`,
    `Writes: ${report.writes.length === 0 ? 'none' : report.writes.join(', ')}`,
    `Project: ${report.project.name}`,
    `Scope: ${report.options.scope}`,
    `Budgets: ${report.budgets.selected_files}/${report.budgets.max_files} files, ${report.budgets.selected_bytes}/${report.budgets.max_bytes} bytes`,
    `Selected files: ${report.selected_files.length}`,
    `Omitted files: ${report.omitted_files.length}`,
    `Safety exclusions: ${report.safety_exclusions.length}`,
    '',
    'Workspace roots:',
  ];

  for (const workspace of workspaces.items) {
    lines.push(`- ${workspace.path} (${workspace.name}; ${workspace.source})`);
  }
  if (workspaces.hidden > 0) {
    lines.push(`- ... ${workspaces.hidden} more`);
  }

  lines.push('', `Detected stack: ${report.detected.stack.length > 0 ? report.detected.stack.join(', ') : 'unknown'}`);
  lines.push(`Source roots: ${report.detected.source_roots.length > 0 ? report.detected.source_roots.join(', ') : 'none'}`);
  lines.push(`Entrypoints: ${report.detected.entrypoints.length > 0 ? report.detected.entrypoints.join(', ') : 'none'}`);
  lines.push(`Configs: ${report.detected.configs.length > 0 ? report.detected.configs.join(', ') : 'none'}`);
  lines.push(`Lockfiles: ${(report.detected.lockfiles || []).length > 0
    ? report.detected.lockfiles.map((file) => `${file.path} (${file.package_manager}; metadata only)`).join(', ')
    : 'none'}`);

  lines.push('', 'Selected files:');
  for (const file of selected.items) {
    lines.push(formatAnalyzeProjectFileLine(file));
  }
  if (selected.hidden > 0) {
    lines.push(`- ... ${selected.hidden} more`);
  }
  if (selected.items.length === 0) {
    lines.push('- none');
  }

  lines.push('', 'Omitted files:');
  for (const file of omitted.items) {
    lines.push(formatAnalyzeProjectFileLine(file));
  }
  if (omitted.hidden > 0) {
    lines.push(`- ... ${omitted.hidden} more`);
  }
  if (omitted.items.length === 0) {
    lines.push('- none');
  }

  lines.push('', 'Safety exclusions:');
  for (const file of safety.items) {
    lines.push(`- ${file.path} (${file.reason})`);
  }
  if (safety.hidden > 0) {
    lines.push(`- ... ${safety.hidden} more`);
  }
  if (safety.items.length === 0) {
    lines.push('- none');
  }

  lines.push('', 'Next commands:');
  for (const command of report.next_commands) {
    lines.push(`- ${command}`);
  }

  return `${lines.join('\n')}\n`;
}

function buildAnalyzeProjectReport(repoRoot, options = {}) {
  const deep = options.deep === true;
  const includeSource = options.includeSource === true || deep;
  const includeDb = options.includeDb === true || deep;
  const includeTests = options.includeTests === true;
  const maxFiles = normalizeAnalyzeBudget(options.maxFiles, DEFAULT_ANALYZE_MAX_FILES, '--max-files');
  const maxBytes = normalizeAnalyzeBudget(options.maxBytes, DEFAULT_ANALYZE_MAX_BYTES, '--max-bytes');
  const discovery = discoverProjectFiles(repoRoot, { scope: options.scope || '' });
  const sample = sampleProjectFiles(discovery.files, {
    includeDb,
    includeSource,
    includeTests,
    maxBytes,
    maxFiles,
  });
  const omittedFiles = [
    ...sample.omittedFiles,
    ...discovery.skippedFiles.map((file) => ({
      path: file.path,
      reason: file.reason,
    })),
  ].sort((a, b) => a.path.localeCompare(b.path));
  const omittedSummary = mergeReasonSummaries(
    sample.omittedSummary,
    discovery.skippedSummary,
  );

  return {
    schema_version: 1,
    kind: ANALYZE_PROJECT_KIND,
    command: 'ai analyze-project',
    mode: 'read-only',
    dry_run: options.dryRun === true,
    read_only: true,
    provider_execution: 'skipped',
    writes: [],
    project: discovery.project,
    options: {
      deep,
      scope: discovery.roots.analysis_root,
      max_files: maxFiles,
      max_bytes: maxBytes,
      include_source: includeSource,
      include_tests: includeTests,
      include_db: includeDb,
    },
    roots: discovery.roots,
    detected: discovery.detected,
    budgets: sample.budgets,
    selected_files: sample.selectedFiles,
    omitted_files: omittedFiles,
    omitted_summary: omittedSummary,
    safety_exclusions: discovery.safetyExclusions,
    safety_summary: discovery.safetySummary,
    next_commands: [
      'npx create-quiver ai analyze-project --deep --dry-run --json',
      'npx create-quiver ai analyze-project --deep --review',
    ],
  };
}

function limitProviderArtifactText(text, maxBytes = 12_000) {
  let value = String(text || '');
  const redacted = value;
  if (byteLength(redacted) <= maxBytes) {
    return {
      text: redacted,
      truncated: false,
      bytes: byteLength(redacted),
    };
  }

  value = redacted;
  while (byteLength(value) > maxBytes && value.length > 0) {
    value = value.slice(0, Math.max(0, value.length - Math.ceil((byteLength(value) - maxBytes) / 2) - 16));
  }

  return {
    text: `${value.trimEnd()}\n[TRUNCATED BY QUIVER]\n`,
    truncated: true,
    bytes: byteLength(redacted),
  };
}

function buildAnalyzeProjectProviderArtifact(result, clean, repoRoot, options = {}) {
  const rawOutput = clean?.cleanOutput || result?.stdout || result?.stderr || '';
  const redactedOutput = redactSensitiveLocalValues(rawOutput, { projectRoot: repoRoot });
  const limited = limitProviderArtifactText(redactedOutput, options.maxBytes || 12_000);
  return {
    schema_version: 1,
    kind: 'quiver-analyze-project-provider-artifact',
    persisted: false,
    redacted: true,
    size_limited: true,
    provider: result?.provider || null,
    command: result?.command || null,
    exit_code: typeof result?.exitCode === 'number' ? result.exitCode : null,
    output_source: clean?.source || 'unknown',
    output_bytes: limited.bytes,
    output_truncated: limited.truncated,
    output: limited.text,
  };
}

function createAnalyzeProjectAuditRunId(now = new Date()) {
  const date = now instanceof Date ? now : new Date(now || Date.now());
  return `run-${date.toISOString()
    .replace(/\.\d{3}Z$/, 'z')
    .replace(/[^0-9a-z]+/gi, '-')
    .toLowerCase()
    .replace(/^-+|-+$/g, '')}`;
}

function writeAnalyzeProjectRunStatus(repoRoot, runId, status, details = {}) {
  const statusPath = path.join(repoRoot, '.quiver', 'runs', runId, 'status.json');
  fs.mkdirSync(path.dirname(statusPath), { recursive: true });
  fs.writeFileSync(statusPath, `${JSON.stringify({
    schema_version: 1,
    kind: 'quiver-analyze-project-run-status',
    run_id: runId,
    status,
    updated_at: (details.now instanceof Date ? details.now : new Date(details.now || Date.now())).toISOString(),
    provider: details.provider || null,
    attempts: details.attempts || [],
    artifacts: details.artifacts || {},
  }, null, 2)}\n`);
  return path.relative(repoRoot, statusPath).split(path.sep).join('/');
}

function normalizeAnalyzeProjectMaxRetries(value) {
  if (value === undefined || value === null || value === '') {
    return 1;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 1;
  }
  return Math.min(2, Math.floor(parsed));
}

function isAnalyzeProjectRetryableError(error) {
  if (!error || error.code !== 'AI_ANALYZE_PROJECT_INVALID') {
    return false;
  }
  const retryableIssues = new Set([
    'empty-output',
    'malformed-json',
    'invalid_type',
    'invalid_value',
    'unrecognized_keys',
    'missing-evidence',
    'evidence-not-selected',
    'unapproved-doc-update-path',
  ]);
  const issues = Array.isArray(error.issues) ? error.issues : [];
  return issues.length > 0 && issues.every((issue) => retryableIssues.has(issue.issue || ''));
}

function formatAnalyzeProjectLiveReport(report) {
  const warningCount = report.analysis_validation?.warnings?.length || 0;
  const docUpdatePaths = report.analysis_validation?.doc_update_paths || [];
  const lines = [
    'AI analyze-project provider analysis',
    `Mode: ${report.mode}`,
    `Provider: ${report.provider}`,
    `Provider execution: ${report.provider_execution}`,
    `Provider attempts: ${report.provider_attempts?.length || 1}`,
    `Writes: ${report.writes.length === 0 ? 'none' : report.writes.join(', ')}`,
    `Privacy preflight: ${report.privacy_preflight.ok ? 'passed' : 'failed'}`,
    `Prompt bytes: ${report.prompt.bytes}/${report.prompt.max_provider_prompt_bytes}`,
    `Selected files: ${report.selected_files.length}`,
    `Omitted files: ${report.omitted_files.length}`,
    `Safety exclusions: ${report.safety_exclusions.length}`,
    `Analysis validation: passed (${warningCount} warning${warningCount === 1 ? '' : 's'})`,
    `Doc update proposals: ${docUpdatePaths.length > 0 ? docUpdatePaths.join(', ') : 'none'}`,
  ];

  if (warningCount > 0) {
    lines.push('', 'Warnings:');
    for (const warning of report.analysis_validation.warnings.slice(0, 20)) {
      lines.push(`- ${warning.path}: ${warning.issue}`);
    }
  }

  lines.push('', 'Next commands:');
  lines.push('- npx create-quiver ai analyze-project --deep --save-proposal --provider <provider> --model <model>');
  lines.push('- npx create-quiver ai analyze-project --deep --review');
  lines.push('- npx create-quiver ai analyze-project --deep --json');

  return `${lines.join('\n')}\n`;
}

function summarizeAnalyzeProjectWritePlan(writePlan = []) {
  return writePlan.map((item) => ({
    path: item.path,
    action: item.action,
    dirty: item.dirty,
    before_sha256: item.before_sha256,
    after_sha256: item.after_sha256,
    reason: item.reason,
    merge_report: item.merge_report,
  }));
}

function formatAnalyzeProjectSavedProposalReport(report = {}) {
  const artifacts = report.proposal_artifacts || {};
  const changed = report.write_plan?.filter((item) => item.action !== 'skip') || [];
  const lines = [
    'AI analyze-project proposal saved',
    `Run: ${report.run_id || 'unknown'}`,
    `Provider: ${report.provider || 'unknown'}`,
    `Writes: none (final docs were not modified)`,
    `Proposed docs: ${report.doc_paths?.length || 0}`,
    `Docs with changes: ${changed.length}`,
    `Proposal JSON: ${artifacts.proposal_json || 'none'}`,
    `Proposal summary: ${artifacts.proposal_markdown || 'none'}`,
    `Proposal diff: ${artifacts.proposal_diff || 'none'}`,
    `Manifest: ${artifacts.manifest || 'none'}`,
  ];
  lines.push(...formatAnalyzeProjectMergeSummary(report.write_plan));
  lines.push(
    '',
    'Next commands:',
    `- npx create-quiver ai analyze-project apply --run ${report.run_id || '<run-id>'}`,
    '- npx create-quiver ai analyze-project --deep --apply-docs --provider <provider> --model <model>',
  );
  return `${lines.join('\n')}\n`;
}

function formatAnalyzeProjectMergeSummary(writePlan = []) {
  const changed = (Array.isArray(writePlan) ? writePlan : []).filter((item) => item.action !== 'skip');
  if (changed.length === 0) {
    return [];
  }

  const lines = ['', 'Merge decisions:'];
  for (const item of changed.slice(0, 10)) {
    const merge = item.merge_report || {};
    const details = [
      merge.classification ? `class=${merge.classification}` : '',
      merge.scaffold_replaced ? 'scaffold replaced' : '',
      merge.human_content_preserved ? 'human preserved' : '',
      merge.context_prep_removed ? 'context-prep removed' : '',
      Array.isArray(merge.critical_placeholders) && merge.critical_placeholders.length > 0
        ? `placeholders=${merge.critical_placeholders.length}`
        : '',
    ].filter(Boolean);
    lines.push(`- ${item.path}: ${merge.strategy || 'unknown'}${details.length > 0 ? ` (${details.join(', ')})` : ''}`);
    for (const warning of Array.isArray(merge.warnings) ? merge.warnings.slice(0, 2) : []) {
      lines.push(`  warning: ${warning}`);
    }
  }
  if (changed.length > 10) {
    lines.push(`- ... ${changed.length - 10} more doc merge decision${changed.length - 10 === 1 ? '' : 's'}`);
  }
  return lines;
}

function formatAnalyzeProjectPostWriteValidation(validation) {
  if (!validation) {
    return [];
  }
  const warningCount = validation.warnings?.length || 0;
  const errorCount = validation.errors?.length || 0;
  const lines = [
    `Post-write validation: ${validation.ok ? 'passed' : 'failed'} (${errorCount} error${errorCount === 1 ? '' : 's'}, ${warningCount} warning${warningCount === 1 ? '' : 's'})`,
  ];
  for (const issue of [...(validation.errors || []), ...(validation.warnings || [])].slice(0, 20)) {
    lines.push(`- ${issue.path || 'analysis'}: ${issue.issue} - ${issue.message}`);
  }
  return lines;
}

function formatAnalyzeProjectReviewPlan({ writePlan, reviewPath, snapshot, writtenDocs, completed = false, validation = null } = {}) {
  const changed = (writePlan || []).filter((item) => item.action !== 'skip');
  const dirty = changed.filter((item) => item.dirty);
  const lines = [
    completed ? 'AI analyze-project docs written' : 'AI analyze-project review write plan',
    `Review artifact: ${reviewPath || 'none'}`,
    `Writes: ${changed.length > 0 ? changed.map((item) => item.path).join(', ') : 'none'}`,
    `Dirty target docs: ${dirty.length > 0 ? dirty.map((item) => item.path).join(', ') : 'none'}`,
  ];

  if (snapshot) {
    lines.push(`Snapshot: ${snapshot.root}`);
    lines.push(`Manifest: ${snapshot.manifestPath}`);
  }
  if (completed) {
    lines.push(`Written docs: ${writtenDocs && writtenDocs.length > 0 ? writtenDocs.join(', ') : 'none'}`);
    lines.push(...formatAnalyzeProjectPostWriteValidation(validation));
    return `${lines.join('\n')}\n`;
  }

  lines.push('', 'Proposed changes:');
  for (const item of writePlan || []) {
    lines.push(`- ${item.path}: ${item.action}${item.reason ? ` (${item.reason})` : ''}`);
  }
  lines.push(...formatAnalyzeProjectMergeSummary(writePlan));
  lines.push('', 'Final diff:');
  lines.push(...formatAnalyzeProjectDiffPreview(writePlan || []));
  lines.push('', 'Confirmation required before writing.');

  return `${lines.join('\n')}\n`;
}

function formatAnalyzeProjectApplyReport(report = {}) {
  const artifacts = report.proposal_artifacts || {};
  const writeManifest = report.write_manifest || {};
  const changed = report.write_plan?.filter((item) => item.action !== 'skip') || [];
  const dirty = changed.filter((item) => item.dirty);
  const lines = [
    'AI analyze-project docs applied',
    `Run: ${report.run_id || 'unknown'}`,
    `Provider: ${report.provider || 'unknown'}`,
    report.provider_execution ? `Provider execution: ${report.provider_execution}` : '',
    report.apply_run ? `Saved proposal edited: ${report.saved_proposal?.proposal_edited ? 'yes' : 'no'}` : '',
    `Writes: ${changed.length > 0 ? changed.map((item) => item.path).join(', ') : 'none'}`,
    `Dirty target docs: ${dirty.length > 0 ? dirty.map((item) => item.path).join(', ') : 'none'}`,
    `Written docs: ${report.written_docs?.length > 0 ? report.written_docs.join(', ') : 'none'}`,
    `Snapshot: ${report.snapshot?.root || 'none'}`,
    `Proposal manifest: ${artifacts.manifest || 'none'}`,
    `Write manifest: ${writeManifest.path || 'none'}`,
  ].filter(Boolean);
  lines.push(...formatAnalyzeProjectMergeSummary(report.write_plan));
  lines.push(...formatAnalyzeProjectPostWriteValidation(report.post_write_validation));
  return `${lines.join('\n')}\n`;
}

function formatAnalyzeProjectApplyPreflightError(error) {
  if (!error || error.code !== 'AI_ANALYZE_PROJECT_APPLY_BLOCKED') {
    return error;
  }

  const issueLines = (error.issues || []).slice(0, 12).map((issue) => {
    const hashes = issue.expected_sha256 || issue.current_sha256
      ? ` expected=${issue.expected_sha256 || 'none'} current=${issue.current_sha256 || 'none'}`
      : '';
    return `- ${issue.path || 'docs'}: ${issue.issue}${hashes} - ${issue.message}`;
  });
  const wrapped = new Error([
    error.message,
    'Issues:',
    ...issueLines,
    error.apply_run
      ? 'Next safe step: inspect `.quiver/runs/<run-id>/proposal/analyze-project-doc-proposal.diff`, then rerun with an explicit run id. Add `--allow-dirty-docs` only if overwriting existing managed docs is intended.'
      : 'Next safe step: rerun with `--review`, or inspect with `--save-proposal`, or add `--allow-dirty-docs` if overwriting existing managed docs is intended.',
  ].join('\n'));
  wrapped.name = error.name;
  wrapped.code = error.code;
  wrapped.cause = error;
  wrapped.issues = error.issues;
  return wrapped;
}

function resolveAnalyzeProjectSavedProposalRunId(repoRoot, options = {}) {
  const requestedRunId = String(options.runId || '').trim();
  if (requestedRunId !== 'latest') {
    return { runId: requestedRunId, requestedRunId };
  }

  if (!canUseInteractiveTerminal(options)) {
    throw analyzeProjectContractError(
      'ai analyze-project apply --run latest requires an interactive terminal.',
      'Use an explicit run id for automation: `npx create-quiver ai analyze-project apply --run <run-id>`.',
    );
  }

  const latestRunId = findLatestAnalyzeProjectSavedProposalRun(repoRoot);
  if (!latestRunId) {
    throw analyzeProjectContractError(
      'ai analyze-project apply --run latest could not find a saved proposal.',
      'Create one first: `npx create-quiver ai analyze-project --deep --save-proposal --provider <provider> --model <model>`.',
    );
  }

  if (options.json !== true) {
    process.stdout.write(`Resolved latest analyze-project proposal: ${latestRunId}\n`);
  }
  return { runId: latestRunId, requestedRunId };
}

function analyzeProjectRawProviderArtifactPaths(rawProviderArtifacts = []) {
  return (Array.isArray(rawProviderArtifacts) ? rawProviderArtifacts : [])
    .map((artifact) => (typeof artifact === 'string' ? artifact : artifact?.path))
    .filter(Boolean);
}

function summarizeAnalyzeProjectProposalArtifacts(proposalArtifacts = {}) {
  return {
    root: proposalArtifacts.root,
    proposal_json: proposalArtifacts.proposal_json,
    proposal_markdown: proposalArtifacts.proposal_markdown,
    proposal_diff: proposalArtifacts.proposal_diff,
    manifest: proposalArtifacts.manifest,
    proposal_sha256: proposalArtifacts.proposal_sha256,
  };
}

function listAnalyzeProjectProposalArtifactFiles(proposalArtifacts = {}) {
  if (Array.isArray(proposalArtifacts.files)) {
    return proposalArtifacts.files.filter(Boolean);
  }
  return [
    proposalArtifacts.proposal_json,
    proposalArtifacts.proposal_markdown,
    proposalArtifacts.proposal_diff,
    proposalArtifacts.manifest,
  ].filter(Boolean);
}

function saveAnalyzeProjectDocProposalReport(repoRoot, options = {}) {
  const proposalArtifacts = writeAnalyzeProjectProposalArtifacts(repoRoot, {
    runId: options.auditRunId,
    now: options.commandOptions?.now || new Date(),
    provider: options.provider,
    language: options.commandOptions?.language,
    proposal: options.proposal,
    writePlan: options.writePlan,
    selectedContextManifest: options.selectedContextManifest,
    repairManifest: options.repairManifest,
    events: options.interactiveAction ? [{
      type: 'interactive-action',
      action: options.interactiveAction,
      at: (options.commandOptions?.now instanceof Date
        ? options.commandOptions.now
        : new Date(options.commandOptions?.now || Date.now())).toISOString(),
    }] : [],
  });
  const saveReport = {
    ...options.completedReport,
    save_proposal: true,
    interactive_action: options.interactiveAction || undefined,
    doc_proposal: options.proposal,
    doc_paths: proposalArtifacts.doc_paths,
    proposal_artifacts: summarizeAnalyzeProjectProposalArtifacts(proposalArtifacts),
    write_plan: summarizeAnalyzeProjectWritePlan(options.writePlan),
  };
  writeAnalyzeProjectRunStatus(repoRoot, options.auditRunId, 'proposal-saved', {
    now: options.commandOptions?.now,
    provider: options.provider,
    attempts: options.providerAttempts,
    artifacts: {
      selected_context: options.selectedContextManifest,
      raw_provider: analyzeProjectRawProviderArtifactPaths(options.rawProviderArtifacts),
      repair: options.repairManifest,
      retry: options.retryManifest,
      proposal_manifest: proposalArtifacts.manifest,
      proposal_files: proposalArtifacts.files,
    },
  });
  return saveReport;
}

function applyAnalyzeProjectDocProposalReport(repoRoot, options = {}) {
  let applyReport;
  try {
    applyReport = applyAnalyzeProjectDocProposal(repoRoot, {
      report: options.completedReport,
      runId: options.auditRunId,
      now: options.commandOptions?.now || new Date(),
      provider: options.provider,
      language: options.commandOptions?.language,
      proposal: options.proposal,
      providerArtifact: options.completedReport.provider_artifact,
      selectedContextManifest: options.selectedContextManifest,
      repairManifest: options.repairManifest,
      strict: options.commandOptions?.strict === true,
      allowDirtyDocs: options.allowDirtyDocs === true,
      summarizeWritePlan: summarizeAnalyzeProjectWritePlan,
    });
  } catch (error) {
    const proposalArtifacts = error.proposal_artifacts || {};
    writeAnalyzeProjectRunStatus(repoRoot, options.auditRunId, error.code === 'AI_ANALYZE_PROJECT_APPLY_BLOCKED' ? 'apply-blocked' : 'apply-failed', {
      now: options.commandOptions?.now,
      provider: options.provider,
      attempts: options.providerAttempts,
      artifacts: {
        selected_context: options.selectedContextManifest,
        raw_provider: analyzeProjectRawProviderArtifactPaths(options.rawProviderArtifacts),
        repair: options.repairManifest,
        retry: options.retryManifest,
        proposal_manifest: proposalArtifacts.manifest || null,
        proposal_files: listAnalyzeProjectProposalArtifactFiles(proposalArtifacts),
        write_manifest: error.write_manifest?.path || null,
        snapshot_manifest: error.snapshot?.manifestPath || null,
      },
    });
    throw formatAnalyzeProjectApplyPreflightError(error);
  }

  applyReport = {
    ...applyReport,
    interactive_action: options.interactiveAction || applyReport.interactive_action,
  };
  writeAnalyzeProjectRunStatus(repoRoot, options.auditRunId, applyReport.post_write_validation?.ok ? 'docs-applied' : 'apply-validation-failed', {
    now: options.commandOptions?.now,
    provider: options.provider,
    attempts: options.providerAttempts,
    artifacts: {
      selected_context: options.selectedContextManifest,
      raw_provider: analyzeProjectRawProviderArtifactPaths(options.rawProviderArtifacts),
      repair: options.repairManifest,
      retry: options.retryManifest,
      proposal_manifest: applyReport.proposal_artifacts?.manifest,
      proposal_files: listAnalyzeProjectProposalArtifactFiles(applyReport.proposal_artifacts),
      write_manifest: applyReport.write_manifest?.path,
      snapshot_manifest: applyReport.snapshot?.manifestPath,
    },
  });
  return applyReport;
}

function applyAnalyzeProjectSavedProposalRun(repoRoot, options = {}) {
  const { runId, requestedRunId } = resolveAnalyzeProjectSavedProposalRunId(repoRoot, options);
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  const saved = readAnalyzeProjectSavedProposal(repoRoot, runId);
  const provider = saved.manifest.provider || null;
  const runStatusPath = path.join('.quiver', 'runs', runId, 'status.json').split(path.sep).join('/');
  const baseReport = {
    schema_version: 1,
    kind: 'quiver-project-analysis-apply-saved-proposal',
    command: 'ai analyze-project apply',
    mode: 'apply-saved-proposal',
    apply_run: true,
    requested_run_id: requestedRunId,
    run_id: runId,
    provider,
    provider_execution: 'skipped',
    writes: [],
    doc_proposal: saved.proposal,
    saved_proposal: {
      requested_run_id: requestedRunId,
      run_id: runId,
      manifest: saved.artifacts.manifest,
      proposal_json: saved.artifacts.proposal_json,
      proposal_sha256: saved.proposal_sha256,
      proposal_edited: saved.proposal_edited,
    },
    run_status_path: runStatusPath,
  };
  const events = [
    {
      type: 'saved-proposal-apply',
      at: now.toISOString(),
      requested_run_id: requestedRunId,
      run_id: runId,
    },
  ];
  if (saved.proposal_edited) {
    events.push({
      type: 'saved-proposal-edited',
      at: now.toISOString(),
      original_sha256: saved.manifest.proposal_sha256,
      current_sha256: saved.proposal_sha256,
    });
  }

  let applyReport;
  try {
    applyReport = applyAnalyzeProjectDocProposal(repoRoot, {
      report: baseReport,
      runId,
      now,
      provider,
      language: saved.manifest.language,
      proposal: saved.proposal,
      proposalArtifacts: saved.artifacts,
      proposalManifest: saved.manifest,
      proposalEdited: saved.proposal_edited,
      strict: options.strict === true,
      allowDirtyDocs: options.allowDirtyDocs === true,
      summarizeWritePlan: summarizeAnalyzeProjectWritePlan,
      events,
    });
  } catch (error) {
    error.apply_run = true;
    const proposalArtifacts = error.proposal_artifacts || saved.artifacts || {};
    writeAnalyzeProjectRunStatus(repoRoot, runId, error.code === 'AI_ANALYZE_PROJECT_APPLY_BLOCKED' ? 'apply-blocked' : 'apply-failed', {
      now,
      provider,
      attempts: [],
      artifacts: {
        proposal_manifest: proposalArtifacts.manifest || saved.artifacts.manifest,
        proposal_files: listAnalyzeProjectProposalArtifactFiles(proposalArtifacts),
        write_manifest: error.write_manifest?.path || null,
        snapshot_manifest: error.snapshot?.manifestPath || null,
      },
    });
    throw formatAnalyzeProjectApplyPreflightError(error);
  }

  applyReport = {
    ...applyReport,
    apply_run: true,
    requested_run_id: requestedRunId,
    saved_proposal: baseReport.saved_proposal,
    run_status_path: runStatusPath,
  };
  writeAnalyzeProjectRunStatus(repoRoot, runId, applyReport.post_write_validation?.ok ? 'docs-applied' : 'apply-validation-failed', {
    now,
    provider,
    attempts: [],
    artifacts: {
      proposal_manifest: applyReport.proposal_artifacts?.manifest,
      proposal_files: listAnalyzeProjectProposalArtifactFiles(applyReport.proposal_artifacts),
      write_manifest: applyReport.write_manifest?.path,
      snapshot_manifest: applyReport.snapshot?.manifestPath,
    },
  });
  return emitAnalyzeProjectApplyReport(applyReport, options);
}

function emitAnalyzeProjectApplyReport(applyReport, options = {}) {
  if (options.json === true) {
    process.stdout.write(`${JSON.stringify(applyReport, null, 2)}\n`);
  } else {
    process.stdout.write(formatAnalyzeProjectApplyReport(applyReport));
  }
  if (!applyReport.post_write_validation?.ok) {
    const error = new Error(formatError('ai analyze-project post-write validation failed.'));
    error.code = 'AI_ANALYZE_PROJECT_POST_WRITE_VALIDATION_FAILED';
    error.validation = applyReport.post_write_validation;
    throw error;
  }
  return applyReport;
}

async function reviewAndWriteAnalyzeProjectDocs(repoRoot, options = {}) {
  const commandOptions = options.commandOptions || {};
  const reviewed = await reviewAnalyzeProjectDocProposal(repoRoot, options.initialProposal, commandOptions);
  const writePlan = buildAnalyzeProjectWritePlan(repoRoot, reviewed.proposal);
  process.stdout.write(formatAnalyzeProjectReviewPlan({
    writePlan,
    reviewPath: reviewed.reviewPath,
  }));
  await confirmAnalyzeProjectWrites(writePlan, commandOptions);
  const lifecycleRun = ensureAiRun(repoRoot, {
    command: 'ai analyze-project',
    input: reviewed.reviewPath,
    runId: commandOptions.runId,
    phase: 'created',
  });
  const snapshot = createAnalyzeProjectSnapshot(repoRoot, lifecycleRun, writePlan, {
    providerArtifact: options.completedReport.provider_artifact,
    proposal: reviewed.proposal,
    now: commandOptions.now || new Date(),
  });
  const writtenDocs = writeAnalyzeProjectDocs(writePlan);
  let writeReport = {
    ...options.completedReport,
    review: true,
    interactive_action: options.interactiveAction || undefined,
    review_path: reviewed.reviewPath,
    doc_proposal: reviewed.proposal,
    write_plan: summarizeAnalyzeProjectWritePlan(writePlan),
    snapshot,
    written_docs: writtenDocs,
    run_id: lifecycleRun.run_id,
  };
  const postWriteValidation = validateAnalyzeProjectPostWrite(repoRoot, writeReport, {
    strict: commandOptions.strict === true,
  });
  writeReport = {
    ...writeReport,
    post_write_validation: postWriteValidation,
  };

  if (commandOptions.json === true) {
    process.stdout.write(`${JSON.stringify(writeReport, null, 2)}\n`);
    if (!postWriteValidation.ok) {
      const error = new Error(formatError('ai analyze-project post-write validation failed.'));
      error.code = 'AI_ANALYZE_PROJECT_POST_WRITE_VALIDATION_FAILED';
      error.validation = postWriteValidation;
      throw error;
    }
    return writeReport;
  }

  process.stdout.write(formatAnalyzeProjectReviewPlan({
    writePlan,
    reviewPath: reviewed.reviewPath,
    snapshot,
    writtenDocs,
    validation: postWriteValidation,
    completed: true,
  }));
  if (!postWriteValidation.ok) {
    const error = new Error(formatError('ai analyze-project post-write validation failed.'));
    error.code = 'AI_ANALYZE_PROJECT_POST_WRITE_VALIDATION_FAILED';
    error.validation = postWriteValidation;
    throw error;
  }
  return writeReport;
}

function cancelAnalyzeProjectInteractiveApplyReport(repoRoot, options = {}) {
  const translator = createTranslator(options.commandOptions?.language);
  const savedArtifacts = options.savedReport?.proposal_artifacts || null;
  const cancelReport = {
    ...options.completedReport,
    apply_docs: true,
    interactive_action: options.interactiveAction || 'cancel',
    cancelled: true,
    writes: [],
    written_docs: [],
    doc_proposal: options.proposal,
    proposal_artifacts: savedArtifacts || undefined,
    write_plan: summarizeAnalyzeProjectWritePlan(options.writePlan),
  };
  writeAnalyzeProjectRunStatus(repoRoot, options.auditRunId, 'apply-canceled', {
    now: options.commandOptions?.now,
    provider: options.provider,
    attempts: options.providerAttempts,
    artifacts: {
      selected_context: options.selectedContextManifest,
      raw_provider: analyzeProjectRawProviderArtifactPaths(options.rawProviderArtifacts),
      repair: options.repairManifest,
      retry: options.retryManifest,
      proposal_manifest: savedArtifacts?.manifest || null,
      proposal_files: savedArtifacts ? listAnalyzeProjectProposalArtifactFiles(savedArtifacts) : [],
    },
  });
  process.stdout.write([
    translator.t('ai.analyze_project.apply.cancelled'),
    translator.t('ai.analyze_project.apply.cancelled_writes'),
    '',
  ].join('\n'));
  return cancelReport;
}

function formatLocalizedActionableError({ failure, impact, fix, nextCommand } = {}, options = {}) {
  const translator = createTranslator(options.language);
  const lines = [`create-quiver: ${String(failure || 'operation failed').trim()}`];

  if (impact) {
    lines.push(`${translator.t('ai.actionable.impact')}: ${String(impact).trim()}`);
  }
  if (fix) {
    lines.push(`${translator.t('ai.actionable.fix')}: ${String(fix).trim()}`);
  }
  if (nextCommand) {
    lines.push(`${translator.t('ai.actionable.next_command')}: ${String(nextCommand).trim()}`);
  }

  return lines.join('\n');
}

function analyzeProjectContractError(message, nextCommand) {
  const error = new Error(formatError([
    message,
    nextCommand ? `Next safe step: ${nextCommand}` : '',
  ].filter(Boolean).join('\n')));
  error.code = 'AI_ANALYZE_PROJECT_CONTRACT_UNAVAILABLE';
  return error;
}

function canUseInteractiveTerminal(options = {}) {
  return options.stdinIsTTY === true || (options.stdinIsTTY !== false && Boolean(process.stdin.isTTY));
}

function assertAnalyzeProjectCommandContract(options = {}) {
  if (options.review === true && options.applyDocs === true) {
    throw analyzeProjectContractError(
      'ai analyze-project --apply-docs cannot be combined with --review.',
      'Use either `npx create-quiver ai analyze-project --deep --review` or `npx create-quiver ai analyze-project --deep --apply-docs`.',
    );
  }

  if (options.dryRun === true && options.applyDocs === true) {
    throw analyzeProjectContractError(
      'ai analyze-project --dry-run cannot be combined with --apply-docs.',
      'Preview with `npx create-quiver ai analyze-project --deep --dry-run`, then rerun without --dry-run.',
    );
  }

  if (options.dryRun === true && options.saveProposal === true) {
    throw analyzeProjectContractError(
      'ai analyze-project --dry-run cannot be combined with --save-proposal.',
      'Preview with `npx create-quiver ai analyze-project --deep --dry-run`, then rerun with --save-proposal.',
    );
  }

  if (options.applyRun === true && options.dryRun === true) {
    throw analyzeProjectContractError(
      'ai analyze-project apply --run cannot be combined with --dry-run.',
      'Inspect the saved proposal under `.quiver/runs/<run-id>/proposal/`, then rerun without --dry-run.',
    );
  }

  if (options.applyRun === true && (options.applyDocs === true || options.saveProposal === true || options.review === true)) {
    throw analyzeProjectContractError(
      'ai analyze-project apply --run cannot be combined with --apply-docs, --save-proposal, or --review.',
      'Use `npx create-quiver ai analyze-project apply --run <run-id>` to apply a saved proposal, or rerun `ai analyze-project --deep` for a fresh proposal.',
    );
  }

  if (options.json === true && options.applyDocs === true && options.force !== true) {
    throw analyzeProjectContractError(
      'ai analyze-project --json with --apply-docs requires --yes because JSON output cannot include an interactive selector.',
      'Use `npx create-quiver ai analyze-project --deep --apply-docs --yes --json` for automation.',
    );
  }

  if (options.applyRun === true && !String(options.runId || '').trim()) {
    throw analyzeProjectContractError(
      'ai analyze-project apply requires --run <run-id>.',
      'Use `npx create-quiver ai analyze-project apply --run <run-id>`.',
    );
  }

  if (options.applyRun === true && String(options.runId || '').trim() === 'latest' && options.force === true) {
    throw analyzeProjectContractError(
      'ai analyze-project apply --run latest cannot be combined with --yes.',
      'Use an explicit run id for automation: `npx create-quiver ai analyze-project apply --run <run-id> --yes`.',
    );
  }

  if (options.applyRun === true && String(options.runId || '').trim() === 'latest' && options.json === true) {
    throw analyzeProjectContractError(
      'ai analyze-project apply --run latest cannot be combined with --json.',
      'Use an explicit run id for JSON automation: `npx create-quiver ai analyze-project apply --run <run-id> --json`.',
    );
  }
}

function readTextFile(filePath, repoRoot) {
  if (!filePath) {
    return '';
  }

  const resolved = path.resolve(repoRoot, filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(formatError(`missing input file: ${filePath}`));
  }

  return fs.readFileSync(resolved, 'utf8');
}

function readTextFileOrEmpty(filePath, repoRoot) {
  if (!filePath) {
    return '';
  }

  return readTextFile(filePath, repoRoot);
}

function normalizeTimeout(timeoutMs) {
  if (timeoutMs === undefined || timeoutMs === null || timeoutMs === '') {
    return undefined;
  }

  const parsed = Number(timeoutMs);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(formatError(`invalid timeout value: ${timeoutMs}`));
  }

  return parsed;
}

function profileOptionForRole(options, role) {
  const normalized = normalizeAgentProfileRole(role);
  if (normalized === 'planner') {
    return options.plannerProfile || options.profileId || '';
  }
  if (normalized === 'executor') {
    return options.executorProfile || options.profileId || '';
  }
  if (normalized === 'reviewer') {
    return options.reviewerProfile || options.profileId || '';
  }
  if (normalized === 'doctor') {
    return options.doctorProfile || options.profileId || '';
  }
  return options.profileId || '';
}

function resolveRuntimeAgentProfile(repoRoot, role, options = {}, fallbackProvider = DEFAULT_PLAN_PROVIDER) {
  const normalizedRole = normalizeAgentProfileRole(role);
  const explicitProvider = options.providerExplicit === true || (options.provider && options.providerExplicit !== false);
  const explicitModel = String(options.model || '').trim();

  if (explicitProvider) {
    const provider = String(options.provider || fallbackProvider).trim().toLowerCase();
    return {
      role: normalizedRole,
      profile: null,
      profileId: '',
      displayName: provider,
      provider,
      model: explicitModel,
    };
  }

  const profileId = profileOptionForRole(options, normalizedRole);
  const profile = profileId
    ? getAgentProfileById(repoRoot, normalizedRole, profileId)
    : getAgentProfile(repoRoot, normalizedRole);
  const provider = profile?.provider || resolveProfileProvider(repoRoot, normalizedRole, fallbackProvider);

  return {
    role: normalizedRole,
    profile,
    profileId: profile?.id || profileId || '',
    displayName: profile ? resolveAgentProfileDisplayName(profile) : provider,
    provider,
    model: explicitModel || profile?.model || '',
  };
}

function runtimeModelExecutionOptions(runtimeProfile, options = {}) {
  return {
    model: runtimeProfile.model,
    blockModelAlias: Boolean(runtimeProfile.profile && !String(options.model || '').trim()),
  };
}

function createCommandUx(options = {}) {
  if (options.ux) {
    return options.ux;
  }

  return createUx({
    env: options.env || process.env,
    input: options.inputStream,
    output: options.outputStream,
    error: options.errorStream,
    interactive: options.interactive,
    json: options.json,
    noColor: options.noColor,
    prompts: options.prompts,
    spinner: options.spinner,
    stdinIsTTY: options.stdinIsTTY,
    stdoutIsTTY: options.stdoutIsTTY,
    stderrIsTTY: options.stderrIsTTY,
    write: options.write,
  });
}

function shouldShowHumanProgress(ux, options = {}) {
  return options.progress !== false
    && options.dryRun !== true
    && options.printPrompt !== true
    && ux?.mode?.json !== true
    && (ux?.mode?.decoration === true || options.linearProgress === true);
}

function plannerProgressTitle(action, runtimeProfile, options = {}) {
  const translator = createTranslator(options.language);
  return translator.t('ai.planner.progress.title', {
    action,
    profile: runtimeProfile.displayName || runtimeProfile.model || runtimeProfile.provider,
  });
}

function writeProgressChecks(ux, enabled, title, checks = []) {
  if (!enabled) {
    return;
  }
  ux.heading(title);
  for (const check of checks) {
    ux.check(check);
  }
}

function writeProgressCheck(ux, enabled, check) {
  if (!enabled || !check) {
    return;
  }
  ux.check(check);
}

function writeProgressInfo(ux, enabled, message) {
  if (!enabled || !message) {
    return;
  }
  ux.info(message);
}

async function runProviderWithProgress({
  ux,
  enabled,
  message = 'Running agent...',
  successMessage = 'Agent finished',
  failureMessage = 'Agent failed',
  failOnProviderResult = true,
  run,
}) {
  async function runAndFailOnProviderResult() {
    const result = await run();
    if (failOnProviderResult && result && result.ok === false) {
      const error = new Error(result.error?.message || 'provider run failed');
      error.code = result.error?.code || 'AI_PROVIDER_RUN_FAILED';
      error.providerResult = result;
      throw error;
    }
    return result;
  }

  if (!enabled) {
    return run();
  }

  return ux.withSpinner(message, runAndFailOnProviderResult, {
    successMessage,
    failureMessage,
  });
}

function buildPlanContext({ role, context, phase, inputText, inputPath, repoRoot, revise = false }) {
  const phaseDetails = getPlannerPhaseDetails(phase);
  const pack = buildContextPackMetadata({
    role,
    packName: context || phaseDetails.contextPack,
    repoRoot,
  });
  const relativeInputPath = inputPath ? path.relative(repoRoot, path.resolve(repoRoot, inputPath)).split(path.sep).join('/') : '';
  const sections = [
    pack.prompt,
    `Phase: ${phaseDetails.phase}`,
    revise
      ? 'Task: revise the current draft and produce a new version only. Do not advance phase, approve, create specs, or modify product code.'
      : phaseDetails.phase === 'acceptance'
      ? 'Task: produce acceptance criteria only. Do not create files or modify product code.'
      : 'Task: produce a technical plan only. Do not create files or modify product code.',
  ];

  if (phaseDetails.phase === 'technical-plan') {
    sections.push(
      'Required output contract: include a fenced json block with `{ "spec": { "slices": [...] } }` so Quiver can create specs after review and approval.',
      'Each `spec.slices[]` item must include at least `slice_id`, `title`, `objective`, and `files`.',
    );
  }

  if (relativeInputPath) {
    sections.push(`Input file: ${relativeInputPath}`);
  }

  if (pack.scanArtifact) {
    sections.push(`Project scan artifact: ${pack.scanArtifact.path} (${pack.scanArtifact.source})`);
  }

  if (inputText) {
    sections.push('Input:', inputText.trimEnd());
  }

  return {
    pack,
    prompt: sections.join('\n\n'),
    phaseDetails,
  };
}

function buildOnboardContext({ role, context, inputText, inputPath, repoRoot }) {
  const pack = buildContextPackMetadata({
    role,
    packName: context || DEFAULT_ONBOARD_CONTEXT,
    repoRoot,
  });
  const relativeInputPath = inputPath ? path.relative(repoRoot, path.resolve(repoRoot, inputPath)).split(path.sep).join('/') : '';
  const built = buildPlannerOnboardingPrompt({
    pack,
    inputText,
    inputPath: relativeInputPath,
    repoRoot,
  });

  return {
    pack,
    plan: built.plan,
    prompt: built.prompt,
  };
}

function formatDryRunReport({ task, provider, role, contextPack, phase, invocation, onboardingPlan, language = 'en' }) {
  const translator = createTranslator(language);
  const modelStatus = invocation.modelSelection?.supported
    ? translator.t('ai_task.model_supported')
    : translator.t('ai_task.model_unsupported');
  const lines = [
    translator.t('ai_task.title.dry_run', { task }),
    translator.t('ai_task.provider', { provider }),
    translator.t('ai_task.role', { role }),
    translator.t('ai_task.context_pack', { context: contextPack }),
  ];

  if (phase) {
    lines.push(translator.t('ai_task.phase', { phase }));
  }

  lines.push(translator.t('ai_task.command', { command: `${invocation.command} ${invocation.args.join(' ')}`.trim() }));
  lines.push(translator.t('ai_task.timeout', { timeout: invocation.timeoutMs }));
  lines.push(translator.t('ai_task.prompt_transport', { mode: invocation.promptTransport.mode }));
  lines.push(translator.t('ai_task.prompt_length', { bytes: invocation.promptLength }));
  if (invocation.modelSelection && invocation.modelSelection.model) {
    lines.push(translator.t('ai_task.model', { model: invocation.modelSelection.model }));
    lines.push(translator.t('ai_task.model_support', { status: modelStatus, reason: invocation.modelSelection.reason }));
  }

  if (onboardingPlan) {
    lines.push(translator.t('ai_task.prompt_source', { source: onboardingPlan.promptSource }));
    lines.push(translator.t('ai_task.selected_docs', { count: onboardingPlan.selectedDocs.length }));
    lines.push(translator.t('ai_task.documentation_debt', { count: onboardingPlan.missingDocs.length }));
  }

  return `${lines.join('\n')}\n`;
}

function formatPromptOnlyReport({ task, provider, role, contextPack, phase, invocation, prompt, onboardingPlan, promptSource, inputPath, inputKind, inputVersion, language = 'en' }) {
  const translator = createTranslator(language);
  const modelStatus = invocation.modelSelection?.supported
    ? translator.t('ai_task.model_supported')
    : translator.t('ai_task.model_unsupported');
  const lines = [
    translator.t('ai_task.title.prompt_only', { task }),
    translator.t('ai_task.provider', { provider }),
    translator.t('ai_task.role', { role }),
    translator.t('ai_task.context_pack', { context: contextPack }),
  ];

  if (phase) {
    lines.push(translator.t('ai_task.phase', { phase }));
  }

  lines.push(translator.t('ai_task.command', { command: `${invocation.command} ${invocation.args.join(' ')}`.trim() }));
  lines.push(translator.t('ai_task.timeout', { timeout: invocation.timeoutMs }));
  lines.push(translator.t('ai_task.prompt_transport', { mode: invocation.promptTransport.mode }));
  lines.push(translator.t('ai_task.prompt_length', { bytes: invocation.promptLength }));
  if (invocation.modelSelection && invocation.modelSelection.model) {
    lines.push(translator.t('ai_task.model', { model: invocation.modelSelection.model }));
    lines.push(translator.t('ai_task.model_support', { status: modelStatus, reason: invocation.modelSelection.reason }));
  }

  if (onboardingPlan) {
    lines.push(translator.t('ai_task.prompt_source', { source: onboardingPlan.promptSource }));
    lines.push(translator.t('ai_task.selected_docs', { count: onboardingPlan.selectedDocs.length }));
    lines.push(translator.t('ai_task.documentation_debt', { count: onboardingPlan.missingDocs.length }));
  }

  if (promptSource) {
    lines.push(translator.t('ai_task.prompt_source', { source: promptSource }));
  }

  if (inputPath) {
    lines.push(translator.t('ai_task.input_file', { path: inputPath }));
  }

  if (inputKind) {
    lines.push(translator.t('ai_task.input_kind', { kind: inputKind }));
  }

  if (inputVersion) {
    lines.push(translator.t('ai_task.input_version', { version: inputVersion }));
  }

  lines.push('--- PROMPT START ---');
  lines.push(String(prompt || '').trimEnd());
  lines.push('--- PROMPT END ---');

  return `${lines.join('\n')}\n`;
}

function formatPathList(items, emptyLabel = 'none') {
  if (!Array.isArray(items) || items.length === 0) {
    return [`- ${emptyLabel}`];
  }

  return items.map((item) => `- ${item}`);
}

function formatContextPreparationReport({ dryRun, plan, writePlan, writtenDocs, snapshot, completed = false, language = 'en' }) {
  const translator = createTranslator(language);
  const lines = [
    dryRun ? translator.t('prepare_context.title.dry_run') : completed ? translator.t('prepare_context.title.completed') : translator.t('prepare_context.title.write_plan'),
    translator.t('prepare_context.mode', { mode: dryRun ? 'dry-run' : 'live' }),
    translator.t('prepare_context.project', { project: plan.projectName }),
    translator.t('prepare_context.project_slug', { slug: plan.projectSlug }),
    translator.t('prepare_context.writes_docs_only'),
    translator.t('prepare_context.product_code_untouched'),
    translator.t('prepare_context.proposed_docs', { docs: writePlan.length > 0 ? writePlan.map((item) => item.path).join(', ') : translator.t('common.none') }),
  ];

  if (!dryRun) {
    lines.push(translator.t(completed ? 'prepare_context.written_docs' : 'prepare_context.planned_writes', { docs: writtenDocs.length > 0 ? writtenDocs.join(', ') : translator.t('common.none') }));
    if (snapshot) {
      lines.push(translator.t('prepare_context.snapshot', { path: snapshot.root }));
    }
  }

  if (completed) {
    return `${lines.join('\n')}\n`;
  }

  lines.push(
    translator.t('prepare_context.proposed_changes'),
    ...writePlan.map((item) => `- ${item.path}: ${item.action}${item.reason ? ` (${item.reason})` : ''}`),
    translator.t('prepare_context.diff_preview'),
    ...formatDiffPreview(writePlan),
    translator.t('prepare_context.files_considered'),
    ...plan.filesConsidered.map((item) => `- ${item.path}: ${item.present ? translator.t('prepare_context.present') : translator.t('prepare_context.absent')}${item.reason ? ` (${item.reason})` : ''}`),
    translator.t('prepare_context.assumptions'),
    ...formatPathList(plan.assumptions, translator.t('common.none')),
    translator.t('prepare_context.risks'),
    ...formatPathList(plan.risks, translator.t('common.none')),
    translator.t('prepare_context.contradictions'),
    ...formatPathList(plan.contradictions, translator.t('common.none')),
    translator.t('prepare_context.omitted_paths'),
    ...formatPathList(plan.omittedPaths, translator.t('common.none')),
    translator.t('prepare_context.uncertainty_markers'),
  );

  return `${lines.join('\n')}\n`;
}

function truncatePromptSection(text, maxChars = 1200) {
  const value = String(text || '').trimEnd();
  if (value.length <= maxChars) {
    return value;
  }
  return `${value.slice(0, maxChars).trimEnd()}\n[... truncated ${value.length - maxChars} chars ...]`;
}

function buildPrepareContextPlannerPrompt({ pack, draftPack }) {
  const plan = draftPack.plan;
  const allowedPaths = draftPack.docs.map((doc) => doc.path);
  const sections = [
    pack.prompt,
    'Task: planner-assisted Quiver context preparation.',
    'Goal: improve the docs-only onboarding context for future AI work while preserving WDD + SDD safety.',
    'Rules:',
    '- Return only valid JSON. Do not include Markdown outside the JSON object.',
    '- Do not modify product code, UI code, tests, migrations, dependencies, lockfiles, build files, runtime config, generated files, or paths outside the repo.',
    '- Only propose writes to the allowed docs paths listed below.',
    '- If information is ambiguous, document assumptions and risks instead of inventing facts.',
    '- Keep human-authored content safe; Quiver will merge proposals through managed context blocks.',
    '',
    'Allowed docs-only output paths:',
    ...allowedPaths.map((item) => `- ${item}`),
    '',
    'Project context:',
    `- Project: ${plan.projectName}`,
    `- Project slug: ${plan.projectSlug}`,
    `- Package manager: ${plan.facts.packageManager}`,
    `- Stack summary: ${plan.facts.stackSummary}`,
    '',
    'Files considered by deterministic prepare-context:',
    ...plan.filesConsidered.map((item) => `- ${item.path}: ${item.present ? 'present' : 'absent'}${item.reason ? ` (${item.reason})` : ''}`),
    '',
    'Known assumptions:',
    ...formatPathList(plan.assumptions),
    '',
    'Known risks:',
    ...formatPathList(plan.risks),
    '',
    'Known contradictions:',
    ...formatPathList(plan.contradictions),
    '',
    'Deterministic candidate docs:',
    ...draftPack.docs.flatMap((doc) => [
      `### ${doc.path}`,
      truncatePromptSection(doc.content),
    ]),
    '',
    'Required JSON output shape:',
    JSON.stringify({
      schema_version: 1,
      kind: 'quiver-context-proposal',
      summary: 'short summary',
      assumptions: ['assumption to confirm'],
      risks: ['risk to track'],
      docs: [
        {
          path: 'docs/AI_CONTEXT.md',
          action: 'update',
          reason: 'why this doc should change',
          content: '# AI Context\\n\\nFull proposed content or managed section content.\\n',
          assumptions: [],
          risks: [],
        },
      ],
      omitted_paths: ['paths intentionally omitted'],
      next_steps: ['safe next step'],
    }, null, 2),
  ];

  return {
    allowedPaths,
    plan,
    prompt: sections.join('\n'),
    promptSource: 'quiver prepare-context planner proposal contract',
  };
}

function formatPrepareContextPlannerDryRunReport({ provider, role, context, invocation, promptInfo, review, interactive, language = 'en' }) {
  const translator = createTranslator(language);
  const plan = promptInfo.plan;
  const lines = [
    translator.t('prepare_context_planner.title.dry_run'),
    translator.t('prepare_context.mode', { mode: 'dry-run' }),
    translator.t('prepare_context_planner.enabled'),
    `Provider: ${provider}`,
    `Role: ${role}`,
    `Context pack: ${context}`,
    `Command: ${invocation.command} ${invocation.args.join(' ')}`.trim(),
    `Prompt bytes: ${invocation.promptLength}`,
    invocation.modelSelection && invocation.modelSelection.model
      ? `Model: ${invocation.modelSelection.model}`
      : '',
    invocation.modelSelection && invocation.modelSelection.model
      ? `Model support: ${invocation.modelSelection.supported ? 'supported' : 'unsupported'} (${invocation.modelSelection.reason})`
      : '',
    translator.t('prepare_context.prompt_source', { source: promptInfo.promptSource }),
    translator.t('prepare_context_planner.review_requested', { value: review ? translator.t('common.yes') : translator.t('common.no') }),
    translator.t('prepare_context_planner.interactive_requested', { value: interactive ? translator.t('common.yes') : translator.t('common.no') }),
    translator.t('prepare_context_planner.provider_execution_skipped'),
    translator.t('prepare_context.writes_none'),
    translator.t('prepare_context.product_code_untouched'),
    translator.t('prepare_context_planner.candidate_docs', { docs: promptInfo.allowedPaths.join(', ') }),
    translator.t('prepare_context.files_considered'),
    ...plan.filesConsidered.map((item) => `- ${item.path}: ${item.present ? translator.t('prepare_context.present') : translator.t('prepare_context.absent')}`),
    translator.t('prepare_context_planner.allowed_docs_only_paths'),
    ...promptInfo.allowedPaths.map((item) => `- ${item}`),
    translator.t('prepare_context_planner.next_safe_commands'),
    '- npx create-quiver ai prepare-context --with-planner --print-prompt',
    '- npx create-quiver ai prepare-context --with-planner --dry-run --review',
    '- npx create-quiver ai prepare-context --with-planner',
  ];

  return `${lines.filter(Boolean).join('\n')}\n`;
}

function serializeProposalForReview(proposal) {
  return {
    schema_version: proposal.schemaVersion,
    kind: proposal.kind,
    summary: proposal.summary,
    assumptions: proposal.assumptions,
    risks: proposal.risks,
    docs: proposal.docs.map((doc) => ({
      path: doc.path,
      action: doc.action,
      reason: doc.reason,
      content: doc.content,
      assumptions: doc.assumptions,
      risks: doc.risks,
    })),
    omitted_paths: proposal.omittedPaths,
    next_steps: proposal.nextSteps,
  };
}

function createProposalReviewFile(proposal, options = {}) {
  const reviewDir = options.reviewDir || fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-context-review-'));
  const reviewPath = path.join(reviewDir, 'context-proposal.json');
  fs.mkdirSync(reviewDir, { recursive: true });
  fs.writeFileSync(reviewPath, `${JSON.stringify(serializeProposalForReview(proposal), null, 2)}\n`);
  return reviewPath;
}

function makeReviewError(message, reviewPath, cause) {
  const error = new Error(formatError(`${message}\nReview artifact: ${reviewPath}\nNext safe step: edit the artifact into valid proposal JSON or rerun with --with-planner --dry-run.`));
  error.code = cause?.code || 'AI_CONTEXT_REVIEW_FAILED';
  error.cause = cause;
  error.reviewPath = reviewPath;
  return error;
}

function createReviewTextFile(contents, options = {}) {
  const reviewDir = options.reviewDir || fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-review-'));
  const filename = options.reviewFileName || 'review.md';
  const reviewPath = path.join(reviewDir, filename);
  fs.mkdirSync(reviewDir, { recursive: true });
  fs.writeFileSync(reviewPath, String(contents || ''));
  return reviewPath;
}

async function reviewTextWithEditor(repoRoot, contents, options = {}) {
  const reviewPath = createReviewTextFile(contents, options);
  const hasEditorRunner = typeof options.openEditorFn === 'function';
  const canOpenEditor = hasEditorRunner || options.stdinIsTTY === true || (options.stdinIsTTY !== false && Boolean(process.stdin.isTTY));

  if (!canOpenEditor) {
    throw makeReviewError(`${options.reviewLabel || 'review'} requires an interactive terminal or an injected editor runner.`, reviewPath);
  }

  const editorResult = hasEditorRunner
    ? options.openEditorFn(reviewPath, { cwd: repoRoot, env: options.env || process.env })
    : openEditor(reviewPath, { cwd: repoRoot, env: options.env || process.env });

  if (!editorResult || editorResult.ok !== true) {
    throw makeReviewError(editorResult?.reason || `${options.reviewLabel || 'review'} was canceled.`, reviewPath);
  }

  return {
    reviewPath,
    text: fs.readFileSync(reviewPath, 'utf8'),
  };
}

async function confirmInteractiveAction(message, options = {}) {
  if (options.interactive !== true) {
    return;
  }

  const ux = options.ux || createUx({
    interactive: true,
    promptConfirm: options.promptConfirm,
    stdinIsTTY: options.stdinIsTTY,
    stdoutIsTTY: options.stdoutIsTTY,
    stderrIsTTY: options.stderrIsTTY,
    write: options.write,
  });
  const confirmed = await ux.promptConfirm(message, {
    initialValue: false,
  });

  if (!confirmed) {
    const error = new Error(formatError('interactive approval declined. No files were written.'));
    error.code = 'AI_INTERACTIVE_APPROVAL_DECLINED';
    throw error;
  }
}

async function reviewPlannerContextProposal(repoRoot, proposal, options = {}) {
  const reviewPath = createProposalReviewFile(proposal, options);
  const hasEditorRunner = typeof options.openEditorFn === 'function';
  const canOpenEditor = hasEditorRunner || options.stdinIsTTY === true || (options.stdinIsTTY !== false && Boolean(process.stdin.isTTY));

  if (!canOpenEditor) {
    throw makeReviewError('ai prepare-context review requires an interactive terminal or an injected editor runner.', reviewPath);
  }

  const editorResult = hasEditorRunner
    ? options.openEditorFn(reviewPath, { cwd: repoRoot, env: options.env || process.env })
    : openEditor(reviewPath, { cwd: repoRoot, env: options.env || process.env });

  if (!editorResult || editorResult.ok !== true) {
    throw makeReviewError(editorResult?.reason || 'ai prepare-context review was canceled before applying docs.', reviewPath);
  }

  try {
    return {
      proposal: parseContextProposalOutput(fs.readFileSync(reviewPath, 'utf8')),
      reviewPath,
    };
  } catch (error) {
    throw makeReviewError('edited planner proposal is invalid after review.', reviewPath, error);
  }
}

async function confirmPlannerContextWrites(writePlan, options = {}) {
  const changed = writePlan.filter((item) => item.action !== 'skip').length;
  await confirmInteractiveAction(`Apply ${changed} docs-only context update${changed === 1 ? '' : 's'}?`, options);
}

function buildPlannerContextWritePlan(repoRoot, proposal) {
  const reasonByPath = new Map(proposal.docs.map((doc) => [doc.path, doc.reason]));
  const draftDocs = proposal.docs
    .filter((doc) => doc.action !== 'skip')
    .map((doc) => ({
      path: doc.path,
      content: doc.content,
    }));

  return buildContextWritePlan(repoRoot, draftDocs).map((item) => ({
    ...item,
    reason: item.action === 'skip' ? item.reason : reasonByPath.get(item.path) || item.reason,
  }));
}

function writeProviderOutput(result) {
  if (result.stdout) {
    process.stdout.write(redactSecrets(result.stdout));
  }
  if (result.stderr) {
    process.stderr.write(redactSecrets(result.stderr));
  }
}

function writeCleanProviderOutput(clean) {
  const output = String(clean?.cleanOutput || '');
  if (!output) {
    return;
  }
  process.stdout.write(output.endsWith('\n') ? output : `${output}\n`);
}

function resolveTechnicalPlanAcceptanceInput(repoRoot, options = {}, explicitInput = '') {
  const explicitRun = options.runId ? readAiRun(repoRoot, options.runId) : null;
  if (!governanceIsEnabled(repoRoot, options, explicitRun)) {
    return resolveApprovedPlannerInput(repoRoot, 'technical-plan', explicitInput || undefined);
  }
  const run = options.runId
    ? resolveGovernedAiRun(repoRoot, options.runId)
    : resolveGovernedAiRun(repoRoot);
  if (!run) {
    throw new GovernanceError(
      'AI_RUN_REQUIRED',
      'Governed technical-plan planning requires a run with a canonical acceptance approval.',
    );
  }
  const verification = verifyCanonicalApproval(repoRoot, {
    ...options,
    phase: 'acceptance',
    runId: run.run_id,
  });
  const inputPath = verification.decision.artifact_path;
  if (explicitInput
      && normalizeRunArtifactPath(repoRoot, explicitInput) !== normalizeRunArtifactPath(repoRoot, inputPath)) {
    throw new GovernanceError(
      'APPROVAL_BINDING_MISMATCH',
      'Governed technical-plan input must be the canonical acceptance artifact from the same run.',
      { run_id: run.run_id, mismatches: ['input_path'] },
    );
  }
  return { inputPath, verification };
}

function resolveRunOwnedTechnicalPlanDraft(repoRoot, options, approvalState) {
  const explicitRun = options.runId ? readAiRun(repoRoot, options.runId) : null;
  if (!governanceIsEnabled(repoRoot, options, explicitRun)) {
    return null;
  }
  const run = options.runId
    ? resolveGovernedAiRun(repoRoot, options.runId)
    : resolveGovernedAiRun(repoRoot);
  if (!run) {
    throw new GovernanceError(
      'AI_RUN_REQUIRED',
      'Governed technical-plan revision requires a run that owns the current draft.',
    );
  }
  const latestDraftEvent = [...(run.history || [])].reverse().find((entry) => (
    entry?.phase === 'technical-plan-draft' && entry.artifact
  ));
  if (!latestDraftEvent) {
    throw new GovernanceError(
      'GOVERNANCE_STATE_INVALID',
      `Run '${run.run_id}' does not own a technical-plan draft to revise.`,
      { run_id: run.run_id, mismatches: ['technical-plan-draft'] },
    );
  }
  const ownedPath = normalizeRunArtifactPath(repoRoot, latestDraftEvent.artifact);
  const matches = (approvalState?.meta?.drafts || []).filter((entry) => (
    normalizeRunArtifactPath(repoRoot, entry?.path) === ownedPath
  ));
  if (matches.length !== 1) {
    throw new GovernanceError(
      matches.length > 1 ? 'REPRESENTATION_MISMATCH' : 'APPROVAL_BINDING_MISMATCH',
      `Run '${run.run_id}' technical-plan draft is not represented exactly once.`,
      { run_id: run.run_id, artifact: ownedPath, draft_count: matches.length },
    );
  }
  const record = matches[0];
  const artifact = readProjectFileBytes(repoRoot, record.path, 'run-owned technical-plan draft');
  if (!record.artifact_sha256 || artifact.sha256 !== record.artifact_sha256) {
    throw new GovernanceError(
      'APPROVAL_BINDING_MISMATCH',
      `The technical-plan draft owned by run '${run.run_id}' has changed.`,
      { run_id: run.run_id, mismatches: ['artifact_sha256'] },
    );
  }
  return {
    run,
    record,
    draft: {
      path: artifact.path,
      contents: artifact.bytes.toString('utf8'),
    },
  };
}

function resolveTechnicalPlanRevisionInput(repoRoot, options, approvalState) {
  const owned = resolveRunOwnedTechnicalPlanDraft(repoRoot, options, approvalState);
  const effectiveOptions = owned
    ? { ...options, runId: owned.run.run_id }
    : options;
  try {
    return {
      ...resolveTechnicalPlanAcceptanceInput(repoRoot, effectiveOptions),
      draft: owned?.draft || approvalState.draft,
    };
  } catch (error) {
    if (error?.code !== 'APPROVAL_NOT_FOUND'
        || !owned?.run?.governance
        || !owned.record?.input_path
        || !owned.record?.input_sha256) throw error;
    const input = readProjectFileBytes(
      repoRoot,
      owned.record.input_path,
      'technical-plan bound acceptance input',
    );
    if (input.sha256 !== owned.record.input_sha256) {
      throw new GovernanceError(
        'APPROVAL_BINDING_MISMATCH',
        'The acceptance input bound to the run-owned technical-plan draft has changed.',
        { run_id: owned.run.run_id, mismatches: ['input_sha256'] },
      );
    }
    return {
      inputPath: input.path,
      verification: null,
      compatibilityBinding: 'owned-draft-input',
      draft: owned.draft,
    };
  }
}

function normalizeText(value) {
  return String(value || '').replace(/\r\n/g, '\n');
}

function buildRevisionInput({ phase, feedbackPath, feedbackText, repoRoot, compactionOptions = {} }) {
  const current = readPhaseApproval(repoRoot, phase);
  if (!current.draft) {
    throw new Error(formatError(`ai revise --phase ${phase} requires an existing draft; current status is ${current.status}. Run \`npx create-quiver ai plan --phase ${phase} --input <file>\` first.`));
  }

  const sections = [];
  let sourceInputPath = feedbackPath;

  if (phase === 'technical-plan') {
    const revision = resolveTechnicalPlanRevisionInput(repoRoot, compactionOptions, current);
    sourceInputPath = revision.inputPath;
    const acceptanceText = readTextFile(revision.inputPath, repoRoot);
    sections.push(`Approved acceptance input (${revision.inputPath}):`, acceptanceText.trimEnd());
    sections.push(
      `Current ${phase} draft (${revision.draft.path}):`,
      revision.draft.contents.trimEnd(),
    );
  } else {
    sections.push(
      `Current ${phase} draft (${current.draft.path}):`,
      current.draft.contents.trimEnd(),
    );
  }

  sections.push(
    `Human feedback (${feedbackPath}):`,
    feedbackText.trimEnd(),
  );

  return {
    ...compactRevisionInput(sections.join('\n\n'), compactionOptions),
    sourceInputPath,
  };
}

function buildManagedContextBlock(content) {
  return `${CONTEXT_PREP_START}\n${String(content || '').trimEnd()}\n${CONTEXT_PREP_END}\n`;
}

function mergeContextDraft(existingContent, draftContent) {
  const existing = normalizeText(existingContent);
  const block = buildManagedContextBlock(draftContent);
  const startIndex = existing.indexOf(CONTEXT_PREP_START);
  const endIndex = existing.indexOf(CONTEXT_PREP_END);

  if (startIndex >= 0 && endIndex > startIndex) {
    const before = existing.slice(0, startIndex).trimEnd();
    const after = existing.slice(endIndex + CONTEXT_PREP_END.length).trimStart();
    return `${before}\n\n${block}${after ? `\n${after}` : ''}`;
  }

  return `${existing.trimEnd()}\n\n${block}`;
}

function firstChangedLineIndex(beforeLines, afterLines) {
  const max = Math.max(beforeLines.length, afterLines.length);
  for (let index = 0; index < max; index += 1) {
    if (beforeLines[index] !== afterLines[index]) {
      return index;
    }
  }
  return -1;
}

function buildDiffSnippet(pathLabel, beforeContent, afterContent, maxLines = 10) {
  const beforeLines = normalizeText(beforeContent).split('\n');
  const afterLines = normalizeText(afterContent).split('\n');
  const changedAt = firstChangedLineIndex(beforeLines, afterLines);

  if (changedAt === -1) {
    return [`diff -- ${pathLabel}`, '  no changes'];
  }

  const start = Math.max(0, changedAt - 2);
  const beforeSnippet = beforeLines.slice(start, start + maxLines);
  const afterSnippet = afterLines.slice(start, start + maxLines);
  const lines = [
    `--- ${pathLabel} (current)`,
    `+++ ${pathLabel} (proposed)`,
  ];

  for (const line of beforeSnippet) {
    if (line) {
      lines.push(`- ${line}`);
    }
  }

  for (const line of afterSnippet) {
    if (line) {
      lines.push(`+ ${line}`);
    }
  }

  return lines;
}

function buildContextWritePlan(repoRoot, drafts) {
  return drafts.map((draft) => {
    const destinationPath = path.join(repoRoot, draft.path);
    const exists = fs.existsSync(destinationPath);
    const currentContent = exists ? fs.readFileSync(destinationPath, 'utf8') : '';
    const proposedContent = exists
      ? mergeContextDraft(currentContent, draft.content)
      : `${String(draft.content || '').replace(/\s+$/g, '')}\n`;
    const changed = normalizeText(currentContent) !== normalizeText(proposedContent);

    return {
      path: draft.path,
      destinationPath,
      action: changed ? (exists ? 'update' : 'create') : 'skip',
      reason: changed ? (exists ? 'human content preserved; Quiver block appended or refreshed' : 'missing approved context doc') : 'already up to date',
      exists,
      currentContent,
      proposedContent,
      diff: buildDiffSnippet(draft.path, currentContent, proposedContent),
    };
  });
}

function formatDiffPreview(writePlan) {
  const lines = [];
  for (const item of writePlan) {
    if (item.action === 'skip') {
      continue;
    }
    lines.push(...item.diff);
  }
  return lines.length > 0 ? lines : ['- no changes'];
}

function createContextSnapshots(repoRoot, run, writePlan, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const snapshotRoot = path.join(repoRoot, '.quiver', 'runs', run.run_id, 'snapshots', stamp);
  const manifest = {
    schema_version: 1,
    run_id: run.run_id,
    created_at: now.toISOString(),
    entries: [],
  };

  fs.mkdirSync(snapshotRoot, { recursive: true });

  for (const item of writePlan) {
    if (item.action === 'skip') {
      continue;
    }
    const entry = {
      path: item.path,
      action: item.action,
      existed: item.exists,
      snapshot_path: null,
    };

    if (item.exists) {
      const snapshotPath = path.join(snapshotRoot, item.path);
      fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
      fs.copyFileSync(item.destinationPath, snapshotPath);
      entry.snapshot_path = path.relative(repoRoot, snapshotPath).split(path.sep).join('/');
    }

    manifest.entries.push(entry);
  }

  const manifestPath = path.join(snapshotRoot, 'manifest.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  return {
    root: path.relative(repoRoot, snapshotRoot).split(path.sep).join('/'),
    manifestPath: path.relative(repoRoot, manifestPath).split(path.sep).join('/'),
    entries: manifest.entries,
  };
}

function writeDraftDocs(writePlan) {
  const writtenDocs = [];
  for (const item of writePlan) {
    if (item.action === 'skip') {
      continue;
    }
    fs.mkdirSync(path.dirname(item.destinationPath), { recursive: true });
    fs.writeFileSync(item.destinationPath, item.proposedContent);
    writtenDocs.push(item.path);
  }
  return writtenDocs;
}

function formatSpecDryRunReport({ manifest, repoRoot, language }) {
  const translator = createTranslator(language);
  const preview = describeSpecGeneration(manifest, repoRoot);
  const relativeSpecDir = path.relative(repoRoot, preview.specDir).split(path.sep).join('/');
  const lines = [
    translator.t('ai.plan.spec.dry_run.title'),
    translator.t('ai_task.phase', { phase: 'spec' }),
    translator.t('ai.plan.spec.slug', { slug: manifest.slug }),
    translator.t('ai.plan.spec.title', { title: manifest.title }),
    translator.t('ai_task.input_file', { path: manifest.sourcePath }),
    translator.t('ai.plan.spec.target', { target: relativeSpecDir }),
    translator.t('ai.plan.spec.planned_files', { count: preview.files.length }),
  ];

  for (const file of preview.files) {
    lines.push(`- ${file}`);
  }

  return `${lines.join('\n')}\n`;
}

function formatSpecGenerationResult(result, repoRoot, options = {}) {
  const translator = createTranslator(options.language);
  const relativeSpecDir = path.relative(repoRoot, result.specDir).split(path.sep).join('/');
  const lines = [
    translator.t('ai.plan.spec.completed'),
    translator.t('ai.plan.spec.slug', { slug: result.manifest.slug }),
    translator.t('ai.plan.spec.target', { target: relativeSpecDir }),
    translator.t('ai.plan.spec.files_written', { count: result.files.length }),
  ];

  for (const filePath of result.files) {
    lines.push(`- ${path.relative(repoRoot, filePath).split(path.sep).join('/')}`);
  }

  return `${lines.join('\n')}\n`;
}

function formatApprovalResult(result, repoRoot, options = {}) {
  const translator = createTranslator(options.language);
  const relativePath = path.relative(repoRoot, result.filePath).split(path.sep).join('/');
  const lines = [
    translator.t('ai.approve.saved'),
    translator.t('ai_task.phase', { phase: result.phase }),
    `${translator.t('ai.table.status')}: ${translator.t('ai.approve.status.approved')}`,
    `${translator.t('ai.approve.artifact')}: ${relativePath}`,
    `${translator.t('ai.approvals.source_file')}: ${result.sourceFile}`,
    `${translator.t('ai.approve.timestamp')}: ${result.createdAt}`,
  ];
  if (result.version) {
    lines.push(`${translator.t('ai.approve.version')}: v${result.version}`);
  }

  return `${lines.join('\n')}\n`;
}

function formatApprovalDryRunResult({ phase, input, version, language }) {
  const translator = createTranslator(language);
  const lines = [translator.t('ai.approve.dry_run.title'), translator.t('ai_task.phase', { phase })];
  if (version) {
    lines.push(`${translator.t('ai.approve.version')}: v${version}`);
  }
  if (input) {
    lines.push(translator.t('ai_task.input_file', { path: input }));
  }
  return `${lines.join('\n')}\n`;
}

function stripCreateQuiverPrefix(message) {
  return String(message || '').replace(/^create-quiver:\s*/, '');
}

function readCurrentDraftForApproval(repoRoot, phase, version) {
  const approval = readPhaseApproval(repoRoot, phase);
  const selectedDraft = findDraftVersion(approval.meta, version);
  if (!selectedDraft) {
    throw new Error(formatError(`missing ${phase} draft version ${version}`));
  }
  const latestVersion = latestDraftVersion(approval.meta);
  if (latestVersion && Number(selectedDraft.version) !== latestVersion) {
    throw new Error(formatError(`${phase} draft version ${version} is not current; latest draft version is ${latestVersion}. Approve the latest version or revise again.`));
  }
  const draftPath = path.resolve(repoRoot, selectedDraft.path);
  if (!fs.existsSync(draftPath)) {
    throw new Error(formatError(`missing ${phase} draft artifact: ${selectedDraft.path}`));
  }
  return {
    approval,
    contents: fs.readFileSync(draftPath, 'utf8'),
    draft: selectedDraft,
    path: selectedDraft.path,
  };
}

function assertTechnicalPlanDraftHasSpecContract(repoRoot, version) {
  const draft = readCurrentDraftForApproval(repoRoot, 'technical-plan', version);
  try {
    validateTechnicalPlanSpecContract(repoRoot, {
      inputPath: draft.path,
      inputText: draft.contents,
    });
  } catch (error) {
    throw new Error(formatError([
      `technical-plan draft v${version} cannot be approved because it cannot create specs.`,
      stripCreateQuiverPrefix(error.message || error),
      'Required contract: include a structured JSON block with `spec.slices[]` before approval.',
      'Next safe command: npx create-quiver ai revise --phase technical-plan --input <feedback.md> --dry-run',
    ].join('\n')));
  }
  return draft;
}

function resolveApprovedTechnicalPlanForRepair(repoRoot, explicitInput = '') {
  const approval = readPhaseApproval(repoRoot, 'technical-plan');
  if (!approval.approved?.path) {
    throw new Error(formatError('ai repair-plan requires an approved technical-plan artifact. Run `npx create-quiver ai approvals` to inspect planner state.'));
  }

  const approvedPath = approval.approved.path;
  if (explicitInput) {
    const explicit = path.resolve(repoRoot, explicitInput);
    const approved = path.resolve(repoRoot, approvedPath);
    if (explicit !== approved) {
      throw new Error(formatError(`ai repair-plan input must match the approved technical-plan artifact: ${approvedPath}`));
    }
  }

  const contents = readTextFile(approvedPath, repoRoot);
  try {
    validateTechnicalPlanSpecContract(repoRoot, {
      inputPath: approvedPath,
      inputText: contents,
    });
  } catch (error) {
    return {
      approval,
      contents,
      path: approvedPath,
      validationError: stripCreateQuiverPrefix(error.message || error),
    };
  }

  throw new Error(formatError('approved technical-plan already includes a valid structured `spec.slices[]` contract. No repair draft is needed.'));
}

function buildRepairPlanContext({ context, inputText, inputPath, repoRoot, role, validationError }) {
  const pack = buildContextPackMetadata({
    role,
    packName: context,
    repoRoot,
  });
  const prompt = [
    pack.prompt,
    'Phase: technical-plan',
    'Task: repair the approved technical plan into a new draft only. Do not approve it, create specs, modify product code, or expand scope.',
    'Preserve the approved intent, scope, risks, and decisions.',
    'Add the required Quiver structured JSON contract in a fenced json block.',
    'The JSON must include `{ "spec": { "slug": "...", "title": "...", "objective": "...", "slices": [...] } }`.',
    'Each item in `spec.slices[]` must include at least `slice_id`, `title`, `objective`, and `files`.',
    `Validation failure to repair: ${validationError}`,
    `Approved technical-plan artifact: ${inputPath}`,
    'Approved technical-plan contents:',
    inputText.trimEnd(),
  ].join('\n\n');

  return {
    pack,
    prompt,
  };
}

function formatRepairPlanResult(result, repoRoot, options = {}) {
  const translator = createTranslator(options.language);
  const relativePath = path.relative(repoRoot, result.filePath).split(path.sep).join('/');
  return [
    translator.t('ai.repair_plan.saved'),
    `${translator.t('ai.approvals.draft')}: ${relativePath}`,
    `${translator.t('ai.approve.version')}: v${result.version}`,
    `${translator.t('ai.repair_plan.source_approved_artifact')}: ${result.sourcePath}`,
    translator.t('ai.repair_plan.original_preserved'),
    `${translator.t('ai.label.next_safe_commands')}:`,
    '- npx create-quiver ai review-plan --dry-run',
    '- npx create-quiver ai review-plan',
    `- npx create-quiver ai approve --phase technical-plan --version ${result.version}`,
  ].join('\n').concat('\n');
}

function formatActiveSliceReconciliationReport(report, options = {}) {
  const lines = [
    'AI active-slice reconciliation',
    `Mode: ${options.dryRun ? 'dry-run' : 'read-only'}`,
    `Decision: ${report.reconciliation.decision}`,
    `Reason: ${report.reconciliation.reason}`,
    '',
    'Supported sources:',
  ];

  for (const source of report.supported_sources) {
    lines.push(`- ${source.path}: ${source.exists ? 'exists' : 'missing'}`);
  }

  lines.push('', 'Detected sources:');
  if (report.sources.length === 0) {
    lines.push('- none');
  } else {
    for (const source of report.sources) {
      const ref = source.ref || '(unresolved)';
      const status = source.status ? ` status=${source.status}` : '';
      const issue = source.issue ? ` issue=${source.issue}` : '';
      lines.push(`- ${source.source_id}: ${ref}${status}${issue}`);
    }
  }

  lines.push('', 'Planned changes:');
  if (report.reconciliation.planned_changes.length === 0) {
    lines.push('- none');
  } else {
    for (const change of report.reconciliation.planned_changes) {
      lines.push(`- ${change}`);
    }
  }

  lines.push('', 'Risks:');
  if (report.reconciliation.risks.length === 0) {
    lines.push('- none');
  } else {
    for (const risk of report.reconciliation.risks) {
      lines.push(`- ${risk}`);
    }
  }

  lines.push('', options.dryRun ? 'No files were changed.' : 'This command is read-only; use start-slice or cleanup-slice for intentional writes.');
  return `${lines.join('\n')}\n`;
}

function canonicalRunApprovalRowMismatches(repoRoot, run, approval) {
  if (!approval || typeof approval !== 'object' || Array.isArray(approval)) {
    return ['entry'];
  }
  const canonicalFields = [
    'schema_version',
    'run_id',
    'decision_id',
    'decision',
    'artifact_sha256',
    'input_sha256',
    'criterion_count',
  ];
  const artifactPath = String(approval.artifact || '').replace(/\\/g, '/');
  const canonical = artifactPath.startsWith('.quiver/runs/')
    || canonicalFields.some((field) => (
      Object.prototype.hasOwnProperty.call(approval, field)
    ));
  if (!canonical) {
    const legacyMismatches = [];
    if (!['acceptance', 'technical-plan'].includes(approval.phase)) {
      legacyMismatches.push('phase');
    } else if (artifactPath !== `.quiver/approvals/${approval.phase}/approved.md`) {
      legacyMismatches.push('artifact');
    }
    if (approval.version !== null
        && (!Number.isInteger(approval.version) || approval.version <= 0)) {
      legacyMismatches.push('version');
    }
    if (Number.isNaN(Date.parse(String(approval.at || '')))) legacyMismatches.push('at');
    return legacyMismatches;
  }

  const mismatches = [];
  const digestPattern = /^sha256:[a-f0-9]{64}$/;
  if (approval.schema_version !== 1) mismatches.push('schema_version');
  if (approval.run_id !== run.run_id) mismatches.push('run_id');
  if (!/^A-\d{3,}$/.test(String(approval.decision_id || ''))) mismatches.push('decision_id');
  if (!['acceptance', 'technical-plan'].includes(approval.phase)) mismatches.push('phase');
  if (!['approved', 'approved-with-conditions'].includes(approval.decision)) mismatches.push('decision');
  if (!Number.isInteger(approval.version) || approval.version <= 0) mismatches.push('version');
  if (!digestPattern.test(String(approval.artifact_sha256 || ''))) mismatches.push('artifact_sha256');
  if (!digestPattern.test(String(approval.input_sha256 || ''))) mismatches.push('input_sha256');
  if (!Number.isInteger(approval.criterion_count) || approval.criterion_count < 0) {
    mismatches.push('criterion_count');
  }
  if (Number.isNaN(Date.parse(String(approval.at || '')))) mismatches.push('at');

  if (['acceptance', 'technical-plan'].includes(approval.phase)
      && Number.isInteger(approval.version)
      && approval.version > 0) {
    const expectedArtifact = path.relative(
      repoRoot,
      runApprovalArtifactPath(repoRoot, run.run_id, approval.phase, approval.version),
    ).split(path.sep).join('/');
    if (approval.artifact !== expectedArtifact) mismatches.push('artifact');
  } else if (typeof approval.artifact !== 'string' || !approval.artifact) {
    mismatches.push('artifact');
  }
  return [...new Set(mismatches)];
}

function readRunApprovals(repoRoot, run) {
  const canonicalPath = path.relative(repoRoot, runApprovalsPath(repoRoot, run.run_id)).split(path.sep).join('/');
  if (run?.approvals_path !== canonicalPath) {
    throw new GovernanceError(
      'APPROVAL_BINDING_MISMATCH',
      `Run '${run?.run_id || 'unknown'}' approval projection path is not canonical.`,
      { run_id: run?.run_id || null, mismatches: ['run.approvals_path'] },
    );
  }
  const source = readApprovalBindingFile(
    repoRoot,
    canonicalPath,
    'Run approval projection',
    'approvals.json',
  );
  let parsed;
  try {
    parsed = JSON.parse(source.bytes.toString('utf8'));
  } catch (error) {
    throw new GovernanceError(
      'APPROVAL_BINDING_MISMATCH',
      `Run '${run.run_id}' approval projection is not valid JSON.`,
      { run_id: run.run_id, mismatches: ['approvals.json'], cause: error.message },
    );
  }
  if (parsed?.schema_version !== 1
      || parsed?.run_id !== run.run_id
      || !Array.isArray(parsed?.approvals)) {
    throw new GovernanceError(
      'APPROVAL_BINDING_MISMATCH',
      `Run '${run.run_id}' approval projection does not match its canonical namespace.`,
      { run_id: run.run_id, mismatches: ['approvals.json'] },
    );
  }
  for (const [index, approval] of parsed.approvals.entries()) {
    const mismatches = canonicalRunApprovalRowMismatches(repoRoot, run, approval);
    if (mismatches.length > 0) {
      throw new GovernanceError(
        'APPROVAL_BINDING_MISMATCH',
        `Run '${run.run_id}' approval projection contains an invalid canonical approval entry.`,
        {
          run_id: run.run_id,
          mismatches: mismatches.map((field) => `approvals[${index}].${field}`),
        },
      );
    }
  }
  return parsed.approvals;
}

function collectRunApprovalRows(repoRoot) {
  const activeRun = resolveAiRun(repoRoot, '');
  return listAiRuns(repoRoot)
    .flatMap((run) => readRunApprovals(repoRoot, run).map((approval) => ({
      run,
      approval,
      relation: activeRun && run.run_id === activeRun.run_id
        ? 'active'
        : run.status === 'closed'
          ? 'historical'
          : 'other-open',
    })));
}

function approvalArtifactForRelation(report) {
  return report?.approved?.path || report?.draft?.path || '';
}

function classifyGlobalApprovalRelation(report, runApprovalRows) {
  const artifact = approvalArtifactForRelation(report);
  if (!artifact || report.status === 'missing') {
    return 'none';
  }
  const matches = runApprovalRows.filter((row) => row.approval?.artifact === artifact);
  if (matches.some((row) => row.relation === 'active')) {
    return 'active';
  }
  if (matches.length > 0) {
    return 'historical';
  }
  return 'orphaned';
}

function formatRunScopedApprovals(repoRoot, runApprovalRows, options = {}) {
  const translator = translatorForHuman(options);
  const runs = listAiRuns(repoRoot);
  const activeRun = resolveAiRun(repoRoot, '');
  const lines = [
    translator.t('ai.approvals.run_scoped'),
    `${translator.t('ai.approvals.active_run')}: ${activeRun ? activeRun.run_id : translator.t('ai.approvals.none_value')}`,
  ];

  if (runs.length === 0) {
    lines.push(`- ${translator.t('ai.approvals.no_ai_runs')}`);
    return `${lines.join('\n')}\n`;
  }

  for (const run of runs.slice().reverse()) {
    const relation = activeRun && run.run_id === activeRun.run_id
      ? 'active'
      : run.status === 'closed'
        ? 'historical'
        : 'other-open';
    const approvals = runApprovalRows.filter((row) => row.run.run_id === run.run_id);
    lines.push(`${translator.t('ai.run.run')}: ${run.run_id} (${translator.t(`ai.approvals.relation.${relation}`)}, ${translator.t('ai.run.phase').toLowerCase()}: ${run.phase}, ${translator.t('ai.run.status').toLowerCase()}: ${formatStatus(run.status, translator)})`);
    if (approvals.length === 0) {
      lines.push(`- ${translator.t('ai.approvals.no_run_scoped')}`);
      continue;
    }
    for (const row of approvals) {
      const version = row.approval.version ? ` v${row.approval.version}` : '';
      lines.push(`- ${row.approval.phase || 'unknown'}${version}: ${row.approval.artifact || '(missing artifact)'}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

function formatApprovalStatusReport(repoRoot) {
  return formatApprovalStatusReportWithOptions(repoRoot);
}

function localizeApprovalSummary(text, translator) {
  if (translator.language === 'en') {
    return text;
  }

  return String(text || '')
    .split('\n')
    .map((line) => {
      let match = line.match(/^Phase: (.+)$/);
      if (match) return `${translator.t('ai.run.phase')}: ${match[1]}`;
      match = line.match(/^Status: (.+)$/);
      if (match) return `${translator.t('ai.run.status')}: ${formatStatus(match[1], translator)}`;
      match = line.match(/^Draft( v\d+)?: (.+)$/);
      if (match) return `${translator.t('ai.approvals.draft')}${match[1] || ''}: ${match[2]}`;
      if (line === 'Draft history:') return `${translator.t('ai.approvals.draft_history')}:`;
      match = line.match(/^Approved( v\d+)?: (.+)$/);
      if (match) return `${translator.t('ai.approvals.approved')}${match[1] || ''}: ${match[2]}`;
      match = line.match(/^Source file: (.+)$/);
      if (match) return `${translator.t('ai.approvals.source_file')}: ${match[1]}`;
      match = line.match(/^Review: (.+)$/);
      if (match) return `${translator.t('ai.approvals.review')}: ${match[1]}`;
      match = line.match(/^Approval recommendation: (.+)$/);
      if (match) return `${translator.t('ai.approvals.approval_recommendation')}: ${match[1]}`;
      match = line.match(/^Blocking: (yes|no)$/);
      if (match) return `${translator.t('ai.approvals.blocking')}: ${translator.t(match[1] === 'yes' ? 'common.yes' : 'common.no')}`;
      match = line.match(/^Required fixes: (.+)$/);
      if (match) return `${translator.t('ai.approvals.required_fixes')}: ${match[1]}`;
      match = line.match(/^Optional hardening: (.+)$/);
      if (match) return `${translator.t('ai.approvals.optional_hardening')}: ${match[1]}`;
      match = line.match(/^Next command: (.+)$/);
      if (match) return `${translator.t('ai.approvals.next_command')}: ${match[1]}`;
      return line;
    })
    .join('\n');
}

function localizeApprovalDecisionLine(line, translator) {
  if (translator.language === 'en') {
    return line;
  }
  return String(line || '')
    .replace(/^Candidates:/, translator.t('ai.approvals.candidates') + ':')
    .replace(/^Latest draft:/, translator.t('ai.approvals.latest_draft') + ':')
    .replace(/^Current candidate:/, translator.t('ai.approvals.current_candidate') + ':')
    .replace(/^Recommended approval:/, translator.t('ai.approvals.recommended_approval') + ':')
    .replace(/^Recommended next command:/, translator.t('ai.approvals.recommended_next_command') + ':')
    .replace(/^Review status:/, translator.t('ai.approvals.review_status') + ':');
}

function formatApprovalStatusReportWithOptions(repoRoot, options = {}) {
  const translator = translatorForHuman(options);
  const runApprovalRows = collectRunApprovalRows(repoRoot);
  const sections = [
    translator.t('ai.approvals.title'),
    formatRunScopedApprovals(repoRoot, runApprovalRows, options).trimEnd(),
    translator.t('ai.approvals.global_planner'),
  ];
  for (const phase of PLANNER_APPROVAL_PHASES) {
    const summary = localizeApprovalSummary(summarizePlannerApproval(repoRoot, phase).trimEnd(), translator);
    const relation = classifyGlobalApprovalRelation(readPhaseApproval(repoRoot, phase), runApprovalRows);
    const candidates = buildApprovalCandidateReport(repoRoot, phase);
    const decisionLines = formatApprovalDecisionLines(candidates)
      .map((line) => `- ${localizeApprovalDecisionLine(line, translator)}`)
      .join('\n');
    sections.push(`${summary}\n${translator.t('ai.approvals.run_relation')}: ${translator.t(`ai.approvals.relation.${relation}`)}${decisionLines ? `\n${translator.t('ai.approvals.approval_candidates')}:\n${decisionLines}` : ''}`);
  }
  sections.push(localizeApprovalSummary(summarizePlanReview(repoRoot).trimEnd(), translator));
  return `${sections.join('\n\n')}\n`;
}

function annotateProviderError(error, scope, phase) {
  const phaseLabel = phase ? ` phase '${phase}'` : '';
  const message = error && error.message ? error.message : String(error);
  const wrapped = new Error(formatError(`ai ${scope}${phaseLabel} failed: ${message}`));
  wrapped.cause = error;
  wrapped.code = error && error.code ? error.code : 'AI_PROVIDER_ERROR';
  wrapped.details = error && error.details ? error.details : undefined;
  return wrapped;
}

function annotateGitHubError(error, scope) {
  const message = error && error.message ? error.message : String(error);
  const wrapped = new Error(formatError(`ai ${scope} failed: ${message}`));
  wrapped.cause = error;
  wrapped.code = error && error.code ? error.code : 'AI_GITHUB_PR_ERROR';
  wrapped.details = error && error.details ? error.details : undefined;
  return wrapped;
}

async function runOnboard(repoRoot, options = {}) {
  const role = normalizeRole(options.role || DEFAULT_ONBOARD_ROLE);
  const runtimeProfile = resolveRuntimeAgentProfile(repoRoot, role, options, DEFAULT_ONBOARD_PROVIDER);
  const provider = runtimeProfile.provider;
  const context = options.context || DEFAULT_ONBOARD_CONTEXT;
  const timeoutMs = normalizeTimeout(options.timeout);
  const inputText = readTextFile(options.input, repoRoot);
  const contextInfo = buildOnboardContext({ role, context, inputText, inputPath: options.input, repoRoot });
  const prompt = contextInfo.prompt;
  let invocation;

  try {
    invocation = buildProviderInvocation(provider, {
      prompt,
      cwd: repoRoot,
      timeoutMs,
        ...runtimeModelExecutionOptions(runtimeProfile, options),
      enforceModelSelection: false,
    });
  } catch (error) {
    if (error.providerResult) {
      result = error.providerResult;
    } else {
      throw annotateProviderError(error, 'onboard');
    }
  }

  if (options.dryRun) {
    const report = {
      task: 'onboard',
      provider,
      role,
      contextPack: context,
      invocation,
      language: options.language,
      onboardingPlan: contextInfo.plan,
      profile: runtimeProfile,
    };
    process.stdout.write(formatDryRunReport(report));
    return report;
  }

  if (options.printPrompt) {
    const report = {
      task: 'onboard',
      provider,
      role,
      contextPack: context,
      invocation,
      language: options.language,
      onboardingPlan: contextInfo.plan,
      prompt,
      profile: runtimeProfile,
    };
    process.stdout.write(formatPromptOnlyReport(report));
    return report;
  }

  const ux = createCommandUx(options);
  const showProgress = shouldShowHumanProgress(ux, options);
  const progressTranslator = createTranslator(options.language);
  writeProgressChecks(
    ux,
    showProgress,
    plannerProgressTitle(progressTranslator.t('ai.planner.progress.onboarding'), runtimeProfile, options),
    [
      progressTranslator.t('ai.planner.progress.reading_base_docs'),
      progressTranslator.t('ai.planner.progress.detecting_structure'),
      progressTranslator.t('ai.planner.progress.preparing_prompt'),
    ],
  );

  let result;
  try {
    result = await runProviderWithProgress({
      ux,
      enabled: showProgress,
      message: progressTranslator.t('ai.planner.progress.running_agent'),
      successMessage: progressTranslator.t('ai.planner.progress.agent_finished'),
      failureMessage: progressTranslator.t('ai.planner.progress.agent_failed'),
      run: () => (options.runProviderFn || runProvider)(provider, {
        prompt,
        cwd: repoRoot,
        timeoutMs,
        dryRun: false,
        probe: options.probe,
        spawn: options.spawn,
        tempRoot: options.tempRoot,
        tempFileName: options.tempFileName,
        tempFilePrefix: options.tempFilePrefix,
        ...runtimeModelExecutionOptions(runtimeProfile, options),
        enforceModelSelection: Boolean(runtimeProfile.model),
      }),
    });
  } catch (error) {
    throw annotateProviderError(error, 'onboard');
  }

  if (!result.ok) {
    writeProviderOutput(result);
    throw annotateProviderError(result.error || new Error('provider run failed'), 'onboard');
  }

  const clean = extractCleanProviderOutput(result, { prompt, projectRoot: repoRoot });
  writeCleanProviderOutput(clean);

  return {
    task: 'onboard',
    provider,
    role,
    contextPack: context,
    invocation,
    onboardingPlan: contextInfo.plan,
    profile: runtimeProfile,
    result,
  };
}

async function runPrepareContext(repoRoot, options = {}) {
  if (options.withPlanner === true) {
    return runPrepareContextWithPlanner(repoRoot, options);
  }

  const draftPack = buildContextPreparationDrafts(repoRoot);
  const writePlan = buildContextWritePlan(repoRoot, draftPack.docs);
  const report = {
    task: 'prepare-context',
    dryRun: options.dryRun === true,
    docs: draftPack.docs.map((doc) => doc.path),
    plan: draftPack.plan,
    writePlan: writePlan.map((item) => ({
      path: item.path,
      action: item.action,
      reason: item.reason,
    })),
  };

  if (options.dryRun) {
    process.stdout.write(formatContextPreparationReport({
      dryRun: true,
      plan: draftPack.plan,
      writePlan,
      writtenDocs: [],
      language: options.language,
    }));
    return report;
  }

  const lifecycleRun = ensureAiRun(repoRoot, {
    command: 'ai prepare-context',
    input: options.input || '',
    runId: options.runId,
    phase: 'created',
  });
  const snapshot = createContextSnapshots(repoRoot, lifecycleRun, writePlan, options.now || new Date());
  const plannedDocs = writePlan.filter((item) => item.action !== 'skip').map((item) => item.path);
  process.stdout.write(formatContextPreparationReport({
    dryRun: false,
    plan: draftPack.plan,
    writePlan,
    writtenDocs: plannedDocs,
    snapshot,
    language: options.language,
  }));
  const writtenDocs = writeDraftDocs(writePlan);
  updateAiRunPhase(repoRoot, lifecycleRun.run_id, 'onboarding-ready', {
    artifact: snapshot.manifestPath,
    command: 'ai prepare-context',
  });
  process.stdout.write(formatContextPreparationReport({
    dryRun: false,
    plan: draftPack.plan,
    writePlan,
    writtenDocs,
    snapshot,
    completed: true,
    language: options.language,
  }));

  return {
    ...report,
    runId: lifecycleRun.run_id,
    snapshot,
    writtenDocs,
  };
}

async function runAnalyzeProject(repoRoot, options = {}) {
  assertAnalyzeProjectCommandContract(options);
  if (options.applyRun === true) {
    return applyAnalyzeProjectSavedProposalRun(repoRoot, options);
  }
  if (options.applyDocs === true && options.force !== true && !canUseAnalyzeProjectInteractiveSelector(options)) {
    throw analyzeProjectContractError(
      'ai analyze-project --apply-docs requires an interactive TTY unless --yes is passed. No provider was run and no files were written.',
      'Use `npx create-quiver ai analyze-project --deep --apply-docs --yes --provider <provider> --model <model>` for automation, or rerun from an interactive terminal.',
    );
  }

  const role = normalizeRole(options.role || DEFAULT_PLAN_ROLE);
  const runtimeProfile = resolveRuntimeAgentProfile(repoRoot, role, options, DEFAULT_PLAN_PROVIDER);
  const provider = runtimeProfile.provider;
  const ux = createCommandUx(options);
  const showProgress = shouldShowHumanProgress(ux, { ...options, linearProgress: true });
  const progressTranslator = createTranslator(options.language);
  const progressTitle = plannerProgressTitle(
    progressTranslator.t('ai.planner.progress.analyze_project'),
    runtimeProfile,
    options,
  );

  if (showProgress) {
    ux.heading(progressTitle);
  }

  const report = buildAnalyzeProjectReport(repoRoot, options);
  if (options.dryRun === true) {
    if (options.json === true) {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      return report;
    }
    process.stdout.write(formatAnalyzeProjectReport(report));
    return report;
  }

  const timeoutMs = normalizeTimeout(options.timeout);
  writeProgressCheck(ux, showProgress, progressTranslator.t('ai.planner.progress.reading_base_docs'));
  writeProgressCheck(ux, showProgress, progressTranslator.t('ai.planner.progress.detecting_structure'));
  writeProgressCheck(ux, showProgress, progressTranslator.t('ai.planner.progress.selecting_sample'));
  const promptPackage = buildAnalyzeProjectPrompt({
    analysisPlan: report,
    repoRoot,
    maxFileBytes: options.maxPromptFileBytes,
    maxTotalFileBytes: options.maxPromptTotalBytes,
  });
  const prompt = promptPackage.prompt;
  const promptLimit = assertProviderPromptWithinLimit(prompt, options.promptLimitOptions || {});
  const privacyPreflight = promptPackage.privacyPreflight;
  const auditRunId = options.runId || createAnalyzeProjectAuditRunId(options.now || new Date());
  writeProgressCheck(ux, showProgress, progressTranslator.t('ai.planner.progress.preparing_prompt'));

  if (!privacyPreflight.ok) {
    const error = new Error(formatError('ai analyze-project privacy preflight failed; provider execution was blocked before sending repository content.'));
    error.code = 'AI_ANALYZE_PROJECT_PRIVACY_PREFLIGHT_FAILED';
    error.details = privacyPreflight;
    throw error;
  }

  let invocation;
  try {
    invocation = buildProviderInvocation(provider, {
      prompt,
      cwd: repoRoot,
      timeoutMs,
      ...runtimeModelExecutionOptions(runtimeProfile, options),
      enforceModelSelection: false,
    });
  } catch (error) {
    throw annotateProviderError(error, 'analyze-project');
  }

  if (options.printPrompt) {
    process.stdout.write(prompt.endsWith('\n') ? prompt : `${prompt}\n`);
    return {
      ...report,
      provider,
      role,
      invocation,
      privacy_preflight: privacyPreflight,
      prompt: {
        bytes: promptLimit.bytes,
        max_provider_prompt_bytes: promptLimit.maxProviderPromptBytes,
        files: promptPackage.files,
      },
    };
  }

  const selectedContextManifest = writeSelectedContextManifest(
    repoRoot,
    buildSelectedContextManifest({
      analysisPlan: report,
      promptPackage,
      promptLimit,
      provider,
      runId: auditRunId,
      now: options.now,
    }),
    {
      runId: auditRunId,
      now: options.now,
    },
  );

  const maxRetries = normalizeAnalyzeProjectMaxRetries(options.maxAnalyzeProjectRetries);
  const providerAttempts = [];
  let result;
  let clean;
  let parsed;
  let repairManifest = null;
  let retryManifest = null;
  let currentPrompt = prompt;
  const rawProviderArtifacts = [];

  for (let attemptIndex = 0; attemptIndex <= maxRetries; attemptIndex += 1) {
    try {
      result = await runProviderWithProgress({
        ux,
        enabled: showProgress,
        message: attemptIndex === 0
          ? progressTranslator.t('ai.planner.progress.running_agent')
          : `Retrying agent (${attemptIndex}/${maxRetries})...`,
        successMessage: progressTranslator.t('ai.planner.progress.agent_finished'),
        failureMessage: progressTranslator.t('ai.planner.progress.agent_failed'),
        failOnProviderResult: false,
        run: () => (options.runProviderFn || runProvider)(provider, {
          prompt: currentPrompt,
          cwd: repoRoot,
          timeoutMs,
          dryRun: false,
          probe: options.probe,
          spawn: options.spawn,
          tempRoot: options.tempRoot,
          tempFileName: options.tempFileName,
          tempFilePrefix: options.tempFilePrefix,
          ...runtimeModelExecutionOptions(runtimeProfile, options),
          enforceModelSelection: false,
        }),
      });
    } catch (error) {
      throw annotateProviderError(error, 'analyze-project');
    }

    rawProviderArtifacts.push(writeRawProviderArtifact(repoRoot, auditRunId, `analyze-project-provider-attempt-${attemptIndex + 1}`, result, {
      now: options.now,
      metadata: {
        attempt: attemptIndex + 1,
        retry: attemptIndex > 0,
      },
    }));
    writeProgressCheck(ux, showProgress, progressTranslator.t('ai.planner.progress.writing_artifacts'));
    if (!result.ok) {
      writeProgressInfo(ux, showProgress, progressTranslator.t('ai.planner.progress.agent_failed'));
      writeAnalyzeProjectRunStatus(repoRoot, auditRunId, 'failed', {
        now: options.now,
        provider,
        attempts: [{
          attempt: attemptIndex + 1,
          status: 'provider-failed',
          retry: attemptIndex > 0,
        }],
        artifacts: {
          selected_context: selectedContextManifest,
          raw_provider: rawProviderArtifacts.map((artifact) => artifact.path),
        },
      });
      throw annotateProviderError(result.error || new Error('provider run failed'), 'analyze-project');
    }

    clean = extractCleanProviderOutput(result, { prompt: currentPrompt, projectRoot: repoRoot });
    try {
      parsed = parseAnalyzeProjectOutputWithRepair(clean.cleanOutput, {
        selectedFiles: report.selected_files,
        promptFiles: promptPackage.files,
      });
      writeProgressCheck(ux, showProgress, progressTranslator.t('ai.planner.progress.validating_schema'));
      if (parsed.repairManifest) {
        repairManifest = writeAnalyzeProjectRepairManifest(repoRoot, parsed.repairManifest, {
          runId: auditRunId,
          now: options.now,
        });
        writeProgressCheck(ux, showProgress, progressTranslator.t('ai.planner.progress.repairing_schema'));
      }
      providerAttempts.push({
        attempt: attemptIndex + 1,
        status: 'valid',
        retry: attemptIndex > 0,
        parse_source: parsed.parseSource,
        repaired: parsed.repaired === true,
        repair_manifest: repairManifest,
      });
      if (providerAttempts.length > 1) {
        retryManifest = writeAnalyzeProjectRetryManifest(repoRoot, {
          provider,
          command: 'ai analyze-project',
          runId: auditRunId,
          now: options.now,
          maxRetries,
          finalStatus: 'valid',
          attempts: providerAttempts,
        });
      }
      writeAnalyzeProjectRunStatus(repoRoot, auditRunId, 'completed', {
        now: options.now,
        provider,
        attempts: providerAttempts,
        artifacts: {
          selected_context: selectedContextManifest,
          raw_provider: rawProviderArtifacts.map((artifact) => artifact.path),
          repair: repairManifest,
          retry: retryManifest,
        },
      });
      break;
    } catch (error) {
      let attemptRepairManifest = null;
      if (error.repair_manifest) {
        try {
          attemptRepairManifest = writeAnalyzeProjectRepairManifest(repoRoot, error.repair_manifest, {
            runId: auditRunId,
            now: options.now,
          });
        } catch {
          attemptRepairManifest = null;
        }
      }
      const retryable = isAnalyzeProjectRetryableError(error);
      providerAttempts.push({
        attempt: attemptIndex + 1,
        status: 'invalid',
        retry: attemptIndex > 0,
        retryable,
        issue_count: Array.isArray(error.issues) ? error.issues.length : 0,
        groups: groupAnalyzeProjectIssues(error.issues, { maxExamplesPerGroup: 2 }),
        repair_manifest: attemptRepairManifest,
      });

      if (retryable && attemptIndex < maxRetries) {
        writeProgressInfo(ux, showProgress, progressTranslator.t('ai.planner.progress.retrying_agent'));
        currentPrompt = buildAnalyzeProjectRetryPrompt({
          previousOutput: clean.cleanOutput,
          issueLines: formatAnalyzeProjectIssues(error.issues, 6),
          attempt: attemptIndex + 1,
          maxRetries,
        });
        continue;
      }

      if (providerAttempts.length > 1) {
        retryManifest = writeAnalyzeProjectRetryManifest(repoRoot, {
          provider,
          command: 'ai analyze-project',
          runId: auditRunId,
          now: options.now,
          maxRetries,
          finalStatus: 'invalid',
          attempts: providerAttempts,
        });
      }

      const recovery = buildAnalyzeProjectEvidenceRecovery(repoRoot, error, report, {
        ...options,
        provider,
      });
      let validationManifest = null;
      try {
        validationManifest = writeAnalyzeProjectValidationManifest(repoRoot, {
          error,
          provider,
          command: 'ai analyze-project',
          runId: auditRunId,
          now: options.now,
          recovery,
          retry: {
            attempts: providerAttempts.length,
            max_retries: maxRetries,
            retryable,
            exhausted: retryable && attemptIndex >= maxRetries,
            manifest: retryManifest,
          },
        });
      } catch {
        validationManifest = null;
      }
      writeAnalyzeProjectRunStatus(repoRoot, auditRunId, 'failed', {
        now: options.now,
        provider,
        attempts: providerAttempts,
        artifacts: {
          selected_context: selectedContextManifest,
          raw_provider: rawProviderArtifacts.map((artifact) => artifact.path),
          repair: attemptRepairManifest,
          retry: retryManifest,
          validation: validationManifest,
        },
      });
      const enhancedError = enhanceAnalyzeProjectAnalysisError(error, {
        validationManifest,
        repairManifest: attemptRepairManifest,
        retryManifest,
        recovery,
        translator: progressTranslator,
      });
      if (options.json === true) {
        process.stdout.write(`${JSON.stringify({
          schema_version: 1,
          kind: 'quiver-analyze-project-error',
          ok: false,
          error: {
            code: enhancedError.code || null,
            message: error.message,
          },
          recovery,
          manifests: {
            repair: attemptRepairManifest,
            retry: retryManifest,
            validation: validationManifest,
          },
        }, null, 2)}\n`);
      }
      throw enhancedError;
    }
  }
  const completedReport = {
    ...report,
    provider,
    role,
    provider_execution: 'completed',
    invocation,
    privacy_preflight: privacyPreflight,
    prompt: {
      bytes: promptLimit.bytes,
      max_provider_prompt_bytes: promptLimit.maxProviderPromptBytes,
      files: promptPackage.files,
    },
    analysis: parsed.analysis,
    analysis_validation: {
      parse_source: parsed.parseSource,
      warnings: parsed.warnings,
      doc_update_paths: parsed.docUpdatePaths,
      repaired: parsed.repaired === true,
      repair_manifest: repairManifest,
      retry_count: Math.max(0, providerAttempts.length - 1),
      retry_manifest: retryManifest,
    },
    provider_artifact: buildAnalyzeProjectProviderArtifact(result, clean, repoRoot),
    raw_provider_artifacts: rawProviderArtifacts.map((artifact) => artifact.path),
    provider_attempts: providerAttempts,
    run_id: auditRunId,
    run_status_path: path.join('.quiver', 'runs', auditRunId, 'status.json').split(path.sep).join('/'),
    selected_context_manifest: selectedContextManifest,
  };
  const autoApplyDocs = options.applyDocs !== true
    && options.saveProposal !== true
    && options.review !== true
    && options.json !== true;
  const needsDocProposal = autoApplyDocs || options.applyDocs === true || options.saveProposal === true || options.review === true;
  const docProposal = needsDocProposal ? buildAnalyzeProjectDocProposal(parsed.analysis) : null;
  const docWritePlan = docProposal ? buildAnalyzeProjectWritePlan(repoRoot, docProposal) : [];
  const docActionContext = {
    auditRunId,
    commandOptions: options,
    completedReport,
    proposal: docProposal,
    writePlan: docWritePlan,
    provider,
    providerAttempts,
    rawProviderArtifacts,
    selectedContextManifest,
    repairManifest,
    retryManifest,
  };

  if (options.applyDocs === true && options.force === true) {
    const applyReport = applyAnalyzeProjectDocProposalReport(repoRoot, {
      ...docActionContext,
      allowDirtyDocs: options.allowDirtyDocs === true,
    });
    return emitAnalyzeProjectApplyReport(applyReport, options);
  }

  if (autoApplyDocs) {
    const applyReport = applyAnalyzeProjectDocProposalReport(repoRoot, {
      ...docActionContext,
      allowDirtyDocs: true,
      interactiveAction: 'auto-apply',
    });
    return emitAnalyzeProjectApplyReport(applyReport, options);
  }

  if (options.applyDocs === true) {
    return runAnalyzeProjectInteractiveApplySelector({
      report: completedReport,
      proposal: docProposal,
      writePlan: docWritePlan,
      options,
      actions: {
        apply: ({ allowDirtyDocs, interactiveAction }) => {
          const applyReport = applyAnalyzeProjectDocProposalReport(repoRoot, {
            ...docActionContext,
            allowDirtyDocs,
            interactiveAction,
          });
          return emitAnalyzeProjectApplyReport(applyReport, options);
        },
        save: ({ interactiveAction, silent, savedReport } = {}) => {
          const saveReport = savedReport || saveAnalyzeProjectDocProposalReport(repoRoot, {
            ...docActionContext,
            interactiveAction,
          });
          if (silent !== true) {
            process.stdout.write(formatAnalyzeProjectSavedProposalReport(saveReport));
          }
          return saveReport;
        },
        edit: ({ interactiveAction } = {}) => reviewAndWriteAnalyzeProjectDocs(repoRoot, {
          commandOptions: options,
          completedReport,
          initialProposal: docProposal,
          interactiveAction,
        }),
        cancel: ({ interactiveAction, savedReport } = {}) => cancelAnalyzeProjectInteractiveApplyReport(repoRoot, {
          ...docActionContext,
          interactiveAction,
          savedReport,
        }),
      },
    });
  }

  if (options.saveProposal === true) {
    const saveReport = saveAnalyzeProjectDocProposalReport(repoRoot, docActionContext);

    if (options.json === true) {
      process.stdout.write(`${JSON.stringify(saveReport, null, 2)}\n`);
      return saveReport;
    }

    process.stdout.write(formatAnalyzeProjectSavedProposalReport(saveReport));
    return saveReport;
  }

  if (options.review === true) {
    return reviewAndWriteAnalyzeProjectDocs(repoRoot, {
      commandOptions: options,
      completedReport,
      initialProposal: docProposal,
    });
  }

  if (options.json === true) {
    process.stdout.write(`${JSON.stringify(completedReport, null, 2)}\n`);
    return completedReport;
  }

  process.stdout.write(formatAnalyzeProjectLiveReport(completedReport));
  return completedReport;
}

async function runPrepareContextWithPlanner(repoRoot, options = {}) {
  const role = normalizeRole(options.role || DEFAULT_PLAN_ROLE);
  const runtimeProfile = resolveRuntimeAgentProfile(repoRoot, role, options, DEFAULT_PLAN_PROVIDER);
  const provider = runtimeProfile.provider;
  const context = options.context || DEFAULT_PLAN_CONTEXT;
  const timeoutMs = normalizeTimeout(options.timeout);
  const draftPack = buildContextPreparationDrafts(repoRoot);
  const pack = buildContextPackMetadata({
    role,
    packName: context,
    repoRoot,
  });
  const promptInfo = buildPrepareContextPlannerPrompt({ pack, draftPack });
  const prompt = promptInfo.prompt;
  assertProviderPromptWithinLimit(prompt, options.promptLimitOptions || {});
  let invocation;

  try {
    invocation = buildProviderInvocation(provider, {
      prompt,
      cwd: repoRoot,
      timeoutMs,
        ...runtimeModelExecutionOptions(runtimeProfile, options),
      enforceModelSelection: false,
    });
  } catch (error) {
    if (error.providerResult) {
      result = error.providerResult;
    } else {
      throw annotateProviderError(error, 'prepare-context');
    }
  }

  if (options.dryRun) {
    const report = {
      task: 'prepare-context',
      mode: 'planner',
      dryRun: true,
      provider,
      role,
      contextPack: context,
      invocation,
      candidateDocs: promptInfo.allowedPaths,
      plan: draftPack.plan,
      profile: runtimeProfile,
    };
    process.stdout.write(formatPrepareContextPlannerDryRunReport({
      provider,
      role,
      context,
      invocation,
      promptInfo,
      review: options.review === true,
      interactive: options.interactive === true,
      language: options.language,
    }));
    return report;
  }

  if (options.printPrompt) {
    const report = {
      task: 'prepare-context',
      provider,
      role,
      contextPack: context,
      invocation,
      prompt,
      promptSource: promptInfo.promptSource,
      profile: runtimeProfile,
    };
    process.stdout.write(formatPromptOnlyReport(report));
    return report;
  }

  const ux = createCommandUx(options);
  const showProgress = shouldShowHumanProgress(ux, options);
  const progressTranslator = createTranslator(options.language);
  writeProgressChecks(
    ux,
    showProgress,
    plannerProgressTitle(progressTranslator.t('ai.planner.progress.onboarding'), runtimeProfile, options),
    [
      progressTranslator.t('ai.planner.progress.reading_base_docs'),
      progressTranslator.t('ai.planner.progress.detecting_structure'),
      progressTranslator.t('ai.planner.progress.preparing_prompt'),
    ],
  );

  let result;
  try {
    result = await runProviderWithProgress({
      ux,
      enabled: showProgress,
      message: progressTranslator.t('ai.planner.progress.running_agent'),
      successMessage: progressTranslator.t('ai.planner.progress.agent_finished'),
      failureMessage: progressTranslator.t('ai.planner.progress.agent_failed'),
      run: () => (options.runProviderFn || runProvider)(provider, {
        prompt,
        cwd: repoRoot,
        timeoutMs,
        dryRun: false,
        probe: options.probe,
        spawn: options.spawn,
        tempRoot: options.tempRoot,
        tempFileName: options.tempFileName,
        tempFilePrefix: options.tempFilePrefix,
        ...runtimeModelExecutionOptions(runtimeProfile, options),
        enforceModelSelection: Boolean(runtimeProfile.model),
      }),
    });
  } catch (error) {
    throw annotateProviderError(error, 'prepare-context');
  }

  if (!result.ok) {
    writeProviderOutput(result);
    throw annotateProviderError(result.error || new Error('provider run failed'), 'prepare-context');
  }

  const clean = extractCleanProviderOutput(result, { prompt, projectRoot: repoRoot });
  let proposal = parseContextProposalOutput(clean.cleanOutput);
  let reviewPath = '';

  if (options.review === true) {
    const reviewed = await reviewPlannerContextProposal(repoRoot, proposal, options);
    proposal = reviewed.proposal;
    reviewPath = reviewed.reviewPath;
  }

  const writePlan = buildPlannerContextWritePlan(repoRoot, proposal);
  await confirmPlannerContextWrites(writePlan, options);

  const lifecycleRun = ensureAiRun(repoRoot, {
    command: 'ai prepare-context --with-planner',
    input: options.input || '',
    runId: options.runId,
    phase: 'created',
  });
  const snapshot = createContextSnapshots(repoRoot, lifecycleRun, writePlan, options.now || new Date());
  const plannedDocs = writePlan.filter((item) => item.action !== 'skip').map((item) => item.path);

  process.stdout.write(formatContextPreparationReport({
    dryRun: false,
    plan: draftPack.plan,
    writePlan,
    writtenDocs: plannedDocs,
    snapshot,
    language: options.language,
  }));

  const writtenDocs = writeDraftDocs(writePlan);
  updateAiRunPhase(repoRoot, lifecycleRun.run_id, 'onboarding-ready', {
    artifact: snapshot.manifestPath,
    command: 'ai prepare-context --with-planner',
  });
  process.stdout.write(formatContextPreparationReport({
    dryRun: false,
    plan: draftPack.plan,
    writePlan,
    writtenDocs,
    snapshot,
    completed: true,
    language: options.language,
  }));

  return {
    task: 'prepare-context',
    mode: 'planner',
    dryRun: false,
    provider,
    role,
    contextPack: context,
    invocation,
    proposal,
    reviewPath,
    runId: lifecycleRun.run_id,
    snapshot,
    writtenDocs,
  };
}

async function runPlan(repoRoot, options = {}) {
  const phase = normalizePlannerPhase(options.phase || DEFAULT_PLAN_PHASE);
  const role = normalizeRole(options.role || DEFAULT_PLAN_ROLE);
  const runtimeProfile = resolveRuntimeAgentProfile(repoRoot, role, options, DEFAULT_PLAN_PROVIDER);
  const provider = runtimeProfile.provider;
  const context = options.context || DEFAULT_PLAN_CONTEXT;
  const timeoutMs = normalizeTimeout(options.timeout);
  let inputPath = options.input || '';
  let inputCompaction = null;

  if (phase === 'spec') {
    const resolved = resolveReviewedTechnicalPlanInput(repoRoot, inputPath || undefined);
    inputPath = resolved.inputPath;
    const inputText = readTextFileOrEmpty(inputPath, repoRoot);
    const manifest = buildSpecGenerationManifest({
      inputPath,
      inputText,
      repoRoot,
      specSlug: options.specSlug,
    });

    if (options.printPrompt) {
      const report = {
        task: 'plan',
        phase,
        manifest,
      };
      const translator = createTranslator(options.language);
      process.stdout.write(`${translator.t('ai_task.title.prompt_only', { task: 'plan' })}\n${translator.t('ai_task.phase', { phase: 'spec' })}\n${translator.t('ai.plan.spec.prompt_only_no_provider')}\n`);
      process.stdout.write(formatSpecDryRunReport({ manifest, repoRoot, language: options.language }));
      return report;
    }

    if (options.dryRun) {
      const report = {
        task: 'plan',
        phase,
        manifest,
      };
      process.stdout.write(formatSpecDryRunReport({ manifest, repoRoot, language: options.language }));
      return report;
    }

    const result = generateSpecArtifacts(repoRoot, {
      input: inputPath,
      specSlug: options.specSlug,
    });
    process.stdout.write(formatSpecGenerationResult(result, repoRoot, options));

    return {
      task: 'plan',
      phase,
      specSlug: result.manifest.slug,
      specDir: path.relative(repoRoot, result.specDir).split(path.sep).join('/'),
      files: result.files.map((filePath) => path.relative(repoRoot, filePath).split(path.sep).join('/')),
      manifest: result.manifest,
    };
  }

  assertPlannerPhaseReady(phase);

  let inputText = '';

  if (options.revise === true) {
    if (!inputPath) {
      throw new Error(formatError(`missing feedback input file for ai revise phase '${phase}'. Use: npx create-quiver ai revise --phase ${phase} --input <feedback.md> --dry-run`));
    }
    const feedbackText = readTextFile(inputPath, repoRoot);
    const revisionInput = buildRevisionInput({
      phase,
      feedbackPath: inputPath,
      feedbackText,
      repoRoot,
      compactionOptions: options,
    });
    inputText = revisionInput.text;
    inputCompaction = revisionInput.compaction;
    inputPath = revisionInput.sourceInputPath;
  } else if (phase === 'technical-plan') {
    const resolved = resolveTechnicalPlanAcceptanceInput(repoRoot, options, inputPath);
    inputPath = resolved.inputPath;
  }

  if (!inputPath) {
    throw new Error(formatError(`missing input file for ai plan phase '${phase}'`));
  }

  if (!inputText) {
    inputText = readTextFile(inputPath, repoRoot);
  }
  const governedRun = prepareGovernedRun(repoRoot, {
    ...options,
    command: `ai plan --phase ${phase}`,
    input: inputPath,
    phase: 'created',
    artifact: phase === 'technical-plan' && options.revise !== true ? inputPath : undefined,
    artifactPhase: phase === 'technical-plan' && options.revise !== true ? 'acceptance-approved' : undefined,
    readOnly: options.dryRun === true || options.printPrompt === true,
  });
  if (governedRun && options.dryRun !== true && options.printPrompt !== true) {
    recoverGovernedPlanReviewCommit(repoRoot, { runId: governedRun.run.run_id });
    governedRun.run = readAiRun(repoRoot, governedRun.run.run_id);
  }
  const contextInfo = buildPlanContext({
    role,
    context,
    phase,
    inputText,
    inputPath,
    repoRoot,
    revise: options.revise === true,
  });
  const prompt = contextInfo.prompt;
  assertProviderPromptWithinLimit(prompt, options);
  let invocation;

  try {
    invocation = buildProviderInvocation(provider, {
      prompt,
      cwd: repoRoot,
      timeoutMs,
        ...runtimeModelExecutionOptions(runtimeProfile, options),
      enforceModelSelection: false,
    });
  } catch (error) {
    if (error.providerResult) {
      result = error.providerResult;
    } else {
      throw annotateProviderError(error, 'plan', phase);
    }
  }

  if (options.dryRun) {
    const report = {
      task: 'plan',
      provider,
      role,
      contextPack: contextInfo.pack.packName,
      phase,
      invocation,
      profile: runtimeProfile,
      governance: governedRun?.profile || null,
    };
    process.stdout.write(formatDryRunReport({ ...report, language: options.language }));
    if (options.withPlanner === true) {
      process.stdout.write(`${createTranslator(options.language).t('ai.plan.with_planner_already_active')}\n`);
    }
    if (options.review === true) {
      process.stdout.write(`${createTranslator(options.language).t('ai.plan.review_requested')}\n`);
    }
    if (options.interactive === true) {
      process.stdout.write(`${createTranslator(options.language).t('ai.plan.interactive_requested')}\n`);
    }
    return report;
  }

  if (options.printPrompt) {
    const report = {
      task: 'plan',
      provider,
      role,
      contextPack: contextInfo.pack.packName,
      phase,
      invocation,
      prompt,
      profile: runtimeProfile,
      governance: governedRun?.profile || null,
    };
    process.stdout.write(formatPromptOnlyReport({ ...report, language: options.language }));
    return report;
  }

  const ux = createCommandUx(options);
  const showProgress = shouldShowHumanProgress(ux, options);
  writeProgressChecks(
    ux,
    showProgress,
    plannerProgressTitle(createTranslator(options.language).t('ai.planner.progress.plan', { phase }), runtimeProfile, options),
    [
      createTranslator(options.language).t('ai.planner.progress.reading_input'),
      createTranslator(options.language).t('ai.planner.progress.preparing_context'),
      createTranslator(options.language).t('ai.planner.progress.preparing_prompt'),
    ],
  );

  let result;
  try {
    result = await runProviderWithProgress({
      ux,
      enabled: showProgress,
      run: () => (options.runProviderFn || runProvider)(provider, {
        prompt,
        cwd: repoRoot,
        timeoutMs,
        dryRun: false,
        probe: options.probe,
        spawn: options.spawn,
        tempRoot: options.tempRoot,
        tempFileName: options.tempFileName,
        tempFilePrefix: options.tempFilePrefix,
        ...runtimeModelExecutionOptions(runtimeProfile, options),
        enforceModelSelection: Boolean(runtimeProfile.model),
      }),
    });
  } catch (error) {
    throw annotateProviderError(error, 'plan', phase);
  }

  if (!result.ok) {
    writeProviderOutput(result);
    throw annotateProviderError(result.error || new Error('provider run failed'), 'plan', phase);
  }

  const clean = extractCleanProviderOutput(result, { prompt, projectRoot: repoRoot });
  let cleanOutput = clean.cleanOutput;
  let reviewPath = '';

  if (options.review === true) {
    const reviewed = await reviewTextWithEditor(repoRoot, cleanOutput, {
      ...options,
      reviewFileName: `ai-plan-${phase}-draft.md`,
      reviewLabel: `ai plan --phase ${phase} review`,
    });
    cleanOutput = reviewed.text;
    reviewPath = reviewed.reviewPath;
  }

  await confirmInteractiveAction(`Save ${phase} planner draft?`, options);
  const lifecycleRun = governedRun?.run || ensureAiRun(repoRoot, {
    command: `ai plan --phase ${phase}`,
    input: inputPath,
    runId: options.runId,
  });
  writeCleanProviderOutput({ cleanOutput });
  const rawArtifact = writeRawProviderArtifact(repoRoot, lifecycleRun.run_id, `ai-plan-${phase}`, result, {
    metadata: {
      phase,
      input_path: inputPath,
      prompt_bytes: invocation.promptLength,
      clean_output_source: clean.source,
      stripped_prompt_echo: clean.strippedPromptEcho,
      input_compaction: inputCompaction,
      governance: governedRun?.binding || null,
    },
  });
  const persistDraft = (locked = false) => {
    if (governedRun) {
      const lockedRun = readAiRun(repoRoot, lifecycleRun.run_id);
      if (lockedRun?.status === 'closed') {
        throw new GovernanceError('AI_RUN_CLOSED', `Governed plan cannot mutate closed run '${lockedRun.run_id}'.`);
      }
      resolveGovernanceRuntime(repoRoot, options, lockedRun);
      const allowedPhases = phase === 'acceptance'
        ? ['created', 'onboarding-ready', 'acceptance-draft']
        : options.revise === true
          ? ['technical-plan-draft', 'technical-plan-reviewed']
          : ['acceptance-approved', 'technical-plan-draft'];
      if (!allowedPhases.includes(lockedRun?.phase)) {
        throw new GovernanceError(
          'AI_RUN_PHASE_INVALID',
          `Governed ${phase} planning cannot publish a draft from run phase '${lockedRun?.phase || 'missing'}'.`,
          { run_id: lockedRun?.run_id || null, phase: lockedRun?.phase || null },
        );
      }
    }
    const draft = savePlannerDraft(repoRoot, phase, inputPath, cleanOutput, {
      rawArtifactPath: rawArtifact.path,
      outputSource: clean.source,
      inputCompaction,
      reviewPath,
    });
    const savedDraft = readPhaseApproval(repoRoot, phase).meta?.drafts
      ?.find((item) => Number(item.version) === Number(draft.version));
    updateAiRunPhase(repoRoot, lifecycleRun.run_id, phase === 'acceptance' ? 'acceptance-draft' : 'technical-plan-draft', {
      artifact: savedDraft?.path || path.relative(repoRoot, draft.filePath).split(path.sep).join('/'),
      command: `ai plan --phase ${phase}`,
      locked,
      reviewRevision: options.revise === true && phase === 'technical-plan',
    });
    return draft;
  };
  if (governedRun) {
    withAiRunLock(
      repoRoot,
      lifecycleRun.run_id,
      { command: `ai plan --phase ${phase} commit` },
      () => persistDraft(true),
    );
  } else {
    persistDraft();
  }

  return {
    task: 'plan',
    provider,
    role,
    contextPack: contextInfo.pack.packName,
    phase,
    invocation,
    result,
    reviewPath,
  };
}

function buildReviewBudgetIntent(governedRun, resolved, inputText, options = {}) {
  const governanceState = options.governanceState || (governedRun?.run
    ? readRunGovernance(governedRun.repoRoot || options.repoRoot, governedRun.run.run_id)
    : null);
  const currentReviewId = governanceState?.current_review_id || null;
  const candidateId = `technical-plan:${resolved.version || 'unversioned'}:${sha256Digest(inputText)}`;
  const explicit = options.reviewIntent && typeof options.reviewIntent === 'object'
    ? options.reviewIntent
    : {};
  const declaredCandidateId = String(explicit.candidate_id || explicit.candidateId || '').trim();
  if (declaredCandidateId && declaredCandidateId !== candidateId) {
    throw new GovernanceError('REVIEW_INTENT_INVALID', 'Review candidate identity is derived from the owned draft and cannot be overridden.');
  }
  const eventClass = String(explicit.event_class || explicit.eventClass || 'full').trim();
  if (eventClass === 'external') {
    throw new GovernanceError('REVIEW_INTENT_INVALID', 'External review events may only be recorded by a validated adapter.');
  }
  if (eventClass === 'retry') {
    throw new GovernanceError('REVIEW_INTENT_INVALID', 'Retry is derived from a prior pre-payload failure and cannot be selected by the command.');
  }
  if (eventClass === 'targeted') {
    const intent = classifyReviewIntent({
      event_class: 'targeted',
      candidate_id: candidateId,
      base_review_id: explicit.base_review_id || explicit.baseReviewId,
      finding_ids: explicit.finding_ids || explicit.findingIds || [],
      sections: explicit.sections || [],
    }, { currentReviewId });
    const knownFindingIds = new Set((governanceState?.findings || []).map((finding) => finding.finding_id));
    const unknownFindingIds = intent.finding_ids.filter((findingId) => !knownFindingIds.has(findingId));
    if (unknownFindingIds.length > 0) {
      throw new GovernanceError('REVIEW_INTENT_INVALID', 'Targeted review references findings outside the current run.', {
        unknown_finding_ids: unknownFindingIds,
      });
    }
    const normalizedInput = String(inputText || '').normalize('NFC').toLowerCase();
    const unknownSections = intent.sections.filter((section) => (
      !normalizedInput.includes(String(section).normalize('NFC').toLowerCase())
    ));
    if (unknownSections.length > 0) {
      throw new GovernanceError('REVIEW_INTENT_INVALID', 'Targeted review sections must be literal sections of the owned candidate.', {
        unknown_sections: unknownSections,
      });
    }
    return intent;
  }
  if (eventClass !== 'full') {
    throw new GovernanceError('REVIEW_INTENT_INVALID', `Unsupported review event class '${eventClass || 'missing'}'.`);
  }
  return classifyReviewIntent({
    event_class: 'full',
    candidate_id: candidateId,
    complete_replacement: true,
    reviewed_parent_id: Object.prototype.hasOwnProperty.call(explicit, 'reviewed_parent_id')
      ? explicit.reviewed_parent_id
      : Object.prototype.hasOwnProperty.call(explicit, 'reviewedParentId')
        ? explicit.reviewedParentId
        : currentReviewId,
  }, { currentReviewId });
}

function buildReviewBudgetRequestEnvelope({
  repoRoot,
  runId,
  inputPath,
  resolved,
  pack,
  provider,
  runtimeProfile,
  governance,
  governanceProfile,
  reviewIntent,
  inputText,
  canonicalFindings,
  prompt,
}) {
  const currentInputText = typeof inputText === 'string' ? inputText : readTextFile(inputPath, repoRoot);
  const currentFindings = Array.isArray(canonicalFindings)
    ? canonicalFindings
    : readRunGovernance(repoRoot, runId)?.findings || [];
  const currentPrompt = typeof prompt === 'string'
    ? prompt
    : buildPlanReviewPrompt({
      pack,
      inputText: currentInputText,
      inputPath,
      governed: true,
      governance,
      governanceProfile,
      canonicalFindings: currentFindings,
      reviewIntent,
    }).prompt;
  return {
    schema_version: 1,
    command: 'ai review-plan',
    run_id: runId,
    phase: 'technical-plan',
    input_path: inputPath,
    input_kind: resolved.kind,
    input_version: resolved.version || null,
    candidate_sha256: sha256Digest(currentInputText),
    canonical_findings_sha256: sha256Digest(stableStringify(currentFindings)),
    requested_profile: governanceProfile.requested_profile,
    effective_profile: governanceProfile.effective_profile,
    policy_version: governanceProfile.policy_version,
    policy_digest: governanceProfile.policy_digest,
    provider,
    model: runtimeProfile.model || null,
    context: pack.packName,
    prompt_sha256: sha256Digest(currentPrompt),
  };
}

function providerPayloadWasReceived(result) {
  return result?.payloadReceived === true;
}

function providerFailureKind(result, error) {
  const code = String(result?.error?.code || error?.code || '').trim();
  if (code === 'PROVIDER_TIMEOUT' || code === 'ETIMEDOUT') return 'timeout';
  if (['PROVIDER_TRANSPORT_ERROR', 'MISSING_PROVIDER_CLI', 'ECONNRESET', 'ECONNREFUSED', 'EPIPE', 'ENETUNREACH', 'EAI_AGAIN', 'ENOENT'].includes(code)) {
    return 'transport';
  }
  return null;
}

function finalizeGovernedReviewFailure(repoRoot, governedRun, reservation, requestEnvelope, result, error) {
  if (!governedRun || !reservation) return null;
  const receivedPayload = providerPayloadWasReceived(result);
  const failureKind = receivedPayload ? null : providerFailureKind(result, error);
  const payloadSignalKnown = typeof result?.payloadReceived === 'boolean';
  if (!receivedPayload && (!payloadSignalKnown || !failureKind)) {
    return null;
  }
  return finalizeReviewBudget(repoRoot, {
    runId: governedRun.run.run_id,
    governance: governedRun.governance,
    profile: governedRun.profile,
    reservationId: reservation.reservation_id,
    attempt: reservation.attempt,
    requestEnvelopeDigest: reservation.request_envelope_digest,
    requestEnvelope,
    outcome: receivedPayload ? 'invalid-output' : 'retry',
    receivedPayload,
    failureKind,
  });
}

async function runExtendReviewBudget(repoRoot, options = {}) {
  if (options.actor) {
    throw new GovernanceError(
      'ACTOR_IDENTITY_UNAVAILABLE',
      'Review budget extension requires identity resolution through a configured actor adapter.',
    );
  }
  const run = resolveGovernedAiRun(repoRoot, options.runId || '');
  if (!run?.governance) {
    throw new GovernanceError('REVIEW_BUDGET_CONTEXT_INVALID', 'Review budget extension requires an active governed run.');
  }
  const runtime = resolveGovernanceRuntime(repoRoot, options, run);
  recoverGovernedPlanReviewCommit(repoRoot, { runId: run.run_id });
  assertReviewBudgetHistoryVerified(
    repoRoot,
    run.run_id,
    readReviewBudgetEvents(repoRoot, run.run_id),
  );
  const actor = await (options.resolveActorFn || resolveGitHubCliProviderSubject)({
    cwd: repoRoot,
    env: options.env,
    runner: options.identityRunner,
    host: options.githubHost,
  });
  const extension = extendReviewBudget(repoRoot, {
    runId: run.run_id,
    governance: runtime.governance,
    profile: runtime.profile,
    actor,
    command: 'ai review-budget extend',
  });
  process.stdout.write(`Review budget extension recorded\nRun: ${run.run_id}\n${formatReviewBudget(extension.budget)}`);
  return {
    task: 'review-budget-extend',
    runId: run.run_id,
    event: extension.event,
    authorization: extension.authorization.evidence,
    budget: extension.budget,
  };
}

async function runReviewPlan(repoRoot, options = {}) {
  const role = 'planner';
  const runtimeProfile = resolveRuntimeAgentProfile(repoRoot, 'reviewer', options, DEFAULT_PLAN_PROVIDER);
  const provider = runtimeProfile.provider;
  const context = options.context || DEFAULT_PLAN_CONTEXT;
  const timeoutMs = normalizeTimeout(options.timeout);
  const resolved = resolveTechnicalPlanReviewInput(repoRoot, options.input || undefined);
  const inputPath = resolved.inputPath;
  const inputText = readTextFile(inputPath, repoRoot);
  const governedRun = prepareGovernedRun(repoRoot, {
    ...options,
    command: 'ai review-plan',
    input: inputPath,
    phase: 'technical-plan-draft',
    artifact: inputPath,
    artifactPhase: 'technical-plan-draft',
    readOnly: options.dryRun === true || options.printPrompt === true,
  });
  if (governedRun && options.dryRun !== true && options.printPrompt !== true) {
    recoverGovernedPlanReviewCommit(repoRoot, { runId: governedRun.run.run_id });
    governedRun.run = readAiRun(repoRoot, governedRun.run.run_id);
  }
  const governanceStateSnapshot = governedRun?.run
    ? readRunGovernance(repoRoot, governedRun.run.run_id)
    : null;
  const reviewIntent = governedRun
    ? buildReviewBudgetIntent(governedRun, resolved, inputText, {
      ...options,
      repoRoot,
      governanceState: governanceStateSnapshot,
    })
    : null;
  const pack = buildContextPackMetadata({
    role,
    packName: context,
    repoRoot,
  });
  const built = buildPlanReviewPrompt({
    pack,
    inputText,
    inputPath,
    governed: Boolean(governedRun),
    governance: governedRun?.governance || null,
    governanceProfile: governedRun?.profile || null,
    canonicalFindings: governanceStateSnapshot?.findings || [],
    reviewIntent,
  });
  assertProviderPromptWithinLimit(built.prompt, options);
  let invocation;

  try {
    invocation = buildProviderInvocation(provider, {
      prompt: built.prompt,
      cwd: repoRoot,
      timeoutMs,
        ...runtimeModelExecutionOptions(runtimeProfile, options),
      enforceModelSelection: false,
    });
  } catch (error) {
    throw annotateProviderError(error, 'review-plan');
  }

  if (options.dryRun) {
    const report = {
      task: 'review-plan',
      provider,
      role: 'reviewer',
      contextPack: pack.packName,
      invocation,
      promptSource: built.promptSource,
      inputPath,
      inputKind: resolved.kind,
      inputVersion: resolved.version,
      profile: runtimeProfile,
      governance: governedRun?.profile || null,
    };
    process.stdout.write(formatDryRunReport({
      task: 'review-plan',
      provider,
      role: 'reviewer',
      contextPack: pack.packName,
      phase: 'plan-review',
      invocation,
      language: options.language,
    }));
    const translator = createTranslator(options.language);
    process.stdout.write(`${translator.t('ai_task.prompt_source', { source: built.promptSource })}\n`);
    process.stdout.write(`${translator.t('ai_task.input_file', { path: inputPath })}\n`);
    process.stdout.write(`${translator.t('ai_task.input_kind', { kind: resolved.kind })}\n`);
    if (resolved.version) {
      process.stdout.write(`${translator.t('ai_task.input_version', { version: resolved.version })}\n`);
    }
    return report;
  }

  if (options.printPrompt) {
    const report = {
      task: 'review-plan',
      provider,
      role: 'reviewer',
      contextPack: pack.packName,
      phase: 'plan-review',
      invocation,
      prompt: built.prompt,
      promptSource: built.promptSource,
      inputPath,
      inputKind: resolved.kind,
      inputVersion: resolved.version,
      profile: runtimeProfile,
      governance: governedRun?.profile || null,
    };
    process.stdout.write(formatPromptOnlyReport({ ...report, language: options.language }));
    return report;
  }

  const ux = createCommandUx(options);
  const showProgress = shouldShowHumanProgress(ux, options);
  writeProgressChecks(
    ux,
    showProgress,
    plannerProgressTitle(createTranslator(options.language).t('ai.planner.progress.review_plan'), runtimeProfile, options),
    [
      createTranslator(options.language).t('ai.planner.progress.reading_technical_plan'),
      createTranslator(options.language).t('ai.planner.progress.preparing_context'),
      createTranslator(options.language).t('ai.planner.progress.preparing_prompt'),
    ],
  );

  let reviewBudgetReservation = null;
  let reviewBudgetRequestEnvelope = null;
  let reviewBudgetRequestEnvelopeFactory = null;
  if (governedRun) {
    reviewBudgetRequestEnvelopeFactory = () => buildReviewBudgetRequestEnvelope({
      repoRoot,
      runId: governedRun.run.run_id,
      inputPath,
      resolved,
      pack,
      provider,
      runtimeProfile,
      governance: governedRun.governance,
      governanceProfile: governedRun.profile,
      reviewIntent,
    });
    reviewBudgetRequestEnvelope = buildReviewBudgetRequestEnvelope({
      repoRoot,
      runId: governedRun.run.run_id,
      inputPath,
      resolved,
      pack,
      provider,
      runtimeProfile,
      governance: governedRun.governance,
      governanceProfile: governedRun.profile,
      reviewIntent,
      inputText,
      canonicalFindings: governanceStateSnapshot?.findings || [],
      prompt: built.prompt,
    });
    reviewBudgetReservation = reserveReviewBudget(repoRoot, {
      runId: governedRun.run.run_id,
      governance: governedRun.governance,
      profile: governedRun.profile,
      intent: reviewIntent,
      requestEnvelope: reviewBudgetRequestEnvelope,
      currentRequestEnvelope: reviewBudgetRequestEnvelopeFactory,
    });
  }

  let result;
  try {
    result = await runProviderWithProgress({
      ux,
      enabled: showProgress,
      failOnProviderResult: false,
      run: () => (options.runProviderFn || runProvider)(provider, {
        prompt: built.prompt,
        cwd: repoRoot,
        timeoutMs,
        dryRun: false,
        probe: options.probe,
        spawn: options.spawn,
        tempRoot: options.tempRoot,
        tempFileName: options.tempFileName,
        tempFilePrefix: options.tempFilePrefix,
        ...runtimeModelExecutionOptions(runtimeProfile, options),
        enforceModelSelection: Boolean(runtimeProfile.model),
      }),
    });
  } catch (error) {
    const providerResult = error.providerResult || null;
    const finalized = finalizeGovernedReviewFailure(
      repoRoot,
      governedRun,
      reviewBudgetReservation,
      reviewBudgetRequestEnvelope,
      providerResult,
      error,
    );
    if (finalized && providerPayloadWasReceived(providerResult)) {
      throw new GovernanceError(
        PROVIDER_OUTPUT_INVALID,
        'Provider returned a payload that could not be accepted as contractual review evidence.',
        { budget: finalized.budget },
      );
    }
    throw annotateProviderError(error, 'review-plan');
  }

  if (!result.ok) {
    let rawArtifactPath = null;
    if (governedRun && providerPayloadWasReceived(result)) {
      rawArtifactPath = writeRawProviderArtifact(repoRoot, governedRun.run.run_id, 'ai-review-plan', result, {
        metadata: {
          phase: 'plan-review',
          input_path: inputPath,
          input_kind: resolved.kind,
          input_version: resolved.version || null,
          prompt_bytes: invocation.promptLength,
          contractual: false,
          provider_payload_received: true,
          governance: governedRun.binding,
        },
      }).path;
    }
    const finalized = finalizeGovernedReviewFailure(
      repoRoot,
      governedRun,
      reviewBudgetReservation,
      reviewBudgetRequestEnvelope,
      result,
      result.error,
    );
    writeProviderOutput(result);
    if (finalized && providerPayloadWasReceived(result)) {
      throw new GovernanceError(
        PROVIDER_OUTPUT_INVALID,
        'Provider returned a non-contractual payload and its semantic review reservation was consumed.',
        { raw_artifact_path: rawArtifactPath, budget: finalized.budget },
      );
    }
    throw annotateProviderError(result.error || new Error('provider run failed'), 'review-plan');
  }

  const lifecycleRun = governedRun?.run || ensureAiRun(repoRoot, {
    command: 'ai review-plan',
    input: inputPath,
    runId: options.runId,
    phase: 'technical-plan-reviewed',
  });
  if (governedRun && !providerPayloadWasReceived(result)) {
    const rawArtifact = writeRawProviderArtifact(repoRoot, lifecycleRun.run_id, 'ai-review-plan', result, {
      metadata: {
        phase: 'plan-review',
        input_path: inputPath,
        input_kind: resolved.kind,
        input_version: resolved.version || null,
        prompt_bytes: invocation.promptLength,
        contractual: false,
        provider_payload_received: false,
        governance: governedRun.binding,
      },
    });
    const transportError = new GovernanceError(
      'PROVIDER_TRANSPORT_ERROR',
      `Provider '${provider}' completed without a payload on its contractual output channel.`,
      { raw_artifact_path: rawArtifact.path },
    );
    const finalized = finalizeGovernedReviewFailure(
      repoRoot,
      governedRun,
      reviewBudgetReservation,
      reviewBudgetRequestEnvelope,
      result,
      transportError,
    );
    transportError.details = {
      ...transportError.details,
      budget: finalized?.budget || null,
    };
    throw annotateProviderError(transportError, 'review-plan');
  }
  const clean = extractCleanProviderOutput(result, { prompt: built.prompt, projectRoot: repoRoot });
  const contractualClean = governedRun
    ? extractCleanProviderOutput(result, { prompt: built.prompt, projectRoot: repoRoot, redact: false })
    : clean;
  const rawArtifact = writeRawProviderArtifact(repoRoot, lifecycleRun.run_id, 'ai-review-plan', result, {
    metadata: {
      phase: 'plan-review',
      input_path: inputPath,
      input_kind: resolved.kind,
      input_version: resolved.version || null,
      prompt_bytes: invocation.promptLength,
      clean_output_source: clean.source,
      stripped_prompt_echo: clean.strippedPromptEcho,
      contractual: false,
      provider_output_redacted: result.outputRedaction || null,
      governance: governedRun?.binding || null,
    },
  });
  let saved;
  try {
    const contractualOutputStream = getProviderDefinition(provider).contractualOutputStream;
    if (governedRun && contractualClean.source !== contractualOutputStream) {
      throw new GovernanceError(
        PROVIDER_OUTPUT_INVALID,
        `Provider review evidence must be emitted on contractual ${contractualOutputStream}.`,
        { raw_artifact_path: rawArtifact.path, source: contractualClean.source },
      );
    }
    if (governedRun && result.outputRedaction?.[contractualClean.source] === true) {
      throw new GovernanceError(
        PROVIDER_OUTPUT_INVALID,
        `Provider ${contractualClean.source} required secret redaction and cannot be accepted as contractual review evidence.`,
        { raw_artifact_path: rawArtifact.path, source: contractualClean.source },
      );
    }
    saved = savePlanReview(repoRoot, {
      contents: contractualClean.cleanOutput,
      inputPath,
      inputKind: resolved.kind,
      inputVersion: resolved.version,
      outputSource: governedRun ? contractualClean.source : clean.source,
      rawArtifactPath: rawArtifact.path,
      governance: governedRun?.governance || null,
      profile: governedRun?.profile || null,
      runId: governedRun?.run?.run_id || null,
      reviewBudgetReservation,
      reviewBudgetRequestEnvelope: reviewBudgetRequestEnvelopeFactory,
      commitFaultInjector: options.commitFaultInjector,
    });
  } catch (error) {
    if (governedRun
      && reviewBudgetReservation
      && [PROVIDER_OUTPUT_INVALID, 'FINDING_RECONCILIATION_AMBIGUOUS', 'REVIEW_REQUEST_STALE'].includes(error.code)) {
      finalizeReviewBudget(repoRoot, {
        runId: governedRun.run.run_id,
        governance: governedRun.governance,
        profile: governedRun.profile,
        reservationId: reviewBudgetReservation.reservation_id,
        attempt: reviewBudgetReservation.attempt,
        requestEnvelopeDigest: reviewBudgetReservation.request_envelope_digest,
        outcome: 'invalid-output',
        receivedPayload: providerPayloadWasReceived(result),
      });
    }
    throw error;
  }
  if (!governedRun) {
    writeCleanProviderOutput(clean);
  }
  const relativePath = path.relative(repoRoot, saved.filePath).split(path.sep).join('/');
  const summary = localizeApprovalSummary(summarizePlanReview(repoRoot), createTranslator(options.language)).trimEnd();
  const budgetSummary = governedRun ? formatReviewBudget(saved.budget).trimEnd() : '';
  const translator = createTranslator(options.language);
  process.stdout.write(`${translator.t('ai.review_plan.saved')}\n${translator.t('ai.approve.artifact')}: ${relativePath}\n${translator.t('ai_task.prompt_source', { source: PLAN_REVIEW_PROMPT_SOURCE })}\n${summary}${budgetSummary ? `\n${budgetSummary}` : ''}\n`);

  return {
    task: 'review-plan',
    provider,
    role: 'reviewer',
    contextPack: pack.packName,
    inputPath,
    inputKind: resolved.kind,
    inputVersion: resolved.version,
    filePath: relativePath,
    invocation,
    result,
    governance: governedRun?.profile || null,
    reviewId: saved.reviewId || null,
    budget: saved.budget || null,
  };
}

async function runRepairPlan(repoRoot, options = {}) {
  const role = normalizeRole(options.role || DEFAULT_PLAN_ROLE);
  const runtimeProfile = resolveRuntimeAgentProfile(repoRoot, role, options, DEFAULT_PLAN_PROVIDER);
  const provider = runtimeProfile.provider;
  const context = options.context || DEFAULT_PLAN_CONTEXT;
  const timeoutMs = normalizeTimeout(options.timeout);
  const source = resolveApprovedTechnicalPlanForRepair(repoRoot, options.input || '');
  const built = buildRepairPlanContext({
    context,
    inputText: source.contents,
    inputPath: source.path,
    repoRoot,
    role,
    validationError: source.validationError,
  });
  assertProviderPromptWithinLimit(built.prompt, options);
  let invocation;

  try {
    invocation = buildProviderInvocation(provider, {
      prompt: built.prompt,
      cwd: repoRoot,
      timeoutMs,
        ...runtimeModelExecutionOptions(runtimeProfile, options),
      enforceModelSelection: false,
    });
  } catch (error) {
    if (error.providerResult) {
      providerResult = error.providerResult;
    } else {
      throw annotateProviderError(error, 'repair-plan');
    }
  }

  if (options.dryRun) {
    const report = {
      task: 'repair-plan',
      provider,
      role,
      contextPack: built.pack.packName,
      phase: 'technical-plan',
      invocation,
      profile: runtimeProfile,
    };
    process.stdout.write(formatDryRunReport({ ...report, language: options.language }));
    const translator = createTranslator(options.language);
    process.stdout.write(`${translator.t('ai.repair_plan.source_approved_artifact')}: ${source.path}\n`);
    process.stdout.write(`${translator.t('ai.repair_plan.validation_failure')}: ${source.validationError}\n`);
    return report;
  }

  if (options.printPrompt) {
    const report = {
      task: 'repair-plan',
      provider,
      role,
      contextPack: built.pack.packName,
      phase: 'technical-plan',
      invocation,
      prompt: built.prompt,
      inputPath: source.path,
      inputKind: 'approved',
      inputVersion: source.approval.meta?.approved?.version || null,
      profile: runtimeProfile,
    };
    process.stdout.write(formatPromptOnlyReport({ ...report, language: options.language }));
    return report;
  }

  const ux = createCommandUx(options);
  const showProgress = shouldShowHumanProgress(ux, options);
  writeProgressChecks(
    ux,
    showProgress,
    plannerProgressTitle(createTranslator(options.language).t('ai.planner.progress.repair_plan'), runtimeProfile, options),
    [
      createTranslator(options.language).t('ai.planner.progress.reading_approved_plan'),
      createTranslator(options.language).t('ai.planner.progress.preparing_context'),
      createTranslator(options.language).t('ai.planner.progress.preparing_prompt'),
    ],
  );

  let providerResult;
  try {
    const progressTranslator = createTranslator(options.language);
    providerResult = await runProviderWithProgress({
      ux,
      enabled: showProgress,
      message: progressTranslator.t('ai.planner.progress.running_agent'),
      successMessage: progressTranslator.t('ai.planner.progress.agent_finished'),
      failureMessage: progressTranslator.t('ai.planner.progress.agent_failed'),
      run: () => (options.runProviderFn || runProvider)(provider, {
        prompt: built.prompt,
        cwd: repoRoot,
        timeoutMs,
        dryRun: false,
        probe: options.probe,
        spawn: options.spawn,
        tempRoot: options.tempRoot,
        tempFileName: options.tempFileName,
        tempFilePrefix: options.tempFilePrefix,
        ...runtimeModelExecutionOptions(runtimeProfile, options),
        enforceModelSelection: Boolean(runtimeProfile.model),
      }),
    });
  } catch (error) {
    throw annotateProviderError(error, 'repair-plan');
  }

  if (!providerResult.ok) {
    writeProviderOutput(providerResult);
    throw annotateProviderError(providerResult.error || new Error('provider run failed'), 'repair-plan');
  }

  const lifecycleRun = ensureAiRun(repoRoot, {
    command: 'ai repair-plan',
    input: source.path,
    runId: options.runId,
  });
  const clean = extractCleanProviderOutput(providerResult, { prompt: built.prompt, projectRoot: repoRoot });
  const rawArtifact = writeRawProviderArtifact(repoRoot, lifecycleRun.run_id, 'ai-repair-plan', providerResult, {
    metadata: {
      phase: 'technical-plan-repair',
      input_path: source.path,
      prompt_bytes: invocation.promptLength,
      clean_output_source: clean.source,
      stripped_prompt_echo: clean.strippedPromptEcho,
      validation_failure: source.validationError,
    },
  });

  try {
    validateTechnicalPlanSpecContract(repoRoot, {
      inputPath: source.path,
      inputText: clean.cleanOutput,
    });
  } catch (error) {
    throw new Error(formatError([
      'ai repair-plan provider output is still missing the required structured `spec.slices[]` contract.',
      stripCreateQuiverPrefix(error.message || error),
      `Raw provider artifact: ${rawArtifact.path}`,
      'No technical-plan draft was written.',
    ].join('\n')));
  }

  writeCleanProviderOutput(clean);
  const draft = savePlannerDraft(repoRoot, 'technical-plan', source.path, clean.cleanOutput, {
    rawArtifactPath: rawArtifact.path,
    outputSource: clean.source,
  });
  updateAiRunPhase(repoRoot, lifecycleRun.run_id, 'technical-plan-draft', {
    artifact: path.relative(repoRoot, draft.filePath).split(path.sep).join('/'),
    command: 'ai repair-plan',
  });
  process.stdout.write(formatRepairPlanResult({
    ...draft,
    sourcePath: source.path,
  }, repoRoot, options));

  return {
    task: 'repair-plan',
    provider,
    role,
    contextPack: built.pack.packName,
    phase: 'technical-plan',
    inputPath: source.path,
    filePath: path.relative(repoRoot, draft.filePath).split(path.sep).join('/'),
    version: draft.version || null,
    invocation,
    result: providerResult,
  };
}

async function runRevise(repoRoot, options = {}) {
  const translator = createTranslator(options.language);
  const phase = normalizePlannerPhase(options.phase || DEFAULT_PLAN_PHASE);
  if (phase === 'spec') {
    throw new Error(formatError(translator.t('ai.revise.error.unsupported_phase', { phase })));
  }

  const approval = readPhaseApproval(repoRoot, phase);
  if (approval.status !== 'draft' && approval.status !== 'stale') {
    throw new Error(formatError(translator.t('ai.revise.error.requires_draft', {
      phase,
      status: approval.status,
    })));
  }

  return runPlan(repoRoot, {
    ...options,
    phase,
    revise: true,
  });
}

function formatApprovalCandidateHint(candidate, options = {}) {
  const translator = createTranslator(options.language);
  const parts = [];
  if (candidate.current) {
    parts.push(translator.t('ai.approvals.current_candidate').toLowerCase());
  }
  if (candidate.created_at) {
    parts.push(candidate.created_at);
  }
  if (candidate.review?.recommendation) {
    parts.push(`review=${candidate.review.recommendation}`);
  }
  if (candidate.review?.required_fixes_count) {
    parts.push(`${translator.t('ai.approvals.required_fixes').toLowerCase()}=${candidate.review.required_fixes_count}`);
  }
  if (candidate.review?.optional_hardening_count) {
    parts.push(`${translator.t('ai.approvals.optional_hardening').toLowerCase()}=${candidate.review.optional_hardening_count}`);
  }
  if (candidate.review?.risks_count) {
    parts.push(`risks=${candidate.review.risks_count}`);
  }
  parts.push(candidate.reason);
  return parts.filter(Boolean).join(', ');
}

function approvalSelectionOptions(report, options = {}) {
  const translator = createTranslator(options.language);
  return report.candidates.map((candidate) => ({
    label: `${candidate.label}${candidate.recommended ? ` (${translator.t('ai.approvals.recommended_approval').toLowerCase()})` : candidate.current ? ` (${translator.t('ai.approvals.current_candidate').toLowerCase()})` : ` (${translator.t('ai.approvals.draft_history').toLowerCase()})`}`,
    value: String(candidate.version || ''),
    hint: formatApprovalCandidateHint(candidate, options),
    default: candidate.recommended === true,
    raw: candidate,
  }));
}

async function resolveApprovalVersion(repoRoot, phase, options = {}) {
  const translator = createTranslator(options.language);
  if (options.version) {
    return options.version;
  }

  const canPrompt = isInteractiveAgentPromptAvailable(options);
  const shouldPrompt = options.interactive === true || canPrompt;
  const report = buildApprovalCandidateReport(repoRoot, phase);

  if (!shouldPrompt || !canPrompt) {
    const recommended = report.recommended?.version || report.latest_version || '<n>';
    throw new Error(formatLocalizedActionableError({
      failure: translator.t('ai.approve.error.no_prompt.failure', { phase }),
      impact: translator.t('ai.approve.error.no_prompt.impact'),
      fix: translator.t('ai.approve.error.no_prompt.fix'),
      nextCommand: `npx create-quiver ai approve --phase ${phase} --version ${recommended}`,
    }, options));
  }

  if (report.candidates.length === 0) {
    throw new Error(formatLocalizedActionableError({
      failure: translator.t('ai.approve.error.no_drafts.failure', { phase }),
      impact: translator.t('ai.approve.error.no_drafts.impact'),
      fix: translator.t('ai.approve.error.no_drafts.fix', { phase }),
      nextCommand: `npx create-quiver ai plan --phase ${phase}${phase === 'acceptance' ? ' --input <requirements.md>' : ''} --dry-run`,
    }, options));
  }

  const selected = await selectOption(translator.t('ai.approve.prompt.version', { phase }), approvalSelectionOptions(report, options), {
    env: options.env,
    error: options.error,
    input: options.input,
    interactive: true,
    noColor: options.noColor,
    output: options.output,
    prompts: options.prompts,
    promptSelect: options.promptSelect,
    stdinIsTTY: options.stdinIsTTY,
    stdoutIsTTY: options.stdoutIsTTY,
    stderrIsTTY: options.stderrIsTTY,
    defaultValue: report.recommended?.version ? String(report.recommended.version) : undefined,
    flag: '--version',
    name: `${phase} approval version`,
  });

  const candidate = selected.raw;
  if (!candidate?.approvable) {
    throw new Error(formatLocalizedActionableError({
      failure: translator.t('ai.approve.error.not_approvable.failure', { phase, label: selected.label }),
      impact: candidate?.review?.blocking
        ? translator.t('ai.approve.error.not_approvable.impact_blocked')
        : translator.t('ai.approve.error.not_approvable.impact'),
      fix: candidate?.reason || translator.t('ai.approve.error.not_approvable.fix'),
      nextCommand: candidate?.next_command || `npx create-quiver ai approvals`,
    }, options));
  }

  return selected.value;
}

async function runConditionedApprovalCandidate(repoRoot, options = {}) {
  const phase = normalizePlannerPhase(options.phase || DEFAULT_PLAN_PHASE);
  if (phase !== 'technical-plan') {
    throw new GovernanceError(
      'DISPOSITION_UNRESOLVED',
      'approved-with-conditions is only supported for the technical-plan phase in v58.',
      { phase, final_decision_published: false, phase_advanced: false },
    );
  }
  if (!options.governedApproval?.run) {
    throw new GovernanceError(
      'AI_RUN_REQUIRED',
      'approved-with-conditions requires an explicit governed run.',
      { final_decision_published: false, phase_advanced: false },
    );
  }

  let actor = options.actor || null;
  let identityFailureCode = null;
  if (!actor) {
    try {
      actor = await (options.resolveActorFn || resolveGitHubCliProviderSubject)({
        cwd: repoRoot,
        env: options.env,
        runner: options.identityRunner,
        host: options.githubHost,
      });
    } catch (error) {
      actor = null;
      identityFailureCode = [
        'MISSING_GH_CLI',
        'GITHUB_IDENTITY_UNAVAILABLE',
        'GITHUB_IDENTITY_INVALID',
      ].includes(error?.code) ? error.code : 'ACTOR_IDENTITY_UNAVAILABLE';
    }
  }

  const runId = options.governedApproval.run.run_id;
  const evaluateCandidate = () => {
      if (fs.existsSync(runReviewCommitPath(repoRoot, runId))) {
        throw new GovernanceError(
          'GOVERNANCE_RECOVERY_REQUIRED',
          `Governed review recovery is required before evaluating conditioned approval for run '${runId}'.`,
          {
            run_id: runId,
            final_decision_published: false,
            phase_advanced: false,
          },
        );
      }
      assertNoPendingReviewBudgetReservations(repoRoot, runId);
      const lockedRun = readAiRun(repoRoot, runId);
      if (lockedRun?.status === 'closed') {
        throw new GovernanceError('AI_RUN_CLOSED', `Governed approval cannot mutate closed run '${runId}'.`);
      }
      if (lockedRun?.phase !== 'technical-plan-reviewed') {
        throw new GovernanceError(
          'AI_RUN_PHASE_INVALID',
          `Conditioned approval requires run phase 'technical-plan-reviewed', found '${lockedRun?.phase || 'missing'}'.`,
          {
            run_id: runId,
            expected_phase: 'technical-plan-reviewed',
            actual_phase: lockedRun?.phase || null,
            final_decision_published: false,
            phase_advanced: false,
          },
        );
      }

      const runtime = resolveGovernanceRuntime(repoRoot, options, lockedRun);
      const review = readPlanReview(repoRoot);
      const canonicalReview = assertGovernedPlanReviewCorrelation(repoRoot, review, lockedRun, runtime);
      if (review.status !== 'unapproved' && review.status !== 'reviewed') {
        throw new GovernanceError(
          'GOVERNANCE_STATE_INVALID',
          `Conditioned approval requires a current governed plan review, found '${review.status}'.`,
        );
      }
      assertTechnicalPlanDraftHasSpecContract(repoRoot, options.version);
      assertGovernedApprovalCandidateCorrelation(
        repoRoot,
        lockedRun,
        'technical-plan',
        options.version,
        review,
      );

      const state = readRunGovernance(repoRoot, runId);
      if (!state || state.current_review_id !== canonicalReview.review_id) {
        throw new GovernanceError('GOVERNANCE_STATE_INVALID', 'Current condition state is not correlated with the governed review.');
      }
      const openFindings = (state.findings || []).filter((finding) => finding.state === 'open');
      const correlation = {
        runId,
        reviewId: canonicalReview.review_id,
        policyVersion: runtime.profile.policy_version,
        policyDigest: runtime.profile.policy_digest,
      };
      const conditionInput = parseConditionDispositionFile(
        repoRoot,
        options.conditionsFile,
        correlation,
      );
      const reason = readConditionReason(repoRoot, options.reasonFile);
      const resolvedAuthorization = authorizeGovernanceAction({
        governance: runtime.governance,
        action: 'approve-with-conditions',
        actor,
        profile: runtime.profile.effective_profile,
        context: {
          run_creator: lockedRun.governance_actors?.run_creator || null,
          reviewer: lockedRun.governance_actors?.reviewer || null,
          executor: lockedRun.governance_actors?.executor || null,
        },
      });
      const authorization = identityFailureCode && resolvedAuthorization.authorized !== true
        ? { ...resolvedAuthorization, code: identityFailureCode }
        : resolvedAuthorization;
      const publishedCandidateIds = new Set(
        (state.decisions || []).map((decision) => decision.candidate_id).filter(Boolean),
      );
      const pendingCandidates = (state.conditioned_candidates || []).filter((candidate) => (
        candidate.run_id === runId
        && candidate.review_id === canonicalReview.review_id
        && candidate.publication_state === 'candidate'
        && !publishedCandidateIds.has(candidate.candidate_id)
      ));
      if (pendingCandidates.length > 1) {
        throw new GovernanceError(
          'APPROVAL_CANDIDATE_AMBIGUOUS',
          `Conditioned approval has ${pendingCandidates.length} unpublished candidates for the current review.`,
          { run_id: runId, review_id: canonicalReview.review_id },
        );
      }
      const pendingCandidate = pendingCandidates[0] || null;
      if (pendingCandidate) {
        const unresolvedRetry = {
          eligible: false,
          status: 'INELIGIBLE',
          code: 'DISPOSITION_UNRESOLVED',
        };
        if (conditionInput.invalid) {
          throwConditionEligibilityFailure(unresolvedRetry, `conditions:${conditionInput.issue}`);
        }
        if (!reason.valid) {
          throwConditionEligibilityFailure(unresolvedRetry, `reason:${reason.issue}`);
        }
        const projectDisposition = (disposition) => ({
          finding_id: disposition.finding_id,
          action: disposition.action,
          ...(disposition.target ? { target: disposition.target } : {}),
          ...(disposition.target_issue ? { target_issue: disposition.target_issue } : {}),
          evidence_obligations: [...(disposition.evidence_obligations || [])],
          supersedes: disposition.supersedes || null,
        });
        const sortDispositions = (items) => [...items].sort((left, right) => (
          stableStringify(left).localeCompare(stableStringify(right))
        ));
        const proposedDispositions = sortDispositions(
          conditionInput.envelope.dispositions.map(projectDisposition),
        );
        const persistedDispositions = pendingCandidate.disposition_ids.map((dispositionId) => (
          state.dispositions.find((disposition) => disposition.disposition_id === dispositionId) || null
        ));
        const exactRetry = !persistedDispositions.includes(null)
          && pendingCandidate.reason_path === reason.path
          && pendingCandidate.reason_sha256 === reason.sha256
          && pendingCandidate.actor_id === authorization.evidence?.actor_id
          && stableStringify(pendingCandidate.authorization) === stableStringify(authorization.evidence)
          && stableStringify(proposedDispositions)
            === stableStringify(sortDispositions(persistedDispositions.map(projectDisposition)));
        if (!exactRetry) {
          throw new GovernanceError(
            'APPROVAL_CANDIDATE_PENDING',
            'A different conditioned approval candidate is already pending for the current review.',
            { candidate_id: pendingCandidate.candidate_id },
          );
        }
        const retryEligibility = evaluateConditionEligibility({
          governance: runtime.governance,
          runId: correlation.runId,
          reviewId: correlation.reviewId,
          policyVersion: correlation.policyVersion,
          policyDigest: correlation.policyDigest,
          envelope: { ...conditionInput.envelope, dispositions: [] },
          existingDispositions: state.dispositions,
          findings: openFindings,
          actorId: authorization.evidence?.actor_id || '',
          authorization,
          reasonPath: reason.path,
          reasonSha256: reason.sha256,
          completedPhases: ['requirement', 'acceptance'],
        });
        if (!retryEligibility.eligible) throwConditionEligibilityFailure(retryEligibility);
        const approvalReport = buildApprovalCandidateReport(repoRoot, 'technical-plan');
        const draftCandidate = approvalReport.candidates.find((item) => Number(item.version) === Number(options.version));
        const retryResult = {
          task: 'approve',
          phase: 'technical-plan',
          version: Number(options.version) || null,
          artifact: draftCandidate?.path || canonicalReview.source_file,
          run_id: runId,
          review_id: canonicalReview.review_id,
          decision: pendingCandidate.decision,
          reviewer_recommendation: pendingCandidate.reviewer_recommendation,
          reviewer_approved: pendingCandidate.reviewer_approved,
          publication_state: 'candidate',
          eligibility: retryEligibility,
          evaluation_id: pendingCandidate.evaluation_id,
          candidate_id: pendingCandidate.candidate_id,
          disposition_ids: [...pendingCandidate.disposition_ids],
          reason_path: pendingCandidate.reason_path,
          reason_sha256: pendingCandidate.reason_sha256,
          final_decision_published: false,
          phase_advanced: false,
          dry_run: options.dryRun === true,
          reused: true,
        };
        if (options.suppressOutput !== true) {
          process.stdout.write(formatConditionedCandidateResult(retryResult, options));
        }
        return retryResult;
      }
      const eligibility = evaluateConditionEligibility({
        governance: runtime.governance,
        runId: correlation.runId,
        reviewId: correlation.reviewId,
        policyVersion: correlation.policyVersion,
        policyDigest: correlation.policyDigest,
        envelope: conditionInput.envelope,
        existingDispositions: state.dispositions,
        findings: openFindings,
        actorId: authorization.evidence?.actor_id || '',
        authorization,
        reasonPath: reason.path,
        reasonSha256: reason.sha256,
        completedPhases: ['requirement', 'acceptance'],
      });
      if (conditionInput.invalid) {
        throwConditionEligibilityFailure(eligibility, `conditions:${conditionInput.issue}`);
      }
      if (!eligibility.eligible) {
        const inputIssue = !reason.valid ? `reason:${reason.issue}` : null;
        throwConditionEligibilityFailure(eligibility, inputIssue);
      }

      const nowValue = options.now || new Date();
      const now = nowValue instanceof Date ? nowValue.toISOString() : new Date(nowValue).toISOString();
      const canonicalized = canonicalizeConditionDispositions(
        state,
        conditionInput.envelope,
        authorization,
        now,
      );
      const canonicalEnvelope = {
        ...conditionInput.envelope,
        dispositions: [],
      };
      const canonicalEligibility = evaluateConditionEligibility({
        governance: runtime.governance,
        runId: correlation.runId,
        reviewId: correlation.reviewId,
        policyVersion: correlation.policyVersion,
        policyDigest: correlation.policyDigest,
        envelope: canonicalEnvelope,
        existingDispositions: canonicalized.dispositions,
        findings: openFindings,
        actorId: authorization.evidence.actor_id,
        authorization,
        reasonPath: reason.path,
        reasonSha256: reason.sha256,
        completedPhases: ['requirement', 'acceptance'],
      });
      if (!canonicalEligibility.eligible) {
        throwConditionEligibilityFailure(canonicalEligibility);
      }

      const openFindingIds = new Set(openFindings.map((finding) => finding.finding_id));
      const dispositionIds = canonicalized.dispositions
        .filter((disposition) => disposition.state === 'current' && openFindingIds.has(disposition.finding_id))
        .sort((left, right) => left.finding_id.localeCompare(right.finding_id))
        .map((disposition) => disposition.disposition_id);
      const evaluation = conditionEvaluationSchema.parse({
        schema_version: 1,
        evaluation_id: nextCanonicalRecordId(state.condition_evaluations || [], 'evaluation_id', 'CE'),
        run_id: runId,
        review_id: canonicalReview.review_id,
        actor_id: authorization.evidence.actor_id,
        policy_version: correlation.policyVersion,
        policy_digest: correlation.policyDigest,
        disposition_ids: dispositionIds,
        reason_path: reason.path,
        reason_sha256: reason.sha256,
        result: canonicalEligibility,
        evaluated_at: now,
      });
      const reviewerProjection = buildConditionedDecisionProjection({ review: canonicalReview });
      const candidate = conditionedDecisionCandidateSchema.parse({
        schema_version: 1,
        candidate_id: nextCanonicalRecordId(state.conditioned_candidates || [], 'candidate_id', 'CC'),
        evaluation_id: evaluation.evaluation_id,
        run_id: runId,
        review_id: canonicalReview.review_id,
        phase: 'technical-plan',
        ...reviewerProjection,
        publication_state: 'candidate',
        actor_id: authorization.evidence.actor_id,
        authorization: authorization.evidence,
        policy_version: correlation.policyVersion,
        policy_digest: correlation.policyDigest,
        reason_path: reason.path,
        reason_sha256: reason.sha256,
        disposition_ids: dispositionIds,
        recorded_at: now,
      });
      const approvalReport = buildApprovalCandidateReport(repoRoot, 'technical-plan');
      const draftCandidate = approvalReport.candidates.find((item) => Number(item.version) === Number(options.version));
      const result = {
        task: 'approve',
        phase: 'technical-plan',
        version: Number(options.version) || null,
        artifact: draftCandidate?.path || canonicalReview.source_file,
        run_id: runId,
        review_id: canonicalReview.review_id,
        ...reviewerProjection,
        publication_state: 'candidate',
        eligibility: canonicalEligibility,
        evaluation_id: evaluation.evaluation_id,
        candidate_id: candidate.candidate_id,
        disposition_ids: dispositionIds,
        reason_path: reason.path,
        reason_sha256: reason.sha256,
        final_decision_published: false,
        phase_advanced: false,
        dry_run: options.dryRun === true,
      };
      if (options.dryRun !== true) {
        writeRunGovernance(repoRoot, runId, {
          ...state,
          dispositions: canonicalized.dispositions,
          condition_evaluations: (state.condition_evaluations || []).concat(evaluation),
          conditioned_candidates: (state.conditioned_candidates || []).concat(candidate),
          updated_at: now,
        });
      }
      if (options.suppressOutput !== true) {
        process.stdout.write(formatConditionedCandidateResult(result, options));
      }
      return result;
  };

  return options.dryRun === true
    ? evaluateCandidate()
    : withAiRunLock(
      repoRoot,
      runId,
      { command: 'ai approve --decision approved-with-conditions' },
      evaluateCandidate,
    );
}

function resolveCanonicalApprovalInput(repoRoot, run, governanceState, phase, options = {}) {
  if (phase === 'acceptance') {
    const expectedPath = path.relative(
      repoRoot,
      runRequirementPath(repoRoot, run.run_id),
    ).split(path.sep).join('/');
    if (run.requirement?.path !== expectedPath) {
      throw new GovernanceError('APPROVAL_BINDING_MISMATCH', 'Acceptance approval requires its canonical run-scoped requirement input.', {
        mismatches: ['input_path'],
      });
    }
    return expectedPath;
  }
  const acceptanceDecisions = (governanceState.decisions || [])
    .filter((decision) => decision.phase === 'acceptance' && decision.publication_state === 'final');
  if (acceptanceDecisions.length !== 1) {
    throw new GovernanceError(
      acceptanceDecisions.length === 0 ? 'APPROVAL_BINDING_MISMATCH' : 'REPRESENTATION_MISMATCH',
      'Technical-plan approval requires exactly one canonical acceptance decision from the same run.',
      { mismatches: ['acceptance_decision'], count: acceptanceDecisions.length },
    );
  }
  const acceptanceDecision = verifyApprovalDecisionRecord(acceptanceDecisions[0]);
  const verification = verifyCanonicalApproval(repoRoot, {
    ...options,
    phase: 'acceptance',
    runId: run.run_id,
  });
  if (verification.decision.decision_id !== acceptanceDecision.decision_id
      || verification.decision.decision_sha256 !== acceptanceDecision.decision_sha256) {
    throw new GovernanceError(
      'APPROVAL_BINDING_MISMATCH',
      'Technical-plan approval input does not match the verified canonical acceptance decision.',
      { mismatches: ['acceptance_decision'] },
    );
  }
  return verification.decision.artifact_path;
}

function selectConditionedCandidateForCommit(state, options = {}) {
  const publishedIds = new Set((state.decisions || []).map((decision) => decision.candidate_id).filter(Boolean));
  const candidates = (state.conditioned_candidates || []).filter((candidate) => (
    candidate.publication_state === 'candidate'
    && candidate.run_id === options.runId
    && candidate.review_id === state.current_review_id
    && !publishedIds.has(candidate.candidate_id)
    && (!options.candidateId || candidate.candidate_id === options.candidateId)
  ));
  if (candidates.length !== 1) {
    throw new GovernanceError(
      'APPROVAL_CANDIDATE_AMBIGUOUS',
      `Conditioned approval requires exactly one unpublished candidate, found ${candidates.length}.`,
      { run_id: options.runId, candidate_id: options.candidateId || null, candidate_count: candidates.length },
    );
  }
  return candidates[0];
}

function assertApprovalRuntimeBinding(run, runtime) {
  const fields = [
    'requested_profile',
    'effective_profile',
    'policy_version',
    'policy_digest',
    'requirement_categories',
  ];
  const mismatches = fields.filter((field) => (
    stableStringify(run?.governance?.[field]) !== stableStringify(runtime?.binding?.[field])
  ));
  if (mismatches.length > 0) {
    throw new GovernanceError(
      'APPROVAL_BINDING_MISMATCH',
      'Current governance profile binding differs from the run-scoped binding.',
      { run_id: run?.run_id || null, mismatches: mismatches.map((field) => `governance.${field}`) },
    );
  }
}

function formatDigestBoundApprovalResult(result, options = {}) {
  const decision = result.decision;
  if (options.json === true) {
    return `${JSON.stringify({
      schema_version: 1,
      task: 'approval-commit',
      ok: true,
      status: 'approved',
      code: 'APPROVAL_COMMITTED',
      approval: decision,
    }, null, 2)}\n`;
  }
  return `${[
    'AI digest-bound approval saved',
    `Run: ${decision.run_id}`,
    `Phase: ${decision.phase}`,
    `Decision: ${decision.decision}`,
    `Version: v${decision.version}`,
    `Artifact: ${decision.artifact_path}`,
    `Artifact digest: ${decision.artifact_sha256}`,
    `Input digest: ${decision.input_sha256}`,
    `Criteria: ${decision.criterion_count}`,
    `Findings: ${decision.finding_count}`,
    `Decision digest: ${decision.decision_sha256}`,
  ].join('\n')}\n`;
}

async function commitGovernedDigestBoundApproval(repoRoot, governedApproval, options = {}) {
  const runId = governedApproval.run.run_id;
  const result = await commitDigestBoundApproval(repoRoot, {
    runId,
    phase: options.phase,
    command: `ai approve --phase ${options.phase}`,
    now: options.now,
    faultInjector: options.commitFaultInjector,
    prepare: async ({ run, governanceState }) => {
      if (fs.existsSync(runReviewCommitPath(repoRoot, runId))) {
        throw new GovernanceError(
          'GOVERNANCE_RECOVERY_REQUIRED',
          `Governed review recovery is required before approving run '${runId}'.`,
          { run_id: runId, final_decision_published: false, phase_advanced: false },
        );
      }
      assertNoPendingReviewBudgetReservations(repoRoot, runId);
      const requiredRunPhase = options.phase === 'acceptance' ? 'acceptance-draft' : 'technical-plan-reviewed';
      if (run.phase !== requiredRunPhase) {
        throw new GovernanceError(
          'AI_RUN_PHASE_INVALID',
          `Governed ${options.phase} approval requires run phase '${requiredRunPhase}', found '${run.phase}'.`,
          { run_id: runId, expected_phase: requiredRunPhase, actual_phase: run.phase },
        );
      }
      const actor = options.actor || await (options.resolveActorFn || resolveGitHubCliProviderSubject)({
        cwd: repoRoot,
        env: options.env,
        runner: options.identityRunner,
        host: options.githubHost,
      });
      const runtime = resolveGovernanceRuntime(repoRoot, options, run);
      assertApprovalRuntimeBinding(run, runtime);
      let review = null;
      if (options.phase === 'technical-plan') {
        review = readPlanReview(repoRoot);
        const canonicalReview = assertGovernedPlanReviewCorrelation(repoRoot, review, run, runtime);
        if (canonicalReview.projection.blocking === true && options.decision !== 'approved-with-conditions') {
          throw new GovernanceError('GOVERNANCE_STATE_INVALID', 'The current canonical plan review blocks unconditional approval.');
        }
      }
      assertGovernedApprovalCandidateCorrelation(repoRoot, run, options.phase, options.version, review);
      const conditionedCandidate = options.decision === 'approved-with-conditions'
        ? selectConditionedCandidateForCommit(governanceState, {
            runId,
            candidateId: options.conditionedCandidateId,
          })
        : null;
      const authorization = authorizeGovernanceAction({
        governance: runtime.governance,
        action: conditionedCandidate ? 'approve-with-conditions' : 'approve',
        actor,
        profile: runtime.profile.effective_profile,
        context: {
          run_creator: run.governance_actors?.run_creator || null,
          reviewer: run.governance_actors?.reviewer || null,
          executor: run.governance_actors?.executor || null,
        },
      });
      if (!authorization.authorized) throw governanceFailure(authorization);
      if (conditionedCandidate) {
        const openFindings = (governanceState.findings || []).filter((finding) => finding.state === 'open');
        const reason = readConditionReason(repoRoot, conditionedCandidate.reason_path);
        const eligibility = evaluateConditionEligibility({
          governance: runtime.governance,
          runId,
          reviewId: conditionedCandidate.review_id,
          policyVersion: runtime.profile.policy_version,
          policyDigest: runtime.profile.policy_digest,
          envelope: {
            schema_version: 1,
            run_id: runId,
            review_id: conditionedCandidate.review_id,
            policy_version: runtime.profile.policy_version,
            policy_digest: runtime.profile.policy_digest,
            dispositions: [],
          },
          existingDispositions: governanceState.dispositions,
          findings: openFindings,
          actorId: authorization.evidence.actor_id,
          authorization,
          reasonPath: reason.path,
          reasonSha256: reason.sha256,
          completedPhases: ['requirement', 'acceptance'],
        });
        if (!eligibility.eligible) throwConditionEligibilityFailure(eligibility);
      }
      const canonicalInputPath = resolveCanonicalApprovalInput(
        repoRoot,
        run,
        governanceState,
        options.phase,
        options,
      );
      const bound = buildDigestBoundApprovalBindings(repoRoot, {
        phase: options.phase,
        version: options.version,
        run,
        runtime,
        governanceState,
        conditionedCandidate,
        canonicalInputPath,
        authorization,
      });
      if (options.phase === 'technical-plan') {
        validateTechnicalPlanSpecContract(repoRoot, {
          inputPath: bound.artifact.path,
          inputText: bound.artifact.bytes.toString('utf8'),
        });
      }
      let legacyProjection = null;
      if (!conditionedCandidate) {
        try {
          legacyProjection = preparePlannerApprovalProjection(
            repoRoot,
            options.phase,
            options.version,
            {
              allowHistorical: true,
              requireDigestBindings: true,
              now: options.now,
            },
          );
        } catch (error) {
          if (error instanceof GovernanceError) throw error;
          throw new GovernanceError(
            'APPROVAL_BINDING_MISMATCH',
            'Legacy approval projection changed during digest-bound commit preparation.',
            { mismatches: ['legacy_projection'], cause: error.message },
          );
        }
      }
      return { ...bound, legacyProjection };
    },
  });
  if (options.suppressOutput !== true) {
    process.stdout.write(formatDigestBoundApprovalResult(result, options));
  }
  return {
    ...result,
    governance: governedApproval.profile,
  };
}

async function runApprove(repoRoot, options = {}) {
  const translator = createTranslator(options.language);
  const phase = normalizePlannerPhase(options.phase || DEFAULT_PLAN_PHASE);
  const decision = String(options.decision || 'approved').trim();
  if (!['approved', 'approved-with-conditions'].includes(decision)) {
    throw new GovernanceError('DISPOSITION_UNRESOLVED', `Unsupported approval decision '${decision || 'missing'}'.`);
  }
  const conditionedDecision = decision === 'approved-with-conditions';
  if (phase === 'spec') {
    throw new Error(formatError(translator.t('ai.approve.error.unsupported_phase', { phase })));
  }
  if (conditionedDecision && phase !== 'technical-plan') {
    throw new GovernanceError('DISPOSITION_UNRESOLVED', 'approved-with-conditions is only supported for technical-plan in v58.');
  }

  if (options.input) {
    throw new Error(formatError(translator.t('ai.approve.error.input_not_supported', { phase, input: options.input })));
  }

  if (options.digestBound === true && options.dryRun !== true) {
    const runsRoot = path.join(repoRoot, '.quiver', 'runs');
    const pendingRunIds = fs.existsSync(runsRoot)
      ? fs.readdirSync(runsRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .filter((entry) => fs.existsSync(path.join(runsRoot, entry.name, 'approval-commit-wal.json')))
        .map((entry) => entry.name)
      : [];
    const recoveryRunIds = options.runId
      ? pendingRunIds.filter((runId) => runId === String(options.runId).trim().toLowerCase())
      : pendingRunIds;
    if (!options.runId && recoveryRunIds.length > 1) {
      throw new GovernanceError(
        'AI_RUN_AMBIGUOUS',
        'Multiple runs require approval recovery; rerun with --run <id>.',
        { run_ids: recoveryRunIds },
      );
    }
    for (const runId of recoveryRunIds) {
      recoverDigestBoundApprovalCommit(repoRoot, { runId });
    }
  }

  const explicitRun = options.runId ? readAiRun(repoRoot, options.runId) : null;
  let governedApproval = null;
  if (governanceIsEnabled(repoRoot, options, explicitRun)) {
    const run = options.runId
      ? resolveGovernedAiRun(repoRoot, options.runId)
      : resolveGovernedAiRun(repoRoot);
    if (!run) {
      throw new Error(formatError('AI_RUN_REQUIRED: governed approval requires an existing --run <id>'));
    }
    governedApproval = {
      ...resolveGovernanceRuntime(repoRoot, options, run),
      run,
    };
    if (options.dryRun !== true && (!conditionedDecision || options.publishFinal === true)) {
      recoverGovernedPlanReviewCommit(repoRoot, { runId: run.run_id });
      governedApproval.run = readAiRun(repoRoot, run.run_id);
    }
  }
  if (conditionedDecision && !governedApproval) {
    throw new GovernanceError('AI_RUN_REQUIRED', 'approved-with-conditions requires an explicit governed run.');
  }

  let technicalPlanReview = null;
  let governedCanonicalReview = null;
  if (phase === 'technical-plan') {
    technicalPlanReview = readPlanReview(repoRoot);
    if (governedApproval && !conditionedDecision) {
      governedCanonicalReview = assertGovernedPlanReviewCorrelation(
        repoRoot,
        technicalPlanReview,
        governedApproval.run,
        governedApproval,
      );
    }
  }

  const version = await resolveApprovalVersion(repoRoot, phase, options);

  if (conditionedDecision) {
    const candidate = await runConditionedApprovalCandidate(repoRoot, {
      ...options,
      phase,
      version,
      governedApproval,
      suppressOutput: options.publishFinal === true,
    });
    if (options.dryRun === true || options.publishFinal !== true) return candidate;
    return commitGovernedDigestBoundApproval(repoRoot, governedApproval, {
      ...options,
      phase,
      version,
      conditionedCandidateId: candidate.candidate_id,
    });
  }

  if (phase === 'technical-plan') {
    if (technicalPlanReview.status !== 'unapproved' && technicalPlanReview.status !== 'reviewed') {
      throw new Error(formatError(translator.t('ai.approve.error.review_required', { status: technicalPlanReview.status })));
    }
    if (!conditionedDecision && (governedCanonicalReview?.projection?.blocking === true
        || (!governedCanonicalReview && reviewBlocksApproval(technicalPlanReview)))) {
      const reviewResult = governedCanonicalReview?.projection || technicalPlanReview.meta.review_result;
      const requiredFixes = Array.isArray(reviewResult.required_fixes) ? reviewResult.required_fixes.length : 0;
      throw new Error(formatError(translator.t('ai.approve.error.review_blocked', {
        recommendation: reviewResult.approval_recommendation,
        fixes: requiredFixes,
        command: technicalPlanReview.meta.review_result.next_command,
      })));
    }
    if (!(governedApproval && options.digestBound === true)) {
      assertTechnicalPlanDraftHasSpecContract(repoRoot, version);
    }
  }
  if (governedApproval) {
    assertGovernedApprovalCandidateCorrelation(
      repoRoot,
      governedApproval.run,
      phase,
      version,
      technicalPlanReview,
    );
  }

  const inputText = '';

  if (options.dryRun) {
    process.stdout.write(formatApprovalDryRunResult({ phase, input: options.input, version, language: options.language }));
    return {
      task: 'approve',
      phase,
      input: options.input,
      version: version || null,
      dryRun: true,
    };
  }

  if (governedApproval && options.digestBound === true) {
    return commitGovernedDigestBoundApproval(repoRoot, governedApproval, {
      ...options,
      phase,
      version,
    });
  }

  const commitApproval = (governanceContext = null) => {
    const result = approvePlannerPhase(repoRoot, phase, options.input || '', inputText, {
      version: version || undefined,
    });
    const lifecycleRun = governanceContext?.run || ensureAiRun(repoRoot, {
      command: `ai approve --phase ${phase}`,
      input: options.input || result.filePath,
      runId: options.runId,
    });
    recordAiRunApproval(repoRoot, lifecycleRun.run_id, {
      artifact: path.relative(repoRoot, result.filePath).split(path.sep).join('/'),
      phase,
      source_file: options.input || `draft version ${version}`,
      version: result.version || null,
      governance: governanceContext ? {
        requested_profile: governanceContext.profile.requested_profile,
        effective_profile: governanceContext.profile.effective_profile,
        policy_version: governanceContext.profile.policy_version,
        policy_digest: governanceContext.profile.policy_digest,
        actor: governanceContext.actor,
        authorization: governanceContext.authorization.evidence,
      } : null,
    });
    updateAiRunPhase(repoRoot, lifecycleRun.run_id, phase === 'acceptance' ? 'acceptance-approved' : 'technical-plan-approved', {
      artifact: path.relative(repoRoot, result.filePath).split(path.sep).join('/'),
      command: `ai approve --phase ${phase}`,
      locked: Boolean(governanceContext),
    });
    process.stdout.write(formatApprovalResult({
      ...result,
      sourceFile: options.input || `draft version ${version}`,
    }, repoRoot, options));

    return {
      task: 'approve',
      phase,
      input: options.input,
      filePath: path.relative(repoRoot, result.filePath).split(path.sep).join('/'),
      createdAt: result.createdAt,
      version: result.version || null,
      governance: governanceContext?.profile || null,
    };
  };

  if (!governedApproval) {
    return commitApproval();
  }

  const actor = options.actor || await (options.resolveActorFn || resolveGitHubCliProviderSubject)({
    cwd: repoRoot,
    env: options.env,
    runner: options.identityRunner,
    host: options.githubHost,
  });
  return withAiRunLock(
    repoRoot,
    governedApproval.run.run_id,
    { command: `ai approve --phase ${phase}` },
    () => {
      recoverGovernedPlanReviewCommit(repoRoot, {
        runId: governedApproval.run.run_id,
        locked: true,
      });
      assertNoPendingReviewBudgetReservations(repoRoot, governedApproval.run.run_id);
      const lockedRun = readAiRun(repoRoot, governedApproval.run.run_id);
      const requiredRunPhase = phase === 'acceptance' ? 'acceptance-draft' : 'technical-plan-reviewed';
      if (lockedRun?.status === 'closed') {
        throw new GovernanceError('AI_RUN_CLOSED', `Governed approval cannot mutate closed run '${lockedRun.run_id}'.`);
      }
      if (lockedRun?.phase !== requiredRunPhase) {
        throw new GovernanceError(
          'AI_RUN_PHASE_INVALID',
          `Governed ${phase} approval requires run phase '${requiredRunPhase}', found '${lockedRun?.phase || 'missing'}'.`,
          { run_id: lockedRun?.run_id || null, expected_phase: requiredRunPhase, actual_phase: lockedRun?.phase || null },
        );
      }
      const lockedRuntime = resolveGovernanceRuntime(repoRoot, options, lockedRun);
      let lockedTechnicalPlanReview = null;
      let lockedCanonicalReview = null;
      if (phase === 'technical-plan') {
        lockedTechnicalPlanReview = readPlanReview(repoRoot);
        lockedCanonicalReview = assertGovernedPlanReviewCorrelation(
          repoRoot,
          lockedTechnicalPlanReview,
          lockedRun,
          lockedRuntime,
        );
        if (lockedTechnicalPlanReview.status !== 'unapproved'
            && lockedTechnicalPlanReview.status !== 'reviewed') {
          throw new Error(formatError(translator.t('ai.approve.error.review_required', {
            status: lockedTechnicalPlanReview.status,
          })));
        }
        if (lockedCanonicalReview.projection.blocking === true) {
          const reviewResult = lockedCanonicalReview.projection;
          const requiredFixes = Array.isArray(reviewResult.required_fixes) ? reviewResult.required_fixes.length : 0;
          throw new Error(formatError(translator.t('ai.approve.error.review_blocked', {
            recommendation: reviewResult.approval_recommendation,
            fixes: requiredFixes,
            command: lockedTechnicalPlanReview.meta.review_result.next_command,
          })));
        }
        assertTechnicalPlanDraftHasSpecContract(repoRoot, version);
      }
      assertGovernedApprovalCandidateCorrelation(
        repoRoot,
        lockedRun,
        phase,
        version,
        lockedTechnicalPlanReview,
      );
      const authorization = authorizeGovernanceAction({
        governance: lockedRuntime.governance,
        action: 'approve',
        actor,
        profile: lockedRuntime.profile.effective_profile,
        context: {
          run_creator: lockedRun.governance_actors?.run_creator || null,
          reviewer: lockedRun.governance_actors?.reviewer || null,
          executor: lockedRun.governance_actors?.executor || null,
        },
      });
      if (!authorization.authorized) {
        throw governanceFailure(authorization);
      }
      const boundRun = bindAiRunGovernance(repoRoot, lockedRun.run_id, lockedRuntime.binding, {
        command: `ai approve --phase ${phase}`,
        locked: true,
      });
      return commitApproval({
        ...lockedRuntime,
        run: boundRun,
        actor,
        authorization,
      });
    },
  );
}

function normalizeApprovalRecordPhase(value) {
  const phase = normalizePlannerPhase(value || DEFAULT_PLAN_PHASE);
  if (!PLANNER_APPROVAL_PHASES.includes(phase)) {
    throw new GovernanceError(
      'APPROVAL_PHASE_UNSUPPORTED',
      `Canonical approval records are only available for ${PLANNER_APPROVAL_PHASES.join(' or ')}.`,
      { phase },
    );
  }
  return phase;
}

function resolveApprovalInspectionRun(repoRoot, options = {}) {
  if (options.runId) {
    const explicit = readAiRun(repoRoot, options.runId);
    if (!explicit) {
      throw new GovernanceError('AI_RUN_REQUIRED', `AI run '${options.runId}' does not exist.`, {
        run_id: options.runId,
      });
    }
    return explicit;
  }

  const active = listAiRuns(repoRoot).filter((run) => run.status !== 'closed');
  if (active.length !== 1) {
    throw new GovernanceError(
      active.length === 0 ? 'AI_RUN_REQUIRED' : 'AI_RUN_AMBIGUOUS',
      active.length === 0
        ? 'Approval inspection requires --run <id> because there is no active run.'
        : `Approval inspection requires --run <id> because ${active.length} runs are active.`,
      { active_run_ids: active.map((run) => run.run_id) },
    );
  }
  return active[0];
}

function approvalProjectionFailure(code, message, mismatches = []) {
  return new GovernanceError(code, message, { mismatches });
}

function readApprovalBindingFile(repoRoot, value, label, mismatchField) {
  try {
    return readProjectFileBytes(repoRoot, value, label);
  } catch (error) {
    if (error instanceof GovernanceError) throw error;
    throw new GovernanceError(
      'APPROVAL_BINDING_MISMATCH',
      `${label} is missing, invalid, or resolves outside the project.`,
      { mismatches: [mismatchField], cause: error.message },
    );
  }
}

function readDecisionApprovalProjection(repoRoot, run, decision) {
  const projectionPath = path.relative(repoRoot, runApprovalsPath(repoRoot, run.run_id)).split(path.sep).join('/');
  if (run.approvals_path !== projectionPath) {
    throw approvalProjectionFailure(
      'APPROVAL_BINDING_MISMATCH',
      'Run approval projection path does not match the canonical run namespace.',
      ['run.approvals_path'],
    );
  }
  const source = readApprovalBindingFile(
    repoRoot,
    projectionPath,
    'Run approval projection',
    'approvals.json',
  );
  let projection;
  try {
    projection = JSON.parse(source.bytes.toString('utf8'));
  } catch (error) {
    throw approvalProjectionFailure(
      'APPROVAL_BINDING_MISMATCH',
      'Run approval projection is not valid JSON.',
      ['approvals.json'],
    );
  }
  if (projection?.schema_version !== 1
      || projection?.run_id !== run.run_id
      || !Array.isArray(projection?.approvals)) {
    throw approvalProjectionFailure(
      'APPROVAL_BINDING_MISMATCH',
      'Run approval projection does not match its canonical run.',
      ['approvals.json'],
    );
  }
  const matches = projection.approvals.filter((item) => item?.decision_id === decision.decision_id);
  if (matches.length !== 1) {
    throw approvalProjectionFailure(
      'REPRESENTATION_MISMATCH',
      'Run approval projection must contain exactly one copy of the canonical decision.',
      ['decision_id'],
    );
  }
  const item = matches[0];
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
  const representationMismatches = ['criterion_count'].filter((field) => item?.[field] !== expected[field]);
  if (representationMismatches.length > 0) {
    throw approvalProjectionFailure(
      'REPRESENTATION_MISMATCH',
      'Run approval projection count differs from the canonical decision.',
      representationMismatches,
    );
  }
  const bindingMismatches = Object.keys(expected)
    .filter((field) => field !== 'criterion_count')
    .filter((field) => stableStringify(item?.[field]) !== stableStringify(expected[field]));
  if (bindingMismatches.length > 0) {
    throw approvalProjectionFailure(
      'APPROVAL_BINDING_MISMATCH',
      'Run approval projection differs from the canonical decision.',
      bindingMismatches,
    );
  }
  return { path: source.path, value: item };
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

function assertApprovalRunHistory(run, decision) {
  const expectedPhase = decision.phase === 'acceptance'
    ? 'acceptance-approved'
    : 'technical-plan-approved';
  const matches = (run.history || []).filter((event) => (
    event?.phase === expectedPhase
    && event?.artifact === decision.artifact_path
    && event?.at === decision.recorded_at
  ));
  if (matches.length !== 1) {
    throw new GovernanceError(
      'APPROVAL_BINDING_MISMATCH',
      'AI run history does not contain exactly one matching approval transition.',
      { mismatches: ['run.history'], expected_phase: expectedPhase },
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

function verifyCanonicalApproval(repoRoot, options = {}) {
  const phase = normalizeApprovalRecordPhase(options.phase);
  const run = resolveApprovalInspectionRun(repoRoot, options);
  if (fs.existsSync(runApprovalCommitPath(repoRoot, run.run_id))) {
    throw new GovernanceError(
      'APPROVAL_RECOVERY_REQUIRED',
      `Approval commit recovery is required before reading run '${run.run_id}'.`,
      { run_id: run.run_id },
    );
  }
  const phaseDecisions = readRunApprovalDecisions(repoRoot, run.run_id)
    .filter((item) => item.phase === phase);
  if (phaseDecisions.length !== 1) {
    throw new GovernanceError(
      phaseDecisions.length === 0 ? 'APPROVAL_NOT_FOUND' : 'REPRESENTATION_MISMATCH',
      phaseDecisions.length === 0
        ? `No canonical ${phase} approval exists for run '${run.run_id}'.`
        : `Run '${run.run_id}' contains ${phaseDecisions.length} canonical ${phase} decisions.`,
      { run_id: run.run_id, phase, decision_count: phaseDecisions.length },
    );
  }
  const decision = readRunApprovalDecision(repoRoot, run.run_id, phase);
  const governanceState = readRunGovernance(repoRoot, run.run_id);
  if (!governanceState) {
    throw new GovernanceError('APPROVAL_BINDING_MISMATCH', 'Canonical run governance state is missing.', {
      mismatches: ['review-governance.json'],
    });
  }
  const runtime = resolveGovernanceRuntime(repoRoot, options, run);
  if (!runtime) {
    throw new GovernanceError('GOVERNANCE_CONFIG_MISSING', 'Canonical approval verification requires governance configuration.');
  }
  assertApprovalRuntimeBinding(run, runtime);

  const expectedArtifactPath = path.relative(
    repoRoot,
    runApprovalArtifactPath(repoRoot, run.run_id, phase, decision.version),
  ).split(path.sep).join('/');
  const artifact = readApprovalBindingFile(
    repoRoot,
    expectedArtifactPath,
    'Canonical approval artifact',
    'artifact_path',
  );
  const canonicalInputPath = resolveCanonicalApprovalInput(repoRoot, run, governanceState, phase, options);
  const input = readApprovalBindingFile(
    repoRoot,
    canonicalInputPath,
    'Canonical approval input',
    'input_path',
  );
  const criteria = approvalCriteria(repoRoot, phase, artifact);
  const review = phase === 'technical-plan'
    ? governanceState.reviews.find((item) => item.review_id === governanceState.current_review_id) || null
    : null;
  if (phase === 'technical-plan' && !review) {
    throw new GovernanceError('APPROVAL_BINDING_MISMATCH', 'Canonical technical-plan review is missing.', {
      mismatches: ['review_id'],
    });
  }

  const conditionedCandidate = decision.candidate_id
    ? governanceState.conditioned_candidates.find((item) => item.candidate_id === decision.candidate_id) || null
    : null;
  if (decision.decision === 'approved-with-conditions' && !conditionedCandidate) {
    throw new GovernanceError('APPROVAL_BINDING_MISMATCH', 'Conditioned approval candidate is missing.', {
      mismatches: ['candidate_id'],
    });
  }
  const dispositionIds = conditionedCandidate
    ? [...conditionedCandidate.disposition_ids].sort()
    : [];
  const dispositions = dispositionIds.map((dispositionId) => (
    governanceState.dispositions.find((item) => item.disposition_id === dispositionId && item.state === 'current') || null
  ));
  if (dispositions.some((item) => item === null)) {
    throw new GovernanceError('APPROVAL_BINDING_MISMATCH', 'A bound approval disposition is missing or no longer current.', {
      mismatches: ['disposition_ids'],
    });
  }
  const reason = conditionedCandidate
    ? readApprovalBindingFile(
        repoRoot,
        conditionedCandidate.reason_path,
        'Conditioned approval reason',
        'reason_path',
      )
    : null;

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
  if (!authorization.authorized) throw governanceFailure(authorization);

  const actual = {
    run_id: run.run_id,
    review_id: review?.review_id || null,
    phase,
    decision: conditionedCandidate ? conditionedCandidate.decision : 'approved',
    candidate_id: conditionedCandidate?.candidate_id || null,
    evaluation_id: conditionedCandidate?.evaluation_id || null,
    version: decision.version,
    artifact_path: artifact.path,
    artifact_sha256: artifact.sha256,
    input_path: input.path,
    input_sha256: input.sha256,
    review_sha256: review ? canonicalSha256(review) : null,
    requested_profile: runtime.profile.requested_profile,
    effective_profile: runtime.profile.effective_profile,
    profile_sha256: computeApprovalProfileDigest(runtime.profile, run.governance || runtime.binding),
    policy_version: runtime.profile.policy_version,
    policy_digest: runtime.profile.policy_digest,
    finding_count: canonicalFindingCountAt(governanceState, decision.recorded_at),
    criterion_count: criteria.length,
    disposition_ids: dispositionIds,
    disposition_sha256: computeApprovalDispositionDigest(dispositions),
    reason_path: reason?.path || null,
    reason_sha256: reason?.sha256 || null,
    actor_id: authorization.evidence.actor_id,
    authorization: authorization.evidence,
    reviewer_recommendation: review?.provider_recommendation || null,
    reviewer_approved: conditionedCandidate ? false : null,
  };
  assertApprovalBindingParity(decision, actual);
  const projection = readDecisionApprovalProjection(repoRoot, run, decision);
  assertApprovalRunHistory(run, decision);
  return {
    valid: true,
    code: 'APPROVAL_VALID',
    run,
    decision,
    projection,
    criteria,
  };
}

function approvalInspectionJson(command, verification, extra = {}) {
  return {
    schema_version: 1,
    task: `approval-${command}`,
    ok: true,
    status: 'valid',
    code: verification.code,
    approval: verification.decision,
    verification: {
      valid: true,
      projection_path: verification.projection.path,
      criteria_count: verification.criteria.length,
    },
    ...extra,
  };
}

function formatLinearApprovalComment(decision) {
  const lines = [
    `${decision.phase.replace(/-/g, '_').toUpperCase()}_${decision.decision.replace(/-/g, '_').toUpperCase()}:v${decision.version}`,
    `artifact_sha256=${decision.artifact_sha256}`,
    `requirement_sha256=${decision.input_sha256}`,
    `criteria_count=${decision.criterion_count}`,
  ];
  if (decision.decision === 'approved-with-conditions') {
    lines.push(
      `reviewer_recommendation=${decision.reviewer_recommendation}`,
      'reviewer_approved=false',
    );
  }
  return `${lines.join('\n')}\n`;
}

function formatApprovalInspection(command, verification, options = {}) {
  const decision = verification.decision;
  if (command === 'export') {
    const format = String(options.format || 'linear-comment').trim().toLowerCase();
    if (format !== 'linear-comment') {
      throw new GovernanceError(
        'APPROVAL_EXPORT_FORMAT_UNSUPPORTED',
        `Unsupported approval export format '${format || 'missing'}'.`,
        { supported_formats: ['linear-comment'] },
      );
    }
    const output = formatLinearApprovalComment(decision);
    return options.json === true
      ? `${JSON.stringify(approvalInspectionJson(command, verification, { format, output }), null, 2)}\n`
      : output;
  }
  if (options.json === true) {
    return `${JSON.stringify(approvalInspectionJson(command, verification), null, 2)}\n`;
  }
  return `${[
    command === 'show' ? 'AI canonical approval' : 'AI canonical approval verified',
    `Status: valid`,
    `Code: ${verification.code}`,
    `Run: ${decision.run_id}`,
    `Phase: ${decision.phase}`,
    `Decision: ${decision.decision}`,
    `Version: v${decision.version}`,
    `Artifact: ${decision.artifact_path}`,
    `Artifact digest: ${decision.artifact_sha256}`,
    `Input: ${decision.input_path}`,
    `Input digest: ${decision.input_sha256}`,
    `Criteria: ${decision.criterion_count}`,
    `Findings: ${decision.finding_count}`,
    `Actor: ${decision.actor_id}`,
    `Recorded: ${decision.recorded_at}`,
    `Decision digest: ${decision.decision_sha256}`,
  ].join('\n')}\n`;
}

function approvalJsonFailure(command, error) {
  return {
    schema_version: 1,
    task: `approval-${command || 'unknown'}`,
    ok: false,
    status: 'error',
    code: error?.code || 'APPROVAL_COMMAND_FAILED',
    error: {
      message: String(error?.message || 'Approval command failed.'),
      details: error?.details || {},
    },
  };
}

function runApprovalRecord(repoRoot, options = {}) {
  const command = String(options.command || '').trim().toLowerCase();
  try {
    if (!['show', 'verify', 'export'].includes(command)) {
      throw new GovernanceError(
        'APPROVAL_COMMAND_UNSUPPORTED',
        `Unsupported ai approval subcommand '${command || 'missing'}'.`,
        { supported_commands: ['show', 'verify', 'export'] },
      );
    }
    const verification = verifyCanonicalApproval(repoRoot, options);
    const output = formatApprovalInspection(command, verification, options);
    process.stdout.write(output);
    return {
      task: `approval-${command}`,
      command,
      verification,
      output,
    };
  } catch (error) {
    if (options.json !== true) throw error;
    const failure = approvalJsonFailure(command, error);
    process.stdout.write(`${JSON.stringify(failure, null, 2)}\n`);
    process.exitCode = 1;
    return failure;
  }
}

async function runApprovalStatus(repoRoot, options = {}) {
  const report = formatApprovalStatusReportWithOptions(repoRoot, options);
  process.stdout.write(report);
  return {
    task: 'approval-status',
    report,
  };
}

function runLifecycleStatus(repoRoot, options = {}) {
  const run = resolveAiRun(repoRoot, options.runId || '');
  const report = formatAiRunStatus(repoRoot, run, options);
  process.stdout.write(report);
  return {
    task: 'status',
    run,
    report,
  };
}

function runLifecycleResume(repoRoot, options = {}) {
  const run = resolveAiRun(repoRoot, options.runId || '');
  const report = formatAiRunResume(repoRoot, run, options);
  process.stdout.write(report);
  return {
    task: 'resume',
    run,
    report,
  };
}

function runInspect(repoRoot, options = {}) {
  const report = collectLifecycleExport(repoRoot, {
    includeCompleted: options.includeCompleted === true,
  });
  process.stdout.write(formatLifecycleInspect(report, options));
  return {
    task: 'inspect',
    report,
  };
}

function runExport(repoRoot, options = {}) {
  const report = collectLifecycleExport(repoRoot, {
    includeCompleted: options.includeCompleted === true,
  });
  const format = String(options.format || 'json').trim().toLowerCase();

  if (format === 'json') {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return {
      task: 'export',
      format,
      report,
    };
  }

  if (format === 'markdown' || format === 'md') {
    process.stdout.write(formatLifecycleExportMarkdown(report, options));
    return {
      task: 'export',
      format: 'markdown',
      report,
    };
  }

  throw new Error(formatError(`unsupported ai export format: ${format}. Supported formats: json, markdown`));
}

function runSpecsList(repoRoot, options = {}) {
  const report = collectLifecycleExport(repoRoot, {
    includeCompleted: options.includeCompleted === true,
  });
  if (options.json === true) {
    process.stdout.write(`${JSON.stringify({ specs: report.specs }, null, 2)}\n`);
  } else {
    process.stdout.write(formatSpecsList(report, options));
  }
  return {
    task: 'specs',
    specs: report.specs,
  };
}

function runSlicesList(repoRoot, options = {}) {
  const report = collectLifecycleExport(repoRoot, {
    includeCompleted: options.includeCompleted === true,
  });
  if (options.json === true) {
    process.stdout.write(`${JSON.stringify({ slices: report.slices }, null, 2)}\n`);
  } else {
    process.stdout.write(formatSlicesList(report, options));
  }
  return {
    task: 'slices',
    slices: report.slices,
  };
}

function runTraceReport(repoRoot, options = {}) {
  const report = collectLifecycleExport(repoRoot, {
    includeCompleted: options.includeCompleted === true,
  });
  process.stdout.write(formatTraceReport(report, options));
  return {
    task: 'trace',
    report,
  };
}

function runActiveSlice(repoRoot, options = {}) {
  const command = String(options.command || 'status').trim().toLowerCase();
  if (command !== 'status' && command !== 'reconcile') {
    throw new Error(formatError(`unsupported ai active-slice subcommand: ${command}. Supported tasks: status, reconcile`));
  }
  if (command === 'reconcile' && options.dryRun !== true) {
    throw new Error(formatError('ai active-slice reconcile is dry-run first. Run `npx create-quiver ai active-slice reconcile --dry-run`.'));
  }

  const state = resolveProjectState(repoRoot, { allowGraphErrors: true });
  const report = collectActiveSliceState(repoRoot, { slices: state.graph.nodes });
  process.stdout.write(formatActiveSliceReconciliationReport(report, {
    dryRun: options.dryRun === true,
  }));
  return {
    task: 'active-slice',
    command,
    dryRun: options.dryRun === true,
    report,
  };
}

function runLifecycleRun(repoRoot, options = {}) {
  const translator = createTranslator(options.language);
  const command = String(options.command || '').trim().toLowerCase();
  if (command !== 'create' && command !== 'close') {
    throw new Error(formatError(translator.t('ai.run.error.unsupported_subcommand', { command })));
  }
  if (command === 'create' && !options.input) {
    throw new Error(formatError(translator.t('ai.run.error.create_requires_input')));
  }
  if (command === 'close') {
    const current = resolveAiRun(repoRoot, options.runId || '');
    if (!current) {
      throw new Error(formatError(translator.t('ai.run.error.close_requires_run')));
    }
    const closeRun = (locked = false) => {
      if (current.governance) {
        recoverGovernedPlanReviewCommit(repoRoot, { runId: current.run_id, locked });
      }
      return updateAiRunPhase(repoRoot, current.run_id, 'closed', {
        command: 'ai run close',
        locked,
      });
    };
    const run = current.governance
      ? withAiRunLock(repoRoot, current.run_id, { command: 'ai run close' }, () => closeRun(true))
      : closeRun();
    const report = `${translator.t('ai.run.closed.title')}\n${formatAiRunStatus(repoRoot, run, options)}`;
    process.stdout.write(report);
    return {
      task: 'run',
      command,
      run,
      report,
    };
  }
  const run = createAiRun(repoRoot, {
    command: 'ai run create',
    input: options.input,
    runId: options.runId,
    specSlug: options.specSlug,
  });
  const report = formatAiRunStatus(repoRoot, run, options);
  process.stdout.write(report);
  return {
    task: 'run',
    command,
    run,
    report,
  };
}

function isInteractiveAgentPromptAvailable(options = {}) {
  const stdinIsTTY = options.stdinIsTTY ?? Boolean((options.input || process.stdin).isTTY);
  const stdoutIsTTY = options.stdoutIsTTY ?? Boolean((options.output || process.stdout).isTTY);
  const ci = String((options.env || process.env).CI || '').trim().toLowerCase();
  return stdinIsTTY && stdoutIsTTY && ci !== '1' && ci !== 'true';
}

function providerInstallStatus(repoRoot, providerId, options = {}) {
  const probe = options.preflightProvider || preflightProvider;
  try {
    probe(providerId, {
      cwd: repoRoot,
      probe: options.providerProbe,
      probeArgs: options.providerProbeArgs,
    });
    return 'installed';
  } catch (error) {
    if (error && error.code === 'MISSING_PROVIDER_CLI') {
      return 'not_installed';
    }
    return 'not_verified';
  }
}

function buildAgentProviderChoices(repoRoot, options = {}) {
  const translator = createTranslator(options.language);
  return listCatalogProviders().map((provider) => {
    const status = providerInstallStatus(repoRoot, provider.id, options);
    return {
      label: provider.displayName,
      value: provider.id,
      hint: translator.t('ai.agent.choice.provider_hint', {
        count: provider.modelCount,
        status: translator.t(`ai.agent.install_status.${status}`),
      }),
      raw: {
        ...provider,
        installStatus: status,
      },
    };
  });
}

function buildAgentModelChoices(provider, role, options = {}) {
  const translator = createTranslator(options.language);
  return getKnownModelsForProvider(provider, { role }).map((model) => {
    const recommended = model.recommendedFor.includes(role)
      ? translator.t('ai.agent.choice.model_recommended')
      : translator.t('ai.agent.choice.model_available');
    const tier = [model.costTier, model.qualityTier, model.stability].filter(Boolean).join('/');
    return {
      label: model.id === 'custom' ? translator.t('ai.agent.choice.model_custom') : model.displayName,
      value: model.id,
      hint: [recommended, tier].filter(Boolean).join(', '),
      default: model.recommendedFor.includes(role),
      raw: model,
    };
  });
}

async function resolveInteractiveAgentSetOptions(repoRoot, options = {}) {
  const translator = createTranslator(options.language);
  const role = normalizeAgentProfileRole(options.role);
  const hasProvider = Boolean(String(options.provider || '').trim());
  const hasModel = Boolean(String(options.model || '').trim());
  if (hasProvider && hasModel) {
    return {
      ...options,
      role,
    };
  }

  const canPrompt = isInteractiveAgentPromptAvailable(options);
  const shouldPrompt = options.interactive === true || canPrompt;
  if (!shouldPrompt || !canPrompt) {
    throw new Error(formatLocalizedActionableError({
      failure: translator.t('ai.agent.error.no_prompt.failure', { role }),
      impact: translator.t('ai.agent.error.no_prompt.impact'),
      fix: translator.t('ai.agent.error.no_prompt.fix'),
      nextCommand: `npx create-quiver ai agent set ${role} --provider codex --model gpt-5.5`,
    }, options));
  }

  const promptOptions = {
    env: options.env,
    error: options.error,
    input: options.input,
    interactive: true,
    noColor: options.noColor,
    output: options.output,
    prompts: options.prompts,
    promptSelect: options.promptSelect,
    promptText: options.promptText,
    stdinIsTTY: options.stdinIsTTY,
    stdoutIsTTY: options.stdoutIsTTY,
    stderrIsTTY: options.stderrIsTTY,
    write: options.write,
  };

  const existingProfiles = getAgentProfilesForRole(repoRoot, role);
  let next = { ...options, role };
  if (existingProfiles.length > 0 && !options.id && !options.defaultProfile) {
    const ux = createCommandUx(promptOptions);
    ux.summary(existingProfiles.map((profile) => ({
      label: profile.id,
      value: `${profile.provider} ${profile.model || translator.t('ai.agent.value.no_model')}${profile.default ? ` ${translator.t('ai.agent.value.default')}` : ''}`,
    })), {
      title: translator.t('ai.agent.prompt.existing_title', { role }),
    });

    const action = await selectOption(translator.t('ai.agent.prompt.existing_action', { role }), [
      { label: translator.t('ai.agent.prompt.action.update_current.label'), value: 'update-current', hint: translator.t('ai.agent.prompt.action.update_current.hint'), default: true },
      { label: translator.t('ai.agent.prompt.action.create_new.label'), value: 'create-new', hint: translator.t('ai.agent.prompt.action.create_new.hint') },
      { label: translator.t('ai.agent.prompt.action.change_default.label'), value: 'change-default', hint: translator.t('ai.agent.prompt.action.change_default.hint') },
      { label: translator.t('ai.agent.prompt.action.cancel.label'), value: 'cancel', hint: translator.t('ai.agent.prompt.action.cancel.hint') },
    ], {
      ...promptOptions,
      name: 'agent profile action',
      flag: '--id',
    });

    if (action.value === 'cancel') {
      throw new Error(formatError(translator.t('ai.agent.error.canceled')));
    }

    if (action.value === 'change-default') {
      const profile = await selectOption(translator.t('ai.agent.prompt.default_profile', { role }), existingProfiles.map((item) => ({
        label: resolveAgentProfileDisplayName(item),
        value: item.id,
        hint: `${item.provider} ${item.model || translator.t('ai.agent.value.no_model')}`,
        default: item.default === true,
        raw: item,
      })), {
        ...promptOptions,
        name: 'agent profile default',
        flag: '--id',
      });
      return {
        ...next,
        id: profile.raw.id,
        provider: profile.raw.provider,
        model: profile.raw.model,
        displayName: profile.raw.displayName,
        label: profile.raw.label,
        context: profile.raw.context,
        defaultProfile: true,
      };
    }

    if (action.value === 'update-current') {
      const current = existingProfiles.find((profile) => profile.default) || existingProfiles[0];
      next = {
        ...next,
        id: current.id,
        context: next.context || current.context,
        label: next.label || current.label,
      };
    }

    if (action.value === 'create-new') {
      const id = await promptText(translator.t('ai.agent.prompt.new_id', { role }), {
        ...promptOptions,
        name: 'agent profile id',
        flag: '--id',
        placeholder: `${role}-gpt-55`,
      });
      next.id = id;
      next.defaultProfile = options.defaultProfile === true;
    }
  }

  if (!next.provider) {
    const selectedProvider = await selectOption(translator.t('ai.agent.prompt.provider', { role }), buildAgentProviderChoices(repoRoot, options), {
      ...promptOptions,
      name: 'agent provider',
      flag: '--provider',
    });
    next.provider = selectedProvider.value;
  }

  if (!next.model) {
    const selectedModel = await selectOption(translator.t('ai.agent.prompt.model', { role }), buildAgentModelChoices(next.provider, role, options), {
      ...promptOptions,
      name: 'agent model',
      flag: '--model',
    });
    if (selectedModel.value === 'custom') {
      const model = await promptText(translator.t('ai.agent.prompt.custom_model', { provider: next.provider }), {
        ...promptOptions,
        name: 'agent model',
        flag: '--model',
        placeholder: `${next.provider}-model-id`,
      });
      const displayName = await promptText(translator.t('ai.agent.prompt.custom_model_display'), {
        ...promptOptions,
        name: 'agent model display name',
        flag: '--display-name',
        initialValue: model,
        required: false,
      });
      next.model = model;
      next.displayName = next.displayName || displayName || model;
    } else {
      next.model = selectedModel.value;
      next.displayName = next.displayName || selectedModel.raw.displayName;
    }
  }

  return {
    ...next,
    interactiveResolved: true,
  };
}

function formatAgentProfile(profile, options = {}) {
  const translator = createTranslator(options.language);
  const lines = [
    `${translator.t('ai.agent.field.id')}: ${profile.id || translator.t('ai.agent.value.default')}`,
    `${translator.t('ai.agent.field.role')}: ${profile.role}`,
    `${translator.t('ai.agent.field.provider')}: ${profile.provider}`,
    `${translator.t('ai.agent.field.model')}: ${profile.model || translator.t('ai.agent.value.not_set')}`,
    `${translator.t('ai.agent.field.label')}: ${profile.label || translator.t('ai.agent.value.not_set')}`,
    `${translator.t('ai.agent.field.display_name')}: ${resolveAgentProfileDisplayName(profile) || translator.t('ai.agent.value.not_set')}`,
    `${translator.t('ai.agent.field.default')}: ${profile.default === true ? translator.t('ai.agent.value.yes') : translator.t('ai.agent.value.no')}`,
    `${translator.t('ai.agent.field.context')}: ${profile.context || translator.t('ai.agent.value.not_set')}`,
    `${translator.t('ai.agent.field.updated')}: ${profile.updated_at}`,
  ];
  return `${lines.join('\n')}\n`;
}

function formatAgentProfileList(profiles, options = {}) {
  const translator = createTranslator(options.language);
  const lines = [translator.t('ai.agent.list.title')];
  for (const item of profiles) {
    if (!item.configured) {
      lines.push(`- ${item.role}: ${translator.t('ai.agent.list.not_configured')}`);
      continue;
    }
    const model = item.profile.model ? ` model=${item.profile.model}` : '';
    const label = item.profile.label ? ` label=${item.profile.label}` : '';
    const displayName = resolveAgentProfileDisplayName(item.profile);
    const alternatives = item.profiles.length > 1 ? ` ${translator.t('ai.agent.list.options')}=${item.profiles.length}` : '';
    lines.push(`- ${item.role}: provider=${item.profile.provider}${model}${label} ${translator.t('ai.agent.list.display_name')}=${displayName}${alternatives}`);
  }
  return `${lines.join('\n')}\n`;
}

function formatAgentProfileDryRun(repoRoot, result, options = {}) {
  const translator = createTranslator(options.language);
  const relativePath = path.relative(repoRoot, result.filePath).split(path.sep).join('/');
  const verb = result.action === 'update'
    ? translator.t('ai.agent.dry_run.verb_update')
    : translator.t('ai.agent.dry_run.verb_create');
  return [
    translator.t('ai.agent.dry_run.title'),
    `- ${translator.t('ai.agent.dry_run.writes')}: ${translator.t('ai.agent.value.none')}`,
    `- ${translator.t('ai.agent.dry_run.would', { verb, path: relativePath })}`,
    '',
    formatAgentProfile(result.profile, options).trimEnd(),
    '',
    translator.t('ai.agent.dry_run.no_secrets'),
    '',
  ].join('\n');
}

function agentDoctorSymbol(status) {
  if (status === 'error') return 'x';
  if (status === 'warning') return '!';
  return 'OK';
}

function formatAgentDoctorReport(report, options = {}) {
  const translator = createTranslator(options.language);
  const lines = [
    translator.t('ai.agent.doctor.title'),
    '',
    translator.t('ai.agent.doctor.checks'),
  ];

  if (report.checks.length === 0) {
    lines.push(`  ! ${translator.t('ai.agent.doctor.no_profiles')}`);
  }

  for (const check of report.checks) {
    const target = `${check.role}/${check.id}`;
    const model = check.model || translator.t('ai.agent.value.no_model');
    const provider = check.provider || translator.t('ai.agent.value.no_provider');
    const defaultText = check.default ? ` ${translator.t('ai.agent.value.default')}` : '';
    lines.push(`  ${agentDoctorSymbol(check.status)} ${target}: provider=${provider} model=${model}${defaultText}`);
    for (const finding of check.findings.filter((item) => item.severity !== 'info')) {
      lines.push(`    - ${finding.severity}: ${finding.message}`);
    }
  }

  lines.push('', translator.t('ai.agent.doctor.suggested_fixes'));
  if (report.suggestedFixes.length === 0) {
    lines.push(`  OK ${translator.t('ai.agent.doctor.no_fixes')}`);
  } else {
    for (const fix of report.suggestedFixes) {
      lines.push(`  - ${fix}`);
    }
  }
  lines.push('');
  lines.push(`${translator.t('ai.agent.doctor.summary')}: profiles=${report.summary.profiles} errors=${report.summary.errors} warnings=${report.summary.warnings} info=${report.summary.info}`);
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function formatAgentRepairPlan(plan, options = {}) {
  const translator = createTranslator(options.language);
  const lines = [
    translator.t('ai.agent.repair.title'),
    `- ${translator.t('ai.agent.dry_run.writes')}: ${translator.t('ai.agent.value.none')}`,
    '',
    translator.t('ai.agent.repair.proposed_changes'),
  ];

  if (plan.changes.length === 0) {
    lines.push(`  OK ${translator.t('ai.agent.repair.no_repairs')}`);
  }

  for (const change of plan.changes) {
    lines.push(`  - ${change.role}/${change.profileId}: ${change.reason}`);
    lines.push(`    ${translator.t('ai.agent.repair.before')}: model=${change.before.model || translator.t('ai.agent.value.not_set')} displayName=${change.before.displayName || translator.t('ai.agent.value.not_set')}`);
    lines.push(`    ${translator.t('ai.agent.repair.after')}: model=${change.after.model || translator.t('ai.agent.value.not_set')} displayName=${change.after.displayName || translator.t('ai.agent.value.not_set')}`);
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}

function buildModelsListReport(options = {}) {
  const translator = createTranslator(options.language);
  const providerFilter = String(options.provider || '').trim().toLowerCase();
  const providers = providerFilter
    ? [listCatalogProviders().find((provider) => provider.id === providerFilter)].filter(Boolean)
    : listCatalogProviders();

  if (providerFilter && providers.length === 0) {
    throw new Error(formatError(translator.t('ai.models.error.unsupported_provider_filter', {
      provider: options.provider,
      providers: listCatalogProviders().map((provider) => provider.id).join(', '),
    })));
  }

  return {
    catalogVersion: MODEL_CATALOG_VERSION,
    lastUpdated: MODEL_CATALOG_LAST_UPDATED,
    note: 'Models are known by Quiver. This does not guarantee provider account access.',
    providers: providers.map((provider) => ({
      id: provider.id,
      displayName: provider.displayName,
      models: getKnownModelsForProvider(provider.id).map((model) => ({
        id: model.id,
        displayName: model.displayName,
        recommendedFor: model.recommendedFor,
        costTier: model.costTier,
        qualityTier: model.qualityTier,
        stability: model.stability,
        custom: model.custom === true,
      })),
    })),
  };
}

function formatModelsListReport(report, options = {}) {
  const translator = createTranslator(options.language);
  const lines = [
    translator.t('ai.models.title'),
    `${translator.t('ai.models.catalog_version')}: ${report.catalogVersion}`,
    `${translator.t('ai.models.last_updated')}: ${report.lastUpdated}`,
    `${translator.t('ai.models.note')}`,
    '',
  ];

  for (const provider of report.providers) {
    lines.push(`${provider.displayName} (${provider.id})`);
    for (const model of provider.models) {
      const roles = model.recommendedFor.length > 0 ? model.recommendedFor.join(', ') : translator.t('ai.models.roles.custom_manual');
      lines.push(`  - ${model.id} (${model.displayName})`);
      lines.push(`    ${translator.t('ai.models.roles')}: ${roles}`);
      lines.push(`    cost=${model.costTier} quality=${model.qualityTier} stability=${model.stability}`);
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function runModelsList(options = {}) {
  const report = buildModelsListReport({
    language: options.language,
    provider: options.provider,
  });
  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(formatModelsListReport(report, options));
  }
  return {
    task: 'models',
    command: 'list',
    report,
  };
}

async function runAgent(repoRoot, options = {}) {
  const translator = createTranslator(options.language);
  const command = String(options.command || '').trim().toLowerCase();

  if (command === 'set') {
    if (!options.role) {
      throw new Error(formatError(translator.t('ai.agent.error.missing_set_role')));
    }
    const profileOptions = await resolveInteractiveAgentSetOptions(repoRoot, options);
    if (options.dryRun) {
      const preview = buildAgentProfileState(repoRoot, profileOptions.role, {
        context: profileOptions.context,
        default: profileOptions.defaultProfile,
        displayName: profileOptions.displayName,
        id: profileOptions.id,
        label: profileOptions.label,
        model: profileOptions.model,
        provider: profileOptions.provider,
      });
      process.stdout.write(formatAgentProfileDryRun(repoRoot, preview, options));
      return {
        task: 'agent',
        command,
        dryRun: true,
        profile: preview.profile,
        filePath: path.relative(repoRoot, preview.filePath).split(path.sep).join('/'),
      };
    }
    if (profileOptions.interactiveResolved === true) {
      const preview = buildAgentProfileState(repoRoot, profileOptions.role, {
        context: profileOptions.context,
        default: profileOptions.defaultProfile,
        displayName: profileOptions.displayName,
        id: profileOptions.id,
        label: profileOptions.label,
        model: profileOptions.model,
        provider: profileOptions.provider,
      });
      const ux = createCommandUx(profileOptions);
      ux.summary([
        { label: translator.t('ai.agent.field.role'), value: preview.profile.role },
        { label: translator.t('ai.agent.field.provider'), value: preview.profile.provider },
        { label: translator.t('ai.agent.field.model'), value: preview.profile.model || translator.t('ai.agent.value.not_set') },
        { label: translator.t('ai.agent.field.display_name'), value: resolveAgentProfileDisplayName(preview.profile) || translator.t('ai.agent.value.not_set') },
        { label: translator.t('ai.agent.field.default'), value: preview.profile.default === true ? translator.t('ai.agent.value.yes') : translator.t('ai.agent.value.no') },
      ], {
        title: translator.t('ai.agent.profile_to_save.title'),
      });
    }
    const result = setAgentProfile(repoRoot, profileOptions.role, {
      context: profileOptions.context,
      default: profileOptions.defaultProfile,
      displayName: profileOptions.displayName,
      id: profileOptions.id,
      label: profileOptions.label,
      model: profileOptions.model,
      provider: profileOptions.provider,
    });
    process.stdout.write(`${translator.t('ai.agent.saved.title')}\n`);
    process.stdout.write(formatAgentProfile(result.profile, options));
    process.stdout.write(`${translator.t('ai.agent.field.state')}: ${path.relative(repoRoot, result.filePath).split(path.sep).join('/')}\n`);
    return {
      task: 'agent',
      command,
      profile: result.profile,
      filePath: path.relative(repoRoot, result.filePath).split(path.sep).join('/'),
    };
  }

  if (command === 'show') {
    if (!options.role) {
      throw new Error(formatError(translator.t('ai.agent.error.missing_show_role')));
    }
    const profile = options.id
      ? getAgentProfileById(repoRoot, options.role, options.id)
      : getAgentProfile(repoRoot, options.role);
    if (!profile) {
      throw new Error(formatLocalizedActionableError({
        failure: options.id
          ? translator.t('ai.agent.error.missing_profile_id.failure', { role: options.role, id: options.id })
          : translator.t('ai.agent.error.missing_profile.failure', { role: options.role }),
        impact: translator.t('ai.agent.error.missing_profile.impact'),
        fix: translator.t('ai.agent.error.missing_profile.fix', { role: options.role }),
        nextCommand: `npx create-quiver ai agent set ${options.role} --provider <provider> --model <model-id>`,
      }, options));
    }
    process.stdout.write(formatAgentProfile(profile, options));
    return {
      task: 'agent',
      command,
      profile,
    };
  }

  if (command === 'list' || command === 'ls' || command === '') {
    const profiles = listAgentProfiles(repoRoot);
    process.stdout.write(formatAgentProfileList(profiles, options));
    process.stdout.write(`${translator.t('ai.agent.field.state')}: ${path.relative(repoRoot, agentProfilesPath(repoRoot)).split(path.sep).join('/')}\n`);
    return {
      task: 'agent',
      command: 'list',
      profiles,
    };
  }

  if (command === 'doctor') {
    const report = buildAgentProfileDoctorReport(repoRoot);
    if (options.json) {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    } else {
      process.stdout.write(formatAgentDoctorReport(report, options));
    }
    if (report.summary.errors > 0) {
      process.exitCode = 1;
    }
    return {
      task: 'agent',
      command,
      report,
    };
  }

  if (command === 'repair') {
    if (options.dryRun !== true) {
      throw new Error(formatError(translator.t('ai.agent.error.repair_requires_dry_run')));
    }
    const plan = buildAgentProfileRepairPlan(repoRoot, {
      includeState: options.json === true,
    });
    if (options.json) {
      process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
    } else {
      process.stdout.write(formatAgentRepairPlan(plan, options));
    }
    return {
      task: 'agent',
      command,
      dryRun: true,
      plan,
    };
  }

  throw new Error(formatError(translator.t('ai.agent.error.unsupported_subcommand', { command })));
}

async function runGitHubTask(repoRoot, options = {}, mode = 'pr') {
  const dryRun = options.dryRun === true;
  let report;

  try {
    report = await (options.preflightFn || preflightGitHubPr)(repoRoot, {
      remote: options.remote,
      sshHostAlias: options.sshHostAlias,
      identityFile: options.identityFile,
      gitFlowGuidePath: options.gitFlowGuidePath,
      ghCommand: options.ghCommand,
      ghProbe: options.ghProbe,
      ghAuthProbe: options.ghAuthProbe,
      ghProbeArgs: options.ghProbeArgs,
      ghAuthArgs: options.ghAuthArgs,
      blockedBranches: options.blockedBranches,
    });
  } catch (error) {
    throw annotateGitHubError(error, mode);
  }

  process.stdout.write(formatPreflightReport(report, { mode, dryRun, language: options.language }));

  return {
    task: mode,
    dryRun,
    preflight: report,
  };
}

async function runPr(repoRoot, options = {}) {
  const dryRun = options.dryRun === true;
  const create = options.create === true;
  const translator = createTranslator(options.language);
  const ux = createCommandUx(options);
  const showProgress = create && !dryRun && shouldShowHumanProgress(ux, options);
  if (showProgress) {
    ux.heading(translator.t('ai.github.progress.heading'));
  }
  let preflight;

  try {
    preflight = await runProviderWithProgress({
      ux,
      enabled: showProgress,
      message: translator.t('ai.github.progress.preflight.running'),
      successMessage: translator.t('ai.github.progress.preflight.done'),
      failureMessage: translator.t('ai.github.progress.preflight.failed'),
      run: () => (options.preflightFn || preflightGitHubPr)(repoRoot, {
        remote: options.remote,
        sshHostAlias: options.sshHostAlias,
        identityFile: options.identityFile,
        gitFlowGuidePath: options.gitFlowGuidePath,
        ghCommand: options.ghCommand,
        ghProbe: options.ghProbe,
        ghAuthProbe: options.ghAuthProbe,
        ghProbeArgs: options.ghProbeArgs,
        ghAuthArgs: options.ghAuthArgs,
        blockedBranches: options.blockedBranches,
      }),
    });
  } catch (error) {
    throw annotateGitHubError(error, 'pr');
  }

  let plan;
  try {
    plan = buildPrCreatePlan(repoRoot, preflight, {
      baseBranch: options.baseBranch,
      ghCommand: options.ghCommand,
      input: options.input,
      prBodyPath: options.prBodyPath,
      title: options.title,
    });
    if (showProgress) {
      ux.check(translator.t('ai.github.progress.body_ready'));
    }
  } catch (error) {
    throw annotateGitHubError(error, 'pr');
  }

  if (options.review === true) {
    const hasEditorRunner = typeof options.openEditorFn === 'function';
    const canOpenEditor = hasEditorRunner || options.stdinIsTTY === true || (options.stdinIsTTY !== false && Boolean(process.stdin.isTTY));
    if (!canOpenEditor) {
      throw annotateGitHubError(makeReviewError('ai pr --review requires an interactive terminal or an injected editor runner.', plan.prBodyPath), 'pr');
    }
    const editorResult = hasEditorRunner
      ? options.openEditorFn(plan.prBodyPath, { cwd: repoRoot, env: options.env || process.env })
      : openEditor(plan.prBodyPath, { cwd: repoRoot, env: options.env || process.env });
    if (!editorResult || editorResult.ok !== true) {
      throw annotateGitHubError(makeReviewError(editorResult?.reason || 'ai pr review was canceled.', plan.prBodyPath), 'pr');
    }
    try {
      plan = buildPrCreatePlan(repoRoot, preflight, {
        baseBranch: options.baseBranch,
        ghCommand: options.ghCommand,
        input: options.input,
        prBodyPath: options.prBodyPath,
        title: options.title,
      });
    } catch (error) {
      throw annotateGitHubError(error, 'pr');
    }
  }

  if (dryRun || !create) {
    process.stdout.write(formatPrCreateReport({ preflight, plan }, { dryRun, create, language: options.language }));
    return {
      task: 'pr',
      dryRun,
      create,
      preflight,
      plan,
    };
  }

  await confirmInteractiveAction(`Create GitHub PR '${plan.title}'?`, options);

  let result;
  try {
    result = await runProviderWithProgress({
      ux,
      enabled: showProgress,
      message: translator.t('ai.github.progress.create.running'),
      successMessage: translator.t('ai.github.progress.create.done'),
      failureMessage: translator.t('ai.github.progress.create.failed'),
      run: () => runGhPrCreate(plan, {
        ghCreateRunner: options.ghCreateRunner,
      }),
    });
  } catch (error) {
    throw annotateGitHubError(error, 'pr');
  }

  process.stdout.write(formatPrCreateReport({ preflight, plan, result }, { dryRun: false, create: true, language: options.language }));
  return {
    task: 'pr',
    dryRun: false,
    create: true,
    preflight,
    plan,
    result,
  };
}

async function runDoctor(repoRoot, options = {}) {
  return runGitHubTask(repoRoot, options, 'doctor');
}

module.exports = {
  DEFAULT_ONBOARD_CONTEXT,
  DEFAULT_ONBOARD_PROVIDER,
  DEFAULT_ONBOARD_ROLE,
  DEFAULT_PLAN_CONTEXT,
  DEFAULT_PLAN_PHASE,
  DEFAULT_PLAN_PROVIDER,
  DEFAULT_PLAN_ROLE,
  PlannerPhaseError,
  annotateProviderError,
  buildOnboardContext,
  buildPlanContext,
  formatDryRunReport,
  formatSpecGenerationResult,
  formatSpecDryRunReport,
  normalizeTimeout,
  readTextFile,
  resolveInteractiveAgentSetOptions,
  runAgent,
  runActiveSlice,
  runAnalyzeProject,
  runDoctor,
  runExecutePlan,
  runExecuteSlice,
  runExtendReviewBudget,
  runLifecycleResume,
  runLifecycleRun,
  runLifecycleStatus,
  runModelsList,
  runExport,
  runInspect,
  runPromptSlice,
  runApprove,
  runApprovalRecord,
  runApprovalStatus,
  runPrepareContext,
  runRepairPlan,
  runReviewPlan,
  runRevise,
  runPr,
  runSlicesList,
  runSpecsList,
  runTraceReport,
  runOnboard,
  runPlan,
  writeProviderOutput,
};
