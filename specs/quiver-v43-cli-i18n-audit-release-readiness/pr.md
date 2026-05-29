# PR - Quiver v43 CLI i18n Audit and Release Readiness

## Summary

- Add the final i18n command/mode/language audit.
- Verify JSON stability, cross-platform behavior, package readiness, and release evidence.

## Validation

```bash
node --test tests/**/*.test.js
git diff --check
npx create-quiver spec validate specs/quiver-v43-cli-i18n-audit-release-readiness --strict
npm run package:quiver
npm run smoke:create-quiver
npm pack --dry-run --json
```
