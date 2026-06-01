# EXECUTION_BRIEF - slice-04 AI domain module split

## Context

This slice performs the main AI module refactor after baseline and alias behavior are stable.

## Objective

Split `commands/ai.js` into domain modules while preserving behavior.

## Scope

- Lifecycle module.
- Planner module.
- Agents module.
- Execution module.
- Inspection/export module.
- Diagnostics module.
- Thin router in `commands/ai.js`.

## Acceptance Criteria

- Domain modules exist.
- AI dispatch contract tests pass.
- Focused AI tests pass.
- Provider behavior is unchanged.
- Aliases remain compatible.

## Expected Files To Modify

- `src/create-quiver/commands/ai.js`
- `src/create-quiver/commands/ai/*.js`
- `tests/commands/ai-dispatch-contract.test.js`
- Existing AI command tests as needed.

## Validations Required

- AI dispatch contract tests.
- Focused AI command tests.
- `git diff --check`

## Risks

- Behavior drift during refactor.
- Circular imports or shared helper drift.
- Provider-backed command regressions.

## Dependencies

- Depends on slices 01-03.

## Instructions For Executor

1. Keep tests green after each domain move.
2. Move shared helpers only when necessary.
3. Do not change command semantics.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Domain split complete.
- All AI focused tests pass.
