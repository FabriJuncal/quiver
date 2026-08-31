# Quiver v58 — Risk-aware review governance

Status: Implementation Complete — slices 00 through 05 merged; slice-06 PR #144 pending human review and merge

Classification: Level 3 — governance, authorization, integrity, and cross-command runtime contracts

## Source and approval

This specification is derived from:

- docs/requirements/Quiver_Requerimiento_Maestro_v4_Runtime_Evidence_Evals.md, requirements RQ-001 through RQ-009.
- RQ-029 only for propagating conditioned plan decisions into spec, slices, and checks.
- RQ-100 only for the actor identity and authorization boundary needed by governance decisions.
- The approved technical plan and review findings REV-01 through REV-16.

The acceptance baseline below was reconstructed with explicit user authorization on 2026-08-24. It is a normalized, testable baseline rather than a verbatim copy of the master requirement.

The condition-policy, disposition-lifecycle, reason-code, and reviewer-projection clarifications below were explicitly authorized by the user on 2026-08-25 after slice-02 merged. They close implementation ambiguities without expanding the approved v58 scope.

The canonical approval ledger, digest and count formulas, singular approval CLI namespace, compatible plural listing, and required slice-04 scope additions were explicitly authorized by the user on 2026-08-27.

The slice-05 transfer authorization, target grammar, criterion binding, immutable manifest, canonical parity, batch normalization, and required scope additions were explicitly authorized by the user on 2026-08-27 after slice-04 merged.

The slice-06 compatibility metadata, verification mapping, rollback writer mode, stable compatibility codes, enforceable downgrade boundary, and required scope additions were explicitly authorized by the user on 2026-08-31 after slice-05 merged.

The master requirement was an external planning input and is intentionally not an execution prerequisite for this package. SPEC.md and the slice contracts contain the frozen implementation baseline.

## Problem

Quiver currently lacks one canonical contract for deciding which review findings block each phase, how many semantic reviews a run may consume, who may accept or transfer risk, and which exact bytes an approval covers. Without those controls, a plan can loop on work that belongs to later phases, concurrent commands can disagree about state, and projections can report a result that is not supported by the canonical evidence.

## Objective

Introduce risk-aware review governance that:

- selects and enforces a versioned execution profile;
- validates and reconciles structured findings;
- computes phase-aware blockers from policy;
- bounds semantic review loops per run;
- supports eligible approval with conditions without treating it as unconditional approval;
- binds decisions atomically to actor, run, policy, review, dispositions, and artifact digests;
- propagates transferred findings through spec, slices, PRs, and readiness gates;
- preserves compatibility while failing closed on ambiguous or unsafe legacy state.

## Scope

### Included

- Shared repository governance configuration under the versioned governance namespace in .quiver/config.json.
- fast-delivery and high-assurance profile resolution and enforcement.
- Structured finding, disposition, review event, decision, actor, and authorization contracts.
- Phase-aware blocking policy and stable finding lifecycle.
- Run-scoped review budget with atomic reservation and circuit breaker.
- Approved-with-conditions eligibility and lifecycle.
- Digest-bound, actor-bound, atomic approvals.
- Canonical finding transfer into spec, slice briefs, and PR checks.
- Shared human and JSON projections, stable machine codes, and common redaction.
- Additive legacy read/migration behavior, fail-closed rollback mode, directed tests, and documentation.

### Excluded

- A full break-glass workflow.
- General-purpose identity platform or identity providers beyond the first supported GitHub CLI resolver.
- v59 draft version lifecycle, addenda, deterministic amendments, preservation validation, external review import workflow, or generalized retry policy.
- v60 slice contract/state separation.
- A general artifact graph, evidence bundle platform, or data-governance subsystem.
- Release, deployment, distribution, or OTA work.
- Any runtime implementation as part of this documentation stage.

## Canonical model and source of truth

### Configuration

The repository-visible governance namespace in .quiver/config.json is the v58 policy entry point. It contains no secrets. Init, config, doctor, and migration operations must preserve and validate it. Runtime-only .quiver artifacts remain ignored through granular rules rather than a blanket ignore of the whole directory.

### Run-scoped state

Every governed review, finding, disposition, review-budget event, condition, and decision belongs to one explicit run_id. A mutation must target an explicit run or a single unambiguous active run. State from one run cannot satisfy, consume, or invalidate another run.

### Findings and dispositions

The canonical governance store owns finding identity and lifecycle. Provider-supplied IDs are origin metadata, not canonical identity. Omission from a later review does not close a finding. Closing, accepting, transferring, or superseding a finding requires a validated disposition.

The store exposed through the existing run-state abstraction is the only mutable authority for conditions. A governance manifest generated into a spec is an immutable, digest-bound projection of that state. Briefs, matrices, PR content, exports, and gates are projections; none may independently mutate or override a condition. A gate must verify the projection's source digest and fail closed when canonical parity cannot be established.

### Reviews and policy

Provider output is validated evidence input. The provider's aggregate recommendation is not authoritative. Quiver recomputes blocking and eligibility from canonical findings, the effective profile, the current phase, and the exact policy version and digest.

### Approvals

Approval commits are atomic and digest-bound. The canonical decision is distinct from its human and JSON projections. approved-with-conditions is a separate decision kind and must never be represented through the legacy approved.md contract.

Slice-03 may atomically persist canonical dispositions plus an eligibility evaluation and conditioned-decision candidate in the run governance store. It does not publish a final decision, append a run approval projection, create approved.md, or advance the run phase. Slice-04 rereads and revalidates that candidate with the exact artifact bytes and owns the single atomic publication of the final decision plus phase transition.

For slice-04, the run governance store owns the canonical final decision ledger. A decision binds the exact artifact and planner-input bytes, current review, effective governance profile, policy, canonical counts, dispositions, reason, run, and authorized actor. The profile digest is SHA-256 over the stable JSON representation of requested profile, effective profile, normalized requirement categories, policy version, policy digest, and effective controls. finding_count is the size of the complete canonical finding collection; open findings remain a separately derived eligibility projection. criterion_count is the size of the parsed acceptance-criteria collection for acceptance artifacts and the sum of the explicit spec.slices[*].acceptance collections in a structured technical-plan artifact. No provider aggregate participates in these formulas.

The approval commit uses a run-scoped recovery marker and rollback semantics. Until that marker is durably removed, readers fail closed and the operation is not committed. An interrupted or injected failure restores the previous decision, approval projection, legacy unconditional projection, and run phase; approved-with-conditions never creates the legacy projection. Exact recovery of a marker that was already prepared may run before the rollback writer guard; it resolves only that interrupted transaction, after which the requested writer still returns `GOVERNANCE_READ_ONLY` and cannot publish a new decision.

### Projections

CLI status, flow, resume, export, spec generation, slice gates, and PR gates read a shared canonical projection. Counts and labels are derived from structured collections rather than copied aggregates.

## Normative governance rules

### Authorization oracle

The governance namespace in .quiver/config.json contains the versioned authorization policy and is the sole authorization oracle. It must define:

- default_effect, which is deny for every governance mutation;
- actor_bindings from a verified provider subject or explicit local actor ID to zero or more policy roles;
- one rule for each action: approve, approve-with-conditions, accept-risk, transfer-blocker, and extend-review-budget;
- allowed actor IDs and/or roles for each action;
- an independence rule chosen from none, different-from-run-creator, different-from-reviewer, or different-from-executor;
- policy version and digest.

Authenticated GitHub CLI resolves a stable provider subject for the first verified actor adapter; it does not grant roles. Roles come only from actor_bindings. An unknown actor, missing action rule, unknown independence value, or unmatched role is denied. A local unverified actor must be explicitly configured and is never eligible where high-assurance requires verified identity. The decision ledger records actor ID, provider subject, matched policy rule, role evidence, independence result, policy version, and policy digest.

### Finding identity and reconciliation

- Canonical finding IDs are allocated atomically and remain immutable within a run.
- A later review may reference an existing canonical ID supplied in its review context. The referenced finding must belong to the same run.
- Without an explicit canonical ID, Quiver computes an origin fingerprint from normalized category, phase owner, sorted acceptance references, and sorted evidence locations.
- Exactly one open or previously closed fingerprint match reuses the canonical ID. A closed match records a reopened lifecycle event.
- No match allocates a new canonical ID.
- Multiple matches, an incompatible explicit ID, or two new findings with the same fingerprint return FINDING_RECONCILIATION_AMBIGUOUS and invalidate the new review.
- A material identity change must explicitly reference the prior canonical ID through supersedes. Supersession records lineage and never silently resolves the prior finding.
- Summary or title text and provider numbering are not matching keys.

### Review event classification

Event class is explicit immutable command intent, not inferred from provider prose:

| Event | Deterministic trigger | Semantic budget |
|---|---|---|
| full | Review of a complete new candidate version | Consumes one review and one full revision where applicable |
| targeted | Review explicitly limited to declared finding IDs or sections against the same base review | Consumes one review and one targeted amendment |
| retry | Same request-envelope digest after transport or timeout failure before any provider payload is received | Does not consume a semantic review |
| external | A validated review accepted through an external-review adapter | Consumes one review in its declared full or targeted class |

Every full or targeted event increments review_count. The first full review of an initial candidate does not increment full_revision_count. A later full event increments full_revision_count only when its immutable intent names the prior reviewed candidate as parent and submits a complete replacement candidate. A targeted event increments targeted_amendment_count and never full_revision_count. An external event follows the same counter rule for its declared class and parent metadata.

Reservation occurs before provider invocation. A received provider payload, including invalid contractual output, finalizes and consumes the reserved semantic event with outcome valid or invalid-output. A transport or timeout failure before payload receipt converts the reservation to retry and does not consume semantic budget. The last valid review remains current in both failure cases. v58 defines classification and accounting for external events but does not add the general external import workflow.

### Condition eligibility

The canonical path is `governance.policy.condition_dispositions`. It contains `default_effect: deny` and an explicit `rules[]` allowlist. Every rule has `rule_id` plus non-empty `phase_owners`, `categories`, `severities`, and `allowed_dispositions` arrays. A rule matches only when all four selectors include the canonical finding and requested disposition. Matching rules are allow-only and combine as a set union; one or more matching rules permit the disposition and zero matches deny it. Duplicate rule IDs are invalid. No provider recommendation, absent rule, unknown value, list order, or implicit deny override grants eligibility.

The default v58 rules use all contractual severities and categories for the four phase mappings: spec to `transfer-to-spec`, slice to `transfer-to-slice`, pr-review to `transfer-to-pr`, and follow-up to `create-follow-up`. Four additional rules apply only to phase owners spec, slice, pr-review, or follow-up: implementation-detail/testing to `transfer-to-slice`; evidence/operations to `transfer-to-pr`; tooling/follow-up to `create-follow-up`; and optional-hardening to `optional`. Release, requirement, acceptance, and technical-plan appear in no default rule. Release remains denied until an explicit versioned rule permits an existing disposition. `accept-risk` has no implicit eligibility.

Every eligible disposition has at least one evidence obligation. `transfer-to-spec`, `transfer-to-slice`, and `transfer-to-pr` require exactly one non-empty `target`; `create-follow-up` requires exactly one non-empty `target_issue`; `optional` and explicitly allowed `accept-risk` carry no target. Target shape and cardinality are validated in slice-03; referential destination resolution remains owned by slice-05.

A proposed disposition envelope is correlated to one run, current review, policy version, and policy digest. The canonical store assigns each accepted disposition a stable ID, records actor and authorization evidence, and tracks `current` or `superseded` state with an explicit `supersedes` reference. A replacement never becomes current implicitly. Exactly one current disposition is required for every open finding; duplicate historical records do not count as current.

### Slice-05 transfer and downstream projection contract

- `findings transfer` and `findings disposition` mutate only the canonical run store, under the run lock, before a final technical-plan decision exists. Transfer mutations require the independent `transfer-blocker` authorization action. Final conditioned publication remains authorized through `approve-with-conditions`. A current disposition can be replaced only with an explicit `supersedes` reference; no transfer command mutates a published final decision.
- The canonical destination forms are `phase:spec`, `phase:pr-review`, and `slice:<full-slice-id>`. The documented `slice-NN` form is accepted only when it resolves to exactly one generated slice and is normalized to the full canonical slice ID. Historical target forms may be read only when they resolve unambiguously to one of these destinations; otherwise validation fails closed.
- Every transferred criterion is represented by its acceptance reference, redacted content, repository-relative source path, and SHA-256 digest. Individual transfer infers the reference only when the finding has exactly one acceptance reference; otherwise an explicit reference is required. Batch entries carry the reference explicitly. Missing, duplicate, unknown, digest-mismatched, or unsafe criterion content fails before mutation. Every eligible disposition retains at least one explicit evidence obligation.
- The immutable spec-root projection is `GOVERNANCE_MANIFEST.json` with `kind: quiver-planning-governance`, `schema_version: 1`, the complete canonical run-state source digest, final decision ID and digest, bound findings and dispositions, criterion bindings, and a self-digest computed with only the self-digest field omitted. Briefs, traceability, PR evidence, CLI output, JSON output, and readiness checks derive from this manifest and cannot mutate canonical state.
- Canonical parity is resolved from the repository's primary checkout `.quiver/runs` when commands execute from a linked worktree. Missing, ambiguous, stale, or digest-mismatched canonical state fails closed, including in CI when a parity gate is invoked without the protected run state. Slice-05 adds no second store or portability mechanism.
- The historical finding-keyed batch shape and the canonical envelope are accepted as inputs and normalized to one canonical envelope. The complete operation is parsed and validated before mutation, revalidated under the run lock, and committed through one atomic canonical-store write.
- A downstream condition is accepted when its unique current disposition is bound by the final `approved-with-conditions` decision; an open finding remains visibly pending but does not fail a gate solely because it is open. Slice-05 adds no post-decision lifecycle writer or manifest regeneration. Any later canonical mutation makes the full source digest stale and fails closed; closing or refreshing a published condition requires the deferred amendment lifecycle.
- Generated slice metadata and briefs project only findings targeted to that exact slice. The spec-root PR projects all conditioned findings for complete traceability, while only `phase:pr-review` is an operational root-PR target; slice and spec targets remain governed by their own destination gates.

At technical-plan decision time:

| Finding state | Transferability | Result |
|---|---|---|
| Critical security, data-integrity, or rollout | Never transferable in v58 | Ineligible: PROTECTED_CRITICAL_REQUIRES_BREAK_GLASS |
| phase_owner is requirement, acceptance, or technical-plan and phase_blocking is true | Not transferable beyond its owning phase | Ineligible: NON_TRANSFERABLE_BLOCKER |
| disposition is revise-requirement, revise-acceptance, or revise-plan and its owner is not completed | Not transferable | Ineligible: CURRENT_PHASE_REVISION_REQUIRED |
| phase_owner is spec, slice, pr-review, release, or follow-up and policy allows the matching transfer disposition | Transferable to one valid target | Eligible only after target and evidence obligations validate |
| implementation-detail, testing, evidence, operations, tooling, follow-up, or optional-hardening owned by a later phase | Transferable when policy and disposition agree | Eligible only after target and evidence obligations validate |
| Missing, duplicate, stale, unauthorized, or unresolved disposition | Not transferable | Ineligible with the corresponding stable reason |

Eligibility also requires zero undispositioned findings, one current disposition per remaining finding, an authorized independent actor, a valid relative reason path and digest, and exact run/review/policy correlation. High findings in security, data-integrity, or rollout remain subject to the explicit versioned policy and cannot be autoapproved.

Eligibility uses this precedence and stable result vocabulary:

1. Critical security, data-integrity, or rollout returns status `BREAK_GLASS_REQUIRED` and reason `PROTECTED_CRITICAL_REQUIRES_BREAK_GLASS`.
2. A run, review, policy-version, policy-digest, or explicit supersession mismatch returns `DISPOSITION_STALE`.
3. More than one proposed or canonical current disposition for a finding returns `DISPOSITION_DUPLICATE`.
4. No current disposition for an open finding returns `DISPOSITION_MISSING`.
5. Failed decision identity, authorization, independence, or disposition actor correlation returns `DISPOSITION_UNAUTHORIZED` as the eligibility reason while retaining the specific authorization error as evidence.
6. A current-phase hard blocker returns `NON_TRANSFERABLE_BLOCKER`; an unfinished revise disposition returns `CURRENT_PHASE_REVISION_REQUIRED`.
7. A policy mismatch, unsupported action, invalid target cardinality, or missing evidence obligation returns `DISPOSITION_UNRESOLVED`.
8. Only a complete set with no preceding failure returns `ELIGIBLE_WITH_CONDITIONS`.

The conditioned candidate projection records `decision: approved-with-conditions`, `publication_state: candidate`, `reviewer_recommendation` from the current canonical review, and the literal `reviewer_approved: false`. Human output renders the same facts. Neither projection may imply unconditional reviewer approval or final publication before slice-04.

## Functional requirements

### Profiles

- Support fast-delivery and high-assurance as policy-defined profiles.
- Allow profile selection through CLI or shared repository configuration.
- Record the requested and effective profile plus policy version and digest on the run.
- Force high-assurance for policy-classified sensitive categories.
- Reject silent profile downgrade for an active governed run.
- Fail preflight before mutation or provider invocation when a mandatory profile control cannot be met.

The minimum policy contract is:

| Control | fast-delivery | high-assurance |
|---|---|---|
| Acceptance | Human approval optional; at most one revision | Human approval required; at most two revisions |
| Technical plan | Required, brief; at most one review and one full revision | Human approval and independent review required; at most two reviews and one full revision; later work is targeted |
| Spec | Required | Required |
| Execution | Independent PR review, workspace isolation, and per-run budget | Review each slice, security review, workspace isolation, permission envelope, per-run budget, verified approval actor, and independent runtime review |
| Release policy contract | Human merge | Human merge, human release approval, and same artifact identity |

The following categories force high-assurance: authentication, RLS, roles, billing, secrets, destructive migrations, data deletion, production infrastructure, and sensitive multi-tenant changes.

v58 records and projects the release policy contract but does not add release, distribution, deploy, or OTA machinery.

### Structured review

- Validate all contractual finding fields, enums, identifiers, references, and aggregate consistency.
- Reconcile findings across successive reviews with stable canonical identity.
- Preserve the last valid review when a later provider output is invalid.
- Classify outputs into current blockers, later-phase transfers, follow-ups, and optional hardening.

### Budget

- Classify semantic full revision, targeted amendment, technical retry, and external review events deterministically.
- Reserve budget atomically before provider invocation.
- Stop before provider invocation when the run budget is exhausted.
- Require an authorized, audited decision to extend a budget.

### Decisions

- Separate actor verification from action authorization.
- Enforce role and independence requirements from versioned policy.
- Revalidate all bound state inside one critical section before publishing a decision or advancing phase.
- Allow conditioned approval only when eligibility is deterministically established and all remaining findings have valid dispositions.

### Propagation and checks

- Preserve canonical finding identity and origin while transferring findings to a later phase or slice.
- Resolve every transfer target to exactly one existing destination.
- Make generated governance manifests, slice briefs, PR evidence, and checks consistent projections of canonical state.
- Block omitted, orphaned, stale, unresolved, or unknown conditions at the appropriate gate.

### Compatibility

- Read supported legacy state without inventing missing evidence.
- Mark incomplete legacy approvals as legacy-unverified.
- Make migration explicit, idempotent, and verifiable; never write merely because a legacy artifact was read.
- Keep v58 readers and gates available in rollback mode and block unsafe package downgrade while active v58-only conditions or decisions exist.

The repository-visible compatibility contract lives at `governance.compatibility` in `.quiver/config.json` and contains exactly these contractual fields:

- `schema_version: 1`;
- `writer_mode: read-write | read-only`, defaulting to `read-write` for a new or successfully migrated v58 project;
- `minimum_writer_version`, a valid package semver set to the package version that completed the verified migration and never lowered by Quiver.

Read-only inspection derives one of `none`, `legacy-unverified`, `v58-verified`, or `rollback-read-only`. Legacy identity, digest, disposition, condition, or approval evidence that cannot be proven remains visible as `legacy-unverified`; its unavailable counts are `null`, and it cannot satisfy readiness or advance a phase.

The supported migration sequence is deliberately command-minimal: `migrate --dry-run` previews without writes, confirmed `migrate` or `migrate --yes` applies and performs post-write verification, and `doctor --json` is the independent verification surface. Reapplying an already current migration returns `already-current` and performs no writes. The explicit migration writer is the only governed writer allowed to consume `legacy-unverified` preflight evidence. Before its first project write it repeats the complete preflight, compares the approved snapshot, and independently rechecks writer and dependency compatibility. Apply reports verification failure instead of success when the evidence changes or the resulting contract is not readable and consistent.

Setting `writer_mode` to `read-only` is the explicit rollback mode. It never rewrites canonical governance data. Compatible readers and gates continue to operate and fail closed, while every supported v58 writer returns `GOVERNANCE_READ_ONLY` with exit code 1. A writer older than `minimum_writer_version`, or a migrated project whose declared local `create-quiver` dependency is older, returns `UNSAFE_WRITER_DOWNGRADE` with exit code 1. This guard covers Quiver's supported command path; deliberately executing a pre-guard binary outside that path is not representable as a guarantee by the current package and must be prevented operationally through the tracked dependency and review controls.

Compatibility failures use the stable nonlocalized codes `LEGACY_EVIDENCE_UNVERIFIED`, `GOVERNANCE_READ_ONLY`, `UNSAFE_WRITER_DOWNGRADE`, and `MIGRATION_VERIFICATION_FAILED`. Human messages may be localized; JSON keys, statuses, enum values, codes, and exit semantics may not be localized.

## Acceptance criteria

### AC-01 — Shared versioned governance configuration

Given a repository initialized or migrated for v58, when config, init, doctor, or migration reads and writes project configuration, then the governance namespace in .quiver/config.json is schema-valid, repository-visible, free of secrets, and preserved without silently removing unknown compatible keys; runtime-only artifacts remain excluded through granular ignore rules.

Traceability: RQ-001, RQ-002; REV-05, REV-15.

### AC-02 — Deterministic effective profile

Given a profile selected by CLI or shared configuration and classified requirement categories, when governance resolves and enforces the execution profile, then only fast-delivery or high-assurance is selected, the minimum policy contract above applies, a sensitive category forces high-assurance, implementation details owned by a later phase cannot consume a full plan revision, requested and effective profile plus policy version and digest are recorded in every governed artifact, and an active run cannot be silently downgraded.

Traceability: RQ-001, RQ-002; REV-05.

### AC-03 — Verified and authorized governance actor

Given an approval, conditioned approval, risk acceptance, blocker transfer, or budget extension, when the action is attempted, then Quiver resolves identity, evaluates the matching versioned action rule with default deny, applies the configured independence rule, records actor, matched binding, role and policy evidence, and fails before mutation or provider invocation when identity is unavailable, the rule is absent, or the actor is unauthorized. Authenticated GitHub CLI verifies the first supported provider subject but grants no role by itself. Local unverified identity is accepted only when explicitly bound by policy, never satisfies a high-assurance verified-actor rule, and is labeled LOCAL_UNVERIFIED_IDENTITY.

Traceability: RQ-002, RQ-005, RQ-006, RQ-008; RQ-100 limited scope; REV-04, REV-12.

### AC-04 — Valid structured findings with stable identity

Given provider review output, when Quiver accepts it as contractual review evidence, then every finding has a stable unique canonical ID and validated severity, category, phase owner, confidence, evidence, acceptance references, and recommended disposition; phase_blocking=true includes a validated justification; reconciliation follows the explicit ID, fingerprint, reopen, and supersedes rules above; provider IDs remain origin metadata; ambiguous or incompatible matches return FINDING_RECONCILIATION_AMBIGUOUS; and omission from a subsequent review does not close an unresolved finding.

Traceability: RQ-003; REV-09.

### AC-05 — Deterministic phase-aware blocking

Given a valid structured review, profile, policy, and current phase, when review status is projected, then Quiver recomputes blocking from canonical fields rather than trusting a provider aggregate, required_fixes does not mix phases, and the contract exposes plan_required_fixes, slice_required_fixes, pr_required_fixes, and follow_ups while the human view separates current blockers, transfers, follow-ups, and optional hardening.

Traceability: RQ-004; REV-01, REV-05.

### AC-06 — Invalid provider output fails closed

Given malformed JSON, an invalid enum or identifier, a duplicate or colliding finding, a missing contractual field, or an aggregate inconsistent with canonical findings, when output validation runs, then the command returns PROVIDER_OUTPUT_INVALID, publishes no approval or spec transition, preserves the last valid review, and treats any retained raw evidence as redacted and non-contractual.

Traceability: RQ-003, RQ-004; REV-11, REV-15.

### AC-07 — Atomic review budget by run

Given a semantic review request, when Quiver classifies and reserves the event, then the explicit immutable intent and request-envelope rules above distinguish full, targeted, retry, and external events; later-phase implementation details do not consume a full plan revision; reservation is atomic and scoped to run_id; concurrent commands cannot overspend; an accepted external review consumes budget; an invalid provider payload consumes its reserved semantic event while preserving the last valid review; and a pre-payload transport or timeout retry does not consume a semantic review. When budget is exhausted, no provider is invoked, REVIEW_BUDGET_EXHAUSTED plus HUMAN_DECISION_REQUIRED are returned, and the available governed actions include approve-with-conditions, reject, transfer-findings, create-follow-up, and targeted-amendment; extensions are authorized and audited.

Traceability: RQ-006; REV-02, REV-08, REV-10.

### AC-08 — Strict isolation and correlation by run

Given two or more active runs, when reviews, raw evidence, findings, conditions, budget events, approvals, exports, or mutations are read or written, then all records are correlated by run_id, a mutating command requires an explicit or uniquely resolvable run, and no run can consume or satisfy another run's state.

Traceability: RQ-006, RQ-008, RQ-009; REV-06.

### AC-09 — Atomic digest-bound approval

Given an approval candidate, when the decision is committed, then Quiver rereads the exact artifact bytes inside the protected critical section and verifies run, input and artifact digests, version, review digest, profile and policy digests, finding and criterion counts, disposition digest, reason digest, and verified authorized actor. Any stale or mismatched value blocks both decision publication and phase transition, leaving no partial state. Approval show, verify, and export commands read this same record; export includes version, artifact digest, input digest, and criterion count.

Traceability: RQ-008, RQ-009; REV-07.

### AC-10 — Conditioned approval is distinct and eligible

Given unresolved findings after review-budget handling, when approved-with-conditions is requested, then it remains distinct from approved, evaluates the normative eligibility table above, requires an authorized actor, reason, and complete current dispositions, returns stable eligible or ineligible reason codes, and is eligible only with zero non-transferable hard blockers. A Critical security, data-integrity, or rollout finding returns BREAK_GLASS_REQUIRED with PROTECTED_CRITICAL_REQUIRES_BREAK_GLASS; v58 does not bypass it. The decision and every output keep the reviewer's non-approval visible and are never written as legacy approved.md.

Traceability: RQ-005; REV-01, REV-03, REV-13.

### AC-11 — Referentially complete finding transfer

Given an eligible transferred finding, when an individual transfer or batch disposition command is executed and spec and slice artifacts are produced, then planning governance preserves decision kind, approved artifact version and digest, reviewer recommendation, canonical finding ID, run and review origin, destination phase or slice, disposition, acceptance link, criterion content, and required evidence; every target resolves exactly once; the spec governance manifest is an immutable digest-bound projection of the canonical run store rather than a second writer; a traceability matrix is generated as a projection; the destination slice and PR template expose pending findings; and check-slice plus check-pr verify canonical parity and reject omitted, orphaned, unknown, stale, or unresolved references.

Traceability: RQ-007; RQ-029 limited scope; REV-14.

### AC-12 — Canonical representation and counts

Given any human or JSON projection, when criteria, findings, conditions, or budget totals are rendered, then all counts and labels derive from canonical structured collections. A divergence produces REPRESENTATION_MISMATCH and blocks approval or readiness; raw provider aggregates are never contractual.

Traceability: RQ-009; REV-08.

### AC-13 — Shared CLI and machine contract

Given equivalent canonical state, when approve, approvals, flow, status, resume, export, spec creation, slice checks, or PR checks render it, then they use the same projection, stable machine codes, statuses, and exit semantics. JSON mode contains no human prose on stdout and its keys and enum values are not localized.

Traceability: RQ-001 through RQ-009; REV-16.

### AC-14 — Consistent redaction and bounded reason storage

Given governance data containing secrets or sensitive values, when it is persisted, rendered, exported, or retained as raw evidence, then the common redaction boundary is applied. A decision reason is stored by repository-relative path and digest rather than copied in full; contractual data that cannot be safely represented blocks instead of being silently mutated.

Traceability: RQ-003, RQ-005, RQ-008; REV-15.

### AC-15 — Additive migration without false advancement

Given a pre-v58 project, when it is read, diagnosed, or migrated, then supported legacy state remains readable, incomplete evidence is labeled legacy-unverified, read operations do not mutate state, migration dry-run and apply are idempotent and verifiable, and no missing identity, digest, disposition, or condition is invented to advance a phase.

Traceability: RQ-005, RQ-008, RQ-009; REV-03.

### AC-16 — Fail-closed rollback and directed validation

Given active v58-only findings, conditions, or decisions, when rollback or an older writer is attempted, then v58 writers may be disabled while compatible readers and gates remain fail-closed, direct unsafe package downgrade is blocked, and no legacy projection reports false green. Directed fixtures cover profile forcing, invalid output, finding lifecycle, concurrent and exhausted budget, retry classification, actor authorization, conditioned propagation, digest tampering, representation mismatch, and multi-run isolation.

Traceability: RQ-001 through RQ-009; REV-02, REV-03, REV-06, REV-07, REV-11, REV-16.

## Decisions

1. v58 keeps shared governance configuration in .quiver/config.json. Splitting policy into .quiver/policy.yaml is deferred.
2. The first verified actor resolver uses authenticated GitHub CLI evidence. Identity resolution and action authorization remain separate interfaces.
3. The canonical governance store is run-scoped and lock-protected. Human documents are projections.
4. Provider output is evidence input; Quiver owns blocking, lifecycle, counts, and eligibility decisions.
5. Review budget is an append-only event ledger with atomic reservation rather than a mutable aggregate counter.
6. Approval validation and commit form one logical atomic operation over exact final bytes.
7. Approved-with-conditions has its own decision record and cannot reuse the legacy unconditional marker.
8. Migration is additive and dual-read. Rollback disables v58 writers but retains fail-closed readers and gates.
9. Repository lifecycle convention makes slice-00 documentary-only. It freezes the finding schema and enums suggested by the v58 roadmap; slice-01 performs their runtime implementation.
10. Slice-04 canonicalizes approval digests and counts with the formulas in Approvals, persists final decisions in the run governance store, and exposes the RQ-008 `ai approval show|verify|export` surface while retaining plural `ai approvals` as the compatible listing command.
11. Slice-05 uses `transfer-blocker` for pre-decision transfer mutations, freezes the exact-one target and criterion contracts above, and projects canonical state through `GOVERNANCE_MANIFEST.json`; unavailable canonical parity fails closed.
12. Slice-06 keeps migration and rollback command-minimal: compatibility metadata is schema-validated in the existing governance config, apply verifies itself, `doctor --json` is the independent verifier, and rollback is the tracked `read-only` writer mode rather than a destructive data downgrade or new command namespace.

## Slice roadmap

| Order | Slice | Purpose | Acceptance coverage |
|---|---|---|---|
| 00 | slice-00-governance-contracts | Freeze the documentary baseline, normative contracts, decisions, and handoffs | Foundation for AC-01 to AC-16 |
| 01 | slice-01-phase-aware-blocking-policy | Implement config/profile/actor/finding contracts, strict review lifecycle, and phase-aware policy | AC-01 to AC-06, AC-14 |
| 02 | slice-02-review-budget-circuit-breaker | Run event ledger, classification, atomic reservation, and exhaustion | AC-07, AC-08 |
| 03 | slice-03-approved-with-conditions | Eligibility, dispositions, and distinct conditioned lifecycle | AC-03, AC-10 |
| 04 | slice-04-digest-bound-approvals | Atomic actor/run/digest-bound decisions and representation checks | AC-08, AC-09, AC-12, approval surfaces of AC-13 |
| 05 | slice-05-finding-disposition-transfer | Canonical transfer through spec, slices, PRs, and gates | AC-11, AC-13, AC-14 |
| 06 | slice-06-integration-migration-docs | Shared projections, compatibility, rollback, directed tests, and docs | AC-13 to AC-16 |

## Validation strategy

- Unit tests for policy resolution, validation, finding reconciliation, event classification, eligibility, authorization, digest binding, redaction, and legacy normalization.
- Integration tests for run isolation, concurrent budget reservation, approval atomicity, spec propagation, slice and PR gates, migration, and rollback mode.
- Directed CLI end-to-end fixtures for fast-delivery, forced high-assurance, invalid output, exhausted budget, conditioned approval, tampering, representation mismatch, and multi-run reconstruction.
- Human and JSON contract checks for stable codes, clean stdout, localization boundaries, and canonical counts.
- No unrelated full regression, load testing, or deployment validation is required unless implementation reveals a concrete shared-runtime risk.

## Risks and mitigations

- Split-brain state: use one canonical run-scoped store and shared projections.
- Concurrency overspend or partial approval: use existing lock primitives and revalidate inside the critical section.
- Identity dead end: fail before mutation and provide an actionable resolver error; permit local identity only by explicit policy.
- Legacy false green: label unverifiable state and keep rollback readers and gates fail-closed.
- Secret propagation: reuse the common redaction boundary on every new persistence and output surface.

## Delivery readiness

- Acceptance criteria and technical plan are approved.
- All slices have schema-valid contracts and preimplementation handoffs.
- The documentary foundation in slice-00 is completed and merged with recorded structural and semantic evidence.
- slice-01 runtime implementation is completed with executed and independently reviewed evidence.
- slice-02 is completed and merged; slice-03 implementation is completed with executed and independently reviewed evidence.
- slices 00 through 05 are completed and merged; slice-06 implementation and evidence are completed, with human PR review and merge pending.
