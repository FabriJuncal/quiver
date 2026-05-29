# Execution Plan - Quiver v43 CLI i18n Audit and Release Readiness

## Execution Rules

- Start only after v37-v42 are implemented and merged.
- Treat uncovered critical command/language/mode cells as blockers.
- Fix gaps in owning specs/slices where practical.
- Keep evidence reproducible and concise.

## Suggested Order

1. `slice-00-audit-foundation`
2. `slice-01-command-language-mode-matrix`
3. `slice-02-public-string-audit`
4. `slice-03-cross-platform-smokes`
5. `slice-04-package-release-readiness`

## Final Validation

```bash
node --test tests/**/*.test.js
git diff --check
npx create-quiver spec validate specs/quiver-v43-cli-i18n-audit-release-readiness --strict
npm run package:quiver
npm run smoke:create-quiver
npm pack --dry-run --json
```
