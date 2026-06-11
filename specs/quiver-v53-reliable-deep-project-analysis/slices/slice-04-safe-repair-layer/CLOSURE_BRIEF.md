# CLOSURE_BRIEF - slice-04 safe repair layer

## Status

Completed on 2026-06-11.

## Summary

Safe repair now removes only allowlisted unsupported additional properties, currently `notes`, records every removed key, and revalidates the provider analysis before proceeding.

## Evidence

- Added `src/create-quiver/lib/ai/analyze-project-repair.js`.
- Added repair unit tests under `tests/lib/ai/analyze-project-repair.test.js`.
- Updated provider flow to use repair before failing schema validation.
- Updated the `nika-erp` notes drift fixture expectation from fail-closed to repaired success.
- Repair manifests are written to `.quiver/runs/run-.../repair/analyze-project-repair.json`.

## Validation

- `node --test tests/lib/ai/analyze-project-repair.test.js` passed: 3 tests.
- `node --test tests/commands/ai-analyze-project-provider.test.js` passed: 14 tests.
- `npm run schema:slice:check` passed.
- `git diff --check` passed.

## Decisions

- Repair is intentionally narrow: only `unrecognized_keys` issues whose keys are in the safe allowlist are repaired.
- `notes` content is removed, not moved or reinterpreted, to avoid semantic changes.
- Unrepairable outputs still write validation evidence and fail without final docs writes.

## Follow-ups

- `slice-05-controlled-retry-layer` handles invalid outputs that cannot be repaired directly.
