# CLOSURE_BRIEF - slice-02 migrate write-safety contract

## Summary

Added a migrate write-safety gate before side effects, with TTY confirmation, no-TTY/JSON-safe refusal without `--yes`, explicit `migrate --yes` automation, dry-run preservation, localized messages, command docs, and tests.

## Validation

- [x] `node --test tests/commands/cli-contract.test.js`
- [x] `node --test tests/commands/init-profiles.test.js`
- [x] `node --test tests/commands/i18n-audit-matrix.test.js`
- [x] `node --test`
- [x] `npx -y node@20.12.0 --test tests/commands/cli-contract.test.js tests/commands/init-profiles.test.js tests/commands/i18n-audit-matrix.test.js`
- [x] `git diff --check`

## Closure Conditions

- [x] Confirmation occurs before side effects.
- [x] Cancellation/no-TTY paths are safe.
- [x] `--yes` and `--dry-run` contracts are tested.

## Open Items

- None.
