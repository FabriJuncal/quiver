# CLOSURE_BRIEF - slice-03 Config language command

## Summary

Implemented `config language` commands.

Added:

- `config language show`
- `config language show --json`
- `config language set <en|es>`
- `config language set <en|es> --global`
- project config writes to `.quiver/config.json`
- global config writes to `~/.quiver/config.json`
- stable JSON output for show/set
- command reference documentation

## Validation

- [x] `node --test tests/commands/config-language.test.js`
- [x] `node --test tests/lib/i18n-catalog.test.js tests/lib/i18n-language.test.js tests/commands/cli-contract.test.js`
- [x] `node --test tests/**/*.test.js`
- [x] `node bin/create-quiver.js spec validate specs/quiver-v37-cli-i18n-foundation --strict`
- [x] `git diff --check`

## Pending

- No pending work for this slice.

## Remaining Risks

- Parser/help localization is still pending in `slice-04-parser-help-error-foundation`.
