# EXECUTION_BRIEF - slice-01 AI dispatch contract baseline

## Context

This slice protects current AI command behavior before any module split.

## Objective

Capture current AI dispatch behavior before any refactor.

## Scope

- Golden tests for representative AI commands.
- Alias coverage.
- Help and error behavior.
- Dry-run/print-prompt only for provider-backed commands.

## Acceptance Criteria

- Tests pass against current implementation.
- At least one command per AI domain is covered.
- stdout/stderr and exit behavior are asserted where relevant.
- No runtime code is modified.

## Expected Files To Modify

- `tests/commands/ai-dispatch-contract.test.js`
- Existing `tests/commands/ai-*.test.js` if extending coverage.
- `specs/quiver-v48-ai-command-modularization/**`

## Validations Required

- `node --test tests/commands/ai-dispatch-contract.test.js`
- Focused AI command tests.
- `git diff --check`

## Risks

- Baseline tests too shallow to catch refactor regressions.
- Accidentally invoking live providers.

## Dependencies

- Depends on `slice-00-ai-modularization-foundation`.

## Instructions For Executor

1. Add tests without changing runtime.
2. Use dry-run or print-prompt for provider-backed commands.
3. Assert stdout/stderr separation for aliases where applicable.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Baseline protects all later AI refactor slices.
