# EXECUTION_BRIEF - slice-03 changelog contract

## Context

This slice makes local contract/version change guidance accessible from the CLI.

## Objective

Add a local `changelog` command and connect migration guidance to it.

## Scope

- `changelog` command.
- Local content only.
- Help/docs/migrate guidance updates.
- Tests for no network and missing/malformed local content.

## Acceptance Criteria

- `changelog` displays useful local changes.
- `migrate` guidance points to changelog or dry-run preview.
- No network access is used.
- Tests cover normal and edge cases.

## Expected Files To Modify

- `src/create-quiver/index.js`
- `src/create-quiver/commands/changelog.js`
- `CHANGELOG.md` only if content structure must be clarified.
- `tests/commands/changelog.test.js`
- `tests/commands/cli-contract.test.js`

## Validations Required

- `node --test tests/commands/changelog.test.js`
- `node --test tests/commands/cli-contract.test.js`
- `git diff --check`

## Risks

- Overpromising migration details not present in local content.
- Network access by accident.

## Dependencies

- Depends on `slice-00-loop-closure-foundation`.

## Instructions For Executor

1. Use local files only.
2. Keep output stable enough for docs.
3. Do not change migrate behavior beyond guidance/help.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Local changelog surface works and is documented.
