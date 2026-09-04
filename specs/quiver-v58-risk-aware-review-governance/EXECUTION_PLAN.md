# Execution Plan — Quiver v58 Risk-aware Review Governance

Status: Complete — all seven slices validated, reviewed, and merged

## Objective

Deliver the approved v58 governance contract in seven reviewable slices while preserving run integrity, compatibility, and fail-closed behavior.

## Preconditions

- Use SPEC.md as the accepted requirements baseline.
- Complete slice-00 and merge its human-reviewed publication PR before beginning runtime implementation.
- Re-read docs/INDEX.md and the workflow documents routed by it before executing a slice.
- Open only the source, tests, and documentation listed by that slice unless new evidence requires a scoped amendment.
- Do not widen into v59, v60, release, deployment, or a general identity platform.

## Order and dependencies

1. slice-00-governance-contracts
2. slice-01-phase-aware-blocking-policy
3. slice-02-review-budget-circuit-breaker
4. slice-03-approved-with-conditions
5. slice-04-digest-bound-approvals
6. slice-05-finding-disposition-transfer
7. slice-06-integration-migration-docs

Execution is intentionally serial. Several slices share governance state, commands, and tests; serial delivery keeps contract changes reviewable and prevents incompatible state models.

## Slice plans

### Slice 00 — Governance contracts

Objective: freeze the documentary baseline and make every v58 contract, decision, dependency, and handoff executable before runtime work begins.

Key work:

- Reconcile RQ-001 through RQ-009, limited RQ-029/RQ-100 dependencies, AC-01 through AC-16, and REV-01 through REV-16.
- Freeze the authorization oracle, finding reconciliation, budget classification, condition eligibility, source-of-truth, migration, and rollback rules in SPEC.md.
- Validate the seven slice contracts, dependency graph, write scopes, execution briefs, and closure templates.
- Record any accepted deviation before an implementation branch is opened.

Validation:

- Slice JSON Schema, handoff, dependency, strict spec, Markdown, and diff checks.
- Semantic review proving there is one condition authority and no unresolved policy oracle.
- No runtime source or test modification.

### Slice 01 — Phase-aware blocking policy

Objective: implement the shared governance configuration, profile and actor contracts, accept only valid structured reviews, reconcile stable findings, and compute blockers for the current phase from policy.

Key work:

- Preserve a shared governance namespace in .quiver/config.json and granular runtime ignore behavior.
- Define strict schemas and stable enums without duplicating canonical concepts.
- Resolve CLI/config requested and effective profiles deterministically and propagate policy identity to governed artifacts.
- Implement the GitHub CLI identity resolver and the versioned default-deny authorization oracle.
- Validate provider review output strictly before contractual persistence.
- Preserve the last valid review on invalid output.
- Reconcile canonical finding identity using explicit IDs, invariant fingerprints, reopen events, and supersedes lineage.
- Recompute phase blocking and separate blockers, transfers, follow-ups, and optional hardening.
- Enforce blocking justification and the phase-separated contractual required-fix collections.
- Redact raw and rendered evidence through the common boundary.

Validation:

- Contract/schema, config/init/doctor preservation, CLI/config selection, and profile forcing tests.
- Verified, local-policy-permitted, unavailable, unauthorized, default-deny, role-binding, and independence actor cases.
- Positive and invalid provider fixtures.
- Explicit-ID, fingerprint, duplicate, ambiguous collision, omission, reopen, reformulation, and supersedes cases.
- fast-delivery and high-assurance phase-policy matrices.
- Fail-closed state preservation and redaction checks.

### Slice 02 — Review budget and circuit breaker

Objective: bound semantic review loops with an atomic per-run event ledger.

Key work:

- Classify full revision, targeted amendment, technical retry, and external review from immutable command intent and request-envelope identity.
- Reserve capacity under the existing locking discipline before provider invocation.
- Derive counts from events and isolate concurrent runs.
- Stop before provider invocation on exhaustion.
- Offer the governed human next actions without auto-executing one.
- Authorize and audit budget extension.
- Verify one-to-one canonical review and valid ledger-outcome history before further mutation.
- Recover interrupted governed review commits before later mutation or run closure.

Validation:

- Event classification unit tests.
- Concurrent reservation and multi-run integration tests.
- Exhaustion, timeout retry, external review, invalid provider payload consumption, preserved last valid review, and extension cases.
- Fault-injected commit recovery, corrupt/foreign marker rejection, unverifiable-history rejection, and provider/close race cases.

### Slice 03 — Approved with conditions

Objective: add an explicit conditioned decision with deterministic eligibility and complete dispositions.

Key work:

- Model approved-with-conditions separately from approved and apply the normative transferability matrix and stable ineligibility reasons.
- Apply the authorized stable-code precedence and versioned default-deny condition-disposition allowlist; release has no implicit allowance.
- Require reason, authorized actor, and one valid current disposition for every remaining finding.
- Track current/superseded disposition state explicitly and validate target shape and evidence presence while deferring referential destination resolution to slice-05.
- Reject non-transferable blockers and Critical security, data-integrity, or rollout findings.
- Make one canonical source own condition resolution.
- Prevent legacy approved.md from representing conditioned state.
- Persist the eligible conditioned candidate without publishing a final decision or advancing phase; slice-04 owns both operations atomically.

Validation:

- Eligible and ineligible matrices.
- Missing, duplicate, stale, or unauthorized dispositions.
- BREAK_GLASS_REQUIRED without implementing a bypass.
- Legacy downgrade and false-green prevention.
- Successful and failed evaluation both leave final decision publication and phase advancement untouched.

### Slice 04 — Digest-bound approvals

Objective: commit decisions atomically against exact final bytes and all relevant governance state.

Key work:

- Build an approval candidate from the explicit run and canonical projection.
- Re-read bytes and recompute all bound digests and counts inside the lock.
- Verify actor authorization and independence at commit time.
- Publish decision and phase transition as one logical operation.
- Reject representation divergence and stale state.
- Make approval show, verify, and export consume the same digest-bound record.

Validation:

- Tampering and stale digest cases for every bound input.
- TOCTOU and injected partial-write failure cases.
- Multiple active runs and ambiguous run selection.
- Human/JSON count mismatch and stable machine-code checks.

### Slice 05 — Finding disposition and transfer

Objective: preserve finding identity and conditions across generated spec, slices, PRs, and gates.

Key work:

- Validate transfer targets before render or mutation.
- Support individual transfer and batch disposition commands.
- Generate one immutable digest-bound manifest from the canonical run store and keep every downstream view read-only.
- Propagate decision kind, approved artifact identity, reviewer recommendation, origin, disposition, acceptance mapping, target, and evidence obligation.
- Generate the traceability matrix and expose pending findings in destination slices and PR templates.
- Gate slices and PRs on canonical condition state.
- Apply shared redaction to generated and exported surfaces.

Validation:

- Exact-one target resolution.
- Omitted, orphaned, stale, unknown, and unresolved references.
- Spec create from unconditional and eligible conditioned decisions.
- Slice brief and PR traceability checks.

### Slice 06 — Integration, migration, and documentation

Objective: make all CLI surfaces consistent, preserve legacy projects, prove rollback behavior, and document operations.

Key work:

- Unify status, flow, resume, export, approval, spec, slice, and PR projections.
- Stabilize error code, status, exit, JSON stdout, and localization contracts.
- Add explicit idempotent migration and legacy-unverified behavior.
- Add read-only fail-closed rollback mode and unsafe-downgrade guard.
- Persist the authorized `governance.compatibility` metadata, use `doctor --json` as the independent verifier, and keep the existing migrate command namespace.
- Return `LEGACY_EVIDENCE_UNVERIFIED`, `GOVERNANCE_READ_ONLY`, `UNSAFE_WRITER_DOWNGRADE`, or `MIGRATION_VERIFICATION_FAILED` at their frozen boundaries.
- Complete directed integration fixtures and public documentation.

Validation:

- Directed CLI end-to-end scenarios from AC-16.
- Migration dry-run/apply/post-verify/reapply, independent `doctor --json` verification, and no-write-on-read.
- Rollback with active v58-only records.
- Human/JSON parity, redaction, i18n, and clean stdout.

## Pull request strategy

- One branch and one PR per slice using the branch in its slice.json.
- Each PR references the slice acceptance criteria and records evidence in its CLOSURE_BRIEF.md and pr.md.
- Do not combine slices unless the approved plan is amended before implementation.
- A later slice cannot claim evidence owned by an incomplete dependency.

## Required gates per slice

- Slice schema and local readiness checks.
- Relevant lint and targeted unit/integration tests listed in slice.json.
- Handoff brief validation.
- git diff --check.
- Directed regression only for commands and persistence surfaces touched by the slice.

## Change control

Stop and amend this package before implementation if evidence requires:

- a new canonical store or identity provider outside the approved design;
- a change to RQ-001 through RQ-009 semantics;
- a new destructive migration or downgrade path;
- a public contract break;
- scope from v59 or later.

## Rollback

Rollback is a one-way operational mode, not a data downgrade. Disable v58 writers, retain compatible readers and gates, and fail closed while v58-only decisions or conditions remain active. Never rewrite governed records to legacy shapes merely to allow an older package to run.

## Completion

All seven implementation slices are completed, AC-01 through AC-16 have recorded evidence, no mandatory deviation remains open, and STATUS.md plus EVIDENCE_REPORT.md reflect the executed state. PR #144 was merged on 2026-08-31; release and deployment are separate and were not executed.
