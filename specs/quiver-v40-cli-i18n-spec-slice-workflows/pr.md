# PR - Quiver v40 CLI i18n Spec and Slice Workflows

## Summary

- Localize spec and slice workflow command output.
- Preserve generated artifact schemas and validation behavior.

## Validation

```bash
node --test tests/**/*.test.js
git diff --check
npx create-quiver spec validate specs/quiver-v40-cli-i18n-spec-slice-workflows --strict
npm run package:quiver
npm run smoke:create-quiver
```
