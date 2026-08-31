const crypto = require('node:crypto');
const { z } = require('zod');
const { containsSensitiveText, isCredentialStructuredKey } = require('./artifacts');

const GOVERNANCE_SCHEMA_VERSION = 1;
const PLAN_REVIEW_SCHEMA_VERSION = 2;
const PLAN_REVIEW_KIND = 'quiver-plan-review';
const GOVERNANCE_RECORD_SCHEMA_VERSION = 1;

const MINIMUM_SENSITIVE_CATEGORIES = Object.freeze([
  'auth',
  'authentication',
  'rls',
  'roles',
  'billing',
  'secrets',
  'destructive-migrations',
  'data-deletion',
  'production-infrastructure',
  'sensitive-multi-tenant-changes',
]);

const EXECUTION_PROFILES = Object.freeze([
  'fast-delivery',
  'high-assurance',
]);

const FINDING_SEVERITIES = Object.freeze([
  'critical',
  'high',
  'medium',
  'low',
  'info',
]);

const FINDING_CATEGORIES = Object.freeze([
  'security',
  'data-integrity',
  'rollout',
  'architecture',
  'business-rule',
  'implementation-detail',
  'testing',
  'evidence',
  'operations',
  'tooling',
  'follow-up',
  'optional-hardening',
]);

const PHASE_OWNERS = Object.freeze([
  'requirement',
  'acceptance',
  'technical-plan',
  'spec',
  'slice',
  'pr-review',
  'release',
  'follow-up',
]);

const RECOMMENDED_DISPOSITIONS = Object.freeze([
  'revise-requirement',
  'revise-acceptance',
  'revise-plan',
  'transfer-to-spec',
  'transfer-to-slice',
  'transfer-to-pr',
  'create-follow-up',
  'accept-risk',
  'optional',
]);

const GOVERNANCE_ACTIONS = Object.freeze([
  'approve',
  'approve-with-conditions',
  'accept-risk',
  'transfer-blocker',
  'extend-review-budget',
]);

const INDEPENDENCE_RULES = Object.freeze([
  'none',
  'different-from-run-creator',
  'different-from-reviewer',
  'different-from-executor',
]);

const REVIEW_EVENT_CLASSES = Object.freeze([
  'full',
  'targeted',
  'retry',
  'external',
]);

const PLAN_REVIEW_RECOMMENDATIONS = Object.freeze([
  'approve',
  'approve-with-risk',
  'revise',
]);

const DECISION_KINDS = Object.freeze([
  'approved',
  'approved-with-conditions',
  'rejected',
]);

const CONDITION_DISPOSITION_STATES = Object.freeze([
  'current',
  'superseded',
]);

const CONDITION_ELIGIBILITY_CODES = Object.freeze([
  'PROTECTED_CRITICAL_REQUIRES_BREAK_GLASS',
  'DISPOSITION_STALE',
  'DISPOSITION_DUPLICATE',
  'DISPOSITION_MISSING',
  'DISPOSITION_UNAUTHORIZED',
  'NON_TRANSFERABLE_BLOCKER',
  'CURRENT_PHASE_REVISION_REQUIRED',
  'DISPOSITION_UNRESOLVED',
  'ELIGIBLE_WITH_CONDITIONS',
]);

const CONDITION_ELIGIBILITY_STATUSES = Object.freeze([
  'BREAK_GLASS_REQUIRED',
  'INELIGIBLE',
  'ELIGIBLE',
]);

const GOVERNANCE_WRITER_MODES = Object.freeze([
  'read-write',
  'read-only',
]);

const executionProfileSchema = z.enum(EXECUTION_PROFILES);
const findingSeveritySchema = z.enum(FINDING_SEVERITIES);
const findingCategorySchema = z.enum(FINDING_CATEGORIES);
const phaseOwnerSchema = z.enum(PHASE_OWNERS);
const recommendedDispositionSchema = z.enum(RECOMMENDED_DISPOSITIONS);
const governanceActionSchema = z.enum(GOVERNANCE_ACTIONS);
const independenceRuleSchema = z.enum(INDEPENDENCE_RULES);
const reviewEventClassSchema = z.enum(REVIEW_EVENT_CLASSES);
const planReviewRecommendationSchema = z.enum(PLAN_REVIEW_RECOMMENDATIONS);
const decisionKindSchema = z.enum(DECISION_KINDS);
const conditionDispositionStateSchema = z.enum(CONDITION_DISPOSITION_STATES);
const conditionEligibilityCodeSchema = z.enum(CONDITION_ELIGIBILITY_CODES);
const conditionEligibilityStatusSchema = z.enum(CONDITION_ELIGIBILITY_STATUSES);
const governanceWriterModeSchema = z.enum(GOVERNANCE_WRITER_MODES);

const nonEmptyStringSchema = z.string().trim().min(1);
const identifierSchema = nonEmptyStringSchema.max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/, 'invalid identifier');
const canonicalFindingIdSchema = z.string().trim().regex(/^F-\d{3,}$/, 'invalid canonical finding id');
const evidenceLocationSchema = nonEmptyStringSchema.max(2_000);
const acceptanceReferenceSchema = nonEmptyStringSchema.max(200);
const sha256DigestSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const timestampSchema = z.string().datetime();
const packageSemverSchema = z.string().regex(
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/,
  'invalid package semver',
);
const repositoryRelativePathSchema = nonEmptyStringSchema.max(2_000).superRefine((value, context) => {
  const segments = value.split('/');
  if (value.includes('\\')
      || value.startsWith('/')
      || /^[A-Za-z]:/.test(value)
      || segments.some((segment) => segment === '.' || segment === '..' || segment.length === 0)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'path must be a normalized repository-relative POSIX path',
    });
  }
});

const criterionBindingSchema = z.object({
  acceptance_ref: acceptanceReferenceSchema,
  content: z.string().min(1).max(8_000).refine((value) => value.trim().length > 0, {
    message: 'criterion content must not be blank',
  }),
  source_path: repositoryRelativePathSchema,
  criterion_sha256: sha256DigestSchema,
}).strict().superRefine((binding, context) => {
  if (containsSensitiveText(binding.content) || containsSensitiveText(binding.source_path)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'criterion binding must be redacted before persistence',
    });
  }
  const expected = `sha256:${crypto.createHash('sha256').update(binding.content, 'utf8').digest('hex')}`;
  if (binding.criterion_sha256 !== expected) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['criterion_sha256'],
      message: 'criterion_sha256 must match the persisted criterion content',
    });
  }
});

function addUniqueArrayIssue(value, context, path, label) {
  if (new Set(value).size !== value.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path,
      message: `${label} must not contain duplicates`,
    });
  }
}

const providerFindingSchema = z.object({
  id: identifierSchema,
  canonical_id: canonicalFindingIdSchema.optional(),
  supersedes: canonicalFindingIdSchema.optional(),
  title: nonEmptyStringSchema.max(1_000),
  summary: nonEmptyStringSchema.max(8_000),
  severity: findingSeveritySchema,
  category: findingCategorySchema,
  phase_owner: phaseOwnerSchema,
  phase_blocking: z.boolean(),
  blocking_justification: nonEmptyStringSchema.max(8_000).optional(),
  evidence: z.array(evidenceLocationSchema).min(1),
  acceptance_refs: z.array(acceptanceReferenceSchema).min(1),
  recommended_disposition: recommendedDispositionSchema,
  confidence: nonEmptyStringSchema.max(200),
}).strict().superRefine((finding, context) => {
  if (finding.phase_blocking === true && !finding.blocking_justification) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['blocking_justification'],
      message: 'blocking_justification is required when phase_blocking is true',
    });
  }
  if (finding.phase_blocking === true && ['create-follow-up', 'optional'].includes(finding.recommended_disposition)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['recommended_disposition'],
      message: 'a phase-blocking finding cannot be classified as follow-up or optional hardening',
    });
  }
  if (finding.canonical_id && finding.supersedes && finding.canonical_id === finding.supersedes) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['supersedes'],
      message: 'supersedes must not equal canonical_id',
    });
  }
  addUniqueArrayIssue(finding.evidence, context, ['evidence'], 'evidence');
  addUniqueArrayIssue(finding.acceptance_refs, context, ['acceptance_refs'], 'acceptance_refs');
});

const findingReferenceListSchema = z.array(identifierSchema);

const providerReviewBodySchema = z.object({
  recommendation: planReviewRecommendationSchema,
  blocking: z.boolean(),
  findings: z.array(providerFindingSchema),
  plan_required_fixes: findingReferenceListSchema,
  slice_required_fixes: findingReferenceListSchema,
  pr_required_fixes: findingReferenceListSchema,
  follow_ups: findingReferenceListSchema,
  optional_hardening: findingReferenceListSchema,
}).strict().superRefine((review, context) => {
  const findingIds = review.findings.map((finding) => finding.id);
  addUniqueArrayIssue(findingIds, context, ['findings'], 'finding ids');

  for (const field of [
    'plan_required_fixes',
    'slice_required_fixes',
    'pr_required_fixes',
    'follow_ups',
    'optional_hardening',
  ]) {
    addUniqueArrayIssue(review[field], context, [field], field);
    for (const [index, reference] of review[field].entries()) {
      if (!findingIds.includes(reference)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field, index],
          message: `unknown provider finding reference '${reference}'`,
        });
      }
    }
  }
});

const providerReviewSchema = z.object({
  schema_version: z.literal(PLAN_REVIEW_SCHEMA_VERSION),
  kind: z.literal(PLAN_REVIEW_KIND),
  review: providerReviewBodySchema,
}).strict();

const authorizationBindingSchema = z.object({
  actor_id: nonEmptyStringSchema.max(300).optional(),
  roles: z.array(nonEmptyStringSchema.max(200)).default([]),
}).passthrough();

const authorizationRuleSchema = z.object({
  allowed_actor_ids: z.array(nonEmptyStringSchema.max(300)).default([]),
  allowed_roles: z.array(nonEmptyStringSchema.max(200)).default([]),
  independence: independenceRuleSchema,
}).passthrough();

const authorizationPolicySchema = z.object({
  default_effect: z.literal('deny'),
  actor_bindings: z.record(authorizationBindingSchema).default({}),
  actions: z.record(authorizationRuleSchema).default({}),
}).passthrough();

const phaseReviewPolicySchema = z.object({
  blocking_categories: z.array(findingCategorySchema),
  non_blocking_categories: z.array(findingCategorySchema).default([]),
}).passthrough();

const conditionDispositionRuleSchema = z.object({
  rule_id: identifierSchema,
  phase_owners: z.array(phaseOwnerSchema).min(1),
  categories: z.array(findingCategorySchema).min(1),
  severities: z.array(findingSeveritySchema).min(1),
  allowed_dispositions: z.array(recommendedDispositionSchema).min(1),
}).passthrough().superRefine((rule, context) => {
  addUniqueArrayIssue(rule.phase_owners, context, ['phase_owners'], 'phase_owners');
  addUniqueArrayIssue(rule.categories, context, ['categories'], 'categories');
  addUniqueArrayIssue(rule.severities, context, ['severities'], 'severities');
  addUniqueArrayIssue(rule.allowed_dispositions, context, ['allowed_dispositions'], 'allowed_dispositions');
});

const conditionDispositionPolicySchema = z.object({
  default_effect: z.literal('deny'),
  rules: z.array(conditionDispositionRuleSchema).default([]),
}).passthrough().superRefine((policy, context) => {
  addUniqueArrayIssue(policy.rules.map((rule) => rule.rule_id), context, ['rules'], 'condition disposition rule IDs');
});

const boundedCountSchema = (maximum, minimum = 0) => z.number().int().min(minimum).max(maximum);

const fastDeliveryProfileSchema = z.object({
  acceptance: z.object({
    human_approval: z.enum(['optional', 'required']),
    max_revisions: boundedCountSchema(1),
  }).passthrough(),
  technical_plan: z.object({
    required: z.literal(true),
    detail_level: z.literal('brief'),
    max_reviews: boundedCountSchema(1),
    max_full_revisions: boundedCountSchema(1),
  }).passthrough(),
  spec: z.object({
    required: z.literal(true),
  }).passthrough(),
  execution: z.object({
    independent_pr_review: z.literal(true),
    workspace_isolation: z.literal(true),
    per_run_budget: z.literal(true),
  }).passthrough(),
  release: z.object({
    human_merge: z.literal(true),
  }).passthrough(),
}).passthrough();

const highAssuranceProfileSchema = z.object({
  acceptance: z.object({
    human_approval: z.literal('required'),
    max_revisions: boundedCountSchema(2),
  }).passthrough(),
  technical_plan: z.object({
    required: z.literal(true),
    human_approval: z.literal('required'),
    independent_review: z.literal(true),
    max_reviews: boundedCountSchema(2, 1),
    max_full_revisions: boundedCountSchema(1),
    targeted_amendments_after_limit: z.literal(true),
  }).passthrough(),
  spec: z.object({
    required: z.literal(true),
  }).passthrough(),
  execution: z.object({
    review_each_slice: z.literal(true),
    security_review: z.literal(true),
    workspace_isolation: z.literal(true),
    permission_envelope: z.literal(true),
    per_run_budget: z.literal(true),
    verified_approval_actor: z.literal(true),
    independent_runtime_review: z.literal(true),
  }).passthrough(),
  release: z.object({
    human_merge: z.literal(true),
    human_release_approval: z.literal(true),
    same_artifact_identity: z.literal(true),
  }).passthrough(),
}).passthrough();

const governancePolicySchema = z.object({
  version: nonEmptyStringSchema.max(200),
  sensitive_categories: z.array(nonEmptyStringSchema.max(200)),
  profiles: z.object({
    'fast-delivery': fastDeliveryProfileSchema,
    'high-assurance': highAssuranceProfileSchema,
  }).passthrough(),
  review_policy: z.record(phaseReviewPolicySchema),
  condition_dispositions: conditionDispositionPolicySchema.default({
    default_effect: 'deny',
    rules: [],
  }),
  authorization: authorizationPolicySchema,
}).passthrough().superRefine((policy, context) => {
  const configured = new Set(policy.sensitive_categories.map((value) => String(value)
    .trim()
    .toLowerCase()
    .normalize('NFC')
    .replace(/[_\s]+/g, '-')
    .replace(/^-+|-+$/g, '')));
  for (const category of MINIMUM_SENSITIVE_CATEGORIES) {
    if (!configured.has(category)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sensitive_categories'],
        message: `mandatory sensitive category '${category}' cannot be removed`,
      });
    }
  }
});

function findSecretConfigPath(value, path = []) {
  if (typeof value === 'string') {
    return containsSensitiveText(value) ? path : null;
  }
  if (!value || typeof value !== 'object') {
    return null;
  }
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const found = findSecretConfigPath(item, path.concat(index));
      if (found) return found;
    }
    return null;
  }
  for (const [key, item] of Object.entries(value)) {
    if (isCredentialStructuredKey(key)) {
      return path.concat(key);
    }
    const found = findSecretConfigPath(item, path.concat(key));
    if (found) return found;
  }
  return null;
}

const governanceCompatibilitySchema = z.object({
  schema_version: z.literal(1),
  writer_mode: governanceWriterModeSchema,
  minimum_writer_version: packageSemverSchema,
}).strict();

const governanceConfigSchema = z.object({
  schema_version: z.literal(GOVERNANCE_SCHEMA_VERSION),
  compatibility: governanceCompatibilitySchema,
  requested_profile: executionProfileSchema,
  requirement_categories: z.array(nonEmptyStringSchema.max(200)).default([]),
  policy: governancePolicySchema,
}).passthrough().superRefine((governance, context) => {
  const secretPath = findSecretConfigPath(governance);
  if (secretPath) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: secretPath,
      message: 'governance configuration must not contain secrets',
    });
  }
});

const actorIdentitySchema = z.object({
  actor_id: nonEmptyStringSchema.max(300),
  provider: z.enum(['github-cli', 'local']),
  provider_subject: nonEmptyStringSchema.max(500).nullable().default(null),
  host: nonEmptyStringSchema.max(300).optional(),
  subject_id: nonEmptyStringSchema.max(300).optional(),
  login: nonEmptyStringSchema.max(300).optional(),
  roles: z.array(nonEmptyStringSchema.max(200)).default([]),
  verified: z.boolean(),
}).strict();

const authorizationEvidenceSchema = z.object({
  action: governanceActionSchema,
  policy_version: nonEmptyStringSchema.max(200),
  policy_digest: sha256DigestSchema,
  actor_id: nonEmptyStringSchema.max(300),
  provider_actor_id: nonEmptyStringSchema.max(300).optional(),
  provider_subject: nonEmptyStringSchema.max(500).nullable().optional(),
  verified: z.boolean(),
  binding: nonEmptyStringSchema.max(500),
  matched_actor_ids: z.array(nonEmptyStringSchema.max(300)).default([]),
  matched_roles: z.array(nonEmptyStringSchema.max(200)).default([]),
  independence: independenceRuleSchema,
  independence_result: z.literal('passed'),
  identity_label: z.literal('LOCAL_UNVERIFIED_IDENTITY').nullable().optional(),
}).strict();

const dispositionSchema = z.object({
  schema_version: z.literal(GOVERNANCE_RECORD_SCHEMA_VERSION),
  run_id: nonEmptyStringSchema.max(300),
  review_id: nonEmptyStringSchema.max(300),
  finding_id: canonicalFindingIdSchema,
  action: recommendedDispositionSchema,
  target: nonEmptyStringSchema.max(500).optional(),
  target_issue: nonEmptyStringSchema.max(500).optional(),
}).strict();

const proposedConditionDispositionSchema = z.object({
  finding_id: canonicalFindingIdSchema,
  action: recommendedDispositionSchema,
  target: nonEmptyStringSchema.max(500).optional(),
  target_issue: nonEmptyStringSchema.max(500).optional(),
  evidence_obligations: z.array(nonEmptyStringSchema.max(2_000)).default([]),
  criterion_binding: criterionBindingSchema.optional(),
  supersedes: identifierSchema.nullable().optional(),
}).strict();

const conditionDispositionEnvelopeSchema = z.object({
  schema_version: z.literal(GOVERNANCE_RECORD_SCHEMA_VERSION),
  run_id: nonEmptyStringSchema.max(300),
  review_id: nonEmptyStringSchema.max(300),
  policy_version: nonEmptyStringSchema.max(200),
  policy_digest: sha256DigestSchema,
  dispositions: z.array(proposedConditionDispositionSchema),
}).strict();

const canonicalDispositionSchema = z.object({
  schema_version: z.literal(GOVERNANCE_RECORD_SCHEMA_VERSION),
  disposition_id: identifierSchema,
  run_id: nonEmptyStringSchema.max(300),
  review_id: nonEmptyStringSchema.max(300),
  finding_id: canonicalFindingIdSchema,
  action: recommendedDispositionSchema,
  target: nonEmptyStringSchema.max(500).optional(),
  target_issue: nonEmptyStringSchema.max(500).optional(),
  evidence_obligations: z.array(nonEmptyStringSchema.max(2_000)).min(1),
  criterion_binding: criterionBindingSchema.optional(),
  state: conditionDispositionStateSchema,
  supersedes: identifierSchema.nullable().default(null),
  actor_id: nonEmptyStringSchema.max(300),
  authorization: authorizationEvidenceSchema,
  policy_version: nonEmptyStringSchema.max(200),
  policy_digest: sha256DigestSchema,
  recorded_at: timestampSchema,
}).strict().superRefine((disposition, context) => {
  addUniqueArrayIssue(
    disposition.evidence_obligations,
    context,
    ['evidence_obligations'],
    'evidence_obligations',
  );
  if (disposition.supersedes === disposition.disposition_id) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['supersedes'],
      message: 'a disposition cannot supersede itself',
    });
  }
  if (!['approve-with-conditions', 'transfer-blocker'].includes(disposition.authorization.action)
      || disposition.authorization.actor_id !== disposition.actor_id
      || disposition.authorization.policy_version !== disposition.policy_version
      || disposition.authorization.policy_digest !== disposition.policy_digest) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['authorization'],
      message: 'disposition authorization must match its actor and policy bindings',
    });
  }
  if (disposition.authorization.action === 'transfer-blocker'
      && ['transfer-to-spec', 'transfer-to-slice', 'transfer-to-pr'].includes(disposition.action)
      && !disposition.criterion_binding) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['criterion_binding'],
      message: 'transfer-blocker dispositions require a criterion binding',
    });
  }
});

const reviewEventSchema = z.object({
  schema_version: z.literal(GOVERNANCE_RECORD_SCHEMA_VERSION),
  run_id: nonEmptyStringSchema.max(300),
  event_class: reviewEventClassSchema,
}).strict();

const decisionSchema = z.object({
  schema_version: z.literal(GOVERNANCE_RECORD_SCHEMA_VERSION),
  run_id: nonEmptyStringSchema.max(300),
  review_id: nonEmptyStringSchema.max(300).nullable(),
  phase: phaseOwnerSchema,
  decision: decisionKindSchema,
  actor_id: nonEmptyStringSchema.max(300),
  policy_version: nonEmptyStringSchema.max(200),
  policy_digest: sha256DigestSchema,
  artifact_sha256: sha256DigestSchema,
  reason_sha256: sha256DigestSchema.nullable(),
  reason_path: repositoryRelativePathSchema.optional(),
  authorization: authorizationEvidenceSchema.optional(),
  disposition_ids: z.array(identifierSchema).optional(),
  reviewer_recommendation: planReviewRecommendationSchema.optional(),
  reviewer_approved: z.literal(false).optional(),
  recorded_at: timestampSchema,
}).strict().superRefine((decision, context) => {
  if (decision.decision !== 'approved-with-conditions') return;
  for (const field of ['reason_path', 'authorization', 'disposition_ids', 'reviewer_recommendation', 'reviewer_approved']) {
    if (typeof decision[field] === 'undefined') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: `${field} is required for approved-with-conditions`,
      });
    }
  }
  if (decision.reason_sha256 === null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['reason_sha256'],
      message: 'reason_sha256 is required for approved-with-conditions',
    });
  }
  if (Array.isArray(decision.disposition_ids) && decision.disposition_ids.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['disposition_ids'],
      message: 'approved-with-conditions requires at least one disposition',
    });
  }
  if (decision.authorization && (
    decision.authorization.action !== 'approve-with-conditions'
    || decision.authorization.actor_id !== decision.actor_id
    || decision.authorization.policy_version !== decision.policy_version
    || decision.authorization.policy_digest !== decision.policy_digest
  )) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['authorization'],
      message: 'conditioned decision authorization must match its actor and policy bindings',
    });
  }
  if (Array.isArray(decision.disposition_ids)) {
    addUniqueArrayIssue(decision.disposition_ids, context, ['disposition_ids'], 'disposition_ids');
  }
});

const approvalDecisionSchema = z.object({
  schema_version: z.literal(GOVERNANCE_RECORD_SCHEMA_VERSION),
  decision_id: z.string().regex(/^A-\d{3,}$/),
  run_id: nonEmptyStringSchema.max(300),
  review_id: nonEmptyStringSchema.max(300).nullable(),
  phase: z.enum(['acceptance', 'technical-plan']),
  decision: z.enum(['approved', 'approved-with-conditions']),
  publication_state: z.literal('final'),
  candidate_id: identifierSchema.nullable(),
  evaluation_id: identifierSchema.nullable(),
  version: z.number().int().positive(),
  artifact_path: repositoryRelativePathSchema,
  artifact_sha256: sha256DigestSchema,
  input_path: repositoryRelativePathSchema,
  input_sha256: sha256DigestSchema,
  review_sha256: sha256DigestSchema.nullable(),
  requested_profile: executionProfileSchema,
  effective_profile: executionProfileSchema,
  profile_sha256: sha256DigestSchema,
  policy_version: nonEmptyStringSchema.max(200),
  policy_digest: sha256DigestSchema,
  finding_count: z.number().int().nonnegative(),
  criterion_count: z.number().int().nonnegative(),
  disposition_ids: z.array(identifierSchema),
  disposition_sha256: sha256DigestSchema,
  reason_path: repositoryRelativePathSchema.nullable(),
  reason_sha256: sha256DigestSchema.nullable(),
  actor_id: nonEmptyStringSchema.max(300),
  authorization: authorizationEvidenceSchema,
  reviewer_recommendation: planReviewRecommendationSchema.nullable(),
  reviewer_approved: z.literal(false).nullable(),
  recorded_at: timestampSchema,
  decision_sha256: sha256DigestSchema,
}).strict().superRefine((decision, context) => {
  addUniqueArrayIssue(decision.disposition_ids, context, ['disposition_ids'], 'disposition_ids');
  const conditioned = decision.decision === 'approved-with-conditions';
  const expectedAction = conditioned ? 'approve-with-conditions' : 'approve';
  if (decision.authorization.action !== expectedAction
      || decision.authorization.actor_id !== decision.actor_id
      || decision.authorization.policy_version !== decision.policy_version
      || decision.authorization.policy_digest !== decision.policy_digest) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['authorization'],
      message: 'approval decision authorization must match its action, actor, and policy bindings',
    });
  }
  if (decision.phase === 'technical-plan' && (!decision.review_id || !decision.review_sha256 || !decision.reviewer_recommendation)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['review_id'],
      message: 'technical-plan approval requires current review bindings',
    });
  }
  if (!conditioned) {
    if (decision.candidate_id !== null
        || decision.evaluation_id !== null
        || decision.disposition_ids.length !== 0
        || decision.reason_path !== null
        || decision.reason_sha256 !== null
        || decision.reviewer_approved !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['decision'],
        message: 'unconditional approval cannot contain conditioned bindings',
      });
    }
    return;
  }
  if (!decision.candidate_id
      || !decision.evaluation_id
      || decision.disposition_ids.length === 0
      || !decision.reason_path
      || !decision.reason_sha256
      || decision.reviewer_approved !== false) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['decision'],
      message: 'conditioned approval requires candidate, evaluation, disposition, reason, and reviewer non-approval bindings',
    });
  }
});

const conditionEligibilityResultSchema = z.object({
  eligible: z.boolean(),
  status: conditionEligibilityStatusSchema,
  code: conditionEligibilityCodeSchema,
  finding_id: canonicalFindingIdSchema.nullable().default(null),
  disposition_id: identifierSchema.nullable().default(null),
  policy_rule_ids: z.array(identifierSchema).default([]),
  authorization_code: nonEmptyStringSchema.max(200).nullable().default(null),
}).strict().superRefine((result, context) => {
  const expectedStatus = result.code === 'ELIGIBLE_WITH_CONDITIONS'
    ? 'ELIGIBLE'
    : result.code === 'PROTECTED_CRITICAL_REQUIRES_BREAK_GLASS'
      ? 'BREAK_GLASS_REQUIRED'
      : 'INELIGIBLE';
  if (result.eligible !== (result.code === 'ELIGIBLE_WITH_CONDITIONS') || result.status !== expectedStatus) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['status'],
      message: 'eligible must agree with the eligibility status and code',
    });
  }
});

const conditionEvaluationSchema = z.object({
  schema_version: z.literal(GOVERNANCE_RECORD_SCHEMA_VERSION),
  evaluation_id: identifierSchema,
  run_id: nonEmptyStringSchema.max(300),
  review_id: nonEmptyStringSchema.max(300),
  actor_id: nonEmptyStringSchema.max(300).nullable(),
  policy_version: nonEmptyStringSchema.max(200),
  policy_digest: sha256DigestSchema,
  disposition_ids: z.array(identifierSchema),
  reason_path: repositoryRelativePathSchema.nullable(),
  reason_sha256: sha256DigestSchema.nullable(),
  result: conditionEligibilityResultSchema,
  evaluated_at: timestampSchema,
}).strict().superRefine((evaluation, context) => {
  addUniqueArrayIssue(evaluation.disposition_ids, context, ['disposition_ids'], 'disposition_ids');
});

const conditionedDecisionCandidateSchema = z.object({
  schema_version: z.literal(GOVERNANCE_RECORD_SCHEMA_VERSION),
  candidate_id: identifierSchema,
  evaluation_id: identifierSchema,
  run_id: nonEmptyStringSchema.max(300),
  review_id: nonEmptyStringSchema.max(300),
  phase: z.literal('technical-plan'),
  decision: z.literal('approved-with-conditions'),
  publication_state: z.literal('candidate'),
  actor_id: nonEmptyStringSchema.max(300),
  authorization: authorizationEvidenceSchema,
  policy_version: nonEmptyStringSchema.max(200),
  policy_digest: sha256DigestSchema,
  reason_path: repositoryRelativePathSchema,
  reason_sha256: sha256DigestSchema,
  disposition_ids: z.array(identifierSchema).min(1),
  reviewer_recommendation: planReviewRecommendationSchema,
  reviewer_approved: z.literal(false),
  recorded_at: timestampSchema,
}).strict().superRefine((candidate, context) => {
  addUniqueArrayIssue(candidate.disposition_ids, context, ['disposition_ids'], 'disposition_ids');
  if (candidate.authorization.action !== 'approve-with-conditions'
      || candidate.authorization.actor_id !== candidate.actor_id
      || candidate.authorization.policy_version !== candidate.policy_version
      || candidate.authorization.policy_digest !== candidate.policy_digest) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['authorization'],
      message: 'conditioned candidate authorization must match its actor and policy bindings',
    });
  }
});

const findingLifecycleEventSchema = z.discriminatedUnion('event', [
  z.object({
    event: z.enum(['created', 'created-as-supersession', 'reopened']),
    at: timestampSchema,
    review_id: nonEmptyStringSchema.max(300).nullable(),
    provider_finding_id: identifierSchema,
  }).strict(),
  z.object({
    event: z.literal('superseded-by'),
    at: timestampSchema,
    review_id: nonEmptyStringSchema.max(300).nullable(),
    successor_id: canonicalFindingIdSchema,
  }).strict(),
  z.object({
    event: z.literal('closed'),
    at: timestampSchema,
    review_id: nonEmptyStringSchema.max(300).nullable(),
    disposition_id: identifierSchema,
  }).strict(),
]);

const canonicalFindingSchema = z.object({
  finding_id: canonicalFindingIdSchema,
  run_id: nonEmptyStringSchema.max(300),
  origin_fingerprint: sha256DigestSchema,
  state: z.enum(['open', 'closed']),
  title: nonEmptyStringSchema.max(1_000),
  summary: nonEmptyStringSchema.max(8_000),
  severity: findingSeveritySchema,
  category: findingCategorySchema,
  phase_owner: phaseOwnerSchema,
  phase_blocking: z.boolean(),
  blocking_justification: nonEmptyStringSchema.max(8_000).optional(),
  evidence: z.array(evidenceLocationSchema).min(1),
  acceptance_refs: z.array(acceptanceReferenceSchema).min(1),
  recommended_disposition: recommendedDispositionSchema,
  confidence: nonEmptyStringSchema.max(200),
  supersedes: canonicalFindingIdSchema.nullable().default(null),
  origins: z.array(z.object({
    review_id: nonEmptyStringSchema.max(300).nullable().default(null),
    provider_finding_id: identifierSchema,
  }).strict()).default([]),
  lifecycle: z.array(findingLifecycleEventSchema).default([]),
}).strict().superRefine((finding, context) => {
  if (finding.phase_blocking === true && !finding.blocking_justification) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['blocking_justification'],
      message: 'blocking_justification is required when phase_blocking is true',
    });
  }
  addUniqueArrayIssue(finding.evidence, context, ['evidence'], 'evidence');
  addUniqueArrayIssue(finding.acceptance_refs, context, ['acceptance_refs'], 'acceptance_refs');
  if (finding.state === 'closed' && !finding.lifecycle.some((event) => event.event === 'closed')) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['lifecycle'],
      message: 'a closed finding requires an explicit disposition-backed closure event',
    });
  }
});

const canonicalFindingListSchema = z.array(canonicalFindingIdSchema);
const reviewProjectionSchema = z.object({
  blocking: z.boolean(),
  approval_recommendation: planReviewRecommendationSchema,
  required_fixes: canonicalFindingListSchema,
  plan_required_fixes: canonicalFindingListSchema,
  slice_required_fixes: canonicalFindingListSchema,
  pr_required_fixes: canonicalFindingListSchema,
  follow_ups: canonicalFindingListSchema,
  optional_hardening: canonicalFindingListSchema,
  current_blockers: canonicalFindingListSchema,
  later_phase_transfers: canonicalFindingListSchema,
}).strict();

const canonicalReviewSchema = z.object({
  schema_version: z.literal(GOVERNANCE_RECORD_SCHEMA_VERSION),
  review_id: z.string().regex(/^R-\d{3,}$/),
  run_id: nonEmptyStringSchema.max(300),
  source_file: z.string().max(2_000),
  source_kind: nonEmptyStringSchema.max(200).nullable(),
  source_version: z.number().int().positive().nullable(),
  raw_artifact_path: nonEmptyStringSchema.max(2_000).nullable(),
  output_source: nonEmptyStringSchema.max(200).nullable(),
  provider_finding_ids: z.array(identifierSchema),
  finding_ids: canonicalFindingListSchema,
  requested_profile: executionProfileSchema,
  effective_profile: executionProfileSchema,
  policy_version: nonEmptyStringSchema.max(200),
  policy_digest: sha256DigestSchema,
  provider_recommendation: planReviewRecommendationSchema,
  provider_blocking: z.boolean(),
  projection: reviewProjectionSchema,
  reviewed_at: timestampSchema,
}).strict();

const runGovernanceStateSchema = z.object({
  schema_version: z.literal(GOVERNANCE_RECORD_SCHEMA_VERSION),
  run_id: nonEmptyStringSchema.max(300),
  next_finding_number: z.number().int().positive(),
  current_review_id: z.string().regex(/^R-\d{3,}$/).nullable(),
  reviews: z.array(canonicalReviewSchema),
  findings: z.array(canonicalFindingSchema),
  dispositions: z.array(canonicalDispositionSchema).default([]),
  condition_evaluations: z.array(conditionEvaluationSchema).default([]),
  conditioned_candidates: z.array(conditionedDecisionCandidateSchema).default([]),
  decisions: z.array(approvalDecisionSchema).optional(),
  updated_at: timestampSchema.optional(),
}).strict().superRefine((state, context) => {
  const reviewIds = state.reviews.map((review) => review.review_id);
  const findingIds = state.findings.map((finding) => finding.finding_id);
  const dispositionIds = state.dispositions.map((disposition) => disposition.disposition_id);
  const evaluationIds = state.condition_evaluations.map((evaluation) => evaluation.evaluation_id);
  const candidateIds = state.conditioned_candidates.map((candidate) => candidate.candidate_id);
  const decisionIds = (state.decisions || []).map((decision) => decision.decision_id);
  addUniqueArrayIssue(reviewIds, context, ['reviews'], 'review IDs');
  addUniqueArrayIssue(findingIds, context, ['findings'], 'finding IDs');
  addUniqueArrayIssue(dispositionIds, context, ['dispositions'], 'disposition IDs');
  addUniqueArrayIssue(evaluationIds, context, ['condition_evaluations'], 'condition evaluation IDs');
  addUniqueArrayIssue(candidateIds, context, ['conditioned_candidates'], 'conditioned candidate IDs');
  addUniqueArrayIssue(decisionIds, context, ['decisions'], 'approval decision IDs');
  for (const [index, review] of state.reviews.entries()) {
    if (review.run_id !== state.run_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reviews', index, 'run_id'],
        message: 'review belongs to a different run',
      });
    }
  }
  for (const [index, finding] of state.findings.entries()) {
    if (finding.run_id !== state.run_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['findings', index, 'run_id'],
        message: 'finding belongs to a different run',
      });
    }
  }
  const dispositionById = new Map(state.dispositions.map((disposition) => [disposition.disposition_id, disposition]));
  const reviewById = new Map(state.reviews.map((review) => [review.review_id, review]));
  const currentByFinding = new Map();
  for (const [index, disposition] of state.dispositions.entries()) {
    if (disposition.run_id !== state.run_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dispositions', index, 'run_id'],
        message: 'disposition belongs to a different run',
      });
    }
    if (!findingIds.includes(disposition.finding_id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dispositions', index, 'finding_id'],
        message: 'disposition references an unknown finding',
      });
    }
    if (!reviewIds.includes(disposition.review_id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dispositions', index, 'review_id'],
        message: 'disposition references an unknown review',
      });
    }
    const dispositionReview = reviewById.get(disposition.review_id);
    if (dispositionReview && (
      dispositionReview.policy_version !== disposition.policy_version
      || dispositionReview.policy_digest !== disposition.policy_digest
    )) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dispositions', index],
        message: 'disposition policy does not match its review',
      });
    }
    if (disposition.state === 'current') {
      const priorIndex = currentByFinding.get(disposition.finding_id);
      if (typeof priorIndex === 'number') {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dispositions', index, 'state'],
          message: `finding '${disposition.finding_id}' has more than one current disposition`,
        });
      } else {
        currentByFinding.set(disposition.finding_id, index);
      }
    }
    if (disposition.supersedes) {
      const prior = dispositionById.get(disposition.supersedes);
      const priorIndex = state.dispositions.findIndex((candidate) => (
        candidate.disposition_id === disposition.supersedes
      ));
      if (!prior
          || prior.disposition_id === disposition.disposition_id
          || prior.finding_id !== disposition.finding_id
          || prior.state !== 'superseded'
          || priorIndex >= index) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dispositions', index, 'supersedes'],
          message: 'supersedes must reference a superseded disposition for the same finding',
        });
      }
    }
  }
  const evaluationIdSet = new Set(evaluationIds);
  const dispositionIdSet = new Set(dispositionIds);
  const evaluationById = new Map(state.condition_evaluations.map((evaluation) => [evaluation.evaluation_id, evaluation]));
  for (const [index, evaluation] of state.condition_evaluations.entries()) {
    const evaluationReview = reviewById.get(evaluation.review_id);
    if (evaluation.run_id !== state.run_id
        || !evaluationReview
        || evaluationReview.policy_version !== evaluation.policy_version
        || evaluationReview.policy_digest !== evaluation.policy_digest) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['condition_evaluations', index],
        message: 'condition evaluation correlation is invalid',
      });
    }
    for (const [dispositionIndex, dispositionId] of evaluation.disposition_ids.entries()) {
      const disposition = dispositionById.get(dispositionId);
      if (!dispositionIdSet.has(dispositionId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['condition_evaluations', index, 'disposition_ids', dispositionIndex],
          message: 'condition evaluation references an unknown disposition',
        });
      } else if (disposition.run_id !== evaluation.run_id
          || disposition.review_id !== evaluation.review_id
          || (disposition.authorization.action !== 'transfer-blocker'
            && disposition.actor_id !== evaluation.actor_id)
          || disposition.policy_version !== evaluation.policy_version
          || disposition.policy_digest !== evaluation.policy_digest) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['condition_evaluations', index, 'disposition_ids', dispositionIndex],
          message: 'condition evaluation disposition correlation is invalid',
        });
      }
    }
  }
  for (const [index, candidate] of state.conditioned_candidates.entries()) {
    const evaluation = evaluationById.get(candidate.evaluation_id);
    const candidateReview = reviewById.get(candidate.review_id);
    const candidateDispositionIds = [...candidate.disposition_ids].sort();
    const evaluationDispositionIds = [...(evaluation?.disposition_ids || [])].sort();
    if (candidate.run_id !== state.run_id
        || !reviewIds.includes(candidate.review_id)
        || !evaluationIdSet.has(candidate.evaluation_id)
        || evaluation?.result.eligible !== true
        || evaluation?.run_id !== candidate.run_id
        || evaluation?.review_id !== candidate.review_id
        || evaluation?.actor_id !== candidate.actor_id
        || evaluation?.policy_version !== candidate.policy_version
        || evaluation?.policy_digest !== candidate.policy_digest
        || evaluation?.reason_path !== candidate.reason_path
        || evaluation?.reason_sha256 !== candidate.reason_sha256
        || candidateReview?.provider_recommendation !== candidate.reviewer_recommendation
        || candidateDispositionIds.length !== evaluationDispositionIds.length
        || candidateDispositionIds.some((id, dispositionIndex) => id !== evaluationDispositionIds[dispositionIndex])) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['conditioned_candidates', index],
        message: 'conditioned candidate correlation is invalid',
      });
    }
    for (const [dispositionIndex, dispositionId] of candidate.disposition_ids.entries()) {
      if (!dispositionIdSet.has(dispositionId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['conditioned_candidates', index, 'disposition_ids', dispositionIndex],
          message: 'conditioned candidate references an unknown disposition',
        });
      }
    }
  }
  for (const [index, decision] of (state.decisions || []).entries()) {
    const decisionReview = decision.review_id ? reviewById.get(decision.review_id) : null;
    const decisionCandidate = decision.candidate_id
      ? state.conditioned_candidates.find((candidate) => candidate.candidate_id === decision.candidate_id)
      : null;
    if (decision.run_id !== state.run_id
        || (decision.review_id && !decisionReview)
        || (decision.phase === 'technical-plan' && decision.review_id !== state.current_review_id)
        || (decisionCandidate && (
          decisionCandidate.run_id !== decision.run_id
          || decisionCandidate.review_id !== decision.review_id
          || decisionCandidate.evaluation_id !== decision.evaluation_id
          || decisionCandidate.decision !== decision.decision
        ))
        || (decision.candidate_id && !decisionCandidate)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['decisions', index],
        message: 'approval decision correlation is invalid',
      });
    }
  }
  if (state.current_review_id && !reviewIds.includes(state.current_review_id)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['current_review_id'],
      message: 'current review does not exist in the run review list',
    });
  }
  if (state.current_review_id && state.reviews.at(-1)?.review_id !== state.current_review_id) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['current_review_id'],
      message: 'current review must be the latest canonical review',
    });
  }
  const knownFindings = new Set(findingIds);
  for (const [reviewIndex, review] of state.reviews.entries()) {
    for (const field of [
      'finding_ids',
      'required_fixes',
      'plan_required_fixes',
      'slice_required_fixes',
      'pr_required_fixes',
      'follow_ups',
      'optional_hardening',
      'current_blockers',
      'later_phase_transfers',
    ]) {
      const values = field === 'finding_ids' ? review.finding_ids : review.projection[field];
      for (const [valueIndex, findingId] of values.entries()) {
        if (!knownFindings.has(findingId)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['reviews', reviewIndex, field, valueIndex],
            message: `unknown canonical finding '${findingId}'`,
          });
        }
      }
    }
  }
});

module.exports = {
  CONDITION_DISPOSITION_STATES,
  CONDITION_ELIGIBILITY_CODES,
  CONDITION_ELIGIBILITY_STATUSES,
  DECISION_KINDS,
  EXECUTION_PROFILES,
  FINDING_CATEGORIES,
  FINDING_SEVERITIES,
  GOVERNANCE_ACTIONS,
  GOVERNANCE_RECORD_SCHEMA_VERSION,
  GOVERNANCE_SCHEMA_VERSION,
  GOVERNANCE_WRITER_MODES,
  INDEPENDENCE_RULES,
  MINIMUM_SENSITIVE_CATEGORIES,
  PHASE_OWNERS,
  PLAN_REVIEW_KIND,
  PLAN_REVIEW_RECOMMENDATIONS,
  PLAN_REVIEW_SCHEMA_VERSION,
  RECOMMENDED_DISPOSITIONS,
  REVIEW_EVENT_CLASSES,
  actorIdentitySchema,
  approvalDecisionSchema,
  authorizationEvidenceSchema,
  authorizationPolicySchema,
  authorizationRuleSchema,
  canonicalFindingIdSchema,
  canonicalFindingSchema,
  canonicalDispositionSchema,
  canonicalReviewSchema,
  conditionedDecisionCandidateSchema,
  conditionDispositionEnvelopeSchema,
  conditionDispositionPolicySchema,
  conditionDispositionRuleSchema,
  conditionDispositionStateSchema,
  conditionEligibilityCodeSchema,
  conditionEligibilityResultSchema,
  conditionEligibilityStatusSchema,
  conditionEvaluationSchema,
  criterionBindingSchema,
  decisionKindSchema,
  decisionSchema,
  dispositionSchema,
  executionProfileSchema,
  findingCategorySchema,
  findingSeveritySchema,
  findingLifecycleEventSchema,
  governanceActionSchema,
  governanceConfigSchema,
  governanceCompatibilitySchema,
  governanceWriterModeSchema,
  governancePolicySchema,
  independenceRuleSchema,
  phaseOwnerSchema,
  packageSemverSchema,
  planReviewRecommendationSchema,
  providerFindingSchema,
  providerReviewBodySchema,
  providerReviewSchema,
  recommendedDispositionSchema,
  repositoryRelativePathSchema,
  reviewEventSchema,
  reviewEventClassSchema,
  reviewProjectionSchema,
  runGovernanceStateSchema,
};
