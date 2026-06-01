# Execution Plan - Quiver v46 CLI Surface Ergonomics

## Order

1. Execute `slice-00-cli-surface-baseline-and-delta`.
2. Execute `slice-01-i18n-command-error-hardening`.
3. Execute `slice-02-read-only-ux-quick-wins`.
4. Execute `slice-03-write-command-feedback-safety`.
5. Execute `slice-04-slice-namespace-compatibility`.
6. Execute `slice-05-handoff-namespace-compatibility`.
7. Execute `slice-06-init-analyze-doctor-command-modules`.
8. Execute `slice-07-docs-tests-release-readiness`.

## Risk Controls

- Start with baseline evidence because v35-v43 already implemented overlapping behavior.
- Keep deprecated warnings on stderr only.
- Preserve legacy aliases until a future major-version policy says otherwise.
- Add golden tests before command-module extraction.
- Validate package-installed behavior, not only source-tree behavior.

## Required Final Validation

- `node --test`
- `npm run package:quiver`
- package-installed smoke for both `create-quiver` and `quiver`
- `git diff --check`
- `npx create-quiver spec validate specs/quiver-v46-cli-surface-ergonomics`
