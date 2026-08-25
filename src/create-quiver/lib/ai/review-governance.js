const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const {
  EXECUTION_PROFILES,
  FINDING_CATEGORIES,
  GOVERNANCE_ACTIONS,
  GOVERNANCE_SCHEMA_VERSION,
  INDEPENDENCE_RULES,
  MINIMUM_SENSITIVE_CATEGORIES,
  PHASE_OWNERS,
  actorIdentitySchema,
  canonicalFindingSchema,
  providerFindingSchema,
  providerReviewSchema,
  governanceConfigSchema,
} = require('./review-governance.schema');

const PROVIDER_OUTPUT_INVALID = 'PROVIDER_OUTPUT_INVALID';
const FINDING_RECONCILIATION_AMBIGUOUS = 'FINDING_RECONCILIATION_AMBIGUOUS';
const DEFAULT_EXECUTION_PROFILE = 'fast-delivery';

const TECHNICAL_PLAN_BLOCKING_CATEGORIES = Object.freeze([
  'security',
  'data-integrity',
  'rollout',
  'architecture',
  'business-rule',
]);

const TECHNICAL_PLAN_NON_BLOCKING_CATEGORIES = Object.freeze(
  FINDING_CATEGORIES.filter((category) => !TECHNICAL_PLAN_BLOCKING_CATEGORIES.includes(category)),
);

class GovernanceError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'GovernanceError';
    this.code = code;
    this.details = details;
  }
}

function defaultAuthorizationActions() {
  return Object.fromEntries(GOVERNANCE_ACTIONS.map((action) => [action, {
    allowed_actor_ids: [],
    allowed_roles: [],
    independence: 'none',
  }]));
}

function buildDefaultGovernanceConfig() {
  return {
    schema_version: GOVERNANCE_SCHEMA_VERSION,
    requested_profile: DEFAULT_EXECUTION_PROFILE,
    requirement_categories: [],
    policy: {
      version: 'v58',
      sensitive_categories: [...MINIMUM_SENSITIVE_CATEGORIES],
      profiles: {
        'fast-delivery': {
          acceptance: {
            human_approval: 'optional',
            max_revisions: 1,
          },
          technical_plan: {
            required: true,
            detail_level: 'brief',
            max_reviews: 1,
            max_full_revisions: 1,
          },
          spec: {
            required: true,
          },
          execution: {
            independent_pr_review: true,
            workspace_isolation: true,
            per_run_budget: true,
          },
          release: {
            human_merge: true,
          },
        },
        'high-assurance': {
          acceptance: {
            human_approval: 'required',
            max_revisions: 2,
          },
          technical_plan: {
            required: true,
            human_approval: 'required',
            independent_review: true,
            max_reviews: 2,
            max_full_revisions: 1,
            targeted_amendments_after_limit: true,
          },
          spec: {
            required: true,
          },
          execution: {
            review_each_slice: true,
            security_review: true,
            workspace_isolation: true,
            permission_envelope: true,
            per_run_budget: true,
            verified_approval_actor: true,
            independent_runtime_review: true,
          },
          release: {
            human_merge: true,
            human_release_approval: true,
            same_artifact_identity: true,
          },
        },
      },
      review_policy: {
        'technical-plan': {
          blocking_categories: [...TECHNICAL_PLAN_BLOCKING_CATEGORIES],
          non_blocking_categories: [...TECHNICAL_PLAN_NON_BLOCKING_CATEGORIES],
        },
      },
      authorization: {
        default_effect: 'deny',
        actor_bindings: {},
        actions: defaultAuthorizationActions(),
      },
    },
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneJsonValue(value) {
  if (Array.isArray(value)) {
    return value.map(cloneJsonValue);
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneJsonValue(item)]));
  }
  return value;
}

function mergeDefaults(defaultValue, currentValue) {
  if (!isPlainObject(defaultValue) || !isPlainObject(currentValue)) {
    return typeof currentValue === 'undefined' ? cloneJsonValue(defaultValue) : cloneJsonValue(currentValue);
  }

  const result = cloneJsonValue(defaultValue);
  for (const [key, value] of Object.entries(currentValue)) {
    if (isPlainObject(value) && isPlainObject(defaultValue[key])) {
      result[key] = mergeDefaults(defaultValue[key], value);
    } else {
      result[key] = cloneJsonValue(value);
    }
  }
  return result;
}

function formatSchemaIssues(issues = []) {
  return issues.map((issue) => ({
    code: issue.code,
    message: issue.message,
    path: issue.path.join('.'),
  }));
}

function validateGovernanceConfig(governanceValue) {
  const parsed = governanceConfigSchema.safeParse(governanceValue);
  if (!parsed.success) {
    throw new GovernanceError(
      'GOVERNANCE_CONFIG_INVALID',
      'Invalid governance configuration.',
      { issues: formatSchemaIssues(parsed.error.issues) },
    );
  }
  return parsed.data;
}

function mergeGovernanceConfig(rootConfig) {
  const root = isPlainObject(rootConfig) ? cloneJsonValue(rootConfig) : {};
  const hasNamespace = Object.prototype.hasOwnProperty.call(root, 'governance');
  if (hasNamespace && !isPlainObject(root.governance)) {
    validateGovernanceConfig(root.governance);
  }
  const current = isPlainObject(root.governance) ? root.governance : {};
  const governance = validateGovernanceConfig(mergeDefaults(buildDefaultGovernanceConfig(), current));
  return {
    ...root,
    governance,
  };
}

function governanceConfigPath(projectRoot) {
  return path.join(projectRoot, '.quiver', 'config.json');
}

function readRootConfig(projectRoot) {
  const filePath = governanceConfigPath(projectRoot);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!isPlainObject(parsed)) {
      throw new Error('root config must be a JSON object');
    }
    return parsed;
  } catch (error) {
    throw new GovernanceError(
      'GOVERNANCE_CONFIG_INVALID',
      `Invalid Quiver config at ${path.relative(projectRoot, filePath).split(path.sep).join('/')}: ${error.message}`,
    );
  }
}

function hasGovernanceConfig(projectRoot) {
  const root = readRootConfig(projectRoot);
  return Boolean(root && Object.prototype.hasOwnProperty.call(root, 'governance'));
}

function readGovernanceConfig(projectRoot, options = {}) {
  const root = readRootConfig(projectRoot);
  const present = Boolean(root && Object.prototype.hasOwnProperty.call(root, 'governance'));
  if (!present && options.allowMissing === true) {
    return null;
  }
  if (!present) {
    return buildDefaultGovernanceConfig();
  }
  return mergeGovernanceConfig(root).governance;
}

function canonicalizeJson(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalizeJson);
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .filter((key) => typeof value[key] !== 'undefined')
        .sort(compareCodeUnits)
        .map((key) => [key, canonicalizeJson(value[key])]),
    );
  }
  return value;
}

function compareCodeUnits(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function stableStringify(value) {
  return JSON.stringify(canonicalizeJson(value));
}

function computePolicyDigest(policyOrGovernance) {
  const policy = isPlainObject(policyOrGovernance?.policy)
    ? policyOrGovernance.policy
    : policyOrGovernance;
  if (!isPlainObject(policy)) {
    throw new GovernanceError('GOVERNANCE_POLICY_INVALID', 'Cannot digest a missing or invalid governance policy.');
  }
  const digestInput = cloneJsonValue(policy);
  delete digestInput.digest;
  return `sha256:${crypto.createHash('sha256').update(stableStringify(digestInput), 'utf8').digest('hex')}`;
}

function normalizeRequirementCategory(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFC')
    .replace(/[_\s]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function assertExecutionProfile(profile) {
  if (!EXECUTION_PROFILES.includes(profile)) {
    throw new GovernanceError(
      'GOVERNANCE_PROFILE_INVALID',
      `Unsupported governance profile '${profile}'.`,
      { supported_profiles: [...EXECUTION_PROFILES] },
    );
  }
  return profile;
}

function normalizeActiveProfile(value) {
  if (typeof value === 'string') return value;
  return value?.effective_profile || value?.effective || value?.profile || '';
}

function resolveEffectiveProfile(options = {}) {
  const governance = validateGovernanceConfig(
    options.governance || options.config?.governance || options.config || buildDefaultGovernanceConfig(),
  );
  const requested = assertExecutionProfile(
    String(options.cliProfile || options.requestedProfile || governance.requested_profile || DEFAULT_EXECUTION_PROFILE).trim(),
  );
  const sensitive = new Set(governance.policy.sensitive_categories.map(normalizeRequirementCategory));
  const requirementCategories = Array.isArray(options.requirementCategories)
    ? options.requirementCategories.map(normalizeRequirementCategory).filter(Boolean)
    : [];
  const forceReasons = [...new Set(requirementCategories.filter((category) => sensitive.has(category)))];
  const effective = forceReasons.length > 0 ? 'high-assurance' : requested;
  const activeProfile = normalizeActiveProfile(options.activeRunProfile);

  if (activeProfile === 'high-assurance' && effective !== 'high-assurance') {
    throw new GovernanceError(
      'PROFILE_DOWNGRADE_FORBIDDEN',
      'An active high-assurance run cannot be silently downgraded.',
      { active_profile: activeProfile, requested_profile: requested, effective_profile: effective },
    );
  }

  return {
    requested_profile: requested,
    effective_profile: effective,
    forced_high_assurance: forceReasons.length > 0,
    force_reasons: forceReasons,
    policy_version: governance.policy.version,
    policy_digest: computePolicyDigest(governance),
    controls: cloneJsonValue(governance.policy.profiles[effective]),
  };
}

function authorizationDenial(code, message, evidence = {}) {
  return {
    authorized: false,
    code,
    message,
    evidence,
  };
}

function identityKeys(identity) {
  if (!identity) return new Set();
  if (typeof identity === 'string') return new Set([identity]);
  return new Set([identity.actor_id, identity.provider_subject].filter(Boolean));
}

function identitiesOverlap(left, right) {
  const leftKeys = identityKeys(left);
  const rightKeys = identityKeys(right);
  return [...leftKeys].some((key) => rightKeys.has(key));
}

function findActorBinding(bindings, actor) {
  const source = isPlainObject(bindings) ? bindings : {};
  if (actor.provider_subject && Object.prototype.hasOwnProperty.call(source, actor.provider_subject)) {
    return [actor.provider_subject, source[actor.provider_subject]];
  }
  if (actor.provider === 'local'
      && /^local:[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(actor.actor_id)
      && Object.prototype.hasOwnProperty.call(source, actor.actor_id)) {
    return [actor.actor_id, source[actor.actor_id]];
  }
  return null;
}

function authorizeGovernanceAction(options = {}) {
  const policy = options.policy || options.governance?.policy || options.config?.policy || options.config?.governance?.policy;
  const authorization = policy?.authorization;
  const policyEvidence = {
    action: options.action || null,
    policy_version: policy?.version || null,
    policy_digest: isPlainObject(policy) ? computePolicyDigest(policy) : null,
  };

  if (!isPlainObject(authorization) || authorization.default_effect !== 'deny') {
    return authorizationDenial('AUTHORIZATION_POLICY_INVALID', 'Authorization policy is missing or does not default to deny.', policyEvidence);
  }
  if (!GOVERNANCE_ACTIONS.includes(options.action)) {
    return authorizationDenial('AUTHORIZATION_ACTION_UNKNOWN', 'Governance action is unknown.', policyEvidence);
  }

  const actorResult = actorIdentitySchema.safeParse(options.actor);
  if (!actorResult.success) {
    return authorizationDenial('ACTOR_IDENTITY_UNAVAILABLE', 'A verified or explicitly configured actor identity is required.', policyEvidence);
  }
  const actor = actorResult.data;

  const rule = authorization.actions?.[options.action];
  if (!isPlainObject(rule)) {
    return authorizationDenial('AUTHORIZATION_RULE_MISSING', 'No authorization rule exists for this action.', {
      ...policyEvidence,
      actor_id: actor.actor_id,
      provider_subject: actor.provider_subject || null,
    });
  }
  if (!INDEPENDENCE_RULES.includes(rule.independence)) {
    return authorizationDenial('AUTHORIZATION_INDEPENDENCE_INVALID', 'The authorization independence rule is invalid.', policyEvidence);
  }

  const bindingEntry = findActorBinding(authorization.actor_bindings, actor);
  if (!bindingEntry) {
    return authorizationDenial('AUTHORIZATION_ACTOR_UNKNOWN', 'The actor has no explicit policy binding.', {
      ...policyEvidence,
      actor_id: actor.actor_id,
      provider_subject: actor.provider_subject || null,
    });
  }

  const [bindingKey, binding] = bindingEntry;
  const canonicalActor = {
    ...actor,
    actor_id: binding.actor_id || actor.actor_id,
    verified: actor.provider === 'local' ? false : actor.verified,
  };
  const effectiveProfile = normalizeActiveProfile(options.profile || options.effectiveProfile);
  if (effectiveProfile === 'high-assurance' && (actor.provider === 'local' || actor.verified !== true)) {
    return authorizationDenial('VERIFIED_ACTOR_REQUIRED', 'High-assurance governance requires a verified actor.', {
      ...policyEvidence,
      actor_id: canonicalActor.actor_id,
      provider_actor_id: actor.actor_id,
      provider_subject: actor.provider_subject || null,
      binding: bindingKey,
      identity_label: actor.provider === 'local' ? 'LOCAL_UNVERIFIED_IDENTITY' : null,
    });
  }

  const actorIds = new Set([canonicalActor.actor_id, actor.actor_id, actor.provider_subject].filter(Boolean));
  const roles = Array.isArray(binding.roles) ? binding.roles : [];
  const matchedActorIds = (Array.isArray(rule.allowed_actor_ids) ? rule.allowed_actor_ids : []).filter((id) => actorIds.has(id));
  const matchedRoles = (Array.isArray(rule.allowed_roles) ? rule.allowed_roles : []).filter((role) => roles.includes(role));
  if (matchedActorIds.length === 0 && matchedRoles.length === 0) {
    return authorizationDenial('AUTHORIZATION_DENIED', 'The actor does not match an allowed actor ID or role.', {
      ...policyEvidence,
      actor_id: actor.actor_id,
      binding: bindingKey,
      bound_roles: [...roles],
    });
  }

  const independenceTargets = {
    'different-from-run-creator': options.context?.run_creator,
    'different-from-reviewer': options.context?.reviewer,
    'different-from-executor': options.context?.executor,
  };
  const target = independenceTargets[rule.independence];
  if (rule.independence !== 'none' && (!target || identitiesOverlap(canonicalActor, target))) {
    return authorizationDenial('AUTHORIZATION_INDEPENDENCE_FAILED', 'The actor does not satisfy the configured independence rule.', {
      ...policyEvidence,
      actor_id: canonicalActor.actor_id,
      provider_actor_id: actor.actor_id,
      provider_subject: actor.provider_subject || null,
      binding: bindingKey,
      independence: rule.independence,
    });
  }

  return {
    authorized: true,
    code: 'AUTHORIZED',
    evidence: {
      ...policyEvidence,
      actor_id: canonicalActor.actor_id,
      provider_actor_id: actor.actor_id,
      provider_subject: actor.provider_subject || null,
      verified: canonicalActor.verified,
      binding: bindingKey,
      matched_actor_ids: matchedActorIds,
      matched_roles: matchedRoles,
      independence: rule.independence,
      independence_result: 'passed',
      identity_label: actor.provider === 'local' ? 'LOCAL_UNVERIFIED_IDENTITY' : null,
    },
  };
}

function parseJsonObject(text) {
  const parsed = JSON.parse(text);
  if (!isPlainObject(parsed)) {
    throw new Error('provider review must be one JSON object');
  }
  return parsed;
}

function extractProviderReviewJson(text) {
  const raw = String(text || '').trim();
  if (!raw) {
    throw new Error('provider review output is empty');
  }
  try {
    return parseJsonObject(raw);
  } catch (directError) {
    const blocks = [...raw.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
    if (blocks.length !== 1) {
      throw directError;
    }
    return parseJsonObject(blocks[0][1].trim());
  }
}

function arraySetMatches(left, right) {
  if (left.length !== right.length) return false;
  const leftSet = new Set(left);
  return right.every((item) => leftSet.has(item));
}

function resolvePhaseRule(policy, phase, effectiveProfile = '') {
  const rule = policy?.review_policy?.[phase];
  if (!isPlainObject(rule)) return null;
  return rule;
}

function findingBlocksPhase(finding, phase, policy, effectiveProfile = '') {
  if (finding.phase_owner !== phase || finding.phase_blocking !== true) {
    return false;
  }
  const rule = resolvePhaseRule(policy, phase, effectiveProfile);
  if (!rule) return true;
  return Array.isArray(rule.blocking_categories) && rule.blocking_categories.includes(finding.category);
}

function findingIsFollowUp(finding) {
  return finding.phase_owner === 'follow-up'
    || finding.category === 'follow-up'
    || finding.recommended_disposition === 'create-follow-up';
}

function findingIsOptional(finding) {
  return finding.category === 'optional-hardening'
    || finding.recommended_disposition === 'optional';
}

function projectPhaseAwareReview(reviewOrFindings, options = {}) {
  const review = Array.isArray(reviewOrFindings)
    ? { findings: reviewOrFindings }
    : reviewOrFindings?.review || reviewOrFindings;
  const findings = Array.isArray(review?.findings) ? review.findings : [];
  const governance = options.governance || buildDefaultGovernanceConfig();
  const policy = options.policy || governance.policy || governance;
  const currentPhase = options.currentPhase || 'technical-plan';
  const effectiveProfile = assertExecutionProfile(
    options.effectiveProfile
      || options.profile?.effective_profile
      || governance.requested_profile
      || DEFAULT_EXECUTION_PROFILE,
  );
  const currentBlockers = findings.filter((finding) => findingBlocksPhase(finding, currentPhase, policy, effectiveProfile));
  const blockingFindingIds = new Set(findings
    .filter((finding) => findingBlocksPhase(finding, finding.phase_owner, policy, effectiveProfile))
    .map((finding) => finding.id || finding.finding_id));
  const optionalHardening = findings.filter((finding) => (
    !blockingFindingIds.has(finding.id || finding.finding_id) && findingIsOptional(finding)
  ));
  const optionalIds = new Set(optionalHardening.map((finding) => finding.id || finding.finding_id));
  const followUps = findings.filter((finding) => (
    !blockingFindingIds.has(finding.id || finding.finding_id)
    && !optionalIds.has(finding.id || finding.finding_id)
    && findingIsFollowUp(finding)
  ));
  const excludedIds = new Set([...optionalHardening, ...followUps].map((finding) => finding.id || finding.finding_id));

  const planRequiredFixes = findings.filter((finding) => (
    !excludedIds.has(finding.id || finding.finding_id)
    && findingBlocksPhase(finding, 'technical-plan', policy, effectiveProfile)
  ));
  const sliceRequiredFixes = findings.filter((finding) => (
    !excludedIds.has(finding.id || finding.finding_id)
    && finding.phase_owner === 'slice'
  ));
  const prRequiredFixes = findings.filter((finding) => (
    !excludedIds.has(finding.id || finding.finding_id)
    && finding.phase_owner === 'pr-review'
  ));
  const phaseOrder = ['requirement', 'acceptance', 'technical-plan', 'spec', 'slice', 'pr-review', 'release', 'follow-up'];
  const currentRank = phaseOrder.indexOf(currentPhase);
  const laterPhaseTransfers = findings.filter((finding) => (
    !excludedIds.has(finding.id || finding.finding_id)
    && phaseOrder.indexOf(finding.phase_owner) > currentRank
  ));
  const ids = (items) => items.map((finding) => finding.id || finding.finding_id);

  return {
    blocking: currentBlockers.length > 0,
    approval_recommendation: currentBlockers.length > 0
      ? 'revise'
      : findings.length > 0 ? 'approve-with-risk' : 'approve',
    required_fixes: ids(currentBlockers),
    plan_required_fixes: ids(planRequiredFixes),
    slice_required_fixes: ids(sliceRequiredFixes),
    pr_required_fixes: ids(prRequiredFixes),
    follow_ups: ids(followUps),
    optional_hardening: ids(optionalHardening),
    current_blockers: currentBlockers,
    later_phase_transfers: laterPhaseTransfers,
  };
}

function parseProviderReview(text, options = {}) {
  let raw;
  try {
    raw = extractProviderReviewJson(text);
  } catch (error) {
    throw new GovernanceError(PROVIDER_OUTPUT_INVALID, `Invalid provider review output: ${error.message}`);
  }

  const parsed = providerReviewSchema.safeParse(raw);
  if (!parsed.success) {
    throw new GovernanceError(
      PROVIDER_OUTPUT_INVALID,
      'Provider review output does not satisfy the v58 contract.',
      { issues: formatSchemaIssues(parsed.error.issues) },
    );
  }

  if (options.validateAggregates !== false) {
    const projection = projectPhaseAwareReview(parsed.data.review, options);
    assertProviderReviewAggregates(parsed.data.review, projection);
    const governance = options.governance || buildDefaultGovernanceConfig();
    const policy = options.policy || governance.policy || governance;
    const effectiveProfile = options.effectiveProfile
      || options.profile?.effective_profile
      || governance.requested_profile
      || DEFAULT_EXECUTION_PROFILE;
    for (const finding of parsed.data.review.findings) {
      const rule = resolvePhaseRule(policy, finding.phase_owner, effectiveProfile);
      if (!rule) continue;
      if (finding.phase_blocking === true && !rule.blocking_categories.includes(finding.category)) {
        throw new GovernanceError(
          PROVIDER_OUTPUT_INVALID,
          'Provider review marks a policy-ineligible category as phase blocking.',
          { finding_id: finding.id, phase_owner: finding.phase_owner, category: finding.category },
        );
      }
    }
  }

  return parsed.data;
}

function assertProviderReviewAggregates(review, projection, options = {}) {
  const mapFindingId = typeof options.mapFindingId === 'function'
    ? options.mapFindingId
    : (findingId) => findingId;
  const aggregateFields = [
    'plan_required_fixes',
    'slice_required_fixes',
    'pr_required_fixes',
    'follow_ups',
    'optional_hardening',
  ];
  const mismatches = aggregateFields.filter((field) => {
    const mapped = review[field].map(mapFindingId);
    return mapped.some((findingId) => !findingId) || !arraySetMatches(mapped, projection[field]);
  });
  if (review.blocking !== projection.blocking) mismatches.push('blocking');
  if (review.recommendation !== projection.approval_recommendation) mismatches.push('recommendation');
  if (mismatches.length > 0) {
    throw new GovernanceError(
      PROVIDER_OUTPUT_INVALID,
      'Provider review aggregates do not match canonical phase-aware findings.',
      { mismatches, projection },
    );
  }
  return true;
}

function normalizeFingerprintList(values, normalizer) {
  return [...new Set(values.map(normalizer).filter(Boolean))].sort(compareCodeUnits);
}

function normalizeEvidenceLocation(value) {
  const normalized = String(value || '').trim().normalize('NFC').replace(/\\/g, '/');
  const hashIndex = normalized.indexOf('#');
  const filePart = hashIndex >= 0 ? normalized.slice(0, hashIndex) : normalized;
  const fragment = hashIndex >= 0 ? normalized.slice(hashIndex) : '';
  return `${filePart.replace(/^\.\//, '').replace(/\/{2,}/g, '/')}${fragment}`;
}

function computeFindingFingerprint(finding) {
  if (!FINDING_CATEGORIES.includes(finding?.category) || !PHASE_OWNERS.includes(finding?.phase_owner)) {
    throw new GovernanceError(PROVIDER_OUTPUT_INVALID, 'Cannot fingerprint a finding with invalid identity fields.');
  }
  const identity = {
    category: finding.category,
    phase_owner: finding.phase_owner,
    acceptance_refs: normalizeFingerprintList(
      Array.isArray(finding.acceptance_refs) ? finding.acceptance_refs : [],
      (value) => String(value || '').trim().normalize('NFC'),
    ),
    evidence_locations: normalizeFingerprintList(
      Array.isArray(finding.evidence) ? finding.evidence : [],
      normalizeEvidenceLocation,
    ),
  };
  return `sha256:${crypto.createHash('sha256').update(stableStringify(identity), 'utf8').digest('hex')}`;
}

function reconciliationError(message, details = {}) {
  return new GovernanceError(FINDING_RECONCILIATION_AMBIGUOUS, message, details);
}

function canonicalFindingFields(incoming) {
  return {
    title: incoming.title,
    summary: incoming.summary,
    severity: incoming.severity,
    category: incoming.category,
    phase_owner: incoming.phase_owner,
    phase_blocking: incoming.phase_blocking,
    ...(incoming.blocking_justification ? { blocking_justification: incoming.blocking_justification } : {}),
    evidence: [...incoming.evidence],
    acceptance_refs: [...incoming.acceptance_refs],
    recommended_disposition: incoming.recommended_disposition,
    confidence: incoming.confidence,
  };
}

function appendOrigin(origins, reviewId, providerFindingId) {
  const next = Array.isArray(origins) ? origins.map(cloneJsonValue) : [];
  if (!next.some((origin) => origin.review_id === (reviewId || null) && origin.provider_finding_id === providerFindingId)) {
    next.push({
      review_id: reviewId || null,
      provider_finding_id: providerFindingId,
    });
  }
  return next;
}

function appendLifecycle(lifecycle, event) {
  return (Array.isArray(lifecycle) ? lifecycle.map(cloneJsonValue) : []).concat(event);
}

function reconcileFindings(options = {}) {
  const runId = String(options.runId || '').trim();
  if (!runId) {
    throw new GovernanceError(PROVIDER_OUTPUT_INVALID, 'Finding reconciliation requires runId.');
  }

  const incomingParsed = providerFindingSchema.array().safeParse(options.incomingFindings || []);
  if (!incomingParsed.success) {
    throw new GovernanceError(
      PROVIDER_OUTPUT_INVALID,
      'Incoming findings do not satisfy the v58 contract.',
      { issues: formatSchemaIssues(incomingParsed.error.issues) },
    );
  }

  const incomingFindings = incomingParsed.data;
  const existingParsed = canonicalFindingSchema.array().safeParse(options.existingFindings || []);
  if (!existingParsed.success) {
    throw new GovernanceError(
      'GOVERNANCE_STATE_INVALID',
      'Existing canonical finding state is invalid.',
      { issues: formatSchemaIssues(existingParsed.error.issues) },
    );
  }
  const findings = existingParsed.data.map(cloneJsonValue);
  const fingerprintMismatch = findings.find((finding) => (
    computeFindingFingerprint(finding) !== finding.origin_fingerprint
  ));
  if (fingerprintMismatch) {
    throw new GovernanceError(
      'GOVERNANCE_STATE_INVALID',
      `Canonical finding '${fingerprintMismatch.finding_id}' has an invalid stored origin fingerprint.`,
      { finding_id: fingerprintMismatch.finding_id },
    );
  }
  const foreignFinding = findings.find((finding) => finding.run_id !== runId);
  if (foreignFinding) {
    throw new GovernanceError(
      'GOVERNANCE_STATE_INVALID',
      `Canonical finding '${foreignFinding.finding_id}' belongs to a different run.`,
      { expected_run_id: runId, actual_run_id: foreignFinding.run_id },
    );
  }
  const byId = new Map();
  const byFingerprint = new Map();

  for (const finding of findings) {
    if (!finding.finding_id) continue;
    if (byId.has(finding.finding_id)) {
      throw reconciliationError(`Duplicate canonical finding ID '${finding.finding_id}'.`);
    }
    byId.set(finding.finding_id, finding);
    const fingerprint = finding.origin_fingerprint || computeFindingFingerprint(finding);
    if (!byFingerprint.has(fingerprint)) byFingerprint.set(fingerprint, []);
    if (finding.state === 'open' || finding.state === 'closed') {
      byFingerprint.get(fingerprint).push(finding);
    }
  }

  const incomingFingerprints = incomingFindings.map(computeFindingFingerprint);
  const duplicateFingerprints = incomingFingerprints.filter((fingerprint, index) => incomingFingerprints.indexOf(fingerprint) !== index);
  if (duplicateFingerprints.length > 0) {
    throw reconciliationError('Two incoming findings have the same origin fingerprint.', {
      fingerprints: [...new Set(duplicateFingerprints)],
    });
  }

  let nextFindingNumber = Number.isInteger(options.nextFindingNumber) && options.nextFindingNumber > 0
    ? options.nextFindingNumber
    : 1;
  const usedIds = new Set(findings.map((finding) => finding.finding_id).filter(Boolean));
  const allocateId = () => {
    let findingId;
    do {
      findingId = `F-${String(nextFindingNumber).padStart(3, '0')}`;
      nextFindingNumber += 1;
    } while (usedIds.has(findingId));
    usedIds.add(findingId);
    return findingId;
  };

  const reconciledFindings = [];
  const events = [];
  const now = options.now instanceof Date
    ? options.now.toISOString()
    : String(options.now || new Date().toISOString());
  const reviewId = options.reviewId || null;

  const replaceFinding = (updated) => {
    const index = findings.findIndex((finding) => finding.finding_id === updated.finding_id && finding.run_id === runId);
    if (index >= 0) findings[index] = updated;
    else findings.push(updated);
    byId.set(updated.finding_id, updated);
  };

  for (const [index, incoming] of incomingFindings.entries()) {
    const fingerprint = incomingFingerprints[index];
    let canonical = null;
    let eventKind = 'observed';

    if (incoming.canonical_id) {
      canonical = byId.get(incoming.canonical_id) || null;
      if (!canonical || canonical.run_id !== runId || canonical.origin_fingerprint !== fingerprint) {
        throw reconciliationError(`Canonical finding reference '${incoming.canonical_id}' is missing or incompatible.`, {
          provider_finding_id: incoming.id,
          canonical_id: incoming.canonical_id,
        });
      }
    } else if (!incoming.supersedes) {
      const matches = byFingerprint.get(fingerprint) || [];
      if (matches.length > 1) {
        throw reconciliationError('Origin fingerprint matches multiple canonical findings.', {
          provider_finding_id: incoming.id,
          fingerprint,
          matches: matches.map((finding) => finding.finding_id),
        });
      }
      canonical = matches[0] || null;
    }

    if (!canonical) {
      const findingId = allocateId();
      canonical = {
        finding_id: findingId,
        run_id: runId,
        origin_fingerprint: fingerprint,
        state: 'open',
        ...canonicalFindingFields(incoming),
        supersedes: incoming.supersedes || null,
        origins: appendOrigin([], reviewId, incoming.id),
        lifecycle: [{
          event: incoming.supersedes ? 'created-as-supersession' : 'created',
          at: now,
          review_id: reviewId,
          provider_finding_id: incoming.id,
        }],
      };
      eventKind = incoming.supersedes ? 'superseded' : 'created';
      replaceFinding(canonical);

      if (incoming.supersedes) {
        const prior = byId.get(incoming.supersedes);
        if (!prior || prior.run_id !== runId) {
          throw reconciliationError(`Superseded finding '${incoming.supersedes}' does not belong to this run.`, {
            provider_finding_id: incoming.id,
          });
        }
        if (prior.origin_fingerprint === fingerprint) {
          throw reconciliationError('Supersession requires a material identity change.', {
            provider_finding_id: incoming.id,
            supersedes: incoming.supersedes,
          });
        }
        const updatedPrior = {
          ...prior,
          lifecycle: appendLifecycle(prior.lifecycle, {
            event: 'superseded-by',
            successor_id: canonical.finding_id,
            at: now,
            review_id: reviewId,
          }),
        };
        replaceFinding(updatedPrior);
      }
    } else {
      const wasClosed = canonical.state === 'closed';
      canonical = {
        ...canonical,
        ...canonicalFindingFields(incoming),
        state: wasClosed ? 'open' : canonical.state,
        origins: appendOrigin(canonical.origins, reviewId, incoming.id),
        lifecycle: wasClosed
          ? appendLifecycle(canonical.lifecycle, {
              event: 'reopened',
              at: now,
              review_id: reviewId,
              provider_finding_id: incoming.id,
            })
          : canonical.lifecycle || [],
      };
      if (!incoming.blocking_justification) {
        delete canonical.blocking_justification;
      }
      eventKind = wasClosed ? 'reopened' : 'reused';
      replaceFinding(canonical);
    }

    reconciledFindings.push(canonical);
    events.push({
      event: eventKind,
      finding_id: canonical.finding_id,
      provider_finding_id: incoming.id,
    });
  }

  return {
    findings,
    reconciledFindings,
    nextFindingNumber,
    events,
  };
}

module.exports = {
  DEFAULT_SENSITIVE_CATEGORIES: MINIMUM_SENSITIVE_CATEGORIES,
  DEFAULT_EXECUTION_PROFILE,
  FINDING_RECONCILIATION_AMBIGUOUS,
  GovernanceError,
  PROVIDER_OUTPUT_INVALID,
  TECHNICAL_PLAN_BLOCKING_CATEGORIES,
  assertProviderReviewAggregates,
  authorizeGovernanceAction,
  buildDefaultGovernanceConfig,
  computeFindingFingerprint,
  computePolicyDigest,
  extractProviderReviewJson,
  hasGovernanceConfig,
  mergeGovernanceConfig,
  parseProviderReview,
  projectPhaseAwareReview,
  readGovernanceConfig,
  reconcileFindings,
  resolveEffectiveProfile,
  stableStringify,
  validateGovernanceConfig,
};
