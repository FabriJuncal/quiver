const fs = require('node:fs');
const path = require('node:path');

const {
  assertSelectedDraftUsable,
  normalizePhase,
  readPhaseApproval,
  readProjectFileBytes,
  withPlannerApprovalLock,
} = require('../approvals');
const { quiverInternalPaths } = require('../init-layout');
const { assertProjectWriterAllowed } = require('../state');
const {
  COLLECTIONS,
  MAX_DRAFT_BYTES,
  analyzeDraftStructure,
  compareDraftStructure,
  sha256Bytes,
  writeFileImmutable,
} = require('./draft-integrity');
const {
  authorizeGovernanceAction,
  computePolicyDigest,
  stableStringify,
} = require('./review-governance');
const { readAiRun, withAiRunLock } = require('./run-state');

const EFFECTIVE_CONTRACT_VERSION = 1;
const MAX_EFFECTIVE_RECORDS = 10000;
const RECORD_ID = /^EC-\d{6,}$/;
const OPERATION_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/;
const COLLECTION_KEYS = Object.freeze({
  requirements: ['requirements'],
  acceptance_criteria: ['acceptance_criteria', 'acceptance'],
  slices: ['slices'],
});

function compareCodeUnits(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function lockDate(value) {
  if (!value) return undefined;
  return value instanceof Date ? value : new Date(value);
}

function effectiveError(code, message, details = {}) {
  const error = new Error(`create-quiver: ${code}: ${message}`);
  error.code = code;
  error.details = details;
  return error;
}

function exactKeys(value, required, optional = []) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return required.every((key) => keys.includes(key))
    && keys.every((key) => required.includes(key) || optional.includes(key));
}

function canonicalClone(value, label = 'value') {
  try {
    return JSON.parse(stableStringify(value));
  } catch (error) {
    throw effectiveError('VALIDATION_FAILED', `${label} must be a finite JSON value`, { cause: error.message });
  }
}

function effectiveContractRoot(projectRoot, phase) {
  return path.join(quiverInternalPaths(projectRoot).root, 'approvals', normalizePhase(phase), 'effective-contracts');
}

function effectiveContractRecordsDir(projectRoot, phase) {
  return path.join(effectiveContractRoot(projectRoot, phase), 'records');
}

function recordPath(projectRoot, phase, sequence) {
  return path.join(effectiveContractRecordsDir(projectRoot, phase), `${String(sequence).padStart(6, '0')}.json`);
}

function assertSafeStorePath(projectRoot, phase, targetFile = null) {
  const root = path.resolve(projectRoot);
  const recordsDir = path.resolve(effectiveContractRecordsDir(projectRoot, phase));
  const relative = path.relative(root, recordsDir);
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw effectiveError('UNSAFE_PATH', 'effective contract store must remain inside the project root');
  }
  let current = root;
  for (const component of relative.split(path.sep)) {
    current = path.join(current, component);
    if (!fs.existsSync(current)) break;
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw effectiveError('UNSAFE_PATH', 'effective contract store cannot contain symlinks or non-directory ancestors', {
        path: path.relative(root, current).split(path.sep).join('/'),
      });
    }
  }
  if (targetFile && fs.existsSync(targetFile)) {
    const stat = fs.lstatSync(targetFile);
    if (stat.isSymbolicLink() || !stat.isFile()) {
      throw effectiveError('UNSAFE_PATH', 'effective contract record target must be a regular project file', {
        path: path.relative(root, targetFile).split(path.sep).join('/'),
      });
    }
  }
}

function identityKind(id) {
  if (/^(?:V\d+-RQ-\d+|RQ-\d+)$/.test(id)) return 'requirements';
  if (/^AC-\d+(?:-[A-Za-z0-9_-]+)*$/.test(id)) return 'acceptance_criteria';
  if (/^slice-\d+(?:-[A-Za-z0-9_-]+)*$/.test(id)) return 'slices';
  return null;
}

function normalizeIdentity(value, label) {
  if (!exactKeys(value, ['collection', 'id'])) {
    throw effectiveError('VALIDATION_FAILED', `${label} must contain only collection and id`);
  }
  const collection = String(value.collection || '');
  const id = String(value.id || '');
  if (!COLLECTIONS.includes(collection) || identityKind(id) !== collection) {
    throw effectiveError('VALIDATION_FAILED', `${label} has an invalid stable identity`, { collection, id });
  }
  return { collection, id };
}

function identityKey(value) {
  return `${value.collection}:${value.id}`;
}

function normalizeIdentityList(values, label) {
  if (!Array.isArray(values) || values.length > MAX_EFFECTIVE_RECORDS) {
    throw effectiveError('VALIDATION_FAILED', `${label} must be a bounded array`);
  }
  const normalized = values.map((value, index) => normalizeIdentity(value, `${label}[${index}]`));
  const keys = normalized.map(identityKey);
  if (new Set(keys).size !== keys.length) {
    throw effectiveError('VALIDATION_FAILED', `${label} contains duplicate identities`);
  }
  return normalized.sort((left, right) => compareCodeUnits(identityKey(left), identityKey(right)));
}

function identityFromValue(collection, value, style, label) {
  if (style === 'acceptance') {
    if (typeof value !== 'string') {
      throw effectiveError('VALIDATION_FAILED', `${label} must be an AC-ID string`);
    }
    const ids = [...value.matchAll(/AC-\d+(?:-[A-Za-z0-9_-]+)*/g)].map((match) => match[0]);
    if (ids.length !== 1) {
      throw effectiveError('VALIDATION_FAILED', `${label} must contain exactly one acceptance identity`);
    }
    return ids[0];
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw effectiveError('VALIDATION_FAILED', `${label} must be a structured object`);
  }
  const field = collection === 'slices' ? 'slice_id' : 'id';
  return String(value[field] || '');
}

function normalizeOperation(operation, index) {
  const label = `operations[${index}]`;
  const op = String(operation?.op || '');
  const required = op === 'remove' ? ['op', 'collection', 'id'] : ['op', 'collection', 'id', 'value'];
  if (!['add', 'replace', 'remove'].includes(op) || !exactKeys(operation, required)) {
    throw effectiveError('VALIDATION_FAILED', `${label} must be a strict add, replace or remove operation`);
  }
  const identity = normalizeIdentity({
    collection: operation.collection,
    id: operation.id,
  }, label);
  const normalized = { op, ...identity };
  if (op !== 'remove') normalized.value = canonicalClone(operation.value, `${label}.value`);
  return normalized;
}

function normalizeRequest(request, kindOverride) {
  const required = ['operation_id', 'kind', 'parent', 'input', 'operations', 'affected_identities', 'removals'];
  if (!exactKeys(request, required)) {
    throw effectiveError('VALIDATION_FAILED', 'effective contract request has unknown or missing fields');
  }
  const kind = kindOverride || String(request.kind || '');
  if (!['addendum', 'amendment'].includes(kind) || (kindOverride && request.kind !== kindOverride)) {
    throw effectiveError('VALIDATION_FAILED', `unsupported effective contract kind '${request.kind || 'missing'}'`);
  }
  const operationId = String(request.operation_id || '');
  if (!OPERATION_ID.test(operationId)) {
    throw effectiveError('VALIDATION_FAILED', 'operation_id is invalid');
  }
  if (!exactKeys(request.input, ['path', 'sha256'])
      || typeof request.input.path !== 'string'
      || !DIGEST.test(String(request.input.sha256 || ''))) {
    throw effectiveError('VALIDATION_FAILED', 'input must bind an exact project path and digest');
  }
  const parentType = String(request.parent?.type || '');
  const parentKeys = parentType === 'draft'
    ? ['type', 'version', 'sha256']
    : ['type', 'record_id', 'sha256'];
  if (!['draft', 'effective-contract'].includes(parentType)
      || !exactKeys(request.parent, parentKeys)
      || !DIGEST.test(String(request.parent.sha256 || ''))
      || (parentType === 'draft' && (!Number.isInteger(request.parent.version) || request.parent.version <= 0))
      || (parentType === 'effective-contract' && !RECORD_ID.test(String(request.parent.record_id || '')))) {
    throw effectiveError('VALIDATION_FAILED', 'parent must bind one exact draft or effective-contract digest');
  }
  if (!Array.isArray(request.operations) || request.operations.length === 0
      || request.operations.length > MAX_EFFECTIVE_RECORDS) {
    throw effectiveError('VALIDATION_FAILED', 'operations must be a nonempty bounded array');
  }
  const operations = request.operations.map(normalizeOperation)
    .sort((left, right) => compareCodeUnits(`${identityKey(left)}:${left.op}`, `${identityKey(right)}:${right.op}`));
  const operationIdentities = operations.map(identityKey);
  if (new Set(operationIdentities).size !== operationIdentities.length) {
    throw effectiveError('VALIDATION_FAILED', 'one record cannot operate on the same identity more than once');
  }
  if (kind === 'addendum' && operations.some((operation) => operation.op !== 'add')) {
    throw effectiveError('VALIDATION_FAILED', 'addendum records only support additive operations');
  }
  const affectedIdentities = normalizeIdentityList(request.affected_identities, 'affected_identities');
  const removals = normalizeIdentityList(request.removals, 'removals');
  const affectedKeys = affectedIdentities.map(identityKey);
  const removalKeys = removals.map(identityKey);
  const expectedRemovalKeys = operations.filter((operation) => operation.op === 'remove').map(identityKey).sort();
  if (stableStringify(affectedKeys) !== stableStringify([...operationIdentities].sort())) {
    throw effectiveError('VALIDATION_FAILED', 'affected_identities must enumerate every exact operation identity');
  }
  if (stableStringify(removalKeys) !== stableStringify(expectedRemovalKeys)) {
    throw effectiveError('VALIDATION_FAILED', 'removals must enumerate every exact remove operation and nothing else');
  }
  const normalized = {
    operation_id: operationId,
    kind,
    parent: canonicalClone(request.parent),
    input: { path: request.input.path, sha256: request.input.sha256 },
    operations,
    affected_identities: affectedIdentities,
    removals,
  };
  if (Buffer.byteLength(stableStringify(normalized), 'utf8') > MAX_DRAFT_BYTES) {
    throw effectiveError('VALIDATION_FAILED', 'effective contract request exceeds the 4 MiB limit');
  }
  return normalized;
}

function collectionSlots(document, collection) {
  const keys = new Set(COLLECTION_KEYS[collection]);
  const slots = [];
  function visit(value, location = '$') {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => visit(entry, `${location}[${index}]`));
      return;
    }
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      const childLocation = `${location}.${key}`;
      if (keys.has(key)) {
        if (!Array.isArray(child)) {
          throw effectiveError('VALIDATION_FAILED', `supported collection ${childLocation} must be an array`);
        }
        slots.push({ array: child, location: childLocation, style: key === 'acceptance' ? 'acceptance' : 'structured' });
      }
      visit(child, childLocation);
    }
  }
  visit(document);
  if (slots.length === 0) {
    throw effectiveError('VALIDATION_FAILED', `supported collection '${collection}' is missing`);
  }
  if (slots.length > 1) {
    throw effectiveError('VALIDATION_FAILED', `supported collection '${collection}' is ambiguous`, {
      locations: slots.map((slot) => slot.location),
    });
  }
  return slots[0];
}

function applyOperations(parentDocument, operations, removals) {
  const document = canonicalClone(parentDocument, 'parent contract');
  const slotCache = new Map();
  for (const operation of operations) {
    const slot = slotCache.get(operation.collection) || collectionSlots(document, operation.collection);
    slotCache.set(operation.collection, slot);
    const matches = [];
    slot.array.forEach((value, index) => {
      const id = identityFromValue(operation.collection, value, slot.style, `${slot.location}[${index}]`);
      if (id === operation.id) matches.push(index);
    });
    if (matches.length > 1) {
      throw effectiveError('VALIDATION_FAILED', `identity '${identityKey(operation)}' is duplicated in its collection`);
    }
    if (operation.op === 'add') {
      if (matches.length !== 0) throw effectiveError('REVISION_CONFLICT', `identity '${identityKey(operation)}' already exists`);
      if (identityFromValue(operation.collection, operation.value, slot.style, 'operation value') !== operation.id) {
        throw effectiveError('VALIDATION_FAILED', `add value does not bind identity '${identityKey(operation)}'`);
      }
      slot.array.push(operation.value);
    } else if (operation.op === 'replace') {
      if (matches.length !== 1) throw effectiveError('REVISION_CONFLICT', `identity '${identityKey(operation)}' does not exist`);
      if (identityFromValue(operation.collection, operation.value, slot.style, 'operation value') !== operation.id) {
        throw effectiveError('VALIDATION_FAILED', `replacement changes identity '${identityKey(operation)}'`);
      }
      slot.array[matches[0]] = operation.value;
    } else {
      if (matches.length !== 1) throw effectiveError('REVISION_CONFLICT', `identity '${identityKey(operation)}' does not exist`);
      slot.array.splice(matches[0], 1);
    }
  }
  const rendered = `${stableStringify(document)}\n`;
  const analysis = analyzeDraftStructure(rendered);
  if (!analysis.supported || analysis.diagnostics.length > 0) {
    throw effectiveError('REFERENCE_INVALID', 'effective contract has invalid identities or references', {
      diagnostics: analysis.diagnostics,
    });
  }
  const comparison = compareDraftStructure(`${stableStringify(parentDocument)}\n`, rendered, { removals });
  if (comparison.status !== 'preserved') {
    throw effectiveError('REFERENCE_INVALID', 'effective contract does not preserve undeclared structure', {
      diagnostics: comparison.diagnostics,
    });
  }
  return { document, rendered, analysis, comparison };
}

function canonicalRecordDigest(record) {
  const { record_sha256: omitted, ...unsigned } = record;
  return sha256Bytes(Buffer.from(stableStringify(unsigned), 'utf8'));
}

function validTimestamp(value) {
  return typeof value === 'string'
    && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString() === value;
}

function validateStoredRecord(record, phase, expectedSequence) {
  const required = [
    'schema_version', 'record_id', 'sequence', 'phase', 'run_id', 'kind', 'operation_id',
    'request_sha256', 'parent', 'parent_effective_sha256', 'root', 'operations',
    'affected_identities', 'removals', 'actor', 'created_at', 'effective_sha256',
    'record_sha256',
  ];
  const parentType = String(record?.parent?.type || '');
  const parentKeys = parentType === 'draft'
    ? ['type', 'version', 'sha256']
    : ['type', 'record_id', 'sha256'];
  return exactKeys(record, required)
    && record.schema_version === EFFECTIVE_CONTRACT_VERSION
    && record.phase === phase
    && typeof record.run_id === 'string'
    && record.run_id.length > 0
    && record.sequence === expectedSequence
    && record.record_id === `EC-${String(expectedSequence).padStart(6, '0')}`
    && ['addendum', 'amendment'].includes(record.kind)
    && OPERATION_ID.test(record.operation_id)
    && DIGEST.test(record.request_sha256)
    && DIGEST.test(record.parent_effective_sha256)
    && DIGEST.test(record.effective_sha256)
    && DIGEST.test(record.record_sha256)
    && ['draft', 'effective-contract'].includes(parentType)
    && exactKeys(record.parent, parentKeys)
    && DIGEST.test(String(record.parent.sha256 || ''))
    && (parentType !== 'draft'
      || (Number.isInteger(record.parent.version) && record.parent.version > 0))
    && (parentType !== 'effective-contract'
      || RECORD_ID.test(String(record.parent.record_id || '')))
    && exactKeys(record.root, ['version', 'path', 'artifact_sha256', 'input'])
    && Number.isInteger(record.root.version)
    && record.root.version > 0
    && typeof record.root.path === 'string'
    && record.root.path.length > 0
    && DIGEST.test(String(record.root.artifact_sha256 || ''))
    && exactKeys(record.root.input, ['path', 'sha256'])
    && typeof record.root.input.path === 'string'
    && record.root.input.path.length > 0
    && DIGEST.test(String(record.root.input.sha256 || ''))
    && exactKeys(record.actor, [
      'actor_id', 'action', 'policy_version', 'policy_digest', 'verification',
    ])
    && typeof record.actor.actor_id === 'string'
    && record.actor.actor_id.length > 0
    && typeof record.actor.action === 'string'
    && record.actor.action.length > 0
    && typeof record.actor.policy_version === 'string'
    && record.actor.policy_version.length > 0
    && DIGEST.test(String(record.actor.policy_digest || ''))
    && ['verified', 'unverified'].includes(record.actor.verification)
    && validTimestamp(record.created_at)
    && canonicalRecordDigest(record) === record.record_sha256;
}

function parseRecord(projectRoot, phase, filePath, expectedSequence) {
  const relative = path.relative(projectRoot, filePath).split(path.sep).join('/');
  const bytes = readProjectFileBytes(projectRoot, relative, 'effective contract record');
  let record;
  try {
    record = JSON.parse(bytes.bytes.toString('utf8'));
  } catch (error) {
    throw effectiveError('RECOVERY_REQUIRED', 'effective contract record is not valid JSON', { cause: error.message });
  }
  if (!validateStoredRecord(record, phase, expectedSequence)) {
    throw effectiveError('RECOVERY_REQUIRED', 'effective contract record failed schema or digest verification', {
      record_id: record?.record_id || null,
    });
  }
  const normalized = normalizeRequest({
    operation_id: record.operation_id,
    kind: record.kind,
    parent: record.parent.type === 'draft'
      ? { type: 'draft', version: record.parent.version, sha256: record.parent.sha256 }
      : { type: 'effective-contract', record_id: record.parent.record_id, sha256: record.parent.sha256 },
    input: record.root.input,
    operations: record.operations,
    affected_identities: record.affected_identities,
    removals: record.removals,
  });
  if (stableStringify(normalized.operations) !== stableStringify(record.operations)
      || stableStringify(normalized.affected_identities) !== stableStringify(record.affected_identities)
      || stableStringify(normalized.removals) !== stableStringify(record.removals)) {
    throw effectiveError('RECOVERY_REQUIRED', 'effective contract record is not canonically ordered', {
      record_id: record.record_id,
    });
  }
  return record;
}

function readAllRecords(projectRoot, phase) {
  const normalizedPhase = normalizePhase(phase);
  const dir = effectiveContractRecordsDir(projectRoot, normalizedPhase);
  assertSafeStorePath(projectRoot, normalizedPhase);
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const unexpected = entries.find((entry) => !entry.isFile() || !/^\d{6,}\.json$/.test(entry.name));
  if (unexpected || entries.length > MAX_EFFECTIVE_RECORDS) {
    throw effectiveError('RECOVERY_REQUIRED', 'effective contract record directory is malformed', {
      entry: unexpected?.name || null,
    });
  }
  const names = entries.map((entry) => entry.name).sort();
  return names.map((name, index) => {
    const expectedSequence = index + 1;
    if (name !== `${String(expectedSequence).padStart(6, '0')}.json`) {
      throw effectiveError('RECOVERY_REQUIRED', 'effective contract record sequence has a gap or duplicate');
    }
    return parseRecord(projectRoot, normalizedPhase, path.join(dir, name), expectedSequence);
  });
}

function recordMapAndChildren(records) {
  const byId = new Map(records.map((record) => [record.record_id, record]));
  if (byId.size !== records.length) throw effectiveError('RECOVERY_REQUIRED', 'duplicate effective contract record identity');
  const childCounts = new Map();
  for (const record of records) {
    if (record.parent.type !== 'effective-contract') continue;
    if (!byId.has(record.parent.record_id)) {
      throw effectiveError('RECOVERY_REQUIRED', 'effective contract lineage has a missing parent', {
        record_id: record.record_id,
        parent_id: record.parent.record_id,
      });
    }
    childCounts.set(record.parent.record_id, (childCounts.get(record.parent.record_id) || 0) + 1);
    if (childCounts.get(record.parent.record_id) > 1) {
      throw effectiveError('RECOVERY_REQUIRED', 'effective contract lineage branches from a duplicate parent', {
        parent_id: record.parent.record_id,
      });
    }
  }
  const complete = new Set();
  for (const record of records) {
    const visiting = new Set();
    let current = record;
    while (current?.parent.type === 'effective-contract' && !complete.has(current.record_id)) {
      if (visiting.has(current.record_id)) {
        throw effectiveError('RECOVERY_REQUIRED', 'effective contract lineage contains a cycle', {
          record_id: current.record_id,
        });
      }
      visiting.add(current.record_id);
      current = byId.get(current.parent.record_id);
    }
    visiting.forEach((recordId) => complete.add(recordId));
  }
  return { byId, childCounts };
}

function selectedBinding(projectRoot, phase, runId) {
  const report = readPhaseApproval(projectRoot, phase);
  const bound = assertSelectedDraftUsable(projectRoot, phase, report.meta || {}, { runId });
  let document;
  try {
    document = JSON.parse(bound.artifact.bytes.toString('utf8'));
  } catch (error) {
    throw effectiveError('VALIDATION_FAILED', 'effective contracts require a structured JSON selected draft', {
      cause: error.message,
    });
  }
  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    throw effectiveError('VALIDATION_FAILED', 'effective contracts require a JSON object selected draft');
  }
  const analysis = analyzeDraftStructure(bound.artifact.bytes.toString('utf8'));
  if (!analysis.supported || analysis.diagnostics.length > 0) {
    throw effectiveError('VALIDATION_FAILED', 'selected draft is not a valid supported structured contract', {
      diagnostics: analysis.diagnostics,
    });
  }
  return { report, ...bound, document };
}

function rootMatches(record, selected) {
  return record.root.version === Number(selected.draft.version)
    && record.root.path === selected.artifact.path
    && record.root.artifact_sha256 === selected.artifact.sha256
    && record.root.input.path === selected.input.path
    && record.root.input.sha256 === selected.input.sha256;
}

function resolveLineage(projectRoot, phase, recordId, options = {}) {
  const records = readAllRecords(projectRoot, phase);
  const { byId, childCounts } = recordMapAndChildren(records);
  const target = byId.get(recordId);
  if (!target) throw effectiveError('VALIDATION_FAILED', `missing effective contract record '${recordId}'`);
  const selected = selectedBinding(projectRoot, phase, options.runId);
  if (!rootMatches(target, selected)) {
    throw effectiveError('REVISION_CONFLICT', 'effective contract root is not the selected current draft', {
      record_id: recordId,
    });
  }
  const reversed = [];
  const visited = new Set();
  let current = target;
  while (current) {
    if (visited.has(current.record_id)) {
      throw effectiveError('RECOVERY_REQUIRED', 'effective contract lineage contains a cycle', { record_id: current.record_id });
    }
    visited.add(current.record_id);
    reversed.push(current);
    if (current.parent.type === 'draft') {
      if (current.parent.version !== Number(selected.draft.version)
          || current.parent.sha256 !== selected.artifact.sha256) {
        throw effectiveError('DIGEST_MISMATCH', 'effective contract root parent no longer matches the selected draft');
      }
      current = null;
    } else {
      const parent = byId.get(current.parent.record_id);
      if (!parent || parent.record_sha256 !== current.parent.sha256
          || parent.effective_sha256 !== current.parent_effective_sha256) {
        throw effectiveError('DIGEST_MISMATCH', 'effective contract child does not match its exact parent', {
          record_id: current.record_id,
          parent_id: current.parent.record_id,
        });
      }
      current = parent;
    }
  }
  const lineage = reversed.reverse();
  let document = selected.document;
  let effectiveSha256 = sha256Bytes(Buffer.from(`${stableStringify(document)}\n`, 'utf8'));
  for (const record of lineage) {
    if ((options.runId && record.run_id !== options.runId) || !rootMatches(record, selected)) {
      throw effectiveError('DIGEST_MISMATCH', 'effective contract run, root draft or required input identity changed', {
        record_id: record.record_id,
      });
    }
    if (record.parent_effective_sha256 !== effectiveSha256) {
      throw effectiveError('DIGEST_MISMATCH', 'effective contract parent effective digest does not match', {
        record_id: record.record_id,
      });
    }
    const applied = applyOperations(document, record.operations, record.removals);
    document = applied.document;
    effectiveSha256 = sha256Bytes(Buffer.from(applied.rendered, 'utf8'));
    if (effectiveSha256 !== record.effective_sha256) {
      throw effectiveError('DIGEST_MISMATCH', 'effective contract content digest does not match its lineage', {
        record_id: record.record_id,
      });
    }
  }
  return {
    schema_version: EFFECTIVE_CONTRACT_VERSION,
    phase,
    record: target,
    lineage,
    current: (childCounts.get(target.record_id) || 0) === 0,
    document,
    contents: `${stableStringify(document)}\n`,
    effective_sha256: effectiveSha256,
  };
}

function withEffectiveContractLocks(projectRoot, phase, options, command, callback) {
  const now = lockDate(options.now);
  const phaseLocked = () => withPlannerApprovalLock(projectRoot, phase, { command, now }, callback);
  if (options.runLocked === true) return phaseLocked();
  return withAiRunLock(projectRoot, options.runId, { command, now }, phaseLocked);
}

function authorizeChange(projectRoot, runId, options) {
  const run = readAiRun(projectRoot, runId);
  const governance = options.governance;
  const profile = options.profile || {};
  if (!run || run.status === 'closed' || !governance) {
    throw effectiveError('POLICY_DENIED', 'effective contract mutation requires current run-bound authorization', {
      run_id: runId,
      authorized: false,
    });
  }
  const policyDigest = computePolicyDigest(governance);
  const expected = {
    requested_profile: profile.requested_profile || run.governance?.requested_profile,
    effective_profile: profile.effective_profile || run.governance?.effective_profile,
    policy_version: governance.policy?.version,
    policy_digest: policyDigest,
  };
  const mismatch = Object.entries(expected).find(([key, value]) => run.governance?.[key] !== value);
  if (mismatch) {
    throw effectiveError('POLICY_DENIED', 'effective contract authorization does not match the active run binding', {
      run_id: runId,
      field: mismatch[0],
      expected: mismatch[1],
      actual: run.governance?.[mismatch[0]] || null,
    });
  }
  const authorization = authorizeGovernanceAction({
    action: 'approve',
    actor: options.actor,
    governance,
    profile: expected.effective_profile,
    context: {
      run_creator: run.governance_actors?.run_creator || null,
      reviewer: run.governance_actors?.reviewer || null,
      executor: run.governance_actors?.executor || null,
    },
  });
  if (!authorization.authorized) {
    throw effectiveError('POLICY_DENIED', authorization.message, authorization.evidence);
  }
  if (authorization.evidence?.verified !== true) {
    throw effectiveError('POLICY_DENIED', 'effective contract mutation requires a verified policy-authorized actor', {
      ...authorization.evidence,
      authorized: false,
    });
  }
  return { run, evidence: authorization.evidence };
}

function createEffectiveContractChange(projectRoot, phase, request, options = {}) {
  const normalizedPhase = normalizePhase(phase);
  const runId = String(options.runId || '').trim();
  if (!runId) throw effectiveError('POLICY_DENIED', 'effective contract mutation requires an explicit run id');
  assertProjectWriterAllowed(projectRoot, { action: `create ${normalizedPhase} effective contract change` });
  const normalizedRequest = normalizeRequest(request, options.kind);
  return withEffectiveContractLocks(
    projectRoot,
    normalizedPhase,
    options,
    `create ${normalizedPhase} ${normalizedRequest.kind}`,
    () => {
      assertProjectWriterAllowed(projectRoot, { action: `create ${normalizedPhase} effective contract change` });
      const { evidence } = authorizeChange(projectRoot, runId, options);
      const selected = selectedBinding(projectRoot, normalizedPhase, runId);
      if (normalizedRequest.input.path !== selected.input.path
          || normalizedRequest.input.sha256 !== selected.input.sha256) {
        throw effectiveError('DIGEST_MISMATCH', 'effective contract request input is not the selected draft input');
      }
      const records = readAllRecords(projectRoot, normalizedPhase);
      const { childCounts } = recordMapAndChildren(records);
      const requestSha256 = sha256Bytes(Buffer.from(stableStringify({
        phase: normalizedPhase,
        run_id: runId,
        root_version: Number(selected.draft.version),
        request: normalizedRequest,
      }), 'utf8'));
      const replay = records.find((record) => record.operation_id === normalizedRequest.operation_id);
      if (replay) {
        if (replay.request_sha256 !== requestSha256) {
          throw effectiveError('IDEMPOTENCY_CONFLICT', 'operation_id was already used for different effective contract input');
        }
        return { ...resolveLineage(projectRoot, normalizedPhase, replay.record_id, { runId }), replayed: true };
      }
      const matching = records.filter((record) => rootMatches(record, selected));
      const heads = matching.filter((record) => (childCounts.get(record.record_id) || 0) === 0);
      if (heads.length > 1) {
        throw effectiveError('RECOVERY_REQUIRED', 'selected draft has multiple effective contract heads');
      }
      const head = heads[0] || null;
      if (head) {
        if (normalizedRequest.parent.type !== 'effective-contract'
            || normalizedRequest.parent.record_id !== head.record_id
            || normalizedRequest.parent.sha256 !== head.record_sha256) {
          throw effectiveError('REVISION_CONFLICT', 'effective contract request does not name the current exact parent', {
            expected_parent_id: head.record_id,
            expected_parent_sha256: head.record_sha256,
          });
        }
      } else if (normalizedRequest.parent.type !== 'draft'
          || normalizedRequest.parent.version !== Number(selected.draft.version)
          || normalizedRequest.parent.sha256 !== selected.artifact.sha256) {
        throw effectiveError('REVISION_CONFLICT', 'first effective contract record must name the selected exact draft parent');
      }
      const parentResolution = head
        ? resolveLineage(projectRoot, normalizedPhase, head.record_id, { runId })
        : {
            document: selected.document,
            contents: `${stableStringify(selected.document)}\n`,
            effective_sha256: sha256Bytes(Buffer.from(`${stableStringify(selected.document)}\n`, 'utf8')),
          };
      const applied = applyOperations(parentResolution.document, normalizedRequest.operations, normalizedRequest.removals);
      const sequence = records.length + 1;
      const recordId = `EC-${String(sequence).padStart(6, '0')}`;
      const nowValue = options.now || new Date();
      const createdAt = nowValue instanceof Date ? nowValue.toISOString() : new Date(nowValue).toISOString();
      if (!Number.isFinite(Date.parse(createdAt))) throw effectiveError('VALIDATION_FAILED', 'effective contract timestamp is invalid');
      const record = {
        schema_version: EFFECTIVE_CONTRACT_VERSION,
        record_id: recordId,
        sequence,
        phase: normalizedPhase,
        run_id: runId,
        kind: normalizedRequest.kind,
        operation_id: normalizedRequest.operation_id,
        request_sha256: requestSha256,
        parent: head
          ? { type: 'effective-contract', record_id: head.record_id, sha256: head.record_sha256 }
          : { type: 'draft', version: Number(selected.draft.version), sha256: selected.artifact.sha256 },
        parent_effective_sha256: parentResolution.effective_sha256,
        root: {
          version: Number(selected.draft.version),
          path: selected.artifact.path,
          artifact_sha256: selected.artifact.sha256,
          input: { path: selected.input.path, sha256: selected.input.sha256 },
        },
        operations: normalizedRequest.operations,
        affected_identities: normalizedRequest.affected_identities,
        removals: normalizedRequest.removals,
        actor: {
          actor_id: evidence.actor_id,
          action: evidence.action,
          policy_version: evidence.policy_version,
          policy_digest: evidence.policy_digest,
          verification: evidence.verified === true ? 'verified' : 'unverified',
        },
        created_at: createdAt,
        effective_sha256: sha256Bytes(Buffer.from(applied.rendered, 'utf8')),
        record_sha256: '',
      };
      record.record_sha256 = canonicalRecordDigest(record);
      const filePath = recordPath(projectRoot, normalizedPhase, sequence);
      assertSafeStorePath(projectRoot, normalizedPhase, filePath);
      writeFileImmutable(filePath, Buffer.from(`${JSON.stringify(record, null, 2)}\n`, 'utf8'));
      return { ...resolveLineage(projectRoot, normalizedPhase, recordId, { runId }), replayed: false };
    },
  );
}

function resolveEffectiveContract(projectRoot, phase, recordId, options = {}) {
  const normalizedPhase = normalizePhase(phase);
  const apply = () => resolveLineage(projectRoot, normalizedPhase, String(recordId || ''), options);
  if (options.phaseLocked === true) return apply();
  if (options.runId) {
    return withEffectiveContractLocks(projectRoot, normalizedPhase, options, `resolve ${normalizedPhase} effective contract`, apply);
  }
  return withPlannerApprovalLock(projectRoot, normalizedPhase, { command: `resolve ${normalizedPhase} effective contract` }, apply);
}

function readEffectiveContractRecord(projectRoot, phase, recordId, options = {}) {
  return resolveEffectiveContract(projectRoot, phase, recordId, options).record;
}

function deriveEffectiveContractReviewIntent(projectRoot, reference, options = {}) {
  if (!exactKeys(reference, ['phase', 'record_id'])) {
    throw effectiveError('REVIEW_INTENT_INVALID', 'effective contract review reference must contain only phase and record_id');
  }
  const phase = normalizePhase(reference.phase);
  if (phase !== 'technical-plan') {
    throw effectiveError('REVIEW_INTENT_INVALID', 'only technical-plan effective contracts use the review budget');
  }
  const resolved = resolveEffectiveContract(projectRoot, phase, reference.record_id, {
    runId: options.runId,
    runLocked: options.runLocked,
    phaseLocked: options.phaseLocked,
  });
  if (!resolved.current) {
    throw effectiveError('REVIEW_REQUEST_STALE', 'effective contract is not the current lineage head');
  }
  const baseReviewId = String(options.currentReviewId || '').trim();
  if (!/^R-\d{3,}$/.test(baseReviewId)) {
    throw effectiveError('REVIEW_INTENT_INVALID', 'effective contract targeted review requires the current canonical review');
  }
  const effectiveContract = {
    phase,
    record_id: resolved.record.record_id,
    record_sha256: resolved.record.record_sha256,
    effective_sha256: resolved.effective_sha256,
    input_sha256: resolved.record.root.input.sha256,
  };
  return {
    event_class: 'targeted',
    candidate_id: `effective-contract:${phase}:${effectiveContract.record_id}:${effectiveContract.effective_sha256}`,
    base_review_id: baseReviewId,
    finding_ids: [],
    sections: resolved.record.affected_identities.map(identityKey),
    effective_contract: effectiveContract,
  };
}

function verifyEffectiveContractReviewIntent(projectRoot, intent, options = {}) {
  const reference = intent?.effective_contract;
  if (!reference) return intent;
  const derived = deriveEffectiveContractReviewIntent(projectRoot, {
    phase: reference.phase,
    record_id: reference.record_id,
  }, options);
  if (stableStringify(derived) !== stableStringify(intent)) {
    throw effectiveError('REVIEW_REQUEST_STALE', 'effective contract review intent does not match immutable lineage');
  }
  return derived;
}

function createEffectiveAddendum(projectRoot, phase, request, options = {}) {
  return createEffectiveContractChange(projectRoot, phase, { ...request, kind: 'addendum' }, { ...options, kind: 'addendum' });
}

function createEffectiveAmendment(projectRoot, phase, request, options = {}) {
  return createEffectiveContractChange(projectRoot, phase, { ...request, kind: 'amendment' }, { ...options, kind: 'amendment' });
}

module.exports = {
  EFFECTIVE_CONTRACT_VERSION,
  createEffectiveAddendum,
  createEffectiveAmendment,
  createEffectiveContractChange,
  deriveEffectiveContractReviewIntent,
  effectiveContractRecordsDir,
  effectiveContractRoot,
  readEffectiveContractRecord,
  resolveEffectiveContract,
  verifyEffectiveContractReviewIntent,
};
