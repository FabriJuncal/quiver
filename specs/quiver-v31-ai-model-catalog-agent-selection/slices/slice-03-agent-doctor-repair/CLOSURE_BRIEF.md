# CLOSURE_BRIEF - slice-03 Agent profile doctor and repair dry-run

## Summary

Implemented `ai agent doctor` and `ai agent repair --dry-run` for existing agent profile diagnostics and safe repair previews.

## Validation Against Acceptance Criteria

- [x] Doctor checks every configured profile, not only defaults.
- [x] Severity and exit codes behave correctly; errors set exit code 1.
- [x] Repair dry-run shows proposed changes only and writes no files.
- [x] Human and JSON output contracts pass.
- [x] Unsupported providers are errors.
- [x] Display aliases in `model` are detected and repairable.
- [x] Custom unvalidated models are warnings.

## Relevant Changes

- Added pure doctor report and repair-plan builders in `agent-profiles.js`.
- Added `ai agent doctor` with human and JSON output.
- Added `ai agent repair --dry-run` with before/after repair previews.
- Updated help text to expose `ai agent doctor` and `ai agent repair`.
- Added CLI and library tests for invalid legacy profiles, alias repair, JSON output, and no-write repair behavior.

## Pending

- Write-mode repair remains intentionally unavailable.

## Remaining Risks

- Provider CLI checks are best-effort and do not prove account/model entitlement.
- Repair currently only normalizes safe catalog alias issues; unsupported providers and custom models still require human action.

## Future Recommendations

Consider write-mode repair only after dry-run behavior is dogfooded.
