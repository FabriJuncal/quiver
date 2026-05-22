# EXECUTION BRIEF - slice-10: Validation, actionable errors, redaction, and fixtures

## Context

The lifecycle is only production-ready if failures are understandable and edge cases are covered by fixtures.

## Objective

Harden validation, errors, redaction, dry-runs, doctor checks, and fixture coverage.

## Scope

- Actionable error format.
- Dry-run consistency checks.
- Secret redaction.
- Cross-platform doctor checks.
- Fixture matrix and tests.

## Acceptance Criteria

- Errors include failure, impact, fix, and next command.
- Mutating commands support dry-run or justify why not.
- Logs redact likely secrets.
- Fixture matrix covers required project states.
- Smoke/tests cover the matrix.

## Technical Plan Summary

Create shared error/redaction/dry-run test helpers and use fixture projects to prevent partial fixes.

## Suggested Execution Steps

1. Define error output contract.
2. Add redaction tests.
3. Build fixture matrix.
4. Add doctor validations.
5. Add smoke coverage.
6. Run full targeted test set.

## Restrictions

- Do not publish a package.
- Do not expose real env values in test output.

## Risks

- Fixture setup can become heavy. Keep fixtures focused and reusable.

## Completion Checklist

- [ ] Error contract implemented.
- [ ] Redaction tested.
- [ ] Fixture matrix added.
- [ ] Smokes updated.
- [ ] Evidence appended.
