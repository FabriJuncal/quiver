# Evidence Report — Quiver v58 Risk-aware Review Governance

Status: Runtime foundation validated through slice-04; later-slice evidence pending

## Documentary foundation evidence

| Scope | Evidence | Result |
|---|---|---|
| Requirements and review traceability | RQ-001 through RQ-009, limited RQ-029/RQ-100, AC-01 through AC-16, and REV-01 through REV-16 reviewed | Passed |
| Canonical governance rules | Single mutable condition authority plus explicit authorization, reconciliation, budget, eligibility, migration, and rollback rules | Passed |
| Slice contracts | 7 schema-valid serial slices with safe scope and dependencies | Passed |
| Handoffs | 7 execution briefs and 7 closure briefs validated | Passed |
| Package validation | Strict spec, local gates, Markdown, whitespace, expected-read, and diff checks | Passed |
| Runtime source and tests during slice-00 | No change under src/ or tests/ in the documentary slice | Passed |

Detailed documentary evidence is recorded in slices/slice-00-governance-contracts/CLOSURE_BRIEF.md.

## Evidence register

| Acceptance criterion | Owning slice | Evidence to record | Result |
|---|---|---|---|
| AC-01 to AC-04 | slice-01 and slice-03 | Contract, config, profile, actor, finding lifecycle, isolation, authorization, and conditioned actor evidence | Passed for slice-01 contract and slice-03 conditioned subset |
| AC-05 to AC-06 | slice-01 | Phase-policy, reconciliation, invalid-provider, and retained-state fixtures | Passed |
| AC-07 | slice-02 | Budget classification, concurrency, exhaustion, retry, invalid-output, extension, and recovery evidence | Passed |
| AC-08 | slice-02 through slice-04 | Review/budget isolation, conditioned-state correlation, explicit final-decision run selection, ambiguity rejection, and simultaneous-run approval isolation | Passed |
| AC-09 | slice-04 | Exact-byte bindings, current authorization, tampering, seven write-failure boundaries, rollback, recovery, and canonical inspection/export | Passed |
| AC-12 | slice-02 through slice-04 | Event-derived budget counts, raw acceptance and complete finding counts, decision/projection parity, and representation mismatch blocking | Passed |
| AC-10 | slice-03 | Condition policy, eligibility precedence, complete dispositions, protected Critical rejection, and explicit non-final candidate | Passed |
| AC-11 | slice-05 | Spec, slice, PR propagation and gate evidence | Pending |
| AC-13 | slice-04 and slice-06 | Approval commit/show/verify/export CLI, JSON code/status/exit, and Linear projection passed in slice-04; broader shared-surface convergence remains | Partial |
| AC-14 | slice-01, slice-03, slice-05, and slice-06 | Review-evidence redaction passed in slice-01 and conditioned reason bounding passed in slice-03; downstream/export surfaces pending | Partial |
| AC-15 | slice-03 and slice-06 | Additive conditioned-state reads and no false advancement passed in slice-03; migration remains | Partial |
| AC-16 | slice-06 | Rollback, directed integration, and documentation checks | Pending |

## Slice-01 Evidence — phase-aware blocking policy

Executed with exit code 0:

```bash
NODE_PATH='/Users/fabrijk/Documents/Work/Proyectos Personales/nika/frameworks/quiver/node_modules' node --test tests/lib/ai-review-governance.test.js tests/lib/ai-providers.test.js tests/lib/ai-artifacts.test.js tests/lib/ai-run-state.test.js tests/lib/init-layout.test.js tests/lib/init-docs.test.js tests/lib/doctor.test.js tests/commands/ai-review-plan.test.js tests/commands/ai-plan.test.js tests/commands/cli-contract.test.js tests/commands/config-language.test.js tests/commands/doctor.test.js tests/commands/init-profiles.test.js
npm test
node bin/create-quiver.js slice check --local specs/quiver-v58-risk-aware-review-governance/slices/slice-01-phase-aware-blocking-policy/slice.json
node bin/create-quiver.js spec validate specs/quiver-v58-risk-aware-review-governance --strict
git diff --check
```

Results:

- 200 directed runtime tests passed with no failures.
- The full portable regression passed 819 tests with no failures.
- The local slice gate and strict seven-slice spec validation passed.
- Slice schema validation passed for 309 current runtime fixtures.
- Repository docs checks and direct lint of the changed spec Markdown passed.
- `git diff --check` passed.
- Scope assertion checked 34 changed paths with none outside `allowed_write_paths`.
- Independent governance/security review ended approved with no mandatory findings pending.
- Independent final review ended approved; its separate 77-test focal run passed and cross-process lock exclusion was reproduced.

Covered behavior:

- Governance defaults, compatible-key preservation, secret rejection, and granular runtime ignores.
- CLI/config profile selection, sensitive forcing, minimum controls, propagated policy identity, and anti-downgrade.
- Stable provider identity separated from explicit default-deny bindings, roles, independence, and authorization.
- Strict provider parsing, canonical finding schemas, stable identity, reopen/supersession lifecycle, and ambiguous-state rejection.
- Deterministic phase-aware blocker projection and provider-aggregate non-authority.
- Invalid output preserving prior valid state with no approval or phase transition.
- Run ownership, foreign-run rejection, closed-run rejection, locked correlation, review/revise transitions, and approval recheck after identity resolution.
- Redaction of provider streams, serialized errors, raw evidence, prompts, and rendered review projections.

Detailed evidence, scope boundaries, and pending later-slice work are recorded in `slices/slice-01-phase-aware-blocking-policy/CLOSURE_BRIEF.md`.

## Slice-02 Evidence — review budget and circuit breaker

Executed with exit code 0:

```bash
node --test tests/lib/ai-review-budget.test.js tests/lib/ai-review-governance.test.js tests/lib/ai-providers.test.js tests/lib/ai-run-state.test.js tests/commands/ai-review-plan.test.js tests/commands/ai-run-state.test.js
npm test
node scripts/ci/check-slice-schema.js
node bin/create-quiver.js slice check --local specs/quiver-v58-risk-aware-review-governance/slices/slice-02-review-budget-circuit-breaker/slice.json
node bin/create-quiver.js spec validate specs/quiver-v58-risk-aware-review-governance --strict
npm run docs:check
npx --no-install markdownlint-cli2 specs/quiver-v58-risk-aware-review-governance/EVIDENCE_REPORT.md specs/quiver-v58-risk-aware-review-governance/EXECUTION_PLAN.md specs/quiver-v58-risk-aware-review-governance/STATUS.md specs/quiver-v58-risk-aware-review-governance/pr.md specs/quiver-v58-risk-aware-review-governance/slices/slice-02-review-budget-circuit-breaker/EXECUTION_BRIEF.md specs/quiver-v58-risk-aware-review-governance/slices/slice-02-review-budget-circuit-breaker/CLOSURE_BRIEF.md specs/quiver-v58-risk-aware-review-governance/slices/slice-02-review-budget-circuit-breaker/pr.md
node bin/create-quiver.js slice pr specs/quiver-v58-risk-aware-review-governance/slices/slice-02-review-budget-circuit-breaker/slice.json
git diff --check
```

Results:

- 111 directed slice tests passed with no failures.
- The full portable regression passed 847 tests with no failures.
- The local slice gate and strict seven-slice spec validation passed.
- Slice schema, repository docs, direct Markdown, PR handoff, and whitespace gates passed.
- Scope assertion found no changed path outside `allowed_write_paths`.
- Independent governance/security review ended approved and separately reproduced 111 passing slice tests.
- Independent final review ended approved with all four mandatory findings materially closed.

Covered behavior:

- Explicit full, targeted, retry, and external classification from immutable command intent and request-envelope identity.
- Atomic pre-provider reservation, cross-process exclusion, exhaustion before provider execution, and isolated simultaneous runs.
- Strict contractual payload receipt, invalid-output consumption, non-consuming pre-payload retry, and preservation of the last valid review.
- Canonical event-derived counts, caller aggregate rejection, policy-derived limits, and authorized audited extension.
- Exact one-to-one canonical-review/valid-outcome history with fail-closed legacy handling.
- Redacted, digest-bound commit recovery at every injected boundary, including corrupt and foreign marker rejection.
- Run closure exclusion while provider work is reserved and idempotent recovery before later governed mutations.

Detailed evidence, scope boundaries, and pending later-slice work are recorded in `slices/slice-02-review-budget-circuit-breaker/CLOSURE_BRIEF.md`.

## Slice-03 Evidence — approved with conditions

Executed with exit code 0:

```bash
node --test tests/lib/ai-review-governance.test.js tests/lib/ai-run-state.test.js tests/lib/approvals.test.js tests/commands/ai-plan.test.js tests/commands/ai-review-plan.test.js tests/commands/ai-run-state.test.js tests/commands/flow.test.js
npm test
node --check src/create-quiver/lib/ai/review-governance.schema.js
node --check src/create-quiver/lib/ai/review-governance.js
node --check src/create-quiver/lib/ai/plan-review.js
node --check src/create-quiver/lib/approvals.js
node --check src/create-quiver/commands/ai.js
node scripts/ci/check-slice-schema.js
node bin/create-quiver.js slice check --local specs/quiver-v58-risk-aware-review-governance/slices/slice-03-approved-with-conditions/slice.json
node bin/create-quiver.js spec validate specs/quiver-v58-risk-aware-review-governance --strict
npm run docs:check
npx --no-install markdownlint-cli2 specs/quiver-v58-risk-aware-review-governance/EVIDENCE_REPORT.md specs/quiver-v58-risk-aware-review-governance/EXECUTION_PLAN.md specs/quiver-v58-risk-aware-review-governance/SPEC.md specs/quiver-v58-risk-aware-review-governance/STATUS.md specs/quiver-v58-risk-aware-review-governance/pr.md specs/quiver-v58-risk-aware-review-governance/slices/slice-03-approved-with-conditions/EXECUTION_BRIEF.md specs/quiver-v58-risk-aware-review-governance/slices/slice-03-approved-with-conditions/CLOSURE_BRIEF.md specs/quiver-v58-risk-aware-review-governance/slices/slice-03-approved-with-conditions/pr.md
node bin/create-quiver.js slice pr specs/quiver-v58-risk-aware-review-governance/slices/slice-03-approved-with-conditions/slice.json
git diff --check
```

Results:

- 137 directed slice tests passed with no failures.
- The full portable regression passed 857 tests with no failures.
- Relevant JavaScript syntax checks passed.
- The local slice gate and strict seven-slice spec validation passed.
- Slice schema and whitespace gates passed.
- Independent governance-core review ended approved without actionable observations and separately reproduced the 137-test suite plus structural gates.
- Independent command-boundary follow-up verified both mandatory findings closed; its focused 2-test run passed.

Covered behavior:

- Separate conditioned decision schemas and additive historical state reads without invented decisions.
- Versioned default-deny disposition allowlist, exact four-selector matching, deterministic allow-only union, and release denied without an explicit rule.
- Normative precedence for protected Critical, stale, duplicate, missing, unauthorized, non-transferable, current-phase revision, unresolved, and eligible results.
- Exactly one current disposition per open finding, explicit supersession, target cardinality, and evidence obligations.
- Authorized actor correlation, sanitized stable identity failures, repository-relative reason path, and reason digest without full-text persistence.
- Full disposition/evaluation/candidate correlation and rejection of actor, review, policy, or reviewer-recommendation tampering.
- Candidate-only persistence with reviewer non-approval visible, no final run approval, no `approved.md`, and no phase advancement on success or failure.
- Pending recovery/reservation refusal, run locking for mutation, and no-write dry-run behavior.

Detailed evidence, scope boundaries, and pending later-slice work are recorded in `slices/slice-03-approved-with-conditions/CLOSURE_BRIEF.md`.

## Slice-04 Evidence — digest-bound approvals

Required validation commands:

```bash
node --test tests/lib/approvals.test.js tests/lib/ai-review-governance.test.js tests/lib/ai-run-state.test.js tests/commands/ai-plan.test.js tests/commands/ai-review-plan.test.js tests/commands/ai-run-state.test.js tests/commands/cli-contract.test.js
npm test
node --check src/create-quiver/lib/approvals.js
node --check src/create-quiver/lib/ai/approval-candidates.js
node --check src/create-quiver/lib/ai/plan-review.js
node --check src/create-quiver/lib/ai/review-governance.js
node --check src/create-quiver/lib/ai/review-governance.schema.js
node --check src/create-quiver/lib/ai/run-state.js
node --check src/create-quiver/commands/ai.js
node --check src/create-quiver/index.js
node scripts/ci/check-slice-schema.js
node bin/create-quiver.js slice check --local specs/quiver-v58-risk-aware-review-governance/slices/slice-04-digest-bound-approvals/slice.json
node bin/create-quiver.js spec validate specs/quiver-v58-risk-aware-review-governance --strict
npm run docs:check
node bin/create-quiver.js slice pr specs/quiver-v58-risk-aware-review-governance/slices/slice-04-digest-bound-approvals/slice.json
git diff --check
```

Final results:

- The directed slice suite passed 171 tests with no failures.
- The full portable regression passed 893 tests with no failures.
- Relevant syntax, local slice, strict seven-slice spec, slice-schema, documentation, command-reference, PR-readiness, scope, and whitespace gates passed.
- Independent atomicity review reproduced all seven injected recovery boundaries and approved the final WAL, recovery, and run-to-planner lock ordering.
- Independent conditioned-flow review passed the full acceptance-to-review-to-candidate-to-final-decision path, exact retry, drift rejection, verify/export, and post-publication tamper checks.
- Independent security review reproduced path redirection, symlink, secret propagation, cross-run binding, target-allowlist, and normal-publication attacks and closed approved with no blocker.
- Independent compatibility review reproduced repeated-revision rebinding, cross-run draft mixing, canonical-row downgrade, and hidden symlinked run namespaces; all fixes passed terminal reaudit with no blocker.

Covered behavior:

- Exact artifact and canonical-input byte digests plus deterministic decision, profile, review, policy, disposition, and bounded-reason bindings.
- Commit-time actor identity, default-deny authorization, independence, and policy re-evaluation under the protected critical section.
- Complete canonical finding counts and phase-specific raw acceptance counts without provider aggregates.
- Atomic publication of the run artifact, governance decision ledger, run approval projection, unconditional legacy projection, and phase transition.
- Durable WAL snapshots, reverse rollback, fail-closed readers and legacy writers, idempotent recovery, corrupt/foreign target rejection, and no lock-order inversion.
- Exact ordered WAL targets validated before publication and recovery, canonical no-follow run namespaces, and strict run/state/projection identity correlation.
- Textual and structured redaction of artifact/input bytes and snapshots with schema-validated authorization evidence scanned leaf-by-leaf.
- Separate conditioned final decisions with reviewer non-approval visible and no legacy technical-plan `approved.md`.
- Canonical human/JSON show and verify plus exact Linear-comment export, stable machine codes, nonzero failures, and clean JSON stdout.
- Explicit and ambiguous run selection, closed-run inspection, and two simultaneous runs retaining isolated versions, paths, counts, decisions, and phases.
- Repeated technical-plan revision keeps both the selected run-owned draft and its canonical or compatibility acceptance input bound to the same run; plural listing rejects foreign or downgraded canonical rows while preserving the exact historical legacy namespace.

Detailed evidence, scope boundaries, deviations, and pending later-slice work are recorded in `slices/slice-04-digest-bound-approvals/CLOSURE_BRIEF.md`.

## Evidence required from each slice

- Commit and PR reference.
- Commands executed and their exact exit status.
- Relevant test or fixture identifiers.
- Human-readable result when UI or CLI wording is part of the contract.
- JSON or persisted artifact sample when machine representation is part of the contract.
- Any deviation from the approved acceptance criteria or plan.

## Cross-slice verification to record

- One fast-delivery low-risk run.
- One sensitive requirement forced to high-assurance.
- One invalid provider output preserving the last valid review.
- Concurrent budget reservations plus exhausted-budget behavior.
- One eligible conditioned plan propagated through spec, slice, and PR.
- One ineligible Critical finding producing BREAK_GLASS_REQUIRED.
- Digest tampering and representation mismatch blocking atomically.
- Two simultaneous runs remaining isolated.
- Legacy migration, re-run idempotency, rollback read mode, and downgrade guard.
- Redaction and human/JSON parity across shared surfaces.

## Deviations

Record only deviations observed during implementation. Each entry must identify:

- affected acceptance criterion;
- reason;
- approved replacement or follow-up;
- owner and status.

Current documentary deviation: repository lifecycle makes slice-00 documentary-only although the master roadmap labels it finding schema and enums. SPEC.md Decision 9 freezes those contracts in slice-00 and assigns runtime implementation to slice-01.

Post-PR CI exposed one directly affected historical init-profile assertion outside the original file list. The slice scope and directed command were amended only to include `tests/commands/init-profiles.test.js`; product behavior and acceptance scope did not change.

Automatic source and capture timing for run creator, reviewer, and executor are neither defined nor assigned by the frozen contracts, so no implicit attribution was invented. This provenance contract requires explicit future approval before use; slice-04 owns only decision-time actor revalidation and ledger recording.

The condition-policy allowlist, stable-code precedence, explicit disposition lifecycle, reviewer projection, and candidate-only slice-03 boundary were clarified with explicit user authorization on 2026-08-25. These clarifications freeze ambiguous implementation details without changing the accepted v58 scope.

The slice-03 full regression exposed one directly affected additive-state assertion in `tests/lib/ai-run-state.test.js`. The slice read/write scope and directed suite were amended before changing that expectation; no production behavior or acceptance scope changed.

Independent slice-03 review exposed correlation and identity-evidence gaps. The implementation now rejects disposition/evaluation/candidate correlation tampering and preserves only supported stable identity adapter codes under the outer `DISPOSITION_UNAUTHORIZED` result. Follow-up review verified both gaps closed.

The slice-04 ledger location, digest/count formulas, singular approval namespace, compatible plural listing, and schema/registry scope were clarified with explicit user authorization on 2026-08-27. These decisions are frozen in `SPEC.md` and the slice handoffs.

Slice-04 integration exposed that the governed review WAL treated schema-valid canonical `authorization` evidence as an arbitrary credential key. `plan-review.js` was added to scope so only validated authorization evidence inside canonical decisions, dispositions, and candidates is excluded from that generic key-name check; provider and arbitrary marker data remain redacted.

Independent slice-04 atomicity review found that a pending approval WAL did not yet block legacy planner writers and that concurrent recovery could observe an already removed marker. Both paths now fail safely or return idempotently, and the reviewer approved the final lock ordering and seven-boundary rollback evidence.

## Closure rule

Do not change this report to Passed or Complete until all sixteen acceptance criteria have linked evidence, every mandatory slice gate has passed, and unresolved deviations are explicitly accepted.
