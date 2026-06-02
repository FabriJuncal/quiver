# CLOSURE_BRIEF - slice-04 user-facing i18n error coverage

## Summary

Localized covered user-facing error wrappers for `config`, `evidence`, `graph`, and `spec` command paths, including parser/wiring paths in `index.js`, command-to-library evidence errors, graph format errors, and spec create/validate wrappers. Documented technical allowlist and confirmed `commands/ai-core.js` does not exist in the current repo.

## Validation

- [x] `node --test tests/commands/i18n-audit-matrix.test.js`
- [x] `node --test tests/lib/i18n-catalog.test.js`
- [x] `node --test tests/commands/config-language.test.js tests/commands/evidence.test.js tests/commands/graph.test.js tests/commands/spec-validate.test.js tests/commands/spec-create.test.js tests/lib/i18n-catalog.test.js tests/commands/i18n-audit-matrix.test.js`
- [x] `node --test`
- [x] `git diff --check`

## Closure Conditions

- [x] User-facing errors localized in covered paths.
- [x] Allowlist documented in `EVIDENCE_REPORT.md`.
- [x] JSON stdout contracts preserved for covered error tests.

## Open Items

- None.
