# EXECUTION_BRIEF - slice-06 Tests, smokes, and release readiness

## Context

The feature touches public CLI contracts and automation-sensitive output, so test evidence must be broader than unit coverage.

## Objective

Validate integrated dashboard and version UX behavior and record release-readiness evidence.

## Scope

- Focused tests
- Full `node --test`
- diff checks
- spec validation
- package smoke
- evidence updates

## Acceptance Criteria

- Focused dashboard and version tests pass.
- Full `node --test` passes or blocker is documented.
- `git diff --check` passes.
- Spec validation passes.
- Package smoke passes.
- Evidence report and closure briefs are updated with real results.

## Technical Plan Summary

Run focused tests first, then full validation. Record exact commands and outcomes in the spec evidence artifacts.

## Suggested Steps

1. Run focused tests for dashboard and version.
2. Run full `node --test`.
3. Run `git diff --check`.
4. Run `spec validate`.
5. Run package smoke.
6. Update evidence and closure briefs.

## Restrictions

- Do not publish npm.
- Do not mark incomplete slices as completed.

## Completion Checklist

- [ ] Focused tests pass.
- [ ] Full validation recorded.
- [ ] Evidence updated.
