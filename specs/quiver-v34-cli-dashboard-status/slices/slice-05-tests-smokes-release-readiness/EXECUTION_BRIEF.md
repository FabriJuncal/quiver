# EXECUTION_BRIEF - slice-05 Tests, smokes, and release readiness

## Context

All dashboard behavior and docs should be complete before this slice starts. This slice validates the whole spec and prepares PR readiness evidence.

## Objective

Close v34 with full validation and evidence.

## Scope

- tests as needed for final regressions
- `specs/quiver-v34-cli-dashboard-status/**`

## Acceptance Criteria

- Focused dashboard tests pass.
- CLI contract and UX flag tests pass.
- Generated docs/script tests pass.
- Full test suite passes or blockers are recorded.
- Smokes and package smoke pass or blockers are recorded.
- Spec validation passes.
- Evidence and closure briefs are updated.

## Technical Plan Summary

Run focused validation first, then broad tests and smokes. Update evidence only with actual command outcomes.

## Suggested Steps

1. Run focused dashboard tests.
2. Run CLI contract and UX flag tests.
3. Run generated docs/script tests.
4. Run full test suite.
5. Run smokes and package check.
6. Run spec validation.
7. Update evidence, status, closure briefs, and PR body.

## Restrictions

- Do not publish npm.
- Do not add new feature scope during readiness.
- Do not hide unrelated failures; document them as blockers if they matter.

## Risks

- Package smokes can reveal generated-template drift late; leave enough time for a small docs/script correction if needed.

## Completion Checklist

- [ ] Focused tests pass.
- [ ] Full tests pass.
- [ ] Smokes pass.
- [ ] Package smoke passes.
- [ ] Evidence updated.
- [ ] Spec validation passes.
