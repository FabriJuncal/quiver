# EXECUTION_BRIEF - slice-03 AI alias deprecations

## Context

This slice makes duplicate AI command aliases explicit and automation-safe.

## Objective

Make duplicate AI aliases explicit and safe.

## Scope

- `approval-status` as alias of `approvals`.
- `executor-prompt` as alias of `prompt-slice`.
- Deprecation warnings.
- Help/docs/tests.

## Acceptance Criteria

- Canonical commands work.
- Aliases work.
- Deprecation warnings are stderr-only and human-only.
- Output contracts remain stable.

## Expected Files To Modify

- `src/create-quiver/index.js`
- `src/create-quiver/commands/ai.js`
- `tests/commands/ai-dispatch-contract.test.js`
- Focused AI command tests.

## Validations Required

- `node --test tests/commands/ai-dispatch-contract.test.js`
- Focused AI tests
- `git diff --check`

## Risks

- Warning output breaking consumers.
- Confusing canonical and alias help text.

## Dependencies

- Depends on `slice-01-ai-dispatch-contract-baseline`.

## Instructions For Executor

1. Centralize alias warning behavior.
2. Keep implementation paths shared.
3. Add stdout/stderr tests.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- Aliases are safe, documented, and tested.
