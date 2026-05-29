# PR - Quiver v42 CLI i18n Generated Docs

## Summary

- Add language routing for generated human docs and templates.
- Preserve machine artifacts and schema-like generated files.

## Validation

```bash
node --test tests/**/*.test.js
git diff --check
npx create-quiver spec validate specs/quiver-v42-cli-i18n-generated-docs --strict
npm run package:quiver
npm run smoke:create-quiver
```
