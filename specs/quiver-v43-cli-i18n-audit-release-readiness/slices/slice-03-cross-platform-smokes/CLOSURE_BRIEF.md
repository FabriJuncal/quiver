# CLOSURE_BRIEF - slice-03 Cross-platform smokes

## Summary

- Added i18n-specific checks to the cross-platform smoke script.
- Covered configured project language, `--lang`, `QUIVER_LANG`, JSON parseability, and paths with spaces.
- Made cleanup wrapper Spanish expectations explicit in the create smoke.
- Recorded platform execution evidence and approved local-environment exceptions.

## Validation

- [x] `node scripts/ci/smoke-cross-platform.js`
- [x] `npm run smoke:create-quiver`
- [x] `node --test tests/lib/paths.test.js tests/commands/config-language.test.js tests/commands/dashboard.test.js`
- [x] `git diff --check`
