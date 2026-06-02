# EXECUTION_BRIEF - slice-01 flow JSON compatibility

## Context

`flow --json` currently exposes `nextCommand`. The audit requires `next_command` for stable agent consumption, but existing consumers must not break.

## Objective

Add snake_case `next_command` to flow JSON without breaking existing `nextCommand` consumers.

## Scope

- `flow --json`.
- Compatibility docs.
- Flow tests.

## Acceptance Criteria

- `next_command` exists in JSON output.
- `nextCommand` remains.
- Values match when present.
- Both are null or documented consistently when no next command exists.
- Human output remains compatible.

## Expected Files To Modify

- `src/create-quiver/commands/flow.js`
- `docs/reference/commands.md`
- `tests/commands/flow.test.js`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/EVIDENCE_REPORT.md`

## Validations Required

- `node --test tests/commands/flow.test.js`
- `node --test`
- `git diff --check`

## Risks

- Breaking existing `nextCommand` users.
- Adding inconsistent values across states.

## Dependencies

- Depends on `slice-00-cli-contract-baseline`.

## Instructions For Executor

1. Make the JSON change additive only.
2. Add tests for representative states.
3. Document compatibility and do not remove legacy field.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Flow JSON supports both snake_case and legacy camelCase consumers.
