# EXECUTION_BRIEF - slice-02 read-only UX quick wins

## Context

This slice completes low-risk read-only CLI gaps after baseline and i18n work.

## Objective

Complete missing low-risk UX improvements for read-only commands after baseline verification.

## Scope

- `flow`, `dashboard`, `plan`, `graph`, `next`, and `evidence` help.
- Human output improvements only where slice-00 says behavior is missing or partial.
- JSON stability tests where relevant.

## Acceptance Criteria

- No read-only command writes files or changes project state.
- Already-present behavior is covered by tests, not reimplemented.
- Missing read-only quick wins are implemented with focused coverage.
- JSON output remains parseable.

## Expected Files To Modify

- `src/create-quiver/commands/flow.js`
- `src/create-quiver/commands/dashboard.js`
- `src/create-quiver/lib/dashboard.js`
- `src/create-quiver/commands/plan.js`
- `src/create-quiver/commands/graph.js`
- `src/create-quiver/commands/next.js`
- `src/create-quiver/commands/evidence.js`
- `src/create-quiver/index.js`
- `tests/commands/**`

## Validations Required

- Focused command tests for each changed read-only command.
- `git diff --check`

## Risks

- Duplicating already implemented behavior.
- Breaking JSON consumers.
- Changing command output beyond approved quick wins.

## Dependencies

- Depends on `slice-00-cli-surface-baseline-and-delta`.
- Depends on `slice-01-i18n-command-error-hardening`.

## Instructions For Executor

1. Start from baseline matrix assignments.
2. Prefer adding tests around present behavior before changing output.
3. Keep new messages in the i18n catalog.
4. Do not implement v47 commands here.

## Completion Checklist

- [ ] Acceptance criteria satisfied.
- [ ] Required validations run or blockers documented.
- [ ] Closure brief updated.

## Conditions Of Closure

- All assigned read-only gaps are closed.
- Tests prove no writes and JSON stability.
