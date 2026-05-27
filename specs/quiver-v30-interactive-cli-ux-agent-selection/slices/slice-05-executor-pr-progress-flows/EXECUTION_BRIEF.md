# EXECUTION_BRIEF - slice-05 Executor, execution-plan, and PR progress flows

## Context

Execution and PR commands are sensitive because they can modify files, create commits, create worktrees, and open PRs. Their UX must show progress without hiding scope or validation failures.

## Objective

Apply the UX/progress/profile-selector contract to executor and PR flows.

## Scope

- `ai execute-slice`
- `ai execute-plan`
- relevant `ai prompt-slice` output constraints
- `ai pr`
- Executor/spec/slice/strategy selectors in interactive mode
- Progress stages and machine-output fallback

## Acceptance Criteria

- Executor display name appears in execution headings.
- Spec/slice selectors use stable values and dependency-aware recommendations.
- Blocked slices are not silently selected.
- PR creation shows preflight and creation progress.
- `gh` errors remain visible and actionable.
- Machine output remains clean.

## Plan tecnico resumido

Adopt the shared runtime in execution and PR commands while preserving existing safety gates, scope validation, one-commit-per-slice behavior, and dry-run-first patterns.

## Suggested Steps

1. Define real stages for execution and PR commands.
2. Add spec/slice/executor selection points behind `--interactive`.
3. Wrap provider and gh execution with progress lifecycle.
4. Preserve validation and scope gates.
5. Add focused tests for human and no-TTY output.

## Restrictions

- Do not weaken write-scope validation.
- Do not bypass existing PR open-slice blockers.
- Do not add provider execution to prompt-only commands.

## Risks

- `commands/ai.js` conflicts with planner-flow adoption.
- PR progress can obscure `gh` auth errors if not surfaced cleanly.

## Completion Checklist

- [ ] Execution command progress validated.
- [ ] PR progress validated.
- [ ] Selector dependencies validated.
- [ ] Machine output cleanliness validated.
