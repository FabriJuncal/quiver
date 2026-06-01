# CLOSURE_BRIEF - slice-04 slice namespace compatibility

## Summary

Completed. The canonical `slice` namespace now routes to existing slice lifecycle/readiness/scope implementations while keeping legacy root commands compatible:

- Added `slice start`, `slice check`, `slice check-pr`, `slice scope`, `slice cleanup`, and `slice refresh`.
- Added centralized namespace/legacy mapping in `src/create-quiver/commands/slice.js`.
- Legacy aliases still work and emit deprecation warnings only on stderr in human mode.
- Legacy aliases do not warn when `--json` is requested.
- Help, docs, generated scripts, doctor checks, and i18n audit matrix now recognize canonical `slice` commands.

## Validation

- [x] `node --test tests/commands/slice-namespace.test.js tests/commands/cli-contract.test.js tests/commands/init-profiles.test.js tests/lib/init-layout.test.js tests/lib/init-docs.test.js tests/commands/doctor.test.js tests/lib/i18n-catalog.test.js`
- [x] `node --test tests/commands/slice-namespace.test.js tests/commands/cli-contract.test.js tests/lib/init-layout.test.js tests/lib/init-docs.test.js tests/commands/doctor.test.js tests/commands/i18n-audit-matrix.test.js tests/lib/i18n-catalog.test.js tests/lib/check-slice.test.js`
- [x] Package-installed smoke via local `npm pack` and temp install.
- [x] `git diff --check`

## Closure Conditions

- [x] Canonical slice commands work.
- [x] Legacy aliases remain compatible.
- [x] Deprecation warnings are stderr-only and human-only.

## Open Items

- None.
