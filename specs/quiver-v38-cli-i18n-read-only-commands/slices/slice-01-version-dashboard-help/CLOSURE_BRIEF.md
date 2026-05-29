# CLOSURE_BRIEF - slice-01 Version, dashboard, and help

## Summary

Completed localization for the most visible read-only surfaces in this slice:

- `version` human labels now use the configured CLI language while `version --json` remains stable.
- `dashboard` compact, detailed, section, warning, and option-error human labels now use `en`/`es` catalog keys while `dashboard --json` remains stable.
- Existing help localization from the v37 foundation remains covered by command contract tests.

## Validation

- [x] `node --test tests/commands/version.test.js tests/commands/dashboard.test.js tests/commands/cli-contract.test.js tests/lib/version.test.js tests/lib/dashboard.test.js tests/lib/i18n-catalog.test.js tests/lib/i18n-language.test.js`
- [x] `node --test tests/**/*.test.js`
- [x] `git diff --check`
- [x] `node bin/create-quiver.js spec validate specs/quiver-v38-cli-i18n-read-only-commands --strict`
- [x] `node bin/create-quiver.js check-slice specs/quiver-v38-cli-i18n-read-only-commands/slices/slice-01-version-dashboard-help/slice.json --local` (warning expected: slice already completed)
