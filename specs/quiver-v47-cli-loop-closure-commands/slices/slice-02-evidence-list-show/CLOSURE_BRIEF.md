# CLOSURE_BRIEF - slice-02 evidence list and show

## Summary

Completed. Added safe read-only evidence browsing via `evidence list` and `evidence show <path>` while preserving `evidence run -- <command>`.

## Validation

- [x] `node --test tests/lib/evidence.test.js`
- [x] `node --test tests/commands/evidence.test.js`
- [x] `node --test tests/commands/cli-contract.test.js`
- [x] `node --test tests/lib/i18n-catalog.test.js`
- [x] `node --test tests/commands/i18n-audit-matrix.test.js`
- [x] `git diff --check`
- [x] `node bin/create-quiver.js spec validate specs/quiver-v47-cli-loop-closure-commands`

## Closure Conditions

- [x] `evidence list` works.
- [x] `evidence show` is path-safe.
- [x] `evidence run` compatibility is preserved.

## Open Items

- None.
