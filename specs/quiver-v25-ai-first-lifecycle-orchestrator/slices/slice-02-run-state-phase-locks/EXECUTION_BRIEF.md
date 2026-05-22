# EXECUTION BRIEF - slice-02: Run state, phase gates, and locks

## Context

The lifecycle must survive interruptions, multiple agents, and multiple terminal sessions. Chat memory is not a safe state store.

## Objective

Add persistent run state, phase validation, approvals metadata, status/resume, and locks.

## Scope

- `.quiver/runs/<run-id>/state.json`.
- `.quiver/runs/<run-id>/approvals.json`.
- Run status and resume commands or command paths.
- Phase transition validation.
- Run/slice locks and stale-lock recovery.

## Acceptance Criteria

- Run state persists and can be resumed.
- Future-phase commands are blocked.
- Locks prevent concurrent mutation.
- Stale locks are recoverable with metadata.

## Technical Plan Summary

Create state helpers and phase transition guards before adding higher-level planner or executor flows.

## Suggested Execution Steps

1. Define state schema and phase enum.
2. Add read/write helpers.
3. Add phase guard utility.
4. Add lock helpers.
5. Wire status/resume commands.
6. Test phase and lock behavior with temp fixtures.

## Restrictions

- Do not execute provider CLIs.
- Do not generate specs in this slice.

## Risks

- State schema drift can break future runs. Keep it versioned or migration-ready.

## Completion Checklist

- [ ] State helpers implemented.
- [ ] Phase guards implemented.
- [ ] Locks implemented.
- [ ] Tests passing.
- [ ] Evidence appended.
