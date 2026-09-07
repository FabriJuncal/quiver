const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { readProjectFileBytes } = require('../approvals');
const { quiverInternalPaths } = require('../init-layout');
const { withLock, withLockSync } = require('../locks');
const { assertProjectWriterAllowed } = require('../state');
const { createBrainAuthority } = require('./authority');
const {
  AUTHORITIES,
  BrainValidationError,
  canonicalDigest,
  canonicalStringify,
  commitJournalSchema,
  manifestSchema,
  mutationContextSchema,
  operationSchema,
  parseSchema,
  querySchema,
  storedRecordSchema,
  validateRecordInput,
} = require('./schema');

const BRAIN_LOCK = 'brain';
const MAX_JOURNAL_BYTES = 16 * 1024 * 1024;

class BrainStoreError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'BrainStoreError';
    this.code = code;
    this.details = details;
  }
}

function brainPaths(projectRoot) {
  const root = path.join(quiverInternalPaths(projectRoot).root, 'brain');
  return {
    root,
    manifestPath: path.join(root, 'manifest.json'),
    indexPath: path.join(root, 'index.json'),
    journalPath: path.join(root, 'commit.json'),
    recordsDir: path.join(root, 'records'),
    proposalsDir: path.join(root, 'proposals'),
    operationsDir: path.join(root, 'operations'),
  };
}

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
  return result('passed', 'OK', data, []);
}

function failure(error) {
  const code = error?.code || 'STORAGE_FAILED';
  const status = ['POLICY_DENIED', 'ACTOR_UNVERIFIED', 'CAPABILITY_UNAVAILABLE', 'SECRET_DETECTED', 'UNSAFE_PATH', 'REVISION_CONFLICT', 'IDEMPOTENCY_CONFLICT', 'LOCK_CONFLICT', 'RECOVERY_REQUIRED', 'REFERENCE_INVALID'].includes(code)
    ? 'blocked'
    : 'failed';
  return result(status, code, null, [{
    code,
    message: error?.message || 'Brain operation failed.',
    ...(error?.details && Object.keys(error.details).length > 0 ? { details: error.details } : {}),
  }], ['ACTOR_UNVERIFIED', 'POLICY_DENIED'].includes(code) ? 'unverified' : 'failed');
}

function nowIso(clock) {
  const value = typeof clock === 'function' ? clock() : new Date();
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new BrainValidationError('VALIDATION_FAILED', 'Brain clock returned an invalid timestamp.');
  }
  return date.toISOString();
}

function fsyncDirectory(dirPath) {
  let handle;
  try {
    handle = fs.openSync(dirPath, 'r');
    fs.fsyncSync(handle);
  } catch (error) {
    const unsupported = ['EINVAL', 'ENOTSUP'].includes(error?.code)
      || (process.platform === 'win32' && error?.code === 'EPERM');
    if (!unsupported) throw error;
  } finally {
    if (typeof handle === 'number') fs.closeSync(handle);
  }
}

function writeFileAtomic(filePath, bytes) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = path.join(path.dirname(filePath), `.tmp-${path.basename(filePath)}-${process.pid}-${crypto.randomBytes(6).toString('hex')}`);
  try {
    const handle = fs.openSync(tempPath, 'wx');
    try {
      fs.writeFileSync(handle, bytes);
      fs.fsyncSync(handle);
    } finally {
      fs.closeSync(handle);
    }
    fs.renameSync(tempPath, filePath);
    fsyncDirectory(path.dirname(filePath));
  } catch (error) {
    if (fs.existsSync(tempPath)) fs.rmSync(tempPath);
    throw error;
  }
}

function writeJsonAtomic(filePath, value) {
  writeFileAtomic(filePath, Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8'));
}

function removeDurable(filePath) {
  if (!fs.existsSync(filePath)) return;
  fs.rmSync(filePath);
  fsyncDirectory(path.dirname(filePath));
}

function pathInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

function findSymlinkComponent(projectRoot, targetPath) {
  const root = path.resolve(projectRoot);
  let current = path.resolve(targetPath);
  while (pathInside(root, current)) {
    try {
      if (fs.lstatSync(current).isSymbolicLink()) return current;
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
    if (current === root) break;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

function assertSafeNamespace(projectRoot, targetPath, label = 'Brain path') {
  const root = path.resolve(projectRoot);
  const target = path.resolve(targetPath);
  if (!pathInside(root, target)) {
    throw new BrainStoreError('UNSAFE_PATH', `${label} must remain inside the project root.`);
  }
  const symlink = findSymlinkComponent(root, target);
  if (symlink) {
    throw new BrainStoreError('UNSAFE_PATH', `${label} cannot use a symlinked path component.`, {
      path: path.relative(root, symlink).split(path.sep).join('/'),
    });
  }
  if (fs.existsSync(root)) {
    const realRoot = fs.realpathSync(root);
    let ancestor = target;
    while (!fs.existsSync(ancestor)) ancestor = path.dirname(ancestor);
    if (!pathInside(realRoot, fs.realpathSync(ancestor))) {
      throw new BrainStoreError('UNSAFE_PATH', `${label} resolves outside the project root.`);
    }
  }
  return target;
}

function assertCanonicalStoreNamespace(projectRoot) {
  const paths = brainPaths(projectRoot);
  const directories = [paths.root, paths.recordsDir, paths.proposalsDir, paths.operationsDir];
  const files = [paths.manifestPath, paths.indexPath, paths.journalPath];
  for (const directory of directories) {
    assertSafeNamespace(projectRoot, directory, 'Brain canonical directory');
    if (fs.existsSync(directory) && !fs.statSync(directory).isDirectory()) {
      throw new BrainStoreError('UNSAFE_PATH', 'Brain canonical directory is not a directory.');
    }
  }
  for (const filePath of files) {
    assertSafeNamespace(projectRoot, filePath, 'Brain canonical file');
    if (fs.existsSync(filePath) && !fs.statSync(filePath).isFile()) {
      throw new BrainStoreError('UNSAFE_PATH', 'Brain canonical file is not a regular file.');
    }
  }
  return paths;
}

function assertBrainInitialized(projectRoot) {
  const paths = assertCanonicalStoreNamespace(projectRoot);
  if (!fs.existsSync(paths.manifestPath)) {
    throw new BrainStoreError('CAPABILITY_UNAVAILABLE', 'Project Brain is not initialized; run explicit project init first.');
  }
  return paths;
}

function assertWriterAllowed(projectRoot, action, options = {}) {
  if (options.writerCheck === false) return;
  assertProjectWriterAllowed(projectRoot, { action });
}

function assertReferencePaths(projectRoot, refs) {
  for (const ref of refs) {
    if (!ref.path) continue;
    const target = assertSafeNamespace(projectRoot, path.join(projectRoot, ref.path), 'Brain reference path');
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      throw new BrainStoreError('REFERENCE_INVALID', 'Brain reference path does not name a file.', { ref_id: ref.id });
    }
    let source;
    try {
      source = readProjectFileBytes(projectRoot, ref.path, 'Brain reference');
    } catch {
      throw new BrainStoreError('UNSAFE_PATH', 'Brain reference path is unsafe.', { ref_id: ref.id });
    }
    if (source.sha256.replace(/^sha256:/, '') !== ref.digest) {
      throw new BrainStoreError('REFERENCE_INVALID', 'Brain reference digest does not match canonical bytes.', { ref_id: ref.id });
    }
  }
}

function withDigest(value) {
  return { ...value, digest: canonicalDigest(value) };
}

function parseDigestBound(schema, value, label) {
  const parsed = parseSchema(schema, value, label);
  if (parsed.digest !== canonicalDigest(parsed, 'digest')) {
    throw new BrainStoreError('DIGEST_MISMATCH', `${label} digest does not match its canonical value.`);
  }
  return parsed;
}

function manifestBytes(manifest) {
  return Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

function readManifest(projectRoot, options = {}) {
  const paths = assertCanonicalStoreNamespace(projectRoot);
  if (!fs.existsSync(paths.manifestPath)) {
    throw new BrainStoreError('CAPABILITY_UNAVAILABLE', 'Project Brain is not initialized. Run explicit project initialization first.');
  }
  if (!options.allowPending && fs.existsSync(paths.journalPath)) {
    throw new BrainStoreError('RECOVERY_REQUIRED', 'A pending Brain transaction requires explicit recovery.');
  }
  let value;
  try {
    value = JSON.parse(fs.readFileSync(paths.manifestPath, 'utf8'));
  } catch {
    throw new BrainStoreError('RECOVERY_REQUIRED', 'Brain manifest is not valid JSON.');
  }
  return parseDigestBound(manifestSchema, value, 'Brain manifest');
}

function internalRefPath(kind, uuid) {
  return `${kind}/${uuid}.json`;
}

function resolveInternalRef(projectRoot, ref, kind) {
  const pattern = new RegExp(`^${kind}/[0-9a-f-]{36}\\.json$`, 'i');
  if (!ref.path || !pattern.test(ref.path)) {
    throw new BrainStoreError('RECOVERY_REQUIRED', `Brain ${kind} reference uses a non-canonical path.`);
  }
  return assertSafeNamespace(projectRoot, path.join(brainPaths(projectRoot).root, ref.path), `Brain ${kind} path`);
}

function readStoredRecord(projectRoot, ref) {
  const filePath = resolveInternalRef(projectRoot, ref, 'records');
  let value;
  try {
    value = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    throw new BrainStoreError('RECOVERY_REQUIRED', 'An immutable Brain record is missing or invalid.', { record_id: ref.id });
  }
  const record = parseDigestBound(storedRecordSchema, value, 'Brain record');
  if (record.id !== ref.id || record.digest !== ref.digest) {
    throw new BrainStoreError('DIGEST_MISMATCH', 'Brain record reference does not match immutable record bytes.', { record_id: ref.id });
  }
  return record;
}

function readOperation(projectRoot, ref) {
  const filePath = resolveInternalRef(projectRoot, ref, 'operations');
  let value;
  try {
    value = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    throw new BrainStoreError('RECOVERY_REQUIRED', 'An immutable Brain operation is missing or invalid.', { operation_id: ref.id });
  }
  const operation = parseDigestBound(operationSchema, value, 'Brain operation');
  if (operation.id !== ref.id || operation.digest !== ref.digest) {
    throw new BrainStoreError('DIGEST_MISMATCH', 'Brain operation reference does not match immutable operation bytes.', { operation_id: ref.id });
  }
  return operation;
}

function loadRecords(projectRoot, manifest) {
  const ids = new Set();
  return manifest.record_refs.map((ref) => {
    if (ids.has(ref.id)) {
      throw new BrainStoreError('RECOVERY_REQUIRED', 'Brain manifest contains duplicate record IDs.', { record_id: ref.id });
    }
    ids.add(ref.id);
    return readStoredRecord(projectRoot, ref);
  });
}

function assertAcyclic(records) {
  const ids = new Set(records.map((record) => record.id));
  for (const record of records) {
    for (const target of record.supersedes) {
      if (!ids.has(target)) {
        throw new BrainStoreError('REFERENCE_INVALID', 'Brain supersedes target does not exist.', { record_id: record.id, target_id: target });
      }
    }
  }
  const visiting = new Set();
  const visited = new Set();
  const byId = new Map(records.map((record) => [record.id, record]));
  function visit(id) {
    if (visiting.has(id)) throw new BrainStoreError('REFERENCE_INVALID', 'Brain supersession graph contains a cycle.', { record_id: id });
    if (visited.has(id)) return;
    visiting.add(id);
    for (const target of byId.get(id)?.supersedes || []) visit(target);
    visiting.delete(id);
    visited.add(id);
  }
  records.forEach((record) => visit(record.id));
}

function baseRecordProjections(records) {
  assertAcyclic(records);
  const superseded = new Set(records.flatMap((record) => record.supersedes));
  return records.map((record) => ({
    ...record,
    validity: superseded.has(record.id) ? 'superseded' : 'active',
  }));
}

function buildIndex(manifest, records) {
  const indexValue = {
    schema_version: 1,
    manifest_digest: manifest.digest,
    revision: manifest.revision,
    records: baseRecordProjections(records).map((record) => ({
      id: record.id,
      type: record.type,
      authority: record.authority,
      validity: record.validity,
    })),
  };
  return withDigest(indexValue);
}

function rebuildIndexLocked(projectRoot, manifest) {
  const records = loadRecords(projectRoot, manifest);
  const index = buildIndex(manifest, records);
  writeJsonAtomic(brainPaths(projectRoot).indexPath, index);
  return index;
}

function emptyManifest(projectId) {
  return withDigest({
    schema_version: 1,
    project_id: projectId,
    revision: 0,
    record_refs: [],
    proposal_refs: [],
    operation_refs: [],
  });
}

function initializeBrainStore(projectRoot, options = {}) {
  const resolvedRoot = path.resolve(projectRoot);
  if (!fs.existsSync(resolvedRoot) || !fs.statSync(resolvedRoot).isDirectory()) {
    throw new BrainStoreError('UNSAFE_PATH', 'Brain initialization requires an existing project directory.');
  }
  assertWriterAllowed(resolvedRoot, 'initialize project brain', options);
  const paths = assertCanonicalStoreNamespace(resolvedRoot);
  return withLockSync(resolvedRoot, BRAIN_LOCK, { command: 'initialize project brain' }, () => {
    assertWriterAllowed(resolvedRoot, 'initialize project brain', options);
    assertCanonicalStoreNamespace(resolvedRoot);
    if (fs.existsSync(paths.manifestPath)) {
      const manifest = readManifest(resolvedRoot);
      return { created: false, manifest };
    }
    if (fs.existsSync(paths.root)) {
      const entries = fs.readdirSync(paths.root).filter((entry) => !['records', 'proposals', 'operations'].includes(entry));
      const nonEmptyChild = ['records', 'proposals', 'operations'].some((name) => {
        const dir = path.join(paths.root, name);
        return fs.existsSync(dir) && fs.readdirSync(dir).length > 0;
      });
      if (entries.length > 0 || nonEmptyChild) {
        throw new BrainStoreError('RECOVERY_REQUIRED', 'Existing Brain namespace cannot be initialized without inspection.');
      }
    }
    fs.mkdirSync(paths.recordsDir, { recursive: true });
    fs.mkdirSync(paths.proposalsDir, { recursive: true });
    fs.mkdirSync(paths.operationsDir, { recursive: true });
    const manifest = emptyManifest(options.projectId || crypto.randomUUID());
    parseSchema(manifestSchema, manifest, 'Brain manifest');
    writeJsonAtomic(paths.manifestPath, manifest);
    writeJsonAtomic(paths.indexPath, buildIndex(manifest, []));
    return { created: true, manifest };
  });
}

function readJournal(projectRoot) {
  const filePath = brainPaths(projectRoot).journalPath;
  if (!fs.existsSync(filePath)) return null;
  const bytes = fs.readFileSync(filePath);
  if (bytes.length > MAX_JOURNAL_BYTES) {
    throw new BrainStoreError('RECOVERY_REQUIRED', 'Brain recovery journal exceeds its bounded size.');
  }
  let value;
  try {
    value = JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new BrainStoreError('RECOVERY_REQUIRED', 'Brain recovery journal is not valid JSON.');
  }
  return parseDigestBound(commitJournalSchema, value, 'Brain recovery journal');
}

function decodeManifestSnapshot(snapshot, label) {
  let bytes;
  try {
    bytes = Buffer.from(snapshot.base64, 'base64');
    const parsed = parseDigestBound(manifestSchema, JSON.parse(bytes.toString('utf8')), label);
    if (parsed.digest !== snapshot.digest) throw new Error('digest mismatch');
    return { bytes, manifest: parsed };
  } catch {
    throw new BrainStoreError('RECOVERY_REQUIRED', `${label} is invalid.`);
  }
}

function recoverBrainStore(projectRoot) {
  try {
    assertWriterAllowed(projectRoot, 'recover project brain');
    assertBrainInitialized(projectRoot);
    return withLockSync(projectRoot, BRAIN_LOCK, { command: 'recover project brain' }, () => {
      assertWriterAllowed(projectRoot, 'recover project brain');
      assertCanonicalStoreNamespace(projectRoot);
      const journal = readJournal(projectRoot);
      if (!journal) return success({ recovered: false });
      const before = decodeManifestSnapshot(journal.before, 'Brain recovery before snapshot');
      const after = decodeManifestSnapshot(journal.after, 'Brain recovery after snapshot');
      if (journal.project_id !== before.manifest.project_id
          || journal.project_id !== after.manifest.project_id
          || after.manifest.revision !== before.manifest.revision + 1) {
        throw new BrainStoreError('RECOVERY_REQUIRED', 'Brain recovery journal has a foreign or invalid project transition.');
      }
      const record = readStoredRecord(projectRoot, journal.record_ref);
      const operation = readOperation(projectRoot, journal.operation_ref);
      if (!after.manifest.record_refs.some((ref) => ref.id === record.id && ref.digest === record.digest)
          || !after.manifest.operation_refs.some((ref) => ref.id === operation.id && ref.digest === operation.digest)) {
        throw new BrainStoreError('RECOVERY_REQUIRED', 'Brain recovery journal references are not present in the after manifest.');
      }
      const current = readManifest(projectRoot, { allowPending: true });
      if (current.digest === before.manifest.digest) {
        writeFileAtomic(brainPaths(projectRoot).manifestPath, after.bytes);
      } else if (current.digest !== after.manifest.digest) {
        throw new BrainStoreError('RECOVERY_REQUIRED', 'Brain manifest matches neither recovery snapshot.');
      }
      rebuildIndexLocked(projectRoot, after.manifest);
      removeDurable(brainPaths(projectRoot).journalPath);
      return success({ recovered: true, revision: after.manifest.revision });
    });
  } catch (error) {
    return failure(normalizeStoreError(error));
  }
}

function normalizeStoreError(error) {
  if (error?.code === 'ENOENT') {
    return new BrainStoreError('CAPABILITY_UNAVAILABLE', 'Project Brain is not initialized; run explicit project init first.');
  }
  if (error?.code) return error;
  if (/operation is locked/.test(String(error?.message || ''))) {
    return new BrainStoreError('LOCK_CONFLICT', 'Project Brain is locked by another writer.');
  }
  return new BrainStoreError('STORAGE_FAILED', 'Project Brain storage operation failed.');
}

function makeRecord(recordInput, authorization, createdAt) {
  return withDigest({
    schema_version: 1,
    id: recordInput.id,
    type: recordInput.type,
    payload: recordInput.payload,
    source_refs: recordInput.source_refs,
    created_at: createdAt,
    authority: recordInput.authority_request,
    validity: 'active',
    supersedes: recordInput.supersedes,
    claim: recordInput.claim || null,
    evidence_refs: recordInput.evidence_refs,
    approval_ref: recordInput.approval_ref || null,
    provenance: {
      actor_id: authorization.actor.actor_id,
      actor_evidence_refs: authorization.actor.evidence_refs,
      authority_evidence_refs: authorization.authorityEvidenceRefs,
      approval_actor_id: authorization.approvalActorId,
      approval_ref: recordInput.approval_ref || null,
      knowledge_digest: authorization.knowledgeDigest,
    },
  });
}

function createBrainStore(options = {}) {
  const projectRoot = path.resolve(options.projectRoot || '');
  const clock = options.clock;
  const authority = createBrainAuthority({
    projectRoot,
    actorResolver: options.actorResolver,
    evidenceResolver: options.evidenceResolver,
    clock,
  });
  const faultInjector = typeof options.faultInjector === 'function' ? options.faultInjector : () => {};

  async function append(recordValue, mutationValue) {
    try {
      const canonicalInput = validateRecordInput(recordValue);
      const recordInput = { ...canonicalInput, supersedes: canonicalInput.supersedes || [] };
      const mutation = parseSchema(mutationContextSchema, mutationValue, 'Brain mutation context');
      assertReferencePaths(projectRoot, [...recordInput.source_refs, ...recordInput.evidence_refs]);
      assertWriterAllowed(projectRoot, 'append project brain record');
      assertBrainInitialized(projectRoot);
      return await withLock(projectRoot, BRAIN_LOCK, { command: 'append project brain record' }, async () => {
        assertWriterAllowed(projectRoot, 'append project brain record');
        assertCanonicalStoreNamespace(projectRoot);
        const manifest = readManifest(projectRoot);
        const authorization = await authority.authorizeAppend(manifest.project_id, canonicalInput);
        const inputDigest = canonicalDigest({ method: 'brain.append', input: canonicalInput });
        const existingOperationRef = manifest.operation_refs.find((ref) => ref.id === mutation.operation_id);
        if (existingOperationRef) {
          const operation = readOperation(projectRoot, existingOperationRef);
          if (operation.input_digest !== inputDigest) {
            throw new BrainStoreError('IDEMPOTENCY_CONFLICT', 'Operation ID was already committed with different input.', { operation_id: mutation.operation_id });
          }
          const recordRef = manifest.record_refs.find((ref) => ref.id === operation.record_ref.id && ref.digest === operation.record_ref.digest);
          if (!recordRef) throw new BrainStoreError('RECOVERY_REQUIRED', 'Committed operation has no canonical record.');
          const record = readStoredRecord(projectRoot, recordRef);
          return success({ record, revision: operation.revision, replayed: true });
        }
        if (mutation.expected_revision !== manifest.revision) {
          throw new BrainStoreError('REVISION_CONFLICT', 'Expected Brain revision does not match current revision.', {
            expected_revision: mutation.expected_revision,
            current_revision: manifest.revision,
          });
        }
        const records = loadRecords(projectRoot, manifest);
        if (records.some((record) => record.id === recordInput.id)) {
          throw new BrainStoreError('REFERENCE_INVALID', 'Brain record ID already exists.', { record_id: recordInput.id });
        }
        const byId = new Map(records.map((record) => [record.id, record]));
        for (const targetId of recordInput.supersedes) {
          const target = byId.get(targetId);
          if (!target) throw new BrainStoreError('REFERENCE_INVALID', 'Brain supersedes target does not exist.', { target_id: targetId });
          if (AUTHORITIES.indexOf(recordInput.authority_request) > AUTHORITIES.indexOf(target.authority)) {
            throw new BrainStoreError('POLICY_DENIED', 'A weaker authority cannot supersede stronger knowledge.', { target_id: targetId });
          }
        }

        const createdAt = nowIso(clock);
        const record = makeRecord(recordInput, authorization, createdAt);
        parseDigestBound(storedRecordSchema, record, 'Brain record');
        assertAcyclic([...records, record]);
        const recordUuid = crypto.randomUUID();
        const operationUuid = crypto.randomUUID();
        const recordRef = { id: record.id, digest: record.digest, path: internalRefPath('records', recordUuid) };
        const operationBase = {
          schema_version: 1,
          id: mutation.operation_id,
          method: 'brain.append',
          input_digest: inputDigest,
          record_ref: recordRef,
          revision: manifest.revision + 1,
          created_at: createdAt,
        };
        const operation = withDigest(operationBase);
        parseDigestBound(operationSchema, operation, 'Brain operation');
        const operationRef = { id: operation.id, digest: operation.digest, path: internalRefPath('operations', operationUuid) };
        const nextManifest = withDigest({
          schema_version: 1,
          project_id: manifest.project_id,
          revision: manifest.revision + 1,
          record_refs: [...manifest.record_refs, recordRef],
          proposal_refs: manifest.proposal_refs,
          operation_refs: [...manifest.operation_refs, operationRef],
        });
        parseDigestBound(manifestSchema, nextManifest, 'Brain manifest');

        const paths = brainPaths(projectRoot);
        const recordPath = assertSafeNamespace(projectRoot, path.join(paths.root, recordRef.path), 'Brain immutable record path');
        const operationPath = assertSafeNamespace(projectRoot, path.join(paths.root, operationRef.path), 'Brain immutable operation path');
        writeJsonAtomic(recordPath, record);
        writeJsonAtomic(operationPath, operation);
        faultInjector('after-immutable-records');
        const beforeBytes = manifestBytes(manifest);
        const afterBytes = manifestBytes(nextManifest);
        const journal = withDigest({
          schema_version: 1,
          kind: 'brain-manifest-commit',
          project_id: manifest.project_id,
          operation_id: mutation.operation_id,
          prepared_at: createdAt,
          before: { digest: manifest.digest, base64: beforeBytes.toString('base64') },
          after: { digest: nextManifest.digest, base64: afterBytes.toString('base64') },
          record_ref: recordRef,
          operation_ref: operationRef,
        });
        parseDigestBound(commitJournalSchema, journal, 'Brain recovery journal');
        writeJsonAtomic(paths.journalPath, journal);
        faultInjector('after-journal');
        writeFileAtomic(paths.manifestPath, afterBytes);
        faultInjector('after-manifest');
        rebuildIndexLocked(projectRoot, nextManifest);
        faultInjector('after-index');
        removeDurable(paths.journalPath);
        return success({
          record: authorization.approvalCheck ? { ...record, authority_check: authorization.approvalCheck } : record,
          revision: nextManifest.revision,
          replayed: false,
        });
      });
    } catch (error) {
      return failure(normalizeStoreError(error));
    }
  }

  async function query(filterValue = {}) {
    try {
      const filter = parseSchema(querySchema, filterValue, 'Brain query');
      const manifest = readManifest(projectRoot);
      const actor = await authority.authorizeRead(manifest.project_id);
      const projections = baseRecordProjections(loadRecords(projectRoot, manifest));
      const refreshed = [];
      for (const projection of projections) {
        const authorityCheck = await authority.refreshRecordAuthority(manifest.project_id, actor.actor_id, projection);
        let validity = projection.validity;
        if (authorityCheck && authorityCheck.state !== 'current') {
          validity = authorityCheck.state === 'expired'
            ? 'expired'
            : authorityCheck.state === 'superseded'
              ? 'superseded'
              : 'unknown';
        }
        refreshed.push({
          ...projection,
          validity,
          ...(authorityCheck ? { authority_check: authorityCheck } : {}),
        });
      }
      const validity = filter.validity || 'active';
      const filtered = refreshed.filter((record) => (
        (!filter.ids || filter.ids.includes(record.id))
        && (!filter.types || filter.types.includes(record.type))
        && (validity === 'all' || record.validity === validity)
      ));
      const limit = filter.limit || 100;
      const records = filtered.slice(0, limit);
      return success({
        records,
        revision: manifest.revision,
        next_cursor: null,
        ...(filtered.length > limit ? { truncated: true, total: filtered.length } : {}),
      });
    } catch (error) {
      return failure(normalizeStoreError(error));
    }
  }

  async function initialize() {
    try {
      const initialized = initializeBrainStore(projectRoot, options);
      return success({ manifest: initialized.manifest, created: initialized.created });
    } catch (error) {
      return failure(normalizeStoreError(error));
    }
  }

  return {
    append,
    initialize,
    query,
    recover: async () => recoverBrainStore(projectRoot),
    readManifest: () => readManifest(projectRoot),
    rebuildIndex: () => {
      try {
        assertWriterAllowed(projectRoot, 'rebuild project brain index');
        assertBrainInitialized(projectRoot);
        return withLockSync(projectRoot, BRAIN_LOCK, { command: 'rebuild project brain index' }, () => {
          assertWriterAllowed(projectRoot, 'rebuild project brain index');
          assertCanonicalStoreNamespace(projectRoot);
          const manifest = readManifest(projectRoot);
          return success({ index: rebuildIndexLocked(projectRoot, manifest), revision: manifest.revision });
        });
      } catch (error) {
        return failure(normalizeStoreError(error));
      }
    },
  };
}

module.exports = {
  BRAIN_LOCK,
  BrainStoreError,
  assertCanonicalStoreNamespace,
  assertSafeNamespace,
  baseRecordProjections,
  brainPaths,
  createBrainStore,
  initializeBrainStore,
  readManifest,
  recoverBrainStore,
};
