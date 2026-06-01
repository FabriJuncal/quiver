# EXECUTION_BRIEF - slice-05 config contract decision

## Context

This documentation slice resolves config-surface ambiguity before runtime simplification.

## Objective

Document the future `config` command contract before any runtime simplification.

## Scope

- Decision record inside v47 spec/docs.
- Compatibility and migration expectations.
- No runtime code changes.

## Acceptance Criteria

- Decision is explicit.
- Compatibility expectations are documented.
- Runtime behavior is unchanged.

## Expected Files To Modify

- `specs/quiver-v47-cli-loop-closure-commands/SPEC.md`
- `docs/reference/commands.md`
- `docs/CLI_UX_GUIDE.md`

## Validations Required

- `git diff --check`
- `node bin/create-quiver.js spec validate specs/quiver-v47-cli-loop-closure-commands`

## Risks

- Accidentally changing config behavior.
- Creating ambiguity for future command aliases.

## Dependencies

- Depends on `slice-00-loop-closure-foundation`.

## Instructions For Executor

1. Compare current `config language` behavior to proposed alternatives.
2. Decide and document, do not implement runtime changes.
3. Include compatibility policy.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Config contract decision is recorded.
