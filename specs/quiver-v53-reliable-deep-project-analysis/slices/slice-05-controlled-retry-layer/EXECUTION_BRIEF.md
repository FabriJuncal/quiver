# EXECUTION_BRIEF - slice-05 controlled retry layer

## Context

Some provider outputs cannot be safely repaired but can be corrected by giving the provider compact validation feedback. Retry must be bounded to avoid cost, latency, and loops.

## Objective

Add controlled retry behavior for retryable analyze-project provider failures.

## Scope

- Retry classification.
- Retry prompt.
- Retry count/hard cap.
- Retry output and manifest fields.
- No final docs writes after exhausted retry.

## Acceptance Criteria

- Retry-success fixture succeeds.
- Retry-exhausted fixture fails safely.
- Fatal failures do not retry.
- Retry count is visible and audited.

## Expected Files To Modify

- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/ai/analyze-project-prompts.js`
- `src/create-quiver/lib/ai/analyze-project-validation.js`
- `src/create-quiver/lib/ai/providers.js`
- provider tests/fixtures

## Validations Required

- `node --test tests/commands/ai-analyze-project-provider.test.js`
- `node --test tests/commands/ai-analyze-project.test.js`
- `git diff --check`

## Risks

- Retry may increase command latency and provider cost.
- Retrying fatal failures can hide root cause.

## Dependencies

- Depends on `slice-03-schema-error-grouping`.
- Depends on `slice-04-safe-repair-layer`.

## Instructions For Executor

1. Keep retry count bounded and deterministic.
2. Keep retry prompts compact.
3. Do not write final docs until final JSON is valid.

## Completion Checklist

- [ ] Retry classification implemented.
- [ ] Retry cap tests pass.
- [ ] Fatal no-retry behavior is covered.
- [ ] Closure brief updated.

## Conditions Of Closure

- Retry improves recovery without creating loops or unsafe writes.
