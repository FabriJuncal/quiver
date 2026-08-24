# EXECUTION_BRIEF — slice-05 Finding Disposition and Transfer

## Context

An eligible conditioned plan is useful only if every remaining obligation survives generation and blocks at the correct downstream gate. RQ-029 is used only for this plan-to-spec propagation boundary.

## Objective

Preserve canonical finding identity and enforce transferred conditions through spec generation, slice briefs, PR evidence, and readiness checks.

## Scope

- Accept spec creation from unconditional approval or eligible conditioned approval.
- Support individual finding transfer and batch disposition against canonical state.
- Preflight every transfer before rendering or mutation.
- Resolve each target to exactly one existing phase or slice.
- Preserve decision kind, approved artifact version and digest, reviewer recommendation, origin, identity, disposition, acceptance mapping, target, and evidence obligation.
- Generate one immutable digest-bound governance manifest from the canonical run store.
- Derive slice, PR, CLI, and JSON views from that manifest.
- Generate the traceability matrix and expose pending findings in destination slices and PR templates.
- Gate omitted, orphaned, unknown, stale, and unresolved conditions.
- Apply shared redaction on all new surfaces.

## Acceptance Criteria

- AC-11 — Referentially complete finding transfer.
- AC-13 — Shared CLI and machine contract, for condition projections and gates.
- AC-14 — Consistent redaction on transfer surfaces.
- AC-10 — Conditioned eligibility remains enforced at spec creation.

The normative wording and traceability are in ../../SPEC.md.

## Ordered Steps

1. Confirm slice-04 is completed and consume its canonical decision record.
2. Define the immutable downstream governance projection and source-digest parity check.
3. Add individual transfer and batch disposition commands.
4. Add preflight validation for eligibility and exact-one targets.
5. Render spec, slice obligations, pending PR findings, and traceability matrix from the manifest.
6. Extend slice and PR checks to consume canonical condition state.
7. Unify human and JSON transfer projections.
8. Apply common redaction before every persistence or output boundary.
9. Add successful propagation and all broken-reference gate cases.

## Expected Files

- src/create-quiver/lib/ai/spec-governance.js
- src/create-quiver/lib/ai/review-governance.js
- src/create-quiver/commands/findings.js
- src/create-quiver/commands/spec.js
- src/create-quiver/lib/ai/spec-generator.js
- src/create-quiver/lib/ai/spec-templates.js
- src/create-quiver/lib/readiness.js
- src/create-quiver/commands/ai.js
- src/create-quiver/index.js
- Focused tests listed in slice.json.

## Restrictions

- Do not render before transfer preflight succeeds.
- Do not duplicate mutable condition ownership across manifest, brief, and PR.
- Do not allow a generated manifest to override or mutate canonical run state.
- Do not drop canonical finding identity during generation.
- Do not auto-resolve or auto-accept a condition.
- Do not broaden RQ-029 beyond conditioned plan propagation.
- Do not implement a general artifact graph or v59 lifecycle.

## Validation

    node --test tests/lib/ai-spec-generator.test.js tests/lib/check-slice.test.js tests/commands/spec-create.test.js tests/commands/slice-namespace.test.js tests/commands/ai-pr.test.js tests/commands/findings.test.js
    node bin/create-quiver.js slice check --local specs/quiver-v58-risk-aware-review-governance/slices/slice-05-finding-disposition-transfer/slice.json
    node bin/create-quiver.js spec validate specs/quiver-v58-risk-aware-review-governance --strict
    git diff --check

## Completion Checklist

- Both permitted decision kinds have successful spec-creation coverage.
- Ineligible conditioned state cannot generate a spec.
- Every transfer target resolves exactly once before render.
- Canonical identity and origin survive into manifest and projections.
- Manifest parity is digest-verified against the only mutable canonical store.
- Individual and batch disposition commands preserve identity and explicit lifecycle.
- Traceability matrix, destination slices, and PR templates expose pending findings.
- Slice and PR checks reject every defined broken-reference state.
- Human and JSON views agree.
- Redaction is evidenced on each new surface.
- Closure evidence and deviations are recorded.
