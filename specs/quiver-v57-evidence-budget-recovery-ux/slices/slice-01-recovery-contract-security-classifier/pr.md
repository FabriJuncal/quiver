# PR - slice-01 Recovery Contract + Security Classifier

## Summary

- Adds a recovery classification module for `ai analyze-project` evidence validation failures.
- Ensures unsafe paths are excluded before later slices calculate recovery budgets.
- Adds tests for metadata-only env templates, unsafe paths, binary files, missing files, and deterministic issue aggregation.

## Validation

- PASS `node --test tests/lib/ai-analyze-project-recovery.test.js`
- PASS `node bin/create-quiver.js spec validate specs/quiver-v57-evidence-budget-recovery-ux --strict`
