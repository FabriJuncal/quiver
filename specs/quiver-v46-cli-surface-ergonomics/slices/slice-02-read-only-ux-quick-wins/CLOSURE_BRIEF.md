# CLOSURE_BRIEF - slice-02 read-only UX quick wins

## Summary

Completed. The slice applied only missing read-only UX quick wins from the baseline:

- `plan` reports missing estimated hours in human output and exposes additive `missing_estimates` in JSON.
- `graph --level <n>` explains empty level filters in human output.
- Help text documents that top-level `--json` takes precedence over `graph --format`.
- `next` keeps the top ready slice prominent and summarizes additional ready slices with `--all-ready` guidance.
- `plan`, `graph`, and `next` have explicit read-only no-write tests.

## Validation

- [x] `node --test tests/commands/plan.test.js`
- [x] `node --test tests/commands/flow.test.js tests/commands/dashboard.test.js tests/commands/plan.test.js tests/commands/graph.test.js tests/commands/next.test.js tests/commands/evidence.test.js tests/lib/i18n-catalog.test.js tests/commands/cli-contract.test.js`
- [x] `git diff --check`

## Closure Conditions

- [x] Assigned quick wins are complete.
- [x] No read-only command writes state.
- [x] Already-present behavior is not duplicated.

## Open Items

- None.
