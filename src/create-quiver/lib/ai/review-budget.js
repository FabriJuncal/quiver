const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { z } = require('zod');

const { redactSensitiveValue } = require('./artifacts');
const {
  GovernanceError,
  authorizeGovernanceAction,
  computePolicyDigest,
  stableStringify,
} = require('./review-governance');
const { REVIEW_EVENT_CLASSES } = require('./review-governance.schema');
const {
  readAiRun,
  readRunGovernance,
  runReviewBudgetDir,
  withAiRunLock,
} = require('./run-state');

const REVIEW_BUDGET_SCHEMA_VERSION = 1;
const REVIEW_BUDGET_EXHAUSTED = 'REVIEW_BUDGET_EXHAUSTED';
const HUMAN_DECISION_REQUIRED = 'HUMAN_DECISION_REQUIRED';
const REVIEW_BUDGET_LEDGER_INVALID = 'REVIEW_BUDGET_LEDGER_INVALID';
const REVIEW_BUDGET_HISTORY_UNVERIFIED = 'REVIEW_BUDGET_HISTORY_UNVERIFIED';
const REVIEW_BUDGET_NEXT_ACTIONS = Object.freeze([
  'approve-with-conditions',
  'reject',
  'transfer-findings',
  'create-follow-up',
  'targeted-amendment',
]);

const nonEmptyString = z.string().trim().min(1);
const timestampSchema = z.string().datetime();
const digestSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const eventIdSchema = z.string().regex(/^BE-\d{6,}$/);
const reservationIdSchema = z.string().regex(/^BR-\d{6,}$/);
const reviewIdSchema = z.string().regex(/^R-\d{3,}$/);
const semanticClassSchema = z.enum(['full', 'targeted']);
const reviewEventClassSchema = z.enum(REVIEW_EVENT_CLASSES);

const fullIntentSchema = z.object({
  event_class: z.literal('full'),
  candidate_id: nonEmptyString.max(500),
  complete_replacement: z.literal(true),
  reviewed_parent_id: reviewIdSchema.nullable(),
}).strict();

const targetedIntentSchema = z.object({
  event_class: z.literal('targeted'),
  candidate_id: nonEmptyString.max(500),
  base_review_id: reviewIdSchema,
  finding_ids: z.array(nonEmptyString.max(300)),
  sections: z.array(nonEmptyString.max(500)),
}).strict().superRefine((intent, context) => {
  if (intent.finding_ids.length === 0 && intent.sections.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['finding_ids'],
      message: 'targeted review intent requires at least one finding ID or section',
    });
  }
});

const externalIntentSchema = z.object({
  event_class: z.literal('external'),
  declared_class: semanticClassSchema,
  adapter_id: nonEmptyString.max(300),
  candidate_id: nonEmptyString.max(500),
  complete_replacement: z.boolean(),
  reviewed_parent_id: reviewIdSchema.nullable(),
  base_review_id: reviewIdSchema.nullable(),
  finding_ids: z.array(nonEmptyString.max(300)),
  sections: z.array(nonEmptyString.max(500)),
}).strict().superRefine((intent, context) => {
  if (intent.declared_class === 'full') {
    if (intent.complete_replacement !== true) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['complete_replacement'],
        message: 'external full review requires a complete replacement candidate',
      });
    }
    if (intent.base_review_id !== null || intent.finding_ids.length > 0 || intent.sections.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['declared_class'],
        message: 'external full review cannot include targeted review fields',
      });
    }
  } else {
    if (intent.complete_replacement !== false || !intent.base_review_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['declared_class'],
        message: 'external targeted review requires a base review and cannot be a complete replacement',
      });
    }
    if (intent.reviewed_parent_id !== null || (intent.finding_ids.length === 0 && intent.sections.length === 0)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['finding_ids'],
        message: 'external targeted review requires declared finding IDs or sections',
      });
    }
  }
});

const reviewIntentSchema = z.discriminatedUnion('event_class', [
  fullIntentSchema,
  targetedIntentSchema,
  externalIntentSchema,
]);

const commonEventShape = {
  schema_version: z.literal(REVIEW_BUDGET_SCHEMA_VERSION),
  sequence: z.number().int().positive(),
  event_id: eventIdSchema,
  run_id: nonEmptyString.max(300),
  recorded_at: timestampSchema,
};

const reservationEventSchema = z.object({
  ...commonEventShape,
  kind: z.literal('reservation'),
  reservation_id: reservationIdSchema,
  attempt: z.literal(1),
  event_class: z.enum(['full', 'targeted', 'external']),
  semantic_class: semanticClassSchema,
  request_envelope_digest: digestSchema,
  intent_digest: digestSchema,
  intent: reviewIntentSchema,
}).strict();

const retryReservationEventSchema = z.object({
  ...commonEventShape,
  kind: z.literal('retry-reservation'),
  reservation_id: reservationIdSchema,
  attempt: z.number().int().min(2),
  event_class: z.literal('retry'),
  request_envelope_digest: digestSchema,
  intent_digest: digestSchema,
}).strict();

const outcomeEventSchema = z.object({
  ...commonEventShape,
  kind: z.literal('outcome'),
  reservation_id: reservationIdSchema,
  attempt: z.number().int().positive(),
  event_class: reviewEventClassSchema,
  request_envelope_digest: digestSchema,
  outcome: z.enum(['valid', 'invalid-output', 'retry']),
  received_payload: z.boolean(),
  failure_kind: z.enum(['transport', 'timeout']).nullable(),
  review_id: reviewIdSchema.nullable(),
}).strict().superRefine((event, context) => {
  if (event.outcome === 'retry') {
    if (event.received_payload !== false || !event.failure_kind || event.review_id !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['outcome'],
        message: 'retry outcome requires a pre-payload transport or timeout failure',
      });
    }
  } else if (event.received_payload !== true || event.failure_kind !== null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['received_payload'],
      message: 'valid and invalid-output outcomes require a received provider payload',
    });
  }
  if (event.outcome === 'valid' && !event.review_id) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['review_id'],
      message: 'valid outcome requires its canonical review ID',
    });
  }
  if (event.outcome === 'invalid-output' && event.review_id !== null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['review_id'],
      message: 'invalid provider output cannot reference a canonical review',
    });
  }
});

const authorizationEvidenceSchema = z.record(z.string(), z.unknown());
const extensionEventSchema = z.object({
  ...commonEventShape,
  kind: z.literal('extension'),
  additional_reviews: z.literal(1),
  actor_id: nonEmptyString.max(300),
  policy_version: nonEmptyString.max(200),
  policy_digest: digestSchema,
  authorization_evidence: authorizationEvidenceSchema,
}).strict();

const budgetEventSchema = z.discriminatedUnion('kind', [
  reservationEventSchema,
  retryReservationEventSchema,
  outcomeEventSchema,
  extensionEventSchema,
]);

function governanceError(code, message, details = {}) {
  return new GovernanceError(code, message, details);
}

function sha256Digest(value) {
  return `sha256:${crypto.createHash('sha256').update(String(value)).digest('hex')}`;
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map((value) => String(value || '').trim())
    .filter(Boolean))].sort();
}

function intentValue(source, snakeKey, camelKey, fallback = undefined) {
  if (Object.prototype.hasOwnProperty.call(source, snakeKey)) return source[snakeKey];
  if (camelKey && Object.prototype.hasOwnProperty.call(source, camelKey)) return source[camelKey];
  return fallback;
}

function parseIntent(value) {
  const parsed = reviewIntentSchema.safeParse(value);
  if (!parsed.success) {
    throw governanceError('REVIEW_INTENT_INVALID', 'Review intent is incomplete or inconsistent.', {
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
  return parsed.data;
}

function classifyReviewIntent(intent = {}, options = {}) {
  const source = intent && typeof intent === 'object' && !Array.isArray(intent) ? intent : {};
  const eventClass = String(intentValue(source, 'event_class', 'eventClass', '') || '').trim();
  const currentReviewId = String(options.currentReviewId || '').trim() || null;
  const candidateId = String(intentValue(source, 'candidate_id', 'candidateId', '') || '').trim();

  if (eventClass === 'retry') {
    throw governanceError('REVIEW_INTENT_INVALID', 'Retry is derived from a prior pre-payload failure and cannot be requested directly.');
  }

  if (eventClass === 'full') {
    const reviewedParentId = String(intentValue(source, 'reviewed_parent_id', 'reviewedParentId', '') || '').trim() || null;
    if (reviewedParentId !== currentReviewId) {
      throw governanceError('REVIEW_INTENT_INVALID', 'A full replacement must explicitly name the current reviewed parent.', {
        expected_parent_review_id: currentReviewId,
        actual_parent_review_id: reviewedParentId,
      });
    }
    return parseIntent({
      event_class: 'full',
      candidate_id: candidateId,
      complete_replacement: intentValue(source, 'complete_replacement', 'completeReplacement', false) === true,
      reviewed_parent_id: reviewedParentId,
    });
  }

  if (eventClass === 'targeted') {
    const baseReviewId = String(intentValue(source, 'base_review_id', 'baseReviewId', '') || '').trim();
    if (!currentReviewId || baseReviewId !== currentReviewId) {
      throw governanceError('REVIEW_INTENT_INVALID', 'A targeted amendment must reference the current canonical review.', {
        expected_base_review_id: currentReviewId,
        actual_base_review_id: baseReviewId || null,
      });
    }
    return parseIntent({
      event_class: 'targeted',
      candidate_id: candidateId,
      base_review_id: baseReviewId,
      finding_ids: uniqueStrings(intentValue(source, 'finding_ids', 'findingIds', [])),
      sections: uniqueStrings(intentValue(source, 'sections', 'sections', [])),
    });
  }

  if (eventClass === 'external') {
    const declaredClass = String(intentValue(source, 'declared_class', 'declaredClass', '') || '').trim();
    const reviewedParentId = String(intentValue(source, 'reviewed_parent_id', 'reviewedParentId', '') || '').trim() || null;
    const baseReviewId = String(intentValue(source, 'base_review_id', 'baseReviewId', '') || '').trim() || null;
    if ((declaredClass === 'full' && reviewedParentId !== currentReviewId)
      || (declaredClass === 'targeted' && (!currentReviewId || baseReviewId !== currentReviewId))) {
      throw governanceError('REVIEW_INTENT_INVALID', 'External review intent does not target the current canonical review.', {
        current_review_id: currentReviewId,
      });
    }
    return parseIntent({
      event_class: 'external',
      declared_class: declaredClass,
      adapter_id: String(intentValue(source, 'adapter_id', 'adapterId', '') || '').trim(),
      candidate_id: candidateId,
      complete_replacement: intentValue(source, 'complete_replacement', 'completeReplacement', false) === true,
      reviewed_parent_id: reviewedParentId,
      base_review_id: baseReviewId,
      finding_ids: uniqueStrings(intentValue(source, 'finding_ids', 'findingIds', [])),
      sections: uniqueStrings(intentValue(source, 'sections', 'sections', [])),
    });
  }

  throw governanceError('REVIEW_INTENT_INVALID', `Unsupported review event class '${eventClass || 'missing'}'.`);
}

function semanticClassForIntent(intent) {
  return intent.event_class === 'external' ? intent.declared_class : intent.event_class;
}

function countsAsFullRevision(intent) {
  return semanticClassForIntent(intent) === 'full' && Boolean(intent.reviewed_parent_id);
}

function computeReviewRequestEnvelopeDigest(envelope, intent) {
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
    throw governanceError('REVIEW_REQUEST_ENVELOPE_INVALID', 'Review request envelope must be a JSON object.');
  }
  let canonicalEnvelope;
  try {
    canonicalEnvelope = JSON.parse(stableStringify({
      ...envelope,
      intent,
    }));
  } catch (error) {
    throw governanceError('REVIEW_REQUEST_ENVELOPE_INVALID', `Review request envelope is not serializable: ${error.message}`);
  }
  return sha256Digest(stableStringify(canonicalEnvelope));
}

function parseLedgerEvent(value, filePath = '') {
  const parsed = budgetEventSchema.safeParse(value);
  if (!parsed.success) {
    throw governanceError(REVIEW_BUDGET_LEDGER_INVALID, 'Review budget ledger contains an invalid event.', {
      file: filePath || null,
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
  return parsed.data;
}

function readReviewBudgetEvents(projectRoot, runId) {
  const dir = runReviewBudgetDir(projectRoot, runId);
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const unexpected = entries.find((entry) => !entry.isFile()
    || (!/^\d{6,}-BE-\d{6,}\.json$/.test(entry.name) && !entry.name.startsWith('.tmp-')));
  if (unexpected) {
    throw governanceError(REVIEW_BUDGET_LEDGER_INVALID, 'Review budget ledger contains an unexpected entry.', {
      entry: unexpected.name,
    });
  }
  const files = entries
    .filter((entry) => entry.isFile() && /^\d{6,}-BE-\d{6,}\.json$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  return files.map((name, index) => {
    const filePath = path.join(dir, name);
    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      throw governanceError(REVIEW_BUDGET_LEDGER_INVALID, 'Review budget ledger event is not valid JSON.', {
        file: name,
        cause: error.message,
      });
    }
    const event = parseLedgerEvent(raw, name);
    const expectedSequence = index + 1;
    const expectedEventId = `BE-${String(expectedSequence).padStart(6, '0')}`;
    const expectedName = `${String(expectedSequence).padStart(6, '0')}-${expectedEventId}.json`;
    if (event.sequence !== expectedSequence
      || event.event_id !== expectedEventId
      || name !== expectedName
      || event.run_id !== readAiRun(projectRoot, runId)?.run_id) {
      throw governanceError(REVIEW_BUDGET_LEDGER_INVALID, 'Review budget ledger ordering or run correlation is invalid.', {
        file: name,
        expected_sequence: expectedSequence,
        expected_event_id: expectedEventId,
        run_id: event.run_id,
      });
    }
    return event;
  });
}

function appendReviewBudgetEventLocked(projectRoot, runId, event, options = {}) {
  const current = readReviewBudgetEvents(projectRoot, runId);
  const sequence = current.length + 1;
  const eventId = `BE-${String(sequence).padStart(6, '0')}`;
  const nowValue = options.now || new Date();
  const recordedAt = nowValue instanceof Date ? nowValue.toISOString() : new Date(nowValue).toISOString();
  const candidate = parseLedgerEvent({
    schema_version: REVIEW_BUDGET_SCHEMA_VERSION,
    sequence,
    event_id: eventId,
    run_id: readAiRun(projectRoot, runId)?.run_id || String(runId || '').trim().toLowerCase(),
    recorded_at: recordedAt,
    ...event,
  });
  const redacted = redactSensitiveValue(candidate, { projectRoot });
  if (stableStringify(candidate) !== stableStringify(redacted)) {
    throw governanceError('REVIEW_BUDGET_AUDIT_INVALID', 'Review budget event contains sensitive values and cannot be persisted contractually.');
  }
  const dir = runReviewBudgetDir(projectRoot, runId);
  fs.mkdirSync(dir, { recursive: true });
  const fileName = `${String(sequence).padStart(6, '0')}-${eventId}.json`;
  const filePath = path.join(dir, fileName);
  const tempPath = path.join(dir, `.tmp-${process.pid}-${sequence}-${crypto.randomBytes(6).toString('hex')}`);
  try {
    fs.writeFileSync(tempPath, `${JSON.stringify(candidate, null, 2)}\n`, { flag: 'wx' });
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    if (fs.existsSync(tempPath)) fs.rmSync(tempPath);
    throw error;
  }
  return candidate;
}

function reduceReviewBudgetEvents(events = []) {
  const reservations = new Map();
  const extensions = [];
  let retryCount = 0;

  for (const event of events) {
    if (event.kind === 'reservation') {
      if (reservations.has(event.reservation_id)) {
        throw governanceError(REVIEW_BUDGET_LEDGER_INVALID, `Duplicate review budget reservation '${event.reservation_id}'.`);
      }
      reservations.set(event.reservation_id, {
        reservation: event,
        attempt: 1,
        attempt_event_class: event.event_class,
        status: 'reserved',
        outcome: null,
      });
      continue;
    }
    if (event.kind === 'extension') {
      extensions.push(event);
      continue;
    }

    const state = reservations.get(event.reservation_id);
    if (!state) {
      throw governanceError(REVIEW_BUDGET_LEDGER_INVALID, `Review budget event references unknown reservation '${event.reservation_id}'.`);
    }
    if (event.request_envelope_digest !== state.reservation.request_envelope_digest) {
      throw governanceError(REVIEW_BUDGET_LEDGER_INVALID, `Review budget event changes request identity for '${event.reservation_id}'.`);
    }

    if (event.kind === 'retry-reservation') {
      if (state.status !== 'retry'
        || event.attempt !== state.attempt + 1
        || event.intent_digest !== state.reservation.intent_digest) {
        throw governanceError(REVIEW_BUDGET_LEDGER_INVALID, `Invalid retry reservation transition for '${event.reservation_id}'.`);
      }
      state.attempt = event.attempt;
      state.attempt_event_class = 'retry';
      state.status = 'reserved';
      state.outcome = null;
      continue;
    }

    if (state.status !== 'reserved' || event.attempt !== state.attempt) {
      throw governanceError(REVIEW_BUDGET_LEDGER_INVALID, `Reservation '${event.reservation_id}' has a duplicate or stale outcome.`);
    }
    const expectedClass = state.attempt === 1 ? state.reservation.event_class : 'retry';
    if (event.event_class !== expectedClass) {
      throw governanceError(REVIEW_BUDGET_LEDGER_INVALID, `Reservation '${event.reservation_id}' outcome class is inconsistent.`);
    }
    state.status = event.outcome;
    state.outcome = event;
    if (event.outcome === 'retry') retryCount += 1;
  }

  return {
    reservations: [...reservations.values()],
    extensions,
    retry_count: retryCount,
  };
}

function assertReviewBudgetHistoryVerified(projectRoot, runId, events, options = {}) {
  const governanceState = options.governanceState || readRunGovernance(projectRoot, runId);
  const canonicalReviews = Array.isArray(governanceState?.reviews) ? governanceState.reviews : [];
  const canonicalIds = canonicalReviews.map((review) => review?.review_id).filter(Boolean);
  const validIds = events
    .filter((event) => event.kind === 'outcome' && event.outcome === 'valid')
    .map((event) => event.review_id);
  const duplicateCanonicalIds = canonicalIds.filter((reviewId, index) => canonicalIds.indexOf(reviewId) !== index);
  const duplicateValidIds = validIds.filter((reviewId, index) => validIds.indexOf(reviewId) !== index);
  const canonicalSet = new Set(canonicalIds);
  const validSet = new Set(validIds);
  const allowedUnfinalizedReviewId = String(options.allowedUnfinalizedReviewId || '').trim() || null;
  const missingOutcomes = canonicalIds.filter((reviewId) => (
    !validSet.has(reviewId) && reviewId !== allowedUnfinalizedReviewId
  ));
  const orphanedOutcomes = validIds.filter((reviewId) => !canonicalSet.has(reviewId));
  const foreignReviews = canonicalReviews
    .filter((review) => review?.run_id !== runId)
    .map((review) => review?.review_id || null);

  if (duplicateCanonicalIds.length > 0
    || duplicateValidIds.length > 0
    || missingOutcomes.length > 0
    || orphanedOutcomes.length > 0
    || foreignReviews.length > 0) {
    throw governanceError(
      REVIEW_BUDGET_HISTORY_UNVERIFIED,
      'Canonical review history cannot be correlated one-to-one with valid review budget outcomes.',
      {
        run_id: runId,
        duplicate_canonical_review_ids: uniqueStrings(duplicateCanonicalIds),
        duplicate_valid_outcome_review_ids: uniqueStrings(duplicateValidIds),
        missing_outcome_review_ids: uniqueStrings(missingOutcomes),
        orphaned_outcome_review_ids: uniqueStrings(orphanedOutcomes),
        foreign_review_ids: uniqueStrings(foreignReviews),
        migration_owner: 'slice-06-integration-migration-docs',
      },
    );
  }
}

function assertNoPendingReviewBudgetReservations(projectRoot, runId) {
  const reduced = reduceReviewBudgetEvents(readReviewBudgetEvents(projectRoot, runId));
  const pending = reduced.reservations.filter((state) => state.status === 'reserved');
  if (pending.length > 0) {
    throw governanceError(
      'REVIEW_BUDGET_RESERVATION_PENDING',
      `Run '${runId}' has an in-progress review budget reservation.`,
      {
        run_id: runId,
        reservation_ids: pending.map((state) => state.reservation.reservation_id),
      },
    );
  }
}

function resolveBaseLimits(governance, profile = {}) {
  const effectiveProfile = String(profile.effective_profile || governance?.requested_profile || '').trim();
  const policyDigest = computePolicyDigest(governance);
  if ((profile.policy_digest && profile.policy_digest !== policyDigest)
    || (profile.policy_version && profile.policy_version !== governance?.policy?.version)) {
    throw governanceError('GOVERNANCE_STATE_INVALID', 'Review budget projection does not match the supplied governance policy.', {
      expected_policy_version: governance?.policy?.version || null,
      expected_policy_digest: policyDigest,
      actual_policy_version: profile.policy_version || null,
      actual_policy_digest: profile.policy_digest || null,
    });
  }
  const controls = governance?.policy?.profiles?.[effectiveProfile]?.technical_plan;
  const maxReviews = controls?.max_reviews;
  const maxFullRevisions = controls?.max_full_revisions;
  if (!Number.isInteger(maxReviews) || maxReviews < 0
    || !Number.isInteger(maxFullRevisions) || maxFullRevisions < 0) {
    throw governanceError('REVIEW_BUDGET_POLICY_INVALID', 'Effective governance profile does not define a valid technical-plan review budget.');
  }
  return {
    effective_profile: effectiveProfile,
    max_reviews: maxReviews,
    max_full_revisions: maxFullRevisions,
  };
}

function projectReviewBudget(events, options = {}) {
  const reduced = reduceReviewBudgetEvents(events);
  const base = resolveBaseLimits(options.governance, options.profile);
  const extensionReviews = reduced.extensions.reduce((sum, event) => sum + event.additional_reviews, 0);
  const consuming = reduced.reservations.filter((state) => state.status !== 'retry');
  const reviewCount = consuming.length;
  const fullRevisionCount = consuming.filter((state) => countsAsFullRevision(state.reservation.intent)).length;
  const targetedAmendmentCount = consuming
    .filter((state) => semanticClassForIntent(state.reservation.intent) === 'targeted').length;
  const externalReviewCount = consuming
    .filter((state) => state.reservation.intent.event_class === 'external').length;
  const invalidOutputCount = consuming.filter((state) => state.status === 'invalid-output').length;
  const pendingCount = consuming.filter((state) => state.status === 'reserved').length;
  const maxReviews = base.max_reviews + extensionReviews;
  const maxFullRevisions = base.max_full_revisions;
  const remainingReviews = Math.max(0, maxReviews - reviewCount);
  const remainingFullRevisions = Math.max(0, maxFullRevisions - fullRevisionCount);
  const exhausted = remainingReviews === 0;

  return {
    schema_version: REVIEW_BUDGET_SCHEMA_VERSION,
    run_id: options.runId || events[0]?.run_id || null,
    effective_profile: base.effective_profile,
    limits: {
      base_reviews: base.max_reviews,
      base_full_revisions: base.max_full_revisions,
      extended_reviews: extensionReviews,
      max_reviews: maxReviews,
      max_full_revisions: maxFullRevisions,
    },
    counts: {
      review_count: reviewCount,
      full_revision_count: fullRevisionCount,
      targeted_amendment_count: targetedAmendmentCount,
      external_review_count: externalReviewCount,
      invalid_output_count: invalidOutputCount,
      retry_count: reduced.retry_count,
      pending_reservation_count: pendingCount,
    },
    remaining: {
      reviews: remainingReviews,
      full_revisions: remainingFullRevisions,
    },
    exhausted,
    machine_codes: exhausted ? [REVIEW_BUDGET_EXHAUSTED, HUMAN_DECISION_REQUIRED] : [],
    next_actions: exhausted ? [...REVIEW_BUDGET_NEXT_ACTIONS] : [],
    event_count: events.length,
  };
}

function readReviewBudget(projectRoot, runId, options = {}) {
  const run = readAiRun(projectRoot, runId);
  const profile = options.governance
    ? assertRunBudgetBinding(run, options.governance, options.profile || {})
    : options.profile || {};
  const events = readReviewBudgetEvents(projectRoot, runId);
  return {
    events,
    projection: projectReviewBudget(events, {
      ...options,
      profile,
      runId: run?.run_id || runId,
    }),
  };
}

function exhaustionError(projection, dimension) {
  return governanceError(
    REVIEW_BUDGET_EXHAUSTED,
    `${REVIEW_BUDGET_EXHAUSTED}: ${HUMAN_DECISION_REQUIRED}. Review budget is exhausted; no provider was invoked.`,
    {
      machine_codes: [REVIEW_BUDGET_EXHAUSTED, HUMAN_DECISION_REQUIRED],
      exhausted_dimension: dimension,
      next_actions: [...REVIEW_BUDGET_NEXT_ACTIONS],
      budget: projection,
    },
  );
}

function assertRunBudgetBinding(run, governance, profile) {
  if (!run || run.status === 'closed') {
    throw governanceError('AI_RUN_CLOSED', `Review budget cannot mutate closed or missing run '${run?.run_id || 'unknown'}'.`);
  }
  const policyDigest = computePolicyDigest(governance);
  if ((profile.policy_digest && profile.policy_digest !== policyDigest)
    || (profile.policy_version && profile.policy_version !== governance?.policy?.version)) {
    throw governanceError('GOVERNANCE_STATE_INVALID', 'Review budget profile does not match the active governance policy.', {
      expected_policy_version: governance?.policy?.version || null,
      expected_policy_digest: policyDigest,
      actual_policy_version: profile.policy_version || null,
      actual_policy_digest: profile.policy_digest || null,
    });
  }
  const expected = {
    requested_profile: profile.requested_profile || run.governance?.requested_profile,
    effective_profile: profile.effective_profile || run.governance?.effective_profile,
    policy_version: governance.policy.version,
    policy_digest: policyDigest,
  };
  const mismatch = Object.entries(expected).find(([key, value]) => run.governance?.[key] !== value);
  if (mismatch) {
    throw governanceError('GOVERNANCE_STATE_INVALID', 'Review budget policy does not match the active run binding.', {
      field: mismatch[0],
      expected: mismatch[1],
      actual: run.governance?.[mismatch[0]] || null,
    });
  }
  return {
    ...profile,
    requested_profile: expected.requested_profile,
    effective_profile: expected.effective_profile,
    policy_version: expected.policy_version,
    policy_digest: expected.policy_digest,
  };
}

function assertTargetedIntentAgainstState(intent, governanceState) {
  if (semanticClassForIntent(intent) !== 'targeted') return;
  const knownFindingIds = new Set((governanceState?.findings || []).map((finding) => finding.finding_id));
  const unknownFindingIds = intent.finding_ids.filter((findingId) => !knownFindingIds.has(findingId));
  if (unknownFindingIds.length > 0) {
    throw governanceError('REVIEW_INTENT_INVALID', 'Targeted review intent references findings outside the current run.', {
      unknown_finding_ids: unknownFindingIds,
      base_review_id: intent.base_review_id,
    });
  }
}

function reservationResult(event, projection) {
  return {
    reservation_id: event.reservation_id,
    attempt: event.attempt,
    event_class: event.event_class,
    semantic_class: event.kind === 'reservation' ? event.semantic_class : null,
    request_envelope_digest: event.request_envelope_digest,
    intent_digest: event.intent_digest,
    intent: event.intent || null,
    budget: projection,
  };
}

function assertReviewBudgetReservationLocked(projectRoot, options = {}) {
  const run = readAiRun(projectRoot, options.runId);
  assertRunBudgetBinding(run, options.governance, options.profile || {});
  const current = readReviewBudget(projectRoot, run.run_id, {
    governance: options.governance,
    profile: options.profile || {},
  });
  assertReviewBudgetHistoryVerified(projectRoot, run.run_id, current.events, {
    allowedUnfinalizedReviewId: options.allowedUnfinalizedReviewId,
  });
  const reduced = reduceReviewBudgetEvents(current.events);
  const state = reduced.reservations.find((item) => item.reservation.reservation_id === options.reservationId);
  if (!state
    || state.status !== 'reserved'
    || state.attempt !== options.attempt
    || state.reservation.request_envelope_digest !== options.requestEnvelopeDigest) {
    throw governanceError('REVIEW_BUDGET_FINALIZATION_INVALID', 'Review budget reservation cannot be finalized from stale or mismatched state.', {
      reservation_id: options.reservationId || null,
      attempt: options.attempt || null,
    });
  }

  if (options.requireCurrent === true) {
    const governanceState = readRunGovernance(projectRoot, run.run_id);
    const currentReviewId = governanceState?.current_review_id || null;
    let currentIntent;
    try {
      currentIntent = classifyReviewIntent(state.reservation.intent, { currentReviewId });
      assertTargetedIntentAgainstState(currentIntent, governanceState);
    } catch (error) {
      if (error.code !== 'REVIEW_INTENT_INVALID') throw error;
      throw governanceError('REVIEW_REQUEST_STALE', 'Review intent no longer targets the current canonical review.', {
        reservation_id: state.reservation.reservation_id,
        cause: error.message,
      });
    }
    if (sha256Digest(stableStringify(currentIntent)) !== state.reservation.intent_digest) {
      throw governanceError('REVIEW_REQUEST_STALE', 'Review intent changed while the provider was running.');
    }
    const envelope = typeof options.requestEnvelope === 'function'
      ? options.requestEnvelope()
      : options.requestEnvelope;
    const currentDigest = computeReviewRequestEnvelopeDigest(envelope, currentIntent);
    if (currentDigest !== state.reservation.request_envelope_digest) {
      throw governanceError('REVIEW_REQUEST_STALE', 'Review candidate or request envelope changed while the provider was running.', {
        reservation_id: state.reservation.reservation_id,
        expected_request_envelope_digest: state.reservation.request_envelope_digest,
        actual_request_envelope_digest: currentDigest,
      });
    }
  }

  return state;
}

function reserveReviewBudget(projectRoot, options = {}) {
  const runId = String(options.runId || '').trim();
  const governance = options.governance;
  const profile = options.profile || {};
  if (!runId || !governance) {
    throw governanceError('REVIEW_BUDGET_CONTEXT_INVALID', 'Review budget reservation requires run and governance context.');
  }

  return withAiRunLock(projectRoot, runId, { command: options.command || 'ai review-plan budget reservation', now: options.now }, () => {
    const run = readAiRun(projectRoot, runId);
    assertRunBudgetBinding(run, governance, profile);
    const governanceState = readRunGovernance(projectRoot, run.run_id);
    const currentReviewId = governanceState?.current_review_id || null;
    const intent = classifyReviewIntent(options.intent, { currentReviewId });
    assertTargetedIntentAgainstState(intent, governanceState);
    const requestDigest = computeReviewRequestEnvelopeDigest(options.requestEnvelope, intent);
    if (typeof options.currentRequestEnvelope === 'function') {
      const currentRequestDigest = computeReviewRequestEnvelopeDigest(options.currentRequestEnvelope(), intent);
      if (currentRequestDigest !== requestDigest) {
        throw governanceError('REVIEW_REQUEST_STALE', 'Review request changed before its budget reservation could be committed.', {
          expected_request_envelope_digest: requestDigest,
          actual_request_envelope_digest: currentRequestDigest,
        });
      }
    }
    const intentDigest = sha256Digest(stableStringify(intent));
    const current = readReviewBudget(projectRoot, run.run_id, { governance, profile });
    assertReviewBudgetHistoryVerified(projectRoot, run.run_id, current.events, { governanceState });
    const reduced = reduceReviewBudgetEvents(current.events);
    const matching = reduced.reservations
      .filter((state) => state.reservation.request_envelope_digest === requestDigest
        && state.reservation.intent_digest === intentDigest)
      .at(-1);

    if (matching && ['reserved', 'valid'].includes(matching.status)) {
      throw governanceError(
        matching.status === 'reserved' ? 'REVIEW_REQUEST_IN_PROGRESS' : 'REVIEW_REQUEST_REPLAYED',
        `Review request envelope already has a ${matching.status} reservation.`,
        { reservation_id: matching.reservation.reservation_id, request_envelope_digest: requestDigest },
      );
    }

    const retryReservation = matching?.status === 'retry' ? matching : null;
    if (!retryReservation && semanticClassForIntent(intent) === 'full' && currentReviewId) {
      const priorCandidate = reduced.reservations.find((state) => (
        state.status === 'valid'
        &&
        semanticClassForIntent(state.reservation.intent) === 'full'
        && state.reservation.intent.candidate_id === intent.candidate_id
      ));
      if (priorCandidate) {
        throw governanceError(
          'REVIEW_INTENT_INVALID',
          'A later full review requires a complete new candidate; the current candidate was already reviewed.',
          {
            candidate_id: intent.candidate_id,
            prior_reservation_id: priorCandidate.reservation.reservation_id,
            governed_next_action: 'targeted-amendment',
          },
        );
      }
    }

    if (current.projection.remaining.reviews <= 0) {
      throw exhaustionError(current.projection, 'reviews');
    }
    if (countsAsFullRevision(intent) && current.projection.remaining.full_revisions <= 0) {
      throw exhaustionError(current.projection, 'full-revisions');
    }

    let event;
    if (retryReservation) {
      event = appendReviewBudgetEventLocked(projectRoot, run.run_id, {
        kind: 'retry-reservation',
        reservation_id: retryReservation.reservation.reservation_id,
        attempt: retryReservation.attempt + 1,
        event_class: 'retry',
        request_envelope_digest: requestDigest,
        intent_digest: intentDigest,
      }, options);
    } else {
      const nextReservationNumber = reduced.reservations.length + 1;
      event = appendReviewBudgetEventLocked(projectRoot, run.run_id, {
        kind: 'reservation',
        reservation_id: `BR-${String(nextReservationNumber).padStart(6, '0')}`,
        attempt: 1,
        event_class: intent.event_class,
        semantic_class: semanticClassForIntent(intent),
        request_envelope_digest: requestDigest,
        intent_digest: intentDigest,
        intent,
      }, options);
    }
    const updated = readReviewBudget(projectRoot, run.run_id, { governance, profile });
    return reservationResult(event, updated.projection);
  });
}

function finalizeReviewBudget(projectRoot, options = {}) {
  const runId = String(options.runId || '').trim();
  const apply = () => {
    const outcome = String(options.outcome || '').trim();
    const state = assertReviewBudgetReservationLocked(projectRoot, {
      ...options,
      requireCurrent: outcome === 'valid' && options.prevalidated !== true,
      allowedUnfinalizedReviewId: outcome === 'valid' ? options.reviewId : null,
    });
    const run = readAiRun(projectRoot, runId);
    if (outcome === 'valid') {
      const governanceState = readRunGovernance(projectRoot, run.run_id);
      const canonicalReview = governanceState?.reviews?.find((review) => review.review_id === options.reviewId);
      if (!canonicalReview || canonicalReview.run_id !== run.run_id) {
        throw governanceError('REVIEW_BUDGET_FINALIZATION_INVALID', 'Valid budget outcome requires a canonical review from the same run.', {
          review_id: options.reviewId || null,
          run_id: run.run_id,
        });
      }
    }
    const event = appendReviewBudgetEventLocked(projectRoot, run.run_id, {
      kind: 'outcome',
      reservation_id: state.reservation.reservation_id,
      attempt: state.attempt,
      event_class: state.attempt === 1 ? state.reservation.event_class : 'retry',
      request_envelope_digest: state.reservation.request_envelope_digest,
      outcome,
      received_payload: options.receivedPayload === true,
      failure_kind: outcome === 'retry' ? String(options.failureKind || '').trim() || null : null,
      review_id: String(options.reviewId || '').trim() || null,
    }, options);
    return {
      event,
      budget: readReviewBudget(projectRoot, run.run_id, {
        governance: options.governance,
        profile: options.profile || {},
      }).projection,
    };
  };

  if (options.locked === true) return apply();
  return withAiRunLock(projectRoot, runId, { command: options.command || 'ai review-plan budget finalization', now: options.now }, apply);
}

function extendReviewBudget(projectRoot, options = {}) {
  const runId = String(options.runId || '').trim();
  if ((typeof options.additionalReviews !== 'undefined' && Number(options.additionalReviews) !== 1)
    || (typeof options.additionalFullRevisions !== 'undefined' && Number(options.additionalFullRevisions) !== 0)) {
    throw governanceError('REVIEW_BUDGET_EXTENSION_INVALID', 'A v58 budget extension grants exactly one additional review and never changes the full-revision limit.');
  }

  return withAiRunLock(projectRoot, runId, { command: options.command || 'extend review budget', now: options.now }, () => {
    const run = readAiRun(projectRoot, runId);
    const profile = options.profile || {};
    const boundProfile = assertRunBudgetBinding(run, options.governance, profile);
    const current = readReviewBudget(projectRoot, run.run_id, {
      governance: options.governance,
      profile: boundProfile,
    });
    assertReviewBudgetHistoryVerified(projectRoot, run.run_id, current.events);
    const authorization = authorizeGovernanceAction({
      action: 'extend-review-budget',
      actor: options.actor,
      context: {
        run_creator: run.governance_actors?.run_creator || null,
        reviewer: run.governance_actors?.reviewer || null,
        executor: run.governance_actors?.executor || null,
      },
      governance: options.governance,
      profile: boundProfile.effective_profile,
    });
    if (!authorization.authorized) {
      throw governanceError(authorization.code, authorization.message, authorization.evidence);
    }
    const event = appendReviewBudgetEventLocked(projectRoot, run.run_id, {
      kind: 'extension',
      additional_reviews: 1,
      actor_id: authorization.evidence.actor_id,
      policy_version: authorization.evidence.policy_version,
      policy_digest: authorization.evidence.policy_digest,
      authorization_evidence: authorization.evidence,
    }, options);
    return {
      event,
      authorization,
      budget: readReviewBudget(projectRoot, run.run_id, {
        governance: options.governance,
        profile: boundProfile,
      }).projection,
    };
  });
}

function formatReviewBudget(projection) {
  if (!projection) return '';
  const lines = [
    'Review budget:',
    `- Reviews: ${projection.counts.review_count}/${projection.limits.max_reviews}`,
    `- Full revisions: ${projection.counts.full_revision_count}/${projection.limits.max_full_revisions}`,
    `- Targeted amendments: ${projection.counts.targeted_amendment_count}`,
    `- External reviews: ${projection.counts.external_review_count}`,
    `- Invalid outputs: ${projection.counts.invalid_output_count}`,
    `- Technical retries: ${projection.counts.retry_count}`,
    `- Pending reservations: ${projection.counts.pending_reservation_count}`,
    `- Authorized extensions: ${projection.limits.extended_reviews}`,
  ];
  if (projection.exhausted) {
    lines.push(
      `- Codes: ${projection.machine_codes.join(', ')}`,
      `- Governed next actions: ${projection.next_actions.join(', ')}`,
    );
  }
  return `${lines.join('\n')}\n`;
}

module.exports = {
  HUMAN_DECISION_REQUIRED,
  REVIEW_BUDGET_EXHAUSTED,
  REVIEW_BUDGET_HISTORY_UNVERIFIED,
  REVIEW_BUDGET_LEDGER_INVALID,
  REVIEW_BUDGET_NEXT_ACTIONS,
  REVIEW_BUDGET_SCHEMA_VERSION,
  assertNoPendingReviewBudgetReservations,
  assertReviewBudgetHistoryVerified,
  classifyReviewIntent,
  computeReviewRequestEnvelopeDigest,
  assertReviewBudgetReservationLocked,
  extendReviewBudget,
  finalizeReviewBudget,
  formatReviewBudget,
  projectReviewBudget,
  readReviewBudget,
  readReviewBudgetEvents,
  reduceReviewBudgetEvents,
  reserveReviewBudget,
  sha256Digest,
};
