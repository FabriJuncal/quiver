# Execution Plan - Quiver v25

## Wave 0 - Required Foundation

1. `slice-00-spec-foundation`
   - Must land first.
   - Publishes the spec, slices, handoffs, execution plan, PR body, and source-of-truth planning references.

## Wave 1 - Command and State Foundations

Run sequentially:

1. `slice-01-cli-contract-compatibility`
2. `slice-02-run-state-phase-locks`

These are foundational and should not run in parallel because later work depends on command names, aliases, phase validation, and persistent state.

## Wave 2 - Onboarding and Agent Contracts

Can run in parallel after Wave 1 if file scopes do not overlap:

1. `slice-03-safe-ai-onboarding-docs`
2. `slice-04-agent-profiles-adapters`

## Wave 3 - Planner Gates and Generation

Run sequentially:

1. `slice-05-approval-gates`
2. `slice-06-spec-slice-generator`
3. `slice-07-slice-execution-planner`

These depend on approved phase state and generated artifact contracts.

## Wave 4 - Execution Lifecycle

Run sequentially:

1. `slice-08-controlled-slice-execution`
2. `slice-09-git-worktree-pr-lifecycle`

The Git/PR lifecycle depends on reliable slice closure and evidence.

## Wave 5 - Hardening and Outputs

Can run in parallel after Wave 4 if write scopes stay separate:

1. `slice-10-validation-errors-fixtures`
2. `slice-11-export-dashboard-migration`

## Parallel Safety Notes

- Do not run two slices in parallel if both modify CLI routing or shared command utilities.
- Do not execute slices in parallel if `allowed_write_paths` overlap.
- `slice-00` must be committed before implementation slices.
- Prefer one commit per slice.
- Run focused tests for touched commands during each slice.
- Run full smoke/package safety only in final hardening unless package behavior changes earlier.
