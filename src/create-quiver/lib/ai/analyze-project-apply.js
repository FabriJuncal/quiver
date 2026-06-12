const crypto = require('node:crypto');
const fs = require('node:fs');

const {
  buildAnalyzeProjectWritePlan,
  createAnalyzeProjectSnapshot,
  writeAnalyzeProjectDocs,
} = require('./analyze-project-docs');
const {
  buildAnalyzeProjectProposalArtifactPaths,
  normalizeAnalyzeProjectProposalManifest,
  writeAnalyzeProjectProposalArtifacts,
  writeAnalyzeProjectWriteManifest,
} = require('./analyze-project-proposal');
const { validateAnalyzeProjectPostWrite } = require('./analyze-project-validation');

function formatError(message) {
  return `create-quiver: ${message}`;
}

class AnalyzeProjectApplyError extends Error {
  constructor(message, issues = []) {
    super(formatError(message));
    this.name = 'AnalyzeProjectApplyError';
    this.code = 'AI_ANALYZE_PROJECT_APPLY_BLOCKED';
    this.issues = issues;
  }
}

function sha256(contents) {
  return crypto.createHash('sha256').update(String(contents || ''), 'utf8').digest('hex');
}

function readCurrentHash(item) {
  if (!fs.existsSync(item.destinationPath)) {
    return null;
  }
  return sha256(fs.readFileSync(item.destinationPath, 'utf8'));
}

function collectWrittenDocs(writePlan) {
  const written = [];
  for (const item of writePlan) {
    if (item.action === 'skip') {
      continue;
    }
    if (readCurrentHash(item) === item.after_sha256) {
      written.push(item.path);
    }
  }
  return written;
}

function assertAnalyzeProjectApplyPreflight(writePlan, proposalManifest, options = {}) {
  const issues = [];
  const beforeHashes = proposalManifest?.doc_before_hashes || {};

  for (const item of writePlan) {
    if (item.action === 'skip') {
      continue;
    }
    if (item.dirty === true && options.allowDirtyDocs !== true) {
      issues.push({
        path: item.path,
        issue: 'dirty-target-doc',
        message: 'target documentation already has human content; --yes requires --allow-dirty-docs or interactive review',
      });
    }

    if (!Object.prototype.hasOwnProperty.call(beforeHashes, item.path)) {
      issues.push({
        path: item.path,
        issue: 'missing-before-hash',
        message: 'proposal manifest is missing the current doc hash for this target path',
      });
      continue;
    }

    const currentHash = readCurrentHash(item);
    const expectedHash = beforeHashes[item.path] || null;
    if (currentHash !== expectedHash) {
      issues.push({
        path: item.path,
        issue: 'stale-target-doc',
        message: 'target documentation changed after the proposal was built',
        expected_sha256: expectedHash,
        current_sha256: currentHash,
      });
    }
  }

  if (issues.length > 0) {
    throw new AnalyzeProjectApplyError(
      'ai analyze-project --apply-docs --yes blocked before writing final docs',
      issues,
    );
  }

  return { ok: true, issues: [] };
}

function validationFromWriteError(error, options = {}) {
  return {
    ok: false,
    strict: options.strict === true,
    errors: [{
      path: null,
      issue: 'write-failed',
      message: error?.message || 'analyze-project doc write failed',
    }],
    warnings: [],
  };
}

function normalizeLoadedProposalArtifacts(runId, proposalArtifacts = {}, proposalManifest = null) {
  const paths = buildAnalyzeProjectProposalArtifactPaths(runId);
  const manifestData = normalizeAnalyzeProjectProposalManifest(proposalManifest || proposalArtifacts.manifest_data || {});
  return {
    root: proposalArtifacts.root || paths.root,
    proposal_json: proposalArtifacts.proposal_json || manifestData.proposal_json,
    proposal_markdown: proposalArtifacts.proposal_markdown || manifestData.proposal_markdown,
    proposal_diff: proposalArtifacts.proposal_diff || manifestData.proposal_diff,
    manifest: proposalArtifacts.manifest || paths.manifest,
    proposal_sha256: proposalArtifacts.proposal_sha256 || manifestData.proposal_sha256,
    doc_paths: proposalArtifacts.doc_paths || manifestData.doc_paths || [],
    changed_docs: proposalArtifacts.changed_docs || manifestData.doc_paths || [],
    manifest_data: manifestData,
    files: Array.isArray(proposalArtifacts.files)
      ? proposalArtifacts.files
      : [
        manifestData.proposal_json,
        manifestData.proposal_markdown,
        manifestData.proposal_diff,
        paths.manifest,
      ],
  };
}

function applyAnalyzeProjectDocProposal(repoRoot, options = {}) {
  const runId = String(options.runId || '').trim();
  const proposal = options.proposal;
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  const writePlan = buildAnalyzeProjectWritePlan(repoRoot, proposal);
  const applyEvents = Array.isArray(options.events) ? options.events : [];
  const proposalArtifacts = options.proposalArtifacts
    ? normalizeLoadedProposalArtifacts(runId, options.proposalArtifacts, options.proposalManifest)
    : writeAnalyzeProjectProposalArtifacts(repoRoot, {
      runId,
      now,
      provider: options.provider,
      language: options.language,
      proposal,
      writePlan,
      selectedContextManifest: options.selectedContextManifest,
      repairManifest: options.repairManifest,
      events: [{ type: 'proposal-saved-before-apply', at: now.toISOString() }],
    });

  try {
    assertAnalyzeProjectApplyPreflight(writePlan, proposalArtifacts.manifest_data, {
      allowDirtyDocs: options.allowDirtyDocs === true,
    });
  } catch (error) {
    error.proposal_artifacts = proposalArtifacts;
    error.write_plan = writePlan;
    throw error;
  }

  const snapshot = createAnalyzeProjectSnapshot(repoRoot, { run_id: runId }, writePlan, {
    providerArtifact: options.providerArtifact,
    proposal,
    now,
  });
  const plannedManifest = writeAnalyzeProjectWriteManifest(repoRoot, {
    runId,
    now,
    proposalManifest: proposalArtifacts.manifest,
    snapshot,
    writePlan,
    strict: options.strict === true,
    status: 'planned',
    events: [
      ...applyEvents,
      { type: 'write-planned', at: now.toISOString() },
    ],
  });

  let writtenDocs = [];
  try {
    writtenDocs = writeAnalyzeProjectDocs(writePlan);
  } catch (error) {
    const partialDocs = collectWrittenDocs(writePlan);
    const failedManifest = writeAnalyzeProjectWriteManifest(repoRoot, {
      runId,
      now: new Date(),
      proposalManifest: proposalArtifacts.manifest,
      snapshot,
      writePlan,
      writtenDocs: partialDocs,
      validation: validationFromWriteError(error, { strict: options.strict === true }),
      partialWrite: partialDocs.length > 0,
      status: 'completed',
      events: [
        ...applyEvents,
        { type: 'write-planned', at: now.toISOString() },
        { type: 'write-failed', at: new Date().toISOString(), message: error?.message || 'write failed' },
      ],
    });
    error.write_manifest = failedManifest;
    error.snapshot = snapshot;
    error.written_docs = partialDocs;
    throw error;
  }

  const writeReport = {
    ...options.report,
    apply_docs: true,
    writes: writtenDocs,
    doc_proposal: proposal,
    write_plan: options.summarizeWritePlan
      ? options.summarizeWritePlan(writePlan)
      : writePlan,
    snapshot,
    written_docs: writtenDocs,
    proposal_artifacts: {
      root: proposalArtifacts.root,
      proposal_json: proposalArtifacts.proposal_json,
      proposal_markdown: proposalArtifacts.proposal_markdown,
      proposal_diff: proposalArtifacts.proposal_diff,
      manifest: proposalArtifacts.manifest,
      proposal_sha256: proposalArtifacts.proposal_sha256,
      proposal_edited: options.proposalEdited === true,
    },
    write_manifest: {
      path: plannedManifest.path,
    },
  };
  const postWriteValidation = validateAnalyzeProjectPostWrite(repoRoot, writeReport, {
    strict: options.strict === true,
  });
  const finalManifest = writeAnalyzeProjectWriteManifest(repoRoot, {
    runId,
    now: new Date(),
    proposalManifest: proposalArtifacts.manifest,
    snapshot,
    writePlan,
    writtenDocs,
    validation: postWriteValidation,
    partialWrite: false,
    status: 'completed',
    events: [
      ...applyEvents,
      { type: 'write-planned', at: now.toISOString() },
      { type: 'write-completed', at: new Date().toISOString(), written_docs: writtenDocs },
    ],
  });

  return {
    ...writeReport,
    post_write_validation: postWriteValidation,
    write_manifest: finalManifest,
  };
}

module.exports = {
  AnalyzeProjectApplyError,
  applyAnalyzeProjectDocProposal,
  assertAnalyzeProjectApplyPreflight,
};
