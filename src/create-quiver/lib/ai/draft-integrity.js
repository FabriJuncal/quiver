const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const DRAFT_INTEGRITY_VERSION = 1;
const DRAFT_INTEGRITY_COMMIT = 'draft-integrity-commit.json';
const MAX_DRAFT_BYTES = 4 * 1024 * 1024;
const MAX_JOURNAL_BYTES = 16 * 1024 * 1024;
const DRAFT_LIFECYCLE_STATES = Object.freeze([
  'draft',
  'current',
  'reviewed',
  'approved',
  'approved-with-conditions',
  'rejected',
  'superseded',
  'corrupted',
]);
const COLLECTIONS = Object.freeze(['requirements', 'acceptance_criteria', 'slices']);
const ID_PATTERNS = Object.freeze({
  requirements: /(?:V\d+-RQ-\d+|RQ-\d+)/g,
  acceptance_criteria: /AC-\d+(?:-[A-Za-z0-9_-]+)*/g,
  slices: /slice-\d+(?:-[A-Za-z0-9_-]+)*/g,
});

function integrityError(message, details = {}) {
  const error = new Error(`create-quiver: ${message}`);
  error.code = 'RECOVERY_REQUIRED';
  error.details = details;
  return error;
}

function sha256Bytes(value) {
  return `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
}

function sorted(values) {
  return [...new Set(values)].sort();
}

function emptyAnalysis(format) {
  return {
    schema_version: DRAFT_INTEGRITY_VERSION,
    format,
    supported: false,
    collections: [],
    identities: {
      requirements: [],
      acceptance_criteria: [],
      slices: [],
    },
    references: [],
    diagnostics: [],
  };
}

function kindForId(value) {
  const text = String(value || '');
  if (/^(?:V\d+-RQ-\d+|RQ-\d+)$/.test(text)) return 'requirements';
  if (/^AC-\d+(?:-[A-Za-z0-9_-]+)*$/.test(text)) return 'acceptance_criteria';
  if (/^slice-\d+(?:-[A-Za-z0-9_-]+)*$/.test(text)) return 'slices';
  return null;
}

function collectRecognizedIds(value) {
  const text = String(value || '');
  return COLLECTIONS.flatMap((collection) => (
    [...text.matchAll(ID_PATTERNS[collection])].map((match) => ({ collection, id: match[0] }))
  ));
}

function analyzeJson(value, format = 'json') {
  const result = emptyAnalysis(format);
  const identities = Object.fromEntries(COLLECTIONS.map((name) => [name, []]));
  const seen = Object.fromEntries(COLLECTIONS.map((name) => [name, new Set()]));
  const references = [];
  const collections = new Set();

  function addIdentity(collection, id, location) {
    if (!kindForId(id) || kindForId(id) !== collection) {
      result.diagnostics.push({ code: 'IDENTITY_INVALID', collection, id: String(id || ''), location });
      return;
    }
    if (seen[collection].has(id)) {
      result.diagnostics.push({ code: 'IDENTITY_DUPLICATE', collection, id, location });
      return;
    }
    seen[collection].add(id);
    identities[collection].push(id);
  }

  function addReference(id, location) {
    const collection = kindForId(id);
    if (collection) references.push({ collection, id, location });
  }

  function visit(node, location = '$') {
    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, `${location}[${index}]`));
      return;
    }
    if (!node || typeof node !== 'object') return;

    for (const [key, child] of Object.entries(node)) {
      const childLocation = `${location}.${key}`;
      if (key === 'requirements' || key === 'acceptance_criteria' || key === 'slices') {
        collections.add(key);
        if (!Array.isArray(child)) {
          result.diagnostics.push({ code: 'COLLECTION_INVALID', collection: key, location: childLocation });
        } else {
          const identityField = key === 'slices' ? 'slice_id' : 'id';
          child.forEach((entry, index) => {
            if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
              result.diagnostics.push({ code: 'IDENTITY_ENTRY_INVALID', collection: key, location: `${childLocation}[${index}]` });
            } else {
              addIdentity(key, entry[identityField], `${childLocation}[${index}].${identityField}`);
            }
          });
        }
      } else if (key === 'acceptance' && Array.isArray(child)) {
        // v58 stores canonical criteria as explicit AC-prefixed strings.
        const compatible = child.map((entry) => (
          typeof entry === 'string' ? collectRecognizedIds(entry).filter((item) => item.collection === 'acceptance_criteria') : []
        ));
        if (compatible.some((items) => items.length > 0)) {
          collections.add('acceptance_criteria');
          compatible.forEach((items, index) => items.forEach(({ id }) => (
            addIdentity('acceptance_criteria', id, `${childLocation}[${index}]`)
          )));
        }
      }

      const referenceKey = String(key).toLowerCase();
      const referenceCollection = /^(?:requirement_ids|requirement_refs)$/.test(referenceKey)
        ? 'requirements'
        : /^(?:acceptance(?:_criteria)?_ids|acceptance(?:_criteria)?_refs)$/.test(referenceKey)
          ? 'acceptance_criteria'
          : /^(?:slice_ids|slice_refs|depends_on)$/.test(referenceKey)
            ? 'slices'
            : null;
      if (referenceCollection || /^(?:references?|refs?)$/i.test(key)) {
        const values = Array.isArray(child) ? child : [child];
        values.forEach((entry, index) => {
          const refValue = entry && typeof entry === 'object' ? (entry.id || entry.slice_id) : entry;
          collectRecognizedIds(refValue)
            .filter(({ collection }) => !referenceCollection || collection === referenceCollection)
            .forEach(({ id }) => addReference(id, `${childLocation}[${index}]`));
        });
      }
      visit(child, childLocation);
    }
  }

  visit(value);
  for (const reference of references) {
    if (!seen[reference.collection].has(reference.id)) {
      result.diagnostics.push({
        code: 'REFERENCE_BROKEN',
        collection: reference.collection,
        id: reference.id,
        location: reference.location,
      });
    }
  }
  result.collections = sorted(collections);
  result.identities = Object.fromEntries(COLLECTIONS.map((name) => [name, sorted(identities[name])]));
  result.references = references
    .map(({ collection, id }) => `${collection}:${id}`)
    .filter((value, index, list) => list.indexOf(value) === index)
    .sort();
  result.supported = COLLECTIONS.some((name) => result.identities[name].length > 0);
  return result;
}

function mergeAnalysis(target, source) {
  target.collections = sorted(target.collections.concat(source.collections));
  for (const collection of COLLECTIONS) {
    for (const id of source.identities[collection]) {
      if (target.identities[collection].includes(id)) {
        target.diagnostics.push({ code: 'IDENTITY_DUPLICATE', collection, id, location: source.format });
      }
    }
    target.identities[collection] = sorted(target.identities[collection].concat(source.identities[collection]));
  }
  target.references = sorted(target.references.concat(source.references));
  target.diagnostics.push(...source.diagnostics);
  target.supported = target.supported || source.supported;
}

function analyzeMarkdown(text) {
  const result = emptyAnalysis('markdown');
  const withoutFences = String(text).replace(/```json\s*([\s\S]*?)```/gi, (full, body) => {
    try {
      mergeAnalysis(result, analyzeJson(JSON.parse(body), 'markdown-fenced-json'));
    } catch (error) {
      result.diagnostics.push({ code: 'STRUCTURED_JSON_INVALID', message: error.message });
    }
    return '';
  });
  for (const { collection, id } of collectRecognizedIds(withoutFences)) {
    if (result.identities[collection].includes(id)) {
      result.diagnostics.push({ code: 'IDENTITY_DUPLICATE', collection, id, location: 'markdown' });
      continue;
    }
    result.identities[collection].push(id);
  }
  for (const collection of COLLECTIONS) {
    result.identities[collection] = sorted(result.identities[collection]);
    if (result.identities[collection].length > 0) result.collections.push(collection);
  }
  result.collections = sorted(result.collections);
  result.supported = result.supported || COLLECTIONS.some((name) => result.identities[name].length > 0);
  return result;
}

function analyzeDraftStructure(contents) {
  const bytes = Buffer.from(String(contents), 'utf8');
  if (bytes.length > MAX_DRAFT_BYTES) {
    const result = emptyAnalysis('unknown');
    result.diagnostics.push({ code: 'CONTENT_TOO_LARGE', max_bytes: MAX_DRAFT_BYTES, actual_bytes: bytes.length });
    return result;
  }
  const text = bytes.toString('utf8');
  try {
    return analyzeJson(JSON.parse(text), 'json');
  } catch (error) {
    if (/^[\s\uFEFF]*(?:\{|\[)/.test(text)) {
      const result = emptyAnalysis('json');
      result.diagnostics.push({ code: 'STRUCTURED_JSON_INVALID', message: error.message });
      return result;
    }
    return analyzeMarkdown(text);
  }
}

function normalizeRemovals(removals = []) {
  const normalized = new Set();
  for (const removal of removals) {
    const collection = String(removal?.collection || '');
    const id = String(removal?.id || '');
    if (!COLLECTIONS.includes(collection) || kindForId(id) !== collection) {
      throw new Error(`create-quiver: invalid explicit structural removal '${collection}:${id}'`);
    }
    normalized.add(`${collection}:${id}`);
  }
  return normalized;
}

function compareDraftStructure(previousContents, candidateContents, options = {}) {
  const previous = previousContents === null || previousContents === undefined
    ? null
    : analyzeDraftStructure(previousContents);
  const candidate = analyzeDraftStructure(candidateContents);
  const diagnostics = [...candidate.diagnostics];
  const removals = normalizeRemovals(options.removals);
  const removed = [];
  const added = [];
  const preserved = [];

  if (!candidate.supported) {
    return {
      schema_version: DRAFT_INTEGRITY_VERSION,
      status: diagnostics.length > 0 ? 'corrupted' : 'unsupported',
      previous,
      candidate,
      preserved_ids: preserved,
      added_ids: added,
      removed_ids: removed,
      diagnostics: diagnostics.length > 0 ? diagnostics : [{ code: 'STRUCTURE_UNSUPPORTED' }],
    };
  }
  if (previous && !previous.supported) {
    return {
      schema_version: DRAFT_INTEGRITY_VERSION,
      status: 'unsupported',
      previous,
      candidate,
      preserved_ids: preserved,
      added_ids: added,
      removed_ids: removed,
      diagnostics: [{ code: 'PREVIOUS_STRUCTURE_UNSUPPORTED' }],
    };
  }

  if (previous) {
    for (const collection of previous.collections) {
      if (!candidate.collections.includes(collection)) {
        diagnostics.push({ code: 'REQUIRED_COLLECTION_REMOVED', collection });
      }
    }
  }
  for (const collection of COLLECTIONS) {
    const before = new Set(previous?.identities[collection] || []);
    const after = new Set(candidate.identities[collection]);
    for (const id of before) {
      const identity = `${collection}:${id}`;
      if (after.has(id)) preserved.push(identity);
      else {
        removed.push(identity);
        if (!removals.has(identity)) diagnostics.push({ code: 'IDENTITY_REMOVED', collection, id });
        if (candidate.references.includes(identity)) diagnostics.push({ code: 'REMOVED_ID_STILL_REFERENCED', collection, id });
      }
    }
    for (const id of after) {
      if (!before.has(id)) added.push(`${collection}:${id}`);
    }
  }
  for (const reference of previous?.references || []) {
    if (!candidate.references.includes(reference) && !removals.has(reference)) {
      const [collection, id] = reference.split(':');
      diagnostics.push({ code: 'REFERENCE_REMOVED', collection, id });
    }
  }
  for (const removal of removals) {
    if (!removed.includes(removal)) {
      const [collection, id] = removal.split(':');
      diagnostics.push({ code: 'EXPLICIT_REMOVAL_NOT_APPLIED', collection, id });
    }
  }

  return {
    schema_version: DRAFT_INTEGRITY_VERSION,
    status: diagnostics.length > 0 ? 'corrupted' : 'preserved',
    previous,
    candidate,
    preserved_ids: sorted(preserved),
    added_ids: sorted(added),
    removed_ids: sorted(removed),
    diagnostics,
  };
}

function fsyncDirectory(dirPath) {
  let handle;
  try {
    handle = fs.openSync(dirPath, 'r');
    fs.fsyncSync(handle);
    return true;
  } catch (error) {
    if (!['EINVAL', 'ENOTSUP', 'EPERM'].includes(error?.code)) throw error;
    return false;
  } finally {
    if (typeof handle === 'number') fs.closeSync(handle);
  }
}

function writeFileAtomic(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = path.join(path.dirname(filePath), `.tmp-${path.basename(filePath)}-${process.pid}-${crypto.randomBytes(6).toString('hex')}`);
  try {
    const handle = fs.openSync(tempPath, 'wx');
    try {
      fs.writeFileSync(handle, contents);
      fs.fsyncSync(handle);
    } finally {
      fs.closeSync(handle);
    }
    fs.renameSync(tempPath, filePath);
    return fsyncDirectory(path.dirname(filePath));
  } catch (error) {
    if (fs.existsSync(tempPath)) fs.rmSync(tempPath);
    throw error;
  }
}

function writeFileImmutable(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = path.join(path.dirname(filePath), `.tmp-${path.basename(filePath)}-${process.pid}-${crypto.randomBytes(6).toString('hex')}`);
  try {
    const handle = fs.openSync(tempPath, 'wx');
    try {
      fs.writeFileSync(handle, contents);
      fs.fsyncSync(handle);
    } finally {
      fs.closeSync(handle);
    }
    fs.linkSync(tempPath, filePath);
    fs.rmSync(tempPath);
    fsyncDirectory(path.dirname(filePath));
  } catch (error) {
    if (fs.existsSync(tempPath)) fs.rmSync(tempPath);
    if (error?.code === 'EEXIST') {
      error.code = 'REVISION_CONFLICT';
      error.message = `create-quiver: immutable draft version already exists: ${filePath}`;
    }
    throw error;
  }
}

function assertNoSymlinks(projectRoot, target, label) {
  const root = path.resolve(projectRoot);
  let current = path.resolve(target);
  while (current !== root) {
    try {
      if (fs.lstatSync(current).isSymbolicLink()) {
        throw integrityError(`${label} cannot use a symlinked path component`, { path: current });
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
}

function journalPath(phaseRoot) {
  return path.join(phaseRoot, DRAFT_INTEGRITY_COMMIT);
}

function assertNoPendingDraftIntegrityCommit(phaseRoot, phase) {
  const filePath = journalPath(phaseRoot);
  if (!fs.existsSync(filePath)) return;
  throw integrityError(`draft integrity recovery is required for phase '${phase}'`, {
    phase,
    journal_path: filePath,
  });
}

function captureTarget(role, filePath, afterBytes) {
  const beforeExists = fs.existsSync(filePath);
  const before = beforeExists ? fs.readFileSync(filePath) : null;
  return {
    role,
    path: path.basename(filePath),
    before_exists: beforeExists,
    before_sha256: before ? sha256Bytes(before) : null,
    before_base64: before ? before.toString('base64') : null,
    after_sha256: sha256Bytes(afterBytes),
    after_base64: afterBytes.toString('base64'),
  };
}

function exactKeys(value, expected) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).sort().join('|') === [...expected].sort().join('|');
}

function decodeSnapshot(value, digest, exists, label) {
  if (!exists) {
    if (value !== null || digest !== null) throw integrityError(`invalid absent ${label} snapshot`);
    return null;
  }
  if (typeof value !== 'string' || typeof digest !== 'string') throw integrityError(`invalid ${label} snapshot`);
  const bytes = Buffer.from(value, 'base64');
  if (bytes.toString('base64') !== value || sha256Bytes(bytes) !== digest) {
    throw integrityError(`invalid ${label} snapshot digest`);
  }
  return bytes;
}

function validateJournal(projectRoot, phaseRoot, phase, marker) {
  const markerKeys = ['schema_version', 'operation_id', 'phase', 'selected_version', 'expected_metadata_sha256', 'durability', 'targets'];
  if (!exactKeys(marker, markerKeys)
      || marker.schema_version !== DRAFT_INTEGRITY_VERSION
      || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(marker.operation_id)
      || marker.phase !== phase
      || !Number.isInteger(marker.selected_version)
      || marker.selected_version <= 0
      || !['fsync', 'best-effort'].includes(marker.durability)
      || !Array.isArray(marker.targets)
      || marker.targets.length !== 2) {
    throw integrityError('draft integrity journal is malformed or belongs to another phase', { phase });
  }
  const expected = [
    { role: 'metadata', path: 'meta.json' },
    { role: 'current-draft', path: 'draft.md' },
  ];
  const targetKeys = ['role', 'path', 'before_exists', 'before_sha256', 'before_base64', 'after_sha256', 'after_base64'];
  marker.targets.forEach((target, index) => {
    if (!exactKeys(target, targetKeys)
        || target.role !== expected[index].role
        || target.path !== expected[index].path
        || typeof target.before_exists !== 'boolean') {
      throw integrityError('draft integrity journal target is not allowlisted', { phase, target: target?.path || null });
    }
    decodeSnapshot(target.before_base64, target.before_sha256, target.before_exists, 'before');
    decodeSnapshot(target.after_base64, target.after_sha256, true, 'after');
    assertNoSymlinks(projectRoot, path.join(phaseRoot, target.path), 'draft integrity target');
  });
  if (marker.expected_metadata_sha256 !== marker.targets[0].before_sha256) {
    throw integrityError('draft integrity journal metadata expectation is invalid', { phase });
  }
  return marker;
}

function readJournal(projectRoot, phaseRoot, phase) {
  const filePath = journalPath(phaseRoot);
  if (!fs.existsSync(filePath)) return null;
  assertNoSymlinks(projectRoot, filePath, 'draft integrity journal');
  const bytes = fs.readFileSync(filePath);
  if (bytes.length > MAX_JOURNAL_BYTES) throw integrityError('draft integrity journal exceeds its size bound', { phase });
  let marker;
  try {
    marker = JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    throw integrityError('draft integrity journal is not valid JSON', { phase, cause: error.message });
  }
  return validateJournal(projectRoot, phaseRoot, phase, marker);
}

function removeJournal(phaseRoot) {
  const filePath = journalPath(phaseRoot);
  if (fs.existsSync(filePath)) fs.rmSync(filePath);
  fsyncDirectory(phaseRoot);
}

function commitDraftIntegrityProjection(options) {
  const {
    projectRoot,
    phaseRoot,
    phase,
    selectedVersion,
    metadataBytes,
    draftBytes,
    operationId,
    faultInjector,
  } = options;
  assertNoPendingDraftIntegrityCommit(phaseRoot, phase);
  const metadataPath = path.join(phaseRoot, 'meta.json');
  const draftPath = path.join(phaseRoot, 'draft.md');
  assertNoSymlinks(projectRoot, metadataPath, 'draft integrity metadata');
  assertNoSymlinks(projectRoot, draftPath, 'draft integrity current projection');
  const targets = [
    captureTarget('metadata', metadataPath, metadataBytes),
    captureTarget('current-draft', draftPath, draftBytes),
  ];
  const marker = {
    schema_version: DRAFT_INTEGRITY_VERSION,
    operation_id: operationId,
    phase,
    selected_version: selectedVersion,
    expected_metadata_sha256: targets[0].before_sha256,
    durability: process.platform === 'win32' ? 'best-effort' : 'fsync',
    targets,
  };
  validateJournal(projectRoot, phaseRoot, phase, marker);
  const serialized = Buffer.from(`${JSON.stringify(marker, null, 2)}\n`, 'utf8');
  if (serialized.length > MAX_JOURNAL_BYTES) throw integrityError('draft integrity journal exceeds its size bound', { phase });
  writeFileAtomic(journalPath(phaseRoot), serialized);
  if (typeof faultInjector === 'function') faultInjector('after-journal');
  targets.forEach((target, index) => {
    writeFileAtomic(path.join(phaseRoot, target.path), Buffer.from(target.after_base64, 'base64'));
    if (typeof faultInjector === 'function') faultInjector(index === 0 ? 'after-metadata' : 'after-current-draft');
  });
  if (typeof faultInjector === 'function') faultInjector('before-journal-cleanup');
  removeJournal(phaseRoot);
  return { operationId, durability: marker.durability };
}

function recoverDraftIntegrityProjection(options) {
  const { projectRoot, phaseRoot, phase } = options;
  const marker = readJournal(projectRoot, phaseRoot, phase);
  if (!marker) return { recovered: false, phase };
  const observations = marker.targets.map((target) => {
    const filePath = path.join(phaseRoot, target.path);
    const exists = fs.existsSync(filePath);
    const digest = exists ? sha256Bytes(fs.readFileSync(filePath)) : null;
    const matchesBefore = target.before_exists ? digest === target.before_sha256 : !exists;
    const matchesAfter = digest === target.after_sha256;
    if (!matchesBefore && !matchesAfter) {
      throw integrityError('draft integrity recovery found an unexpected target digest', {
        phase,
        target: target.path,
        actual_sha256: digest,
      });
    }
    return { target, filePath, matchesAfter };
  });
  for (const observation of observations) {
    if (!observation.matchesAfter) {
      writeFileAtomic(observation.filePath, Buffer.from(observation.target.after_base64, 'base64'));
    }
  }
  for (const target of marker.targets) {
    const filePath = path.join(phaseRoot, target.path);
    if (!fs.existsSync(filePath) || sha256Bytes(fs.readFileSync(filePath)) !== target.after_sha256) {
      throw integrityError('draft integrity recovery could not verify the committed projection', { phase, target: target.path });
    }
  }
  removeJournal(phaseRoot);
  return {
    recovered: true,
    phase,
    operationId: marker.operation_id,
    selectedVersion: marker.selected_version,
  };
}

module.exports = {
  COLLECTIONS,
  DRAFT_INTEGRITY_COMMIT,
  DRAFT_INTEGRITY_VERSION,
  DRAFT_LIFECYCLE_STATES,
  MAX_DRAFT_BYTES,
  analyzeDraftStructure,
  assertNoPendingDraftIntegrityCommit,
  compareDraftStructure,
  commitDraftIntegrityProjection,
  journalPath,
  readJournal,
  recoverDraftIntegrityProjection,
  sha256Bytes,
  writeFileAtomic,
  writeFileImmutable,
};
