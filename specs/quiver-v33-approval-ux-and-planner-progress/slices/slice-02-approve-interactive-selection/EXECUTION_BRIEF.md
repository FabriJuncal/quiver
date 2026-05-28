# EXECUTION_BRIEF - slice-02 Interactive approval selection

## Context

Users currently need to run `ai approvals`, inspect versions manually, then pass `--version <n>`. The requested UX should behave like `ai agent set`: guide users in TTY and stay explicit in automation.

## Objective

Add TTY approval selection for `ai approve` when `--version` is omitted.

## Scope

- `src/create-quiver/commands/ai.js`
- selector helpers if needed
- approval tests

## Acceptance Criteria

- TTY acceptance approval without `--version` shows candidates.
- TTY technical-plan approval without `--version` shows review-aware candidates.
- No-TTY/CI requires `--version`.
- Explicit `--version` behavior remains stable.
- Cancellation writes no files.
- Blocked candidates cannot be approved.

## Technical Plan Summary

Resolve candidates from slice-01, use `selectOption` for prompt-capable environments, and pass the selected version into the existing approval path.

## Suggested Steps

1. Add approval selection resolver.
2. Wire resolver into `runApprove`.
3. Add no-TTY guardrail message.
4. Add tests for acceptance and technical-plan.
5. Verify explicit version path remains unchanged.

## Restrictions

- Do not add `--review` support.
- Do not weaken technical-plan validation.
- Do not prompt in CI/no-TTY/JSON.

## Risks

- Prompt availability detection must match existing `ai agent set` behavior closely enough to avoid CI hangs.

## Completion Checklist

- [ ] TTY selector implemented.
- [ ] No-TTY guardrail tested.
- [ ] Cancellation tested.
- [ ] Explicit `--version` tested.
