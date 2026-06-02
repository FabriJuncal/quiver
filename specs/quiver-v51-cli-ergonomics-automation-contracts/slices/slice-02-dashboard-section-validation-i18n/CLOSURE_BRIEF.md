# CLOSURE_BRIEF - slice-02 dashboard section validation and i18n

## Summary

Dashboard invalid-section errors are now contract-tested for EN/ES human output and JSON-safe failure payloads. CLI help and command reference docs list the real supported dashboard sections, including `overview`.

## Validation

- [x] `npm run test:ci -- tests/commands/dashboard.test.js tests/commands/cli-contract.test.js tests/lib/i18n-catalog.test.js`
- [x] `node --test`
- [x] `npm run docs:check`
- [x] `git diff --check`
- [x] `node bin/create-quiver.js spec validate specs/quiver-v51-cli-ergonomics-automation-contracts`
- [x] `node bin/create-quiver.js check-slice specs/quiver-v51-cli-ergonomics-automation-contracts/slices/slice-02-dashboard-section-validation-i18n/slice.json --local --gate validation`

## Closure Conditions

- [x] Invalid section errors localized.
- [x] Supported sections documented and tested.
- [x] Machine output preserved.

## Open Items

- None.
