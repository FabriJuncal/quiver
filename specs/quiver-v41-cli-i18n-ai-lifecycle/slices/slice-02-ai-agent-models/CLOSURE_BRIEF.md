# CLOSURE_BRIEF - slice-02 AI agents and models

## Summary

Completed. `ai agent set/list/show/doctor/repair` and `ai models list` now localize human wrapper output in `en` and `es`. Provider ids, model ids, stored profile JSON, and `--json` output remain stable.

## Validation

- [x] `node --test tests/commands/ai-agent.test.js`
- [x] `node --test tests/commands/ai-models.test.js`
- [x] `node --test tests/lib/i18n-catalog.test.js`
- [x] `git diff --check`
