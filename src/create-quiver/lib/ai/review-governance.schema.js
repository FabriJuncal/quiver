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

const nonEmptyStringSchema = z.string().trim().min(1);
const identifierSchema = nonEmptyStringSchema.max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/, 'invalid identifier');
const canonicalFindingIdSchema = z.string().trim().regex(/^F-\d{3,}$/, 'invalid canonical finding id');
const evidenceLocationSchema = nonEmptyStringSchema.max(2_000);
const acceptanceReferenceSchema = nonEmptyStringSchema.max(200);
const sha256DigestSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const timestampSchema = z.string().datetime();

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

const governanceConfigSchema = z.object({
  schema_version: z.literal(GOVERNANCE_SCHEMA_VERSION),
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

const dispositionSchema = z.object({
  schema_version: z.literal(GOVERNANCE_RECORD_SCHEMA_VERSION),
  run_id: nonEmptyStringSchema.max(300),
  review_id: nonEmptyStringSchema.max(300),
  finding_id: canonicalFindingIdSchema,
  action: recommendedDispositionSchema,
  target: nonEmptyStringSchema.max(500).optional(),
  target_issue: nonEmptyStringSchema.max(500).optional(),
}).strict();

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
  recorded_at: timestampSchema,
}).strict();

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
  updated_at: timestampSchema.optional(),
}).strict().superRefine((state, context) => {
  const reviewIds = state.reviews.map((review) => review.review_id);
  const findingIds = state.findings.map((finding) => finding.finding_id);
  addUniqueArrayIssue(reviewIds, context, ['reviews'], 'review IDs');
  addUniqueArrayIssue(findingIds, context, ['findings'], 'finding IDs');
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
  DECISION_KINDS,
  EXECUTION_PROFILES,
  FINDING_CATEGORIES,
  FINDING_SEVERITIES,
  GOVERNANCE_ACTIONS,
  GOVERNANCE_RECORD_SCHEMA_VERSION,
  GOVERNANCE_SCHEMA_VERSION,
  INDEPENDENCE_RULES,
  MINIMUM_SENSITIVE_CATEGORIES,
  PHASE_OWNERS,
  PLAN_REVIEW_KIND,
  PLAN_REVIEW_RECOMMENDATIONS,
  PLAN_REVIEW_SCHEMA_VERSION,
  RECOMMENDED_DISPOSITIONS,
  REVIEW_EVENT_CLASSES,
  actorIdentitySchema,
  authorizationPolicySchema,
  authorizationRuleSchema,
  canonicalFindingIdSchema,
  canonicalFindingSchema,
  canonicalReviewSchema,
  decisionKindSchema,
  decisionSchema,
  dispositionSchema,
  executionProfileSchema,
  findingCategorySchema,
  findingSeveritySchema,
  findingLifecycleEventSchema,
  governanceActionSchema,
  governanceConfigSchema,
  governancePolicySchema,
  independenceRuleSchema,
  phaseOwnerSchema,
  planReviewRecommendationSchema,
  providerFindingSchema,
  providerReviewBodySchema,
  providerReviewSchema,
  recommendedDispositionSchema,
  reviewEventSchema,
  reviewEventClassSchema,
  reviewProjectionSchema,
  runGovernanceStateSchema,
};
