# EXECUTION_BRIEF — slice-04 Digest-bound Approvals

## Context

An eligibility check performed before a write is insufficient: artifact bytes, findings, dispositions, policy, actor, or counts may change before commit. Approval must revalidate and publish atomically for one explicit run.

## Objective

Bind approvals to exact final bytes and canonical governance state, then commit the decision and phase transition as one all-or-nothing operation.

## Scope

- Resolve the approval candidate for an explicit or uniquely active run.
- Re-read final bytes inside the existing lock boundary.
- Verify all required artifact, input, review, profile, policy, disposition, reason, count, run, and actor bindings.
- Re-evaluate authorization and independence at commit.
- Commit decision and transition atomically.
- Detect canonical representation divergence.
- Return stable machine codes and clean JSON output.
- Provide approval show, verify, and Linear-comment export from the canonical decision record.

## Acceptance Criteria

- AC-08 — Strict isolation and correlation by run.
- AC-09 — Atomic digest-bound approval.
- AC-12 — Canonical representation and counts.
- AC-13 — Shared CLI and machine contract, limited here to approval surfaces.

The normative wording and traceability are in ../../SPEC.md.

## Ordered Steps

1. Confirm slice-03 is completed and identify the current approval write boundary.
2. Build a canonical approval-candidate projection for one run.
3. Move byte reread and complete binding validation into the protected section.
4. Re-evaluate actor authorization and independence immediately before commit.
5. Make decision publication and phase transition all-or-nothing.
6. Add representation mismatch and stable machine contract behavior.
7. Add show, verify, and export projections without a second source of truth.
8. Add tampering, staleness, TOCTOU, partial-write, and multi-run tests.

## Expected Files

- src/create-quiver/lib/approvals.js
- src/create-quiver/lib/ai/review-governance.js
- src/create-quiver/lib/ai/approval-candidates.js
- src/create-quiver/lib/ai/run-state.js
- src/create-quiver/lib/locks.js
- src/create-quiver/lib/actionable-error.js
- src/create-quiver/commands/ai.js
- src/create-quiver/index.js
- Focused tests listed in slice.json.

## Restrictions

- Do not validate digests only before acquiring the lock.
- Do not publish a decision separately from its phase transition.
- Do not infer run identity when more than one candidate exists.
- Do not copy provider aggregate counts into the approval record.
- Do not add a database or generalized transaction subsystem.
- Do not implement downstream transfer gates.

## Validation

    node --test tests/lib/approvals.test.js tests/lib/ai-review-governance.test.js tests/lib/ai-run-state.test.js tests/commands/ai-plan.test.js tests/commands/ai-run-state.test.js tests/commands/cli-contract.test.js
    node bin/create-quiver.js slice check --local specs/quiver-v58-risk-aware-review-governance/slices/slice-04-digest-bound-approvals/slice.json
    node bin/create-quiver.js spec validate specs/quiver-v58-risk-aware-review-governance --strict
    git diff --check

## Completion Checklist

- Every required binding is recomputed under lock.
- Actor authorization and independence are current at commit.
- Stale, tampered, ambiguous, and mismatched candidates fail closed.
- Injected partial-write failure leaves no decision or phase transition.
- Counts derive from canonical structured collections.
- Approval machine codes and JSON contract are stable.
- Approval show, verify, and export agree on version, digests, and criterion count.
- Two active runs remain isolated.
- Closure evidence and deviations are recorded.
