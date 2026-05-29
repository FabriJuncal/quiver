# CLOSURE_BRIEF - slice-04 Setup tests and smokes

## Summary

Closed v39 with full test, package, smoke, spec validation, diff hygiene, and configured-language evidence. The configured-language smoke proves setup output uses `.quiver/config.json` without requiring repeated `--lang` flags.

## Validation

- [x] `node --test tests/**/*.test.js`
- [x] `node bin/create-quiver.js spec validate specs/quiver-v39-cli-i18n-setup-onboarding --strict`
- [x] `node bin/create-quiver.js check-slice specs/quiver-v39-cli-i18n-setup-onboarding/slices/slice-04-setup-tests-smokes/slice.json --local`
- [x] `npm run package:quiver`
- [x] `npm run smoke:create-quiver`
- [x] configured-language smoke with `.quiver/config.json` language `es`
- [x] `git diff --check`
