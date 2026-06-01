# CLOSURE_BRIEF - slice-02 AI lifecycle namespace alias

## Summary

Completed. Added `ai lifecycle create|close` as the canonical lifecycle namespace while preserving `ai run create|close`.

## Validation

- [x] `node --test tests/commands/ai-run-state.test.js`
- [x] `node --test tests/commands/ai-dispatch-contract.test.js`
- [x] `node --test tests/commands/cli-contract.test.js tests/lib/i18n-catalog.test.js`
- [x] `node --test tests/commands/i18n-audit-matrix.test.js`
- [x] `node --test tests/commands/ai-export.test.js tests/lib/ai-export-state.test.js tests/commands/flow.test.js`
- [x] `git diff --check`
- [x] `node bin/create-quiver.js spec validate specs/quiver-v48-ai-command-modularization`

## Closure Conditions

- [x] `ai lifecycle` works.
- [x] `ai run` remains compatible.

## Open Items

- None.
