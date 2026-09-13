const fs = require('node:fs');
const path = require('node:path');

const { assertSafeNamespace, createBrainStore } = require('../lib/brain/store');
const { createBrainVault } = require('../lib/brain/vault');
const { createTranslator } = require('../lib/i18n/catalog');

const BRAIN_COMMANDS = Object.freeze(['status', 'list', 'show', 'add', 'export', 'delete']);
const EXIT_CODES = Object.freeze({
  OK: 0,
  EXPLAINED: 0,
  VALIDATION_FAILED: 2,
  DIGEST_MISMATCH: 2,
  REFERENCE_INVALID: 2,
  POLICY_DENIED: 3,
  ACTOR_UNVERIFIED: 3,
  CAPABILITY_UNAVAILABLE: 4,
  LEGACY_EVIDENCE_UNVERIFIED: 4,
  GOVERNANCE_READ_ONLY: 4,
  UNSAFE_WRITER_DOWNGRADE: 4,
  STORAGE_FAILED: 5,
  RECOVERY_REQUIRED: 5,
  SECRET_DETECTED: 6,
  UNSAFE_PATH: 6,
  REVISION_CONFLICT: 7,
  IDEMPOTENCY_CONFLICT: 7,
  CONTEXT_STALE: 7,
  LOCK_CONFLICT: 7,
  CONTEXT_BUDGET_EXCEEDED: 8,
  REVIEW_BUDGET_EXHAUSTED: 8,
});

function canonicalResult(status, code, data, errors = [], evidenceStatus = 'verified') {
  return { schema_version: 1, status, code, data, errors, evidence_status: evidenceStatus };
}

function commandFailure(code, message, details = {}) {
  return canonicalResult('blocked', code, null, [{
    code,
    message,
    ...(Object.keys(details).length > 0 ? { details } : {}),
  }], ['ACTOR_UNVERIFIED', 'POLICY_DENIED'].includes(code) ? 'unverified' : 'failed');
}

function readRecordInput(projectRoot, relativePath) {
  if (typeof relativePath !== 'string' || !relativePath || path.isAbsolute(relativePath)
      || relativePath.includes('\\') || relativePath.split('/').some((part) => !part || part === '.' || part === '..')) {
    const error = new Error('Brain input file must be a safe project-relative path.');
    error.code = 'UNSAFE_PATH';
    throw error;
  }
  const inputPath = assertSafeNamespace(projectRoot, path.join(projectRoot, relativePath), 'Brain input file');
  if (!fs.existsSync(inputPath) || !fs.lstatSync(inputPath).isFile()) {
    const error = new Error('Brain input file does not exist.');
    error.code = 'VALIDATION_FAILED';
    throw error;
  }
  try {
    return JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  } catch {
    const error = new Error('Brain input file is not valid JSON.');
    error.code = 'VALIDATION_FAILED';
    throw error;
  }
}

function formatHumanResult(result, command, translator) {
  if (result.code !== 'OK') {
    const error = result.errors[0] || { message: translator.t('brain.error.failed') };
    return `${translator.t('brain.result.blocked', { code: result.code })}\n${error.message}\n`;
  }
  const data = result.data;
  if (command === 'status') {
    return [
      translator.t('brain.status.title'),
      translator.t('brain.status.active', { active: data.active ? translator.t('common.yes') : translator.t('common.no') }),
      translator.t('brain.status.project', { project: data.project_id }),
      translator.t('brain.status.revision', { revision: data.revision }),
      translator.t('brain.status.counts', data.counts),
      translator.t('brain.status.stores'),
      ...data.stores.map((item) => `- ${item}`),
      translator.t('brain.status.excludes'),
      ...data.excludes.map((item) => `- ${item}`),
      translator.t('brain.status.actions'),
      `- ${data.export}`,
      `- ${data.deletion}`,
      '',
    ].join('\n');
  }
  if (command === 'list') {
    const lines = [translator.t('brain.list.title', { count: data.records.length })];
    lines.push(...data.records.map((record) => `- ${record.id} [${record.type}; ${record.authority}; ${record.validity}]`));
    if (data.truncated) lines.push(translator.t('brain.list.truncated', { shown: data.records.length, total: data.total }));
    lines.push('');
    return lines.join('\n');
  }
  if (command === 'show') return `${JSON.stringify(data.record, null, 2)}\n`;
  if (command === 'add') return `${translator.t(data.dry_run ? 'brain.add.preview' : 'brain.add.saved', {
    id: data.record.id, revision: data.dry_run ? data.would_revision : data.revision,
  })}\n`;
  if (command === 'export') return `${translator.t(data.dry_run ? 'brain.export.preview' : 'brain.export.saved', { destination: data.destination, files: data.files.length, revision: data.revision })}\n`;
  if (command === 'delete') {
    return `${translator.t(data.dry_run ? 'brain.delete.preview' : 'brain.delete.quarantined', {
      files: data.files.length,
      path: data.quarantine_path,
    })}\n`;
  }
  return `${JSON.stringify(data, null, 2)}\n`;
}

async function runBrain(projectRootValue, options = {}) {
  const projectRoot = path.resolve(projectRootValue);
  const translator = createTranslator(options.language);
  const command = options.command || '';
  let response;
  try {
    if (options.contractVersion !== undefined && options.contractVersion !== 1) {
      response = commandFailure('VALIDATION_FAILED', 'Unsupported Brain contract version; expected 1.');
    } else if (!BRAIN_COMMANDS.includes(command)) {
      response = commandFailure('VALIDATION_FAILED', 'Unsupported Brain command.', { command });
    } else {
      const store = options.store || createBrainStore({
        projectRoot,
        actorResolver: options.actorResolver,
        evidenceResolver: options.evidenceResolver,
        clock: options.clock,
      });
      const vault = options.vault || createBrainVault({ projectRoot, store });
      if (command === 'status') {
        const snapshot = await store.completeAuthorizedSnapshot('brain.read');
        response = snapshot.code === 'OK'
          ? canonicalResult('passed', 'OK', {
            active: true,
            project_id: snapshot.data.manifest.project_id,
            revision: snapshot.data.manifest.revision,
            counts: {
              records: snapshot.data.records.length,
              proposals: snapshot.data.proposals.length,
              operations: snapshot.data.operations.length,
            },
            stores: ['typed durable records', 'source and evidence references', 'authority, validity, lineage, proposals, and immutable operation history'],
            excludes: ['secrets and credential-bearing fields', 'leases, tool traces, stdout/stderr, heartbeats, and other ephemeral runtime state'],
            export: 'brain export writes a complete portable Markdown+YAML and canonical JSON snapshot by default',
            deletion: 'brain delete first supports a no-write dry-run; confirmed deletion quarantines only .quiver/brain for recovery',
          })
          : snapshot;
      } else if (command === 'list') {
        response = await store.query({
          ...(options.types?.length ? { types: options.types } : {}),
          ...(options.validity ? { validity: options.validity } : {}),
          ...(options.limit ? { limit: options.limit } : {}),
        });
      } else if (command === 'show') {
        const shown = await store.query({ ids: [options.id], validity: 'all', limit: 1 });
        response = shown.code !== 'OK' ? shown : shown.data.records.length === 0
          ? commandFailure('REFERENCE_INVALID', 'Brain record was not found.', { record_id: options.id })
          : canonicalResult('passed', 'OK', { record: shown.data.records[0], revision: shown.data.revision });
      } else if (command === 'add') {
        const record = options.record || readRecordInput(projectRoot, options.input);
        response = await store[options.dryRun === true ? 'previewAppend' : 'append'](record, {
          operation_id: options.operationId,
          expected_revision: options.expectedRevision,
        });
      } else if (command === 'export') {
        response = await vault.exportVault({
          destination: options.destination,
          dry_run: options.dryRun === true,
          include_history: options.includeHistory !== false,
        });
      } else {
        response = await vault.deleteVault({
          confirm_delete: options.confirmDelete || null,
          dry_run: options.dryRun === true,
          operation_id: options.operationId,
          expected_revision: options.expectedRevision,
        });
      }
    }
  } catch (error) {
    response = commandFailure(error.code || 'STORAGE_FAILED', error.message || 'Brain command failed.');
  }

  const exitCode = EXIT_CODES[response.code] ?? 5;
  if (options.emit !== false) {
    process.stdout.write(options.json
      ? `${JSON.stringify(response, null, 2)}\n`
      : formatHumanResult(response, command, translator));
  }
  if (options.setExitCode !== false) process.exitCode = exitCode;
  return response;
}

module.exports = {
  BRAIN_COMMANDS,
  EXIT_CODES,
  formatHumanResult,
  readRecordInput,
  runBrain,
};
