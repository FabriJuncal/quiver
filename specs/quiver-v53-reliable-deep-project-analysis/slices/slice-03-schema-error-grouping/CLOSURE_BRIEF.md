# CLOSURE_BRIEF - slice-03 schema error grouping

## Status

Completed on 2026-06-11.

## Summary

Provider analysis schema failures now render as grouped, bounded, actionable CLI output while complete validation details are preserved in `.quiver/runs/.../validation/analyze-project-validation.json`.

## Evidence

- Added grouped issue summaries by issue type and path family.
- Added cause hints and validation manifest path to provider validation errors.
- Added validation manifest persistence for invalid provider analysis JSON.
- Updated provider tests to assert compact `notes` drift output and complete manifest contents.

## Validation

- `node --test tests/commands/ai-analyze-project-provider.test.js` passed: 14 tests.
- `node --test tests/commands/ai-analyze-project.test.js` passed: 3 tests.
- `node --test tests/lib/ai-analyze-project-parser.test.js` passed: 5 tests.
- `node --test tests/lib/ai-analyze-project-validation.test.js` passed: 4 tests.
- `npm run docs:check` passed.
- `git diff --check` passed.

## Decisions

- Invalid provider JSON may now create an audit validation manifest under `.quiver/runs`; final docs and product code still remain unchanged.
- Schema validation remains strict. This slice does not repair or retry invalid JSON.

## Follow-ups

- `slice-04-safe-repair-layer` will use grouped validation details to decide repairability.
