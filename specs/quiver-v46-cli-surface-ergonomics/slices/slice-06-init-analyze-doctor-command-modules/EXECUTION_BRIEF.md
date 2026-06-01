# EXECUTION_BRIEF - slice-06 init/analyze/doctor command modules

## Context

This slice is a pure refactor and must preserve behavior locked by earlier tests.

## Objective

Extract `init`, `analyze`, and `doctor` command orchestration from `index.js` into command modules without behavior drift.

## Scope

- `src/create-quiver/commands/init.js`
- `src/create-quiver/commands/analyze.js`
- `src/create-quiver/commands/doctor.js`
- Delegation wiring in `index.js`
- Golden/focused tests proving behavior stability.

## Acceptance Criteria

- Tests pass before and after extraction.
- `index.js` delegates to command modules.
- Public behavior, outputs, exit codes, and filesystem behavior remain unchanged.
- Existing exports are preserved or updated with tests.

## Expected Files To Modify

- `src/create-quiver/index.js`
- `src/create-quiver/commands/init.js`
- `src/create-quiver/commands/analyze.js`
- `src/create-quiver/commands/doctor.js`
- `tests/commands/init-profiles.test.js`
- `tests/commands/analyze.test.js`
- `tests/commands/doctor.test.js`
- `tests/commands/cli-contract.test.js`

## Validations Required

- `node --test tests/commands/init-profiles.test.js`
- `node --test tests/commands/analyze.test.js`
- `node --test tests/commands/doctor.test.js`
- `node --test tests/commands/cli-contract.test.js`
- `git diff --check`

## Risks

- Hidden behavior drift during extraction.
- Breaking exports used by tests.
- Mixing behavior changes into a refactor.

## Dependencies

- Depends on `slice-00-cli-surface-baseline-and-delta`.
- Depends on `slice-03-write-command-feedback-safety`.

## Instructions For Executor

1. Confirm tests are green before extraction.
2. Move code in small steps.
3. Keep import/export compatibility explicit.
4. Do not improve behavior in this slice; move such work back to earlier slices.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Module extraction complete.
- Behavior drift tests pass.
- `index.js` responsibility is reduced.
