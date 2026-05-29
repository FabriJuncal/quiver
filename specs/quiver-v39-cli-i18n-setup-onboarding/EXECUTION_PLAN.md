# Execution Plan - Quiver v39 CLI i18n Setup and Onboarding

## Execution Rules

- Start only after v37 foundation is complete.
- Preserve no-TTY and CI safety.
- Do not mix generated docs localization into this spec.

## Suggested Order

1. `slice-00-setup-foundation`
2. `slice-01-init-interactive-language`
3. `slice-02-analyze-migrate-prepare`
4. `slice-03-demo-evidence-onboarding`
5. `slice-04-setup-tests-smokes`

## Final Validation

```bash
node --test tests/**/*.test.js
git diff --check
npx create-quiver spec validate specs/quiver-v39-cli-i18n-setup-onboarding --strict
npm run package:quiver
npm run smoke:create-quiver
```
