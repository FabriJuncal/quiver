# EXECUTION_BRIEF — slice-02 Review Budget and Circuit Breaker

## Context

Once reviews and findings are canonical, Quiver needs a run-scoped limit that cannot be bypassed by concurrent commands or ambiguous retry accounting.

## Objective

Implement an append-only review event ledger, atomic reservation, deterministic event classification, and fail-closed circuit breaker per run.

## Scope

- Classify events from immutable command intent: full for a complete new candidate, targeted for declared finding IDs or sections on the same base review, retry only for a pre-payload transport/timeout failure with the same request envelope, and external for a validated adapter event.
- Increment review_count for full and targeted events; count a full revision only for a complete replacement with an explicit reviewed parent; count a targeted amendment only for targeted events.
- Keep later-phase implementation details from consuming full plan revisions.
- Consume a reserved semantic event as invalid-output when any provider payload is received but fails contractual validation.
- Preserve the last valid review after invalid output or technical retry.
- Reserve semantic review capacity before provider invocation under the existing locking discipline.
- Derive counts from canonical ledger events.
- Isolate review and budget state by run_id.
- Stop before provider invocation when exhausted.
- Offer only the governed human next actions defined by AC-07 after exhaustion.
- Require verified authorization and audit evidence for an extension.
- Project stable exhaustion and human-decision machine codes.

## Acceptance Criteria

- AC-07 — Atomic review budget by run.
- AC-08 — Strict isolation and correlation by run, limited here to review and budget state.
- AC-12 — Canonical representation, limited here to event-derived counts.

The normative wording and traceability are in ../../SPEC.md.

## Ordered Steps

1. Confirm slice-01 is completed and use its canonical review identifiers.
2. Implement the normative event classifier without provider-prose heuristics.
3. Add lock-scoped reservation before any provider call.
4. Enforce run isolation and unambiguous mutation targeting.
5. Add exhaustion and authorized extension behavior.
6. Project the five governed next actions without auto-executing one.
7. Wire invalid-output and retry outcomes to the ledger while preserving the last valid review.
8. Wire human and JSON budget views to event-derived counts.
9. Add concurrency, invalid-output consumption, retry, external classification, exhaustion, and multi-run tests.

## Expected Files

- src/create-quiver/lib/ai/review-budget.js
- src/create-quiver/lib/ai/review-governance.js
- src/create-quiver/lib/ai/plan-review.js
- src/create-quiver/lib/ai/run-state.js
- src/create-quiver/lib/locks.js
- src/create-quiver/commands/ai.js
- Focused tests listed in slice.json.

## Restrictions

- Do not use a mutable aggregate counter as source of truth.
- Do not invoke a provider after exhaustion is known.
- Do not treat transport or timeout retry as a new semantic review.
- Do not allow a display name alone to authorize extension.
- Do not implement generalized retry or external import workflows.

## Validation

    node --test tests/lib/ai-review-budget.test.js tests/lib/ai-review-governance.test.js tests/lib/ai-run-state.test.js tests/commands/ai-review-plan.test.js tests/commands/ai-run-state.test.js
    node bin/create-quiver.js slice check --local specs/quiver-v58-risk-aware-review-governance/slices/slice-02-review-budget-circuit-breaker/slice.json
    node bin/create-quiver.js spec validate specs/quiver-v58-risk-aware-review-governance --strict
    git diff --check

## Completion Checklist

- All event classes have deterministic tests.
- Invalid provider output consumes its semantic reservation and preserves the last valid review.
- Pre-payload transport/timeout retry with the same envelope does not consume semantic budget.
- Reservation occurs atomically before provider invocation.
- Concurrent requests cannot overspend one run.
- Simultaneous runs remain isolated.
- Exhaustion returns both stable codes without a provider call.
- Exhaustion lists the governed next actions and performs none automatically.
- Extension requires verified authorization and produces audit evidence.
- Human and JSON counts derive from ledger events.
- Closure evidence and deviations are recorded.
