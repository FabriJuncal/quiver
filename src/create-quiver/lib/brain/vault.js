const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { containsSensitiveText } = require('../ai/artifacts');
const {
  assertNoSensitiveOrOperationalValue,
  canonicalDigest,
} = require('./schema');
const {
  BrainStoreError,
  assertCanonicalStoreNamespace,
  assertSafeNamespace,
  brainPaths,
  createBrainStore,
} = require('./store');

function result(status, code, data, errors = [], evidenceStatus = 'verified') {
  return { schema_version: 1, status, code, data, errors, evidence_status: evidenceStatus };
}

function failure(error) {
  const code = error?.code || 'STORAGE_FAILED';
  const status = [
    'ACTOR_UNVERIFIED', 'CAPABILITY_UNAVAILABLE', 'DIGEST_MISMATCH',
    'IDEMPOTENCY_CONFLICT', 'LOCK_CONFLICT', 'POLICY_DENIED',
    'RECOVERY_REQUIRED', 'REFERENCE_INVALID', 'REVISION_CONFLICT',
    'SECRET_DETECTED', 'UNSAFE_PATH', 'VALIDATION_FAILED',
  ].includes(code) ? 'blocked' : 'failed';
  return result(status, code, null, [{
    code,
    message: error?.message || 'Brain vault operation failed.',
    ...(error?.details && Object.keys(error.details).length > 0 ? { details: error.details } : {}),
  }], ['ACTOR_UNVERIFIED', 'POLICY_DENIED'].includes(code) ? 'unverified' : 'failed');
}

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function posixRelative(root, target) {
  return path.relative(root, target).split(path.sep).join('/');
}

function isSafeRelativePath(value) {
  if (typeof value !== 'string' || value.length === 0 || value.includes('\\') || value.includes('\0')) return false;
  if (value.startsWith('/') || /^[A-Za-z]:/.test(value) || value.startsWith('file:')) return false;
  const segments = value.split('/');
  return !segments.some((segment) => !segment || segment === '.' || segment === '..')
    && path.posix.normalize(value) === value;
}

function assertExportDestination(projectRoot, destination) {
  if (!isSafeRelativePath(destination)) {
    throw new BrainStoreError('UNSAFE_PATH', 'Vault destination must be a project-relative path without traversal.');
  }
  if (destination === '.quiver' || destination.startsWith('.quiver/')
      || destination === '.git' || destination.startsWith('.git/')) {
    throw new BrainStoreError('UNSAFE_PATH', 'Vault destination cannot use a protected Quiver internal path.');
  }
  const target = assertSafeNamespace(projectRoot, path.join(projectRoot, destination), 'Vault destination');
  assertCanonicalStoreNamespace(projectRoot);
  if (fs.existsSync(target)) {
    const stat = fs.lstatSync(target);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new BrainStoreError('UNSAFE_PATH', 'Vault destination must be new or an empty regular directory.');
    }
    if (fs.readdirSync(target).length > 0) {
      throw new BrainStoreError('UNSAFE_PATH', 'Vault destination must be new or empty.');
    }
  }
  return target;
}

function yamlValue(value) {
  return JSON.stringify(value);
}

function recordInputFromProjection(record) {
  return {
    id: record.id,
    type: record.type,
    payload: record.payload,
    source_refs: record.source_refs,
    authority_request: record.authority,
    supersedes: record.supersedes,
    ...(record.claim ? { claim: record.claim } : {}),
    evidence_refs: record.evidence_refs,
    ...(record.approval_ref ? { approval_ref: record.approval_ref } : {}),
  };
}

function recordFileName(ref) {
  return `${path.posix.basename(ref.path, '.json')}.md`;
}

function renderRecordMarkdown(record, recordRef, refById) {
  const relationshipLinks = record.supersedes.map((id) => {
    const target = refById.get(id);
    return target ? `- [${id}](./${recordFileName(target)})` : `- ${id} (omitted from this snapshot)`;
  });
  const linkedRefs = [...record.source_refs, ...record.evidence_refs, ...(record.approval_ref ? [record.approval_ref] : [])]
    .map((ref) => `- [${ref.id}](../sources/${ref.digest}.md)`);
  const frontMatter = [
    '---',
    'schema_version: 1',
    `id: ${yamlValue(record.id)}`,
    `type: ${yamlValue(record.type)}`,
    `digest: ${yamlValue(record.digest)}`,
    `created_at: ${yamlValue(record.created_at)}`,
    `authority: ${yamlValue(record.authority)}`,
    `validity: ${yamlValue(record.validity)}`,
    `supersedes: ${yamlValue(record.supersedes)}`,
    `source_refs: ${yamlValue(record.source_refs)}`,
    `evidence_refs: ${yamlValue(record.evidence_refs)}`,
    `approval_ref: ${yamlValue(record.approval_ref)}`,
    `provenance: ${yamlValue(record.provenance)}`,
    `authority_check: ${yamlValue(record.authority_check || null)}`,
    '---',
    '',
    `# Brain record: \`${record.id}\``,
    '',
    '## Payload',
    '',
    '```json',
    JSON.stringify(record.payload, null, 2),
    '```',
    '',
    '## Relationships',
    '',
    ...(relationshipLinks.length > 0 ? relationshipLinks : ['None.']),
    '',
    '## Sources and evidence',
    '',
    ...(linkedRefs.length > 0 ? linkedRefs : ['None.']),
    '',
    '## Editable proposal input',
    '',
    'Edits to this block can be imported only as a non-effective proposal.',
    '',
    '```quiver-record-input json',
    JSON.stringify(recordInputFromProjection(record), null, 2),
    '```',
    '',
  ];
  return Buffer.from(frontMatter.join('\n'), 'utf8');
}

function renderSourceMarkdown(digest, refs) {
  return Buffer.from([
    '---',
    'schema_version: 1',
    `digest: ${yamlValue(digest)}`,
    `refs: ${yamlValue(refs)}`,
    '---',
    '',
    `# Source: \`${digest}\``,
    '',
    'This portable note preserves source identity and location metadata. Quiver does not fetch external URIs while opening or exporting a vault.',
    '',
    '```json',
    JSON.stringify(refs, null, 2),
    '```',
    '',
  ].join('\n'), 'utf8');
}

function renderReadme(manifest) {
  return Buffer.from([
    '# Quiver Open Knowledge Vault',
    '',
    `Project: \`${manifest.project_id}\``,
    `Brain revision: \`${manifest.revision}\``,
    '',
    'This is a portable UTF-8 Markdown and YAML projection. It can be opened as an ordinary folder or as an Obsidian vault; Quiver does not require Obsidian or any proprietary service.',
    '',
    'Canonical JSON snapshots live under `canonical/`. Markdown notes are derived and cannot grant authority. Edited notes may only be imported as proposals that remain non-effective until a separately authorized workflow reviews them.',
    '',
    `History included: ${manifest.include_history ? 'yes' : 'no'}`,
    `Omissions: ${manifest.omissions.length > 0 ? manifest.omissions.join(', ') : 'none'}`,
    '',
  ].join('\n'), 'utf8');
}

function readCanonicalBytes(projectRoot, relativePath) {
  const root = brainPaths(projectRoot).root;
  const source = assertSafeNamespace(projectRoot, path.join(root, relativePath), 'Brain canonical snapshot source');
  if (!fs.existsSync(source) || !fs.lstatSync(source).isFile()) {
    throw new BrainStoreError('RECOVERY_REQUIRED', 'A canonical Brain snapshot file is missing.');
  }
  return fs.readFileSync(source);
}

function buildVaultFiles(projectRoot, snapshot, includeHistory) {
  const allRecords = snapshot.records;
  const records = includeHistory ? allRecords : allRecords.filter((record) => record.validity === 'active');
  const includedIds = new Set(records.map((record) => record.id));
  const recordRefs = snapshot.manifest.record_refs.filter((ref) => includedIds.has(ref.id));
  const recordRefById = new Map(recordRefs.map((ref) => [ref.id, ref]));
  const files = new Map();
  const canonicalManifestBytes = readCanonicalBytes(projectRoot, 'manifest.json');
  let canonicalManifest;
  try {
    canonicalManifest = JSON.parse(canonicalManifestBytes.toString('utf8'));
  } catch {
    throw new BrainStoreError('RECOVERY_REQUIRED', 'Canonical Brain manifest changed or became invalid during export.');
  }
  if (canonicalManifest.digest !== snapshot.manifest.digest
      || canonicalDigest(canonicalManifest, 'digest') !== snapshot.manifest.digest) {
    throw new BrainStoreError('REVISION_CONFLICT', 'Brain changed before canonical export bytes were captured.');
  }
  files.set('canonical/manifest.json', canonicalManifestBytes);

  for (const ref of recordRefs) {
    files.set(`canonical/${ref.path}`, readCanonicalBytes(projectRoot, ref.path));
    files.set(`records/${recordFileName(ref)}`, renderRecordMarkdown(
      records.find((record) => record.id === ref.id), ref, recordRefById,
    ));
  }
  for (const ref of snapshot.manifest.proposal_refs) {
    files.set(`canonical/${ref.path}`, readCanonicalBytes(projectRoot, ref.path));
  }
  for (const ref of snapshot.manifest.operation_refs) {
    files.set(`canonical/${ref.path}`, readCanonicalBytes(projectRoot, ref.path));
  }

  const sourceRefs = new Map();
  for (const record of records) {
    for (const ref of [...record.source_refs, ...record.evidence_refs, ...(record.approval_ref ? [record.approval_ref] : [])]) {
      const values = sourceRefs.get(ref.digest) || [];
      if (!values.some((candidate) => JSON.stringify(candidate) === JSON.stringify(ref))) values.push(ref);
      sourceRefs.set(ref.digest, values);
    }
  }
  for (const proposal of snapshot.proposals) {
    for (const ref of proposal.source_refs) {
      const values = sourceRefs.get(ref.digest) || [];
      if (!values.some((candidate) => JSON.stringify(candidate) === JSON.stringify(ref))) values.push(ref);
      sourceRefs.set(ref.digest, values);
    }
  }
  for (const [digest, refs] of [...sourceRefs.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    refs.sort((left, right) => `${left.id}:${left.path || left.uri || ''}`.localeCompare(`${right.id}:${right.path || right.uri || ''}`));
    files.set(`sources/${digest}.md`, renderSourceMarkdown(digest, refs));
  }

  const omissions = includeHistory ? [] : [
    `superseded-or-noncurrent-records:${allRecords.length - records.length}`,
    'canonical-manifest-retains-digest-bound-references-to-omitted-record-history',
  ];
  const vaultIdentity = {
    project_id: snapshot.manifest.project_id,
    revision: snapshot.manifest.revision,
    include_history: includeHistory,
    omissions,
  };
  files.set('README.md', renderReadme(vaultIdentity));
  const fileEntries = [...files.entries()]
    .map(([filePath, bytes]) => ({ path: filePath, sha256: sha256(bytes), bytes: bytes.length }))
    .sort((left, right) => left.path.localeCompare(right.path));
  const vaultManifestBase = {
    schema_version: 1,
    type: 'quiver-open-knowledge-vault',
    project_id: vaultIdentity.project_id,
    revision: vaultIdentity.revision,
    source_manifest_digest: snapshot.manifest.digest,
    include_history: vaultIdentity.include_history,
    omissions: vaultIdentity.omissions,
    records: records.map((record) => ({
      id: record.id,
      digest: record.digest,
      authority: record.authority,
      validity: record.validity,
      path: `records/${recordFileName(recordRefById.get(record.id))}`,
      canonical_path: `canonical/${recordRefById.get(record.id).path}`,
    })),
    proposals: snapshot.manifest.proposal_refs.map((ref) => ({ ...ref, canonical_path: `canonical/${ref.path}` })),
    operations: snapshot.manifest.operation_refs.map((ref) => ({ ...ref, canonical_path: `canonical/${ref.path}` })),
    files: fileEntries,
  };
  const vaultManifest = { ...vaultManifestBase, digest: canonicalDigest(vaultManifestBase) };
  files.set('manifest.json', Buffer.from(`${JSON.stringify(vaultManifest, null, 2)}\n`, 'utf8'));
  return { files, manifest: vaultManifest };
}

function assertSafeExportBytes(snapshot, files) {
  assertNoSensitiveOrOperationalValue(snapshot);
  for (const [filePath, bytes] of files) {
    if (!isSafeRelativePath(filePath)) {
      throw new BrainStoreError('UNSAFE_PATH', 'Generated vault file path is unsafe.');
    }
    if (containsSensitiveText(bytes.toString('utf8'))) {
      throw new BrainStoreError('SECRET_DETECTED', 'Vault snapshot contains secret-like material.');
    }
  }
}

function writeVaultFiles(destination, files) {
  fs.mkdirSync(destination, { recursive: true });
  for (const [relativePath, bytes] of [...files.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const filePath = path.join(destination, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, bytes, { flag: 'wx' });
  }
}

function extractEditableRecord(markdown, relativePath) {
  const matches = [...markdown.matchAll(/```quiver-record-input json\n([\s\S]*?)\n```/g)];
  if (matches.length !== 1) {
    throw new BrainStoreError('VALIDATION_FAILED', 'Vault record must contain exactly one editable proposal input block.', { path: relativePath });
  }
  try {
    return JSON.parse(matches[0][1]);
  } catch {
    throw new BrainStoreError('VALIDATION_FAILED', 'Vault editable proposal input is not valid JSON.', { path: relativePath });
  }
}

function createBrainVault(options = {}) {
  const projectRoot = path.resolve(options.projectRoot || '');
  const store = options.store || createBrainStore(options);

  async function exportVault(exportOptions = {}) {
    try {
      const keys = Object.keys(exportOptions).sort();
      if (keys.some((key) => !['destination', 'dry_run', 'include_history'].includes(key))) {
        throw new BrainStoreError('VALIDATION_FAILED', 'Brain export contains unsupported fields.');
      }
      if (typeof exportOptions.destination !== 'string'
          || (exportOptions.include_history !== undefined && typeof exportOptions.include_history !== 'boolean')
          || (exportOptions.dry_run !== undefined && typeof exportOptions.dry_run !== 'boolean')) {
        throw new BrainStoreError('VALIDATION_FAILED', 'Brain export input is invalid.');
      }
      const destination = assertExportDestination(projectRoot, exportOptions.destination);
      const snapshotResult = await store.completeAuthorizedSnapshot('brain.export');
      if (snapshotResult.code !== 'OK') return snapshotResult;
      const includeHistory = exportOptions.include_history !== false;
      const built = buildVaultFiles(projectRoot, snapshotResult.data, includeHistory);
      assertSafeExportBytes(snapshotResult.data, built.files);
      assertExportDestination(projectRoot, exportOptions.destination);
      if (exportOptions.dry_run === true) {
        return result('passed', 'OK', {
          manifest: built.manifest,
          files: [...built.files.keys()].sort(),
          revision: snapshotResult.data.manifest.revision,
          destination: posixRelative(projectRoot, destination),
          dry_run: true,
          writes: [],
        });
      }
      // All source, path, reference, and secret checks above complete before the first destination write.
      writeVaultFiles(destination, built.files);
      return result('passed', 'OK', {
        manifest: built.manifest,
        files: [...built.files.keys()].sort(),
        revision: snapshotResult.data.manifest.revision,
        destination: posixRelative(projectRoot, destination),
        dry_run: false,
      });
    } catch (error) {
      return failure(error);
    }
  }

  async function importProposal(proposal, mutationContext) {
    return store.importProposal(proposal, mutationContext);
  }

  async function importEditedVault(importOptions = {}, mutationContext) {
    try {
      if (!importOptions || Object.keys(importOptions).some((key) => !['source'].includes(key))
          || typeof importOptions.source !== 'string' || !isSafeRelativePath(importOptions.source)
          || importOptions.source === '.quiver' || importOptions.source.startsWith('.quiver/')) {
        throw new BrainStoreError('UNSAFE_PATH', 'Edited vault source must be a safe project-relative folder outside protected state.');
      }
      const source = assertSafeNamespace(projectRoot, path.join(projectRoot, importOptions.source), 'Edited vault source');
      if (!fs.existsSync(source) || !fs.lstatSync(source).isDirectory()) {
        throw new BrainStoreError('VALIDATION_FAILED', 'Edited vault source does not exist.');
      }
      const manifestPath = assertSafeNamespace(projectRoot, path.join(source, 'manifest.json'), 'Edited vault manifest');
      if (!fs.existsSync(manifestPath) || !fs.lstatSync(manifestPath).isFile()) {
        throw new BrainStoreError('VALIDATION_FAILED', 'Edited vault manifest is missing.');
      }
      const manifestBytes = fs.readFileSync(manifestPath);
      let manifest;
      try {
        manifest = JSON.parse(manifestBytes.toString('utf8'));
      } catch {
        throw new BrainStoreError('VALIDATION_FAILED', 'Edited vault manifest is invalid JSON.');
      }
      if (manifest.type !== 'quiver-open-knowledge-vault' || !Array.isArray(manifest.records)
          || !Number.isInteger(manifest.revision) || typeof manifest.project_id !== 'string') {
        throw new BrainStoreError('VALIDATION_FAILED', 'Edited vault manifest is invalid.');
      }
      const records = manifest.records.map((entry) => {
        if (!isSafeRelativePath(entry.path)) throw new BrainStoreError('UNSAFE_PATH', 'Edited vault record path is unsafe.');
        const recordPath = assertSafeNamespace(projectRoot, path.join(source, entry.path), 'Edited vault record');
        if (!fs.existsSync(recordPath) || !fs.lstatSync(recordPath).isFile()) {
          throw new BrainStoreError('VALIDATION_FAILED', 'Edited vault record is missing.', { record_id: entry.id });
        }
        return extractEditableRecord(fs.readFileSync(recordPath, 'utf8'), entry.path);
      });
      return store.importProposal({
        base_revision: manifest.revision,
        records,
        source_refs: [{
          id: `vault:${manifest.project_id}:${manifest.revision}`,
          digest: sha256(manifestBytes),
          path: posixRelative(projectRoot, manifestPath),
        }],
      }, mutationContext);
    } catch (error) {
      return failure(error);
    }
  }

  return {
    deleteVault: (input) => store.quarantine(input),
    exportVault,
    importEditedVault,
    importProposal,
  };
}

module.exports = {
  assertExportDestination,
  buildVaultFiles,
  createBrainVault,
  extractEditableRecord,
  recordInputFromProjection,
  renderRecordMarkdown,
};
