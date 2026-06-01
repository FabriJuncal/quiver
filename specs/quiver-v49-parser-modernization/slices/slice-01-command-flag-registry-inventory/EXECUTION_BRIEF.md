# EXECUTION_BRIEF - slice-01 command flag registry inventory

## Context

This slice creates the command/flag inventory that later parser work must preserve.

## Objective

Create a complete command/flag ownership inventory before parser changes.

## Scope

- Public commands and aliases.
- Global flags.
- Command-scoped flags.
- Positional arguments and `--` behavior.
- Documentation artifact only.

## Acceptance Criteria

- Every public command has an entry.
- Every public flag has an owner.
- Aliases and deprecated forms are listed.
- Source evidence is referenced.

## Expected Files To Modify

- `specs/quiver-v49-parser-modernization/command-flag-registry.md`
- `specs/quiver-v49-parser-modernization/SPEC.md`
- `specs/quiver-v49-parser-modernization/EVIDENCE_REPORT.md`

## Validations Required

- `git diff --check`
- `node bin/create-quiver.js spec validate specs/quiver-v49-parser-modernization`

## Risks

- Missing command-scoped flags.
- Treating global help as source of ownership without checking parser behavior.

## Dependencies

- Depends on `slice-00-parser-modernization-foundation`.

## Instructions For Executor

1. Use `parseArgs`, help output, docs, and tests as sources.
2. Mark ambiguous ownership explicitly.
3. Do not implement parser changes.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Registry is complete enough to drive golden tests.
