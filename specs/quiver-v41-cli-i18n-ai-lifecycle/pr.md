# PR - Quiver v41 CLI i18n AI Lifecycle

## Summary

- Localize AI lifecycle command wrappers in Spanish and English.
- Preserve provider prompts, JSON, JSONL, artifacts, and secret redaction behavior.

## Validation

```bash
node --test tests/**/*.test.js
git diff --check
npx create-quiver spec validate specs/quiver-v41-cli-i18n-ai-lifecycle --strict
npm run package:quiver
npm run smoke:create-quiver
```
