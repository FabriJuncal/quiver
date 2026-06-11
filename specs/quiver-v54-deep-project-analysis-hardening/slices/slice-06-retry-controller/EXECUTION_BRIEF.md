# EXECUTION_BRIEF - slice-06 retry controller

## Context

The live run retried but repeated the same drift and took too long. Retry must be cheap, bounded, and able to stop early.

## Objective

Implement controlled retry with compact prompts, timeouts, drift signatures, and fail-fast behavior.

## Scope

- Retry prompt uses compact validation feedback and does not resend full selected context.
- Add per-attempt timeout and total timeout.
- Compute drift signature from grouped validation issues.
- Stop early when dominant drift repeats or errors are clearly non-repairable.
- Keep max retries default 1 with hard cap defined by implementation.

## Acceptance Criteria

- Retry sends only schema feedback, failed paths/groups, and a minimal expected-shape reminder.
- Retry timeout produces actionable error and run status.
- Repeated drift fails early with compact diagnostics.
- Retry manifests include attempt count, max retries, drift signatures, issue counts, and final status.

## Completion Checklist

- [ ] Retry controller implemented.
- [ ] Timeout tests added.
- [ ] Repeated drift tests added.
- [ ] Closure brief records timeout defaults.

## Expected Files To Modify

- `src/create-quiver/commands/ai.js`
- `src/create-quiver/lib/ai/analyze-project-prompts.js`
- `src/create-quiver/lib/ai/analyze-project-validation.js`
- `tests/commands/ai-analyze-project-provider.test.js`
- This slice's closure/status/evidence files.

## Validation Required

```bash
node --test tests/commands/ai-analyze-project-provider.test.js
git diff --check
```

## Constraints

- Do not resend full context in retry.
- Do not increase default retry count beyond approved contract.
- Do not implement final write behavior here.
