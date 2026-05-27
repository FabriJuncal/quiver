# CLOSURE_BRIEF - slice-07 Tests, smokes, package dry-run, and release readiness

## Summary

Completed v31 release-readiness validation, updated package smoke coverage for the new model/profile help contract, and recorded final evidence.

## Validation Against Acceptance Criteria

- [x] Full test suite passed.
- [x] Smoke suites passed.
- [x] Package smoke passed.
- [x] npm pack dry-run passed.
- [x] Evidence report completed.

## Relevant Changes

- Corrected CLI help and flow guidance so `--model` is documented as a technical model id.
- Updated tests and smoke script expectations to assert current `ai agent doctor`, `ai agent repair`, `ai models list`, and `--model <model-id>` help output.
- Updated `CHANGELOG.md`, `README_FOR_AI.md`, `ROADMAP.md`, `STATUS.md`, `EVIDENCE_REPORT.md`, and `pr.md` for v31 release readiness.

## Pending

PR creation and npm publication require explicit human approval.

## Remaining Risks

- Catalog entries are known by Quiver and can become stale.
- Account-level model availability still depends on provider CLI/account access and should be validated live only when the user opts in.

## Future Recommendations

Publish only after the human confirms release intent and npm authentication is ready.
