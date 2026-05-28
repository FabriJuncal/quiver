# EXECUTION_BRIEF - slice-01 Shared approval candidates model

## Context

Approval guidance is currently split across approval persistence, plan-review metadata, `ai approve`, `ai approvals`, `flow`, and run-state formatting.

## Objective

Create a shared read-only candidate model that every later approval UX surface can consume.

## Scope

- `src/create-quiver/lib/approvals.js`
- `src/create-quiver/lib/ai/plan-review.js`
- focused tests

## Acceptance Criteria

- Candidate data includes phase, version, path, source, current/latest state, review recommendation, blocking state, risks, and next command.
- Only the latest draft is marked recommended/approvable.
- Technical-plan candidates include plan-review state.
- Candidate summaries are bounded and safe.
- Existing approval metadata remains backward compatible.

## Technical Plan Summary

Add pure helper functions around existing metadata readers. Keep formatting and interactivity out of this slice except for minimal candidate summary helpers if needed.

## Suggested Steps

1. Model candidate shape.
2. Build acceptance candidates from approval metadata.
3. Build technical-plan candidates with plan-review context.
4. Add unit tests for missing, draft, stale, approved, approve-with-risk, and revise states.
5. Export only stable helpers needed by later slices.

## Restrictions

- Do not add prompts.
- Do not change approval persistence format unless tests prove compatibility.
- Do not relax review blocking.

## Risks

- A poorly scoped helper can become another duplicated formatter instead of a source of truth.

## Completion Checklist

- [ ] Shared candidate helpers implemented.
- [ ] Candidate tests added.
- [ ] Existing approval tests still pass.
