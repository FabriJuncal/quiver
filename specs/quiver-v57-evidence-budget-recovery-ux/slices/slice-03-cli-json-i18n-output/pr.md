# PR - slice-03 CLI + JSON + i18n Output

## Summary

- Adds prominent recovery guidance to final `evidence-not-selected` failures.
- Adds optional recovery payload to validation manifests and thrown errors.
- Adds English and Spanish recovery copy.
- Covers Spanish recovery command output in provider command tests.

## Validation

- PASS `node --test tests/commands/ai-analyze-project-provider.test.js`
- PASS `node --test tests/lib/i18n-catalog.test.js`
