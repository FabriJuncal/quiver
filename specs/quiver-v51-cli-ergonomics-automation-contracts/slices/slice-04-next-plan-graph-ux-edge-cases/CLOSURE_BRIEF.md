# CLOSURE_BRIEF - slice-04 next/plan/graph UX edge cases

## Summary

Secondary next/plan/graph UX edges are closed without refactoring stable read-only command logic. Existing `next --auto-start` prompt behavior was validated by tests; `plan` now emits a localized human-only missing-estimates note; `graph --level` empty states and `graph --json` precedence over `--format` are tested and documented.

## Validation

- [x] `node --test tests/commands/next.test.js`
- [x] `node --test tests/commands/plan.test.js`
- [x] `node --test tests/commands/graph.test.js`
- [x] `node --test tests/commands/next.test.js tests/commands/plan.test.js tests/commands/graph.test.js tests/lib/i18n-catalog.test.js`
- [x] `node --test`
- [x] `npm run docs:check`
- [x] `git diff --check`

## Closure Conditions

- [x] Missing UX edges closed.
- [x] Implemented behaviors protected by evidence/tests.
- [x] JSON safety preserved.

## Open Items

- No open implementation items for this slice.
