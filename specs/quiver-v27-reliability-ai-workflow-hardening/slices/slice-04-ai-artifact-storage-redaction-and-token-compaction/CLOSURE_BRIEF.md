# CLOSURE BRIEF - slice-04: AI artifact storage, redaction, and token compaction

## Summary

Implemented AI artifact hardening for planner and review flows. Draft/review artifacts now persist clean provider output, raw stdout/stderr are stored separately under run-scoped `.quiver/runs/<run-id>/raw/*.json`, secrets and local paths are redacted, oversized revise inputs are compacted before provider execution, and package safety blocks raw AI artifacts from npm tarballs.

## Validation Against Acceptance Criteria

- Draft files contain useful output only: covered by `ai plan stores clean drafts and separates redacted raw provider logs`.
- Raw logs are run-scoped and redacted: covered by `raw_artifact_path` assertions in `ai-plan` and `ai-review-plan` tests.
- Oversized revise inputs are compacted or blocked: covered by `ai revise compacts oversized feedback before provider execution` and `ai plan rejects oversized prompts before provider execution`.
- Approved versions remain explicit: existing versioned approval tests still pass and approved metadata carries the selected draft metadata.
- Package safety blocks raw AI artifacts: covered by `tests/lib/package-safety.test.js`.

## Changes

- Added `src/create-quiver/lib/ai/artifacts.js`.
- Updated `src/create-quiver/commands/ai.js` for clean/raw separation, prompt-size guards, and revise compaction.
- Updated `src/create-quiver/lib/approvals.js` and `src/create-quiver/lib/ai/plan-review.js` to persist raw artifact metadata.
- Updated `src/create-quiver/lib/package-safety.js` to classify `.quiver/runs/*/raw/` as unsafe package content.
- Added/updated tests in `tests/commands/ai-plan.test.js`, `tests/commands/ai-review-plan.test.js`, and `tests/lib/package-safety.test.js`.

## Remaining Risks

- Provider-specific log formats can vary. The cleanup intentionally strips prompt echoes and common leading/trailing provider log lines while preserving the provider's main stdout content.
- Raw artifacts are redacted and ignored under `.quiver/`, but future package changes should keep package-safety checks in the release path.

## Follow-up Recommendations

- Add provider-specific clean-output fixtures if future dogfooding finds additional Claude/Codex/Gemini transcript wrappers.
- Consider exposing prompt-size limits in user-facing docs if users need to tune `QUIVER_AI_MAX_PROMPT_BYTES`, `QUIVER_AI_MAX_REVISION_INPUT_BYTES`, or `QUIVER_AI_COMPACTED_REVISION_INPUT_BYTES`.
