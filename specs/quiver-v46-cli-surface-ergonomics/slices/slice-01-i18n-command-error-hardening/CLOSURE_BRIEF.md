# CLOSURE_BRIEF - slice-01 i18n command error hardening

## Summary

Completed. Representative command errors and selected human output now route through the i18n catalog for `config`, `evidence`, `spec`, `graph`, `prepare`, and selected `ai` flows. JSON outputs remain machine-readable, and a static hardcoded-error audit now blocks new non-allowlisted command errors.

## Validation

- [x] `node --test tests/lib/i18n-catalog.test.js`
- [x] `node --test tests/commands/i18n-audit-matrix.test.js`
- [x] Focused command tests
- [x] `node --test tests/commands/cli-contract.test.js`
- [x] `git diff --check`

## Closure Conditions

- [x] Missing command error localization is complete for the slice-00 target set, with explicit documented exceptions.
- [x] Static audit or matrix coverage is in place.
- [x] JSON contracts remain stable.

## Open Items

- Deep AI planner/repair-plan hardcoded errors are deferred to v48 and documented in the static audit allowlist.
- Next executable slice: `slice-02-read-only-ux-quick-wins`.
