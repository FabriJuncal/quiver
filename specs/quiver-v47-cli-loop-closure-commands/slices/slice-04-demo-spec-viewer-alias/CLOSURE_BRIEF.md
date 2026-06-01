# CLOSURE_BRIEF - slice-04 demo spec-viewer alias

## Summary

Completed. `demo spec-viewer` now routes to the same implementation as `demo create spec-viewer`, and both forms are documented and tested.

## Validation

- [x] `node --test tests/commands/demo.test.js`
- [x] `node --test tests/commands/cli-contract.test.js`
- [x] `node --test tests/lib/i18n-catalog.test.js`
- [x] `node --test tests/commands/i18n-audit-matrix.test.js`
- [x] `git diff --check`

## Closure Conditions

- [x] New alias works.
- [x] Existing command remains compatible.
- [x] Help documents both forms.

## Open Items

- None.
