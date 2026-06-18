# CLOSURE_BRIEF - slice-01 Recovery Contract + Security Classifier

## Summary

Implemented the recovery classification contract for final `evidence-not-selected` failures.

## Delivered

- Added `src/create-quiver/lib/ai/analyze-project-recovery.js`.
- Added deterministic evidence path normalization and classification helpers.
- Classified safe, metadata-only, security-excluded, generated/dependency, missing, outside-scope, and unknown evidence.
- Reused existing safety/path policies for env files, unsafe segments, file URLs, absolute paths, and traversal paths.
- Added focused unit tests for safe, metadata-only, unsafe, missing, binary, generated, traversal, and issue aggregation cases.

## Validation

- PASS `node --test tests/lib/ai-analyze-project-recovery.test.js`
- PASS `node bin/create-quiver.js spec validate specs/quiver-v57-evidence-budget-recovery-ux --strict`

## Notes

- This slice does not calculate budgets, render CLI output, or alter provider validation. Those remain assigned to later slices.
