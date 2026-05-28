# CLOSURE_BRIEF - slice-01 Dashboard CLI contract

## Summary

Implemented dashboard-scoped parsing and validation for `--details`, `--section <name>`, and `--limit <n>`. JSON mode now rejects human-only dashboard flags with parseable JSON stdout and no human stderr, and non-dashboard commands fail clearly for dashboard-only flags.

## Validation

- [x] `node --test tests/commands/dashboard.test.js`
- [x] `node --test tests/commands/cli-contract.test.js`
- [x] `git diff --check`

## Pending

- None.

## Remaining Risks

- Low. JSON-safe error behavior is covered by command tests and installed-package smoke.
