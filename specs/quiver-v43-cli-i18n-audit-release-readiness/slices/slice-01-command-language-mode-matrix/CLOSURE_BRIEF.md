# CLOSURE_BRIEF - slice-01 Command language mode matrix

## Summary

Created the command x language x mode matrix for every command documented in `docs/reference/commands.md`.

The matrix is stored in `command-language-mode-matrix.json`, summarized in `EVIDENCE_REPORT.md`, and protected by `tests/commands/i18n-audit-matrix.test.js`.

## Validation

- [x] `node --test tests/commands/i18n-audit-matrix.test.js`
- [x] `node --test tests/**/*.test.js`
- [x] `git diff --check`
