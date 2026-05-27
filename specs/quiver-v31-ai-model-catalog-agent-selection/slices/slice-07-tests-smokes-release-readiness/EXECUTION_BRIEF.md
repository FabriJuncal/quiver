# EXECUTION_BRIEF - slice-07 Tests, smokes, package dry-run, and release readiness

## Context

The v31 changes touch core AI command behavior and agent profile setup. Release readiness must prove backward compatibility, no-TTY safety, JSON cleanliness, and package safety.

## Objective

Close v31 with full validation, evidence, and release readiness without publishing npm.

## Scope

- tests and smoke suites
- final docs/evidence updates
- `CHANGELOG.md`
- `README_FOR_AI.md`
- `ROADMAP.md`
- v31 spec closure files

## Acceptance Criteria

- Full test suite passes.
- Smoke suites pass.
- Package smoke and npm pack dry-run pass.
- Spec validation passes.
- Final evidence is recorded.
- Known remaining risks are documented.

## Technical Plan Summary

Run final validation after every implementation and docs slice, then update status/evidence/PR body/closure briefs.

## Suggested Steps

1. Run focused tests from prior slices if needed.
2. Run full suite.
3. Run smoke suites.
4. Run package safety and npm pack dry-run.
5. Validate spec.
6. Update final evidence and status.

## Restrictions

- Do not publish npm.
- Do not skip failed tests.
- Do not add new product scope.

## Risks

- Live provider validation depends on local provider auth and should be documented separately.
- Catalog staleness remains a known operational risk.

## Completion Checklist

- [ ] Full tests pass.
- [ ] Smokes pass.
- [ ] Package dry-run passes.
- [ ] Evidence report completed.
- [ ] PR body updated.
