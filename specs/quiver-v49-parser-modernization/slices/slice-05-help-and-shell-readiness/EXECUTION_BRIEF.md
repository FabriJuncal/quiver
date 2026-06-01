# EXECUTION_BRIEF - slice-05 help and shell readiness

## Context

This slice improves help scoping after parser migration is stable.

## Objective

Improve help scoping and document shell-readiness accurately after parser migration.

## Scope

- Command-scoped help.
- Global help annotations.
- Docs for shell completion/readiness if supported.
- Help contract tests.

## Acceptance Criteria

- Help does not misrepresent command-scoped flags.
- Shell readiness is documented accurately.
- Help tests pass.
- Parser golden tests remain stable.

## Expected Files To Modify

- `src/create-quiver/index.js`
- `src/create-quiver/lib/cli/parser.js`
- `src/create-quiver/lib/cli/command-registry.js`
- `docs/reference/commands.md`
- `tests/commands/cli-contract.test.js`
- `tests/commands/parser-contract.test.js`

## Validations Required

- `node --test tests/commands/cli-contract.test.js`
- `node --test tests/commands/parser-contract.test.js`
- `git diff --check`

## Risks

- Help docs claiming unsupported shell completion.
- Drift between registry and help text.

## Dependencies

- Depends on `slice-04-parser-adapter-incremental-migration`.

## Instructions For Executor

1. Use command registry as source of truth.
2. Prefer command-scoped help.
3. If global help lists scoped flags, annotate ownership.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Help surface is accurate and tested.
