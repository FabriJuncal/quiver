# CLOSURE_BRIEF - slice-06 Doctor visual and JSON contract

## Summary

Implemented the Doctor visual/JSON contract with one diagnostics model that drives both human and machine output.

## Validation Against Acceptance Criteria

- [x] Human doctor output validated.
- [x] JSON output validated.
- [x] Finding parity validated.
- [x] Exit codes validated.
- [x] Smoke fixtures validated.

## Relevant Changes

- Added a shared Doctor command report with stable `schema_version`, status, exit code, checks, suggested fixes, warnings, and errors.
- Added human output with `Quiver Doctor`, `Checks`, and `Suggested fixes`.
- Added `doctor --json` output that remains parseable and uses the same findings as the human renderer.
- Preserved `doctor --fix --dry-run` behavior and kept `doctor --fix --json` machine-clean.
- Added tests for human hierarchy, JSON parsing, finding parity, and deterministic blocking exit code.
- Documented the Doctor output contract in the CLI UX guide, command reference, and source-of-truth AI guide.

## Pending

- Final docs and package readiness are handled by slice-08.

## Remaining Risks

- The Doctor report schema is intentionally minimal. Future consumers should rely on `schema_version`, `checks`, `suggested_fixes`, `warnings`, `errors`, and `exit_code` rather than terminal formatting.
- Existing host-environment warnings, such as `gh auth`, still depend on the local machine and can appear in warning checks.

## Future Recommendations

Consider a future `doctor --fix --interactive` flow only after this diagnostic contract is stable.
