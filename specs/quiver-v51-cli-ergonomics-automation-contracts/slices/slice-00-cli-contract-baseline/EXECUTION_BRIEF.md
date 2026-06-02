# EXECUTION_BRIEF - slice-00 CLI contract baseline

## Context

Several CLI findings from the audit are already implemented in the current branch. This slice prevents duplicate work.

## Objective

Validate current CLI capabilities and classify v51 findings before implementation.

## Scope

- Current command/help/JSON behavior.
- Finding classification.
- Planning artifacts only.

## Acceptance Criteria

- A `Finding | Current state | Action` table exists.
- Implemented findings are mapped to evidence/test/docs only.
- Missing/partial findings are mapped to later slices.
- Runtime code is unchanged.

## Expected Files To Modify

- `specs/quiver-v51-cli-ergonomics-automation-contracts/SPEC.md`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/STATUS.md`
- `specs/quiver-v51-cli-ergonomics-automation-contracts/EVIDENCE_REPORT.md`

## Validations Required

- `git diff --check`
- `node bin/create-quiver.js spec validate specs/quiver-v51-cli-ergonomics-automation-contracts`

## Risks

- Reimplementing stable CLI behavior.
- Missing a current contract that later slices break.

## Dependencies

- None.

## Instructions For Executor

1. Run representative commands and capture behavior.
2. Classify each v51 finding.
3. Do not modify runtime code.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- v51 implementation slices have a precise CLI baseline.
