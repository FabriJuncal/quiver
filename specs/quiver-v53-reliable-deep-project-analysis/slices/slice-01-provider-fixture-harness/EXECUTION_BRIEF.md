# EXECUTION_BRIEF - slice-01 provider fixture harness

## Context

The live `nika-erp` run failed because Codex returned schema-invalid extra `notes` keys. CI needs deterministic fixtures that reproduce this and other likely provider drift without relying on live provider access.

## Objective

Create provider fake fixtures and tests for analyze-project reliability behavior.

## Scope

- Provider fake responses.
- Fixture repository or fixture payloads.
- Tests for known drift and failure modes.
- No live provider calls.

## Acceptance Criteria

- `notes` drift is reproduced deterministically.
- Tests cover fences, surrounding text, truncation, missing required fields, invalid confidence, secret-like content, retry success, and retry exhaustion.
- Tests assert no final docs writes when final JSON is invalid.
- Tests can run offline.

## Expected Files To Modify

- `tests/commands/ai-analyze-project-provider.test.js`
- `tests/fixtures/analyze-project/**`
- spec evidence/status files

## Validations Required

- `node --test tests/commands/ai-analyze-project-provider.test.js`
- `node --test tests/commands/ai-analyze-project.test.js`
- `git diff --check`

## Risks

- Fixtures that are too synthetic may not capture the real provider drift.
- Tests that require live providers will be flaky and expensive.

## Dependencies

- Depends on `slice-00-analysis-run-contract`.

## Instructions For Executor

1. Build the smallest useful fixture set.
2. Keep provider fake output realistic enough to catch the observed drift.
3. Avoid introducing network or credential requirements.

## Completion Checklist

- [ ] Fixtures added.
- [ ] Tests added or updated.
- [ ] Closure brief records failing/passing behavior.

## Conditions Of Closure

- The reliability bug can be reproduced without live Codex.
