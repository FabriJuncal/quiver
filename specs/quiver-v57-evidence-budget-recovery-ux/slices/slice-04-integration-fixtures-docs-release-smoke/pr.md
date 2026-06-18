# PR - slice-04 Integration Fixtures + Docs + Release Smoke

## Summary

- Adds public troubleshooting guidance for `evidence-not-selected` recovery.
- Documents safe rerun commands and when to use `--max-files`, `--max-bytes`, `--include-tests`, `--include-db`, or `--scope`.
- Adds provider command coverage for Spanish recovery output, manifests, and `--json` recovery payloads.

## Validation

- PASS `node --test tests/lib/ai-analyze-project-recovery.test.js`
- PASS `node --test tests/commands/ai-analyze-project-provider.test.js`
- PASS `node --test tests/lib/i18n-catalog.test.js`
- PASS `npm run docs:check`
