# EXECUTION_BRIEF - slice-04 parser adapter incremental migration

## Context

This slice performs the parser migration behind an adapter after the strategy decision.

## Objective

Migrate parser behavior incrementally behind an adapter while preserving golden contracts.

## Scope

- Selected parser strategy from slice-03.
- Parser adapter.
- Command registry.
- Golden test preservation.
- Package changes if dependency is selected.

## Acceptance Criteria

- Golden parser tests pass.
- Existing command tests pass.
- Package-installed smoke passes.
- No public invocation is intentionally broken.

## Expected Files To Modify

- `src/create-quiver/index.js`
- `src/create-quiver/lib/cli/parser.js`
- `src/create-quiver/lib/cli/command-registry.js`
- `package.json`
- `package-lock.json`
- `tests/commands/parser-contract.test.js`
- `tests/commands/cli-contract.test.js`

## Validations Required

- `node --test tests/commands/parser-contract.test.js`
- `node --test tests/commands/cli-contract.test.js`
- `node --test`
- `git diff --check`

## Risks

- Central dispatch regression.
- Dependency/package-lock changes.
- i18n parser error drift.

## Dependencies

- Depends on `slice-03-parser-library-decision`.

## Instructions For Executor

1. Keep old behavior available until parity is proven.
2. Migrate incrementally.
3. Run golden tests after each parser group.
4. Do not remove aliases.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Parser adapter is live and compatible.
