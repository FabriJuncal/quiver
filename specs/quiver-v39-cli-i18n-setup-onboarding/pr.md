# PR - Quiver v39 CLI i18n Setup and Onboarding

## Summary

- Add language selection to interactive init.
- Localize setup and onboarding command output.
- Preserve automation-safe JSON, dry-run, CI, and no-TTY modes.

## Validation

```bash
node --test tests/**/*.test.js
git diff --check
npx create-quiver spec validate specs/quiver-v39-cli-i18n-setup-onboarding --strict
npm run package:quiver
npm run smoke:create-quiver
```
