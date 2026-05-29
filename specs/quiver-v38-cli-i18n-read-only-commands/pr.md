# PR - Quiver v38 CLI i18n Read-only Commands

## Summary

- Localize read-only Quiver commands in Spanish and English.
- Preserve JSON contracts and command snippets.

## Validation

```bash
node --test tests/**/*.test.js
git diff --check
npx create-quiver spec validate specs/quiver-v38-cli-i18n-read-only-commands --strict
npm run package:quiver
npm run smoke:create-quiver
```
