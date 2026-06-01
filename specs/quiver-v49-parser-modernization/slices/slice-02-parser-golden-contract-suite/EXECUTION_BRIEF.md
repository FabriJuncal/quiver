# EXECUTION_BRIEF - slice-02 parser golden contract suite

## Context

This slice captures parser behavior before any migration or library decision is implemented.

## Objective

Capture current parser behavior before modernization.

## Scope

- Golden tests for global flags.
- Command-scoped flag rejection/acceptance.
- Aliases.
- Missing values and unknown flags.
- Positional errors.
- `--` separator behavior.

## Acceptance Criteria

- Golden tests pass against current parser.
- Tests cover all registry-critical behavior.
- No runtime code is modified.

## Expected Files To Modify

- `tests/commands/parser-contract.test.js`
- `tests/commands/cli-contract.test.js`
- `specs/quiver-v49-parser-modernization/**`

## Validations Required

- `node --test tests/commands/parser-contract.test.js`
- `node --test tests/commands/cli-contract.test.js`
- `git diff --check`

## Risks

- Incomplete golden coverage.
- Tests coupling to unstable prose instead of contract fields.

## Dependencies

- Depends on `slice-01-command-flag-registry-inventory`.

## Instructions For Executor

1. Use registry as checklist.
2. Use `spawnSync` for exit/stdout/stderr assertions.
3. Do not modify parser implementation.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Parser behavior is protected for migration.
