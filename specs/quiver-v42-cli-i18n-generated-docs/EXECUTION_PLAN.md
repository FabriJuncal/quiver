# Execution Plan - Quiver v42 CLI i18n Generated Docs

## Execution Rules

- Start only after v37 foundation is complete.
- Localize human documentation only.
- Keep machine artifacts stable.
- Do not duplicate large templates unless parameterization would be less clear or more fragile.

## Suggested Order

1. `slice-00-generated-docs-foundation`
2. `slice-01-template-language-routing`
3. `slice-02-init-docs-and-i18n-assets`
4. `slice-03-docs-reference-guides`
5. `slice-04-generated-docs-tests-smokes`

## Final Validation

```bash
node --test tests/**/*.test.js
git diff --check
npx create-quiver spec validate specs/quiver-v42-cli-i18n-generated-docs --strict
npm run package:quiver
npm run smoke:create-quiver
```
