# Initiative A — Normative integration and persistence contracts v1

This document complements SPEC.md and is normative for all A slices and Cloud's
single Engine adapter. Decision DEC-A-006, 2026-09-06: make the public port,
storage transactions and stale review behavior explicit before implementation.
Reason: independent readiness audit A-01/A-03/A-04/A-05 found implementation
ambiguities; no source requirement is removed or changed.

## Common values and validation

- ID: nonempty ASCII `[A-Za-z0-9][A-Za-z0-9._:-]{0,127}`. Filesystem names use
  UUIDs or sequence numbers, never raw supplied IDs.
- Digest: lowercase SHA-256 hexadecimal, 64 characters.
- Timestamp: ISO 8601 UTC date-time; invalid or nonfinite dates are rejected.
- Ref: `{id:ID,digest:Digest,path?:relativePath,uri?:string}`; at most one of
  path/uri is present. URI is an absolute identifier, max 2048 characters, with
  no embedded credentials. Path is project-relative POSIX with no absolute,
  drive, traversal or symlink escape. External refs use an explicit URI instead
  of being interpreted as filesystem paths. Never fetch a URI in offline mode.
- JSON values only; unknown fields in security/identity/mutation inputs fail
  validation. Record descriptive payload may contain ordinary JSON fields.
- `evidence_status`: `verified|claimed|unknown|unverified|not-tested|failed`.
- Result `status`: `passed|blocked|failed|not-tested|capability-unavailable`.
- Result: `{schema_version:1,status,code,data,errors,evidence_status}`; errors is
  an array of `{code,message,details?}` with safe JSON details. Empty success
  errors and explicit null data are permitted. No secret-bearing input echo.
- Verification describes the exact operation: a digest check may be verified
  while the enclosed business claim remains claimed. Keep `claim_evidence_status`
  in data separate from result evidence. Creating content never proves its claim.
- Per-request serialized input limit 4 MiB and at most 10,000 records/refs;
  unsupported values and exceeded bounds return VALIDATION_FAILED before writes.

## Public Engine API

Package entrypoint: `require('create-quiver/engine')`. Package exports must retain
any previously supported root/subpath behavior; add `./engine` explicitly rather
than hiding historical deep imports without migration. CLI binary is unchanged.

`createEngine({projectRoot,actorResolver,evidenceResolver,clock})` constructs a project-scoped
service. `clock` defaults to real UTC time. Without an injected trusted resolver,
the local adapter preserves v58's unverified identity and supplies no new Brain
grants; protected calls fail ACTOR_UNVERIFIED. Every method returns a Promise<Result>.
Expected validation, policy, capability, storage and conflict errors resolve to
Result. Only invalid constructor programmer configuration may throw. No method
invokes a provider or performs network activity implicitly.

The resolver is an injected trusted function called for EACH operation with
`{action,project_id,target_id?,target_digest?}`. It returns
`{actor_id,verified,project_id,grants:[{action,target_id?}],evidence_refs:[]}`.
Missing/unverified identity, foreign project or missing exact action grant denies
access. No wildcard grant is inferred. The Cloud server creates the resolver from
its authenticated session and membership; HTTP request data cannot replace it.
All project Brain reads, context operations and exports require a resolved grant,
not only writes. Pure envelope verification checks supplied bytes without a
project-read grant and does not attest actor identity unless evidence is resolved.

Mutation context is `{operation_id,expected_revision}` only. It never accepts
actor, role, grants or an assertion of verified authority. Duplicate operation_id
with same canonical input returns original result; different input returns
IDEMPOTENCY_CONFLICT. expected_revision must equal current store revision or
return REVISION_CONFLICT. Dry-run CLI resolves the same validations without
writing operation records. Methods are bounded atomic local operations; no
long-running cancellation protocol is claimed by v1.

The optional evidenceResolver is a trusted, read-only constructor dependency,
never an operation/body field. It adds the Cloud receipt verifier below; it does
not replace the existing v58 local approval verifier or confer actor grants.
The idempotency digest covers method and canonical business input, excluding
operation_id and expected_revision. After current authorization/evidence checks,
a committed same-input operation replays before the CAS check; an uncommitted
revision conflict can retry with the same ID/input and refreshed expected_revision.

| Method | Input | Result data on success | Required action |
|---|---|---|---|
| envelopes.create | `{id,type,version,payload,parents:Ref[],inputs:Ref[],relations:[{kind,target:Ref}],status,claim_evidence_status}` | `{envelope}` | `artifact.create` |
| envelopes.verify | Envelope v1 defined below; local ref resolution is server-owned | `{valid,issues:[],unresolved_refs:Ref[],claim_evidence_status}` | Pure verification; project refs require `artifact.read` |
| policy.explain | `{action,target_id,target_digest?,policy_ref?}` | `{allowed,rule,reason,remediation,actor_id,policy_ref}` | Authenticated identity; evaluation uses requested action grant |
| policy.authorize | Same as explain | Same decision, no ledger write | Requested action grant |
| brain.append | `(record,mutationContext)` | `{record,revision,replayed}` | `brain.write` plus authority-specific grant |
| brain.query | `{ids?:ID[],types?:string[],validity?:string,limit?:integer}` (active, superseded or all) | `{records,revision,next_cursor:null}` | `brain.read` |
| brain.exportVault | `{destination:relativePath,include_history?:boolean}` | `{manifest,files:relativePath[],revision}` | `brain.export` |
| brain.importProposal | `({base_revision,records:Record[],source_refs:Ref[]},mutationContext)` | `{proposal_id,diff,status:'proposed',revision}` | `brain.propose` |
| context.select | Task defined below | `{manifest}` | `context.read` |
| context.impact | Same Task | `{nodes,edges,changes,risks,excluded,unknown,required_verification}` | `context.read` |
| context.verify | Context Manifest | `{fresh,changed_refs,missing_refs,contradictions}` | `context.read` |

For policy explain, a denied decision is a successful explanation with allowed
false; policy.authorize returns blocked/POLICY_DENIED. Mutation responses can be
verified for storage/digest correctness without upgrading record claim evidence.
Query limit defaults 100, max 1000; over-limit result includes `truncated:true`
and `total` instead of silently dropping entries. Context mandatory records are
not subject to this listing limit. Query defaults validity active.

Task: `{id:ID,requirement_ids:ID[],module_paths:relativePath[],mandatory_refs:Ref[],
budget_bytes:positiveInteger,question?:string}`. Budget may not exceed the common
4 MiB bound. Manifest v1 and Envelope v1 below define their exact serialized
forms; optional fields are marked `?`, all other fields are required.

### Envelope v1 and Context Manifest v1

Envelope v1 is a plain object with only these fields:

```text
{
  schema_version: 1, id: ID, type: ID, version: positiveInteger,
  digest: Digest, parents: Ref[], inputs: Ref[],
  actor: {actor_id: ID, verification: "verified" | "unverified", evidence_refs: Ref[]},
  status: ID, evidence_status: EvidenceStatus, payload: JSON,
  relations: {kind: RelationKind, target: Ref}[]
}
```

EvidenceStatus is the common evidence_status enum. RelationKind is exactly
derives-from, supersedes, amends, verifies, executes, approves or deploys.
Artifact status is a bounded domain ID (for example draft or approved), not
Result.status and not itself an authorization decision. Its type owner defines
valid lifecycle transitions. Envelope creation derives actor from the trusted
resolver and copies the requested claim_evidence_status to evidence_status;
neither value is taken from an actor supplied in payload. Unknown top-level or
actor fields are invalid. Digest uses the canonical JSON algorithm in SPEC.md,
excluding only the envelope's own digest. Verification checks schema and digest;
claims of actor verification/approval require resolved external authority refs.
Missing authority evidence is explicitly unresolved, never proof from the actor
field alone. This shape also wraps derived legacy sidecars without rewriting
their source bytes or upgrading legacy claims.

Context Manifest v1 is a plain object with only these fields:

```text
{
  schema_version: 1, task_id: ID, task: Task, source_refs: Ref[],
  selected: ContextEntry[], excluded: ContextEntry[],
  trusted_instructions: ContextContent[], untrusted_content: ContextContent[],
  byte_counts: {budget: nonnegativeInteger, selected: nonnegativeInteger,
    mandatory: nonnegativeInteger, excluded: nonnegativeInteger},
  contradictions: Contradiction[], created_at: Timestamp, digest: Digest
}
ContextEntry = {
  ref: Ref, authority: Authority, validity: "active" | "superseded" | "expired" | "unknown",
  confidence: {score: numberInZeroToOne | null,
    basis: "evidence" | "inferred" | "unknown", evidence_refs: Ref[]},
  reason: nonemptyString, mandatory: boolean, bytes: nonnegativeInteger
}
ContextContent = {ref: Ref, content: JSON}
Contradiction = {
  subject: ID, predicate: ID, refs: Ref[],
  status: "unresolved" | "resolved", resolution_ref: Ref | null
}
Authority = "policy" | "approved-decision" | "requirement" |
  "authorized-input" | "agent-assumption"
```

Task identity must equal task_id; byte_counts.budget equals task.budget_bytes.
All selected/excluded refs are unique and present in source_refs; content arrays
partition selected refs exactly once. Only active records with verified
instruction authority can enter trusted_instructions; assumptions, external
content and unknown authority remain untrusted_content, never executable policy.
Record bytes count canonical UTF-8 content; selected/mandatory/excluded totals
sum their corresponding entries. Budget is measured using that same rule.
Confidence.score is null for deterministic sources without a measured score;
inferred supplied scores retain basis=inferred and source evidence, not invented
statistics. Resolved contradictions require a current authorized resolution_ref
binding every conflicting digest. Manifest digest uses canonical JSON excluding
its own digest. context.verify validates this schema, source identity/digests,
budget/partition consistency, validity and current contradiction resolution before
returning fresh=true. Changed input is not repaired silently during verification.

### Brain record input and authority bootstrap

Record input: `{id,type,payload,source_refs:Ref[],authority_request,
supersedes?:ID[],claim?:{subject,predicate,value},evidence_refs:Ref[],approval_ref?:Ref}`.
The store derives actual authority and created_at from the trusted resolver and
clock. Policy authority requires `brain.policy.write`; approved decision requires
`brain.decision.write` plus a digest-verified v58 approval ref or the exact current
Cloud receipt defined below; requirement requires
`brain.requirement.write`; authorized input requires `brain.input.write`;
assumption is the lowest permitted level. A rejected requested authority is an
error, never silent downgrading. verified-fact requires verifiable evidence; no
self-supplied `verified:true` field is accepted. Relations and validity are derived
from canonical records, not caller claims.

Slice 05 owns `lib/brain/authority.js`, a narrow adapter taking trusted
actorResolver and optional evidenceResolver constructor dependencies, never as
record or mutation inputs.
It validates the per-operation resolver shape, exact project/action and relevant
authority grants above; decision/fact elevation additionally resolves and checks
the evidence refs. Missing resolver, v58's unverified local identity, unsupported
v58 action or unverifiable approval fails closed before record/journal writes.
Initial project setup creates only the empty Brain; it cannot manufacture policy
or an approved decision. Positive privileged storage tests inject a trusted test
resolver and real digest-bound fixture evidence and are labelled as fixtures.
Slice 10 connects the explicit local policy/actor configuration to this same
adapter without changing its contract. Thus slice 05 does not pretend that
v58's five existing governance actions already include brain.* permissions.

DEC-A-008, revision 1.0.2, 2026-09-06: close residual A01/A04 by specifying exact
Envelope/Manifest schemas and this fail-closed authority bootstrap. Reason: a
complete signature must be consumable without guessed fields, and unverified
local identity cannot be promoted to trusted Brain authority. No source criterion
or empirical gate is weakened.

### Cloud decision receipt authority extension

DEC-A-009, revision 1.0.3, 2026-09-06: cross-boundary finding X03 identified that
B's DecisionRecord is not a v58 approval ledger entry. Add this receipt verifier,
not another v58 writer or an invented local approval reference. This is new
integration information; the closed A01–A05 risk coverage and local verifier,
read grants, lock/recovery rules and legacy evidence limits remain unchanged.
No source criterion, empirical gate or public Result enum changes.

CloudDecisionReceipt v1 has exactly these fields; common ID/Ref/digest bounds
apply. It is immutable and its digest excludes only its own digest field:

```text
{
  schema_version: 1, type: "cloud-decision-receipt", id: ID,
  organization_id: ID, project_id: ID, decision_ref: Ref,
  subject: {ref: Ref, version: positiveInteger}, knowledge_digest: Digest,
  action: ID, actor: {actor_id: ID, evidence_refs: Ref[]},
  policy: {ref: Ref, rule: ID}, resolution: "allowed" | "rejected",
  resolved_at: Timestamp, expires_at: Timestamp | null,
  evidence_refs: Ref[], digest: Digest
}
```

approval_ref selects this receipt only; it is not an authorization assertion.
knowledge_digest equals the canonical digest of the exact Brain record input
excluding only approval_ref, preventing a circular digest. The approved proposal
already includes every payload, source/evidence ref, authority_request and
supersession. Its source_refs must include the receipt's subject.ref and
policy.ref. One receipt cannot authorize a different record or payload. A v58
approval continues through its existing evidence_refs path; Cloud may not forge
v58 paths/IDs. Unknown receipt/actor/security fields fail validation. A receipt's
actor is the original verified decision-maker, not automatically the current
Brain writer; that writer still needs its own current project/action grants.

For each authority-dependent operation, A calls the injected function:

```text
evidenceResolver({
  kind: "cloud-decision-v1", project_id: ID, requester_actor_id: ID,
  receipt_ref: Ref, knowledge_digest: Digest
}) -> Promise<Result>
success data = {
  receipt: CloudDecisionReceipt, source_revision: nonnegativeInteger,
  checked_at: Timestamp,
  state: "current" | "rejected" | "revoked" | "superseded" |
    "expired" | "stale" | "unknown"
}
```

The trusted source resolver reads the committed canonical decision, receipt and
lifecycle evidence in the mapped project/organization, not request-supplied
receipt bytes. It verifies the decision/subject version and digests, deciding
actor and authorized resolution evidence, exact action and effective policy
ref/rule, and current revocation/supersession/expiry state in one consistent source
snapshot. A separately validates the result/receipt schema, receipt digest/ref,
project, knowledge_digest and source refs; resolved_at/checked_at cannot be in the future and an
expired receipt cannot be current. Only allowed + current can elevate authority.
The resolver's current decision policy must explicitly support continuing
authority; unknown policy or unverifiable actor evidence is not current. The
resolver is part of the trusted server boundary, never selected by a URI, signed
field, caller-supplied verified flag or plugin payload. Digest/signature validity
alone proves neither approval nor freshness. No implicit network lookup is added.

Resolve afresh for each append, query/export authority projection and
context.select/impact/verify; do not reuse a prior request's current result.
checked_at and source_revision describe the observed snapshot, not a lease or
cross-store atomicity guarantee. A verifies immediately before its local commit;
B releases its StorePort transaction before calling A. Later revocation never
rewrites historical receipt/record bytes: read projections add
`authority_check:{state,checked_at,source_revision,receipt_ref}` using the state
enum above, nullable checked_at/source_revision when no source can be checked.
Effective validity is unknown for revoked/rejected/stale/unknown and expired or
superseded for those states. Such records are excluded from the default active
query but remain visible through validity=all and historical exports. Original
authority/provenance remains historical, not a claim of currently active authority.
Offline exports retain the last check as dated evidence, never current proof.

Absent resolver/receipt, mismatch, rejected resolution, unresolved source or
revocation blocks authority elevation with POLICY_DENIED and safe
`details.reason` from `approval-evidence-unavailable|approval-evidence-mismatch|
approval-evidence-rejected|approval-evidence-revoked|approval-evidence-superseded|
approval-evidence-expired|approval-evidence-stale`. No downgrade-and-write occurs.
Noncurrent optional context stays untrusted/excluded with a reason; a required
approved contract blocks selection. context.verify returns blocked/CONTEXT_STALE
with fresh=false when approval authority changed or cannot be revalidated, even
if all content digests are unchanged. No stale record can enter trusted_instructions
or settle a contradiction; the existing executor must consume this result before
provider calls/writes. Pure offline byte verification may still verify a digest,
but cannot attest current Cloud approval.

Slice 05 implements receipt schema/authority and dynamic read projections;
07 consumes freshness during selection; 08 consumes it for impact, contradiction
resolution and executor verification; 10 retains the no-ledger policy oracle;
11 wires the optional dependency through all services and freezes positive and
negative consumer vectors. B05 is the only receipt writer/bridge owner and B12
reuses its outbox. All fixture approvals remain explicitly fixture evidence.

Codes and exits for new contract mode:

| Class | Representative codes | Exit |
|---|---|---:|
| Success | OK, EXPLAINED | 0 |
| Validation | VALIDATION_FAILED, DIGEST_MISMATCH, REFERENCE_INVALID | 2 |
| Policy | POLICY_DENIED, ACTOR_UNVERIFIED, CONTRADICTION_UNRESOLVED | 3 |
| Capability | CAPABILITY_UNAVAILABLE, LEGACY_EVIDENCE_UNVERIFIED | 4 |
| Runtime | STORAGE_FAILED, RECOVERY_REQUIRED | 5 |
| Security | SECRET_DETECTED, UNSAFE_PATH | 6 |
| Conflict | REVISION_CONFLICT, IDEMPOTENCY_CONFLICT, CONTEXT_STALE, LOCK_CONFLICT | 7 |
| Budget | CONTEXT_BUDGET_EXCEEDED, REVIEW_BUDGET_EXHAUSTED | 8 |

## P0 machine surface and compatibility decision

DEC-A-007: v6 V62 defines stable fields and error classes but no fixed numeric
exit range. Existing CLI outputs and exits are the compatibility baseline. The
untracked historical v4 requirement is not a canonical override. Retain integer
schema_version 1 consistent with existing Quiver contracts and freeze the new
exit mapping above.

P0 covers flow, dashboard, version, plan, graph, next, ai status, ai inspect,
ai export, ai approvals, ai approval show/verify/export, ai draft operations,
brain operations, artifact verify and policy explain. Existing --json behavior
remains unchanged. An additive `--contract-version 1 --json` produces the new
canonical Result and exit classes for existing P0 commands. New A commands use
Result v1 by default; unknown contract versions fail before writes. Existing
localized human mode and old JSON must pass compatibility tests. Envelope mode
parses internal canonical command results, never subprocess human prose.

## Draft transition, ownership and crash protocol

Keep existing `drafts/001.md` naming resolved by approvalDraftVersionPath.
Phase metadata adds `draft_integrity_version:1`, `selected_version`, an explicit
integrity state per version and last operation. `meta.draft`/draft.md remain the
compatibility projection of selected current; latestDraftVersion must keep its
documented selection semantics where needed, and allocation always uses max
history. A reader never guesses approval from the largest version number.

| Operation | Preconditions | Effect |
|---|---|---|
| save candidate | valid input binding; no pending transaction | New immutable draft; supported preservation passes then current; loss or unsupported structural comparison stays draft/corrupted and does not auto-select |
| select/restore | same project/run/phase, non-corrupt artifact, current inputs | Set selected current only; prior reviewed/approved history retained |
| review | selected artifact/input digests valid; budget and actor permit | Append exact digest-bound review; expose reviewed projection |
| approve/condition | existing v58 review/findings/policy checks pass for selected identity | Existing v58 approval commit protocol; no bypass |
| reject | selected exact version, authorized decision | Append rejection; requires explicit valid restore, never implicit approval |
| supersede | committed replacement for exact parent | Historical parent retained, no effective current duplicate |
| corrupt | digest mismatch or structural loss | Disqualify only affected version; preserve valid predecessor |

Supported structured collections: requirements (id), acceptance_criteria (id),
slices (slice_id), and references to these identities. Markdown support uses
explicit VNN-RQ-NN, RQ-NNN, AC-NN and slice-NN IDs plus structured fenced JSON
sections. Unstructured content can be stored as draft but cannot silently replace
current: explicit `--acknowledge-unverified` selection records actor, reason and
the unsupported check; it remains unverified and cannot satisfy required strong
verification. A first unstructured draft remains a draft until selection/review.
Compatibility applies to old readers, not a bypass of new integrity enforcement.

Selection does not mutate run governance, findings or immutable review history.
When selected identity differs from the current review or conditioned candidate,
candidate/phase-gate readers report stale and require a new bound review; do not
clear findings or reuse a final decision for a different version. Closed runs and
foreign phase/source bindings reject selection. Phase-only operations cannot
acquire a run lock while holding their phase lock. Any combined run/governance
mutation follows existing run-lock → planner-phase-lock order. Writer mode checks
run before either write path.

Phase-local journal: `draft-integrity-commit.json` under the existing phase
approval root. Contains schema_version, operation_id, phase, selected version,
expected metadata digest, and before/after digest+base64 bytes for the allowlisted
projection targets meta.json and draft.md only. Candidate immutable version is
written exclusively before publishing the journal; no caller-supplied target
paths. Validate journal size/digests/ownership and all target ancestors; symlink
or malformed journal fails closed. Do not overlap a v58 approval commit marker.

| Crash point | Recovery |
|---|---|
| Before journal | Old metadata/current remain; orphan immutable candidate stays inspectable, not selected |
| Journal published, neither projection written | Roll forward only if target bytes match before or after digests |
| Some projections written | Roll forward remaining allowlisted targets from journal |
| Both projections written, journal present | Verify both after digests, then remove journal |
| Unexpected third digest or invalid marker | RECOVERY_REQUIRED; no overwrite or deletion |

Write journal and projection files with atomic rename in their own directory;
fsync files and directory where platform supports it; record weaker durability
capability instead of claiming universal power-loss safety. Readers refuse
pending transactions until explicit safe recovery under the phase lock.

## Brain persistence, export and deletion protocol

Canonical root: `.quiver/brain/`; `manifest.json` contains schema_version 1,
project_id (stable UUID), revision, record_refs, proposal_refs and operation_refs.
Immutable records: `records/<uuid>.json`, each digest-linked by manifest.
Proposals: `proposals/<uuid>.json`, never active records before approval.
Derived index: `index.json`, digest bound to manifest and fully rebuildable.
Journal: `commit.json`; same before/after allowlisted-manifest protocol as above.
Lock: existing Quiver lock primitive named `brain`; never rename/delete its
parent `.quiver` root. One transaction exclusively writes a new immutable record,
publishes journal, swaps manifest, rebuilds or invalidates index, verifies and
removes journal. Pending/foreign/corrupted transactions fail closed; recovery
accepts only recognized before/after digests and project identity.

Export snapshot includes manifest and all referenced record/proposal bytes,
including superseded history unless include_history false is explicitly requested.
Portable vault is a derived projection; exported manifest states omissions.
Destination must be new/empty, project-relative and not contain canonical Brain
or another protected internal path. Source/destination symlinks are rejected.
No writes or secret material before validation completes.

`brain delete --dry-run` lists exact store files and exclusions. Real deletion
requires explicit `--confirm-delete <project_id>` and brain.delete authorization.
Under Brain lock, atomically rename only `.quiver/brain` to
`.quiver/brain-trash/<project_id>-<operation_id>` after verifying ancestor types;
this preserves recoverability and does not delete exports or unrelated state.
Record the quarantine path in the result; absence of active root means inactive
memory, not silent fresh initialization on query. Interrupted rename is either
old active or fully quarantined; both existing is a conflict requiring inspection.
No automatic permanent purge is part of A. Creating a fresh Brain is an explicit
init action after delete.

## Required envelope coverage

V62 adapts all new artifacts: draft/effective-contract snapshots, Brain records
and vault manifest, context manifest and impact result, and new policy decisions.
Preserve already-persisted contractual bytes; store a digest-bound sidecar/derived
envelope where rewriting would invalidate v58 identities. The envelope records
artifact ID/type/version and exact payload/input/parent digests; it never changes
legacy evidence status. The existing v58 decision ledger remains authority, with
a verified derived envelope. Tests must demonstrate each artifact family through
the facade, not only standalone envelope unit fixtures.

## Required contract fixture vectors

Slice 11 owns tests/fixtures/engine-v1/contracts.json with valid and invalid
vectors for EACH public method. Required variations include missing/unknown
field, invalid type/ID/path, bounded size, wrong project/grant, forged record
authority, repeated/conflicting operation ID, stale revision, unresolved evidence
and actual success. Slice 12 freezes a consumer contract test importing the
installed npm package's create-quiver/engine, then runs the four PLAN-A E2E flows.
Fixtures are independent acceptance inputs; expected statuses/codes follow this
document, not computed by the implementation under test.
