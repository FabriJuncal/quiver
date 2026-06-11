# CLOSURE_BRIEF - slice-05 controlled retry layer

## Status

Completed on 2026-06-11.

## Summary

Analyze-project now retries retryable invalid provider JSON with a default of 1 retry and a hard cap of 2 retries. Retry prompts use compact schema feedback plus the prior provider response rather than resending full selected file contents.

## Evidence

- Added retry prompt generation to `analyze-project-prompts`.
- Added retry classification and retry loop to `runAnalyzeProject`.
- Added retry manifests at `.quiver/runs/run-.../retry/analyze-project-retry.json`.
- Provider tests cover retry success, retry exhaustion, and hard cap behavior.

## Validation

- `node --test tests/commands/ai-analyze-project-provider.test.js` passed: 17 tests.
- `node --test tests/commands/ai-analyze-project.test.js` passed: 3 tests.
- `node --test tests/lib/ai/analyze-project-repair.test.js` passed: 3 tests.
- `npm run schema:slice:check` passed.
- `git diff --check` passed.

## Decisions

- Provider command failures are treated as fatal and do not retry.
- Retryable invalid JSON includes parse/schema/evidence/doc-path validation failures.
- Retry prompts intentionally avoid `Selected file contents:` to keep retry payloads compact.

## Follow-ups

- `slice-06-audit-review-transaction` persists the final provider execution story.
