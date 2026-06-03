# CLOSURE_BRIEF - slice-02 generated CLI reference

## Summary

Added a generated CLI command reference block and drift check that preserve curated docs outside explicit markers.

- Added `scripts/ci/check-command-reference.js` with `--write` and `--check` modes.
- Generated the protected block in `docs/reference/commands.md`.
- Added `npm run docs:commands:write` and `npm run docs:commands:check`.
- Wired `docs:commands:check` into `npm run docs:check`.
- Added tests for runtime-help consistency, docs synchronization, and manual-content preservation.

## Validation

- [x] `npm run docs:commands:write`
- [x] `npm run docs:commands:check`
- [x] `node --test tests/docs/command-reference.test.js`
- [x] `node bin/create-quiver.js --help`
- [x] `npm run docs:check`
- [x] `npm ci`
- [x] `node --test`
- [x] `git diff --check`

## Closure Conditions

- [x] Generated content protected.
- [x] Drift check available.
- [x] Manual docs preserved.
- [x] CI/docs check can fail on drift without rewriting files.

## Open Items

- None.
