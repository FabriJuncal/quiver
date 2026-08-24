# EXECUTION_BRIEF — slice-00 Governance Contract Foundation

## Context

Repository workflow defines slice-00 as the mandatory documentary foundation and frozen baseline. The v58 master roadmap labels this area finding schema and enums; this slice freezes those contracts in documentation, while slice-01 owns their runtime implementation.

For this brief, documentary review approval means the recorded user approvals of the reconstructed acceptance criteria and adjusted technical plan plus independent semantic and contract review. It is distinct from the publication gate: the slice-00 PR must still receive human review and be merged before slice-01 runtime execution may begin. A `ready` slice-01 contract does not bypass that merge gate.

## Objective

Review, reconcile, validate, and freeze the accepted v58 spec package before any source or test implementation begins.

## Scope

- Reconcile RQ-001 through RQ-009 with AC-01 through AC-16.
- Use RQ-029 only for conditioned plan-to-spec propagation.
- Use RQ-100 only for the required identity and authorization boundary.
- Confirm coverage of REV-01 through REV-16.
- Freeze the authorization oracle, finding reconciliation, review-event classifier, condition eligibility, canonical store, migration, and rollback rules.
- Verify seven ordered slice contracts and their handoffs.
- Keep evidence and closure documents explicitly preimplementation.

## Acceptance Criteria

- The documentary acceptance criteria in slice.json are satisfied.
- AC-01 through AC-16 remain pending runtime evidence and are not claimed as passed here.
- The normative wording and traceability are in ../../SPEC.md.

## Ordered Steps

1. Read docs/INDEX.md and only the repository documents routed by expected_read_paths.
2. Compare SPEC.md against RQ-001 through RQ-009 and the limited dependencies.
3. Verify one mutable condition authority and complete normative decision tables.
4. Verify every implementation responsibility belongs to slices 01 through 06.
5. Run schema, strict spec, handoff, local slice, Markdown, and diff checks.
6. Record actual documentary evidence and any accepted deviations in CLOSURE_BRIEF.md.
7. After documentary review approval, mark slice-00 complete and its dependent slice-01 contract ready; keep slice-01 execution blocked until the slice-00 PR is human-reviewed and merged.

## Expected Files

- specs/quiver-v58-risk-aware-review-governance/SPEC.md
- specs/quiver-v58-risk-aware-review-governance/EXECUTION_PLAN.md
- specs/quiver-v58-risk-aware-review-governance/STATUS.md
- specs/quiver-v58-risk-aware-review-governance/EVIDENCE_REPORT.md
- Slice contracts and handoffs under specs/quiver-v58-risk-aware-review-governance/slices/.

## Restrictions

- Do not modify src/, tests/, package metadata, release files, or generated project templates.
- Do not implement schemas, commands, persistence, gates, or migrations.
- Do not mark runtime acceptance criteria or tests passed.
- Do not read known-missing docs listed as debt in docs/INDEX.md.
- Do not expand into RQ-010+, except the explicitly limited RQ-029 and RQ-100 dependencies.

## Validation

    npm run schema:slice:check
    node bin/create-quiver.js slice check --local specs/quiver-v58-risk-aware-review-governance/slices/slice-00-governance-contracts/slice.json
    node bin/create-quiver.js spec validate specs/quiver-v58-risk-aware-review-governance --strict
    npx --no-install markdownlint-cli2 specs/quiver-v58-risk-aware-review-governance/**/*.md
    git diff --check

Validate every EXECUTION_BRIEF.md and CLOSURE_BRIEF.md with the handoff checker before closure.

## Completion Checklist

- Requirements and review findings are traceable.
- Normative rules remove authorization, identity, reconciliation, budget, eligibility, and source-of-truth ambiguity.
- All seven slices are structurally and semantically reviewable.
- No missing repository document is an execution prerequisite.
- No runtime or test path changed.
- Closure evidence reports only commands actually executed.
- STATUS.md is updated only after documentary approval and distinguishes contract readiness from authorization to execute.
