# EXECUTION_BRIEF - slice-01 status command

## Context

This slice adds the `status` command after v47 contracts are defined.

## Objective

Add a read-only `status` command that gives users the most relevant current state and next safe command.

## Scope

- Top-level parser/help entry for `status`.
- Status command module.
- Human output and optional JSON contract.
- No-write tests.

## Acceptance Criteria

- `status` is read-only.
- Output includes state and next safe command.
- JSON behavior is explicit and tested.
- No prompts, providers, worktrees, or writes occur.

## Expected Files To Modify

- `src/create-quiver/index.js`
- `src/create-quiver/commands/status.js`
- `tests/commands/status.test.js`
- `tests/commands/cli-contract.test.js`
- Docs/help files as needed.

## Validations Required

- `node --test tests/commands/status.test.js`
- `node --test tests/commands/cli-contract.test.js`
- `git diff --check`

## Risks

- Accidentally duplicating `flow`/`dashboard` logic.
- Introducing writes through state collection.

## Dependencies

- Depends on `slice-00-loop-closure-foundation`.

## Instructions For Executor

1. Prefer composing existing state functions over new state collection.
2. Add no-write tests before implementation.
3. Keep output concise and actionable.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- `status` is usable, read-only, documented, and tested.
