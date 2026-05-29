# CLOSURE_BRIEF - slice-04 Parser, help, and early error foundation

## Summary

Implemented parser/help/error i18n foundation.

Added:

- language-aware top-level help rendering
- cataloged help headings and command descriptions
- localized unsupported command errors
- localized unsupported flag errors
- localized missing flag value errors, including missing `--lang`
- localized unsupported-language warnings in CLI entrypoint
- tests for explicit `--lang`, project-configured language, JSON stdout cleanliness, no-color help, and literal command preservation

## Validation

- [x] `node --test tests/commands/cli-contract.test.js`
- [x] `node --test tests/lib/i18n-catalog.test.js tests/lib/i18n-language.test.js`
- [x] `node --test tests/commands/config-language.test.js`
- [ ] `git diff --check`

## Pending

- Run `git diff --check` after final docs updates.

## Remaining Risks

- Command-specific business output is intentionally not migrated in this slice; it is covered by later i18n specs.
