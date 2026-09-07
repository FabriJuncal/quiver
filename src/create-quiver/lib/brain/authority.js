const { readProjectFileBytes } = require('../approvals');
const { resolveVerifiedSpecGovernance } = require('../ai/spec-governance');
const {
  AUTHORITY_GRANTS,
  BrainValidationError,
  actorResolutionSchema,
  canonicalDigest,
  canonicalStringify,
  cloudDecisionReceiptSchema,
  evidenceResultSchema,
  parseSchema,
} = require('./schema');

class BrainAuthorityError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'BrainAuthorityError';
    this.code = code;
    this.details = details;
  }
}

function nowDate(clock) {
  const value = typeof clock === 'function' ? clock() : new Date();
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new BrainValidationError('VALIDATION_FAILED', 'Brain clock returned an invalid timestamp.');
  }
  return date;
}

function hasGrant(actor, action, targetId) {
  return actor.grants.some((grant) => (
    grant.action === action && (!grant.target_id || grant.target_id === targetId)
  ));
}

function sameRef(left, right) {
  return canonicalStringify(left) === canonicalStringify(right);
}

function safeReasonForState(state) {
  return {
    rejected: 'approval-evidence-rejected',
    revoked: 'approval-evidence-revoked',
    superseded: 'approval-evidence-superseded',
    expired: 'approval-evidence-expired',
    stale: 'approval-evidence-stale',
    unknown: 'approval-evidence-unavailable',
  }[state] || 'approval-evidence-unavailable';
}

async function resolveActor(actorResolver, request) {
  if (typeof actorResolver !== 'function') {
    throw new BrainAuthorityError('ACTOR_UNVERIFIED', 'A trusted verified actor resolver is required.');
  }
  let raw;
  try {
    raw = await actorResolver(request);
  } catch {
    throw new BrainAuthorityError('ACTOR_UNVERIFIED', 'The trusted actor resolver could not verify an identity.');
  }
  const parsed = actorResolutionSchema.safeParse(raw);
  if (!parsed.success) {
    throw new BrainAuthorityError('ACTOR_UNVERIFIED', 'The trusted actor resolver returned an invalid identity.');
  }
  const actor = parsed.data;
  if (!actor.verified) {
    throw new BrainAuthorityError('ACTOR_UNVERIFIED', 'The resolved actor identity is unverified.');
  }
  if (actor.project_id !== request.project_id) {
    throw new BrainAuthorityError('POLICY_DENIED', 'The resolved actor belongs to a different project.', { reason: 'foreign-project' });
  }
  if (!hasGrant(actor, request.action, request.target_id)) {
    throw new BrainAuthorityError('POLICY_DENIED', 'The resolved actor lacks the exact operation grant.', { action: request.action });
  }
  return actor;
}

function verifyLocalEvidenceRef(projectRoot, ref) {
  if (!ref.path || ref.uri) {
    throw new BrainAuthorityError('POLICY_DENIED', 'Evidence is not locally verifiable.', { reason: 'approval-evidence-unavailable' });
  }
  let source;
  try {
    source = readProjectFileBytes(projectRoot, ref.path, 'Brain evidence');
  } catch {
    throw new BrainAuthorityError('POLICY_DENIED', 'Evidence is missing or unsafe.', { reason: 'approval-evidence-unavailable' });
  }
  if (source.sha256.replace(/^sha256:/, '') !== ref.digest) {
    throw new BrainAuthorityError('POLICY_DENIED', 'Evidence digest does not match canonical bytes.', { reason: 'approval-evidence-mismatch' });
  }
  return source;
}

function assertSupportedVerifiedFact(projectRoot, recordInput) {
  if (!recordInput.claim
      || canonicalStringify(recordInput.payload) !== canonicalStringify({ claim: recordInput.claim })) {
    throw new BrainAuthorityError('POLICY_DENIED', 'Verified facts require the supported exact claim payload.', { reason: 'approval-evidence-mismatch' });
  }
  for (const ref of recordInput.evidence_refs) {
    verifyLocalEvidenceRef(projectRoot, ref);
    const expectedClaim = { subject: ref.id, predicate: 'sha256', value: ref.digest };
    const bindsClaim = canonicalStringify(recordInput.claim) === canonicalStringify(expectedClaim);
    const isSource = recordInput.source_refs.some((sourceRef) => sameRef(sourceRef, ref));
    if (bindsClaim && isSource) return [ref];
  }
  throw new BrainAuthorityError('POLICY_DENIED', 'Verified facts support only an exact observed source SHA-256 claim.', { reason: 'approval-evidence-mismatch' });
}

function assertSupportedLocalDecisionBinding(recordInput, approvalRef) {
  const expectedPayload = { approved_artifact_ref: approvalRef };
  const expectedClaim = {
    subject: approvalRef.id,
    predicate: 'approved-artifact',
    value: approvalRef,
  };
  if (recordInput.type !== 'decision'
      || canonicalStringify(recordInput.payload) !== canonicalStringify(expectedPayload)
      || canonicalStringify(recordInput.claim) !== canonicalStringify(expectedClaim)
      || !recordInput.source_refs.some((ref) => sameRef(ref, approvalRef))) {
    throw new BrainAuthorityError('POLICY_DENIED', 'Local approved knowledge must be the exact supported v58 artifact-reference decision.', { reason: 'approval-evidence-mismatch' });
  }
}

function verifyV58Approval(projectRoot, recordInput) {
  for (const ref of recordInput.evidence_refs) {
    const match = String(ref.path || '').match(/^\.quiver\/runs\/([^/]+)\/approvals\/technical-plan\/v\d+\.md$/);
    if (!match) continue;
    try {
      const verified = resolveVerifiedSpecGovernance(projectRoot, { runId: match[1] });
      if (verified.decision.decision_id === ref.id
          && verified.artifact.path === ref.path
          && verified.artifact.sha256.replace(/^sha256:/, '') === ref.digest) {
        assertSupportedLocalDecisionBinding(recordInput, ref);
        return {
          actorId: verified.decision.actor_id,
          evidenceRefs: [ref],
        };
      }
    } catch {
      // Continue so no partially matching or stale approval can become authority.
    }
  }
  throw new BrainAuthorityError('POLICY_DENIED', 'No exact current v58 approval evidence was verified.', { reason: 'approval-evidence-unavailable' });
}

function knowledgeDigest(recordInput) {
  const withoutApproval = Object.fromEntries(
    Object.entries(recordInput).filter(([key]) => key !== 'approval_ref'),
  );
  return canonicalDigest(withoutApproval);
}

async function resolveCloudReceipt(options) {
  const {
    evidenceResolver,
    projectId,
    requesterActorId,
    approvalRef,
    expectedKnowledgeDigest,
    sourceRefs,
    clock,
  } = options;
  if (typeof evidenceResolver !== 'function' || !approvalRef) {
    throw new BrainAuthorityError('POLICY_DENIED', 'Approval evidence is unavailable.', { reason: 'approval-evidence-unavailable' });
  }

  let raw;
  try {
    raw = await evidenceResolver({
      kind: 'cloud-decision-v1',
      project_id: projectId,
      requester_actor_id: requesterActorId,
      receipt_ref: approvalRef,
      knowledge_digest: expectedKnowledgeDigest,
    });
  } catch {
    throw new BrainAuthorityError('POLICY_DENIED', 'Approval evidence is unavailable.', { reason: 'approval-evidence-unavailable' });
  }

  const result = evidenceResultSchema.safeParse(raw);
  if (!result.success || result.data.status !== 'passed' || !result.data.data) {
    throw new BrainAuthorityError('POLICY_DENIED', 'Approval evidence is unavailable.', { reason: 'approval-evidence-unavailable' });
  }
  const resolved = result.data.data;
  const receipt = parseSchema(cloudDecisionReceiptSchema, resolved.receipt, 'Cloud decision receipt');
  const mismatch = receipt.digest !== canonicalDigest(receipt, 'digest')
    || approvalRef.id !== receipt.id
    || approvalRef.digest !== receipt.digest
    || receipt.project_id !== projectId
    || receipt.knowledge_digest !== expectedKnowledgeDigest
    || !sourceRefs.some((ref) => sameRef(ref, receipt.subject.ref))
    || !sourceRefs.some((ref) => sameRef(ref, receipt.policy.ref))
    || !receipt.actor.evidence_refs.every((ref) => receipt.evidence_refs.some((item) => sameRef(item, ref)));
  if (mismatch) {
    throw new BrainAuthorityError('POLICY_DENIED', 'Approval evidence does not match the proposed knowledge.', { reason: 'approval-evidence-mismatch' });
  }

  const now = nowDate(clock).getTime();
  if (Date.parse(receipt.resolved_at) > now || Date.parse(resolved.checked_at) > now) {
    throw new BrainAuthorityError('POLICY_DENIED', 'Approval evidence contains a future observation.', { reason: 'approval-evidence-mismatch' });
  }
  if (receipt.expires_at && Date.parse(receipt.expires_at) <= now && resolved.state === 'current') {
    throw new BrainAuthorityError('POLICY_DENIED', 'Approval evidence is expired.', { reason: 'approval-evidence-expired' });
  }
  if (receipt.resolution !== 'allowed') {
    throw new BrainAuthorityError('POLICY_DENIED', 'Approval evidence was rejected.', { reason: 'approval-evidence-rejected' });
  }
  if (resolved.state !== 'current') {
    throw new BrainAuthorityError('POLICY_DENIED', 'Approval evidence is not current.', { reason: safeReasonForState(resolved.state) });
  }

  return {
    receipt,
    check: {
      state: 'current',
      checked_at: resolved.checked_at,
      source_revision: resolved.source_revision,
      receipt_ref: approvalRef,
    },
  };
}

function createBrainAuthority(options = {}) {
  const { projectRoot, actorResolver, evidenceResolver, clock } = options;

  async function authorizeRead(projectId, action = 'brain.read') {
    return resolveActor(actorResolver, { action, project_id: projectId });
  }

  async function authorizeAppend(projectId, recordInput) {
    const targetDigest = knowledgeDigest(recordInput);
    const actor = await resolveActor(actorResolver, {
      action: 'brain.write',
      project_id: projectId,
      target_id: recordInput.id,
      target_digest: targetDigest,
    });
    const authorityGrant = AUTHORITY_GRANTS[recordInput.authority_request];
    if (authorityGrant && !hasGrant(actor, authorityGrant, recordInput.id)) {
      throw new BrainAuthorityError('POLICY_DENIED', 'The resolved actor lacks the requested authority grant.', { action: authorityGrant });
    }

    let approvalActorId = null;
    let authorityEvidenceRefs = [];
    let approvalCheck = null;
    if (recordInput.authority_request === 'approved-decision') {
      if (recordInput.approval_ref) {
        const cloud = await resolveCloudReceipt({
          evidenceResolver,
          projectId,
          requesterActorId: actor.actor_id,
          approvalRef: recordInput.approval_ref,
          expectedKnowledgeDigest: targetDigest,
          sourceRefs: recordInput.source_refs,
          clock,
        });
        approvalActorId = cloud.receipt.actor.actor_id;
        authorityEvidenceRefs = cloud.receipt.evidence_refs;
        approvalCheck = cloud.check;
      } else {
        const local = verifyV58Approval(projectRoot, recordInput);
        approvalActorId = local.actorId;
        authorityEvidenceRefs = local.evidenceRefs;
      }
    }

    if (recordInput.type === 'verified-fact') {
      if (recordInput.evidence_refs.length === 0) {
        throw new BrainAuthorityError('POLICY_DENIED', 'Verified facts require verifiable evidence.', { reason: 'approval-evidence-unavailable' });
      }
      authorityEvidenceRefs = assertSupportedVerifiedFact(projectRoot, recordInput);
    }

    return {
      actor,
      approvalActorId,
      approvalCheck,
      authorityEvidenceRefs,
      knowledgeDigest: targetDigest,
    };
  }

  async function refreshRecordAuthority(projectId, requesterActorId, record) {
    if (record.authority !== 'approved-decision') return null;
    if (record.approval_ref) {
      try {
        const cloud = await resolveCloudReceipt({
          evidenceResolver,
          projectId,
          requesterActorId,
          approvalRef: record.approval_ref,
          expectedKnowledgeDigest: record.provenance.knowledge_digest,
          sourceRefs: record.source_refs,
          clock,
        });
        return cloud.check;
      } catch (error) {
        const reason = error.details?.reason || '';
        const state = reason === 'approval-evidence-rejected'
          ? 'rejected'
          : reason === 'approval-evidence-revoked'
            ? 'revoked'
            : reason === 'approval-evidence-superseded'
              ? 'superseded'
              : reason === 'approval-evidence-expired'
                ? 'expired'
                : reason === 'approval-evidence-stale'
                  ? 'stale'
                  : 'unknown';
        return {
          state,
          checked_at: null,
          source_revision: null,
          receipt_ref: record.approval_ref,
        };
      }
    }
    try {
      verifyV58Approval(projectRoot, record);
      return null;
    } catch {
      return {
        state: 'unknown',
        checked_at: null,
        source_revision: null,
        receipt_ref: null,
      };
    }
  }

  return {
    authorizeAppend,
    authorizeRead,
    refreshRecordAuthority,
  };
}

module.exports = {
  BrainAuthorityError,
  assertSupportedLocalDecisionBinding,
  assertSupportedVerifiedFact,
  createBrainAuthority,
  knowledgeDigest,
  resolveCloudReceipt,
  safeReasonForState,
  verifyLocalEvidenceRef,
  verifyV58Approval,
};
