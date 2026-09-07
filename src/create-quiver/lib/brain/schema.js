const crypto = require('node:crypto');
const path = require('node:path');
const { z } = require('zod');

const { containsSensitiveText, isCredentialStructuredKey } = require('../ai/artifacts');

const BRAIN_SCHEMA_VERSION = 1;
const MAX_REQUEST_BYTES = 4 * 1024 * 1024;
const MAX_REQUEST_ITEMS = 10_000;

const RECORD_TYPES = Object.freeze([
  'verified-fact',
  'requirement',
  'decision',
  'assumption',
  'risk',
  'finding',
  'constraint',
  'learning',
  'release',
  'incident',
]);

const AUTHORITIES = Object.freeze([
  'policy',
  'approved-decision',
  'requirement',
  'authorized-input',
  'agent-assumption',
]);

const AUTHORITY_GRANTS = Object.freeze({
  policy: 'brain.policy.write',
  'approved-decision': 'brain.decision.write',
  requirement: 'brain.requirement.write',
  'authorized-input': 'brain.input.write',
  'agent-assumption': null,
});

const RECEIPT_STATES = Object.freeze([
  'current',
  'rejected',
  'revoked',
  'superseded',
  'expired',
  'stale',
  'unknown',
]);

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const DIGEST_PATTERN = /^[a-f0-9]{64}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const OPERATIONAL_KEYS = new Set([
  'lease',
  'leaseid',
  'leaseexpiresat',
  'heartbeat',
  'heartbeatat',
  'stdout',
  'stderr',
  'tooltrace',
  'tooltraces',
  'executiontrace',
  'runtimepid',
  'processid',
]);

class BrainValidationError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'BrainValidationError';
    this.code = code;
    this.details = details;
  }
}

function normalizeKey(value) {
  return String(value || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function assertJsonValue(value, currentPath = '$', seen = new WeakSet()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new BrainValidationError('VALIDATION_FAILED', 'Brain input contains a non-finite number.', { path: currentPath });
    }
    return;
  }
  if (!value || typeof value !== 'object' || value instanceof Date || Buffer.isBuffer(value)) {
    throw new BrainValidationError('VALIDATION_FAILED', 'Brain input must contain JSON values only.', { path: currentPath });
  }
  if (seen.has(value)) {
    throw new BrainValidationError('VALIDATION_FAILED', 'Brain input cannot contain cycles.', { path: currentPath });
  }
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertJsonValue(item, `${currentPath}[${index}]`, seen));
  } else {
    for (const [key, item] of Object.entries(value)) {
      if (typeof item === 'undefined') {
        throw new BrainValidationError('VALIDATION_FAILED', 'Brain input cannot contain undefined values.', { path: `${currentPath}.${key}` });
      }
      assertJsonValue(item, `${currentPath}.${key}`, seen);
    }
  }
  seen.delete(value);
}

function assertNoSensitiveOrOperationalValue(value, currentPath = '$', seen = new WeakSet()) {
  if (typeof value === 'string') {
    if (containsSensitiveText(value)) {
      throw new BrainValidationError('SECRET_DETECTED', 'Brain input contains secret-like material.', { path: currentPath });
    }
    return;
  }
  if (!value || typeof value !== 'object') return;
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSensitiveOrOperationalValue(item, `${currentPath}[${index}]`, seen));
  } else {
    for (const [key, item] of Object.entries(value)) {
      const normalized = normalizeKey(key);
      if (isCredentialStructuredKey(key) || normalized === 'authorization') {
        throw new BrainValidationError('SECRET_DETECTED', 'Brain input contains a credential-bearing field.', { path: `${currentPath}.${key}` });
      }
      if (OPERATIONAL_KEYS.has(normalized)) {
        throw new BrainValidationError('VALIDATION_FAILED', 'Operational runtime state is not durable Brain knowledge.', { path: `${currentPath}.${key}`, reason: 'operational-state-excluded' });
      }
      assertNoSensitiveOrOperationalValue(item, `${currentPath}.${key}`, seen);
    }
  }
  seen.delete(value);
}

function assertRequestBounds(value) {
  assertJsonValue(value);
  const bytes = Buffer.byteLength(JSON.stringify(value), 'utf8');
  if (bytes > MAX_REQUEST_BYTES) {
    throw new BrainValidationError('VALIDATION_FAILED', 'Brain request exceeds the 4 MiB input limit.', { bytes, limit: MAX_REQUEST_BYTES });
  }
  return bytes;
}

function isSafeRelativePosixPath(value) {
  if (typeof value !== 'string' || value.length === 0 || value.includes('\\') || value.includes('\0')) return false;
  if (value.startsWith('/') || /^[A-Za-z]:/.test(value) || value.startsWith('file:')) return false;
  const segments = value.split('/');
  return !segments.some((segment) => !segment || segment === '.' || segment === '..')
    && path.posix.normalize(value) === value;
}

const idSchema = z.string().regex(ID_PATTERN);
const digestSchema = z.string().regex(DIGEST_PATTERN);
const timestampSchema = z.string().refine((value) => {
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}, 'timestamp must be exact ISO 8601 UTC');
const relativePathSchema = z.string().max(2048).refine(isSafeRelativePosixPath, 'unsafe relative path');

const refSchema = z.object({
  id: idSchema,
  digest: digestSchema,
  path: relativePathSchema.optional(),
  uri: z.string().url().max(2048).refine((value) => {
    try {
      const parsed = new URL(value);
      return !parsed.username && !parsed.password && parsed.protocol !== 'file:';
    } catch {
      return false;
    }
  }, 'URI cannot contain credentials or use file:').optional(),
}).strict().superRefine((value, context) => {
  if (value.path && value.uri) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Ref cannot contain both path and uri.' });
  }
});

const claimSchema = z.object({
  subject: idSchema,
  predicate: idSchema,
  value: z.unknown(),
}).strict();

const recordInputSchema = z.object({
  id: idSchema,
  type: z.enum(RECORD_TYPES),
  payload: z.unknown(),
  source_refs: z.array(refSchema).max(MAX_REQUEST_ITEMS),
  authority_request: z.enum(AUTHORITIES),
  supersedes: z.array(idSchema).max(MAX_REQUEST_ITEMS).optional(),
  claim: claimSchema.optional(),
  evidence_refs: z.array(refSchema).max(MAX_REQUEST_ITEMS),
  approval_ref: refSchema.optional(),
}).strict();

const mutationContextSchema = z.object({
  operation_id: idSchema,
  expected_revision: z.number().int().nonnegative(),
}).strict();

const querySchema = z.object({
  ids: z.array(idSchema).max(MAX_REQUEST_ITEMS).optional(),
  types: z.array(z.enum(RECORD_TYPES)).max(RECORD_TYPES.length).optional(),
  validity: z.enum(['active', 'superseded', 'all']).optional(),
  limit: z.number().int().positive().max(1000).optional(),
}).strict();

const grantSchema = z.object({
  action: idSchema,
  target_id: idSchema.optional(),
}).strict();

const actorResolutionSchema = z.object({
  actor_id: idSchema,
  verified: z.boolean(),
  project_id: idSchema,
  grants: z.array(grantSchema).max(MAX_REQUEST_ITEMS),
  evidence_refs: z.array(refSchema).max(MAX_REQUEST_ITEMS),
}).strict();

const receiptActorSchema = z.object({
  actor_id: idSchema,
  evidence_refs: z.array(refSchema).min(1).max(MAX_REQUEST_ITEMS),
}).strict();

const cloudDecisionReceiptSchema = z.object({
  schema_version: z.literal(1),
  type: z.literal('cloud-decision-receipt'),
  id: idSchema,
  organization_id: idSchema,
  project_id: idSchema,
  decision_ref: refSchema,
  subject: z.object({ ref: refSchema, version: z.number().int().positive() }).strict(),
  knowledge_digest: digestSchema,
  action: idSchema,
  actor: receiptActorSchema,
  policy: z.object({ ref: refSchema, rule: idSchema }).strict(),
  resolution: z.enum(['allowed', 'rejected']),
  resolved_at: timestampSchema,
  expires_at: timestampSchema.nullable(),
  evidence_refs: z.array(refSchema).min(1).max(MAX_REQUEST_ITEMS),
  digest: digestSchema,
}).strict();

const evidenceResultSchema = z.object({
  schema_version: z.literal(1),
  status: z.enum(['passed', 'blocked', 'failed', 'not-tested', 'capability-unavailable']),
  code: z.string(),
  data: z.object({
    receipt: cloudDecisionReceiptSchema,
    source_revision: z.number().int().nonnegative(),
    checked_at: timestampSchema,
    state: z.enum(RECEIPT_STATES),
  }).strict().nullable(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }).strict()),
  evidence_status: z.enum(['verified', 'claimed', 'unknown', 'unverified', 'not-tested', 'failed']),
}).strict();

const provenanceSchema = z.object({
  actor_id: idSchema,
  actor_evidence_refs: z.array(refSchema),
  authority_evidence_refs: z.array(refSchema),
  approval_actor_id: idSchema.nullable(),
  approval_ref: refSchema.nullable(),
  knowledge_digest: digestSchema,
}).strict();

const storedRecordSchema = z.object({
  schema_version: z.literal(1),
  id: idSchema,
  type: z.enum(RECORD_TYPES),
  payload: z.unknown(),
  source_refs: z.array(refSchema),
  created_at: timestampSchema,
  authority: z.enum(AUTHORITIES),
  validity: z.literal('active'),
  supersedes: z.array(idSchema),
  claim: claimSchema.nullable(),
  evidence_refs: z.array(refSchema),
  approval_ref: refSchema.nullable(),
  provenance: provenanceSchema,
  digest: digestSchema,
}).strict();

const manifestSchema = z.object({
  schema_version: z.literal(1),
  project_id: z.string().regex(UUID_PATTERN),
  revision: z.number().int().nonnegative(),
  record_refs: z.array(refSchema),
  proposal_refs: z.array(refSchema),
  operation_refs: z.array(refSchema),
  digest: digestSchema,
}).strict();

const operationSchema = z.object({
  schema_version: z.literal(1),
  id: idSchema,
  method: z.literal('brain.append'),
  input_digest: digestSchema,
  record_ref: refSchema,
  revision: z.number().int().positive(),
  created_at: timestampSchema,
  digest: digestSchema,
}).strict();

const journalSnapshotSchema = z.object({
  digest: digestSchema,
  base64: z.string(),
}).strict();

const commitJournalSchema = z.object({
  schema_version: z.literal(1),
  kind: z.literal('brain-manifest-commit'),
  project_id: z.string().regex(UUID_PATTERN),
  operation_id: idSchema,
  prepared_at: timestampSchema,
  before: journalSnapshotSchema,
  after: journalSnapshotSchema,
  record_ref: refSchema,
  operation_ref: refSchema,
  digest: digestSchema,
}).strict();

function canonicalizeJson(value, seen = new WeakSet()) {
  assertJsonValue(value, '$', seen);
  if (Array.isArray(value)) return value.map((item) => canonicalizeJson(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalizeJson(value[key])]));
  }
  return value;
}

function canonicalStringify(value) {
  return JSON.stringify(canonicalizeJson(value));
}

function canonicalDigest(value, excludedField = '') {
  const input = value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).filter(([key]) => key !== excludedField))
    : value;
  return crypto.createHash('sha256').update(canonicalStringify(input), 'utf8').digest('hex');
}

function parseSchema(schema, value, label = 'Brain input') {
  const result = schema.safeParse(value);
  if (!result.success) {
    const unsafePath = result.error.issues.some((issue) => issue.message.includes('unsafe relative path'));
    throw new BrainValidationError(
      unsafePath ? 'UNSAFE_PATH' : 'VALIDATION_FAILED',
      `${label} is invalid.`,
      { issues: result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })) },
    );
  }
  return result.data;
}

function validateRecordInput(value) {
  assertRequestBounds(value);
  assertNoSensitiveOrOperationalValue(value);
  const parsed = parseSchema(recordInputSchema, value, 'Brain record');
  const supersedes = parsed.supersedes || [];
  if (new Set(supersedes).size !== supersedes.length || supersedes.includes(parsed.id)) {
    throw new BrainValidationError('REFERENCE_INVALID', 'Brain supersedes references must be unique and cannot reference the new record.', { record_id: parsed.id });
  }
  return parsed;
}

module.exports = {
  AUTHORITIES,
  AUTHORITY_GRANTS,
  BRAIN_SCHEMA_VERSION,
  BrainValidationError,
  DIGEST_PATTERN,
  MAX_REQUEST_BYTES,
  MAX_REQUEST_ITEMS,
  RECEIPT_STATES,
  RECORD_TYPES,
  actorResolutionSchema,
  assertJsonValue,
  assertNoSensitiveOrOperationalValue,
  assertRequestBounds,
  canonicalDigest,
  canonicalStringify,
  cloudDecisionReceiptSchema,
  commitJournalSchema,
  evidenceResultSchema,
  manifestSchema,
  mutationContextSchema,
  operationSchema,
  parseSchema,
  querySchema,
  refSchema,
  storedRecordSchema,
  timestampSchema,
  validateRecordInput,
};
