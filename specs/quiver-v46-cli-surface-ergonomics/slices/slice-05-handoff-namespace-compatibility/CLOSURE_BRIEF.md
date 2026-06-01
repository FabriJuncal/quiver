# CLOSURE_BRIEF - slice-05 handoff namespace compatibility

## Summary

Completed. The canonical `handoff` namespace now routes to the existing handoff validation/scaffold implementation while preserving root aliases:

- Added `handoff check <path.md>`.
- Added `handoff create <spec-slug>`.
- Added centralized namespace/legacy mapping in `src/create-quiver/commands/handoff.js`.
- Legacy `check-handoff` and `new-handoff` still work and warn only on stderr in human mode.
- Help, docs, generated scripts, generated docs, and i18n audit matrix now include canonical handoff commands.

## Validation

- [x] `node --test tests/lib/handoff.test.js tests/commands/handoff-namespace.test.js tests/commands/cli-contract.test.js tests/commands/i18n-audit-matrix.test.js tests/lib/i18n-catalog.test.js tests/lib/init-layout.test.js tests/lib/init-docs.test.js`
- [x] Package-installed smoke via local `npm pack` and temp install.
- [x] `git diff --check`
- [x] `node bin/create-quiver.js spec validate specs/quiver-v46-cli-surface-ergonomics`

## Closure Conditions

- [x] Canonical handoff commands work.
- [x] Legacy aliases remain compatible.
- [x] Brief validation contract is unchanged.

## Open Items

- None.
