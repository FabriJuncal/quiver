# EXECUTION_BRIEF - slice-03 write-command feedback and safety

## Context

This slice hardens commands that can write or prepare writes and must prove dry-run safety.

## Objective

Make write-capable commands safer and more explicit about planned and applied changes.

## Scope

- `init`, `analyze`, `doctor`, `prepare`, and `migrate`.
- Dry-run no-write assertions.
- Applied-change summaries.
- Idempotency or documented non-applicability.
- Failure cleanup where feasible.

## Acceptance Criteria

- Dry-run paths do not write project files.
- `doctor --fix --dry-run` reports fixes without applying them.
- `init`, `analyze`, and `migrate` summarize planned/applied changes.
- `migrate` warns before writes and points to dry-run.
- Idempotency tests exist or non-applicability is explicit.

## Expected Files To Modify

- `src/create-quiver/index.js`
- `src/create-quiver/commands/prepare.js`
- `src/create-quiver/lib/init-layout.js`
- `src/create-quiver/lib/init-docs.js`
- `src/create-quiver/lib/doctor.js`
- `tests/commands/init-profiles.test.js`
- `tests/commands/analyze.test.js`
- `tests/commands/doctor.test.js`
- `tests/commands/prepare.test.js`

## Validations Required

- Focused tests for changed commands.
- Filesystem before/after assertions in temp dirs.
- `git diff --check`

## Risks

- Accidentally writing during dry-run.
- Over-reporting noisy output.
- Changing migration behavior beyond safety messaging.

## Dependencies

- Depends on `slice-00-cli-surface-baseline-and-delta`.
- Depends on `slice-01-i18n-command-error-hardening`.

## Instructions For Executor

1. Implement from baseline gaps only.
2. Add no-write tests before modifying write flows.
3. Keep output localized.
4. Do not extract command modules in this slice.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Safety behavior is covered by tests.
- Output is clear and localized.
- No migration semantics changed unintentionally.
