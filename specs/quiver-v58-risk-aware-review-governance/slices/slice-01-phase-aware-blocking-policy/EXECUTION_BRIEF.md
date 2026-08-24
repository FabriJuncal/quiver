# EXECUTION_BRIEF — slice-01 Phase-aware Blocking Policy

## Context

The documentary contracts from slice-00 define valid inputs and policy. This is the first runtime slice: it implements shared governance config, profile enforcement, actor authorization, structured findings, and phase-aware policy.

## Objective

Implement the frozen governance foundation, accept only valid structured reviews, preserve stable finding identity across revisions, and compute phase-aware blockers from effective profile and versioned policy.

## Scope

- Preserve the non-secret governance namespace in .quiver/config.json and compatible unknown keys.
- Use granular ignores for runtime-only .quiver state.
- Implement strict versioned schemas and stable enums.
- Support profile selection by CLI/config, forced high-assurance, policy propagation, and anti-downgrade.
- Resolve GitHub CLI provider subject, then authorize through explicit actor_bindings, action rules, default deny, and independence policy.
- Strictly parse and validate provider review output.
- Require valid blocking justification whenever phase_blocking is true.
- Preserve the last valid review when new output is invalid.
- Allocate canonical finding IDs under the run lock.
- Reconcile explicit IDs, invariant fingerprints, reopen events, and supersedes lineage.
- Reject ambiguous or incompatible matches.
- Require explicit disposition before unresolved findings close.
- Recompute phase_blocking from canonical policy inputs.
- Separate current blockers, later transfers, follow-ups, and optional hardening.
- Emit the contractual plan_required_fixes, slice_required_fixes, pr_required_fixes, and follow_ups collections.
- Redact raw evidence and projections consistently.

## Acceptance Criteria

- AC-01 — Shared versioned governance configuration.
- AC-02 — Deterministic effective profile.
- AC-03 — Verified and authorized governance actor.
- AC-04 — Valid structured findings with stable identity.
- AC-05 — Deterministic phase-aware blocking.
- AC-06 — Invalid provider output fails closed.
- AC-14 — Common redaction, limited here to review evidence surfaces.

The normative wording and traceability are in ../../SPEC.md.

## Ordered Steps

1. Confirm documentary slice-00 is completed, its human-reviewed PR is merged into the base branch, and treat SPEC.md as frozen.
2. Add strict schemas plus shared governance config preservation and granular runtime ignores.
3. Implement CLI/config profile selection, forcing, propagation, and anti-downgrade.
4. Implement verified provider-subject resolution and the explicit default-deny authorization oracle.
5. Add strict provider review parsing, blocking justification, aggregate checks, and contractual output fields.
6. Implement lock-safe canonical ID allocation and the normative reconciliation algorithm.
7. Implement phase-policy classification from canonical inputs.
8. Wire plan review to publish only validated, redacted projections.
9. Preserve prior valid state and emit stable failure codes.
10. Add config, profile, actor, lifecycle, policy, invalid-output, and redaction fixtures.

## Expected Files

- src/create-quiver/lib/ai/review-governance.schema.js
- src/create-quiver/lib/ai/review-governance.js
- src/create-quiver/lib/ai/plan-review.js
- src/create-quiver/lib/ai/providers.js
- src/create-quiver/lib/ai/artifacts.js
- src/create-quiver/commands/ai.js
- src/create-quiver/commands/config.js
- src/create-quiver/index.js
- src/create-quiver/lib/init-layout.js
- src/create-quiver/lib/init-docs.js
- src/create-quiver/lib/doctor.js
- src/create-quiver/lib/locks.js
- src/create-quiver/lib/ai/run-state.js
- Focused tests listed in slice.json.

## Restrictions

- Do not grant roles merely because GitHub CLI authenticated an actor.
- Do not permit an absent action rule or unknown actor by default.
- Do not trust provider aggregate or provider-assigned IDs as canonical.
- Do not fuzzy-match title or summary text for finding identity.
- Do not convert malformed output into an empty successful review.
- Do not close a finding merely because a provider omitted it.
- Do not implement budgets, decisions, or spec transfer.
- Do not widen retries beyond the validation outcome needed by this slice.

## Validation

    node --test tests/lib/ai-review-governance.test.js tests/lib/ai-providers.test.js tests/lib/ai-artifacts.test.js tests/lib/ai-run-state.test.js tests/lib/init-layout.test.js tests/lib/init-docs.test.js tests/lib/doctor.test.js tests/commands/ai-review-plan.test.js tests/commands/ai-plan.test.js tests/commands/cli-contract.test.js tests/commands/config-language.test.js tests/commands/doctor.test.js
    node bin/create-quiver.js slice check --local specs/quiver-v58-risk-aware-review-governance/slices/slice-01-phase-aware-blocking-policy/slice.json
    node bin/create-quiver.js spec validate specs/quiver-v58-risk-aware-review-governance --strict
    git diff --check

## Completion Checklist

- Shared config, granular ignores, profile selection/forcing/propagation, and anti-downgrade are evidenced.
- Verified identity remains separate from explicit default-deny authorization and independence.
- Valid and invalid provider outputs are distinguished fail-closed.
- Last valid review survives invalid subsequent output.
- Finding identity follows explicit ID, fingerprint, reopen, and supersedes rules.
- Ambiguous collision, omission, reopen, incompatible ID, and explicit closure cases are tested.
- Both profiles produce deterministic phase-aware projections.
- Contractual required-fix collections remain phase-separated.
- Provider aggregates cannot change canonical blockers or counts.
- Raw and rendered review evidence follows common redaction.
- Closure evidence and deviations are recorded.
