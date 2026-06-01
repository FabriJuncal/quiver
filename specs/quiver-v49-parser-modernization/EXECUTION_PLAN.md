# Execution Plan - Quiver v49 Parser Modernization

## Order

1. Execute `slice-00-parser-modernization-foundation`.
2. Execute `slice-01-command-flag-registry-inventory`.
3. Execute `slice-02-parser-golden-contract-suite`.
4. Execute `slice-03-parser-library-decision`.
5. Execute `slice-04-parser-adapter-incremental-migration`.
6. Execute `slice-05-help-and-shell-readiness`.
7. Execute `slice-06-docs-tests-release-readiness`.

## Risk Controls

- Golden tests must land before migration.
- Keep current manual parser callable until adapter behavior is proven.
- Prefer incremental command groups over a single parser rewrite.

## Required Final Validation

- Parser contract tests
- `node --test`
- `npm run package:quiver`
- package-installed parser smoke for both binaries
- `git diff --check`
- `npx create-quiver spec validate specs/quiver-v49-parser-modernization`
