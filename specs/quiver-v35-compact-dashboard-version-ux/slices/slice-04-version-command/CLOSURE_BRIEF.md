# CLOSURE_BRIEF - slice-04 Version command and banner

## Summary

Implemented `version` and `version --json` with schema version 1, Quiver ASCII banner, approved palette colors, no-color/CI/no-TTY behavior, runtime/package-manager/project metadata, and preserved semver-only top-level `--version` / `-V`.

## Validation

- [x] `node --test tests/commands/cli-contract.test.js`
- [x] `node --test tests/lib/cli-theme.test.js tests/lib/version.test.js`
- [x] `git diff --check`

## Pending

- None.

## Remaining Risks

- Low. Semver-only `--version` / `-V` is covered by unit tests and installed-package smoke.
