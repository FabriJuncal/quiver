# EXECUTION BRIEF - slice-08: Controlled slice execution and evidence

## Context

Executors should be cheap and focused. They need only the slice context, clear restrictions, and a closure contract.

## Objective

Enable controlled slice execution with minimal context, file scope validation, closure updates, evidence, and logs.

## Scope

- Executor prompt/context generation.
- Prompt-only and execution modes.
- Worktree and clean-tree checks.
- File scope validation.
- Closure/evidence/command-log updates.
- Secret redaction.

## Acceptance Criteria

- Context excludes unrelated files by default.
- Prompt-only mode works.
- Dirty or wrong worktree blocks execution.
- Out-of-scope writes are detected.
- Closure and evidence are updated.

## Technical Plan Summary

Use execution-plan output and agent adapters to prepare focused executor handoffs and validate results before a slice can close.

## Suggested Execution Steps

1. Define executor context pack contract.
2. Add prompt-only slice command.
3. Add preflight checks.
4. Add file scope diff validation.
5. Add closure/evidence updates.
6. Test manual and delegated paths with fixtures.

## Restrictions

- Do not auto-commit in this slice unless already required by existing command behavior.
- Do not open PRs.

## Risks

- File scope validation can miss generated files if path rules are too strict. Report clearly and allow explicit review.

## Completion Checklist

- [ ] Context pack tested.
- [ ] Preflight tested.
- [ ] Scope validation tested.
- [ ] Closure/evidence updated.
- [ ] Evidence appended.
