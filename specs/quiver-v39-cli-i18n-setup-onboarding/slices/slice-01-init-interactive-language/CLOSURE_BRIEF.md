# CLOSURE_BRIEF - slice-01 Init interactive language

## Summary

Implemented interactive project language selection for `init --interactive`, persisted selected language to `.quiver/config.json` without dropping existing config keys, and kept dry-run/no-TTY behavior safe.

## Validation

- [x] `node --test tests/commands/init-profiles.test.js tests/commands/config-language.test.js tests/lib/init-layout.test.js tests/lib/i18n-catalog.test.js`
- [x] `git diff --check`
- [x] `node bin/create-quiver.js spec validate specs/quiver-v39-cli-i18n-setup-onboarding --strict`
- [x] `node bin/create-quiver.js check-slice specs/quiver-v39-cli-i18n-setup-onboarding/slices/slice-01-init-interactive-language/slice.json --local`
