const fs = require('node:fs');
const path = require('node:path');
const { z } = require('zod');

const { createBrainStore, readManifest } = require('./store');
const {
  AUTHORITIES,
  BrainValidationError,
  MAX_REQUEST_BYTES,
  MAX_REQUEST_ITEMS,
  assertJsonValue,
  assertRequestBounds,
  canonicalDigest,
  canonicalStringify,
  parseSchema,
  refSchema,
  timestampSchema,
} = require('./schema');

const INSTRUCTION_AUTHORITIES = new Set(['policy', 'approved-decision', 'requirement']);
const AUTHORITY_PRIORITY = new Map(AUTHORITIES.map((authority, index) => [authority, index]));
const AUTHORIZED_MANIFESTS = new WeakMap();
const idSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/);
const relativePathSchema = z.string().max(2048).refine((value) => {
  if (!value || value.includes('\\') || value.includes('\0') || value.startsWith('/')
      || /^[A-Za-z]:/.test(value) || value.startsWith('file:')) return false;
  const segments = value.split('/');
  return !segments.some((segment) => !segment || segment === '.' || segment === '..')
    && path.posix.normalize(value) === value;
}, 'unsafe relative path');

class ContextSelectionError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ContextSelectionError';
    this.code = code;
    this.details = details;
  }
}

const taskSchema = z.object({
  id: idSchema,
  requirement_ids: z.array(idSchema).max(MAX_REQUEST_ITEMS),
  module_paths: z.array(relativePathSchema).max(MAX_REQUEST_ITEMS),
  mandatory_refs: z.array(refSchema).max(MAX_REQUEST_ITEMS),
  budget_bytes: z.number().int().positive().max(MAX_REQUEST_BYTES),
  question: z.string().min(1).max(MAX_REQUEST_BYTES).optional(),
}).strict();

const confidenceSchema = z.object({
  score: z.number().min(0).max(1).nullable(),
  basis: z.enum(['evidence', 'inferred', 'unknown']),
  evidence_refs: z.array(refSchema).max(MAX_REQUEST_ITEMS),
}).strict();

const contextEntrySchema = z.object({
  ref: refSchema,
  authority: z.enum(AUTHORITIES),
  validity: z.enum(['active', 'superseded', 'expired', 'unknown']),
  confidence: confidenceSchema,
  reason: z.string().min(1),
  mandatory: z.boolean(),
  bytes: z.number().int().nonnegative(),
}).strict();

const contextContentSchema = z.object({
  ref: refSchema,
  content: z.unknown(),
}).strict();

const contradictionSchema = z.object({
  subject: idSchema,
  predicate: idSchema,
  refs: z.array(refSchema).min(2).max(MAX_REQUEST_ITEMS),
  status: z.enum(['unresolved', 'resolved']),
  resolution_ref: refSchema.nullable(),
}).strict();

const contextManifestSchema = z.object({
  schema_version: z.literal(1),
  task_id: idSchema,
  task: taskSchema,
  source_refs: z.array(refSchema).max(MAX_REQUEST_ITEMS),
  selected: z.array(contextEntrySchema).max(MAX_REQUEST_ITEMS),
  excluded: z.array(contextEntrySchema).max(MAX_REQUEST_ITEMS),
  trusted_instructions: z.array(contextContentSchema).max(MAX_REQUEST_ITEMS),
  untrusted_content: z.array(contextContentSchema).max(MAX_REQUEST_ITEMS),
  byte_counts: z.object({
    budget: z.number().int().nonnegative(),
    selected: z.number().int().nonnegative(),
    mandatory: z.number().int().nonnegative(),
    excluded: z.number().int().nonnegative(),
  }).strict(),
  contradictions: z.array(contradictionSchema).max(MAX_REQUEST_ITEMS),
  created_at: timestampSchema,
  digest: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();

const selectionMetadataSchema = z.object({
  requirement_ids: z.array(idSchema).max(MAX_REQUEST_ITEMS).optional(),
  module_paths: z.array(relativePathSchema).max(MAX_REQUEST_ITEMS).optional(),
}).passthrough();

function result(status, code, data, errors = [], evidenceStatus = 'verified') {
  return {
    schema_version: 1,
    status,
    code,
    data,
    errors,
    evidence_status: evidenceStatus,
  };
}

function success(data) {
  return result('passed', 'OK', data);
}

function failure(error) {
  const code = error?.code || 'STORAGE_FAILED';
  const blocked = new Set([
    'ACTOR_UNVERIFIED',
    'CAPABILITY_UNAVAILABLE',
    'CONTEXT_BUDGET_EXCEEDED',
    'CONTEXT_STALE',
    'POLICY_DENIED',
    'REFERENCE_INVALID',
    'REVISION_CONFLICT',
    'UNSAFE_PATH',
  ]);
  return result(blocked.has(code) ? 'blocked' : 'failed', code, null, [{
    code,
    message: error?.message || 'Context selection failed.',
    ...(error?.details && Object.keys(error.details).length > 0 ? { details: error.details } : {}),
  }], ['ACTOR_UNVERIFIED', 'POLICY_DENIED'].includes(code) ? 'unverified' : 'failed');
}

function nowIso(clock) {
  const value = typeof clock === 'function' ? clock() : new Date();
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new BrainValidationError('VALIDATION_FAILED', 'Context clock returned an invalid timestamp.');
  }
  return date.toISOString();
}

function refKey(ref) {
  return canonicalStringify(ref);
}

function compareRefs(left, right) {
  const leftKey = refKey(left);
  const rightKey = refKey(right);
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
}

function assertUnique(values, key, label) {
  const seen = new Set();
  for (const value of values) {
    const current = key(value);
    if (seen.has(current)) {
      throw new ContextSelectionError('REFERENCE_INVALID', `${label} must be unique.`, { duplicate: current });
    }
    seen.add(current);
  }
}

function validateTask(value) {
  assertRequestBounds(value);
  const task = parseSchema(taskSchema, value, 'Context task');
  assertUnique(task.requirement_ids, (item) => item, 'Context task requirement IDs');
  assertUnique(task.module_paths, (item) => item, 'Context task module paths');
  assertUnique(task.mandatory_refs, (ref) => `${ref.id}:${ref.digest}`, 'Context task mandatory refs');
  return task;
}

function validateContextManifest(value) {
  assertJsonValue(value);
  const manifest = parseSchema(contextManifestSchema, value, 'Context manifest');
  if (manifest.task_id !== manifest.task.id) {
    throw new ContextSelectionError('VALIDATION_FAILED', 'Context task identity does not match task_id.');
  }
  validateTask(manifest.task);

  assertUnique(manifest.source_refs, refKey, 'Context source refs');
  const entries = [...manifest.selected, ...manifest.excluded];
  assertUnique(entries, (entry) => refKey(entry.ref), 'Context selected and excluded refs');
  const sourceKeys = new Set(manifest.source_refs.map(refKey));
  const entryKeys = new Set(entries.map((entry) => refKey(entry.ref)));
  if (sourceKeys.size !== entryKeys.size || [...sourceKeys].some((key) => !entryKeys.has(key))) {
    throw new ContextSelectionError('REFERENCE_INVALID', 'Context source refs must exactly match selected and excluded refs.');
  }
  if (manifest.excluded.some((entry) => entry.mandatory)) {
    throw new ContextSelectionError('CONTEXT_BUDGET_EXCEEDED', 'Mandatory context cannot be silently excluded.');
  }

  const contents = [...manifest.trusted_instructions, ...manifest.untrusted_content];
  assertUnique(contents, (item) => refKey(item.ref), 'Context content refs');
  const selectedByKey = new Map(manifest.selected.map((entry) => [refKey(entry.ref), entry]));
  if (contents.length !== manifest.selected.length
      || contents.some((item) => !selectedByKey.has(refKey(item.ref)))) {
    throw new ContextSelectionError('REFERENCE_INVALID', 'Context content must partition selected refs exactly once.');
  }

  for (const item of contents) {
    assertJsonValue(item.content);
    const entry = selectedByKey.get(refKey(item.ref));
    const bytes = Buffer.byteLength(canonicalStringify(item.content), 'utf8');
    if (entry.bytes !== bytes) {
      throw new ContextSelectionError('VALIDATION_FAILED', 'Context entry byte count does not match canonical UTF-8 content.', {
        ref: item.ref.id,
      });
    }
  }
  for (const item of manifest.trusted_instructions) {
    const entry = selectedByKey.get(refKey(item.ref));
    if (entry.validity !== 'active' || !INSTRUCTION_AUTHORITIES.has(entry.authority)) {
      throw new ContextSelectionError('POLICY_DENIED', 'Only active verified instruction authority can be trusted.', {
        ref: item.ref.id,
      });
    }
  }

  const selectedBytes = manifest.selected.reduce((total, entry) => total + entry.bytes, 0);
  const mandatoryBytes = manifest.selected
    .filter((entry) => entry.mandatory)
    .reduce((total, entry) => total + entry.bytes, 0);
  const excludedBytes = manifest.excluded.reduce((total, entry) => total + entry.bytes, 0);
  if (manifest.byte_counts.budget !== manifest.task.budget_bytes
      || manifest.byte_counts.selected !== selectedBytes
      || manifest.byte_counts.mandatory !== mandatoryBytes
      || manifest.byte_counts.excluded !== excludedBytes
      || selectedBytes > manifest.task.budget_bytes) {
    throw new ContextSelectionError('VALIDATION_FAILED', 'Context manifest byte totals are inconsistent.');
  }
  if (manifest.digest !== canonicalDigest(manifest, 'digest')) {
    throw new ContextSelectionError('DIGEST_MISMATCH', 'Context manifest digest does not match canonical bytes.');
  }
  return manifest;
}

function canonicalProjectRoot(projectRoot) {
  const resolved = path.resolve(projectRoot || '');
  return fs.existsSync(resolved) ? fs.realpathSync(resolved) : resolved;
}

function authorizeContextManifest(manifest, scope) {
  const validated = validateContextManifest(manifest);
  AUTHORIZED_MANIFESTS.set(validated, {
    digest: validated.digest,
    projectId: scope.projectId,
    projectRoot: canonicalProjectRoot(scope.projectRoot),
  });
  return validated;
}

function assertAuthorizedContextManifest(manifest, options = {}) {
  const provenance = manifest && typeof manifest === 'object'
    ? AUTHORIZED_MANIFESTS.get(manifest)
    : null;
  if (!provenance) {
    throw new ContextSelectionError('POLICY_DENIED', 'Context pack requires a manifest produced by the trusted context selector.');
  }
  if (typeof options.projectRoot !== 'string' || !options.projectRoot.trim()) {
    throw new ContextSelectionError('POLICY_DENIED', 'Context manifest project scope is required.');
  }
  const expectedRoot = canonicalProjectRoot(options.projectRoot);
  if (provenance.projectRoot !== expectedRoot) {
    throw new ContextSelectionError('POLICY_DENIED', 'Context manifest belongs to a different project.', {
      reason: 'foreign-project-context',
    });
  }
  let currentManifest;
  try {
    currentManifest = readManifest(expectedRoot);
  } catch (error) {
    throw new ContextSelectionError(error?.code || 'POLICY_DENIED', 'Context manifest project scope is unavailable.', {
      reason: 'project-context-unavailable',
    });
  }
  if (currentManifest.project_id !== provenance.projectId) {
    throw new ContextSelectionError('POLICY_DENIED', 'Context manifest project identity does not match the current Brain.', {
      reason: 'foreign-project-context',
    });
  }
  validateContextManifest(manifest);
  if (manifest.digest !== provenance.digest) {
    throw new ContextSelectionError('CONTEXT_STALE', 'Authorized context manifest changed after selection.');
  }
  return manifest;
}

function isAuthorizedContextManifest(manifest, options = {}) {
  try {
    assertAuthorizedContextManifest(manifest, options);
    return true;
  } catch {
    return false;
  }
}

function canonicalContent(value) {
  return JSON.parse(canonicalStringify(value));
}

function canonicalUniqueRefs(refs) {
  const unique = new Map();
  for (const ref of refs) unique.set(refKey(ref), ref);
  return [...unique.values()].sort(compareRefs);
}

function recordConfidence(record) {
  const evidenceRefs = canonicalUniqueRefs([
    ...(record.evidence_refs || []),
    ...(record.provenance?.authority_evidence_refs || []),
  ]);
  return {
    score: null,
    basis: evidenceRefs.length > 0 ? 'evidence' : 'unknown',
    evidence_refs: evidenceRefs,
  };
}

function readSelectionMetadata(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: true, requirementIds: [], modulePaths: [] };
  }
  const parsed = selectionMetadataSchema.safeParse(payload);
  if (!parsed.success) return { valid: false, requirementIds: [], modulePaths: [] };
  const requirementIds = parsed.data.requirement_ids || [];
  const modulePaths = parsed.data.module_paths || [];
  if (new Set(requirementIds).size !== requirementIds.length
      || new Set(modulePaths).size !== modulePaths.length) {
    return { valid: false, requirementIds: [], modulePaths: [] };
  }
  return { valid: true, requirementIds, modulePaths };
}

function requestedRefMatches(canonicalRef, requestedRef) {
  return canonicalRef.id === requestedRef.id
    && canonicalRef.digest === requestedRef.digest
    && (!requestedRef.path || requestedRef.path === canonicalRef.path)
    && (!requestedRef.uri || requestedRef.uri === canonicalRef.uri);
}

function noncurrentReason(record) {
  if (record.authority_check?.state && record.authority_check.state !== 'current') {
    return `noncurrent-authority:${record.authority_check.state}`;
  }
  return `nonactive:${record.validity}`;
}

function isTrustedInstruction(record) {
  if (record.validity !== 'active' || !INSTRUCTION_AUTHORITIES.has(record.authority)) return false;
  if (record.authority === 'approved-decision' && record.approval_ref) {
    return record.authority_check?.state === 'current';
  }
  return true;
}

function selectionReason(record, metadata, task) {
  const requirementMatches = metadata.requirementIds
    .filter((id) => task.requirement_ids.includes(id));
  if (record.type === 'requirement' && task.requirement_ids.includes(record.id)) {
    requirementMatches.push(record.id);
  }
  const moduleMatches = metadata.modulePaths.filter((modulePath) => task.module_paths.includes(modulePath));
  const reasons = [];
  for (const id of [...new Set(requirementMatches)].sort()) reasons.push(`matches-task-requirement:${id}`);
  for (const modulePath of [...new Set(moduleMatches)].sort()) reasons.push(`matches-task-module:${modulePath}`);
  return reasons.join(';');
}

function makeEntry(candidate, reason, mandatory = candidate.mandatory) {
  return {
    ref: candidate.ref,
    authority: candidate.record.authority,
    validity: candidate.record.validity,
    confidence: recordConfidence(candidate.record),
    reason,
    mandatory,
    bytes: candidate.bytes,
  };
}

function candidateOrder(left, right) {
  if (left.mandatory !== right.mandatory) return left.mandatory ? -1 : 1;
  const authority = (AUTHORITY_PRIORITY.get(left.record.authority) ?? AUTHORITIES.length)
    - (AUTHORITY_PRIORITY.get(right.record.authority) ?? AUTHORITIES.length);
  if (authority !== 0) return authority;
  return compareRefs(left.ref, right.ref);
}

function createCandidates(snapshot, task) {
  const refs = snapshot.manifest.record_refs;
  assertUnique(refs, refKey, 'Brain manifest record refs');
  const recordsByRef = new Map();
  for (const record of snapshot.records) {
    const key = `${record.id}:${record.digest}`;
    if (recordsByRef.has(key)) {
      throw new ContextSelectionError('REFERENCE_INVALID', 'Brain snapshot contains duplicate records.', { record_id: record.id });
    }
    recordsByRef.set(key, record);
  }
  const candidates = refs.map((ref) => {
    const record = recordsByRef.get(`${ref.id}:${ref.digest}`);
    if (!record) {
      throw new ContextSelectionError('REFERENCE_INVALID', 'Brain manifest record is missing from the authorized snapshot.', {
        record_id: ref.id,
      });
    }
    const mandatory = task.mandatory_refs.some((requested) => requestedRefMatches(ref, requested));
    const metadata = readSelectionMetadata(record.payload);
    return {
      ref,
      record,
      mandatory,
      metadata,
      reason: metadata.valid ? selectionReason(record, metadata, task) : '',
      bytes: Buffer.byteLength(canonicalStringify(record.payload), 'utf8'),
    };
  });
  for (const requested of task.mandatory_refs) {
    if (!candidates.some((candidate) => requestedRefMatches(candidate.ref, requested))) {
      throw new ContextSelectionError('REFERENCE_INVALID', 'Mandatory context ref is not current canonical Brain knowledge.', {
        ref: requested.id,
        digest: requested.digest,
      });
    }
  }
  return candidates.sort(candidateOrder);
}

function assertMandatoryCurrent(candidate) {
  if (!candidate.mandatory || candidate.record.validity === 'active') return;
  const reason = candidate.record.authority_check?.state
    ? `approval-evidence-${candidate.record.authority_check.state === 'unknown' ? 'unavailable' : candidate.record.authority_check.state}`
    : 'mandatory-context-noncurrent';
  const code = candidate.record.authority === 'approved-decision' ? 'POLICY_DENIED' : 'REFERENCE_INVALID';
  throw new ContextSelectionError(code, 'Mandatory context is not currently authorized and active.', {
    ref: candidate.ref.id,
    reason,
  });
}

function buildManifest(snapshot, task, createdAt, projectRoot) {
  const candidates = createCandidates(snapshot, task);
  candidates.forEach(assertMandatoryCurrent);
  const mandatoryBytes = candidates
    .filter((candidate) => candidate.mandatory)
    .reduce((total, candidate) => total + candidate.bytes, 0);
  if (mandatoryBytes > task.budget_bytes) {
    throw new ContextSelectionError('CONTEXT_BUDGET_EXCEEDED', 'Mandatory context exceeds the task byte budget.', {
      budget_bytes: task.budget_bytes,
      mandatory_bytes: mandatoryBytes,
      mandatory_refs: candidates.filter((candidate) => candidate.mandatory).map((candidate) => candidate.ref.id),
    });
  }

  const selected = [];
  const excluded = [];
  const selectedContent = [];
  let selectedBytes = 0;
  for (const candidate of candidates) {
    if (candidate.record.validity !== 'active') {
      excluded.push(makeEntry(candidate, noncurrentReason(candidate.record), false));
      continue;
    }
    if (!candidate.mandatory && !candidate.metadata.valid) {
      excluded.push(makeEntry(candidate, 'invalid-selection-metadata', false));
      continue;
    }
    if (!candidate.mandatory && !candidate.reason) {
      excluded.push(makeEntry(candidate, 'not-relevant-to-task', false));
      continue;
    }
    if (!candidate.mandatory && selectedBytes + candidate.bytes > task.budget_bytes) {
      excluded.push(makeEntry(candidate, 'context-budget-exceeded', false));
      continue;
    }
    const reason = candidate.mandatory
      ? (candidate.reason ? `mandatory-ref;${candidate.reason}` : 'mandatory-ref')
      : candidate.reason;
    selected.push(makeEntry(candidate, reason));
    selectedContent.push({
      ref: candidate.ref,
      content: canonicalContent(candidate.record.payload),
      trusted: isTrustedInstruction(candidate.record),
    });
    selectedBytes += candidate.bytes;
  }

  const sourceRefs = candidates.map((candidate) => candidate.ref).sort(compareRefs);
  const manifestBase = {
    schema_version: 1,
    task_id: task.id,
    task,
    source_refs: sourceRefs,
    selected,
    excluded,
    trusted_instructions: selectedContent
      .filter((item) => item.trusted)
      .map(({ ref, content }) => ({ ref, content })),
    untrusted_content: selectedContent
      .filter((item) => !item.trusted)
      .map(({ ref, content }) => ({ ref, content })),
    byte_counts: {
      budget: task.budget_bytes,
      selected: selectedBytes,
      mandatory: mandatoryBytes,
      excluded: excluded.reduce((total, entry) => total + entry.bytes, 0),
    },
    contradictions: [],
    created_at: createdAt,
  };
  return authorizeContextManifest(
    { ...manifestBase, digest: canonicalDigest(manifestBase) },
    { projectId: snapshot.manifest.project_id, projectRoot },
  );
}

function createContextService(options = {}) {
  const store = options.store || createBrainStore(options);
  const clock = options.clock;
  const projectRoot = canonicalProjectRoot(options.projectRoot);

  async function select(taskValue) {
    try {
      const task = validateTask(taskValue);
      const snapshot = await store.completeAuthorizedSnapshot('context.read');
      if (!snapshot || snapshot.schema_version !== 1 || snapshot.status !== 'passed') {
        return snapshot && snapshot.schema_version === 1
          ? snapshot
          : failure(new ContextSelectionError('STORAGE_FAILED', 'Context selector received an invalid Brain result.'));
      }
      const scopedManifest = readManifest(projectRoot);
      if (scopedManifest.project_id !== snapshot.data.manifest.project_id
          || scopedManifest.digest !== snapshot.data.manifest.digest) {
        throw new ContextSelectionError('POLICY_DENIED', 'Authorized Brain snapshot belongs to a different project scope.', {
          reason: 'foreign-project-context',
        });
      }
      const manifest = buildManifest(snapshot.data, task, nowIso(clock), projectRoot);
      return success({ manifest });
    } catch (error) {
      return failure(error);
    }
  }

  return { select };
}

module.exports = {
  ContextSelectionError,
  assertAuthorizedContextManifest,
  contextManifestSchema,
  createContextService,
  isAuthorizedContextManifest,
  taskSchema,
  validateContextManifest,
  validateTask,
};
