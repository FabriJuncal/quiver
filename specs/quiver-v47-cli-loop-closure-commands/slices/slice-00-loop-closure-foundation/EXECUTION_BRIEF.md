# EXECUTION_BRIEF - slice-00 loop closure foundation

## Context

This slice starts v47 and defines loop-closure command contracts before runtime work.

## Objective

Define v47 command contracts and implementation boundaries before runtime work.

## Scope

- Clarify `status`, `evidence list/show`, `changelog`, `demo spec-viewer`, and config decision.
- Document v46 dependencies.
- Update only v47 planning artifacts.

## Acceptance Criteria

- Command contracts are explicit.
- v46 overlap is documented.
- No runtime code is modified.

## Expected Files To Modify

- `specs/quiver-v47-cli-loop-closure-commands/SPEC.md`
- `specs/quiver-v47-cli-loop-closure-commands/STATUS.md`
- `specs/quiver-v47-cli-loop-closure-commands/EVIDENCE_REPORT.md`

## Validations Required

- `git diff --check`
- `node bin/create-quiver.js spec validate specs/quiver-v47-cli-loop-closure-commands`

## Risks

- Defining commands that duplicate v46 compatibility work.
- Leaving config behavior ambiguous.

## Dependencies

- None, but implementation should observe v46 compatibility policy if v46 lands first.

## Instructions For Executor

1. Refine the command contracts without changing code.
2. Keep open decisions explicit.
3. Update closure evidence.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- v47 execution slices have clear contracts.
- Spec validation passes.
