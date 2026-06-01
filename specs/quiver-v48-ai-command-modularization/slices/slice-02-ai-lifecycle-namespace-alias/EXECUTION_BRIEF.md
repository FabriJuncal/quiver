# EXECUTION_BRIEF - slice-02 AI lifecycle namespace alias

## Context

This slice clarifies AI lifecycle terminology while preserving `ai run`.

## Objective

Add `ai lifecycle create|close` while preserving `ai run create|close`.

## Scope

- Parser/routing for `ai lifecycle`.
- Compatibility for `ai run`.
- Help/docs/tests.

## Acceptance Criteria

- `ai lifecycle create|close` matches current lifecycle behavior.
- `ai run create|close` remains functional.
- Deprecation warnings, if used, are stderr-only and human-only.
- Tests cover canonical and compatibility forms.

## Expected Files To Modify

- `src/create-quiver/index.js`
- `src/create-quiver/commands/ai.js`
- `tests/commands/ai-run-state.test.js`
- `tests/commands/ai-dispatch-contract.test.js`

## Validations Required

- `node --test tests/commands/ai-run-state.test.js`
- `node --test tests/commands/ai-dispatch-contract.test.js`
- `git diff --check`

## Risks

- Confusing lifecycle with evidence run semantics.
- Changing run-state behavior accidentally.

## Dependencies

- Depends on `slice-01-ai-dispatch-contract-baseline`.

## Instructions For Executor

1. Route lifecycle to existing implementation.
2. Preserve state schema and behavior.
3. Update help after tests.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Lifecycle alias is stable and compatible.
