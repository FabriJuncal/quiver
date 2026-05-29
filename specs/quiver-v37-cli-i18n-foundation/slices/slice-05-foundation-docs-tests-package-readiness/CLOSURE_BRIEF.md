# CLOSURE_BRIEF - slice-05 Foundation docs, tests, and package readiness

## Summary

Completed foundation documentation and release-readiness validation.

Added:

- language selection rules to `docs/CLI_UX_GUIDE.md`
- `--lang`, `QUIVER_LANG`, project/global config precedence, and JSON stability docs to `docs/reference/commands.md`
- final evidence for full suite, package smoke, and create-quiver smoke

## Validation

- [x] `node --test tests/**/*.test.js`
- [x] `node bin/create-quiver.js spec validate specs/quiver-v37-cli-i18n-foundation --strict`
- [x] `npm run package:quiver`
- [x] `npm run smoke:create-quiver`
- [x] `git diff --check`

## Pending

- No pending work for this slice.

## Remaining Risks

- Downstream command-specific migrations remain in v38-v43 by design.
