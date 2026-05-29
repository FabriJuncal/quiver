# CLOSURE_BRIEF - slice-02 Analyze, migrate, and prepare-context

## Summary

Localized setup-adjacent human output for `analyze`, `migrate`, and `ai prepare-context` while preserving paths, command snippets, write-free dry-runs, and generated prompt/content contracts.

## Validation

- [x] `node --test tests/commands/analyze.test.js tests/commands/init-profiles.test.js tests/commands/ai-onboard.test.js tests/lib/i18n-catalog.test.js`
- [x] `git diff --check`
- [x] `node bin/create-quiver.js spec validate specs/quiver-v39-cli-i18n-setup-onboarding --strict`
- [x] `node bin/create-quiver.js check-slice specs/quiver-v39-cli-i18n-setup-onboarding/slices/slice-02-analyze-migrate-prepare/slice.json --local`
