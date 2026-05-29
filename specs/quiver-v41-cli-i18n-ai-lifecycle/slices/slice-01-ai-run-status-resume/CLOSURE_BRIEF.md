# CLOSURE_BRIEF - slice-01 AI run status and resume

## Summary

Completed. `ai run create`, `ai run close`, `ai status`, `ai resume`, and `ai approvals` now route through the shared language option for human wrapper output. Run ids, phases, statuses, commands, paths, and approval candidate versions remain exact.

`ai run watch` is not implemented in the current runtime; the current unsupported-subcommand wrapper is localized in `en` and `es`. Full watcher runtime and Ctrl+C semantics remain owned by `specs/quiver-v36-ai-run-watch-portable`.

## Validation

- [x] `node --test tests/commands/ai-run-state.test.js`
- [x] `node --test tests/lib/i18n-catalog.test.js`
- [x] `git diff --check`
