# EXECUTION_BRIEF - slice-05 AI help and advanced surface

## Context

This slice updates AI help after domain modules define the final command surface.

## Objective

Group AI help by domain and label diagnostic commands as advanced.

## Scope

- AI help grouping.
- Advanced labels for `active-slice reconcile` and `trace report`.
- Docs/help tests.
- Alias documentation.

## Acceptance Criteria

- AI help is domain-grouped.
- Advanced diagnostics are labeled.
- Aliases are clearly documented.
- Command behavior is unchanged.

## Expected Files To Modify

- `src/create-quiver/index.js`
- `src/create-quiver/commands/ai.js`
- `docs/reference/commands.md`
- `tests/commands/cli-contract.test.js`
- `tests/commands/ai-dispatch-contract.test.js`

## Validations Required

- `node --test tests/commands/cli-contract.test.js`
- `node --test tests/commands/ai-dispatch-contract.test.js`
- `git diff --check`

## Risks

- Help text drifting from implementation.
- Hiding advanced commands instead of labeling them.

## Dependencies

- Depends on `slice-04-ai-domain-module-split`.

## Instructions For Executor

1. Update help after domain split.
2. Keep advanced commands visible.
3. Add tests for help text.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- AI help is navigable and accurate.
