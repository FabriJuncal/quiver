# EXECUTION_BRIEF - slice-06 Workflow surface integration

## Context

After approval selection and review-decision data exist, other workflow surfaces must consume the same source of truth to prevent contradictory next steps.

## Objective

Integrate shared approval candidates into `ai approvals`, `flow`, `ai status`, `ai resume`, and `spec create --interactive`.

## Scope

- `src/create-quiver/commands/ai.js`
- `src/create-quiver/commands/flow.js`
- `src/create-quiver/commands/spec.js`
- `src/create-quiver/lib/ai/run-state.js`
- focused tests

## Acceptance Criteria

- `ai approvals` and `ai approve` recommend the same current version.
- `flow` points to safe next steps consistent with candidates.
- `ai status` and `ai resume` do not contradict approval guidance.
- `spec create --interactive` shows reviewed and approved technical-plan input clearly.
- Read-only outputs remain prompt-free.

## Technical Plan Summary

Replace duplicated next-command decisions with the shared candidate model where approval phases are involved.

## Suggested Steps

1. Update approval status output.
2. Update flow decision points.
3. Update run-state next-command guidance.
4. Update spec create interactive summary.
5. Add drift-prevention tests.

## Restrictions

- Do not prompt from read-only commands.
- Do not change spec generation semantics.

## Risks

- Existing snapshot-style output tests may need precise updates.

## Completion Checklist

- [ ] `ai approvals` integrated.
- [ ] `flow` integrated.
- [ ] `ai status/resume` integrated.
- [ ] `spec create --interactive` integrated.
