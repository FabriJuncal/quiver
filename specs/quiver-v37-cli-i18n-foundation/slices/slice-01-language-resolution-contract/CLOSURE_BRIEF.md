# CLOSURE_BRIEF - slice-01 Language resolution contract

## Summary

Implemented the language resolution foundation for `en` and `es`.

Added:

- `src/create-quiver/lib/i18n/language.js`
- global `--lang` extraction before command dispatch
- project/global config helpers for `.quiver/config.json` and `~/.quiver/config.json`
- locale normalization for supported `en` and `es` variants
- warnings for unsupported explicit language sources
- focused unit and CLI contract tests

## Validation

- [x] `node --test tests/lib/i18n-language.test.js`
- [x] `node --test tests/commands/cli-contract.test.js`
- [x] `node --test tests/**/*.test.js`
- [x] `node bin/create-quiver.js spec validate specs/quiver-v37-cli-i18n-foundation --strict`
- [x] `git diff --check`

## Pending

- Package and smoke validation are deferred to `slice-05-foundation-docs-tests-package-readiness`.

## Remaining Risks

- Command output is not translated yet; slice-02 through slice-05 own catalog, command wiring, and docs/package readiness.
