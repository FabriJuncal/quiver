# EXECUTION_BRIEF — slice-03 Approved with Conditions

## Context

When review budget ends with transferable findings, v58 must distinguish an eligible conditioned decision from unconditional approval. The decision cannot hide blockers, bypass actor policy, or rely on a legacy approval marker.

## Objective

Implement deterministic approved-with-conditions eligibility and canonical disposition lifecycle without implementing break-glass or final digest commit.

## Scope

- Add approved-with-conditions as a separate decision kind.
- Make the governance store the single writer for current dispositions.
- Require authorized actor, reason path and digest, and complete dispositions.
- Apply the normative eligibility matrix by phase owner, blocking flag, category, severity, disposition, target, and policy.
- Return the stable reason code for every ineligible state.
- Return BREAK_GLASS_REQUIRED for Critical security, data-integrity, or rollout findings.
- Prevent legacy approved.md from representing conditioned state.
- Keep the reviewer's non-approval visible in every human and JSON conditioned projection.

## Acceptance Criteria

- AC-03 — Verified and authorized governance actor, for conditioned decisions.
- AC-10 — Conditioned approval is distinct and eligible.
- AC-14 — Bounded reason storage, for decision reasons.
- AC-15 — No legacy false advancement, for conditioned state.

The normative wording and traceability are in ../../SPEC.md.

## Ordered Steps

1. Confirm slice-02 is completed and consume canonical findings and budget state.
2. Define conditioned decision and disposition lifecycle transitions.
3. Implement single-writer disposition validation.
4. Implement the SPEC.md transferability matrix and stable ineligibility reason codes.
5. Enforce authorization, independence, and reason reference/digest.
6. Reject Critical protected categories with BREAK_GLASS_REQUIRED.
7. Block legacy marker creation and interpretation for conditioned state.
8. Preserve the reviewer recommendation in conditioned projections.
9. Add eligibility, authorization, disposition, and legacy-safety tests.

## Expected Files

- src/create-quiver/lib/ai/review-governance.js
- src/create-quiver/lib/ai/review-budget.js
- src/create-quiver/lib/ai/approval-candidates.js
- src/create-quiver/lib/approvals.js
- src/create-quiver/lib/ai/run-state.js
- src/create-quiver/commands/ai.js
- src/create-quiver/commands/flow.js
- Focused tests listed in slice.json.

## Restrictions

- Do not implement a break-glass bypass.
- Do not equate approved-with-conditions with approved.
- Do not copy full reason text into the canonical decision.
- Do not implement exact-byte approval commit owned by slice-04.
- Do not generate specs or transfer findings in this slice.

## Validation

    node --test tests/lib/ai-review-governance.test.js tests/lib/approvals.test.js tests/commands/ai-plan.test.js tests/commands/ai-run-state.test.js tests/commands/flow.test.js
    node bin/create-quiver.js slice check --local specs/quiver-v58-risk-aware-review-governance/slices/slice-03-approved-with-conditions/slice.json
    node bin/create-quiver.js spec validate specs/quiver-v58-risk-aware-review-governance --strict
    git diff --check

## Completion Checklist

- Conditioned and unconditional decisions remain distinguishable.
- Eligibility and ineligibility reasons are deterministic.
- Requirement, acceptance, and current-plan blockers cannot transfer beyond their owning phase.
- Later-phase transfers require matching policy, disposition, one target, and evidence obligations.
- Every remaining finding has exactly one current disposition.
- Unauthorized, stale, duplicate, and missing dispositions fail closed.
- Protected Critical findings return BREAK_GLASS_REQUIRED with no bypass.
- Reason storage uses relative path plus digest.
- Legacy approved.md cannot represent conditioned state.
- Human and JSON output remain explicit that the reviewer did not approve.
- Closure evidence and deviations are recorded.
