# EXECUTION BRIEF - slice-07: Smoke and release readiness

## Context

This final slice proves the hotfix is ready for PR, merge, and later npm publication. It should not publish npm itself.

## Objective

Run full validation, prepare `0.12.1` package metadata, perform candidate tarball smoke, and record evidence.

## Scope

- Version metadata.
- Changelog/release notes.
- Test and smoke scripts if needed.
- Evidence report and PR body.

## Acceptance Criteria

- Full test suite passes.
- Required smokes pass.
- Candidate tarball smoke passes from `/private/tmp`.
- Package metadata targets `0.12.1`.
- Evidence and PR body are updated.

## Technical Plan Summary

Integrate all previous slices, run package safety and clean install smoke, then update release artifacts for PR review.

## Suggested Execution Steps

1. Confirm all prior slices are complete.
2. Bump package metadata to `0.12.1`.
3. Run full test and smoke suite.
4. Run `npm pack` and smoke the tarball from `/private/tmp`.
5. Update `EVIDENCE_REPORT.md`, `STATUS.md`, `CHANGELOG.md`, and `pr.md`.
6. Leave npm publication for post-merge release.

## Restrictions

- Do not publish npm.
- Do not create the real demo project in `/Prueba`.
- Do not ignore failed smoke output.

## Risks

- Tarball smoke may reveal packaging-only issues not covered by local tests.

## Completion Checklist

- [ ] Full tests passed.
- [ ] Smokes passed.
- [ ] Tarball smoke passed.
- [ ] Evidence recorded.
- [ ] Version metadata ready.
